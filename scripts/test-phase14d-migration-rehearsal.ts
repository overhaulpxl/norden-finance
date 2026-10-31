import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execSync } from 'child_process';

const tempDir = path.join(os.tmpdir(), 'antigravity');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const containerName = `norden_rehearsal_pg17_${Date.now()}`;
const sourceDb = 'norden_migration_source';
const targetDb = 'norden_migration_target';

async function runMigrationRehearsal() {
  console.log('=== PHASE 14D-FREE: TOKYO-SHAPED SYNTHETIC DATA-ONLY IMPORT REHEARSAL ===\n');

  // 1. Launch local PostgreSQL 17 container
  console.log(`[1] Launching disposable local PostgreSQL 17 container (${containerName})...`);
  execSync(`docker run -d --name ${containerName} -e POSTGRES_PASSWORD=postgres postgres:17-alpine`);

  try {
    // Wait for ready
    let ready = false;
    for (let i = 0; i < 30; i++) {
      try {
        execSync(`docker exec ${containerName} psql -h localhost -U postgres -c "SELECT 1;"`, { stdio: 'pipe' });
        ready = true;
        break;
      } catch {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    assert.ok(ready, 'PostgreSQL 17 container must be ready');
    await new Promise(r => setTimeout(r, 1000));

    // Create source and target databases
    console.log(`[2] Creating databases "${sourceDb}" and "${targetDb}"...`);
    execSync(`docker exec ${containerName} psql -h localhost -U postgres -c "CREATE DATABASE ${sourceDb};"`);
    execSync(`docker exec ${containerName} psql -h localhost -U postgres -c "CREATE DATABASE ${targetDb};"`);

    // 2. Initialize Schema on Both Databases
    console.log('[3] Initializing identical public schema and 8 migration records on both databases...');
    const schemaSql = `
      -- 1. Enums
      CREATE TYPE public."UserRole" AS ENUM ('user', 'admin');
      CREATE TYPE public."PlanType" AS ENUM ('trial', 'pro', 'pro_monthly', 'pro_yearly');
      CREATE TYPE public."TransactionType" AS ENUM ('masuk', 'keluar');
      CREATE TYPE public."PaymentStatus" AS ENUM ('pending', 'approved', 'rejected');

      -- 2. Tables
      CREATE TABLE public."_prisma_migrations" (
        "id" character varying(36) NOT NULL PRIMARY KEY,
        "checksum" character varying(64) NOT NULL,
        "finished_at" timestamp with time zone,
        "migration_name" character varying(255) NOT NULL,
        "logs" text,
        "rolled_back_at" timestamp with time zone,
        "started_at" timestamp with time zone DEFAULT now() NOT NULL,
        "applied_steps_count" integer DEFAULT 0 NOT NULL
      );

      CREATE TABLE public."Profile" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL UNIQUE,
        "fullName" text,
        "role" public."UserRole" DEFAULT 'user'::public."UserRole" NOT NULL,
        "plan" public."PlanType" DEFAULT 'trial'::public."PlanType" NOT NULL,
        "trialStartedAt" timestamp(3) without time zone NOT NULL,
        "trialEndsAt" timestamp(3) without time zone NOT NULL,
        "onboardingCompleted" boolean DEFAULT false NOT NULL,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp(3) without time zone NOT NULL
      );

      CREATE TABLE public."BillingSubscription" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL UNIQUE,
        "tier" text NOT NULL,
        "status" text NOT NULL,
        "nextBillingDate" timestamp(3) without time zone,
        "amount" bigint NOT NULL,
        "lastPaymentStatus" text,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp(3) without time zone NOT NULL
      );

      CREATE TABLE public."Plan" (
        "id" text NOT NULL PRIMARY KEY,
        "name" text NOT NULL,
        "price" bigint NOT NULL,
        "type" public."PlanType" NOT NULL UNIQUE,
        "features" text[] NOT NULL,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp(3) without time zone NOT NULL
      );

      CREATE TABLE public."PaymentRequest" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL,
        "userEmail" text NOT NULL,
        "plan" text NOT NULL,
        "amount" bigint NOT NULL,
        "proofImage" text NOT NULL,
        "status" public."PaymentStatus" DEFAULT 'pending'::public."PaymentStatus" NOT NULL,
        "adminNotes" text,
        "approvedAt" timestamp(3) without time zone,
        "approvedBy" text,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp(3) without time zone NOT NULL
      );

      CREATE TABLE public."Balance" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL,
        "name" text NOT NULL,
        "type" text NOT NULL,
        "currentBalance" bigint DEFAULT 0 NOT NULL,
        "accountNumber" text,
        "color" text,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp(3) without time zone NOT NULL
      );

      CREATE TABLE public."Category" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL,
        "name" text NOT NULL,
        "type" public."TransactionType" NOT NULL,
        "color" text,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE public."Transaction" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL,
        "categoryId" text NOT NULL,
        "walletId" text,
        "type" public."TransactionType" NOT NULL,
        "amount" bigint NOT NULL,
        "description" text,
        "transactionDate" timestamp(3) without time zone NOT NULL,
        "receiptUrl" text,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp(3) without time zone NOT NULL
      );

      CREATE TABLE public."TransactionTemplate" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL,
        "name" text NOT NULL,
        "type" public."TransactionType" NOT NULL,
        "amount" bigint NOT NULL,
        "categoryId" text NOT NULL,
        "walletId" text,
        "description" text,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp(3) without time zone NOT NULL
      );

      CREATE TABLE public."RecurringTransaction" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL,
        "name" text NOT NULL,
        "amount" bigint NOT NULL,
        "type" public."TransactionType" NOT NULL,
        "categoryId" text NOT NULL,
        "walletId" text,
        "frequency" text NOT NULL,
        "startDate" timestamp(3) without time zone NOT NULL,
        "nextDueDate" timestamp(3) without time zone NOT NULL,
        "active" boolean DEFAULT true NOT NULL,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp(3) without time zone NOT NULL
      );

      CREATE TABLE public."Budget" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL,
        "categoryId" text NOT NULL,
        "monthlyLimit" bigint NOT NULL,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp(3) without time zone NOT NULL
      );

      CREATE TABLE public."SavingGoal" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL,
        "name" text NOT NULL,
        "targetAmount" bigint NOT NULL,
        "currentAmount" bigint DEFAULT 0 NOT NULL,
        "targetDate" timestamp(3) without time zone,
        "color" text,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp(3) without time zone NOT NULL
      );

      CREATE TABLE public."WishlistItem" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL,
        "name" text NOT NULL,
        "price" bigint NOT NULL,
        "priority" text NOT NULL,
        "imageUrl" text,
        "productUrl" text,
        "bought" boolean DEFAULT false NOT NULL,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp(3) without time zone NOT NULL
      );

      CREATE TABLE public."Debt" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL,
        "personName" text NOT NULL,
        "type" text NOT NULL,
        "amount" bigint NOT NULL,
        "paidAmount" bigint DEFAULT 0 NOT NULL,
        "dueDate" timestamp(3) without time zone,
        "notes" text,
        "isSettled" boolean DEFAULT false NOT NULL,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp(3) without time zone NOT NULL
      );

      CREATE TABLE public."Paylater" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL,
        "provider" text NOT NULL,
        "totalAmount" bigint NOT NULL,
        "monthlyInstallment" bigint NOT NULL,
        "tenor" integer NOT NULL,
        "remainingTenor" integer NOT NULL,
        "dueDate" integer NOT NULL,
        "interestRate" double precision,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp(3) without time zone NOT NULL
      );

      CREATE TABLE public."AppSubscription" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL,
        "name" text NOT NULL,
        "cost" bigint NOT NULL,
        "billingCycle" text NOT NULL,
        "nextPaymentDate" timestamp(3) without time zone NOT NULL,
        "category" text,
        "reminderDaysBefore" integer DEFAULT 3 NOT NULL,
        "active" boolean DEFAULT true NOT NULL,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp(3) without time zone NOT NULL
      );

      CREATE TABLE public."EmergencyFundPlan" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL UNIQUE,
        "monthlyExpenses" bigint NOT NULL,
        "targetMonths" integer NOT NULL,
        "targetAmount" bigint NOT NULL,
        "currentAmount" bigint DEFAULT 0 NOT NULL,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp(3) without time zone NOT NULL
      );

      CREATE TABLE public."Reminder" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL,
        "title" text NOT NULL,
        "amount" bigint,
        "dueDate" timestamp(3) without time zone NOT NULL,
        "type" text NOT NULL,
        "relatedId" text,
        "isCompleted" boolean DEFAULT false NOT NULL,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp(3) without time zone NOT NULL
      );

      CREATE TABLE public."AuditLog" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text,
        "action" text NOT NULL,
        "entity" text NOT NULL,
        "entityId" text,
        "oldData" jsonb,
        "newData" jsonb,
        "ipAddress" text,
        "userAgent" text,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE public."Setting" (
        "id" text NOT NULL PRIMARY KEY,
        "key" text NOT NULL UNIQUE,
        "value" text NOT NULL,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp(3) without time zone NOT NULL
      );

      CREATE TABLE public."Feedback" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL,
        "category" text NOT NULL,
        "content" text NOT NULL,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE public."Streak" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL UNIQUE,
        "currentStreak" integer DEFAULT 0 NOT NULL,
        "longestStreak" integer DEFAULT 0 NOT NULL,
        "lastInputDate" timestamp(3) without time zone,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" timestamp(3) without time zone NOT NULL
      );

      CREATE TABLE public."Achievement" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL,
        "type" text NOT NULL,
        "unlockedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE public."RateLimitBucket" (
        "key" text NOT NULL PRIMARY KEY,
        "count" integer DEFAULT 0 NOT NULL,
        "resetAt" timestamp(3) without time zone NOT NULL,
        "updatedAt" timestamp(3) without time zone NOT NULL
      );

      CREATE TABLE public."Notification" (
        "id" text NOT NULL PRIMARY KEY,
        "userId" text NOT NULL,
        "title" text NOT NULL,
        "message" text NOT NULL,
        "type" text NOT NULL,
        "read" boolean DEFAULT false NOT NULL,
        "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Constraints
      ALTER TABLE ONLY public."Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"("id") ON DELETE RESTRICT;
      ALTER TABLE ONLY public."Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES public."Balance"("id") ON DELETE SET NULL;
      ALTER TABLE ONLY public."TransactionTemplate" ADD CONSTRAINT "TransactionTemplate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"("id") ON DELETE RESTRICT;
      ALTER TABLE ONLY public."Budget" ADD CONSTRAINT "Budget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"("id") ON DELETE CASCADE;

      -- Seed 8 Prisma Migration records (matching exactly on both databases)
      INSERT INTO public."_prisma_migrations" ("id", "checksum", "migration_name", "applied_steps_count", "finished_at")
      VALUES
        ('mig_01', 'chk_01', '20250101_init', 1, now()),
        ('mig_02', 'chk_02', '20250102_plans', 1, now()),
        ('mig_03', 'chk_03', '20250103_billing', 1, now()),
        ('mig_04', 'chk_04', '20250104_streaks', 1, now()),
        ('mig_05', 'chk_05', '20250105_ratelimit', 1, now()),
        ('mig_06', 'chk_06', '20250106_audit', 1, now()),
        ('mig_07', 'chk_07', '20250107_indexes', 1, now()),
        ('mig_08', 'chk_08', '20250108_settings', 1, now());
    `;

    const schemaFile = path.join(tempDir, 'schema_setup.sql');
    fs.writeFileSync(schemaFile, schemaSql);
    execSync(`docker cp "${schemaFile}" ${containerName}:/schema_setup.sql`);
    execSync(`docker exec ${containerName} psql -h localhost -U postgres -d ${sourceDb} -f /schema_setup.sql`, { stdio: 'pipe' });
    execSync(`docker exec ${containerName} psql -h localhost -U postgres -d ${targetDb} -f /schema_setup.sql`, { stdio: 'pipe' });
    if (fs.existsSync(schemaFile)) fs.unlinkSync(schemaFile);
    console.log('  ✓ Schemas and migration ledgers initialized.');

    // 3. Seed Tokyo-Shaped Synthetic Source Dataset (28 app rows + 8 migration rows = 36 rows)
    console.log('\n[4] Seeding completely synthetic Tokyo-shaped dataset into source database...');
    const synthSql = `
      -- 1 Profile
      INSERT INTO public."Profile" ("id", "userId", "fullName", "role", "plan", "trialStartedAt", "trialEndsAt", "onboardingCompleted", "createdAt", "updatedAt")
      VALUES ('cuid_prof_synth_001', 'uid_synth_usr_001', 'Synthetic Test User', 'user', 'pro', now(), now() + interval '30 days', true, now(), now());

      -- 3 Plans
      INSERT INTO public."Plan" ("id", "name", "price", "type", "features", "createdAt", "updatedAt")
      VALUES
        ('cuid_plan_free', 'Free Basic', 0, 'trial', '{"basic_tracking","1_wallet"}', now(), now()),
        ('cuid_plan_monthly', 'Pro Monthly', 49000, 'pro_monthly', '{"unlimited_wallets","ai_receipts","budget_alerts"}', now(), now()),
        ('cuid_plan_yearly', 'Pro Yearly', 490000, 'pro_yearly', '{"all_pro_features","2_months_free"}', now(), now());

      -- 1 BillingSubscription
      INSERT INTO public."BillingSubscription" ("id", "userId", "tier", "status", "nextBillingDate", "amount", "lastPaymentStatus", "createdAt", "updatedAt")
      VALUES ('cuid_sub_synth_001', 'uid_synth_usr_001', 'pro_monthly', 'active', now() + interval '30 days', 49000, 'success', now(), now());

      -- 2 Balances (Wallets): Total balance = 6,250,000 IDR
      INSERT INTO public."Balance" ("id", "userId", "name", "type", "currentBalance", "accountNumber", "color", "createdAt", "updatedAt")
      VALUES
        ('cuid_bal_synth_001', 'uid_synth_usr_001', 'Synthetic Bank BCA', 'bank', 5000000, '1234567890', '#0055aa', now(), now()),
        ('cuid_bal_synth_002', 'uid_synth_usr_001', 'Synthetic GoPay', 'ewallet', 1250000, '08123456789', '#00aa55', now(), now());

      -- 6 Categories
      INSERT INTO public."Category" ("id", "userId", "name", "type", "color", "createdAt")
      VALUES
        ('cuid_cat_synth_001', 'uid_synth_usr_001', 'Makanan & Minuman', 'keluar', '#ff5555', now()),
        ('cuid_cat_synth_002', 'uid_synth_usr_001', 'Transportasi', 'keluar', '#5555ff', now()),
        ('cuid_cat_synth_003', 'uid_synth_usr_001', 'Belanja Bulanan', 'keluar', '#55ff55', now()),
        ('cuid_cat_synth_004', 'uid_synth_usr_001', 'Gaji Pokok', 'masuk', '#ffff55', now()),
        ('cuid_cat_synth_005', 'uid_synth_usr_001', 'Investasi & Dividen', 'masuk', '#ff55ff', now()),
        ('cuid_cat_synth_006', 'uid_synth_usr_001', 'Lain-lain', 'keluar', '#aaaaaa', now());

      -- 11 Settings (including qris_image referencing Singapore storage path)
      INSERT INTO public."Setting" ("id", "key", "value", "createdAt", "updatedAt")
      VALUES
        ('cuid_set_001', 'monthly_price', '49000', now(), now()),
        ('cuid_set_002', 'yearly_price', '490000', now(), now()),
        ('cuid_set_003', 'trial_days', '14', now(), now()),
        ('cuid_set_004', 'qris_image', 'qris/norden_qris_singapore.png', now(), now()),
        ('cuid_set_005', 'qris_manual_instructions', 'Scan QRIS via Mobile Banking / E-Wallet', now(), now()),
        ('cuid_set_006', 'app_name', 'Norden Finance', now(), now()),
        ('cuid_set_007', 'support_email', 'support@nordenfinance.site', now(), now()),
        ('cuid_set_008', 'maintenance_notice', 'Layanan beroperasi normal', now(), now()),
        ('cuid_set_009', 'currency', 'IDR', now(), now()),
        ('cuid_set_010', 'rate_limit_per_min', '60', now(), now()),
        ('cuid_set_011', 'max_upload_size_mb', '5', now(), now());

      -- 3 AuditLogs
      INSERT INTO public."AuditLog" ("id", "userId", "action", "entity", "entityId", "oldData", "newData", "ipAddress", "userAgent", "createdAt")
      VALUES
        ('cuid_aud_001', 'uid_synth_usr_001', 'USER_SIGNUP', 'Profile', 'cuid_prof_synth_001', null, '{"role":"user"}'::jsonb, '127.0.0.1', 'Mozilla/5.0 Rehearsal', now()),
        ('cuid_aud_002', 'uid_synth_usr_001', 'WALLET_CREATE', 'Balance', 'cuid_bal_synth_001', null, '{"name":"Synthetic Bank BCA"}'::jsonb, '127.0.0.1', 'Mozilla/5.0 Rehearsal', now()),
        ('cuid_aud_003', 'uid_synth_usr_001', 'WALLET_CREATE', 'Balance', 'cuid_bal_synth_002', null, '{"name":"Synthetic GoPay"}'::jsonb, '127.0.0.1', 'Mozilla/5.0 Rehearsal', now());

      -- 1 RateLimitBucket
      INSERT INTO public."RateLimitBucket" ("key", "count", "resetAt", "updatedAt")
      VALUES ('ratelimit:uid_synth_usr_001:upload-qris', 1, now() + interval '1 minute', now());
    `;

    const synthFile = path.join(tempDir, 'synth_source.sql');
    fs.writeFileSync(synthFile, synthSql);
    execSync(`docker cp "${synthFile}" ${containerName}:/synth_source.sql`);
    execSync(`docker exec ${containerName} psql -h localhost -U postgres -d ${sourceDb} -f /synth_source.sql`, { stdio: 'pipe' });
    if (fs.existsSync(synthFile)) fs.unlinkSync(synthFile);

    // Verify source counts
    const srcTotal = parseInt(execSync(`docker exec ${containerName} psql -h localhost -U postgres -d ${sourceDb} -t -A -c "SELECT sum(c) FROM (SELECT count(*)::int as c FROM \\"Profile\\" UNION ALL SELECT count(*)::int FROM \\"Plan\\" UNION ALL SELECT count(*)::int FROM \\"BillingSubscription\\" UNION ALL SELECT count(*)::int FROM \\"Balance\\" UNION ALL SELECT count(*)::int FROM \\"Category\\" UNION ALL SELECT count(*)::int FROM \\"Setting\\" UNION ALL SELECT count(*)::int FROM \\"AuditLog\\" UNION ALL SELECT count(*)::int FROM \\"RateLimitBucket\\" UNION ALL SELECT count(*)::int FROM \\"_prisma_migrations\\") s;"`).toString().trim(), 10);
    assert.strictEqual(srcTotal, 36, `Source total rows must be 36, got: ${srcTotal}`);
    console.log(`  ✓ Source seeded with exact Tokyo profile: 28 app rows + 8 migrations = 36 rows.`);

    // Target initial count
    const tgtInitial = parseInt(execSync(`docker exec ${containerName} psql -h localhost -U postgres -d ${targetDb} -t -A -c "SELECT count(*)::int FROM \\"_prisma_migrations\\";"`).toString().trim(), 10);
    assert.strictEqual(tgtInitial, 8, 'Target must start with only 8 migrations and 0 app rows');
    console.log('  ✓ Target verified empty of application rows (8 migrations present).');

    // 4. Data-Only Export (Procedure 2)
    console.log('\n[5] Executing Procedure 2: Data-only export of application tables...');
    const t0Export = Date.now();
    // Exclude _prisma_migrations, scope to public schema, data-only, no-owner, no-acl
    execSync(`docker exec ${containerName} pg_dump -h localhost -U postgres -d ${sourceDb} --schema=public --data-only --exclude-table=_prisma_migrations --no-owner --no-acl -F p -f /app_data.sql`);
    const exportElapsedMs = Date.now() - t0Export;
    const dumpSize = parseInt(execSync(`docker exec ${containerName} wc -c /app_data.sql`).toString().trim().split(' ')[0], 10);
    console.log(`  ✓ Data-only export complete in ${exportElapsedMs}ms (${dumpSize} bytes).`);

    // Verify dump file contains zero schema definitions and no _prisma_migrations
    const dumpContent = execSync(`docker exec ${containerName} cat /app_data.sql`).toString();
    assert.ok(!dumpContent.includes('CREATE TABLE'), 'Dump must NOT contain CREATE TABLE');
    assert.ok(!dumpContent.includes('DROP TABLE'), 'Dump must NOT contain DROP TABLE');
    assert.ok(!dumpContent.includes('_prisma_migrations'), 'Dump must NOT contain _prisma_migrations');
    console.log('  ✓ Validated: Zero DDL, zero _prisma_migrations in data payload.');

    // 5. Data-Only Import into Target
    console.log('\n[6] Importing application data into target database...');
    const t0Import = Date.now();
    // Prepare import script with session_replication_role to ensure atomic, order-independent load
    execSync(`docker exec ${containerName} sh -c "echo 'SET session_replication_role = replica;' > /import.sql && cat /app_data.sql >> /import.sql && echo 'SET session_replication_role = origin;' >> /import.sql"`);
    execSync(`docker exec ${containerName} psql -h localhost -U postgres -d ${targetDb} -v ON_ERROR_STOP=1 -f /import.sql`, { stdio: 'pipe' });
    const importElapsedMs = Date.now() - t0Import;
    console.log(`  ✓ Data-only import complete in ${importElapsedMs}ms.`);

    // 6. Complete 24-Table Reconciliation & Invariants Verification
    console.log('\n[7] Executing Comprehensive 24-Table Reconciliation...');
    const t0Recon = Date.now();

    const all24Tables = [
      'Achievement', 'AppSubscription', 'AuditLog', 'Balance', 'BillingSubscription',
      'Budget', 'Category', 'Debt', 'EmergencyFundPlan', 'Feedback',
      'Notification', 'Paylater', 'PaymentRequest', 'Plan', 'Profile',
      'RateLimitBucket', 'RecurringTransaction', 'Reminder', 'SavingGoal', 'Setting',
      'Streak', 'Transaction', 'TransactionTemplate', 'WishlistItem'
    ];

    let totalTargetAppRows = 0;
    const reconciliationMatrix: Array<{
      table: string;
      sourceCount: number;
      targetCount: number;
      sourceHash: string;
      targetHash: string;
      status: string;
    }> = [];

    for (const table of all24Tables) {
      const srcCount = parseInt(execSync(`docker exec ${containerName} psql -h localhost -U postgres -d ${sourceDb} -t -A -c "SELECT count(*)::int FROM public.\\"${table}\\";"`).toString().trim(), 10);
      const tgtCount = parseInt(execSync(`docker exec ${containerName} psql -h localhost -U postgres -d ${targetDb} -t -A -c "SELECT count(*)::int FROM public.\\"${table}\\";"`).toString().trim(), 10);
      totalTargetAppRows += tgtCount;
      assert.strictEqual(srcCount, tgtCount, `Row count mismatch for table "${table}": source ${srcCount}, target ${tgtCount}`);

      // Compute canonical JSON SHA-256 hash for row content comparison
      const srcRowsJson = execSync(`docker exec ${containerName} psql -h localhost -U postgres -d ${sourceDb} -t -A -c "SELECT json_agg(t) FROM (SELECT * FROM public.\\"${table}\\" ORDER BY 1) t;"`).toString().trim();
      const tgtRowsJson = execSync(`docker exec ${containerName} psql -h localhost -U postgres -d ${targetDb} -t -A -c "SELECT json_agg(t) FROM (SELECT * FROM public.\\"${table}\\" ORDER BY 1) t;"`).toString().trim();

      const srcHash = crypto.createHash('sha256').update(srcRowsJson || '[]').digest('hex').slice(0, 16);
      const tgtHash = crypto.createHash('sha256').update(tgtRowsJson || '[]').digest('hex').slice(0, 16);
      assert.strictEqual(srcHash, tgtHash, `Hash mismatch for table "${table}": ${srcHash} vs ${tgtHash}`);

      reconciliationMatrix.push({
        table,
        sourceCount: srcCount,
        targetCount: tgtCount,
        sourceHash: srcHash,
        targetHash: tgtHash,
        status: 'IDENTICAL'
      });
    }

    const reconElapsedMs = Date.now() - t0Recon;
    console.table(reconciliationMatrix);

    assert.strictEqual(totalTargetAppRows, 28, `Total target application rows must be exactly 28, got: ${totalTargetAppRows}`);

    // Verify migration ledger was untouched
    const targetMigrationsCount = parseInt(execSync(`docker exec ${containerName} psql -h localhost -U postgres -d ${targetDb} -t -A -c "SELECT count(*)::int FROM public.\\"_prisma_migrations\\";"`).toString().trim(), 10);
    assert.strictEqual(targetMigrationsCount, 8, 'Target _prisma_migrations must remain untouched at 8 rows');

    const totalTargetRows = totalTargetAppRows + targetMigrationsCount;
    assert.strictEqual(totalTargetRows, 36, `Total target rows must be 36, got: ${totalTargetRows}`);
    console.log(`  ✓ Total Target Rows: ${totalTargetRows} (28 application rows + 8 migration records = 36 rows).`);

    // 7. Verify Financial & Business Invariants
    console.log('\n[8] Verifying Financial and Setting Invariants...');
    // A. Balance total
    const srcBalanceSum = execSync(`docker exec ${containerName} psql -h localhost -U postgres -d ${sourceDb} -t -A -c "SELECT sum(\\"currentBalance\\")::bigint FROM public.\\"Balance\\";"`).toString().trim();
    const tgtBalanceSum = execSync(`docker exec ${containerName} psql -h localhost -U postgres -d ${targetDb} -t -A -c "SELECT sum(\\"currentBalance\\")::bigint FROM public.\\"Balance\\";"`).toString().trim();
    assert.strictEqual(tgtBalanceSum, '6250000');
    assert.strictEqual(tgtBalanceSum, srcBalanceSum, 'Financial balance sum must match exactly');
    console.log(`  ✓ Total Financial Balance: IDR ${parseInt(tgtBalanceSum, 10).toLocaleString()} (MATCH).`);

    // B. Per-user wallet aggregates
    const srcWallets = execSync(`docker exec ${containerName} psql -h localhost -U postgres -d ${sourceDb} -t -A -c "SELECT \\"name\\", \\"type\\", \\"currentBalance\\" FROM public.\\"Balance\\" ORDER BY \\"name\\";"`).toString().trim();
    const tgtWallets = execSync(`docker exec ${containerName} psql -h localhost -U postgres -d ${targetDb} -t -A -c "SELECT \\"name\\", \\"type\\", \\"currentBalance\\" FROM public.\\"Balance\\" ORDER BY \\"name\\";"`).toString().trim();
    assert.strictEqual(srcWallets, tgtWallets, 'Per-wallet breakdown must match');
    console.log('  ✓ Per-user wallet aggregate breakdown verified identically.');

    // C. Setting qris_image Singapore path invariant
    const qrisSetting = execSync(`docker exec ${containerName} psql -h localhost -U postgres -d ${targetDb} -t -A -c "SELECT \\"value\\" FROM public.\\"Setting\\" WHERE \\"key\\" = 'qris_image';"`).toString().trim();
    assert.strictEqual(qrisSetting, 'qris/norden_qris_singapore.png');
    assert.ok(!qrisSetting.includes('cfsjmpfgywfvpmrguqsi'), 'qris_image must NOT point to Tokyo Supabase project');
    console.log(`  ✓ Setting "qris_image" points to Singapore storage path: "${qrisSetting}".`);

    // 8. Timings summary
    console.log('\n=== REHEARSAL TIMINGS SUMMARY ===');
    console.log(`  Export elapsed time:        ${exportElapsedMs} ms`);
    console.log(`  Import elapsed time:        ${importElapsedMs} ms`);
    console.log(`  Reconciliation elapsed:     ${reconElapsedMs} ms`);
    console.log(`  Total transfer turnaround:  ${exportElapsedMs + importElapsedMs + reconElapsedMs} ms`);
    console.log('\n=== REAL DATA-ONLY IMPORT REHEARSAL PASSED WITH 100% SUCCESS ===');
  } finally {
    console.log(`\n[9] Destroying disposable local rehearsal container (${containerName})...`);
    try {
      execSync(`docker rm -f ${containerName}`, { stdio: 'pipe' });
      console.log('  ✓ Disposable container destroyed.');
    } catch {}
  }
}

runMigrationRehearsal().catch(err => {
  console.error('\nMigration Rehearsal Failed:', err);
  process.exit(1);
});
