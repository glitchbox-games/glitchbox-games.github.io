import { DurableObject } from "cloudflare:workers";

// The OAuth client the ID tokens must be minted for.
const CLIENT_ID = "292202234478-kdcu37vvdogpttpksc6acg85ljavkfj6.apps.googleusercontent.com";
const ALLOWED_ORIGINS = [
  "https://levtheduck-web.github.io",
  "http://localhost:8095",
  "http://127.0.0.1:8095",
];
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
// Friend-code alphabet: no 0/O/1/I/L to avoid confusion. Same style as the room codes.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LEN = 6;
const ROOM_LEN = 4;              // game-room codes are shorter — typed by hand mid-session
const ROOM_MAX_PLAYERS = 16;     // party games seat up to sixteen; 1v1 games ask for 2
const INVITE_TTL = 10 * 60 * 1000; // a game invite goes stale after 10 minutes
const ONLINE_WINDOW = 90 * 1000;   // "online" = seen within 90s (hub polls every ~20s)
const SAVE_MAX_BYTES = 512 * 1024; // per game-save cap — a colony snapshot is a few KB
const GUEST_KEEP = 30 * 86400000;  // guests unseen for a month drop out of the list
// A guest's device id, minted in their browser (glitchbox-menu.js / index.html).
const GID_RE = /^g[a-z0-9]{8,24}$/;
const GAME_RE = /^[a-z0-9-]{1,60}\.html$/i;
function guestName(gid) { return "Guest " + String(gid).slice(-4).toUpperCase(); }

// ── small helpers ──
function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}
function b64urlEncode(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlEncodeStr(str) {
  return b64urlEncode(new TextEncoder().encode(str));
}
function b64urlDecodeStr(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  return new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));
}
function makeCode(len) {
  const n = len || CODE_LEN;
  const rnd = new Uint8Array(n);
  crypto.getRandomValues(rnd);
  let s = "";
  for (const b of rnd) s += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return s;
}
// Length-independent, early-exit-free string compare, for the owner claim code.
function constantEq(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
// The arcade answers to exactly ONE account. Set it once with
//   npx wrangler secret put OWNER_EMAIL
// and that Google address is the owner on every request, forever. It lives in a
// secret rather than this (public) repo, and while it is set the claim code is
// dead — nobody else can take ownership, whatever they know.
function ownerPin(env) { return String((env && env.OWNER_EMAIL) || "").toLowerCase(); }

// An avatar chosen from the hub's icon grid, stored in `picture` as "icon:<id>".
function isIcon(p) { return /^icon:[a-z0-9-]{1,24}$/.test(String(p || "")); }
// Public view of another user — never leaks email.
function pub(u) {
  return u ? { sub: u.sub, name: u.name, picture: u.picture } : null;
}

// NOTE: errors thrown from a Durable Object RPC method lose custom properties
// (only `message` crosses the boundary), so we encode the status INTO the message
// as "<status>:<text>" and parse it back out in the Worker router.
class HttpError extends Error {
  constructor(status, msg) { super(status + ":" + msg); this.status = status; }
}

export class Hub extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    ctx.blockConcurrencyWhile(async () => {
      this.sql.exec(`CREATE TABLE IF NOT EXISTS users (
        sub TEXT PRIMARY KEY, email TEXT, name TEXT, picture TEXT,
        code TEXT, created INTEGER, last_seen INTEGER)`);
      this.sql.exec(`CREATE TABLE IF NOT EXISTS friends (
        a TEXT, b TEXT, created INTEGER, PRIMARY KEY (a, b))`);
      this.sql.exec(`CREATE TABLE IF NOT EXISTS requests (
        from_sub TEXT, to_sub TEXT, created INTEGER, PRIMARY KEY (from_sub, to_sub))`);
      this.sql.exec(`CREATE TABLE IF NOT EXISTS blocks (
        blocker TEXT, blocked TEXT, created INTEGER, PRIMARY KEY (blocker, blocked))`);
      this.sql.exec(`CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT, reporter TEXT, reported TEXT,
        reason TEXT, created INTEGER)`);
      // Game invites: "come play <game> with me in room <room>". One live invite per
      // (sender, recipient, game) — re-inviting refreshes the existing row.
      this.sql.exec(`CREATE TABLE IF NOT EXISTS invites (
        from_sub TEXT, to_sub TEXT, game TEXT, room TEXT, created INTEGER,
        PRIMARY KEY (from_sub, to_sub, game))`);
      // Cloud game saves: one slot per (player, game). `box` is the opaque JSON
      // the game's own save() produced — the backend never interprets it.
      this.sql.exec(`CREATE TABLE IF NOT EXISTS saves (
        sub TEXT, game TEXT, box TEXT, updated INTEGER,
        PRIMARY KEY (sub, game))`);
      this.sql.exec(`CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)`);
      // Owner gifts waiting to be banked. The wallet lives in each player's browser,
      // so a gift only sits here until their hub picks it up and acks it.
      this.sql.exec(`CREATE TABLE IF NOT EXISTS gifts (
        id INTEGER PRIMARY KEY AUTOINCREMENT, sub TEXT, tokens INTEGER,
        games TEXT, icons TEXT, note TEXT, created INTEGER)`);
      // Defensive: add `code` column if this DO predates the friend-code feature.
      try { this.sql.exec("ALTER TABLE users ADD COLUMN code TEXT"); } catch (e) { /* already there */ }
      // …and the moderation columns, for a DO that predates the admin console.
      try { this.sql.exec("ALTER TABLE users ADD COLUMN banned INTEGER"); } catch (e) { /* already there */ }
      try { this.sql.exec("ALTER TABLE users ADD COLUMN ban_reason TEXT"); } catch (e) { /* already there */ }
      // Google tells us whether it vouches for the address; the owner pin insists on it.
      try { this.sql.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER"); } catch (e) { /* already there */ }
      // Timed bans lift themselves; `playing` is what game page the player last pinged from.
      try { this.sql.exec("ALTER TABLE users ADD COLUMN ban_until INTEGER"); } catch (e) { /* already there */ }
      try { this.sql.exec("ALTER TABLE users ADD COLUMN playing TEXT"); } catch (e) { /* already there */ }
      try { this.sql.exec("ALTER TABLE users ADD COLUMN playing_at INTEGER"); } catch (e) { /* already there */ }
      // Every owner action, newest first in the console's Log tab.
      this.sql.exec(`CREATE TABLE IF NOT EXISTS admin_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER, action TEXT, target TEXT, detail TEXT)`);
      this.sql.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_code ON users(code)");
      // Guests have no account, so they're tracked by a random device id their browser
      // keeps. `ip` is the last address they pinged from — what an IP ban matches.
      this.sql.exec(`CREATE TABLE IF NOT EXISTS guests (
        gid TEXT PRIMARY KEY, label TEXT, ip TEXT, ua TEXT, created INTEGER, last_seen INTEGER,
        playing TEXT, playing_at INTEGER, banned INTEGER, ban_reason TEXT, ban_until INTEGER)`);
      // Network bans: catch a guest who simply clears their browser to get a new id.
      this.sql.exec(`CREATE TABLE IF NOT EXISTS ip_bans (
        ip TEXT PRIMARY KEY, reason TEXT, until INTEGER, created INTEGER, label TEXT)`);
      // One-shot deliveries picked up by the next ping: kicks and pop-up messages.
      // `who` is "u:<sub>" or "g:<gid>".
      this.sql.exec(`CREATE TABLE IF NOT EXISTS pending (
        id INTEGER PRIMARY KEY AUTOINCREMENT, who TEXT, kind TEXT, text TEXT, created INTEGER)`);
      try { this.sql.exec("ALTER TABLE users ADD COLUMN last_ip TEXT"); } catch (e) { /* already there */ }
      // Which version of the terms this player agreed to, and when — the record of consent.
      try { this.sql.exec("ALTER TABLE users ADD COLUMN tos_version TEXT"); } catch (e) { /* already there */ }
      try { this.sql.exec("ALTER TABLE users ADD COLUMN tos_at INTEGER"); } catch (e) { /* already there */ }
      // Guests agree to the terms too (once per browser); their ping reports the version.
      try { this.sql.exec("ALTER TABLE guests ADD COLUMN tos_version TEXT"); } catch (e) { /* already there */ }
      // What each player has been doing: one row every time they move between games
      // (or come online). Kept a week, for the owner console's View panel.
      this.sql.exec(`CREATE TABLE IF NOT EXISTS activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT, who TEXT, game TEXT, at INTEGER)`);
      this.sql.exec("CREATE INDEX IF NOT EXISTS idx_activity_who ON activity(who, at)");
      try { this.sql.exec("ALTER TABLE users ADD COLUMN last_ua TEXT"); } catch (e) { /* already there */ }
      // Ensure a signing secret exists.
      const row = this.sql.exec("SELECT v FROM meta WHERE k='secret'").toArray()[0];
      if (!row) {
        const rnd = new Uint8Array(32);
        crypto.getRandomValues(rnd);
        this.secret = b64urlEncode(rnd);
        this.sql.exec("INSERT INTO meta (k, v) VALUES ('secret', ?)", this.secret);
      } else {
        this.secret = row.v;
      }
    });
  }

  async hmac(msg) {
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(this.secret),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
    return b64urlEncode(new Uint8Array(sig));
  }

  async makeSession(sub) {
    const payload = b64urlEncodeStr(JSON.stringify({ sub, exp: Date.now() + SESSION_TTL }));
    return payload + "." + (await this.hmac(payload));
  }

  async verifySession(token) {
    if (!token) throw new HttpError(401, "no session");
    const [payload, sig] = token.split(".");
    if (!payload || !sig) throw new HttpError(401, "bad session");
    if ((await this.hmac(payload)) !== sig) throw new HttpError(401, "bad signature");
    let data;
    try { data = JSON.parse(b64urlDecodeStr(payload)); } catch { throw new HttpError(401, "bad payload"); }
    if (!data.exp || data.exp < Date.now()) throw new HttpError(401, "session expired");
    // One check here covers every authenticated endpoint: a banned account can hold a
    // valid session token and still do nothing with it.
    const ban = this.activeBan(this.userOf(data.sub));
    if (ban) throw new HttpError(403, ban);
    return data.sub;
  }

  userOf(sub) {
    return this.sql.exec(
      "SELECT sub, email, name, picture, code, created, banned, ban_reason, ban_until, email_verified, tos_version, tos_at FROM users WHERE sub = ?",
      sub).toArray()[0] || null;
  }

  // The 403 message for a banned user, or null. Format "banned:<until>:<reason>",
  // where <until> is empty for a permanent ban. An expired timed ban is lifted here.
  activeBan(u) {
    if (!u || !u.banned) return null;
    if (u.ban_until && u.ban_until <= Date.now()) {
      this.sql.exec("UPDATE users SET banned = NULL, ban_reason = NULL, ban_until = NULL WHERE sub = ?", u.sub);
      return null;
    }
    return "banned:" + (u.ban_until || "") + ":" + (u.ban_reason || "");
  }

  log(action, targetSub, detail) {
    const u = targetSub && targetSub !== "*" ? this.userOf(targetSub) : null;
    const target = targetSub === "*" ? "everyone" : u ? u.name + " <" + u.email + ">" : (targetSub || "");
    this.sql.exec("INSERT INTO admin_log (at, action, target, detail) VALUES (?, ?, ?, ?)",
      Date.now(), action, target, String(detail || "").slice(0, 300));
    this.sql.exec("DELETE FROM admin_log WHERE id <= (SELECT MAX(id) FROM admin_log) - 500");
  }

  // Arcade-wide switches, kept in `meta` as JSON. Both are public (see health()).
  metaJson(k) { try { return JSON.parse(this.metaGet(k) || "null"); } catch { return null; } }
  announcement() {
    const a = this.metaJson("announce");
    return a && a.text && (!a.until || a.until > Date.now()) ? a : null;
  }
  maintenance() { const m = this.metaJson("maintenance"); return m && m.on ? m : null; }
  // Games the owner switched off, "every open page reload" stamp, guest lock-out.
  disabledGames() { const d = this.metaJson("disabled"); return Array.isArray(d) ? d : []; }
  reloadStamp() { return Number(this.metaGet("reload")) || 0; }
  guestsLocked() { return this.metaGet("guestsLocked") === "1"; }
  switches() {
    return { announce: this.announcement(), maintenance: this.maintenance(), disabled: this.disabledGames(),
             reload: this.reloadStamp(), guestsLocked: this.guestsLocked() };
  }

  // The 403 for a banned network, or null. Same "banned:<until>:<reason>" shape as an
  // account ban so every client already knows how to show it.
  ipBan(ip) {
    if (!ip) return null;
    const b = this.sql.exec("SELECT ip, reason, until FROM ip_bans WHERE ip = ?", ip).toArray()[0];
    if (!b) return null;
    if (b.until && b.until <= Date.now()) { this.sql.exec("DELETE FROM ip_bans WHERE ip = ?", ip); return null; }
    return "banned:" + (b.until || "") + ":" + (b.reason || "");
  }
  guestOf(gid) { return this.sql.exec("SELECT * FROM guests WHERE gid = ?", gid).toArray()[0] || null; }
  guestBan(g) {
    if (!g || !g.banned) return null;
    if (g.ban_until && g.ban_until <= Date.now()) {
      this.sql.exec("UPDATE guests SET banned = NULL, ban_reason = NULL, ban_until = NULL WHERE gid = ?", g.gid);
      return null;
    }
    return "banned:" + (g.ban_until || "") + ":" + (g.ban_reason || "");
  }
  // Hand over (and forget) whatever kicks and messages are waiting for `who`.
  takePending(who) {
    const rows = this.sql.exec("SELECT id, kind, text FROM pending WHERE who = ? ORDER BY id", who).toArray();
    if (rows.length) this.sql.exec("DELETE FROM pending WHERE who = ?", who);
    const kick = rows.filter(r => r.kind === "kick").pop();
    return { kick: kick ? (kick.text || "") : null,
             messages: rows.filter(r => r.kind === "msg").map(r => r.text) };
  }

  // ── owner / admin ──
  // The owner is one account, recorded once in `meta` and never inferred from the
  // request, so nothing a client sends can promote itself.
  metaGet(k) { const r = this.sql.exec("SELECT v FROM meta WHERE k = ?", k).toArray()[0]; return r ? r.v : null; }
  metaSet(k, v) {
    this.sql.exec("INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v", k, v);
  }
  ownerSub() { return this.metaGet("owner"); }
  // Single source of truth for "is this account the owner", used by both the
  // /api/me verdict and every admin endpoint. With OWNER_EMAIL set, the answer is
  // recomputed from the pinned address on every call — a stale `meta.owner` row,
  // a leaked claim code or a hand-edited client can't survive this check.
  // email_verified is only trusted to *reject*: NULL means "signed in before this
  // column existed", which must not lock the real owner out of their own arcade.
  isOwnerSub(sub) {
    if (!sub) return false;
    const pin = ownerPin(this.env);
    if (!pin) return !!this.ownerSub() && this.ownerSub() === sub;
    const u = this.userOf(sub);
    return !!u && String(u.email || "").toLowerCase() === pin && u.email_verified !== 0;
  }
  // Public health, deliberately a boolean and nothing more: the pinned address
  // itself never leaves the Worker. The same flag already ships to every signed-in
  // client via /api/me — having it here is what makes "did OWNER_EMAIL actually
  // reach the Durable Object?" answerable without an owner session, which is the
  // one question a locked-out owner cannot otherwise ask.
  health() {
    return { ok: true, service: "glitchbox-api", ownerPinned: !!ownerPin(this.env), ...this.switches() };
  }

  // Diagnostic companion to isOwnerSub: same two conditions, reported separately.
  ownerCheck(sub) {
    if (!ownerPin(this.env)) return null;
    const u = this.userOf(sub);
    if (!u) return { emailMatches: false, emailVerified: false, email: "" };
    return { emailMatches: String(u.email || "").toLowerCase() === ownerPin(this.env),
             emailVerified: u.email_verified !== 0,
             // The server's copy of the caller's own address — which is the one the pin
             // is compared against, and can drift from the client's cached currentUser.
             email: String(u.email || "") };
  }

  async requireOwner(token) {
    const me = await this.verifySession(token);
    if (!this.isOwnerSub(me)) throw new HttpError(403, "not the owner");
    return me;
  }
  // Assign a unique friend code if the user doesn't have one yet.
  ensureCode(sub) {
    const u = this.userOf(sub);
    if (u && u.code) return u.code;
    for (let i = 0; i < 12; i++) {
      const code = makeCode();
      const taken = this.sql.exec("SELECT 1 FROM users WHERE code = ?", code).toArray()[0];
      if (!taken) { this.sql.exec("UPDATE users SET code = ? WHERE sub = ?", code, sub); return code; }
    }
    throw new HttpError(500, "could not allocate code");
  }
  isFriend(x, y) {
    return !!this.sql.exec("SELECT 1 FROM friends WHERE a = ? AND b = ?", x, y).toArray()[0];
  }
  isBlockedBetween(x, y) {
    return !!this.sql.exec(
      "SELECT 1 FROM blocks WHERE (blocker = ? AND blocked = ?) OR (blocker = ? AND blocked = ?)",
      x, y, y, x).toArray()[0];
  }

  // ── game saves ──
  // Deliberately dumb storage: the payload is whatever a game's save() returned,
  // stored verbatim. A per-save cap keeps one runaway game from filling the DO.
  async saveGame(token, game, box) {
    const me = await this.verifySession(token);
    const g = String(game || "").slice(0, 64);
    if (!g) throw new HttpError(400, "no game");
    const raw = JSON.stringify(box === undefined ? null : box);
    if (raw.length > SAVE_MAX_BYTES) throw new HttpError(413, "save too large");
    this.sql.exec(
      `INSERT INTO saves (sub, game, box, updated) VALUES (?, ?, ?, ?)
       ON CONFLICT(sub, game) DO UPDATE SET box=excluded.box, updated=excluded.updated`,
      me, g, raw, Date.now());
    return { ok: true };
  }

  async loadGame(token, game) {
    const me = await this.verifySession(token);
    const row = this.sql.exec("SELECT box, updated FROM saves WHERE sub = ? AND game = ?",
      me, String(game || "")).toArray()[0];
    if (!row) return { box: null };
    let box = null;
    try { box = JSON.parse(row.box); } catch { /* corrupt row reads as "no save" */ }
    return { box, updated: row.updated };
  }

  async deleteGame(token, game) {
    const me = await this.verifySession(token);
    this.sql.exec("DELETE FROM saves WHERE sub = ? AND game = ?", me, String(game || ""));
    return { ok: true };
  }

  // Every game this player has a save for — lets the hub show "CONTINUE" badges.
  async listSaves(token) {
    const me = await this.verifySession(token);
    return {
      saves: this.sql.exec(
        "SELECT game, updated, LENGTH(box) AS bytes FROM saves WHERE sub = ? ORDER BY updated DESC",
        me).toArray(),
    };
  }

  // Pick-your-icon avatar. Accepts either an "icon:<id>" token or a Google photo URL
  // (the client's way of switching back), and nothing else — `picture` is echoed into
  // other players' friend lists, so it must never carry an arbitrary remote URL.
  async setAvatar(token, picture) {
    const me = await this.verifySession(token);
    const p = String(picture || "");
    const ok = p === "" || isIcon(p) || /^https:\/\/[a-z0-9-]+\.googleusercontent\.com\/[^\s"'<>]*$/i.test(p);
    if (!ok || p.length > 300) throw new HttpError(400, "bad avatar");
    this.sql.exec("UPDATE users SET picture = ? WHERE sub = ?", p, me);
    return { ok: true, picture: p };
  }

  // ── endpoints ──
  async login(idToken, ip) {
    const r = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken || ""));
    if (!r.ok) throw new HttpError(401, "invalid Google token");
    const info = await r.json();
    if (info.aud !== CLIENT_ID) throw new HttpError(401, "token audience mismatch");
    if (!info.sub) throw new HttpError(401, "no subject");
    const now = Date.now();
    const existing = this.userOf(info.sub);
    // Signing in again must not hand a banned account a fresh session.
    const ban = this.activeBan(existing);
    if (ban) throw new HttpError(403, ban);
    // A banned network can't sign in its way out — except the owner, who is never locked out.
    const pinned = ownerPin(this.env) && String(info.email || "").toLowerCase() === ownerPin(this.env);
    const nb = !pinned && this.ipBan(ip);
    if (nb) throw new HttpError(403, nb);
    // A chosen arcade icon outranks the Google photo — otherwise every sign-in would
    // quietly reset the player's avatar back to their Google account picture.
    const picture = isIcon(existing && existing.picture) ? existing.picture : (info.picture || "");
    this.sql.exec(
      `INSERT INTO users (sub, email, name, picture, created, last_seen)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(sub) DO UPDATE SET email=excluded.email, name=excluded.name,
         picture=excluded.picture, last_seen=excluded.last_seen`,
      info.sub, info.email || "", info.name || info.email || "Player",
      picture, now, now);
    if (ip) this.sql.exec("UPDATE users SET last_ip = ? WHERE sub = ?", ip, info.sub);
    if (!existing) this.sql.exec("UPDATE users SET created = ? WHERE sub = ?", now, info.sub);
    this.sql.exec("UPDATE users SET email_verified = ? WHERE sub = ?",
      String(info.email_verified) === "false" ? 0 : 1, info.sub);
    // With OWNER_EMAIL pinned, that account is the owner the moment it signs in —
    // and re-pointing (not just filling a blank) means a previous claim-code owner
    // is demoted rather than left sitting in the row.
    const pin = ownerPin(this.env);
    if (pin && String(info.email || "").toLowerCase() === pin && String(info.email_verified) !== "false") {
      if (this.ownerSub() !== info.sub) this.metaSet("owner", info.sub);
    }
    this.ensureCode(info.sub);
    const session = await this.makeSession(info.sub);
    const profile = this.userOf(info.sub);
    return { sessionToken: session, profile, created: profile.created, isNew: !existing };
  }

  async state(token, ip) {
    const me = await this.verifySession(token);
    const now = Date.now();
    if (!this.isOwnerSub(me)) { const nb = this.ipBan(ip); if (nb) throw new HttpError(403, nb); }
    const prev = this.sql.exec("SELECT playing, playing_at, last_seen FROM users WHERE sub = ?", me).toArray()[0];
    if (this.hubOverridden(prev, "", now)) this.sql.exec("UPDATE users SET last_seen = ? WHERE sub = ?", now, me);
    else {
      this.track("u:" + me, prev, "", now);
      this.sql.exec("UPDATE users SET last_seen = ?, playing = '', playing_at = ? WHERE sub = ?", now, now, me);
    }
    if (ip) this.sql.exec("UPDATE users SET last_ip = ? WHERE sub = ?", ip, me);
    if (!this.userOf(me).code) this.ensureCode(me);
    // Sweep stale invites so nobody is offered a room that has long since emptied.
    this.sql.exec("DELETE FROM invites WHERE created < ?", now - INVITE_TTL);
    const profile = this.userOf(me); // self — includes email + code
    const friends = this.sql.exec(
      `SELECT u.sub, u.name, u.picture,
              (u.last_seen > ?) AS online FROM friends f
       JOIN users u ON u.sub = f.b WHERE f.a = ? ORDER BY online DESC, u.name`,
      now - ONLINE_WINDOW, me).toArray();
    const incoming = this.sql.exec(
      `SELECT u.sub, u.name, u.picture, r.created FROM requests r
       JOIN users u ON u.sub = r.from_sub WHERE r.to_sub = ? ORDER BY r.created DESC`, me).toArray();
    const outgoing = this.sql.exec(
      `SELECT u.sub, u.name, u.picture, r.created FROM requests r
       JOIN users u ON u.sub = r.to_sub WHERE r.from_sub = ? ORDER BY r.created DESC`, me).toArray();
    const blocked = this.sql.exec(
      `SELECT u.sub, u.name, u.picture FROM blocks bl
       JOIN users u ON u.sub = bl.blocked WHERE bl.blocker = ? ORDER BY u.name`, me).toArray();
    const invitesIn = this.sql.exec(
      `SELECT i.game, i.room, i.created, u.sub, u.name, u.picture FROM invites i
       JOIN users u ON u.sub = i.from_sub WHERE i.to_sub = ? ORDER BY i.created DESC`, me).toArray();
    const invitesOut = this.sql.exec(
      `SELECT i.game, i.room, i.created, u.sub, u.name, u.picture FROM invites i
       JOIN users u ON u.sub = i.to_sub WHERE i.from_sub = ? ORDER BY i.created DESC`, me).toArray();
    const gifts = this.sql.exec(
      "SELECT id, tokens, games, icons, note, created FROM gifts WHERE sub = ? ORDER BY id", me).toArray()
      .map(g => ({ ...g, games: JSON.parse(g.games || "[]"), icons: JSON.parse(g.icons || "[]") }));
    return { profile, friends, incoming, outgoing, blocked, invitesIn, invitesOut, gifts,
             ...this.switches(), ...this.takePending("u:" + me),
             // `ownerPinned` lets the console explain *why* a non-owner can't claim.
             // The address itself is never sent — knowing it isn't the client's business.
             isOwner: this.isOwnerSub(me), ownerPinned: !!ownerPin(this.env),
             // Why the pin rejected *this* caller. Both facts are about the caller's own
             // row and neither reveals the pinned address, but together they turn a
             // locked-out owner's "it just doesn't work" into one readable line.
             ownerCheck: this.ownerCheck(me) };
  }

  // Cheap "am I still allowed in?" for game pages, which don't poll /api/me. A banned
  // session fails inside verifySession with 403 "banned:<reason>".
  // Works signed out too, so a guest's game page still learns about maintenance.
  // Guests ping with their device id (`gid`), which is how the owner can see, kick
  // and ban them. Kicks and pop-up messages ride back on the answer.
  async ping(token, game, gid, ip, ua, tos) {
    const out = { ok: true, ...this.switches() };
    const g = GAME_RE.test(String(game || "")) ? String(game) : "";
    const now = Date.now();
    if (token) {
      const me = await this.verifySession(token);
      out.isOwner = this.isOwnerSub(me);
      if (!out.isOwner) { const nb = this.ipBan(ip); if (nb) throw new HttpError(403, nb); }
      const prev = this.sql.exec("SELECT playing, playing_at, last_seen FROM users WHERE sub = ?", me).toArray()[0];
      const keep = this.hubOverridden(prev, g, now);
      if (!keep) this.track("u:" + me, prev, g, now);
      this.sql.exec("UPDATE users SET last_seen = ?, playing = ?, playing_at = ?, last_ip = COALESCE(?, last_ip), last_ua = COALESCE(?, last_ua) WHERE sub = ?",
        now, keep ? prev.playing : g, keep ? prev.playing_at : now, ip || null, ua ? String(ua).slice(0, 160) : null, me);
      return { ...out, ...this.takePending("u:" + me) };
    }
    const nb = this.ipBan(ip);
    if (nb) throw new HttpError(403, nb);
    if (!GID_RE.test(String(gid || ""))) return out;
    const gprev = this.guestOf(gid);
    const gkeep = this.hubOverridden(gprev, g, now);
    if (!gkeep) this.track("g:" + gid, gprev, g, now);
    this.sql.exec(
      `INSERT INTO guests (gid, ip, ua, created, last_seen, playing, playing_at) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(gid) DO UPDATE SET ip = excluded.ip, ua = excluded.ua, last_seen = excluded.last_seen,
         playing = excluded.playing, playing_at = excluded.playing_at`,
      gid, ip || "", String(ua || "").slice(0, 160), now, now, gkeep ? gprev.playing : g, gkeep ? gprev.playing_at : now);
    if (/^[0-9a-z.-]{1,32}$/i.test(String(tos || "")))
      this.sql.exec("UPDATE guests SET tos_version = ? WHERE gid = ?", String(tos), gid);
    const ban = this.guestBan(this.guestOf(gid));
    if (ban) throw new HttpError(403, ban);
    out.guest = guestName(gid);
    return { ...out, ...this.takePending("g:" + gid) };
  }

  // Log a move to `game` ('' = the hub) when it differs from where they were, or when
  // they're coming back after being offline. `prev` is their row before this ping.
  // The hub pings too, so with the hub and a game open in two tabs a hub ping would
  // flip them back to "in the hub" every few seconds. A game that pinged in the last
  // 20s wins; once its tab closes (or hides — hidden tabs don't ping) the hub takes over.
  hubOverridden(prev, game, now) {
    return game === "" && !!prev && !!prev.playing && now - (prev.playing_at || 0) < 20000;
  }
  track(who, prev, game, now) {
    const back = !prev || !prev.playing_at || now - prev.playing_at > ONLINE_WINDOW;
    if (!back && (prev.playing || "") === game) return;
    // Coming back after a gap: first mark when they went offline ("~"), so the last
    // session has a real end instead of running on until today.
    if (back && prev && prev.last_seen)
      this.sql.exec("INSERT INTO activity (who, game, at) VALUES (?, '~', ?)", who, prev.last_seen);
    this.sql.exec("INSERT INTO activity (who, game, at) VALUES (?, ?, ?)", who, game, now);
    if (Math.random() < 0.02) this.sql.exec("DELETE FROM activity WHERE at < ?", now - 7 * 86400000);
  }

  // The player ticked "I agree" on the terms screen.
  async acceptTos(token, version) {
    const me = await this.verifySession(token);
    const v = String(version || "").slice(0, 32);
    if (!/^[0-9a-z.-]{1,32}$/i.test(v)) throw new HttpError(400, "bad terms version");
    // Never move backwards: an old cached page posting an older version mustn't undo
    // a newer agreement (that is what kept re-asking people on every refresh).
    const cur = (this.userOf(me) || {}).tos_version;
    if (cur && String(cur).localeCompare(v, undefined, { numeric: true }) >= 0) return { ok: true, tos_version: cur };
    this.sql.exec("UPDATE users SET tos_version = ?, tos_at = ? WHERE sub = ?", v, Date.now(), me);
    return { ok: true, tos_version: v };
  }

  // The hub banked these gifts; drop them so no other device banks them again.
  async claimGifts(token, ids) {
    const me = await this.verifySession(token);
    for (const id of (Array.isArray(ids) ? ids : []).slice(0, 200))
      this.sql.exec("DELETE FROM gifts WHERE sub = ? AND id = ?", me, Number(id) || 0);
    return { ok: true };
  }

  // ══ ADMIN ══ Everything below answers only to the owner account.

  // One-time claim. The code is a Worker secret (`wrangler secret put ADMIN_CLAIM`), so
  // it never ships in the page, and the claim can only ever fire once.
  async adminClaim(token, code) {
    const me = await this.verifySession(token);
    if (ownerPin(this.env)) throw new HttpError(403, "this arcade is pinned to an owner account");
    if (this.ownerSub() === me) return { ok: true, already: true };
    if (this.ownerSub()) throw new HttpError(403, "owner already claimed");
    const secret = String((this.env && this.env.ADMIN_CLAIM) || "");
    if (!secret) throw new HttpError(503, "owner claim is not configured");
    if (!constantEq(String(code || ""), secret)) throw new HttpError(403, "bad claim code");
    this.metaSet("owner", me);
    return { ok: true };
  }

  async adminOverview(token) {
    await this.requireOwner(token);
    const now = Date.now();
    const n = (q, ...a) => this.sql.exec(q, ...a).toArray()[0].n;
    return {
      counts: {
        players:     n("SELECT COUNT(*) AS n FROM users"),
        online:      n("SELECT COUNT(*) AS n FROM users WHERE last_seen > ?", now - ONLINE_WINDOW),
        newToday:    n("SELECT COUNT(*) AS n FROM users WHERE created > ?", now - 86400000),
        banned:      n("SELECT COUNT(*) AS n FROM users WHERE banned"),
        friendships: Math.floor(n("SELECT COUNT(*) AS n FROM friends") / 2),
        requests:    n("SELECT COUNT(*) AS n FROM requests"),
        invites:     n("SELECT COUNT(*) AS n FROM invites"),
        reports:     n("SELECT COUNT(*) AS n FROM reports"),
        saves:       n("SELECT COUNT(*) AS n FROM saves"),
        guestsOnline: n("SELECT COUNT(*) AS n FROM guests WHERE last_seen > ?", now - ONLINE_WINDOW),
        guestsToday: n("SELECT COUNT(*) AS n FROM guests WHERE last_seen > ?", now - 86400000),
        ipBans:      n("SELECT COUNT(*) AS n FROM ip_bans"),
      },
      topGames: this.sql.exec(
        "SELECT game, COUNT(*) AS players FROM saves GROUP BY game ORDER BY players DESC LIMIT 10").toArray(),
      recent: this.sql.exec(
        "SELECT sub, name, created FROM users ORDER BY created DESC LIMIT 8").toArray(),
      // Who is on right now, and where: '' = the hub, else the game file they pinged from.
      live: this.sql.exec(
        `SELECT sub, name, picture, last_seen, CASE WHEN playing_at > ? THEN playing ELSE '' END AS playing
         FROM users WHERE last_seen > ? ORDER BY last_seen DESC LIMIT 50`,
        now - ONLINE_WINDOW, now - ONLINE_WINDOW).toArray(),
      liveGuests: this.sql.exec(
        `SELECT gid, label, last_seen, CASE WHEN playing_at > ? THEN playing ELSE '' END AS playing
         FROM guests WHERE last_seen > ? AND (banned IS NULL OR banned = 0) ORDER BY last_seen DESC LIMIT 50`,
        now - ONLINE_WINDOW, now - ONLINE_WINDOW).toArray().map(x => ({ ...x, name: x.label || guestName(x.gid) })),
      ...this.switches(),
    };
  }

  async adminPlayers(token, q, limit) {
    await this.requireOwner(token);
    const term = "%" + String(q || "").toLowerCase() + "%";
    const lim = Math.min(200, Math.max(1, Number(limit) || 100));
    return {
      owner: this.ownerSub(),
      players: this.sql.exec(
        `SELECT u.sub, u.name, u.email, u.picture, u.code, u.created, u.last_seen,
                u.banned, u.ban_reason, u.ban_until, u.tos_version, u.tos_at,
                CASE WHEN u.playing_at > ? THEN u.playing ELSE NULL END AS playing,
                (SELECT COUNT(*) FROM friends f WHERE f.a = u.sub)      AS friends,
                (SELECT COUNT(*) FROM saves s   WHERE s.sub = u.sub)    AS saves,
                (SELECT COUNT(*) FROM reports r WHERE r.reported = u.sub) AS reports,
                (SELECT COUNT(*) FROM gifts g   WHERE g.sub = u.sub)    AS gifts
         FROM users u
         WHERE ? = '%%' OR LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(u.code) LIKE ?
         ORDER BY u.last_seen DESC LIMIT ?`,
        Date.now() - ONLINE_WINDOW, term, term, term, term, lim).toArray(),
    };
  }

  async adminReports(token) {
    await this.requireOwner(token);
    return {
      reports: this.sql.exec(
        `SELECT r.id, r.reason, r.created,
                a.sub AS reporter_sub, a.name AS reporter, b.sub AS reported_sub,
                b.name AS reported, b.banned
         FROM reports r
         LEFT JOIN users a ON a.sub = r.reporter
         LEFT JOIN users b ON b.sub = r.reported
         ORDER BY r.created DESC LIMIT 100`).toArray(),
    };
  }

  async adminBan(token, sub, banned, reason, hours) {
    const me = await this.requireOwner(token);
    if (!sub || sub === me) throw new HttpError(400, "you can't ban yourself");
    if (!this.userOf(sub)) throw new HttpError(404, "no such player");
    const h = Math.max(0, Math.min(24 * 365, Number(hours) || 0));
    const why = banned ? String(reason || "").slice(0, 200) : null;
    this.sql.exec("UPDATE users SET banned = ?, ban_reason = ?, ban_until = ? WHERE sub = ?",
      banned ? 1 : null, why, banned && h ? Date.now() + h * 3600000 : null, sub);
    this.log(banned ? "ban" : "unban", sub, banned ? (h ? "for " + h + "h" : "permanent") + (why ? " — " + why : "") : "");
    // A ban should also stop anything already in flight.
    if (banned) {
      this.sql.exec("DELETE FROM invites WHERE from_sub = ? OR to_sub = ?", sub, sub);
      this.sql.exec("DELETE FROM requests WHERE from_sub = ? OR to_sub = ?", sub, sub);
    }
    return { ok: true, sub, banned: !!banned };
  }

  async adminDeletePlayer(token, sub) {
    const me = await this.requireOwner(token);
    if (!sub || sub === me) throw new HttpError(400, "you can't delete yourself");
    if (!this.userOf(sub)) throw new HttpError(404, "no such player");
    this.log("delete", sub, "");
    for (const q of [
      "DELETE FROM friends WHERE a = ? OR b = ?",
      "DELETE FROM requests WHERE from_sub = ? OR to_sub = ?",
      "DELETE FROM blocks WHERE blocker = ? OR blocked = ?",
      "DELETE FROM invites WHERE from_sub = ? OR to_sub = ?",
      "DELETE FROM reports WHERE reporter = ? OR reported = ?",
    ]) this.sql.exec(q, sub, sub);
    this.sql.exec("DELETE FROM saves WHERE sub = ?", sub);
    this.sql.exec("DELETE FROM gifts WHERE sub = ?", sub);
    this.sql.exec("DELETE FROM users WHERE sub = ?", sub);
    return { ok: true, sub };
  }

  // Queue tokens and/or unlocks for one player, or for every player with sub "*".
  // Negative tokens take them away. Games and icons are ids the hub already knows;
  // the shape is checked here, and the hub ignores any id it doesn't recognise.
  async adminGift(token, sub, tokens, games, icons, note) {
    await this.requireOwner(token);
    const n = Math.trunc(Number(tokens) || 0);
    if (Math.abs(n) > 1000000) throw new HttpError(400, "keep it under a million tokens");
    const ids = (v, re) => [...new Set((Array.isArray(v) ? v : []).map(String).filter(x => re.test(x)))].slice(0, 200);
    const g = ids(games, /^[a-z0-9-]{1,60}\.html$/i), ic = ids(icons, /^[a-z0-9-]{1,24}$/);
    const msg = String(note || "").trim().slice(0, 120);
    // A note on its own is a message from the owner.
    if (!n && !g.length && !ic.length && !msg) throw new HttpError(400, "that gift is empty");
    let targets;
    if (sub === "*") targets = this.sql.exec("SELECT sub FROM users WHERE banned IS NULL OR banned = 0").toArray().map(r => r.sub);
    else if (sub && this.userOf(sub)) targets = [sub];
    else throw new HttpError(404, "no such player");
    const now = Date.now(), gj = JSON.stringify(g), ij = JSON.stringify(ic);
    for (const t of targets)
      this.sql.exec("INSERT INTO gifts (sub, tokens, games, icons, note, created) VALUES (?, ?, ?, ?, ?, ?)",
        t, n, gj, ij, msg, now);
    const what = [n ? n + " tokens" : "", g.length ? g.length + " games" : "", ic.length ? ic.length + " icons" : ""].filter(Boolean);
    this.log(what.length ? "gift" : "message", sub, (what.join(", ") + (msg ? ' "' + msg + '"' : "")).trim());
    return { ok: true, players: targets.length };
  }

  // Banner across the top of every hub. Empty text takes it down.
  async adminAnnounce(token, text, hours, tone) {
    await this.requireOwner(token);
    const t = String(text || "").trim().slice(0, 240);
    const h = Math.max(0, Math.min(24 * 30, Number(hours) || 0));
    const a = t ? { id: Date.now(), text: t, tone: ["info", "warn", "party"].includes(tone) ? tone : "info",
                    until: h ? Date.now() + h * 3600000 : 0 } : null;
    this.metaSet("announce", JSON.stringify(a));
    this.log(t ? "announce" : "announce-off", "", t ? t + (h ? " (" + h + "h)" : "") : "");
    return { ok: true, announce: a };
  }

  // Closes the arcade to everyone but the owner (hub overlay; game pages bounce).
  async adminMaintenance(token, on, text) {
    await this.requireOwner(token);
    const m = on ? { on: true, text: String(text || "").trim().slice(0, 240), since: Date.now() } : null;
    this.metaSet("maintenance", JSON.stringify(m));
    this.log(on ? "maintenance-on" : "maintenance-off", "", m ? m.text : "");
    return { ok: true, maintenance: m };
  }

  // ── guests ──
  async adminGuests(token) {
    const me = await this.requireOwner(token);
    const now = Date.now();
    this.sql.exec("DELETE FROM guests WHERE last_seen < ? AND (banned IS NULL OR banned = 0)", now - GUEST_KEEP);
    this.sql.exec("DELETE FROM ip_bans WHERE until AND until <= ?", now);
    const myIp = (this.sql.exec("SELECT last_ip FROM users WHERE sub = ?", me).toArray()[0] || {}).last_ip || "";
    // Who else is behind the same address — a guest sharing a network with a player
    // is often that player, signed out.
    const byIp = {};
    for (const u of this.sql.exec("SELECT name, last_ip FROM users WHERE last_ip IS NOT NULL AND last_ip != ''").toArray())
      (byIp[u.last_ip] = byIp[u.last_ip] || []).push(u.name);
    const banned = new Set(this.sql.exec("SELECT ip FROM ip_bans").toArray().map(r => r.ip));
    const guests = this.sql.exec(
      `SELECT gid, label, ip, ua, created, last_seen, banned, ban_reason, ban_until, tos_version,
              CASE WHEN playing_at > ? THEN playing ELSE NULL END AS playing
       FROM guests ORDER BY last_seen DESC LIMIT 200`, now - ONLINE_WINDOW).toArray()
      .map(g => ({ ...g, name: g.label || guestName(g.gid), online: g.last_seen > now - ONLINE_WINDOW,
                   sameAsYou: !!myIp && g.ip === myIp, ipBanned: banned.has(g.ip), alsoOnIp: byIp[g.ip] || [] }));
    return { guests, myIp, ipBans: this.sql.exec("SELECT ip, reason, until, created, label FROM ip_bans ORDER BY created DESC").toArray(),
             guestsLocked: this.guestsLocked() };
  }

  // Ban a guest's device; `ip` also bans the network they're on. The owner's own
  // network is refused — that would ban everyone at your house but you.
  async adminGuestBan(token, gid, banned, reason, hours, alsoIp) {
    const me = await this.requireOwner(token);
    const g = this.guestOf(String(gid || ""));
    if (!g) throw new HttpError(404, "no such guest");
    const h = Math.max(0, Math.min(24 * 365, Number(hours) || 0));
    const why = banned ? String(reason || "").slice(0, 200) : null;
    const until = banned && h ? Date.now() + h * 3600000 : null;
    const name = g.label || guestName(g.gid);
    if (banned && alsoIp && g.ip) {
      const mine = (this.sql.exec("SELECT last_ip FROM users WHERE sub = ?", me).toArray()[0] || {}).last_ip;
      if (mine && mine === g.ip) throw new HttpError(400, "that guest is on your own network — ban the device only");
    }
    this.sql.exec("UPDATE guests SET banned = ?, ban_reason = ?, ban_until = ? WHERE gid = ?", banned ? 1 : null, why, until, g.gid);
    if (banned && alsoIp && g.ip)
      this.sql.exec(`INSERT INTO ip_bans (ip, reason, until, created, label) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(ip) DO UPDATE SET reason = excluded.reason, until = excluded.until, created = excluded.created, label = excluded.label`,
        g.ip, why, until, Date.now(), name);
    // Unbanning the device also lifts a network ban that came with it.
    if (!banned && g.ip) this.sql.exec("DELETE FROM ip_bans WHERE ip = ? AND label = ?", g.ip, name);
    this.log(banned ? "ban-guest" : "unban-guest", "", name + (banned ? (alsoIp ? " + network" : "") +
      (h ? " for " + h + "h" : " permanent") + (why ? " — " + why : "") : ""));
    return { ok: true };
  }

  async adminIpBan(token, ip, banned, reason, hours) {
    const me = await this.requireOwner(token);
    const addr = String(ip || "").trim().slice(0, 64);
    if (!/^[0-9a-f.:]{3,64}$/i.test(addr)) throw new HttpError(400, "that isn't an IP address");
    if (banned) {
      const mine = (this.sql.exec("SELECT last_ip FROM users WHERE sub = ?", me).toArray()[0] || {}).last_ip;
      if (mine && mine === addr) throw new HttpError(400, "that's your own network");
      const h = Math.max(0, Math.min(24 * 365, Number(hours) || 0));
      this.sql.exec(`INSERT INTO ip_bans (ip, reason, until, created, label) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(ip) DO UPDATE SET reason = excluded.reason, until = excluded.until, created = excluded.created`,
        addr, String(reason || "").slice(0, 200), h ? Date.now() + h * 3600000 : null, Date.now(), "");
    } else this.sql.exec("DELETE FROM ip_bans WHERE ip = ?", addr);
    this.log(banned ? "ban-ip" : "unban-ip", "", addr + (banned && reason ? " — " + reason : ""));
    return { ok: true };
  }

  async adminGuestLabel(token, gid, label) {
    await this.requireOwner(token);
    const l = String(label || "").trim().slice(0, 40);
    this.sql.exec("UPDATE guests SET label = ? WHERE gid = ?", l || null, String(gid || ""));
    return { ok: true };
  }

  // Everything the console's View panel shows about one player or guest: where they
  // are right now, their details, and the last week of moves between games.
  async adminView(token, target) {
    await this.requireOwner(token);
    const t = String(target || ""), now = Date.now();
    let who;
    if (t.indexOf("u:") === 0) {
      const u = this.sql.exec(
        `SELECT sub, name, email, picture, code, created, last_seen, playing, playing_at, last_ip AS ip, last_ua AS ua,
                banned, ban_reason, ban_until, tos_version, tos_at,
                (SELECT COUNT(*) FROM friends f WHERE f.a = users.sub) AS friends,
                (SELECT COUNT(*) FROM saves s WHERE s.sub = users.sub) AS saves,
                (SELECT COUNT(*) FROM reports r WHERE r.reported = users.sub) AS reports
         FROM users WHERE sub = ?`, t.slice(2)).toArray()[0];
      if (!u) throw new HttpError(404, "no such player");
      who = { kind: "player", ...u };
    } else if (t.indexOf("g:") === 0) {
      const g = this.guestOf(t.slice(2));
      if (!g) throw new HttpError(404, "no such guest");
      who = { kind: "guest", ...g, name: g.label || guestName(g.gid) };
    } else throw new HttpError(400, "bad target");
    who.online = !!who.last_seen && who.last_seen > now - ONLINE_WINDOW;
    who.playing = who.online && who.playing_at > now - ONLINE_WINDOW ? (who.playing || "") : null;
    const activity = this.sql.exec("SELECT game, at FROM activity WHERE who = ? ORDER BY at DESC LIMIT 60", t).toArray();
    return { who, activity, now };
  }

  // Kick: boot someone back to the hub with a message. Not a ban — they can come
  // straight back. target "u:<sub>", "g:<gid>", or "*" for everyone online but you.
  async adminKick(token, target, reason) {
    const me = await this.requireOwner(token);
    const why = String(reason || "").trim().slice(0, 160);
    const now = Date.now();
    let whos;
    if (target === "*") {
      whos = this.sql.exec("SELECT sub FROM users WHERE last_seen > ? AND sub != ?", now - ONLINE_WINDOW, me).toArray().map(r => "u:" + r.sub)
        .concat(this.sql.exec("SELECT gid FROM guests WHERE last_seen > ?", now - ONLINE_WINDOW).toArray().map(r => "g:" + r.gid));
    } else {
      const t = String(target || "");
      if (t === "u:" + me) throw new HttpError(400, "you can't kick yourself");
      if (!(/^u:/.test(t) && this.userOf(t.slice(2))) && !(/^g:/.test(t) && this.guestOf(t.slice(2))))
        throw new HttpError(404, "nobody by that id");
      whos = [t];
    }
    for (const w of whos) this.sql.exec("INSERT INTO pending (who, kind, text, created) VALUES (?, 'kick', ?, ?)", w, why, now);
    this.sql.exec("DELETE FROM pending WHERE created < ?", now - 86400000);
    const label = target === "*" ? "everyone online" : this.whoName(target);
    this.log("kick", "", label + (why ? " — " + why : ""));
    return { ok: true, kicked: whos.length };
  }

  // A pop-up on someone's screen right now — works mid-game and for guests.
  async adminPopup(token, target, text) {
    const me = await this.requireOwner(token);
    const t = String(text || "").trim().slice(0, 200);
    if (!t) throw new HttpError(400, "type a message first");
    const now = Date.now();
    let whos;
    if (target === "*") {
      whos = this.sql.exec("SELECT sub FROM users WHERE last_seen > ? AND sub != ?", now - ONLINE_WINDOW, me).toArray().map(r => "u:" + r.sub)
        .concat(this.sql.exec("SELECT gid FROM guests WHERE last_seen > ? AND (banned IS NULL OR banned = 0)", now - ONLINE_WINDOW).toArray().map(r => "g:" + r.gid));
    } else whos = [String(target || "")];
    for (const w of whos) this.sql.exec("INSERT INTO pending (who, kind, text, created) VALUES (?, 'msg', ?, ?)", w, t, now);
    this.log("popup", "", (target === "*" ? "everyone online" : this.whoName(target)) + ' "' + t + '"');
    return { ok: true, sent: whos.length };
  }
  whoName(t) {
    t = String(t || "");
    if (t.indexOf("u:") === 0) { const u = this.userOf(t.slice(2)); return u ? u.name : t; }
    if (t.indexOf("g:") === 0) { const g = this.guestOf(t.slice(2)); return g ? (g.label || guestName(g.gid)) : t; }
    return t;
  }

  // Every open hub and game reloads on its next ping — for pushing an update out.
  async adminReloadAll(token) {
    await this.requireOwner(token);
    this.metaSet("reload", String(Date.now()));
    this.log("reload-all", "", "");
    return { ok: true };
  }

  // Switch individual games off (and back on). Off games can't be opened by anyone
  // but the owner, and players already in one are sent back to the hub.
  async adminGames(token, disabled) {
    await this.requireOwner(token);
    const list = [...new Set((Array.isArray(disabled) ? disabled : []).map(String).filter(x => GAME_RE.test(x)))].slice(0, 200);
    const before = this.disabledGames();
    this.metaSet("disabled", JSON.stringify(list));
    const off = list.filter(x => !before.includes(x)), on = before.filter(x => !list.includes(x));
    this.log("games", "", [off.length ? "off: " + off.join(", ") : "", on.length ? "on: " + on.join(", ") : ""].filter(Boolean).join(" · "));
    return { ok: true, disabled: list };
  }

  async adminGuestsLock(token, on) {
    await this.requireOwner(token);
    this.metaSet("guestsLocked", on ? "1" : "0");
    this.log(on ? "guests-off" : "guests-on", "", "");
    return { ok: true, guestsLocked: !!on };
  }

  async adminLog(token) {
    await this.requireOwner(token);
    return { log: this.sql.exec("SELECT id, at, action, target, detail FROM admin_log ORDER BY id DESC LIMIT 200").toArray() };
  }

  async adminDismissReport(token, id) {
    await this.requireOwner(token);
    this.log("dismiss-report", "", "#" + (Number(id) || 0));
    this.sql.exec("DELETE FROM reports WHERE id = ?", Number(id) || 0);
    return { ok: true };
  }

  // ── game invites ──
  // Invite a friend into a multiplayer room. The room code is minted here so both
  // players are guaranteed to land in the same room without typing anything.
  // `wantRoom` lets a game that's already sitting in a room invite people into *that*
  // room (otherwise the friend would join an empty one while the host waits elsewhere).
  async invite(token, otherSub, game, wantRoom) {
    const me = await this.verifySession(token);
    const g = String(game || "").trim();
    if (!g || g.length > 64 || !/^[a-z0-9-]+\.html$/i.test(g)) throw new HttpError(400, "unknown game");
    if (!otherSub || otherSub === me) throw new HttpError(400, "invalid target");
    if (!this.isFriend(me, otherSub)) throw new HttpError(403, "You can only invite friends.");
    if (this.isBlockedBetween(me, otherSub)) throw new HttpError(403, "Unable to invite this player.");
    const asked = String(wantRoom || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    // Reuse the room from a still-fresh invite so a double-click doesn't split the two
    // players across two rooms; otherwise mint a new one.
    const existing = this.sql.exec(
      "SELECT room, created FROM invites WHERE from_sub = ? AND to_sub = ? AND game = ?",
      me, otherSub, g).toArray()[0];
    const now = Date.now();
    const room = (asked.length >= 3 && asked.length <= 8) ? asked
      : (existing && now - existing.created < INVITE_TTL) ? existing.room
      : makeCode(ROOM_LEN);
    this.sql.exec(
      `INSERT INTO invites (from_sub, to_sub, game, room, created) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(from_sub, to_sub, game) DO UPDATE SET room=excluded.room, created=excluded.created`,
      me, otherSub, g, room, now);
    return { ...(await this.state(token)), message: "Invite sent.", room, game: g };
  }

  // Accept: hand the room back to the client so it can open the game, then clear the
  // invite (and any mirror invite the two players sent each other for the same game).
  async inviteAccept(token, fromSub, game) {
    const me = await this.verifySession(token);
    const row = this.sql.exec(
      "SELECT room, created FROM invites WHERE from_sub = ? AND to_sub = ? AND game = ?",
      fromSub, me, game).toArray()[0];
    if (!row) throw new HttpError(404, "That invite is no longer available.");
    if (Date.now() - row.created > INVITE_TTL) {
      this.sql.exec("DELETE FROM invites WHERE from_sub = ? AND to_sub = ? AND game = ?", fromSub, me, game);
      throw new HttpError(410, "That invite expired.");
    }
    this.sql.exec("DELETE FROM invites WHERE from_sub = ? AND to_sub = ? AND game = ?", fromSub, me, game);
    this.sql.exec("DELETE FROM invites WHERE from_sub = ? AND to_sub = ? AND game = ?", me, fromSub, game);
    return { ...(await this.state(token)), room: row.room, game };
  }

  // Decline an invite you received, or cancel one you sent.
  async inviteDecline(token, otherSub, game) {
    const me = await this.verifySession(token);
    this.sql.exec("DELETE FROM invites WHERE from_sub = ? AND to_sub = ? AND game = ?", otherSub, me, game);
    this.sql.exec("DELETE FROM invites WHERE from_sub = ? AND to_sub = ? AND game = ?", me, otherSub, game);
    return this.state(token);
  }

  // Add a friend by their 6-character code (replaces open name/email search).
  async addByCode(token, rawCode) {
    const me = await this.verifySession(token);
    const code = (rawCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length !== CODE_LEN) throw new HttpError(400, "Enter a valid 6-character code.");
    const target = this.sql.exec("SELECT sub FROM users WHERE code = ?", code).toArray()[0];
    if (!target) throw new HttpError(404, "No player has that code.");
    const other = target.sub;
    if (other === me) throw new HttpError(400, "That's your own code.");
    if (this.isBlockedBetween(me, other)) throw new HttpError(403, "Unable to add this player.");
    const already = this.sql.exec("SELECT 1 FROM friends WHERE a = ? AND b = ?", me, other).toArray()[0];
    if (already) return { ...(await this.state(token)), message: "You're already friends." };
    // If they already requested me, accept instead of creating a duplicate.
    const reverse = this.sql.exec("SELECT 1 FROM requests WHERE from_sub = ? AND to_sub = ?", other, me).toArray()[0];
    if (reverse) { await this.accept(token, other); return { ...(await this.state(token)), message: "You're now friends!" }; }
    this.sql.exec("INSERT OR IGNORE INTO requests (from_sub, to_sub, created) VALUES (?, ?, ?)", me, other, Date.now());
    return { ...(await this.state(token)), message: "Friend request sent." };
  }

  async accept(token, fromSub) {
    const me = await this.verifySession(token);
    const req = this.sql.exec("SELECT 1 FROM requests WHERE from_sub = ? AND to_sub = ?", fromSub, me).toArray()[0];
    if (!req) throw new HttpError(404, "no such request");
    if (this.isBlockedBetween(me, fromSub)) throw new HttpError(403, "Unable to add this player.");
    const now = Date.now();
    this.sql.exec("DELETE FROM requests WHERE from_sub = ? AND to_sub = ?", fromSub, me);
    this.sql.exec("DELETE FROM requests WHERE from_sub = ? AND to_sub = ?", me, fromSub);
    this.sql.exec("INSERT OR IGNORE INTO friends (a, b, created) VALUES (?, ?, ?)", me, fromSub, now);
    this.sql.exec("INSERT OR IGNORE INTO friends (a, b, created) VALUES (?, ?, ?)", fromSub, me, now);
    return this.state(token);
  }

  // Decline an incoming request OR cancel one you sent.
  async decline(token, otherSub) {
    const me = await this.verifySession(token);
    this.sql.exec("DELETE FROM requests WHERE from_sub = ? AND to_sub = ?", otherSub, me);
    this.sql.exec("DELETE FROM requests WHERE from_sub = ? AND to_sub = ?", me, otherSub);
    return this.state(token);
  }

  async unfriend(token, otherSub) {
    const me = await this.verifySession(token);
    this.sql.exec("DELETE FROM friends WHERE a = ? AND b = ?", me, otherSub);
    this.sql.exec("DELETE FROM friends WHERE a = ? AND b = ?", otherSub, me);
    this.dropInvitesBetween(me, otherSub);
    return this.state(token);
  }

  dropInvitesBetween(x, y) {
    this.sql.exec("DELETE FROM invites WHERE (from_sub = ? AND to_sub = ?) OR (from_sub = ? AND to_sub = ?)",
      x, y, y, x);
  }

  // Block a user: severs friendship + pending requests and prevents future contact.
  async block(token, otherSub) {
    const me = await this.verifySession(token);
    if (!otherSub || otherSub === me) throw new HttpError(400, "invalid target");
    this.sql.exec("INSERT OR IGNORE INTO blocks (blocker, blocked, created) VALUES (?, ?, ?)", me, otherSub, Date.now());
    this.sql.exec("DELETE FROM friends WHERE a = ? AND b = ?", me, otherSub);
    this.sql.exec("DELETE FROM friends WHERE a = ? AND b = ?", otherSub, me);
    this.sql.exec("DELETE FROM requests WHERE from_sub = ? AND to_sub = ?", me, otherSub);
    this.sql.exec("DELETE FROM requests WHERE from_sub = ? AND to_sub = ?", otherSub, me);
    this.dropInvitesBetween(me, otherSub);
    return this.state(token);
  }

  async unblock(token, otherSub) {
    const me = await this.verifySession(token);
    this.sql.exec("DELETE FROM blocks WHERE blocker = ? AND blocked = ?", me, otherSub);
    return this.state(token);
  }

  // Report a user, then block them automatically for the reporter's safety.
  async report(token, otherSub, reason) {
    const me = await this.verifySession(token);
    if (!otherSub || otherSub === me) throw new HttpError(400, "invalid target");
    this.sql.exec("INSERT INTO reports (reporter, reported, reason, created) VALUES (?, ?, ?, ?)",
      me, otherSub, String(reason || "").slice(0, 500), Date.now());
    return this.block(token, otherSub);
  }
}

// ── Room: one Durable Object per game room, relaying messages between players ──
// This replaces the old local quoridor-server.js so online play works straight from
// GitHub Pages. The protocol is deliberately generic: `create`/`join` establish the
// room, and every other message is forwarded verbatim to the other players — so any
// multiplayer game can use it, not just Quoridor.
export class Room extends DurableObject {
  fetch(request) {
    const url = new URL(request.url);
    const role = url.searchParams.get("role") === "host" ? "host" : "guest";
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("expected websocket", { status: 426 });
    }
    const pair = new WebSocketPair();
    // Hibernation API: the tag records which side this socket is, and survives eviction.
    this.ctx.acceptWebSocket(pair[1], [role]);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  send(ws, obj) {
    try { ws.send(JSON.stringify(obj)); } catch (e) { /* socket already gone */ }
  }
  hosts() { return this.ctx.getWebSockets("host"); }
  guests() { return this.ctx.getWebSockets("guest"); }
  isHost(ws) { return this.ctx.getTags(ws).includes("host"); }
  // Everyone in the room except the sender.
  others(ws) { return this.ctx.getWebSockets().filter((s) => s !== ws); }

  // How many players this room holds. Two-player games never send `max`, so the
  // default keeps their "that game is full" behaviour exactly as it was; party
  // games (3-16 players) declare a bigger room when the host creates it.
  async roomMax() {
    if (this._max) return this._max;
    const v = await this.ctx.storage.get("max");
    this._max = Math.max(2, Math.min(ROOM_MAX_PLAYERS, v || 2));
    return this._max;
  }

  async webSocketMessage(ws, raw) {
    let m;
    try { m = JSON.parse(raw); } catch { return; }

    if (m.t === "create") {
      // A host coming back after a dropped connection replaces its old, half-dead socket.
      if (m.resume) {
        for (const s of this.hosts()) if (s !== ws) { try { s.close(1000, "replaced"); } catch (e) { /* already gone */ } }
      }
      // A second host on the same code means a code collision — bounce the newcomer.
      else if (this.hosts().length > 1) {
        this.send(ws, { t: "error", msg: "That code is already in use — try again." });
        return;
      }
      const max = Math.max(2, Math.min(ROOM_MAX_PLAYERS, (m.max | 0) || 2));
      this._max = max;
      await this.ctx.storage.put("max", max);   // survives hibernation + code reuse
      this.send(ws, { t: "created", code: m.code || "", color: "blue", max });
      return;
    }

    if (m.t === "join") {
      if (!this.hosts().length) {
        this.send(ws, { t: "error", msg: "No game with that code." });
        return;
      }
      const max = await this.roomMax();
      // The joining socket is already counted here: host + guests must fit in `max`.
      if (this.guests().length + 1 > max) {
        this.send(ws, { t: "error", msg: "That game is full." });
        return;
      }
      this.send(ws, { t: "joined", color: "red", max, seat: this.guests().length });
      for (const s of this.ctx.getWebSockets()) this.send(s, { t: "start" });
      return;
    }

    // Everything else (moves, rematch requests, chat…) is relayed untouched.
    for (const s of this.others(ws)) this.send(s, m);
  }

  webSocketClose(ws) {
    for (const s of this.others(ws)) this.send(s, { t: "left" });
  }
  webSocketError(ws) {
    for (const s of this.others(ws)) this.send(s, { t: "left" });
  }
}

// ── Worker router ──
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(origin) });

    const url = new URL(request.url);
    const path = url.pathname;

    // Multiplayer relay. Routed before anything else because a WebSocket upgrade
    // must not be wrapped in the JSON/CORS helpers.
    if (path === "/ws") {
      const code = (url.searchParams.get("room") || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (code.length < 3 || code.length > 8) return new Response("bad room code", { status: 400 });
      return env.ROOM.getByName("room:" + code).fetch(request);
    }

    const stub = env.HUB.getByName("global");
    const auth = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const ip = request.headers.get("CF-Connecting-IP") || "";

    try {
      if (path === "/" || path === "/api/health") return json(await stub.health(), 200, origin);

      if (path === "/api/login" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        return json(await stub.login(body.idToken, ip), 200, origin);
      }
      if (path === "/api/me") return json(await stub.state(auth, ip), 200, origin);
      if (path === "/api/ping") return json(await stub.ping(auth, url.searchParams.get("game"),
        url.searchParams.get("gid"), ip, request.headers.get("User-Agent"), url.searchParams.get("tos")), 200, origin);

      // Game saves — the cloud half of glitchbox-save.js.
      if (path === "/api/load") {
        return json(await stub.loadGame(auth, url.searchParams.get("game") || ""), 200, origin);
      }
      if (path === "/api/saves") return json(await stub.listSaves(auth), 200, origin);

      // Owner-only console. Each of these re-checks ownership inside the Hub.
      if (path === "/api/admin/overview") return json(await stub.adminOverview(auth), 200, origin);
      if (path === "/api/admin/players") {
        return json(await stub.adminPlayers(auth, url.searchParams.get("q"),
          url.searchParams.get("limit")), 200, origin);
      }
      if (path === "/api/admin/reports") return json(await stub.adminReports(auth), 200, origin);
      if (path === "/api/admin/log") return json(await stub.adminLog(auth), 200, origin);
      if (path === "/api/admin/guests") return json(await stub.adminGuests(auth), 200, origin);
      if (path === "/api/admin/view") return json(await stub.adminView(auth, url.searchParams.get("target")), 200, origin);

      if (request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (path === "/api/tos")      return json(await stub.acceptTos(auth, body.version), 200, origin);
        if (path === "/api/avatar")   return json(await stub.setAvatar(auth, body.picture), 200, origin);
        if (path === "/api/admin/claim")  return json(await stub.adminClaim(auth, body.code), 200, origin);
        if (path === "/api/admin/ban")    return json(await stub.adminBan(auth, body.sub, body.banned, body.reason, body.hours), 200, origin);
        if (path === "/api/admin/announce")    return json(await stub.adminAnnounce(auth, body.text, body.hours, body.tone), 200, origin);
        if (path === "/api/admin/maintenance") return json(await stub.adminMaintenance(auth, body.on, body.text), 200, origin);
        if (path === "/api/admin/delete") return json(await stub.adminDeletePlayer(auth, body.sub), 200, origin);
        if (path === "/api/admin/gift")   return json(await stub.adminGift(auth, body.sub, body.tokens, body.games, body.icons, body.note), 200, origin);
        if (path === "/api/gifts/claim")  return json(await stub.claimGifts(auth, body.ids), 200, origin);
        if (path === "/api/admin/guest-ban")   return json(await stub.adminGuestBan(auth, body.gid, body.banned, body.reason, body.hours, body.ip), 200, origin);
        if (path === "/api/admin/guest-label") return json(await stub.adminGuestLabel(auth, body.gid, body.label), 200, origin);
        if (path === "/api/admin/ip-ban")      return json(await stub.adminIpBan(auth, body.ip, body.banned, body.reason, body.hours), 200, origin);
        if (path === "/api/admin/kick")        return json(await stub.adminKick(auth, body.target, body.reason), 200, origin);
        if (path === "/api/admin/popup")       return json(await stub.adminPopup(auth, body.target, body.text), 200, origin);
        if (path === "/api/admin/reload-all")  return json(await stub.adminReloadAll(auth), 200, origin);
        if (path === "/api/admin/games")       return json(await stub.adminGames(auth, body.disabled), 200, origin);
        if (path === "/api/admin/guests-lock") return json(await stub.adminGuestsLock(auth, body.on), 200, origin);
        if (path === "/api/admin/dismiss-report") return json(await stub.adminDismissReport(auth, body.id), 200, origin);
        if (path === "/api/add-by-code") return json(await stub.addByCode(auth, body.code), 200, origin);
        if (path === "/api/accept")   return json(await stub.accept(auth, body.sub), 200, origin);
        if (path === "/api/decline")  return json(await stub.decline(auth, body.sub), 200, origin);
        if (path === "/api/unfriend") return json(await stub.unfriend(auth, body.sub), 200, origin);
        if (path === "/api/block")    return json(await stub.block(auth, body.sub), 200, origin);
        if (path === "/api/unblock")  return json(await stub.unblock(auth, body.sub), 200, origin);
        if (path === "/api/report")   return json(await stub.report(auth, body.sub, body.reason), 200, origin);
        if (path === "/api/invite")         return json(await stub.invite(auth, body.sub, body.game, body.room), 200, origin);
        if (path === "/api/invite-accept")  return json(await stub.inviteAccept(auth, body.sub, body.game), 200, origin);
        if (path === "/api/invite-decline") return json(await stub.inviteDecline(auth, body.sub, body.game), 200, origin);
        if (path === "/api/save")        return json(await stub.saveGame(auth, body.game, body.box), 200, origin);
        if (path === "/api/save-delete") return json(await stub.deleteGame(auth, body.game), 200, origin);
      }
      return json({ error: "not found" }, 404, origin);
    } catch (e) {
      let status = 500, msg = (e && e.message) || "server error";
      const m = /^(\d{3}):([\s\S]*)$/.exec(msg);
      if (m) { status = +m[1]; msg = m[2]; }
      else if (e && e.status) { status = e.status; }
      return json({ error: msg }, status, origin);
    }
  },
};
