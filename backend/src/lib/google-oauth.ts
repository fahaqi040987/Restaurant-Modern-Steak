import { google } from 'googleapis';
import crypto from 'crypto';

export interface GoogleUserInfo {
  id: string;
  email: string;
  given_name: string;
  family_name: string;
  picture?: string;
  email_verified: boolean;
  locale?: string;
}

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class GoogleOAuthClient {
  private oauth2Client: any;
  private config: GoogleOAuthConfig;

  constructor(config: GoogleOAuthConfig) {
    this.config = config;
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
  }

  /**
   * Generate the authorization URL for Google OAuth consent screen
   */
  getAuthUrl(state: string): string {
    const scopes = ['openid', 'profile', 'email'];
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent',
    });
  }

  /**
   * Exchange authorization code for tokens and get user info
   */
  async getUserInfo(code: string): Promise<GoogleUserInfo> {
    try {
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);

      if (!tokens.id_token) {
        throw new Error('No ID token received from Google');
      }

      // Verify ID token and get user info
      const login = await this.oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: this.config.clientId,
      });

      const payload = login.getPayload();
      if (!payload) {
        throw new Error('No payload in ID token');
      }

      return {
        id: payload.sub,
        email: payload.email || '',
        given_name: payload.given_name || '',
        family_name: payload.family_name || '',
        picture: payload.picture,
        email_verified: payload.email_verified || false,
        locale: payload.locale,
      };
    } catch (error) {
      throw new Error(`Failed to get user info from Google: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert Google ID to UUID format for database storage
   * Google uses a unique 'sub' claim (string), we convert to UUID-like format
   */
  static googleIdToUuid(googleId: string): string {
    // Create a deterministic UUID from the Google ID
    // This ensures the same Google ID always maps to the same UUID
    const hash = crypto
      .createHash('sha256')
      .update(googleId)
      .digest('hex');

    // Format as UUID (take first 32 hex chars)
    const uuidHex = hash.substring(0, 32);
    return [
      uuidHex.substring(0, 8),
      uuidHex.substring(8, 12),
      uuidHex.substring(12, 16),
      uuidHex.substring(16, 20),
      uuidHex.substring(20, 32),
    ].join('-');
  }
}

let clientInstance: GoogleOAuthClient | null = null;

export function getGoogleOAuthClient(): GoogleOAuthClient {
  if (!clientInstance) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/google/callback';

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    clientInstance = new GoogleOAuthClient({
      clientId,
      clientSecret,
      redirectUri,
    });
  }

  return clientInstance;
}
