import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

let db = null;

let statements = null;

function getStatements() {
  if (!statements && db) {
    statements = {
      saveSession: db.prepare(`
        INSERT INTO sessions (client_id, partner_id, is_waiting, queued_position, last_seen_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(client_id) DO UPDATE SET
          partner_id = excluded.partner_id,
          is_waiting = excluded.is_waiting,
          queued_position = excluded.queued_position,
          last_seen_at = excluded.last_seen_at;
      `),
      updateLastSeen: db.prepare('UPDATE sessions SET last_seen_at = ? WHERE client_id = ?'),
      updatePartner: db.prepare('UPDATE sessions SET partner_id = ?, is_waiting = 0, last_seen_at = ? WHERE client_id = ?'),
      deleteSession: db.prepare('DELETE FROM sessions WHERE client_id = ?'),
      pruneSessions: db.prepare('DELETE FROM sessions WHERE last_seen_at < ?'),
      selectSessions: db.prepare('SELECT client_id, partner_id, is_waiting, queued_position, last_seen_at, created_at FROM sessions'),
      saveBlockedPair: db.prepare(`
        INSERT INTO blocked_pairs (pair_key, expires_at)
        VALUES (?, ?)
        ON CONFLICT(pair_key) DO UPDATE SET expires_at = excluded.expires_at
      `),
      deleteBlockedPair: db.prepare('DELETE FROM blocked_pairs WHERE pair_key = ?'),
      pruneBlockedPairs: db.prepare('DELETE FROM blocked_pairs WHERE expires_at <= ?'),
      selectBlockedPairs: db.prepare('SELECT pair_key, expires_at FROM blocked_pairs'),
      saveBannedUser: db.prepare(`
        INSERT INTO banned_users (client_id, reason, banned_at, expires_at, banned_by)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(client_id) DO UPDATE SET
          reason = excluded.reason,
          banned_at = excluded.banned_at,
          expires_at = excluded.expires_at,
          banned_by = excluded.banned_by;
      `),
      deleteBannedUser: db.prepare('DELETE FROM banned_users WHERE client_id = ?'),
      selectBannedUser: db.prepare('SELECT client_id, reason, banned_at, expires_at, banned_by FROM banned_users WHERE client_id = ?'),
      selectActiveBannedUsers: db.prepare('SELECT client_id, reason, banned_at, expires_at, banned_by FROM banned_users WHERE expires_at > ? ORDER BY banned_at DESC'),
      pruneExpiredBans: db.prepare('DELETE FROM banned_users WHERE expires_at <= ?')
    };
  }
  return statements;
}

/**
 * Initializes SQLite database connection and sets up required tables.
 * @param {string} [customPath]
 * @returns {DatabaseSync}
 */
export function initSessionDb(customPath) {
  if (db) return db;

  const dbPath = customPath || process.env.SQLITE_DB_PATH || path.resolve('logs/sessions.db');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      client_id TEXT PRIMARY KEY,
      partner_id TEXT,
      is_waiting INTEGER NOT NULL DEFAULT 0,
      queued_position INTEGER,
      last_seen_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_partner ON sessions(partner_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_last_seen ON sessions(last_seen_at);

    CREATE TABLE IF NOT EXISTS blocked_pairs (
      pair_key TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS banned_users (
      client_id TEXT PRIMARY KEY,
      reason TEXT NOT NULL,
      banned_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      banned_by TEXT DEFAULT 'admin'
    );
    CREATE INDEX IF NOT EXISTS idx_banned_expires ON banned_users(expires_at);
  `);

  statements = null;
  getStatements();

  return db;
}

/**
 * Persists or updates a session in SQLite.
 * @param {object} session
 */
export function saveSession(session) {
  if (!db || !session?.clientId) return;

  const stmts = getStatements();
  if (!stmts) return;

  stmts.saveSession.run(
    session.clientId,
    session.partnerId || null,
    session.waiting ? 1 : 0,
    Number.isInteger(session.queuedPosition) ? session.queuedPosition : null,
    session.lastSeenAt || Date.now(),
    session.createdAt || Date.now()
  );
}

/**
 * Updates last seen timestamp for a session.
 * @param {string} clientId
 * @param {number} [timestamp]
 */
export function updateSessionLastSeen(clientId, timestamp = Date.now()) {
  if (!db || !clientId) return;
  const stmts = getStatements();
  stmts?.updateLastSeen.run(timestamp, clientId);
}

/**
 * Updates partner relationship for a session.
 * @param {string} clientId
 * @param {string|null} partnerId
 */
export function updateSessionPartner(clientId, partnerId) {
  if (!db || !clientId) return;
  const stmts = getStatements();
  stmts?.updatePartner.run(partnerId || null, Date.now(), clientId);
}

/**
 * Deletes a session from SQLite.
 * @param {string} clientId
 */
export function deleteSession(clientId) {
  if (!db || !clientId) return;
  const stmts = getStatements();
  stmts?.deleteSession.run(clientId);
}

/**
 * Loads valid (non-expired) sessions upon server startup.
 * Prunes sessions that exceeded the grace period.
 * @param {number} reconnectGraceMs
 * @returns {Array<object>}
 */
export function loadActiveSessions(reconnectGraceMs) {
  if (!db) return [];
  const stmts = getStatements();
  if (!stmts) return [];

  const now = Date.now();
  const cutoff = now - reconnectGraceMs;

  // Prune sessions older than grace window
  stmts.pruneSessions.run(cutoff);

  // Query remaining active sessions
  const rows = stmts.selectSessions.all();

  const activeClientIds = new Set(rows.map((r) => r.client_id));

  // Sanitize partner links: if partner expired, unlink
  return rows.map((r) => {
    let partnerId = r.partner_id;
    if (partnerId && !activeClientIds.has(partnerId)) {
      partnerId = null;
      updateSessionPartner(r.client_id, null);
    }

    return {
      clientId: r.client_id,
      partnerId,
      waiting: Boolean(r.is_waiting),
      queuedPosition: r.queued_position,
      lastSeenAt: r.last_seen_at,
      createdAt: r.created_at
    };
  });
}

/**
 * Persists a blocked pair rule with expiration.
 * @param {string} pairKey
 * @param {number} expiresAt
 */
export function saveBlockedPair(pairKey, expiresAt) {
  if (!db || !pairKey) return;
  const stmts = getStatements();
  stmts?.saveBlockedPair.run(pairKey, expiresAt);
}

/**
 * Removes a blocked pair rule.
 * @param {string} pairKey
 */
export function deleteBlockedPair(pairKey) {
  if (!db || !pairKey) return;
  const stmts = getStatements();
  stmts?.deleteBlockedPair.run(pairKey);
}

/**
 * Loads unexpired blocked pairs upon startup.
 * @returns {Array<{ pairKey: string, expiresAt: number }>}
 */
export function loadActiveBlockedPairs() {
  if (!db) return [];
  const stmts = getStatements();
  if (!stmts) return [];

  const now = Date.now();
  stmts.pruneBlockedPairs.run(now);

  const rows = stmts.selectBlockedPairs.all();

  return rows.map((r) => ({
    pairKey: r.pair_key,
    expiresAt: r.expires_at
  }));
}

/**
 * Persists or updates a banned user in SQLite.
 * @param {object} ban
 * @param {string} ban.clientId
 * @param {string} ban.reason
 * @param {number} [ban.bannedAt]
 * @param {number} ban.expiresAt
 * @param {string} [ban.bannedBy]
 */
export function saveBannedUser({ clientId, reason, bannedAt = Date.now(), expiresAt, bannedBy = 'admin' }) {
  if (!db || !clientId || !reason || !expiresAt) return;
  const stmts = getStatements();
  stmts?.saveBannedUser.run(clientId, reason, bannedAt, expiresAt, bannedBy);
}

/**
 * Removes a ban for a client UUID.
 * @param {string} clientId
 */
export function deleteBannedUser(clientId) {
  if (!db || !clientId) return;
  const stmts = getStatements();
  stmts?.deleteBannedUser.run(clientId);
}

/**
 * Retrieves active ban info for a client UUID if not expired.
 * Automatically prunes if expired.
 * @param {string} clientId
 * @returns {{ clientId: string, reason: string, bannedAt: number, expiresAt: number, bannedBy: string } | null}
 */
export function getBannedUser(clientId) {
  if (!db || !clientId) return null;
  const stmts = getStatements();
  if (!stmts) return null;

  const row = stmts.selectBannedUser.get(clientId);
  if (!row) return null;

  if (row.expires_at <= Date.now()) {
    stmts.deleteBannedUser.run(clientId);
    return null;
  }

  return {
    clientId: row.client_id,
    reason: row.reason,
    bannedAt: row.banned_at,
    expiresAt: row.expires_at,
    bannedBy: row.banned_by
  };
}

/**
 * Loads all unexpired banned users and prunes expired ones.
 * @returns {Array<{ clientId: string, reason: string, bannedAt: number, expiresAt: number, bannedBy: string }>}
 */
export function loadActiveBannedUsers() {
  if (!db) return [];
  const stmts = getStatements();
  if (!stmts) return [];

  const now = Date.now();
  stmts.pruneExpiredBans.run(now);

  const rows = stmts.selectActiveBannedUsers.all(now);
  return rows.map((r) => ({
    clientId: r.client_id,
    reason: r.reason,
    bannedAt: r.banned_at,
    expiresAt: r.expires_at,
    bannedBy: r.banned_by
  }));
}

/**
 * Checks whether a client UUID is actively banned.
 * @param {string} clientId
 * @returns {boolean}
 */
export function isUserBanned(clientId) {
  return Boolean(getBannedUser(clientId));
}

/**
 * Closes the database connection cleanly.
 */
export function closeSessionDb() {
  if (db) {
    try {
      db.close();
    } catch (e) {
      console.error('Error closing session SQLite DB:', e);
    }
    db = null;
    statements = null;
  }
}
