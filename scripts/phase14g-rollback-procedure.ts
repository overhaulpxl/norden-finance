/**
 * PHASE 14G — TOKYO ROLLBACK PROCEDURE SPECIFICATION
 *
 * This file specifies the deterministic, zero-downtime procedure to restore
 * Tokyo Production (cfsjmpfgywfvpmrguqsi) if an emergency reversion is required.
 *
 * DO NOT EXECUTE IN NORMAL OPERATIONS. REFERENCE SPECIFICATION ONLY.
 */

export const ROLLBACK_SPEC = {
  tokyoProjectRef: 'cfsjmpfgywfvpmrguqsi',
  singaporeProjectRef: 'tidpkhwcxrsugioctpnf',
  preCutoverDeploymentId: 'dpl_8U6sS1G2xF6e5BJYvUUm8iF9gsL2',
  preCutoverCommit: 'a6543e953c2c9bd951351bf863962ecbe00ecff8',

  steps: [
    {
      step: 1,
      name: 'Enable Tokyo Database Writes',
      action: 'ALTER ROLE postgres SET default_transaction_read_only = off;',
      api: 'POST https://api.supabase.com/v1/projects/cfsjmpfgywfvpmrguqsi/database/query',
    },
    {
      step: 2,
      name: 'Activate Maintenance Freeze',
      action: 'PATCH MAINTENANCE_MODE env var to "true" on Vercel',
      envId: 'dkXDpmHw65B9IWXq',
    },
    {
      step: 3,
      name: 'Swap Vercel Environment Variables to Tokyo',
      action: 'Retire Singapore variables to preview branch and promote Tokyo variables to production',
      tokyoEnvsToPromote: [
        { id: 'mSccz9jmVEYTU8P1', key: 'DATABASE_URL' },
        { id: 'BvCcPDPwU9ncuhMw', key: 'SUPABASE_URL' },
        { id: 'TW6p0Nmv29AiyQ18', key: 'NEXT_PUBLIC_SUPABASE_URL' },
        { id: 'PQ4LXTGLL4VhtjRe', key: 'SUPABASE_SECRET_KEY' },
        { id: 'AJH7QUjeEzsTC5V4', key: 'SUPABASE_SERVICE_ROLE_KEY' },
        { id: 'uGpi9m7yyrgfGZRc', key: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' },
      ],
    },
    {
      step: 4,
      name: 'Trigger Production Deployment to Tokyo',
      action: 'POST https://api.vercel.com/v13/deployments?forceNew=1 with deploymentId: dpl_8U6sS1G2xF6e5BJYvUUm8iF9gsL2 and target: production',
    },
    {
      step: 5,
      name: 'Lift Maintenance Mode',
      action: 'PATCH MAINTENANCE_MODE to "false" and re-deploy',
    },
  ],
};
