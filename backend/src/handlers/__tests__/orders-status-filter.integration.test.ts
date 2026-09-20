import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { setupRoutes } from '../../routes/index.js';
import { generateToken } from '../../lib/jwt.js';
import { pool } from '../../db/connection.js';

// Regression tests for the counter payment list:
// the frontend requests orders with Axios array serialization
// (status[]=ready&status[]=served). The backend must apply the status
// filter in every accepted shape and NEVER return completed/cancelled
// orders as "ready for payment".

describe('GET /orders status filter shapes (integration)', () => {
  let app: Hono;
  let authToken: string;
  const createdOrderIds: string[] = [];

  beforeAll(async () => {
    app = new Hono();
    setupRoutes(app);

    const admin = await pool.query("SELECT id FROM users WHERE username = 'admin'");
    authToken = generateToken({ id: admin.rows[0].id, username: 'admin', role: 'admin' });

    for (const status of ['ready', 'served', 'completed']) {
      const id = randomUUID();
      await pool.query(
        `INSERT INTO orders (id, order_number, order_type, status) VALUES ($1, $2, 'takeout', $3)`,
        [id, `REG-${id.slice(0, 8)}`, status],
      );
      createdOrderIds.push(id);
    }
  });

  afterAll(async () => {
    await pool.query('DELETE FROM orders WHERE id = ANY($1::uuid[])', [createdOrderIds]);
    await pool.end();
  });

  async function statusesForQuery(query: string): Promise<Record<string, number>> {
    const res = await app.request(`/api/v1/orders${query}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ id: string; status: string }> };

    const byStatus: Record<string, number> = {};
    for (const order of body.data) {
      if (createdOrderIds.includes(order.id)) {
        byStatus[order.status] = (byStatus[order.status] || 0) + 1;
      }
    }
    return byStatus;
  }

  it('filters Axios array syntax: status[]=ready&status[]=served excludes completed', async () => {
    const byStatus = await statusesForQuery('?status[]=ready&status[]=served');
    expect(byStatus).toEqual({ ready: 1, served: 1 });
  });

  it('filters repeated params: status=ready&status=served excludes completed', async () => {
    const byStatus = await statusesForQuery('?status=ready&status=served');
    expect(byStatus).toEqual({ ready: 1, served: 1 });
  });

  it('filters comma syntax: status=ready,served excludes completed', async () => {
    const byStatus = await statusesForQuery('?status=ready,served');
    expect(byStatus).toEqual({ ready: 1, served: 1 });
  });

  it('returns only the requested status when completed is asked for explicitly', async () => {
    // Order-history pages legitimately request completed orders; the filter
    // must be precise in array shape too.
    const byStatus = await statusesForQuery('?status[]=completed');
    expect(byStatus).toEqual({ completed: 1 });
  });
});
