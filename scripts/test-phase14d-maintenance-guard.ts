import assert from 'assert';
import { Prisma } from '@prisma/client';
import { execSync } from 'child_process';
import { isMaintenanceMode, assertWritesAllowed } from '../lib/maintenance';

const testContainer = `norden_guard_test_${Date.now()}`;
const testPort = 5433;
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:${testPort}/postgres`;
process.env.DIRECT_URL = process.env.DATABASE_URL;

async function runMaintenanceIntegrationTests() {
  console.log('=== PHASE 14D-FREE: PRISMA MAINTENANCE GUARD INTEGRATION SUITE ===\n');

  const origMaintenance = process.env.MAINTENANCE_MODE;

  try {
    // Spin up temporary container for true end-to-end transaction testing
    console.log(`[0] Launching disposable local PostgreSQL 17 container on port ${testPort}...`);
    execSync(`docker run -d --name ${testContainer} -p ${testPort}:5432 -e POSTGRES_PASSWORD=postgres postgres:17-alpine`);

    let ready = false;
    for (let i = 0; i < 30; i++) {
      try {
        execSync(`docker exec ${testContainer} psql -h localhost -U postgres -c "SELECT 1;"`, { stdio: 'pipe' });
        ready = true;
        break;
      } catch {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    assert.ok(ready, 'PostgreSQL 17 test container ready');
    await new Promise(r => setTimeout(r, 1000));

    // Push schema to test container using prisma db push
    execSync(`npx prisma db push --skip-generate`, { stdio: 'pipe' });

  // Now dynamically import prisma so it picks up the active DATABASE_URL
  const { prisma } = await import('../lib/prisma');

  const origMaintenance = process.env.MAINTENANCE_MODE;

  // 1. Normal state (unfrozen)
  console.log('\n[1] Testing Normal Operation (Unfrozen)...');
    delete process.env.MAINTENANCE_MODE;
    delete process.env.NEXT_PUBLIC_MAINTENANCE_MODE;
    assert.strictEqual(isMaintenanceMode(), false);
    assert.doesNotThrow(() => assertWritesAllowed('normal-operation'));
    console.log('  ✓ Normal operations permitted when maintenance mode is inactive.');

    // 2. Activate maintenance freeze
    console.log('\n[2] Activating Maintenance Mode Freeze (MAINTENANCE_MODE=true)...');
    process.env.MAINTENANCE_MODE = 'true';
    assert.strictEqual(isMaintenanceMode(), true);
    assert.throws(
      () => assertWritesAllowed('test-action'),
      (err: any) => err.message.includes('MAINTENANCE_ACTIVE'),
      'assertWritesAllowed must fail-closed'
    );
    console.log('  ✓ assertWritesAllowed fail-closed verified.');

    // 3. Model Mutations Rejection (7 operations)
    console.log('\n[3] Testing All 7 Prisma Model Mutation Operations...');
    const modelMutations = [
      { name: 'create', fn: () => prisma.profile.create({ data: { id: 'p1', userId: 'u1', trialStartedAt: new Date(), trialEndsAt: new Date() } }) },
      { name: 'createMany', fn: () => prisma.category.createMany({ data: [{ id: 'c1', userId: 'u1', name: 'Cat', type: 'keluar' }] }) },
      { name: 'update', fn: () => prisma.profile.update({ where: { userId: 'u1' }, data: { fullName: 'Test' } }) },
      { name: 'updateMany', fn: () => prisma.balance.updateMany({ where: { userId: 'u1' }, data: { currentBalance: 0 } }) },
      { name: 'upsert', fn: () => prisma.profile.upsert({ where: { userId: 'u1' }, create: { id: 'p1', userId: 'u1', trialStartedAt: new Date(), trialEndsAt: new Date() }, update: {} }) },
      { name: 'delete', fn: () => prisma.profile.delete({ where: { userId: 'u1' } }) },
      { name: 'deleteMany', fn: () => prisma.transaction.deleteMany({ where: { userId: 'u1' } }) },
    ];

    for (const op of modelMutations) {
      await assert.rejects(
        op.fn,
        (err: any) => {
          assert.ok(err.message.includes('MAINTENANCE_ACTIVE'), `Expected MAINTENANCE_ACTIVE for ${op.name}, got: ${err.message}`);
          assert.ok(err.message.includes(`Write operation "`), `Expected write operation message for ${op.name}`);
          return true;
        },
        `Operation ${op.name} must be blocked by maintenance freeze`
      );
      console.log(`  ✓ prisma.${op.name} blocked before database access.`);
    }

    // 4. Raw SQL Mutations Rejection ($executeRaw, $executeRawUnsafe)
    console.log('\n[4] Testing Raw SQL Mutations Rejection ($executeRaw, $executeRawUnsafe)...');
    await assert.rejects(
      async () => {
        await prisma.$executeRaw`DELETE FROM "RateLimitBucket" WHERE "key" = 'test';`;
      },
      (err: any) => {
        assert.ok(err.message.includes('MAINTENANCE_ACTIVE'));
        assert.ok(err.message.includes('Raw SQL execution ($executeRaw) is blocked'));
        return true;
      },
      '$executeRaw must be blocked unconditionally during maintenance'
    );
    console.log('  ✓ prisma.$executeRaw unconditionally blocked.');

    await assert.rejects(
      async () => {
        await prisma.$executeRawUnsafe('UPDATE "Setting" SET "value" = \'0\' WHERE "key" = \'test\';');
      },
      (err: any) => {
        assert.ok(err.message.includes('MAINTENANCE_ACTIVE'));
        assert.ok(err.message.includes('Raw SQL execution ($executeRawUnsafe) is blocked'));
        return true;
      },
      '$executeRawUnsafe must be blocked unconditionally during maintenance'
    );
    console.log('  ✓ prisma.$executeRawUnsafe unconditionally blocked.');

    // 5. $queryRaw containing INSERT ... RETURNING and DML
    console.log('\n[5] Testing $queryRaw with INSERT ... RETURNING and DML mutations...');
    await assert.rejects(
      async () => {
        await prisma.$queryRaw`
          INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "updatedAt")
          VALUES ('test_key', 1, NOW(), NOW())
          RETURNING "count", "resetAt"
        `;
      },
      (err: any) => {
        assert.ok(err.message.includes('MAINTENANCE_ACTIVE'));
        assert.ok(err.message.includes('Raw SQL query contains mutating statement'));
        return true;
      },
      '$queryRaw with INSERT ... RETURNING must be blocked during maintenance'
    );
    console.log('  ✓ prisma.$queryRaw with INSERT ... RETURNING blocked.');

    await assert.rejects(
      async () => {
        await prisma.$queryRawUnsafe('DELETE FROM "Profile" RETURNING *;');
      },
      (err: any) => {
        assert.ok(err.message.includes('MAINTENANCE_ACTIVE'));
        assert.ok(err.message.includes('Raw SQL query contains mutating statement'));
        return true;
      },
      '$queryRawUnsafe with DELETE must be blocked during maintenance'
    );
    console.log('  ✓ prisma.$queryRawUnsafe with DML blocked.');

    // 6. Interactive and Batch Transactions Cannot Bypass Guard
    console.log('\n[6] Testing Interactive and Batch Transactions...');
    // A. Batch transaction
    await assert.rejects(
      async () => {
        await prisma.$transaction([
          prisma.profile.create({ data: { id: 'tx_b1', userId: 'tx_batch', trialStartedAt: new Date(), trialEndsAt: new Date() } }),
          prisma.balance.create({ data: { id: 'tx_b2', userId: 'tx_batch', name: 'Wallet', type: 'bank', currentBalance: 100 } }),
        ]);
      },
      (err: any) => {
        assert.ok(err.message.includes('MAINTENANCE_ACTIVE'));
        return true;
      },
      'Batch transactions must be blocked during maintenance'
    );
    console.log('  ✓ prisma.$transaction batch blocked.');

    // B. Interactive transaction
    await assert.rejects(
      async () => {
        await prisma.$transaction(async (tx) => {
          await tx.profile.create({ data: { id: 'tx_i1', userId: 'tx_interactive', trialStartedAt: new Date(), trialEndsAt: new Date() } });
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('MAINTENANCE_ACTIVE'), `Expected MAINTENANCE_ACTIVE in interactive tx, got: ${err.message}`);
        assert.ok(err.message.includes('interactive transaction is blocked'));
        return true;
      },
      'Interactive transactions must be blocked during maintenance'
    );
    console.log('  ✓ prisma.$transaction interactive closure blocked.');

    // 7. Safe Read Operations Permitted
    console.log('\n[7] Testing Read Operations Permitted Under Maintenance Freeze...');
    // A. Model read (findMany)
    const plans = await prisma.plan.findMany();
    assert.strictEqual(Array.isArray(plans), true);
    console.log(`  ✓ prisma.plan.findMany read query executed successfully (count = ${plans.length}).`);

    // B. Raw read-only SELECT via $queryRaw
    const rawResult: any = await prisma.$queryRaw(Prisma.sql`SELECT count(*)::int as total FROM "Plan";`);
    assert.strictEqual(Array.isArray(rawResult), true);
    console.log(`  ✓ prisma.$queryRaw with read-only SELECT executed successfully (result = ${rawResult[0]?.total}).`);

    // 8. Sanitization & Zero Leakage
    console.log('\n[8] Verifying Error Messages Do Not Leak Secrets or Connection Strings...');
    try {
      assertWritesAllowed('test-leakage');
    } catch (err: any) {
      assert.ok(!err.message.includes('postgres://'));
      assert.ok(!err.message.includes('password'));
      assert.ok(!err.message.includes('apiKey'));
      assert.ok(!err.message.includes('token'));
      console.log('  ✓ Error message is sanitized and does not leak credentials.');
    }

    // 9. Verify Cron and Upload Handlers Fail-Closed with HTTP 503
    console.log('\n[9] Verifying Cron and Upload Handlers Fail-Closed with HTTP 503...');
    process.env.MAINTENANCE_MODE = 'true';
    const { GET: handleCron } = await import('../app/api/cron/recurring/route');
    process.env.CRON_SECRET = 'test_cron_secret';
    const cronRes = await handleCron(new Request('http://localhost/api/cron/recurring', {
      headers: { Authorization: 'Bearer test_cron_secret' }
    }));
    console.log(`  GET /api/cron/recurring (under maintenance) -> Status ${cronRes.status}`);
    assert.strictEqual(cronRes.status, 503, 'Cron recurring must return 503 during maintenance');
    const cronJson = await cronRes.json();
    assert.strictEqual(cronJson.reason, 'maintenance_freeze_active');
    console.log('  ✓ Cron recurring handler returned HTTP 503 (maintenance_freeze_active).');

    const { POST: handleUploadQris } = await import('../app/api/upload/qris/route');
    const uploadRes = await handleUploadQris(new Request('http://localhost/api/upload/qris', {
      method: 'POST',
      headers: { origin: 'http://localhost' },
      body: new FormData()
    }));
    console.log(`  POST /api/upload/qris (under maintenance) -> Status ${uploadRes.status}`);
    assert.strictEqual(uploadRes.status, 503, 'Upload QRIS must return 503 during maintenance');
    const uploadJson = await uploadRes.json();
    assert.strictEqual(uploadJson.maintenance, true);
    console.log('  ✓ Upload QRIS handler returned HTTP 503 with maintenance: true.');

    // 10. Deactivation Restores Normal Operations
    console.log('\n[10] Testing Clean Deactivation...');
    delete process.env.MAINTENANCE_MODE;
    assert.strictEqual(isMaintenanceMode(), false);
    assert.doesNotThrow(() => assertWritesAllowed('resumed'));
    console.log('  ✓ Write allowance cleanly restored upon deactivating MAINTENANCE_MODE.');

    console.log('\n=== ALL MAINTENANCE GUARD INTEGRATION TESTS PASSED (100%) ===');
  } finally {
    if (origMaintenance !== undefined) process.env.MAINTENANCE_MODE = origMaintenance;
    else delete process.env.MAINTENANCE_MODE;

    console.log(`\n[10] Cleaning up test container ${testContainer}...`);
    try {
      execSync(`docker rm -f ${testContainer}`, { stdio: 'pipe' });
      console.log('  ✓ Test container destroyed.');
    } catch {}
  }
}

runMaintenanceIntegrationTests().catch(err => {
  console.error('\nMaintenance Test Failed:', err);
  process.exit(1);
});
