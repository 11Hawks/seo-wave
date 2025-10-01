/**
 * Audit Logger Tests
 * Tests for audit logging functionality (TDD approach)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { auditLog, getAuditLogs, type AuditLogEntry } from '../../src/lib/audit-logger'

// Mock Prisma client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    }
  }))
}))

const mockPrisma = {
  auditLog: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  }
}

// Mock console.error to test error handling
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('Audit Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    consoleSpy.mockClear()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('auditLog', () => {
    const mockEntry: AuditLogEntry = {
      userId: 'user-123',
      organizationId: 'org-456',
      action: 'CREATE_KEYWORD',
      resource: 'keyword',
      details: { keyword: 'seo tools', domain: 'example.com' },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      success: true
    }

    beforeEach(() => {
      // Reset the prisma mock
      vi.doMock('../../src/lib/audit-logger', async () => {
        const actual = await vi.importActual('../../src/lib/audit-logger')
        return {
          ...actual,
          // Override internal prisma instance
          prisma: mockPrisma
        }
      })
    })

    it('should log audit entry successfully', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({
        id: 'audit-123',
        ...mockEntry,
        createdAt: new Date()
      })

      await auditLog(mockEntry)

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: mockEntry.userId,
          organizationId: mockEntry.organizationId,
          action: mockEntry.action,
          resource: mockEntry.resource,
          details: mockEntry.details,
          ipAddress: mockEntry.ipAddress,
          userAgent: mockEntry.userAgent,
          success: mockEntry.success,
          createdAt: expect.any(Date)
        }
      })
    })

    it('should handle missing optional fields with defaults', async () => {
      const minimalEntry: AuditLogEntry = {
        userId: 'user-123',
        organizationId: 'org-456',
        action: 'READ_KEYWORDS',
        resource: 'keyword'
      }

      mockPrisma.auditLog.create.mockResolvedValue({
        id: 'audit-124',
        ...minimalEntry
      })

      await auditLog(minimalEntry)

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: minimalEntry.userId,
          organizationId: minimalEntry.organizationId,
          action: minimalEntry.action,
          resource: minimalEntry.resource,
          details: {},
          ipAddress: undefined,
          userAgent: undefined,
          success: true,
          createdAt: expect.any(Date)
        }
      })
    })

    it('should handle success field properly', async () => {
      const failureEntry: AuditLogEntry = {
        userId: 'user-123',
        organizationId: 'org-456',
        action: 'DELETE_KEYWORD',
        resource: 'keyword',
        success: false
      }

      mockPrisma.auditLog.create.mockResolvedValue({
        id: 'audit-125',
        ...failureEntry
      })

      await auditLog(failureEntry)

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          success: false
        })
      })
    })

    it('should not throw on database errors but log to console', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.auditLog.create.mockRejectedValue(dbError)

      // Should not throw
      await expect(auditLog(mockEntry)).resolves.toBeUndefined()

      // Should log error to console
      expect(consoleSpy).toHaveBeenCalledWith('Audit logging failed:', dbError)
    })

    it('should log complex details objects', async () => {
      const complexEntry: AuditLogEntry = {
        userId: 'user-123',
        organizationId: 'org-456',
        action: 'UPDATE_SETTINGS',
        resource: 'settings',
        details: {
          oldSettings: { theme: 'dark', notifications: true },
          newSettings: { theme: 'light', notifications: false },
          changes: ['theme', 'notifications'],
          metadata: {
            userAgent: 'test-agent',
            timestamp: new Date().toISOString()
          }
        }
      }

      mockPrisma.auditLog.create.mockResolvedValue({
        id: 'audit-126',
        ...complexEntry
      })

      await auditLog(complexEntry)

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          details: complexEntry.details
        })
      })
    })
  })

  describe('getAuditLogs', () => {
    const mockAuditLogs = [
      {
        id: 'audit-1',
        userId: 'user-123',
        organizationId: 'org-456',
        action: 'CREATE_KEYWORD',
        resource: 'keyword',
        details: { keyword: 'test' },
        success: true,
        createdAt: new Date('2024-01-15T10:00:00Z')
      },
      {
        id: 'audit-2',
        userId: 'user-123',
        organizationId: 'org-456',
        action: 'UPDATE_KEYWORD',
        resource: 'keyword',
        details: { keyword: 'test updated' },
        success: true,
        createdAt: new Date('2024-01-15T11:00:00Z')
      }
    ]

    it('should get audit logs with basic filtering', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue(mockAuditLogs)
      mockPrisma.auditLog.count.mockResolvedValue(2)

      const result = await getAuditLogs({
        userId: 'user-123',
        organizationId: 'org-456'
      })

      expect(result).toEqual({
        logs: mockAuditLogs,
        total: 2
      })

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          organizationId: 'org-456'
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0
      })
    })

    it('should handle pagination parameters', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([mockAuditLogs[0]])
      mockPrisma.auditLog.count.mockResolvedValue(2)

      const result = await getAuditLogs({
        userId: 'user-123',
        page: 2,
        limit: 1
      })

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123'
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
        skip: 1
      })
    })

    it('should handle date range filtering', async () => {
      const startDate = new Date('2024-01-15T09:00:00Z')
      const endDate = new Date('2024-01-15T12:00:00Z')

      mockPrisma.auditLog.findMany.mockResolvedValue(mockAuditLogs)
      mockPrisma.auditLog.count.mockResolvedValue(2)

      await getAuditLogs({
        userId: 'user-123',
        startDate,
        endDate
      })

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0
      })
    })

    it('should handle action and resource filtering', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([mockAuditLogs[0]])
      mockPrisma.auditLog.count.mockResolvedValue(1)

      await getAuditLogs({
        userId: 'user-123',
        action: 'CREATE_KEYWORD',
        resource: 'keyword'
      })

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          action: 'CREATE_KEYWORD',
          resource: 'keyword'
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0
      })
    })

    it('should handle success status filtering', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([])
      mockPrisma.auditLog.count.mockResolvedValue(0)

      await getAuditLogs({
        userId: 'user-123',
        success: false
      })

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          success: false
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0
      })
    })

    it('should handle empty results', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([])
      mockPrisma.auditLog.count.mockResolvedValue(0)

      const result = await getAuditLogs({
        userId: 'nonexistent-user'
      })

      expect(result).toEqual({
        logs: [],
        total: 0
      })
    })

    it('should handle default pagination limits', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue(mockAuditLogs)
      mockPrisma.auditLog.count.mockResolvedValue(2)

      await getAuditLogs({
        userId: 'user-123'
      })

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123'
        },
        orderBy: { createdAt: 'desc' },
        take: 50, // Default limit
        skip: 0   // Default offset
      })
    })

    it('should handle large limit requests', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue(mockAuditLogs)
      mockPrisma.auditLog.count.mockResolvedValue(2)

      await getAuditLogs({
        userId: 'user-123',
        limit: 1000 // Should be capped at 100
      })

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123'
        },
        orderBy: { createdAt: 'desc' },
        take: 100, // Capped at maximum
        skip: 0
      })
    })
  })
})