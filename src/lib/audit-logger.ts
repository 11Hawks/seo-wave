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
    const data: any = {
      userId: entry.userId,
      organizationId: entry.organizationId,
      action: entry.action as any,
      entityType: entry.resource,
      metadata: entry.details || {},
    }

    if (entry.details?.entityId) {
      data.entityId = entry.details.entityId
    }

    if (entry.ipAddress) {
      data.ipAddress = entry.ipAddress
    }

    if (entry.userAgent) {
      data.userAgent = entry.userAgent
    }

    await prisma.auditLog.create({ data })
  } catch (error) {
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
  startDate?: Date
  endDate?: Date
  from?: Date
  to?: Date
  limit?: number
  offset?: number
  page?: number
  success?: boolean
}): Promise<{ logs: any[], total: number }> {
  const where: any = {}

  if (filters.userId) where.userId = filters.userId
  if (filters.organizationId) where.organizationId = filters.organizationId
  if (filters.action) where.action = filters.action
  if (filters.resource) where.entityType = filters.resource

  // Support both from/to and startDate/endDate for compatibility
  const startDate = filters.startDate || filters.from
  const endDate = filters.endDate || filters.to

  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = startDate
    if (endDate) where.timestamp.lte = endDate
  }

  // Calculate pagination
  let limit = filters.limit || 50
  let offset = filters.offset || 0

  // If page is provided, calculate offset from page
  if (filters.page !== undefined && filters.page > 0) {
    offset = (filters.page - 1) * limit
  }

  // Cap limit at 100 to prevent excessive queries
  if (limit > 100) {
    limit = 100
  }

  // Get total count for pagination
  const total = await prisma.auditLog.count({ where })

  // Get paginated logs
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: limit,
    skip: offset,
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

  return { logs, total }
}

/**
 * Clean up old audit logs (for data retention)
 */
export async function cleanupAuditLogs(olderThanDays: number = 365): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

  const result = await prisma.auditLog.deleteMany({
    where: {
      timestamp: { lt: cutoffDate }
    }
  })

  return result.count
}