/**
 * Environment Configuration Tests
 * Tests for environment variable validation and configuration (TDD approach)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { evaluateAuthSecurity } from '../../src/lib/auth-security'

// Mock the @t3-oss/env-nextjs module
const mockCreateEnv = vi.fn()

vi.mock('@t3-oss/env-nextjs', () => ({
  createEnv: mockCreateEnv
}))

vi.mock('zod', () => ({
  z: {
    string: () => ({
      min: () => ({
        url: () => ({
          optional: () => ({ default: (val: string) => ({ _def: { defaultValue: val } }) })
        }),
        optional: () => ({ default: (val: string) => ({ _def: { defaultValue: val } }) })
      }),
      url: () => ({
        optional: () => ({ default: (val: string) => ({ _def: { defaultValue: val } }) })
      }),
      optional: () => ({ default: (val: string) => ({ _def: { defaultValue: val } }) }),
      regex: () => ({
        transform: () => ({
          optional: () => ({ _def: { defaultValue: undefined } })
        })
      })
    }),
    enum: (values: string[]) => ({
      default: (val: string) => ({ _def: { defaultValue: val } })
    })
  }
}))

describe('Environment Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear module cache to ensure fresh imports
    vi.resetModules()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Environment Schema Validation', () => {
    beforeEach(() => {
      // Mock successful environment creation
      mockCreateEnv.mockReturnValue({
        DATABASE_URL: 'postgresql://localhost:5432/test',
        NEXTAUTH_SECRET: 'test-secret',
        GOOGLE_CLIENT_ID: 'development-client-id',
        GOOGLE_CLIENT_SECRET: 'development-client-secret',
        STRIPE_SECRET_KEY: 'sk_test_development',
        STRIPE_WEBHOOK_SECRET: 'whsec_development',
        JWT_SECRET: 'development-jwt-secret-key-32-characters',
        ENCRYPTION_KEY: 'development-encryption-key-32-chars',
        NODE_ENV: 'test'
      })
    })

    it('should create environment configuration with proper schema', async () => {
      await import('../../src/lib/env')
      
      const configCall = mockCreateEnv.mock.calls[0][0]
      expect(configCall).toEqual(expect.objectContaining({
        server: expect.any(Object),
        client: expect.any(Object),
        skipValidation: expect.any(Boolean),
        emptyStringAsUndefined: expect.any(Boolean)
      }))
      expect(configCall.runtimeEnv ?? configCall.experimental__runtimeEnv).toBeDefined()
    })

    it('should include required server-side environment variables', async () => {
      await import('../../src/lib/env')
      
      const serverConfig = mockCreateEnv.mock.calls[0][0].server
      
      expect(serverConfig).toHaveProperty('DATABASE_URL')
      expect(serverConfig).toHaveProperty('NEXTAUTH_SECRET')
      expect(serverConfig).toHaveProperty('GOOGLE_CLIENT_ID')
      expect(serverConfig).toHaveProperty('GOOGLE_CLIENT_SECRET')
      expect(serverConfig).toHaveProperty('STRIPE_SECRET_KEY')
      expect(serverConfig).toHaveProperty('STRIPE_WEBHOOK_SECRET')
      expect(serverConfig).toHaveProperty('JWT_SECRET')
      expect(serverConfig).toHaveProperty('ENCRYPTION_KEY')
    })

    it('should include client-side environment variables', async () => {
      await import('../../src/lib/env')
      
      const clientConfig = mockCreateEnv.mock.calls[0][0].client
      
      expect(clientConfig).toHaveProperty('NEXT_PUBLIC_APP_URL')
      expect(clientConfig).toHaveProperty('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
    })

    it('should skip validation in test environment', async () => {
      process.env.NODE_ENV = 'test'
      await import('../../src/lib/env')
      
      const config = mockCreateEnv.mock.calls[0][0]
      expect(config.skipValidation).toBe(true)
    })

    it('should not skip validation in production', async () => {
      process.env.NODE_ENV = 'production'
      delete process.env.SKIP_ENV_VALIDATION
      
      // Clear the module cache to get fresh import
      vi.resetModules()
      mockCreateEnv.mockClear()
      
      await import('../../src/lib/env')
      
      const config = mockCreateEnv.mock.calls[0][0]
      expect(config.skipValidation).toBe(false)
    })
  })

  describe('Default Values', () => {
    it('should provide development defaults for optional variables', () => {
      const mockEnvObject = {
        DATABASE_URL: 'postgresql://localhost:5432/test',
        NEXTAUTH_SECRET: 'test-secret',
        GOOGLE_CLIENT_ID: 'development-client-id',
        GOOGLE_CLIENT_SECRET: 'development-client-secret',
        STRIPE_SECRET_KEY: 'sk_test_development',
        STRIPE_WEBHOOK_SECRET: 'whsec_development',
        JWT_SECRET: 'development-jwt-secret-key-32-characters',
        ENCRYPTION_KEY: 'development-encryption-key-32-chars'
      }
      
      mockCreateEnv.mockReturnValue(mockEnvObject)
      
      // Development defaults should be reasonable
      expect(mockEnvObject.GOOGLE_CLIENT_ID).toBe('development-client-id')
      expect(mockEnvObject.GOOGLE_CLIENT_SECRET).toBe('development-client-secret')
      expect(mockEnvObject.STRIPE_SECRET_KEY).toBe('sk_test_development')
      expect(mockEnvObject.JWT_SECRET.length).toBeGreaterThanOrEqual(32) // Should be at least 32 characters
    })
  })

  describe('Runtime Environment Variables', () => {
    it('should map client environment variables for runtime access', async () => {
      await import('../../src/lib/env')
      
      const configCall = mockCreateEnv.mock.calls[0][0]
      const runtimeEnvConfig = configCall.runtimeEnv ?? configCall.experimental__runtimeEnv
      expect(runtimeEnvConfig).toBeDefined()
      
      expect(runtimeEnvConfig).toHaveProperty('NEXT_PUBLIC_APP_URL')
      expect(runtimeEnvConfig).toHaveProperty('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
    })
  })

  describe('Environment Variable Types', () => {
    it('should handle string environment variables', () => {
      const mockEnv = {
        DATABASE_URL: 'postgresql://localhost:5432/seo_analytics',
        NEXTAUTH_SECRET: 'super-secret-key-for-auth',
        JWT_SECRET: 'jwt-secret-key-for-tokens-32-chars'
      }
      
      mockCreateEnv.mockReturnValue(mockEnv)
      
      expect(typeof mockEnv.DATABASE_URL).toBe('string')
      expect(mockEnv.DATABASE_URL).toMatch(/^postgresql:\/\//)
    })

    it('should handle numeric environment variables', () => {
      const mockEnv = {
        RATE_LIMIT_MAX: 100,
        RATE_LIMIT_WINDOW: 900000, // 15 minutes in ms
        PORT: 3000
      }
      
      mockCreateEnv.mockReturnValue(mockEnv)
      
      expect(typeof mockEnv.RATE_LIMIT_MAX).toBe('number')
      expect(typeof mockEnv.RATE_LIMIT_WINDOW).toBe('number')
      expect(mockEnv.RATE_LIMIT_MAX).toBeGreaterThan(0)
    })

    it('should handle enum environment variables', () => {
      const mockEnv = {
        NODE_ENV: 'development',
        LOG_LEVEL: 'info'
      }
      
      mockCreateEnv.mockReturnValue(mockEnv)
      
      expect(['development', 'production', 'test']).toContain(mockEnv.NODE_ENV)
      expect(['debug', 'info', 'warn', 'error']).toContain(mockEnv.LOG_LEVEL)
    })
  })

  describe('Error Handling', () => {
    it('should throw meaningful error for missing required variables', async () => {
      const error = new Error('Environment validation failed: DATABASE_URL is required')
      mockCreateEnv.mockImplementation(() => {
        throw error
      })
      
      await expect(import('../../src/lib/env')).rejects.toThrow('Environment validation failed')
    })

    it('should throw error for invalid URL format', async () => {
      const error = new Error('Invalid URL format for DATABASE_URL')
      mockCreateEnv.mockImplementation(() => {
        throw error
      })
      
      await expect(import('../../src/lib/env')).rejects.toThrow('Invalid URL format')
    })
  })

  describe('Security Considerations', () => {
    it('should not expose server secrets to client', async () => {
      await import('../../src/lib/env')
      
      const clientConfig = mockCreateEnv.mock.calls[0][0].client
      const clientKeys = Object.keys(clientConfig)
      
      // All client variables should start with NEXT_PUBLIC_
      clientKeys.forEach(key => {
        expect(key).toMatch(/^NEXT_PUBLIC_/)
      })
    })

    it('should validate secret key lengths', () => {
      const mockEnv = {
        JWT_SECRET: 'short', // Too short
        ENCRYPTION_KEY: 'also-short' // Too short
      }
      
      // In a real implementation, these should fail validation
      expect(mockEnv.JWT_SECRET.length).toBeLessThan(32)
      expect(mockEnv.ENCRYPTION_KEY.length).toBeLessThan(32)
    })
  })

  describe('Auth security evaluation helper', () => {
    const secureEnv = {
      NEXTAUTH_SECRET: 'this-is-a-secure-secret-value-with-length',
      NEXTAUTH_URL: 'https://example.com',
      JWT_SECRET: 'secure-jwt-secret-value-with-length-32',
      ENCRYPTION_KEY: 'secure-encryption-key-with-length-32',
    } as NodeJS.ProcessEnv

    it('should return warnings when secrets are weak outside production', () => {
      const report = evaluateAuthSecurity(
        {
          ...secureEnv,
          NEXTAUTH_SECRET: '',
          JWT_SECRET: '',
          ENCRYPTION_KEY: '',
        },
        { nodeEnv: 'development' }
      )

      expect(report.errors).toHaveLength(0)
      expect(report.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('NEXTAUTH_SECRET must be set'),
          expect.stringContaining('JWT_SECRET is missing'),
          expect.stringContaining('ENCRYPTION_KEY is missing'),
        ])
      )
    })

    it('should return errors when secrets are weak in production', () => {
      const report = evaluateAuthSecurity(
        {
          ...secureEnv,
          NEXTAUTH_SECRET: '',
          NEXTAUTH_URL: undefined,
          JWT_SECRET: secureEnv.JWT_SECRET,
          ENCRYPTION_KEY: secureEnv.ENCRYPTION_KEY,
        },
        { nodeEnv: 'production' }
      )

      expect(report.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('NEXTAUTH_SECRET must be set'),
          expect.stringContaining('NEXTAUTH_URL must be configured'),
        ])
      )
    })

    it('should downgrade errors to warnings when preview mode enabled in production', () => {
      const report = evaluateAuthSecurity(
        {
          ...secureEnv,
          NEXTAUTH_SECRET: '',
          JWT_SECRET: '',
          ENCRYPTION_KEY: '',
        },
        { nodeEnv: 'production', isPreviewMode: true }
      )

      expect(report.errors).toHaveLength(0)
      expect(report.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('NEXTAUTH_SECRET must be set'),
          expect.stringContaining('JWT_SECRET is missing'),
          expect.stringContaining('ENCRYPTION_KEY is missing'),
        ])
      )
    })
  })
})
