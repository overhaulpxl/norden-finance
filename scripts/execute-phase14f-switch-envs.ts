import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';

const vAuthPath = path.join(os.homedir(), 'AppData', 'Roaming', 'com.vercel.cli', 'Data', 'auth.json');
const vAuth = JSON.parse(fs.readFileSync(vAuthPath, 'utf8'));
assert.ok(vAuth?.token, 'Vercel token required');

const authPath = path.join(os.homedir(), '.local', 'share', 'opencode', 'mcp-auth.json');
const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const sbToken = auth.supabase?.tokens?.accessToken;
assert.ok(sbToken, 'Supabase token required');

const sgRef = 'tidpkhwcxrsugioctpnf';

async function switchProductionEnvs() {
  console.log('=== PHASE 14F: SWITCH VERCEL PRODUCTION ENVS TO SINGAPORE ===\n');

  // 1. Fetch live Singapore anon key
  const sbKeysRes = await fetch(`https://api.supabase.com/v1/projects/${sgRef}/api-keys`, {
    headers: { Authorization: `Bearer ${sbToken}` }
  });
  const sbKeys = await sbKeysRes.json();
  const sgAnonKey = sbKeys.find((k: any) => k.name === 'anon')?.api_key;
  assert.ok(sgAnonKey, 'Singapore anon key required');

  // 2. Step A: De-target Tokyo production envs to ["development"] or delete duplicates
  console.log('Step 1: Retiring Tokyo variables from production and preview...');

  // Modify targets of multi-target Tokyo variables to just development
  const tokyoDeTarget = [
    { id: 'mSccz9jmVEYTU8P1', key: 'DATABASE_URL' },
    { id: 'BvCcPDPwU9ncuhMw', key: 'SUPABASE_URL' },
    { id: 'TW6p0Nmv29AiyQ18', key: 'NEXT_PUBLIC_SUPABASE_URL' },
    { id: 'PQ4LXTGLL4VhtjRe', key: 'SUPABASE_SECRET_KEY' },
    { id: 'AJH7QUjeEzsTC5V4', key: 'SUPABASE_SERVICE_ROLE_KEY' },
    { id: 'uGpi9m7yyrgfGZRc', key: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' },
  ];

  for (const item of tokyoDeTarget) {
    const patchRes = await fetch(`https://api.vercel.com/v9/projects/norden/env/${item.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${vAuth.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: ['development'],
        gitBranch: null,
      })
    });
    console.log(`  - De-targeted Tokyo ${item.key} (${item.id}): status ${patchRes.status}`);
    assert.strictEqual(patchRes.status, 200, `Failed to de-target ${item.key} (${item.id})`);
  }

  // Delete redundant Tokyo production/preview singletons (DIRECT_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const tokyoDelete = [
    { id: 'pEuTj8aIWzD69rpV', key: 'DIRECT_URL (Tokyo prod)' },
    { id: 'xBGhJ624BafJM2Aa', key: 'DIRECT_URL (Tokyo prev)' },
    { id: 'gTSPCkGbCRQikwbi', key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY (Tokyo prod)' },
  ];

  for (const item of tokyoDelete) {
    const delRes = await fetch(`https://api.vercel.com/v9/projects/norden/env/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${vAuth.token}` },
    });
    console.log(`  - Deleted ${item.key} (${item.id}): status ${delRes.status}`);
    assert.ok(delRes.status === 200 || delRes.status === 404, `Failed to delete ${item.id}`);
  }

  // Update SUPABASE_ANON_KEY (6DownzQIrU12pZ3U) to Singapore value
  const patchAnon = await fetch(`https://api.vercel.com/v9/projects/norden/env/6DownzQIrU12pZ3U`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${vAuth.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      value: sgAnonKey,
      target: ['production', 'preview'],
      gitBranch: null,
    })
  });
  console.log(`  - Updated SUPABASE_ANON_KEY to Singapore: status ${patchAnon.status}`);
  assert.strictEqual(patchAnon.status, 200, 'Failed to update SUPABASE_ANON_KEY');

  // 3. Step B: Promote Singapore preview variables to ["production", "preview"] with gitBranch: null
  console.log('\nStep 2: Promoting Singapore variables to production and preview (global)...');
  const singaporeEnvIds = [
    { id: 'yLTp3ROymZPoM25q', key: 'DATABASE_URL' },
    { id: 'V1lzeIGaL3mgLsVR', key: 'DIRECT_URL' },
    { id: '9kwh90bsZmNaAjmf', key: 'SUPABASE_URL' },
    { id: 'uLHTpAFnJpEP7GPd', key: 'NEXT_PUBLIC_SUPABASE_URL' },
    { id: 'ok47Ux7dpgffpl0K', key: 'SUPABASE_SECRET_KEY' },
    { id: 'JjecXYnUOuikUbuQ', key: 'SUPABASE_SERVICE_ROLE_KEY' },
    { id: 'sARONt5YYtZANaAK', key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY' },
    { id: 'Z6IZ5sidokQaS1rp', key: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' },
  ];

  for (const item of singaporeEnvIds) {
    const patchRes = await fetch(`https://api.vercel.com/v9/projects/norden/env/${item.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${vAuth.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: ['production', 'preview'],
        gitBranch: null,
      })
    });
    console.log(`  - Promoted Singapore ${item.key} (${item.id}): status ${patchRes.status}`);
    assert.strictEqual(patchRes.status, 200, `Failed to promote ${item.key} (${item.id})`);
  }

  // 4. Verify Final State
  console.log('\nStep 3: Auditing final production environment variables...');
  const envRes = await fetch('https://api.vercel.com/v9/projects/norden/env', {
    headers: { Authorization: `Bearer ${vAuth.token}` }
  });
  const data = await envRes.json();
  const envs: any[] = data.envs || [];

  const prodEnvs = envs.filter(e => e.target?.includes('production'));
  console.log(`Total production env vars active: ${prodEnvs.length}`);

  const checkKeys = [
    'DATABASE_URL',
    'DIRECT_URL',
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SECRET_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'MAINTENANCE_MODE',
  ];

  for (const k of checkKeys) {
    const matching = prodEnvs.filter(e => e.key === k);
    assert.strictEqual(matching.length, 1, `Expected exactly 1 production env for ${k}, got ${matching.length}`);
    const e = matching[0];
    console.log(`  ✓ ${k.padEnd(36)} -> ID: ${e.id} | Target: ${JSON.stringify(e.target)} | Branch: ${e.gitBranch || 'NONE'}`);
  }

  // Double check URLs point to Singapore
  const supUrlObj = prodEnvs.find(e => e.key === 'SUPABASE_URL');
  const nextSupUrlObj = prodEnvs.find(e => e.key === 'NEXT_PUBLIC_SUPABASE_URL');
  
  const supUrlRes = await (await fetch(`https://api.vercel.com/v10/projects/norden/env/${supUrlObj.id}`, {
    headers: { Authorization: `Bearer ${vAuth.token}` }
  })).json();
  const nextSupUrlRes = await (await fetch(`https://api.vercel.com/v10/projects/norden/env/${nextSupUrlObj.id}`, {
    headers: { Authorization: `Bearer ${vAuth.token}` }
  })).json();

  assert.strictEqual(supUrlRes.value, `https://${sgRef}.supabase.co`);
  assert.strictEqual(nextSupUrlRes.value, `https://${sgRef}.supabase.co`);
  console.log(`\n  ✓ SUPABASE_URL = ${supUrlRes.value}`);
  console.log(`  ✓ NEXT_PUBLIC_SUPABASE_URL = ${nextSupUrlRes.value}`);

  const maint = prodEnvs.find(e => e.key === 'MAINTENANCE_MODE');
  assert.strictEqual(maint.value, 'true', 'MAINTENANCE_MODE must remain true');
  console.log(`  ✓ MAINTENANCE_MODE = ${maint.value}`);

  console.log('\n=== PHASE 14F: VERCEL PRODUCTION ENVIRONMENT SWITCH COMPLETED SUCCESSFULLY ===');
}

switchProductionEnvs().catch(err => {
  console.error('\nEnv switch failed:', err);
  process.exit(1);
});
