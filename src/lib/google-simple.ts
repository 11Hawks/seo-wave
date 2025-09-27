/**
 * Simplified Google API Integration
 * Basic Google OAuth and API connection without complex dependencies
 */

import { OAuth2Client } from 'google-auth-library'

export interface GoogleCredentials {
  access_token: string
  refresh_token: string
  scope: string
  token_type: string
  expiry_date: number
}

export class SimpleGoogleService {
  private oauth2Client: OAuth2Client

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri)
  }

  /**
   * Generate OAuth2 authorization URL
   */
  generateAuthUrl(scopes: string[], userId: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: userId,
    })
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleCredentials> {
    try {
      const { tokens } = await this.oauth2Client.getTokens(code)
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Invalid tokens received from Google')
      }

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || '',
        scope: tokens.scope || '',
        token_type: tokens.token_type || 'Bearer',
        expiry_date: tokens.expiry_date || Date.now() + 3600000,
      }
    } catch (error) {
      console.error('Error exchanging code for tokens:', error)
      throw new Error('Failed to authenticate with Google')
    }
  }

  /**
   * Set credentials for future API calls
   */
  setCredentials(credentials: GoogleCredentials): void {
    this.oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
      scope: credentials.scope,
      token_type: credentials.token_type,
      expiry_date: credentials.expiry_date,
    })
  }

  /**
   * Refresh access token if needed
   */
  async refreshToken(): Promise<GoogleCredentials | null> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken()
      
      if (credentials.access_token) {
        return {
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || '',
          scope: credentials.scope || '',
          token_type: credentials.token_type || 'Bearer',
          expiry_date: credentials.expiry_date || Date.now() + 3600000,
        }
      }
      
      return null
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw new Error('Failed to refresh access token')
    }
  }

  /**
   * Get authenticated client for API calls
   */
  getAuthClient(): OAuth2Client {
    return this.oauth2Client
  }
}