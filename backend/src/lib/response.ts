import type { Context } from 'hono';

type StatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 409 | 429 | 500;

export function successResponse(c: Context, message: string, data?: unknown, status: StatusCode = 200) {
  const body: Record<string, unknown> = { success: true, message };
  if (data !== undefined) body.data = data;
  return c.json(body, status);
}

export function errorResponse(c: Context, message: string, error?: string, status: StatusCode = 500) {
  const body: Record<string, unknown> = { success: false, message };
  if (error !== undefined && error !== '') body.error = error;
  return c.json(body, status);
}

export function paginatedResponse(
  c: Context,
  message: string,
  data: unknown[],
  meta: { current_page: number; per_page: number; total: number; total_pages: number },
) {
  return c.json({ success: true, message, data, meta });
}
