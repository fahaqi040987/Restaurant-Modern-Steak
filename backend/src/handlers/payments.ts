import type { Context } from 'hono';
import { sql } from 'drizzle-orm';
import { db, pool } from '../db/connection.js';
import { successResponse, errorResponse } from '../lib/response.js';

// T094: Fraud detection constants
const MAX_PAYMENTS_PER_MINUTE = 5;
const MAX_PAYMENT_AMOUNT = 50_000_000; // 50 million IDR
const MAX_FAILED_PAYMENT_ATTEMPTS = 3;

// ── ProcessPayment ──────────────────────────────────────────────────────────

export async function processPayment(c: Context) {
  const orderId = c.req.param('id');
  const userId = c.get('user_id');

  let body: {
    payment_method: string;
    amount: number;
    reference_number?: string;
  };

  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  // Validate payment method
  const validMethods = ['cash', 'credit_card', 'debit_card', 'digital_wallet'];
  if (!validMethods.includes(body.payment_method)) {
    return errorResponse(c, 'Invalid payment method', 'invalid_payment_method', 400);
  }

  if (!body.amount || body.amount <= 0) {
    return errorResponse(c, 'Payment amount must be greater than zero', 'invalid_amount', 400);
  }

  // T094: Fraud detection - check suspicious amount
  if (body.amount > MAX_PAYMENT_AMOUNT) {
    console.log(`FRAUD_ALERT: Suspicious large payment attempt - User: ${userId}, Amount: ${body.amount}`);
    return errorResponse(c, 'Payment amount exceeds maximum allowed limit', 'amount_exceeds_limit', 400);
  }

  // T094: Rate limiting - check rapid payment attempts
  try {
    const rateRes = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count FROM payments
      WHERE processed_by = ${userId} AND created_at > NOW() - INTERVAL '1 minute'
    `);
    const recentCount = Number(rateRes.rows[0]?.count ?? 0);
    if (recentCount >= MAX_PAYMENTS_PER_MINUTE) {
      console.log(`FRAUD_ALERT: Rate limit exceeded - User: ${userId}, Payments in last minute: ${recentCount}`);
      return errorResponse(c, 'Too many payment attempts. Please wait a moment before trying again.', 'rate_limit_exceeded', 429);
    }
  } catch {
    // Non-blocking — log and continue
  }

  // T094: Check for failed payment pattern (log only)
  try {
    const failedRes = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count FROM payments
      WHERE processed_by = ${userId} AND status = 'failed' AND created_at > NOW() - INTERVAL '1 hour'
    `);
    const failedCount = Number(failedRes.rows[0]?.count ?? 0);
    if (failedCount >= MAX_FAILED_PAYMENT_ATTEMPTS) {
      console.log(`FRAUD_ALERT: Multiple failed payments - User: ${userId}, Failed attempts: ${failedCount}`);
    }
  } catch {
    // Non-blocking
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check order exists and get total
    const orderRes = await client.query(
      'SELECT total_amount, status FROM orders WHERE id = $1',
      [orderId],
    );
    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return errorResponse(c, 'Order not found', 'order_not_found', 404);
    }

    const { total_amount: orderTotalAmount, status: orderStatus } = orderRes.rows[0];
    const orderTotal = Number(orderTotalAmount);

    // Check valid state
    if (orderStatus === 'cancelled' || orderStatus === 'completed') {
      await client.query('ROLLBACK');
      return errorResponse(c, `Order cannot be paid - order is ${orderStatus}`, 'invalid_order_status', 400);
    }

    // Check already fully paid
    const paidRes = await client.query(
      "SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE order_id = $1 AND status = 'completed'",
      [orderId],
    );
    const totalPaid = Number(paidRes.rows[0].total_paid);

    if (totalPaid >= orderTotal) {
      await client.query('ROLLBACK');
      return errorResponse(c, 'Order is already fully paid', 'order_fully_paid', 400);
    }

    // Check amount doesn't exceed remaining
    const remainingAmount = orderTotal - totalPaid;
    if (body.amount > remainingAmount) {
      await client.query('ROLLBACK');
      return errorResponse(c, 'Payment amount exceeds remaining balance', 'amount_exceeds_balance', 400);
    }

    // Create payment record
    const paymentRes = await client.query(
      `INSERT INTO payments (order_id, payment_method, amount, reference_number, status, processed_by, processed_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id`,
      [orderId, body.payment_method, body.amount, body.reference_number || null, 'completed', userId],
    );

    const paymentId = paymentRes.rows[0].id;

    // If fully paid after this payment, complete the order
    const newTotalPaid = totalPaid + body.amount;
    if (newTotalPaid >= orderTotal) {
      await client.query(
        `UPDATE orders SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [orderId],
      );

      // Free up the table
      await client.query(
        `UPDATE dining_tables SET is_occupied = false
         WHERE id IN (SELECT table_id FROM orders WHERE id = $1 AND table_id IS NOT NULL)`,
        [orderId],
      );

      // Log status change
      await client.query(
        `INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by, notes)
         VALUES ($1, $2, 'completed', $3, 'Order completed after payment')`,
        [orderId, orderStatus, userId],
      );
    }

    await client.query('COMMIT');

    // Fetch the created payment with user info
    const fetchRes = await db.execute<{
      id: string;
      order_id: string;
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
      SELECT p.id, p.order_id, p.payment_method, p.amount, p.reference_number, p.status,
             p.processed_by, p.processed_at, p.created_at,
             u.username, u.first_name, u.last_name
      FROM payments p
      LEFT JOIN users u ON p.processed_by = u.id
      WHERE p.id = ${paymentId}
    `);

    const row = fetchRes.rows[0];
    const payment: Record<string, unknown> = {
      id: row.id,
      order_id: row.order_id,
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

    return successResponse(c, 'Payment processed successfully', payment, 201);
  } catch (err) {
    await client.query('ROLLBACK');
    return errorResponse(c, 'Failed to process payment', (err as Error).message);
  } finally {
    client.release();
  }
}

// ── GetPayments ──────────────────────────────────────────────────────────

export async function getPayments(c: Context) {
  const orderId = c.req.param('id');

  try {
    // Check order exists
    const orderRes = await db.execute<{ id: string }>(sql`
      SELECT id FROM orders WHERE id = ${orderId} LIMIT 1
    `);

    if (orderRes.rows.length === 0) {
      return errorResponse(c, 'Order not found', 'order_not_found', 404);
    }

    // Fetch payments
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
      ORDER BY p.created_at DESC
    `);

    const payments = rows.rows.map((row) => {
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

    return successResponse(c, 'Payments retrieved successfully', payments);
  } catch (err) {
    return errorResponse(c, 'Failed to fetch payments', (err as Error).message);
  }
}

// ── GetPaymentSummary ──────────────────────────────────────────────────────────

export async function getPaymentSummary(c: Context) {
  const orderId = c.req.param('id');

  try {
    const rows = await db.execute<{
      total_amount: string;
      total_paid: string;
      pending_amount: string;
      payment_count: string;
    }>(sql`
      SELECT
        o.total_amount,
        COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END), 0) as pending_amount,
        COUNT(p.id) as payment_count
      FROM orders o
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE o.id = ${orderId}
      GROUP BY o.id, o.total_amount
    `);

    if (rows.rows.length === 0) {
      return errorResponse(c, 'Order not found', 'order_not_found', 404);
    }

    const row = rows.rows[0];
    const totalAmount = Number(row.total_amount);
    const totalPaid = Number(row.total_paid);
    const pendingAmount = Number(row.pending_amount);
    const remainingAmount = totalAmount - totalPaid;
    const isFullyPaid = remainingAmount <= 0;

    return successResponse(c, 'Payment summary retrieved successfully', {
      order_id: orderId,
      total_amount: totalAmount,
      total_paid: totalPaid,
      pending_amount: pendingAmount,
      remaining_amount: remainingAmount,
      is_fully_paid: isFullyPaid,
      payment_count: Number(row.payment_count),
    });
  } catch (err) {
    return errorResponse(c, 'Failed to fetch payment summary', (err as Error).message);
  }
}

// ── CreateCustomerPayment (QR-based, no auth) ──────────────────────────────────

export async function createCustomerPayment(c: Context) {
  const orderId = c.req.param('id');

  let body: {
    payment_method: string;
    amount: number;
    reference_number?: string;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Invalid request body' }, 400);
  }

  // T100: Authorization check — verify table ownership
  const tableIDHeader = c.req.header('X-Table-ID');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get order info
    const orderRes = await client.query(
      'SELECT total_amount, status, order_type, table_id FROM orders WHERE id = $1',
      [orderId],
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return c.json({ success: false, error: 'Order not found' }, 404);
    }

    const { total_amount, status: orderStatus, table_id: orderTableId } = orderRes.rows[0];
    const orderTotal = Number(total_amount);

    // T100: Cross-table check
    if (orderTableId && tableIDHeader && orderTableId !== tableIDHeader) {
      console.log(`AUTHORIZATION_ALERT: Cross-table payment attempt - Order table: ${orderTableId}, Request table: ${tableIDHeader}`);
      await client.query('ROLLBACK');
      return c.json({ success: false, error: 'You can only pay for orders from your table' }, 403);
    }

    if (orderStatus === 'cancelled') {
      await client.query('ROLLBACK');
      return c.json({ success: false, error: 'Cannot pay for cancelled order' }, 400);
    }

    // Check already paid
    const paidRes = await client.query(
      "SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE order_id = $1 AND status = 'completed'",
      [orderId],
    );
    const totalPaid = Number(paidRes.rows[0].total_paid);

    if (totalPaid >= orderTotal) {
      await client.query('ROLLBACK');
      return c.json({ success: false, error: 'Order is already fully paid' }, 400);
    }

    // T078: Amount must match remaining
    const remainingAmount = orderTotal - totalPaid;
    if (body.amount !== remainingAmount) {
      await client.query('ROLLBACK');
      return c.json({
        success: false,
        error: 'Payment amount must match remaining balance',
        details: { required_amount: remainingAmount, provided_amount: body.amount },
      }, 400);
    }

    // Create payment
    const paymentRes = await client.query(
      `INSERT INTO payments (order_id, payment_method, amount, reference_number, status, processed_at)
       VALUES ($1, $2, $3, $4, 'completed', NOW()) RETURNING id`,
      [orderId, body.payment_method, body.amount, body.reference_number || null],
    );
    const paymentId = paymentRes.rows[0].id;

    // Update order status to paid
    await client.query(
      "UPDATE orders SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [orderId],
    );

    // Log status change (non-critical)
    try {
      await client.query(
        `INSERT INTO order_status_history (order_id, previous_status, new_status, notes)
         VALUES ($1, $2, 'paid', 'Customer paid via ' || $3)`,
        [orderId, orderStatus, body.payment_method],
      );
    } catch {
      // Non-critical
    }

    await client.query('COMMIT');

    return c.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        payment_id: paymentId,
        order_id: orderId,
        amount: body.amount,
        payment_method: body.payment_method,
        status: 'completed',
      },
    }, 201);
  } catch (err) {
    await client.query('ROLLBACK');
    return c.json({ success: false, error: 'Failed to process payment' }, 500);
  } finally {
    client.release();
  }
}
