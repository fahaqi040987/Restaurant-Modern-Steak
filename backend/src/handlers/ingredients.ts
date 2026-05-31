import type { Context } from 'hono';
import { sql } from 'drizzle-orm';
import { db, pool } from '../db/connection.js';

// ── GetIngredients ──────────────────────────────────────────────────────────

export async function getIngredients(c: Context) {
  try {
    const rows = await db.execute<{
      id: string;
      name: string;
      description: string;
      unit: string;
      current_stock: string;
      minimum_stock: string;
      maximum_stock: string;
      unit_cost: string;
      supplier: string;
      last_restocked: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
      status: string;
      total_value: string;
      code: string | null;
      category: string | null;
      storage_location: string | null;
      lead_time_days: string | null;
    }>(sql`
      SELECT
        id, name, COALESCE(description, '') as description, unit,
        current_stock, minimum_stock, maximum_stock, unit_cost,
        COALESCE(supplier, '') as supplier, COALESCE(last_restocked_at, created_at) as last_restocked,
        is_active, created_at, updated_at,
        CASE
          WHEN current_stock = 0 THEN 'out'
          WHEN current_stock < minimum_stock THEN 'low'
          ELSE 'ok'
        END as status,
        current_stock * unit_cost as total_value,
        code, category, storage_location, lead_time_days
      FROM ingredients
      WHERE is_active = true
      ORDER BY status DESC, name ASC
    `);

    const ingredients = rows.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      unit: row.unit,
      current_stock: Number(row.current_stock),
      minimum_stock: Number(row.minimum_stock),
      maximum_stock: Number(row.maximum_stock),
      unit_cost: Number(row.unit_cost),
      supplier: row.supplier,
      last_restocked: row.last_restocked,
      is_active: row.is_active,
      status: row.status,
      total_value: Number(row.total_value),
      created_at: row.created_at,
      updated_at: row.updated_at,
      code: row.code ?? '',
      category: row.category ?? undefined,
      storage_location: row.storage_location ?? undefined,
      lead_time_days: row.lead_time_days ? Number(row.lead_time_days) : undefined,
    }));

    // Return raw array (matches Go behavior)
    return c.json(ingredients, 200);
  } catch {
    return c.json({ error: 'Failed to fetch ingredients' }, 500);
  }
}

// ── GetIngredient ──────────────────────────────────────────────────────────

export async function getIngredient(c: Context) {
  const id = c.req.param('id');

  try {
    const rows = await db.execute<{
      id: string;
      name: string;
      description: string;
      unit: string;
      current_stock: string;
      minimum_stock: string;
      maximum_stock: string;
      unit_cost: string;
      supplier: string;
      last_restocked: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
      status: string;
      total_value: string;
      code: string | null;
      category: string | null;
      storage_location: string | null;
      lead_time_days: string | null;
    }>(sql`
      SELECT
        id, name, COALESCE(description, '') as description, unit,
        current_stock, minimum_stock, maximum_stock, unit_cost,
        COALESCE(supplier, '') as supplier, COALESCE(last_restocked_at, created_at) as last_restocked,
        is_active, created_at, updated_at,
        CASE
          WHEN current_stock = 0 THEN 'out'
          WHEN current_stock < minimum_stock THEN 'low'
          ELSE 'ok'
        END as status,
        current_stock * unit_cost as total_value,
        code, category, storage_location, lead_time_days
      FROM ingredients
      WHERE id = ${id}
    `);

    if (rows.rows.length === 0) {
      return c.json({ error: 'Ingredient not found' }, 404);
    }

    const row = rows.rows[0];
    return c.json({
      id: row.id,
      name: row.name,
      description: row.description,
      unit: row.unit,
      current_stock: Number(row.current_stock),
      minimum_stock: Number(row.minimum_stock),
      maximum_stock: Number(row.maximum_stock),
      unit_cost: Number(row.unit_cost),
      supplier: row.supplier,
      last_restocked: row.last_restocked,
      is_active: row.is_active,
      status: row.status,
      total_value: Number(row.total_value),
      created_at: row.created_at,
      updated_at: row.updated_at,
      code: row.code ?? '',
      category: row.category ?? undefined,
      storage_location: row.storage_location ?? undefined,
      lead_time_days: row.lead_time_days ? Number(row.lead_time_days) : undefined,
    }, 200);
  } catch {
    return c.json({ error: 'Ingredient not found' }, 404);
  }
}

// ── CreateIngredient ──────────────────────────────────────────────────────────

export async function createIngredient(c: Context) {
  let body: {
    name: string;
    description?: string;
    unit: string;
    current_stock?: number;
    minimum_stock?: number;
    maximum_stock?: number;
    unit_cost?: number;
    supplier?: string;
    code?: string;
    category?: string;
    storage_location?: string;
    lead_time_days?: number;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  if (!body.name) {
    return c.json({ error: 'name is required' }, 400);
  }
  if (!body.unit) {
    return c.json({ error: 'unit is required' }, 400);
  }

  // Validate category enum
  const validCategories = ['Daging', 'Seafood', 'Sayur', 'Buah', 'Bumbu', 'Bahan Kering', 'Minuman', 'Dairy', 'Minyak', 'Lainnya'];
  if (body.category && !validCategories.includes(body.category)) {
    return c.json({ error: `category must be one of: ${validCategories.join(', ')}` }, 400);
  }

  // Validate storage_location enum
  const validLocations = ['Chiller', 'Freezer', 'Dry Storage', 'Rack', 'Bar', 'Lainnya'];
  if (body.storage_location && !validLocations.includes(body.storage_location)) {
    return c.json({ error: `storage_location must be one of: ${validLocations.join(', ')}` }, 400);
  }

  try {
    const rows = await db.execute<{
      id: string;
      name: string;
      description: string | null;
      unit: string;
      current_stock: string;
      minimum_stock: string;
      maximum_stock: string;
      unit_cost: string;
      supplier: string | null;
      created_at: string;
      updated_at: string;
      code: string | null;
      category: string | null;
      storage_location: string | null;
      lead_time_days: string | null;
    }>(sql`
      INSERT INTO ingredients (name, description, unit, current_stock, minimum_stock, maximum_stock, unit_cost, supplier, code, category, storage_location, lead_time_days)
      VALUES (${body.name}, ${body.description || null}, ${body.unit}, ${body.current_stock ?? 0},
              ${body.minimum_stock ?? 0}, ${body.maximum_stock ?? 0}, ${body.unit_cost ?? 0}, ${body.supplier || null},
              ${body.code || null}, ${body.category || null}, ${body.storage_location || null}, ${body.lead_time_days ?? null})
      RETURNING id, name, description, unit, current_stock, minimum_stock, maximum_stock, unit_cost, supplier, created_at, updated_at, code, category, storage_location, lead_time_days
    `);

    const row = rows.rows[0];
    return c.json({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      unit: row.unit,
      current_stock: Number(row.current_stock),
      minimum_stock: Number(row.minimum_stock),
      maximum_stock: Number(row.maximum_stock),
      unit_cost: Number(row.unit_cost),
      supplier: row.supplier ?? '',
      created_at: row.created_at,
      updated_at: row.updated_at,
      code: row.code ?? '',
      category: row.category ?? undefined,
      storage_location: row.storage_location ?? undefined,
      lead_time_days: row.lead_time_days ? Number(row.lead_time_days) : undefined,
    }, 201);
  } catch {
    return c.json({ error: 'Failed to create ingredient' }, 500);
  }
}

// ── UpdateIngredient ──────────────────────────────────────────────────────────

export async function updateIngredient(c: Context) {
  const id = c.req.param('id');

  let body: {
    name?: string;
    description?: string;
    unit?: string;
    minimum_stock?: number;
    maximum_stock?: number;
    unit_cost?: number;
    supplier?: string;
    is_active?: boolean;
    code?: string;
    category?: string;
    storage_location?: string;
    lead_time_days?: number;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  // Validate category enum
  const validCategories = ['Daging', 'Seafood', 'Sayur', 'Buah', 'Bumbu', 'Bahan Kering', 'Minuman', 'Dairy', 'Minyak', 'Lainnya'];
  if (body.category && !validCategories.includes(body.category)) {
    return c.json({ error: `category must be one of: ${validCategories.join(', ')}` }, 400);
  }

  // Validate storage_location enum
  const validLocations = ['Chiller', 'Freezer', 'Dry Storage', 'Rack', 'Bar', 'Lainnya'];
  if (body.storage_location && !validLocations.includes(body.storage_location)) {
    return c.json({ error: `storage_location must be one of: ${validLocations.join(', ')}` }, 400);
  }

  try {
    const rows = await db.execute<{
      id: string;
      name: string;
      description: string | null;
      unit: string;
      current_stock: string;
      minimum_stock: string;
      maximum_stock: string;
      unit_cost: string;
      supplier: string | null;
      is_active: boolean;
      created_at: string;
      updated_at: string;
      code: string | null;
      category: string | null;
      storage_location: string | null;
      lead_time_days: string | null;
    }>(sql`
      UPDATE ingredients
      SET name = COALESCE(NULLIF(${body.name ?? ''}, ''), name),
          description = COALESCE(NULLIF(${body.description ?? ''}, ''), description),
          unit = COALESCE(NULLIF(${body.unit ?? ''}, ''), unit),
          minimum_stock = COALESCE(NULLIF(${body.minimum_stock ?? 0}, 0), minimum_stock),
          maximum_stock = COALESCE(NULLIF(${body.maximum_stock ?? 0}, 0), maximum_stock),
          unit_cost = COALESCE(NULLIF(${body.unit_cost ?? 0}, 0), unit_cost),
          supplier = COALESCE(NULLIF(${body.supplier ?? ''}, ''), supplier),
          code = COALESCE(NULLIF(${body.code ?? ''}, ''), code),
          category = COALESCE(NULLIF(${body.category ?? ''}, ''), category),
          storage_location = COALESCE(NULLIF(${body.storage_location ?? ''}, ''), storage_location),
          lead_time_days = COALESCE(NULLIF(${body.lead_time_days ?? 0}, 0), lead_time_days),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, description, unit, current_stock, minimum_stock, maximum_stock, unit_cost, supplier, is_active, created_at, updated_at, code, category, storage_location, lead_time_days
    `);

    if (rows.rows.length === 0) {
      return c.json({ error: 'Ingredient not found' }, 404);
    }

    const row = rows.rows[0];
    return c.json({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      unit: row.unit,
      current_stock: Number(row.current_stock),
      minimum_stock: Number(row.minimum_stock),
      maximum_stock: Number(row.maximum_stock),
      unit_cost: Number(row.unit_cost),
      supplier: row.supplier ?? '',
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      code: row.code ?? '',
      category: row.category ?? undefined,
      storage_location: row.storage_location ?? undefined,
      lead_time_days: row.lead_time_days ? Number(row.lead_time_days) : undefined,
    }, 200);
  } catch {
    return c.json({ error: 'Ingredient not found' }, 404);
  }
}

// ── DeleteIngredient ──────────────────────────────────────────────────────────

export async function deleteIngredient(c: Context) {
  const id = c.req.param('id');

  try {
    const res = await db.execute(sql`
      UPDATE ingredients SET is_active = false, updated_at = NOW() WHERE id = ${id}
    `);

    if (res.rowCount === 0) {
      return c.json({ error: 'Ingredient not found' }, 404);
    }

    return c.json({ message: 'Ingredient deleted successfully' }, 200);
  } catch {
    return c.json({ error: 'Failed to delete ingredient' }, 500);
  }
}

// ── RestockIngredient ──────────────────────────────────────────────────────────

export async function restockIngredient(c: Context) {
  // Accept ingredient_id from URL param (:id) or from request body
  const paramId = c.req.param('id');

  let body: {
    ingredient_id?: string;
    quantity: number;
    notes?: string;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  // URL param takes priority, fall back to body
  const ingredientId = paramId || body.ingredient_id;

  if (!ingredientId) {
    return c.json({ error: 'ingredient_id is required' }, 400);
  }
  if (!body.quantity || body.quantity <= 0) {
    return c.json({ error: 'quantity must be greater than 0' }, 400);
  }

  const userId = c.get('user_id');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get current stock
    const ingRes = await client.query(
      'SELECT current_stock, name FROM ingredients WHERE id = $1',
      [ingredientId],
    );

    if (ingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return c.json({ error: 'Ingredient not found' }, 404);
    }

    const currentStock = Number(ingRes.rows[0].current_stock);
    const newStock = currentStock + body.quantity;

    // Update stock
    await client.query(
      'UPDATE ingredients SET current_stock = $1, last_restocked_at = NOW(), updated_at = NOW() WHERE id = $2',
      [newStock, ingredientId],
    );

    // Create history record
    await client.query(
      `INSERT INTO ingredient_history (ingredient_id, operation, quantity, previous_stock, new_stock, reason, notes, adjusted_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [ingredientId, 'restock', body.quantity, currentStock, newStock, 'restock', body.notes || null, userId],
    );

    await client.query('COMMIT');

    return c.json({
      message: 'Ingredient restocked successfully',
      previous_stock: currentStock,
      new_stock: newStock,
    }, 200);
  } catch {
    await client.query('ROLLBACK');
    return c.json({ error: 'Failed to restock ingredient' }, 500);
  } finally {
    client.release();
  }
}

// ── AdjustStockIngredient ──────────────────────────────────────────────────────────

export async function adjustStockIngredient(c: Context) {
  // Accept ingredient_id from URL param (:id) or from request body
  const paramId = c.req.param('id');

  let body: {
    ingredient_id?: string;
    quantity: number;
    operation: 'add' | 'remove';
    reason: string;
    notes?: string;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  // URL param takes priority, fall back to body
  const ingredientId = paramId || body.ingredient_id;

  if (!ingredientId) {
    return c.json({ error: 'ingredient_id is required' }, 400);
  }
  if (!body.quantity || body.quantity <= 0) {
    return c.json({ error: 'quantity must be greater than 0' }, 400);
  }
  if (!body.operation || (body.operation !== 'add' && body.operation !== 'remove')) {
    return c.json({ error: 'operation must be either "add" or "remove"' }, 400);
  }
  if (!body.reason) {
    return c.json({ error: 'reason is required' }, 400);
  }

  const validReasons = ['purchase', 'spoilage', 'damage', 'expired', 'theft', 'stock_opname', 'manual_adjustment'];
  if (!validReasons.includes(body.reason)) {
    return c.json({ error: `reason must be one of: ${validReasons.join(', ')}` }, 400);
  }

  const userId = c.get('user_id');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get current stock
    const ingRes = await client.query(
      'SELECT current_stock, name FROM ingredients WHERE id = $1',
      [ingredientId],
    );

    if (ingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return c.json({ error: 'Ingredient not found' }, 404);
    }

    const currentStock = Number(ingRes.rows[0].current_stock);
    const quantityChange = body.operation === 'remove' ? -body.quantity : body.quantity;
    const newStock = currentStock + quantityChange;

    // Only check for insufficient stock on removal operations
    if (body.operation === 'remove' && newStock < 0) {
      await client.query('ROLLBACK');
      return c.json({ error: 'Insufficient stock for this adjustment' }, 400);
    }

    // Update stock
    await client.query(
      'UPDATE ingredients SET current_stock = $1, updated_at = NOW() WHERE id = $2',
      [newStock, ingredientId],
    );

    // Create history record - use the operation field directly
    await client.query(
      `INSERT INTO ingredient_history (ingredient_id, operation, quantity, previous_stock, new_stock, reason, notes, adjusted_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [ingredientId, body.operation, body.quantity, currentStock, newStock, body.reason, body.notes || null, userId],
    );

    await client.query('COMMIT');

    return c.json({
      message: 'Stock adjusted successfully',
      previous_stock: currentStock,
      new_stock: newStock,
      adjustment: quantityChange,
    }, 200);
  } catch {
    await client.query('ROLLBACK');
    return c.json({ error: 'Failed to adjust stock' }, 500);
  } finally {
    client.release();
  }
}

// ── GetLowStockIngredients ──────────────────────────────────────────────────────

export async function getLowStockIngredients(c: Context) {
  try {
    const rows = await db.execute<{
      id: string;
      name: string;
      description: string;
      unit: string;
      current_stock: string;
      minimum_stock: string;
      maximum_stock: string;
      unit_cost: string;
      supplier: string;
      last_restocked: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
      status: string;
      total_value: string;
      code: string | null;
      category: string | null;
      storage_location: string | null;
      lead_time_days: string | null;
    }>(sql`
      SELECT
        id, name, COALESCE(description, '') as description, unit,
        current_stock, minimum_stock, maximum_stock, unit_cost,
        COALESCE(supplier, '') as supplier, COALESCE(last_restocked_at, created_at) as last_restocked,
        is_active, created_at, updated_at,
        CASE
          WHEN current_stock = 0 THEN 'out'
          ELSE 'low'
        END as status,
        current_stock * unit_cost as total_value,
        code, category, storage_location, lead_time_days
      FROM ingredients
      WHERE is_active = true AND current_stock < minimum_stock
      ORDER BY current_stock ASC, name ASC
    `);

    const ingredients = rows.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      unit: row.unit,
      current_stock: Number(row.current_stock),
      minimum_stock: Number(row.minimum_stock),
      maximum_stock: Number(row.maximum_stock),
      unit_cost: Number(row.unit_cost),
      supplier: row.supplier,
      last_restocked: row.last_restocked,
      is_active: row.is_active,
      status: row.status,
      total_value: Number(row.total_value),
      created_at: row.created_at,
      updated_at: row.updated_at,
      code: row.code ?? '',
      category: row.category ?? undefined,
      storage_location: row.storage_location ?? undefined,
      lead_time_days: row.lead_time_days ? Number(row.lead_time_days) : undefined,
    }));

    // Return raw array (matches Go behavior)
    return c.json(ingredients, 200);
  } catch {
    return c.json({ error: 'Failed to fetch low stock ingredients' }, 500);
  }
}

// ── GetIngredientHistory ──────────────────────────────────────────────────────

export async function getIngredientHistory(c: Context) {
  const ingredientId = c.req.param('id');

  try {
    const rows = await db.execute<{
      id: string;
      operation: string;
      quantity: string;
      previous_stock: string;
      new_stock: string;
      reason: string;
      notes: string;
      adjusted_by: string;
      created_at: string;
    }>(sql`
      SELECT
        ih.id, ih.operation, ih.quantity, ih.previous_stock, ih.new_stock,
        COALESCE(ih.reason, '') as reason, COALESCE(ih.notes, '') as notes,
        COALESCE(u.username, 'System') as adjusted_by,
        ih.created_at
      FROM ingredient_history ih
      LEFT JOIN users u ON ih.adjusted_by = u.id
      WHERE ih.ingredient_id = ${ingredientId}
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
