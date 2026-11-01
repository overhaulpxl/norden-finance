import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';

const vAuthPath = path.join(os.homedir(), 'AppData', 'Roaming', 'com.vercel.cli', 'Data', 'auth.json');
const vAuth = JSON.parse(fs.readFileSync(vAuthPath, 'utf8'));

async function disableMaintenanceAndRedeploy() {
  console.log('=== PHASE 14F: DISABLE MAINTENANCE MODE & FINAL PRODUCTION DEPLOYMENT ===\n');

  // 1. Update MAINTENANCE_MODE to false
  console.log('Step 1: Setting MAINTENANCE_MODE to "false" in Vercel...');
  const patchRes = await fetch('https://api.vercel.com/v9/projects/norden/env/dkXDpmHw65B9IWXq', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${vAuth.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      value: 'false',
      target: ['production', 'preview'],
      gitBranch: null,
    })
  });
  assert.strictEqual(patchRes.status, 200, 'Failed to update MAINTENANCE_MODE');
  console.log('  ✓ MAINTENANCE_MODE updated to "false".');

  // 2. Trigger final production deployment
  console.log('\nStep 2: Triggering final Production deployment in sin1...');
  const deployRes = await fetch('https://api.vercel.com/v13/deployments?forceNew=1', {
    method: 'POST',
    headers: { Authorization: `Bearer ${vAuth.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'norden',
      deploymentId: 'dpl_ADa2oSAyv6qzoxezUGxzxMTTpS2k',
      target: 'production'
    })
  });
  assert.strictEqual(deployRes.status, 200, 'Failed to trigger redeployment');
  const dpl = await deployRes.json();
  const dplId = dpl.id;
  console.log(`  ✓ Deployment initiated: ${dplId} (${dpl.url})`);

  // 3. Poll until READY
  console.log('\nStep 3: Polling deployment readyState...');
  for (let i = 0; i < 35; i++) {
    const res = await fetch(`https://api.vercel.com/v13/deployments/${dplId}`, {
      headers: { Authorization: `Bearer ${vAuth.token}` }
    });
    const d = await res.json();
    console.log(`  [${i * 5}s] status: ${d.status} | readyState: ${d.readyState}`);
    if (d.readyState === 'READY') {
      console.log('\n  ✓ FINAL PRODUCTION DEPLOYMENT READY!');
      console.log('  URL:', d.url);
      console.log('  Aliases:', d.alias);
      console.log('  Regions:', d.regions);
      return d;
    }
    if (d.readyState === 'ERROR') {
      throw new Error(`Deployment failed: ${JSON.stringify(d)}`);
    }
    await new Promise(r => setTimeout(r, 5000));
  }

  throw new Error('Timeout waiting for deployment to become READY');
}

disableMaintenanceAndRedeploy().catch(err => {
  console.error('\nDeployment failed:', err);
  process.exit(1);
});
