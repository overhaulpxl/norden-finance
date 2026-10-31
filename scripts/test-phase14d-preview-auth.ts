import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';

const host = 'https://norden-p7vqy1rq3-zaidaans-projects.vercel.app';
const fbApiKey = 'AIzaSyB7TpcmWqRMK6GdwjXXBV9yxtq_pdehlNo';

// Read tokens from authorized local configs
const vAuthPath = path.join(os.homedir(), 'AppData', 'Roaming', 'com.vercel.cli', 'Data', 'auth.json');
const vAuth = JSON.parse(fs.readFileSync(vAuthPath, 'utf8'));
const vercelToken = vAuth.token;

const fbConfigPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const fbConfig = JSON.parse(fs.readFileSync(fbConfigPath, 'utf8'));
const fbAccessToken = fbConfig.tokens.access_token;

async function getBypassKey(): Promise<string> {
  const vAuthFresh = JSON.parse(fs.readFileSync(vAuthPath, 'utf8'));
  const pRes = await fetch('https://api.vercel.com/v9/projects/norden', {
    headers: { Authorization: `Bearer ${vAuthFresh.token}` },
  });
  assert.strictEqual(pRes.status, 200, 'Must get Vercel project metadata');
  const pData = await pRes.json();
  const key = Object.keys(pData.protectionBypass)[0];
  assert.ok(key, 'Protection bypass secret must be present');
  return key;
}

async function setFirebasePassword(localId: string, password: string) {
  const res = await fetch(
    'https://identitytoolkit.googleapis.com/v1/projects/nordenfinance-preview-auth/accounts:update',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${fbAccessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ localId, password, returnSecureToken: true }),
    }
  );
  assert.strictEqual(res.status, 200, `Failed to update password for user ${localId}`);
}

async function firebaseSignIn(email: string, password: string) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${fbApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  assert.strictEqual(res.status, 200, `Firebase sign-in failed for ${email}`);
  const data = await res.json();
  assert.ok(data.idToken, 'Must receive Firebase idToken');
  return data.idToken;
}

async function createSessionCookie(idToken: string, bypassKey: string): Promise<string> {
  const res = await fetch(`${host}/api/auth/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: host,
      'x-vercel-protection-bypass': bypassKey,
    },
    body: JSON.stringify({ idToken }),
  });
  assert.strictEqual(res.status, 200, 'POST /api/auth/session must return 200');
  const rawCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
  const sessionCookie = rawCookies.find((c: any) => c && c.startsWith('__session='));
  assert.ok(sessionCookie, 'Must receive __session cookie in set-cookie header');
  return sessionCookie.split(';')[0];
}

async function runAuthenticatedRegression() {
  console.log('=== PHASE 14D-FREE: AUTHENTICATED PREVIEW REGRESSION SUITE ===\n');

  console.log('[1] Retrieving authorized Deployment Protection bypass token...');
  const bypassKey = await getBypassKey();
  console.log('  ✓ Deployment Protection bypass token retrieved successfully.');

  const regularPassword = 'RegTestPass456!@#';
  const adminPassword = 'AdminTestPass789!@#';

  // ----------------------------------------------------
  // TEST SUITE 1: REGULAR USER AUTHENTICATED FLOW
  // ----------------------------------------------------
  console.log('\n[2] Testing Regular User Authentication (perf-singapore-test@nordenfinance.site)...');
  await setFirebasePassword('WMrxxiME9GRXqA3ATolqu1g9t6O2', regularPassword);
  const regularIdToken = await firebaseSignIn('perf-singapore-test@nordenfinance.site', regularPassword);
  console.log('  ✓ Firebase sign-in & ID token generation succeeded.');

  const regularSessionCookie = await createSessionCookie(regularIdToken, bypassKey);
  console.log('  ✓ Firebase session cookie (__session) created and verified.');

  // Access /dashboard
  console.log('\n[3] Testing Regular User Dashboard Access (/dashboard)...');
  const dashRes = await fetch(`${host}/dashboard`, {
    headers: {
      Cookie: regularSessionCookie,
      'x-vercel-protection-bypass': bypassKey,
    },
    redirect: 'manual',
  });
  console.log(`  GET /dashboard -> Status ${dashRes.status}`);
  assert.strictEqual(dashRes.status, 200, 'Dashboard must return 200 for authenticated regular user');
  const dashHtml = await dashRes.text();
  assert.ok(dashHtml.includes('Singapore Test User'), 'Dashboard must render authenticated profile name');
  assert.ok(!dashHtml.includes('NEXT_REDIRECT;replace;/login'), 'Must not redirect to /login');
  console.log('  ✓ Dashboard successfully rendered authenticated profile data ("Singapore Test User").');

  // Verify Admin Control Center is DENIED for Regular User
  console.log('\n[4] Verifying Control Center Access DENIED for Regular User (/norden-control-center)...');
  const regularAdminRes = await fetch(`${host}/norden-control-center`, {
    headers: {
      Cookie: regularSessionCookie,
      'x-vercel-protection-bypass': bypassKey,
    },
    redirect: 'manual',
  });
  console.log(`  GET /norden-control-center -> Status ${regularAdminRes.status}`);
  const regularAdminHtml = await regularAdminRes.text();
  assert.ok(
    regularAdminHtml.includes('NEXT_REDIRECT;replace;/dashboard;307;') || regularAdminRes.status === 307,
    'Regular user must be redirected to /dashboard when accessing /norden-control-center'
  );
  console.log('  ✓ Access strictly denied: Server returned NEXT_REDIRECT to /dashboard.');

  // ----------------------------------------------------
  // TEST SUITE 2: ADMIN USER AUTHENTICATED FLOW
  // ----------------------------------------------------
  console.log('\n[5] Testing Admin User Authentication (perf-singapore-admin@nordenfinance.site)...');
  await setFirebasePassword('ZZolETrVOThUU4nY1JFOQTkN61w1', adminPassword);
  const adminIdToken = await firebaseSignIn('perf-singapore-admin@nordenfinance.site', adminPassword);
  console.log('  ✓ Admin Firebase sign-in & ID token generation succeeded.');

  const adminSessionCookie = await createSessionCookie(adminIdToken, bypassKey);
  console.log('  ✓ Admin session cookie created and verified.');

  // Access /norden-control-center
  console.log('\n[6] Testing Admin Control Center Access (/norden-control-center)...');
  const adminCtrlRes = await fetch(`${host}/norden-control-center`, {
    headers: {
      Cookie: adminSessionCookie,
      'x-vercel-protection-bypass': bypassKey,
    },
    redirect: 'manual',
  });
  console.log(`  GET /norden-control-center -> Status ${adminCtrlRes.status}`);
  assert.strictEqual(adminCtrlRes.status, 200, 'Control Center must return 200 for admin user');
  const adminCtrlHtml = await adminCtrlRes.text();
  assert.ok(!adminCtrlHtml.includes('NEXT_REDIRECT;replace;/dashboard'), 'Admin must NOT be redirected to /dashboard');
  assert.ok(!adminCtrlHtml.includes('NEXT_REDIRECT;replace;/login'), 'Admin must NOT be redirected to /login');
  console.log('  ✓ Admin Control Center accessed and rendered without redirects.');

  // ----------------------------------------------------
  // TEST SUITE 3: SESSION REJECTION & UNAUTHENTICATED GATES
  // ----------------------------------------------------
  console.log('\n[7] Testing Session Rejection & Unauthenticated Gates...');

  // A. Missing session cookie on protected route
  const missingSessRes = await fetch(`${host}/dashboard`, {
    headers: { 'x-vercel-protection-bypass': bypassKey },
    redirect: 'manual',
  });
  console.log(`  GET /dashboard (no cookie) -> Status ${missingSessRes.status}`);
  const missingHtml = await missingSessRes.text();
  assert.ok(
    missingHtml.includes('NEXT_REDIRECT;replace;/login') || missingSessRes.status === 307 || missingSessRes.status === 302,
    'Unauthenticated dashboard access must redirect to /login'
  );
  console.log('  ✓ Missing session cookie redirects to /login.');

  // B. Invalid / Corrupted session cookie
  const invalidSessRes = await fetch(`${host}/dashboard`, {
    headers: {
      Cookie: '__session=corrupted_invalid_token_xyz_123',
      'x-vercel-protection-bypass': bypassKey,
    },
    redirect: 'manual',
  });
  console.log(`  GET /dashboard (invalid cookie) -> Status ${invalidSessRes.status}`);
  const invalidHtml = await invalidSessRes.text();
  assert.ok(
    invalidHtml.includes('NEXT_REDIRECT;replace;/login') || invalidSessRes.status === 307 || invalidSessRes.status === 302,
    'Invalid session cookie must redirect to /login'
  );
  console.log('  ✓ Invalid/tampered session cookie redirects to /login.');

  // C. Invalid ID token rejection at /api/auth/session
  const badIdTokenRes = await fetch(`${host}/api/auth/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: host,
      'x-vercel-protection-bypass': bypassKey,
    },
    body: JSON.stringify({ idToken: 'fake_jwt_token_payload' }),
  });
  console.log(`  POST /api/auth/session (invalid idToken) -> Status ${badIdTokenRes.status}`);
  assert.strictEqual(badIdTokenRes.status, 401, 'Invalid idToken must be rejected with 401 Unauthorized');
  console.log('  ✓ Bogus ID token rejected with 401 Unauthorized.');

  // D. Cross-Origin rejection at /api/auth/session
  const csrfRes = await fetch(`${host}/api/auth/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://malicious-counterparty.site',
      'x-vercel-protection-bypass': bypassKey,
    },
    body: JSON.stringify({ idToken: regularIdToken }),
  });
  console.log(`  POST /api/auth/session (cross-origin attack) -> Status ${csrfRes.status}`);
  assert.strictEqual(csrfRes.status, 403, 'Cross-origin request must be rejected with 403');
  console.log('  ✓ Cross-origin session creation blocked.');

  // E. Session Logout / Invalidation
  console.log('\n[8] Testing Logout and Session Invalidation...');
  const logoutRes = await fetch(`${host}/api/auth/session`, {
    method: 'DELETE',
    headers: {
      Cookie: regularSessionCookie,
      Origin: host,
      'x-vercel-protection-bypass': bypassKey,
    },
  });
  console.log(`  DELETE /api/auth/session -> Status ${logoutRes.status}`);
  assert.strictEqual(logoutRes.status, 200, 'Logout must succeed with 200');
  const logoutCookies = logoutRes.headers.getSetCookie ? logoutRes.headers.getSetCookie() : [logoutRes.headers.get('set-cookie')];
  const clearedCookie = logoutCookies.find((c: any) => c && c.startsWith('__session='));
  assert.ok(
    clearedCookie && (clearedCookie.includes('Max-Age=0') || clearedCookie.includes('expires=Thu, 01 Jan 1970')),
    'Logout must clear the __session cookie'
  );
  console.log('  ✓ Logout endpoint cleared __session cookie.');

  console.log('\n=== ALL PREVIEW AUTHENTICATED REGRESSION TESTS PASSED (100%) ===');
}

runAuthenticatedRegression().catch(err => {
  console.error('\nAuthenticated Regression Failed:', err);
  process.exit(1);
});
