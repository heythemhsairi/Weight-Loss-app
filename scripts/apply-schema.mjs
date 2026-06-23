// One-off: applies supabase/schema.sql via a direct Postgres connection.
// Password is read from PGPASSWORD env (never hardcoded / committed). Run:
//   PGPASSWORD='...' PROJECT_REF=fvoiegftbdockthirsii node scripts/apply-schema.mjs
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const ref = process.env.PROJECT_REF;
const password = process.env.PGPASSWORD;
if (!ref || !password) { console.error('Need PROJECT_REF and PGPASSWORD'); process.exit(1); }

const sqlFile = process.argv[2] || 'supabase/schema.sql';
const sql = fs.readFileSync(path.join(process.cwd(), sqlFile), 'utf8');
console.log(`Applying ${sqlFile}...`);

// Supabase pooler (Session mode, port 5432) — IPv4-friendly, region-agnostic host.
const regions = [
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-2', 'eu-north-1',
];
const candidates = [];
for (const prefix of ['aws-1', 'aws-0']) {
  for (const r of regions) {
    candidates.push({ host: `${prefix}-${r}.pooler.supabase.com`, port: 5432, user: `postgres.${ref}` });
  }
}

for (const c of candidates) {
  const client = new pg.Client({
    host: c.host, port: c.port, user: c.user, password, database: 'postgres',
    ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000,
  });
  try {
    await client.connect();
    console.log(`✅ Connected via ${c.host} as ${c.user}`);
    await client.query(sql);
    console.log('✅ Schema applied successfully.');
    await client.end();
    process.exit(0);
  } catch (e) {
    console.log(`✗ ${c.host} (${c.user}): ${e.message}`);
    try { await client.end(); } catch {}
  }
}
console.error('❌ Could not connect on any host. Check the password / project ref.');
process.exit(1);
