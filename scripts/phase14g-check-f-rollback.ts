import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';

const vAuthPath = path.join(os.homedir(), 'AppData', 'Roaming', 'com.vercel.cli', 'Data', 'auth.json');
const vAuth = JSON.parse(fs.readFileSync(vAuthPath, 'utf8'));

const authPath = path.join(os.homedir(), '.local', 'share', 'opencode', 'mcp-auth.json');
const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const sbToken = auth.supabase?.tokens?.accessToken;
assert.ok(sbToken, 'Supabase token required');

const tokyoRef = 'cfsjmpfgywfvpmrguqsi';

async function inspectRollbackReadiness() {
  console.log('=== CHECK F: TOKYO ROLLBACK READINESS & RESTORE PROCEDURE ===\n');

  // 1. Identify previous production deployments
  const res = await fetch('https://api.vercel.com/v6/deployments?app=norden&limit=8', {
    headers: { Authorization: `Bearer ${vAuth.token}` }
  });
  const data = await res.json();
  const deployments = data.deployments || [];

  console.log('Recent Deployments on Vercel:');
  for (const d of deployments) {
    console.log(`- ID: ${d.uid} | target: ${d.target || 'preview'} | state: ${d.state} | commit: ${d.meta?.githubCommitSha?.slice(0, 7) || 'none'} | url: ${d.url} | date: ${new Date(d.createdAt).toISOString()}`);
  }

  // Find previous production deployment before the cutover
  // Current production is dpl_E8zEsBL43bPQDCwiKwvQqKUhPikk (002f71c)
  // Before that: dpl_AxoJACyeuNt4MpYPwSsVwuziM2Wa (redeploy with maintenance off)
  // Before that: dpl_ADa2oSAyv6qzoxezUGxzxMTTpS2k (first Singapore prod redeploy)
  // Immediately before cutover: dpl_8U6sS1G2xF6e5BJYvUUm8iF9gsL2 (commit a6543e9, created 2026-11-01T02:12:24Z, used Tokyo)
  const preCutoverDeployment = deployments.find((d: any) => d.uid === 'dpl_8U6sS1G2xF6e5BJYvUUm8iF9gsL2');
  console.log('\nImmediately previous pre-cutover Production deployment:');
  console.log('  Deployment ID:', preCutoverDeployment?.uid);
  console.log('  Commit SHA:', preCutoverDeployment?.meta?.githubCommitSha);
  console.log('  URL:', preCutoverDeployment?.url);
  console.log('  Created At:', new Date(preCutoverDeployment?.createdAt).toISOString());

  // 2. Tokyo Supabase Integrity & Read-Only Status
  console.log('\n2. Verifying Tokyo Supabase health & read-only lock:');
  const roRes = await fetch(`https://api.supabase.com/v1/projects/${tokyoRef}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sbToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'SHOW default_transaction_read_only;' }),
  });
  const ro = await roRes.json();
  console.log('  - Tokyo default_transaction_read_only:', ro[0]?.default_transaction_read_only);
  assert.strictEqual(ro[0]?.default_transaction_read_only, 'on', 'Tokyo must be read-only');

  const countRes = await fetch(`https://api.supabase.com/v1/projects/${tokyoRef}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sbToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'SELECT count(*)::int as c FROM public."Balance";' }),
  });
  const balCount = await countRes.json();
  console.log(`  - Tokyo Balance row count: ${balCount[0]?.c}`);
  assert.strictEqual(balCount[0]?.c, 2, 'Tokyo Balance rows must remain untouched (2)');

  // 3. Inspect Tokyo environment variables presence in Vercel
  console.log('\n3. Inspecting Tokyo environment variables in Vercel:');
  const envRes = await fetch('https://api.vercel.com/v9/projects/norden/env', {
    headers: { Authorization: `Bearer ${vAuth.token}` }
  });
  const envData = await envRes.json();
  const allEnvs: any[] = envData.envs || [];

  const tokyoKeys = [
    { id: 'mSccz9jmVEYTU8P1', key: 'DATABASE_URL (Tokyo)' },
    { id: 'BvCcPDPwU9ncuhMw', key: 'SUPABASE_URL (Tokyo)' },
    { id: 'TW6p0Nmv29AiyQ18', key: 'NEXT_PUBLIC_SUPABASE_URL (Tokyo)' },
    { id: 'PQ4LXTGLL4VhtjRe', key: 'SUPABASE_SECRET_KEY (Tokyo)' },
    { id: 'AJH7QUjeEzsTC5V4', key: 'SUPABASE_SERVICE_ROLE_KEY (Tokyo)' },
    { id: 'uGpi9m7yyrgfGZRc', key: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (Tokyo)' },
  ];

  for (const tk of tokyoKeys) {
    const found = allEnvs.find((e: any) => e.id === tk.id);
    console.log(`  - ${tk.key.padEnd(46)} -> Found: ${Boolean(found)} | target: ${JSON.stringify(found?.target)}`);
    assert.ok(found, `Tokyo env ${tk.id} must be preserved in Vercel`);
  }

  // 4. Encrypted local backups
  console.log('\n4. Verifying encrypted offline backup archives:');
  const backupDir = path.join(os.tmpdir(), 'antigravity', 'phase14f_backups');
  assert.ok(fs.existsSync(backupDir), `backups directory must exist at ${backupDir}`);
  const backupFiles = fs.readdirSync(backupDir).filter(f => f.endsWith('.enc'));
  console.log(`  Found ${backupFiles.length} encrypted backup files in ${backupDir}:`);
  for (const bf of backupFiles) {
    const stats = fs.statSync(path.join(backupDir, bf));
    console.log(`  - ${bf} (${stats.size} bytes)`);
  }
  assert.ok(backupFiles.length >= 2, 'Must have at least Tokyo DB and Singapore DB backups');

  console.log('\n=== CHECK F PASSED: TOKYO ROLLBACK SOURCE 100% PRESERVED & READY ===');
}

inspectRollbackReadiness().catch(err => {
  console.error('\nCheck F failed:', err);
  process.exit(1);
});
