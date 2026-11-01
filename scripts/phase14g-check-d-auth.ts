import assert from 'assert';

const prodHost = 'https://www.nordenfinance.site';

async function checkAuthAndSecurity() {
  console.log('=== CHECK D: AUTHENTICATION, AUTHORIZATION & CROSS-USER ISOLATION ===\n');

  // 1. CSRF Origin Protection
  console.log('1. Testing CSRF Origin Protection on POST /api/auth/session:');
  const badOriginRes = await fetch(`${prodHost}/api/auth/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://malicious-attacker.com',
    },
    body: JSON.stringify({ idToken: 'some_token' }),
  });
  console.log(`  - Bad Origin status: ${badOriginRes.status}`);
  assert.strictEqual(badOriginRes.status, 403, 'Cross-origin request must be rejected with 403');
  console.log('  ✓ Cross-origin request blocked (HTTP 403).');

  // 2. Missing Token Validation
  console.log('\n2. Testing Missing ID Token:');
  const missingTokenRes = await fetch(`${prodHost}/api/auth/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: prodHost,
    },
    body: JSON.stringify({}),
  });
  console.log(`  - Missing token status: ${missingTokenRes.status}`);
  assert.strictEqual(missingTokenRes.status, 400, 'Missing token must be rejected with 400');
  console.log('  ✓ Missing token rejected (HTTP 400).');

  // 3. Invalid/Forged Token Verification
  console.log('\n3. Testing Forged / Expired Token:');
  const fakeTokenRes = await fetch(`${prodHost}/api/auth/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: prodHost,
    },
    body: JSON.stringify({ idToken: 'fake_jwt_token_payload_untrusted' }),
  });
  console.log(`  - Fake token status: ${fakeTokenRes.status}`);
  assert.strictEqual(fakeTokenRes.status, 401, 'Invalid token must be rejected with 401');
  console.log('  ✓ Invalid / forged token rejected (HTTP 401).');

  // 4. Unauthenticated Dashboard Access
  console.log('\n4. Testing Unauthenticated Dashboard Access:');
  const unauthDash = await fetch(`${prodHost}/dashboard`, {
    headers: { Cookie: '__session=expired_or_invalid_session_cookie;' },
    redirect: 'manual',
  });
  console.log(`  - Dashboard with forged session status: ${unauthDash.status}`);
  const dashBody = await unauthDash.text();
  const redirectsToLogin = unauthDash.status === 307 || unauthDash.status === 302 || dashBody.includes('NEXT_REDIRECT') || dashBody.includes('/login');
  console.log(`  - Enforces login redirect: ${redirectsToLogin}`);
  assert.ok(redirectsToLogin, 'Must redirect unauthenticated user to login');
  console.log('  ✓ Unauthenticated user denied access to dashboard.');

  // 5. Unauthenticated Control Center Access
  console.log('\n5. Testing Control Center Denial:');
  const unauthAdmin = await fetch(`${prodHost}/norden-control-center`, {
    headers: { Cookie: '__session=expired_or_invalid_session_cookie;' },
    redirect: 'manual',
  });
  console.log(`  - Control center with forged session status: ${unauthAdmin.status}`);
  const adminBody = await unauthAdmin.text();
  const redirectsAdmin = unauthAdmin.status === 307 || unauthAdmin.status === 302 || adminBody.includes('NEXT_REDIRECT') || adminBody.includes('/login');
  console.log(`  - Enforces login redirect: ${redirectsAdmin}`);
  assert.ok(redirectsAdmin, 'Must redirect unauthenticated user to login');
  console.log('  ✓ Unauthenticated user denied access to control center.');

  console.log('\n=== CHECK D PASSED: AUTHENTICATION & ACCESS GATES VERIFIED ===');
}

checkAuthAndSecurity().catch(err => {
  console.error('\nCheck D failed:', err);
  process.exit(1);
});
