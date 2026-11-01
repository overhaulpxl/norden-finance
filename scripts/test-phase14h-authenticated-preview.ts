import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';

const host = 'https://norden-bigvd5l2i-zaidaans-projects.vercel.app';
const fbApiKey = 'AIzaSyB7TpcmWqRMK6GdwjXXBV9yxtq_pdehlNo';

const vAuthPath = path.join(os.homedir(), 'AppData', 'Roaming', 'com.vercel.cli', 'Data', 'auth.json');
const vAuth = JSON.parse(fs.readFileSync(vAuthPath, 'utf8'));

async function getBypassKey(): Promise<string> {
  const pRes = await fetch('https://api.vercel.com/v9/projects/norden', {
    headers: { Authorization: `Bearer ${vAuth.token}` },
  });
  assert.strictEqual(pRes.status, 200, 'Must get Vercel project metadata');
  const pData = await pRes.json();
  const key = Object.keys(pData.protectionBypass)[0];
  assert.ok(key, 'Protection bypass secret must be present');
  return key;
}

async function run() {
  console.log('=== VERIFYING AUTHENTICATED PREVIEW FOR ADMIN CONTROL CENTER ===\n');

  const bypassKey = await getBypassKey();
  const email = 'zaidaan-admin-test@nordenfinance.site';
  const password = 'TestAdminPass123!';

  console.log('1. Signing in admin user (localId: yf8PxJOaPWYp3bvRqtTeu7onblT2)...');
  const signRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${fbApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  console.log('  Sign in status:', signRes.status);
  const signData = await signRes.json();
  assert.strictEqual(signRes.status, 200, 'Sign in must succeed');
  assert.strictEqual(signData.localId, 'yf8PxJOaPWYp3bvRqtTeu7onblT2', 'localId must match admin uid');
  console.log('  ✓ Admin signed in to preview auth.');

  console.log('\n2. Creating session cookie on Preview deployment...');
  const sessRes = await fetch(`${host}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: host, 'x-vercel-protection-bypass': bypassKey },
    body: JSON.stringify({ idToken: signData.idToken }),
  });
  console.log('  Session creation status:', sessRes.status);
  assert.strictEqual(sessRes.status, 200, 'Session creation must return 200');
  const rawCookies = sessRes.headers.getSetCookie ? sessRes.headers.getSetCookie() : [sessRes.headers.get('set-cookie')];
  const sessionCookie = rawCookies.find((c: any) => c && c.startsWith('__session='));
  assert.ok(sessionCookie, 'Must receive __session cookie in set-cookie header');
  const cookie = sessionCookie.split(';')[0];
  console.log('  ✓ Session cookie obtained.');

  console.log('\n3. Requesting GET /norden-control-center with authenticated admin session...');
  const t0 = performance.now();
  const adminRes = await fetch(`${host}/norden-control-center`, {
    headers: { Cookie: cookie, 'x-vercel-protection-bypass': bypassKey },
    redirect: 'manual',
  });
  const dur = performance.now() - t0;
  console.log(`  Status: ${adminRes.status} | Latency: ${dur.toFixed(1)}ms`);
  assert.strictEqual(adminRes.status, 200, 'Control Center must return 200 OK');

  const xVercelId = adminRes.headers.get('x-vercel-id') || '';
  console.log(`  Execution region (x-vercel-id): ${xVercelId}`);
  assert.ok(xVercelId.includes('sin1'), `Execution region must be sin1, got: ${xVercelId}`);

  const html = await adminRes.text();
  console.log(`  HTML length: ${html.length} bytes`);

  console.log('\n4. Verifying page assertions:');
  const hasTimeoutMsg = html.includes('Sebagian data statistik platform sementara tidak dapat dimuat karena batas waktu database');
  console.log(`  - Database timeout error notification: ${hasTimeoutMsg ? 'FOUND (FAIL)' : 'NOT FOUND (PASS)'}`);
  assert.strictEqual(hasTimeoutMsg, false, 'Database timeout notification must NOT be present');

  const hasErrorSign = html.includes('❌');
  console.log(`  - Generic error banner (❌): ${hasErrorSign ? 'FOUND (FAIL)' : 'NOT FOUND (PASS)'}`);
  assert.strictEqual(hasErrorSign, false, 'Error banner must NOT be present');

  const hasTitle = html.includes('Panel Admin Norden');
  console.log(`  - Panel Admin Norden title: ${hasTitle ? 'FOUND (PASS)' : 'NOT FOUND (FAIL)'}`);
  assert.strictEqual(hasTitle, true, 'Must render Panel Admin Norden title');

  const hasRevenueCard = html.includes('Total Revenue');
  console.log(`  - Total Revenue card: ${hasRevenueCard ? 'FOUND (PASS)' : 'NOT FOUND (FAIL)'}`);
  assert.strictEqual(hasRevenueCard, true, 'Must render Total Revenue card');

  const hasProUserCard = html.includes('Pro User');
  console.log(`  - Pro User card: ${hasProUserCard ? 'FOUND (PASS)' : 'NOT FOUND (FAIL)'}`);
  assert.strictEqual(hasProUserCard, true, 'Must render Pro User card');

  console.log('\n=== ALL AUTHENTICATED PREVIEW CHECKS PASSED PERFECTLY ===\n');
}

run().catch(err => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
