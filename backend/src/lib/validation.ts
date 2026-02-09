import type { Context } from 'hono';
import type { ZodSchema, ZodError } from 'zod';
import { errorResponse } from './response.js';

export async function validateBody<T>(c: Context, schema: ZodSchema<T>): Promise<T | null> {
  try {
    const body = await c.req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      const messages = (result.error as ZodError).errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      errorResponse(c, 'Validation failed', messages, 400);
      return null;
    }
    return result.data;
  } catch {
    errorResponse(c, 'Invalid JSON body', 'Request body must be valid JSON', 400);
    return null;
  }
}

/** Convert Drizzle decimal string values to numbers for JSON response */
export function numericFields<T extends Record<string, unknown>>(row: T, fields: (keyof T)[]): T {
  const result = { ...row };
  for (const field of fields) {
    if (result[field] != null) {
      (result as Record<string, unknown>)[field as string] = Number(result[field]);
    }
  }
  return result;
}

/** Convert array of rows with decimal fields to numbers */
export function numericRows<T extends Record<string, unknown>>(rows: T[], fields: (keyof T)[]): T[] {
  return rows.map((row) => numericFields(row, fields));
}
