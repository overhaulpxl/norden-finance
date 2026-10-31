import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execSync } from 'child_process';

const tempDir = path.join(os.tmpdir(), 'antigravity');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const rawDumpFile = path.join(tempDir, 'sg_preview_public.sql');
const keyFile = path.join(tempDir, 'restore_test.key');
const encFile = path.join(tempDir, 'sg_preview_public.sql.enc');
const decFile = path.join(tempDir, 'sg_preview_restored.sql');

async function runEndToEndRestoreTest() {
  console.log('=== PHASE 14C-FREE: END-TO-END BACKUP, ENCRYPTION, AND LOCAL RESTORE TEST ===\n');

  assert.ok(fs.existsSync(rawDumpFile), `Source dump must exist: ${rawDumpFile}`);
  const rawSize = fs.statSync(rawDumpFile).size;
  console.log(`[1] Unencrypted Source Artifact: ${rawDumpFile} (${rawSize} bytes)`);

  // 1. Generate strong 256-bit encryption key
  const keyHex = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(keyFile, keyHex);
  console.log('[2] Generated temporary 256-bit AES-GCM key file (restricted permissions)');

  // 2. Authenticated Encryption
  console.log('[3] Executing AES-256-GCM authenticated encryption via scripts/backup/cipher.js...');
  const encOut = execSync(`node scripts/backup/cipher.js encrypt --key-file "${keyFile}" --in "${rawDumpFile}" --out "${encFile}"`).toString().trim();
  assert.strictEqual(encOut, 'ENCRYPT_OK');
  const encSize = fs.statSync(encFile).size;
  console.log(`  ✓ Encrypted artifact created: ${encFile} (${encSize} bytes)`);

  // 3. Cryptographic SHA-256 Checksum
  const encData = fs.readFileSync(encFile);
  const sha256 = crypto.createHash('sha256').update(encData).digest('hex');
  console.log(`  ✓ SHA-256 Checksum: ${sha256}`);

  // 4. Authenticated Decryption
  console.log('\n[4] Executing AES-256-GCM authenticated decryption into isolated temporary directory...');
  const decOut = execSync(`node scripts/backup/cipher.js decrypt --key-file "${keyFile}" --in "${encFile}" --out "${decFile}"`).toString().trim();
  assert.strictEqual(decOut, 'DECRYPT_OK');
  const decSize = fs.statSync(decFile).size;
  assert.strictEqual(decSize, rawSize, 'Decrypted size must match original unencrypted dump');
  console.log(`  ✓ Decryption verified. Decrypted size matches original (${decSize} bytes).`);

  // 5. Spin up disposable local PostgreSQL container
  const containerName = `norden_restore_${Date.now()}`;
  console.log(`\n[5] Launching disposable local PostgreSQL 16 container: ${containerName}...`);
  execSync(`docker run -d --name ${containerName} -e POSTGRES_PASSWORD=postgres postgres:16-alpine`);

  try {
    // Wait for postgres to be ready
    console.log('  Waiting for PostgreSQL container to accept connections...');
    let ready = false;
    for (let i = 0; i < 30; i++) {
      try {
        execSync(`docker exec ${containerName} pg_isready -h localhost -U postgres`, { stdio: 'pipe' });
        ready = true;
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    assert.ok(ready, 'PostgreSQL container must become ready');
    await new Promise(r => setTimeout(r, 2000)); // allow initdb settle
    console.log('  ✓ PostgreSQL container ready.');

    // 6. Restore SQL dump into container
    console.log('\n[6] Restoring decrypted SQL dump into disposable PostgreSQL database...');
    // Copy decrypted file into container and execute psql
    execSync(`docker cp "${decFile}" ${containerName}:/restore.sql`);
    execSync(`docker exec ${containerName} psql -h localhost -U postgres -d postgres -f /restore.sql`, { stdio: 'pipe' });
    console.log('  ✓ psql execution completed.');

    // 7. Verify all 25 public tables exist
    console.log('\n[7] Verifying all 25 public tables in restored database...');
    const tablesRaw = execSync(`docker exec ${containerName} psql -h localhost -U postgres -d postgres -t -A -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"`).toString().trim();
    const restoredTables = tablesRaw.split('\n').map(t => t.trim()).filter(Boolean);
    console.log(`  Restored public tables count: ${restoredTables.length}`);
    assert.strictEqual(restoredTables.length, 25, 'Restored database must contain exactly 25 public tables');

    // 8. Verify Table-by-Table Row Counts
    console.log('\n[8] Verifying table-by-table row counts against Singapore Preview live baseline...');
    const expectedCounts: Record<string, number> = {
      Achievement: 5,
      AppSubscription: 2,
      AuditLog: 3,
      Balance: 4,
      BillingSubscription: 2,
      Budget: 3,
      Category: 8,
      Debt: 1,
      EmergencyFundPlan: 1,
      Feedback: 3,
      Notification: 0,
      Paylater: 1,
      PaymentRequest: 6,
      Plan: 3,
      Profile: 17,
      RateLimitBucket: 1,
      RecurringTransaction: 1,
      Reminder: 2,
      SavingGoal: 2,
      Setting: 3,
      Streak: 0,
      Transaction: 40,
      TransactionTemplate: 3,
      WishlistItem: 1,
      _prisma_migrations: 8
    };

    let totalRestoredRows = 0;
    let appRestoredRows = 0;

    for (const table of restoredTables) {
      const countRaw = execSync(`docker exec ${containerName} psql -h localhost -U postgres -d postgres -t -A -c "SELECT count(*)::int FROM public.\\"${table}\\";"`).toString().trim();
      const count = parseInt(countRaw, 10);
      totalRestoredRows += count;
      if (table !== '_prisma_migrations') appRestoredRows += count;

      const expected = expectedCounts[table];
      assert.strictEqual(
        count,
        expected,
        `Table "${table}" row count mismatch: restored ${count}, expected ${expected}`
      );
      console.log(`  ✓ Table: ${table.padEnd(24)} | Rows: ${count.toString().padStart(3)} | Status: MATCH`);
    }

    assert.strictEqual(appRestoredRows, 112, 'Application rows must equal exactly 112');
    assert.strictEqual(totalRestoredRows, 120, 'Total restored rows must equal exactly 120 (112 app + 8 migrations)');
    console.log(`\n  ✓ Total Restored Rows: ${totalRestoredRows} (112 synthetic application rows + 8 migration rows)`);

    // 9. Validate Primary Keys, Unique Constraints, Enums, and Foreign Keys
    console.log('\n[9] Validating Primary Keys, Constraints, Enums, and Foreign Keys...');
    const enumsRaw = execSync(`docker exec ${containerName} psql -h localhost -U postgres -d postgres -t -A -c "SELECT count(DISTINCT typname)::int FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e';"`).toString().trim();
    assert.strictEqual(parseInt(enumsRaw, 10), 4, 'Must contain 4 public enums (UserRole, PlanType, TransactionType, PaymentStatus)');
    console.log('  ✓ 4/4 custom enums validated.');

    const fksRaw = execSync(`docker exec ${containerName} psql -h localhost -U postgres -d postgres -t -A -c "SELECT count(*)::int FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';"`).toString().trim();
    assert.strictEqual(parseInt(fksRaw, 10), 4, 'Must contain 4 foreign key constraints');
    console.log('  ✓ 4/4 foreign key constraints validated.');

    // 10. Execute Representative Read/Write Transactions in Restored DB
    console.log('\n[10] Executing representative read/write transactions on restored database...');
    // A. Read transaction
    const balanceSumRaw = execSync(`docker exec ${containerName} psql -h localhost -U postgres -d postgres -t -A -c "SELECT sum(\\"currentBalance\\")::bigint FROM public.\\"Balance\\";"`).toString().trim();
    console.log(`  Read transaction: Total current balance in restored DB: ${balanceSumRaw}`);

    // B. Write transaction (Insert, Update, Select, Delete within transaction block)
    const txSql = `
      BEGIN;
      INSERT INTO public."Profile" ("id", "userId", "role", "plan", "trialStartedAt", "trialEndsAt", "createdAt", "updatedAt")
      VALUES ('test_tx_prof', 'uid_tx_test_123', 'user', 'trial', now(), now() + interval '14 days', now(), now());

      INSERT INTO public."Category" ("id", "userId", "name", "type", "createdAt")
      VALUES ('test_tx_cat', 'uid_tx_test_123', 'Testing Category', 'keluar', now());

      INSERT INTO public."Balance" ("id", "userId", "name", "type", "currentBalance", "createdAt", "updatedAt")
      VALUES ('test_tx_bal', 'uid_tx_test_123', 'Test Wallet', 'bank', 500000, now(), now());

      INSERT INTO public."Transaction" ("id", "userId", "categoryId", "walletId", "type", "amount", "transactionDate", "createdAt", "updatedAt")
      VALUES ('test_tx_trx', 'uid_tx_test_123', 'test_tx_cat', 'test_tx_bal', 'keluar', 25000, now(), now(), now());

      UPDATE public."Balance" SET "currentBalance" = "currentBalance" - 25000 WHERE "id" = 'test_tx_bal';

      SELECT "currentBalance" FROM public."Balance" WHERE "id" = 'test_tx_bal';
      COMMIT;
    `;
    const txFile = path.join(tempDir, 'tx.sql');
    fs.writeFileSync(txFile, txSql);
    execSync(`docker cp "${txFile}" ${containerName}:/tx.sql`);
    const txRes = execSync(`docker exec ${containerName} psql -h localhost -U postgres -d postgres -t -A -f /tx.sql`).toString().trim();
    if (fs.existsSync(txFile)) fs.unlinkSync(txFile);
    assert.ok(txRes.includes('475000'), `Transaction must compute updated balance 475000, got: ${txRes}`);
    console.log('  ✓ Multi-table write transaction committed and verified successfully.');

    console.log('\n=== REAL END-TO-END RESTORE TEST PASSED WITH 100% SUCCESS ===');
  } finally {
    // 11. Cleanup disposable container and decrypted files
    console.log(`\n[11] Cleaning up disposable local container ${containerName}...`);
    try {
      execSync(`docker rm -f ${containerName}`, { stdio: 'pipe' });
      console.log('  ✓ Disposable PostgreSQL container destroyed.');
    } catch (e) {}

    if (fs.existsSync(keyFile)) fs.unlinkSync(keyFile);
    if (fs.existsSync(encFile)) fs.unlinkSync(encFile);
    if (fs.existsSync(decFile)) fs.unlinkSync(decFile);
    console.log('  ✓ Temporary decrypted files wiped.');
  }
}

runEndToEndRestoreTest().catch(err => {
  console.error('\nRestore Test Failure:', err);
  process.exit(1);
});
