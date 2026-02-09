import { createMiddleware } from 'hono/factory';
import { v4 as uuidv4 } from 'uuid';

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string;
  }
}

export const requestIdMiddleware = createMiddleware(async (c, next) => {
  const requestId = c.req.header('X-Request-ID') || uuidv4();
  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);
  await next();
});

export const structuredLogger = createMiddleware(async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;
  const requestId = c.get('requestId') || '-';

  const logLevel = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO';

  console.log(JSON.stringify({
    level: logLevel,
    timestamp: new Date().toISOString(),
    request_id: requestId,
    method,
    path,
    status,
    duration_ms: duration,
  }));
});
