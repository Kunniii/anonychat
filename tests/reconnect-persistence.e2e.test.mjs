import { WebSocket } from 'ws';
import crypto from 'node:crypto';

const BASE_WS = process.env.TEST_BASE_WS || 'ws://localhost:3030/ws';

let passed = 0;
let failed = 0;

function assert(condition, name, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${name} ${details ? '(' + details + ')' : ''}`);
    failed++;
  }
}

async function runReconnectPersistenceTest() {
  console.log('\n======================================================');
  console.log('🔄 RUNNING RECONNECT PERSISTENCE E2E TEST');
  console.log('======================================================\n');

  const clientIdA = crypto.randomUUID();
  const clientIdB = crypto.randomUUID();

  let wsA;
  let wsB;

  try {
    // Step 1: Connect both clients
    const connectPromiseA = new Promise((resolve, reject) => {
      const ws = new WebSocket(`${BASE_WS}?clientId=${clientIdA}`);
      ws.on('open', () => resolve(ws));
      ws.on('error', reject);
    });

    const connectPromiseB = new Promise((resolve, reject) => {
      const ws = new WebSocket(`${BASE_WS}?clientId=${clientIdB}`);
      ws.on('open', () => resolve(ws));
      ws.on('error', reject);
    });

    wsA = await connectPromiseA;
    wsB = await connectPromiseB;

    // Step 2: Wait for both to be paired
    const pairedPromise = Promise.all([
      new Promise((resolve) => {
        const handler = (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.system && msg.system.includes('Connected to a stranger')) {
            wsA.off('message', handler);
            resolve();
          }
        };
        wsA.on('message', handler);
      }),
      new Promise((resolve) => {
        const handler = (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.system && msg.system.includes('Connected to a stranger')) {
            wsB.off('message', handler);
            resolve();
          }
        };
        wsB.on('message', handler);
      })
    ]);

    await pairedPromise;
    assert(true, 'Client A and B paired successfully');

    // Step 3: Client A sends message before disconnect
    const messagePromise = new Promise((resolve) => {
      wsB.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'text' && msg.data === 'Hello before hiccup') {
          resolve(true);
        }
      });
    });

    wsA.send(JSON.stringify({ type: 'text', data: 'Hello before hiccup' }));
    const receivedBeforeHiccup = await messagePromise;
    assert(receivedBeforeHiccup, 'Client B received message before hiccup');

    // Step 4: Simulate network drop on Client A
    const strangerLostPromise = new Promise((resolve) => {
      wsB.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.system && msg.system.includes('Stranger connection lost')) {
          resolve(true);
        }
      });
    });

    wsA.close();
    const lostNotified = await strangerLostPromise;
    assert(lostNotified, 'Client B notified that stranger connection was lost');

    // Wait a brief moment to simulate network hiccup
    await new Promise((r) => setTimeout(r, 600));

    // Step 5: Client A reconnects with SAME clientIdA
    const reconnectedPromiseA = new Promise((resolve) => {
      const newWsA = new WebSocket(`${BASE_WS}?clientId=${clientIdA}`);
      newWsA.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.system && msg.system.toLowerCase().includes('reconnected')) {
          resolve(newWsA);
        }
      });
    });

    const strangerReconnectedPromiseB = new Promise((resolve) => {
      wsB.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.system && msg.system.includes('Stranger reconnected')) {
          resolve(true);
        }
      });
    });

    const [newWsA, bSawReconnect] = await Promise.all([
      reconnectedPromiseA,
      strangerReconnectedPromiseB
    ]);

    assert(Boolean(newWsA), 'Client A reconnected and received reconnection confirmation');
    assert(bSawReconnect, 'Client B received Stranger reconnected notification');

    // Step 6: Test messaging after reconnect
    const afterReconnectMsgPromise = new Promise((resolve) => {
      newWsA.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'text' && msg.data === 'Hello after reconnect') {
          resolve(true);
        }
      });
    });

    wsB.send(JSON.stringify({ type: 'text', data: 'Hello after reconnect' }));
    const receivedAfter = await afterReconnectMsgPromise;
    assert(receivedAfter, 'Client A received message after reconnect without pairing being broken');

    newWsA.close();
    wsB.close();

    console.log(`\n======================================================`);
    console.log(`TEST SUITE RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log(`======================================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test error:', err);
    if (wsA) wsA.close();
    if (wsB) wsB.close();
    process.exit(1);
  }
}

runReconnectPersistenceTest();
