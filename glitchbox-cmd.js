/* ==========================================================================
   GLITCHBOX — OWNER COMMAND LINE
   --------------------------------------------------------------------------
   A drop-down console for the one account that owns the arcade. Opens with the
   ` (backtick) key, or Ctrl+Shift+K. Type `help` for the command list.

   Who can use it
   --------------
   The console only builds itself once /api/me comes back with isOwner — the
   same server verdict the ⚙ Owner Console uses. Two honest caveats:

   • Server commands (players, ban, delete, reports…) are genuinely protected.
     /api/admin/* re-checks the owner on every single request, so a forged
     client gets a 403 no matter what it renders.
   • Local commands (tokens, unlock, wipe) only rewrite THIS browser's
     localStorage. Hiding them behind the owner check is convenience, not
     security — any player could already edit their own localStorage by hand.
     Nothing here leaks onto the server or another player's device.

   Lives in its own file so it can be dropped or reloaded without touching the
   hub or the older click-driven console in glitchbox-admin.js.

   #cmdsmoke runs the self-tests headlessly (result in document.title).
   ========================================================================== */
(function () {
  'use strict';

  const SMOKE = location.hash.indexOf('cmdsmoke') !== -1;

  let built = false, shown = false, isOwner = false;
  let hist = [], histIdx = 0, pending = null;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const $ = id => document.getElementById(id);
  const ownerNow = () => (typeof lastState !== 'undefined' && lastState && !!lastState.isOwner);
  const hasTokens = () => typeof tokens === 'function' && typeof setTokens === 'function';
  const tokKeys = () => (typeof TOK !== 'undefined' && TOK) ? TOK : {
    bal:'glitchbox.tokens', own:'glitchbox.owned', icons:'glitchbox.icons',
    seen:'glitchbox.seen', ts:'glitchbox.playts', daily:'glitchbox.daily',
    streak:'glitchbox.streak', queue:'glitchbox.queue', fpaid:'glitchbox.fpaid' };

  async function call(path, opts) {
    if (typeof window.api === 'function') return window.api(path, opts);
    const base = window.GLITCHBOX_API || '';
    const headers = { 'Authorization': 'Bearer ' + (localStorage.getItem('glitchbox_session') || '') };
    let body;
    if (opts && opts.body) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opts.body); }
    const r = await fetch(base + path, { method: (opts && opts.method) || 'GET', headers, body });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(data.error || ('HTTP ' + r.status)); e.status = r.status; throw e; }
    return data;
  }

  // ── output ─────────────────────────────────────────────────────────────────
  const OUT = [];                       // kept even when the DOM isn't built (tests)
  function say(text, cls) {
    OUT.push({ text: String(text == null ? '' : text), cls: cls || '' });
    if (OUT.length > 400) OUT.shift();
    const log = $('gbc-log');
    if (!log) return;
    const div = document.createElement('div');
    div.className = 'gbc-line' + (cls ? ' ' + cls : '');
    div.innerHTML = esc(text) || '&nbsp;';
    log.appendChild(div);
    log.scrollTop = 1e6;
  }
  const ok   = t => say(t, 'ok');
  const bad  = t => say(t, 'bad');
  const warn = t => say(t, 'warn');
  const head = t => say(t, 'head');

  // ── helpers ────────────────────────────────────────────────────────────────
  // Quote-aware so reasons can be one argument: ban dave "spawn camping"
  function parse(line) {
    const out = [], re = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let m;
    while ((m = re.exec(line))) out.push(m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]);
    return out;
  }
  function gameList() { return (typeof GAMES !== 'undefined' && GAMES) ? GAMES : []; }
  const gid = g => g.file.replace('.html', '');
  // Exact id, then exact name, then a substring on either — so `play grid` works.
  function findGame(q) {
    const s = String(q || '').toLowerCase().replace(/\.html$/, '');
    if (!s) return null;
    const L = gameList();
    return L.find(g => gid(g).toLowerCase() === s)
        || L.find(g => (g.name || '').toLowerCase() === s)
        || L.find(g => gid(g).toLowerCase().indexOf(s) !== -1)
        || L.find(g => (g.name || '').toLowerCase().indexOf(s) !== -1)
        || null;
  }
  function repaint() {
    if (typeof paintTokens === 'function') paintTokens();
    if (typeof renderGames === 'function') renderGames();
    if (typeof renderIconPicker === 'function') renderIconPicker();
  }
  function ago(ts) {
    if (!ts) return '—';
    const s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 90) return 'just now';
    if (s < 3600) return Math.round(s / 60) + 'm ago';
    if (s < 86400) return Math.round(s / 3600) + 'h ago';
    return Math.round(s / 86400) + 'd ago';
  }
  function pad(s, n) { s = String(s); return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length); }

  // One player from a loose query. Prints the candidates and returns null when
  // the query is ambiguous — never guesses at a target for a ban or a delete.
  async function pickPlayer(q) {
    if (!q) { bad('name somebody — a name, email or friend code'); return null; }
    const list = (await call('/api/admin/players?q=' + encodeURIComponent(q))).players || [];
    if (!list.length) { bad('no player matches "' + q + '"'); return null; }
    const lq = String(q).toLowerCase();
    const exact = list.find(p => (p.code || '').toLowerCase() === lq)
               || list.find(p => (p.email || '').toLowerCase() === lq)
               || list.find(p => (p.name || '').toLowerCase() === lq);
    if (exact) return exact;
    if (list.length === 1) return list[0];
    warn(list.length + ' players match "' + q + '" — be more specific:');
    list.slice(0, 12).forEach(p => say('   ' + pad(p.name, 18) + ' ' + pad(p.email, 28) + ' ' + (p.code || '—')));
    return null;
  }

  // One guest from a loose query: their name ("Guest 1A2B" or one you gave them),
  // the last 4 of their id, or the whole id. Same never-guess rule as pickPlayer.
  async function pickGuest(q) {
    if (!q) { bad('name a guest — e.g. 1A2B, "Guest 1A2B", or a name you gave them'); return null; }
    const list = (await call('/api/admin/guests')).guests || [];
    const lq = String(q).toLowerCase().replace(/^guest\s+/, '');
    const hits = list.filter(g => g.gid.toLowerCase() === lq || g.gid.slice(-4).toLowerCase() === lq ||
      (g.name || '').toLowerCase() === String(q).toLowerCase() || (g.name || '').toLowerCase().indexOf(lq) !== -1);
    if (!hits.length) { bad('no guest matches "' + q + '" — try  guests'); return null; }
    if (hits.length > 1) {
      warn(hits.length + ' guests match "' + q + '" — be more specific:');
      hits.slice(0, 12).forEach(g => say('   ' + pad(g.name, 18) + ' ' + pad(g.ip || '?', 18) + ' seen ' + ago(g.last_seen)));
      return null;
    }
    return hits[0];
  }
  // "u:<sub>" for a player, "g:<gid>" for a guest — players first, then guests.
  async function pickAnyone(q) {
    if (!/^guest\b/i.test(q) && ((await call('/api/admin/players?q=' + encodeURIComponent(q))).players || []).length) {
      const p = await pickPlayer(q); return p ? { target:'u:' + p.sub, name:p.name } : null;
    }
    const g = await pickGuest(q); return g ? { target:'g:' + g.gid, name:g.name } : null;
  }

  // Typo help. A prefix filter alone misses the common case — one wrong letter
  // in the middle — so this ranks by edit distance and keeps the closest few.
  function editDistance(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i), cur = new Array(n + 1);
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++)
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      const swap = prev; prev = cur; cur = swap;
    }
    return prev[n];
  }
  function nearest(name) {
    const budget = Math.max(1, Math.min(3, Math.ceil(name.length / 2)));
    return Object.keys(CMDS)
      .map(k => ({ k, d: editDistance(name, k) }))
      .filter(x => x.d <= budget || x.k.indexOf(name) === 0)
      .sort((a, b) => a.d - b.d)
      .slice(0, 4)
      .map(x => x.k);
  }

  function askConfirm(what, run) {
    pending = { what, run };
    warn('⚠ ' + what);
    warn('   type  confirm  to go ahead — anything else cancels');
  }

  // ── commands ───────────────────────────────────────────────────────────────
  // One registry drives execution, `help` and tab-completion, so they can't drift.
  const CMDS = {
    help: { usage:'help [command]', about:'list the commands, or explain one', run(a) {
      if (a[0]) {
        const c = CMDS[a[0].toLowerCase()];
        if (!c) { bad('no command called "' + a[0] + '"'); return; }
        head(c.usage); say('   ' + c.about + (c.owner ? '   (server · owner only)' : '   (this device only)'));
        return;
      }
      // An alias points at the same object as its canonical command; listing by
      // usage keeps `jump` from showing up as a second, identical `play` line.
      const canon = k => CMDS[k].usage.split(' ')[0] === k;
      head('// SERVER — owner-checked on every request');
      Object.keys(CMDS).filter(k => canon(k) && CMDS[k].owner).forEach(k => say('  ' + pad(CMDS[k].usage, 26) + CMDS[k].about));
      head('// THIS DEVICE — local storage only');
      Object.keys(CMDS).filter(k => canon(k) && !CMDS[k].owner).forEach(k => say('  ' + pad(CMDS[k].usage, 26) + CMDS[k].about));
      const aliases = Object.keys(CMDS).filter(k => !canon(k));
      if (aliases.length) say('  ' + pad('aliases', 26) + aliases.map(k => k + ' → ' + CMDS[k].usage.split(' ')[0]).join(', '));
      say('');
      say('  ` or Ctrl+Shift+K toggles this console · Esc closes · ↑/↓ history · Tab completes');
    }},

    whoami: { usage:'whoami', about:'who this browser is signed in as', run() {
      const u = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : null;
      if (!u) { bad('not signed in'); return; }
      head('// ' + (u.name || '?'));
      say('  email    ' + (u.email || '—'));
      say('  sub      ' + String(u.sub || '—').slice(0, 28) + '…');
      say('  owner    ' + (ownerNow() ? 'yes — the server says so' : 'no'));
      if (hasTokens()) {
        const owned = (() => { try { return (JSON.parse(localStorage.getItem(tokKeys().own)) || []).length; } catch (e) { return 0; } })();
        const ics = (() => { try { return (JSON.parse(localStorage.getItem(tokKeys().icons)) || []).length; } catch (e) { return 0; } })();
        say('  tokens   ' + tokens() + '   ·   ' + owned + ' games unlocked   ·   ' + ics + ' icons');
      }
    }},

    tokens: { usage:'tokens [n|+n|-n]', about:'show or set this device\'s balance', run(a) {
      if (!hasTokens()) { bad('this build has no token economy'); return; }
      if (!a.length) { ok('balance: ' + tokens()); return; }
      const raw = String(a[0]), n = parseInt(raw, 10);
      if (isNaN(n)) { bad('tokens wants a number, like  tokens 9999  or  tokens +500'); return; }
      const next = /^[+-]/.test(raw) ? tokens() + n : n;
      setTokens(next); repaint();
      ok('balance: ' + tokens());
    }},

    unlock: { usage:'unlock [games|icons|all]', about:'unlock everything on this device', run(a) {
      const what = (a[0] || 'all').toLowerCase(), K = tokKeys();
      if (['games','icons','all'].indexOf(what) === -1) { bad('unlock games, icons or all'); return; }
      if (what !== 'icons') {
        const files = gameList().map(g => g.file);
        localStorage.setItem(K.own, JSON.stringify(files));
        ok(files.length + ' games unlocked');
      }
      if (what !== 'games') {
        const ids = (typeof ICON_BY_ID !== 'undefined' && ICON_BY_ID) ? Object.keys(ICON_BY_ID) : [];
        localStorage.setItem(K.icons, JSON.stringify(ids));
        ok(ids.length + ' icons unlocked');
      }
      repaint();
    }},

    lock: { usage:'lock [games|icons|all]', about:'put the unlocks back (tokens untouched)', run(a) {
      const what = (a[0] || 'all').toLowerCase(), K = tokKeys();
      if (['games','icons','all'].indexOf(what) === -1) { bad('lock games, icons or all'); return; }
      if (what !== 'icons') { localStorage.removeItem(K.own); ok('games relocked'); }
      if (what !== 'games') { localStorage.removeItem(K.icons); ok('icons relocked'); }
      repaint();
    }},

    games: { usage:'games [filter]', about:'list game ids (what play/jump accept)', run(a) {
      const f = (a[0] || '').toLowerCase();
      let L = gameList();
      if (f) L = L.filter(g => gid(g).toLowerCase().indexOf(f) !== -1 || (g.name || '').toLowerCase().indexOf(f) !== -1);
      if (!L.length) { bad('nothing matches "' + f + '"'); return; }
      head('// ' + L.length + ' games');
      L.forEach(g => say('  ' + pad(gid(g), 26) + (g.name || '') + (g.price ? '   [' + g.price + ' tokens]' : '')));
    }},

    play: { usage:'play <game>', about:'launch a game by id or name', run(a) {
      const g = findGame(a.join(' '));
      if (!g) { bad('no game matches "' + a.join(' ') + '" — try  games'); return; }
      ok('launching ' + (g.name || gid(g)) + '…');
      if (!SMOKE) location.href = g.file;
    }},

    reset: { usage:'reset', about:'clear tokens, unlocks, streak and play history', run() {
      askConfirm('Reset the whole economy on this device?', () => {
        if (typeof resetEconomy === 'function') resetEconomy();
        else { const K = tokKeys(); Object.keys(K).forEach(k => localStorage.removeItem(K[k])); }
        repaint();
        ok('economy reset — balance 0');
      });
    }},

    wipe: { usage:'wipe', about:'clear ALL glitchbox data here, sign-in included', run() {
      askConfirm('Erase every glitchbox.* key on this device and sign out?', () => {
        Object.keys(localStorage).filter(k => k.indexOf('glitchbox') === 0).forEach(k => localStorage.removeItem(k));
        ok('device cleared — reloading');
        if (!SMOKE) setTimeout(() => location.reload(), 500);
      });
    }},

    session: { usage:'session', about:'decode the stored session token (no signature)', run() {
      try {
        const t = localStorage.getItem('glitchbox_session') || '';
        if (!t) { bad('no session stored'); return; }
        const p = JSON.parse(atob(t.split('.')[0].replace(/-/g, '+').replace(/_/g, '/')));
        head('// SESSION'); say('  ' + JSON.stringify(p));
      } catch (e) { bad('session token unreadable'); }
    }},

    sync: { usage:'sync', about:'re-fetch /api/me right now', async run() {
      if (typeof refreshState !== 'function') { bad('the hub has no refreshState()'); return; }
      await refreshState();
      ok('state refreshed · owner: ' + (ownerNow() ? 'yes' : 'no'));
    }},

    clear: { usage:'clear', about:'clear this console', run() {
      OUT.length = 0;
      const log = $('gbc-log'); if (log) log.innerHTML = '';
    }},

    exit: { usage:'exit', about:'close the console', run() { close(); } },

    // ── server side ──
    players: { usage:'players [query]', about:'list or search players', owner:true, async run(a) {
      const q = a.join(' ');
      const list = (await call('/api/admin/players?q=' + encodeURIComponent(q))).players || [];
      if (!list.length) { bad(q ? 'nobody matches "' + q + '"' : 'no players yet'); return; }
      head('// ' + list.length + ' player' + (list.length === 1 ? '' : 's'));
      list.forEach(p => say('  ' + (p.banned ? '⛔ ' : '   ') + pad(p.name, 18) + pad(p.email, 28) +
        pad(p.code || '—', 8) + 'seen ' + ago(p.last_seen), p.banned ? 'warn' : ''));
    }},

    who: { usage:'who <query>', about:'everything about one player', owner:true, async run(a) {
      const p = await pickPlayer(a.join(' '));
      if (!p) return;
      head('// ' + p.name + (p.banned ? '   ⛔ BANNED' : ''));
      say('  email    ' + (p.email || '—'));
      say('  code     ' + (p.code || '—'));
      say('  sub      ' + String(p.sub).slice(0, 28) + '…');
      say('  joined   ' + ago(p.created) + '     last seen ' + ago(p.last_seen));
      say('  friends  ' + p.friends + '     saves ' + p.saves + '     reports ' + p.reports);
      if (p.ban_reason) say('  reason   "' + p.ban_reason + '"');
    }},

    ban: { usage:'ban <query> [reason]', about:'ban a player, killing their invites', owner:true, async run(a) {
      const p = await pickPlayer(a[0]);
      if (!p) return;
      const reason = a.slice(1).join(' ');
      await call('/api/admin/ban', { method:'POST', body:{ sub:p.sub, banned:true, reason } });
      ok('banned ' + p.name + (reason ? ' — "' + reason + '"' : ''));
    }},

    unban: { usage:'unban <query>', about:'lift a ban', owner:true, async run(a) {
      const p = await pickPlayer(a.join(' '));
      if (!p) return;
      await call('/api/admin/ban', { method:'POST', body:{ sub:p.sub, banned:false } });
      ok('unbanned ' + p.name);
    }},

    'delete': { usage:'delete <query>', about:'erase an account, saves and all', owner:true, async run(a) {
      const p = await pickPlayer(a.join(' '));
      if (!p) return;
      askConfirm('Delete ' + p.name + ' (' + p.email + ') permanently? Friendships, invites and cloud saves go too.',
        async () => {
          await call('/api/admin/delete', { method:'POST', body:{ sub:p.sub } });
          ok('deleted ' + p.name);
        });
    }},

    give: { usage:'give <player|everyone> [tokens] [<n> energy] [games|icons|all] [<game>…]',
            about:'send tokens, Idle Universe energy or unlocks to a player', owner:true, async run(a) {
      if (a.length < 2) { bad('usage: give <player|everyone> [tokens] [<n> energy] [games|icons|all] [<game>…]   e.g. give dave 5b energy'); return; }
      const paidIcons = () => (typeof ICON_SETS !== 'undefined' && typeof ICON_PRICE !== 'undefined')
        ? ICON_SETS.filter(s => ICON_PRICE[s.cat]).reduce((l, s) => l.concat(s.icons.map(i => i.id)), []) : [];
      const body = { tokens: 0, games: [], icons: [] };
      const paidGames = () => gameList().filter(g => g.price).map(g => g.file);
      // "5b energy", "energy 5b", or any amount with a suffix/exponent (2.5m, 1e15) is energy.
      const amt = w => { const m = /^([0-9]*\.?[0-9]+(?:e[+-]?[0-9]+)?)(k|m|b|t|qa|qi)?$/i.exec(String(w || '').replace(/,/g, ''));
        const n = m ? parseFloat(m[1]) * ({ k:1e3, m:1e6, b:1e9, t:1e12, qa:1e15, qi:1e18 }[(m[2] || '').toLowerCase()] || 1) : 0;
        return n > 0 && n <= 1e300 ? n : 0; };
      let energy = 0, lastNum = null;
      const words = a.slice(1);
      for (let i = 0; i < words.length; i++) {
        const w = words[i], lw = w.toLowerCase();
        if (lw === 'energy' || lw === '⚡') {
          if (amt(words[i + 1])) { energy += amt(words[++i]); }
          else if (lastNum !== null) { body.tokens -= lastNum; energy += lastNum; lastNum = null; }
          else if (i > 0 && amt(words[i - 1])) { /* "5b energy": already counted */ }
          else { bad('how much energy? e.g. give dave 5b energy'); return; }
          continue;
        }
        lastNum = null;
        if (/^[+-]?\d+$/.test(w)) { body.tokens += parseInt(w, 10); lastNum = parseInt(w, 10); }
        else if (amt(w)) energy += amt(w);
        else if (lw === 'games') body.games = body.games.concat(paidGames());
        else if (lw === 'icons') body.icons = paidIcons();
        else if (lw === 'all') { body.games = body.games.concat(paidGames()); body.icons = paidIcons(); }
        else {
          const g = findGame(w);
          if (!g) { bad('no game matches "' + w + '"'); return; }
          body.games.push(g.file);
        }
      }
      body.games = [...new Set(body.games)];
      const summary = [body.tokens ? body.tokens + ' tokens' : '', body.games.length ? body.games.length + ' game(s)' : '',
                       body.icons.length ? body.icons.length + ' icon(s)' : '', energy ? '⚡ ' + energy.toLocaleString('en-US') + ' energy' : '']
                       .filter(Boolean).join(', ');
      if (!summary) { bad('nothing to give'); return; }
      const stuff = body.tokens || body.games.length || body.icons.length;
      const deliver = async target => {
        const r = stuff ? await call('/api/admin/gift', { method:'POST', body: Object.assign({ sub: target === '*' ? '*' : target.slice(2) }, body) }) : null;
        const e = energy ? await call('/api/admin/game-gift', { method:'POST', body:{ target, game:'idle-universe.html', amount: energy } }) : null;
        return r ? r.players : e ? e.sent : 0;
      };
      const who = a[0].toLowerCase();
      if (who === 'everyone' || who === 'all' || who === '*') {
        askConfirm('Give ' + summary + ' to every player' + (energy ? ' (energy goes to guests too)' : '') + '?', async () => {
          const n = await deliver('*');
          ok('gift queued for ' + n + ' players: ' + summary);
        });
        return;
      }
      const p = await pickPlayer(a[0]);
      if (!p) return;
      await deliver('u:' + p.sub);
      ok('gift queued for ' + p.name + ': ' + summary + (energy ? ' — energy lands next time they\'re in Idle Universe' : ' — lands on their next check-in'));
    }},

    msg: { usage:'msg <player> <message>', about:'pop a message up on a player\'s screen', owner:true, async run(a) {
      const text = a.slice(1).join(' ').trim();
      if (!text) { bad('usage: msg <player> <message>'); return; }
      const p = await pickPlayer(a[0]);
      if (!p) return;
      await call('/api/admin/gift', { method:'POST', body:{ sub:p.sub, note:text } });
      ok('✉ sent to ' + p.name);
    }},

    announce: { usage:'announce <text> | announce off', about:'banner across every hub', owner:true, async run(a) {
      const text = a.join(' ').trim();
      if (!text) {
        const h = await call('/api/admin/overview');
        say(h.announce ? '📣 “' + h.announce.text + '”' : 'no announcement up');
        return;
      }
      if (text.toLowerCase() === 'off') { await call('/api/admin/announce', { method:'POST', body:{ text:'' } }); ok('announcement taken down'); return; }
      await call('/api/admin/announce', { method:'POST', body:{ text, tone:'info' } });
      ok('📣 announcement is live');
    }},

    maint: { usage:'maint on [message] | maint off', about:'close / reopen the arcade', owner:true, async run(a) {
      const w = (a[0] || '').toLowerCase();
      if (w === 'off') { await call('/api/admin/maintenance', { method:'POST', body:{ on:false } }); ok('arcade reopened'); return; }
      if (w !== 'on') { bad('maint on [message]  or  maint off'); return; }
      const text = a.slice(1).join(' ');
      askConfirm('Close the arcade to everyone but you?', async () => {
        await call('/api/admin/maintenance', { method:'POST', body:{ on:true, text } });
        ok('🛠 arcade closed');
      });
    }},

    log: { usage:'log', about:'recent owner actions', owner:true, async run() {
      const rows = (await call('/api/admin/log')).log || [];
      if (!rows.length) { say('nothing logged yet'); return; }
      head('// LOG');
      rows.slice(0, 25).forEach(r => say('  ' + pad(ago(r.at), 10) + pad(r.action, 16) + (r.target || '') + (r.detail ? '  ' + r.detail : '')));
    }},

    reports: { usage:'reports', about:'open player reports', owner:true, async run() {
      const list = (await call('/api/admin/reports')).reports || [];
      if (!list.length) { ok('no reports — quiet arcade'); return; }
      head('// ' + list.length + ' report' + (list.length === 1 ? '' : 's'));
      list.forEach(r => {
        say('  #' + pad(r.id, 5) + pad(r.reported || '(deleted)', 18) + 'by ' + pad(r.reporter || '(deleted)', 18) + ago(r.created),
          r.banned ? 'warn' : '');
        if (r.reason) say('        "' + r.reason + '"');
      });
      say('  dismiss <id> to clear one');
    }},

    guests: { usage:'guests', about:'guests seen in the last 30 days', owner:true, async run() {
      const r = await call('/api/admin/guests'), list = r.guests || [];
      head('// ' + list.length + ' guest' + (list.length === 1 ? '' : 's') + (r.guestsLocked ? '   🚫 guest play is OFF' : ''));
      list.slice(0, 40).forEach(g => say('  ' + (g.banned ? '⛔ ' : g.online ? '● ' : '  ') + pad(g.name, 18) + pad(g.ip || '?', 18) +
        (g.online ? (g.playing ? '▶ ' + g.playing.replace('.html', '') : 'in the hub') : 'seen ' + ago(g.last_seen)) +
        (g.sameAsYou ? '  (your network)' : ''), g.banned ? 'warn' : ''));
      if ((r.ipBans || []).length) { head('// NETWORK BANS'); r.ipBans.forEach(b => say('  🌐 ' + pad(b.ip, 18) + (b.reason || ''))); }
    }},

    kick: { usage:'kick <player|guest|everyone> [reason]', about:'send someone back to the hub (not a ban)', owner:true, async run(a) {
      if (!a[0]) { bad('usage: kick <player|guest|everyone> [reason]'); return; }
      const reason = a.slice(1).join(' ');
      if (/^(everyone|all|\*)$/i.test(a[0])) {
        askConfirm('Kick everyone who is online?', async () => {
          const r = await call('/api/admin/kick', { method:'POST', body:{ target:'*', reason } });
          ok('👢 kicked ' + r.kicked);
        });
        return;
      }
      const who = await pickAnyone(a[0]);
      if (!who) return;
      await call('/api/admin/kick', { method:'POST', body:{ target:who.target, reason } });
      ok('👢 kicked ' + who.name + ' — lands within a few seconds');
    }},

    popup: { usage:'popup <player|guest|everyone> <message>', about:'pop a message up right now, even mid-game', owner:true, async run(a) {
      const text = a.slice(1).join(' ').trim();
      if (!text) { bad('usage: popup <player|guest|everyone> <message>'); return; }
      const all = /^(everyone|all|\*)$/i.test(a[0]);
      const who = all ? { target:'*', name:'everyone online' } : await pickAnyone(a[0]);
      if (!who) return;
      const r = await call('/api/admin/popup', { method:'POST', body:{ target:who.target, text } });
      ok('✉ sent to ' + (all ? r.sent + ' online' : who.name));
    }},

    energy: { usage:'energy <player|guest|everyone> <amount>', about:'gift Idle Universe energy (1m, 5b, 1e15…)', owner:true, async run(a) {
      const m = /^\s*([0-9]*\.?[0-9]+(?:e[+-]?[0-9]+)?)\s*(k|m|b|t|qa|qi)?\s*$/i.exec(String(a[a.length - 1] || '').replace(/,/g, ''));
      const n = m ? parseFloat(m[1]) * ({ k:1e3, m:1e6, b:1e9, t:1e12, qa:1e15, qi:1e18 }[(m[2] || '').toLowerCase()] || 1) : 0;
      if (a.length < 2 || !(n > 0 && n <= 1e300)) { bad('usage: energy <player|guest|everyone> <amount>   e.g. energy dave 5b'); return; }
      const name = a.slice(0, -1).join(' ');
      const all = /^(everyone|all|\*)$/i.test(name);
      const who = all ? { target:'*', name:'everyone' } : await pickAnyone(name);
      if (!who) return;
      const r = await call('/api/admin/game-gift', { method:'POST', body:{ target:who.target, game:'idle-universe.html', amount:n } });
      ok('⚡ sent ' + a[a.length - 1] + ' energy to ' + (all ? r.sent + ' players and guests' : who.name) + ' — lands next time they\'re in Idle Universe');
    }},

    gban: { usage:'gban <guest> [net] [reason]', about:'ban a guest (add  net  to ban their network too)', owner:true, async run(a) {
      const g = await pickGuest(a[0]);
      if (!g) return;
      const net = (a[1] || '').toLowerCase() === 'net';
      const reason = a.slice(net ? 2 : 1).join(' ');
      if (net && g.sameAsYou) { bad(g.name + ' is on your own network — ban the device only'); return; }
      await call('/api/admin/guest-ban', { method:'POST', body:{ gid:g.gid, banned:true, reason, ip:net } });
      ok('banned ' + g.name + (net ? ' + network ' + g.ip : '') + (reason ? ' — "' + reason + '"' : ''));
    }},

    gunban: { usage:'gunban <guest>', about:'lift a guest ban', owner:true, async run(a) {
      const g = await pickGuest(a.join(' '));
      if (!g) return;
      await call('/api/admin/guest-ban', { method:'POST', body:{ gid:g.gid, banned:false } });
      ok('unbanned ' + g.name);
    }},

    ipban: { usage:'ipban <ip> [reason] | ipban off <ip>', about:'ban or unban a whole network', owner:true, async run(a) {
      if ((a[0] || '').toLowerCase() === 'off') {
        if (!a[1]) { bad('ipban off <ip>'); return; }
        await call('/api/admin/ip-ban', { method:'POST', body:{ ip:a[1], banned:false } });
        ok('🌐 ' + a[1] + ' unbanned'); return;
      }
      if (!a[0]) { bad('usage: ipban <ip> [reason]'); return; }
      const reason = a.slice(1).join(' ');
      askConfirm('Ban the network ' + a[0] + '? Everyone on it is locked out (except you).', async () => {
        await call('/api/admin/ip-ban', { method:'POST', body:{ ip:a[0], banned:true, reason } });
        ok('🌐 ' + a[0] + ' banned');
      });
    }},

    guestplay: { usage:'guestplay on|off', about:'let people play without signing in, or not', owner:true, async run(a) {
      const w = (a[0] || '').toLowerCase();
      if (w !== 'on' && w !== 'off') {
        const r = await call('/api/admin/guests');
        say('guest play is ' + (r.guestsLocked ? 'OFF' : 'ON')); return;
      }
      await call('/api/admin/guests-lock', { method:'POST', body:{ on: w === 'off' } });
      ok(w === 'off' ? '🚫 guest play is off — guests must sign in' : '✅ guests can play again');
    }},

    gameoff: { usage:'gameoff <game>', about:'switch a game off for everyone but you', owner:true, async run(a) {
      const g = findGame(a.join(' '));
      if (!g) { bad('no game matches "' + a.join(' ') + '"'); return; }
      const cur = (await call('/api/admin/overview')).disabled || [];
      await call('/api/admin/games', { method:'POST', body:{ disabled: cur.concat([g.file]) } });
      ok('⏸ ' + g.name + ' is switched off');
    }},

    gameon: { usage:'gameon <game|all>', about:'switch a game back on', owner:true, async run(a) {
      const q = a.join(' ');
      const cur = (await call('/api/admin/overview')).disabled || [];
      if (/^all$/i.test(q)) { await call('/api/admin/games', { method:'POST', body:{ disabled: [] } }); ok('every game is on'); return; }
      const g = findGame(q);
      if (!g) { bad('no game matches "' + q + '"'); return; }
      await call('/api/admin/games', { method:'POST', body:{ disabled: cur.filter(x => x !== g.file) } });
      ok('▶ ' + g.name + ' is back on');
    }},

    reloadall: { usage:'reloadall', about:'make every open page reload (push an update)', owner:true, async run() {
      askConfirm('Reload every open GLITCHBOX page? Anyone mid-game loses unsaved progress.', async () => {
        await call('/api/admin/reload-all', { method:'POST', body:{} });
        ok('↻ every open page reloads within a few seconds');
      });
    }},

    appeals: { usage:'appeals', about:'ban appeals waiting for an answer', owner:true, async run() {
      const list = (await call('/api/admin/appeals')).appeals || [];
      const open = list.filter(x => x.status === 'open');
      if (!open.length) { ok('no appeals waiting'); return; }
      head('// ' + open.length + ' appeal' + (open.length === 1 ? '' : 's') + ' waiting');
      open.forEach(x => { say('  #' + pad(x.id, 5) + pad(x.name, 20) + pad(x.kind, 8) + ago(x.created)); say('        "' + x.text + '"'); });
      say('  appeal <id> yes|no [reply]');
    }},

    appeal: { usage:'appeal <id> yes|no [reply]', about:'answer a ban appeal (yes unbans them)', owner:true, async run(a) {
      const w = (a[1] || '').toLowerCase();
      if (!a[0] || (w !== 'yes' && w !== 'no')) { bad('usage: appeal <id> yes|no [reply]'); return; }
      const r = await call('/api/admin/appeal-decide', { method:'POST', body:{ id: +a[0], accept: w === 'yes', reply: a.slice(2).join(' ') } });
      ok(w === 'yes' ? '✅ appeal #' + a[0] + ' accepted — unbanned' + (r.note || '') : '⚖ appeal #' + a[0] + ' turned down');
    }},

    mod: { usage:'mod <player> [off]', about:'make a player a moderator (or stop)', owner:true, async run(a) {
      const off = (a[a.length - 1] || '').toLowerCase() === 'off';
      const p = await pickPlayer((off ? a.slice(0, -1) : a).join(' '));
      if (!p) return;
      await call('/api/admin/set-mod', { method:'POST', body:{ sub:p.sub, on:!off } });
      ok(off ? p.name + ' is no longer a moderator' : '⭐ ' + p.name + ' is a moderator');
    }},

    feature: { usage:'feature <game|off>', about:'pick the big featured banner game', owner:true, async run(a) {
      const q = a.join(' ');
      if (!q || /^(off|default|none)$/i.test(q)) { await call('/api/admin/featured', { method:'POST', body:{ file:'' } }); ok('featured: Pixel War (default)'); return; }
      const g = findGame(q);
      if (!g) { bad('no game matches "' + q + '"'); return; }
      await call('/api/admin/featured', { method:'POST', body:{ file:g.file } });
      if (typeof applyFeatured === 'function') applyFeatured(g.file);
      ok('🌟 featured: ' + g.name);
    }},

    stats: { usage:'stats', about:'arcade totals and the last 30 days', owner:true, async run() {
      const o = await call('/api/admin/overview'), c = o.counts || {};
      head('// ARCADE');
      Object.keys(c).forEach(k => say('  ' + pad(k, 14) + c[k]));
      try {
        const st = await call('/api/admin/stats?tz=' + new Date().getTimezoneOffset());
        head('// LAST 30 DAYS');
        say('  players       ' + st.totals.players + '     guests ' + st.totals.guests + '     hours played ' + st.totals.hours);
        st.games.slice(0, 5).forEach(g => say('  ' + pad(g.game.replace('.html', ''), 18) + g.minutes + ' min'));
      } catch (e) { /* owner-only; older servers lack it */ }
      if (o.recent && o.recent.length) {
        head('// NEWEST');
        o.recent.slice(0, 8).forEach(u => say('  ' + pad(u.name, 20) + 'joined ' + ago(u.created)));
      }
    }},

    dismiss: { usage:'dismiss <id>', about:'clear one report', owner:true, async run(a) {
      if (!a[0]) { bad('which report? try  reports'); return; }
      await call('/api/admin/dismiss-report', { method:'POST', body:{ id:a[0] } });
      ok('report #' + a[0] + ' dismissed');
    }},
  };
  CMDS.jump = CMDS.play;        // muscle memory from the old console's Dev tab

  // ── execution ──────────────────────────────────────────────────────────────
  async function run(line) {
    line = String(line || '').trim();
    if (!line) return;

    if (pending) {
      const p = pending; pending = null;
      if (/^(confirm|yes|y)$/i.test(line)) { try { await p.run(); } catch (e) { bad(e.message || 'failed'); } }
      else say('cancelled');
      return;
    }

    const parts = parse(line), name = (parts[0] || '').toLowerCase(), args = parts.slice(1);
    const cmd = CMDS[name];
    if (!cmd) {
      bad('no command called "' + name + '"');
      const near = nearest(name);
      if (near.length) say('did you mean: ' + near.join(', '));
      else say('type  help  for the list');
      return;
    }
    // Owner-only commands are refused here for a clean message; the server
    // refuses them again regardless of what this client believes.
    if (cmd.owner && !ownerNow()) { bad('owner only — the server has to vouch for you first'); return; }
    try { await cmd.run(args, line); }
    catch (e) {
      const m = e.message || 'that failed';
      // "Failed to fetch" is what a browser says for offline, CORS and a dead
      // Worker alike; none of those are worth showing in that shape.
      if (/failed to fetch|networkerror|load failed/i.test(m)) bad("couldn't reach the arcade server — offline, or the Worker is down");
      else if (e.status === 403) bad('the server refused that — it does not consider this account the owner');
      else bad(m);
    }
  }

  // ── shell ──────────────────────────────────────────────────────────────────
  function build() {
    if (built) return;
    built = true;
    const css = `
    .gbc-wrap { position:fixed; left:0; right:0; top:0; z-index:13000; display:none;
      flex-direction:column; height:min(46vh,420px); background:rgba(4,6,12,.96);
      border-bottom:1px solid rgba(0,245,255,.35); box-shadow:0 14px 40px rgba(0,0,0,.6),0 0 60px rgba(0,245,255,.06);
      backdrop-filter:blur(6px); font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
    .gbc-wrap.show { display:flex; }
    .gbc-bar { display:flex; align-items:center; gap:10px; padding:7px 12px;
      border-bottom:1px solid rgba(0,245,255,.16); background:linear-gradient(100deg,#12001a,#04121a); flex-shrink:0; }
    .gbc-tag { font-family:'Press Start 2P',monospace; font-size:9px; color:#ff0080; text-shadow:0 0 10px rgba(255,0,128,.6); }
    .gbc-who { font-size:11px; color:#6b7690; flex:1; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
    .gbc-x { background:transparent; border:1px solid rgba(0,245,255,.3); color:#00f5ff; width:22px; height:22px;
      cursor:pointer; font-size:12px; line-height:1; flex-shrink:0; }
    .gbc-log { flex:1; overflow-y:auto; padding:10px 14px; font-size:12px; line-height:1.55; color:#b9c4dc; }
    .gbc-line { white-space:pre-wrap; word-break:break-word; }
    .gbc-line.cmd  { color:#00f5ff; }
    .gbc-line.ok   { color:#5bf0a6; }
    .gbc-line.bad  { color:#ff5c8a; }
    .gbc-line.warn { color:#ffc24a; }
    .gbc-line.head { color:#ff0080; margin-top:8px; }
    .gbc-form { display:flex; align-items:center; gap:8px; padding:8px 14px; flex-shrink:0;
      border-top:1px solid rgba(0,245,255,.16); background:#05080f; }
    .gbc-caret { color:#ff0080; font-size:13px; }
    .gbc-in { flex:1; background:transparent; border:none; outline:none; color:#e8eefc;
      font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; }`;
    const st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    const wrap = document.createElement('div');
    wrap.className = 'gbc-wrap';
    wrap.id = 'gbc-wrap';
    wrap.innerHTML =
      '<div class="gbc-bar"><span class="gbc-tag">OWNER CMD</span>' +
        '<span class="gbc-who" id="gbc-who"></span>' +
        '<button class="gbc-x" id="gbc-x" title="Close (Esc)">✕</button></div>' +
      '<div class="gbc-log" id="gbc-log"></div>' +
      '<form class="gbc-form" id="gbc-form"><span class="gbc-caret">&gt;</span>' +
        '<input class="gbc-in" id="gbc-in" autocomplete="off" spellcheck="false" ' +
          'placeholder="help — or start typing and hit Tab"></form>';
    document.body.appendChild(wrap);

    // Replay anything printed before the DOM existed.
    const log = $('gbc-log');
    OUT.forEach(l => {
      const d = document.createElement('div');
      d.className = 'gbc-line' + (l.cls ? ' ' + l.cls : '');
      d.innerHTML = esc(l.text) || '&nbsp;';
      log.appendChild(d);
    });

    $('gbc-x').addEventListener('click', close);
    $('gbc-form').addEventListener('submit', ev => {
      ev.preventDefault();
      const inp = $('gbc-in'), line = inp.value;
      inp.value = '';
      if (!line.trim()) return;
      say('> ' + line, 'cmd');
      hist.push(line); if (hist.length > 60) hist.shift();
      histIdx = hist.length;
      run(line);
    });
    $('gbc-in').addEventListener('keydown', ev => {
      if (ev.key === 'ArrowUp')   { ev.preventDefault(); if (histIdx > 0) $('gbc-in').value = hist[--histIdx] || ''; }
      if (ev.key === 'ArrowDown') { ev.preventDefault(); histIdx = Math.min(hist.length, histIdx + 1); $('gbc-in').value = hist[histIdx] || ''; }
      if (ev.key === 'Tab')       { ev.preventDefault(); complete(); }
    });
  }

  // Completes a command name, or a game id once the verb takes one.
  function complete() {
    const inp = $('gbc-in'), v = inp.value, parts = parse(v);
    const trailing = /\s$/.test(v);
    if (parts.length <= 1 && !trailing) {
      const hits = Object.keys(CMDS).filter(k => k.indexOf((parts[0] || '').toLowerCase()) === 0);
      if (hits.length === 1) inp.value = hits[0] + ' ';
      else if (hits.length > 1) say('   ' + hits.join('   '));
      return;
    }
    const verb = (parts[0] || '').toLowerCase();
    if (verb === 'play' || verb === 'jump' || verb === 'games') {
      const frag = (trailing ? '' : parts[parts.length - 1] || '').toLowerCase();
      const hits = gameList().map(gid).filter(id => id.toLowerCase().indexOf(frag) === 0);
      if (hits.length === 1) inp.value = verb + ' ' + hits[0] + ' ';
      else if (hits.length > 1) say('   ' + hits.slice(0, 14).join('   '));
    }
  }

  function open() {
    build();
    $('gbc-wrap').classList.add('show');
    shown = true;
    $('gbc-who').textContent = (typeof currentUser !== 'undefined' && currentUser)
      ? currentUser.name + ' · ' + currentUser.email + (ownerNow() ? ' · OWNER' : '')
      : 'not signed in';
    if (!OUT.length) {
      head('// GLITCHBOX OWNER CONSOLE');
      say('type  help  for commands. Local commands touch this device only.');
    }
    setTimeout(() => { const i = $('gbc-in'); if (i) i.focus(); }, 20);
  }
  function close() { if (built) { $('gbc-wrap').classList.remove('show'); shown = false; } }
  function toggle() { if (shown) close(); else open(); }

  // The server decides who the owner is; until /api/me says so, the console won't
  // open. A stray backtick still reveals nothing, but the deliberate Ctrl+Shift+K
  // chord says why it refused — a hotkey that does *literally* nothing reads as a
  // bug, and the first person to hit it is the owner wondering what broke.
  setInterval(() => { isOwner = ownerNow(); }, 1500);
  isOwner = ownerNow();

  // Self-contained so the console keeps working if the hub never loads.
  function refused() {
    let t = $('gbc-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'gbc-toast';
      t.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:13000;' +
        'max-width:min(460px,92vw);padding:12px 16px;background:#080b14;border:1px solid rgba(255,0,128,.45);' +
        "box-shadow:0 0 26px rgba(255,0,128,.2);font-family:'Rajdhani',sans-serif;font-weight:600;font-size:13px;" +
        'color:#e8eefc;line-height:1.45;transition:opacity .25s;';
      document.body.appendChild(t);
    }
    const st = (typeof lastState !== 'undefined' && lastState) ? lastState : null;
    const signedIn = typeof currentUser !== 'undefined' && !!currentUser;
    let why;
    if (!signedIn) {
      why = 'Sign in first — the console follows the account, not the browser.';
    } else if (!st || !st.profile) {
      // /api/me hasn't landed yet (or failed). Silently refusing here is what made
      // this look broken: the answer simply wasn't back at the moment of the keypress.
      why = 'Still talking to the server — the owner check hasn\'t come back yet. Try again in a moment.';
    } else if (!st.ownerPinned) {
      why = 'No owner is configured on the server. Set the OWNER_EMAIL secret on the Worker.';
    } else {
      // The pin compares against the server's copy of the address, which can differ
      // from the one cached in this browser — so report both when they disagree.
      const c = st.ownerCheck || {};
      const srv = c.email || '';
      const local = String((currentUser && currentUser.email) || '');
      if (c.emailMatches && !c.emailVerified)
        why = 'Your address matches the owner, but Google has it marked unverified, so the server rejects it.';
      else if (srv && local && srv.toLowerCase() !== local.toLowerCase())
        why = 'This browser thinks you are <b>' + esc(local) + '</b>, but the server has <b>' + esc(srv) +
              '</b> on your account — and the owner check uses the server\'s copy. Sign out and back in.';
      else
        why = 'Signed in as <b>' + esc(srv || local) + '</b>, which is not the address the arcade is pinned to.';
    }
    t.innerHTML = '<b style="color:#ff0080">OWNER CONSOLE LOCKED</b><br>' + why;
    t.style.opacity = '1';
    clearTimeout(window.__gbcToastT);
    window.__gbcToastT = setTimeout(() => { t.style.opacity = '0'; }, 3200);
  }

  // Caller already swallowed the event (Ctrl+Shift+K is Firefox's web console).
  function hotkey() {
    if (!ownerNow() && !shown) { refused(); return; }
    toggle();
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && shown) { close(); return; }
    const typing = e.target && (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable);
    const ours = e.target && e.target.id === 'gbc-in';
    if (e.key === '`' && (!typing || ours)) {
      // Backtick is easy to hit by accident, so a non-owner gets silence, not a hint.
      if (!ownerNow() && !shown) return;
      e.preventDefault(); toggle(); return;
    }
    if (e.ctrlKey && e.shiftKey && (e.key === 'K' || e.key === 'k')) { e.preventDefault(); hotkey(); }
  });

  window.glitchCmd = { open, close, toggle, run, CMDS, _parse: parse, _findGame: findGame, _out: OUT };

  // ── self-test (#cmdsmoke) ──────────────────────────────────────────────────
  if (SMOKE) window.addEventListener('load', () => setTimeout(async () => {
    let pass = 0, fail = 0;
    const lines = [];
    const t = (name, cond) => { if (cond) { pass++; lines.push('ok   ' + name); } else { fail++; lines.push('FAIL ' + name); } };
    const last = () => (OUT.length ? OUT[OUT.length - 1].text : '');
    const said = re => OUT.some(l => re.test(l.text));

    // a fake server, so the suite never touches the real one
    const seen = [];
    window.api = async (path, opts) => {
      seen.push({ path, body: opts && opts.body });
      if (path.indexOf('/api/admin/players') === 0) {
        const q = decodeURIComponent(path.split('q=')[1] || '').toLowerCase();
        const all = [
          { sub:'s1', name:'Dave',  email:'dave@x.com',  code:'AAAA', friends:2, saves:1, reports:0, created:Date.now(), last_seen:Date.now() },
          { sub:'s2', name:'Davina',email:'davina@x.com',code:'BBBB', friends:0, saves:0, reports:1, created:Date.now(), last_seen:Date.now(), banned:1, ban_reason:'rude' },
        ];
        return { players: all.filter(p => !q || p.name.toLowerCase().indexOf(q) !== -1 || p.email.toLowerCase().indexOf(q) !== -1 || p.code.toLowerCase() === q) };
      }
      if (path === '/api/admin/overview') return { counts:{ players:2, online:1 }, recent:[], topGames:[] };
      if (path === '/api/admin/reports')  return { reports:[{ id:7, reason:'cheating', created:Date.now(), reporter:'Dave', reported:'Davina', reported_sub:'s2' }] };
      if (path === '/api/admin/guests') return { guestsLocked:false, guests:[
        { gid:'gxxxx1a2b', name:'Guest 1A2B', ip:'1.2.3.4', online:true, last_seen:Date.now() },
        { gid:'gyyyy9z9z', name:'Sam', ip:'9.9.9.9', online:true, last_seen:Date.now(), sameAsYou:true } ], ipBans:[] };
      if (path === '/api/admin/kick') return { ok:true, kicked: opts.body.target === '*' ? 4 : 1 };
      if (path === '/api/admin/appeals') return { appeals:[{ id:5, name:'Eve', kind:'player', text:'sorry', created:Date.now(), status:'open' }] };
      if (path === '/api/admin/appeal-decide') return { ok:true, note:'' };
      if (path === '/api/admin/game-gift') return { ok:true, sent: opts.body.target === '*' ? 4 : 1 };
      if (path === '/api/admin/popup') return { ok:true, sent: opts.body.target === '*' ? 4 : 1 };
      return { ok:true };
    };

    // ── parsing ──
    t('bare words split into arguments', parse('ban dave rude').length === 3);
    t('a quoted reason stays one argument', parse('ban dave "spawn camping"')[2] === 'spawn camping');
    t('extra whitespace collapses', parse('  help   tokens ').length === 2);

    // ── the registry ──
    t('every command has a usage line', Object.keys(CMDS).every(k => CMDS[k].usage));
    t('every command explains itself', Object.keys(CMDS).every(k => CMDS[k].about));
    t('every command is runnable', Object.keys(CMDS).every(k => typeof CMDS[k].run === 'function'));
    t('jump is an alias of play', CMDS.jump === CMDS.play);

    // ── owner gating ──
    lastState.isOwner = false;
    await run('players');
    t('a non-owner is refused a server command', /owner only/.test(last()));
    await run('tokens');
    t('but local commands still work', !/owner only/.test(last()));
    lastState.isOwner = true;
    await run('stats');
    t('the owner gets the server command', said(/ARCADE/));

    // ── unknown input ──
    await run('bnn dave');
    t('an unknown command says so', said(/no command called "bnn"/));
    t('and suggests the near miss', said(/did you mean: ban/));

    // ── tokens ──
    if (hasTokens()) {
      setTokens(100);
      await run('tokens +50');  t('tokens +n adds', tokens() === 150);
      await run('tokens -20');  t('tokens -n subtracts', tokens() === 130);
      await run('tokens 7');    t('a bare number sets', tokens() === 7);
      await run('tokens nope'); t('rubbish is refused', tokens() === 7 && /wants a number/.test(last()));
    }

    // ── unlocks ──
    await run('unlock games');
    const owned = JSON.parse(localStorage.getItem(tokKeys().own) || '[]');
    t('unlock games unlocks every game', owned.length === gameList().length && owned.length > 0);
    await run('lock games');
    t('lock games puts them back', !localStorage.getItem(tokKeys().own));

    // ── game lookup ──
    t('an exact id matches', findGame('gridlock') && findGame('gridlock').file === 'gridlock.html');
    t('a partial id matches', findGame('grid') && findGame('grid').file === 'gridlock.html');
    t('a display name matches', !!findGame('Seven Liars'));
    t('a .html suffix is tolerated', findGame('gridlock.html') && findGame('gridlock.html').file === 'gridlock.html');
    t('nonsense matches nothing', findGame('zzzznope') === null);

    // ── picking a player ──
    await run('who dav');            // matches Dave and Davina, is neither
    t('an ambiguous name refuses to guess', said(/2 players match/));
    await run('who dave@x.com');
    t('an exact email resolves', said(/dave@x\.com/));
    await run('who AAAA');
    t('a friend code resolves', OUT.some(l => /^\/\/ Dave/.test(l.text)));
    await run('who nobodyhere');
    t('an unknown player is reported', said(/no player matches/));

    // ── destructive commands need a confirmation ──
    seen.length = 0;
    await run('delete dave@x.com');
    t('delete asks first', said(/type  confirm/));
    t('and sends nothing yet', !seen.some(s => s.path === '/api/admin/delete'));
    await run('nope');
    t('anything else cancels', said(/cancelled/) && !seen.some(s => s.path === '/api/admin/delete'));
    await run('delete dave@x.com');
    await run('confirm');
    t('confirm goes through', seen.some(s => s.path === '/api/admin/delete' && s.body.sub === 's1'));

    // ── ban carries its reason ──
    seen.length = 0;
    await run('ban dave@x.com "spawn camping"');
    const ban = seen.find(s => s.path === '/api/admin/ban');
    t('ban targets the right account', ban && ban.body.sub === 's1' && ban.body.banned === true);
    t('ban keeps the quoted reason whole', ban && ban.body.reason === 'spawn camping');
    seen.length = 0;
    await run('unban davina@x.com');
    const unban = seen.find(s => s.path === '/api/admin/ban');
    t('unban clears the flag', unban && unban.body.banned === false);

    // ── gifts ──
    seen.length = 0;
    await run('give dave@x.com 500');
    const gift = seen.find(s => s.path === '/api/admin/gift');
    t('give sends tokens to the right account', gift && gift.body.sub === 's1' && gift.body.tokens === 500);
    seen.length = 0;
    await run('give dave@x.com -50 gridlock');
    const g2 = seen.find(s => s.path === '/api/admin/gift');
    t('give takes negatives and names a game', g2 && g2.body.tokens === -50 && g2.body.games[0] === 'gridlock.html');
    seen.length = 0;
    await run('give dave@x.com zzzznope');
    t('give refuses an unknown game', said(/no game matches "zzzznope"/) && !seen.some(s => s.path === '/api/admin/gift'));
    await run('give everyone 100');
    t('giving everyone asks first', said(/every player/) && !seen.some(s => s.path === '/api/admin/gift'));
    await run('confirm');
    const g3 = seen.find(s => s.path === '/api/admin/gift');
    t('and then goes to everyone', g3 && g3.body.sub === '*' && g3.body.tokens === 100);

    // ── guests, kicks and switches ──
    seen.length = 0;
    await run('kick dave@x.com lagging');
    const k1 = seen.find(s => s.path === '/api/admin/kick');
    t('kick targets a player', k1 && k1.body.target === 'u:s1' && k1.body.reason === 'lagging');
    seen.length = 0;
    await run('kick 1A2B');
    const k2 = seen.find(s => s.path === '/api/admin/kick');
    t('kick finds a guest by their 4 letters', k2 && k2.body.target === 'g:gxxxx1a2b');
    seen.length = 0;
    await run('kick everyone');
    t('kick everyone asks first', said(/Kick everyone/) && !seen.some(s => s.path === '/api/admin/kick'));
    await run('confirm');
    t('then kicks *', seen.some(s => s.path === '/api/admin/kick' && s.body.target === '*'));
    seen.length = 0;
    await run('popup sam "dinner time"');
    t('popup reaches a named guest', seen.some(s => s.path === '/api/admin/popup' && s.body.target === 'g:gyyyy9z9z' && s.body.text === 'dinner time'));
    seen.length = 0;
    await run('energy 1A2B 5b');
    t('energy reaches a guest', seen.some(s => s.path === '/api/admin/game-gift' && s.body.target === 'g:gxxxx1a2b' && s.body.amount === 5e9 && s.body.game === 'idle-universe.html'));
    seen.length = 0;
    await run('energy everyone 1e12');
    t('energy everyone posts *', seen.some(s => s.path === '/api/admin/game-gift' && s.body.target === '*' && s.body.amount === 1e12));
    seen.length = 0;
    await run('energy 1A2B lots');
    t('a bad amount sends nothing', !seen.some(s => s.path === '/api/admin/game-gift'));
    seen.length = 0;
    await run('give dave 5b energy');
    t('give <n> energy sends only energy', !seen.some(s => s.path === '/api/admin/gift') &&
      seen.some(s => s.path === '/api/admin/game-gift' && s.body.target === 'u:s1' && s.body.amount === 5e9));
    seen.length = 0;
    await run('give dave 100 energy 2m');
    t('give mixes tokens and energy', seen.some(s => s.path === '/api/admin/gift' && s.body.tokens === 100) &&
      seen.some(s => s.path === '/api/admin/game-gift' && s.body.amount === 2e6));
    seen.length = 0;
    await run('gban 1A2B net spam');
    const gb = seen.find(s => s.path === '/api/admin/guest-ban');
    t('gban net bans device and network', gb && gb.body.gid === 'gxxxx1a2b' && gb.body.ip === true && gb.body.reason === 'spam');
    seen.length = 0;
    await run('gban sam net');
    t('gban refuses your own network', said(/your own network/) && !seen.some(s => s.path === '/api/admin/guest-ban'));
    await run('gunban 1A2B');
    t('gunban lifts it', seen.some(s => s.path === '/api/admin/guest-ban' && s.body.banned === false));
    seen.length = 0;
    await run('ipban 5.6.7.8 raid'); await run('confirm');
    t('ipban asks, then bans', seen.some(s => s.path === '/api/admin/ip-ban' && s.body.ip === '5.6.7.8' && s.body.banned === true));
    await run('ipban off 5.6.7.8');
    t('ipban off unbans', seen.some(s => s.path === '/api/admin/ip-ban' && s.body.banned === false));
    seen.length = 0;
    await run('guestplay off');
    t('guestplay off locks guests out', seen.some(s => s.path === '/api/admin/guests-lock' && s.body.on === true));
    seen.length = 0;
    await run('gameoff gridlock');
    t('gameoff switches a game off', seen.some(s => s.path === '/api/admin/games' && s.body.disabled.indexOf('gridlock.html') !== -1));
    seen.length = 0;
    await run('gameon all');
    t('gameon all clears the list', seen.some(s => s.path === '/api/admin/games' && s.body.disabled.length === 0));
    seen.length = 0;
    await run('reloadall'); await run('confirm');
    t('reloadall asks, then posts', seen.some(s => s.path === '/api/admin/reload-all'));

    // ── appeals, mods, featured ──
    seen.length = 0;
    await run('appeals');
    t('appeals lists the waiting ones', said(/#5 .*Eve/));
    await run('appeal 5 yes be nice');
    t('appeal yes unbans with a reply', seen.some(s => s.path === '/api/admin/appeal-decide' && s.body.id === 5 && s.body.accept === true && s.body.reply === 'be nice'));
    await run('appeal 5 maybe');
    t('appeal needs yes or no', said(/usage: appeal/));
    seen.length = 0;
    await run('mod dave@x.com');
    t('mod makes a moderator', seen.some(s => s.path === '/api/admin/set-mod' && s.body.sub === 's1' && s.body.on === true));
    await run('mod dave@x.com off');
    t('mod … off removes it', seen.some(s => s.path === '/api/admin/set-mod' && s.body.on === false));
    seen.length = 0;
    await run('feature gridlock');
    t('feature sets the banner game', seen.some(s => s.path === '/api/admin/featured' && s.body.file === 'gridlock.html'));

    // ── owner broadcast commands ──
    seen.length = 0;
    await run('msg dave@x.com "good game"');
    t('msg sends a note-only gift', seen.some(s => s.path === '/api/admin/gift' && s.body.sub === 's1' && s.body.note === 'good game' && !s.body.tokens));
    await run('announce Double tokens today');
    t('announce posts the text', seen.some(s => s.path === '/api/admin/announce' && s.body.text === 'Double tokens today'));
    await run('announce off');
    t('announce off clears it', seen.some(s => s.path === '/api/admin/announce' && s.body.text === ''));
    await run('maint on back soon');
    t('maint on asks first', !seen.some(s => s.path === '/api/admin/maintenance'));
    await run('confirm');
    t('then closes with the message', seen.some(s => s.path === '/api/admin/maintenance' && s.body.on === true && s.body.text === 'back soon'));
    await run('maint off');
    t('maint off reopens', seen.some(s => s.path === '/api/admin/maintenance' && s.body.on === false));

    // ── reset ──
    if (typeof resetEconomy === 'function') {
      setTokens(300);
      await run('reset'); await run('confirm');
      t('reset leaves the wallet at zero', tokens() === 0 && localStorage.getItem(tokKeys().bal) === '0');
    }

    // ── reports ──
    await run('reports');
    t('reports lists what came back', said(/cheating/));
    seen.length = 0;
    await run('dismiss 7');
    t('dismiss posts the id', seen.some(s => s.path === '/api/admin/dismiss-report' && s.body.id === '7'));

    // ── help ──
    await run('help');
    t('help lists the server commands', said(/SERVER/));
    t('help lists the local commands', said(/THIS DEVICE/));
    await run('help ban');
    t('help explains one command', said(/ban <query>/));

    const out = document.createElement('pre');
    out.id = 'smokeout';
    out.textContent = lines.join('\n') + '\n\nSMOKE ' + (fail ? 'FAIL' : 'PASS') + ' ' + pass + '/' + (pass + fail);
    document.body.appendChild(out);
    document.title = 'SMOKE ' + (fail ? 'FAIL' : 'PASS') + ' ' + pass + '/' + (pass + fail);
  }, 600));
})();
