/* ==========================================================================
   GLITCHBOX — SOCIAL + PLAYER TOOLS
   --------------------------------------------------------------------------
   Everything the hub shows players beyond the game grid, kept out of
   index.html so it stays readable:

     • profiles + badges        (click a friend, or your own profile)
     • 🏆 leaderboards           (most played this week + high scores)
     • 🔐 My Data                (see / download / delete what's kept about you)
     • ban appeals              (form on the ban screen)
     • daily challenges         (token shop)
     • continue playing row     (top of the hub)
     • staff alerts             (owner + moderators: new reports / appeals)

   Uses the hub's globals (api, esc, GAMES, gameURL, currentUser, lastState,
   avatarHTML, noticeToast, grant, …) and exposes window.GBSocial.
   Self-test: index.html#socialsmoke (fake server, result in document.title).
   ========================================================================== */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const E = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s));
  const J = (k, f) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch (e) { return f; } };
  const S = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const games = () => (typeof GAMES !== 'undefined' ? GAMES : []);
  const gameOf = f => games().find(g => g.file === f);
  const gname = f => { const g = gameOf(f); return g ? (g.emoji ? g.emoji + ' ' : '') + g.name : String(f || '').replace(/\.html$/, ''); };
  const mins = m => { m = Math.round(m || 0); return m < 60 ? m + 'm' : Math.floor(m / 60) + 'h ' + (m % 60) + 'm'; };
  const signedIn = () => typeof currentUser !== 'undefined' && !!currentUser;
  const session = () => { try { return localStorage.getItem('glitchbox_session') || ''; } catch (e) { return ''; } };
  const base = () => (typeof API_BASE !== 'undefined' ? API_BASE : (window.GLITCHBOX_API || ''));
  function ago(ts) {
    if (!ts) return '—';
    const s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 90) return 'just now';
    if (s < 3600) return Math.round(s / 60) + 'm ago';
    if (s < 86400) return Math.round(s / 3600) + 'h ago';
    return Math.round(s / 86400) + 'd ago';
  }
  const when = ts => new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  function dayKey() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function toast(t, m, ms) { if (typeof noticeToast === 'function') noticeToast(t, m, ms); }
  // The hub's api() when it can, else a direct fetch (appeals use a parked session).
  async function call(path, opts) {
    opts = opts || {};
    if (!opts.token && typeof window.api === 'function') return window.api(path, opts);
    const headers = {};
    if (opts.token) headers.Authorization = 'Bearer ' + opts.token;
    let body;
    if (opts.body) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opts.body); }
    const r = await fetch(base() + path, { method: opts.method || (body ? 'POST' : 'GET'), headers, body });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(d.error || ('HTTP ' + r.status)); e.status = r.status; throw e; }
    return d;
  }

  // ── styles + a shared modal ────────────────────────────────────────────────
  function styles() {
    if ($('gbs-style')) return;
    const css = `
    .gbs-modal { position:fixed; inset:0; z-index:9000; display:none; align-items:flex-start; justify-content:center;
      padding:40px 16px; overflow-y:auto; background:rgba(2,4,10,.82); backdrop-filter:blur(6px); }
    .gbs-modal.show { display:flex; }
    .gbs-card { position:relative; width:100%; max-width:620px; background:#080b14; border:1px solid rgba(0,245,255,.25);
      box-shadow:0 0 40px rgba(0,245,255,.1); padding:24px 24px 26px; color:var(--text,#e8eefc);
      clip-path:polygon(0 0,calc(100% - 20px) 0,100% 20px,100% 100%,20px 100%,0 calc(100% - 20px)); }
    .gbs-x { position:absolute; top:12px; right:14px; background:transparent; border:1px solid rgba(0,245,255,.35);
      color:var(--cyan,#00f5ff); width:30px; height:30px; cursor:pointer; font-size:15px; }
    .gbs-title { font-family:'Press Start 2P',monospace; font-size:13px; color:var(--cyan,#00f5ff); margin:0 40px 16px 0;
      text-shadow:0 0 10px rgba(0,245,255,.5); line-height:1.5; }
    .gbs-h { font-family:'Press Start 2P',monospace; font-size:9px; letter-spacing:2px; color:var(--pink,#ff0080); margin:20px 0 10px; }
    .gbs-row { display:flex; align-items:center; gap:10px; padding:8px 10px; background:var(--bg3,#0e1422); margin-bottom:5px;
      border-left:2px solid rgba(0,245,255,.35); font-size:14px; }
    .gbs-row.me { border-left-color:var(--yellow,#ffe600); background:rgba(255,230,0,.06); }
    .gbs-row .grow { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .gbs-row .rank { font-family:'Press Start 2P',monospace; font-size:10px; color:var(--muted,#8b95a8); width:22px; }
    .gbs-row .num { color:var(--cyan,#00f5ff); font-weight:800; white-space:nowrap; }
    .gbs-muted { color:var(--muted,#8b95a8); font-size:13px; line-height:1.5; }
    .gbs-av { width:28px; height:28px; flex-shrink:0; display:flex; align-items:center; justify-content:center; overflow:hidden;
      border:1px solid rgba(0,245,255,.3); background:#060911; font-weight:800; color:var(--cyan,#00f5ff); }
    .gbs-av img { width:100%; height:100%; object-fit:cover; }
    .gbs-head { display:flex; align-items:center; gap:14px; margin-bottom:12px; }
    .gbs-head .gbs-av { width:58px; height:58px; font-size:26px; }
    .gbs-name { font-size:20px; font-weight:800; }
    .gbs-badges { display:grid; grid-template-columns:repeat(auto-fill,minmax(118px,1fr)); gap:8px; }
    .gbs-badge { text-align:center; padding:10px 6px; background:var(--bg3,#0e1422); border:1px solid rgba(255,230,0,.35); }
    .gbs-badge .e { font-size:24px; display:block; }
    .gbs-badge b { display:block; font-size:12px; margin-top:4px; }
    .gbs-badge span { font-size:10px; color:var(--muted,#8b95a8); }
    .gbs-badge.no { border-color:rgba(255,255,255,.08); opacity:.45; filter:grayscale(1); }
    .gbs-btn { border:1px solid rgba(0,245,255,.4); background:transparent; color:var(--cyan,#00f5ff); cursor:pointer;
      padding:8px 13px; font:inherit; font-weight:800; font-size:12px; letter-spacing:.6px; text-transform:uppercase; }
    .gbs-btn:hover { background:rgba(0,245,255,.08); }
    .gbs-btn.solid { background:var(--cyan,#00f5ff); color:#001014; }
    .gbs-btn.danger { border-color:rgba(255,0,80,.5); color:#ff3b6b; }
    .gbs-btn:disabled { opacity:.45; cursor:not-allowed; }
    .gbs-actions { display:flex; flex-wrap:wrap; gap:8px; margin:10px 0; }
    .gbs-in { background:var(--bg3,#0e1422); border:1px solid rgba(0,245,255,.25); color:var(--text,#e8eefc); padding:9px 11px;
      font:inherit; font-size:14px; width:100%; outline:none; }
    .gbs-in:focus { border-color:var(--cyan,#00f5ff); }
    .gbs-kv { display:grid; grid-template-columns:120px 1fr; gap:4px 12px; font-size:13px; }
    .gbs-kv b { color:var(--muted,#8b95a8); font-weight:700; }
    .gbs-kv span { word-break:break-word; }
    .gbs-now { padding:12px 14px; border:1px solid rgba(0,255,136,.35); background:rgba(0,255,136,.05); margin-bottom:10px; font-weight:700; }
    .gbs-toggle { display:flex; align-items:center; gap:10px; font-size:14px; font-weight:700; cursor:pointer; padding:6px 0; }
    .gbs-toggle input { width:17px; height:17px; accent-color:var(--cyan,#00f5ff); }
    .gbs-own { padding:0 26px; }
    /* continue playing */
    #recent-row .rr-wrap { padding:0 24px; margin-top:18px; }
    #recent-row .rr-list { display:flex; gap:10px; overflow-x:auto; padding-bottom:6px; }
    #recent-row .rr { flex-shrink:0; display:flex; align-items:center; gap:9px; padding:9px 14px; text-decoration:none;
      background:var(--bg3,#0e1422); border:1px solid rgba(0,245,255,.2); color:var(--text,#e8eefc); font-weight:700; font-size:14px; }
    #recent-row .rr:hover { border-color:var(--cyan,#00f5ff); box-shadow:0 0 14px rgba(0,245,255,.2); }
    #recent-row .rr small { display:block; font-size:10px; color:var(--muted,#8b95a8); font-weight:600; }
    #recent-row .rr .e { font-size:20px; }
    /* challenges */
    .ch-row { display:flex; align-items:center; gap:12px; padding:12px 14px; background:var(--bg3,#0e1422); margin-bottom:6px;
      border-left:2px solid rgba(255,230,0,.4); }
    .ch-row.done { border-left-color:#00ff88; }
    .ch-row .e { font-size:22px; }
    .ch-row .t { flex:1; font-weight:700; font-size:14px; }
    .ch-row .t small { display:block; color:var(--muted,#8b95a8); font-weight:600; font-size:11px; }
    .ch-bar { height:4px; background:rgba(255,255,255,.08); margin-top:5px; }
    .ch-bar i { display:block; height:100%; background:var(--yellow,#ffe600); }
    /* appeal */
    #appeal-box { margin-top:14px; text-align:left; }
    #appeal-box textarea { min-height:80px; resize:vertical; }
    .nav-alert { margin-left:auto; background:#ff0050; color:#fff; font-size:10px; font-weight:800; padding:1px 6px; border-radius:8px; }`;
    const el = document.createElement('style');
    el.id = 'gbs-style';
    el.textContent = css;
    document.head.appendChild(el);
  }
  function modal(html) {
    styles();
    let m = $('gbs-modal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'gbs-modal';
      m.className = 'gbs-modal';
      m.innerHTML = '<div class="gbs-card"><button class="gbs-x" title="Close (Esc)">✕</button><div id="gbs-body"></div></div>';
      document.body.appendChild(m);
      m.addEventListener('click', e => { if (e.target === m || e.target.closest('.gbs-x')) closeModal(); });
    }
    $('gbs-body').innerHTML = html;
    m.classList.add('show');
    m.scrollTop = 0;
  }
  function closeModal() { const m = $('gbs-modal'); if (m) m.classList.remove('show'); }
  addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  function av(u) {
    const h = typeof avatarHTML === 'function' ? avatarHTML(u, true) : '';
    return '<div class="gbs-av">' + (h || E(((u && u.name) || '?').charAt(0).toUpperCase())) + '</div>';
  }

  // ── continue playing + daily challenges ────────────────────────────────────
  // glitchbox.recent : [{file, at}] newest first   (play.html writes it too)
  // glitchbox.today  : {day, plays:[file…]}        what you've opened today
  // glitchbox.chal   : {day, claimed:[id…]}        challenges already paid out
  function notePlay(file) {
    if (!gameOf(file)) return;
    const r = J('glitchbox.recent', []).filter(x => x && x.file !== file);
    r.unshift({ file, at: Date.now() });
    S('glitchbox.recent', r.slice(0, 12));
    let t = J('glitchbox.today', null);
    if (!t || t.day !== dayKey()) t = { day: dayKey(), plays: [] };
    if (t.plays.indexOf(file) === -1) t.plays.push(file);
    S('glitchbox.today', t);
    renderRecent();
  }
  function renderRecent() {
    styles();
    const box = $('recent-row');
    if (!box) return;
    // only games you can open right now — not locked specials, not switched-off ones
    const list = J('glitchbox.recent', []).filter(x => { const g = x && gameOf(x.file);
      return g && !(typeof isLocked === 'function' && isLocked(g)) && !(typeof isOff === 'function' && isOff(g.file)); }).slice(0, 6);
    if (!list.length) { box.innerHTML = ''; return; }
    box.innerHTML = '<div class="rr-wrap"><div class="section-header"><div class="section-title">CONTINUE PLAYING</div><div class="section-line"></div></div>' +
      '<div class="rr-list">' + list.map(x => {
        const g = gameOf(x.file);
        return '<a class="rr" href="' + E(gameURL(g.file)) + '" onclick="if(typeof rewardPlay===\'function\')rewardPlay(\'' + E(g.file) + '\',\'' + E(g.name).replace(/'/g, '') + '\')">' +
          '<span class="e">' + E(g.emoji || '🎮') + '</span><span>' + E(g.name) + '<small>' + ago(x.at) + '</small></span></a>';
      }).join('') + '</div></div>';
  }

  const CH_REWARD = 25;
  // A small seeded RNG so everybody gets the same three challenges on the same day.
  function rng(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function challenges(day) {
    const r = rng('gb-' + day), free = games().filter(g => !g.price);
    if (!free.length) return [];
    const pick = free[Math.floor(r() * free.length)];
    const mp = g => (g.tags || []).indexOf('mp') !== -1 || g.category === 'multiplayer';
    const cats = [...new Set(free.map(g => g.category))].filter(c => c && c !== 'multiplayer');
    const cat = cats[Math.floor(r() * cats.length)] || 'action';
    const n = 3 + Math.floor(r() * 2);
    const third = r() < 0.5
      ? { id: 'mp', e: '🎉', text: 'Play a multiplayer game', need: 1, count: p => p.filter(f => { const g = gameOf(f); return g && mp(g); }).length }
      : { id: 'cat-' + cat, e: '🎯', text: 'Play 2 ' + cat + ' games', need: 2, count: p => p.filter(f => { const g = gameOf(f); return g && g.category === cat; }).length };
    return [
      { id: 'game-' + pick.file, e: pick.emoji || '🎮', text: 'Play ' + pick.name, need: 1, count: p => p.indexOf(pick.file) !== -1 ? 1 : 0, file: pick.file },
      { id: 'variety-' + n, e: '🧭', text: 'Play ' + n + ' different games', need: n, count: p => p.length },
      third,
    ];
  }
  function renderChallenges() {
    styles();
    const box = $('shop-challenges');
    if (!box) return;
    if (!signedIn()) { box.innerHTML = '<div class="gbs-muted" style="padding:6px 2px">Sign in to do daily challenges — three new ones every day, ' + CH_REWARD + ' 🪙 each.</div>'; return; }
    const day = dayKey(), t = J('glitchbox.today', null), plays = t && t.day === day ? t.plays : [];
    const c = J('glitchbox.chal', null), claimed = c && c.day === day ? c.claimed : [];
    box.innerHTML = challenges(day).map(ch => {
      const have = Math.min(ch.need, ch.count(plays)), done = have >= ch.need, got = claimed.indexOf(ch.id) !== -1;
      const btn = got ? '<span style="color:#00ff88;font-weight:800">✓</span>'
        : done ? '<button class="shop-btn buy" onclick="GBSocial.claim(\'' + E(ch.id) + '\')">🪙 Claim ' + CH_REWARD + '</button>'
        : (ch.file ? '<a class="shop-btn play" style="text-decoration:none" href="' + E(gameURL(ch.file)) + '">▶ Go</a>' : '<span class="gbs-muted">' + have + '/' + ch.need + '</span>');
      return '<div class="ch-row' + (done ? ' done' : '') + '"><span class="e">' + E(ch.e) + '</span><div class="t">' + E(ch.text) +
        '<small>' + (got ? 'Claimed' : done ? 'Done — claim it!' : have + ' / ' + ch.need) + '</small>' +
        '<div class="ch-bar"><i style="width:' + Math.round(have / ch.need * 100) + '%"></i></div></div>' + btn + '</div>';
    }).join('') + '<div class="gbs-muted" style="margin-top:6px">New challenges every day at midnight.</div>';
  }
  function claim(id) {
    if (!signedIn()) return false;
    const day = dayKey(), ch = challenges(day).find(x => x.id === id);
    if (!ch) return false;
    const t = J('glitchbox.today', null), plays = t && t.day === day ? t.plays : [];
    let c = J('glitchbox.chal', null);
    if (!c || c.day !== day) c = { day, claimed: [] };
    if (c.claimed.indexOf(id) !== -1 || ch.count(plays) < ch.need) return false;
    c.claimed.push(id);
    S('glitchbox.chal', c);
    if (typeof grant === 'function') grant(CH_REWARD, 'Challenge · ' + ch.text);
    if (typeof renderShop === 'function' && $('shop-modal') && $('shop-modal').classList.contains('show')) renderShop();
    else renderChallenges();
    return true;
  }

  // ── profiles + badges ──────────────────────────────────────────────────────
  function badgesHTML(list) {
    return '<div class="gbs-badges">' + (list || []).map(b =>
      '<div class="gbs-badge' + (b.got ? '' : ' no') + '" title="' + E(b.desc) + '"><span class="e">' + E(b.e) + '</span><b>' + E(b.name) +
      '</b><span>' + E(b.desc) + '</span></div>').join('') + '</div>';
  }
  async function openProfile(sub) {
    if (!signedIn()) { if (typeof openAuth === 'function') openAuth('login'); return; }
    modal('<div class="gbs-muted">Loading profile…</div>');
    let p;
    try { p = await call('/api/profile' + (sub ? '?sub=' + encodeURIComponent(sub) : '')); }
    catch (e) { modal('<div class="gbs-title">PROFILE</div><div class="gbs-muted">' + E(e.message) + '</div>'); return; }
    const fr = ((typeof lastState !== 'undefined' && lastState.friends) || []).find(f => f.sub === p.sub);
    const now = p.hidden ? '<div class="gbs-now" style="border-color:rgba(255,255,255,.15);background:none">🙈 ' + E(p.name) + ' keeps their activity private.</div>'
      : p.online ? '<div class="gbs-now">' + (p.playing ? '▶ Playing ' + E(gname(p.playing)) : '🏠 In the hub') +
        (fr && fr.room && fr.playing ? ' <button class="gbs-btn solid" style="margin-left:10px" onclick="GBSocial.close();openRoom(\'' + E(fr.playing) + '\',\'' + E(fr.room) + '\',false)">⚡ Join</button>' : '') + '</div>'
      : '<div class="gbs-now" style="border-color:rgba(255,255,255,.12);background:none;color:var(--muted,#8b95a8)">💤 Offline</div>';
    const got = (p.badges || []).filter(b => b.got).length;
    modal('<div class="gbs-head">' + av(p) + '<div><div class="gbs-name">' + E(p.name) + (p.self ? ' <span class="gbs-muted">(you)</span>' : '') + '</div>' +
        '<div class="gbs-muted">Member since ' + (p.created ? new Date(p.created).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—') +
        ' · ' + p.friends + ' friend' + (p.friends === 1 ? '' : 's') + (p.totalMinutes != null ? ' · ' + mins(p.totalMinutes) + ' played this month' : '') + '</div></div></div>' +
      now +
      '<div class="gbs-h">// BADGES · ' + got + ' / ' + (p.badges || []).length + '</div>' + badgesHTML(p.badges) +
      (p.topGames && p.topGames.length ? '<div class="gbs-h">// FAVOURITE GAMES</div>' + p.topGames.map(g =>
        '<a class="gbs-row" style="text-decoration:none;color:inherit" href="' + E(gameURL(g.game)) + '"><span class="grow">' + E(gname(g.game)) + '</span><span class="num">' + mins(g.minutes) + '</span></a>').join('') : '') +
      (p.scores && p.scores.length ? '<div class="gbs-h">// BEST SCORES</div>' + p.scores.map(s =>
        '<div class="gbs-row"><span class="grow">' + E(gname(s.game)) + '</span><span class="num">' + E(s.score) + '</span></div>').join('') : ''));
  }
  // Your own profile window: badges, the privacy switch, and the doors to My Data.
  async function renderOwn() {
    styles();
    const box = $('social-own');
    if (!box || !signedIn()) return;
    const hide = !!(lastState && lastState.profile && lastState.profile.hide_activity);
    box.innerHTML = '<div class="profile-section-title">// YOUR BADGES <span id="gbs-own-count"></span></div>' +
      '<div class="gbs-own"><div id="gbs-own-badges" class="gbs-muted">Loading…</div>' +
      '<label class="gbs-toggle"><input type="checkbox" id="gbs-share" ' + (hide ? '' : 'checked') + ' onchange="GBSocial.setPrivacy(!this.checked)">' +
        'Let friends and leaderboards see what I play</label>' +
      '<div class="gbs-actions"><button class="gbs-btn" onclick="GBSocial.openProfile()">👤 My profile</button>' +
        '<button class="gbs-btn" onclick="GBSocial.openBoards()">🏆 Leaderboards</button>' +
        '<button class="gbs-btn" onclick="GBSocial.openMyData()">🔐 My data</button></div></div>';
    if (!session()) { $('gbs-own-badges').textContent = 'Badges show up once you\'re connected to the server.'; return; }
    try {
      const p = await call('/api/profile');
      const el = $('gbs-own-badges');
      if (el) { el.className = ''; el.innerHTML = badgesHTML(p.badges); }
      const c = $('gbs-own-count'); if (c) c.textContent = (p.badges || []).filter(b => b.got).length + ' / ' + (p.badges || []).length;
    } catch (e) { const el = $('gbs-own-badges'); if (el) el.textContent = e.message; }
  }
  async function setPrivacy(hide) {
    try {
      await call('/api/privacy', { method: 'POST', body: { hide: !!hide } });
      if (lastState && lastState.profile) lastState.profile.hide_activity = hide ? 1 : 0;
      toast(hide ? '🙈 PRIVATE' : '👀 SHARING', hide ? 'Friends and leaderboards no longer see what you play.' : 'Friends can see what you play again.');
    } catch (e) { toast('⚠️', e.message); }
  }

  // ── leaderboards ───────────────────────────────────────────────────────────
  async function openBoards(game) {
    game = game || '*';
    const opts = '<option value="*">🏟️ The whole arcade</option>' + games().slice().sort((a, b) => a.name.localeCompare(b.name))
      .map(g => '<option value="' + E(g.file) + '"' + (g.file === game ? ' selected' : '') + '>' + E((g.emoji ? g.emoji + ' ' : '') + g.name) + '</option>').join('');
    const head = '<div class="gbs-title">🏆 LEADERBOARDS</div>' +
      '<select class="gbs-in" id="gbs-board-pick" onchange="GBSocial.openBoards(this.value)">' + opts + '</select>';
    modal(head + '<div class="gbs-muted" style="margin-top:12px">Loading…</div>');
    let d;
    try { d = await call('/api/leaderboard?game=' + encodeURIComponent(game)); }
    catch (e) { modal(head + '<div class="gbs-muted" style="margin-top:12px">' + E(e.message) + '</div>'); return; }
    const mine = signedIn() ? currentUser.sub : '';
    const rows = (list, val) => list.map((x, i) =>
      '<div class="gbs-row' + (x.sub === mine ? ' me' : '') + '"><span class="rank">' + (i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1) + '</span>' + av(x) +
      '<span class="grow">' + E(x.name) + (x.sub === mine ? ' (you)' : '') + '</span><span class="num">' + val(x) + '</span></div>').join('');
    modal(head +
      '<div class="gbs-h">// MOST PLAYED THIS WEEK</div>' +
      (d.time.length ? rows(d.time, x => mins(x.minutes)) : '<div class="gbs-muted">Nobody yet — play a while and you\'re on it.</div>') +
      (game !== '*' ? '<div class="gbs-h">// HIGH SCORES' + (d.low ? ' · lowest wins' : '') + '</div>' +
        (d.scores.length ? rows(d.scores, x => E(x.score)) : '<div class="gbs-muted">No scores posted for this game yet.</div>') : '') +
      '<div class="gbs-muted" style="margin-top:14px">Only signed-in players show up, as first name + initial. Hide yourself from your profile.</div>');
  }

  // ── My Data ────────────────────────────────────────────────────────────────
  // Everything the server keeps about you, plus what this browser keeps, with a
  // download and a delete. Guests get the same for their device id.
  function localData() {
    const out = {};
    try { Object.keys(localStorage).filter(k => /^glitchbox/.test(k) && !/session/i.test(k)).forEach(k => out[k] = localStorage.getItem(k)); } catch (e) {}
    return out;
  }
  let lastExport = null;
  async function openMyData() {
    modal('<div class="gbs-title">🔐 MY DATA</div><div class="gbs-muted">Loading…</div>');
    const guest = !signedIn();
    let d;
    try {
      if (guest) {
        const gid = typeof guestId === 'function' ? guestId() : '';
        d = await call('/api/guest-data?gid=' + encodeURIComponent(gid), { token: '' });
      } else {
        if (!session()) throw new Error('You\'re signed in on this device but not connected to the server yet — try again in a moment.');
        d = await call('/api/my-data');
      }
    } catch (e) { modal('<div class="gbs-title">🔐 MY DATA</div><div class="gbs-muted">' + E(e.message) + '</div>'); return; }
    lastExport = { exported: new Date().toISOString(), server: d, thisBrowser: localData() };
    const kv = pairs => '<div class="gbs-kv">' + pairs.filter(p => p[1] !== undefined && p[1] !== null && p[1] !== '')
      .map(p => '<b>' + E(p[0]) + '</b><span>' + p[1] + '</span>').join('') + '</div>';
    const acts = (d.activity || []).slice(0, 40).map(a =>
      '<div class="gbs-row"><span class="gbs-muted" style="width:120px">' + when(a.at) + '</span><span class="grow">' +
      E(a.game === '~' ? '💤 went offline' : a.game ? gname(a.game) : '🏠 the hub') + '</span></div>').join('');
    const deviceOf = ua => { ua = String(ua || ''); return /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /CrOS/.test(ua) ? 'Chromebook' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'Mac' : ua ? 'Other' : ''; };
    let html = '<div class="gbs-title">🔐 MY DATA</div>' +
      '<div class="gbs-muted">This is everything GLITCHBOX keeps about you — the same things the owner can see. ' +
        '<a href="#" onclick="viewTos();return false;" style="color:var(--cyan,#00f5ff)">Read the terms</a>.</div>';
    if (guest) {
      const g = d.guest;
      html += '<div class="gbs-h">// THIS DEVICE (GUEST)</div>' + (g ? kv([
        ['Shown as', E(g.name)], ['Device', E(deviceOf(g.device))], ['IP address', E(g.ip)], ['First seen', when(g.created)],
        ['Last seen', when(g.last_seen)], ['Terms', g.tos_version ? 'agreed (' + E(g.tos_version) + ')' : 'not agreed'], ['Banned', g.banned ? 'yes' : '']]) :
        '<div class="gbs-muted">The server has nothing about this device.</div>');
    } else {
      const a = d.account || {};
      html += '<div class="gbs-h">// YOUR ACCOUNT</div>' + kv([
        ['Name', E(a.name)], ['Email', E(a.email)], ['Friend code', E(a.code)], ['Joined', a.created ? when(a.created) : ''],
        ['Last seen', a.last_seen ? when(a.last_seen) : ''], ['IP address', E(a.ip)], ['Device', E(deviceOf(a.device))],
        ['Terms', a.tos_version ? 'agreed (' + E(a.tos_version) + ') ' + (a.tos_at ? when(a.tos_at) : '') : 'not agreed'],
        ['Activity', a.hide_activity ? 'hidden from friends' : 'friends can see it'], ['Role', a.role === 'mod' ? 'moderator' : '']]) +
        '<div class="gbs-h">// PEOPLE</div>' + kv([
          ['Friends', E((d.friends || []).join(', ') || 'none')], ['Blocked', E((d.blocked || []).join(', ') || 'nobody')],
          ['Reports you made', String((d.reportsYouMade || []).length)], ['Reports about you', String(d.reportsAboutYou || 0)]]) +
        '<div class="gbs-h">// GAMES</div>' + kv([
          ['Cloud saves', E((d.saves || []).map(s => gname(s.game)).join(', ') || 'none')],
          ['Best scores', E((d.scores || []).map(s => gname(s.game) + ': ' + s.score).join(', ') || 'none')],
          ['Appeals', String((d.appeals || []).length)]]);
    }
    html += '<div class="gbs-h">// WHAT YOU\'VE BEEN DOING</div>' + (acts || '<div class="gbs-muted">Nothing recorded.</div>') +
      ((d.activity || []).length > 40 ? '<div class="gbs-muted">…and ' + (d.activity.length - 40) + ' more in the download.</div>' : '') +
      '<div class="gbs-h">// IN THIS BROWSER</div><div class="gbs-muted">Tokens, unlocks, favorites and settings live only in this browser: ' +
        Object.keys(lastExport.thisBrowser).length + ' items. They\'re in the download too.</div>' +
      '<div class="gbs-actions" style="margin-top:16px"><button class="gbs-btn solid" onclick="GBSocial.download()">⬇ Download everything</button>' +
        (guest ? '' : '<button class="gbs-btn" onclick="GBSocial.setPrivacy(!(lastState.profile&&lastState.profile.hide_activity));GBSocial.close()">' +
          ((d.account && d.account.hide_activity) ? '👀 Share my activity' : '🙈 Hide my activity') + '</button>') + '</div>' +
      '<div class="gbs-h" style="color:#ff3b6b">// ' + (guest ? 'FORGET THIS DEVICE' : 'DELETE MY ACCOUNT') + '</div>' +
      '<div class="gbs-muted">' + (guest
        ? 'Erases everything the server has about this device and gives it a fresh guest id. It can\'t be undone.'
        : 'Erases your account, friends, saves, scores and history for good. It can\'t be undone. Type <b>DELETE</b> to confirm.') + '</div>' +
      '<div class="gbs-actions">' + (guest ? '' : '<input class="gbs-in" id="gbs-del" placeholder="Type DELETE" style="max-width:180px">') +
        '<button class="gbs-btn danger" onclick="GBSocial.eraseMe()">' + (guest ? 'Forget this device' : 'Delete my account') + '</button></div>' +
      '<div class="gbs-muted" id="gbs-del-msg"></div>';
    modal(html);
  }
  function download() {
    if (!lastExport) return;
    const blob = new Blob([JSON.stringify(lastExport, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'glitchbox-my-data.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  async function eraseMe() {
    const msg = $('gbs-del-msg');
    try {
      if (!signedIn()) {
        const gid = typeof guestId === 'function' ? guestId() : '';
        await call('/api/guest-forget', { token: '', body: { gid } });
        try { Object.keys(localStorage).filter(k => /^glitchbox\.(gid|tos\.guest|tosv\.guest|recent|today)$/.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) {}
      } else {
        const v = ($('gbs-del') && $('gbs-del').value || '').trim();
        if (v !== 'DELETE') { if (msg) msg.textContent = 'Type DELETE (in capitals) first.'; return; }
        await call('/api/delete-me', { method: 'POST', body: { confirm: 'DELETE' } });
        const sub = currentUser.sub;
        try { Object.keys(localStorage).filter(k => k === 'glitchbox_user' || k === 'glitchbox_session' || k === 'glitchbox_gphoto' ||
          k.indexOf(sub) !== -1).forEach(k => localStorage.removeItem(k)); } catch (e) {}
      }
      modal('<div class="gbs-title">DONE</div><div class="gbs-muted">Everything is erased. The page will reload.</div>');
      setTimeout(() => location.reload(), 1600);
    } catch (e) { if (msg) msg.textContent = e.message; }
  }

  // ── ban appeals ────────────────────────────────────────────────────────────
  function appealWho() {
    let tok = '';
    try { tok = localStorage.getItem('glitchbox.appealSession') || localStorage.getItem('glitchbox_session') || ''; } catch (e) {}
    let by = null; try { by = localStorage.getItem('glitchbox.bannedBy'); } catch (e) {}
    if (by === 'guest') tok = '';
    return { token: tok, gid: tok ? '' : (typeof guestId === 'function' ? guestId() : '') };
  }
  async function renderAppeal() {
    styles();
    const box = $('appeal-box');
    if (!box) return;
    const w = appealWho();
    if (typeof BACKEND_READY !== 'undefined' && !BACKEND_READY) { box.innerHTML = ''; return; }
    let st = null;
    try { st = (await call('/api/appeal' + (w.token ? '' : '?gid=' + encodeURIComponent(w.gid)), { token: w.token || '' })).appeal; } catch (e) {}
    const form = '<div class="gbs-h" style="margin-top:6px">// APPEAL</div>' +
      '<div class="gbs-muted" style="margin-bottom:8px">Think this is a mistake? Tell the owner what happened.</div>' +
      '<textarea class="gbs-in" id="gbs-appeal" maxlength="500" placeholder="Why should you be unbanned?"></textarea>' +
      '<div class="gbs-actions"><button class="gbs-btn solid" onclick="GBSocial.sendAppeal()">Send appeal</button></div><div class="gbs-muted" id="gbs-appeal-msg"></div>';
    if (st && st.status === 'open') box.innerHTML = '<div class="gbs-now" style="border-color:rgba(255,200,0,.45);background:rgba(255,200,0,.06)">⏳ Your appeal was sent ' + ago(st.created) + '. The answer shows up here.</div>';
    else if (st && st.status === 'accepted') box.innerHTML = '<div class="gbs-now">✅ Your appeal was accepted' + (st.reply ? ': “' + E(st.reply) + '”' : '') + ' — press Check again.</div>';
    else if (st && st.status === 'rejected') box.innerHTML = '<div class="gbs-now" style="border-color:rgba(255,0,80,.45);background:rgba(255,0,80,.06)">❌ Your appeal was turned down' +
      (st.reply ? ': “' + E(st.reply) + '”' : '') + '</div>' + (Date.now() - (st.decided_at || 0) > 86400000 ? form : '<div class="gbs-muted">You can appeal again a day after the answer.</div>');
    else box.innerHTML = form;
  }
  async function sendAppeal() {
    const t = ($('gbs-appeal') && $('gbs-appeal').value || '').trim(), msg = $('gbs-appeal-msg');
    const w = appealWho();
    try {
      await call('/api/appeal', { token: w.token || '', body: { text: t, gid: w.gid || undefined } });
      renderAppeal();
    } catch (e) { if (msg) msg.textContent = e.message; }
  }

  // ── staff alerts ───────────────────────────────────────────────────────────
  // /api/me carries alert counters for the owner and moderators. A new report or
  // appeal pops a toast (and a desktop notification when the tab is in the background).
  function notify(title, body) {
    toast('🔔 ' + title, body, 9000);
    try {
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden)
        new Notification('GLITCHBOX — ' + title, { body });
    } catch (e) {}
  }
  function checkAlerts(a) {
    if (!a) return;
    const seen = J('glitchbox.alertSeen', null);
    if (seen) {
      if (a.lastReport > seen.lastReport) notify('New report', 'A player was reported. Open the console → Reports.');
      if (a.lastAppeal > seen.lastAppeal) notify('New ban appeal', 'Someone asked to be unbanned. Open the console → Appeals.');
    }
    S('glitchbox.alertSeen', { lastReport: a.lastReport, lastAppeal: a.lastAppeal });
    const nav = $('adm-nav-item');
    if (nav) {
      let b = nav.querySelector('.nav-alert');
      const n = (a.appeals || 0) + (a.reports || 0);
      if (!b && n) { b = document.createElement('span'); b.className = 'nav-alert'; nav.appendChild(b); }
      if (b) { b.textContent = n; b.style.display = n ? '' : 'none'; b.title = (a.reports || 0) + ' reports · ' + (a.appeals || 0) + ' appeals waiting'; }
    }
  }
  async function enableAlerts() {
    if (!('Notification' in window)) return 'unsupported';
    try { return await Notification.requestPermission(); } catch (e) { return 'denied'; }
  }

  window.GBSocial = { notePlay, renderRecent, renderChallenges, claim, challenges, openProfile, renderOwn, setPrivacy,
                      openBoards, openMyData, download, eraseMe, renderAppeal, sendAppeal, checkAlerts, enableAlerts,
                      close: closeModal };

  styles();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderRecent); else renderRecent();

  // ── #socialsmoke ── drives every feature against a fake server.
  if (location.hash.indexOf('socialsmoke') !== -1) addEventListener('load', () => setTimeout(async () => {
    let pass = 0, fail = 0;
    const lines = [], sent = [];
    const t = (n, c) => { if (c) { pass++; lines.push('ok   ' + n); } else { fail++; lines.push('FAIL ' + n); } };
    const wait = (ms) => new Promise(r => setTimeout(r, ms || 40));
    const body = () => ($('gbs-body') || {}).textContent || '';
    const snapKeys = ['glitchbox.recent', 'glitchbox.today', 'glitchbox.chal', 'glitchbox.alertSeen', 'glitchbox.tokens'];
    const snap = {}; snapKeys.forEach(k => snap[k] = localStorage.getItem(k));
    snapKeys.forEach(k => localStorage.removeItem(k));
    const realUser = currentUser;
    currentUser = { sub: 'me', name: 'Lev', email: 'l@x.com' };
    lastState.friends = [{ sub: 'f1', name: 'Dave', online: 1, playing: 'gridlock.html', room: 'AB12' },
                         { sub: 'f2', name: 'Eve', online: 1, playing: 'idle-universe.html', room: null }];
    lastState.profile = { sub: 'me', code: 'ZZZZ', hide_activity: 0 };
    const badges = [{ id: 'first', e: '🎮', name: 'First Game', desc: 'Play any game', got: true }, { id: 'social', e: '👥', name: 'Social', desc: 'Have 3 friends', got: false }];
    window.api = async (path, opts) => {
      sent.push({ path, body: opts && opts.body });
      if (path.indexOf('/api/profile') === 0) return { sub: path.indexOf('f1') !== -1 ? 'f1' : 'me', name: path.indexOf('f1') !== -1 ? 'Dave' : 'Lev',
        created: Date.now() - 864e5 * 40, friends: 3, online: true, playing: 'gridlock.html', hidden: false, self: path.indexOf('f1') === -1,
        totalMinutes: 125, topGames: [{ game: 'gridlock.html', minutes: 90 }], scores: [{ game: 'gridlock.html', score: 300 }], badges };
      if (path.indexOf('/api/leaderboard') === 0) return { time: [{ sub: 'f1', name: 'Dave S.', minutes: 90 }, { sub: 'me', name: 'Lev K.', minutes: 30 }],
        scores: [{ sub: 'f1', name: 'Dave S.', score: 300 }], low: false };
      if (path === '/api/my-data') return { account: { name: 'Lev', email: 'l@x.com', code: 'ZZZZ', created: Date.now(), ip: '1.2.3.4', device: 'Mozilla (Windows) Chrome', tos_version: '2026-10-07.3' },
        activity: [{ game: 'gridlock.html', at: Date.now() }, { game: '~', at: Date.now() - 1e6 }], friends: ['Dave'], blocked: [], reportsYouMade: [], reportsAboutYou: 0, saves: [], scores: [], appeals: [] };
      if (path === '/api/delete-me') return { ok: true };
      if (path === '/api/privacy') return { ok: true };
      return { ok: true };
    };
    // continue playing
    const g1 = games().find(g => !g.price), g2 = games().filter(g => !g.price)[1];
    notePlay(g1.file); notePlay(g2.file); notePlay(g1.file);
    t('recently played lists newest first, no repeats', J('glitchbox.recent', []).map(x => x.file).join() === [g1.file, g2.file].join());
    t('the continue-playing row shows them', ($('recent-row').textContent || '').indexOf(g1.name) !== -1);
    notePlay('not-a-game.html');
    t('unknown files are ignored', J('glitchbox.recent', []).length === 2);
    // challenges
    const day = dayKey(), chs = challenges(day);
    t('three challenges a day', chs.length === 3);
    t('the same three for everyone today', JSON.stringify(challenges(day).map(c => c.id)) === JSON.stringify(chs.map(c => c.id)));
    t('a different day gives different ones', JSON.stringify(challenges('2001-01-01').map(c => c.id)) !== JSON.stringify(chs.map(c => c.id)) ||
      JSON.stringify(challenges('2001-01-02').map(c => c.id)) !== JSON.stringify(chs.map(c => c.id)));
    S('glitchbox.today', { day, plays: [] });
    t('an unfinished challenge cannot be claimed', claim(chs[0].id) === false);
    S('glitchbox.today', { day, plays: [chs[0].file] });
    const bal0 = typeof tokens === 'function' ? tokens() : 0;
    t('a finished one pays out', claim(chs[0].id) === true && (typeof tokens !== 'function' || tokens() === bal0 + CH_REWARD));
    t('but only once', claim(chs[0].id) === false);
    renderChallenges();
    t('the shop shows the challenges', ($('shop-challenges').textContent || '').indexOf('Claimed') !== -1);
    const realU = currentUser; currentUser = null; renderChallenges();
    t('guests are asked to sign in', /Sign in to do daily challenges/.test($('shop-challenges').textContent));
    t('and cannot claim', claim(chs[1].id) === false);
    currentUser = realU;
    // friends list
    if (typeof renderFriends === 'function') {
      renderFriends();
      const fl = $('friends-list');
      t('friends show what they are playing', /Playing .*Gridlock/i.test(fl.textContent));
      t('a friend in a room gets a Join button', !!fl.querySelector('button[onclick*="openRoom(\'gridlock.html\',\'AB12\'"]'));
      t('a friend in a solo game gets Play too', /Play too/.test(fl.textContent));
    }
    // profiles
    await openProfile('f1'); await wait();
    t('a friend profile shows badges and favourites', /BADGES · 1 \/ 2/.test(body()) && /FAVOURITE GAMES/.test(body()) && /Dave/.test(body()));
    t('and a Join button when they are in a room', !!document.querySelector('#gbs-body button[onclick*="openRoom"]'));
    t('and their play time', /2h 5m played/.test(body()));
    // own profile
    if ($('social-own')) {
      await renderOwn(); await wait(80);
      t('your profile shows your badges', ($('social-own').textContent || '').indexOf('First Game') !== -1 || !session());
      t('and the privacy switch', !!$('gbs-share') && $('gbs-share').checked);
    }
    sent.length = 0;
    await setPrivacy(true);
    t('hiding your activity tells the server', sent.some(s => s.path === '/api/privacy' && s.body.hide === true) && lastState.profile.hide_activity === 1);
    await setPrivacy(false);
    // leaderboards
    await openBoards('gridlock.html'); await wait();
    t('leaderboards show time and scores', /MOST PLAYED THIS WEEK/.test(body()) && /HIGH SCORES/.test(body()) && /Dave S\./.test(body()));
    t('your own row is highlighted', !!document.querySelector('#gbs-body .gbs-row.me'));
    await openBoards('*'); await wait();
    t('the arcade-wide board has no score list', !/HIGH SCORES/.test(body()));
    // my data
    const realSess = localStorage.getItem('glitchbox_session');
    localStorage.setItem('glitchbox_session', 'fake');
    await openMyData(); await wait();
    t('my data shows the account', /l@x\.com/.test(body()) && /1\.2\.3\.4/.test(body()) && /Windows/.test(body()));
    t('and the activity', /went offline/.test(body()) && /Gridlock/i.test(body()));
    t('and a download', !!lastExport && lastExport.server.account.email === 'l@x.com' && typeof lastExport.thisBrowser === 'object');
    t('the download never includes the session', !Object.keys(lastExport.thisBrowser).some(k => /session/i.test(k)));
    sent.length = 0;
    await eraseMe(); await wait();
    t('delete needs DELETE typed', !sent.some(s => s.path === '/api/delete-me') && /Type DELETE/.test(body()));
    if (realSess === null) localStorage.removeItem('glitchbox_session'); else localStorage.setItem('glitchbox_session', realSess);
    // alerts
    const nav = document.createElement('a'); nav.id = 'adm-nav-item'; document.body.appendChild(nav);
    checkAlerts({ reports: 2, appeals: 1, lastReport: 5, lastAppeal: 3 });
    t('first look sets the baseline quietly', J('glitchbox.alertSeen', {}).lastReport === 5);
    t('the console item shows a count', nav.querySelector('.nav-alert') && nav.querySelector('.nav-alert').textContent === '3');
    const toasts0 = ($('token-toasts') || { children: [] }).children.length;
    checkAlerts({ reports: 3, appeals: 2, lastReport: 6, lastAppeal: 4 });
    t('a new report and appeal pop alerts', ($('token-toasts') || { children: [] }).children.length >= toasts0 + 2);
    nav.remove();
    closeModal();
    currentUser = realUser;
    snapKeys.forEach(k => snap[k] === null ? localStorage.removeItem(k) : localStorage.setItem(k, snap[k]));
    renderRecent();
    const out = document.createElement('pre');
    out.id = 'smokeout';
    out.textContent = lines.join('\n') + '\n\nSMOKE ' + (fail ? 'FAIL' : 'PASS') + ' ' + pass + '/' + (pass + fail);
    document.body.appendChild(out);
    document.title = 'SMOKE ' + (fail ? 'FAIL' : 'PASS') + ' ' + pass + '/' + (pass + fail);
  }, 700));
})();
