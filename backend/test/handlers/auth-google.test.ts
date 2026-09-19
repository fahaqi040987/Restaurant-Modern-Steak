// File: backend/test/handlers/auth-google.test.ts
// Regression suite for the Google SSO handlers, matching the current handler
// contract: handlers return Hono Response objects (via successResponse /
// errorResponse -> c.json) and store Google IDs as deterministic UUIDs
// (GoogleOAuthClient.googleIdToUuid).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { googleAuth, googleCallback, linkGoogleAccount } from '../../src/handlers/auth-google';
import { getGoogleOAuthClient, GoogleOAuthClient } from '../../src/lib/google-oauth.js';
import { db } from '../../src/db/connection.js';
import { users } from '../../src/db/schema.js';
import { eq } from 'drizzle-orm';

// Mock only the OAuth client factory; keep the real googleIdToUuid so the
// values we seed match exactly what the handler computes from googleUser.id.
vi.mock('../../src/lib/google-oauth.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/google-oauth.js')>();
  return {
    ...actual,
    getGoogleOAuthClient: vi.fn(),
  };
});
vi.mock('../../src/lib/notifications.js');

const toUuid = (googleId: string) => GoogleOAuthClient.googleIdToUuid(googleId);

const mockGoogleUser = (info: any) => {
  vi.mocked(getGoogleOAuthClient).mockReturnValue({
    getUserInfo: vi.fn().mockResolvedValue(info),
  } as any);
};

// Handler contract helpers: handlers call c.json(...) / c.redirect(...), so the
// mock context must provide them and return real Response objects.
const makeContext = (overrides: Record<string, any> = {}) => {
  const ctx = {
    set: vi.fn(),
    get: vi.fn(),
    redirect: vi.fn((url: string) => new Response(null, { status: 302, headers: { location: url } })),
    json: vi.fn(
      (data: unknown, status?: number) =>
        new Response(JSON.stringify(data), {
          status: status ?? 200,
          headers: { 'content-type': 'application/json' },
        }),
    ),
    req: {
      query: (_key: string) => undefined,
      json: async () => ({}),
    },
    ...overrides,
  };
  return ctx;
};

const queryCtx = (queries: Record<string, string>) =>
  makeContext({
    req: { query: (key: string) => queries[key], json: async () => ({}) },
  });

const deleteUsersByEmail = async (emails: string[]) => {
  for (const email of emails) {
    await db.delete(users).where(eq(users.email, email));
  }
};

describe('Google SSO Handlers', () => {
  describe('googleAuth', () => {
    it('should store oauth_state and redirect to the Google OAuth URL', async () => {
      mockGoogleUser({});
      vi.mocked(getGoogleOAuthClient).mockReturnValue({
        getAuthUrl: vi.fn().mockReturnValue('https://accounts.google.com/o/oauth2/auth?test=1'),
      } as any);

      const mockContext = makeContext();
      const response = await googleAuth(mockContext as any);

      expect(mockContext.set).toHaveBeenCalledWith('oauth_state', expect.any(String));
      expect(mockContext.redirect).toHaveBeenCalledWith(
        expect.stringContaining('accounts.google.com')
      );
      expect(response.status).toBe(302);
    });
  });

  describe('googleCallback - First-time user', () => {
    beforeEach(async () => {
      await deleteUsersByEmail(['test@example.com']);
    });

    afterEach(async () => {
      await deleteUsersByEmail(['test@example.com']);
    });

    it('should create pending user on first login', async () => {
      mockGoogleUser({
        id: 'google-123',
        email: 'test@example.com',
        given_name: 'Test',
        family_name: 'User',
        email_verified: true,
      });

      const response = await googleCallback(queryCtx({ code: 'test-code', state: 'test-state-12345' }) as any);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.requiresApproval).toBe(true);
      expect(body.data.token).toBeUndefined();

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'test@example.com'))
        .limit(1);

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.googleId).toBe(toUuid('google-123'));
      expect(user.approvalStatus).toBe('pending');
      expect(user.isActive).toBe(false);
    });

    it('should create notification for admins', async () => {
      // Unique username: the dev database already contains the seed admin
      // ("admin"), so reusing it violates users_username_key.
      await db.insert(users).values({
        username: 'qa_gauth_admin',
        email: 'qa_gauth_admin@example.com',
        passwordHash: 'hash',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
        approvalStatus: 'approved',
      });

      mockGoogleUser({
        id: 'google-456',
        email: 'newuser@example.com',
        given_name: 'New',
        family_name: 'User',
        email_verified: true,
      });

      await googleCallback(queryCtx({ code: 'test-code', state: 'test-state-12345' }) as any);

      const { createNotification } = await import('../../src/lib/notifications.js');
      expect(vi.mocked(createNotification)).toHaveBeenCalled();

      await deleteUsersByEmail(['newuser@example.com', 'qa_gauth_admin@example.com']);
    });
  });

  describe('googleCallback - Pending user', () => {
    beforeEach(async () => {
      await deleteUsersByEmail(['pending@example.com']);
      // google_id is a UUID column: seed the deterministic UUID the handler
      // derives from the Google sub id.
      await db.insert(users).values({
        username: 'pendinguser',
        email: 'pending@example.com',
        passwordHash: '',
        firstName: 'Pending',
        lastName: 'User',
        role: 'server',
        isActive: false,
        googleId: toUuid('google-pending-123'),
        approvalStatus: 'pending',
      });
    });

    afterEach(async () => {
      await deleteUsersByEmail(['pending@example.com']);
    });

    it('should not generate JWT for pending user', async () => {
      mockGoogleUser({
        id: 'google-pending-123',
        email: 'pending@example.com',
        given_name: 'Pending',
        family_name: 'User',
        email_verified: true,
      });

      const response = await googleCallback(queryCtx({ code: 'test-code', state: 'test-state-12345' }) as any);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.requiresApproval).toBe(true);
      expect(body.data.token).toBeUndefined();
    });
  });

  describe('googleCallback - Rejected user', () => {
    const insertRejected = (email: string, username: string, googleSub: string, lastRejectionAt: Date) =>
      db.insert(users).values({
        username,
        email,
        passwordHash: '',
        firstName: 'Rejected',
        lastName: 'User',
        role: 'server',
        isActive: false,
        googleId: toUuid(googleSub),
        approvalStatus: 'rejected',
        lastRejectionAt,
        rejectionCount: 1,
      });

    beforeEach(async () => {
      await deleteUsersByEmail(['rejected@example.com', 'oldrejected@example.com']);
    });

    afterEach(async () => {
      await deleteUsersByEmail(['rejected@example.com', 'oldrejected@example.com']);
    });

    it('should return 403 user_rejected for recently rejected user', async () => {
      await insertRejected('rejected@example.com', 'rejecteduser', 'google-rejected-123', new Date());

      mockGoogleUser({
        id: 'google-rejected-123',
        email: 'rejected@example.com',
        given_name: 'Rejected',
        family_name: 'User',
        email_verified: true,
      });

      const response = await googleCallback(queryCtx({ code: 'test-code', state: 'test-state-12345' }) as any);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error).toBe('user_rejected');
    });

    it('should reset to pending after 24h cooldown', async () => {
      const oldRejection = new Date();
      oldRejection.setHours(oldRejection.getHours() - 25);

      await insertRejected('oldrejected@example.com', 'oldrejected', 'google-old-rejected-123', oldRejection);

      mockGoogleUser({
        id: 'google-old-rejected-123',
        email: 'oldrejected@example.com',
        given_name: 'Old',
        family_name: 'Rejected',
        email_verified: true,
      });

      const response = await googleCallback(queryCtx({ code: 'test-code', state: 'test-state-12345' }) as any);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.requiresApproval).toBe(true);

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'oldrejected@example.com'))
        .limit(1);

      expect(user.approvalStatus).toBe('pending');
    });
  });

  describe('linkGoogleAccount', () => {
    let existingUser: any;

    beforeEach(async () => {
      await deleteUsersByEmail(['password@example.com']);
      [existingUser] = await db
        .insert(users)
        .values({
          username: 'qa_gauth_pwuser',
          email: 'password@example.com',
          passwordHash: 'hash',
          firstName: 'Password',
          lastName: 'User',
          role: 'manager',
          isActive: true,
          approvalStatus: 'approved',
        })
        .returning();
    });

    afterEach(async () => {
      await deleteUsersByEmail(['password@example.com']);
    });

    it('should link Google account to existing user', async () => {
      mockGoogleUser({
        id: 'google-link-123',
        email: 'password@example.com',
        given_name: 'Password',
        family_name: 'User',
        email_verified: true,
      });

      const mockContext = makeContext({
        get: vi.fn().mockReturnValue(existingUser.id),
        req: { json: vi.fn().mockResolvedValue({ code: 'link-code' }) },
      });

      const response = await linkGoogleAccount(mockContext as any);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.google_id).toBe(toUuid('google-link-123'));

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, existingUser.id))
        .limit(1);

      expect(user.googleId).toBe(toUuid('google-link-123'));
      expect(user.approvalStatus).toBe('approved'); // auto-approved on link
      expect(user.role).toBe('manager'); // existing role preserved
    });
  });
});
