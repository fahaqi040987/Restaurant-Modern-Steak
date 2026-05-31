// File: backend/test/handlers/auth-google.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { googleAuth, googleCallback, linkGoogleAccount } from '../../src/handlers/auth-google';
import { db } from '../../src/db/connection.js';
import { users } from '../../src/db/schema.js';
import { eq } from 'drizzle-orm';

// Mock dependencies
vi.mock('../../src/lib/google-oauth.js');
vi.mock('../../src/lib/notifications.js');

describe('Google SSO Handlers', () => {
  describe('googleAuth', () => {
    it('should redirect to Google OAuth URL', async () => {
      const mockContext = {
        set: vi.fn(),
      };

      await googleAuth(mockContext as any);

      expect(mockContext.set).toHaveBeenCalledWith(
        'oauth_state',
        expect.any(String)
      );
    });
  });

  describe('googleCallback - First-time user', () => {
    beforeEach(async () => {
      // Clean up test data
      await db.delete(users).where(eq(users.email, 'test@example.com'));
    });

    afterEach(async () => {
      // Clean up test data
      await db.delete(users).where(eq(users.email, 'test@example.com'));
    });

    it('should create pending user on first login', async () => {
      const mockUserInfo = {
        id: 'google-123',
        email: 'test@example.com',
        given_name: 'Test',
        family_name: 'User',
        email_verified: true,
      };

      // Mock Google OAuth client
      const { getGoogleOAuthClient } = await import('../../src/lib/google-oauth.js');
      vi.mocked(getGoogleOAuthClient).mockReturnValue({
        getUserInfo: vi.fn().mockResolvedValue(mockUserInfo),
      } as any);

      const mockContext = {
        req: {
          query: (key: string) => {
            const queries: Record<string, string> = {
              code: 'test-code',
              state: 'test-state-12345',
            };
            return queries[key];
          },
        },
      };

      const response = await googleCallback(mockContext as any);

      // Verify user was created
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'test@example.com'))
        .limit(1);

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.approvalStatus).toBe('pending');
      expect(user.isActive).toBe(false);
    });

    it('should create notification for admins', async () => {
      // Create admin user
      await db
        .insert(users)
        .values({
          username: 'admin',
          email: 'admin@example.com',
          passwordHash: 'hash',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          isActive: true,
          approvalStatus: 'approved',
        });

      // Mock new user creation
      const mockUserInfo = {
        id: 'google-456',
        email: 'newuser@example.com',
        given_name: 'New',
        family_name: 'User',
        email_verified: true,
      };

      const { getGoogleOAuthClient } = await import('../../src/lib/google-oauth.js');
      vi.mocked(getGoogleOAuthClient).mockReturnValue({
        getUserInfo: vi.fn().mockResolvedValue(mockUserInfo),
      } as any);

      const mockContext = {
        req: {
          query: (key: string) => {
            const queries: Record<string, string> = {
              code: 'test-code',
              state: 'test-state-12345',
            };
            return queries[key];
          },
        },
      };

      await googleCallback(mockContext as any);

      // Verify notification was created (check mock calls)
      const { createNotification } = await import('../../src/lib/notifications.js');
      expect(vi.mocked(createNotification)).toHaveBeenCalled();

      // Clean up
      await db.delete(users).where(eq(users.email, 'newuser@example.com'));
      await db.delete(users).where(eq(users.email, 'admin@example.com'));
    });
  });

  describe('googleCallback - Pending user', () => {
    beforeEach(async () => {
      // Create pending user
      await db.insert(users).values({
        username: 'pendinguser',
        email: 'pending@example.com',
        passwordHash: '',
        firstName: 'Pending',
        lastName: 'User',
        role: 'server',
        isActive: false,
        googleId: 'google-pending-123',
        approvalStatus: 'pending',
      });
    });

    afterEach(async () => {
      await db.delete(users).where(eq(users.email, 'pending@example.com'));
    });

    it('should not generate JWT for pending user', async () => {
      const mockUserInfo = {
        id: 'google-pending-123',
        email: 'pending@example.com',
        given_name: 'Pending',
        family_name: 'User',
        email_verified: true,
      };

      const { getGoogleOAuthClient } = await import('../../src/lib/google-oauth.js');
      vi.mocked(getGoogleOAuthClient).mockReturnValue({
        getUserInfo: vi.fn().mockResolvedValue(mockUserInfo),
      } as any);

      const mockContext = {
        req: {
          query: (key: string) => {
            const queries: Record<string, string> = {
              code: 'test-code',
              state: 'test-state-12345',
            };
            return queries[key];
          },
        },
      };

      const response = await googleCallback(mockContext as any);

      expect(response.success).toBe(true);
      expect(response.requiresApproval).toBe(true);
      expect(response.token).toBeUndefined();
    });
  });

  describe('googleCallback - Rejected user', () => {
    beforeEach(async () => {
      // Create rejected user
      await db.insert(users).values({
        username: 'rejecteduser',
        email: 'rejected@example.com',
        passwordHash: '',
        firstName: 'Rejected',
        lastName: 'User',
        role: 'server',
        isActive: false,
        googleId: 'google-rejected-123',
        approvalStatus: 'rejected',
        lastRejectionAt: new Date(),
        rejectionCount: 1,
      });
    });

    afterEach(async () => {
      await db.delete(users).where(eq(users.email, 'rejected@example.com'));
    });

    it('should return retry_after for recently rejected user', async () => {
      const mockUserInfo = {
        id: 'google-rejected-123',
        email: 'rejected@example.com',
        given_name: 'Rejected',
        family_name: 'User',
        email_verified: true,
      };

      const { getGoogleOAuthClient } = await import('../../src/lib/google-oauth.js');
      vi.mocked(getGoogleOAuthClient).mockReturnValue({
        getUserInfo: vi.fn().mockResolvedValue(mockUserInfo),
      } as any);

      const mockContext = {
        req: {
          query: (key: string) => {
            const queries: Record<string, string> = {
              code: 'test-code',
              state: 'test-state-12345',
            };
            return queries[key];
          },
        },
      };

      const response = await googleCallback(mockContext as any);

      expect(response.success).toBe(false);
      expect(response.error).toBe('user_rejected');
      expect(response.retry_after).toBeDefined();
    });

    it('should reset to pending after 24h cooldown', async () => {
      // Create rejected user with old rejection time
      const oldRejection = new Date();
      oldRejection.setHours(oldRejection.getHours() - 25);

      await db
        .insert(users)
        .values({
          username: 'oldrejected',
          email: 'oldrejected@example.com',
          passwordHash: '',
          firstName: 'Old',
          lastName: 'Rejected',
          role: 'server',
          isActive: false,
          googleId: 'google-old-rejected-123',
          approvalStatus: 'rejected',
          lastRejectionAt: oldRejection,
          rejectionCount: 1,
        });

      const mockUserInfo = {
        id: 'google-old-rejected-123',
        email: 'oldrejected@example.com',
        given_name: 'Old',
        family_name: 'Rejected',
        email_verified: true,
      };

      const { getGoogleOAuthClient } = await import('../../src/lib/google-oauth.js');
      vi.mocked(getGoogleOAuthClient).mockReturnValue({
        getUserInfo: vi.fn().mockResolvedValue(mockUserInfo),
      } as any);

      const mockContext = {
        req: {
          query: (key: string) => {
            const queries: Record<string, string> = {
              code: 'test-code',
              state: 'test-state-12345',
            };
            return queries[key];
          },
        },
      };

      const response = await googleCallback(mockContext as any);

      expect(response.success).toBe(true);
      expect(response.requiresApproval).toBe(true);

      // Verify user was reset to pending
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'oldrejected@example.com'))
        .limit(1);

      expect(user.approvalStatus).toBe('pending');

      await db.delete(users).where(eq(users.email, 'oldrejected@example.com'));
    });
  });

  describe('linkGoogleAccount', () => {
    let existingUser: any;

    beforeEach(async () => {
      // Create existing password user
      [existingUser] = await db
        .insert(users)
        .values({
          username: 'passworduser',
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
      await db.delete(users).where(eq(users.email, 'password@example.com'));
    });

    it('should link Google account to existing user', async () => {
      const mockUserInfo = {
        id: 'google-link-123',
        email: 'password@example.com',
        given_name: 'Password',
        family_name: 'User',
        email_verified: true,
      };

      const { getGoogleOAuthClient, GoogleOAuthClient } = await import('../../src/lib/google-oauth.js');
      vi.mocked(getGoogleOAuthClient).mockReturnValue({
        getUserInfo: vi.fn().mockResolvedValue(mockUserInfo),
      } as any);
      vi.mocked(GoogleOAuthClient).googleIdToUuid = vi.fn().mockReturnValue('google-link-uuid-123');

      const mockContext = {
        get: vi.fn().mockReturnValue(existingUser.id),
        req: {
          json: vi.fn().mockResolvedValue({ code: 'link-code' }),
        },
      };

      const response = await linkGoogleAccount(mockContext as any);

      expect(response.success).toBe(true);
      expect(response.google_id).toBeDefined();

      // Verify user was updated
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, existingUser.id))
        .limit(1);

      expect(user.googleId).toBe('google-link-uuid-123');
      expect(user.approvalStatus).toBe('approved'); // Should remain approved
      expect(user.role).toBe('manager'); // Should preserve existing role
    });
  });
});
