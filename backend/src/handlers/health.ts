import type { Context } from 'hono';
import { pool } from '../db/connection.js';

export async function getSystemHealth(c: Context) {
  const startTime = Date.now();

  // Check database connection
  let dbHealth: { connected: boolean; latency?: string; error?: string };
  try {
    const dbStart = Date.now();
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      const latency = Date.now() - dbStart;
      dbHealth = { connected: true, latency: `${latency}ms` };
    } finally {
      client.release();
    }
  } catch (err) {
    dbHealth = { connected: false, error: (err as Error).message };
  }

  const status = dbHealth.connected ? 'healthy' : 'unhealthy';
  const statusCode = dbHealth.connected ? 200 : 503;

  const response: Record<string, unknown> = {
    status,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: dbHealth,
    services: {
      api: {
        status: 'operational',
        uptime: `${Date.now() - startTime}ms`,
        environment: process.env.NODE_ENV || 'production',
      },
    },
  };

  return c.json(response, statusCode as 200);
}
