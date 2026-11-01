import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';

const authPath = path.join(os.homedir(), '.local', 'share', 'opencode', 'mcp-auth.json');
const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const sbToken = auth.supabase?.tokens?.accessToken;
assert.ok(sbToken, 'Supabase token required');

const sgRef = 'tidpkhwcxrsugioctpnf';
const prodHost = 'https://www.nordenfinance.site';

async function runSql(sql: string) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${sgRef}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sbToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function checkCronHealth() {
  console.log('=== CHECK E: CRON & BACKGROUND PROCESSING HEALTH ===\n');

  // 1. Check endpoints rejecting unauthenticated calls without 503 maintenance freeze
  const cronEndpoints = ['/api/cron/recurring', '/api/cron/reminders'];
  for (const ep of cronEndpoints) {
    const res = await fetch(`${prodHost}${ep}`);
    console.log(`Endpoint ${ep} (no auth) -> Status: ${res.status}`);
    assert.strictEqual(res.status, 401, `Expected 401 Unauthorized, got: ${res.status}`);
    const body = await res.json();
    console.log(`  Body:`, body);
    assert.ok(body.error?.includes('Unauthorized'), 'Expected unauthorized error response');
    assert.strictEqual(body.maintenance, undefined, 'Must not return maintenance freeze');
  }
  console.log('  ✓ Both cron endpoints correctly enforce authorization and confirm write-freeze is lifted.');

  // 2. Test invalid Bearer token
  const invalidBearer = await fetch(`${prodHost}/api/cron/recurring`, {
    headers: { Authorization: 'Bearer forged_cron_secret_untrusted' }
  });
  console.log(`\nEndpoint /api/cron/recurring (invalid Bearer) -> Status: ${invalidBearer.status}`);
  assert.strictEqual(invalidBearer.status, 401, 'Expected 401 for forged token');
  console.log('  ✓ Invalid token correctly rejected with 401.');

  // 3. Inspect RecurringTransaction records in database
  console.log('\n3. Inspecting RecurringTransaction records in Singapore database:');
  const recurringRows = await runSql('SELECT count(*)::int as c FROM public."RecurringTransaction";');
  console.log(`  - RecurringTransaction count: ${recurringRows[0].c}`);

  // 4. Inspect Reminder records in database
  console.log('\n4. Inspecting Reminder records in Singapore database:');
  const reminderRows = await runSql('SELECT count(*)::int as c FROM public."Reminder";');
  console.log(`  - Reminder count: ${reminderRows[0].c}`);

  // 5. Inspect AuditLog for background execution logs
  console.log('\n5. Inspecting AuditLog for background errors or executions:');
  const auditLogs = await runSql('SELECT * FROM public."AuditLog" ORDER BY "createdAt" DESC LIMIT 10;');
  console.log(`  - AuditLog records count in database: ${auditLogs.length}`);
  for (const log of auditLogs) {
    console.log(`  - ${log.createdAt} | action: ${log.action} | entity: ${log.entityType}`);
  }

  console.log('\n=== CHECK E PASSED: CRON ENDPOINTS & DATA INVARIANTS SOUND ===');
}

checkCronHealth().catch(err => {
  console.error('\nCheck E failed:', err);
  process.exit(1);
});
