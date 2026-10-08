/* ==========================================================================
   GLITCHBOX — HOSTNET
   --------------------------------------------------------------------------
   Lets a game that was written for its own Node WebSocket server run on the
   GitHub Pages arcade, where there is no server: the HOST player's browser
   runs the game's real server code, and everyone talks through the arcade's
   room relay (the Cloudflare Worker's /ws?room=CODE, the same one Gridlock and
   Imposter use).

       const ws = GBHostNet.socket({
         server: () => buildServerSomehow(),   // → { setCode, open, message, close }
         isCreate: m => m.t === 'create',      // this message makes you the host
         joinCode: m => m.t === 'join' && m.code,  // this one joins someone's room
         error: text => ({ t:'error', msg:text }), // how the game shows an error
       });

   `ws` behaves like a WebSocket (readyState, send, onopen/onmessage/onclose), so
   a game's client code barely changes. GBHostNet.loadServer(url, slices, glue)
   pulls the server's own source file and runs the parts that don't need Node.

   On the wire (all relay messages are broadcast, so they carry an address):
     guest → host   { gb:1, from:<peer>, m:<game msg> }   also { gb:1, from, hb:1 } every 4s
     host  → guest  { gb:1, to:<peer>|[peers], ms:<raw game msg> }   also { gb:1, hb:1 } every 4s
   A side that goes quiet for 15s counts as gone (the relay's "left" doesn't say who).
   ========================================================================== */
(function () {
  'use strict';
  const RELAY = () => window.GLITCHBOX_WS || 'wss://glitchbox-api.levtheduck.workers.dev/ws';
  const HB_MS = 4000, GONE_MS = 15000;
  const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const code4 = () => Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');
  const peerId = () => Math.random().toString(36).slice(2, 10);

  // Fetch a server source file and run the browser-safe slices of it. `slices` is a
  // list of [startMarker, endMarker] pairs (end exclusive); `glue` is appended in the
  // same scope and must `return` the { setCode, open, message, close } object;
  // `prelude` runs first (stand-ins for Node objects the slices expect).
  async function loadServer(url, slices, glue, prelude) {
    const src = await (await fetch(url, { cache: 'no-store' })).text();
    const body = slices.map(([a, b]) => {
      const i = src.indexOf(a), j = b ? src.indexOf(b, i) : src.length;
      if (i < 0 || j < 0) throw new Error('hostnet: could not find "' + (i < 0 ? a : b) + '" in ' + url);
      return src.slice(i, j);
    }).join('\n');
    return new Function((prelude || '') + '\n' + body + '\n' + glue)();
  }

  function socket(opts) {
    const me = peerId();
    const fake = { readyState: 0, onopen: null, onmessage: null, onclose: null, onerror: null, code: null, role: null };
    let mode = 'idle', relay = null, server = null, localSrvWs = null, peers = {}, lastHost = 0, timers = [], closed = false, joined = false;
    // Both styles of WebSocket listener: ws.onmessage = … and ws.addEventListener('message', …)
    const listeners = { open: [], message: [], close: [], error: [] };
    fake.addEventListener = (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); };
    fake.removeEventListener = (t, fn) => { listeners[t] = (listeners[t] || []).filter(f => f !== fn); };
    function emit(type, ev) {
      if (fake['on' + type]) try { fake['on' + type](ev); } catch (e) { console.error(e); }
      (listeners[type] || []).slice().forEach(fn => { try { fn(ev); } catch (e) { console.error(e); } });
    }
    const toClientRaw = str => { if (!closed) emit('message', { data: str }); };
    const toClient = obj => toClientRaw(JSON.stringify(obj));
    const relaySend = obj => { if (relay && relay.readyState === 1) relay.send(JSON.stringify(obj)); };
    function shutdown(why) {
      if (closed) return;
      closed = true; fake.readyState = 3;
      timers.forEach(clearInterval);
      try { relay && relay.close(); } catch (e) {}
      emit('close', { reason: why || '' });
    }
    // The thing a game server calls .send() on — one per player. Strings stay strings.
    function serverWs(deliver) { return { readyState: 1, send: str => deliver(typeof str === 'string' ? str : JSON.stringify(str)), close() {} }; }

    // Host → guests. Everything sent in one turn of the event loop is batched, and a
    // message going to several players (a world snapshot) goes out once, addressed to
    // all of them. Snapshots the game marks with opts.thin() are capped at opts.remoteHz.
    let outQ = [], outScheduled = false, lastThin = 0;
    function queueOut(id, str) {
      outQ.push([id, str]);
      if (!outScheduled) { outScheduled = true; Promise.resolve().then(flushOut); }
    }
    function flushOut() {
      outScheduled = false;
      const groups = new Map();
      outQ.forEach(([id, str]) => { const g = groups.get(str); if (g) g.push(id); else groups.set(str, [id]); });
      outQ = [];
      const now = Date.now();
      let thinSent = false;
      groups.forEach((ids, str) => {
        if (opts.thin && opts.thin(str)) {
          if (now - lastThin < 1000 / (opts.remoteHz || 20)) return;
          thinSent = true;
        }
        relaySend({ gb: 1, to: ids.length === 1 ? ids[0] : ids, ms: str });
      });
      if (thinSent) lastThin = now;
    }

    function openRelay(code, role, onReady) {
      relay = new WebSocket(RELAY() + '?room=' + encodeURIComponent(code) + '&role=' + role);
      relay.onopen = () => relaySend(role === 'host' ? { t: 'create', code, max: opts.max || 16 } : { t: 'join' });
      relay.onmessage = ev => {
        let d; try { d = JSON.parse(ev.data); } catch (e) { return; }
        if (d.t === 'created' || d.t === 'joined') { joined = true; if (onReady) { onReady(); onReady = null; } return; }
        if (d.t === 'error') {
          toClient(opts.error(d.msg === 'No game with that code.' ? 'No room with that code.' : (d.msg || 'Couldn’t reach that room.')));
          if (mode === 'guest') backToIdle();       // a typo in the code shouldn't end the session
          return;
        }
        if (!d.gb) return;
        if (mode === 'host') fromGuest(d); else fromHost(d);
      };
      const mine = relay;
      relay.onclose = () => { if (relay === mine && mode === 'guest' && joined) shutdown('host gone'); };
    }

    // ── host side ──
    async function becomeHost(first) {
      mode = 'host'; fake.role = 'host';
      try { server = await opts.server(); }
      catch (e) { console.error(e); toClient(opts.error('This game couldn’t start its server.')); return; }
      fake.code = code4();
      server.setCode(fake.code);
      localSrvWs = serverWs(toClientRaw);
      server.open(localSrvWs);
      server.message(localSrvWs, first);
      openRelay(fake.code, 'host');
      if (opts.onCode) opts.onCode(fake.code, 'host');
      timers.push(setInterval(() => {
        relaySend({ gb: 1, hb: 1 });
        const now = Date.now();
        Object.keys(peers).forEach(id => { if (now - peers[id].seen > GONE_MS) dropPeer(id); });
      }, HB_MS));
    }
    function fromGuest(d) {
      if (!d.from) return;
      let p = peers[d.from];
      if (!p) {
        if (d.bye) return;
        const id = d.from;
        p = peers[id] = { seen: Date.now(), ws: serverWs(str => queueOut(id, str)) };
        server.open(p.ws);
      }
      p.seen = Date.now();
      if (d.bye) return dropPeer(d.from);
      if (d.m) server.message(p.ws, d.m);
    }
    function dropPeer(id) {
      const p = peers[id];
      if (!p) return;
      delete peers[id];
      p.ws.readyState = 3;
      try { server.close(p.ws); } catch (e) { console.error(e); }
    }

    function backToIdle() {
      timers.forEach(clearInterval); timers = [];
      const r = relay; relay = null; mode = 'idle'; fake.role = null; fake.code = null; joined = false;
      try { r && r.close(); } catch (e) {}
    }

    // ── guest side ──
    // Rapid-fire messages the game marks with opts.coalesce() (held-key input) are
    // merged: only the newest goes out, at most every opts.coalesceMs.
    let pendingCo = null, coTimer = null;
    function guestSend(m) {
      if (opts.coalesce && opts.coalesce(m)) {
        pendingCo = m;
        if (!coTimer) coTimer = setTimeout(() => { coTimer = null; if (pendingCo) relaySend({ gb: 1, from: me, m: pendingCo }); pendingCo = null; }, opts.coalesceMs || 66);
        return;
      }
      relaySend({ gb: 1, from: me, m });
    }
    function becomeGuest(code, first) {
      mode = 'guest'; fake.role = 'guest'; fake.code = code;
      lastHost = Date.now();
      openRelay(code, 'guest', () => { relaySend({ gb: 1, from: me, m: first }); if (opts.onCode) opts.onCode(code, 'guest'); });
      timers.push(setInterval(() => {
        relaySend({ gb: 1, from: me, hb: 1 });
        if (joined && Date.now() - lastHost > GONE_MS) shutdown('host gone');
      }, HB_MS));
      addEventListener('pagehide', () => relaySend({ gb: 1, from: me, bye: 1 }));
    }
    function fromHost(d) {
      if (d.from) return;                 // another guest's message, not for us
      lastHost = Date.now();
      const forMe = d.to === me || (Array.isArray(d.to) && d.to.indexOf(me) !== -1);
      if (!forMe) return;
      if (typeof d.ms === 'string') toClientRaw(d.ms); else if (d.m) toClient(d.m);
    }

    fake.send = str => {
      let m; try { m = JSON.parse(str); } catch (e) { return; }
      if (mode === 'host') return server && server.message(localSrvWs, m);
      if (mode === 'guest') {
        const c = opts.joinCode(m);
        if (c && String(c).toUpperCase() !== fake.code) { backToIdle(); return fake.send(str); }   // trying another code
        return guestSend(m);
      }
      if (opts.isCreate(m)) return becomeHost(m);
      const code = opts.joinCode(m);
      if (code) return becomeGuest(String(code).toUpperCase().replace(/[^A-Z0-9]/g, ''), m);
      // anything else before create/join has nowhere to go yet
    };
    fake.close = () => { relaySend({ gb: 1, from: me, bye: 1 }); shutdown('closed'); };
    setTimeout(() => { fake.readyState = 1; emit('open', {}); }, 0);
    return fake;
  }

  window.GBHostNet = { socket, loadServer };
})();
