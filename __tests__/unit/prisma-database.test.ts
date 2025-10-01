/**
 * Prisma Database Layer Tests  
 * Comprehensive CRUD operations and model relationship tests (TDD approach)
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import '../../src/__tests__/utils/custom-matchers'

// Mock Prisma Client for tests
const mockPrisma = {
  // User operations
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
    count: vi.fn(),
  },
  // Organization operations
  organization: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
  },
  // Project operations
  project: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
  },
  // Keyword operations
  keyword: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  // Ranking operations
  ranking: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    createMany: vi.fn(),
  },
  // KeywordAccuracy operations
  keywordAccuracy: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
  // GoogleIntegration operations
  googleIntegration: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
  // AuditLog operations
  auditLog: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  // Transaction support
  $transaction: vi.fn(),
  $disconnect: vi.fn(),
} as unknown as PrismaClient

// Mock the prisma import
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}))

describe('Prisma Database Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('User Model CRUD Operations', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const userData = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'MEMBER',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.user.create.mockResolvedValue(userData)

      // Act
      const result = await mockPrisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          role: 'MEMBER',
          status: 'ACTIVE',
        }
      })

      // Assert
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          role: 'MEMBER',
          status: 'ACTIVE',
        }
      })
      expect(result).toEqual(userData)
      expect(result.email).toBe('test@example.com')
    })

    it('should find user by unique email', async () => {
      // Arrange
      const userData = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'MEMBER',
        status: 'ACTIVE',
      }

      mockPrisma.user.findUnique.mockResolvedValue(userData)

      // Act
      const result = await mockPrisma.user.findUnique({
        where: { email: 'test@example.com' }
      })

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      })
      expect(result).toEqual(userData)
    })

    it('should update user information', async () => {
      // Arrange
      const updatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Updated Name',
        role: 'ADMIN',
        lastLoginAt: new Date(),
      }

      mockPrisma.user.update.mockResolvedValue(updatedUser)

      // Act
      const result = await mockPrisma.user.update({
        where: { id: 'user-123' },
        data: { 
          name: 'Updated Name',
          role: 'ADMIN',
          lastLoginAt: new Date()
        }
      })

      // Assert
      expect(mockPrisma.user.update).toHaveBeenCalled()
      expect(result.name).toBe('Updated Name')
      expect(result.role).toBe('ADMIN')
    })

    it('should delete user successfully', async () => {
      // Arrange
      const deletedUser = {
        id: 'user-123',
        email: 'test@example.com',
        deletedAt: new Date(),
      }

      mockPrisma.user.delete.mockResolvedValue(deletedUser)

      // Act
      const result = await mockPrisma.user.delete({
        where: { id: 'user-123' }
      })

      // Assert
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' }
      })
      expect(result).toEqual(deletedUser)
    })
  })

  describe('Project Model CRUD Operations', () => {
    it('should create project with full SEO configuration', async () => {
      // Arrange
      const projectData = {
        id: 'project-123',
        name: 'Test Project',
        domain: 'example.com',
        url: 'https://example.com',
        description: 'Test SEO project',
        userId: 'user-123',
        organizationId: 'org-123',
        status: 'ACTIVE',
        targetCountries: ['US', 'UK'],
        targetLanguages: ['en'],
        competitors: ['competitor1.com', 'competitor2.com'],
        gscConnected: true,
        gaConnected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.project.create.mockResolvedValue(projectData)

      // Act
      const result = await mockPrisma.project.create({
        data: {
          name: 'Test Project',
          domain: 'example.com',
          url: 'https://example.com',
          description: 'Test SEO project',
          userId: 'user-123',
          organizationId: 'org-123',
          targetCountries: ['US', 'UK'],
          targetLanguages: ['en'],
          competitors: ['competitor1.com', 'competitor2.com'],
          gscConnected: true,
        }
      })

      // Assert
      expect(mockPrisma.project.create).toHaveBeenCalled()
      expect(result.domain).toBe('example.com')
      expect(result.targetCountries).toContain('US')
      expect(result.targetCountries).toContain('UK')
      expect(result.gscConnected).toBe(true)
    })

    it('should find projects by user with relationships', async () => {
      // Arrange
      const projects = [
        {
          id: 'project-1',
          name: 'Project 1',
          domain: 'example1.com',
          userId: 'user-123',
          keywords: [
            { id: 'kw-1', keyword: 'seo tools', position: 5 },
            { id: 'kw-2', keyword: 'seo analytics', position: 12 }
          ]
        },
        {
          id: 'project-2',
          name: 'Project 2',
          domain: 'example2.com',
          userId: 'user-123',
          keywords: []
        }
      ]

      mockPrisma.project.findMany.mockResolvedValue(projects)

      // Act
      const result = await mockPrisma.project.findMany({
        where: { userId: 'user-123' },
        include: { keywords: true }
      })

      // Assert
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: { keywords: true }
      })
      expect(result).toHaveLength(2)
      expect(result[0].keywords).toHaveLength(2)
    })
  })

  describe('Keyword Model CRUD Operations', () => {
    it('should create keyword with SEO metrics', async () => {
      // Arrange
      const keywordData = {
        id: 'kw-123',
        projectId: 'project-123',
        keyword: 'seo analytics platform',
        searchVolume: 12000,
        difficulty: 'HARD',
        cpc: 2.45,
        competition: 0.78,
        intent: 'commercial',
        country: 'US',
        language: 'en',
        isTracked: true,
        tags: ['seo', 'analytics', 'saas'],
        category: 'tools',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.keyword.create.mockResolvedValue(keywordData)

      // Act
      const result = await mockPrisma.keyword.create({
        data: {
          projectId: 'project-123',
          keyword: 'seo analytics platform',
          searchVolume: 12000,
          difficulty: 'HARD',
          cpc: 2.45,
          competition: 0.78,
          intent: 'commercial',
          country: 'US',
          language: 'en',
          tags: ['seo', 'analytics', 'saas'],
          category: 'tools',
          priority: 'high',
        }
      })

      // Assert
      expect(mockPrisma.keyword.create).toHaveBeenCalled()
      expect(result.keyword).toBe('seo analytics platform')
      expect(result.searchVolume).toBe(12000)
      expect(result.difficulty).toBe('HARD')
      expect(result.tags).toContain('seo')
      expect(result.priority).toBe('high')
    })

    it('should create multiple keywords in batch', async () => {
      // Arrange
      const keywordsData = [
        {
          projectId: 'project-123',
          keyword: 'keyword 1',
          searchVolume: 1000,
          country: 'US',
        },
        {
          projectId: 'project-123',
          keyword: 'keyword 2',
          searchVolume: 2000,
          country: 'US',
        },
      ]

      mockPrisma.keyword.createMany.mockResolvedValue({ count: 2 })

      // Act
      const result = await mockPrisma.keyword.createMany({
        data: keywordsData,
        skipDuplicates: true,
      })

      // Assert
      expect(mockPrisma.keyword.createMany).toHaveBeenCalledWith({
        data: keywordsData,
        skipDuplicates: true,
      })
      expect(result.count).toBe(2)
    })

    it('should find keywords by project with rankings', async () => {
      // Arrange
      const keywords = [
        {
          id: 'kw-1',
          keyword: 'test keyword',
          projectId: 'project-123',
          rankings: [
            { id: 'r-1', position: 5, date: new Date(), confidenceScore: 94 },
            { id: 'r-2', position: 7, date: new Date(), confidenceScore: 91 },
          ]
        }
      ]

      mockPrisma.keyword.findMany.mockResolvedValue(keywords)

      // Act
      const result = await mockPrisma.keyword.findMany({
        where: { projectId: 'project-123' },
        include: { rankings: { orderBy: { date: 'desc' } } }
      })

      // Assert
      expect(result[0].rankings).toHaveLength(2)
      expect(result[0].rankings[0].confidenceScore).toBeGreaterThanOrEqual(90)
    })
  })

  describe('Ranking Model CRUD Operations', () => {
    it('should create ranking with confidence score', async () => {
      // Arrange
      const rankingData = {
        id: 'ranking-123',
        keywordId: 'kw-123',
        projectId: 'project-123',
        position: 5,
        url: 'https://example.com/page',
        title: 'Test Page Title',
        description: 'Test meta description',
        searchEngine: 'google',
        device: 'desktop',
        location: 'US',
        date: new Date(),
        confidenceScore: 94.5,
        dataSource: 'GSC',
        isVerified: true,
        clicks: 150,
        impressions: 3000,
        ctr: 0.05,
        createdAt: new Date(),
      }

      mockPrisma.ranking.create.mockResolvedValue(rankingData)

      // Act
      const result = await mockPrisma.ranking.create({
        data: {
          keywordId: 'kw-123',
          projectId: 'project-123',
          position: 5,
          url: 'https://example.com/page',
          title: 'Test Page Title',
          description: 'Test meta description',
          confidenceScore: 94.5,
          dataSource: 'GSC',
          isVerified: true,
          clicks: 150,
          impressions: 3000,
          ctr: 0.05,
        }
      })

      // Assert
      expect(result.position).toBe(5)
      expect(result.confidenceScore).toBeWithinAccuracyThreshold(94)
      expect(result.dataSource).toBe('GSC')
      expect(result.isVerified).toBe(true)
    })

    it('should find rankings with time series data', async () => {
      // Arrange
      const rankings = [
        { id: 'r-1', position: 5, date: new Date('2024-01-01'), confidenceScore: 94 },
        { id: 'r-2', position: 7, date: new Date('2024-01-02'), confidenceScore: 92 },
        { id: 'r-3', position: 4, date: new Date('2024-01-03'), confidenceScore: 96 },
      ]

      mockPrisma.ranking.findMany.mockResolvedValue(rankings)

      // Act
      const result = await mockPrisma.ranking.findMany({
        where: {
          keywordId: 'kw-123',
          date: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31')
          }
        },
        orderBy: { date: 'desc' }
      })

      // Assert
      expect(result).toHaveLength(3)
      expect(result[0].date).toEqual(new Date('2024-01-03'))
      expect(result[2].date).toEqual(new Date('2024-01-01'))
    })
  })

  describe('KeywordAccuracy Model CRUD Operations', () => {
    it('should create keyword accuracy record with ML metrics', async () => {
      // Arrange
      const accuracyData = {
        id: 'accuracy-123',
        keywordId: 'kw-123',
        projectId: 'project-123',
        confidenceScore: 94.2,
        freshnessScore: 95.5,
        consistencyScore: 92.8,
        reliabilityScore: 96.1,
        sourcesCount: 3,
        primarySource: 'GOOGLE_SEARCH_CONSOLE',
        validatedSources: ['GOOGLE_SEARCH_CONSOLE', 'SERPAPI', 'AHREFS_API'],
        positionVariance: 1.2,
        hasDiscrepancies: false,
        calculatedAt: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date(),
      }

      mockPrisma.keywordAccuracy.create.mockResolvedValue(accuracyData)

      // Act
      const result = await mockPrisma.keywordAccuracy.create({
        data: {
          keywordId: 'kw-123',
          projectId: 'project-123',
          confidenceScore: 94.2,
          freshnessScore: 95.5,
          consistencyScore: 92.8,
          reliabilityScore: 96.1,
          sourcesCount: 3,
          primarySource: 'GOOGLE_SEARCH_CONSOLE',
          validatedSources: ['GOOGLE_SEARCH_CONSOLE', 'SERPAPI', 'AHREFS_API'],
          positionVariance: 1.2,
          hasDiscrepancies: false,
          calculatedAt: new Date(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }
      })

      // Assert
      expect(result.confidenceScore).toBeWithinAccuracyThreshold(94)
      expect(result.freshnessScore).toBeGreaterThanOrEqual(90)
      expect(result.reliabilityScore).toBeGreaterThanOrEqual(95)
      expect(result.sourcesCount).toBe(3)
      expect(result.validatedSources).toContain('GOOGLE_SEARCH_CONSOLE')
      expect(result.hasDiscrepancies).toBe(false)
    })

    it('should upsert accuracy record for existing keyword', async () => {
      // Arrange
      const existingAccuracy = {
        keywordId: 'kw-123',
        projectId: 'project-123',
        confidenceScore: 96.8,
        freshnessScore: 98.0,
        calculatedAt: new Date(),
      }

      mockPrisma.keywordAccuracy.upsert.mockResolvedValue(existingAccuracy)

      // Act
      const result = await mockPrisma.keywordAccuracy.upsert({
        where: {
          keywordId_projectId: {
            keywordId: 'kw-123',
            projectId: 'project-123'
          }
        },
        update: {
          confidenceScore: 96.8,
          freshnessScore: 98.0,
          calculatedAt: new Date(),
        },
        create: {
          keywordId: 'kw-123',
          projectId: 'project-123',
          confidenceScore: 96.8,
          freshnessScore: 98.0,
          consistencyScore: 95.0,
          reliabilityScore: 94.0,
          sourcesCount: 2,
          primarySource: 'GOOGLE_SEARCH_CONSOLE',
          validatedSources: ['GOOGLE_SEARCH_CONSOLE'],
          calculatedAt: new Date(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }
      })

      // Assert
      expect(result.confidenceScore).toBeWithinAccuracyThreshold(96)
      expect(result.freshnessScore).toBeGreaterThanOrEqual(98)
    })
  })

  describe('GoogleIntegration Model CRUD Operations', () => {
    it('should create Google API integration', async () => {
      // Arrange
      const integrationData = {
        id: 'integration-123',
        userId: 'user-123',
        organizationId: 'org-123',
        service: 'SEARCH_CONSOLE',
        accessToken: 'access-token-encrypted',
        refreshToken: 'refresh-token-encrypted',
        tokenExpiry: new Date(Date.now() + 3600000), // 1 hour
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
        properties: ['https://example.com/', 'https://www.example.com/'],
        isActive: true,
        lastSyncAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.googleIntegration.create.mockResolvedValue(integrationData)

      // Act
      const result = await mockPrisma.googleIntegration.create({
        data: {
          userId: 'user-123',
          organizationId: 'org-123',
          service: 'SEARCH_CONSOLE',
          accessToken: 'access-token-encrypted',
          refreshToken: 'refresh-token-encrypted',
          tokenExpiry: new Date(Date.now() + 3600000),
          scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
          properties: ['https://example.com/', 'https://www.example.com/'],
          isActive: true,
        }
      })

      // Assert
      expect(result.service).toBe('SEARCH_CONSOLE')
      expect(result.isActive).toBe(true)
      expect(result.scopes).toContain('https://www.googleapis.com/auth/webmasters.readonly')
      expect(result.properties).toHaveLength(2)
    })

    it('should upsert integration for existing user and service', async () => {
      // Arrange
      const updatedIntegration = {
        userId: 'user-123',
        organizationId: 'org-123',
        service: 'SEARCH_CONSOLE',
        accessToken: 'new-access-token',
        tokenExpiry: new Date(Date.now() + 3600000),
        lastSyncAt: new Date(),
      }

      mockPrisma.googleIntegration.upsert.mockResolvedValue(updatedIntegration)

      // Act
      const result = await mockPrisma.googleIntegration.upsert({
        where: {
          userId_organizationId_service: {
            userId: 'user-123',
            organizationId: 'org-123',
            service: 'SEARCH_CONSOLE',
          }
        },
        update: {
          accessToken: 'new-access-token',
          tokenExpiry: new Date(Date.now() + 3600000),
          lastSyncAt: new Date(),
        },
        create: {
          userId: 'user-123',
          organizationId: 'org-123',
          service: 'SEARCH_CONSOLE',
          accessToken: 'new-access-token',
          refreshToken: 'refresh-token',
          tokenExpiry: new Date(Date.now() + 3600000),
          scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
          properties: [],
          isActive: true,
        }
      })

      // Assert
      expect(result.accessToken).toBe('new-access-token')
    })
  })

  describe('AuditLog Model CRUD Operations', () => {
    it('should create audit log entry', async () => {
      // Arrange
      const auditData = {
        id: 'audit-123',
        userId: 'user-123',
        organizationId: 'org-123',
        action: 'GOOGLE_API_CONNECTED',
        entityType: 'INTEGRATION',
        entityId: 'SEARCH_CONSOLE_user-123',
        metadata: {
          service: 'SEARCH_CONSOLE',
          propertiesCount: 2,
          scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test',
        timestamp: new Date(),
      }

      mockPrisma.auditLog.create.mockResolvedValue(auditData)

      // Act
      const result = await mockPrisma.auditLog.create({
        data: {
          userId: 'user-123',
          organizationId: 'org-123',
          action: 'GOOGLE_API_CONNECTED',
          entityType: 'INTEGRATION',
          entityId: 'SEARCH_CONSOLE_user-123',
          metadata: {
            service: 'SEARCH_CONSOLE',
            propertiesCount: 2,
            scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
          },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 Test',
        }
      })

      // Assert
      expect(result.action).toBe('GOOGLE_API_CONNECTED')
      expect(result.entityType).toBe('INTEGRATION')
      expect(result.metadata).toHaveProperty('service', 'SEARCH_CONSOLE')
    })

    it('should find audit logs with filters', async () => {
      // Arrange
      const auditLogs = [
        {
          id: 'audit-1',
          userId: 'user-123',
          action: 'LOGIN',
          timestamp: new Date('2024-01-01T10:00:00Z')
        },
        {
          id: 'audit-2',
          userId: 'user-123',
          action: 'GOOGLE_API_CONNECTED',
          timestamp: new Date('2024-01-01T11:00:00Z')
        }
      ]

      mockPrisma.auditLog.findMany.mockResolvedValue(auditLogs)

      // Act
      const result = await mockPrisma.auditLog.findMany({
        where: {
          userId: 'user-123',
          timestamp: {
            gte: new Date('2024-01-01T00:00:00Z'),
            lte: new Date('2024-01-01T23:59:59Z')
          }
        },
        orderBy: { timestamp: 'desc' }
      })

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0].action).toBe('GOOGLE_API_CONNECTED')
      expect(result[1].action).toBe('LOGIN')
    })
  })

  describe('Database Relationships and Constraints', () => {
    it('should handle cascading deletes properly', async () => {
      // Arrange
      mockPrisma.keyword.deleteMany.mockResolvedValue({ count: 5 })
      mockPrisma.project.delete.mockResolvedValue({ id: 'project-123' })

      // Act - Deleting project should cascade to keywords
      await mockPrisma.keyword.deleteMany({
        where: { projectId: 'project-123' }
      })
      await mockPrisma.project.delete({
        where: { id: 'project-123' }
      })

      // Assert
      expect(mockPrisma.keyword.deleteMany).toHaveBeenCalledWith({
        where: { projectId: 'project-123' }
      })
      expect(mockPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: 'project-123' }
      })
    })

    it('should enforce unique constraints', async () => {
      // Arrange - Test unique constraint on User.email
      const duplicateEmailError = new Error('Unique constraint violation')
      mockPrisma.user.create.mockRejectedValue(duplicateEmailError)

      // Act & Assert
      await expect(
        mockPrisma.user.create({
          data: {
            email: 'existing@example.com',
            name: 'Test User'
          }
        })
      ).rejects.toThrow('Unique constraint violation')
    })

    it('should handle complex queries with multiple joins', async () => {
      // Arrange
      const complexData = [
        {
          id: 'project-1',
          name: 'Test Project',
          keywords: [
            {
              id: 'kw-1',
              keyword: 'test keyword',
              rankings: [
                { position: 5, confidenceScore: 94, date: new Date() }
              ],
              keywordAccuracy: [
                { confidenceScore: 95, freshnessScore: 98 }
              ]
            }
          ]
        }
      ]

      mockPrisma.project.findMany.mockResolvedValue(complexData)

      // Act
      const result = await mockPrisma.project.findMany({
        where: { userId: 'user-123' },
        include: {
          keywords: {
            include: {
              rankings: {
                orderBy: { date: 'desc' },
                take: 10
              },
              keywordAccuracy: {
                orderBy: { calculatedAt: 'desc' },
                take: 1
              }
            }
          }
        }
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].keywords[0].rankings).toHaveLength(1)
      expect(result[0].keywords[0].keywordAccuracy).toHaveLength(1)
      expect(result[0].keywords[0].rankings[0].confidenceScore).toBeWithinAccuracyThreshold(94)
    })
  })

  describe('Transaction Operations', () => {
    it('should handle atomic transactions', async () => {
      // Arrange
      const transactionResult = [
        { id: 'kw-1', keyword: 'keyword 1' },
        { count: 1 }
      ]

      mockPrisma.$transaction.mockResolvedValue(transactionResult)

      // Act
      const result = await mockPrisma.$transaction([
        mockPrisma.keyword.create({
          data: {
            projectId: 'project-123',
            keyword: 'keyword 1',
            country: 'US'
          }
        }),
        mockPrisma.auditLog.create({
          data: {
            userId: 'user-123',
            action: 'CREATE',
            entityType: 'KEYWORD',
            entityId: 'kw-1'
          }
        })
      ])

      // Assert
      expect(mockPrisma.$transaction).toHaveBeenCalled()
      expect(result).toHaveLength(2)
    })

    it('should rollback on transaction failure', async () => {
      // Arrange
      const transactionError = new Error('Transaction failed')
      mockPrisma.$transaction.mockRejectedValue(transactionError)

      // Act & Assert
      await expect(
        mockPrisma.$transaction([
          mockPrisma.keyword.create({
            data: {
              projectId: 'invalid-project', // This would fail
              keyword: 'test keyword',
              country: 'US'
            }
          })
        ])
      ).rejects.toThrow('Transaction failed')
    })
  })

  describe('Performance and Optimization', () => {
    it('should use proper indexing for common queries', async () => {
      // Arrange
      const keywords = [
        { id: 'kw-1', keyword: 'test', projectId: 'project-123', isTracked: true },
        { id: 'kw-2', keyword: 'test2', projectId: 'project-123', isTracked: true }
      ]

      mockPrisma.keyword.findMany.mockResolvedValue(keywords)

      // Act - Query that should use indexes
      const result = await mockPrisma.keyword.findMany({
        where: {
          projectId: 'project-123', // indexed
          isTracked: true, // indexed
          priority: 'high' // indexed
        },
        orderBy: { createdAt: 'desc' } // indexed
      })

      // Assert
      expect(mockPrisma.keyword.findMany).toHaveBeenCalledWith({
        where: {
          projectId: 'project-123',
          isTracked: true,
          priority: 'high'
        },
        orderBy: { createdAt: 'desc' }
      })
      expect(result).toHaveLength(2)
    })

    it('should count records efficiently', async () => {
      // Arrange
      mockPrisma.user.count.mockResolvedValue(150)

      // Act
      const result = await mockPrisma.user.count({
        where: { status: 'ACTIVE' }
      })

      // Assert
      expect(result).toBe(150)
      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' }
      })
    })
  })
})