/**
 * Keyword Analytics API Routes
 * Provides comprehensive performance analytics and insights for individual keywords
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { KeywordTrackingService } from '@/lib/keyword-tracking'
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limiting-unified'
import { auditLog } from '@/lib/audit-logger'
import { z } from 'zod'

// Input validation schema
const AnalyticsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
  granularity: z.enum(['hour', 'day', 'week', 'month']).optional().default('day'),
  includeCompetitors: z.boolean().optional().default(false),
  includeForecast: z.boolean().optional().default(false),
  includeOpportunities: z.boolean().optional().default(false)
})

// GET /api/keywords/[id]/analytics - Get comprehensive keyword analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 'keywords-analytics', 50, 60)
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const validation = AnalyticsQuerySchema.safeParse({
      period: searchParams.get('period') || undefined,
      granularity: searchParams.get('granularity') || undefined,
      includeCompetitors: searchParams.get('includeCompetitors') === 'true',
      includeForecast: searchParams.get('includeForecast') === 'true',
      includeOpportunities: searchParams.get('includeOpportunities') === 'true'
    })

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation error',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { period, granularity, includeCompetitors, includeForecast, includeOpportunities } = validation.data

    const keywordService = new KeywordTrackingService()
    
    // Check if keyword exists
    const keyword = await keywordService.getKeywordById(keywordId)
    if (!keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 })
    }

    // Calculate date range
    const now = new Date()
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period]
    const fromDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

    // Get comprehensive analytics data
    const [
      performance,
      rankings,
      accuracyHistory,
      gscData
    ] = await Promise.all([
      keywordService.getKeywordPerformance(keywordId),
      keywordService.getKeywordRankings(keywordId, 1000, fromDate),
      keywordService.getKeywordAccuracyHistory(keywordId, 100, fromDate),
      keywordService.getGSCDataForKeyword(keywordId, fromDate, now)
    ])

    // Process time series data based on granularity
    const timeSeriesData = processTimeSeriesData(rankings, gscData, granularity, fromDate, now)

    // Calculate analytics insights
    const analytics = {
      // Basic metrics
      performance,
      
      // Position analytics
      positionAnalytics: calculatePositionAnalytics(rankings),
      
      // Traffic analytics (GSC data)
      trafficAnalytics: calculateTrafficAnalytics(gscData),
      
      // Confidence scoring analytics
      confidenceAnalytics: calculateConfidenceAnalytics(accuracyHistory),
      
      // Time series data for charts
      timeSeries: timeSeriesData,
      
      // Comparative metrics
      comparative: calculateComparativeMetrics(rankings, period),
      
      // Volatility analysis
      volatility: calculateVolatility(rankings),
      
      // Data quality metrics
      dataQuality: calculateDataQuality(rankings, accuracyHistory)
    }

    // Add competitor analysis if requested
    if (includeCompetitors) {
      analytics.competitors = await getCompetitorAnalysis(keywordService, keyword, fromDate)
    }

    // Add forecast if requested
    if (includeForecast) {
      analytics.forecast = calculateForecast(rankings, 30) // 30-day forecast
    }

    // Add opportunities if requested
    if (includeOpportunities) {
      analytics.opportunities = await calculateOpportunities(keywordService, keyword, rankings)
    }

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId: session.user.organizationId!,
      action: 'keywords.analytics',
      resource: `keyword:${keywordId}`,
      details: {
        keywordId,
        keyword: keyword.keyword,
        projectId: keyword.projectId,
        period,
        granularity,
        includeCompetitors,
        includeForecast,
        includeOpportunities,
        dataPoints: rankings.length
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
      analytics,
      metadata: {
        period,
        granularity,
        dateRange: {
          from: fromDate.toISOString(),
          to: now.toISOString()
        },
        dataPoints: rankings.length,
        accuracyPoints: accuracyHistory.length,
        gscDataPoints: gscData.length,
        generatedAt: new Date().toISOString()
      }
    }, {
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Keyword analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions for analytics calculations

function processTimeSeriesData(rankings: any[], gscData: any[], granularity: string, fromDate: Date, toDate: Date) {
  const timeSeriesMap = new Map()
  
  // Create time buckets based on granularity
  const buckets = generateTimeBuckets(fromDate, toDate, granularity)
  
  buckets.forEach(bucket => {
    timeSeriesMap.set(bucket.key, {
      timestamp: bucket.timestamp,
      position: null,
      clicks: 0,
      impressions: 0,
      ctr: 0,
      confidenceScore: null,
      dataPoints: 0
    })
  })

  // Aggregate ranking data
  rankings.forEach(ranking => {
    const bucketKey = getBucketKey(ranking.checkedAt, granularity)
    if (timeSeriesMap.has(bucketKey)) {
      const bucket = timeSeriesMap.get(bucketKey)
      if (bucket.position === null || ranking.position < bucket.position) {
        bucket.position = ranking.position
      }
      bucket.dataPoints++
    }
  })

  // Aggregate GSC data
  gscData.forEach(data => {
    const bucketKey = getBucketKey(data.date, granularity)
    if (timeSeriesMap.has(bucketKey)) {
      const bucket = timeSeriesMap.get(bucketKey)
      bucket.clicks += data.clicks || 0
      bucket.impressions += data.impressions || 0
      bucket.ctr = bucket.impressions > 0 ? bucket.clicks / bucket.impressions : 0
    }
  })

  return Array.from(timeSeriesMap.values()).sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}

function calculatePositionAnalytics(rankings: any[]) {
  if (rankings.length === 0) {
    return {
      current: null,
      best: null,
      worst: null,
      average: null,
      median: null,
      trend: 'insufficient_data',
      changeFromPrevious: null,
      top10Days: 0,
      top3Days: 0,
      firstPageDays: 0
    }
  }

  const positions = rankings.map(r => r.position || 100)
  const sortedPositions = [...positions].sort((a, b) => a - b)
  
  const current = positions[0]
  const previous = positions[1] || null
  const best = Math.min(...positions)
  const worst = Math.max(...positions)
  const average = positions.reduce((a, b) => a + b, 0) / positions.length
  const median = sortedPositions[Math.floor(sortedPositions.length / 2)]

  // Calculate days in different position ranges
  const top10Days = positions.filter(p => p <= 10).length
  const top3Days = positions.filter(p => p <= 3).length
  const firstPageDays = positions.filter(p => p <= 10).length // Google typically shows 10 results per page

  return {
    current,
    best,
    worst,
    average: Math.round(average * 100) / 100,
    median,
    trend: calculateTrend(rankings),
    changeFromPrevious: previous ? current - previous : null,
    top10Days,
    top3Days,
    firstPageDays,
    distribution: {
      top3: (top3Days / positions.length) * 100,
      top10: (top10Days / positions.length) * 100,
      firstPage: (firstPageDays / positions.length) * 100
    }
  }
}

function calculateTrafficAnalytics(gscData: any[]) {
  if (gscData.length === 0) {
    return {
      totalClicks: 0,
      totalImpressions: 0,
      averageCTR: 0,
      averagePosition: null,
      bestCTR: 0,
      worstCTR: 0,
      trend: 'insufficient_data'
    }
  }

  const totalClicks = gscData.reduce((sum, data) => sum + (data.clicks || 0), 0)
  const totalImpressions = gscData.reduce((sum, data) => sum + (data.impressions || 0), 0)
  const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  
  const positions = gscData.filter(d => d.position).map(d => d.position)
  const averagePosition = positions.length > 0 
    ? positions.reduce((a, b) => a + b, 0) / positions.length 
    : null

  const ctrs = gscData.map(d => d.ctr || 0)
  const bestCTR = Math.max(...ctrs) * 100
  const worstCTR = Math.min(...ctrs) * 100

  return {
    totalClicks,
    totalImpressions,
    averageCTR: Math.round(averageCTR * 100) / 100,
    averagePosition: averagePosition ? Math.round(averagePosition * 100) / 100 : null,
    bestCTR: Math.round(bestCTR * 100) / 100,
    worstCTR: Math.round(worstCTR * 100) / 100,
    trend: calculateTrafficTrend(gscData)
  }
}

function calculateConfidenceAnalytics(accuracyHistory: any[]) {
  if (accuracyHistory.length === 0) {
    return {
      currentScore: null,
      averageScore: null,
      trend: 'insufficient_data',
      reliability: 'unknown',
      discrepancyRate: 0
    }
  }

  const scores = accuracyHistory.map(a => a.confidenceScore)
  const currentScore = scores[0]
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length
  
  const discrepancies = accuracyHistory.filter(a => a.hasDiscrepancies).length
  const discrepancyRate = (discrepancies / accuracyHistory.length) * 100

  let reliability = 'high'
  if (averageScore < 0.7) reliability = 'low'
  else if (averageScore < 0.85) reliability = 'medium'

  return {
    currentScore: Math.round(currentScore * 100) / 100,
    averageScore: Math.round(averageScore * 100) / 100,
    trend: calculateScoreTrend(scores),
    reliability,
    discrepancyRate: Math.round(discrepancyRate * 100) / 100
  }
}

function calculateComparativeMetrics(rankings: any[], period: string) {
  // Compare current period with previous period
  const periodDays = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  }[period]

  const splitPoint = rankings.length / 2
  const currentPeriod = rankings.slice(0, splitPoint)
  const previousPeriod = rankings.slice(splitPoint)

  if (currentPeriod.length === 0 || previousPeriod.length === 0) {
    return {
      positionChange: null,
      improvement: null,
      trend: 'insufficient_data'
    }
  }

  const currentAvg = currentPeriod.reduce((sum, r) => sum + (r.position || 100), 0) / currentPeriod.length
  const previousAvg = previousPeriod.reduce((sum, r) => sum + (r.position || 100), 0) / previousPeriod.length

  const positionChange = previousAvg - currentAvg // Positive = improvement
  const improvement = positionChange > 0

  return {
    positionChange: Math.round(positionChange * 100) / 100,
    improvement,
    trend: improvement ? 'improving' : (positionChange < -1 ? 'declining' : 'stable'),
    currentPeriodAverage: Math.round(currentAvg * 100) / 100,
    previousPeriodAverage: Math.round(previousAvg * 100) / 100
  }
}

function calculateVolatility(rankings: any[]) {
  if (rankings.length < 3) {
    return {
      score: 0,
      level: 'stable',
      standardDeviation: 0
    }
  }

  const positions = rankings.map(r => r.position || 100)
  const mean = positions.reduce((a, b) => a + b, 0) / positions.length
  const variance = positions.reduce((sum, pos) => sum + Math.pow(pos - mean, 2), 0) / positions.length
  const standardDeviation = Math.sqrt(variance)

  let level = 'stable'
  if (standardDeviation > 10) level = 'very_volatile'
  else if (standardDeviation > 5) level = 'volatile'
  else if (standardDeviation > 2) level = 'moderate'

  return {
    score: Math.round(standardDeviation * 100) / 100,
    level,
    standardDeviation: Math.round(standardDeviation * 100) / 100,
    coefficient: Math.round((standardDeviation / mean) * 100 * 100) / 100 // CV percentage
  }
}

function calculateDataQuality(rankings: any[], accuracyHistory: any[]) {
  const totalDataPoints = rankings.length
  const accuracyDataPoints = accuracyHistory.length
  
  // Calculate data freshness (how recent is the data)
  const latestRanking = rankings[0]
  const dataAge = latestRanking 
    ? (Date.now() - new Date(latestRanking.checkedAt).getTime()) / (1000 * 60 * 60) // hours
    : null

  let freshness = 'excellent'
  if (dataAge === null) freshness = 'no_data'
  else if (dataAge > 24) freshness = 'stale'
  else if (dataAge > 6) freshness = 'moderate'
  else if (dataAge > 1) freshness = 'good'

  // Calculate coverage (how much data we have)
  let coverage = 'excellent'
  if (totalDataPoints < 5) coverage = 'poor'
  else if (totalDataPoints < 15) coverage = 'moderate'
  else if (totalDataPoints < 30) coverage = 'good'

  return {
    totalDataPoints,
    accuracyDataPoints,
    freshness,
    coverage,
    dataAge: dataAge ? Math.round(dataAge * 100) / 100 : null,
    completeness: accuracyDataPoints > 0 ? (accuracyDataPoints / totalDataPoints) * 100 : 0
  }
}

// Additional helper functions
function generateTimeBuckets(fromDate: Date, toDate: Date, granularity: string) {
  const buckets = []
  const current = new Date(fromDate)
  
  while (current <= toDate) {
    buckets.push({
      key: getBucketKey(current, granularity),
      timestamp: current.toISOString()
    })
    
    // Increment based on granularity
    switch (granularity) {
      case 'hour':
        current.setHours(current.getHours() + 1)
        break
      case 'day':
        current.setDate(current.getDate() + 1)
        break
      case 'week':
        current.setDate(current.getDate() + 7)
        break
      case 'month':
        current.setMonth(current.getMonth() + 1)
        break
    }
  }
  
  return buckets
}

function getBucketKey(date: Date | string, granularity: string): string {
  const d = new Date(date)
  
  switch (granularity) {
    case 'hour':
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`
    case 'day':
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    case 'week':
      const weekStart = new Date(d.setDate(d.getDate() - d.getDay()))
      return `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`
    case 'month':
      return `${d.getFullYear()}-${d.getMonth()}`
    default:
      return d.toDateString()
  }
}

function calculateTrend(rankings: any[]): 'up' | 'down' | 'stable' | 'insufficient_data' {
  if (rankings.length < 2) return 'insufficient_data'
  
  const recent = rankings.slice(0, Math.ceil(rankings.length / 3))
  const older = rankings.slice(-Math.ceil(rankings.length / 3))
  
  const recentAvg = recent.reduce((sum, r) => sum + (r.position || 100), 0) / recent.length
  const olderAvg = older.reduce((sum, r) => sum + (r.position || 100), 0) / older.length
  
  const difference = olderAvg - recentAvg // Positive = improved (lower position)
  
  if (Math.abs(difference) < 2) return 'stable'
  return difference > 0 ? 'up' : 'down'
}

function calculateTrafficTrend(gscData: any[]): 'up' | 'down' | 'stable' | 'insufficient_data' {
  if (gscData.length < 2) return 'insufficient_data'
  
  const recent = gscData.slice(0, Math.ceil(gscData.length / 3))
  const older = gscData.slice(-Math.ceil(gscData.length / 3))
  
  const recentClicks = recent.reduce((sum, d) => sum + (d.clicks || 0), 0)
  const olderClicks = older.reduce((sum, d) => sum + (d.clicks || 0), 0)
  
  if (olderClicks === 0) return 'insufficient_data'
  
  const changePercent = ((recentClicks - olderClicks) / olderClicks) * 100
  
  if (Math.abs(changePercent) < 10) return 'stable'
  return changePercent > 0 ? 'up' : 'down'
}

function calculateScoreTrend(scores: number[]): 'up' | 'down' | 'stable' | 'insufficient_data' {
  if (scores.length < 3) return 'insufficient_data'
  
  const recent = scores.slice(0, Math.ceil(scores.length / 3))
  const older = scores.slice(-Math.ceil(scores.length / 3))
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
  
  const difference = recentAvg - olderAvg
  
  if (Math.abs(difference) < 0.05) return 'stable'
  return difference > 0 ? 'up' : 'down'
}

// Placeholder functions for advanced features
async function getCompetitorAnalysis(keywordService: any, keyword: any, fromDate: Date) {
  // This would integrate with competitor tracking data
  // For now, return placeholder
  return {
    competitors: [],
    analysis: 'Competitor analysis requires additional setup'
  }
}

function calculateForecast(rankings: any[], days: number) {
  // Simple linear regression forecast
  // In production, this would use more sophisticated ML models
  if (rankings.length < 7) {
    return {
      forecast: null,
      confidence: 'low',
      message: 'Insufficient data for forecasting'
    }
  }
  
  return {
    forecast: null,
    confidence: 'low',
    message: 'Forecasting requires additional implementation'
  }
}

async function calculateOpportunities(keywordService: any, keyword: any, rankings: any[]) {
  // Analyze opportunities based on ranking patterns
  // This would include SERP feature opportunities, quick wins, etc.
  return {
    quickWins: [],
    longTerm: [],
    serpFeatures: [],
    message: 'Opportunity detection requires additional implementation'
  }
}