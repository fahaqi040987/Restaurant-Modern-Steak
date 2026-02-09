import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { env } from './env.js';
import { securityHeaders } from './middleware/security.js';
import { setupRoutes } from './routes/index.js';

const app = new Hono();

// ── Global middleware ─────────────────────────────────────────────────────────

// CORS
const allowedOrigins = env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim());

app.use('*', cors({
  origin: allowedOrigins,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type', 'X-CSRF-Token', 'X-Request-ID'],
  exposeHeaders: ['X-Request-ID'],
  credentials: true,
  maxAge: 86400,
}));

// Security headers
app.use('*', securityHeaders);

// Request logging
app.use('*', async (c, next) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  c.header('X-Request-ID', requestId);

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;
  const method = c.req.method;
  const path = c.req.path;

  if (env.NODE_ENV === 'development') {
    console.log(`[${new Date().toISOString()}] ${method} ${path} ${status} ${duration}ms`);
  }
});

// ── Static files (uploads) ────────────────────────────────────────────────────

app.use('/uploads/*', serveStatic({ root: './' }));

// ── API routes ────────────────────────────────────────────────────────────────

setupRoutes(app);

// ── 404 handler ───────────────────────────────────────────────────────────────

app.notFound((c) => {
  return c.json({
    success: false,
    message: 'Route not found',
    error: 'not_found',
  }, 404);
});

// ── Error handler ─────────────────────────────────────────────────────────────

app.onError((err, c) => {
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err.message);
  return c.json({
    success: false,
    message: 'Internal server error',
    error: env.NODE_ENV === 'development' ? err.message : undefined,
  }, 500);
});

// ── Start server ──────────────────────────────────────────────────────────────

const port = env.PORT;

console.log(`Starting server on port ${port}...`);
console.log(`Environment: ${env.NODE_ENV}`);
console.log(`CORS origins: ${allowedOrigins.join(', ')}`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`Server running at http://localhost:${info.port}`);
});
