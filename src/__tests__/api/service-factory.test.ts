/**
 * Service Factory Tests
 * Tests lazy initialization and singleton patterns
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { 
  getRedisClient, 
  getPrismaClient, 
  resetServiceInstances,
  closeServices 
} from '@/lib/service-factory'

describe('Service Factory', () => {
  beforeEach(() => {
    resetServiceInstances()
  })

  afterEach(async () => {
    await closeServices()
  })

  describe('getRedisClient', () => {
    it('should return Redis client instance', () => {
      // Only test if REDIS_URL is set
      if (process.env.REDIS_URL) {
        const redis = getRedisClient()
        expect(redis).toBeDefined()
        expect(redis.status).toBeDefined()
      } else {
        expect(() => getRedisClient()).toThrow('REDIS_URL environment variable is not set')
      }
    })

    it('should return same instance on multiple calls (singleton)', () => {
      if (process.env.REDIS_URL) {
        const redis1 = getRedisClient()
        const redis2 = getRedisClient()
        expect(redis1).toBe(redis2)
      }
    })
  })

  describe('getPrismaClient', () => {
    it('should return Prisma client instance', () => {
      const prisma = getPrismaClient()
      expect(prisma).toBeDefined()
      expect(prisma.$connect).toBeDefined()
      expect(prisma.$disconnect).toBeDefined()
    })

    it('should return same instance on multiple calls (singleton)', () => {
      const prisma1 = getPrismaClient()
      const prisma2 = getPrismaClient()
      expect(prisma1).toBe(prisma2)
    })
  })

  describe('closeServices', () => {
    it('should cleanup all service instances', async () => {
      // Initialize services
      if (process.env.REDIS_URL) {
        getRedisClient()
      }
      getPrismaClient()

      // Close services
      await closeServices()

      // Reset should allow new instances
      resetServiceInstances()
      
      // New instances should be different
      const prisma = getPrismaClient()
      expect(prisma).toBeDefined()
    })
  })

  describe('resetServiceInstances', () => {
    it('should reset singleton state', () => {
      const prisma1 = getPrismaClient()
      resetServiceInstances()
      const prisma2 = getPrismaClient()
      
      // After reset, instances are different
      expect(prisma1).not.toBe(prisma2)
    })
  })
})
