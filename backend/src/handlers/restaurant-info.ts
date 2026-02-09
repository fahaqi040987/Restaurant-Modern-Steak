import type { Context } from 'hono';
import { sql } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { successResponse, errorResponse } from '../lib/response.js';

// ── UpdateRestaurantInfo ──────────────────────────────────────────────────────

export async function updateRestaurantInfo(c: Context) {
  let body: {
    name: string;
    tagline?: string | null;
    description?: string | null;
    address?: string | null;
    city?: string | null;
    postal_code?: string | null;
    country?: string | null;
    phone?: string | null;
    email?: string | null;
    whatsapp?: string | null;
    map_latitude?: number | null;
    map_longitude?: number | null;
    google_maps_url?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
    twitter_url?: string | null;
    logo_url?: string | null;
    hero_image_url?: string | null;
  };

  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request format', 'invalid_json', 400);
  }

  // Validate required fields
  const name = (body.name || '').trim();
  if (!name) {
    return errorResponse(c, 'Restaurant name is required', 'name_required', 400);
  }

  // Validate email format if provided
  if (body.email && body.email.trim()) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(body.email.trim())) {
      return errorResponse(c, 'Invalid email format', 'invalid_email', 400);
    }
  }

  // Validate phone format if provided
  if (body.phone && body.phone.trim()) {
    const phoneRegex = /^(\+62|62|0)[0-9]{8,13}$/;
    const cleanPhone = body.phone.trim().replace(/-/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return errorResponse(c, 'Invalid phone format', 'invalid_phone', 400);
    }
  }

  try {
    // Get restaurant info ID (singleton table)
    const infoRes = await db.execute<{ id: string }>(sql`
      SELECT id FROM restaurant_info LIMIT 1
    `);

    if (infoRes.rows.length === 0) {
      return errorResponse(c, 'Failed to retrieve restaurant info', 'not_found');
    }

    const infoId = infoRes.rows[0].id;

    // Update restaurant info
    await db.execute(sql`
      UPDATE restaurant_info SET
        name = ${name},
        tagline = ${body.tagline ?? null},
        description = ${body.description ?? null},
        address = ${body.address ?? null},
        city = ${body.city ?? null},
        postal_code = ${body.postal_code ?? null},
        country = ${body.country ?? null},
        phone = ${body.phone ?? null},
        email = ${body.email ?? null},
        whatsapp = ${body.whatsapp ?? null},
        map_latitude = ${body.map_latitude ?? null},
        map_longitude = ${body.map_longitude ?? null},
        google_maps_url = ${body.google_maps_url ?? null},
        instagram_url = ${body.instagram_url ?? null},
        facebook_url = ${body.facebook_url ?? null},
        twitter_url = ${body.twitter_url ?? null},
        logo_url = ${body.logo_url ?? null},
        hero_image_url = ${body.hero_image_url ?? null},
        updated_at = NOW()
      WHERE id = ${infoId}
    `);

    return successResponse(c, 'Restaurant information updated successfully', { id: infoId });
  } catch (err) {
    return errorResponse(c, 'Failed to update restaurant information', (err as Error).message);
  }
}

// ── UpdateOperatingHours ──────────────────────────────────────────────────────

export async function updateOperatingHours(c: Context) {
  let body: {
    hours: Array<{
      day_of_week: number;
      open_time: string;
      close_time: string;
      is_closed: boolean;
    }>;
  };

  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request format', 'invalid_json', 400);
  }

  if (!body.hours || body.hours.length !== 7) {
    return errorResponse(c, 'Operating hours must include all 7 days of the week', 'invalid_hours_count', 400);
  }

  // Validate time formats and business logic
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

  for (const hour of body.hours) {
    if (hour.day_of_week < 0 || hour.day_of_week > 6) {
      return errorResponse(c, 'Invalid day_of_week (must be 0-6)', 'invalid_day_of_week', 400);
    }

    if (hour.is_closed) continue;

    if (!(hour.open_time || '').trim()) {
      return errorResponse(c, 'Open time is required when not closed', 'open_time_required', 400);
    }
    if (!(hour.close_time || '').trim()) {
      return errorResponse(c, 'Close time is required when not closed', 'close_time_required', 400);
    }

    if (!timePattern.test(hour.open_time)) {
      return errorResponse(c, 'Invalid open time format (use HH:MM)', 'invalid_open_time', 400);
    }
    if (!timePattern.test(hour.close_time)) {
      return errorResponse(c, 'Invalid close time format (use HH:MM)', 'invalid_close_time', 400);
    }

    if (hour.open_time === '00:00' || hour.close_time === '00:00') {
      return errorResponse(c, '00:00 is not a valid time for an open day', 'invalid_zero_time', 400);
    }

    if (hour.open_time >= hour.close_time) {
      return errorResponse(c, 'Opening time must be before closing time', 'invalid_time_range', 400);
    }
  }

  try {
    // Get restaurant info ID
    const infoRes = await db.execute<{ id: string }>(sql`
      SELECT id FROM restaurant_info LIMIT 1
    `);

    if (infoRes.rows.length === 0) {
      return errorResponse(c, 'Failed to retrieve restaurant info', 'not_found');
    }

    const infoId = infoRes.rows[0].id;

    // Update each day's operating hours
    for (const hour of body.hours) {
      const openTime = hour.is_closed ? '00:00' : normalizeTimeString(hour.open_time);
      const closeTime = hour.is_closed ? '00:00' : normalizeTimeString(hour.close_time);

      await db.execute(sql`
        UPDATE operating_hours SET
          open_time = ${openTime},
          close_time = ${closeTime},
          is_closed = ${hour.is_closed},
          updated_at = NOW()
        WHERE restaurant_info_id = ${infoId} AND day_of_week = ${hour.day_of_week}
      `);
    }

    return successResponse(c, 'Operating hours updated successfully', {
      updated_count: body.hours.length,
    });
  } catch (err) {
    return errorResponse(c, 'Failed to update operating hours', (err as Error).message);
  }
}

// ── Helper: normalizeTimeString ──────────────────────────────────────────────

function normalizeTimeString(timeStr: string): string {
  const trimmed = timeStr.trim();

  // If already in HH:MM format, return as-is
  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmed)) {
    return trimmed;
  }

  // Try parsing as ISO datetime formats
  const formats = [
    /^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2}):\d{2}/, // ISO 8601
    /^(\d{2}:\d{2}):\d{2}$/,                     // HH:MM:SS
  ];

  for (const fmt of formats) {
    const match = trimmed.match(fmt);
    if (match) return match[1];
  }

  // If parsing fails, return original
  return trimmed;
}
