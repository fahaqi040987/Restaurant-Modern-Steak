import type { Context } from 'hono';
import bcrypt from 'bcryptjs';
import { eq, and, ne } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { users } from '../db/schema.js';
import { successResponse, errorResponse } from '../lib/response.js';

// Password strength validation
interface PasswordStrengthError {
  min_length: boolean;
  has_upper: boolean;
  has_lower: boolean;
  has_number: boolean;
  has_special: boolean;
}

function validatePasswordStrength(password: string): PasswordStrengthError | null {
  const errors: PasswordStrengthError = {
    min_length: password.length >= 8,
    has_upper: /[A-Z]/.test(password),
    has_lower: /[a-z]/.test(password),
    has_number: /[0-9]/.test(password),
    has_special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password),
  };

  if (errors.min_length && errors.has_upper && errors.has_lower && errors.has_number && errors.has_special) {
    return null;
  }
  return errors;
}

function getPasswordStrengthMessage(errors: PasswordStrengthError): string {
  const missing: string[] = [];
  if (!errors.min_length) missing.push('at least 8 characters');
  if (!errors.has_upper) missing.push('one uppercase letter');
  if (!errors.has_lower) missing.push('one lowercase letter');
  if (!errors.has_number) missing.push('one number');
  if (!errors.has_special) missing.push('one special character (!@#$%^&*()_+-=[]{}|;\':",./<>?~)');
  return 'Password must contain: ' + missing.join(', ');
}

function formatUser(user: {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}) {
  return {
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
}

export async function getProfile(c: Context) {
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
      return errorResponse(c, 'User profile not found', undefined, 404);
    }

    return successResponse(c, 'Profile retrieved successfully', formatUser(user));
  } catch (err) {
    return errorResponse(c, 'Failed to retrieve user profile', (err as Error).message);
  }
}

export async function updateProfile(c: Context) {
  const userId = c.get('user_id');

  let body: { first_name?: string; last_name?: string; email?: string };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  if (!body.first_name || !body.last_name || !body.email) {
    return errorResponse(c, 'Invalid request body - please check first_name, last_name, and email fields', 'missing_fields', 400);
  }

  try {
    // Check email uniqueness
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, body.email), ne(users.id, userId)))
      .limit(1);

    if (existingUser) {
      return errorResponse(c, 'Email address already in use by another account', undefined, 409);
    }

    // Update profile
    const result = await db
      .update(users)
      .set({
        firstName: body.first_name,
        lastName: body.last_name,
        email: body.email,
      })
      .where(eq(users.id, userId))
      .returning();

    if (result.length === 0) {
      return errorResponse(c, 'User profile not found', undefined, 404);
    }

    const updatedUser = result[0];
    return successResponse(c, 'Profile updated successfully', formatUser({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    }));
  } catch (err) {
    return errorResponse(c, 'Failed to update profile', (err as Error).message);
  }
}

export async function changePassword(c: Context) {
  const userId = c.get('user_id');

  let body: { current_password?: string; new_password?: string };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  if (!body.current_password || !body.new_password) {
    return errorResponse(c, 'Invalid request body - current_password and new_password are required (min 8 chars)', 'missing_fields', 400);
  }

  // Validate password strength
  const strengthErrors = validatePasswordStrength(body.new_password);
  if (strengthErrors) {
    return c.json({
      success: false,
      message: getPasswordStrengthMessage(strengthErrors),
      data: { password_requirements: strengthErrors },
    }, 400);
  }

  try {
    // Get current password hash
    const [user] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return errorResponse(c, 'User not found', undefined, 404);
    }

    // Verify current password
    const validPassword = await bcrypt.compare(body.current_password, user.passwordHash);
    if (!validPassword) {
      return errorResponse(c, 'Current password is incorrect', undefined, 401);
    }

    // Hash new password
    const newHash = await bcrypt.hash(body.new_password, 10);

    // Update password
    const result = await db
      .update(users)
      .set({ passwordHash: newHash })
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (result.length === 0) {
      return errorResponse(c, 'User not found', undefined, 404);
    }

    return successResponse(c, 'Password changed successfully');
  } catch (err) {
    return errorResponse(c, 'Failed to update password', (err as Error).message);
  }
}
