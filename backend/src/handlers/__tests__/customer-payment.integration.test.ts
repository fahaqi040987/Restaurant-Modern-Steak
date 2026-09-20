import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { setupRoutes } from '../../routes/index.js';
import { pool } from '../../db/connection.js';

// Regression tests for QR ("Tunai") payments failing with:
//   "Payment amount must match remaining balance"
//   required_amount: 33299.82, provided_amount: 33299.8224
//
// The order total is stored DECIMAL(10,2) (33299.82) while the QR flow sends
// the unrounded computed total (33299.8224). Sub-cent float noise must not
// reject a legitimate payment; genuinely wrong amounts still must.

describe('Customer payment amount tolerance (integration)', () => {
  let app: Hono;
  let tableId: string;
  let orderId: string;
  let productId: string;

  beforeAll(async () => {
    app = new Hono();
    setupRoutes(app);

    const table = await pool.query(
      `INSERT INTO dining_tables (table_number, seating_capacity, location)
       VALUES ($1, 2, 'Regression') RETURNING id`,
      [`REG-${randomUUID().slice(0, 8)}`],
    );
    tableId = table.rows[0].id;

    const product = await pool.query(
      `INSERT INTO products (name, price) VALUES ($1, 29999.84) RETURNING id`,
      [`repro-pay-${randomUUID().slice(0, 8)}`],
    );
    productId = product.rows[0].id;

    // Create a QR order through the real handler so the flow matches the user
    const res = await app.request('/api/v1/customer/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_id: tableId,
        customer_name: 'Repro',
        items: [{ product_id: productId, quantity: 1 }],
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      data: { order_id: string; total_amount: number };
    };
    orderId = body.data.order_id;

    // Sanity: the echoed total is now rounded to cents (was 33299.8224 raw)
    expect(body.data.total_amount).toBe(33299.82);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM payments WHERE order_id = $1', [orderId]);
    await pool.query('DELETE FROM order_status_history WHERE order_id = $1', [orderId]);
    await pool.query('DELETE FROM orders WHERE id = $1', [orderId]);
    await pool.query('DELETE FROM products WHERE id = $1', [productId]);
    await pool.query('DELETE FROM dining_tables WHERE id = $1', [tableId]);
    await pool.end();
  });

  it('accepts the unrounded computed total (sub-cent float noise)', async () => {
    // What the QR flow sends today: 29999.84 * 1.11 = 33299.8224
    const res = await app.request(`/api/v1/customer/orders/${orderId}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_method: 'cash', amount: 33299.8224 }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);

    // Paid QR order must enter the kitchen pipeline ('confirmed'), not 'paid'
    // (invalid status) nor stay 'pending'
    const orderRow = await pool.query('SELECT status FROM orders WHERE id = $1', [orderId]);
    expect(orderRow.rows[0].status).toBe('confirmed');
  });

  it('rejects an amount that is genuinely different', async () => {
    // Create a second order to test rejection without payment interference
    const res = await app.request('/api/v1/customer/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_id: tableId,
        items: [{ product_id: productId, quantity: 1 }],
      }),
    });
    expect(res.status).toBe(201);
    const created = (await res.json()) as { data: { order_id: string } };

    const payRes = await app.request(`/api/v1/customer/orders/${created.data.order_id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_method: 'cash', amount: 30000 }),
    });
    expect(payRes.status).toBe(400);
    const body = (await payRes.json()) as { error: string };
    expect(body.error).toBe('Payment amount must match remaining balance');

    await pool.query('DELETE FROM order_status_history WHERE order_id = $1', [created.data.order_id]);
    await pool.query('DELETE FROM orders WHERE id = $1', [created.data.order_id]);
  });
});
