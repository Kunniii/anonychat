import crypto from 'node:crypto';

const BASE_HTTP = process.env.TEST_BASE_HTTP || 'http://localhost:3030';
const BASE_WS = process.env.TEST_BASE_WS || 'ws://localhost:3030/ws';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'replace-with-a-long-random-secret';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING COMPREHENSIVE E2E TEST SUITE FOR ANONYCHAT');
  console.log('======================================================\n');

  // ── TEST 1: Healthcheck ──
  console.log('[TEST GROUP 1] System Health & Static Routing');
  try {
    const res = await fetch(`${BASE_HTTP}/healthz`);
    const text = await res.text();
    assert(res.status === 200 && text === 'ok', 'GET /healthz returns 200 ok');
  } catch (err) {
    assert(false, 'GET /healthz returns 200 ok', err.message);
  }

  // ── TEST 2: Static SPA fallback ──
  try {
    const res = await fetch(`${BASE_HTTP}/admin`);
    const html = await res.text();
    assert(res.status === 200 && html.includes('<!doctype html>'), 'GET /admin serves SPA HTML');
  } catch (err) {
    assert(false, 'GET /admin serves SPA HTML', err.message);
  }

  // ── TEST 3: User Reporting & Rate Limiting ──
  console.log('\n[TEST GROUP 2] User Incident Reporting API & Rate Limiting');
  const uniqueReportText = `Spam payload test_${Date.now()}`;
  let reportSubmitted = false;
  try {
    let reportRes = await fetch(`${BASE_HTTP}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportedText: uniqueReportText, reason: 'Harassment test' })
    });

    if (reportRes.status === 429) {
      console.log('  [Notice] Cooldown active from previous request, awaiting rate limit window...');
      await new Promise(r => setTimeout(r, 31000));
      reportRes = await fetch(`${BASE_HTTP}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportedText: uniqueReportText, reason: 'Harassment test' })
      });
    }

    const data = await reportRes.json();
    reportSubmitted = reportRes.status === 201 && data.ok === true;
    assert(reportSubmitted, 'POST /api/reports submits report successfully');

    // Immediate second report should hit 429 rate limit
    const rateLimitRes = await fetch(`${BASE_HTTP}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportedText: 'Another report', reason: 'spam' })
    });
    assert(rateLimitRes.status === 429, 'POST /api/reports enforces 429 cooldown rate limit');
  } catch (err) {
    assert(false, 'POST /api/reports testing', err.message);
  }

  // ── TEST 4: Admin Authentication Lifecycle ──
  console.log('\n[TEST GROUP 3] Admin API & Session Lifecycle');
  let adminToken = '';
  try {
    // Bad login
    const badLogin = await fetch(`${BASE_HTTP}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong-password-123' })
    });
    assert(badLogin.status === 401, 'POST /api/admin/login rejects invalid password with 401');

    // Correct login
    const goodLogin = await fetch(`${BASE_HTTP}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: ADMIN_PASSWORD })
    });
    const loginData = await goodLogin.json();
    assert(goodLogin.status === 200 && typeof loginData.token === 'string' && loginData.token.length === 64,
      'POST /api/admin/login returns valid 64-hex session token');
    adminToken = loginData.token;
  } catch (err) {
    assert(false, 'Admin authentication test', err.message);
  }

  // ── TEST 5: Admin Protected Operations ──
  console.log('\n[TEST GROUP 4] Admin Telemetry, Moderation & Block List');
  try {
    // Stats
    const statsRes = await fetch(`${BASE_HTTP}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const stats = await statsRes.json();
    assert(statsRes.status === 200 && typeof stats.onlineCount === 'number',
      'GET /api/admin/stats returns real-time online/waiting/pair telemetry');

    // Feedback
    const feedbackRes = await fetch(`${BASE_HTTP}/api/admin/feedback`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const feedbackData = await feedbackRes.json();
    assert(feedbackRes.status === 200 && Array.isArray(feedbackData.feedback),
      'GET /api/admin/feedback returns user feedback entries');

    // Reports list
    const reportsRes = await fetch(`${BASE_HTTP}/api/admin/reports`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const reportsData = await reportsRes.json();
    const createdReport = reportsData.reports?.find(r => r.reportedText === uniqueReportText) || reportsData.reports?.[0];
    assert(reportsRes.status === 200 && Array.isArray(reportsData.reports),
      'GET /api/admin/reports returns incident tickets list');

    // Resolve report
    if (createdReport) {
      const resolveRes = await fetch(`${BASE_HTTP}/api/admin/reports/${createdReport.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ action: 'resolved' })
      });
      const resolveData = await resolveRes.json();
      assert(resolveRes.status === 200 && resolveData.ok === true,
        'POST /api/admin/reports/:id/resolve resolves the incident ticket');
    }

    // Add block list word
    const testBlockedWord = `badword_${Date.now()}`;
    const addBlockRes = await fetch(`${BASE_HTTP}/api/admin/block-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ word: testBlockedWord })
    });
    const addBlockData = await addBlockRes.json();
    assert(addBlockRes.status === 200 && addBlockData.blockList?.includes(testBlockedWord),
      'POST /api/admin/block-list adds custom banned keyword');

    // Get block list
    const getBlockRes = await fetch(`${BASE_HTTP}/api/admin/block-list`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const getBlockData = await getBlockRes.json();
    assert(getBlockRes.status === 200 && getBlockData.blockList?.includes(testBlockedWord),
      'GET /api/admin/block-list returns active keyword rules catalog');

    // Remove block list word
    const removeBlockRes = await fetch(`${BASE_HTTP}/api/admin/block-list/${encodeURIComponent(testBlockedWord)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const removeBlockData = await removeBlockRes.json();
    assert(removeBlockRes.status === 200 && !removeBlockData.blockList?.includes(testBlockedWord),
      'DELETE /api/admin/block-list/:word removes custom banned keyword');

    // Logout
    const logoutRes = await fetch(`${BASE_HTTP}/api/admin/session`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(logoutRes.status === 204, 'DELETE /api/admin/session revokes token with 204');

    // Verify token rejected
    const verifyRevoked = await fetch(`${BASE_HTTP}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(verifyRevoked.status === 401, 'Requests with revoked token are rejected with 401 Unauthorized');
  } catch (err) {
    assert(false, 'Admin operations testing', err.message);
  }

  // ── TEST 6: WebSocket Stranger Pairing & Message Routing ──
  console.log('\n[TEST GROUP 5] WebSocket Realtime Pairing, Messaging & Broadcasts');

  await new Promise((resolve) => {
    let wsA, wsB;
    let pairedA = false;
    let pairedB = false;

    const clientIdA = crypto.randomUUID();
    const clientIdB = crypto.randomUUID();

    const cleanup = () => {
      try {
        if (wsA && wsA.readyState === 1) wsA.send(JSON.stringify({ type: 'endConversation' }));
        wsA?.close();
      } catch {}
      try {
        if (wsB && wsB.readyState === 1) wsB.send(JSON.stringify({ type: 'endConversation' }));
        wsB?.close();
      } catch {}
      resolve();
    };

    const timeout = setTimeout(() => {
      assert(false, 'WebSocket workflow timed out after 10 seconds');
      cleanup();
    }, 10000);

    // Create sockets
    wsA = new WebSocket(`${BASE_WS}?clientId=${clientIdA}`);
    wsB = new WebSocket(`${BASE_WS}?clientId=${clientIdB}`);

    wsA.addEventListener('message', async (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.system && msg.system.includes('Connected to a stranger')) {
          pairedA = true;
          checkPaired();
        }
        if (msg.type === 'typing') {
          assert(true, 'Client A receives typing notification from Client B');

          // Trigger admin announcement broadcast while clients are connected
          testBroadcastAnnouncement();
        }
        if (msg.type === 'announcement' && msg.message === 'THÔNG BÁO TEST HỆ THỐNG') {
          assert(true, 'Client A receives admin emergency broadcast announcement');

          clearTimeout(timeout);
          cleanup();
        }
      } catch {}
    });

    wsB.addEventListener('message', async (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.system && msg.system.includes('Connected to a stranger')) {
          pairedB = true;
          checkPaired();
        }
        if (msg.type === 'text' && msg.data === 'Xin chao tu Client A!') {
          assert(true, 'Client B receives real-time text message from Client A');
          // Client B sends typing notification back to A
          wsB.send(JSON.stringify({ type: 'typing' }));
        }
      } catch {}
    });

    function checkPaired() {
      if (pairedA && pairedB) {
        assert(true, 'Two stranger clients successfully paired in real-time');
        // Client A sends formatted text message to B
        wsA.send(JSON.stringify({ type: 'text', data: 'Xin chao tu Client A!' }));
      }
    }

    async function testBroadcastAnnouncement() {
      try {
        const loginRes = await fetch(`${BASE_HTTP}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: ADMIN_PASSWORD })
        });
        const { token } = await loginRes.json();

        const announceRes = await fetch(`${BASE_HTTP}/api/admin/announcements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ message: 'THÔNG BÁO TEST HỆ THỐNG' })
        });
        const announceData = await announceRes.json();
        assert(announceRes.status === 200 && announceData.recipientCount >= 2,
          `POST /api/admin/announcements broadcasted to ${announceData.recipientCount} connected clients`);
      } catch (err) {
        assert(false, 'Broadcast announcement test', err.message);
      }
    }
  });

  console.log('\n======================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
