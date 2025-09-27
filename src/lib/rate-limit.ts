/**
 * Rate Limiting Utility
 * Implements rate limiting using memory-based token bucket algorithm
 * For production, consider using Redis for distributed rate limiting
 */

// Simple in-memory cache implementation for rate limiting
class SimpleCache {
  private cache = new Map<string, { value: number[]; expires: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(options: { max: number; ttl: number }) {
    this.maxSize = options.max;
    this.ttl = options.ttl;
  }

  get(key: string): number[] | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }

  set(key: string, value: number[]): void {
    // Simple eviction strategy - remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttl,
    });
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

/**
 * Rate limiter implementation using LRU cache
 */
export default function rateLimit(options?: Options) {
  const tokenCache = new SimpleCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        let tokenCount = tokenCache.get(token);
        if (!tokenCount) {
          tokenCount = [0];
          tokenCache.set(token, tokenCount);
        }
        
        // TypeScript strict checks - we know tokenCount exists here
        const currentCount = tokenCount[0];
        if (typeof currentCount !== 'undefined') {
          tokenCount[0] = currentCount + 1;
          const currentUsage = tokenCount[0];
          const isRateLimited = (currentUsage || 0) >= limit;

          if (isRateLimited) {
            reject(new Error('Rate limit exceeded'));
          } else {
            resolve();
          }
        } else {
          reject(new Error('Rate limit error'));
        }
      }),
  };
}

/**
 * Pre-configured rate limiters for different endpoints
 */

// Authentication endpoints (stricter limits)
export const authRateLimit = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
});

// API endpoints (more permissive)
export const apiRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute  
  uniqueTokenPerInterval: 1000,
});

// Password reset (very strict)
export const passwordResetRateLimit = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 100,
});

/**
 * Rate limit middleware factory
 */
export function createRateLimitMiddleware(
  limit: number,
  windowMs: number = 60 * 1000,
  uniqueTokens: number = 500
) {
  const limiter = rateLimit({
    interval: windowMs,
    uniqueTokenPerInterval: uniqueTokens,
  });

  return async (request: Request) => {
    const ip = 
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    try {
      await limiter.check(limit, `rate_limit:${ip}`);
      return null; // No error
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
      );
    }
  };
}

/**
 * User-specific rate limiting (requires authentication)
 */
export function createUserRateLimit(
  limit: number,
  windowMs: number = 60 * 1000
) {
  const limiter = rateLimit({
    interval: windowMs,
    uniqueTokenPerInterval: 10000,
  });

  return async (userId: string) => {
    try {
      await limiter.check(limit, `user_rate_limit:${userId}`);
      return null;
    } catch {
      throw new Error(`Rate limit exceeded for user ${userId}`);
    }
  };
}

/**
 * Export the main function with different name to avoid conflicts
 */
export { rateLimit };