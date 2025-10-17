export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Keyword Confidence Scoring API
 * Advanced confidence scoring system for keyword ranking data accuracy
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { KeywordTrackingService } from '@/lib/keyword-tracking'
import { DataAccuracyEngine } from '@/lib/data-accuracy-engine'
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limiting-unified'
import { auditLog } from '@/lib/audit-logger'
import { z } from 'zod'


// Input validation schemas
const CalculateScoreSchema = z.object({
  keywordId: z.string().cuid(),
  projectId: z.string().cuid(),
  recalculate: z.boolean().optional().default(false),
  includeHistorical: z.boolean().optional().default(true),
  sources: z.array(z.string()).optional(),
  customWeights: z.object({
    freshness: z.number().min(0).max(1).optional(),
    consistency: z.number().min(0).max(1).optional(),
    reliability: z.number().min(0).max(1).optional(),
    coverage: z.number().min(0).max(1).optional()
  }).optional()
})

const BulkScoreSchema = z.object({
  projectId: z.string().cuid(),
  keywordIds: z.array(z.string().cuid()).min(1).max(100).optional(),
  filters: z.object({
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    minConfidence: z.number().min(0).max(1).optional(),
    maxConfidence: z.number().min(0).max(1).optional()
  }).optional().default({}),
  customWeights: z.object({
    freshness: z.number().min(0).max(1).optional(),
    consistency: z.number().min(0).max(1).optional(),
    reliability: z.number().min(0).max(1).optional(),
    coverage: z.number().min(0).max(1).optional()
  }).optional()
})

// POST /api/confidence/score - Calculate confidence scores
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 'confidence-scoring', 30, 60)
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
    const { operation = 'single' } = body

    const keywordService = new KeywordTrackingService()
    const accuracyEngine = new DataAccuracyEngine()

    // Handle different scoring operations
    switch (operation) {
      case 'single':
        return await handleSingleKeywordScoring(body, keywordService, accuracyEngine, session, rateLimitResult)
      
      case 'bulk':
        return await handleBulkKeywordScoring(body, keywordService, accuracyEngine, session, rateLimitResult)
      
      default:
        return NextResponse.json({ error: 'Invalid operation. Use "single" or "bulk".' }, { status: 400 })
    }

  } catch (error) {
    console.error('Confidence scoring API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle single keyword confidence scoring
async function handleSingleKeywordScoring(
  body: any,
  keywordService: KeywordTrackingService,
  accuracyEngine: DataAccuracyEngine,
  session: any,
  rateLimitResult: any
) {
  const validation = CalculateScoreSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation error',
      details: validation.error.issues
    }, { status: 400 })
  }

  const { keywordId, projectId, recalculate, includeHistorical, sources, customWeights } = validation.data

  try {
    // Get keyword and verify access
    const keyword = await keywordService.getKeywordById(keywordId)
    if (!keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 })
    }

    if (keyword.projectId !== projectId) {
      return NextResponse.json({ error: 'Keyword does not belong to specified project' }, { status: 403 })
    }

    // Get rankings data
    const daysBack = includeHistorical ? 30 : 7
    const fromDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
    
    let rankings = await keywordService.getKeywordRankings(keywordId, 1000, fromDate)
    
    // Filter by sources if specified
    if (sources && sources.length > 0) {
      rankings = rankings.filter(r => sources.includes(r.source || 'UNKNOWN'))
    }

    if (rankings.length === 0) {
      return NextResponse.json({
        error: 'No ranking data found for confidence scoring',
        keywordId,
        suggestion: 'Track the keyword first to generate ranking data'
      }, { status: 404 })
    }

    // Calculate enhanced confidence score
    const confidenceMetrics = await calculateEnhancedConfidenceScore(
      keyword,
      rankings,
      customWeights
    )

    // Store/update confidence data if recalculate is true
    if (recalculate) {
      await keywordService.calculateKeywordAccuracy(keywordId, rankings)
    }

    // Get historical confidence trend
    const confidenceHistory = includeHistorical 
      ? await keywordService.getKeywordAccuracyHistory(keywordId, 10, fromDate)
      : []

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId: session.user.organizationId!,
      action: 'confidence.score.calculate',
      resource: `keyword:${keywordId}`,
      details: {
        keywordId,
        projectId,
        sources,
        daysBack,
        rankingDataPoints: rankings.length,
        confidenceScore: confidenceMetrics.overall,
        customWeights
      }
    })

    return NextResponse.json({
      keywordId,
      keyword: keyword.keyword,
      confidenceMetrics,
      dataQuality: {
        dataPoints: rankings.length,
        dateRange: {
          from: fromDate.toISOString(),
          to: new Date().toISOString()
        },
        sources: [...new Set(rankings.map(r => r.source))],
        coverage: calculateDataCoverage(rankings, daysBack)
      },
      historicalTrend: confidenceHistory.map(h => ({
        score: h.confidenceScore,
        calculatedAt: h.calculatedAt,
        hasDiscrepancies: h.hasDiscrepancies
      })),
      recommendations: generateConfidenceRecommendations(confidenceMetrics, rankings),
      calculatedAt: new Date().toISOString()
    }, {
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Single keyword scoring error:', error)
    return NextResponse.json({
      error: 'Failed to calculate confidence score',
      details: error.message,
      keywordId
    }, { status: 500 })
  }
}

// Handle bulk keyword confidence scoring
async function handleBulkKeywordScoring(
  body: any,
  keywordService: KeywordTrackingService,
  accuracyEngine: DataAccuracyEngine,
  session: any,
  rateLimitResult: any
) {
  const validation = BulkScoreSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation error',
      details: validation.error.issues
    }, { status: 400 })
  }

  const { projectId, keywordIds, filters, customWeights } = validation.data
  const startTime = Date.now()

  try {
    // Get keywords based on filters or specific IDs
    let keywords
    if (keywordIds && keywordIds.length > 0) {
      keywords = await keywordService.getKeywordsByIds(keywordIds)
      keywords = keywords.filter(k => k.projectId === projectId) // Verify project access
    } else {
      keywords = await keywordService.getProjectKeywords(projectId, filters)
    }

    if (keywords.length === 0) {
      return NextResponse.json({
        message: 'No keywords found matching the criteria',
        projectId,
        filters
      })
    }

    const results = {
      successful: 0,
      failed: 0,
      results: [] as any[],
      errors: [] as string[]
    }

    // Process keywords in batches
    const batchSize = 20
    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (keyword) => {
        try {
          // Get rankings for the keyword
          const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
          const rankings = await keywordService.getKeywordRankings(keyword.id, 100, fromDate)

          if (rankings.length === 0) {
            results.errors.push(`No ranking data for keyword: ${keyword.keyword}`)
            return
          }

          // Calculate confidence score
          const confidenceMetrics = await calculateEnhancedConfidenceScore(
            keyword,
            rankings,
            customWeights
          )

          // Apply confidence filters if specified
          if (filters.minConfidence && confidenceMetrics.overall < filters.minConfidence) {
            return // Skip low confidence keywords
          }
          
          if (filters.maxConfidence && confidenceMetrics.overall > filters.maxConfidence) {
            return // Skip high confidence keywords
          }

          results.successful++
          results.results.push({
            keywordId: keyword.id,
            keyword: keyword.keyword,
            confidenceScore: confidenceMetrics.overall,
            breakdown: confidenceMetrics,
            dataPoints: rankings.length,
            lastUpdated: rankings[0]?.checkedAt,
            sources: [...new Set(rankings.map(r => r.source))]
          })

        } catch (error) {
          results.failed++
          results.errors.push(`Keyword ${keyword.keyword}: ${error.message}`)
          console.error(`Error calculating confidence for keyword ${keyword.id}:`, error)
        }
      }))
    }

    const duration = Date.now() - startTime

    // Generate bulk insights
    const bulkInsights = generateBulkInsights(results.results)

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId: session.user.organizationId!,
      action: 'confidence.score.bulk',
      resource: `project:${projectId}`,
      details: {
        projectId,
        totalKeywords: keywords.length,
        successful: results.successful,
        failed: results.failed,
        filters,
        customWeights,
        duration
      }
    })

    return NextResponse.json({
      message: `Bulk confidence scoring completed: ${results.successful} successful, ${results.failed} failed`,
      results,
      bulkInsights,
      metadata: {
        projectId,
        totalKeywords: keywords.length,
        filters,
        customWeights,
        duration,
        keywordsPerSecond: Math.round((results.successful / duration) * 1000)
      },
      timestamp: new Date().toISOString()
    }, {
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Bulk scoring error:', error)
    return NextResponse.json({
      error: 'Bulk confidence scoring failed',
      details: error.message,
      projectId
    }, { status: 500 })
  }
}

// GET /api/confidence/score - Get confidence scoring insights
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 'confidence-read', 100, 60)
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

    // Get confidence scoring overview
    const projects = projectId 
      ? [await keywordService.getProjectById(projectId)]
      : await keywordService.getOrganizationProjects(organizationId)

    const overview = await Promise.all(
      projects.filter(Boolean).map(async (project) => {
        const keywords = await keywordService.getProjectKeywords(project.id, { limit: 1000 })
        
        const confidenceStats = {
          total: keywords.length,
          high: 0, // > 0.8
          medium: 0, // 0.5 - 0.8
          low: 0, // < 0.5
          noData: 0
        }

        keywords.forEach(keyword => {
          const score = keyword.keywordAccuracy?.[0]?.confidenceScore || 0
          if (score === 0) confidenceStats.noData++
          else if (score > 0.8) confidenceStats.high++
          else if (score > 0.5) confidenceStats.medium++
          else confidenceStats.low++
        })

        return {
          projectId: project.id,
          projectName: project.name,
          confidenceStats,
          averageScore: keywords.length > 0 
            ? keywords.reduce((sum, k) => sum + (k.keywordAccuracy?.[0]?.confidenceScore || 0), 0) / keywords.length
            : 0
        }
      })
    )

    return NextResponse.json({
      overview,
      globalStats: {
        totalProjects: overview.length,
        totalKeywords: overview.reduce((sum, p) => sum + p.confidenceStats.total, 0),
        averageConfidence: overview.length > 0 
          ? overview.reduce((sum, p) => sum + p.averageScore, 0) / overview.length 
          : 0,
        distribution: {
          high: overview.reduce((sum, p) => sum + p.confidenceStats.high, 0),
          medium: overview.reduce((sum, p) => sum + p.confidenceStats.medium, 0),
          low: overview.reduce((sum, p) => sum + p.confidenceStats.low, 0),
          noData: overview.reduce((sum, p) => sum + p.confidenceStats.noData, 0)
        }
      },
      scoringInfo: {
        factors: ['Data Freshness', 'Cross-source Consistency', 'Historical Reliability', 'Data Coverage'],
        defaultWeights: { freshness: 0.3, consistency: 0.3, reliability: 0.25, coverage: 0.15 },
        updateFrequency: 'Real-time with each tracking operation',
        retentionPeriod: '365 days'
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
    console.error('Confidence scoring overview API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions

async function calculateEnhancedConfidenceScore(
  keyword: any,
  rankings: any[],
  customWeights?: any
): Promise<any> {
  // Default weights
  const weights = {
    freshness: customWeights?.freshness ?? 0.3,
    consistency: customWeights?.consistency ?? 0.3,
    reliability: customWeights?.reliability ?? 0.25,
    coverage: customWeights?.coverage ?? 0.15
  }

  // Calculate individual factors
  const freshness = calculateFreshnessScore(rankings)
  const consistency = calculateConsistencyScore(rankings)
  const reliability = calculateReliabilityScore(rankings, keyword)
  const coverage = calculateCoverageScore(rankings)

  // Calculate weighted overall score
  const overall = (
    freshness * weights.freshness +
    consistency * weights.consistency +
    reliability * weights.reliability +
    coverage * weights.coverage
  )

  return {
    overall: Math.round(overall * 100) / 100,
    breakdown: {
      freshness: Math.round(freshness * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
      reliability: Math.round(reliability * 100) / 100,
      coverage: Math.round(coverage * 100) / 100
    },
    weights,
    metadata: {
      dataPoints: rankings.length,
      sources: [...new Set(rankings.map(r => r.source))],
      dateRange: {
        from: rankings[rankings.length - 1]?.checkedAt,
        to: rankings[0]?.checkedAt
      }
    }
  }
}

function calculateFreshnessScore(rankings: any[]): number {
  if (rankings.length === 0) return 0

  const now = new Date().getTime()
  const latest = new Date(rankings[0].checkedAt).getTime()
  const ageHours = (now - latest) / (1000 * 60 * 60)

  // Score decreases as data gets older
  if (ageHours <= 1) return 1.0
  if (ageHours <= 6) return 0.9
  if (ageHours <= 24) return 0.8
  if (ageHours <= 72) return 0.6
  if (ageHours <= 168) return 0.4 // 1 week
  return 0.2
}

function calculateConsistencyScore(rankings: any[]): number {
  if (rankings.length < 2) return 0.5

  const positions = rankings.map(r => r.position || 100)
  const mean = positions.reduce((a, b) => a + b, 0) / positions.length
  const variance = positions.reduce((sum, pos) => sum + Math.pow(pos - mean, 2), 0) / positions.length
  const standardDeviation = Math.sqrt(variance)

  // Lower deviation = higher consistency
  if (standardDeviation <= 2) return 1.0
  if (standardDeviation <= 5) return 0.8
  if (standardDeviation <= 10) return 0.6
  if (standardDeviation <= 20) return 0.4
  return 0.2
}

function calculateReliabilityScore(rankings: any[], keyword: any): number {
  if (rankings.length === 0) return 0

  // Factor in multiple aspects
  let score = 0.5 // Base score

  // Source reliability
  const sources = [...new Set(rankings.map(r => r.source))]
  if (sources.includes('GSC')) score += 0.3 // GSC is highly reliable
  if (sources.includes('SerpAPI')) score += 0.2
  if (sources.length > 1) score += 0.1 // Multi-source verification

  // Data completeness
  const withClicks = rankings.filter(r => r.clicks !== null && r.clicks !== undefined).length
  const clicksRatio = withClicks / rankings.length
  score += clicksRatio * 0.1

  // Historical stability
  if (rankings.length >= 7) score += 0.1 // At least a week of data
  if (rankings.length >= 30) score += 0.1 // At least a month of data

  return Math.min(1.0, score)
}

function calculateCoverageScore(rankings: any[]): number {
  if (rankings.length === 0) return 0

  const daysCovered = new Set()
  rankings.forEach(ranking => {
    const date = new Date(ranking.checkedAt).toDateString()
    daysCovered.add(date)
  })

  // Score based on how many unique days we have data for
  const uniqueDays = daysCovered.size
  if (uniqueDays >= 30) return 1.0
  if (uniqueDays >= 14) return 0.8
  if (uniqueDays >= 7) return 0.6
  if (uniqueDays >= 3) return 0.4
  return 0.2
}

function calculateDataCoverage(rankings: any[], daysBack: number): number {
  const uniqueDays = new Set()
  rankings.forEach(ranking => {
    const date = new Date(ranking.checkedAt).toDateString()
    uniqueDays.add(date)
  })

  return Math.round((uniqueDays.size / daysBack) * 100) / 100
}

function generateConfidenceRecommendations(confidenceMetrics: any, rankings: any[]): string[] {
  const recommendations = []
  const { overall, breakdown } = confidenceMetrics

  if (overall < 0.6) {
    recommendations.push('Consider tracking this keyword more frequently to improve data confidence')
  }

  if (breakdown.freshness < 0.7) {
    recommendations.push('Data is getting stale. Consider more frequent tracking updates')
  }

  if (breakdown.consistency < 0.6) {
    recommendations.push('High position volatility detected. Monitor for ranking fluctuations')
  }

  if (breakdown.coverage < 0.5) {
    recommendations.push('Limited data coverage. Increase tracking frequency for better insights')
  }

  if (rankings.length < 7) {
    recommendations.push('Collect more historical data points for improved confidence scoring')
  }

  const sources = [...new Set(rankings.map(r => r.source))]
  if (sources.length === 1) {
    recommendations.push('Consider adding additional data sources for cross-validation')
  }

  if (recommendations.length === 0) {
    recommendations.push('Confidence scoring looks good. Continue current tracking practices')
  }

  return recommendations
}

function generateBulkInsights(results: any[]): any {
  if (results.length === 0) return {}

  const scores = results.map(r => r.confidenceScore)
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length

  const distribution = {
    high: results.filter(r => r.confidenceScore > 0.8).length,
    medium: results.filter(r => r.confidenceScore >= 0.5 && r.confidenceScore <= 0.8).length,
    low: results.filter(r => r.confidenceScore < 0.5).length
  }

  const topKeywords = results
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, 5)
    .map(r => ({ keyword: r.keyword, score: r.confidenceScore }))

  const bottomKeywords = results
    .sort((a, b) => a.confidenceScore - b.confidenceScore)
    .slice(0, 5)
    .map(r => ({ keyword: r.keyword, score: r.confidenceScore }))

  return {
    averageScore: Math.round(avgScore * 100) / 100,
    distribution,
    topPerforming: topKeywords,
    needsAttention: bottomKeywords,
    totalDataPoints: results.reduce((sum, r) => sum + r.dataPoints, 0)
  }
}