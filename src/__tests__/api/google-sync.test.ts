/**
 * API Route Tests - Google Sync
 * Tests the fixed google/sync route with service factory pattern
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/google/sync/route'

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com'
    }
  }))
}))

vi.mock('@/lib/rate-limiting-unified', () => ({
  rateLimitAPI: vi.fn(async () => ({
    success: true,
    remaining: 29,
    reset: Date.now() + 60000,
    totalHits: 1,
    limit: 30,
    resetTime: Date.now() + 60000
  }))
}))

vi.mock('@/lib/service-factory', () => ({
  getRedisClient: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    quit: vi.fn()
  })),
  getPrismaClient: vi.fn(() => ({
    project: {
      findFirst: vi.fn(async () => ({
        id: 'test-project-id',
        organization: { id: 'test-org-id' }
      }))
    },
    googleIntegration: {
      findMany: vi.fn(async () => [])
    },
    $disconnect: vi.fn()
  }))
}))

vi.mock('@/lib/google-search-console', () => ({
  GoogleSearchConsoleService: vi.fn().mockImplementation(() => ({
    syncProjectData: vi.fn(async () => ({ success: true }))
  }))
}))

vi.mock('@/lib/google-analytics', () => ({
  GoogleAnalyticsService: vi.fn().mockImplementation(() => ({
    syncProjectData: vi.fn(async () => ({ success: true }))
  }))
}))

describe('POST /api/google/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should require authentication', async () => {
    const { getServerSession } = await import('next-auth')
    vi.mocked(getServerSession).mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/google/sync', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'test-project',
        organizationId: 'test-org',
        services: ['SEARCH_CONSOLE']
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
    
    const data = await response.json()
    expect(data.error).toBe('Authentication required')
  })

  it('should apply rate limiting', async () => {
    const { rateLimitAPI } = await import('@/lib/rate-limiting-unified')
    vi.mocked(rateLimitAPI).mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
      totalHits: 31,
      limit: 30,
      resetTime: Date.now() + 60000
    })

    const request = new NextRequest('http://localhost:3000/api/google/sync', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'test-project',
        organizationId: 'test-org',
        services: ['SEARCH_CONSOLE']
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(429)
    expect(response.headers.get('X-RateLimit-Limit')).toBe('30')
  })

  it('should validate required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/google/sync', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'test-project'
        // Missing organizationId and services
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.error).toContain('Missing required fields')
  })

  it('should use service factory for lazy initialization', async () => {
    const { getRedisClient, getPrismaClient } = await import('@/lib/service-factory')

    const request = new NextRequest('http://localhost:3000/api/google/sync', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'test-project',
        organizationId: 'test-org',
        services: ['SEARCH_CONSOLE'],
        siteUrl: 'https://example.com'
      })
    })

    await POST(request)

    // Verify services were initialized through factory
    expect(getRedisClient).toHaveBeenCalled()
    expect(getPrismaClient).toHaveBeenCalled()
  })

  it('should sync Search Console data when requested', async () => {
    const request = new NextRequest('http://localhost:3000/api/google/sync', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'test-project',
        organizationId: 'test-org',
        services: ['SEARCH_CONSOLE'],
        siteUrl: 'https://example.com',
        days: 30
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('success')
    expect(data).toHaveProperty('syncedAt')
  })
})

describe('GET /api/google/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should require organizationId parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/google/sync')
    const response = await GET(request)
    
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Organization ID is required')
  })

  it('should return integration status', async () => {
    const request = new NextRequest('http://localhost:3000/api/google/sync?organizationId=test-org')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('status')
    expect(data.status).toHaveProperty('searchConsole')
    expect(data.status).toHaveProperty('analytics')
  })

  it('should use getPrismaClient from service factory', async () => {
    const { getPrismaClient } = await import('@/lib/service-factory')

    const request = new NextRequest('http://localhost:3000/api/google/sync?organizationId=test-org')
    await GET(request)

    expect(getPrismaClient).toHaveBeenCalled()
  })
})
