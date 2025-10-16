/**
 * Service Factory
 * Provides lazy initialization of service clients to avoid module-level instantiation
 */

import { Redis } from 'ioredis'
import { PrismaClient } from '@prisma/client'

// Singleton instances (initialized lazily)
let redisInstance: Redis | null = null
let prismaInstance: PrismaClient | null = null

/**
 * Get or create Redis client instance
 * Safe for use in API routes - only initializes when needed
 */
export function getRedisClient(): Redis {
  if (!redisInstance) {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL environment variable is not set')
    }
    redisInstance = new Redis(process.env.REDIS_URL)
  }
  return redisInstance
}

/**
 * Get or create Prisma client instance
 * Safe for use in API routes - only initializes when needed
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient()
  }
  return prismaInstance
}

/**
 * Cleanup function for graceful shutdown
 */
export async function closeServices(): Promise<void> {
  const promises: Promise<any>[] = []
  
  if (redisInstance) {
    promises.push(redisInstance.quit())
    redisInstance = null
  }
  
  if (prismaInstance) {
    promises.push(prismaInstance.$disconnect())
    prismaInstance = null
  }
  
  await Promise.all(promises)
}

/**
 * For testing: reset singleton instances
 */
export function resetServiceInstances(): void {
  redisInstance = null
  prismaInstance = null
}
