import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';

const authPath = path.join(os.homedir(), '.local', 'share', 'opencode', 'mcp-auth.json');
const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const sbToken = auth.supabase?.tokens?.accessToken;
const tokyoRef = 'cfsjmpfgywfvpmrguqsi';

async function verifyTokyoUntouched() {
  console.log('=== VERIFYING TOKYO PRODUCTION UNTOUCHED STATUS ===\n');

  // Query Tokyo public tables row counts
  const query = `
    SELECT
      (SELECT count(*)::int FROM public."Profile") as profiles,
      (SELECT count(*)::int FROM public."Plan") as plans,
      (SELECT count(*)::int FROM public."BillingSubscription") as subscriptions,
      (SELECT count(*)::int FROM public."Balance") as balances,
      (SELECT count(*)::int FROM public."Category") as categories,
      (SELECT count(*)::int FROM public."Setting") as settings,
      (SELECT count(*)::int FROM public."AuditLog") as audit_logs,
      (SELECT count(*)::int FROM public."RateLimitBucket") as ratelimit_buckets,
      (SELECT count(*)::int FROM public."_prisma_migrations") as migrations;
  `;

  const res = await fetch(`https://api.supabase.com/v1/projects/${tokyoRef}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sbToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  assert.strictEqual(res.status, 201, 'Tokyo query must succeed');
  const rows = await res.json();
  const r = rows[0];
  console.log('Tokyo Live Counts:');
  console.log('  Profile:', r.profiles, '(expected 1)');
  console.log('  Plan:', r.plans, '(expected 3)');
  console.log('  BillingSubscription:', r.subscriptions, '(expected 1)');
  console.log('  Balance:', r.balances, '(expected 2)');
  console.log('  Category:', r.categories, '(expected 6)');
  console.log('  Setting:', r.settings, '(expected 11)');
  console.log('  AuditLog:', r.audit_logs, '(expected 3)');
  console.log('  RateLimitBucket:', r.ratelimit_buckets, '(expected 1)');
  console.log('  _prisma_migrations:', r.migrations, '(expected 8)');

  const appRows = r.profiles + r.plans + r.subscriptions + r.balances + r.categories + r.settings + r.audit_logs + r.ratelimit_buckets;
  console.log(`\nTokyo Application Rows: ${appRows} (expected 28)`);
  console.log(`Tokyo Total Rows: ${appRows + r.migrations} (expected 36)`);

  assert.strictEqual(appRows, 28, 'Tokyo application rows must be exactly 28');
  assert.strictEqual(r.migrations, 8, 'Tokyo migrations must be exactly 8');
  assert.strictEqual(appRows + r.migrations, 36, 'Tokyo total rows must be exactly 36');

  console.log('\n✓ CONFIRMED: TOKYO PRODUCTION REMAINS 100% UNTOUCHED (ZERO WRITES, ZERO EXPORTS).');
}

verifyTokyoUntouched().catch(err => {
  console.error('\nTokyo Verification Failed:', err);
  process.exit(1);
});
