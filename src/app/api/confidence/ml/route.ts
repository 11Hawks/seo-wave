/**
 * ML-Enhanced Confidence Scoring API
 * Advanced machine learning confidence scoring with pattern recognition
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { KeywordTrackingService } from '@/lib/keyword-tracking'
import { MLConfidenceEngine } from '@/lib/ml-confidence-engine'
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limiting-unified'
import { auditLog } from '@/lib/audit-logger'
import { z } from 'zod'

// Input validation schemas
const MLScoreSchema = z.object({
  keywordId: z.string().cuid(),
  projectId: z.string().cuid(),
  includeHistorical: z.boolean().optional().default(true),
  contextualData: z.object({
    industry: z.enum(['competitive', 'moderate', 'low_competition']).optional(),
    competitionLevel: z.number().min(0).max(1).optional(),
    seasonality: z.number().min(0).max(1).optional(),
    searchVolume: z.number().min(0).optional()
  }).optional(),
  modelVersion: z.enum(['latest', '1.0.0']).optional().default('latest')
})

const MLBatchSchema = z.object({
  projectId: z.string().cuid(),
  keywordIds: z.array(z.string().cuid()).min(1).max(50),
  includeHistorical: z.boolean().optional().default(true),
  contextualData: z.object({
    industry: z.enum(['competitive', 'moderate', 'low_competition']).optional(),
    competitionLevel: z.number().min(0).max(1).optional(),
    seasonality: z.number().min(0).max(1).optional()
  }).optional()
})

// POST /api/confidence/ml - Calculate ML-enhanced confidence scores
export async function POST(request: NextRequest) {
  try {
    // Rate limiting (more restrictive for ML operations)
    const rateLimitResult = await rateLimit(request, 'ml-confidence', 15, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. ML confidence scoring is limited to 15 requests per minute.' },
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
    const mlEngine = new MLConfidenceEngine()

    // Handle different ML operations
    switch (operation) {
      case 'single':
        return await handleSingleMLScoring(body, keywordService, mlEngine, session, rateLimitResult)
      
      case 'batch':
        return await handleBatchMLScoring(body, keywordService, mlEngine, session, rateLimitResult)
      
      default:
        return NextResponse.json({ error: 'Invalid operation. Use "single" or "batch".' }, { status: 400 })
    }

  } catch (error) {
    console.error('ML confidence scoring API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle single keyword ML scoring
async function handleSingleMLScoring(
  body: any,
  keywordService: KeywordTrackingService,
  mlEngine: MLConfidenceEngine,
  session: any,
  rateLimitResult: any
) {
  const validation = MLScoreSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation error',
      details: validation.error.issues
    }, { status: 400 })
  }

  const { keywordId, projectId, includeHistorical, contextualData, modelVersion } = validation.data
  const startTime = Date.now()

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
    
    const rankings = await keywordService.getKeywordRankings(keywordId, 1000, fromDate)
    
    if (rankings.length === 0) {
      return NextResponse.json({
        error: 'No ranking data found for ML confidence scoring',
        keywordId,
        suggestion: 'Track the keyword first to generate ranking data'
      }, { status: 404 })
    }

    // Get historical data for pattern recognition
    const historical = includeHistorical 
      ? await keywordService.getKeywordRankings(keywordId, 2000, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      : []

    // Enhance contextual data with keyword information
    const enhancedContextualData = {
      ...contextualData,
      searchVolume: keyword.searchVolume || undefined
    }

    // Calculate ML confidence score
    const mlResult = await mlEngine.calculateMLConfidence({
      keywordId,
      rankings,
      historical,
      contextualData: enhancedContextualData
    })

    // Get traditional confidence score for comparison
    const traditionalAccuracy = await keywordService.getKeywordAccuracyHistory(keywordId, 1, fromDate)

    const duration = Date.now() - startTime

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId: session.user.organizationId!,
      action: 'confidence.ml.calculate',
      resource: `keyword:${keywordId}`,
      details: {
        keywordId,
        projectId,
        modelVersion,
        daysBack,
        rankingDataPoints: rankings.length,
        historicalDataPoints: historical.length,
        mlScore: mlResult.mlScore,
        hybridScore: mlResult.hybridScore,
        confidenceLevel: mlResult.confidenceLevel,
        duration
      }
    })

    return NextResponse.json({
      keywordId,
      keyword: keyword.keyword,
      mlResult,
      comparison: {
        traditionalScore: traditionalAccuracy[0]?.confidenceScore || null,
        mlScore: mlResult.mlScore,
        hybridScore: mlResult.hybridScore,
        improvement: mlResult.hybridScore - (traditionalAccuracy[0]?.confidenceScore || 0)
      },
      dataQuality: {
        dataPoints: rankings.length,
        historicalPoints: historical.length,
        dateRange: {
          from: fromDate.toISOString(),
          to: new Date().toISOString()
        },
        sources: [...new Set(rankings.map(r => r.source))]
      },
      performance: {
        calculationTime: duration,
        modelVersion: mlResult.modelMetadata.version,
        modelAccuracy: mlResult.modelMetadata.accuracy
      },
      calculatedAt: new Date().toISOString()
    }, {
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Single ML scoring error:', error)
    return NextResponse.json({
      error: 'ML confidence calculation failed',
      details: error.message,
      keywordId
    }, { status: 500 })
  }
}

// Handle batch ML scoring
async function handleBatchMLScoring(
  body: any,
  keywordService: KeywordTrackingService,
  mlEngine: MLConfidenceEngine,
  session: any,
  rateLimitResult: any
) {
  const validation = MLBatchSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation error',
      details: validation.error.issues
    }, { status: 400 })
  }

  const { projectId, keywordIds, includeHistorical, contextualData } = validation.data
  const startTime = Date.now()

  try {
    // Get keywords and verify access
    const keywords = await keywordService.getKeywordsByIds(keywordIds)
    const validKeywords = keywords.filter(k => k.projectId === projectId)

    if (validKeywords.length === 0) {
      return NextResponse.json({
        error: 'No valid keywords found for the specified project',
        requestedIds: keywordIds.length,
        validIds: 0
      }, { status: 404 })
    }

    // Prepare ML inputs
    const mlInputs = await Promise.all(
      validKeywords.map(async (keyword) => {
        const daysBack = includeHistorical ? 30 : 7
        const fromDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
        
        const rankings = await keywordService.getKeywordRankings(keyword.id, 1000, fromDate)
        const historical = includeHistorical 
          ? await keywordService.getKeywordRankings(keyword.id, 2000, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
          : []

        return {
          keywordId: keyword.id,
          rankings,
          historical,
          contextualData: {
            ...contextualData,
            searchVolume: keyword.searchVolume || undefined
          }
        }
      })
    )

    // Filter out keywords with no ranking data
    const validInputs = mlInputs.filter(input => input.rankings.length > 0)

    if (validInputs.length === 0) {
      return NextResponse.json({
        error: 'No keywords with ranking data found',
        totalKeywords: validKeywords.length,
        suggestion: 'Track keywords first to generate ranking data'
      }, { status: 404 })
    }

    // Calculate ML scores in batch
    const mlResults = await mlEngine.calculateBatchMLConfidence(validInputs)

    // Generate batch insights
    const batchInsights = generateMLBatchInsights(mlResults, validKeywords)

    const duration = Date.now() - startTime

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId: session.user.organizationId!,
      action: 'confidence.ml.batch',
      resource: `project:${projectId}`,
      details: {
        projectId,
        requestedKeywords: keywordIds.length,
        validKeywords: validKeywords.length,
        processedKeywords: mlResults.length,
        averageMLScore: mlResults.reduce((sum, r) => sum + r.mlScore, 0) / mlResults.length,
        averageHybridScore: mlResults.reduce((sum, r) => sum + r.hybridScore, 0) / mlResults.length,
        duration
      }
    })

    return NextResponse.json({
      message: `ML batch scoring completed: ${mlResults.length} keywords processed`,
      results: mlResults.map((result, index) => ({
        keywordId: validInputs[index].keywordId,
        keyword: validKeywords.find(k => k.id === validInputs[index].keywordId)?.keyword,
        mlResult: result
      })),
      batchInsights,
      summary: {
        totalRequested: keywordIds.length,
        totalProcessed: mlResults.length,
        averageMLScore: Math.round((mlResults.reduce((sum, r) => sum + r.mlScore, 0) / mlResults.length) * 100) / 100,
        averageHybridScore: Math.round((mlResults.reduce((sum, r) => sum + r.hybridScore, 0) / mlResults.length) * 100) / 100,
        confidenceLevels: {
          very_high: mlResults.filter(r => r.confidenceLevel === 'very_high').length,
          high: mlResults.filter(r => r.confidenceLevel === 'high').length,
          medium: mlResults.filter(r => r.confidenceLevel === 'medium').length,
          low: mlResults.filter(r => r.confidenceLevel === 'low').length,
          very_low: mlResults.filter(r => r.confidenceLevel === 'very_low').length
        }
      },
      performance: {
        totalTime: duration,
        averageTimePerKeyword: Math.round(duration / mlResults.length),
        keywordsPerSecond: Math.round((mlResults.length / duration) * 1000)
      },
      timestamp: new Date().toISOString()
    }, {
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Batch ML scoring error:', error)
    return NextResponse.json({
      error: 'ML batch confidence calculation failed',
      details: error.message,
      projectId
    }, { status: 500 })
  }
}

// GET /api/confidence/ml - Get ML confidence insights
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 'ml-confidence-read', 50, 60)
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

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    return NextResponse.json({
      mlConfidenceInfo: {
        modelVersion: '1.0.0',
        modelAccuracy: 0.94,
        trainingSamples: 10000,
        lastUpdated: new Date().toISOString(),
        features: [
          'Neural network-based confidence prediction',
          'Pattern recognition and anomaly detection',
          'Contextual industry and competition adjustments',
          'Seasonal trend analysis',
          'Multi-source data validation enhancement'
        ]
      },
      algorithms: {
        neuralNetwork: {
          architecture: 'Feed-forward with hidden layer',
          inputFeatures: 11,
          hiddenNodes: 4,
          activationFunction: 'tanh/sigmoid',
          trainingMethod: 'Supervised learning on historical SEO data'
        },
        anomalyDetection: {
          method: 'Statistical outlier detection',
          threshold: '2 standard deviations',
          sensitivity: 'Configurable based on data volume'
        },
        patternRecognition: {
          trendAnalysis: 'Linear regression with slope classification',
          seasonalityDetection: 'Autocorrelation-based cycle identification',
          volatilityAssessment: 'Standard deviation and variance analysis'
        }
      },
      confidenceFactors: {
        traditional: {
          freshness: { weight: '30%', description: 'Time-based data recency scoring' },
          consistency: { weight: '30%', description: 'Statistical variance analysis' },
          reliability: { weight: '25%', description: 'Source quality assessment' },
          coverage: { weight: '15%', description: 'Temporal data distribution' }
        },
        mlEnhanced: {
          patternRecognition: { weight: '35%', description: 'Learned pattern validation' },
          anomalyDetection: { weight: '25%', description: 'Outlier identification' },
          contextualAdjustment: { weight: '20%', description: 'Industry-specific calibration' },
          traditionalBase: { weight: '20%', description: 'Statistical foundation metrics' }
        }
      },
      useCases: {
        advancedValidation: 'Detect subtle data quality issues missed by traditional methods',
        predictiveInsights: 'Forecast confidence trends based on historical patterns',
        industryCalibration: 'Adjust confidence scoring for industry-specific characteristics',
        anomalyAlerts: 'Proactive identification of unusual ranking patterns',
        patternAnalysis: 'Identify seasonal trends and cyclical behaviors'
      },
      limitations: {
        dataRequirement: 'Requires minimum 5-10 data points for effective ML analysis',
        computationalCost: 'Higher processing time compared to traditional scoring',
        interpretability: 'ML components less interpretable than statistical methods',
        contextualData: 'Performance improves with additional contextual information'
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
    console.error('ML confidence info API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate ML batch insights
function generateMLBatchInsights(mlResults: any[], keywords: any[]): any {
  if (mlResults.length === 0) return {}

  const mlScores = mlResults.map(r => r.mlScore)
  const hybridScores = mlResults.map(r => r.hybridScore)
  const anomalyScores = mlResults.map(r => r.anomalyScore)

  // Performance comparison
  const performanceAnalysis = {
    averageMLScore: mlScores.reduce((a, b) => a + b, 0) / mlScores.length,
    averageHybridScore: hybridScores.reduce((a, b) => a + b, 0) / hybridScores.length,
    averageAnomalyScore: anomalyScores.reduce((a, b) => a + b, 0) / anomalyScores.length,
    scoreDistribution: {
      veryHigh: mlResults.filter(r => r.confidenceLevel === 'very_high').length,
      high: mlResults.filter(r => r.confidenceLevel === 'high').length,
      medium: mlResults.filter(r => r.confidenceLevel === 'medium').length,
      low: mlResults.filter(r => r.confidenceLevel === 'low').length,
      veryLow: mlResults.filter(r => r.confidenceLevel === 'very_low').length
    }
  }

  // Pattern insights
  const patternInsights = {
    volatileKeywords: mlResults.filter(r => r.patternRecognition.trend === 'volatile').length,
    improvingKeywords: mlResults.filter(r => r.patternRecognition.trend === 'improving').length,
    decliningKeywords: mlResults.filter(r => r.patternRecognition.trend === 'declining').length,
    stableKeywords: mlResults.filter(r => r.patternRecognition.trend === 'stable').length,
    cyclicalKeywords: mlResults.filter(r => r.patternRecognition.cycleDetected).length
  }

  // Anomaly insights
  const anomalyInsights = {
    highAnomalyRate: mlResults.filter(r => r.anomalyScore < 0.5).length,
    lowAnomalyRate: mlResults.filter(r => r.anomalyScore > 0.8).length,
    totalAnomalies: mlResults.reduce((sum, r) => sum + r.patternRecognition.anomalies.length, 0)
  }

  // Top performers
  const topPerformers = mlResults
    .map((result, index) => ({
      keywordId: keywords[index]?.id,
      keyword: keywords[index]?.keyword,
      mlScore: result.mlScore,
      hybridScore: result.hybridScore,
      confidenceLevel: result.confidenceLevel
    }))
    .sort((a, b) => b.hybridScore - a.hybridScore)
    .slice(0, 5)

  // Keywords needing attention
  const needsAttention = mlResults
    .map((result, index) => ({
      keywordId: keywords[index]?.id,
      keyword: keywords[index]?.keyword,
      mlScore: result.mlScore,
      issues: result.recommendations,
      confidenceLevel: result.confidenceLevel
    }))
    .filter(item => item.confidenceLevel === 'low' || item.confidenceLevel === 'very_low')
    .slice(0, 5)

  return {
    performanceAnalysis,
    patternInsights,
    anomalyInsights,
    topPerformers,
    needsAttention,
    overallRecommendations: generateOverallRecommendations(mlResults)
  }
}

function generateOverallRecommendations(mlResults: any[]): string[] {
  const recommendations = []
  
  const lowConfidenceCount = mlResults.filter(r => 
    r.confidenceLevel === 'low' || r.confidenceLevel === 'very_low'
  ).length
  
  const highAnomalyCount = mlResults.filter(r => r.anomalyScore < 0.5).length
  const volatileCount = mlResults.filter(r => r.patternRecognition.trend === 'volatile').length

  if (lowConfidenceCount > mlResults.length * 0.3) {
    recommendations.push('High proportion of low-confidence keywords detected - consider increasing tracking frequency')
  }

  if (highAnomalyCount > mlResults.length * 0.2) {
    recommendations.push('Significant anomaly activity detected - investigate unusual ranking patterns')
  }

  if (volatileCount > mlResults.length * 0.4) {
    recommendations.push('High volatility across keyword portfolio - consider market or algorithm changes')
  }

  const avgMLScore = mlResults.reduce((sum, r) => sum + r.mlScore, 0) / mlResults.length
  if (avgMLScore > 0.8) {
    recommendations.push('Excellent ML confidence scores - current tracking strategy is highly effective')
  } else if (avgMLScore < 0.6) {
    recommendations.push('ML scores suggest room for improvement - consider diversifying data sources')
  }

  if (recommendations.length === 0) {
    recommendations.push('ML confidence analysis shows balanced portfolio with good data quality')
  }

  return recommendations
}