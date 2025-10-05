/**
 * Unified Rate Limiting System
 * Combines Redis-first architecture with memory fallback and multiple limiting strategies
 * Supports token bucket, sliding window, and user-specific rate limiting
 */

import { NextRequest } from 'next/server'
import Redis from 'ioredis'

// In-memory storage for development/fallback
const memoryStore = new Map<string, { count: number; reset: number }>()
const tokenBucketStore = new Map<string, { tokens: number[]; lastRefill: number }>()

// Redis client for production
let redis: Redis | null = null

// Preview mode check
const isPreviewMode = process.env.PREVIEW_MODE === 'true' || process.env.DISABLE_AUTH === 'true'

// Mock Redis client for preview mode
const createMockRedis = () => ({
  multi: () => ({
    incr: () => {},
    expire: () => {},
    exec: async () => [[null, 1]] // Mock successful increment
  }),
  get: async () => null,
  set: async () => 'OK',
  del: async () => 1
})

try {
  if (process.env.REDIS_URL && !isPreviewMode) {
    redis = new Redis(process.env.REDIS_URL)
  } else if (isPreviewMode) {
    console.log('Preview mode: Using mock Redis for rate limiting')
    redis = createMockRedis() as any
  }
} catch (error) {
  console.warn('Redis connection failed, using in-memory rate limiting:', error)
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  totalHits: number
  limit: number
}

export interface RateLimitOptions {
  uniqueTokenPerInterval?: number
  interval?: number
  algorithm?: 'sliding_window' | 'token_bucket'
}

/**
 * Modern sliding window rate limiting (default)
 */
export async function rateLimit(
  request: NextRequest,
  identifier: string,
  limit: number = 100,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  try {
    // In preview mode, always allow requests
    if (isPreviewMode) {
      console.log(`Preview mode: Mock rate limiting for ${identifier} - allowing request`)
      return {
        success: true,
        remaining: limit - 1,
        reset: Date.now() + windowSeconds * 1000,
        totalHits: 1,
        limit
      }
    }

    const ip = getClientIP(request)
    const key = `rate_limit:${identifier}:${ip}`
    
    const now = Date.now()
    const window = windowSeconds * 1000
    const reset = Math.ceil(now / window) * window

    if (redis) {
      // Use Redis for rate limiting
      const multi = redis.multi()
      multi.incr(key)
      multi.expire(key, windowSeconds)
      
      const results = await multi.exec()
      const count = results?.[0]?.[1] as number || 0
      
      return {
        success: count <= limit,
        remaining: Math.max(0, limit - count),
        reset,
        totalHits: count,
        limit
      }
    } else {
      // Use in-memory storage
      const existing = memoryStore.get(key)
      
      if (!existing || existing.reset <= now) {
        // New window
        memoryStore.set(key, { count: 1, reset })
        return {
          success: true,
          remaining: limit - 1,
          reset,
          totalHits: 1,
          limit
        }
      } else {
        // Existing window
        existing.count++
        memoryStore.set(key, existing)
        
        return {
          success: existing.count <= limit,
          remaining: Math.max(0, limit - existing.count),
          reset: existing.reset,
          totalHits: existing.count,
          limit
        }
      }
    }
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Fail open - allow request if rate limiting fails
    return {
      success: true,
      remaining: limit,
      reset: Date.now() + windowSeconds * 1000,
      totalHits: 0,
      limit
    }
  }
}

/**
 * Convenience helper for Next.js API routes (method-scoped identifier)
 */
export async function rateLimitAPI(
  request: NextRequest,
  identifier: string,
  limit: number = 100,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const method = request.method?.toUpperCase() ?? 'GET'
  const scope = `${method}:${identifier}`
  return rateLimit(request, scope, limit, windowSeconds)
}

/**
 * Legacy token bucket rate limiting (for backward compatibility)
 */
function createTokenBucketLimiter(options?: RateLimitOptions) {
  const tokenCache = new Map<string, { value: number[]; expires: number }>()
  const maxTokens = options?.uniqueTokenPerInterval || 500
  const windowMs = options?.interval || 60000

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        // In preview mode, always allow
        if (isPreviewMode) {
          console.log(`Preview mode: Token bucket allowing request for ${token}`)
          resolve()
          return
        }

        let tokenCount = tokenCache.get(token)
        if (!tokenCount) {
          tokenCount = { value: [0], expires: Date.now() + windowMs }
          tokenCache.set(token, tokenCount)
        }

        // Check if token bucket expired
        if (Date.now() > tokenCount.expires) {
          tokenCount.value = [0]
          tokenCount.expires = Date.now() + windowMs
        }
        
        const currentCount = tokenCount.value[0]
        tokenCount.value[0] = currentCount + 1
        const currentUsage = tokenCount.value[0]
        
        if (currentUsage >= limit) {
          reject(new Error('Rate limit exceeded'))
        } else {
          resolve()
        }
      }),
  }
}

/**
 * Generate rate limit headers for HTTP response
 */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
    'X-RateLimit-Used': result.totalHits.toString(),
  }

  const retryAfterSeconds = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000))
  if (retryAfterSeconds > 0) {
    headers['Retry-After'] = retryAfterSeconds.toString()
  }

  return headers
}

/**
 * Rate limit middleware factory for Next.js API routes
 */
export function createRateLimitMiddleware(
  limit: number,
  windowMs: number = 60 * 1000,
  uniqueTokens: number = 500
) {
  const limiter = createTokenBucketLimiter({
    interval: windowMs,
    uniqueTokenPerInterval: uniqueTokens,
  })

  return async (request: Request) => {
    const ip = getClientIP(request as NextRequest)

    try {
      await limiter.check(limit, `rate_limit:${ip}`)
      return null // No error
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(windowMs / 1000).toString(),
          },
        }
      )
    }
  }
}

/**
 * User-specific rate limiting (requires authentication)
 */
export function createUserRateLimit(
  limit: number,
  windowMs: number = 60 * 1000
) {
  const limiter = createTokenBucketLimiter({
    interval: windowMs,
    uniqueTokenPerInterval: 10000,
  })

  return async (userId: string) => {
    try {
      await limiter.check(limit, `user_rate_limit:${userId}`)
      return null
    } catch {
      throw new Error(`Rate limit exceeded for user ${userId}`)
    }
  }
}

/**
 * Pre-configured rate limiters for different endpoints
 */

// Authentication endpoints (stricter limits)
export const authRateLimit = createTokenBucketLimiter({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
})

// API endpoints (more permissive)  
export const apiRateLimit = createTokenBucketLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 1000,
})

// Password reset (very strict)
export const passwordResetRateLimit = createTokenBucketLimiter({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 100,
})

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Try various headers in order of preference
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback to a default IP for local development
  return '127.0.0.1'
}

/**
 * Clean up expired rate limit entries from memory store
 */
export function cleanupMemoryStore(): void {
  const now = Date.now()
  for (const [key, value] of memoryStore.entries()) {
    if (value.reset <= now) {
      memoryStore.delete(key)
    }
  }
}

// Cleanup memory store every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupMemoryStore, 5 * 60 * 1000)
}

// Export compatibility functions
export { rateLimit as default }