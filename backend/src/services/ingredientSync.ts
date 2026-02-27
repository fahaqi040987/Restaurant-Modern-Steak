import { pool } from '../db/connection.js';
import { getProductIngredientStatus, getAllProductsIngredientStatus } from './ingredientValidation.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProductAvailabilityResult {
  available: boolean;
  status: 'available' | 'low_stock' | 'out_of_stock';
  missingIngredients: string[];
  limitingIngredients: Array<{ name: string; currentStock: number; minimumStock: number }>;
}

export interface AvailabilitySyncResult {
  productsUpdated: number;
  productsDisabled: number;
  productsEnabled: number;
  details: Array<{ productId: string; productName: string; wasAvailable: boolean; nowAvailable: boolean }>;
}

// ── CheckProductAvailability ───────────────────────────────────────────────────
// Checks if a specific product can be made with current ingredient stock.

export async function checkProductAvailability(productId: string): Promise<ProductAvailabilityResult> {
  return await getProductIngredientStatus(productId);
}

// ── UpdateProductAvailability ──────────────────────────────────────────────────
// Updates the is_available flag for a specific product based on ingredient stock.

export async function updateProductAvailability(productId: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    // Check current status
    const status = await getProductIngredientStatus(productId);

    // Update the product
    await client.query(
      `UPDATE products SET is_available = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [status.available, productId],
    );

    return status.available;
  } catch (err) {
    console.error(`Failed to update product availability for ${productId}:`, (err as Error).message);
    return true; // Assume available on error
  } finally {
    client.release();
  }
}

// ── UpdateAllProductAvailability ───────────────────────────────────────────────
// Syncs all products with their ingredient availability using database function.

export async function updateAllProductAvailability(): Promise<AvailabilitySyncResult> {
  const client = await pool.connect();
  try {
    // Call the database function
    const res = await client.query(
      `SELECT * FROM update_all_product_availability()`,
    );

    const details = res.rows.map((row) => ({
      productId: row.product_id,
      productName: row.product_name,
      wasAvailable: row.was_available,
      nowAvailable: row.now_available,
    }));

    const productsDisabled = details.filter((d) => d.wasAvailable && !d.nowAvailable).length;
    const productsEnabled = details.filter((d) => !d.wasAvailable && d.nowAvailable).length;

    return {
      productsUpdated: details.length,
      productsDisabled,
      productsEnabled,
      details,
    };
  } catch (err) {
    console.error('Failed to update all product availability:', (err as Error).message);
    return {
      productsUpdated: 0,
      productsDisabled: 0,
      productsEnabled: 0,
      details: [],
    };
  } finally {
    client.release();
  }
}

// ── GetProductsNeedingUpdate ───────────────────────────────────────────────────
// Returns products that need availability updates (ingredients changed recently).

export async function getProductsNeedingUpdate(
  sinceMinutes: number = 5,
): Promise<Array<{ productId: string; productName: string; lastIngredientChange: string }>> {
  const client = await pool.connect();
  try {
    const since = new Date(Date.now() - sinceMinutes * 60 * 1000);

    const res = await client.query(
      `SELECT DISTINCT p.id as product_id, p.name as product_name, MAX(ih.created_at) as last_ingredient_change
       FROM products p
       JOIN product_ingredients pi ON p.id = pi.product_id
       JOIN ingredient_history ih ON ih.ingredient_id = pi.ingredient_id
       WHERE ih.created_at > $1
       GROUP BY p.id, p.name
       ORDER BY last_ingredient_change DESC`,
      [since],
    );

    return res.rows.map((row) => ({
      productId: row.product_id,
      productName: row.product_name,
      lastIngredientChange: row.last_ingredient_change,
    }));
  } catch (err) {
    console.error('Failed to get products needing update:', (err as Error).message);
    return [];
  } finally {
    client.release();
  }
}

// ── BatchUpdateProductAvailability ─────────────────────────────────────────────
// Updates availability for products that had recent ingredient changes.

export async function batchUpdateProductAvailability(
  sinceMinutes: number = 5,
): Promise<AvailabilitySyncResult> {
  const productsNeedingUpdate = await getProductsNeedingUpdate(sinceMinutes);

  let productsDisabled = 0;
  let productsEnabled = 0;
  const details: Array<{ productId: string; productName: string; wasAvailable: boolean; nowAvailable: boolean }> = [];

  for (const product of productsNeedingUpdate) {
    const client = await pool.connect();
    try {
      // Get current availability
      const currentRes = await client.query(
        'SELECT is_available FROM products WHERE id = $1',
        [product.productId],
      );
      const wasAvailable = currentRes.rows[0]?.is_available ?? true;

      // Check new availability
      const status = await getProductIngredientStatus(product.productId);

      // Update if changed
      if (wasAvailable !== status.available) {
        await client.query(
          `UPDATE products SET is_available = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [status.available, product.productId],
        );

        details.push({
          productId: product.productId,
          productName: product.productName,
          wasAvailable,
          nowAvailable: status.available,
        });

        if (!status.available) {
          productsDisabled++;
        } else {
          productsEnabled++;
        }
      }
    } catch (err) {
      console.error(`Failed to update product ${product.productId}:`, (err as Error).message);
    } finally {
      client.release();
    }
  }

  return {
    productsUpdated: details.length,
    productsDisabled,
    productsEnabled,
    details,
  };
}
