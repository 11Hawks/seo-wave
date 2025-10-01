/**
 * Audit Logger
 * Provides comprehensive audit logging for all system activities
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AuditLogEntry {
  userId: string
  organizationId: string
  action: string
  resource: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  success?: boolean
}

/**
 * Log an audit event
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        organizationId: entry.organizationId,
        action: entry.action,
        resource: entry.resource,
        details: entry.details || {},
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        success: entry.success ?? true,
        createdAt: new Date()
      }
    })
  } catch (error) {
    // Log audit errors to console but don't throw to avoid breaking main operations
    console.error('Audit logging failed:', error)
  }
}

/**
 * Get audit log entries with filtering
 */
export async function getAuditLogs(filters: {
  userId?: string
  organizationId?: string
  action?: string
  resource?: string
  from?: Date
  to?: Date
  limit?: number
  offset?: number
}): Promise<any[]> {
  const where: any = {}
  
  if (filters.userId) where.userId = filters.userId
  if (filters.organizationId) where.organizationId = filters.organizationId
  if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' }
  if (filters.resource) where.resource = { contains: filters.resource, mode: 'insensitive' }
  
  if (filters.from || filters.to) {
    where.createdAt = {}
    if (filters.from) where.createdAt.gte = filters.from
    if (filters.to) where.createdAt.lte = filters.to
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 50,
    skip: filters.offset || 0,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  })
}

/**
 * Clean up old audit logs (for data retention)
 */
export async function cleanupAuditLogs(olderThanDays: number = 365): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate }
    }
  })

  return result.count
}