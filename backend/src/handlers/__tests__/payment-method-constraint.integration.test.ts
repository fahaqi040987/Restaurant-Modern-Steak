import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { setupRoutes } from '../../routes/index.js';
import { pool } from '../../db/connection.js';
import { generateTestToken, testUserId } from './auth-helper.js';

// Regression: the payments table was created (database/init/01_schema.sql)
// with a CHECK constraint limiting payment_method to the original POS enum:
//   payments_payment_method_check CHECK (payment_method IN
//     ('cash','credit_card','debit_card','digital_wallet'))
// The configurable payment methods feature introduces more codes (e.g. the
// 'qris' seed), which the database rejected with:
//   "new row for relation \"payments\" violates check constraint
//    \"payments_payment_method_check\""
// These tests drive the real endpoints and must pass once the constraint is
// dropped (validity is enforced by the app against payment_methods).

const migrationApplied = await pool
  .query<{ t: string | null }>("SELECT to_regclass('payment_methods') AS t")
  .then((r) => r.rows[0]?.t !== null)
  .catch(() => false);

const d = migrationApplied ? describe : describe.skip;

// Setup shared fixtures once
let app: Hono;
let authHeader: Record<string, string>;
let tableId = '';
let productId = '';
let orderId = '';
let csrfToken = '';

beforeAll(async () => {
  app = new Hono();
  setupRoutes(app);
  authHeader = { Authorization: `Bearer ${generateTestToken()}` };

  tableId = randomUUID();
  productId = randomUUID();
  orderId = randomUUID();

  // processed_by references users(id) — satisfy the FK for the counter flow
  await pool.query(
    `INSERT INTO users (id, username, email, password_hash, first_name, last_name, role)
     VALUES ($1, 'pm-check-user', 'pm-check@example.com', 'x', 'PM', 'Check', 'counter')
     ON CONFLICT (username) DO NOTHING`,
    [testUserId()],
  );

  await pool.query(
    `INSERT INTO dining_tables (id, table_number, seating_capacity, is_occupied, qr_code)
     VALUES ($1, 'T-PMCHECK', 4, false, $2) ON CONFLICT (qr_code) DO NOTHING`,
    [tableId, `qr-pmcheck-${tableId}`],
  );
  await pool.query(
    `INSERT INTO products (id, name, price, is_available) VALUES ($1, 'PM Check Product', 1000, true)`,
    [productId],
  );

  // CSRF for the customer endpoint
  const csrfRes = await app.request('/api/v1/customer/csrf-token');
  const csrfBody = (await csrfRes.json()) as { data: { token: string } };
  csrfToken = csrfBody.data.token;
});

afterAll(async () => {
  await pool.query('DELETE FROM payments WHERE order_id = $1', [orderId]);
  await pool.query('DELETE FROM order_status_history WHERE order_id = $1', [orderId]);
  await pool.query('DELETE FROM orders WHERE id = $1', [orderId]);
  await pool.query('DELETE FROM products WHERE id = $1', [productId]);
  await pool.query('DELETE FROM dining_tables WHERE id = $1', [tableId]);
  await pool.query('DELETE FROM users WHERE id = $1', [testUserId()]);
});

async function createPendingOrder(): Promise<string> {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO orders (id, order_number, table_id, order_type, status, subtotal, tax_amount, discount_amount, total_amount)
     VALUES ($1, $2, $3, 'dine_in', 'pending', 1000, 110, 0, 1110)`,
    [id, `PMCHECK-${id.slice(0, 8)}`, tableId],
  );
  return id;
}

d('Payments accept configurable payment method codes (regression)', () => {
  it('customer QR payment accepts the qris seed code', async () => {
    const id = await createPendingOrder();

    const res = await app.request(`/api/v1/customer/orders/${id}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Table-ID': tableId,
        'x-csrf-token': csrfToken,
      },
      body: JSON.stringify({ payment_method: 'qris', amount: 1110 }),
    });

    const body = (await res.json()) as { success: boolean; error?: string };
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.error).toBeUndefined();
  });

  it('counter payment accepts the qris seed code', async () => {
    const id = await createPendingOrder();

    const res = await app.request(`/api/v1/counter/orders/${id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ payment_method: 'qris', amount: 1110 }),
    });

    const body = (await res.json()) as { success: boolean; error?: string };
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.error).toBeUndefined();
  });

  it('counter payment still rejects inactive/unknown codes at the app layer', async () => {
    const id = await createPendingOrder();

    const res = await app.request(`/api/v1/counter/orders/${id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ payment_method: 'definitely_not_a_method', amount: 1110 }),
    });

    const body = (await res.json()) as { success: boolean; error?: string };
    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });
});
