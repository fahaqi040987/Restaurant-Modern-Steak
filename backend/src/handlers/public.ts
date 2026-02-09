import type { Context } from 'hono';
import { sql } from 'drizzle-orm';
import { db, pool } from '../db/connection.js';
import { successResponse, errorResponse } from '../lib/response.js';
import { randomUUID } from 'node:crypto';

// ── CSRF Token Management ────────────────────────────────────────────────────

const csrfTokens = new Map<string, number>();
const CSRF_TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutes

function generateCSRFToken(): string {
  const token = randomUUID();
  csrfTokens.set(token, Date.now());
  // Cleanup old tokens
  for (const [t, time] of csrfTokens) {
    if (Date.now() - time > CSRF_TOKEN_EXPIRY) {
      csrfTokens.delete(t);
    }
  }
  return token;
}

function validateCSRFToken(token: string): boolean {
  const created = csrfTokens.get(token);
  if (!created) return false;
  if (Date.now() - created > CSRF_TOKEN_EXPIRY) {
    csrfTokens.delete(token);
    return false;
  }
  return true;
}

// ── Rate Limiting ────────────────────────────────────────────────────────────

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// Constants
const maxCustomerNameLength = 100;
const maxNotesLength = 500;
const maxSpecialInstructionsLength = 500;

// ── Helper: stripHTMLTags ────────────────────────────────────────────────────

function stripHTMLTags(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

// ── Helper: isValidEmail ─────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// ── Helper: normalizeTimeString ──────────────────────────────────────────────

function normalizeTimeString(timeStr: string): string {
  const trimmed = timeStr.trim();
  // If already in HH:MM:SS format
  if (/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(trimmed)) return trimmed;
  // If in HH:MM format
  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmed)) return trimmed + ':00';
  // ISO format
  const isoMatch = trimmed.match(/T(\d{2}:\d{2}:\d{2})/);
  if (isoMatch) return isoMatch[1];
  return trimmed;
}

// ── Helper: parseTimeToSeconds ───────────────────────────────────────────────

function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const seconds = parseInt(parts[2], 10) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

// ── Helper: calculateIsOpenNow ───────────────────────────────────────────────

interface OperatingHoursEntry {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

function calculateIsOpenNow(hours: OperatingHoursEntry[], checkTime: Date): boolean {
  const dayOfWeek = checkTime.getDay(); // 0=Sunday, 1=Monday, ...
  for (const h of hours) {
    if (h.day_of_week === dayOfWeek) {
      if (h.is_closed) return false;
      const checkSeconds = checkTime.getHours() * 3600 + checkTime.getMinutes() * 60 + checkTime.getSeconds();
      const openSeconds = parseTimeToSeconds(h.open_time);
      const closeSeconds = parseTimeToSeconds(h.close_time);
      return checkSeconds >= openSeconds && checkSeconds < closeSeconds;
    }
  }
  return false;
}

// ── GetPublicMenu ────────────────────────────────────────────────────────────

export async function getPublicMenu(c: Context) {
  const categoryId = c.req.query('category_id') || '';
  const search = c.req.query('search') || '';

  try {
    let query = `
      SELECT p.id, p.name, p.description, p.price, p.image_url, p.category_id, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_available = true
    `;
    const params: unknown[] = [];
    let argIndex = 0;

    if (categoryId) {
      argIndex++;
      query += ` AND p.category_id = $${argIndex}`;
      params.push(categoryId);
    }

    if (search) {
      argIndex++;
      query += ` AND (p.name ILIKE $${argIndex} OR p.description ILIKE $${argIndex})`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY p.sort_order ASC, p.name ASC';

    const res = await pool.query(query, params);
    const menuItems = res.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      description: row.description || null,
      price: Number(row.price),
      image_url: row.image_url || null,
      category_id: row.category_id || null,
      category_name: row.category_name || '',
    }));

    return successResponse(c, 'Menu retrieved successfully', menuItems);
  } catch (err) {
    return errorResponse(c, 'Failed to fetch menu items', (err as Error).message);
  }
}

// ── GetPublicCategories ──────────────────────────────────────────────────────

export async function getPublicCategories(c: Context) {
  try {
    const res = await pool.query(`
      SELECT id, name, description, color, sort_order
      FROM categories
      WHERE is_active = true
      ORDER BY sort_order ASC, name ASC
    `);

    const categories = res.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      description: row.description || null,
      color: row.color || null,
      sort_order: row.sort_order,
    }));

    return successResponse(c, 'Categories retrieved successfully', categories);
  } catch (err) {
    return errorResponse(c, 'Failed to fetch categories', (err as Error).message);
  }
}

// ── GetRestaurantInfo ────────────────────────────────────────────────────────

export async function getRestaurantInfo(c: Context) {
  try {
    // Query restaurant info (singleton row)
    const infoRes = await pool.query(`
      SELECT id, name, tagline, description, address, city, postal_code, country,
             phone, email, whatsapp, map_latitude, map_longitude, google_maps_url,
             instagram_url, facebook_url, twitter_url, logo_url, hero_image_url, timezone
      FROM restaurant_info
      LIMIT 1
    `);

    if (infoRes.rows.length === 0) {
      return errorResponse(c, 'Restaurant information not found', 'restaurant_info_not_found', 404);
    }

    const info = infoRes.rows[0];
    const timezone = info.timezone || 'Asia/Jakarta';

    // Query operating hours
    const hoursRes = await pool.query(`
      SELECT id, restaurant_info_id, day_of_week,
             to_char(open_time, 'HH24:MI:SS') as open_time,
             to_char(close_time, 'HH24:MI:SS') as close_time,
             is_closed
      FROM operating_hours
      WHERE restaurant_info_id = $1
      ORDER BY day_of_week ASC
    `, [info.id]);

    const operatingHours = hoursRes.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      restaurant_info_id: row.restaurant_info_id,
      day_of_week: row.day_of_week as number,
      open_time: normalizeTimeString(row.open_time as string),
      close_time: normalizeTimeString(row.close_time as string),
      is_closed: row.is_closed as boolean,
    }));

    // Calculate is_open_now using restaurant's timezone
    // Get current time in the restaurant's timezone
    const now = new Date();
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const isOpenNow = calculateIsOpenNow(operatingHours, tzDate);

    const response: Record<string, unknown> = {
      id: info.id,
      name: info.name,
      tagline: info.tagline || null,
      description: info.description || null,
      address: info.address,
      city: info.city || null,
      postal_code: info.postal_code || null,
      country: info.country || null,
      phone: info.phone,
      email: info.email,
      whatsapp: info.whatsapp || null,
      map_latitude: info.map_latitude != null ? Number(info.map_latitude) : null,
      map_longitude: info.map_longitude != null ? Number(info.map_longitude) : null,
      google_maps_url: info.google_maps_url || null,
      instagram_url: info.instagram_url || null,
      facebook_url: info.facebook_url || null,
      twitter_url: info.twitter_url || null,
      logo_url: info.logo_url || null,
      hero_image_url: info.hero_image_url || null,
      timezone,
      is_open_now: isOpenNow,
      operating_hours: operatingHours,
    };

    return successResponse(c, 'Restaurant information retrieved successfully', response);
  } catch (err) {
    return errorResponse(c, 'Failed to fetch restaurant information', (err as Error).message);
  }
}

// ── SubmitContactForm ────────────────────────────────────────────────────────

export async function submitContactForm(c: Context) {
  let body: {
    name: string;
    email: string;
    phone?: string | null;
    subject: string;
    message: string;
  };

  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  // Validate required fields
  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const subject = (body.subject || '').trim();
  const message = (body.message || '').trim();

  if (!name) return errorResponse(c, 'Name is required', 'name_required', 400);
  if (!email) return errorResponse(c, 'Email is required', 'email_required', 400);
  if (!isValidEmail(email)) return errorResponse(c, 'Invalid email format', 'invalid_email', 400);
  if (!subject) return errorResponse(c, 'Subject is required', 'subject_required', 400);
  if (!message) return errorResponse(c, 'Message is required', 'message_required', 400);

  try {
    const res = await db.execute<{ id: string }>(sql`
      INSERT INTO contact_submissions (name, email, phone, subject, message)
      VALUES (${name}, ${email}, ${body.phone ?? null}, ${subject}, ${message})
      RETURNING id
    `);

    return successResponse(c, 'Thank you for your message. We will get back to you soon.', {
      id: res.rows[0].id,
    }, 201);
  } catch (err) {
    return errorResponse(c, 'Failed to submit contact form', (err as Error).message);
  }
}

// ── GetCSRFToken ─────────────────────────────────────────────────────────────

export async function getCSRFToken(c: Context) {
  const token = generateCSRFToken();
  return successResponse(c, 'CSRF token generated', { csrf_token: token });
}

// ── GetTableByQRCode ─────────────────────────────────────────────────────────

export async function getTableByQRCode(c: Context) {
  // Rate limiting
  const clientIP = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  if (!checkRateLimit(`qr:${clientIP}`, 30, 60_000)) {
    return errorResponse(c, 'Too many requests. Please wait a moment before scanning again.', 'rate_limit_exceeded', 429);
  }

  const qrCode = c.req.param('qr_code');
  if (!qrCode) {
    return errorResponse(c, 'QR code is required', 'qr_code_required', 400);
  }

  try {
    const res = await pool.query(
      `SELECT id, table_number, seating_capacity, location, qr_code FROM dining_tables WHERE qr_code = $1`,
      [qrCode],
    );

    if (res.rows.length === 0) {
      return errorResponse(c, 'Table not found. Please scan a valid QR code.', 'table_not_found', 404);
    }

    const row = res.rows[0];
    const tableInfo: Record<string, unknown> = {
      id: row.id,
      table_number: row.table_number,
      seating_capacity: row.seating_capacity,
    };
    if (row.location) {
      tableInfo.location = row.location;
    }

    return successResponse(c, 'Table found', tableInfo);
  } catch (err) {
    return errorResponse(c, 'Failed to fetch table information', (err as Error).message);
  }
}

// ── CreateCustomerOrder ──────────────────────────────────────────────────────

export async function createCustomerOrder(c: Context) {
  // Rate limiting
  const clientIP = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  if (!checkRateLimit(`order:${clientIP}`, 5, 60_000)) {
    return errorResponse(c, 'Too many order attempts. Please wait a moment before trying again.', 'rate_limit_exceeded', 429);
  }

  // CSRF validation
  const csrfToken = c.req.header('x-csrf-token') || '';
  const csrfEnabled = process.env.CSRF_ENABLED !== 'false';
  if (csrfEnabled && csrfToken) {
    if (!validateCSRFToken(csrfToken)) {
      return errorResponse(c, 'Invalid or expired security token. Please refresh and try again.', 'invalid_csrf_token', 403);
    }
  }

  let body: {
    table_id: string;
    customer_name?: string;
    items: Array<{
      product_id: string;
      quantity: number;
      special_instructions?: string;
    }>;
    notes?: string;
  };

  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  if (!body.table_id) {
    return errorResponse(c, 'Table ID is required', 'table_id_required', 400);
  }

  if (!body.items || body.items.length === 0) {
    return errorResponse(c, 'At least one item is required', 'items_required', 400);
  }

  // Input length validation
  let customerName = (body.customer_name || '').trim();
  if (customerName.length > maxCustomerNameLength) {
    return errorResponse(c, 'Customer name is too long (max 100 characters)', 'customer_name_too_long', 400);
  }

  let notes = (body.notes || '').trim();
  if (notes.length > maxNotesLength) {
    return errorResponse(c, 'Notes are too long (max 500 characters)', 'notes_too_long', 400);
  }

  // Validate special instructions length
  for (const item of body.items) {
    const si = (item.special_instructions || '').trim();
    if (si.length > maxSpecialInstructionsLength) {
      return errorResponse(c, 'Special instructions too long (max 500 characters)', 'special_instructions_too_long', 400);
    }
    item.special_instructions = si;
  }

  // Sanitize text inputs
  customerName = stripHTMLTags(customerName);
  notes = stripHTMLTags(notes);
  for (const item of body.items) {
    item.special_instructions = stripHTMLTags(item.special_instructions || '');
  }

  try {
    // Verify table exists
    const tableRes = await pool.query(
      `SELECT table_number FROM dining_tables WHERE id = $1`,
      [body.table_id],
    );

    if (tableRes.rows.length === 0) {
      return errorResponse(c, 'Invalid table ID', 'table_not_found', 400);
    }

    const tableNumber = tableRes.rows[0].table_number;

    // Generate order number
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const nano = now.getTime() % 10000;
    const orderNumber = `QR${dateStr}-${nano}`;

    // Calculate subtotal
    let subtotal = 0;
    for (const item of body.items) {
      const productRes = await pool.query(
        `SELECT price FROM products WHERE id = $1 AND is_available = true`,
        [item.product_id],
      );

      if (productRes.rows.length === 0) {
        return errorResponse(c, 'Product not found or unavailable', 'product_not_found', 400);
      }

      subtotal += Number(productRes.rows[0].price) * item.quantity;
    }

    // Get tax rate from settings (default 11%)
    let taxRate = 11.0;
    const taxRes = await pool.query(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'tax_rate'`,
    );
    if (taxRes.rows.length > 0) {
      const parsed = parseFloat(taxRes.rows[0].setting_value);
      if (!isNaN(parsed)) taxRate = parsed;
    }

    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    // Create order
    const orderRes = await pool.query(
      `INSERT INTO orders (order_number, table_id, customer_name, order_type, status, subtotal, tax_amount, total_amount, notes)
       VALUES ($1, $2, $3, 'dine_in', 'pending', $4, $5, $6, $7)
       RETURNING id`,
      [orderNumber, body.table_id, customerName || null, subtotal, taxAmount, totalAmount, notes || null],
    );

    const orderId = orderRes.rows[0].id;

    // Create order items
    for (const item of body.items) {
      const priceRes = await pool.query(`SELECT price FROM products WHERE id = $1`, [item.product_id]);
      const price = Number(priceRes.rows[0].price);

      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, special_instructions)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.product_id, item.quantity, price, price * item.quantity, item.special_instructions || null],
      );
    }

    // Mark table as occupied
    await pool.query(`UPDATE dining_tables SET is_occupied = true WHERE id = $1`, [body.table_id]);

    return successResponse(c, 'Order placed successfully! Your order will be prepared shortly.', {
      order_id: orderId,
      order_number: orderNumber,
      table_number: tableNumber,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
    }, 201);
  } catch (err) {
    return errorResponse(c, 'Failed to create order', (err as Error).message);
  }
}

// ── CreatePublicReservation ──────────────────────────────────────────────────
// Re-exported from reservations handler; this is here for route clarity.
// The actual implementation lives in reservations.ts.
