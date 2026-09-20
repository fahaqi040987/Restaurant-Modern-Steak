import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { setupRoutes } from '../../routes/index.js';
import { generateTestToken } from './auth-helper.js';
import { pool } from '../../db/connection.js';

// Regression tests for GET /orders failing with:
//   "invalid reference to FROM-clause entry for table \"orders\""
//
// The status filter was built against the drizzle `orders` table while the
// raw list SQL aliased it as `o`, so any ?status= filter broke the query.
// Comma-separated status lists (sent by the frontend) must also match rows.
//
// Runs against the real dev database; seeded orders are deleted afterwards.

describe('GET /orders (integration)', () => {
  let app: Hono;
  let authToken: string;
  const createdOrderIds: string[] = [];

  beforeAll(() => {
    app = new Hono();
    setupRoutes(app);
    authToken = generateTestToken();
  });

  afterAll(async () => {
    for (const id of createdOrderIds) {
      await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    }
    await pool.end();
  });

  async function seedOrder(status: string): Promise<string> {
    const id = randomUUID();
    await pool.query(
      `INSERT INTO orders (id, order_number, order_type, status) VALUES ($1, $2, 'dine_in', $3)`,
      [id, `REG-${id.slice(0, 8)}`, status],
    );
    createdOrderIds.push(id);
    return id;
  }

  it('returns orders for a comma-separated status list', async () => {
    const pendingId = await seedOrder('pending');

    const res = await app.request('/api/v1/orders?status=pending,confirmed,preparing,ready', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: Array<{ id: string }> };
    expect(body.success).toBe(true);
    expect(body.data.some((order) => order.id === pendingId)).toBe(true);
  });

  it('returns orders for a single status', async () => {
    const pendingId = await seedOrder('pending');

    const res = await app.request('/api/v1/orders?status=pending', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: Array<{ id: string }> };
    expect(body.success).toBe(true);
    expect(body.data.some((order) => order.id === pendingId)).toBe(true);
  });

  it('returns all orders when no status filter is given', async () => {
    const anyId = await seedOrder('pending');

    const res = await app.request('/api/v1/orders', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: Array<{ id: string }> };
    expect(body.success).toBe(true);
    expect(body.data.some((order) => order.id === anyId)).toBe(true);
  });
});
