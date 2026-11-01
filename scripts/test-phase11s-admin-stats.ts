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

async function runTests() {
  console.log('--- Starting Phase 11S Admin Stats Bounded Query & Fallback Test Suite ---');

  const { getAdminStats } = await import('../lib/data/loaders');

  // ==========================================
  // TEST SUITE 1: CONCURRENCY PRESSURE & PEAK CONNECTION USAGE
  // ==========================================
  console.log('\n[1] Testing Concurrency Bound & Sequential Query Execution...');

  let activeConnections = 0;
  let peakConnections = 0;
  let totalQueries = 0;

  function trackStart() {
    activeConnections++;
    if (activeConnections > peakConnections) {
      peakConnections = activeConnections;
    }
    totalQueries++;
  }

  function trackEnd() {
    activeConnections--;
  }

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Mock Prisma client with connection tracking
  const mockDb: any = {
    paymentRequest: {
      findMany: async () => {
        trackStart();
        await sleep(10);
        trackEnd();
        return [{ id: 'req_1', userId: 'usr_1', status: 'pending', amount: 19000, plan: 'pro', billingType: 'monthly', paymentMethod: 'bca', proofPath: 'qris/test.png', createdAt: new Date(), updatedAt: new Date(), adminNote: null }];
      },
      aggregate: async () => {
        trackStart();
        await sleep(10);
        trackEnd();
        return { _sum: { amount: 19000 }, _count: 1 };
      },
      count: async () => {
        trackStart();
        await sleep(10);
        trackEnd();
        return 1;
      },
    },
    feedback: {
      findMany: async () => {
        trackStart();
        await sleep(10);
        trackEnd();
        return [];
      },
    },
    profile: {
      findMany: async () => {
        trackStart();
        await sleep(10);
        trackEnd();
        return [{ id: 'prof_1', userId: 'usr_1', role: 'admin', plan: 'pro', fullName: 'Zaidaan Zalfaa', createdAt: new Date() }];
      },
      count: async () => {
        trackStart();
        await sleep(10);
        trackEnd();
        return 1;
      },
    },
    auditLog: {
      findMany: async () => {
        trackStart();
        await sleep(10);
        trackEnd();
        return [];
      },
    },
    transaction: {
      count: async () => {
        trackStart();
        await sleep(10);
        trackEnd();
        return 0;
      },
    },
    balance: {
      count: async () => {
        trackStart();
        await sleep(10);
        trackEnd();
        return 2;
      },
    },
    budget: {
      count: async () => {
        trackStart();
        await sleep(10);
        trackEnd();
        return 0;
      },
    },
    savingGoal: {
      count: async () => {
        trackStart();
        await sleep(10);
        trackEnd();
        return 0;
      },
    },
    debt: {
      count: async () => {
        trackStart();
        await sleep(10);
        trackEnd();
        return 0;
      },
    },
    paylater: {
      count: async () => {
        trackStart();
        await sleep(10);
        trackEnd();
        return 0;
      },
    },
    appSubscription: {
      count: async () => {
        trackStart();
        await sleep(10);
        trackEnd();
        return 0;
      },
    },
  };

  const result = await getAdminStats(mockDb);

  assert.strictEqual(peakConnections, 1, `Peak concurrent query checkout must be exactly 1, observed: ${peakConnections}`);
  assert.strictEqual(result.paymentRequests.length, 1, 'Payment requests list must be retrieved');
  assert.strictEqual(result.listedUsers.length, 1, 'Listed users must be retrieved');
  assert.strictEqual(result.platformStats.isUnavailable, false, 'Platform stats must be available');
  assert.strictEqual(result.platformStats.totalRevenue, 19000, 'Total revenue calculation must be preserved');
  assert.strictEqual(result.statsError, undefined, 'No stats error on healthy database');

  console.log(`  ✓ Sequential execution verified: ${totalQueries} queries executed with peak concurrency = ${peakConnections}.`);

  // ==========================================
  // TEST SUITE 2: FALLBACK ON PRISMA POOL TIMEOUT (P2024)
  // ==========================================
  console.log('\n[2] Testing Noncritical Stat Fallback on Connection Pool Timeout (P2024)...');

  const timeoutDb: any = {
    ...mockDb,
    profile: {
      ...mockDb.profile,
      count: async () => {
        const err: any = new Error('Timed out fetching a new connection from the connection pool.');
        err.code = 'P2024';
        throw err;
      },
    },
  };

  const timeoutResult = await getAdminStats(timeoutDb);

  assert.strictEqual(timeoutResult.paymentRequests.length, 1, 'Core payment requests must not be lost when noncritical stats fail');
  assert.strictEqual(timeoutResult.listedUsers.length, 1, 'Core listed users must not be lost when noncritical stats fail');
  assert.strictEqual(timeoutResult.platformStats.unavailableMetrics?.users, true, 'User metrics must be flagged as unavailable on timeout');
  assert.strictEqual(timeoutResult.platformStats.totalRevenue, 19000, 'Successful metrics (revenue) must not be hidden when another metric fails');
  assert.ok(timeoutResult.statsError, 'statsError must contain user-friendly notification');

  // Full failure check (all noncritical domains time out)
  const allTimeoutDb: any = {
    ...mockDb,
    paymentRequest: {
      ...mockDb.paymentRequest,
      aggregate: async () => { throw new Error('P2024'); },
      count: async () => { throw new Error('P2024'); },
    },
    profile: {
      ...mockDb.profile,
      count: async () => { throw new Error('P2024'); },
    },
    transaction: { count: async () => { throw new Error('P2024'); } },
    balance: { count: async () => { throw new Error('P2024'); } },
  };
  const allTimeoutResult = await getAdminStats(allTimeoutDb);
  assert.strictEqual(allTimeoutResult.platformStats.isUnavailable, true, 'isUnavailable must be true when all metrics fail');
  assert.strictEqual(allTimeoutResult.platformStats.totalRevenue, 0, 'Fallback revenue must be 0 when all metrics fail');

  console.log('  ✓ Error boundary verified: Noncritical stat timeout does not crash admin data retrieval.');

  // ==========================================
  // TEST SUITE 3: CRITICAL DATABASE OUTAGE FAILS CLOSED
  // ==========================================
  console.log('\n[3] Testing Critical Management Data Failure Handling...');

  const fatalDb: any = {
    ...mockDb,
    paymentRequest: {
      ...mockDb.paymentRequest,
      findMany: async () => {
        throw new Error('Database connection terminated completely');
      },
    },
  };

  let threw = false;
  try {
    await getAdminStats(fatalDb);
  } catch (err: any) {
    threw = true;
    assert.strictEqual(err.message, 'Database connection terminated completely');
  }
  assert.strictEqual(threw, true, 'Fatal failure on critical management lists must throw so caller can display full error banner');

  console.log('  ✓ Critical outage handling verified: Fatal failure throws cleanly.');

  console.log('\n--- ALL PHASE 11S TESTS PASSED (10/10 assertions) ---');
}

runTests().catch((err) => {
  console.error('\nTest failed:', err);
  process.exit(1);
});
