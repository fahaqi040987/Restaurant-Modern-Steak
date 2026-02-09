import { pool } from '../db/connection.js';

// ── CreateNotification ───────────────────────────────────────────────────────
// Creates a notification for a specific user, respecting preferences and quiet hours.

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
): Promise<void> {
  try {
    // Check quiet hours
    if (await isQuietHours(userId)) return;

    // Check if user has this type enabled
    if (!(await isTypeEnabled(userId, type))) return;

    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, $2, $3, $4)`,
      [userId, type, title, message],
    );
  } catch (err) {
    console.error('Failed to create notification:', (err as Error).message);
  }
}

// ── CreateNotificationForRole ────────────────────────────────────────────────
// Creates a notification for all active users with a specific role.

export async function createNotificationForRole(
  role: string,
  type: string,
  title: string,
  message: string,
): Promise<void> {
  try {
    const usersRes = await pool.query(
      `SELECT id FROM users WHERE role = $1 AND is_active = true`,
      [role],
    );

    const filteredUsers = await filterUsersByPreferences(usersRes.rows, type);

    for (const user of filteredUsers) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES ($1, $2, $3, $4)`,
        [user.id, type, title, message],
      );
    }
  } catch (err) {
    console.error('Failed to create notification for role:', (err as Error).message);
  }
}

// ── NotifyLowStock ───────────────────────────────────────────────────────────

export async function notifyLowStock(
  ingredientName: string,
  currentStock: number,
  minimumStock: number,
): Promise<void> {
  const message = `Low stock alert: ${ingredientName} is at ${currentStock} (minimum: ${minimumStock})`;

  // Notify admins and managers
  for (const role of ['admin', 'manager']) {
    await createNotificationForRole(role, 'low_stock', 'Low Stock Alert', message);
  }
}

// ── NotifyOrderCreated ───────────────────────────────────────────────────────

export async function notifyOrderCreated(
  orderNumber: string,
  orderType: string,
): Promise<void> {
  const message = `New ${orderType.replace('_', ' ')} order: ${orderNumber}`;

  // Notify kitchen staff
  await createNotificationForRole('kitchen', 'order_update', 'New Order', message);

  // Notify counters
  await createNotificationForRole('counter', 'order_update', 'New Order', message);
}

// ── NotifySystemAlert ────────────────────────────────────────────────────────

export async function notifySystemAlert(
  title: string,
  message: string,
): Promise<void> {
  await createNotificationForRole('admin', 'system_alert', title, message);
}

// ── Helper: isQuietHours ─────────────────────────────────────────────────────

async function isQuietHours(userId: string): Promise<boolean> {
  try {
    const res = await pool.query(
      `SELECT quiet_hours_start, quiet_hours_end
       FROM notification_preferences
       WHERE user_id = $1`,
      [userId],
    );

    if (res.rows.length === 0) return false;

    const { quiet_hours_start, quiet_hours_end } = res.rows[0];
    if (!quiet_hours_start || !quiet_hours_end) return false;

    // Get current time in WIB (UTC+7)
    const now = new Date();
    const wibTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const currentHour = wibTime.getHours();
    const currentMinutes = currentHour * 60 + wibTime.getMinutes();

    const startParts = quiet_hours_start.split(':');
    const endParts = quiet_hours_end.split(':');
    const startMinutes = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
    const endMinutes = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } catch {
    return false;
  }
}

// ── Helper: isTypeEnabled ────────────────────────────────────────────────────

async function isTypeEnabled(userId: string, type: string): Promise<boolean> {
  try {
    const res = await pool.query(
      `SELECT types_enabled FROM notification_preferences WHERE user_id = $1`,
      [userId],
    );

    if (res.rows.length === 0) return true; // Default: all enabled

    const typesEnabled = res.rows[0].types_enabled;
    if (!typesEnabled || !Array.isArray(typesEnabled)) return true;

    return typesEnabled.includes(type);
  } catch {
    return true; // Default: enabled on error
  }
}

// ── Helper: filterUsersByPreferences ─────────────────────────────────────────

async function filterUsersByPreferences(
  users: Array<{ id: string }>,
  type: string,
): Promise<Array<{ id: string }>> {
  const filtered: Array<{ id: string }> = [];

  for (const user of users) {
    // Check quiet hours
    if (await isQuietHours(user.id)) continue;

    // Check type preference
    if (!(await isTypeEnabled(user.id, type))) continue;

    filtered.push(user);
  }

  return filtered;
}
