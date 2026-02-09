import type { Context } from 'hono';
import { sql } from 'drizzle-orm';
import { db, pool } from '../db/connection.js';

// ── GetInventory ──────────────────────────────────────────────────────────

export async function getInventory(c: Context) {
  try {
    const rows = await db.execute<{
      product_id: string;
      product_name: string;
      category_name: string;
      current_stock: number;
      min_stock: number;
      max_stock: number;
      unit: string;
      last_restocked: string;
      price: string;
      status: string;
    }>(sql`
      SELECT
        p.id as product_id, p.name as product_name, c.name as category_name,
        COALESCE(i.current_stock, 0) as current_stock,
        COALESCE(i.minimum_stock, 10) as min_stock,
        COALESCE(i.maximum_stock, 100) as max_stock,
        'pcs' as unit,
        COALESCE(i.last_restocked_at, p.created_at) as last_restocked,
        p.price,
        CASE
          WHEN COALESCE(i.current_stock, 0) = 0 THEN 'out'
          WHEN COALESCE(i.current_stock, 0) < COALESCE(i.minimum_stock, 10) THEN 'low'
          ELSE 'ok'
        END as status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_available = true
      ORDER BY status DESC, c.name, p.name
    `);

    const items = rows.rows.map((row) => ({
      product_id: row.product_id,
      product_name: row.product_name,
      category_name: row.category_name,
      current_stock: Number(row.current_stock),
      min_stock: Number(row.min_stock),
      max_stock: Number(row.max_stock),
      unit: row.unit,
      last_restocked: row.last_restocked,
      price: Number(row.price),
      status: row.status,
    }));

    // Return raw array (matches Go behavior)
    return c.json(items, 200);
  } catch {
    return c.json({ error: 'Failed to fetch inventory' }, 500);
  }
}

// ── GetProductInventory ──────────────────────────────────────────────────────

export async function getProductInventory(c: Context) {
  const productId = c.req.param('product_id');

  try {
    const rows = await db.execute<{
      product_id: string;
      product_name: string;
      category_name: string;
      current_stock: number;
      min_stock: number;
      max_stock: number;
      unit: string;
      last_restocked: string;
      price: string;
      status: string;
    }>(sql`
      SELECT
        p.id as product_id, p.name as product_name, c.name as category_name,
        COALESCE(i.current_stock, 0) as current_stock,
        COALESCE(i.minimum_stock, 10) as min_stock,
        COALESCE(i.maximum_stock, 100) as max_stock,
        COALESCE(i.unit_cost, '0') as unit,
        COALESCE(i.last_restocked_at, p.created_at) as last_restocked,
        p.price,
        CASE
          WHEN COALESCE(i.current_stock, 0) = 0 THEN 'out'
          WHEN COALESCE(i.current_stock, 0) < COALESCE(i.minimum_stock, 10) THEN 'low'
          ELSE 'ok'
        END as status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = ${productId}
    `);

    if (rows.rows.length === 0) {
      return c.json({ error: 'Product not found' }, 404);
    }

    const row = rows.rows[0];
    return c.json({
      product_id: row.product_id,
      product_name: row.product_name,
      category_name: row.category_name,
      current_stock: Number(row.current_stock),
      min_stock: Number(row.min_stock),
      max_stock: Number(row.max_stock),
      unit: 'pcs',
      last_restocked: row.last_restocked,
      price: Number(row.price),
      status: row.status,
    }, 200);
  } catch {
    return c.json({ error: 'Product not found' }, 404);
  }
}

// ── AdjustStock ──────────────────────────────────────────────────────────

export async function adjustStock(c: Context) {
  let body: {
    product_id: string;
    operation: string;
    quantity: number;
    reason: string;
    notes?: string;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  if (!body.product_id) {
    return c.json({ error: 'product_id is required' }, 400);
  }
  if (!body.operation) {
    return c.json({ error: 'operation is required' }, 400);
  }
  if (!body.quantity || body.quantity <= 0) {
    return c.json({ error: 'quantity must be greater than 0' }, 400);
  }
  if (!body.reason) {
    return c.json({ error: 'reason is required' }, 400);
  }

  // Validate operation
  if (body.operation !== 'add' && body.operation !== 'remove') {
    return c.json({ error: "Operation must be 'add' or 'remove'" }, 400);
  }

  // Validate reason
  const validReasons = ['purchase', 'sale', 'spoilage', 'manual_adjustment', 'inventory_count', 'return', 'damage', 'theft', 'expired'];
  if (!validReasons.includes(body.reason)) {
    return c.json({ error: 'Invalid reason' }, 400);
  }

  const userId = c.get('user_id');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get or create inventory record
    let currentStock = 0;
    const checkRes = await client.query(
      'SELECT id, current_stock FROM inventory WHERE product_id = $1',
      [body.product_id],
    );

    if (checkRes.rows.length === 0) {
      // Create new inventory record
      await client.query(
        'INSERT INTO inventory (product_id, current_stock, minimum_stock, maximum_stock) VALUES ($1, 0, 10, 100)',
        [body.product_id],
      );
    } else {
      currentStock = Number(checkRes.rows[0].current_stock);
    }

    // Calculate new stock
    const previousStock = currentStock;
    let newStock: number;
    if (body.operation === 'add') {
      newStock = currentStock + body.quantity;
    } else {
      newStock = currentStock - body.quantity;
      if (newStock < 0) {
        await client.query('ROLLBACK');
        return c.json({ error: 'Insufficient stock' }, 400);
      }
    }

    // Update inventory
    await client.query(
      'UPDATE inventory SET current_stock = $1, last_restocked_at = NOW(), updated_at = NOW() WHERE product_id = $2',
      [newStock, body.product_id],
    );

    // Create history record
    await client.query(
      `INSERT INTO inventory_history (product_id, operation, quantity, previous_stock, new_stock, reason, notes, adjusted_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [body.product_id, body.operation, body.quantity, previousStock, newStock, body.reason, body.notes || null, userId],
    );

    await client.query('COMMIT');

    return c.json({
      message: 'Stock adjusted successfully',
      previous_stock: previousStock,
      new_stock: newStock,
    }, 200);
  } catch {
    await client.query('ROLLBACK');
    return c.json({ error: 'Failed to adjust stock' }, 500);
  } finally {
    client.release();
  }
}

// ── GetLowStock ──────────────────────────────────────────────────────────

export async function getLowStock(c: Context) {
  try {
    const rows = await db.execute<{
      product_id: string;
      product_name: string;
      category_name: string;
      current_stock: number;
      min_stock: number;
      max_stock: number;
      unit: string;
      last_restocked: string;
      price: string;
      status: string;
    }>(sql`
      SELECT
        p.id as product_id, p.name as product_name, c.name as category_name,
        COALESCE(i.current_stock, 0) as current_stock,
        COALESCE(i.minimum_stock, 10) as min_stock,
        COALESCE(i.maximum_stock, 100) as max_stock,
        'pcs' as unit,
        COALESCE(i.last_restocked_at, p.created_at) as last_restocked,
        p.price,
        CASE
          WHEN COALESCE(i.current_stock, 0) = 0 THEN 'out'
          ELSE 'low'
        END as status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_available = true
        AND COALESCE(i.current_stock, 0) < COALESCE(i.minimum_stock, 10)
      ORDER BY COALESCE(i.current_stock, 0) ASC, p.name
    `);

    const items = rows.rows.map((row) => ({
      product_id: row.product_id,
      product_name: row.product_name,
      category_name: row.category_name,
      current_stock: Number(row.current_stock),
      min_stock: Number(row.min_stock),
      max_stock: Number(row.max_stock),
      unit: row.unit,
      last_restocked: row.last_restocked,
      price: Number(row.price),
      status: row.status,
    }));

    // Return raw array (matches Go behavior)
    return c.json(items, 200);
  } catch {
    return c.json({ error: 'Failed to fetch low stock items' }, 500);
  }
}

// ── GetStockHistory ──────────────────────────────────────────────────────────

export async function getStockHistory(c: Context) {
  const productId = c.req.param('product_id');

  try {
    const rows = await db.execute<{
      id: string;
      operation: string;
      quantity: number;
      previous_stock: number;
      new_stock: number;
      reason: string;
      notes: string;
      adjusted_by: string;
      created_at: string;
    }>(sql`
      SELECT
        ih.id, ih.operation, ih.quantity, ih.previous_stock, ih.new_stock,
        ih.reason, COALESCE(ih.notes, '') as notes,
        COALESCE(u.username, 'System') as adjusted_by,
        ih.created_at
      FROM inventory_history ih
      LEFT JOIN users u ON ih.adjusted_by = u.id
      WHERE ih.product_id = ${productId}
      ORDER BY ih.created_at DESC
      LIMIT 100
    `);

    const history = rows.rows.map((row) => ({
      id: row.id,
      operation: row.operation,
      quantity: Number(row.quantity),
      previous_stock: Number(row.previous_stock),
      new_stock: Number(row.new_stock),
      reason: row.reason,
      notes: row.notes,
      adjusted_by: row.adjusted_by,
      created_at: row.created_at,
    }));

    // Return raw array (matches Go behavior)
    return c.json(history, 200);
  } catch {
    return c.json({ error: 'Failed to fetch history' }, 500);
  }
}
