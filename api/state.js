import { neon } from '@neondatabase/serverless';

const KEYS = ['hx.apps', 'hx.clients', 'hx.executors', 'hx.users', 'hx.counter', 'hx.draft', 'hx.norms'];

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: 'database' });
    return;
  }
  const sql = neon(process.env.DATABASE_URL);
  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT key, value FROM app_state`;
      const keys = {};
      rows.forEach(function (row) {
        if (KEYS.indexOf(row.key) >= 0) keys[row.key] = row.value;
      });
      res.status(200).json({ keys: keys });
      return;
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (KEYS.indexOf(body.key) < 0) {
        res.status(400).json({ error: 'key' });
        return;
      }
      const value = JSON.stringify(body.value === undefined ? null : body.value);
      await sql`INSERT INTO app_state (key, value, updated_at)
        VALUES (${body.key}, ${value}::jsonb, now())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
      res.status(200).json({ ok: true });
      return;
    }
    res.status(405).json({ error: 'method' });
  } catch (err) {
    res.status(500).json({ error: 'db' });
  }
}
