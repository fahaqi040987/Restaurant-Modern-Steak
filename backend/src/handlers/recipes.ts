import type { Context } from 'hono';
import { sql } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { successResponse, errorResponse } from '../lib/response.js';

// ── GetProductIngredients ──────────────────────────────────────────────────────

export async function getProductIngredients(c: Context) {
  const productId = c.req.param('id');

  try {
    const rows = await db.execute<{
      id: string;
      product_id: string;
      ingredient_id: string;
      quantity_required: string;
      ingredient_name: string;
      current_stock: string;
      ingredient_unit: string;
    }>(sql`
      SELECT
        pi.id,
        pi.product_id,
        pi.ingredient_id,
        pi.quantity_required,
        i.name as ingredient_name,
        i.current_stock,
        i.unit as ingredient_unit
      FROM product_ingredients pi
      JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE pi.product_id = ${productId}
      ORDER BY i.name
    `);

    const ingredients = rows.rows.map((row) => ({
      id: row.id,
      product_id: row.product_id,
      ingredient_id: row.ingredient_id,
      quantity_required: Number(row.quantity_required),
      ingredient_name: row.ingredient_name,
      current_stock: Number(row.current_stock),
      ingredient_unit: row.ingredient_unit,
    }));

    return successResponse(c, 'Product ingredients retrieved successfully', ingredients);
  } catch (err) {
    return errorResponse(c, 'Failed to retrieve product ingredients', (err as Error).message);
  }
}

// ── AddProductIngredient ──────────────────────────────────────────────────────

export async function addProductIngredient(c: Context) {
  const productId = c.req.param('id');

  let body: {
    ingredient_id: string;
    quantity_required: number;
  };

  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  if (!body.ingredient_id) {
    return errorResponse(c, 'ingredient_id is required', 'missing_ingredient_id', 400);
  }
  if (!body.quantity_required || body.quantity_required <= 0) {
    return errorResponse(c, 'quantity_required must be greater than 0', 'invalid_quantity', 400);
  }

  try {
    // Verify product exists
    const productRes = await db.execute<{ exists: boolean }>(sql`
      SELECT EXISTS(SELECT 1 FROM products WHERE id = ${productId}) as exists
    `);
    if (!productRes.rows[0]?.exists) {
      return errorResponse(c, 'Product not found', 'product_not_found', 404);
    }

    // Verify ingredient exists
    const ingredientRes = await db.execute<{ exists: boolean }>(sql`
      SELECT EXISTS(SELECT 1 FROM ingredients WHERE id = ${body.ingredient_id}) as exists
    `);
    if (!ingredientRes.rows[0]?.exists) {
      return errorResponse(c, 'Ingredient not found', 'ingredient_not_found', 404);
    }

    // Check if ingredient already exists in recipe
    const existsRes = await db.execute<{ exists: boolean }>(sql`
      SELECT EXISTS(
        SELECT 1 FROM product_ingredients WHERE product_id = ${productId} AND ingredient_id = ${body.ingredient_id}
      ) as exists
    `);
    if (existsRes.rows[0]?.exists) {
      return errorResponse(c, 'Ingredient already exists in this product recipe', 'duplicate_ingredient', 409);
    }

    // Insert product ingredient
    const insertRes = await db.execute<{ id: string }>(sql`
      INSERT INTO product_ingredients (product_id, ingredient_id, quantity_required)
      VALUES (${productId}, ${body.ingredient_id}, ${body.quantity_required})
      RETURNING id
    `);

    return successResponse(c, 'Ingredient added to product successfully', {
      id: insertRes.rows[0].id,
    }, 201);
  } catch (err) {
    return errorResponse(c, 'Failed to add ingredient to product', (err as Error).message);
  }
}

// ── UpdateProductIngredient ──────────────────────────────────────────────────────

export async function updateProductIngredient(c: Context) {
  const productId = c.req.param('id');
  const ingredientId = c.req.param('ingredient_id');

  let body: {
    quantity_required: number;
  };

  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  if (!body.quantity_required || body.quantity_required <= 0) {
    return errorResponse(c, 'quantity_required must be greater than 0', 'invalid_quantity', 400);
  }

  try {
    const res = await db.execute(sql`
      UPDATE product_ingredients
      SET quantity_required = ${body.quantity_required}, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = ${productId} AND ingredient_id = ${ingredientId}
    `);

    if (res.rowCount === 0) {
      return errorResponse(c, 'Product ingredient not found', 'not_found', 404);
    }

    return successResponse(c, 'Product ingredient updated successfully');
  } catch (err) {
    return errorResponse(c, 'Failed to update product ingredient', (err as Error).message);
  }
}

// ── DeleteProductIngredient ──────────────────────────────────────────────────────

export async function deleteProductIngredient(c: Context) {
  const productId = c.req.param('id');
  const ingredientId = c.req.param('ingredient_id');

  try {
    const res = await db.execute(sql`
      DELETE FROM product_ingredients WHERE product_id = ${productId} AND ingredient_id = ${ingredientId}
    `);

    if (res.rowCount === 0) {
      return errorResponse(c, 'Product ingredient not found', 'not_found', 404);
    }

    return successResponse(c, 'Ingredient removed from product successfully');
  } catch (err) {
    return errorResponse(c, 'Failed to delete product ingredient', (err as Error).message);
  }
}
