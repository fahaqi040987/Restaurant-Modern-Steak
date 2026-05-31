import type { Context } from 'hono';
import { sql } from 'drizzle-orm';
import { db, pool } from '../db/connection.js';

// ── AutoDeductIngredients ──────────────────────────────────────────────────────────

export async function autoDeductIngredients(c: Context) {
  let body: {
    order_items: Array<{
      product_id: string;
      quantity: number;
    }>;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  if (!body.order_items || !Array.isArray(body.order_items)) {
    return c.json({ error: 'order_items is required and must be an array' }, 400);
  }

  const client = await pool.connect();
  const deductedItems: Array<{
    ingredient_id: string;
    ingredient_name: string;
    quantity_deducted: number;
    previous_stock: number;
    new_stock: number;
  }> = [];

  try {
    await client.query('BEGIN');

    for (const item of body.order_items) {
      // Get recipe for this product
      const recipeRes = await client.query(
        `SELECT pi.ingredient_id, pi.quantity, i.name as ingredient_name, i.current_stock
         FROM product_ingredients pi
         JOIN ingredients i ON pi.ingredient_id = i.id
         WHERE pi.product_id = $1`,
        [item.product_id]
      );

      for (const row of recipeRes.rows) {
        const ingredientId = row.ingredient_id;
        const quantityPerProduct = Number(row.quantity);
        const totalQuantity = quantityPerProduct * item.quantity;
        const currentStock = Number(row.current_stock);
        const newStock = currentStock - totalQuantity;

        // Check if sufficient stock
        if (newStock < 0) {
          await client.query('ROLLBACK');
          return c.json({
            error: `Insufficient stock for ingredient: ${row.ingredient_name}`,
            ingredient_id: ingredientId,
            ingredient_name: row.ingredient_name,
            required: totalQuantity,
            available: currentStock
          }, 400);
        }

        // Update stock
        await client.query(
          'UPDATE ingredients SET current_stock = $1, updated_at = NOW() WHERE id = $2',
          [newStock, ingredientId]
        );

        // Create history record
        await client.query(
          `INSERT INTO ingredient_stock_history (ingredient_id, type, quantity, previous_stock, new_stock, reason, reference_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [ingredientId, 'recipe_usage', totalQuantity, currentStock, newStock, 'recipe_usage', null]
        );

        deductedItems.push({
          ingredient_id: ingredientId,
          ingredient_name: row.ingredient_name,
          quantity_deducted: totalQuantity,
          previous_stock: currentStock,
          new_stock: newStock,
        });
      }
    }

    await client.query('COMMIT');

    return c.json({
      success: true,
      message: 'Stock deducted successfully',
      data: {
        deducted_items: deductedItems
      }
    }, 200);
  } catch (err) {
    await client.query('ROLLBACK');
    return c.json({ error: 'Failed to deduct stock: ' + (err as Error).message }, 500);
  } finally {
    client.release();
  }
}
