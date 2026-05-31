// File: backend/test/lib/google-oauth.test.ts
import { describe, it, expect } from 'vitest';
import { GoogleOAuthClient } from '../../src/lib/google-oauth';

describe('GoogleOAuthClient', () => {
  describe('googleIdToUuid', () => {
    it('should convert Google ID to UUID format', () => {
      const googleId = '123456789012345678901';
      const uuid = GoogleOAuthClient.googleIdToUuid(googleId);

      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should produce consistent UUID for same Google ID', () => {
      const googleId = '123456789012345678901';
      const uuid1 = GoogleOAuthClient.googleIdToUuid(googleId);
      const uuid2 = GoogleOAuthClient.googleIdToUuid(googleId);

      expect(uuid1).toBe(uuid2);
    });

    it('should produce different UUIDs for different Google IDs', () => {
      const uuid1 = GoogleOAuthClient.googleIdToUuid('id1');
      const uuid2 = GoogleOAuthClient.googleIdToUuid('id2');

      expect(uuid1).not.toBe(uuid2);
    });
  });
});
