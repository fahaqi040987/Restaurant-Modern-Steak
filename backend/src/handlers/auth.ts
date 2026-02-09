import type { Context } from 'hono';
import bcrypt from 'bcryptjs';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { users } from '../db/schema.js';
import { generateToken } from '../lib/jwt.js';
import { successResponse, errorResponse } from '../lib/response.js';

export async function login(c: Context) {
  let body: { username?: string; password?: string };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  if (!body.username || !body.password) {
    return errorResponse(c, 'Username and password are required', 'missing_credentials', 400);
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.username, body.username), eq(users.isActive, true)))
      .limit(1);

    if (!user) {
      return errorResponse(c, 'Invalid username or password', 'invalid_credentials', 401);
    }

    const validPassword = await bcrypt.compare(body.password, user.passwordHash);
    if (!validPassword) {
      return errorResponse(c, 'Invalid username or password', 'invalid_credentials', 401);
    }

    const token = generateToken({ id: user.id, username: user.username, role: user.role });

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      role: user.role,
      is_active: user.isActive,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };

    return successResponse(c, 'Login successful', { token, user: userData });
  } catch (err) {
    return errorResponse(c, 'Database error', (err as Error).message);
  }
}

export async function getCurrentUser(c: Context) {
  const userId = c.get('user_id');

  try {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return errorResponse(c, 'User not found', 'user_not_found', 404);
    }

    return successResponse(c, 'User retrieved successfully', {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      role: user.role,
      is_active: user.isActive,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    });
  } catch (err) {
    return errorResponse(c, 'Database error', (err as Error).message);
  }
}

export async function logout(c: Context) {
  return successResponse(c, 'Logout successful');
}
