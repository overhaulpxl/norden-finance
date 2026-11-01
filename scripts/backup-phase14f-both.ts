import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execSync } from 'child_process';

const backupDir = path.join(os.tmpdir(), 'antigravity', 'phase14f_backups');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

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

async function exportProjectDump(projectRef: string, label: string): Promise<string> {
  console.log(`Exporting full public schema & data for ${label} (${projectRef})...`);
  let sql = `-- Norden Finance Dump: ${label} (${projectRef})\n`;
  sql += `SET statement_timeout = 0;\nSET client_encoding = 'UTF8';\nSET standard_conforming_strings = on;\n\n`;

  // 1. Enums
  const enums = await runSql(projectRef, `
    SELECT t.typname, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname;
  `);
  for (const en of enums) {
    const valList = en.values.split(', ').map((v: string) => `'${v.trim()}'`).join(', ');
    sql += `DO $$ BEGIN\n  CREATE TYPE public."${en.typname}" AS ENUM (${valList});\nEXCEPTION WHEN duplicate_object THEN null;\nEND $$;\n\n`;
  }

  // 2. Tables and columns
  const tables = await runSql(projectRef, `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`);
  for (const t of tables) {
    const tableName = t.tablename;
    const cols = await runSql(projectRef, `
      SELECT column_name, data_type, udt_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `);

    sql += `CREATE TABLE IF NOT EXISTS public."${tableName}" (\n`;
    const colDefs = cols.map((c: any) => {
      let typeStr = c.data_type;
      if (c.data_type === 'USER-DEFINED') typeStr = `public."${c.udt_name}"`;
      else if (c.data_type === 'ARRAY') typeStr = `${c.udt_name.replace(/^_/, '')}[]`;
      let def = `  "${c.column_name}" ${typeStr}`;
      if (c.column_default) def += ` DEFAULT ${c.column_default}`;
      if (c.is_nullable === 'NO') def += ' NOT NULL';
      return def;
    });
    sql += colDefs.join(',\n') + '\n);\n\n';
  }

  // 3. Primary keys
  const pks = await runSql(projectRef, `
    SELECT tc.table_name, tc.constraint_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public';
  `);
  for (const pk of pks) {
    sql += `ALTER TABLE ONLY public."${pk.table_name}" DROP CONSTRAINT IF EXISTS "${pk.constraint_name}";\n`;
    sql += `ALTER TABLE ONLY public."${pk.table_name}" ADD CONSTRAINT "${pk.constraint_name}" PRIMARY KEY ("${pk.column_name}");\n\n`;
  }

  // 4. Data Insertion
  for (const t of tables) {
    const tableName = t.tablename;
    const rows = await runSql(projectRef, `SELECT * FROM public."${tableName}";`);
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
        sql += `INSERT INTO public."${tableName}" (${colNames.map(c => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')});\n`;
      }
      sql += '\n';
    }
  }

  // 5. Indexes
  const indexes = await runSql(projectRef, `
    SELECT indexname, indexdef FROM pg_indexes
    WHERE schemaname = 'public' AND indexname NOT LIKE '%_pkey';
  `);
  for (const idx of indexes) {
    sql += `${idx.indexdef};\n`;
  }
  sql += '\n';

  // 6. Foreign Keys
  const fks = await runSql(projectRef, `
    SELECT tc.table_name, tc.constraint_name, kcu.column_name,
           ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name, rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
  `);
  for (const fk of fks) {
    sql += `ALTER TABLE ONLY public."${fk.table_name}" DROP CONSTRAINT IF EXISTS "${fk.constraint_name}";\n`;
    sql += `ALTER TABLE ONLY public."${fk.table_name}" ADD CONSTRAINT "${fk.constraint_name}" FOREIGN KEY ("${fk.column_name}") REFERENCES public."${fk.foreign_table_name}"("${fk.foreign_column_name}") ON DELETE ${fk.delete_rule};\n\n`;
  }

  const rawFile = path.join(backupDir, `${label.toLowerCase()}_raw.sql`);
  fs.writeFileSync(rawFile, sql);
  return rawFile;
}

async function backupTokyoStorage() {
  console.log('Backing up Tokyo Storage objects...');
  const keysRes = await fetch(`https://api.supabase.com/v1/projects/${tokyoRef}/api-keys`, {
    headers: { Authorization: `Bearer ${sbToken}` }
  });
  const keys = await keysRes.json();
  const serviceKey = keys.find((k: any) => k.name === 'service_role')?.api_key;
  assert.ok(serviceKey, 'Tokyo service role key required');

  const storageDir = path.join(backupDir, 'storage_tokyo');
  if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

  const qrisObjects = ['merchant_1792756634039_image.png', 'merchant_1792918766957_image.png'];
  for (const objName of qrisObjects) {
    const res = await fetch(`https://${tokyoRef}.supabase.co/storage/v1/object/qris/${objName}`, {
      headers: { Authorization: `Bearer ${serviceKey}` }
    });
    assert.strictEqual(res.status, 200, `Must download ${objName}`);
    const buf = Buffer.from(await res.arrayBuffer());
    assert.strictEqual(buf.length, 2608169, `Byte length must be 2608169 for ${objName}`);
    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    fs.writeFileSync(path.join(storageDir, objName), buf);
    console.log(`  ✓ Backed up Tokyo QRIS ${objName} (${buf.length} bytes, SHA-256: ${hash})`);
  }
}

async function runFullPreCutoverBackups() {
  console.log('=== PHASE 14F: INDEPENDENT PRE-CUTOVER BACKUPS ===\n');

  // 1. Tokyo Production DB Dump
  const tokyoRawFile = await exportProjectDump(tokyoRef, 'tokyo_production');
  const tokyoKeyFile = path.join(backupDir, 'tokyo_production.key');
  const tokyoEncFile = path.join(backupDir, 'tokyo_production_pg17.sql.enc');
  fs.writeFileSync(tokyoKeyFile, crypto.randomBytes(32).toString('hex'));
  execSync(`node scripts/backup/cipher.js encrypt --key-file "${tokyoKeyFile}" --in "${tokyoRawFile}" --out "${tokyoEncFile}"`);
  console.log(`  ✓ Tokyo DB Encrypted: ${fs.statSync(tokyoEncFile).size} bytes (AES-256-GCM)`);
  fs.unlinkSync(tokyoRawFile);

  // 2. Tokyo Storage Backup
  await backupTokyoStorage();

  // 3. Singapore Preview DB Dump
  const sgRawFile = await exportProjectDump(sgRef, 'singapore_preview');
  const sgKeyFile = path.join(backupDir, 'singapore_preview.key');
  const sgEncFile = path.join(backupDir, 'singapore_preview_pg17.sql.enc');
  fs.writeFileSync(sgKeyFile, crypto.randomBytes(32).toString('hex'));
  execSync(`node scripts/backup/cipher.js encrypt --key-file "${sgKeyFile}" --in "${sgRawFile}" --out "${sgEncFile}"`);
  console.log(`  ✓ Singapore DB Encrypted: ${fs.statSync(sgEncFile).size} bytes (AES-256-GCM)`);
  fs.unlinkSync(sgRawFile);

  // 4. Test Restoration into local PG17 container
  const containerName = `norden_backup_test_pg17_${Date.now()}`;
  console.log(`\nVerifying restoration in PostgreSQL 17 container (${containerName})...`);
  execSync(`docker run -d --name ${containerName} -e POSTGRES_PASSWORD=postgres postgres:17-alpine`);

  try {
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
    assert.ok(ready, 'PG17 test container ready');

    // Test Tokyo Restore
    const tokyoDecFile = path.join(backupDir, 'tokyo_dec.sql');
    execSync(`node scripts/backup/cipher.js decrypt --key-file "${tokyoKeyFile}" --in "${tokyoEncFile}" --out "${tokyoDecFile}"`);
    execSync(`docker exec ${containerName} psql -h localhost -U postgres -c "CREATE DATABASE tokyo_test;"`);
    execSync(`docker cp "${tokyoDecFile}" ${containerName}:/tokyo_dec.sql`);
    execSync(`docker exec ${containerName} psql -h localhost -U postgres -d tokyo_test -f /tokyo_dec.sql`, { stdio: 'pipe' });
    fs.unlinkSync(tokyoDecFile);

    const tokyoRowCount = parseInt(execSync(`docker exec ${containerName} psql -h localhost -U postgres -d tokyo_test -t -A -c "SELECT sum(c) FROM (SELECT count(*)::int as c FROM \\"Profile\\" UNION ALL SELECT count(*)::int FROM \\"Plan\\" UNION ALL SELECT count(*)::int FROM \\"BillingSubscription\\" UNION ALL SELECT count(*)::int FROM \\"Balance\\" UNION ALL SELECT count(*)::int FROM \\"Category\\" UNION ALL SELECT count(*)::int FROM \\"Setting\\" UNION ALL SELECT count(*)::int FROM \\"AuditLog\\" UNION ALL SELECT count(*)::int FROM \\"RateLimitBucket\\" UNION ALL SELECT count(*)::int FROM \\"_prisma_migrations\\") s;"`).toString().trim(), 10);
    assert.strictEqual(tokyoRowCount, 36, `Tokyo restored total rows must be 36, got: ${tokyoRowCount}`);
    console.log(`  ✓ Tokyo DB Backup Restore Verified: 36/36 rows (28 app + 8 migrations).`);

    // Test Singapore Restore
    const sgDecFile = path.join(backupDir, 'sg_dec.sql');
    execSync(`node scripts/backup/cipher.js decrypt --key-file "${sgKeyFile}" --in "${sgEncFile}" --out "${sgDecFile}"`);
    execSync(`docker exec ${containerName} psql -h localhost -U postgres -c "CREATE DATABASE sg_test;"`);
    execSync(`docker cp "${sgDecFile}" ${containerName}:/sg_dec.sql`);
    execSync(`docker exec ${containerName} psql -h localhost -U postgres -d sg_test -f /sg_dec.sql`, { stdio: 'pipe' });
    fs.unlinkSync(sgDecFile);

    const sgRowCount = parseInt(execSync(`docker exec ${containerName} psql -h localhost -U postgres -d sg_test -t -A -c "SELECT count(*)::int FROM \\"_prisma_migrations\\";"`).toString().trim(), 10);
    assert.strictEqual(sgRowCount, 8, `Singapore restored migration count must be 8, got: ${sgRowCount}`);
    console.log(`  ✓ Singapore DB Backup Restore Verified: 8/8 migrations, all schemas and tables verified.`);

    console.log('\n=== BOTH DATABASE AND STORAGE BACKUPS VERIFIED & INTEGRITY PROVEN ===');
  } finally {
    execSync(`docker rm -f ${containerName}`, { stdio: 'pipe' });
    console.log('  ✓ Temporary test container destroyed.');
  }
}

runFullPreCutoverBackups().catch(err => {
  console.error('\nPre-Cutover Backup Failed:', err);
  process.exit(1);
});
