import type { Context } from 'hono';
import { successResponse, errorResponse } from '../lib/response.js';
import {
  validateIngredientStock as validateStock,
  logIngredientOverride,
} from '../services/ingredientValidation.js';
import {
  checkProductAvailability,
  updateAllProductAvailability,
} from '../services/ingredientSync.js';

// ── ValidateIngredientStock ───────────────────────────────────────────────────
// Validates if sufficient ingredients exist for the order items.
// POST /api/v1/orders/validate-ingredients

export async function validateIngredientStock(c: Context) {
  try {
    const body = await c.req.json();
    const { items } = body as { items: { product_id: string; quantity: number }[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(c, 'Invalid request: items array required', 'invalid_items', 400);
    }

    const result = await validateStock(items);

    return successResponse(c, 'Stock validation completed', result);
  } catch (err) {
    return errorResponse(c, 'Failed to validate ingredient stock', (err as Error).message);
  }
}

// ── GetProductIngredientStatus ─────────────────────────────────────────────────
// Checks if a specific product can be made with current ingredient stock.
// GET /api/v1/products/:id/ingredient-status

export async function getProductIngredientStatus(c: Context) {
  const productId = c.req.param('id');

  try {
    const status = await checkProductAvailability(productId);

    return successResponse(c, 'Product ingredient status retrieved', status);
  } catch (err) {
    return errorResponse(c, 'Failed to get product ingredient status', (err as Error).message);
  }
}

// ── SyncProductAvailability ─────────────────────────────────────────────────────
// Manually syncs all products with their ingredient availability.
// POST /api/v1/admin/ingredients/sync-availability

export async function syncProductAvailability(c: Context) {
  try {
    const result = await updateAllProductAvailability();

    return successResponse(
      c,
      `Synced ${result.productsUpdated} products (${result.productsDisabled} disabled, ${result.productsEnabled} enabled)`,
      result,
    );
  } catch (err) {
    return errorResponse(c, 'Failed to sync product availability', (err as Error).message);
  }
}
