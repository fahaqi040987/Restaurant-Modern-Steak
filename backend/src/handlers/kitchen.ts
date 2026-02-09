import type { Context } from 'hono';
import { sql } from 'drizzle-orm';
import { db, pool } from '../db/connection.js';
import { successResponse, errorResponse } from '../lib/response.js';

// ── GetKitchenOrders ──────────────────────────────────────────────────────────

export async function getKitchenOrders(c: Context) {
  const status = c.req.query('status') || 'all';

  try {
    let query = `
      SELECT DISTINCT o.id::text, o.order_number, o.table_id::text, o.order_type, o.status,
             o.created_at, o.customer_name,
             t.table_number
      FROM orders o
      LEFT JOIN dining_tables t ON o.table_id = t.id
      WHERE o.status IN ('pending', 'confirmed', 'preparing', 'ready')
    `;

    const params: string[] = [];
    if (status !== 'all') {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }

    query += ` ORDER BY o.created_at ASC`;

    const orderRes = await pool.query(query, params);

    const orders: Record<string, unknown>[] = [];

    for (const row of orderRes.rows) {
      // Fetch order items for this order
      const itemRes = await db.execute<{
        id: string;
        product_id: string;
        quantity: number;
        special_instructions: string | null;
        status: string | null;
        product_name: string | null;
        product_description: string | null;
      }>(sql`
        SELECT oi.id, oi.product_id, oi.quantity, oi.special_instructions, oi.status,
               p.name as product_name, p.description as product_description
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ${row.id}
        ORDER BY oi.created_at ASC
      `);

      const items = itemRes.rows.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        special_instructions: item.special_instructions ?? '',
        status: item.status ?? '',
        product_name: item.product_name ?? '',
        product_description: item.product_description ?? '',
      }));

      orders.push({
        id: row.id,
        order_number: row.order_number ?? '',
        table_id: row.table_id ?? null,
        table_number: row.table_number ?? '',
        order_type: row.order_type ?? '',
        status: row.status ?? '',
        customer_name: row.customer_name ?? '',
        created_at: row.created_at,
        items,
      });
    }

    return successResponse(c, 'Kitchen orders retrieved successfully', orders);
  } catch (err) {
    return errorResponse(c, 'Failed to fetch kitchen orders', (err as Error).message);
  }
}

// ── UpdateOrderItemStatus ──────────────────────────────────────────────────────

export async function updateOrderItemStatus(c: Context) {
  const orderID = c.req.param('id');
  const itemID = c.req.param('item_id');

  let body: { status: string };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  if (!body.status) {
    return errorResponse(c, 'Status is required', 'missing_status', 400);
  }

  try {
    await db.execute(sql`
      UPDATE order_items
      SET status = ${body.status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${itemID} AND order_id = ${orderID}
    `);

    return successResponse(c, 'Order item status updated successfully');
  } catch (err) {
    return errorResponse(c, 'Failed to update order item status', (err as Error).message);
  }
}
