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

async function checkDatabaseHealth() {
  console.log('=== CHECK B: DATABASE HEALTH, QUOTAS & CONNECTIONS ===\n');

  // 1. Table inventory (must be 25)
  const tables = await runSql("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;");
  console.log(`1. Public tables in Singapore: ${tables.length}`);
  assert.strictEqual(tables.length, 25, 'Expected 25 public tables');

  const hasMigrations = tables.some((t: any) => t.tablename === '_prisma_migrations');
  assert.ok(hasMigrations, 'Migration ledger must be present');
  console.log('  ✓ All 25 public tables present including _prisma_migrations.');

  // 2. Database size vs 500MB Free tier quota
  const sizeRes = await runSql("SELECT pg_database_size('postgres') as size_bytes, pg_size_pretty(pg_database_size('postgres')) as size_pretty;");
  const sizeBytes = parseInt(sizeRes[0].size_bytes, 10);
  const sizePretty = sizeRes[0].size_pretty;
  console.log(`\n2. Database size: ${sizePretty} (${sizeBytes} bytes)`);
  const freeLimitBytes = 500 * 1024 * 1024; // 500 MiB free tier limit
  const percentUsed = ((sizeBytes / freeLimitBytes) * 100).toFixed(2);
  console.log(`  Usage against 500MB free quota: ${percentUsed}%`);
  assert.ok(sizeBytes < freeLimitBytes, 'Database size must be well within free tier limit');
  console.log('  ✓ Database size well within 500MB free quota.');

  // 3. PostgreSQL connections (active, idle, pooler)
  console.log('\n3. PostgreSQL connection metrics (pg_stat_activity):');
  const connStats = await runSql(`
    SELECT
      count(*) as total_backends,
      count(*) FILTER (WHERE state = 'active') as active_backends,
      count(*) FILTER (WHERE state = 'idle') as idle_backends,
      count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_trans
    FROM pg_stat_activity
    WHERE pid <> pg_backend_pid();
  `);
  console.log('  Connection summary:', connStats[0]);
  assert.strictEqual(parseInt(connStats[0].idle_in_trans, 10), 0, 'No stuck idle-in-transaction connections');

  // Detailed backends
  const detailed = await runSql(`
    SELECT pid, usename, client_addr, application_name, state
    FROM pg_stat_activity
    WHERE pid <> pg_backend_pid();
  `);
  console.log(`  Total backends detail (${detailed.length}):`);
  for (const b of detailed) {
    console.log(`  - pid: ${b.pid} | user: ${b.usename} | client: ${b.client_addr || 'local'} | app: ${b.application_name || 'none'} | state: ${b.state}`);
  }

  // 4. Connection limit
  const maxConn = await runSql("SHOW max_connections;");
  console.log(`\n4. PostgreSQL max_connections: ${maxConn[0].max_connections}`);

  // 5. Check row counts
  let totalAppRows = 0;
  for (const t of tables) {
    if (t.tablename !== '_prisma_migrations') {
      const r = await runSql(`SELECT count(*)::int as c FROM public."${t.tablename}";`);
      totalAppRows += r[0].c;
    }
  }
  console.log(`\n5. Total application rows in Singapore: ${totalAppRows}`);
  assert.strictEqual(totalAppRows, 28, 'Application rows must match 28');
  console.log('  ✓ Application row count exactly 28.');

  console.log('\n=== CHECK B PASSED: DATABASE HEALTHY & ZERO QUOTA STRESS ===');
}

checkDatabaseHealth().catch(err => {
  console.error('\nCheck B failed:', err);
  process.exit(1);
});
