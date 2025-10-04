/**
 * Real-time Keyword Rank Tracking API
 * Provides real-time rank tracking with Google Search Console integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { KeywordTrackingService } from '@/lib/keyword-tracking'
import { rateLimitAPI, rateLimitHeaders } from '@/lib/rate-limiting-unified'
import { auditLog } from '@/lib/audit-logger'
import { z } from 'zod'

// Input validation schemas
const TrackKeywordsSchema = z.object({
  keywordIds: z.array(z.string().cuid()).min(1).max(50),
  projectId: z.string().cuid(),
  sources: z.array(z.string()).min(1).max(3).optional().default(['GSC']),
  priority: z.enum(['low', 'normal', 'high']).optional().default('normal'),
  webhook: z.string().url().optional()
})

const BulkTrackSchema = z.object({
  projectId: z.string().cuid(),
  filters: z.object({
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    minImpressions: z.number().min(0).optional().default(10),
    maxKeywords: z.number().min(1).max(200).optional().default(100)
  }).optional().default({}),
  sources: z.array(z.string()).min(1).max(3).optional().default(['GSC'])
})

// POST /api/tracking/realtime - Start real-time tracking for specific keywords
export async function POST(request: NextRequest) {
  try {
    // Rate limiting (restrictive for real-time tracking)
    const rateLimitResult = await rateLimitAPI(request, 'realtime-tracking', 10, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Real-time tracking is limited to 10 requests per minute.' },
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
    const { operation = 'track' } = body

    const keywordService = new KeywordTrackingService()

    // Handle different tracking operations
    switch (operation) {
      case 'track':
        return await handleKeywordTracking(body, keywordService, session, rateLimitResult)
      
      case 'bulk':
        return await handleBulkTracking(body, keywordService, session, rateLimitResult)
      
      default:
        return NextResponse.json({ error: 'Invalid operation. Use "track" or "bulk".' }, { status: 400 })
    }

  } catch (error) {
    console.error('Real-time tracking API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle individual keyword tracking
async function handleKeywordTracking(
  body: any,
  keywordService: KeywordTrackingService,
  session: any,
  rateLimitResult: any
) {
  const validation = TrackKeywordsSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation error',
      details: validation.error.issues
    }, { status: 400 })
  }

  const { keywordIds, projectId, sources, priority, webhook } = validation.data
  const startTime = Date.now()
  
  const results = {
    successful: 0,
    failed: 0,
    results: [] as any[],
    errors: [] as string[]
  }

  // Track each keyword
  for (const keywordId of keywordIds) {
    try {
      // Get keyword info
      const keyword = await keywordService.getKeywordById(keywordId)
      if (!keyword) {
        results.failed++
        results.errors.push(`Keyword ${keywordId} not found`)
        continue
      }

      if (keyword.projectId !== projectId) {
        results.failed++
        results.errors.push(`Keyword ${keywordId} does not belong to project ${projectId}`)
        continue
      }

      // Track rankings from specified sources
      const rankings = await keywordService.trackKeywordRanking(
        keywordId,
        projectId,
        session.user.id!,
        sources
      )

      // Calculate confidence score
      const accuracyData = await keywordService.calculateKeywordAccuracy(
        keywordId,
        rankings
      )

      results.successful++
      results.results.push({
        keywordId,
        keyword: keyword.keyword,
        rankings,
        accuracyData,
        sources,
        trackedAt: new Date().toISOString()
      })

      // Add delay between requests to be respectful to APIs
      if (keywordIds.length > 1) {
        await new Promise(resolve => setTimeout(resolve, priority === 'high' ? 500 : 1000))
      }

    } catch (error) {
      results.failed++
      results.errors.push(`Keyword ${keywordId}: ${error.message}`)
      console.error(`Error tracking keyword ${keywordId}:`, error)
    }
  }

  const duration = Date.now() - startTime

  // Send webhook notification if provided
  if (webhook) {
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'keywords_tracked',
          projectId,
          results,
          duration,
          timestamp: new Date().toISOString()
        })
      })
    } catch (webhookError) {
      console.error('Webhook notification failed:', webhookError)
    }
  }

  // Audit logging
  await auditLog({
    userId: session.user.id!,
    organizationId: session.user.organizationId!,
    action: 'tracking.realtime.keywords',
    resource: `project:${projectId}`,
    details: {
      keywordIds,
      sources,
      priority,
      results: {
        successful: results.successful,
        failed: results.failed
      },
      duration
    }
  })

  return NextResponse.json({
    message: `Real-time tracking completed: ${results.successful} successful, ${results.failed} failed`,
    results,
    metadata: {
      projectId,
      sources,
      priority,
      duration,
      keywordsPerSecond: Math.round((results.successful / duration) * 1000),
      webhook: !!webhook
    },
    timestamp: new Date().toISOString()
  }, {
    headers: rateLimitHeaders(rateLimitResult)
  })
}

// Handle bulk project tracking
async function handleBulkTracking(
  body: any,
  keywordService: KeywordTrackingService,
  session: any,
  rateLimitResult: any
) {
  const validation = BulkTrackSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation error',
      details: validation.error.issues
    }, { status: 400 })
  }

  const { projectId, filters, sources } = validation.data
  const startTime = Date.now()

  try {
    // Get keywords based on filters
    const keywords = await keywordService.getProjectKeywords(projectId, {
      tags: filters.tags,
      category: filters.category,
      priority: filters.priority,
      limit: filters.maxKeywords
    })

    if (keywords.length === 0) {
      return NextResponse.json({
        message: 'No keywords found matching the filters',
        filters,
        projectId
      }, { headers: rateLimitHeaders(rateLimitResult) })
    }

    const results = {
      successful: 0,
      failed: 0,
      results: [] as any[],
      errors: [] as string[]
    }

    // Track keywords in batches
    const batchSize = 10
    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (keyword) => {
        try {
          const rankings = await keywordService.trackKeywordRanking(
            keyword.id,
            projectId,
            session.user.id!,
            sources
          )

          const accuracyData = await keywordService.calculateKeywordAccuracy(
            keyword.id,
            rankings
          )

          results.successful++
          results.results.push({
            keywordId: keyword.id,
            keyword: keyword.keyword,
            rankings: rankings.length,
            confidenceScore: accuracyData.confidenceScore,
            hasDiscrepancies: accuracyData.hasDiscrepancies
          })

        } catch (error) {
          results.failed++
          results.errors.push(`Keyword ${keyword.keyword}: ${error.message}`)
          console.error(`Error tracking keyword ${keyword.id}:`, error)
        }
      }))

      // Delay between batches
      if (i + batchSize < keywords.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    const duration = Date.now() - startTime

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId: session.user.organizationId!,
      action: 'tracking.realtime.bulk',
      resource: `project:${projectId}`,
      details: {
        filters,
        sources,
        totalKeywords: keywords.length,
        results: {
          successful: results.successful,
          failed: results.failed
        },
        duration
      }
    })

    return NextResponse.json({
      message: `Bulk tracking completed: ${results.successful} successful, ${results.failed} failed`,
      results,
      metadata: {
        projectId,
        filters,
        sources,
        totalKeywords: keywords.length,
        duration,
        keywordsPerSecond: Math.round((results.successful / duration) * 1000)
      },
      timestamp: new Date().toISOString()
    }, {
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Bulk tracking error:', error)
    
    await auditLog({
      userId: session.user.id!,
      organizationId: session.user.organizationId!,
      action: 'tracking.realtime.bulk.error',
      resource: `project:${projectId}`,
      details: {
        filters,
        error: error.message,
        duration: Date.now() - startTime
      }
    })

    return NextResponse.json({
      error: 'Bulk tracking failed',
      details: error.message,
      projectId
    }, { status: 500 })
  }
}

// GET /api/tracking/realtime - Get real-time tracking status
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitAPI(request, 'tracking-status', 50, 60)
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

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const keywordService = new KeywordTrackingService()

    // Get tracking status
    const trackingHistory = await keywordService.getSyncHistory(
      organizationId,
      projectId,
      10
    )

    // Get current tracking queue (simulated for now)
    const trackingQueue = {
      pending: 0,
      inProgress: 0,
      completed: 0,
      failed: 0
    }

    // Get recent tracking statistics
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    const recentActivity = trackingHistory.filter(entry => 
      new Date(entry.createdAt) >= oneHourAgo &&
      entry.action.includes('tracking')
    )

    return NextResponse.json({
      status: 'operational',
      trackingQueue,
      recentActivity: recentActivity.length,
      trackingHistory: trackingHistory.slice(0, 5), // Last 5 entries
      capabilities: {
        sources: ['GSC', 'SerpAPI', 'Manual'],
        maxKeywordsPerRequest: 50,
        maxBulkKeywords: 200,
        rateLimit: '10 requests per minute',
        supportedCountries: ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT'],
        supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt']
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
    console.error('Real-time tracking status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}