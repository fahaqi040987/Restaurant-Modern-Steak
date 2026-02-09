import type { Context } from 'hono';
import { eq, and, sql, ilike, or } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { products, categories, orderItems } from '../db/schema.js';
import { successResponse, errorResponse, paginatedResponse } from '../lib/response.js';
import { parsePagination, buildMeta } from '../lib/pagination.js';
import { numericFields } from '../lib/validation.js';

// Decimal fields that must be converted to numbers for JSON responses
const PRODUCT_DECIMAL_FIELDS = ['price'] as const;

function formatProduct(row: {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  barcode: string | null;
  sku: string | null;
  isAvailable: boolean | null;
  preparationTime: number | null;
  sortOrder: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  categoryName?: string | null;
  categoryColor?: string | null;
}) {
  const product: Record<string, unknown> = {
    id: row.id,
    category_id: row.categoryId,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    image_url: row.imageUrl,
    barcode: row.barcode,
    sku: row.sku,
    is_available: row.isAvailable,
    preparation_time: row.preparationTime ?? 0,
    sort_order: row.sortOrder ?? 0,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };

  if (row.categoryName) {
    product.category = {
      id: row.categoryId,
      name: row.categoryName,
      color: row.categoryColor,
    };
  }

  return product;
}

function formatCategory(row: {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number | null;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    sort_order: row.sortOrder ?? 0,
    is_active: row.isActive,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export async function getProducts(c: Context) {
  const categoryID = c.req.query('category_id');
  const available = c.req.query('available');
  const search = c.req.query('search');
  const { page, perPage, offset } = parsePagination({
    page: c.req.query('page'),
    per_page: c.req.query('per_page'),
  });

  try {
    // Build conditions
    const conditions = [];

    if (categoryID) {
      conditions.push(eq(products.categoryId, categoryID));
    }
    if (available === 'true') {
      conditions.push(eq(products.isAvailable, true));
    } else if (available === 'false') {
      conditions.push(eq(products.isAvailable, false));
    }
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(products.name, pattern),
          ilike(products.description, pattern),
        )!,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);

    const total = Number(countResult.count);

    // Fetch products with category join
    const rows = await db
      .select({
        id: products.id,
        categoryId: products.categoryId,
        name: products.name,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        barcode: products.barcode,
        sku: products.sku,
        isAvailable: products.isAvailable,
        preparationTime: products.preparationTime,
        sortOrder: products.sortOrder,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .orderBy(products.sortOrder, products.name)
      .limit(perPage)
      .offset(offset);

    const data = rows.map(formatProduct);

    return paginatedResponse(c, 'Products retrieved successfully', data, buildMeta(page, perPage, total));
  } catch (err) {
    return errorResponse(c, 'Failed to fetch products', (err as Error).message);
  }
}

export async function getProduct(c: Context) {
  const productId = c.req.param('id');

  try {
    const [row] = await db
      .select({
        id: products.id,
        categoryId: products.categoryId,
        name: products.name,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        barcode: products.barcode,
        sku: products.sku,
        isAvailable: products.isAvailable,
        preparationTime: products.preparationTime,
        sortOrder: products.sortOrder,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, productId))
      .limit(1);

    if (!row) {
      return errorResponse(c, 'Product not found', 'product_not_found', 404);
    }

    return successResponse(c, 'Product retrieved successfully', formatProduct(row));
  } catch (err) {
    return errorResponse(c, 'Failed to fetch product', (err as Error).message);
  }
}

export async function getCategories(c: Context) {
  const activeOnly = c.req.query('active_only') === 'true';

  try {
    const whereClause = activeOnly ? eq(categories.isActive, true) : undefined;

    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        color: categories.color,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      })
      .from(categories)
      .where(whereClause)
      .orderBy(categories.sortOrder, categories.name);

    return successResponse(c, 'Categories retrieved successfully', rows.map(formatCategory));
  } catch (err) {
    return errorResponse(c, 'Failed to fetch categories', (err as Error).message);
  }
}

export async function getProductsByCategory(c: Context) {
  const categoryId = c.req.param('id');
  const availableOnly = c.req.query('available_only') === 'true';

  try {
    const conditions = [eq(products.categoryId, categoryId)];
    if (availableOnly) {
      conditions.push(eq(products.isAvailable, true));
    }

    const rows = await db
      .select({
        id: products.id,
        categoryId: products.categoryId,
        name: products.name,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        barcode: products.barcode,
        sku: products.sku,
        isAvailable: products.isAvailable,
        preparationTime: products.preparationTime,
        sortOrder: products.sortOrder,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(products.sortOrder, products.name);

    return successResponse(c, 'Products retrieved successfully', rows.map(formatProduct));
  } catch (err) {
    return errorResponse(c, 'Failed to fetch products', (err as Error).message);
  }
}

export async function createProduct(c: Context) {
  let body: {
    category_id?: string;
    name?: string;
    description?: string;
    price?: number;
    image_url?: string;
    barcode?: string;
    sku?: string;
    is_available?: boolean;
    preparation_time?: number;
    sort_order?: number;
  };

  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  if (!body.name) {
    return errorResponse(c, 'Product name is required', 'missing_name', 400);
  }
  if (!body.category_id) {
    return errorResponse(c, 'Category ID is required', 'missing_category_id', 400);
  }
  if (!body.price || body.price <= 0) {
    return errorResponse(c, 'Price must be greater than 0', 'invalid_price', 400);
  }

  try {
    // Verify category exists
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, body.category_id))
      .limit(1);

    if (!cat) {
      return errorResponse(c, 'Category not found', 'category_not_found', 400);
    }

    // Insert product
    const [created] = await db
      .insert(products)
      .values({
        categoryId: body.category_id,
        name: body.name,
        description: body.description ?? null,
        price: String(body.price),
        imageUrl: body.image_url ?? null,
        barcode: body.barcode ?? null,
        sku: body.sku ?? null,
        isAvailable: body.is_available ?? true,
        preparationTime: body.preparation_time ?? 15,
        sortOrder: body.sort_order ?? 0,
      })
      .returning();

    const product = {
      id: created.id,
      category_id: created.categoryId,
      name: created.name,
      description: created.description,
      price: Number(created.price),
      image_url: created.imageUrl,
      barcode: created.barcode,
      sku: created.sku,
      is_available: created.isAvailable,
      preparation_time: created.preparationTime,
      sort_order: created.sortOrder,
      created_at: created.createdAt,
      updated_at: created.updatedAt,
    };

    return successResponse(c, 'Product created successfully', product, 201);
  } catch (err) {
    return errorResponse(c, 'Failed to create product', (err as Error).message);
  }
}

export async function updateProduct(c: Context) {
  const productId = c.req.param('id');

  let body: {
    category_id?: string;
    name?: string;
    description?: string;
    price?: number;
    image_url?: string;
    barcode?: string;
    sku?: string;
    is_available?: boolean;
    preparation_time?: number;
    sort_order?: number;
  };

  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  try {
    // Verify product exists
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!existing) {
      return errorResponse(c, 'Product not found', 'product_not_found', 404);
    }

    // Verify category exists if provided
    if (body.category_id) {
      const [cat] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, body.category_id))
        .limit(1);

      if (!cat) {
        return errorResponse(c, 'Category not found', 'category_not_found', 400);
      }
    }

    // Validate price if provided
    if (body.price !== undefined && body.price <= 0) {
      return errorResponse(c, 'Price must be greater than 0', 'invalid_price', 400);
    }

    // Build update set
    const updateSet: Record<string, unknown> = { updatedAt: sql`NOW()` };
    if (body.category_id !== undefined) updateSet.categoryId = body.category_id;
    if (body.name !== undefined) updateSet.name = body.name;
    if (body.description !== undefined) updateSet.description = body.description;
    if (body.price !== undefined) updateSet.price = String(body.price);
    if (body.image_url !== undefined) updateSet.imageUrl = body.image_url;
    if (body.barcode !== undefined) updateSet.barcode = body.barcode;
    if (body.sku !== undefined) updateSet.sku = body.sku;
    if (body.is_available !== undefined) updateSet.isAvailable = body.is_available;
    if (body.preparation_time !== undefined) updateSet.preparationTime = body.preparation_time;
    if (body.sort_order !== undefined) updateSet.sortOrder = body.sort_order;

    await db
      .update(products)
      .set(updateSet)
      .where(eq(products.id, productId));

    // Fetch updated product with category
    const [row] = await db
      .select({
        id: products.id,
        categoryId: products.categoryId,
        name: products.name,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        barcode: products.barcode,
        sku: products.sku,
        isAvailable: products.isAvailable,
        preparationTime: products.preparationTime,
        sortOrder: products.sortOrder,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, productId))
      .limit(1);

    return successResponse(c, 'Product updated successfully', formatProduct(row));
  } catch (err) {
    return errorResponse(c, 'Failed to update product', (err as Error).message);
  }
}

export async function deleteProduct(c: Context) {
  const productId = c.req.param('id');

  try {
    // Check if product exists
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!existing) {
      return errorResponse(c, 'Product not found', 'product_not_found', 404);
    }

    // Check if product is used in any orders
    const [usedInOrders] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orderItems)
      .where(eq(orderItems.productId, productId));

    if (Number(usedInOrders.count) > 0) {
      // Soft delete: mark as unavailable
      await db
        .update(products)
        .set({ isAvailable: false, updatedAt: sql`NOW()` })
        .where(eq(products.id, productId));

      return successResponse(c, 'Product deactivated (used in existing orders)', {
        product_id: productId,
        deactivated: true,
      });
    }

    // Hard delete if not used in orders
    await db.delete(products).where(eq(products.id, productId));

    return successResponse(c, 'Product deleted successfully', {
      product_id: productId,
      deleted: true,
    });
  } catch (err) {
    return errorResponse(c, 'Failed to delete product', (err as Error).message);
  }
}
