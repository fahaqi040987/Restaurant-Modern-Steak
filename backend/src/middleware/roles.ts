import { createMiddleware } from 'hono/factory';

export function requireRoles(roles: string[]) {
  return createMiddleware(async (c, next) => {
    const role = c.get('role');

    if (!role) {
      return c.json({ success: false, message: 'Role information not found', error: 'missing_role' }, 403);
    }

    if (!roles.includes(role)) {
      return c.json({ success: false, message: 'Insufficient permissions', error: 'insufficient_permissions' }, 403);
    }

    await next();
  });
}
