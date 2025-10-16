/**
 * API Route Tests - Health Endpoint
 * Tests the working health route to establish baseline patterns
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/health/route'

// Mock rate limiting
vi.mock('@/lib/rate-limiting-unified', () => ({
  rateLimitAPI: vi.fn(async () => ({
    success: true,
    remaining: 99,
    reset: Date.now() + 60000,
    totalHits: 1,
    limit: 100
  }))
}))

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 200 with health status', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('status', 'healthy')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('version')
    expect(data).toHaveProperty('environment')
  })

  it('should include rate limit headers', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    
    expect(response.headers.get('X-RateLimit-Limit')).toBe('100')
    expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy()
    expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy()
  })

  it('should handle rate limit exceeded', async () => {
    const { rateLimitAPI } = await import('@/lib/rate-limiting-unified')
    vi.mocked(rateLimitAPI).mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
      totalHits: 101,
      limit: 100,
      resetTime: Date.now() + 60000
    })

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    
    expect(response.status).toBe(429)
    
    const data = await response.json()
    expect(data).toHaveProperty('error', 'Rate limit exceeded')
  })

  it('should return valid timestamp in ISO format', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()
    
    expect(() => new Date(data.timestamp)).not.toThrow()
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp)
  })

  it('should return environment from NODE_ENV', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'test'
    
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()
    
    expect(data.environment).toBe('test')
    
    process.env.NODE_ENV = originalEnv
  })
})
