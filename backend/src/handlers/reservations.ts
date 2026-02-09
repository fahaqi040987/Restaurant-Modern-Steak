import type { Context } from 'hono';
import { sql } from 'drizzle-orm';
import { db, pool } from '../db/connection.js';
import { successResponse, errorResponse } from '../lib/response.js';

// ── Constants ──────────────────────────────────────────────────────────────────
const RESTAURANT_OPEN_HOUR = 10;
const RESTAURANT_CLOSE_HOUR = 22;
const MIN_ADVANCE_HOURS = 2;
const MAX_ADVANCE_DAYS = 90;

// ── CreateReservation (public) ──────────────────────────────────────────────

export async function createReservation(c: Context) {
  let body: {
    customer_name: string;
    email: string;
    phone: string;
    party_size: number;
    reservation_date: string;
    reservation_time: string;
    special_requests?: string | null;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Invalid request format' }, 400);
  }

  // Validate
  const validationError = validateReservationRequest(body);
  if (validationError) {
    return c.json({ success: false, error: validationError }, 400);
  }

  try {
    const res = await pool.query(
      `INSERT INTO reservations (
        customer_name, email, phone, party_size,
        reservation_date, reservation_time, special_requests
      ) VALUES ($1, $2, $3, $4, $5::date, $6::time, $7)
      RETURNING id, customer_name, email, phone, party_size,
        to_char(reservation_date, 'YYYY-MM-DD') as reservation_date,
        to_char(reservation_time, 'HH24:MI') as reservation_time,
        special_requests, status, created_at, updated_at`,
      [
        body.customer_name,
        body.email,
        body.phone,
        body.party_size,
        body.reservation_date,
        body.reservation_time,
        body.special_requests || null,
      ],
    );

    const row = res.rows[0];

    return c.json({
      success: true,
      message: 'Reservation created successfully',
      data: {
        id: row.id,
        status: row.status,
        reservation_date: row.reservation_date,
        reservation_time: row.reservation_time,
        party_size: row.party_size,
      },
    }, 201);
  } catch (err) {
    const errMsg = (err as Error).message;
    let errorMsg = 'Failed to create reservation. Please try again.';
    if (errMsg.includes('duplicate')) {
      errorMsg = 'A reservation with similar details already exists.';
    } else if (errMsg.includes('violates check constraint')) {
      errorMsg = 'Invalid reservation data. Please check your input.';
    }

    return c.json({ success: false, error: errorMsg }, 500);
  }
}

// ── GetReservations (admin, paginated) ──────────────────────────────────────

export async function getReservations(c: Context) {
  const status = c.req.query('status') || '';
  const date = c.req.query('date') || '';
  let page = parseInt(c.req.query('page') || '1', 10);
  let limit = parseInt(c.req.query('limit') || '20', 10);

  if (page < 1) page = 1;
  if (limit < 1 || limit > 100) limit = 20;

  const offset = (page - 1) * limit;

  try {
    // Count query
    let countQuery = 'SELECT COUNT(*) FROM reservations WHERE 1=1';
    const countParams: unknown[] = [];
    let countIdx = 1;

    if (status) {
      countQuery += ` AND status = $${countIdx}`;
      countParams.push(status);
      countIdx++;
    }
    if (date) {
      countQuery += ` AND reservation_date = $${countIdx}::date`;
      countParams.push(date);
      countIdx++;
    }

    const countRes = await pool.query(countQuery, countParams);
    const total = parseInt(countRes.rows[0].count, 10);

    // Main query
    let query = `
      SELECT id, customer_name, email, phone, party_size,
        to_char(reservation_date, 'YYYY-MM-DD') as reservation_date,
        to_char(reservation_time, 'HH24:MI') as reservation_time,
        special_requests, status, notes, confirmed_by, confirmed_at, created_at, updated_at
      FROM reservations
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let argIdx = 1;

    if (status) {
      query += ` AND status = $${argIdx}`;
      params.push(status);
      argIdx++;
    }
    if (date) {
      query += ` AND reservation_date = $${argIdx}::date`;
      params.push(date);
      argIdx++;
    }

    query += ' ORDER BY reservation_date DESC, reservation_time DESC';
    query += ` LIMIT $${argIdx} OFFSET $${argIdx + 1}`;
    params.push(limit, offset);

    const res = await pool.query(query, params);

    const reservations = res.rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      customer_name: r.customer_name,
      email: r.email,
      phone: r.phone,
      party_size: r.party_size,
      reservation_date: r.reservation_date,
      reservation_time: r.reservation_time,
      ...(r.special_requests != null && { special_requests: r.special_requests }),
      status: r.status,
      ...(r.notes != null && { notes: r.notes }),
      ...(r.confirmed_by != null && { confirmed_by: r.confirmed_by }),
      ...(r.confirmed_at != null && { confirmed_at: r.confirmed_at }),
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    const totalPages = Math.ceil(total / limit);

    return c.json({
      success: true,
      data: reservations,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    });
  } catch (err) {
    return c.json({ success: false, error: 'Failed to fetch reservations' }, 500);
  }
}

// ── GetReservation (admin, single) ──────────────────────────────────────────

export async function getReservation(c: Context) {
  const id = c.req.param('id');

  try {
    const res = await pool.query(
      `SELECT id, customer_name, email, phone, party_size,
        to_char(reservation_date, 'YYYY-MM-DD') as reservation_date,
        to_char(reservation_time, 'HH24:MI') as reservation_time,
        special_requests, status, notes, confirmed_by, confirmed_at, created_at, updated_at
      FROM reservations WHERE id = $1`,
      [id],
    );

    if (res.rows.length === 0) {
      return c.json({ success: false, error: 'Reservation not found' }, 404);
    }

    const r = res.rows[0];

    return c.json({
      success: true,
      data: {
        id: r.id,
        customer_name: r.customer_name,
        email: r.email,
        phone: r.phone,
        party_size: r.party_size,
        reservation_date: r.reservation_date,
        reservation_time: r.reservation_time,
        ...(r.special_requests != null && { special_requests: r.special_requests }),
        status: r.status,
        ...(r.notes != null && { notes: r.notes }),
        ...(r.confirmed_by != null && { confirmed_by: r.confirmed_by }),
        ...(r.confirmed_at != null && { confirmed_at: r.confirmed_at }),
        created_at: r.created_at,
        updated_at: r.updated_at,
      },
    });
  } catch {
    return c.json({ success: false, error: 'Failed to fetch reservation' }, 500);
  }
}

// ── UpdateReservationStatus (admin) ──────────────────────────────────────────

export async function updateReservationStatus(c: Context) {
  const id = c.req.param('id');

  let body: { status: string; notes?: string | null };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Invalid request format' }, 400);
  }

  if (!body.status) {
    return c.json({ success: false, error: 'Status is required' }, 400);
  }

  const validStatuses = ['confirmed', 'cancelled', 'completed', 'no_show'];
  if (!validStatuses.includes(body.status)) {
    return c.json({
      success: false,
      error: 'Invalid status. Must be one of: confirmed, cancelled, completed, no_show',
    }, 400);
  }

  const userId = c.get('user_id');

  try {
    let query: string;
    let params: unknown[];

    if (body.status === 'confirmed') {
      query = `
        UPDATE reservations
        SET status = $1, notes = $2, confirmed_by = $3, confirmed_at = NOW(), updated_at = NOW()
        WHERE id = $4
        RETURNING id, customer_name, email, phone, party_size,
          to_char(reservation_date, 'YYYY-MM-DD') as reservation_date,
          to_char(reservation_time, 'HH24:MI') as reservation_time,
          special_requests, status, notes, confirmed_by, confirmed_at, created_at, updated_at
      `;
      params = [body.status, body.notes ?? null, userId, id];
    } else {
      query = `
        UPDATE reservations
        SET status = $1, notes = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING id, customer_name, email, phone, party_size,
          to_char(reservation_date, 'YYYY-MM-DD') as reservation_date,
          to_char(reservation_time, 'HH24:MI') as reservation_time,
          special_requests, status, notes, confirmed_by, confirmed_at, created_at, updated_at
      `;
      params = [body.status, body.notes ?? null, id];
    }

    const res = await pool.query(query, params);

    if (res.rows.length === 0) {
      return c.json({ success: false, error: 'Reservation not found' }, 404);
    }

    const r = res.rows[0];

    return c.json({
      success: true,
      message: 'Reservation status updated successfully',
      data: {
        id: r.id,
        customer_name: r.customer_name,
        email: r.email,
        phone: r.phone,
        party_size: r.party_size,
        reservation_date: r.reservation_date,
        reservation_time: r.reservation_time,
        ...(r.special_requests != null && { special_requests: r.special_requests }),
        status: r.status,
        ...(r.notes != null && { notes: r.notes }),
        ...(r.confirmed_by != null && { confirmed_by: r.confirmed_by }),
        ...(r.confirmed_at != null && { confirmed_at: r.confirmed_at }),
        created_at: r.created_at,
        updated_at: r.updated_at,
      },
    });
  } catch {
    return c.json({ success: false, error: 'Failed to update reservation status' }, 500);
  }
}

// ── DeleteReservation (admin) ──────────────────────────────────────────────

export async function deleteReservation(c: Context) {
  const id = c.req.param('id');

  try {
    const res = await pool.query('DELETE FROM reservations WHERE id = $1', [id]);

    if (res.rowCount === 0) {
      return c.json({ success: false, error: 'Reservation not found' }, 404);
    }

    return c.json({ success: true, message: 'Reservation deleted successfully' });
  } catch {
    return c.json({ success: false, error: 'Failed to delete reservation' }, 500);
  }
}

// ── GetPendingReservationsCount ──────────────────────────────────────────────

export async function getPendingReservationsCount(c: Context) {
  try {
    const res = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count FROM reservations WHERE status = 'pending'
    `);

    return c.json({
      success: true,
      data: {
        pending_reservations: Number(res.rows[0].count),
      },
    });
  } catch {
    return c.json({ success: false, error: 'Failed to fetch pending reservations count' }, 500);
  }
}

// ── Validation helpers ──────────────────────────────────────────────────────

function stripHTMLTags(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

function validateReservationRequest(req: {
  customer_name: string;
  email: string;
  phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  special_requests?: string | null;
}): string | null {
  // Sanitize text inputs
  req.customer_name = stripHTMLTags(req.customer_name || '');
  req.email = stripHTMLTags(req.email || '');
  req.phone = stripHTMLTags(req.phone || '');
  if (req.special_requests) {
    req.special_requests = stripHTMLTags(req.special_requests);
  }

  // Validate customer name
  if (req.customer_name.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }
  if (req.customer_name.length > 100) {
    return 'Name must be less than 100 characters';
  }

  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(req.email)) {
    return 'Invalid email format';
  }

  // Validate phone (Indonesian format)
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
  if (!phoneRegex.test(req.phone)) {
    return 'Invalid phone format. Use Indonesian format (+62/62/0 followed by 9-12 digits)';
  }

  // Validate party size
  if (!req.party_size || req.party_size < 1 || req.party_size > 20) {
    return 'Party size must be between 1 and 20';
  }

  // Parse reservation date
  const dateMatch = /^\d{4}-\d{2}-\d{2}$/.test(req.reservation_date || '');
  if (!dateMatch) {
    return 'Invalid date format. Use YYYY-MM-DD';
  }

  // Validate reservation time format
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(req.reservation_time || '')) {
    return 'Invalid time format. Use HH:MM';
  }

  // Create full reservation datetime (use WIB = UTC+7)
  const now = new Date();
  const jakartaOffset = 7 * 60; // minutes
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
  const jakartaNow = new Date(utcNow + jakartaOffset * 60000);

  const [year, month, day] = req.reservation_date.split('-').map(Number);
  const [hour, minute] = req.reservation_time.split(':').map(Number);

  // Build reservation datetime in Jakarta timezone
  const reservationDT = new Date(year, month - 1, day, hour, minute, 0);
  // Adjust: jakartaNow is already "shifted" to Jakarta local time
  // Compare in the same reference frame

  // Validate not in the past
  if (reservationDT.getTime() < jakartaNow.getTime()) {
    return 'Reservation date and time must be in the future';
  }

  // Validate minimum advance booking (2 hours)
  const minBookingTime = new Date(jakartaNow.getTime() + MIN_ADVANCE_HOURS * 60 * 60 * 1000);
  if (reservationDT.getTime() < minBookingTime.getTime()) {
    return 'Reservations must be made at least 2 hours in advance';
  }

  // Validate maximum advance booking (90 days)
  const todayStart = new Date(jakartaNow.getFullYear(), jakartaNow.getMonth(), jakartaNow.getDate());
  const maxBookingDate = new Date(todayStart.getTime() + MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000);
  const reservationDateOnly = new Date(year, month - 1, day);
  if (reservationDateOnly.getTime() > maxBookingDate.getTime()) {
    return 'Reservations can only be made up to 90 days in advance';
  }

  // Validate within operating hours
  if (hour < RESTAURANT_OPEN_HOUR || hour >= RESTAURANT_CLOSE_HOUR) {
    return 'Reservations are only available between 10:00 and 22:00 (WIB)';
  }

  // Validate special requests length
  if (req.special_requests && req.special_requests.length > 500) {
    return 'Special requests must be less than 500 characters';
  }

  return null;
}
