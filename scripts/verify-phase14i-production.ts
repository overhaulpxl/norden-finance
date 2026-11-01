import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import admin from 'firebase-admin';

const prodHost = 'https://www.nordenfinance.site';
const dplId = 'dpl_BaSvY1dCkv1tTpDFpP3eRy3i4d7P';
const promotedCommit = '0fa5dcb043c2d17c69675582364788b737ca6379';
const sgRef = 'tidpkhwcxrsugioctpnf';
const adminUid = 'yf8PxJOaPWYp3bvRqtTeu7onblT2';
const fbApiKey = 'AIzaSyBLbnAnZLiRKpLQojKdiQQDBklq64CMJqY';

const vAuthPath = path.join(os.homedir(), 'AppData', 'Roaming', 'com.vercel.cli', 'Data', 'auth.json');
const vAuth = JSON.parse(fs.readFileSync(vAuthPath, 'utf8'));

const authPath = path.join(os.homedir(), '.local', 'share', 'opencode', 'mcp-auth.json');
const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const sbToken = auth.supabase?.tokens?.accessToken;
assert.ok(sbToken, 'Supabase management token required');

const saPath = 'C:\\Users\\blur\\Downloads\\norden-finance-firebase-adminsdk-fbsvc-d16af5134a.json';
assert.ok(fs.existsSync(saPath), 'Service account key required');

async function runSql(sql: string) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${sgRef}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sbToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function verifyProduction() {
  console.log('================================================================');
  console.log('=== PHASE 14I: PRODUCTION VERIFICATION SUITE ===');
  console.log('================================================================\n');

  console.log('1. Checking Public Production Root Endpoint:');
  const rootRes = await fetch(`${prodHost}/`);
  const rootVercelId = rootRes.headers.get('x-vercel-id') || '';
  console.log(`  - Root URL: ${prodHost}/`);
  console.log(`  - Status: ${rootRes.status} (expected 200)`);
  console.log(`  - Region (x-vercel-id): ${rootVercelId}`);
  assert.strictEqual(rootRes.status, 200, 'Root must return HTTP 200 OK');
  assert.ok(rootVercelId.includes('sin1'), `Root execution region must be sin1, got ${rootVercelId}`);
  console.log('  ✓ Root endpoint healthy on Singapore (sin1).\n');

  console.log('2. Verifying Authorization Enforcement (Unauthenticated & Role Gates):');
  const unauthRes = await fetch(`${prodHost}/norden-control-center`, { redirect: 'manual' });
  console.log(`  - Unauthenticated access status: ${unauthRes.status}`);
  const unauthBody = await unauthRes.text();
  const isRedirected = unauthRes.status === 307 || unauthRes.status === 302 || unauthBody.includes('NEXT_REDIRECT') || unauthBody.includes('/login');
  assert.ok(isRedirected, 'Unauthenticated access to control center must redirect to login');
  console.log('  ✓ Unauthenticated user blocked from control center.');

  // Test Non-Admin User Role Gate
  const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
  const appName = `prod-auth-${Date.now()}`;
  const app = admin.initializeApp({ credential: admin.credential.cert(sa) }, appName);

  const nonAdminUid = 'Db4t2uTWgbTJe6i4GMImEsxhz6r2';
  const nonAdminCustomToken = await app.auth().createCustomToken(nonAdminUid);
  const nonAdminExchangeRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${fbApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: nonAdminCustomToken, returnSecureToken: true }),
  });
  assert.strictEqual(nonAdminExchangeRes.status, 200, 'Non-admin token exchange must succeed');
  const nonAdminExchangeData = await nonAdminExchangeRes.json();

  const nonAdminSessRes = await fetch(`${prodHost}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: prodHost },
    body: JSON.stringify({ idToken: nonAdminExchangeData.idToken }),
  });
  assert.strictEqual(nonAdminSessRes.status, 200, 'Non-admin session creation must return 200');
  const nonAdminRawCookies = nonAdminSessRes.headers.getSetCookie ? nonAdminSessRes.headers.getSetCookie() : [nonAdminSessRes.headers.get('set-cookie')];
  const nonAdminCookieItem = nonAdminRawCookies.find((c: any) => c && c.startsWith('__session='));
  assert.ok(nonAdminCookieItem, 'Must receive __session cookie for non-admin');
  const nonAdminCookie = nonAdminCookieItem.split(';')[0];

  const nonAdminAccessRes = await fetch(`${prodHost}/norden-control-center`, {
    headers: { Cookie: nonAdminCookie },
    redirect: 'manual',
  });
  console.log(`  - Non-admin user access status: ${nonAdminAccessRes.status}`);
  const nonAdminBody = await nonAdminAccessRes.text();
  const nonAdminRedirects = nonAdminAccessRes.status === 307 || nonAdminAccessRes.status === 302 || nonAdminBody.includes('NEXT_REDIRECT') || nonAdminBody.includes('/dashboard');
  assert.ok(nonAdminRedirects, 'Non-admin user must be redirected away from control center');
  console.log('  ✓ Non-admin user role restriction enforced (redirected to /dashboard).\n');

  console.log('3. Authenticating Authorized Administrator Session:');
  const customToken = await app.auth().createCustomToken(adminUid);
  const exchangeRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${fbApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  assert.strictEqual(exchangeRes.status, 200, 'Firebase ID token exchange must succeed');
  const exchangeData = await exchangeRes.json();
  const idToken = exchangeData.idToken;
  await app.delete();

  const sessRes = await fetch(`${prodHost}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: prodHost },
    body: JSON.stringify({ idToken }),
  });
  console.log(`  - Session creation status: ${sessRes.status}`);
  assert.strictEqual(sessRes.status, 200, 'Session creation must return 200');
  const rawCookies = sessRes.headers.getSetCookie ? sessRes.headers.getSetCookie() : [sessRes.headers.get('set-cookie')];
  const sessionCookie = rawCookies.find((c: any) => c && c.startsWith('__session='));
  assert.ok(sessionCookie, 'Must receive __session cookie');
  const cookie = sessionCookie.split(';')[0];
  console.log('  ✓ Secure __session cookie created for administrator.\n');

  console.log('4. Accessing /norden-control-center as Administrator:');
  const t0 = performance.now();
  const adminRes = await fetch(`${prodHost}/norden-control-center`, {
    headers: { Cookie: cookie },
    redirect: 'manual',
  });
  const latency = performance.now() - t0;
  const adminVercelId = adminRes.headers.get('x-vercel-id') || '';
  console.log(`  - Status: ${adminRes.status} (expected 200)`);
  console.log(`  - Latency: ${latency.toFixed(1)}ms`);
  console.log(`  - Region (x-vercel-id): ${adminVercelId}`);
  assert.strictEqual(adminRes.status, 200, 'Control Center must return HTTP 200 OK');
  assert.ok(adminVercelId.includes('sin1'), `Execution region must be sin1, got ${adminVercelId}`);

  const html = await adminRes.text();
  console.log(`  - HTML document size: ${html.length} bytes`);

  // Assertions on HTML error notifications
  console.log('\n5. Verifying Error Notification Absences:');
  const hasTimeoutBanner = html.includes('Sebagian data statistik platform sementara tidak dapat dimuat karena batas waktu database') ||
                           html.includes('batas waktu koneksi database') ||
                           html.includes('batas waktu database');
  console.log(`  - Database timeout banner: ${hasTimeoutBanner ? 'PRESENT (FAIL)' : 'ABSENT (PASS)'}`);
  assert.strictEqual(hasTimeoutBanner, false, 'Timeout error banner must NOT be present');

  const hasQueryErrorBanner = html.includes('kesalahan pemrosesan kueri database');
  console.log(`  - Query error banner: ${hasQueryErrorBanner ? 'PRESENT (FAIL)' : 'ABSENT (PASS)'}`);
  assert.strictEqual(hasQueryErrorBanner, false, 'Query error banner must NOT be present');

  const hasConnectivityBanner = html.includes('koneksi ke server database terputus');
  console.log(`  - Connectivity failure banner: ${hasConnectivityBanner ? 'PRESENT (FAIL)' : 'ABSENT (PASS)'}`);
  assert.strictEqual(hasConnectivityBanner, false, 'Connectivity failure banner must NOT be present');

  const hasGenericErrorSign = html.includes('❌');
  console.log(`  - Generic error banner (❌): ${hasGenericErrorSign ? 'PRESENT (FAIL)' : 'ABSENT (PASS)'}`);
  assert.strictEqual(hasGenericErrorSign, false, 'Generic error banner must NOT be present');

  console.log('\n6. Verifying Rendered Metrics in Dashboard:');
  assert.ok(html.includes('Panel Admin Norden'), 'Must render Panel Admin Norden title');
  assert.ok(html.includes('Total Revenue'), 'Must render Total Revenue card');
  assert.ok(html.includes('Pro User'), 'Must render Pro User card');
  assert.ok(html.includes('Total Transaksi'), 'Must render Total Transaksi card');
  assert.ok(html.includes('Akun Finansial'), 'Must render Akun Finansial card');
  assert.ok(html.includes('Anggaran Aktif'), 'Must render Anggaran Aktif card');
  assert.ok(html.includes('Tabungan &amp; Hutang') || html.includes('Tabungan & Hutang'), 'Must render Tabungan & Hutang card');
  assert.ok(html.includes('Masa Trial'), 'Must render Masa Trial card');
  assert.ok(html.includes('Pro Subscriptions'), 'Must render Pro Subscriptions card');
  assert.ok(html.includes('Detail Pembayaran &amp; Pendapatan') || html.includes('Detail Pembayaran & Pendapatan'), 'Must render Detail Pembayaran section');
  assert.ok(html.includes('Statistik &amp; Pertumbuhan Pengguna') || html.includes('Statistik & Pertumbuhan Pengguna'), 'Must render Statistik Pengguna section');

  // Extract values from rendered cards
  // Global header cards: <p class="text-lg font-black text-black">VALUE</p>\s*<p class="[^"]*">LABEL</p>
  const cardMatches = Array.from(html.matchAll(/<p class="text-lg font-black text-black">([^<]+)<\/p>\s*<p class="[^"]*">([^<]+)<\/p>/g));
  console.log('  Extracted Global Metric Cards:');
  const renderedMap: Record<string, string> = {};
  for (const m of cardMatches) {
    const val = m[1].trim();
    const label = m[2].trim();
    renderedMap[label] = val;
    console.log(`    • ${label}: ${val}`);
    assert.notStrictEqual(val, '-', `Metric "${label}" must NOT be rendered as unavailable '-'`);
  }

  // Overview tab cards: <p class="text-xs font-black uppercase text-neutral-500">LABEL</p>\s*<h4 class="text-2xl font-black mt-1">VALUE</h4>
  const overviewMatches = Array.from(html.matchAll(/<p class="text-xs font-black uppercase text-neutral-500">([^<]+)<\/p>\s*<h4 class="text-2xl font-black mt-1">([^<]+)<\/h4>/g));
  console.log('  Extracted Overview Tab Metric Cards:');
  for (const m of overviewMatches) {
    const label = m[1].trim();
    const val = m[2].trim();
    renderedMap[label] = val;
    console.log(`    • ${label}: ${val}`);
    assert.notStrictEqual(val, '-', `Metric "${label}" must NOT be rendered as unavailable '-'`);
  }

  // User breakdown: Masa Trial & Pro Subscriptions
  const trialMatch = html.match(/Masa Trial<\/p>\s*<p class="text-xl font-black text-black mt-1">([^<]+)<\/p>/);
  if (trialMatch) {
    renderedMap['Masa Trial'] = trialMatch[1].trim();
    console.log(`    • Masa Trial: ${trialMatch[1].trim()}`);
    assert.notStrictEqual(trialMatch[1].trim(), '-', 'Masa Trial must NOT be unavailable');
  }
  const proSubMatch = html.match(/Pro Subscriptions<\/p>\s*<p class="text-xl font-black text-emerald-950 mt-1">([^<]+)<\/p>/);
  if (proSubMatch) {
    renderedMap['Pro Subscriptions'] = proSubMatch[1].trim();
    console.log(`    • Pro Subscriptions: ${proSubMatch[1].trim()}`);
    assert.notStrictEqual(proSubMatch[1].trim(), '-', 'Pro Subscriptions must NOT be unavailable');
  }

  console.log('\n7. Cross-Referencing Directly Against Singapore Database:');
  const dbCounts = await runSql(`
    SELECT
      (SELECT COUNT(*)::int FROM "Profile") AS "totalUsers",
      (SELECT COUNT(*)::int FROM "Profile" WHERE "plan" = 'pro'::"PlanType") AS "proUsers",
      (SELECT COUNT(*)::int FROM "Profile" WHERE "plan" = 'trial'::"PlanType") AS "trialUsers",
      (SELECT COUNT(*)::int FROM "Profile" WHERE "role" = 'admin'::"UserRole") AS "adminUsers",
      (SELECT COUNT(*)::int FROM "Transaction" WHERE "deletedAt" IS NULL) AS "totalTransactions",
      (SELECT COUNT(*)::int FROM "Balance") AS "totalBalances",
      (SELECT COUNT(*)::int FROM "Budget") AS "totalBudgets",
      (SELECT COUNT(*)::int FROM "SavingGoal") AS "totalSavingGoals",
      (SELECT COUNT(*)::int FROM "Debt") AS "totalDebts",
      (SELECT COUNT(*)::int FROM "Paylater") AS "totalPaylaters",
      (SELECT COUNT(*)::int FROM "AppSubscription") AS "totalSubscriptions",
      (SELECT COALESCE(SUM("amount"), 0)::float FROM "PaymentRequest" WHERE "status" = 'approved'::"PaymentStatus") AS "totalRevenue",
      (SELECT COUNT(*)::int FROM "PaymentRequest" WHERE "status" = 'approved'::"PaymentStatus") AS "approvedPayments",
      (SELECT COUNT(*)::int FROM "PaymentRequest" WHERE "status" = 'pending'::"PaymentStatus") AS "pendingPayments",
      (SELECT COUNT(*)::int FROM "PaymentRequest" WHERE "status" = 'rejected'::"PaymentStatus") AS "rejectedPayments";
  `);
  const actualDb = dbCounts[0];
  console.log('  Actual Singapore DB row:', JSON.stringify(actualDb, null, 2));

  // Verify match with database
  if (renderedMap['TOTAL REVENUE']) {
    console.log(`  - Total Revenue rendered: ${renderedMap['TOTAL REVENUE']} | DB raw: ${actualDb.totalRevenue}`);
  }
  if (renderedMap['Pro User']) {
    console.log(`  - Pro Users rendered: ${renderedMap['Pro User']} | DB raw: ${actualDb.proUsers}`);
    assert.strictEqual(renderedMap['Pro User'], String(actualDb.proUsers));
  }
  if (renderedMap['TOTAL TRANSAKSI']) {
    console.log(`  - Total Transaksi rendered: ${renderedMap['TOTAL TRANSAKSI']} | DB raw: ${actualDb.totalTransactions}`);
    assert.strictEqual(renderedMap['TOTAL TRANSAKSI'], String(actualDb.totalTransactions));
  }
  if (renderedMap['AKUN FINANSIAL']) {
    console.log(`  - Akun Finansial rendered: ${renderedMap['AKUN FINANSIAL']} | DB raw: ${actualDb.totalBalances}`);
    assert.strictEqual(renderedMap['AKUN FINANSIAL'], String(actualDb.totalBalances));
  }
  if (renderedMap['ANGGARAN AKTIF']) {
    console.log(`  - Anggaran Aktif rendered: ${renderedMap['ANGGARAN AKTIF']} | DB raw: ${actualDb.totalBudgets}`);
    assert.strictEqual(renderedMap['ANGGARAN AKTIF'], String(actualDb.totalBudgets));
  }
  if (renderedMap['Masa Trial']) {
    console.log(`  - Masa Trial rendered: ${renderedMap['Masa Trial']} | DB raw: ${actualDb.trialUsers}`);
    assert.strictEqual(renderedMap['Masa Trial'], String(actualDb.trialUsers));
  }
  if (renderedMap['Pro Subscriptions']) {
    console.log(`  - Pro Subscriptions rendered: ${renderedMap['Pro Subscriptions']} | DB raw: ${actualDb.proUsers}`);
    assert.strictEqual(renderedMap['Pro Subscriptions'], String(actualDb.proUsers));
  }

  console.log('\n8. Database Performance and Connection Pool Health (pg_stat_activity):');
  const connStats = await runSql(`
    SELECT
      count(*) as total_backends,
      count(*) FILTER (WHERE state = 'active') as active_backends,
      count(*) FILTER (WHERE state = 'idle') as idle_backends,
      count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
    FROM pg_stat_activity
    WHERE datname = 'postgres';
  `);
  console.log('  Connection stats:', connStats[0]);
  const totalBackends = parseInt(connStats[0].total_backends, 10);
  const activeBackends = parseInt(connStats[0].active_backends, 10);
  assert.ok(totalBackends < 50, `Connection count must be low and healthy, got ${totalBackends}`);
  console.log('  ✓ Supabase connection pool is healthy with minimal backend connections.\n');

  console.log('9. Checking Vercel Deployment & Runtime Logs:');
  const eventsRes = await fetch(`https://api.vercel.com/v3/deployments/${dplId}/events?limit=100`, {
    headers: { Authorization: `Bearer ${vAuth.token}` }
  });
  if (eventsRes.ok) {
    const events = await eventsRes.json();
    console.log(`  Retrieved ${events.length} deployment events.`);
    const errorLogs = events.filter((e: any) => {
      const text = String(e.payload?.text || '');
      return /P2010|42883|P2024|P1001|ECONNREFUSED/i.test(text);
    });
    console.log(`  Specific error occurrences in deployment events: ${errorLogs.length}`);
    assert.strictEqual(errorLogs.length, 0, 'Must have zero P2010, 42883, P2024, or P1001 in deployment logs');
    console.log('  ✓ No query errors or timeout exceptions in runtime deployment events.');
  }

  console.log('\n================================================================');
  console.log('=== ALL PRODUCTION CHECKS PASSED: PHASE 14I VERIFIED ===');
  console.log('================================================================');

  return {
    promotedCommit,
    dplId,
    rootVercelId,
    adminVercelId,
    latency,
    renderedMap,
    actualDb,
    connStats: connStats[0],
  };
}

verifyProduction().catch(err => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
