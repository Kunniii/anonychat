import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  initSessionDb,
  saveSession,
  deleteSession,
  loadActiveSessions,
  saveBlockedPair,
  deleteBlockedPair,
  loadActiveBlockedPairs,
  saveBannedUser,
  deleteBannedUser,
  getBannedUser,
  loadActiveBannedUsers,
  isUserBanned,
  closeSessionDb
} from '../sessionStore.js';

describe('SQLite Session & State Persistence', () => {
  const testDbPath = path.resolve('logs/test-sessions.db');

  before(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  after(() => {
    closeSessionDb();
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch {}
    }
  });

  it('initializes sqlite database and schema', () => {
    const db = initSessionDb(testDbPath);
    assert.ok(db, 'Database should be initialized');
  });

  it('persists active sessions and recovers them on reboot', () => {
    const clientA = '00000000-0000-4000-8000-000000000001';
    const clientB = '00000000-0000-4000-8000-000000000002';
    const clientC = '00000000-0000-4000-8000-000000000003';

    // A and B paired
    saveSession({
      clientId: clientA,
      partnerId: clientB,
      waiting: false,
      queuedPosition: null,
      lastSeenAt: Date.now(),
      createdAt: Date.now() - 5000
    });

    saveSession({
      clientId: clientB,
      partnerId: clientA,
      waiting: false,
      queuedPosition: null,
      lastSeenAt: Date.now(),
      createdAt: Date.now() - 5000
    });

    // C waiting in queue
    saveSession({
      clientId: clientC,
      partnerId: null,
      waiting: true,
      queuedPosition: 0,
      lastSeenAt: Date.now(),
      createdAt: Date.now() - 2000
    });

    // Simulate server restart: close DB and re-open
    closeSessionDb();
    initSessionDb(testDbPath);

    const activeSessions = loadActiveSessions(120_000);
    assert.equal(activeSessions.length, 3, 'Should recover all 3 non-expired sessions');

    const restoredA = activeSessions.find(s => s.clientId === clientA);
    const restoredB = activeSessions.find(s => s.clientId === clientB);
    const restoredC = activeSessions.find(s => s.clientId === clientC);

    assert.ok(restoredA, 'Client A should be restored');
    assert.equal(restoredA.partnerId, clientB, 'Client A partner should be Client B');
    assert.equal(restoredA.waiting, false);

    assert.ok(restoredB, 'Client B should be restored');
    assert.equal(restoredB.partnerId, clientA, 'Client B partner should be Client A');
    assert.equal(restoredB.waiting, false);

    assert.ok(restoredC, 'Client C should be restored');
    assert.equal(restoredC.partnerId, null);
    assert.equal(restoredC.waiting, true);
    assert.equal(restoredC.queuedPosition, 0);
  });

  it('prunes expired sessions beyond reconnect grace period', () => {
    const expiredClient = '00000000-0000-4000-8000-000000000099';
    saveSession({
      clientId: expiredClient,
      partnerId: null,
      waiting: true,
      queuedPosition: 1,
      lastSeenAt: Date.now() - 200_000, // 200s ago
      createdAt: Date.now() - 210_000
    });

    const activeSessions = loadActiveSessions(120_000); // 120s cutoff
    const foundExpired = activeSessions.find(s => s.clientId === expiredClient);
    assert.equal(foundExpired, undefined, 'Expired session must be pruned');
  });

  it('persists and recovers active blocked pairs', () => {
    const pairKey = 'user1:user2';
    const futureExpires = Date.now() + 15_000;
    saveBlockedPair(pairKey, futureExpires);

    const expiredKey = 'user3:user4';
    saveBlockedPair(expiredKey, Date.now() - 5_000);

    const activeBlocks = loadActiveBlockedPairs();
    assert.ok(activeBlocks.some(b => b.pairKey === pairKey), 'Unexpired blocked pair should be loaded');
    assert.ok(!activeBlocks.some(b => b.pairKey === expiredKey), 'Expired blocked pair should be pruned');

    deleteBlockedPair(pairKey);
    const afterDelete = loadActiveBlockedPairs();
    assert.ok(!afterDelete.some(b => b.pairKey === pairKey), 'Deleted block rule should not exist');
  });

  it('cleans up session when deleted', () => {
    const clientA = '00000000-0000-4000-8000-000000000001';
    deleteSession(clientA);

    const activeSessions = loadActiveSessions(120_000);
    assert.equal(activeSessions.find(s => s.clientId === clientA), undefined);
  });

  it('safely evaluates partner connection state when partner has not yet reconnected', () => {
    const WebSocket = { OPEN: 1, CLOSED: 3 };
    const clients = new Map();
    // Simulate restored session from SQLite with offline partner
    clients.set('partner-123', { clientId: 'partner-123', ws: null, partnerId: 'self-123' });

    const session = { clientId: 'self-123', partnerId: 'partner-123', isReconnect: true };
    const partnerSession = clients.get(session.partnerId);
    const partner = partnerSession?.ws;

    // Must not throw TypeError: Cannot read properties of null (reading 'OPEN')
    let isPartnerOpen = false;
    assert.doesNotThrow(() => {
      isPartnerOpen = Boolean(partner && partner.readyState === WebSocket.OPEN);
    });
    assert.equal(isPartnerOpen, false, 'Partner should be safely determined as not open');
  });

  it('persists and enforces banned users based on UUID', () => {
    const bannedClient = '00000000-0000-4000-8000-000000000999';
    const futureExpires = Date.now() + 60_000;

    saveBannedUser({
      clientId: bannedClient,
      reason: 'Ngôn từ độc hại',
      bannedAt: Date.now(),
      expiresAt: futureExpires,
      bannedBy: 'admin'
    });

    assert.equal(isUserBanned(bannedClient), true, 'User should be reported as banned');
    const banInfo = getBannedUser(bannedClient);
    assert.ok(banInfo, 'Ban info should be returned');
    assert.equal(banInfo.reason, 'Ngôn từ độc hại');
    assert.equal(banInfo.expiresAt, futureExpires);

    const activeBans = loadActiveBannedUsers();
    assert.ok(activeBans.some(b => b.clientId === bannedClient), 'Active bans should include user');

    // Unban
    deleteBannedUser(bannedClient);
    assert.equal(isUserBanned(bannedClient), false, 'User should be unbanned');
    assert.equal(getBannedUser(bannedClient), null);
  });

  it('auto-prunes expired bans', () => {
    const expiredClient = '00000000-0000-4000-8000-000000000888';
    saveBannedUser({
      clientId: expiredClient,
      reason: 'Hết hạn',
      bannedAt: Date.now() - 10_000,
      expiresAt: Date.now() - 1_000,
      bannedBy: 'admin'
    });

    assert.equal(isUserBanned(expiredClient), false, 'Expired ban should not be active');
    assert.equal(getBannedUser(expiredClient), null, 'getBannedUser should return null for expired');
  });
});
