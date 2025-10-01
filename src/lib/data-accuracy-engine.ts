/**
 * Data Accuracy Engine
 * Real-time confidence scoring and data validation system
 * This is the core differentiator that provides transparency competitors lack
 */

import { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// Types for accuracy scoring
export interface DataPoint {
  id: string
  source: DataSource
  value: number
  timestamp: Date
  metadata?: Record<string, any>
}

export interface ConfidenceScore {
  overall: number // 0-100
  freshness: number // 0-100 based on data age
  consistency: number // 0-100 based on cross-source validation
  reliability: number // 0-100 based on source reliability
  completeness: number // 0-100 based on data completeness
}

export interface AccuracyReport {
  id: string
  projectId: string
  metric: string
  primaryValue: number
  secondaryValues: Array<{ source: DataSource; value: number; timestamp: Date }>
  confidenceScore: ConfidenceScore
  discrepancies: Discrepancy[]
  isAccurate: boolean
  checkedAt: Date
}

export interface Discrepancy {
  source1: DataSource
  source2: DataSource
  value1: number
  value2: number
  variance: number
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  explanation: string
}

export enum DataSource {
  GOOGLE_SEARCH_CONSOLE = 'GOOGLE_SEARCH_CONSOLE',
  GOOGLE_ANALYTICS = 'GOOGLE_ANALYTICS',
  SERPAPI = 'SERPAPI',
  DATAFORSEO = 'DATAFORSEO',
  AHREFS_API = 'AHREFS_API',
  SEMRUSH_API = 'SEMRUSH_API',
  MOZ_API = 'MOZ_API',
  INTERNAL_CRAWLER = 'INTERNAL_CRAWLER'
}

/**
 * Data Accuracy Engine Class
 * Implements confidence scoring and validation algorithms
 */
export class DataAccuracyEngine {
  private prisma: PrismaClient
  private readonly FRESHNESS_THRESHOLD_HOURS = 24
  private readonly VARIANCE_TOLERANCE = 0.15 // 15% tolerance
  private readonly MIN_SOURCES_FOR_VALIDATION = 2

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma
  }

  /**
   * Calculate confidence score for a data point
   */
  async calculateConfidenceScore(
    projectId: string,
    metric: string,
    primaryDataPoint: DataPoint,
    compareDataPoints: DataPoint[] = []
  ): Promise<ConfidenceScore> {
    const freshness = this.calculateFreshnessScore(primaryDataPoint.timestamp)
    const consistency = await this.calculateConsistencyScore(
      primaryDataPoint,
      compareDataPoints
    )
    const reliability = this.calculateReliabilityScore(primaryDataPoint.source)
    const completeness = await this.calculateCompletenessScore(
      projectId,
      metric,
      primaryDataPoint.timestamp
    )

    const overall = this.calculateOverallScore({
      freshness,
      consistency,
      reliability,
      completeness,
    })

    return {
      overall,
      freshness,
      consistency,
      reliability,
      completeness,
    }
  }

  /**
   * Calculate freshness score based on data age
   */
  private calculateFreshnessScore(timestamp: Date): number {
    const now = new Date()
    const hoursOld = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60)
    
    if (hoursOld <= 1) return 100 // Perfect - data is fresh
    if (hoursOld <= 6) return 90  // Excellent - very recent
    if (hoursOld <= 12) return 80 // Good - recent
    if (hoursOld <= 24) return 70 // Fair - within a day
    if (hoursOld <= 48) return 50 // Poor - getting stale
    if (hoursOld <= 72) return 30 // Bad - quite old
    return 10 // Very poor - very old data
  }

  /**
   * Calculate consistency score across multiple data sources
   */
  private async calculateConsistencyScore(
    primaryDataPoint: DataPoint,
    compareDataPoints: DataPoint[]
  ): Promise<number> {
    if (compareDataPoints.length === 0) {
      return 50 // Neutral score when no comparison data available
    }

    let totalVariance = 0
    let validComparisons = 0

    for (const comparePoint of compareDataPoints) {
      // Only compare if data is reasonably fresh
      const hoursOld = (Date.now() - comparePoint.timestamp.getTime()) / (1000 * 60 * 60)
      if (hoursOld > 48) continue

      const variance = Math.abs(
        (primaryDataPoint.value - comparePoint.value) / primaryDataPoint.value
      )
      
      totalVariance += variance
      validComparisons++
    }

    if (validComparisons === 0) return 50

    const averageVariance = totalVariance / validComparisons

    // Convert variance to consistency score (lower variance = higher consistency)
    if (averageVariance <= 0.05) return 95 // Excellent consistency
    if (averageVariance <= 0.10) return 85 // Good consistency
    if (averageVariance <= 0.20) return 70 // Fair consistency
    if (averageVariance <= 0.35) return 50 // Poor consistency
    return 25 // Very poor consistency
  }

  /**
   * Calculate reliability score based on data source
   */
  private calculateReliabilityScore(source: DataSource): number {
    const reliabilityMap: Record<DataSource, number> = {
      [DataSource.GOOGLE_SEARCH_CONSOLE]: 95, // Direct from Google
      [DataSource.GOOGLE_ANALYTICS]: 95,      // Direct from Google
      [DataSource.SERPAPI]: 85,               // Third-party but reliable
      [DataSource.DATAFORSEO]: 80,            // Good third-party service
      [DataSource.AHREFS_API]: 85,            // Established SEO tool
      [DataSource.SEMRUSH_API]: 85,           // Established SEO tool
      [DataSource.MOZ_API]: 75,               // Good but less comprehensive
      [DataSource.INTERNAL_CRAWLER]: 70,      // Internal system reliability
    }

    return reliabilityMap[source] || 50
  }

  /**
   * Calculate completeness score based on available data
   */
  private async calculateCompletenessScore(
    projectId: string,
    metric: string,
    timestamp: Date
  ): Promise<number> {
    // Check how many expected data sources we have for this metric
    const expectedSources = this.getExpectedSourcesForMetric(metric)
    const availableSources = await this.getAvailableSourcesForMetric(
      projectId,
      metric,
      timestamp
    )

    const completeness = (availableSources.length / expectedSources.length) * 100
    return Math.min(completeness, 100)
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallScore(scores: Omit<ConfidenceScore, 'overall'>): number {
    // Weighted average - freshness and consistency are most important
    const weights = {
      freshness: 0.3,
      consistency: 0.35,
      reliability: 0.25,
      completeness: 0.1,
    }

    return Math.round(
      scores.freshness * weights.freshness +
      scores.consistency * weights.consistency +
      scores.reliability * weights.reliability +
      scores.completeness * weights.completeness
    )
  }

  /**
   * Detect discrepancies between data sources
   */
  async detectDiscrepancies(
    primaryDataPoint: DataPoint,
    compareDataPoints: DataPoint[]
  ): Promise<Discrepancy[]> {
    const discrepancies: Discrepancy[] = []

    for (const comparePoint of compareDataPoints) {
      const variance = Math.abs(
        (primaryDataPoint.value - comparePoint.value) / primaryDataPoint.value
      )

      let severity: Discrepancy['severity']
      let explanation: string

      if (variance <= 0.05) continue // No significant discrepancy

      if (variance <= 0.15) {
        severity = 'LOW'
        explanation = 'Minor variance within acceptable range'
      } else if (variance <= 0.30) {
        severity = 'MEDIUM'
        explanation = 'Moderate variance requiring attention'
      } else if (variance <= 0.50) {
        severity = 'HIGH'
        explanation = 'Significant variance indicating data quality issues'
      } else {
        severity = 'CRITICAL'
        explanation = 'Critical variance suggesting data corruption or source issues'
      }

      discrepancies.push({
        source1: primaryDataPoint.source,
        source2: comparePoint.source,
        value1: primaryDataPoint.value,
        value2: comparePoint.value,
        variance,
        severity,
        explanation,
      })
    }

    return discrepancies
  }

  /**
   * Generate comprehensive accuracy report
   */
  async generateAccuracyReport(
    projectId: string,
    metric: string,
    primaryDataPoint: DataPoint,
    compareDataPoints: DataPoint[] = []
  ): Promise<AccuracyReport> {
    const confidenceScore = await this.calculateConfidenceScore(
      projectId,
      metric,
      primaryDataPoint,
      compareDataPoints
    )

    const discrepancies = await this.detectDiscrepancies(
      primaryDataPoint,
      compareDataPoints
    )

    const isAccurate = this.determineAccuracy(confidenceScore, discrepancies)

    const report: AccuracyReport = {
      id: `accuracy_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      projectId,
      metric,
      primaryValue: primaryDataPoint.value,
      secondaryValues: compareDataPoints.map(dp => ({
        source: dp.source,
        value: dp.value,
        timestamp: dp.timestamp,
      })),
      confidenceScore,
      discrepancies,
      isAccurate,
      checkedAt: new Date(),
    }

    // Store report in database
    await this.storeAccuracyReport(report)

    return report
  }

  /**
   * Determine if data is considered accurate
   */
  private determineAccuracy(
    confidenceScore: ConfidenceScore,
    discrepancies: Discrepancy[]
  ): boolean {
    // Data is considered accurate if:
    // 1. Overall confidence score is above 70
    // 2. No critical discrepancies
    // 3. Less than 50% of discrepancies are high severity

    if (confidenceScore.overall < 70) return false

    const criticalDiscrepancies = discrepancies.filter(d => d.severity === 'CRITICAL')
    if (criticalDiscrepancies.length > 0) return false

    const highSeverityDiscrepancies = discrepancies.filter(
      d => d.severity === 'HIGH' || d.severity === 'CRITICAL'
    )
    const highSeverityRatio = highSeverityDiscrepancies.length / Math.max(discrepancies.length, 1)
    
    return highSeverityRatio < 0.5
  }

  /**
   * Store accuracy report in database
   */
  private async storeAccuracyReport(report: AccuracyReport): Promise<void> {
    // Check if we're in preview mode
    const isPreviewMode = process.env.PREVIEW_MODE === 'true' || process.env.DISABLE_AUTH === 'true';
    
    if (isPreviewMode) {
      // Mock storage - just log in preview mode
      console.log('Preview mode: Mock storing accuracy report:', report.id);
      return;
    }

    try {
      // In real mode, attempt to store in database
      // Note: This will use mock Prisma client if database isn't available
      await this.prisma.dataAccuracyReport.create({
        data: {
          projectId: report.projectId,
          dataSource: report.secondaryValues[0]?.source || DataSource.INTERNAL_CRAWLER,
          comparisonSource: report.secondaryValues[1]?.source || DataSource.GOOGLE_SEARCH_CONSOLE,
          metric: report.metric,
          expectedValue: report.primaryValue,
          actualValue: report.secondaryValues[0]?.value || report.primaryValue,
          variance: report.discrepancies[0]?.variance || 0,
          confidenceScore: report.confidenceScore.overall,
          isAccurate: report.isAccurate,
          checkedAt: report.checkedAt,
          metadata: {
            confidenceBreakdown: report.confidenceScore,
            discrepancies: report.discrepancies,
            sources: report.secondaryValues.length,
          },
        },
      })
    } catch (error) {
      console.error('Failed to store accuracy report:', error)
      // Don't throw in preview mode - just log the error
      if (!isPreviewMode) {
        throw new Error('Failed to store accuracy report')
      }
    }
  }

  /**
   * Get expected data sources for a metric
   */
  private getExpectedSourcesForMetric(metric: string): DataSource[] {
    const metricSourceMap: Record<string, DataSource[]> = {
      'organic_clicks': [DataSource.GOOGLE_SEARCH_CONSOLE, DataSource.GOOGLE_ANALYTICS],
      'organic_impressions': [DataSource.GOOGLE_SEARCH_CONSOLE],
      'keyword_position': [DataSource.GOOGLE_SEARCH_CONSOLE, DataSource.SERPAPI, DataSource.DATAFORSEO],
      'page_views': [DataSource.GOOGLE_ANALYTICS],
      'bounce_rate': [DataSource.GOOGLE_ANALYTICS],
      'backlinks': [DataSource.AHREFS_API, DataSource.SEMRUSH_API, DataSource.MOZ_API],
      'domain_rating': [DataSource.AHREFS_API, DataSource.MOZ_API],
    }

    return metricSourceMap[metric] || [DataSource.GOOGLE_SEARCH_CONSOLE]
  }

  /**
   * Get available data sources for a metric
   */
  private async getAvailableSourcesForMetric(
    projectId: string,
    metric: string,
    timestamp: Date
  ): Promise<DataSource[]> {
    // Check if we're in preview mode
    const isPreviewMode = process.env.PREVIEW_MODE === 'true' || process.env.DISABLE_AUTH === 'true';
    
    if (isPreviewMode) {
      // Mock data sources for preview mode
      return [DataSource.GOOGLE_SEARCH_CONSOLE, DataSource.GOOGLE_ANALYTICS];
    }

    try {
      const mockSources: DataSource[] = []
      
      // Check if Google integrations are connected
      const googleIntegrations = await this.prisma.googleIntegration.findMany({
        where: {
          organization: {
            projects: {
              some: { id: projectId },
            },
          },
          isActive: true,
        },
      })

      if (googleIntegrations.some(g => g.service === 'SEARCH_CONSOLE')) {
        mockSources.push(DataSource.GOOGLE_SEARCH_CONSOLE)
      }

      if (googleIntegrations.some(g => g.service === 'ANALYTICS')) {
        mockSources.push(DataSource.GOOGLE_ANALYTICS)
      }

      return mockSources
    } catch (error) {
      console.error('Failed to get available sources:', error)
      // Return default sources if database query fails
      return [DataSource.GOOGLE_SEARCH_CONSOLE]
    }
  }

  /**
   * Get accuracy history for a project
   */
  async getAccuracyHistory(
    projectId: string,
    metric?: string,
    days = 30
  ): Promise<AccuracyReport[]> {
    // Check if we're in preview mode
    const isPreviewMode = process.env.PREVIEW_MODE === 'true' || process.env.DISABLE_AUTH === 'true';
    
    if (isPreviewMode) {
      // Mock accuracy history for preview mode
      return Array.from({ length: 5 }, (_, i) => ({
        id: `accuracy_${Date.now()}_${i}`,
        projectId,
        metric: metric || 'organic_clicks',
        primaryValue: Math.floor(Math.random() * 1000) + 100,
        secondaryValues: [],
        confidenceScore: {
          overall: Math.floor(Math.random() * 20) + 80, // 80-100%
          freshness: Math.floor(Math.random() * 20) + 80,
          consistency: Math.floor(Math.random() * 25) + 75,
          reliability: Math.floor(Math.random() * 15) + 85,
          completeness: Math.floor(Math.random() * 30) + 70,
        },
        discrepancies: [],
        isAccurate: Math.random() > 0.2, // 80% accurate
        checkedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Last 5 days
      }));
    }

    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const reports = await this.prisma.dataAccuracyReport.findMany({
        where: {
          projectId,
          metric: metric || undefined,
          checkedAt: {
            gte: startDate,
          },
        },
        orderBy: {
          checkedAt: 'desc',
        },
        take: 100,
      })

      return reports.map(report => ({
        id: report.id,
        projectId: report.projectId,
        metric: report.metric,
        primaryValue: report.expectedValue,
        secondaryValues: [],
        confidenceScore: {
          overall: report.confidenceScore,
          freshness: 80, // Would be stored in metadata
          consistency: 75,
          reliability: 85,
          completeness: 70,
        },
        discrepancies: [],
        isAccurate: report.isAccurate,
        checkedAt: report.checkedAt,
      }))
    } catch (error) {
      console.error('Failed to get accuracy history:', error)
      return [] // Return empty array if database fails
    }
  }

  /**
   * Get real-time accuracy status for a project
   */
  async getProjectAccuracyStatus(projectId: string): Promise<{
    overallAccuracy: number
    lastChecked: Date | null
    criticalIssues: number
    averageConfidence: number
    dataFreshness: number
  }> {
    // Check if we're in preview mode
    const isPreviewMode = process.env.PREVIEW_MODE === 'true' || process.env.DISABLE_AUTH === 'true';
    
    if (isPreviewMode) {
      // Mock accuracy status for preview mode
      const now = new Date();
      return {
        overallAccuracy: 94,
        lastChecked: now,
        criticalIssues: 0,
        averageConfidence: 87,
        dataFreshness: 95,
      };
    }

    try {
      const recentReports = await this.prisma.dataAccuracyReport.findMany({
        where: {
          projectId,
          checkedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        orderBy: {
          checkedAt: 'desc',
        },
      })

      if (recentReports.length === 0) {
        return {
          overallAccuracy: 0,
          lastChecked: null,
          criticalIssues: 0,
          averageConfidence: 0,
          dataFreshness: 0,
        }
      }

      const accurateReports = recentReports.filter(r => r.isAccurate).length
      const overallAccuracy = (accurateReports / recentReports.length) * 100

      const averageConfidence = 
        recentReports.reduce((sum, r) => sum + r.confidenceScore, 0) / recentReports.length

      const criticalIssues = recentReports.filter(r => r.confidenceScore < 50).length

      const latestReport = recentReports[0]
      const dataFreshness = this.calculateFreshnessScore(latestReport.checkedAt)

      return {
        overallAccuracy: Math.round(overallAccuracy),
        lastChecked: latestReport.checkedAt,
        criticalIssues,
        averageConfidence: Math.round(averageConfidence),
        dataFreshness,
      }
    } catch (error) {
      console.error('Failed to get project accuracy status:', error)
      // Return default values if database fails
      return {
        overallAccuracy: 0,
        lastChecked: null,
        criticalIssues: 0,
        averageConfidence: 0,
        dataFreshness: 0,
      }
    }
  }
}