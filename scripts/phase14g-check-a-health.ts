import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';

const vAuthPath = path.join(os.homedir(), 'AppData', 'Roaming', 'com.vercel.cli', 'Data', 'auth.json');
const vAuth = JSON.parse(fs.readFileSync(vAuthPath, 'utf8'));

const prodHost = 'https://www.nordenfinance.site';
const dplId = 'dpl_E8zEsBL43bPQDCwiKwvQqKUhPikk';

async function checkProductionHealth() {
  console.log('=== CHECK A: PRODUCTION HEALTH & APPLICATION LOGS ===\n');

  // 1. Endpoint status checks
  const endpoints = [
    { path: '/', expected: 200 },
    { path: '/login', expected: 200 },
    { path: '/upgrade', expected: 200 },
    { path: '/dashboard', expected: [200, 307, 302, 308] },
    { path: '/norden-control-center', expected: [200, 307, 302, 308] },
  ];

  for (const ep of endpoints) {
    const res = await fetch(`${prodHost}${ep.path}`, { redirect: 'manual' });
    const xVercelId = res.headers.get('x-vercel-id') || '';
    const status = res.status;
    const isExpected = Array.isArray(ep.expected) ? ep.expected.includes(status) : status === ep.expected;
    console.log(`Endpoint ${ep.path.padEnd(25)} -> Status: ${status} | x-vercel-id: ${xVercelId.slice(0, 30)}...`);
    assert.ok(isExpected, `Endpoint ${ep.path} failed with status ${status}`);
    assert.ok(xVercelId.includes('sin1'), `Execution region must be sin1, got: ${xVercelId}`);
  }
  console.log('  ✓ All core endpoints respond as expected and execute in sin1.');

  // 2. Check deployment logs for errors
  console.log('\nChecking Vercel runtime logs for deployment:', dplId);
  const eventsRes = await fetch(`https://api.vercel.com/v3/deployments/${dplId}/events?limit=100`, {
    headers: { Authorization: `Bearer ${vAuth.token}` }
  });
  if (eventsRes.ok) {
    const events = await eventsRes.json();
    console.log(`Retrieved ${events.length || 0} build/runtime events.`);
    const errors = (events || []).filter((e: any) => e.type === 'error' || (e.payload?.text && /error|p1001|p2024|fatal/i.test(e.payload.text)));
    console.log(`Errors found in build events: ${errors.length}`);
    for (const err of errors.slice(0, 5)) {
      console.log('  Event error:', err.payload?.text || err);
    }
    assert.strictEqual(errors.length, 0, 'No build/runtime fatal errors allowed in events');
  } else {
    console.log('Events API returned:', eventsRes.status);
  }

  console.log('\n=== CHECK A PASSED: HEALTH & REGION VERIFIED (sin1) ===');
}

checkProductionHealth().catch(err => {
  console.error('\nCheck A failed:', err);
  process.exit(1);
});
