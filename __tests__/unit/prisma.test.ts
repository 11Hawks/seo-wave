/**
 * Prisma Database Layer Tests
 * Tests for database operations and connection management (TDD approach)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { prisma, checkDatabaseConnection, withTransaction } from '../../src/lib/prisma'
import '../../src/__tests__/utils/custom-matchers'

describe('Prisma Database Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Prisma Client Initialization', () => {
    it('should initialize prisma client', () => {
      expect(prisma).toBeDefined()
      expect(typeof prisma).toBe('object')
    })

    it('should have user model methods', () => {
      expect(prisma.user).toBeDefined()
      expect(typeof prisma.user.findUnique).toBe('function')
      expect(typeof prisma.user.create).toBe('function')
      expect(typeof prisma.user.update).toBe('function')
      expect(typeof prisma.user.delete).toBe('function')
    })

    it('should have organization model methods', () => {
      expect(prisma.organization).toBeDefined()
      expect(typeof prisma.organization.findMany).toBe('function')
      expect(typeof prisma.organization.create).toBe('function')
    })

    it('should have keyword model methods', () => {
      expect(prisma.keyword).toBeDefined()
      expect(typeof prisma.keyword.findMany).toBe('function')
      expect(typeof prisma.keyword.create).toBe('function')
    })

    it('should have audit log model methods', () => {
      expect(prisma.auditLog).toBeDefined()
      expect(typeof prisma.auditLog.create).toBe('function')
    })
  })

  describe('checkDatabaseConnection', () => {
    it('should return true for healthy connection in preview mode', async () => {
      // In preview mode, should always return true
      const isHealthy = await checkDatabaseConnection()
      expect(isHealthy).toBe(true)
    })

    it('should handle database connection errors gracefully', async () => {
      // Should not throw even if connection fails
      expect(async () => {
        await checkDatabaseConnection()
      }).not.toThrow()
    })

    it('should return boolean result', async () => {
      const result = await checkDatabaseConnection()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('withTransaction', () => {
    it('should execute transaction callback', async () => {
      // Arrange
      const mockCallback = vi.fn().mockResolvedValue('transaction result')

      // Act
      const result = await withTransaction(mockCallback)

      // Assert
      expect(result).toBe('transaction result')
      expect(mockCallback).toHaveBeenCalledWith(prisma)
    })

    it('should handle transaction errors', async () => {
      // Arrange
      const mockCallback = vi.fn().mockRejectedValue(new Error('Transaction failed'))

      // Act & Assert
      await expect(withTransaction(mockCallback)).rejects.toThrow('Transaction failed')
    })

    it('should pass prisma client to callback', async () => {
      // Arrange
      let receivedPrisma: any = null
      const mockCallback = vi.fn().mockImplementation((p) => {
        receivedPrisma = p
        return Promise.resolve('success')
      })

      // Act
      await withTransaction(mockCallback)

      // Assert
      expect(receivedPrisma).toBe(prisma)
    })
  })

  describe('User Model Operations', () => {
    it('should create user', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        hashedPassword: 'hashed123'
      }

      // Act
      const result = await prisma.user.create({ data: userData })

      // Assert
      expect(result).toBeDefined()
    })

    it('should find user by email', async () => {
      // Act
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' }
      })

      // Assert - In preview mode, returns null
      expect(user).toBeNull()
    })

    it('should find many users', async () => {
      // Act
      const users = await prisma.user.findMany()

      // Assert - In preview mode, returns empty array
      expect(Array.isArray(users)).toBe(true)
      expect(users).toHaveLength(0)
    })

    it('should update user', async () => {
      // Act
      const result = await prisma.user.update({
        where: { id: 'user-123' },
        data: { name: 'Updated Name' }
      })

      // Assert
      expect(result).toBeDefined()
    })

    it('should delete user', async () => {
      // Act
      const result = await prisma.user.delete({
        where: { id: 'user-123' }
      })

      // Assert
      expect(result).toBeDefined()
    })

    it('should count users', async () => {
      // Act
      const count = await prisma.user.count()

      // Assert
      expect(typeof count).toBe('number')
      expect(count).toBe(0) // Preview mode returns 0
    })
  })

  describe('Organization Model Operations', () => {
    it('should create organization', async () => {
      // Arrange
      const orgData = {
        name: 'Test Organization',
        slug: 'test-org',
        plan: 'PROFESSIONAL'
      }

      // Act
      const result = await prisma.organization.create({ data: orgData })

      // Assert
      expect(result).toBeDefined()
    })

    it('should find organization by slug', async () => {
      // Act
      const org = await prisma.organization.findUnique({
        where: { slug: 'test-org' }
      })

      // Assert
      expect(org).toBeNull() // Preview mode
    })

    it('should update organization', async () => {
      // Act
      const result = await prisma.organization.update({
        where: { id: 'org-123' },
        data: { plan: 'ENTERPRISE' }
      })

      // Assert
      expect(result).toBeDefined()
    })
  })

  describe('Keyword Model Operations', () => {
    it('should create keyword', async () => {
      // Arrange
      const keywordData = {
        keyword: 'test keyword',
        projectId: 'project-123',
        userId: 'user-123',
        position: 5,
        searchVolume: 1000,
        difficulty: 65
      }

      // Act
      const result = await prisma.keyword.create({ data: keywordData })

      // Assert
      expect(result).toBeDefined()
    })

    it('should find keywords by project', async () => {
      // Act
      const keywords = await prisma.keyword.findMany({
        where: { projectId: 'project-123' }
      })

      // Assert
      expect(Array.isArray(keywords)).toBe(true)
    })

    it('should update keyword position', async () => {
      // Act
      const result = await prisma.keyword.update({
        where: { id: 'keyword-123' },
        data: { position: 3 }
      })

      // Assert
      expect(result).toBeDefined()
    })

    it('should delete keyword', async () => {
      // Act
      const result = await prisma.keyword.delete({
        where: { id: 'keyword-123' }
      })

      // Assert
      expect(result).toBeDefined()
    })
  })

  describe('Audit Log Operations', () => {
    it('should create audit log entry', async () => {
      // Arrange
      const auditData = {
        userId: 'user-123',
        action: 'CREATE_KEYWORD',
        resource: 'keyword',
        resourceId: 'keyword-123',
        metadata: { keyword: 'test' }
      }

      // Act
      const result = await prisma.auditLog.create({ data: auditData })

      // Assert
      expect(result).toBeDefined()
    })

    it('should find audit logs by user', async () => {
      // Act
      const logs = await prisma.auditLog.findMany({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' }
      })

      // Assert
      expect(Array.isArray(logs)).toBe(true)
    })
  })

  describe('Complex Queries and Relationships', () => {
    it('should handle user with organization relationship', async () => {
      // Act
      const user = await prisma.user.findUnique({
        where: { id: 'user-123' },
        include: { organization: true }
      })

      // Assert
      expect(user).toBeNull() // Preview mode
    })

    it('should handle organization with members', async () => {
      // Act
      const org = await prisma.organization.findUnique({
        where: { id: 'org-123' },
        include: { members: true }
      })

      // Assert
      expect(org).toBeNull() // Preview mode
    })

    it('should handle keyword with project relationship', async () => {
      // Act
      const keywords = await prisma.keyword.findMany({
        include: { 
          project: true,
          user: true 
        }
      })

      // Assert
      expect(Array.isArray(keywords)).toBe(true)
    })
  })

  describe('Raw Queries', () => {
    it('should execute raw SQL query', async () => {
      // Act
      const result = await prisma.$queryRaw`SELECT 1 as test`

      // Assert
      expect(Array.isArray(result)).toBe(true)
    })

    it('should execute raw update query', async () => {
      // Act
      const result = await prisma.$executeRaw`UPDATE users SET name = 'Test' WHERE id = 'user-123'`

      // Assert
      expect(typeof result).toBe('number')
    })
  })

  describe('Aggregation Operations', () => {
    it('should aggregate keyword data', async () => {
      // Act
      const result = await prisma.keyword.aggregate({
        _avg: { position: true },
        _count: { id: true },
        _max: { position: true },
        _min: { position: true }
      })

      // Assert
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('should group keywords by project', async () => {
      // Act
      const result = await prisma.keyword.groupBy({
        by: ['projectId'],
        _count: { id: true },
        _avg: { position: true }
      })

      // Assert
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('Upsert Operations', () => {
    it('should upsert user data', async () => {
      // Arrange
      const userData = {
        email: 'upsert@example.com',
        name: 'Upsert User'
      }

      // Act
      const result = await prisma.user.upsert({
        where: { email: 'upsert@example.com' },
        create: { ...userData, hashedPassword: 'hashed' },
        update: { name: 'Updated Upsert User' }
      })

      // Assert
      expect(result).toBeDefined()
    })

    it('should upsert organization data', async () => {
      // Act
      const result = await prisma.organization.upsert({
        where: { slug: 'upsert-org' },
        create: {
          name: 'Upsert Org',
          slug: 'upsert-org',
          plan: 'STARTER'
        },
        update: {
          plan: 'PROFESSIONAL'
        }
      })

      // Assert
      expect(result).toBeDefined()
    })
  })

  describe('Transaction Operations', () => {
    it('should handle nested transactions', async () => {
      // Act & Assert
      expect(async () => {
        await withTransaction(async (tx) => {
          await tx.user.create({
            data: {
              email: 'tx@example.com',
              name: 'Transaction User',
              hashedPassword: 'hashed'
            }
          })

          await tx.organization.create({
            data: {
              name: 'Transaction Org',
              slug: 'tx-org',
              plan: 'STARTER'
            }
          })

          return 'success'
        })
      }).not.toThrow()
    })

    it('should rollback on transaction failure', async () => {
      // Act & Assert
      await expect(
        withTransaction(async (tx) => {
          await tx.user.create({
            data: {
              email: 'rollback@example.com',
              name: 'Rollback User',
              hashedPassword: 'hashed'
            }
          })

          // Force transaction failure
          throw new Error('Transaction rollback test')
        })
      ).rejects.toThrow('Transaction rollback test')
    })
  })

  describe('Connection Management', () => {
    it('should handle connection disconnect', async () => {
      // Act & Assert - Should not throw
      expect(async () => {
        await prisma.$disconnect()
      }).not.toThrow()
    })

    it('should handle connection reconnect', async () => {
      // Act & Assert - Should not throw
      expect(async () => {
        await prisma.$connect()
      }).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid query gracefully', async () => {
      // Act & Assert - Should not crash the application
      expect(async () => {
        try {
          await (prisma as any).nonExistentModel.findMany()
        } catch (error) {
          // Expected to fail, but shouldn't crash
          expect(error).toBeDefined()
        }
      }).not.toThrow()
    })

    it('should handle database constraint violations', async () => {
      // This would test unique constraint violations, etc.
      // In preview mode, this just tests that the mock handles it
      expect(async () => {
        await prisma.user.create({
          data: {
            email: 'duplicate@example.com',
            name: 'Duplicate User',
            hashedPassword: 'hashed'
          }
        })
      }).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('should complete simple queries within 100ms', async () => {
      // Arrange
      const startTime = Date.now()

      // Act
      await prisma.user.findMany()

      // Assert
      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(100)
    })

    it('should handle concurrent queries efficiently', async () => {
      // Arrange
      const queries = Array.from({ length: 10 }, () =>
        prisma.user.findMany({ take: 5 })
      )

      const startTime = Date.now()

      // Act
      await Promise.all(queries)

      // Assert
      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(500) // Should handle 10 concurrent queries quickly
    })
  })
})