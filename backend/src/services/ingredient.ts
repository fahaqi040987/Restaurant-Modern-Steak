import { pool } from '../db/connection.js';

// ── DeductIngredientsForOrder ────────────────────────────────────────────────
// Called when an order is created. Deducts ingredient stock based on recipes.

export async function deductIngredientsForOrder(orderId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get order items
    const itemsRes = await client.query(
      `SELECT oi.product_id, oi.quantity
       FROM order_items oi
       WHERE oi.order_id = $1`,
      [orderId],
    );

    for (const item of itemsRes.rows) {
      // Get recipe (product ingredients)
      const recipesRes = await client.query(
        `SELECT pi.ingredient_id, pi.quantity_required
         FROM product_ingredients pi
         WHERE pi.product_id = $1`,
        [item.product_id],
      );

      for (const recipe of recipesRes.rows) {
        const deductionAmount = Number(recipe.quantity_required) * item.quantity;

        // Get current stock with row-level lock (FOR UPDATE) to prevent concurrent modifications
        const stockRes = await client.query(
          `SELECT current_stock FROM ingredients WHERE id = $1 FOR UPDATE`,
          [recipe.ingredient_id],
        );

        if (stockRes.rows.length === 0) continue;

        const currentStock = Number(stockRes.rows[0].current_stock);
        const newStock = currentStock - deductionAmount;

        // Update stock
        await client.query(
          `UPDATE ingredients SET current_stock = $1 WHERE id = $2`,
          [newStock, recipe.ingredient_id],
        );

        // Record history
        await client.query(
          `INSERT INTO ingredient_history (ingredient_id, operation, quantity, previous_stock, new_stock, notes, order_id)
           VALUES ($1, 'order_consumption', $2, $3, $4, $5, $6)`,
          [recipe.ingredient_id, deductionAmount, currentStock, newStock, `Deducted for order ${orderId}`, orderId],
        );

        // Check low stock
        const minRes = await client.query(
          `SELECT name, minimum_stock FROM ingredients WHERE id = $1`,
          [recipe.ingredient_id],
        );

        if (minRes.rows.length > 0 && newStock <= Number(minRes.rows[0].minimum_stock)) {
          // Generate low stock notification
          await generateLowStockNotification(
            client,
            recipe.ingredient_id,
            minRes.rows[0].name,
            newStock,
            Number(minRes.rows[0].minimum_stock),
          );
        }
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to deduct ingredients for order:', (err as Error).message);
    // Don't throw — ingredient deduction failure should not block order creation
  } finally {
    client.release();
  }
}

// ── RestoreIngredientsForOrder ───────────────────────────────────────────────
// Called when an order is cancelled. Restores ingredient stock.

export async function restoreIngredientsForOrder(orderId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get order items
    const itemsRes = await client.query(
      `SELECT oi.product_id, oi.quantity
       FROM order_items oi
       WHERE oi.order_id = $1`,
      [orderId],
    );

    for (const item of itemsRes.rows) {
      // Get recipe (product ingredients)
      const recipesRes = await client.query(
        `SELECT pi.ingredient_id, pi.quantity_required
         FROM product_ingredients pi
         WHERE pi.product_id = $1`,
        [item.product_id],
      );

      for (const recipe of recipesRes.rows) {
        const restoreAmount = Number(recipe.quantity_required) * item.quantity;

        // Get current stock with row-level lock (FOR UPDATE) to prevent concurrent modifications
        const stockRes = await client.query(
          `SELECT current_stock FROM ingredients WHERE id = $1 FOR UPDATE`,
          [recipe.ingredient_id],
        );

        if (stockRes.rows.length === 0) continue;

        const currentStock = Number(stockRes.rows[0].current_stock);
        const newStock = currentStock + restoreAmount;

        // Update stock
        await client.query(
          `UPDATE ingredients SET current_stock = $1 WHERE id = $2`,
          [newStock, recipe.ingredient_id],
        );

        // Record history
        await client.query(
          `INSERT INTO ingredient_history (ingredient_id, operation, quantity, previous_stock, new_stock, notes, order_id)
           VALUES ($1, 'order_cancellation', $2, $3, $4, $5, $6)`,
          [recipe.ingredient_id, restoreAmount, currentStock, newStock, `Restored from cancelled order ${orderId}`, orderId],
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to restore ingredients for order:', (err as Error).message);
  } finally {
    client.release();
  }
}

// ── CheckLowStock ────────────────────────────────────────────────────────────

export async function checkLowStock(): Promise<Array<{
  id: string;
  name: string;
  current_stock: number;
  minimum_stock: number;
}>> {
  const res = await pool.query(`
    SELECT id, name, current_stock, minimum_stock
    FROM ingredients
    WHERE current_stock <= minimum_stock AND is_active = true
    ORDER BY (current_stock / NULLIF(minimum_stock, 0)) ASC
  `);

  return res.rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    current_stock: Number(row.current_stock),
    minimum_stock: Number(row.minimum_stock),
  }));
}

// ── GetIngredientUsageReport ─────────────────────────────────────────────────

export async function getIngredientUsageReport(
  startDate: string,
  endDate: string,
): Promise<Array<Record<string, unknown>>> {
  const res = await pool.query(
    `SELECT i.name, i.unit, SUM(h.quantity) as total_used, COUNT(DISTINCT h.order_id) as order_count
     FROM ingredient_history h
     JOIN ingredients i ON h.ingredient_id = i.id
     WHERE h.operation = 'order_consumption'
       AND h.created_at >= $1 AND h.created_at <= $2
     GROUP BY i.id, i.name, i.unit
     ORDER BY total_used DESC`,
    [startDate, endDate],
  );

  return res.rows.map((row: Record<string, unknown>) => ({
    name: row.name,
    unit: row.unit,
    total_used: Number(row.total_used),
    order_count: Number(row.order_count),
  }));
}

// ── generateLowStockNotification (internal helper) ───────────────────────────

async function generateLowStockNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  _ingredientId: string,
  ingredientName: string,
  currentStock: number,
  minimumStock: number,
): Promise<void> {
  try {
    // Create notification for admin and manager roles
    const usersRes = await client.query(
      `SELECT id FROM users WHERE role IN ('admin', 'manager') AND is_active = true`,
    );

    const message = `Low stock alert: ${ingredientName} is at ${currentStock} (minimum: ${minimumStock})`;

    for (const user of usersRes.rows) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES ($1, 'low_stock', 'Low Stock Alert', $2)
         ON CONFLICT DO NOTHING`,
        [user.id, message],
      );
    }
  } catch (err) {
    console.error('Failed to generate low stock notification:', (err as Error).message);
  }
}
