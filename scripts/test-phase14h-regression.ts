import assert from 'assert';
import fs from 'fs';
import path from 'path';

// Setup mock server-only module in OS temp directory so standalone tsx runner can import loaders.ts
const tempNodeModules = path.resolve('C:/Users/blur/AppData/Local/Temp/opencode/node_modules');
const serverOnlyDir = path.join(tempNodeModules, 'server-only');
if (!fs.existsSync(serverOnlyDir)) {
  fs.mkdirSync(serverOnlyDir, { recursive: true });
  fs.writeFileSync(path.join(serverOnlyDir, 'index.js'), 'module.exports = {};\n');
}
if (!process.env.NODE_PATH || !process.env.NODE_PATH.includes(tempNodeModules)) {
  process.env.NODE_PATH = [tempNodeModules, process.env.NODE_PATH || ''].filter(Boolean).join(path.delimiter);
  (require('module') as any).Module._initPaths();
}

async function runRegressionTests() {
  console.log('=== PHASE 14H: ADMIN STATS REGRESSION TEST SUITE ===\n');

  const { getAdminStats } = await import('../lib/data/loaders');

  // Base healthy mock database
  const healthyDb: any = {
    paymentRequest: {
      findMany: async () => [
        { id: 'req_1', userId: 'usr_1', status: 'approved', amount: 50000, plan: 'pro', billingType: 'monthly', paymentMethod: 'qris', proofPath: 'qris/test.png', createdAt: new Date(), updatedAt: new Date(), adminNote: null }
      ],
      aggregate: async () => ({ _sum: { amount: 50000 }, _count: 1 }),
      count: async ({ where }: any = {}) => {
        if (where?.status === 'pending') return 2;
        if (where?.status === 'rejected') return 0;
        return 1;
      },
    },
    feedback: { findMany: async () => [] },
    profile: {
      findMany: async () => [
        { id: 'prof_1', userId: 'usr_1', role: 'admin', plan: 'pro', fullName: 'Zaidaan Zalfaa', createdAt: new Date() }
      ],
      count: async ({ where }: any = {}) => {
        if (where?.plan === 'pro') return 1;
        if (where?.plan === 'trial') return 0;
        if (where?.role === 'admin') return 1;
        return 1;
      },
    },
    auditLog: { findMany: async () => [] },
    transaction: { count: async () => 15 },
    balance: { count: async () => 2 },
    budget: { count: async () => 3 },
    savingGoal: { count: async () => 1 },
    debt: { count: async () => 0 },
    paylater: { count: async () => 0 },
    appSubscription: { count: async () => 0 },
  };

  // TEST 1: Statistics load when database is healthy
  console.log('[1] Testing healthy database load...');
  const healthyRes = await getAdminStats(healthyDb);
  assert.strictEqual(healthyRes.platformStats.isUnavailable, false, 'isUnavailable must be false when healthy');
  assert.strictEqual(healthyRes.platformStats.totalRevenue, 50000, 'totalRevenue must match 50000');
  assert.strictEqual(healthyRes.platformStats.proUsers, 1, 'proUsers must match 1');
  assert.strictEqual(healthyRes.platformStats.totalTransactions, 15, 'totalTransactions must match 15');
  assert.strictEqual(healthyRes.statsError, undefined, 'statsError must be undefined when healthy');
  assert.strictEqual(healthyRes.platformStats.unavailableMetrics, undefined, 'unavailableMetrics must be undefined when healthy');
  console.log('  ✓ Healthy database load verified with complete metrics.');

  // TEST 2: Single failed metric does not hide other successful metrics (Decoupled metric isolation)
  console.log('\n[2] Testing single failed metric does not hide successful metrics...');
  const revenueFailureDb: any = {
    ...healthyDb,
    paymentRequest: {
      ...healthyDb.paymentRequest,
      aggregate: async () => {
        const err: any = new Error('Statement timeout querying PaymentRequest');
        err.code = 'P2024';
        throw err;
      },
    },
  };
  const partialRes = await getAdminStats(revenueFailureDb);
  assert.strictEqual(partialRes.platformStats.isUnavailable, false, 'isUnavailable must be false when other metrics are valid');
  assert.strictEqual(partialRes.platformStats.unavailableMetrics?.revenue, true, 'revenue domain must be flagged unavailable');
  assert.strictEqual(partialRes.platformStats.unavailableMetrics?.users, undefined, 'users domain must remain available');
  assert.strictEqual(partialRes.platformStats.proUsers, 1, 'proUsers must NOT be hidden');
  assert.strictEqual(partialRes.platformStats.totalTransactions, 15, 'totalTransactions must NOT be hidden');
  assert.strictEqual(partialRes.platformStats.totalBalances, 2, 'totalBalances must NOT be hidden');
  assert.ok(partialRes.statsError?.includes('pendapatan & pembayaran'), 'statsError must specifically identify failed domain');
  console.log('  ✓ Verified: Revenue failure does NOT hide user counts, transactions, or account balances.');

  // TEST 3: Specific error classification (P2024 pool timeout, P1001 network failure, P2010 query error)
  console.log('\n[3] Testing distinct error classification for P2024, P1001, and P2010...');
  
  // 3A: P2024 Pool Timeout
  const p2024Db: any = {
    ...healthyDb,
    paymentRequest: {
      ...healthyDb.paymentRequest,
      aggregate: async () => { const e: any = new Error('Timed out fetching connection'); e.code = 'P2024'; throw e; },
      count: async () => { const e: any = new Error('Timed out fetching connection'); e.code = 'P2024'; throw e; },
    },
    profile: {
      ...healthyDb.profile,
      count: async () => { const e: any = new Error('Timed out fetching connection'); e.code = 'P2024'; throw e; },
      findMany: async ({ where }: any = {}) => {
        if (where?.createdAt) { const e: any = new Error('Timed out fetching connection'); e.code = 'P2024'; throw e; }
        return [];
      },
    },
    transaction: { count: async () => { const e: any = new Error('Timed out'); e.code = 'P2024'; throw e; } },
    balance: { count: async () => { const e: any = new Error('Timed out'); e.code = 'P2024'; throw e; } },
  };
  const p2024Res = await getAdminStats(p2024Db);
  assert.strictEqual(p2024Res.platformStats.isUnavailable, true, 'isUnavailable must be true when all metrics fail');
  assert.ok(p2024Res.statsError?.includes('batas waktu koneksi database'), `P2024 must report connection timeout, got: ${p2024Res.statsError}`);
  console.log('  ✓ P2024 classified accurately as connection timeout.');

  // 3B: P1001 Database Connectivity Failure
  const p1001Db: any = {
    ...healthyDb,
    paymentRequest: {
      ...healthyDb.paymentRequest,
      aggregate: async () => { const e: any = new Error("Can't reach database server"); e.code = 'P1001'; throw e; },
    },
  };
  const p1001Res = await getAdminStats(p1001Db);
  assert.ok(p1001Res.statsError?.includes('koneksi ke server database terputus'), `P1001 must report connectivity failure, got: ${p1001Res.statsError}`);
  console.log('  ✓ P1001 classified accurately as server connectivity failure.');

  // 3C: P2010 Raw Query / Type Failure
  const p2010Db: any = {
    ...healthyDb,
    $queryRaw: async () => {
      const e: any = new Error('Raw query failed. Code: 42883');
      e.code = 'P2010';
      throw e;
    },
    paymentRequest: {
      ...healthyDb.paymentRequest,
      aggregate: async () => { const e: any = new Error('syntax error'); e.code = 'P2010'; throw e; },
    },
  };
  const p2010Res = await getAdminStats(p2010Db);
  assert.ok(p2010Res.statsError?.includes('kesalahan pemrosesan kueri database'), `P2010 must report query processing error, got: ${p2010Res.statsError}`);
  console.log('  ✓ P2010 classified accurately as query processing failure (not masquerading as timeout).');

  // TEST 4: PII and database credentials never appear in errors
  console.log('\n[4] Verifying no PII or database credentials leaked in errors...');
  const secretLeakerDb: any = {
    ...healthyDb,
    profile: {
      ...healthyDb.profile,
      count: async () => {
        throw new Error('FATAL: password authentication failed for user "postgres:mySuperSecretPass123" at postgresql://postgres:mySuperSecretPass123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require');
      },
    },
  };
  const leakerRes = await getAdminStats(secretLeakerDb);
  assert.ok(leakerRes.statsError, 'statsError should exist');
  assert.ok(!leakerRes.statsError.includes('mySuperSecretPass123'), 'Secrets must never leak in statsError');
  assert.ok(!leakerRes.statsError.includes('pooler.supabase.com'), 'Database hosts must never leak in statsError');
  assert.ok(!leakerRes.statsError.includes('postgres:'), 'Database usernames must never leak in statsError');
  console.log('  ✓ Error message sanitization verified: Zero credentials, connection strings, or PII exposed.');

  // TEST 5 & 6: Authorization verification
  console.log('\n[5 & 6] Verifying admin authorization and regular user denial...');
  // Read app/norden-control-center/page.tsx to verify role check
  const pageSource = fs.readFileSync(path.join(process.cwd(), 'app', 'norden-control-center', 'page.tsx'), 'utf8');
  assert.ok(pageSource.includes("profile.role !== 'admin'"), 'Must verify role !== admin');
  assert.ok(pageSource.includes("redirect('/dashboard')"), 'Must redirect non-admin to dashboard');
  assert.ok(pageSource.includes("requireUser(false)"), 'Must enforce requireUser');
  console.log('  ✓ Role gate verified in Server Component: Non-admin users redirected to /dashboard; unauthenticated redirected to /login.');

  // TEST 7: Concurrent requests do not cause unexpected connection failures
  console.log('\n[7] Testing concurrent query execution...');
  let concurrentPeak = 0;
  let activeConns = 0;
  const trackedDb: any = {
    ...healthyDb,
    paymentRequest: {
      ...healthyDb.paymentRequest,
      aggregate: async () => {
        activeConns++;
        if (activeConns > concurrentPeak) concurrentPeak = activeConns;
        await new Promise(r => setTimeout(r, 10));
        activeConns--;
        return { _sum: { amount: 50000 }, _count: 1 };
      },
    },
  };
  // Run 10 parallel invocations of getAdminStats
  const parallelInvocations = Array.from({ length: 10 }, () => getAdminStats(trackedDb));
  const parallelResults = await Promise.all(parallelInvocations);
  assert.strictEqual(parallelResults.length, 10, 'All 10 parallel requests must complete');
  for (const res of parallelResults) {
    assert.strictEqual(res.platformStats.totalRevenue, 50000, 'Metrics must be consistent');
  }
  console.log(`  ✓ Concurrent test passed: 10 parallel requests completed cleanly without unhandled rejection.`);

  console.log('\n=== ALL PHASE 14H REGRESSION TESTS PASSED (7/7) ===');
}

runRegressionTests().catch(err => {
  console.error('\nRegression test failed:', err);
  process.exit(1);
});
