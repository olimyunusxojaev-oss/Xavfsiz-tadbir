import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const url = (env.match(/^DATABASE_URL=(.*)$/m) || [])[1].trim();
const sql = neon(url);
const probe = { probe: true, at: '2026-10-30' };
await sql`INSERT INTO app_state (key, value, updated_at) VALUES ('hx.probe', ${JSON.stringify(probe)}::jsonb, now())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
const rows = await sql`SELECT key, value FROM app_state WHERE key = 'hx.probe'`;
const ok = rows.length === 1 && rows[0].value && rows[0].value.probe === true;
await sql`DELETE FROM app_state WHERE key = 'hx.probe'`;
const left = await sql`SELECT key FROM app_state WHERE key = 'hx.probe'`;
console.log(ok && left.length === 0 ? 'PROBE_OK' : 'PROBE_FAIL');
