import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { setupRoutes } from '../../routes/index.js';
import { generateToken } from '../../lib/jwt.js';
import { pool } from '../../db/connection.js';

// Cross-page sync contract: an order that the server station counts as
// "In Kitchen" (GET /orders?status=pending,confirmed,preparing,ready) must be
// visible on the kitchen board (GET /kitchen/orders) for every one of those
// statuses, and must disappear from both once served/completed.

const SHARED_STATUSES = ['pending', 'confirmed', 'preparing', 'ready'];

describe('Server badge <-> kitchen board sync (integration)', () => {
  let app: Hono;
  let authToken: string;
  let tableId: string;
  let productId: string;
  const createdOrderIds: string[] = [];

  beforeAll(async () => {
    app = new Hono();
    setupRoutes(app);

    const admin = await pool.query("SELECT id FROM users WHERE username = 'admin'");
    authToken = generateToken({ id: admin.rows[0].id, username: 'admin', role: 'admin' });

    const table = await pool.query(
      `INSERT INTO dining_tables (table_number, seating_capacity, location)
       VALUES ($1, 2, 'Regression') RETURNING id`,
      [`REG-${randomUUID().slice(0, 8)}`],
    );
    tableId = table.rows[0].id;

    const product = await pool.query(
      `INSERT INTO products (name, price) VALUES ($1, 15000) RETURNING id`,
      [`sync-repro-${randomUUID().slice(0, 8)}`],
    );
    productId = product.rows[0].id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM order_items WHERE order_id = ANY($1::uuid[])', [
      createdOrderIds,
    ]);
    await pool.query('DELETE FROM orders WHERE id = ANY($1::uuid[])', [createdOrderIds]);
    await pool.query('DELETE FROM dining_tables WHERE id = $1', [tableId]);
    await pool.query('DELETE FROM products WHERE id = $1', [productId]);
    await pool.end();
  });

  async function insertOrderWithItem(status: string): Promise<string> {
    const id = randomUUID();
    await pool.query(
      `INSERT INTO orders (id, order_number, table_id, order_type, status)
       VALUES ($1, $2, $3, 'dine_in', $4)`,
      [id, `REG-${id.slice(0, 8)}`, tableId, status],
    );
    await pool.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, status)
       VALUES ($1, $2, 1, 15000, 15000, 'pending')`,
      [id, productId],
    );
    createdOrderIds.push(id);
    return id;
  }

  async function fetchBothSources() {
    const serverRes = await app.request(
      '/api/v1/orders?status=pending,confirmed,preparing,ready',
      { headers: { Authorization: `Bearer ${authToken}` } },
    );
    expect(serverRes.status).toBe(200);
    const serverBody = (await serverRes.json()) as { data: Array<{ order_number: string }> };

    const kitchenRes = await app.request('/api/v1/kitchen/orders', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(kitchenRes.status).toBe(200);
    const kitchenBody = (await kitchenRes.json()) as { data: Array<{ order_number: string }> };

    return {
      serverNumbers: serverBody.data.map((o) => o.order_number),
      kitchenNumbers: kitchenBody.data.map((o) => o.order_number),
    };
  }

  for (const status of SHARED_STATUSES) {
    it(`shows an order in "${status}" on BOTH the server badge and the kitchen board`, async () => {
      const orderId = await insertOrderWithItem(status);
      const orderRow = await pool.query('SELECT order_number FROM orders WHERE id = $1', [orderId]);
      const orderNumber = orderRow.rows[0].order_number as string;

      const { serverNumbers, kitchenNumbers } = await fetchBothSources();
      expect(serverNumbers).toContain(orderNumber);
      expect(kitchenNumbers).toContain(orderNumber);
    });
  }

  it('hides a served order from both the server badge and the kitchen board', async () => {
    const orderId = await insertOrderWithItem('served');
    const orderRow = await pool.query('SELECT order_number FROM orders WHERE id = $1', [orderId]);
    const orderNumber = orderRow.rows[0].order_number as string;

    const { serverNumbers, kitchenNumbers } = await fetchBothSources();
    expect(serverNumbers).not.toContain(orderNumber);
    expect(kitchenNumbers).not.toContain(orderNumber);
  });
});
