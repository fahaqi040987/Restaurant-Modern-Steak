import type { Context } from 'hono';
import { sql } from 'drizzle-orm';
import { db, pool } from '../db/connection.js';

// ── GetSettings ──────────────────────────────────────────────────────────────

export async function getSettings(c: Context) {
  try {
    const res = await db.execute<{
      setting_key: string;
      setting_value: string;
      setting_type: string;
    }>(sql`
      SELECT setting_key, setting_value, setting_type
      FROM system_settings
      ORDER BY category, setting_key
    `);

    const settings: Record<string, unknown> = {};
    for (const row of res.rows) {
      switch (row.setting_type) {
        case 'number': {
          const num = parseFloat(row.setting_value);
          settings[row.setting_key] = isNaN(num) ? row.setting_value : num;
          break;
        }
        case 'boolean':
          settings[row.setting_key] = row.setting_value === 'true';
          break;
        case 'json':
          settings[row.setting_key] = row.setting_value; // Frontend will parse JSON
          break;
        default:
          settings[row.setting_key] = row.setting_value;
      }
    }

    return c.json({
      success: true,
      message: 'Settings retrieved successfully',
      data: settings,
    });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to fetch settings',
      error: (err as Error).message,
    }, 500);
  }
}

// ── UpdateSettings ──────────────────────────────────────────────────────────

export async function updateSettings(c: Context) {
  let request: Record<string, string>;
  try {
    request = await c.req.json();
  } catch {
    return c.json({
      success: false,
      message: 'Invalid request format',
    }, 400);
  }

  const userId = c.get('user_id');

  try {
    for (const [key, value] of Object.entries(request)) {
      const settingType = determineSettingType(String(value));
      const category = determineCategoryFromKey(key);

      await pool.query(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, category, updated_by, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (setting_key) DO UPDATE SET
           setting_value = EXCLUDED.setting_value,
           updated_by = EXCLUDED.updated_by,
           updated_at = EXCLUDED.updated_at`,
        [key, String(value), settingType, category, userId],
      );
    }

    return c.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    return c.json({
      success: false,
      message: 'Failed to update settings',
      error: (err as Error).message,
    }, 500);
  }
}

// ── GetSystemHealth ──────────────────────────────────────────────────────────

export async function getSystemHealth(c: Context) {
  const startTime = Date.now();

  let dbStatus = 'connected';
  try {
    await pool.query('SELECT 1');
  } catch {
    dbStatus = 'disconnected';
  }
  const dbLatency = Date.now() - startTime;

  // Mock backup info (matches Go behavior)
  const now = new Date();
  const lastBackup = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const nextBackup = new Date(now.getTime() + 22 * 60 * 60 * 1000);

  return c.json({
    success: true,
    message: 'Health status retrieved successfully',
    data: {
      database: {
        status: dbStatus,
        latency_ms: dbLatency,
        last_check: now.toISOString(),
      },
      api: {
        status: 'online',
        version: '1.0.0',
      },
      backup: {
        status: 'up_to_date',
        last_backup: lastBackup.toISOString(),
        next_backup: nextBackup.toISOString(),
      },
    },
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function determineSettingType(value: string): string {
  if (value === 'true' || value === 'false') return 'boolean';
  if (!isNaN(parseFloat(value)) && isFinite(Number(value))) return 'number';
  return 'string';
}

function determineCategoryFromKey(key: string): string {
  if (['restaurant_name', 'default_language', 'currency'].includes(key)) {
    return 'restaurant';
  }
  if (['tax_rate', 'service_charge', 'tax_calculation_method', 'enable_rounding'].includes(key)) {
    return 'financial';
  }
  if (['receipt_header', 'receipt_footer', 'paper_size', 'show_logo', 'auto_print_customer_copy', 'printer_name', 'print_copies'].includes(key)) {
    return 'receipt';
  }
  if (['kitchen_paper_size', 'auto_print_kitchen', 'show_prices_kitchen', 'kitchen_print_categories', 'kitchen_urgent_time'].includes(key)) {
    return 'kitchen';
  }
  if (['backup_frequency', 'session_timeout', 'data_retention_days', 'low_stock_threshold', 'enable_audit_logging'].includes(key)) {
    return 'system';
  }
  return 'general';
}
