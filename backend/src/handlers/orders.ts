import type { Context } from 'hono';
import { eq, and, sql, not, inArray } from 'drizzle-orm';
import { db, pool } from '../db/connection.js';
import { orders, orderItems, products, diningTables, users, orderStatusHistory, orderNotifications, systemSettings } from '../db/schema.js';
import { successResponse, errorResponse, paginatedResponse } from '../lib/response.js';
import { parsePagination, buildMeta } from '../lib/pagination.js';

function generateOrderNumber(): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = String(Date.now() % 10000).padStart(4, '0');
  return `ORD${timestamp}${rand}`;
}

async function loadOrderItems(orderId: string) {
  const rows = await db
    .select({
      id: orderItems.id,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      totalPrice: orderItems.totalPrice,
      specialInstructions: orderItems.specialInstructions,
      status: orderItems.status,
      createdAt: orderItems.createdAt,
      updatedAt: orderItems.updatedAt,
      productName: products.name,
      productDescription: products.description,
      productPrice: products.price,
      productPreparationTime: products.preparationTime,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId))
    .orderBy(orderItems.createdAt);

  return rows.map((item) => ({
    id: item.id,
    order_id: orderId,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: Number(item.unitPrice),
    total_price: Number(item.totalPrice),
    special_instructions: item.specialInstructions,
    status: item.status,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
    product: {
      id: item.productId,
      name: item.productName,
      description: item.productDescription,
      price: Number(item.productPrice),
      preparation_time: item.productPreparationTime,
    },
  }));
}

async function loadOrderPayments(orderId: string) {
  const rows = await db.execute<{
    id: string;
    payment_method: string;
    amount: string;
    reference_number: string | null;
    status: string;
    processed_by: string | null;
    processed_at: string | null;
    created_at: string | null;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
  }>(sql`
    SELECT p.id, p.payment_method, p.amount, p.reference_number, p.status,
           p.processed_by, p.processed_at, p.created_at,
           u.username, u.first_name, u.last_name
    FROM payments p
    LEFT JOIN users u ON p.processed_by = u.id
    WHERE p.order_id = ${orderId}
    ORDER BY p.created_at
  `);

  return rows.rows.map((row) => {
    const payment: Record<string, unknown> = {
      id: row.id,
      order_id: orderId,
      payment_method: row.payment_method,
      amount: Number(row.amount),
      reference_number: row.reference_number,
      status: row.status,
      processed_by: row.processed_by,
      processed_at: row.processed_at,
      created_at: row.created_at,
    };

    if (row.username) {
      payment.processed_by_user = {
        username: row.username,
        first_name: row.first_name,
        last_name: row.last_name,
      };
    }

    return payment;
  });
}

async function getOrderByID(orderId: string) {
  const [row] = await db.execute<{
    id: string;
    order_number: string;
    table_id: string | null;
    user_id: string | null;
    customer_name: string | null;
    order_type: string;
    status: string;
    subtotal: string;
    tax_amount: string;
    discount_amount: string;
    total_amount: string;
    notes: string | null;
    created_at: string | null;
    updated_at: string | null;
    served_at: string | null;
    completed_at: string | null;
    table_number: string | null;
    table_location: string | null;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
  }>(sql`
    SELECT o.id, o.order_number, o.table_id, o.user_id, o.customer_name,
           o.order_type, o.status, o.subtotal, o.tax_amount, o.discount_amount,
           o.total_amount, o.notes, o.created_at, o.updated_at, o.served_at, o.completed_at,
           t.table_number, t.location as table_location,
           u.username, u.first_name, u.last_name
    FROM orders o
    LEFT JOIN dining_tables t ON o.table_id = t.id
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.id = ${orderId}
  `).then(r => [r.rows[0]]);

  if (!row) return null;

  const order: Record<string, unknown> = {
    id: row.id,
    order_number: row.order_number,
    table_id: row.table_id,
    user_id: row.user_id,
    customer_name: row.customer_name,
    order_type: row.order_type,
    status: row.status,
    subtotal: Number(row.subtotal),
    tax_amount: Number(row.tax_amount),
    discount_amount: Number(row.discount_amount),
    total_amount: Number(row.total_amount),
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    served_at: row.served_at,
    completed_at: row.completed_at,
  };

  if (row.table_number) {
    order.table = {
      table_number: row.table_number,
      location: row.table_location,
    };
  }

  if (row.username) {
    order.user = {
      username: row.username,
      first_name: row.first_name,
      last_name: row.last_name,
    };
  }

  order.items = await loadOrderItems(row.id);
  order.payments = await loadOrderPayments(row.id);

  return order;
}

async function createOrderNotification(orderId: string, status: string, message: string) {
  try {
    await db.insert(orderNotifications).values({
      orderId,
      status,
      message,
      isRead: false,
    });
  } catch (err) {
    console.warn('Failed to create order notification:', err);
  }
}

// ── GetOrders ──────────────────────────────────────────────────────────

export async function getOrders(c: Context) {
  const status = c.req.query('status');
  const orderType = c.req.query('order_type');
  const { page, perPage, offset } = parsePagination({
    page: c.req.query('page'),
    per_page: c.req.query('per_page'),
  });

  try {
    // Build conditions
    const conditions = [];
    if (status) conditions.push(eq(orders.status, status));
    if (orderType) conditions.push(eq(orders.orderType, orderType));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total
    const [countResult] = await db
      .select({ count: sql<number>`count(DISTINCT ${orders.id})` })
      .from(orders)
      .where(whereClause);

    const total = Number(countResult.count);

    // Fetch orders
    const rows = await db.execute<{
      id: string;
      order_number: string;
      table_id: string | null;
      user_id: string | null;
      customer_name: string | null;
      order_type: string;
      status: string;
      subtotal: string;
      tax_amount: string;
      discount_amount: string;
      total_amount: string;
      notes: string | null;
      created_at: string | null;
      updated_at: string | null;
      served_at: string | null;
      completed_at: string | null;
      table_number: string | null;
      table_location: string | null;
      username: string | null;
      first_name: string | null;
      last_name: string | null;
    }>(sql`
      SELECT DISTINCT o.id, o.order_number, o.table_id, o.user_id, o.customer_name,
             o.order_type, o.status, o.subtotal, o.tax_amount, o.discount_amount,
             o.total_amount, o.notes, o.created_at, o.updated_at, o.served_at, o.completed_at,
             t.table_number, t.location as table_location,
             u.username, u.first_name, u.last_name
      FROM orders o
      LEFT JOIN dining_tables t ON o.table_id = t.id
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause ? sql`WHERE ${whereClause}` : sql``}
      ORDER BY o.created_at DESC
      LIMIT ${perPage} OFFSET ${offset}
    `);

    const orderList = [];
    for (const row of rows.rows) {
      const order: Record<string, unknown> = {
        id: row.id,
        order_number: row.order_number,
        table_id: row.table_id,
        user_id: row.user_id,
        customer_name: row.customer_name,
        order_type: row.order_type,
        status: row.status,
        subtotal: Number(row.subtotal),
        tax_amount: Number(row.tax_amount),
        discount_amount: Number(row.discount_amount),
        total_amount: Number(row.total_amount),
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
        served_at: row.served_at,
        completed_at: row.completed_at,
      };

      if (row.table_number) {
        order.table = {
          table_number: row.table_number,
          location: row.table_location,
        };
      }

      if (row.username) {
        order.user = {
          username: row.username,
          first_name: row.first_name,
          last_name: row.last_name,
        };
      }

      order.items = await loadOrderItems(row.id);
      orderList.push(order);
    }

    return paginatedResponse(c, 'Orders retrieved successfully', orderList, buildMeta(page, perPage, total));
  } catch (err) {
    return errorResponse(c, 'Failed to fetch orders', (err as Error).message);
  }
}

// ── GetOrder ──────────────────────────────────────────────────────────

export async function getOrder(c: Context) {
  const orderId = c.req.param('id');

  try {
    const order = await getOrderByID(orderId);
    if (!order) {
      return errorResponse(c, 'Order not found', 'order_not_found', 404);
    }
    return successResponse(c, 'Order retrieved successfully', order);
  } catch (err) {
    return errorResponse(c, 'Failed to fetch order', (err as Error).message);
  }
}

// ── CreateOrder ──────────────────────────────────────────────────────────

export async function createOrder(c: Context) {
  const userId = c.get('user_id');

  let body: {
    table_id?: string;
    customer_name?: string;
    order_type: string;
    notes?: string;
    items: { product_id: string; quantity: number; special_instructions?: string }[];
  };

  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  // Server route forces dine_in order type
  const forceOrderType = c.get('force_order_type' as never) as string | undefined;
  if (forceOrderType) {
    body.order_type = forceOrderType;
  }

  if (!body.items || body.items.length === 0) {
    return errorResponse(c, 'Order must contain at least one item', 'empty_order', 400);
  }

  // T008: dine_in requires table_id
  if (body.order_type === 'dine_in' && !body.table_id) {
    return errorResponse(c, 'Table selection is required for dine-in orders', 'table_required_for_dine_in', 400);
  }

  // T007: Validate table exists if provided
  if (body.table_id) {
    try {
      const [tableRow] = await db
        .select({ id: diningTables.id })
        .from(diningTables)
        .where(eq(diningTables.id, body.table_id))
        .limit(1);

      if (!tableRow) {
        return errorResponse(c, 'Selected table does not exist', 'table_not_found', 400);
      }
    } catch (err) {
      return errorResponse(c, 'Failed to validate table', (err as Error).message);
    }
  }

  // Use raw pg client for transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderNumber = generateOrderNumber();

    // Calculate subtotal — validate products exist and are available
    let subtotal = 0;
    for (const item of body.items) {
      const productRes = await client.query(
        'SELECT name, price, is_available FROM products WHERE id = $1',
        [item.product_id],
      );

      if (productRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return errorResponse(c, `Product with ID '${item.product_id}' not found`, 'product_not_found', 400);
      }

      const prod = productRes.rows[0];
      if (!prod.is_available) {
        await client.query('ROLLBACK');
        return errorResponse(c, `Product '${prod.name}' is currently not available`, 'product_not_available', 400);
      }

      subtotal += Number(prod.price) * item.quantity;
    }

    // Get tax rate from system settings (default 11% Indonesian VAT)
    let taxRate = 0.11;
    const taxRes = await client.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'tax_rate'",
    );
    if (taxRes.rows.length > 0) {
      const parsed = parseFloat(taxRes.rows[0].setting_value);
      if (!isNaN(parsed)) taxRate = parsed / 100;
    }

    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    // Insert order
    const orderRes = await client.query(
      `INSERT INTO orders (order_number, table_id, user_id, customer_name, order_type, status,
                           subtotal, tax_amount, discount_amount, total_amount, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        orderNumber,
        body.table_id || null,
        userId,
        body.customer_name || null,
        body.order_type,
        'pending',
        subtotal,
        taxAmount,
        0,
        totalAmount,
        body.notes || null,
      ],
    );

    const orderId = orderRes.rows[0].id;

    // Insert order items
    for (const item of body.items) {
      const priceRes = await client.query('SELECT price FROM products WHERE id = $1', [item.product_id]);
      const price = Number(priceRes.rows[0].price);
      const totalPrice = price * item.quantity;

      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, special_instructions)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.product_id, item.quantity, price, totalPrice, item.special_instructions || null],
      );
    }

    // Update table status if dine-in
    if (body.order_type === 'dine_in' && body.table_id) {
      await client.query('UPDATE dining_tables SET is_occupied = true WHERE id = $1', [body.table_id]);
    }

    await client.query('COMMIT');

    // Fetch and return the created order
    const order = await getOrderByID(orderId);
    return successResponse(c, 'Order created successfully', order, 201);
  } catch (err) {
    await client.query('ROLLBACK');
    return errorResponse(c, 'Failed to create order', (err as Error).message);
  } finally {
    client.release();
  }
}

// ── UpdateOrderStatus ──────────────────────────────────────────────────────────

export async function updateOrderStatus(c: Context) {
  const orderId = c.req.param('id');
  const userId = c.get('user_id');

  let body: { status: string; notes?: string };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
  if (!validStatuses.includes(body.status)) {
    return errorResponse(c, 'Invalid order status', 'invalid_status', 400);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get current status
    const currentRes = await client.query('SELECT status FROM orders WHERE id = $1', [orderId]);
    if (currentRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return errorResponse(c, 'Order not found', 'order_not_found', 404);
    }

    const currentStatus = currentRes.rows[0].status;

    // Build update query
    let updateQuery = 'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP';
    const args: unknown[] = [body.status, orderId];

    if (body.status === 'served') {
      updateQuery += ', served_at = CURRENT_TIMESTAMP';
    } else if (body.status === 'completed') {
      updateQuery += ', completed_at = CURRENT_TIMESTAMP';
    }

    updateQuery += ' WHERE id = $2';
    await client.query(updateQuery, args);

    // Log status change
    await client.query(
      `INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, currentStatus, body.status, userId, body.notes || null],
    );

    // Free table if completed or cancelled
    if (body.status === 'completed' || body.status === 'cancelled') {
      await client.query(
        `UPDATE dining_tables SET is_occupied = false
         WHERE id IN (SELECT table_id FROM orders WHERE id = $1 AND table_id IS NOT NULL)`,
        [orderId],
      );
    }

    await client.query('COMMIT');

    // Create customer notifications for key status changes
    if (body.status === 'ready') {
      createOrderNotification(orderId, body.status, 'Your order is ready for pickup! Please proceed to the counter.');
    } else if (body.status === 'preparing') {
      createOrderNotification(orderId, body.status, 'Your order is now being prepared in the kitchen.');
    } else if (body.status === 'completed') {
      createOrderNotification(orderId, body.status, 'Your order has been completed. Thank you for dining with us!');
    }

    // Fetch updated order
    const order = await getOrderByID(orderId);
    return successResponse(c, 'Order status updated successfully', order);
  } catch (err) {
    await client.query('ROLLBACK');
    return errorResponse(c, 'Failed to update order status', (err as Error).message);
  } finally {
    client.release();
  }
}

// ── GetOrderStatusHistory ──────────────────────────────────────────────────────────

export async function getOrderStatusHistory(c: Context) {
  const orderId = c.req.param('id');

  try {
    const rows = await db.execute<{
      id: string;
      order_id: string;
      previous_status: string;
      new_status: string;
      changed_by: string;
      notes: string;
      created_at: string;
    }>(sql`
      SELECT
        osh.id, osh.order_id,
        COALESCE(osh.previous_status, '') as previous_status,
        osh.new_status,
        COALESCE(u.username, 'System') as changed_by,
        COALESCE(osh.notes, '') as notes,
        osh.created_at
      FROM order_status_history osh
      LEFT JOIN users u ON osh.changed_by = u.id
      WHERE osh.order_id = ${orderId}
      ORDER BY osh.created_at ASC
    `);

    const history = rows.rows.map((row) => ({
      id: row.id,
      order_id: row.order_id,
      previous_status: row.previous_status,
      new_status: row.new_status,
      changed_by: row.changed_by,
      notes: row.notes,
      created_at: row.created_at,
    }));

    // Match Go's raw array response (not wrapped in success envelope)
    return c.json(history);
  } catch (err) {
    return c.json({ error: 'Failed to fetch order status history' }, 500);
  }
}
