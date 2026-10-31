import assert from 'assert';
import { isMaintenanceMode, assertWritesAllowed, WRITE_OPERATIONS } from '../lib/maintenance';
import { prisma } from '../lib/prisma';

async function runWriteFreezeTests() {
  console.log('=== PHASE 14C-FREE: WRITE-FREEZE & MAINTENANCE GUARD REGRESSION SUITE ===\n');

  const originalMaintenanceMode = process.env.MAINTENANCE_MODE;

  try {
    // 1. Inactive Maintenance Mode Behavior
    console.log('[1] Testing Normal Operation (MAINTENANCE_MODE unset / false)...');
    delete process.env.MAINTENANCE_MODE;
    delete process.env.NEXT_PUBLIC_MAINTENANCE_MODE;
    assert.strictEqual(isMaintenanceMode(), false, 'isMaintenanceMode must be false');
    assert.doesNotThrow(() => assertWritesAllowed('test-action'), 'assertWritesAllowed must pass');
    console.log('  ✓ Normal operations permitted when maintenance mode is inactive.');

    // 2. Active Maintenance Mode Flag
    console.log('\n[2] Activating Maintenance Mode (MAINTENANCE_MODE=true)...');
    process.env.MAINTENANCE_MODE = 'true';
    assert.strictEqual(isMaintenanceMode(), true, 'isMaintenanceMode must be true');
    assert.throws(
      () => assertWritesAllowed('user-create-transaction'),
      (err: any) => {
        assert.ok(err.message.includes('MAINTENANCE_ACTIVE'));
        assert.ok(err.message.includes('write-freeze active for user-create-transaction'));
        return true;
      },
      'assertWritesAllowed must reject with MAINTENANCE_ACTIVE'
    );
    console.log('  ✓ assertWritesAllowed fail-closed rejection verified.');

    // 3. Prisma Client Middleware Write Rejection
    console.log('\n[3] Testing Prisma Client Middleware Write-Quarantine...');
    // A. Verify write operations are in the quarantine set
    for (const op of ['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany', 'executeRaw']) {
      assert.ok(WRITE_OPERATIONS.has(op), `Operation ${op} must be in WRITE_OPERATIONS set`);
    }
    console.log('  ✓ All 8 mutating operations mapped in WRITE_OPERATIONS quarantine.');

    // B. Attempt write operation through Prisma
    await assert.rejects(
      async () => {
        await prisma.profile.create({
          data: {
            userId: 'freeze_test_uid',
            role: 'user',
            plan: 'trial',
            trialStartedAt: new Date(),
            trialEndsAt: new Date(),
          },
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('MAINTENANCE_ACTIVE'), `Expected MAINTENANCE_ACTIVE, got: ${err.message}`);
        assert.ok(err.message.includes('Write operation "Profile.create" is blocked by system maintenance freeze'));
        return true;
      },
      'Prisma create must be blocked under maintenance mode'
    );
    console.log('  ✓ Prisma Profile.create blocked before touching database.');

    await assert.rejects(
      async () => {
        await prisma.balance.updateMany({
          where: { userId: 'freeze_test_uid' },
          data: { currentBalance: 999999 },
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('MAINTENANCE_ACTIVE'));
        assert.ok(err.message.includes('Write operation "Balance.updateMany" is blocked by system maintenance freeze'));
        return true;
      },
      'Prisma updateMany must be blocked under maintenance mode'
    );
    console.log('  ✓ Prisma Balance.updateMany blocked before touching database.');

    await assert.rejects(
      async () => {
        await prisma.transaction.deleteMany({
          where: { userId: 'freeze_test_uid' },
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('MAINTENANCE_ACTIVE'));
        assert.ok(err.message.includes('Write operation "Transaction.deleteMany" is blocked by system maintenance freeze'));
        return true;
      },
      'Prisma deleteMany must be blocked under maintenance mode'
    );
    console.log('  ✓ Prisma Transaction.deleteMany blocked before touching database.');

    // 4. Verify Read Operations are NOT Blocked by Middleware
    console.log('\n[4] Testing Prisma Client Middleware Permits Safe Read Queries...');
    // We test with count or findUnique (which do not match WRITE_OPERATIONS)
    // Note: since test runs against DB, count should either return a number or fail on connection, not on MAINTENANCE_ACTIVE
    try {
      const count = await prisma.plan.count();
      assert.strictEqual(typeof count, 'number');
      console.log(`  ✓ Prisma Plan.count read allowed under maintenance mode (count = ${count}).`);
    } catch (err: any) {
      assert.strictEqual(
        err.message.includes('blocked by system maintenance freeze'),
        false,
        'Read queries must never be blocked by maintenance freeze'
      );
      console.log('  ✓ Prisma Plan.count passed middleware without being blocked by maintenance freeze.');
    }

    // 5. Verify Deactivation Restores Normal Writes
    console.log('\n[5] Testing Deactivation of Maintenance Mode...');
    delete process.env.MAINTENANCE_MODE;
    assert.strictEqual(isMaintenanceMode(), false);
    assert.doesNotThrow(() => assertWritesAllowed('test'));
    console.log('  ✓ Maintenance mode deactivation cleanly restores write allowance.');

    console.log('\n=== ALL WRITE-FREEZE REGRESSION TESTS PASSED ===');
  } finally {
    if (originalMaintenanceMode !== undefined) process.env.MAINTENANCE_MODE = originalMaintenanceMode;
    else delete process.env.MAINTENANCE_MODE;
  }
}

runWriteFreezeTests().catch(err => {
  console.error('\nWrite-Freeze Test Failure:', err);
  process.exit(1);
});
