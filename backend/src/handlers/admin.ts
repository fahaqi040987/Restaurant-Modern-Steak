import type { Context } from 'hono';
import bcrypt from 'bcryptjs';
import { pool } from '../db/connection.js';
import { successResponse, errorResponse, paginatedResponse } from '../lib/response.js';
import { parsePagination, buildMeta } from '../lib/pagination.js';

// ── Admin Categories ─────────────────────────────────────────────────────────

export async function getAdminCategories(c: Context) {
  const { page, perPage, offset } = parsePagination({
    page: c.req.query('page'),
    per_page: c.req.query('per_page'),
  });
  const activeOnly = c.req.query('active_only') === 'true';
  const search = c.req.query('search');

  try {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (activeOnly) {
      conditions.push(`is_active = true`);
    }
    if (search) {
      conditions.push(`(name ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM categories ${whereClause}`,
      params,
    );
    const total = Number(countRes.rows[0].count);

    // Fetch
    const dataRes = await pool.query(
      `SELECT id, name, description, color, sort_order, is_active, created_at, updated_at
       FROM categories ${whereClause}
       ORDER BY sort_order ASC, name ASC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, perPage, offset],
    );

    return paginatedResponse(c, 'Categories retrieved successfully', dataRes.rows, buildMeta(page, perPage, total));
  } catch (err) {
    return errorResponse(c, 'Failed to fetch categories', (err as Error).message);
  }
}

export async function createCategory(c: Context) {
  let body: { name?: string; description?: string; color?: string; sort_order?: number };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  if (!body.name) {
    return errorResponse(c, 'Category name is required', 'missing_name', 400);
  }

  try {
    const res = await pool.query(
      `INSERT INTO categories (name, description, color, sort_order)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [body.name, body.description || null, body.color || null, body.sort_order ?? 0],
    );

    return successResponse(c, 'Category created successfully', { id: res.rows[0].id }, 201);
  } catch (err) {
    return errorResponse(c, 'Failed to create category', (err as Error).message);
  }
}

export async function updateCategory(c: Context) {
  const categoryId = c.req.param('id');

  let body: { name?: string; description?: string; color?: string; sort_order?: number; is_active?: boolean };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  try {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (body.name !== undefined) {
      setClauses.push(`name = $${paramIdx}`);
      params.push(body.name);
      paramIdx++;
    }
    if (body.description !== undefined) {
      setClauses.push(`description = $${paramIdx}`);
      params.push(body.description);
      paramIdx++;
    }
    if (body.color !== undefined) {
      setClauses.push(`color = $${paramIdx}`);
      params.push(body.color);
      paramIdx++;
    }
    if (body.sort_order !== undefined) {
      setClauses.push(`sort_order = $${paramIdx}`);
      params.push(body.sort_order);
      paramIdx++;
    }
    if (body.is_active !== undefined) {
      setClauses.push(`is_active = $${paramIdx}`);
      params.push(body.is_active);
      paramIdx++;
    }

    if (setClauses.length === 0) {
      return errorResponse(c, 'No fields to update', 'no_fields', 400);
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    params.push(categoryId);

    const res = await pool.query(
      `UPDATE categories SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`,
      params,
    );

    if (res.rowCount === 0) {
      return errorResponse(c, 'Category not found', 'not_found', 404);
    }

    return successResponse(c, 'Category updated successfully');
  } catch (err) {
    return errorResponse(c, 'Failed to update category', (err as Error).message);
  }
}

export async function deleteCategory(c: Context) {
  const categoryId = c.req.param('id');

  try {
    // Check if category has products
    const productCount = await pool.query(
      `SELECT COUNT(*) FROM products WHERE category_id = $1`,
      [categoryId],
    );

    if (Number(productCount.rows[0].count) > 0) {
      return errorResponse(c, 'Cannot delete category with associated products', 'category_has_products', 400);
    }

    const res = await pool.query(
      `DELETE FROM categories WHERE id = $1`,
      [categoryId],
    );

    if (res.rowCount === 0) {
      return errorResponse(c, 'Category not found', 'not_found', 404);
    }

    return successResponse(c, 'Category deleted successfully');
  } catch (err) {
    return errorResponse(c, 'Failed to delete category', (err as Error).message);
  }
}

// ── Admin Tables ─────────────────────────────────────────────────────────────

export async function getAdminTables(c: Context) {
  const { page, perPage, offset } = parsePagination({
    page: c.req.query('page'),
    per_page: c.req.query('per_page'),
  });
  const location = c.req.query('location');
  const status = c.req.query('status');
  const search = c.req.query('search');

  try {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (location) {
      conditions.push(`t.location ILIKE $${paramIdx}`);
      params.push(`%${location}%`);
      paramIdx++;
    }
    if (status === 'occupied') {
      conditions.push(`t.is_occupied = true`);
    } else if (status === 'available') {
      conditions.push(`t.is_occupied = false`);
    }
    if (search) {
      conditions.push(`(t.table_number ILIKE $${paramIdx} OR t.location ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM dining_tables t ${whereClause}`,
      params,
    );
    const total = Number(countRes.rows[0].count);

    // Fetch with LEFT JOIN to active orders
    const dataRes = await pool.query(
      `SELECT t.id, t.table_number, t.seating_capacity, t.location, t.is_occupied,
              t.qr_code, t.created_at, t.updated_at,
              o.id as order_id, o.order_number, o.customer_name, o.status as order_status,
              o.created_at as order_created_at, o.total_amount
       FROM dining_tables t
       LEFT JOIN orders o ON t.id = o.table_id AND o.status NOT IN ('completed', 'cancelled')
       ${whereClause}
       ORDER BY t.table_number ASC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, perPage, offset],
    );

    const data = dataRes.rows.map((row: Record<string, unknown>) => {
      const table: Record<string, unknown> = {
        id: row.id,
        table_number: row.table_number,
        seating_capacity: row.seating_capacity,
        location: row.location,
        is_occupied: row.is_occupied,
        qr_code: row.qr_code,
        created_at: row.created_at,
        updated_at: row.updated_at,
        current_order: null,
      };

      if (row.order_id) {
        table.current_order = {
          id: row.order_id,
          order_number: row.order_number,
          customer_name: row.customer_name,
          status: row.order_status,
          created_at: row.order_created_at,
          total_amount: Number(row.total_amount),
        };
      }

      return table;
    });

    return paginatedResponse(c, 'Tables retrieved successfully', data, buildMeta(page, perPage, total));
  } catch (err) {
    return errorResponse(c, 'Failed to fetch tables', (err as Error).message);
  }
}

export async function createTable(c: Context) {
  let body: { table_number?: string; seating_capacity?: number; location?: string };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  if (!body.table_number) {
    return errorResponse(c, 'Table number is required', 'missing_table_number', 400);
  }

  try {
    const res = await pool.query(
      `INSERT INTO dining_tables (table_number, seating_capacity, location)
       VALUES ($1, $2, $3) RETURNING id`,
      [body.table_number, body.seating_capacity ?? 4, body.location || null],
    );

    return successResponse(c, 'Table created successfully', { id: res.rows[0].id }, 201);
  } catch (err) {
    return errorResponse(c, 'Failed to create table', (err as Error).message);
  }
}

export async function updateTable(c: Context) {
  const tableId = c.req.param('id');

  let body: { table_number?: string; seating_capacity?: number; location?: string; is_occupied?: boolean };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  try {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (body.table_number !== undefined) {
      setClauses.push(`table_number = $${paramIdx}`);
      params.push(body.table_number);
      paramIdx++;
    }
    if (body.seating_capacity !== undefined) {
      setClauses.push(`seating_capacity = $${paramIdx}`);
      params.push(body.seating_capacity);
      paramIdx++;
    }
    if (body.location !== undefined) {
      setClauses.push(`location = $${paramIdx}`);
      params.push(body.location);
      paramIdx++;
    }
    if (body.is_occupied !== undefined) {
      setClauses.push(`is_occupied = $${paramIdx}`);
      params.push(body.is_occupied);
      paramIdx++;
    }

    if (setClauses.length === 0) {
      return errorResponse(c, 'No fields to update', 'no_fields', 400);
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    params.push(tableId);

    const res = await pool.query(
      `UPDATE dining_tables SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`,
      params,
    );

    if (res.rowCount === 0) {
      return errorResponse(c, 'Table not found', 'not_found', 404);
    }

    return successResponse(c, 'Table updated successfully');
  } catch (err) {
    return errorResponse(c, 'Failed to update table', (err as Error).message);
  }
}

export async function deleteTable(c: Context) {
  const tableId = c.req.param('id');

  try {
    // Check for active orders
    const activeOrders = await pool.query(
      `SELECT COUNT(*) FROM orders WHERE table_id = $1 AND status NOT IN ('completed', 'cancelled')`,
      [tableId],
    );

    if (Number(activeOrders.rows[0].count) > 0) {
      return errorResponse(c, 'Cannot delete table with active orders', 'table_has_active_orders', 400);
    }

    const res = await pool.query(
      `DELETE FROM dining_tables WHERE id = $1`,
      [tableId],
    );

    if (res.rowCount === 0) {
      return errorResponse(c, 'Table not found', 'not_found', 404);
    }

    return successResponse(c, 'Table deleted successfully');
  } catch (err) {
    return errorResponse(c, 'Failed to delete table', (err as Error).message);
  }
}

// ── Admin Users ──────────────────────────────────────────────────────────────

export async function getAdminUsers(c: Context) {
  const { page, perPage, offset } = parsePagination({
    page: c.req.query('page'),
    per_page: c.req.query('per_page'),
  });
  const role = c.req.query('role');
  const active = c.req.query('active');
  const search = c.req.query('search');

  try {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (role) {
      conditions.push(`role = $${paramIdx}`);
      params.push(role);
      paramIdx++;
    }
    if (active === 'true') {
      conditions.push(`is_active = true`);
    } else if (active === 'false') {
      conditions.push(`is_active = false`);
    }
    if (search) {
      conditions.push(`(first_name ILIKE $${paramIdx} OR last_name ILIKE $${paramIdx} OR username ILIKE $${paramIdx} OR email ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params,
    );
    const total = Number(countRes.rows[0].count);

    // Fetch (exclude password_hash)
    const dataRes = await pool.query(
      `SELECT id, username, email, first_name, last_name, role, is_active, created_at
       FROM users ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, perPage, offset],
    );

    return paginatedResponse(c, 'Users retrieved successfully', dataRes.rows, buildMeta(page, perPage, total));
  } catch (err) {
    return errorResponse(c, 'Failed to fetch users', (err as Error).message);
  }
}

export async function createUser(c: Context) {
  let body: {
    username?: string;
    email?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
  };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  if (!body.username || !body.email || !body.password || !body.first_name || !body.last_name || !body.role) {
    return errorResponse(c, 'All fields are required (username, email, password, first_name, last_name, role)', 'missing_fields', 400);
  }

  try {
    const passwordHash = await bcrypt.hash(body.password, 12);

    const res = await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [body.username, body.email, passwordHash, body.first_name, body.last_name, body.role],
    );

    return successResponse(c, 'User created successfully', { id: res.rows[0].id }, 201);
  } catch (err) {
    return errorResponse(c, 'Failed to create user', (err as Error).message);
  }
}

export async function updateUser(c: Context) {
  const userId = c.req.param('id');

  let body: {
    username?: string;
    email?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    is_active?: boolean;
  };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  try {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (body.username !== undefined) {
      setClauses.push(`username = $${paramIdx}`);
      params.push(body.username);
      paramIdx++;
    }
    if (body.email !== undefined) {
      setClauses.push(`email = $${paramIdx}`);
      params.push(body.email);
      paramIdx++;
    }
    if (body.password !== undefined) {
      const passwordHash = await bcrypt.hash(body.password, 12);
      setClauses.push(`password_hash = $${paramIdx}`);
      params.push(passwordHash);
      paramIdx++;
    }
    if (body.first_name !== undefined) {
      setClauses.push(`first_name = $${paramIdx}`);
      params.push(body.first_name);
      paramIdx++;
    }
    if (body.last_name !== undefined) {
      setClauses.push(`last_name = $${paramIdx}`);
      params.push(body.last_name);
      paramIdx++;
    }
    if (body.role !== undefined) {
      setClauses.push(`role = $${paramIdx}`);
      params.push(body.role);
      paramIdx++;
    }
    if (body.is_active !== undefined) {
      setClauses.push(`is_active = $${paramIdx}`);
      params.push(body.is_active);
      paramIdx++;
    }

    if (setClauses.length === 0) {
      return errorResponse(c, 'No fields to update', 'no_fields', 400);
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);

    const res = await pool.query(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`,
      params,
    );

    if (res.rowCount === 0) {
      return errorResponse(c, 'User not found', 'not_found', 404);
    }

    return successResponse(c, 'User updated successfully');
  } catch (err) {
    return errorResponse(c, 'Failed to update user', (err as Error).message);
  }
}

export async function deleteUser(c: Context) {
  const userId = c.req.param('id');

  try {
    // Check if user has orders
    const orderCount = await pool.query(
      `SELECT COUNT(*) FROM orders WHERE user_id = $1`,
      [userId],
    );

    if (Number(orderCount.rows[0].count) > 0) {
      return errorResponse(c, 'Cannot delete user with associated orders', 'user_has_orders', 400);
    }

    const res = await pool.query(
      `DELETE FROM users WHERE id = $1`,
      [userId],
    );

    if (res.rowCount === 0) {
      return errorResponse(c, 'User not found', 'not_found', 404);
    }

    return successResponse(c, 'User deleted successfully');
  } catch (err) {
    return errorResponse(c, 'Failed to delete user', (err as Error).message);
  }
}
