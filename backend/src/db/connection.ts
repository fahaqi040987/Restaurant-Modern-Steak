import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import * as relations from './relations.js';
import { env } from '../env.js';

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: env.DB_SSLMODE === 'disable' ? false : undefined,
  max: 25,
  idleTimeoutMillis: 300000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, {
  schema: { ...schema, ...relations },
  logger: env.NODE_ENV === 'development',
});

export { pool };

export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('Database connection established successfully');
  } finally {
    client.release();
  }
}
