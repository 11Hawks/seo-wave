/**
 * Simplified Google API Service for Tests
 * Singleton pattern for easy testing and mocking
 */

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  scope?: string;
  token_type?: string;
  expires_in?: number;
}

export interface GoogleSearchConsoleData {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export class GoogleAPIService {
  private static instance: GoogleAPIService;
  private credentials: GoogleTokens | null = null;

  private constructor() {}

  static getInstance(): GoogleAPIService {
    if (!GoogleAPIService.instance) {
      GoogleAPIService.instance = new GoogleAPIService();
    }
    return GoogleAPIService.instance;
  }

  /**
   * Generate Google OAuth authorization URL
   */
  getAuthUrl(state?: string): string {
    const clientId = process.env.GOOGLE_CLIENT_ID || 'mock-client-id';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google/callback';
    const scope = 'https://www.googleapis.com/auth/webmasters.readonly';
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state })
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
    // In test/preview mode, return mock tokens
    if (process.env.NODE_ENV === 'test' || process.env.PREVIEW_MODE === 'true') {
      return {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        scope: 'https://www.googleapis.com/auth/webmasters.readonly',
        token_type: 'Bearer',
        expires_in: 3600
      };
    }

    // Production implementation would make actual API call to Google
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    
    const params = {
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!
    };

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params)
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    return await response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
    // In test/preview mode, return mock tokens
    if (process.env.NODE_ENV === 'test' || process.env.PREVIEW_MODE === 'true') {
      return {
        access_token: 'refreshed-mock-access-token',
        refresh_token: refreshToken, // Keep same refresh token
        scope: 'https://www.googleapis.com/auth/webmasters.readonly',
        token_type: 'Bearer',
        expires_in: 3600
      };
    }

    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    
    const params = {
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    };

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params)
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const tokens = await response.json();
    return {
      ...tokens,
      refresh_token: refreshToken // Include original refresh token if not returned
    };
  }

  /**
   * Set stored credentials
   */
  setCredentials(credentials: GoogleTokens): void {
    this.credentials = credentials;
  }

  /**
   * Get current credentials
   */
  getCredentials(): GoogleTokens | null {
    return this.credentials;
  }

  /**
   * Fetch Search Console data
   */
  async getSearchConsoleData(
    siteUrl: string, 
    startDate: string, 
    endDate: string
  ): Promise<GoogleSearchConsoleData[]> {
    // In test/preview mode, return mock data
    if (process.env.NODE_ENV === 'test' || process.env.PREVIEW_MODE === 'true') {
      return [
        { query: 'test query', clicks: 100, impressions: 1000, ctr: 0.1, position: 5.5 },
        { query: 'seo analytics', clicks: 75, impressions: 800, ctr: 0.094, position: 6.2 },
        { query: 'keyword tracking', clicks: 50, impressions: 600, ctr: 0.083, position: 7.1 }
      ];
    }

    if (!this.credentials) {
      throw new Error('No credentials available. Please authenticate first.');
    }

    // Production implementation would make actual API call
    const searchConsoleEndpoint = 'https://www.googleapis.com/webmasters/v3/sites/' + 
      encodeURIComponent(siteUrl) + '/searchAnalytics/query';

    const requestBody = {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 25000,
      startRow: 0
    };

    const response = await fetch(searchConsoleEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.credentials.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed');
      }
      throw new Error(`Google Search Console API error: ${response.status}`);
    }

    const data = await response.json();
    return data.rows?.map((row: any) => ({
      query: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position
    })) || [];
  }

  /**
   * Validate credentials are still valid
   */
  async validateCredentials(): Promise<boolean> {
    // In test/preview mode, always return true
    if (process.env.NODE_ENV === 'test' || process.env.PREVIEW_MODE === 'true') {
      return true;
    }

    if (!this.credentials) {
      return false;
    }

    try {
      // Try to make a simple API call to validate credentials
      const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
        headers: {
          'Authorization': `Bearer ${this.credentials.access_token}`,
        },
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Revoke access tokens
   */
  async revokeAccess(): Promise<void> {
    // In test/preview mode, just clear credentials
    if (process.env.NODE_ENV === 'test' || process.env.PREVIEW_MODE === 'true') {
      this.credentials = null;
      return;
    }

    if (!this.credentials) {
      return;
    }

    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${this.credentials.access_token}`, {
        method: 'POST',
      });
    } catch (error) {
      console.warn('Failed to revoke token with Google:', error);
    } finally {
      this.credentials = null;
    }
  }
}