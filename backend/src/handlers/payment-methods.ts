import type { Context } from 'hono';
import { sql } from 'drizzle-orm';
import { db, pool } from '../db/connection.js';
import { successResponse, errorResponse } from '../lib/response.js';

type PaymentMethodRow = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  is_active: boolean;
  provider: string | null;
  api_endpoint: string | null;
  webhook_url: string | null;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
};

// ── GetAdminPaymentMethods (all methods, incl. inactive) ────────────────────

export async function getAdminPaymentMethods(c: Context) {
  try {
    const res = await db.execute<PaymentMethodRow>(sql`
      SELECT id, code, label, description, is_active, provider,
             api_endpoint, webhook_url, sort_order, created_at, updated_at
      FROM payment_methods
      ORDER BY sort_order ASC, label ASC
    `);

    return successResponse(c, 'Payment methods retrieved successfully', res.rows);
  } catch (err) {
    return errorResponse(c, 'Failed to fetch payment methods', (err as Error).message);
  }
}

// ── GetActivePaymentMethods (authenticated staff) ───────────────────────────

export async function getActivePaymentMethods(c: Context) {
  try {
    const res = await db.execute<PaymentMethodRow>(sql`
      SELECT id, code, label, description, is_active, provider,
             api_endpoint, webhook_url, sort_order, created_at, updated_at
      FROM payment_methods
      WHERE is_active = true
      ORDER BY sort_order ASC, label ASC
    `);

    return successResponse(c, 'Payment methods retrieved successfully', res.rows);
  } catch (err) {
    return errorResponse(c, 'Failed to fetch payment methods', (err as Error).message);
  }
}

// ── GetPublicPaymentMethods (public-safe fields only) ───────────────────────

export async function getPublicPaymentMethods(c: Context) {
  try {
    const res = await db.execute<{
      id: string;
      code: string;
      label: string;
      description: string | null;
      provider: string | null;
      sort_order: number;
    }>(sql`
      SELECT id, code, label, description, provider, sort_order
      FROM payment_methods
      WHERE is_active = true
      ORDER BY sort_order ASC, label ASC
    `);

    return successResponse(c, 'Payment methods retrieved successfully', res.rows);
  } catch (err) {
    return errorResponse(c, 'Failed to fetch payment methods', (err as Error).message);
  }
}

// ── UpdatePaymentMethod (admin configuration) ───────────────────────────────

export async function updatePaymentMethod(c: Context) {
  const id = c.req.param('id');

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  const setClauses: string[] = [];
  const values: unknown[] = [];
  const addSet = (column: string, value: unknown) => {
    values.push(value);
    setClauses.push(`${column} = $${values.length}`);
  };

  // label — required to be non-empty when provided
  if (body.label !== undefined) {
    if (typeof body.label !== 'string') {
      return errorResponse(c, 'Label must be a string', 'invalid_label', 400);
    }
    const label = stripHTMLTags(body.label);
    if (label.length < 1 || label.length > 100) {
      return errorResponse(c, 'Label must be between 1 and 100 characters', 'invalid_label', 400);
    }
    addSet('label', label);
  }

  if (body.description !== undefined) {
    if (body.description === null) {
      addSet('description', null);
    } else if (typeof body.description === 'string') {
      const description = stripHTMLTags(body.description);
      if (description.length > 255) {
        return errorResponse(c, 'Description must be at most 255 characters', 'invalid_description', 400);
      }
      addSet('description', description === '' ? null : description);
    } else {
      return errorResponse(c, 'Description must be a string or null', 'invalid_description', 400);
    }
  }

  if (body.is_active !== undefined) {
    if (typeof body.is_active !== 'boolean') {
      return errorResponse(c, 'is_active must be a boolean', 'invalid_is_active', 400);
    }
    addSet('is_active', body.is_active);
  }

  if (body.provider !== undefined) {
    if (body.provider === null) {
      addSet('provider', null);
    } else if (typeof body.provider === 'string') {
      const provider = stripHTMLTags(body.provider);
      if (provider.length > 50) {
        return errorResponse(c, 'Provider must be at most 50 characters', 'invalid_provider', 400);
      }
      addSet('provider', provider === '' ? null : provider);
    } else {
      return errorResponse(c, 'Provider must be a string or null', 'invalid_provider', 400);
    }
  }

  if (body.api_endpoint !== undefined) {
    if (body.api_endpoint === null) {
      addSet('api_endpoint', null);
    } else if (typeof body.api_endpoint === 'string') {
      const apiEndpoint = body.api_endpoint.trim();
      if (apiEndpoint.length > 500 || !isHttpUrl(apiEndpoint)) {
        return errorResponse(c, 'api_endpoint must be a valid http(s) URL', 'invalid_api_endpoint', 400);
      }
      addSet('api_endpoint', apiEndpoint);
    } else {
      return errorResponse(c, 'api_endpoint must be a string or null', 'invalid_api_endpoint', 400);
    }
  }

  if (body.webhook_url !== undefined) {
    if (body.webhook_url === null) {
      addSet('webhook_url', null);
    } else if (typeof body.webhook_url === 'string') {
      const webhookUrl = body.webhook_url.trim();
      if (webhookUrl.length > 500 || !isHttpUrl(webhookUrl)) {
        return errorResponse(c, 'webhook_url must be a valid http(s) URL', 'invalid_webhook_url', 400);
      }
      addSet('webhook_url', webhookUrl);
    } else {
      return errorResponse(c, 'webhook_url must be a string or null', 'invalid_webhook_url', 400);
    }
  }

  if (body.sort_order !== undefined) {
    if (typeof body.sort_order !== 'number' || !Number.isInteger(body.sort_order) || body.sort_order < 0) {
      return errorResponse(c, 'sort_order must be an integer greater than or equal to 0', 'invalid_sort_order', 400);
    }
    addSet('sort_order', body.sort_order);
  }

  if (setClauses.length === 0) {
    return errorResponse(c, 'No valid fields provided to update', 'no_fields_to_update', 400);
  }

  try {
    values.push(id);
    const res = await pool.query<PaymentMethodRow>(
      `UPDATE payment_methods
       SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING id, code, label, description, is_active, provider,
                 api_endpoint, webhook_url, sort_order, created_at, updated_at`,
      values,
    );

    if (res.rows.length === 0) {
      return errorResponse(c, 'Payment method not found', 'not_found', 404);
    }

    return successResponse(c, 'Payment method updated successfully', res.rows[0]);
  } catch (err) {
    return errorResponse(c, 'Failed to update payment method', (err as Error).message);
  }
}

// ── Shared helper: active payment method codes ──────────────────────────────

// Returns the codes of all active payment methods, or null when the
// payment_methods table is unavailable (migration not applied yet) so callers
// can fall back to the legacy hardcoded list.
export async function getActivePaymentMethodCodes(): Promise<string[] | null> {
  try {
    const res = await pool.query<{ code: string }>(
      'SELECT code FROM payment_methods WHERE is_active = true',
    );
    return res.rows.map((row) => row.code);
  } catch {
    console.warn('payment_methods table unavailable, falling back to legacy methods');
    return null;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHTMLTags(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

function isHttpUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}
