import { pool } from '../db/connection.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OrderItemForValidation {
  product_id: string;
  quantity: number;
}

export interface MissingIngredient {
  name: string;
  unit: string;
  has: number;
  needs: number;
  shortage: number;
}

export interface StockValidationResult {
  valid: boolean;
  missingIngredients: MissingIngredient[];
  canMakePartial?: boolean;
  maxPortions?: number;
}

// ── ValidateIngredientStock ───────────────────────────────────────────────────
// Validates if sufficient ingredients exist to fulfill the order items.
// Returns details about which ingredients are insufficient.

export async function validateIngredientStock(
  items: OrderItemForValidation[],
): Promise<StockValidationResult> {
  const client = await pool.connect();
  try {
    const missingIngredients: MissingIngredient[] = [];

    // Process each order item
    for (const item of items) {
      // Get recipe for this product
      const recipeRes = await client.query(
        `SELECT i.id, i.name, i.unit, i.current_stock, pi.quantity_required
         FROM product_ingredients pi
         JOIN ingredients i ON i.ingredient_id = i.id
         WHERE pi.product_id = $1`,
        [item.product_id],
      );

      // Check each required ingredient
      for (const row of recipeRes.rows) {
        const requiredTotal = Number(row.quantity_required) * item.quantity;
        const currentStock = Number(row.current_stock);

        if (currentStock < requiredTotal) {
          missingIngredients.push({
            name: row.name,
            unit: row.unit,
            has: currentStock,
            needs: requiredTotal,
            shortage: requiredTotal - currentStock,
          });
        }
      }
    }

    // Calculate if partial order is possible (lowest ratio of available/needed)
    let canMakePartial = false;
    let maxPortions = 0;

    if (missingIngredients.length > 0) {
      // Group by product to calculate max portions per product
      const productLimits = new Map<string, number>();

      for (const item of items) {
        const recipeRes = await client.query(
          `SELECT i.current_stock, pi.quantity_required
           FROM product_ingredients pi
           JOIN ingredients i ON i.ingredient_id = i.id
           WHERE pi.product_id = $1 AND i.current_stock > 0`,
          [item.product_id],
        );

        let minPortions = Infinity;

        for (const row of recipeRes.rows) {
          const requiredPerUnit = Number(row.quantity_required);
          const available = Number(row.current_stock);
          const portions = Math.floor(available / requiredPerUnit);

          if (portions < minPortions) {
            minPortions = portions;
          }
        }

        if (minPortions !== Infinity && minPortions > 0) {
          canMakePartial = true;
          productLimits.set(item.product_id, minPortions);
        }
      }

      // Overall max portions is the minimum across all products
      if (productLimits.size > 0) {
        maxPortions = Math.min(...productLimits.values());
      }
    }

    return {
      valid: missingIngredients.length === 0,
      missingIngredients,
      canMakePartial,
      maxPortions: canMakePartial ? maxPortions : undefined,
    };
  } catch (err) {
    console.error('Failed to validate ingredient stock:', (err as Error).message);
    // On error, allow order to proceed (graceful degradation)
    return {
      valid: true,
      missingIngredients: [],
    };
  } finally {
    client.release();
  }
}

// ── LogIngredientOverride ─────────────────────────────────────────────────────
// Logs when an order is placed despite insufficient ingredient warnings.

export async function logIngredientOverride(
  orderId: string,
  missingIngredients: MissingIngredient[],
  userId?: string,
): Promise<void> {
  const client = await pool.connect();
  try {
    for (const ingredient of missingIngredients) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES ($1, 'ingredient_override', $2, $3)`,
        [
          userId || null,
          `Ingredient Override - Order ${orderId}`,
          `Order was placed despite insufficient ${ingredient.name}: need ${ingredient.needs}${ingredient.unit}, have ${ingredient.has}${ingredient.unit}`,
        ],
      );
    }
  } catch (err) {
    console.error('Failed to log ingredient override:', (err as Error).message);
  } finally {
    client.release();
  }
}

// ── GetProductIngredientStatus ─────────────────────────────────────────────────
// Checks if a specific product can be made with current stock.

export async function getProductIngredientStatus(
  productId: string,
): Promise<{
  available: boolean;
  status: 'available' | 'low_stock' | 'out_of_stock';
  missingIngredients: string[];
  limitingIngredients: Array<{ name: string; currentStock: number; minimumStock: number }>;
}> {
  const client = await pool.connect();
  try {
    // Get all ingredients for this product
    const recipeRes = await client.query(
      `SELECT i.id, i.name, i.current_stock, i.minimum_stock, i.unit, pi.quantity_required
       FROM product_ingredients pi
       JOIN ingredients i ON i.ingredient_id = i.id
       WHERE pi.product_id = $1 AND i.is_active = true`,
      [productId],
    );

    if (recipeRes.rows.length === 0) {
      // No ingredients configured - product is available
      return {
        available: true,
        status: 'available',
        missingIngredients: [],
        limitingIngredients: [],
      };
    }

    const missingIngredients: string[] = [];
    const limitingIngredients: Array<{ name: string; currentStock: number; minimumStock: number }> = [];
    let isOutOfStock = false;
    let isLowStock = false;

    for (const row of recipeRes.rows) {
      const currentStock = Number(row.current_stock);
      const minimumStock = Number(row.minimum_stock);

      if (currentStock <= 0) {
        isOutOfStock = true;
        missingIngredients.push(row.name);
      }

      if (currentStock <= minimumStock) {
        isLowStock = true;
        limitingIngredients.push({
          name: row.name,
          currentStock,
          minimumStock,
        });
      }
    }

    let status: 'available' | 'low_stock' | 'out_of_stock' = 'available';
    let available = true;

    if (isOutOfStock) {
      status = 'out_of_stock';
      available = false;
    } else if (isLowStock) {
      status = 'low_stock';
    }

    return {
      available,
      status,
      missingIngredients,
      limitingIngredients,
    };
  } catch (err) {
    console.error('Failed to get product ingredient status:', (err as Error).message);
    return {
      available: true,
      status: 'available',
      missingIngredients: [],
      limitingIngredients: [],
    };
  } finally {
    client.release();
  }
}

// ── GetAllProductsIngredientStatus ────────────────────────────────────────────
// Batch check ingredient status for all products that have recipes.

export async function getAllProductsIngredientStatus(): Promise<
  Map<string, { available: boolean; status: 'available' | 'low_stock' | 'out_of_stock' }>
> {
  const client = await pool.connect();
  try {
    // Get all products that have recipes
    const productsRes = await client.query(
      `SELECT DISTINCT pi.product_id
       FROM product_ingredients pi
       JOIN products p ON pi.product_id = p.id
       WHERE p.is_available = true`,
    );

    const statusMap = new Map<
      string,
      { available: boolean; status: 'available' | 'low_stock' | 'out_of_stock' }
    >();

    for (const row of productsRes.rows) {
      const status = await getProductIngredientStatus(row.product_id);
      statusMap.set(row.product_id, {
        available: status.available,
        status: status.status,
      });
    }

    return statusMap;
  } catch (err) {
    console.error('Failed to get all products ingredient status:', (err as Error).message);
    return new Map();
  } finally {
    client.release();
  }
}
