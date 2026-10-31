import assert from 'assert';

const previewHost = 'https://norden-2vmddnh5d-zaidaans-projects.vercel.app';

async function runPreviewAuthRegression() {
  console.log('=== PHASE 14C-FREE: PREVIEW AUTHENTICATION & ACCESS CONTROL REGRESSION ===\n');

  // 1. Unauthenticated Route Protection (Redirect to /login or Vercel SSO)
  console.log('[1] Testing Protected Routes Unauthenticated Access Redirection...');
  const protectedRoutes = ['/dashboard', '/norden-control-center', '/onboarding'];
  for (const route of protectedRoutes) {
    const res = await fetch(`${previewHost}${route}`, { redirect: 'manual' });
    const location = res.headers.get('location') || '';
    console.log(`  ${route.padEnd(25)} -> Status ${res.status} Location: ${location.slice(0, 50)}...`);
    assert.ok(
      res.status === 307 || res.status === 302 || res.status === 303,
      `${route} must redirect unauthenticated access`
    );
    assert.ok(
      location.includes('/login') || location.includes('vercel.com/sso-api'),
      `${route} must redirect to /login or be protected by Vercel SSO`
    );
  }
  console.log('  ✓ All protected routes enforce redirect for unauthenticated requests.');

  // 2. Public Route Accessibility
  console.log('\n[2] Testing Public Routes Accessibility...');
  const publicRoutes = ['/', '/login', '/register', '/upgrade', '/forgot-password', '/legal/terms', '/legal/privacy'];
  for (const route of publicRoutes) {
    const res = await fetch(`${previewHost}${route}`);
    console.log(`  ${route.padEnd(25)} -> Status ${res.status}`);
    assert.strictEqual(res.status, 200, `${route} must return 200 OK`);
  }
  console.log('  ✓ All public and authentication pages render 200 OK.');

  // 3. API Authentication Gates
  console.log('\n[3] Testing API Route Authentication Gates...');
  // A. /api/auth/session without valid idToken
  const sessionRes = await fetch(`${previewHost}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'invalid_dummy_token' }),
    redirect: 'manual'
  });
  console.log(`  POST /api/auth/session (invalid token) -> Status ${sessionRes.status}`);
  assert.ok(
    sessionRes.status === 400 || sessionRes.status === 401 || sessionRes.status === 302,
    'Invalid session token must be rejected or gated by SSO'
  );

  // B. /api/upload/payment-proof without cookie/session
  const uploadProofRes = await fetch(`${previewHost}/api/upload/payment-proof`, {
    method: 'POST',
    body: new FormData(),
    redirect: 'manual'
  });
  console.log(`  POST /api/upload/payment-proof (unauthenticated) -> Status ${uploadProofRes.status}`);
  assert.ok(
    uploadProofRes.status === 401 || uploadProofRes.status === 403 || uploadProofRes.status === 302,
    'Unauthenticated upload must be rejected or gated by SSO'
  );

  // C. /api/upload/qris without cookie/session
  const uploadQrisRes = await fetch(`${previewHost}/api/upload/qris`, {
    method: 'POST',
    body: new FormData(),
    redirect: 'manual'
  });
  console.log(`  POST /api/upload/qris (unauthenticated) -> Status ${uploadQrisRes.status}`);
  assert.ok(
    uploadQrisRes.status === 401 || uploadQrisRes.status === 403 || uploadQrisRes.status === 302,
    'Unauthenticated QRIS upload must be rejected or gated by SSO'
  );
  console.log('  ✓ API upload and session endpoints strictly enforce authentication.');

  // 4. Cron Route Secret Enforcement
  console.log('\n[4] Testing Cron Endpoints Security Gate...');
  const cronRecurringRes = await fetch(`${previewHost}/api/cron/recurring`, { redirect: 'manual' });
  console.log(`  GET /api/cron/recurring (no secret) -> Status ${cronRecurringRes.status}`);
  assert.ok(
    cronRecurringRes.status === 401 || cronRecurringRes.status === 302,
    'Cron recurring must reject request without Authorization header'
  );

  const cronRemindersRes = await fetch(`${previewHost}/api/cron/reminders`, { redirect: 'manual' });
  console.log(`  GET /api/cron/reminders (no secret) -> Status ${cronRemindersRes.status}`);
  assert.ok(
    cronRemindersRes.status === 401 || cronRemindersRes.status === 302,
    'Cron reminders must reject request without Authorization header'
  );
  console.log('  ✓ All cron routes reject unauthorized requests.');

  console.log('\n=== ALL PREVIEW AUTH REGRESSION TESTS PASSED ===');
}

runPreviewAuthRegression().catch(err => {
  console.error('\nPreview Auth Regression Failed:', err);
  process.exit(1);
});
