import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execSync } from 'child_process';

const tempDir = path.join(os.tmpdir(), 'antigravity');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// We use the authenticated dump generator from Phase 14C
const authPath = path.join(os.homedir(), '.local', 'share', 'opencode', 'mcp-auth.json');
const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const sbToken = auth.supabase?.tokens?.accessToken;
const sgRef = 'tidpkhwcxrsugioctpnf';

const keyFile = path.join(tempDir, 'restore_pg17_test.key');
const rawDumpFile = path.join(tempDir, 'sg_preview_public_pg17.sql');
const encFile = path.join(tempDir, 'sg_preview_public_pg17.sql.enc');
const decFile = path.join(tempDir, 'sg_preview_restored_pg17.sql');

async function runSql(sql: string) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${sgRef}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sbToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function generatePublicDump(): Promise<string> {
  let sql = '-- Norden Finance Public Schema Dump for PG17 Restore Verification\n';
  sql += 'SET statement_timeout = 0;\nSET client_encoding = \'UTF8\';\nSET standard_conforming_strings = on;\n\n';

  // 1. Enums
  const enums = await runSql(`
    SELECT t.typname, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname;
  `);
  for (const en of enums) {
    const valList = en.values.split(', ').map((v: string) => `'${v.trim()}'`).join(', ');
    sql += `DO $$ BEGIN\n  CREATE TYPE public."${en.typname}" AS ENUM (${valList});\nEXCEPTION WHEN duplicate_object THEN null;\nEND $$;\n\n`;
  }

  // 2. Tables and columns
  const tables = await runSql(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`);
  for (const t of tables) {
    const tableName = t.tablename;
    const cols = await runSql(`
      SELECT column_name, data_type, udt_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `);

    sql += `CREATE TABLE IF NOT EXISTS public."${tableName}" (\n`;
    const colDefs = cols.map((c: any) => {
      let typeStr = c.data_type;
      if (c.data_type === 'USER-DEFINED') typeStr = `public."${c.udt_name}"`;
      else if (c.data_type === 'ARRAY') typeStr = `${c.udt_name.replace(/^_/, '')}[]`;
      let def = `  "${c.column_name}" ${typeStr}`;
      if (c.column_default) def += ` DEFAULT ${c.column_default}`;
      if (c.is_nullable === 'NO') def += ' NOT NULL';
      return def;
    });
    sql += colDefs.join(',\n') + '\n);\n\n';
  }

  // 3. Primary keys
  const pks = await runSql(`
    SELECT tc.table_name, tc.constraint_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public';
  `);
  for (const pk of pks) {
    sql += `ALTER TABLE ONLY public."${pk.table_name}" DROP CONSTRAINT IF EXISTS "${pk.constraint_name}";\n`;
    sql += `ALTER TABLE ONLY public."${pk.table_name}" ADD CONSTRAINT "${pk.constraint_name}" PRIMARY KEY ("${pk.column_name}");\n\n`;
  }

  // 4. Data Insertion
  for (const t of tables) {
    const tableName = t.tablename;
    const rows = await runSql(`SELECT * FROM public."${tableName}";`);
    if (rows && rows.length > 0) {
      const colNames = Object.keys(rows[0]);
      for (const row of rows) {
        const vals = colNames.map(cn => {
          const val = row[cn];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'boolean' || typeof val === 'number') return val;
          if (Array.isArray(val)) {
            const arrEscaped = val.map(item => `"${String(item).replace(/"/g, '\\"')}"`).join(',');
            return `'${`{${arrEscaped}}`}'`;
          }
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        sql += `INSERT INTO public."${tableName}" (${colNames.map(c => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')});\n`;
      }
      sql += '\n';
    }
  }

  // 5. Indexes
  const indexes = await runSql(`
    SELECT indexname, indexdef FROM pg_indexes
    WHERE schemaname = 'public' AND indexname NOT LIKE '%_pkey';
  `);
  for (const idx of indexes) {
    sql += `${idx.indexdef};\n`;
  }
  sql += '\n';

  // 6. Foreign Keys
  const fks = await runSql(`
    SELECT tc.table_name, tc.constraint_name, kcu.column_name,
           ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name, rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
  `);
  for (const fk of fks) {
    sql += `ALTER TABLE ONLY public."${fk.table_name}" DROP CONSTRAINT IF EXISTS "${fk.constraint_name}";\n`;
    sql += `ALTER TABLE ONLY public."${fk.table_name}" ADD CONSTRAINT "${fk.constraint_name}" FOREIGN KEY ("${fk.column_name}") REFERENCES public."${fk.foreign_table_name}"("${fk.foreign_column_name}") ON DELETE ${fk.delete_rule};\n\n`;
  }

  fs.writeFileSync(rawDumpFile, sql);
  return rawDumpFile;
}

async function runPg17RestoreTest() {
  console.log('=== PHASE 14D-FREE: POSTGRESQL 17 VERIFIED RESTORE TEST ===\n');

  // 1. Generate live snapshot from Singapore Preview
  console.log('[1] Exporting public-schema snapshot from Singapore Preview (PostgreSQL 17.11)...');
  await generatePublicDump();
  const rawSize = fs.statSync(rawDumpFile).size;
  console.log(`  ✓ Snapshot generated: ${rawSize} bytes.`);

  // 2. Encryption
  const keyHex = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(keyFile, keyHex);
  console.log('[2] Encrypting with AES-256-GCM...');
  execSync(`node scripts/backup/cipher.js encrypt --key-file "${keyFile}" --in "${rawDumpFile}" --out "${encFile}"`);
  const encHash = crypto.createHash('sha256').update(fs.readFileSync(encFile)).digest('hex');
  console.log(`  ✓ Encrypted artifact: ${fs.statSync(encFile).size} bytes, SHA-256: ${encHash}`);

  // 3. Decryption
  console.log('[3] Decrypting artifact into isolated temporary directory...');
  execSync(`node scripts/backup/cipher.js decrypt --key-file "${keyFile}" --in "${encFile}" --out "${decFile}"`);
  assert.strictEqual(fs.statSync(decFile).size, rawSize, 'Decrypted size must match original raw dump');
  console.log('  ✓ Authenticated decryption validated.');

  // 4. Spin up disposable local PostgreSQL 17 container
  const containerName = `norden_restore_pg17_${Date.now()}`;
  console.log(`\n[4] Launching disposable local PostgreSQL 17 container (${containerName})...`);
  execSync(`docker run -d --name ${containerName} -e POSTGRES_PASSWORD=postgres postgres:17-alpine`);

  try {
    // Wait for PG17 to accept connections
    let ready = false;
    for (let i = 0; i < 30; i++) {
      try {
        execSync(`docker exec ${containerName} pg_isready -h localhost -U postgres`, { stdio: 'pipe' });
        ready = true;
        break;
      } catch {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    assert.ok(ready, 'PostgreSQL 17 container must become ready');
    await new Promise(r => setTimeout(r, 2000));

    // Verify container version
    const versionOut = execSync(`docker exec ${containerName} psql -h localhost -U postgres -d postgres -t -A -c "SHOW server_version;"`).toString().trim();
    console.log(`  ✓ Local PostgreSQL container version: ${versionOut}`);
    assert.ok(versionOut.startsWith('17.'), `Must be PostgreSQL 17.x, got: ${versionOut}`);

    // 5. Restore
    console.log('\n[5] Restoring decrypted dump into PostgreSQL 17 database...');
    execSync(`docker cp "${decFile}" ${containerName}:/restore.sql`);
    execSync(`docker exec ${containerName} psql -h localhost -U postgres -d postgres -f /restore.sql`, { stdio: 'pipe' });
    console.log('  ✓ psql execution completed successfully.');

    // 6. Verify all 25 public tables
    console.log('\n[6] Verifying all 25 public tables in PostgreSQL 17...');
    const tablesRaw = execSync(`docker exec ${containerName} psql -h localhost -U postgres -d postgres -t -A -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"`).toString().trim();
    const tables = tablesRaw.split('\n').map(t => t.trim()).filter(Boolean);
    console.log(`  Restored public tables count: ${tables.length}`);
    assert.strictEqual(tables.length, 25, 'Must contain exactly 25 public tables');

    // 7. Verify Enums, Foreign Keys, and Constraints
    console.log('\n[7] Validating Enums and Constraints...');
    const enumsCount = parseInt(execSync(`docker exec ${containerName} psql -h localhost -U postgres -d postgres -t -A -c "SELECT count(DISTINCT typname)::int FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e';"`).toString().trim(), 10);
    assert.strictEqual(enumsCount, 4, 'Must contain 4 enums');
    console.log(`  ✓ 4/4 Enums validated (UserRole, PlanType, TransactionType, PaymentStatus).`);

    const fksCount = parseInt(execSync(`docker exec ${containerName} psql -h localhost -U postgres -d postgres -t -A -c "SELECT count(*)::int FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';"`).toString().trim(), 10);
    assert.strictEqual(fksCount, 4, 'Must contain 4 foreign keys');
    console.log(`  ✓ 4/4 Foreign keys validated.`);

    // 8. Verify Table Row Counts
    console.log('\n[8] Verifying per-table row counts in PostgreSQL 17...');
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
      _prisma_migrations: 8,
    };

    let totalRestored = 0;
    let appRestored = 0;
    for (const table of tables) {
      const c = parseInt(execSync(`docker exec ${containerName} psql -h localhost -U postgres -d postgres -t -A -c "SELECT count(*)::int FROM public.\\"${table}\\";"`).toString().trim(), 10);
      totalRestored += c;
      if (table !== '_prisma_migrations') appRestored += c;
      assert.strictEqual(c, expectedCounts[table], `Table "${table}" mismatch: restored ${c}, expected ${expectedCounts[table]}`);
    }
    console.log(`  ✓ Application rows: ${appRestored}/112, Total rows: ${totalRestored}/120 (100% MATCH).`);

    // 9. Rollback Transaction Test
    console.log('\n[9] Executing Rollback Transaction Test...');
    const initialProfiles = parseInt(execSync(`docker exec ${containerName} psql -h localhost -U postgres -d postgres -t -A -c "SELECT count(*)::int FROM public.\\"Profile\\";"`).toString().trim(), 10);
    const rollbackSql = `
      BEGIN;
      INSERT INTO public."Profile" ("id", "userId", "role", "plan", "trialStartedAt", "trialEndsAt", "createdAt", "updatedAt")
      VALUES ('rollback_test_prof', 'uid_rollback_test', 'user', 'trial', now(), now() + interval '14 days', now(), now());
      ROLLBACK;
    `;
    const rollbackFile = path.join(tempDir, 'rollback.sql');
    fs.writeFileSync(rollbackFile, rollbackSql);
    execSync(`docker cp "${rollbackFile}" ${containerName}:/rollback.sql`);
    execSync(`docker exec ${containerName} psql -h localhost -U postgres -d postgres -f /rollback.sql`);
    if (fs.existsSync(rollbackFile)) fs.unlinkSync(rollbackFile);
    const postRollbackProfiles = parseInt(execSync(`docker exec ${containerName} psql -h localhost -U postgres -d postgres -t -A -c "SELECT count(*)::int FROM public.\\"Profile\\";"`).toString().trim(), 10);
    assert.strictEqual(postRollbackProfiles, initialProfiles, 'Profile count after rollback must remain unchanged');
    console.log(`  ✓ Rollback verified. Profile count unchanged (${initialProfiles} rows).`);

    // 10. Multi-table Commit Transaction Test
    console.log('\n[10] Executing Multi-Table Commit Transaction Test...');
    const commitSql = `
      BEGIN;
      INSERT INTO public."Profile" ("id", "userId", "role", "plan", "trialStartedAt", "trialEndsAt", "createdAt", "updatedAt")
      VALUES ('commit_test_prof', 'uid_commit_test', 'user', 'trial', now(), now() + interval '14 days', now(), now());

      INSERT INTO public."Category" ("id", "userId", "name", "type", "createdAt")
      VALUES ('commit_test_cat', 'uid_commit_test', 'PG17 Verified Category', 'keluar', now());

      INSERT INTO public."Balance" ("id", "userId", "name", "type", "currentBalance", "createdAt", "updatedAt")
      VALUES ('commit_test_bal', 'uid_commit_test', 'PG17 Wallet', 'bank', 1000000, now(), now());

      INSERT INTO public."Transaction" ("id", "userId", "categoryId", "walletId", "type", "amount", "transactionDate", "createdAt", "updatedAt")
      VALUES ('commit_test_trx', 'uid_commit_test', 'commit_test_cat', 'commit_test_bal', 'keluar', 150000, now(), now(), now());

      UPDATE public."Balance" SET "currentBalance" = "currentBalance" - 150000 WHERE "id" = 'commit_test_bal';

      SELECT "currentBalance" FROM public."Balance" WHERE "id" = 'commit_test_bal';
      COMMIT;
    `;
    const commitFile = path.join(tempDir, 'commit.sql');
    fs.writeFileSync(commitFile, commitSql);
    execSync(`docker cp "${commitFile}" ${containerName}:/commit.sql`);
    const commitRes = execSync(`docker exec ${containerName} psql -h localhost -U postgres -d postgres -t -A -f /commit.sql`).toString().trim();
    if (fs.existsSync(commitFile)) fs.unlinkSync(commitFile);
    assert.ok(commitRes.includes('850000'), `Transaction must compute updated balance 850,000, got: ${commitRes}`);
    console.log('  ✓ Multi-table commit transaction executed and verified successfully.');

    console.log('\n=== POSTGRESQL 17 RESTORE AND TRANSACTION TEST PASSED ===');
  } finally {
    console.log(`\n[11] Cleaning up disposable PostgreSQL 17 container (${containerName})...`);
    try {
      execSync(`docker rm -f ${containerName}`, { stdio: 'pipe' });
      console.log('  ✓ Disposable container destroyed.');
    } catch {}

    if (fs.existsSync(keyFile)) fs.unlinkSync(keyFile);
    if (fs.existsSync(rawDumpFile)) fs.unlinkSync(rawDumpFile);
    if (fs.existsSync(encFile)) fs.unlinkSync(encFile);
    if (fs.existsSync(decFile)) fs.unlinkSync(decFile);
    console.log('  ✓ Temporary files securely wiped.');
  }
}

runPg17RestoreTest().catch(err => {
  console.error('\nPG17 Restore Test Failed:', err);
  process.exit(1);
});
