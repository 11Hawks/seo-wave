/**
 * Keyword Rank Tracking API Routes
 * Handles real-time rank tracking and confidence scoring for individual keywords
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { KeywordTrackingService, getKeywordTrackingService } from '@/lib/keyword-tracking'
import { rateLimitAPI, rateLimitHeaders } from '@/lib/rate-limiting-unified'
import { auditLog } from '@/lib/audit-logger'
import { z } from 'zod'

// Input validation schemas
const TrackKeywordSchema = z.object({
  sources: z.array(z.string()).min(1).max(5).optional().default(['GSC']),
  force: z.boolean().optional().default(false),
  calculateAccuracy: z.boolean().optional().default(true)
})

// POST /api/keywords/[id]/track - Track keyword ranking
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting (more restrictive for tracking operations)
    const rateLimitResult = await rateLimitAPI(request, 'keyword-tracking', 20, 60)
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

    const keywordId = params.id

    // Parse and validate request body
    const body = await request.json()
    const validation = TrackKeywordSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation error',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { sources, force, calculateAccuracy } = validation.data

    const keywordService = getKeywordTrackingService()
    
    // Check if keyword exists and get basic info
    const keyword = await keywordService.getKeywordById(keywordId)
    if (!keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 })
    }

    // Check if tracking is needed (avoid unnecessary API calls)
    if (!force) {
      const recentRanking = await keywordService.getLatestRanking(keywordId)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      
      if (recentRanking && recentRanking.checkedAt > fiveMinutesAgo) {
        return NextResponse.json({
          message: 'Recent ranking data available, use force=true to refresh',
          keyword: {
            id: keyword.id,
            keyword: keyword.keyword,
            projectId: keyword.projectId
          },
          latestRanking: recentRanking,
          cached: true
        }, {
          headers: rateLimitHeaders(rateLimitResult)
        })
      }
    }

    try {
      // Track keyword rankings from specified sources
      const rankings = await keywordService.trackKeywordRanking(
        keywordId,
        keyword.projectId,
        session.user.id!,
        sources
      )

      let accuracyData = null
      if (calculateAccuracy && rankings.length > 0) {
        // Calculate confidence scoring for the new rankings
        accuracyData = await keywordService.calculateKeywordAccuracy(
          keywordId,
          rankings
        )
      }

      // Get updated performance metrics
      const performance = await keywordService.getKeywordPerformance(keywordId)

      // Audit logging
      await auditLog({
        userId: session.user.id!,
        organizationId: session.user.organizationId!,
        action: 'keywords.track',
        resource: `keyword:${keywordId}`,
        details: {
          keywordId,
          keyword: keyword.keyword,
          projectId: keyword.projectId,
          sources,
          force,
          rankingsFound: rankings.length,
          confidenceScore: accuracyData?.confidenceScore,
          hasDiscrepancies: accuracyData?.hasDiscrepancies
        }
      })

      return NextResponse.json({
        message: 'Keyword tracking completed',
        keyword: {
          id: keyword.id,
          keyword: keyword.keyword,
          projectId: keyword.projectId
        },
        rankings,
        accuracyData,
        performance,
        trackingMetadata: {
          sources,
          timestamp: new Date().toISOString(),
          force,
          calculateAccuracy
        }
      }, {
        headers: rateLimitHeaders(rateLimitResult)
      })

    } catch (trackingError) {
      console.error('Keyword tracking error:', trackingError)
      
      // Audit logging for errors
      await auditLog({
        userId: session.user.id!,
        organizationId: session.user.organizationId!,
        action: 'keywords.track.error',
        resource: `keyword:${keywordId}`,
        details: {
          keywordId,
          keyword: keyword.keyword,
          projectId: keyword.projectId,
          sources,
          error: trackingError.message
        }
      })

      return NextResponse.json({
        error: 'Keyword tracking failed',
        details: trackingError.message,
        keyword: {
          id: keyword.id,
          keyword: keyword.keyword,
          projectId: keyword.projectId
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Keyword tracking API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/keywords/[id]/track - Get tracking history and status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitAPI(request, 'keywords-read', 100, 60)
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

    const keywordId = params.id

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100)
    const includeAccuracy = searchParams.get('includeAccuracy') === 'true'
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, 1y

    const keywordService = getKeywordTrackingService()
    
    // Check if keyword exists
    const keyword = await keywordService.getKeywordById(keywordId)
    if (!keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 })
    }

    // Calculate date range based on period
    const now = new Date()
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period] || 30

    const fromDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

    // Get ranking history
    const rankings = await keywordService.getKeywordRankings(
      keywordId,
      limit,
      fromDate
    )

    // Get accuracy history if requested
    let accuracyHistory = null
    if (includeAccuracy) {
      accuracyHistory = await keywordService.getKeywordAccuracyHistory(
        keywordId,
        limit,
        fromDate
      )
    }

    // Get current performance metrics
    const performance = await keywordService.getKeywordPerformance(keywordId)

    // Calculate tracking statistics
    const trackingStats = {
      totalChecks: rankings.length,
      firstCheck: rankings.length > 0 ? rankings[rankings.length - 1].checkedAt : null,
      lastCheck: rankings.length > 0 ? rankings[0].checkedAt : null,
      averagePosition: rankings.length > 0 
        ? rankings.reduce((sum, r) => sum + (r.position || 0), 0) / rankings.length 
        : null,
      bestPosition: rankings.length > 0 
        ? Math.min(...rankings.map(r => r.position || 100)) 
        : null,
      worstPosition: rankings.length > 0 
        ? Math.max(...rankings.map(r => r.position || 0)) 
        : null,
      positionTrend: calculateTrend(rankings),
      dataSourcesUsed: [...new Set(rankings.map(r => r.source))],
      period: period,
      dateRange: {
        from: fromDate.toISOString(),
        to: now.toISOString()
      }
    }

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId: session.user.organizationId!,
      action: 'keywords.track.history',
      resource: `keyword:${keywordId}`,
      details: {
        keywordId,
        keyword: keyword.keyword,
        projectId: keyword.projectId,
        period,
        limit,
        includeAccuracy,
        rankingsCount: rankings.length
      }
    })

    return NextResponse.json({
      keyword: {
        id: keyword.id,
        keyword: keyword.keyword,
        projectId: keyword.projectId,
        tags: keyword.tags,
        category: keyword.category,
        priority: keyword.priority
      },
      rankings,
      accuracyHistory,
      performance,
      trackingStats,
      metadata: {
        period,
        limit,
        includeAccuracy,
        generatedAt: new Date().toISOString()
      }
    }, {
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Keyword tracking history API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate position trend
function calculateTrend(rankings: any[]): 'up' | 'down' | 'stable' | 'insufficient_data' {
  if (rankings.length < 2) {
    return 'insufficient_data'
  }

  // Sort by date (newest first)
  const sortedRankings = [...rankings].sort(
    (a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime()
  )

  // Compare recent positions (last 3 vs previous 3)
  const recentPositions = sortedRankings.slice(0, 3).map(r => r.position || 100)
  const previousPositions = sortedRankings.slice(3, 6).map(r => r.position || 100)

  if (previousPositions.length === 0) {
    return 'insufficient_data'
  }

  const recentAvg = recentPositions.reduce((a, b) => a + b, 0) / recentPositions.length
  const previousAvg = previousPositions.reduce((a, b) => a + b, 0) / previousPositions.length

  const difference = previousAvg - recentAvg // Positive = improved (lower position number)
  
  if (Math.abs(difference) < 2) {
    return 'stable'
  }
  
  return difference > 0 ? 'up' : 'down'
}