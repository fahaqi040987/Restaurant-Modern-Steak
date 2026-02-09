import { createMiddleware } from 'hono/factory';
import { validateToken, type JWTClaims } from '../lib/jwt.js';

declare module 'hono' {
  interface ContextVariableMap {
    user_id: string;
    username: string;
    role: string;
    jwtClaims: JWTClaims;
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    return c.json({ success: false, message: 'Authorization header is required', error: 'missing_auth_header' }, 401);
  }

  if (!authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'Invalid authorization header format', error: 'invalid_auth_format' }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const claims = validateToken(token);
    c.set('user_id', claims.user_id);
    c.set('username', claims.username);
    c.set('role', claims.role);
    c.set('jwtClaims', claims);
    await next();
  } catch {
    return c.json({ success: false, message: 'Invalid or expired token', error: 'invalid_token' }, 401);
  }
});
