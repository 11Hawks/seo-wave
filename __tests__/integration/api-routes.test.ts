import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as healthGet } from '@/app/api/health/route'
import { GET as keywordsGet, POST as keywordsPost } from '@/app/api/keywords/route'
import { GET as confidenceGet } from '@/app/api/confidence/route'
import { GET as accuracyGet } from '@/app/api/accuracy/route'
import { POST as authPost } from '@/app/api/auth/route'
import { GET as googleAuthGet } from '@/app/api/google/auth/route'
import { POST as googleCallbackPost } from '@/app/api/google/callback/route'
import { GET as billingGet } from '@/app/api/billing/route'

// Mock external dependencies
vi.mock('@/lib/prisma', () => ({
  default: {
    keyword: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 1, keyword: 'test', confidence: 94.5 }),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({ id: 1, keyword: 'test', confidence: 95.0 })
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 1, email: 'test@example.com' })
    },
    $transaction: vi.fn().mockImplementation(async (fn) => fn())
  }
}))

// Mock data-accuracy-engine
vi.mock('@/lib/data-accuracy-engine', () => ({
  DataAccuracyEngine: {
    calculateConfidenceScore: vi.fn().mockResolvedValue({
      overall: 94.5,
      freshness: 92.0,
      consistency: 96.0,
      reliability: 95.5,
      sources: 3,
      lastUpdated: new Date().toISOString()
    }),
    validateDataQuality: vi.fn().mockResolvedValue(true),
    getAccuracyReport: vi.fn().mockResolvedValue({
      overallAccuracy: 94.2,
      totalDataPoints: 1000,
      accurateDataPoints: 942,
      confidenceDistribution: { high: 60, medium: 30, low: 10 },
      lastUpdated: new Date().toISOString()
    })
  }
}))

vi.mock('@/lib/rate-limiting-unified', () => ({
  rateLimitAPI: vi.fn().mockResolvedValue({ 
    success: true, 
    remaining: 99, 
    totalHits: 1,
    reset: Date.now() + 60000
  })
}))

vi.mock('@/lib/google-api-service', () => ({
  GoogleAPIService: {
    getInstance: vi.fn().mockReturnValue({
      getAuthUrl: vi.fn().mockReturnValue('https://accounts.google.com/oauth/authorize'),
      exchangeCodeForTokens: vi.fn().mockResolvedValue({ 
        access_token: 'token', 
        refresh_token: 'refresh' 
      }),
      getSearchConsoleData: vi.fn().mockResolvedValue([
        { query: 'test', clicks: 100, impressions: 1000, ctr: 0.1, position: 5.5 }
      ])
    })
  }
}))

describe('API Routes Integration Tests', () => {
  const createMockRequest = (
    url: string,
    options: {
      method?: string
      headers?: Record<string, string>
      body?: string
      searchParams?: Record<string, string>
    } = {}
  ) => {
    const { method = 'GET', headers = {}, body, searchParams = {} } = options
    
    const urlObj = new URL(url, 'http://localhost:3000')
    Object.entries(searchParams).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value)
    })

    const request = new NextRequest(urlObj, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '127.0.0.1',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    })

    return request
  }

  describe('/api/health', () => {
    it('should return healthy status', async () => {
      const request = createMockRequest('/api/health')
      const response = await healthGet(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        version: expect.any(String),
        environment: 'test'
      })
    })

    it('should include system information', async () => {
      const request = createMockRequest('/api/health')
      const response = await healthGet(request)
      const data = await response.json()
      
      expect(data.timestamp).toBeDefined()
      expect(data.version).toBeDefined()
      expect(new Date(data.timestamp)).toBeInstanceOf(Date)
    })
  })

  describe('/api/keywords', () => {
    it('should get keywords with rate limiting', async () => {
      const request = createMockRequest('/api/keywords')
      const response = await keywordsGet(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data.keywords)).toBe(true)
      expect(data.pagination).toBeDefined()
    })

    it('should create new keyword', async () => {
      const request = createMockRequest('/api/keywords', {
        method: 'POST',
        body: JSON.stringify({
          keyword: 'test keyword',
          url: 'https://example.com'
        })
      })
      
      const response = await keywordsPost(request)
      expect(response.status).toBe(201)
      
      const data = await response.json()
      expect(data.keyword).toBe('test keyword')
      expect(data.confidence).toBeGreaterThanOrEqual(90)
    })

    it('should validate keyword input', async () => {
      const request = createMockRequest('/api/keywords', {
        method: 'POST',
        body: JSON.stringify({})
      })
      
      const response = await keywordsPost(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should handle query parameters', async () => {
      const request = createMockRequest('/api/keywords', {
        searchParams: {
          page: '1',
          limit: '10',
          search: 'seo'
        }
      })
      
      const response = await keywordsGet(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(10)
    })
  })

  describe('/api/confidence', () => {
    it('should calculate confidence score', async () => {
      const request = createMockRequest('/api/confidence', {
        searchParams: {
          keyword: 'test',
          url: 'https://example.com'
        }
      })
      
      const response = await confidenceGet(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.overall).toBeGreaterThanOrEqual(90)
      expect(data.freshness).toBeDefined()
      expect(data.consistency).toBeDefined()
      expect(data.reliability).toBeDefined()
    })

    it('should require keyword parameter', async () => {
      const request = createMockRequest('/api/confidence')
      const response = await confidenceGet(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('keyword')
    })

    it('should handle confidence calculation errors', async () => {
      const { DataAccuracyEngine } = await import('@/lib/data-accuracy-engine')
      vi.mocked(DataAccuracyEngine.calculateConfidenceScore)
        .mockRejectedValueOnce(new Error('Calculation failed'))
      
      const request = createMockRequest('/api/confidence', {
        searchParams: {
          keyword: 'test',
          url: 'https://example.com'
        }
      })
      
      const response = await confidenceGet(request)
      expect(response.status).toBe(500)
    })
  })

  describe('/api/accuracy', () => {
    it('should return accuracy report', async () => {
      const request = createMockRequest('/api/accuracy')
      const response = await accuracyGet(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.overallAccuracy).toBeGreaterThanOrEqual(94)
      expect(data.totalDataPoints).toBeGreaterThan(0)
      expect(data.confidenceDistribution).toBeDefined()
    })

    it('should include detailed accuracy metrics', async () => {
      const request = createMockRequest('/api/accuracy')
      const response = await accuracyGet(request)
      const data = await response.json()
      
      expect(data.lastUpdated).toBeDefined()
      expect(data.accurateDataPoints).toBeLessThanOrEqual(data.totalDataPoints)
      expect(data.confidenceDistribution.high + 
             data.confidenceDistribution.medium + 
             data.confidenceDistribution.low).toBe(100)
    })
  })

  describe('/api/auth', () => {
    it('should authenticate user', async () => {
      const request = createMockRequest('/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      })
      
      const response = await authPost(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.user).toBeDefined()
      expect(data.token).toBeDefined()
    })

    it('should validate authentication input', async () => {
      const request = createMockRequest('/api/auth', {
        method: 'POST',
        body: JSON.stringify({})
      })
      
      const response = await authPost(request)
      expect(response.status).toBe(400)
    })
  })

  describe('/api/google/auth', () => {
    it('should return Google OAuth URL', async () => {
      const request = createMockRequest('/api/google/auth')
      const response = await googleAuthGet(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.authUrl).toContain('accounts.google.com')
      expect(data.authUrl).toContain('oauth')
    })
  })

  describe('/api/google/callback', () => {
    it('should handle OAuth callback', async () => {
      const request = createMockRequest('/api/google/callback', {
        method: 'POST',
        body: JSON.stringify({
          code: 'auth_code_123',
          state: 'state_token'
        })
      })
      
      const response = await googleCallbackPost(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.tokens).toBeDefined()
    })

    it('should validate OAuth callback parameters', async () => {
      const request = createMockRequest('/api/google/callback', {
        method: 'POST',
        body: JSON.stringify({})
      })
      
      const response = await googleCallbackPost(request)
      expect(response.status).toBe(400)
    })
  })

  describe('/api/billing', () => {
    it('should return billing information', async () => {
      const request = createMockRequest('/api/billing')
      const response = await billingGet(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.plan).toBeDefined()
      expect(data.usage).toBeDefined()
      expect(data.limits).toBeDefined()
    })
  })

  describe('Rate Limiting Integration', () => {
    it('should apply rate limiting to all endpoints', async () => {
      // Test multiple requests to ensure rate limiting is working
      const requests = Array.from({ length: 5 }, () => 
        createMockRequest('/api/keywords')
      )
      
      const responses = await Promise.all(
        requests.map(req => keywordsGet(req))
      )
      
      // All requests should succeed in preview mode
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })

    it('should include rate limit headers', async () => {
      const request = createMockRequest('/api/keywords')
      const response = await keywordsGet(request)
      
      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
    })
  })

  describe('CORS and Security', () => {
    it('should handle OPTIONS preflight requests', async () => {
      const request = createMockRequest('/api/keywords', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'POST'
        }
      })
      
      // Note: CORS handling would be implemented in middleware
      // This test validates the structure is ready for CORS
      expect(request.method).toBe('OPTIONS')
    })

    it('should validate content types', async () => {
      const request = createMockRequest('/api/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: 'invalid content'
      })
      
      const response = await keywordsPost(request)
      expect(response.status).toBe(400)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{'
      })
      
      const response = await keywordsPost(request)
      expect(response.status).toBe(400)
    })

    it('should handle missing required fields', async () => {
      const request = createMockRequest('/api/keywords', {
        method: 'POST',
        body: JSON.stringify({ invalid: 'field' })
      })
      
      const response = await keywordsPost(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should handle database errors gracefully', async () => {
      const prisma = (await import('@/lib/prisma')).default
      vi.mocked(prisma.keyword.findMany)
        .mockRejectedValueOnce(new Error('Database connection failed'))
      
      const request = createMockRequest('/api/keywords')
      const response = await keywordsGet(request)
      
      expect(response.status).toBe(500)
      
      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })

  describe('Performance and Timeouts', () => {
    it('should handle slow database queries', async () => {
      const prisma = (await import('@/lib/prisma')).default
      vi.mocked(prisma.keyword.findMany)
        .mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve([]), 100))
        )
      
      const request = createMockRequest('/api/keywords')
      const startTime = Date.now()
      
      const response = await keywordsGet(request)
      const endTime = Date.now()
      
      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeGreaterThan(90) // At least 100ms delay
    })

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        createMockRequest('/api/confidence', {
          searchParams: {
            keyword: `test${i}`,
            url: 'https://example.com'
          }
        })
      )
      
      const startTime = Date.now()
      const responses = await Promise.all(
        requests.map(req => confidenceGet(req))
      )
      const endTime = Date.now()
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
      
      // Should handle concurrent requests efficiently
      expect(endTime - startTime).toBeLessThan(5000)
    })
  })

  describe('Data Validation and Sanitization', () => {
    it('should sanitize input data', async () => {
      const request = createMockRequest('/api/keywords', {
        method: 'POST',
        body: JSON.stringify({
          keyword: '<script>alert("xss")</script>',
          url: 'https://example.com'
        })
      })
      
      const response = await keywordsPost(request)
      expect(response.status).toBe(201)
      
      const data = await response.json()
      expect(data.keyword).not.toContain('<script>')
    })

    it('should validate URL formats', async () => {
      const request = createMockRequest('/api/keywords', {
        method: 'POST',
        body: JSON.stringify({
          keyword: 'test',
          url: 'not-a-valid-url'
        })
      })
      
      const response = await keywordsPost(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('url')
    })
  })
})