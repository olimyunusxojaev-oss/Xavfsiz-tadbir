import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const url = (env.match(/^DATABASE_URL=(.*)$/m) || [])[1];
if (!url) {
  console.error('NO_URL');
  process.exit(1);
}
const sql = neon(url.trim());
await sql`CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`;
const rows = await sql`SELECT key FROM app_state ORDER BY key`;
console.log('TABLE_OK keys=' + rows.map(function (r) { return r.key; }).join(',') );
