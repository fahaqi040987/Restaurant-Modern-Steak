import { createMiddleware } from 'hono/factory';
import { env } from '../env.js';

export const securityHeaders = createMiddleware(async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  if (c.req.path.startsWith('/api')) {
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');
  }

  await next();
});

export const csrfProtection = createMiddleware(async (c, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    return next();
  }

  const allowedOrigins = env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  const origin = c.req.header('Origin');

  if (origin) {
    if (allowedOrigins.includes(origin)) {
      return next();
    }
    return c.json({ success: false, message: 'Forbidden', error: 'Invalid origin' }, 403);
  }

  const referer = c.req.header('Referer');
  if (!referer) {
    // Allow requests without origin/referer (e.g., direct API calls, mobile apps)
    return next();
  }

  try {
    const refererOrigin = new URL(referer).origin;
    if (allowedOrigins.includes(refererOrigin)) {
      return next();
    }
  } catch {
    // Invalid referer URL
  }

  return c.json({ success: false, message: 'Forbidden', error: 'Invalid referer' }, 403);
});
