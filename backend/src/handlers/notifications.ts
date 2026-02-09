import type { Context } from 'hono';
import { sql } from 'drizzle-orm';
import { db, pool } from '../db/connection.js';
import { successResponse, errorResponse } from '../lib/response.js';

// ── GetUnreadCounts ──────────────────────────────────────────────────────────

export async function getUnreadCounts(c: Context) {
  const userId = c.get('user_id');

  try {
    const res = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ${userId} AND is_read = false
    `);

    return c.json({
      success: true,
      data: {
        notifications: Number(res.rows[0].count),
      },
    });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to fetch notification count',
      error: (err as Error).message,
    }, 500);
  }
}

// ── GetNotifications ──────────────────────────────────────────────────────────

export async function getNotifications(c: Context) {
  const userId = c.get('user_id');
  const notifType = c.req.query('type') || '';
  const isRead = c.req.query('is_read') || '';

  try {
    let query = `
      SELECT id, user_id, type, title, message, is_read, read_at, created_at
      FROM notifications
      WHERE user_id = $1
    `;
    const params: unknown[] = [userId];
    let argIndex = 2;

    if (notifType) {
      query += ` AND type = $${argIndex}`;
      params.push(notifType);
      argIndex++;
    }

    if (isRead === 'true') {
      query += ' AND is_read = true';
    } else if (isRead === 'false') {
      query += ' AND is_read = false';
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const res = await pool.query(query, params);

    const notifications = res.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      is_read: row.is_read,
      ...(row.read_at != null && { read_at: row.read_at }),
      created_at: row.created_at,
    }));

    return successResponse(c, 'Notifications retrieved successfully', notifications);
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to fetch notifications',
      error: (err as Error).message,
    }, 500);
  }
}

// ── MarkNotificationRead ──────────────────────────────────────────────────────

export async function markNotificationRead(c: Context) {
  const userId = c.get('user_id');
  const notificationId = c.req.param('id');

  try {
    const res = await db.execute(sql`
      UPDATE notifications
      SET is_read = true, read_at = NOW()
      WHERE id = ${notificationId} AND user_id = ${userId}
    `);

    if (res.rowCount === 0) {
      return c.json({ success: false, message: 'Notification not found' }, 404);
    }

    return c.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to update notification',
      error: (err as Error).message,
    }, 500);
  }
}

// ── DeleteNotification ──────────────────────────────────────────────────────

export async function deleteNotification(c: Context) {
  const userId = c.get('user_id');
  const notificationId = c.req.param('id');

  try {
    const res = await db.execute(sql`
      DELETE FROM notifications WHERE id = ${notificationId} AND user_id = ${userId}
    `);

    if (res.rowCount === 0) {
      return c.json({ success: false, message: 'Notification not found' }, 404);
    }

    return c.json({ success: true, message: 'Notification deleted successfully' });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to delete notification',
      error: (err as Error).message,
    }, 500);
  }
}

// ── GetNotificationPreferences ──────────────────────────────────────────────

export async function getNotificationPreferences(c: Context) {
  const userId = c.get('user_id');

  try {
    const res = await db.execute<{
      id: string;
      user_id: string;
      email_enabled: boolean;
      types_enabled: string;
      quiet_hours_start: string | null;
      quiet_hours_end: string | null;
      notification_email: string | null;
      created_at: string;
      updated_at: string;
    }>(sql`
      SELECT id, user_id, email_enabled, types_enabled, quiet_hours_start, quiet_hours_end,
             notification_email, created_at, updated_at
      FROM notification_preferences
      WHERE user_id = ${userId}
    `);

    if (res.rows.length > 0) {
      const row = res.rows[0];
      return successResponse(c, 'Preferences retrieved successfully', {
        id: row.id,
        user_id: row.user_id,
        email_enabled: row.email_enabled,
        types_enabled: row.types_enabled,
        ...(row.quiet_hours_start != null && { quiet_hours_start: row.quiet_hours_start }),
        ...(row.quiet_hours_end != null && { quiet_hours_end: row.quiet_hours_end }),
        ...(row.notification_email != null && { notification_email: row.notification_email }),
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
    }

    // Create default preferences if none exist
    const defaultTypes = '{"order_update": true, "low_stock": true, "payment": true, "system_alert": true, "daily_report": true}';

    const insertRes = await db.execute<{
      id: string;
      user_id: string;
      email_enabled: boolean;
      types_enabled: string;
      quiet_hours_start: string | null;
      quiet_hours_end: string | null;
      notification_email: string | null;
      created_at: string;
      updated_at: string;
    }>(sql`
      INSERT INTO notification_preferences (user_id, email_enabled, types_enabled)
      VALUES (${userId}, true, ${defaultTypes})
      RETURNING id, user_id, email_enabled, types_enabled, quiet_hours_start, quiet_hours_end,
                notification_email, created_at, updated_at
    `);

    const row = insertRes.rows[0];
    return successResponse(c, 'Preferences retrieved successfully', {
      id: row.id,
      user_id: row.user_id,
      email_enabled: row.email_enabled,
      types_enabled: row.types_enabled,
      ...(row.quiet_hours_start != null && { quiet_hours_start: row.quiet_hours_start }),
      ...(row.quiet_hours_end != null && { quiet_hours_end: row.quiet_hours_end }),
      ...(row.notification_email != null && { notification_email: row.notification_email }),
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to fetch preferences',
      error: (err as Error).message,
    }, 500);
  }
}

// ── UpdateNotificationPreferences ──────────────────────────────────────────

export async function updateNotificationPreferences(c: Context) {
  const userId = c.get('user_id');

  let body: {
    email_enabled: boolean;
    types_enabled: string;
    quiet_hours_start?: string | null;
    quiet_hours_end?: string | null;
    notification_email?: string | null;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, message: 'Invalid request format' }, 400);
  }

  try {
    await db.execute(sql`
      UPDATE notification_preferences
      SET email_enabled = ${body.email_enabled},
          types_enabled = ${body.types_enabled},
          quiet_hours_start = ${body.quiet_hours_start ?? null},
          quiet_hours_end = ${body.quiet_hours_end ?? null},
          notification_email = ${body.notification_email ?? null},
          updated_at = NOW()
      WHERE user_id = ${userId}
    `);

    return c.json({ success: true, message: 'Preferences updated successfully' });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to update preferences',
      error: (err as Error).message,
    }, 500);
  }
}

// ── GetOrderNotifications (customer-facing) ──────────────────────────────────

export async function getOrderNotifications(c: Context) {
  const orderId = c.req.param('id');

  try {
    // Verify order exists
    const orderRes = await db.execute<{ exists: boolean }>(sql`
      SELECT EXISTS(SELECT 1 FROM orders WHERE id = ${orderId}) as exists
    `);

    if (!orderRes.rows[0]?.exists) {
      return errorResponse(c, 'Order not found', 'order_not_found', 404);
    }

    // Fetch notifications for this order
    const res = await db.execute<{
      id: string;
      order_id: string;
      status: string;
      message: string;
      is_read: boolean;
      created_at: string;
    }>(sql`
      SELECT id, order_id, status, message, is_read, created_at
      FROM order_notifications
      WHERE order_id = ${orderId}
      ORDER BY created_at DESC
    `);

    let unreadCount = 0;
    const notifications = res.rows.map((row) => {
      if (!row.is_read) unreadCount++;
      return {
        id: row.id,
        order_id: row.order_id,
        status: row.status,
        message: row.message,
        is_read: row.is_read,
        created_at: row.created_at,
      };
    });

    return successResponse(c, 'Notifications retrieved successfully', {
      notifications,
      unread_count: unreadCount,
    });
  } catch (err) {
    return errorResponse(c, 'Failed to fetch notifications', (err as Error).message);
  }
}

// ── MarkOrderNotificationAsRead ──────────────────────────────────────────────

export async function markOrderNotificationAsRead(c: Context) {
  const notificationId = c.req.param('id');

  try {
    const res = await db.execute(sql`
      UPDATE order_notifications SET is_read = true WHERE id = ${notificationId}
    `);

    if (res.rowCount === 0) {
      return errorResponse(c, 'Notification not found', 'notification_not_found', 404);
    }

    return successResponse(c, 'Notification marked as read');
  } catch (err) {
    return errorResponse(c, 'Failed to update notification', (err as Error).message);
  }
}

// ── CreateOrderNotification (internal helper) ──────────────────────────────

export async function createOrderNotification(orderId: string, status: string, message: string) {
  await db.execute(sql`
    INSERT INTO order_notifications (order_id, status, message, is_read)
    VALUES (${orderId}, ${status}, ${message}, false)
  `);
}
