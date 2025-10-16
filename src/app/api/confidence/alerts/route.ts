export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Confidence Threshold Alerts API
 * Manages confidence-based alerts and notifications for data quality monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { KeywordTrackingService } from '@/lib/keyword-tracking'
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limiting-unified'
import { auditLog } from '@/lib/audit-logger'
import { z } from 'zod'


// Input validation schemas
const CreateAlertSchema = z.object({
  projectId: z.string().cuid(),
  organizationId: z.string().cuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  conditions: z.object({
    confidenceThreshold: z.number().min(0).max(1),
    comparison: z.enum(['below', 'above', 'equals']),
    keywordFilters: z.object({
      tags: z.array(z.string()).optional(),
      category: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      specificKeywords: z.array(z.string().cuid()).optional()
    }).optional(),
    triggerCount: z.number().min(1).max(100).optional().default(1) // How many keywords must meet criteria
  }),
  notifications: z.object({
    email: z.boolean().default(true),
    webhook: z.string().url().optional(),
    slack: z.string().optional(),
    frequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']).default('immediate'),
    suppressDuration: z.number().min(0).max(86400).optional().default(3600) // seconds
  }),
  enabled: z.boolean().default(true)
})

const UpdateAlertSchema = z.object({
  alertId: z.string().cuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  conditions: z.object({
    confidenceThreshold: z.number().min(0).max(1).optional(),
    comparison: z.enum(['below', 'above', 'equals']).optional(),
    keywordFilters: z.object({
      tags: z.array(z.string()).optional(),
      category: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      specificKeywords: z.array(z.string().cuid()).optional()
    }).optional(),
    triggerCount: z.number().min(1).max(100).optional()
  }).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    webhook: z.string().url().optional(),
    slack: z.string().optional(),
    frequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']).optional(),
    suppressDuration: z.number().min(0).max(86400).optional()
  }).optional(),
  enabled: z.boolean().optional()
})

const TriggerCheckSchema = z.object({
  projectId: z.string().cuid(),
  organizationId: z.string().cuid(),
  keywordIds: z.array(z.string().cuid()).optional(),
  forceCheck: z.boolean().optional().default(false)
})

// POST /api/confidence/alerts - Create or manage confidence alerts
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 'confidence-alerts', 20, 60)
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

    // Handle different alert operations
    switch (operation) {
      case 'create':
        return await handleCreateAlert(body, keywordService, session, rateLimitResult)
      
      case 'update':
        return await handleUpdateAlert(body, keywordService, session, rateLimitResult)
      
      case 'trigger-check':
        return await handleTriggerCheck(body, keywordService, session, rateLimitResult)
      
      default:
        return NextResponse.json({ error: 'Invalid operation. Use "create", "update", or "trigger-check".' }, { status: 400 })
    }

  } catch (error) {
    console.error('Confidence alerts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle alert creation
async function handleCreateAlert(
  body: any,
  keywordService: KeywordTrackingService,
  session: any,
  rateLimitResult: any
) {
  const validation = CreateAlertSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation error',
      details: validation.error.issues
    }, { status: 400 })
  }

  const alertData = validation.data

  try {
    // Verify project access
    const project = await keywordService.getProjectById(alertData.projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create alert
    const alert = await keywordService.createConfidenceAlert({
      ...alertData,
      userId: session.user.id!,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Test the alert conditions to estimate trigger frequency
    const testResults = await testAlertConditions(alertData, keywordService)

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId: alertData.organizationId,
      action: 'confidence.alert.create',
      resource: `alert:${alert.id}`,
      details: {
        projectId: alertData.projectId,
        alertName: alertData.name,
        conditions: alertData.conditions,
        notifications: alertData.notifications,
        estimatedTriggers: testResults.matchingKeywords
      }
    })

    return NextResponse.json({
      message: 'Confidence alert created successfully',
      alert,
      testResults,
      estimatedImpact: {
        currentlyTriggered: testResults.matchingKeywords,
        totalKeywordsInScope: testResults.totalKeywords,
        triggerRate: testResults.totalKeywords > 0 
          ? Math.round((testResults.matchingKeywords / testResults.totalKeywords) * 100) / 100
          : 0
      }
    }, {
      status: 201,
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Error creating confidence alert:', error)
    return NextResponse.json({
      error: 'Failed to create confidence alert',
      details: error.message
    }, { status: 500 })
  }
}

// Handle alert update
async function handleUpdateAlert(
  body: any,
  keywordService: KeywordTrackingService,
  session: any,
  rateLimitResult: any
) {
  const validation = UpdateAlertSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation error',
      details: validation.error.issues
    }, { status: 400 })
  }

  const { alertId, ...updates } = validation.data

  try {
    // Get existing alert
    const existingAlert = await keywordService.getConfidenceAlert(alertId)
    if (!existingAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    // Check user access
    if (existingAlert.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to modify this alert' }, { status: 403 })
    }

    // Update alert
    const updatedAlert = await keywordService.updateConfidenceAlert(alertId, {
      ...updates,
      updatedAt: new Date()
    })

    // Test updated conditions if they changed
    let testResults = null
    if (updates.conditions) {
      testResults = await testAlertConditions({
        projectId: existingAlert.projectId,
        ...updates
      }, keywordService)
    }

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId: existingAlert.organizationId,
      action: 'confidence.alert.update',
      resource: `alert:${alertId}`,
      details: {
        changes: updates,
        estimatedTriggers: testResults?.matchingKeywords
      }
    })

    return NextResponse.json({
      message: 'Confidence alert updated successfully',
      alert: updatedAlert,
      testResults
    }, {
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Error updating confidence alert:', error)
    return NextResponse.json({
      error: 'Failed to update confidence alert',
      details: error.message
    }, { status: 500 })
  }
}

// Handle trigger check
async function handleTriggerCheck(
  body: any,
  keywordService: KeywordTrackingService,
  session: any,
  rateLimitResult: any
) {
  const validation = TriggerCheckSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation error',
      details: validation.error.issues
    }, { status: 400 })
  }

  const { projectId, organizationId, keywordIds, forceCheck } = validation.data
  const startTime = Date.now()

  try {
    // Get active alerts for the project
    const alerts = await keywordService.getConfidenceAlerts({
      projectId,
      enabled: true
    })

    if (alerts.length === 0) {
      return NextResponse.json({
        message: 'No active confidence alerts found for this project',
        projectId,
        triggeredAlerts: []
      })
    }

    // Check each alert
    const triggeredAlerts = []
    const alertResults = []

    for (const alert of alerts) {
      try {
        // Check if alert should be suppressed (recently triggered)
        if (!forceCheck && await isAlertSuppressed(alert)) {
          continue
        }

        // Evaluate alert conditions
        const evaluation = await evaluateAlertConditions(
          alert,
          keywordService,
          keywordIds
        )

        alertResults.push({
          alertId: alert.id,
          alertName: alert.name,
          triggered: evaluation.triggered,
          matchingKeywords: evaluation.matchingKeywords,
          triggerCount: evaluation.triggerCount
        })

        if (evaluation.triggered) {
          triggeredAlerts.push({
            alert,
            evaluation,
            triggeredAt: new Date()
          })

          // Send notifications
          await sendAlertNotifications(alert, evaluation)

          // Update alert last triggered time
          await keywordService.updateAlertLastTriggered(alert.id, new Date())
        }

      } catch (alertError) {
        console.error(`Error evaluating alert ${alert.id}:`, alertError)
        alertResults.push({
          alertId: alert.id,
          alertName: alert.name,
          error: alertError.message
        })
      }
    }

    const duration = Date.now() - startTime

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId,
      action: 'confidence.alert.trigger-check',
      resource: `project:${projectId}`,
      details: {
        projectId,
        alertsChecked: alerts.length,
        alertsTriggered: triggeredAlerts.length,
        keywordIds,
        forceCheck,
        duration
      }
    })

    return NextResponse.json({
      message: `Alert check completed: ${triggeredAlerts.length} alerts triggered`,
      alertResults,
      triggeredAlerts: triggeredAlerts.map(t => ({
        alertId: t.alert.id,
        alertName: t.alert.name,
        triggerCount: t.evaluation.triggerCount,
        matchingKeywords: t.evaluation.matchingKeywords.slice(0, 5), // Limit for response size
        triggeredAt: t.triggeredAt
      })),
      summary: {
        totalAlerts: alerts.length,
        triggeredAlerts: triggeredAlerts.length,
        suppressedAlerts: alerts.length - alertResults.length,
        checkDuration: duration
      }
    }, {
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Trigger check error:', error)
    return NextResponse.json({
      error: 'Alert trigger check failed',
      details: error.message,
      projectId
    }, { status: 500 })
  }
}

// GET /api/confidence/alerts - List confidence alerts
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 'confidence-alerts-read', 50, 60)
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
    const organizationId = searchParams.get('organizationId')
    const projectId = searchParams.get('projectId')
    const enabled = searchParams.get('enabled')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const keywordService = new KeywordTrackingService()

    // Get alerts based on filters
    const alerts = await keywordService.getConfidenceAlerts({
      organizationId,
      projectId,
      enabled: enabled ? enabled === 'true' : undefined,
      userId: session.user.id // Only user's alerts
    })

    // Get trigger history for each alert
    const alertsWithHistory = await Promise.all(
      alerts.map(async (alert) => {
        const triggerHistory = await keywordService.getAlertTriggerHistory(alert.id, 10)
        
        return {
          ...alert,
          triggerHistory: triggerHistory.length,
          lastTriggered: triggerHistory[0]?.triggeredAt || null,
          avgTriggersPerDay: calculateAvgTriggersPerDay(triggerHistory),
          status: alert.enabled ? 'active' : 'paused'
        }
      })
    )

    return NextResponse.json({
      alerts: alertsWithHistory,
      summary: {
        total: alerts.length,
        active: alerts.filter(a => a.enabled).length,
        paused: alerts.filter(a => !a.enabled).length,
        recentlyTriggered: alertsWithHistory.filter(a => 
          a.lastTriggered && new Date(a.lastTriggered) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length
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
    console.error('Confidence alerts GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/confidence/alerts - Delete confidence alert
export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 'confidence-alerts-delete', 10, 60)
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
    const alertId = searchParams.get('id')

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 })
    }

    const keywordService = new KeywordTrackingService()

    // Get and verify alert
    const alert = await keywordService.getConfidenceAlert(alertId)
    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    if (alert.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this alert' }, { status: 403 })
    }

    // Delete alert and related data
    await keywordService.deleteConfidenceAlert(alertId)

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId: alert.organizationId,
      action: 'confidence.alert.delete',
      resource: `alert:${alertId}`,
      details: {
        alertName: alert.name,
        projectId: alert.projectId,
        deletedAt: new Date().toISOString()
      }
    })

    return NextResponse.json({
      message: 'Confidence alert deleted successfully',
      alertId
    }, {
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Alert delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions

async function testAlertConditions(alertData: any, keywordService: KeywordTrackingService): Promise<any> {
  try {
    // Get keywords that would match the alert conditions
    const keywords = await keywordService.getProjectKeywords(alertData.projectId, {
      tags: alertData.conditions.keywordFilters?.tags,
      category: alertData.conditions.keywordFilters?.category,
      priority: alertData.conditions.keywordFilters?.priority
    })

    let matchingKeywords = 0

    for (const keyword of keywords) {
      // Get latest confidence score
      const accuracy = await keywordService.getKeywordAccuracyHistory(keyword.id, 1)
      if (accuracy.length === 0) continue

      const confidenceScore = accuracy[0].confidenceScore
      const { confidenceThreshold, comparison } = alertData.conditions

      const matches = 
        (comparison === 'below' && confidenceScore < confidenceThreshold) ||
        (comparison === 'above' && confidenceScore > confidenceThreshold) ||
        (comparison === 'equals' && Math.abs(confidenceScore - confidenceThreshold) < 0.01)

      if (matches) {
        matchingKeywords++
      }
    }

    return {
      totalKeywords: keywords.length,
      matchingKeywords,
      wouldTrigger: matchingKeywords >= (alertData.conditions.triggerCount || 1)
    }

  } catch (error) {
    console.error('Error testing alert conditions:', error)
    return {
      totalKeywords: 0,
      matchingKeywords: 0,
      wouldTrigger: false,
      error: error.message
    }
  }
}

async function isAlertSuppressed(alert: any): Promise<boolean> {
  if (!alert.lastTriggered || !alert.suppressDuration) {
    return false
  }

  const suppressUntil = new Date(alert.lastTriggered.getTime() + alert.suppressDuration * 1000)
  return new Date() < suppressUntil
}

async function evaluateAlertConditions(
  alert: any,
  keywordService: KeywordTrackingService,
  keywordIds?: string[]
): Promise<any> {
  try {
    // Get keywords to check
    let keywords
    if (keywordIds && keywordIds.length > 0) {
      keywords = await keywordService.getKeywordsByIds(keywordIds)
      keywords = keywords.filter(k => k.projectId === alert.projectId)
    } else {
      keywords = await keywordService.getProjectKeywords(alert.projectId, {
        tags: alert.conditions.keywordFilters?.tags,
        category: alert.conditions.keywordFilters?.category,
        priority: alert.conditions.keywordFilters?.priority
      })
    }

    const matchingKeywords = []

    for (const keyword of keywords) {
      const accuracy = await keywordService.getKeywordAccuracyHistory(keyword.id, 1)
      if (accuracy.length === 0) continue

      const confidenceScore = accuracy[0].confidenceScore
      const { confidenceThreshold, comparison } = alert.conditions

      const matches = 
        (comparison === 'below' && confidenceScore < confidenceThreshold) ||
        (comparison === 'above' && confidenceScore > confidenceThreshold) ||
        (comparison === 'equals' && Math.abs(confidenceScore - confidenceThreshold) < 0.01)

      if (matches) {
        matchingKeywords.push({
          keywordId: keyword.id,
          keyword: keyword.keyword,
          confidenceScore,
          threshold: confidenceThreshold,
          comparison
        })
      }
    }

    const triggerCount = alert.conditions.triggerCount || 1
    const triggered = matchingKeywords.length >= triggerCount

    return {
      triggered,
      matchingKeywords,
      triggerCount: matchingKeywords.length,
      threshold: triggerCount
    }

  } catch (error) {
    console.error('Error evaluating alert conditions:', error)
    throw error
  }
}

async function sendAlertNotifications(alert: any, evaluation: any): Promise<void> {
  try {
    const { notifications } = alert
    const { matchingKeywords } = evaluation

    // Email notification
    if (notifications.email) {
      // This would integrate with your email service
      console.log('Sending email notification for alert:', alert.name)
    }

    // Webhook notification
    if (notifications.webhook) {
      try {
        await fetch(notifications.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'confidence_alert_triggered',
            alert: {
              id: alert.id,
              name: alert.name,
              projectId: alert.projectId
            },
            trigger: {
              matchingKeywords: matchingKeywords.length,
              threshold: alert.conditions.triggerCount,
              keywords: matchingKeywords.slice(0, 10) // Limit for webhook payload
            },
            timestamp: new Date().toISOString()
          })
        })
      } catch (webhookError) {
        console.error('Webhook notification failed:', webhookError)
      }
    }

    // Slack notification
    if (notifications.slack) {
      // This would integrate with Slack API
      console.log('Sending Slack notification for alert:', alert.name)
    }

  } catch (error) {
    console.error('Error sending alert notifications:', error)
  }
}

function calculateAvgTriggersPerDay(triggerHistory: any[]): number {
  if (triggerHistory.length === 0) return 0

  const now = new Date()
  const earliest = new Date(triggerHistory[triggerHistory.length - 1].triggeredAt)
  const daysDiff = Math.max(1, Math.ceil((now.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24)))

  return Math.round((triggerHistory.length / daysDiff) * 100) / 100
}