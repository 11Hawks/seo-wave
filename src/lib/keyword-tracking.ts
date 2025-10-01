/**
 * Keyword Tracking Service
 * Manages keyword tracking with confidence scoring and Google Search Console integration
 */

import { PrismaClient, Keyword, Ranking, KeywordAccuracy, KeywordDifficulty } from '@prisma/client'
import { DataAccuracyEngine, DataPoint, DataSource } from './data-accuracy-engine'
import { GoogleSearchConsoleService } from './google-search-console'

export interface KeywordData {
  keyword: string
  searchVolume?: number
  difficulty?: KeywordDifficulty
  cpc?: number
  competition?: number
  intent?: string
  country?: string
  language?: string
  tags?: string[]
  category?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

export interface KeywordWithRankings extends Keyword {
  rankings: Ranking[]
  keywordAccuracy: KeywordAccuracy[]
  latestRanking?: Ranking
  currentPosition?: number
  confidenceScore?: number
  positionTrend?: string
}

export interface KeywordPerformanceMetrics {
  keyword: string
  currentPosition: number | null
  previousPosition: number | null
  positionChange: number
  trend: 'up' | 'down' | 'stable' | 'new'
  clicks: number
  impressions: number
  ctr: number
  avgPosition: number
  confidenceScore: number
  lastUpdated: Date
}

export interface KeywordImportResult {
  success: number
  failed: number
  skipped: number
  errors: string[]
  imported: KeywordData[]
}

/**
 * Keyword Tracking Service Class
 */
export class KeywordTrackingService {
  private prisma: PrismaClient
  private accuracyEngine: DataAccuracyEngine
  private gscService?: GoogleSearchConsoleService

  constructor(
    prisma: PrismaClient,
    accuracyEngine: DataAccuracyEngine,
    gscService?: GoogleSearchConsoleService
  ) {
    this.prisma = prisma
    this.accuracyEngine = accuracyEngine
    this.gscService = gscService
  }

  /**
   * Add a new keyword to tracking
   */
  async addKeyword(
    projectId: string,
    keywordData: KeywordData,
    userId: string
  ): Promise<Keyword> {
    try {
      // Check if keyword already exists
      const existingKeyword = await this.prisma.keyword.findUnique({
        where: {
          projectId_keyword_country: {
            projectId,
            keyword: keywordData.keyword,
            country: keywordData.country || 'US',
          },
        },
      })

      if (existingKeyword) {
        throw new Error(`Keyword "${keywordData.keyword}" already exists for this project`)
      }

      // Create the keyword
      const keyword = await this.prisma.keyword.create({
        data: {
          projectId,
          keyword: keywordData.keyword,
          searchVolume: keywordData.searchVolume,
          difficulty: keywordData.difficulty,
          cpc: keywordData.cpc,
          competition: keywordData.competition,
          intent: keywordData.intent,
          country: keywordData.country || 'US',
          language: keywordData.language || 'en',
          tags: keywordData.tags || [],
          category: keywordData.category,
          priority: keywordData.priority || 'medium',
        },
      })

      // Start initial rank tracking
      await this.trackKeywordRanking(keyword.id, projectId, userId)

      // Log keyword addition
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          entityType: 'KEYWORD',
          entityId: keyword.id,
          metadata: {
            keyword: keywordData.keyword,
            projectId,
            country: keywordData.country || 'US',
          },
        },
      })

      return keyword
    } catch (error) {
      console.error('Error adding keyword:', error)
      throw new Error(`Failed to add keyword: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update keyword data
   */
  async updateKeyword(
    keywordId: string,
    keywordData: Partial<KeywordData>,
    userId: string
  ): Promise<Keyword> {
    try {
      const keyword = await this.prisma.keyword.update({
        where: { id: keywordId },
        data: {
          searchVolume: keywordData.searchVolume,
          difficulty: keywordData.difficulty,
          cpc: keywordData.cpc,
          competition: keywordData.competition,
          intent: keywordData.intent,
          tags: keywordData.tags,
          category: keywordData.category,
          priority: keywordData.priority,
        },
      })

      // Log keyword update
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entityType: 'KEYWORD',
          entityId: keywordId,
          metadata: keywordData,
        },
      })

      return keyword
    } catch (error) {
      console.error('Error updating keyword:', error)
      throw new Error(`Failed to update keyword: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete keyword
   */
  async deleteKeyword(keywordId: string, userId: string): Promise<void> {
    try {
      const keyword = await this.prisma.keyword.findUnique({
        where: { id: keywordId },
      })

      if (!keyword) {
        throw new Error('Keyword not found')
      }

      await this.prisma.keyword.delete({
        where: { id: keywordId },
      })

      // Log keyword deletion
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'DELETE',
          entityType: 'KEYWORD',
          entityId: keywordId,
          metadata: {
            keyword: keyword.keyword,
            projectId: keyword.projectId,
          },
        },
      })
    } catch (error) {
      console.error('Error deleting keyword:', error)
      throw new Error(`Failed to delete keyword: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Bulk import keywords from CSV or Google Search Console
   */
  async importKeywords(
    projectId: string,
    keywords: KeywordData[],
    userId: string,
    source: 'csv' | 'gsc' | 'manual' = 'manual'
  ): Promise<KeywordImportResult> {
    const result: KeywordImportResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      imported: [],
    }

    for (const keywordData of keywords) {
      try {
        // Check if keyword already exists
        const existing = await this.prisma.keyword.findUnique({
          where: {
            projectId_keyword_country: {
              projectId,
              keyword: keywordData.keyword,
              country: keywordData.country || 'US',
            },
          },
        })

        if (existing) {
          result.skipped++
          continue
        }

        // Add the keyword
        await this.addKeyword(projectId, keywordData, userId)
        result.success++
        result.imported.push(keywordData)
      } catch (error) {
        result.failed++
        result.errors.push(`${keywordData.keyword}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Log bulk import
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'IMPORT',
        entityType: 'KEYWORD',
        entityId: projectId,
        metadata: {
          source,
          totalKeywords: keywords.length,
          successful: result.success,
          failed: result.failed,
          skipped: result.skipped,
        },
      },
    })

    return result
  }

  /**
   * Import keywords from Google Search Console
   */
  async importFromGSC(
    projectId: string,
    siteUrl: string,
    userId: string,
    organizationId: string,
    days = 30,
    minImpressions = 10
  ): Promise<KeywordImportResult> {
    try {
      if (!this.gscService) {
        throw new Error('Google Search Console service not available')
      }

      // Initialize GSC service with credentials
      const initialized = await this.gscService.initializeWithStoredCredentials(
        userId,
        organizationId
      )

      if (!initialized) {
        throw new Error('Google Search Console not connected')
      }

      // Get keyword data from GSC
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]

      const gscData = await this.gscService.getSearchAnalytics(siteUrl, {
        startDate,
        endDate,
        dimensions: ['QUERY'],
        rowLimit: 1000,
      })

      // Filter and format keywords
      const keywordData: KeywordData[] = gscData.rows
        .filter(row => row.impressions >= minImpressions && row.keys?.[0])
        .map(row => ({
          keyword: row.keys![0],
          searchVolume: row.impressions,
          priority: row.clicks > 10 ? 'high' : row.clicks > 1 ? 'medium' : 'low',
          tags: ['gsc-import'],
          category: 'organic',
        }))

      // Import the keywords
      return await this.importKeywords(projectId, keywordData, userId, 'gsc')
    } catch (error) {
      console.error('Error importing from GSC:', error)
      throw new Error(`Failed to import from Google Search Console: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Track keyword ranking with confidence scoring
   */
  async trackKeywordRanking(
    keywordId: string,
    projectId: string,
    userId: string,
    sources: string[] = ['GSC']
  ): Promise<Ranking[]> {
    try {
      const keyword = await this.prisma.keyword.findUnique({
        where: { id: keywordId },
        include: { rankings: { orderBy: { date: 'desc' }, take: 5 } },
      })

      if (!keyword) {
        throw new Error('Keyword not found')
      }

      const rankings: Ranking[] = []

      // Track from different sources
      for (const source of sources) {
        let ranking: Ranking | null = null

        if (source === 'GSC' && this.gscService) {
          ranking = await this.trackFromGSC(keyword, projectId)
        }
        // Add more sources here (SERPAPI, etc.)

        if (ranking) {
          rankings.push(ranking)
        }
      }

      // Calculate confidence score for the rankings
      if (rankings.length > 0) {
        await this.calculateKeywordAccuracy(keywordId, rankings)
      }

      return rankings
    } catch (error) {
      console.error('Error tracking keyword ranking:', error)
      throw new Error(`Failed to track keyword ranking: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Track keyword from Google Search Console
   */
  private async trackFromGSC(keyword: Keyword, projectId: string): Promise<Ranking | null> {
    try {
      if (!this.gscService) return null

      // Get project's GSC site URL
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      })

      if (!project?.domain) return null

      const siteUrl = `https://${project.domain}`
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = endDate // Get today's data

      // Get specific keyword data
      const gscData = await this.gscService.getSearchAnalytics(siteUrl, {
        startDate,
        endDate,
        dimensions: ['QUERY', 'PAGE'],
        query: keyword.keyword,
        country: keyword.country,
      })

      if (gscData.rows.length === 0) return null

      const row = gscData.rows[0] // Most relevant result
      const position = Math.round(row.position)

      // Create ranking record
      const ranking = await this.prisma.ranking.create({
        data: {
          keywordId: keyword.id,
          projectId,
          position,
          url: row.keys?.[1], // Page URL
          searchEngine: 'google',
          device: 'desktop',
          location: keyword.country,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          dataSource: 'GSC',
          confidenceScore: 95, // GSC is highly reliable
          isVerified: true,
          date: new Date(),
        },
      })

      // Update keyword GSC data
      await this.prisma.keyword.update({
        where: { id: keyword.id },
        data: {
          gscClicks: row.clicks,
          gscImpressions: row.impressions,
          gscCtr: row.ctr,
          gscPosition: row.position,
          lastGscUpdate: new Date(),
        },
      })

      return ranking
    } catch (error) {
      console.error('Error tracking from GSC:', error)
      return null
    }
  }

  /**
   * Calculate keyword accuracy and confidence score
   */
  async calculateKeywordAccuracy(
    keywordId: string,
    rankings: Ranking[]
  ): Promise<KeywordAccuracy> {
    try {
      const keyword = await this.prisma.keyword.findUnique({
        where: { id: keywordId },
      })

      if (!keyword) {
        throw new Error('Keyword not found')
      }

      // Create data points for accuracy calculation
      const dataPoints: DataPoint[] = rankings.map((ranking, index) => ({
        id: ranking.id,
        source: ranking.dataSource === 'GSC' ? DataSource.GOOGLE_SEARCH_CONSOLE : DataSource.SERPAPI,
        value: ranking.position || 0,
        timestamp: ranking.date,
        metadata: {
          clicks: ranking.clicks,
          impressions: ranking.impressions,
          ctr: ranking.ctr,
        },
      }))

      let confidenceScore = 50 // Default score
      let freshnessScore = 50
      let consistencyScore = 50
      let reliabilityScore = 50

      if (dataPoints.length > 0) {
        const primaryDataPoint = dataPoints[0]
        const compareDataPoints = dataPoints.slice(1)

        const confidence = await this.accuracyEngine.calculateConfidenceScore(
          keyword.projectId,
          `keyword_position_${keyword.keyword}`,
          primaryDataPoint,
          compareDataPoints
        )

        confidenceScore = confidence.overall
        freshnessScore = confidence.freshness
        consistencyScore = confidence.consistency
        reliabilityScore = confidence.reliability
      }

      // Calculate position variance
      const positions = rankings.map(r => r.position).filter(p => p !== null) as number[]
      const positionVariance = positions.length > 1 
        ? this.calculateVariance(positions)
        : 0

      // Create or update keyword accuracy record
      const accuracy = await this.prisma.keywordAccuracy.upsert({
        where: {
          keywordId: keywordId,
        },
        update: {
          confidenceScore,
          freshnessScore,
          consistencyScore,
          reliabilityScore,
          sourcesCount: rankings.length,
          primarySource: rankings[0]?.dataSource || 'UNKNOWN',
          validatedSources: rankings.map(r => r.dataSource || 'UNKNOWN'),
          positionVariance,
          hasDiscrepancies: positionVariance > 5, // More than 5 positions variance
          calculatedAt: new Date(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24 hours
        },
        create: {
          keywordId,
          projectId: keyword.projectId,
          confidenceScore,
          freshnessScore,
          consistencyScore,
          reliabilityScore,
          sourcesCount: rankings.length,
          primarySource: rankings[0]?.dataSource || 'UNKNOWN',
          validatedSources: rankings.map(r => r.dataSource || 'UNKNOWN'),
          positionVariance,
          hasDiscrepancies: positionVariance > 5,
          calculatedAt: new Date(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })

      // Update keyword position statistics
      await this.updateKeywordStats(keywordId, rankings)

      return accuracy
    } catch (error) {
      console.error('Error calculating keyword accuracy:', error)
      throw new Error(`Failed to calculate keyword accuracy: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update keyword position statistics
   */
  private async updateKeywordStats(keywordId: string, rankings: Ranking[]): Promise<void> {
    const positions = rankings.map(r => r.position).filter(p => p !== null) as number[]
    
    if (positions.length === 0) return

    const currentPosition = positions[0]
    const previousPosition = positions[1]
    
    let trend = 'stable'
    if (previousPosition && currentPosition) {
      if (currentPosition < previousPosition) trend = 'up' // Lower number = better position
      else if (currentPosition > previousPosition) trend = 'down'
    } else if (positions.length === 1) {
      trend = 'new'
    }

    const bestPosition = Math.min(...positions)
    const worstPosition = Math.max(...positions)
    const avgPosition = positions.reduce((sum, pos) => sum + pos, 0) / positions.length

    await this.prisma.keyword.update({
      where: { id: keywordId },
      data: {
        bestPosition,
        worstPosition,
        avgPosition,
        positionTrend: trend,
      },
    })
  }

  /**
   * Get keyword with performance metrics
   */
  async getKeywordPerformance(
    keywordId: string
  ): Promise<KeywordPerformanceMetrics | null> {
    try {
      const keyword = await this.prisma.keyword.findUnique({
        where: { id: keywordId },
        include: {
          rankings: {
            orderBy: { date: 'desc' },
            take: 2,
          },
          keywordAccuracy: {
            orderBy: { calculatedAt: 'desc' },
            take: 1,
          },
        },
      })

      if (!keyword) return null

      const currentRanking = keyword.rankings[0]
      const previousRanking = keyword.rankings[1]

      const currentPosition = currentRanking?.position || null
      const previousPosition = previousRanking?.position || null
      
      let positionChange = 0
      let trend: 'up' | 'down' | 'stable' | 'new' = 'new'

      if (currentPosition && previousPosition) {
        positionChange = previousPosition - currentPosition // Positive = improvement
        if (positionChange > 0) trend = 'up'
        else if (positionChange < 0) trend = 'down'
        else trend = 'stable'
      }

      return {
        keyword: keyword.keyword,
        currentPosition,
        previousPosition,
        positionChange,
        trend,
        clicks: keyword.gscClicks || 0,
        impressions: keyword.gscImpressions || 0,
        ctr: keyword.gscCtr || 0,
        avgPosition: keyword.avgPosition || 0,
        confidenceScore: keyword.keywordAccuracy[0]?.confidenceScore || 0,
        lastUpdated: keyword.lastGscUpdate || keyword.updatedAt,
      }
    } catch (error) {
      console.error('Error getting keyword performance:', error)
      return null
    }
  }

  /**
   * Get all keywords for a project with performance data
   */
  async getProjectKeywords(
    projectId: string,
    filters?: {
      tags?: string[]
      category?: string
      priority?: string
      hasRankings?: boolean
    }
  ): Promise<KeywordWithRankings[]> {
    try {
      const where: any = { projectId, isTracked: true }

      if (filters?.tags?.length) {
        where.tags = { hasSome: filters.tags }
      }
      if (filters?.category) {
        where.category = filters.category
      }
      if (filters?.priority) {
        where.priority = filters.priority
      }

      const keywords = await this.prisma.keyword.findMany({
        where,
        include: {
          rankings: {
            orderBy: { date: 'desc' },
            take: 30, // Last 30 days
          },
          keywordAccuracy: {
            orderBy: { calculatedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: [
          { priority: 'desc' },
          { gscClicks: 'desc' },
          { updatedAt: 'desc' },
        ],
      })

      return keywords.map(keyword => ({
        ...keyword,
        latestRanking: keyword.rankings[0],
        currentPosition: keyword.rankings[0]?.position || null,
        confidenceScore: keyword.keywordAccuracy[0]?.confidenceScore || 0,
      }))
    } catch (error) {
      console.error('Error getting project keywords:', error)
      throw new Error(`Failed to get project keywords: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Calculate variance of an array of numbers
   */
  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length
  }

  /**
   * Sync all keywords for a project
   */
  async syncProjectKeywords(
    projectId: string,
    userId: string,
    organizationId: string
  ): Promise<{ updated: number; errors: string[] }> {
    try {
      const keywords = await this.prisma.keyword.findMany({
        where: { projectId, isTracked: true },
      })

      let updated = 0
      const errors: string[] = []

      for (const keyword of keywords) {
        try {
          await this.trackKeywordRanking(keyword.id, projectId, userId)
          updated++
        } catch (error) {
          errors.push(`${keyword.keyword}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Log sync activity
      await this.prisma.auditLog.create({
        data: {
          userId,
          organizationId,
          action: 'GSC_DATA_SYNC',
          entityType: 'PROJECT',
          entityId: projectId,
          metadata: {
            keywordsProcessed: keywords.length,
            keywordsUpdated: updated,
            errorsCount: errors.length,
          },
        },
      })

      return { updated, errors }
    } catch (error) {
      console.error('Error syncing project keywords:', error)
      throw new Error(`Failed to sync project keywords: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Additional methods needed for API routes
   */

  // Keyword retrieval methods
  async getKeywords(options: any) {
    return this.prisma.keyword.findMany(options)
  }

  async countKeywords(where: any) {
    return this.prisma.keyword.count({ where })
  }

  async getKeywordById(id: string) {
    return this.prisma.keyword.findUnique({
      where: { id },
      include: {
        rankings: {
          orderBy: { checkedAt: 'desc' },
          take: 1
        },
        keywordAccuracy: {
          orderBy: { calculatedAt: 'desc' },
          take: 1
        }
      }
    })
  }

  async getKeywordsByIds(ids: string[]) {
    return this.prisma.keyword.findMany({
      where: { id: { in: ids } }
    })
  }

  async findKeywordByProjectAndKeyword(projectId: string, keyword: string) {
    return this.prisma.keyword.findFirst({
      where: {
        projectId,
        keyword: { equals: keyword, mode: 'insensitive' }
      }
    })
  }

  async getLatestRanking(keywordId: string) {
    return this.prisma.ranking.findFirst({
      where: { keywordId },
      orderBy: { checkedAt: 'desc' }
    })
  }

  async getKeywordRankings(keywordId: string, limit?: number, fromDate?: Date) {
    const where: any = { keywordId }
    if (fromDate) {
      where.checkedAt = { gte: fromDate }
    }

    return this.prisma.ranking.findMany({
      where,
      orderBy: { checkedAt: 'desc' },
      ...(limit && { take: limit })
    })
  }

  async getKeywordAccuracyHistory(keywordId: string, limit?: number, fromDate?: Date) {
    const where: any = { keywordId }
    if (fromDate) {
      where.calculatedAt = { gte: fromDate }
    }

    return this.prisma.keywordAccuracy.findMany({
      where,
      orderBy: { calculatedAt: 'desc' },
      ...(limit && { take: limit })
    })
  }

  async getGSCDataForKeyword(keywordId: string, fromDate: Date, toDate: Date) {
    // This would typically fetch from a separate GSC data table
    // For now, we'll use ranking data as a proxy
    return this.prisma.ranking.findMany({
      where: {
        keywordId,
        checkedAt: {
          gte: fromDate,
          lte: toDate
        },
        source: 'GSC'
      },
      orderBy: { checkedAt: 'desc' }
    })
  }

  // Project-related methods
  async getProjectById(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId }
    })
  }

  async getOrganizationProjects(organizationId: string) {
    return this.prisma.project.findMany({
      where: { organizationId }
    })
  }

  async getStaleKeywords(projectId: string, maxAgeMs: number) {
    const cutoffDate = new Date(Date.now() - maxAgeMs)
    
    return this.prisma.keyword.findMany({
      where: {
        projectId,
        OR: [
          { lastGscUpdate: { lt: cutoffDate } },
          { lastGscUpdate: null }
        ]
      }
    })
  }

  // CRUD operations
  async deleteKeywords(ids: string[], userId: string) {
    // Delete in transaction to ensure consistency
    return this.prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.ranking.deleteMany({
        where: { keywordId: { in: ids } }
      })
      
      await tx.keywordAccuracy.deleteMany({
        where: { keywordId: { in: ids } }
      })

      // Delete keywords
      const result = await tx.keyword.deleteMany({
        where: { id: { in: ids } }
      })

      // Log the deletion
      await tx.auditLog.create({
        data: {
          userId,
          action: 'DELETE',
          entityType: 'KEYWORD',
          entityId: ids.join(','),
          metadata: {
            deletedCount: result.count,
            keywordIds: ids
          }
        }
      })

      return result.count
    })
  }

  // Sync and audit methods
  async getSyncHistory(organizationId: string, projectId?: string, limit = 20) {
    const where: any = {
      organizationId,
      action: { in: ['keywords.sync.project', 'keywords.sync.bulk', 'keywords.bulk.gsc-import'] }
    }

    if (projectId) {
      where.resource = { contains: projectId }
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  // Tracking schedule management methods
  async createTrackingSchedule(data: any) {
    return this.prisma.trackingSchedule.create({
      data: {
        projectId: data.projectId,
        organizationId: data.organizationId,
        userId: data.userId,
        schedule: data.schedule,
        settings: data.settings,
        nextExecution: data.nextExecution,
        enabled: data.enabled,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  }

  async getTrackingSchedule(scheduleId: string) {
    return this.prisma.trackingSchedule.findUnique({
      where: { id: scheduleId }
    })
  }

  async getTrackingSchedules(filters: any) {
    const where: any = {
      organizationId: filters.organizationId
    }

    if (filters.projectId) where.projectId = filters.projectId
    if (filters.enabled !== undefined) where.enabled = filters.enabled
    if (filters.userId) where.userId = filters.userId

    return this.prisma.trackingSchedule.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
  }

  async updateTrackingSchedule(scheduleId: string, updates: any) {
    return this.prisma.trackingSchedule.update({
      where: { id: scheduleId },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    })
  }

  async deleteTrackingSchedule(scheduleId: string) {
    // Delete schedule and related executions
    return this.prisma.$transaction(async (tx) => {
      await tx.scheduleExecution.deleteMany({
        where: { scheduleId }
      })

      return tx.trackingSchedule.delete({
        where: { id: scheduleId }
      })
    })
  }

  async getScheduleExecutions(scheduleId: string, limit = 10) {
    return this.prisma.scheduleExecution.findMany({
      where: { scheduleId },
      orderBy: { executedAt: 'desc' },
      take: limit
    })
  }

  // Confidence alert management methods
  async createConfidenceAlert(alertData: any) {
    return this.prisma.confidenceAlert.create({
      data: {
        projectId: alertData.projectId,
        organizationId: alertData.organizationId,
        userId: alertData.userId,
        name: alertData.name,
        description: alertData.description,
        conditions: alertData.conditions,
        notifications: alertData.notifications,
        enabled: alertData.enabled,
        createdAt: alertData.createdAt,
        updatedAt: alertData.updatedAt
      }
    })
  }

  async getConfidenceAlert(alertId: string) {
    return this.prisma.confidenceAlert.findUnique({
      where: { id: alertId }
    })
  }

  async getConfidenceAlerts(filters: any) {
    const where: any = {}
    
    if (filters.organizationId) where.organizationId = filters.organizationId
    if (filters.projectId) where.projectId = filters.projectId
    if (filters.enabled !== undefined) where.enabled = filters.enabled
    if (filters.userId) where.userId = filters.userId

    return this.prisma.confidenceAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
  }

  async updateConfidenceAlert(alertId: string, updates: any) {
    return this.prisma.confidenceAlert.update({
      where: { id: alertId },
      data: updates
    })
  }

  async deleteConfidenceAlert(alertId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.alertTriggerHistory.deleteMany({
        where: { alertId }
      })

      return tx.confidenceAlert.delete({
        where: { id: alertId }
      })
    })
  }

  async updateAlertLastTriggered(alertId: string, triggeredAt: Date) {
    return this.prisma.confidenceAlert.update({
      where: { id: alertId },
      data: { lastTriggered: triggeredAt }
    })
  }

  async getAlertTriggerHistory(alertId: string, limit = 10) {
    return this.prisma.alertTriggerHistory.findMany({
      where: { alertId },
      orderBy: { triggeredAt: 'desc' },
      take: limit
    })
  }


}