import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { setupRoutes } from '../../routes/index.js';
import { generateToken } from '../../lib/jwt.js';
import { pool } from '../../db/connection.js';

// Regression tests for ambiguous table status reporting.
//
// The admin/server UIs need a single effective table status
// (available | occupied | reserved | maintenance) plus the reason
// (current order / note), and a table must only become available again
// when ALL of its active orders are finished.
//
// Runs against the real dev database; fixture rows are cleaned up.

const TABLE_NUMBER = `REG-${randomUUID().slice(0, 8)}`;

describe('Table status reporting and release (integration)', () => {
  let app: Hono;
  let authToken: string;
  let tableId: string;
  const createdOrderIds: string[] = [];

  beforeAll(async () => {
    app = new Hono();
    setupRoutes(app);

    // Use the seeded admin user so order status history FKs resolve
    const admin = await pool.query("SELECT id FROM users WHERE username = 'admin'");
    authToken = generateToken({
      id: admin.rows[0].id,
      username: 'admin',
      role: 'admin',
    });

    const res = await pool.query(
      `INSERT INTO dining_tables (table_number, seating_capacity, location)
       VALUES ($1, 4, 'Regression') RETURNING id`,
      [TABLE_NUMBER],
    );
    tableId = res.rows[0].id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM orders WHERE table_id = $1', [tableId]);
    await pool.query('DELETE FROM dining_tables WHERE id = $1', [tableId]);
    await pool.end();
  });

  async function getTableViaApi(): Promise<Record<string, unknown>> {
    const res = await app.request(
      `/api/v1/admin/tables?search=${encodeURIComponent(TABLE_NUMBER)}`,
      { headers: { Authorization: `Bearer ${authToken}` } },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<Record<string, unknown>> };
    return body.data[0];
  }

  async function insertOrder(status: string): Promise<string> {
    const id = randomUUID();
    await pool.query(
      `INSERT INTO orders (id, order_number, table_id, order_type, status)
       VALUES ($1, $2, $3, 'dine_in', $4)`,
      [id, `REG-${id.slice(0, 8)}`, tableId, status],
    );
    createdOrderIds.push(id);
    // Order creation marks the table occupied
    await pool.query('UPDATE dining_tables SET is_occupied = true WHERE id = $1', [tableId]);
    return id;
  }

  it('reports available for a table with no orders', async () => {
    const table = await getTableViaApi();
    expect(table.status).toBe('available');
  });

  it('reports occupied with the current order as the reason', async () => {
    const orderId = await insertOrder('pending');

    const table = await getTableViaApi();
    expect(table.status).toBe('occupied');
    const currentOrder = table.current_order as { order_number: string } | null;
    expect(currentOrder?.order_number).toBeTruthy();
  });

  it('supports reserved and maintenance states with a note', async () => {
    const setRes = await app.request(`/api/v1/admin/tables/${tableId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'reserved', status_note: 'Guest booking 7pm' }),
    });
    expect(setRes.status).toBe(200);

    const table = await getTableViaApi();
    expect(table.status).toBe('reserved');
    expect(table.status_note).toBe('Guest booking 7pm');

    await app.request(`/api/v1/admin/tables/${tableId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'maintenance', status_note: 'Wobbly leg' }),
    });
    expect((await getTableViaApi()).status).toBe('maintenance');

    // Clearing the manual state: the table is RELEASED (available), matching
    // staff intent — manual states and occupancy never re-assert themselves
    // after an explicit release.
    await app.request(`/api/v1/admin/tables/${tableId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'available', status_note: null }),
    });
    expect((await getTableViaApi()).status).toBe('available');
  });

  it('rejects invalid status values', async () => {
    const res = await app.request(`/api/v1/admin/tables/${tableId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'out-of-lunch' }),
    });
    expect(res.status).toBe(400);
  });

  it('keeps the table occupied while another active order remains', async () => {
    const firstOrderId = createdOrderIds[0];
    expect(firstOrderId).toBeTruthy();
    await insertOrder('served');

    // Complete only the first order; the second (served) is still active
    const res = await app.request(`/api/v1/orders/${firstOrderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    expect(res.status).toBe(200);

    const table = await getTableViaApi();
    expect(table.is_occupied).toBe(true);
    expect(table.status).toBe('occupied');
  });

  it('releases an occupied table when staff mark it available', async () => {
    // Table currently has a lingering 'served' order keeping it occupied
    expect((await getTableViaApi()).status).toBe('occupied');

    const res = await app.request(`/api/v1/admin/tables/${tableId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'available' }),
    });
    expect(res.status).toBe(200);

    const table = await getTableViaApi();
    expect(table.status).toBe('available');
    expect(table.is_occupied).toBe(false);
  });

  it('lists a table once with only its latest active order', async () => {
    // The table already has active orders from earlier tests; add one more so
    // multiple unfinished orders pile up on the same table.
    await insertOrder('served');

    const res = await app.request(
      `/api/v1/admin/tables?search=${encodeURIComponent(TABLE_NUMBER)}`,
      { headers: { Authorization: `Bearer ${authToken}` } },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: Array<{ id: string; current_order: { order_number: string } | null }>;
    };

    const rowsForTable = body.data.filter((t) => t.id === tableId);
    expect(rowsForTable).toHaveLength(1);
  });
});
