// File: backend/src/handlers/users.ts
import type { Context } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { users, notifications } from '../db/schema.js';
import { successResponse, errorResponse } from '../lib/response.js';

/**
 * Approve a pending user
 * POST /users/:id/approve
 */
export async function approveUser(c: Context) {
  const userId = c.req.param('id');

  let body: { role?: string };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  if (!body.role) {
    return errorResponse(c, 'Role is required', 'missing_role', 400);
  }

  const validRoles = ['admin', 'manager', 'server', 'counter', 'kitchen'];
  if (!validRoles.includes(body.role)) {
    return errorResponse(c, 'Invalid role', 'invalid_role', 400);
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return errorResponse(c, 'User not found', 'user_not_found', 404);
    }

    await db
      .update(users)
      .set({
        approvalStatus: 'approved',
        isActive: true,
        role: body.role,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId));

    // Create notification for user
    await db.insert(notifications).values({
      id: generateUuid(),
      userId: userId,
      type: 'user_approved',
      title: 'Account Approved',
      message: 'Your account has been approved. You can now log in.',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return successResponse(c, 'User approved successfully', {
      userId: user.id,
      email: user.email,
      role: body.role,
    });
  } catch (err) {
    return errorResponse(c, 'Failed to approve user', (err as Error).message);
  }
}

/**
 * Reject a pending user
 * POST /users/:id/reject
 */
export async function rejectUser(c: Context) {
  const userId = c.req.param('id');

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return errorResponse(c, 'User not found', 'user_not_found', 404);
    }

    await db
      .update(users)
      .set({
        approvalStatus: 'rejected',
        isActive: false,
        rejectionCount: (user.rejectionCount || 0) + 1,
        lastRejectionAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId));

    // Create notification for user
    await db.insert(notifications).values({
      id: generateUuid(),
      userId: userId,
      type: 'user_rejected',
      title: 'Account Rejected',
      message: 'Your account request was rejected. Please contact your administrator for more information.',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return successResponse(c, 'User rejected successfully', {
      userId: user.id,
      email: user.email,
      rejectionCount: (user.rejectionCount || 0) + 1,
      retryAfter: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (err) {
    return errorResponse(c, 'Failed to reject user', (err as Error).message);
  }
}

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
