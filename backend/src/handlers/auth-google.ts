// File: backend/src/handlers/auth-google.ts
import type { Context } from 'hono';
import { eq, and, or, ne } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { users } from '../db/schema.js';
import { generateToken } from '../lib/jwt.js';
import { successResponse, errorResponse } from '../lib/response.js';
import { getGoogleOAuthClient, GoogleOAuthClient, type GoogleUserInfo } from '../lib/google-oauth.js';
import { createNotification } from '../lib/notifications.js';

const COOLDOWN_HOURS = 24;

/**
 * Initiate Google OAuth flow
 * GET /auth/google
 */
export async function googleAuth(c: Context) {
  try {
    const client = getGoogleOAuthClient();

    // Generate state for CSRF protection
    const state = generateState();

    // Store state in session/cookie for verification on callback
    // For simplicity, using session middleware
    c.set('oauth_state', state);

    const authUrl = client.getAuthUrl(state);

    return c.redirect(authUrl);
  } catch (err) {
    return errorResponse(c, 'Failed to initiate Google OAuth', (err as Error).message);
  }
}

/**
 * Handle Google OAuth callback
 * GET /auth/google/callback
 */
export async function googleCallback(c: Context) {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');

  // Handle user denying consent
  if (error) {
    return errorResponse(c, 'Google OAuth denied by user', 'oauth_error', 400);
  }

  if (!code || !state) {
    return errorResponse(c, 'Missing authorization code or state', 'oauth_invalid_code', 400);
  }

  try {
    // Verify state for CSRF protection (in production, validate against session)
    // For now, basic check
    if (!state || state.length < 10) {
      return errorResponse(c, 'Invalid state parameter', 'oauth_invalid_state', 400);
    }

    // Get user info from Google
    const client = getGoogleOAuthClient();
    const googleUser = await client.getUserInfo(code);

    if (!googleUser.email_verified) {
      return errorResponse(c, 'Google email not verified', 'oauth_email_not_verified', 400);
    }

    // Convert Google ID to UUID format
    const googleUuid = GoogleOAuthClient.googleIdToUuid(googleUser.id);

    // Check if user exists with this Google ID
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleUuid))
      .limit(1);

    if (existingUser) {
      return handleExistingUser(c, existingUser);
    }

    // Check if user exists with this email (for account linking scenario)
    const [userByEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, googleUser.email))
      .limit(1);

    if (userByEmail) {
      // Email exists but Google ID not linked - user should use link flow
      return errorResponse(
        c,
        'An account with this email already exists. Please link your Google account in profile settings.',
        'user_exists_link_required',
        400
      );
    }

    // Create new pending user
    return await createPendingUser(c, googleUser, googleUuid);
  } catch (err) {
    return errorResponse(c, 'Failed to complete Google OAuth', (err as Error).message);
  }
}

/**
 * Handle existing user during Google callback
 */
function handleExistingUser(c: Context, user: any) {
  if (user.approvalStatus === 'approved') {
    // Generate JWT token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    });

    return successResponse(c, 'Login successful', {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        is_active: user.isActive,
        google_id: user.googleId,
        approval_status: user.approvalStatus,
      },
      requiresApproval: false,
    });
  }

  if (user.approvalStatus === 'pending') {
    return successResponse(c, 'Account pending approval', {
      requiresApproval: true,
      user: {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
      },
      message: 'Your account is pending admin approval. You will receive an email once approved.',
    });
  }

  // Rejected user - check cooldown
  if (user.approvalStatus === 'rejected') {
    const retryAfter = calculateRetryAfter(user.lastRejectionAt);

    if (new Date() < retryAfter) {
      return errorResponse(c, 'Your account was previously rejected', 'user_rejected', 403);
    }

    // Cooldown passed - reset to pending
    return resetUserToPending(c, user.id);
  }

  return errorResponse(c, 'Unknown approval status', 'invalid_approval_status', 400);
}

/**
 * Create new pending user from Google OAuth
 */
async function createPendingUser(c: Context, googleUser: GoogleUserInfo, googleUuid: string) {
  try {
    // Generate username from email + random suffix to prevent collisions
    const baseUsername = googleUser.email.split('@')[0];
    const username = `${baseUsername}_${Math.floor(Math.random() * 100000)}`;

    const [newUser] = await db
      .insert(users)
      .values({
        id: generateUuid(),
        username,
        email: googleUser.email,
        passwordHash: '', // No password for Google-only users
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        role: 'server', // Default role, will be set on approval
        isActive: false, // Inactive until approved
        googleId: googleUuid,
        approvalStatus: 'pending',
        googleLinkedAt: new Date().toISOString(),
      })
      .returning();

    // Create notification for all admins
    await createApprovalNotification(newUser);

    return successResponse(c, 'Account pending approval', {
      requiresApproval: true,
      user: {
        email: newUser.email,
        first_name: newUser.firstName,
        last_name: newUser.lastName,
      },
      message: 'Your account has been created and is pending admin approval. You will receive an email once approved.',
    });
  } catch (err) {
    return errorResponse(c, 'Failed to create user', (err as Error).message);
  }
}

/**
 * Create approval notification for admins
 */
async function createApprovalNotification(newUser: any) {
  try {
    // Get all active admins
    const admins = await db
      .select()
      .from(users)
      .where(and(eq(users.role, 'admin'), eq(users.isActive, true)));

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'user_approval_pending',
        title: 'New user awaiting approval',
        message: `${newUser.firstName} ${newUser.lastName} (${newUser.email}) requested access via Google SSO`,
      });
    }
  } catch (err) {
    // Log error but don't fail the auth flow
    console.error('Failed to create approval notification:', err);
  }
}

/**
 * Reset rejected user to pending status
 */
async function resetUserToPending(c: Context, userId: string) {
  try {
    await db
      .update(users)
      .set({
        approvalStatus: 'pending',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId));

    // Get user details for notification
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user) {
      await createApprovalNotification(user);
    }

    return successResponse(c, 'Account pending approval', {
      requiresApproval: true,
      user: {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
      },
      message: 'Your account has been re-queued for approval.',
    });
  } catch (err) {
    return errorResponse(c, 'Failed to reset user status', (err as Error).message);
  }
}

/**
 * Calculate retry after timestamp for rejected users
 */
function calculateRetryAfter(lastRejectionAt: Date | null): Date {
  if (!lastRejectionAt) {
    return new Date(0);
  }

  const retryAfter = new Date(lastRejectionAt);
  retryAfter.setHours(retryAfter.getHours() + COOLDOWN_HOURS);
  return retryAfter;
}

/**
 * Generate random state for CSRF protection
 */
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

/**
 * Generate UUID for new users
 */
function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Link Google account to existing user
 * POST /auth/link-google
 */
export async function linkGoogleAccount(c: Context) {
  const userId = c.get('user_id');

  let body: { code?: string };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'Invalid request body', 'invalid_json', 400);
  }

  if (!body.code) {
    return errorResponse(c, 'Authorization code is required', 'missing_code', 400);
  }

  try {
    // Get user info from Google
    const client = getGoogleOAuthClient();
    const googleUser = await client.getUserInfo(body.code);
    const googleUuid = GoogleOAuthClient.googleIdToUuid(googleUser.id);

    // Check if Google ID is already linked to another user
    const [existingLinked] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.googleId, googleUuid),
        ne(users.id, userId)
      ))
      .limit(1);

    if (existingLinked) {
      return errorResponse(c, 'This Google account is already linked to another user', 'user_already_linked', 400);
    }

    // Link Google account to current user
    await db
      .update(users)
      .set({
        googleId: googleUuid,
        approvalStatus: 'approved', // Auto-approve for existing users
        googleLinkedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId));

    return successResponse(c, 'Google account linked successfully', {
      google_id: googleUuid,
    });
  } catch (err) {
    return errorResponse(c, 'Failed to link Google account', (err as Error).message);
  }
}

/**
 * Unlink Google account from current user
 * DELETE /auth/unlink-google
 */
export async function unlinkGoogleAccount(c: Context) {
  const userId = c.get('user_id');

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return errorResponse(c, 'User not found', 'user_not_found', 404);
    }

    if (!user.googleId) {
      return errorResponse(c, 'No Google account linked', 'no_google_linked', 400);
    }

    await db
      .update(users)
      .set({
        googleId: null,
        googleLinkedAt: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId));

    return successResponse(c, 'Google account unlinked successfully');
  } catch (err) {
    return errorResponse(c, 'Failed to unlink Google account', (err as Error).message);
  }
}
