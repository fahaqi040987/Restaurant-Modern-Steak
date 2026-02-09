import type { Context } from 'hono';

export function onError(err: Error, c: Context) {
  console.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
  });

  return c.json({
    success: false,
    message: 'Internal server error',
    error: 'An unexpected error occurred',
  }, 500);
}
