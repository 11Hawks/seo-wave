/**
 * Keyword Tracking Scheduler API
 * Manages scheduled and automated keyword rank tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { KeywordTrackingService } from '@/lib/keyword-tracking'
import { rateLimitAPI, rateLimitHeaders } from '@/lib/rate-limiting-unified'
import { auditLog } from '@/lib/audit-logger'
import { z } from 'zod'

// Input validation schemas
const ScheduleTrackingSchema = z.object({
  projectId: z.string().cuid(),
  organizationId: z.string().cuid(),
  schedule: z.object({
    frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(), // HH:MM format
    days: z.array(z.number().min(0).max(6)).optional(), // 0=Sunday, 6=Saturday
    timezone: z.string().optional().default('UTC')
  }),
  settings: z.object({
    sources: z.array(z.string()).min(1).max(3).default(['GSC']),
    maxKeywords: z.number().min(1).max(500).default(100),
    filters: z.object({
      tags: z.array(z.string()).optional(),
      category: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      minImpressions: z.number().min(0).optional().default(10)
    }).optional().default({}),
    notifications: z.object({
      email: z.boolean().default(false),
      webhook: z.string().url().optional(),
      onlySignificantChanges: z.boolean().default(true),
      threshold: z.number().min(1).max(50).default(5) // Position change threshold
    }).optional().default({})
  })
})

const UpdateScheduleSchema = z.object({
  scheduleId: z.string().cuid(),
  enabled: z.boolean().optional(),
  schedule: z.object({
    frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    days: z.array(z.number().min(0).max(6)).optional(),
    timezone: z.string().optional()
  }).optional(),
  settings: z.object({
    sources: z.array(z.string()).min(1).max(3).optional(),
    maxKeywords: z.number().min(1).max(500).optional(),
    filters: z.object({
      tags: z.array(z.string()).optional(),
      category: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      minImpressions: z.number().min(0).optional()
    }).optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      webhook: z.string().url().optional(),
      onlySignificantChanges: z.boolean().optional(),
      threshold: z.number().min(1).max(50).optional()
    }).optional()
  }).optional()
})

// POST /api/tracking/schedule - Create or update tracking schedule
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitAPI(request, 'tracking-schedule', 20, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) }
      )
    }

    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { operation = 'create' } = body

    const keywordService = new KeywordTrackingService()

    switch (operation) {
      case 'create':
        return await handleCreateSchedule(body, keywordService, session, rateLimitResult)
      
      case 'update':
        return await handleUpdateSchedule(body, keywordService, session, rateLimitResult)
      
      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
    }

  } catch (error) {
    console.error('Tracking schedule API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle schedule creation
async function handleCreateSchedule(
  body: any,
  keywordService: KeywordTrackingService,
  session: any,
  rateLimitResult: any
) {
  const validation = ScheduleTrackingSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation error',
      details: validation.error.issues
    }, { status: 400 })
  }

  const { projectId, organizationId, schedule, settings } = validation.data

  try {
    // Verify project exists and user has access
    const project = await keywordService.getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Calculate next execution time
    const nextExecution = calculateNextExecution(schedule)

    // Create tracking schedule record
    const trackingSchedule = await keywordService.createTrackingSchedule({
      projectId,
      organizationId,
      userId: session.user.id!,
      schedule,
      settings,
      nextExecution,
      enabled: true
    })

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId,
      action: 'tracking.schedule.create',
      resource: `schedule:${trackingSchedule.id}`,
      details: {
        projectId,
        schedule,
        settings,
        nextExecution
      }
    })

    return NextResponse.json({
      message: 'Tracking schedule created successfully',
      schedule: trackingSchedule,
      nextExecution,
      estimatedKeywords: await estimateKeywordCount(keywordService, projectId, settings.filters)
    }, {
      status: 201,
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Error creating tracking schedule:', error)
    return NextResponse.json({
      error: 'Failed to create tracking schedule',
      details: error.message
    }, { status: 500 })
  }
}

// Handle schedule update
async function handleUpdateSchedule(
  body: any,
  keywordService: KeywordTrackingService,
  session: any,
  rateLimitResult: any
) {
  const validation = UpdateScheduleSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation error',
      details: validation.error.issues
    }, { status: 400 })
  }

  const { scheduleId, enabled, schedule, settings } = validation.data

  try {
    // Get existing schedule
    const existingSchedule = await keywordService.getTrackingSchedule(scheduleId)
    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // Check user access (should be project owner or admin)
    if (existingSchedule.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to modify this schedule' }, { status: 403 })
    }

    // Calculate new next execution if schedule changed
    const nextExecution = schedule 
      ? calculateNextExecution(schedule)
      : existingSchedule.nextExecution

    // Update schedule
    const updatedSchedule = await keywordService.updateTrackingSchedule(scheduleId, {
      enabled,
      schedule,
      settings,
      nextExecution
    })

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId: existingSchedule.organizationId,
      action: 'tracking.schedule.update',
      resource: `schedule:${scheduleId}`,
      details: {
        changes: { enabled, schedule, settings },
        nextExecution
      }
    })

    return NextResponse.json({
      message: 'Tracking schedule updated successfully',
      schedule: updatedSchedule,
      nextExecution
    }, {
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Error updating tracking schedule:', error)
    return NextResponse.json({
      error: 'Failed to update tracking schedule',
      details: error.message
    }, { status: 500 })
  }
}

// GET /api/tracking/schedule - List tracking schedules
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitAPI(request, 'tracking-schedule-read', 50, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) }
      )
    }

    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const organizationId = searchParams.get('organizationId')
    const enabled = searchParams.get('enabled')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const keywordService = new KeywordTrackingService()

    // Get schedules based on filters
    const schedules = await keywordService.getTrackingSchedules({
      organizationId,
      projectId,
      enabled: enabled ? enabled === 'true' : undefined,
      userId: session.user.id // Only user's schedules
    })

    // Get execution history for each schedule
    const schedulesWithHistory = await Promise.all(
      schedules.map(async (schedule) => {
        const executions = await keywordService.getScheduleExecutions(schedule.id, 5)
        const nextRun = schedule.nextExecution
        const lastRun = executions[0]?.executedAt || null
        
        return {
          ...schedule,
          executions: executions.length,
          lastRun,
          nextRun,
          status: schedule.enabled ? 'active' : 'paused',
          recentExecutions: executions.slice(0, 3)
        }
      })
    )

    return NextResponse.json({
      schedules: schedulesWithHistory,
      summary: {
        total: schedules.length,
        active: schedules.filter(s => s.enabled).length,
        paused: schedules.filter(s => !s.enabled).length,
        projects: new Set(schedules.map(s => s.projectId)).size
      },
      metadata: {
        organizationId,
        projectId,
        generatedAt: new Date().toISOString()
      }
    }, {
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Tracking schedules GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/tracking/schedule - Delete a tracking schedule
export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitAPI(request, 'tracking-schedule-delete', 10, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) }
      )
    }

    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('id')

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 })
    }

    const keywordService = new KeywordTrackingService()

    // Get and verify schedule
    const schedule = await keywordService.getTrackingSchedule(scheduleId)
    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    if (schedule.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this schedule' }, { status: 403 })
    }

    // Delete schedule and related data
    await keywordService.deleteTrackingSchedule(scheduleId)

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId: schedule.organizationId,
      action: 'tracking.schedule.delete',
      resource: `schedule:${scheduleId}`,
      details: {
        projectId: schedule.projectId,
        deletedAt: new Date().toISOString()
      }
    })

    return NextResponse.json({
      message: 'Tracking schedule deleted successfully',
      scheduleId
    }, {
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Schedule delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions

function calculateNextExecution(schedule: any): Date {
  const now = new Date()
  const next = new Date(now)

  switch (schedule.frequency) {
    case 'hourly':
      next.setHours(next.getHours() + 1, 0, 0, 0)
      break
    
    case 'daily':
      if (schedule.time) {
        const [hours, minutes] = schedule.time.split(':').map(Number)
        next.setHours(hours, minutes, 0, 0)
        if (next <= now) {
          next.setDate(next.getDate() + 1)
        }
      } else {
        next.setDate(next.getDate() + 1)
        next.setHours(0, 0, 0, 0)
      }
      break
    
    case 'weekly':
      const targetDay = schedule.days?.[0] || 1 // Default to Monday
      const currentDay = next.getDay()
      const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7
      next.setDate(next.getDate() + daysUntilTarget)
      
      if (schedule.time) {
        const [hours, minutes] = schedule.time.split(':').map(Number)
        next.setHours(hours, minutes, 0, 0)
      } else {
        next.setHours(0, 0, 0, 0)
      }
      break
    
    case 'monthly':
      next.setMonth(next.getMonth() + 1, 1)
      if (schedule.time) {
        const [hours, minutes] = schedule.time.split(':').map(Number)
        next.setHours(hours, minutes, 0, 0)
      } else {
        next.setHours(0, 0, 0, 0)
      }
      break
    
    default:
      // Default to daily
      next.setDate(next.getDate() + 1)
      next.setHours(0, 0, 0, 0)
  }

  return next
}

async function estimateKeywordCount(
  keywordService: KeywordTrackingService,
  projectId: string,
  filters: any
): Promise<number> {
  try {
    return await keywordService.countKeywords({
      projectId,
      ...(filters.tags && { tags: { hasSome: filters.tags } }),
      ...(filters.category && { category: filters.category }),
      ...(filters.priority && { priority: filters.priority })
    })
  } catch (error) {
    console.error('Error estimating keyword count:', error)
    return 0
  }
}