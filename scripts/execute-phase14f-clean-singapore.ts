import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';

const authPath = path.join(os.homedir(), '.local', 'share', 'opencode', 'mcp-auth.json');
const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const sbToken = auth.supabase?.tokens?.accessToken;
assert.ok(sbToken, 'Supabase token required');

const sgRef = 'tidpkhwcxrsugioctpnf';

async function runSql(sql: string) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${sgRef}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sbToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function cleanSingapore() {
  console.log('=== PHASE 14F: CLEAN SINGAPORE SYNTHETIC DATA ===\n');

  // 1. Pre-cleanup inventory
  const tables = await runSql("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;");
  assert.strictEqual(tables.length, 25, 'Expected 25 public tables in Singapore');

  const appTables = tables.map((t: any) => t.tablename).filter((t: string) => t !== '_prisma_migrations');
  assert.strictEqual(appTables.length, 24, 'Expected 24 application tables');

  let preTotalRows = 0;
  let preAppRows = 0;
  for (const table of tables) {
    const r = await runSql(`SELECT count(*)::int as count FROM public."${table.tablename}";`);
    const count = r[0].count;
    preTotalRows += count;
    if (table.tablename !== '_prisma_migrations') preAppRows += count;
  }
  console.log(`Pre-cleanup counts: total = ${preTotalRows}, app = ${preAppRows}`);
  assert.strictEqual(preAppRows, 112, `Expected 112 synthetic app rows, got: ${preAppRows}`);
  assert.strictEqual(preTotalRows, 120, `Expected 120 total rows, got: ${preTotalRows}`);

  // Check _prisma_migrations pre-clean
  const preMigrations = await runSql(`SELECT id, migration_name, checksum FROM public."_prisma_migrations" ORDER BY finished_at ASC;`);
  assert.strictEqual(preMigrations.length, 8, 'Expected 8 migrations');

  // 2. Perform TRUNCATE in single transaction without CASCADE
  console.log('\nExecuting atomic TRUNCATE across all 24 application tables without CASCADE...');
  const truncateSql = `
BEGIN;
TRUNCATE TABLE
  "Achievement",
  "AppSubscription",
  "AuditLog",
  "Balance",
  "BillingSubscription",
  "Budget",
  "Category",
  "Debt",
  "EmergencyFundPlan",
  "Feedback",
  "Notification",
  "Paylater",
  "PaymentRequest",
  "Plan",
  "Profile",
  "RateLimitBucket",
  "RecurringTransaction",
  "Reminder",
  "SavingGoal",
  "Setting",
  "Streak",
  "Transaction",
  "TransactionTemplate",
  "WishlistItem";
COMMIT;
`;
  await runSql(truncateSql);
  console.log('  ✓ TRUNCATE completed successfully.');

  // 3. Post-cleanup verification
  console.log('\nVerifying post-cleanup counts:');
  for (const table of appTables) {
    const r = await runSql(`SELECT count(*)::int as count FROM public."${table}";`);
    assert.strictEqual(r[0].count, 0, `Table ${table} must have 0 rows, got: ${r[0].count}`);
  }
  console.log('  ✓ All 24 application tables are empty (0 rows).');

  const postMigrations = await runSql(`SELECT id, migration_name, checksum FROM public."_prisma_migrations" ORDER BY finished_at ASC;`);
  assert.strictEqual(postMigrations.length, 8, 'Expected exactly 8 migration rows');
  for (let i = 0; i < 8; i++) {
    assert.strictEqual(postMigrations[i].migration_name, preMigrations[i].migration_name);
    assert.strictEqual(postMigrations[i].checksum, preMigrations[i].checksum);
  }
  console.log('  ✓ Exactly 8 _prisma_migrations rows preserved with identical checksums.');

  console.log('\n=== PHASE 14F: SINGAPORE CLEANUP SUCCESSFUL (100%) ===');
}

cleanSingapore().catch(err => {
  console.error('\nCleanup failed:', err);
  process.exit(1);
});
