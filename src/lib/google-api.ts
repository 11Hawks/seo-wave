/**
 * Google API Service Base Class
 * Handles authentication, rate limiting, and error handling for Google APIs
 */

import { OAuth2Client } from 'google-auth-library'

// Types
export interface GoogleAPICredentials {
  access_token: string
  refresh_token: string
  scope: string
  token_type: string
  expiry_date: number
}

export interface GoogleAPIError {
  code: number
  message: string
  errors?: Array<{
    domain: string
    reason: string
    message: string
  }>
}

export interface RateLimitStatus {
  remaining: number
  reset: number
  limit: number
}

/**
 * Base Google API Service Class
 * Provides common functionality for all Google API integrations
 */
export class GoogleAPIService {
  protected oauth2Client: OAuth2Client
  protected rateLimitKey: string

  constructor(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    service: string
  ) {
    this.oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri)
    this.rateLimitKey = `google_api_rate_limit:${service}`
  }

  /**
   * Generate OAuth2 authorization URL
   */
  generateAuthUrl(scopes: string[], userId: string): string {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: userId, // Pass userId for callback handling
    })
    
    return authUrl
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string): Promise<GoogleAPICredentials> {
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
   * Set credentials for the OAuth2 client
   */
  setCredentials(credentials: GoogleAPICredentials): void {
    this.oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
      scope: credentials.scope,
      token_type: credentials.token_type,
      expiry_date: credentials.expiry_date,
    })
  }

  /**
   * Refresh access token if expired
   */
  async refreshTokenIfNeeded(): Promise<GoogleAPICredentials | null> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken()
      
      if (credentials.access_token) {
        const updatedCredentials: GoogleAPICredentials = {
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || '',
          scope: credentials.scope || '',
          token_type: credentials.token_type || 'Bearer',
          expiry_date: credentials.expiry_date || Date.now() + 3600000,
        }
        
        this.setCredentials(updatedCredentials)
        return updatedCredentials
      }
      
      return null
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw new Error('Failed to refresh access token')
    }
  }

  /**
   * Check rate limit status
   */
  async checkRateLimit(): Promise<RateLimitStatus> {
    const now = Date.now()
    const windowStart = Math.floor(now / 60000) * 60000 // 1-minute windows
    const key = `${this.rateLimitKey}:${windowStart}`
    
    const current = await this.redis.get(key)
    const remaining = Math.max(0, 100 - parseInt(current || '0', 10))
    
    return {
      remaining,
      reset: windowStart + 60000,
      limit: 100,
    }
  }

  /**
   * Increment rate limit counter
   */
  async incrementRateLimit(): Promise<void> {
    const now = Date.now()
    const windowStart = Math.floor(now / 60000) * 60000
    const key = `${this.rateLimitKey}:${windowStart}`
    
    const pipeline = this.redis.pipeline()
    pipeline.incr(key)
    pipeline.expire(key, 60)
    await pipeline.exec()
  }

  /**
   * Wait if rate limit is exceeded
   */
  async waitForRateLimit(): Promise<void> {
    const rateLimitStatus = await this.checkRateLimit()
    
    if (rateLimitStatus.remaining <= 0) {
      const waitTime = rateLimitStatus.reset - Date.now()
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  /**
   * Handle Google API errors
   */
  protected handleAPIError(error: any): GoogleAPIError {
    if (error.response?.data?.error) {
      const apiError = error.response.data.error
      return {
        code: apiError.code || 500,
        message: apiError.message || 'Unknown Google API error',
        errors: apiError.errors || [],
      }
    }
    
    return {
      code: error.code || 500,
      message: error.message || 'Unknown error occurred',
    }
  }

  /**
   * Make authenticated API request with rate limiting
   */
  protected async makeAPIRequest<T>(
    apiCall: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      // Check and wait for rate limit
      await this.waitForRateLimit()
      
      // Increment rate limit counter
      await this.incrementRateLimit()
      
      // Make API call
      const result = await apiCall()
      
      return result
    } catch (error: any) {
      const apiError = this.handleAPIError(error)
      
      // Handle token refresh for 401 errors
      if (apiError.code === 401 && retryCount === 0) {
        try {
          await this.refreshTokenIfNeeded()
          return this.makeAPIRequest(apiCall, retryCount + 1)
        } catch (refreshError) {
          throw new Error('Authentication failed - please reconnect your Google account')
        }
      }
      
      // Handle rate limiting for 429 errors
      if (apiError.code === 429 && retryCount < 3) {
        const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 30000)
        await new Promise(resolve => setTimeout(resolve, backoffDelay))
        return this.makeAPIRequest(apiCall, retryCount + 1)
      }
      
      throw apiError
    }
  }

  /**
   * Store Google API credentials securely
   */
  async storeCredentials(
    userId: string,
    organizationId: string,
    service: 'SEARCH_CONSOLE' | 'ANALYTICS',
    credentials: GoogleAPICredentials,
    properties?: string[]
  ): Promise<void> {
    try {
      await this.prisma.googleIntegration.upsert({
        where: {
          userId_organizationId_service: {
            userId,
            organizationId,
            service,
          },
        },
        update: {
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token,
          tokenExpiry: new Date(credentials.expiry_date),
          scopes: credentials.scope.split(' '),
          properties: properties || [],
          isActive: true,
          lastSyncAt: new Date(),
        },
        create: {
          userId,
          organizationId,
          service,
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token,
          tokenExpiry: new Date(credentials.expiry_date),
          scopes: credentials.scope.split(' '),
          properties: properties || [],
          isActive: true,
          lastSyncAt: new Date(),
        },
      })
      
      // Log the integration activity
      await this.prisma.auditLog.create({
        data: {
          userId,
          organizationId,
          action: 'GOOGLE_API_CONNECTED',
          entityType: 'INTEGRATION',
          entityId: `${service}_${userId}`,
          metadata: {
            service,
            propertiesCount: properties?.length || 0,
            scopes: credentials.scope.split(' '),
          },
        },
      })
    } catch (error) {
      console.error('Error storing Google API credentials:', error)
      throw new Error('Failed to store Google API credentials')
    }
  }

  /**
   * Retrieve stored Google API credentials
   */
  async getStoredCredentials(
    userId: string,
    organizationId: string,
    service: 'SEARCH_CONSOLE' | 'ANALYTICS'
  ): Promise<GoogleAPICredentials | null> {
    try {
      const integration = await this.prisma.googleIntegration.findUnique({
        where: {
          userId_organizationId_service: {
            userId,
            organizationId,
            service,
          },
        },
      })
      
      if (!integration || !integration.isActive) {
        return null
      }
      
      // Check if token is expired
      const now = new Date()
      const isExpired = integration.tokenExpiry && integration.tokenExpiry < now
      
      if (isExpired) {
        // Try to refresh the token
        this.setCredentials({
          access_token: integration.accessToken,
          refresh_token: integration.refreshToken,
          scope: integration.scopes.join(' '),
          token_type: 'Bearer',
          expiry_date: integration.tokenExpiry?.getTime() || Date.now(),
        })
        
        const refreshedCredentials = await this.refreshTokenIfNeeded()
        
        if (refreshedCredentials) {
          // Update stored credentials
          await this.storeCredentials(
            userId,
            organizationId,
            service,
            refreshedCredentials,
            integration.properties
          )
          return refreshedCredentials
        } else {
          // Mark integration as inactive
          await this.prisma.googleIntegration.update({
            where: {
              userId_organizationId_service: {
                userId,
                organizationId,
                service,
              },
            },
            data: { isActive: false },
          })
          return null
        }
      }
      
      return {
        access_token: integration.accessToken,
        refresh_token: integration.refreshToken,
        scope: integration.scopes.join(' '),
        token_type: 'Bearer',
        expiry_date: integration.tokenExpiry?.getTime() || Date.now() + 3600000,
      }
    } catch (error) {
      console.error('Error retrieving Google API credentials:', error)
      return null
    }
  }
}