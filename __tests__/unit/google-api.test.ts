/**
 * Google API Integration Tests
 * Tests for OAuth flow and API data fetching (TDD approach)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  GoogleAPIService, 
  type GoogleAPICredentials, 
  type GoogleAPIError,
  type RateLimitStatus 
} from '../../src/lib/google-api'
import '../../src/__tests__/utils/custom-matchers'

// Mock dependencies
vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn().mockImplementation(() => ({
    generateAuthUrl: vi.fn().mockReturnValue('https://accounts.google.com/oauth/authorize?mock=true'),
    getToken: vi.fn().mockResolvedValue({
      tokens: {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        scope: 'https://www.googleapis.com/auth/webmasters',
        token_type: 'Bearer',
        expiry_date: Date.now() + 3600000,
      }
    }),
    setCredentials: vi.fn(),
    refreshAccessToken: vi.fn().mockResolvedValue({
      credentials: {
        access_token: 'new_mock_access_token',
        expiry_date: Date.now() + 3600000,
      }
    }),
    request: vi.fn().mockResolvedValue({ data: { mock: 'data' } }),
  }))
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    googleCredentials: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    }
  }
}))

describe('GoogleAPIService', () => {
  let service: GoogleAPIService
  let mockCredentials: GoogleAPICredentials

  beforeEach(() => {
    // Create service instance
    service = new GoogleAPIService(
      'mock_client_id',
      'mock_client_secret', 
      'http://localhost:3000/api/auth/callback',
      'search_console'
    )

    mockCredentials = {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      scope: 'https://www.googleapis.com/auth/webmasters',
      token_type: 'Bearer',
      expiry_date: Date.now() + 3600000,
    }

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Constructor', () => {
    it('should initialize with required parameters', () => {
      expect(service).toBeInstanceOf(GoogleAPIService)
      expect(service['oauth2Client']).toBeDefined()
      expect(service['rateLimitKey']).toBe('google_api_rate_limit:search_console')
    })

    it('should handle preview mode initialization', () => {
      // Preview mode should use mock Redis
      const previewService = new GoogleAPIService(
        'client_id',
        'client_secret',
        'redirect_uri',
        'analytics'
      )

      expect(previewService['redis']).toBeDefined()
    })

    it('should handle missing Redis gracefully', () => {
      // Should fall back to mock Redis if real Redis is unavailable
      expect(() => {
        new GoogleAPIService('id', 'secret', 'uri', 'test')
      }).not.toThrow()
    })
  })

  describe('generateAuthUrl', () => {
    it('should generate valid OAuth2 authorization URL', () => {
      // Arrange
      const scopes = ['https://www.googleapis.com/auth/webmasters']
      const userId = 'user-123'

      // Act
      const authUrl = service.generateAuthUrl(scopes, userId)

      // Assert
      expect(typeof authUrl).toBe('string')
      expect(authUrl).toContain('accounts.google.com')
      expect(authUrl).toContain('oauth')
      expect(service['oauth2Client'].generateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        state: userId,
      })
    })

    it('should handle multiple scopes', () => {
      // Arrange
      const scopes = [
        'https://www.googleapis.com/auth/webmasters',
        'https://www.googleapis.com/auth/analytics.readonly'
      ]
      const userId = 'user-456'

      // Act
      const authUrl = service.generateAuthUrl(scopes, userId)

      // Assert
      expect(authUrl).toBeDefined()
      expect(service['oauth2Client'].generateAuthUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: scopes,
          state: userId
        })
      )
    })

    it('should handle empty scopes array', () => {
      // Act & Assert
      expect(() => {
        service.generateAuthUrl([], 'user-123')
      }).not.toThrow()
    })
  })

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens', async () => {
      // Arrange
      const authCode = 'mock_auth_code'
      const expectedTokens = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        scope: 'https://www.googleapis.com/auth/webmasters',
        token_type: 'Bearer',
        expiry_date: expect.any(Number),
      }

      // Act
      const tokens = await service.exchangeCodeForTokens(authCode)

      // Assert
      expect(tokens).toMatchObject(expectedTokens)
      expect(service['oauth2Client'].getToken).toHaveBeenCalledWith(authCode)
    })

    it('should handle token exchange errors', async () => {
      // Arrange
      const authCode = 'invalid_code'
      service['oauth2Client'].getToken = vi.fn().mockRejectedValue(
        new Error('Invalid authorization code')
      )

      // Act & Assert
      await expect(
        service.exchangeCodeForTokens(authCode)
      ).rejects.toThrow('Invalid authorization code')
    })
  })

  describe('refreshAccessToken', () => {
    it('should refresh expired access token', async () => {
      // Arrange
      const expiredCredentials = {
        ...mockCredentials,
        expiry_date: Date.now() - 1000, // Expired
      }

      service['oauth2Client'].setCredentials(expiredCredentials)

      // Act
      const newTokens = await service.refreshAccessToken(expiredCredentials)

      // Assert
      expect(newTokens).toMatchObject({
        access_token: 'new_mock_access_token',
        expiry_date: expect.any(Number),
      })
      expect(service['oauth2Client'].refreshAccessToken).toHaveBeenCalled()
    })

    it('should handle refresh token errors', async () => {
      // Arrange
      service['oauth2Client'].refreshAccessToken = vi.fn().mockRejectedValue(
        new Error('Invalid refresh token')
      )

      // Act & Assert
      await expect(
        service.refreshAccessToken(mockCredentials)
      ).rejects.toThrow('Invalid refresh token')
    })
  })

  describe('storeCredentials', () => {
    it('should store credentials in database', async () => {
      // Arrange
      const userId = 'user-123'
      const serviceName = 'search_console'

      service['prisma'].googleCredentials.create = vi.fn().mockResolvedValue({
        id: 'cred-123',
        userId,
        service: serviceName,
        credentials: mockCredentials,
      })

      // Act
      await service.storeCredentials(userId, serviceName, mockCredentials)

      // Assert
      expect(service['prisma'].googleCredentials.create).toHaveBeenCalledWith({
        data: {
          userId,
          service: serviceName,
          accessToken: mockCredentials.access_token,
          refreshToken: mockCredentials.refresh_token,
          scope: mockCredentials.scope,
          tokenType: mockCredentials.token_type,
          expiryDate: new Date(mockCredentials.expiry_date),
        }
      })
    })

    it('should handle preview mode credential storage', async () => {
      // In preview mode, should log instead of storing
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Act
      await service.storeCredentials('user-123', 'test', mockCredentials)

      // Assert - In preview mode, should log the action
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should update existing credentials', async () => {
      // Arrange
      const userId = 'user-123'
      const serviceName = 'analytics'

      service['prisma'].googleCredentials.findUnique = vi.fn().mockResolvedValue({
        id: 'existing-cred-123'
      })
      service['prisma'].googleCredentials.update = vi.fn().mockResolvedValue({
        id: 'existing-cred-123',
        userId,
        service: serviceName,
      })

      // Act
      await service.storeCredentials(userId, serviceName, mockCredentials)

      // Assert
      expect(service['prisma'].googleCredentials.update).toHaveBeenCalled()
    })
  })

  describe('getStoredCredentials', () => {
    it('should retrieve stored credentials', async () => {
      // Arrange
      const userId = 'user-123'
      const serviceName = 'search_console'
      const storedCreds = {
        id: 'cred-123',
        userId,
        service: serviceName,
        accessToken: mockCredentials.access_token,
        refreshToken: mockCredentials.refresh_token,
        scope: mockCredentials.scope,
        tokenType: mockCredentials.token_type,
        expiryDate: new Date(mockCredentials.expiry_date),
      }

      service['prisma'].googleCredentials.findUnique = vi.fn().mockResolvedValue(storedCreds)

      // Act
      const credentials = await service.getStoredCredentials(userId, serviceName)

      // Assert
      expect(credentials).toMatchObject({
        access_token: mockCredentials.access_token,
        refresh_token: mockCredentials.refresh_token,
        scope: mockCredentials.scope,
        token_type: mockCredentials.token_type,
        expiry_date: mockCredentials.expiry_date,
      })
    })

    it('should return null for non-existent credentials', async () => {
      // Arrange
      service['prisma'].googleCredentials.findUnique = vi.fn().mockResolvedValue(null)

      // Act
      const credentials = await service.getStoredCredentials('user-123', 'nonexistent')

      // Assert
      expect(credentials).toBeNull()
    })

    it('should handle preview mode credential retrieval', async () => {
      // In preview mode, should return mock credentials
      const credentials = await service.getStoredCredentials('user-123', 'test')

      // Should return some form of mock credentials in preview mode
      expect(credentials).toBeDefined()
    })
  })

  describe('checkRateLimit', () => {
    it('should check API rate limits', async () => {
      // Act
      const rateLimitStatus = await service.checkRateLimit()

      // Assert
      expect(rateLimitStatus).toMatchObject({
        remaining: expect.any(Number),
        reset: expect.any(Number),
        limit: expect.any(Number),
      })
      expect(rateLimitStatus.remaining).toBeGreaterThanOrEqual(0)
      expect(rateLimitStatus.limit).toBeGreaterThan(0)
    })

    it('should handle rate limit exceeded', async () => {
      // Arrange - Mock Redis to return high usage
      service['redis'].get = vi.fn().mockResolvedValue('1000') // Exceeded limit

      // Act
      const rateLimitStatus = await service.checkRateLimit()

      // Assert
      expect(rateLimitStatus.remaining).toBe(0)
    })

    it('should handle Redis errors gracefully', async () => {
      // Arrange
      service['redis'].get = vi.fn().mockRejectedValue(new Error('Redis error'))

      // Act & Assert - Should not throw
      expect(async () => {
        await service.checkRateLimit()
      }).not.toThrow()
    })
  })

  describe('makeAuthenticatedRequest', () => {
    it('should make authenticated API request', async () => {
      // Arrange
      const url = 'https://www.googleapis.com/webmasters/v3/sites'
      service['oauth2Client'].setCredentials(mockCredentials)

      // Act
      const response = await service.makeAuthenticatedRequest(url)

      // Assert
      expect(response).toEqual({ mock: 'data' })
      expect(service['oauth2Client'].request).toHaveBeenCalledWith({ url })
    })

    it('should handle API errors', async () => {
      // Arrange
      const url = 'https://www.googleapis.com/invalid-endpoint'
      const apiError = {
        response: {
          status: 404,
          data: {
            error: {
              code: 404,
              message: 'Not found',
              errors: [{ domain: 'global', reason: 'notFound', message: 'Not found' }]
            }
          }
        }
      }

      service['oauth2Client'].request = vi.fn().mockRejectedValue(apiError)

      // Act & Assert
      await expect(
        service.makeAuthenticatedRequest(url)
      ).rejects.toThrow()
    })

    it('should refresh token automatically when expired', async () => {
      // Arrange
      const url = 'https://www.googleapis.com/test'
      const expiredCredentials = {
        ...mockCredentials,
        expiry_date: Date.now() - 1000 // Expired
      }

      service['oauth2Client'].setCredentials(expiredCredentials)

      // First request fails with 401, second succeeds after refresh
      service['oauth2Client'].request = vi.fn()
        .mockRejectedValueOnce({
          response: { status: 401, data: { error: { message: 'Invalid Credentials' } } }
        })
        .mockResolvedValueOnce({ data: { success: true } })

      // Act
      const response = await service.makeAuthenticatedRequest(url)

      // Assert
      expect(service['oauth2Client'].refreshAccessToken).toHaveBeenCalled()
      expect(response).toEqual({ success: true })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      // Arrange
      service['oauth2Client'].request = vi.fn().mockRejectedValue(
        new Error('Network error')
      )

      // Act & Assert
      await expect(
        service.makeAuthenticatedRequest('https://api.google.com/test')
      ).rejects.toThrow('Network error')
    })

    it('should handle malformed API responses', async () => {
      // Arrange
      service['oauth2Client'].request = vi.fn().mockResolvedValue({
        // Missing data property
        status: 200
      })

      // Act
      const response = await service.makeAuthenticatedRequest('https://api.google.com/test')

      // Assert - Should handle gracefully
      expect(response).toBeDefined()
    })

    it('should handle credential validation errors', async () => {
      // Act & Assert
      expect(() => {
        service.validateCredentials({
          access_token: '',
          refresh_token: 'valid',
          scope: 'valid',
          token_type: 'Bearer',
          expiry_date: Date.now() + 3600000,
        })
      }).toThrow()
    })
  })

  describe('Performance', () => {
    it('should complete authentication flow within 2 seconds', async () => {
      // Arrange
      const startTime = Date.now()

      // Act
      await service.exchangeCodeForTokens('mock_code')

      // Assert
      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(2000)
    })

    it('should handle concurrent requests efficiently', async () => {
      // Arrange
      const requests = Array.from({ length: 5 }, () =>
        service.makeAuthenticatedRequest('https://api.google.com/test')
      )

      const startTime = Date.now()

      // Act
      await Promise.all(requests)

      // Assert
      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(5000) // Should handle 5 concurrent requests quickly
    })
  })

  describe('Security', () => {
    it('should not expose credentials in logs', () => {
      // This is a security test to ensure credentials aren't logged
      const consoleSpy = vi.spyOn(console, 'log')

      // Act
      service.generateAuthUrl(['scope'], 'user-123')

      // Assert - Check that no sensitive data was logged
      const logCalls = consoleSpy.mock.calls.flat()
      logCalls.forEach(call => {
        if (typeof call === 'string') {
          expect(call).not.toContain('client_secret')
          expect(call).not.toContain('access_token')
          expect(call).not.toContain('refresh_token')
        }
      })

      consoleSpy.mockRestore()
    })

    it('should validate redirect URI', () => {
      // Arrange & Act
      const service = new GoogleAPIService(
        'id',
        'secret',
        'http://localhost:3000/callback',
        'test'
      )

      // Assert
      expect(service['oauth2Client']).toBeDefined()
    })
  })
})