import { readFile } from 'node:fs/promises';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL を設定してください');
const { Pool } = await import('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined });
try {
  const sql = await readFile(new URL('./migrations/001_initial.sql', import.meta.url), 'utf8');
  await pool.query(sql);
  console.log('PostgreSQL migration completed.');
} finally {
  await pool.end();
}
