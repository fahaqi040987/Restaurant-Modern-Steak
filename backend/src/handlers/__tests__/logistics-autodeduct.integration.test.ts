import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { pool } from '../../db/connection.js';
import { internalAutoDeduct } from '../logistics.js';

// Regression test for order creation failing with:
//   new row for relation "ingredient_history" violates check constraint
//   "ingredient_history_operation_check"
//
// Runs against the real dev database (localhost:5432) so the actual
// ingredient_history_operation_check constraint is enforced. All fixture rows
// live inside a transaction that is rolled back, so nothing persists.

describe('internalAutoDeduct (integration)', () => {
  it('records ingredient history without violating ingredient_history_operation_check', async () => {
    const client = await pool.connect();
    const ingredientId = randomUUID();
    const productId = randomUUID();

    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO products (id, name, price) VALUES ($1, $2, 10000)`,
        [productId, `repro-product-${productId}`],
      );
      await client.query(
        `INSERT INTO ingredients (id, name, unit, current_stock) VALUES ($1, $2, 'pcs', 100)`,
        [ingredientId, `repro-ingredient-${ingredientId}`],
      );
      await client.query(
        `INSERT INTO product_ingredients (product_id, ingredient_id, quantity_required) VALUES ($1, $2, 2)`,
        [productId, ingredientId],
      );

      const orderId = randomUUID();
      await client.query(
        `INSERT INTO orders (id, order_number, order_type, status) VALUES ($1, $2, 'dine_in', 'pending')`,
        [orderId, `REPRO-${orderId.slice(0, 8)}`],
      );

      const deducted = await internalAutoDeduct(
        client,
        [{ product_id: productId, quantity: 3 }],
        orderId,
      );

      expect(deducted).toHaveLength(1);
      expect(deducted[0]).toMatchObject({
        ingredient_id: ingredientId,
        quantity_deducted: 6,
        previous_stock: 100,
        new_stock: 94,
      });

      const { rows } = await client.query(
        `SELECT operation, order_id, quantity, previous_stock, new_stock
         FROM ingredient_history WHERE ingredient_id = $1`,
        [ingredientId],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].operation).toBe('order_consumption');
      expect(rows[0].order_id).toBe(orderId);
    } finally {
      await client.query('ROLLBACK').catch(() => {});
      client.release();
    }
  });
});
