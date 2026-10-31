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

async function run() {
  console.log('--- Starting Phase 13A Optimization Verification Suite ---');

  const { syncAchievements } = await import('../lib/achievements');
  const { getAdminStats } = await import('../lib/data/loaders');

  // ==========================================
  // TEST SUITE 1: ACHIEVEMENT WRITE-ON-READ ELIMINATION & ZERO-WRITE REPEATED GET
  // ==========================================
  console.log('\n[1] Testing Achievement Zero-Write on Repeated Evaluation...');

  let upsertCount = 0;
  let deleteCount = 0;
  let findManyCount = 0;

  const mockDbAchievements: any[] = [];

  const mockPrisma: any = {
    achievement: {
      findMany: async () => {
        findManyCount++;
        return [...mockDbAchievements];
      },
      upsert: async ({ create }: any) => {
        upsertCount++;
        const record = {
          id: 'ach_' + (mockDbAchievements.length + 1),
          userId: create.userId,
          title: create.title,
          description: create.description,
          unlockedAt: new Date(),
        };
        mockDbAchievements.push(record);
        return record;
      },
      deleteMany: async ({ where }: any) => {
        deleteCount++;
        const toDelete = new Set(where.title.in);
        for (let i = mockDbAchievements.length - 1; i >= 0; i--) {
          if (toDelete.has(mockDbAchievements[i].title)) {
            mockDbAchievements.splice(i, 1);
          }
        }
        return { count: toDelete.size };
      },
    },
    transaction: {
      findMany: async () => [
        { transactionDate: new Date('2026-10-01') },
        { transactionDate: new Date('2026-10-02') },
      ],
    },
    balance: {
      findMany: async () => [{ currentBalance: 1500000 }],
    },
    savingGoal: {
      findMany: async () => [{ targetAmount: 1000000, currentAmount: 1000000 }],
    },
    emergencyFundPlan: {
      findUnique: async () => ({ monthlyExpense: 500000 }),
    },
  };

  // Run 1: First sync should unlock 'First Transaction', 'Million Balance', 'Saving Goal Reached', 'Emergency Fund 3 Months'
  const run1 = await syncAchievements(mockPrisma, 'user_123');
  assert.strictEqual(run1.length, 4, 'Run 1 should return 4 unlocked achievements');
  assert.strictEqual(upsertCount, 4, 'Run 1 should execute exactly 4 upserts');
  assert.strictEqual(deleteCount, 0, 'Run 1 should execute 0 deletes');

  // Run 2: Repeated GET with exact same data must trigger ZERO WRITES
  const initialUpserts = upsertCount;
  const initialDeletes = deleteCount;
  const run2 = await syncAchievements(mockPrisma, 'user_123');
  assert.strictEqual(run2.length, 4, 'Run 2 should return same 4 unlocked achievements');
  assert.strictEqual(upsertCount, initialUpserts, 'Run 2 must perform ZERO upserts');
  assert.strictEqual(deleteCount, initialDeletes, 'Run 2 must perform ZERO deletes');
  console.log('  ✓ Verified: Repeated evaluation results in 0 database writes.');

  // ==========================================
  // TEST SUITE 2: PRELOADED DATA BYPASSES REDUNDANT SELECTS
  // ==========================================
  console.log('\n[2] Testing Preloaded Data Input Avoids Redundant Table Queries...');

  let txQueryCalled = false;
  let balQueryCalled = false;
  let goalQueryCalled = false;
  let efQueryCalled = false;

  const mockPreloadDb: any = {
    achievement: {
      findMany: async () => [...mockDbAchievements],
      upsert: async () => {},
      deleteMany: async () => {},
    },
    transaction: {
      findMany: async () => { txQueryCalled = true; return []; },
    },
    balance: {
      findMany: async () => { balQueryCalled = true; return []; },
    },
    savingGoal: {
      findMany: async () => { goalQueryCalled = true; return []; },
    },
    emergencyFundPlan: {
      findUnique: async () => { efQueryCalled = true; return null; },
    },
  };

  await syncAchievements(mockPreloadDb, 'user_123', {
    transactions: [{ transactionDate: new Date('2026-10-01') }],
    balances: [{ currentBalance: 2000000 }],
    goals: [],
    emergencyFundPlan: null,
  });

  assert.strictEqual(txQueryCalled, false, 'Transaction table should not be queried when preloaded');
  assert.strictEqual(balQueryCalled, false, 'Balance table should not be queried when preloaded');
  assert.strictEqual(goalQueryCalled, false, 'SavingGoal table should not be queried when preloaded');
  assert.strictEqual(efQueryCalled, false, 'EmergencyFundPlan table should not be queried when preloaded');
  console.log('  ✓ Verified: Preloaded data bypassed all 4 redundant SELECT queries.');

  // ==========================================
  // TEST SUITE 3: REVERSED / DELETED TRANSACTION REVOCATION
  // ==========================================
  console.log('\n[3] Testing Reversed / Deleted Transactions Revocation...');

  // User deletes all transactions (0 transactions left)
  const emptyPreloadDb: any = {
    achievement: mockPrisma.achievement,
    transaction: { findMany: async () => [] },
    balance: { findMany: async () => [{ currentBalance: 1500000 }] },
    savingGoal: { findMany: async () => [{ targetAmount: 1000000, currentAmount: 1000000 }] },
    emergencyFundPlan: { findUnique: async () => ({ monthlyExpense: 500000 }) },
  };

  const beforeRevoke = mockDbAchievements.find(a => a.title === 'First Transaction');
  assert(beforeRevoke, 'First Transaction should have been present before deletion');

  const runAfterDelete = await syncAchievements(emptyPreloadDb, 'user_123', {
    transactions: [], // zero transactions
    balances: [{ currentBalance: 1500000 }],
    goals: [{ targetAmount: 1000000, currentAmount: 1000000 }],
    emergencyFundPlan: { monthlyExpense: 500000 },
  });

  const afterRevoke = runAfterDelete.find(a => a.title === 'First Transaction');
  assert.strictEqual(afterRevoke, undefined, 'First Transaction must be revoked when transactions are deleted');
  assert(deleteCount > initialDeletes, 'deleteMany must be called to purge revoked achievements');
  console.log('  ✓ Verified: Unearned achievements revoked upon qualifying record deletion.');

  // ==========================================
  // TEST SUITE 4: ADMIN STATS SQL AGGREGATION VIA $queryRaw
  // ==========================================
  console.log('\n[4] Testing Admin Stats $queryRaw Single Aggregation...');

  let queryRawCalled = false;
  const mockAdminDb: any = {
    paymentRequest: {
      findMany: async () => [],
    },
    feedback: {
      findMany: async () => [],
    },
    profile: {
      findMany: async () => [],
    },
    auditLog: {
      findMany: async () => [],
    },
    $queryRaw: async () => {
      queryRawCalled = true;
      return [{
        totalUsers: 25,
        proUsers: 10,
        trialUsers: 15,
        adminUsers: 2,
        totalTransactions: 150,
        totalBalances: 8,
        totalBudgets: 5,
        totalSavingGoals: 3,
        totalDebts: 2,
        totalPaylaters: 1,
        totalSubscriptions: 4,
        totalRevenue: 500000,
        approvedPayments: 5,
        pendingPayments: 2,
        rejectedPayments: 1,
      }];
    },
  };

  const statsResult = await getAdminStats(mockAdminDb);
  assert.strictEqual(queryRawCalled, true, '$queryRaw must be called for consolidated aggregation');
  assert.strictEqual(statsResult.platformStats.totalUsers, 25, 'totalUsers must match SQL result');
  assert.strictEqual(statsResult.platformStats.totalRevenue, 500000, 'totalRevenue must match SQL result');
  assert.strictEqual(statsResult.platformStats.totalTransactions, 150, 'totalTransactions must match SQL result');
  assert.strictEqual(statsResult.platformStats.isUnavailable, false, 'isUnavailable must be false');
  console.log('  ✓ Verified: Admin stats executes single $queryRaw aggregation with exact output mapping.');

  console.log('\n--- ALL PHASE 13A OPTIMIZATION TESTS PASSED ---');
}

run().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
