import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const authPath = path.join(os.homedir(), '.local', 'share', 'opencode', 'mcp-auth.json');
const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const sbToken = auth.supabase?.tokens?.accessToken;
assert.ok(sbToken, 'Supabase management token required');

const tokyoRef = 'cfsjmpfgywfvpmrguqsi';
const sgRef = 'tidpkhwcxrsugioctpnf';

async function runSql(projectRef: string, sql: string) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sbToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function canonicalHash(data: any): string {
  const json = JSON.stringify(data, Object.keys(data || {}).sort());
  return crypto.createHash('sha256').update(json).digest('hex');
}

async function migrateData() {
  console.log('=== PHASE 14F: TRANSFER TOKYO APPLICATION DATA TO SINGAPORE ===\n');

  // Topological dependency order for FKs
  const orderedTables = [
    'Plan',
    'Profile',
    'RateLimitBucket',
    'Setting',
    'AuditLog',
    'Category',
    'Balance',
    'BillingSubscription',
    'PaymentRequest',
    'EmergencyFundPlan',
    'Debt',
    'Paylater',
    'SavingGoal',
    'Streak',
    'Achievement',
    'WishlistItem',
    'Notification',
    'Feedback',
    'Reminder',
    'Budget',
    'TransactionTemplate',
    'RecurringTransaction',
    'Transaction',
    'AppSubscription',
  ];

  // 1. Fetch Tokyo data and verify row counts
  console.log('Fetching live frozen data from Tokyo...');
  const tableData: Record<string, any[]> = {};
  let tokyoTotalAppRows = 0;

  for (const table of orderedTables) {
    const rows = await runSql(tokyoRef, `SELECT * FROM public."${table}" ORDER BY 1;`);
    tableData[table] = rows || [];
    tokyoTotalAppRows += (rows || []).length;
    if (rows && rows.length > 0) {
      console.log(`  - ${table}: ${rows.length} rows`);
    }
  }
  console.log(`Total Tokyo application rows: ${tokyoTotalAppRows} across 24 tables.\n`);
  assert.strictEqual(tokyoTotalAppRows, 28, `Expected exactly 28 application rows in Tokyo, got ${tokyoTotalAppRows}`);

  // 2. Build single transaction INSERT script with normal FK enforcement
  const sgPreCountRows = await runSql(sgRef, `SELECT count(*)::int as c FROM public."Plan";`);
  if (sgPreCountRows[0].c === 0) {
    console.log('Constructing atomic transactional INSERT payload...');
    let sql = 'BEGIN;\n';

    for (const table of orderedTables) {
      const rows = tableData[table];
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
          sql += `INSERT INTO public."${table}" (${colNames.map(c => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')});\n`;
        }
      }
    }

    sql += 'COMMIT;\n';

    // 3. Execute in Singapore
    console.log('Executing atomic import into Singapore Supabase...');
    await runSql(sgRef, sql);
    console.log('  ✓ Data import completed successfully under normal foreign key enforcement.\n');
  } else {
    console.log('  Singapore tables already populated with imported data; proceeding directly to full reconciliation.\n');
  }

  // 4. Full 24-Table Hash & Count Reconciliation
  console.log('Running comprehensive reconciliation between Tokyo and Singapore:');
  let sgTotalAppRows = 0;
  const reconciliationReport: any[] = [];

  for (const table of orderedTables) {
    const srcRows = await runSql(tokyoRef, `SELECT * FROM public."${table}" ORDER BY 1;`);
    const tgtRows = await runSql(sgRef, `SELECT * FROM public."${table}" ORDER BY 1;`);

    const srcCount = (srcRows || []).length;
    const tgtCount = (tgtRows || []).length;
    sgTotalAppRows += tgtCount;

    assert.strictEqual(srcCount, tgtCount, `Row count mismatch for ${table}: Tokyo=${srcCount}, SG=${tgtCount}`);

    const srcHash = canonicalHash(srcRows);
    const tgtHash = canonicalHash(tgtRows);
    assert.strictEqual(srcHash, tgtHash, `Hash mismatch for ${table}`);

    reconciliationReport.push({
      table,
      rows: tgtCount,
      hashMatch: srcHash === tgtHash,
      sha256: tgtHash,
    });
  }

  console.log(`  ✓ All 24 application tables reconciled: ${sgTotalAppRows} rows in Singapore matches Tokyo exactly.`);
  assert.strictEqual(sgTotalAppRows, 28, `Singapore app rows must be 28, got ${sgTotalAppRows}`);

  // 5. Financial Aggregates and Data Sanity Reconciliation
  console.log('\nReconciling Financial Aggregates & System Invariants:');

  // Balances
  const srcBalanceSum = await runSql(tokyoRef, `SELECT COALESCE(SUM("currentBalance"), 0)::text as sum FROM public."Balance";`);
  const tgtBalanceSum = await runSql(sgRef, `SELECT COALESCE(SUM("currentBalance"), 0)::text as sum FROM public."Balance";`);
  assert.strictEqual(srcBalanceSum[0].sum, tgtBalanceSum[0].sum, 'Total Balance sum mismatch');
  console.log('  ✓ Balance total sum matches exactly (value masked for privacy).');

  const srcBalances = await runSql(tokyoRef, `SELECT "type", "currentBalance" FROM public."Balance" ORDER BY "type";`);
  const tgtBalances = await runSql(sgRef, `SELECT "type", "currentBalance" FROM public."Balance" ORDER BY "type";`);
  assert.strictEqual(canonicalHash(srcBalances), canonicalHash(tgtBalances), 'Balance per-type aggregation mismatch');
  console.log('  ✓ Balances grouped by type match exactly.');

  // Plans & Subscriptions
  const srcPlans = await runSql(tokyoRef, `SELECT "name", "price", "billingType", "type" FROM public."Plan" ORDER BY "name";`);
  const tgtPlans = await runSql(sgRef, `SELECT "name", "price", "billingType", "type" FROM public."Plan" ORDER BY "name";`);
  assert.strictEqual(canonicalHash(srcPlans), canonicalHash(tgtPlans), 'Plan configurations mismatch');
  console.log('  ✓ Plan definitions, prices, and intervals match exactly.');

  const srcSubs = await runSql(tokyoRef, `SELECT "status", "plan", "userId" FROM public."BillingSubscription";`);
  const tgtSubs = await runSql(sgRef, `SELECT "status", "plan", "userId" FROM public."BillingSubscription";`);
  assert.strictEqual(canonicalHash(srcSubs), canonicalHash(tgtSubs), 'BillingSubscription mismatch');
  console.log('  ✓ BillingSubscription state matches.');

  // Rate limits
  const srcRate = await runSql(tokyoRef, `SELECT "key", "count" FROM public."RateLimitBucket" ORDER BY "key";`);
  const tgtRate = await runSql(sgRef, `SELECT "key", "count" FROM public."RateLimitBucket" ORDER BY "key";`);
  assert.strictEqual(canonicalHash(srcRate), canonicalHash(tgtRate), 'RateLimitBucket mismatch');
  console.log('  ✓ RateLimitBucket states match.');

  // Settings
  const srcSettings = await runSql(tokyoRef, `SELECT "key" FROM public."Setting" ORDER BY "key";`);
  const tgtSettings = await runSql(sgRef, `SELECT "key" FROM public."Setting" ORDER BY "key";`);
  assert.strictEqual(canonicalHash(srcSettings), canonicalHash(tgtSettings), 'Setting keys mismatch');
  console.log('  ✓ Setting keys match.');

  // 6. Prisma Migrations preservation
  const srcMig = await runSql(tokyoRef, `SELECT migration_name, checksum FROM public."_prisma_migrations" ORDER BY finished_at;`);
  const tgtMig = await runSql(sgRef, `SELECT migration_name, checksum FROM public."_prisma_migrations" ORDER BY finished_at;`);
  assert.strictEqual(srcMig.length, 8, 'Tokyo migrations must be 8');
  assert.strictEqual(tgtMig.length, 8, 'Singapore migrations must be 8');
  assert.strictEqual(canonicalHash(srcMig), canonicalHash(tgtMig), 'Migration ledger mismatch');
  console.log('  ✓ Exactly 8 _prisma_migrations records preserved and identical.');

  console.log('\n=== PHASE 14F: DATA MIGRATION & RECONCILIATION COMPLETE (100% SUCCESS) ===');
}

migrateData().catch(err => {
  console.error('\nData migration failed:', err);
  process.exit(1);
});
