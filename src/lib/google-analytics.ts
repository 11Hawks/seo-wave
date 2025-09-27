/**
 * Google Analytics 4 API Service
 * Provides comprehensive web analytics data collection from Google Analytics 4
 */

import { google, analyticsdata_v1beta } from 'googleapis'
import { GoogleAPIService, GoogleAPICredentials } from './google-api'
import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'

// Types for Analytics data
export interface AnalyticsQuery {
  propertyId: string
  startDate: string
  endDate: string
  metrics: string[]
  dimensions?: string[]
  filters?: AnalyticsFilter[]
  orderBy?: AnalyticsOrderBy[]
  limit?: number
  offset?: number
}

export interface AnalyticsFilter {
  fieldName: string
  operation: 'EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN'
  value: string
}

export interface AnalyticsOrderBy {
  metric?: { metricName: string }
  dimension?: { dimensionName: string }
  desc?: boolean
}

export interface AnalyticsResponse {
  rows: AnalyticsRow[]
  totals: AnalyticsRow[]
  maximums: AnalyticsRow[]
  minimums: AnalyticsRow[]
  rowCount: number
}

export interface AnalyticsRow {
  dimensionValues: Array<{ value: string }>
  metricValues: Array<{ value: string }>
}

export interface AnalyticsProperty {
  name: string
  propertyId: string
  displayName: string
  timeZone: string
  currencyCode: string
}

export interface AnalyticsMetadata {
  metrics: Array<{
    apiName: string
    uiName: string
    description: string
    type: string
    category: string
  }>
  dimensions: Array<{
    apiName: string
    uiName: string
    description: string
    category: string
  }>
}

/**
 * Google Analytics 4 API Service Class
 */
export class GoogleAnalyticsService extends GoogleAPIService {
  private analyticsData: analyticsdata_v1beta.Analyticsdata
  private readonly requiredScopes = [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/analytics',
  ]

  constructor(redis: Redis, prisma: PrismaClient) {
    super(
      process.env.GOOGLE_ANALYTICS_CLIENT_ID!,
      process.env.GOOGLE_ANALYTICS_CLIENT_SECRET!,
      `${process.env.NEXTAUTH_URL}/api/google/analytics/callback`,
      'analytics',
      redis,
      prisma
    )
    
    this.analyticsData = google.analyticsdata({
      version: 'v1beta',
      auth: this.oauth2Client,
    })
  }

  /**
   * Generate authorization URL for Analytics
   */
  getAuthorizationUrl(userId: string): string {
    return this.generateAuthUrl(this.requiredScopes, userId)
  }

  /**
   * Complete OAuth flow and store credentials
   */
  async completeOAuth(
    code: string,
    userId: string,
    organizationId: string
  ): Promise<AnalyticsProperty[]> {
    try {
      const credentials = await this.getTokensFromCode(code)
      this.setCredentials(credentials)
      
      // Get available properties
      const properties = await this.getProperties()
      const propertyIds = properties.map(prop => prop.propertyId)
      
      // Store credentials with available properties
      await this.storeCredentials(
        userId,
        organizationId,
        'ANALYTICS',
        credentials,
        propertyIds
      )
      
      return properties
    } catch (error) {
      console.error('Error completing Analytics OAuth:', error)
      throw new Error('Failed to connect Google Analytics')
    }
  }

  /**
   * Initialize service with stored credentials
   */
  async initializeWithStoredCredentials(
    userId: string,
    organizationId: string
  ): Promise<boolean> {
    try {
      const credentials = await this.getStoredCredentials(
        userId,
        organizationId,
        'ANALYTICS'
      )
      
      if (!credentials) {
        return false
      }
      
      this.setCredentials(credentials)
      return true
    } catch (error) {
      console.error('Error initializing Analytics credentials:', error)
      return false
    }
  }

  /**
   * Get list of Analytics properties
   */
  async getProperties(): Promise<AnalyticsProperty[]> {
    return this.makeAPIRequest(async () => {
      const response = await google.analyticsadmin('v1beta').properties.list({
        auth: this.oauth2Client,
      })
      
      return (response.data.properties || []).map(property => ({
        name: property.name || '',
        propertyId: property.name?.split('/').pop() || '',
        displayName: property.displayName || '',
        timeZone: property.timeZone || 'UTC',
        currencyCode: property.currencyCode || 'USD',
      }))
    })
  }

  /**
   * Get metadata about available metrics and dimensions
   */
  async getMetadata(propertyId: string): Promise<AnalyticsMetadata> {
    return this.makeAPIRequest(async () => {
      const response = await this.analyticsData.properties.getMetadata({
        name: `properties/${propertyId}/metadata`,
      })
      
      return {
        metrics: (response.data.metrics || []).map(metric => ({
          apiName: metric.apiName || '',
          uiName: metric.uiName || '',
          description: metric.description || '',
          type: metric.type || '',
          category: metric.category || '',
        })),
        dimensions: (response.data.dimensions || []).map(dimension => ({
          apiName: dimension.apiName || '',
          uiName: dimension.uiName || '',
          description: dimension.description || '',
          category: dimension.category || '',
        })),
      }
    })
  }

  /**
   * Run Analytics report
   */
  async runReport(query: AnalyticsQuery): Promise<AnalyticsResponse> {
    return this.makeAPIRequest(async () => {
      const response = await this.analyticsData.properties.runReport({
        property: `properties/${query.propertyId}`,
        requestBody: {
          dateRanges: [{
            startDate: query.startDate,
            endDate: query.endDate,
          }],
          metrics: query.metrics.map(metric => ({ name: metric })),
          dimensions: query.dimensions?.map(dimension => ({ name: dimension })),
          dimensionFilter: this.buildDimensionFilter(query.filters),
          orderBys: query.orderBy?.map(orderBy => ({
            metric: orderBy.metric,
            dimension: orderBy.dimension,
            desc: orderBy.desc,
          })),
          limit: query.limit || 10000,
          offset: query.offset || 0,
        },
      })
      
      return {
        rows: response.data.rows || [],
        totals: response.data.totals || [],
        maximums: response.data.maximums || [],
        minimums: response.data.minimums || [],
        rowCount: response.data.rowCount || 0,
      }
    })
  }

  /**
   * Get basic website metrics
   */
  async getBasicMetrics(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    sessions: number
    users: number
    pageViews: number
    bounceRate: number
    sessionDuration: number
    newUsers: number
  }> {
    const response = await this.runReport({
      propertyId,
      startDate,
      endDate,
      metrics: [
        'sessions',
        'activeUsers',
        'screenPageViews',
        'bounceRate',
        'averageSessionDuration',
        'newUsers',
      ],
    })
    
    const totals = response.totals[0]?.metricValues || []
    
    return {
      sessions: parseInt(totals[0]?.value || '0', 10),
      users: parseInt(totals[1]?.value || '0', 10),
      pageViews: parseInt(totals[2]?.value || '0', 10),
      bounceRate: parseFloat(totals[3]?.value || '0'),
      sessionDuration: parseFloat(totals[4]?.value || '0'),
      newUsers: parseInt(totals[5]?.value || '0', 10),
    }
  }

  /**
   * Get traffic sources
   */
  async getTrafficSources(
    propertyId: string,
    startDate: string,
    endDate: string,
    limit = 100
  ): Promise<AnalyticsRow[]> {
    const response = await this.runReport({
      propertyId,
      startDate,
      endDate,
      metrics: ['sessions', 'activeUsers', 'screenPageViews'],
      dimensions: ['sessionSource', 'sessionMedium', 'sessionCampaign'],
      orderBy: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit,
    })
    
    return response.rows
  }

  /**
   * Get top pages
   */
  async getTopPages(
    propertyId: string,
    startDate: string,
    endDate: string,
    limit = 100
  ): Promise<AnalyticsRow[]> {
    const response = await this.runReport({
      propertyId,
      startDate,
      endDate,
      metrics: ['screenPageViews', 'activeUsers', 'averageSessionDuration'],
      dimensions: ['pagePath', 'pageTitle'],
      orderBy: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit,
    })
    
    return response.rows
  }

  /**
   * Get device and browser breakdown
   */
  async getDeviceData(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    devices: AnalyticsRow[]
    browsers: AnalyticsRow[]
    operatingSystems: AnalyticsRow[]
  }> {
    const [devicesResponse, browsersResponse, osResponse] = await Promise.all([
      this.runReport({
        propertyId,
        startDate,
        endDate,
        metrics: ['sessions', 'activeUsers'],
        dimensions: ['deviceCategory'],
      }),
      this.runReport({
        propertyId,
        startDate,
        endDate,
        metrics: ['sessions', 'activeUsers'],
        dimensions: ['browser'],
        orderBy: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 20,
      }),
      this.runReport({
        propertyId,
        startDate,
        endDate,
        metrics: ['sessions', 'activeUsers'],
        dimensions: ['operatingSystem'],
        orderBy: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 20,
      }),
    ])
    
    return {
      devices: devicesResponse.rows,
      browsers: browsersResponse.rows,
      operatingSystems: osResponse.rows,
    }
  }

  /**
   * Get geographical data
   */
  async getGeographicalData(
    propertyId: string,
    startDate: string,
    endDate: string,
    limit = 100
  ): Promise<{
    countries: AnalyticsRow[]
    cities: AnalyticsRow[]
  }> {
    const [countriesResponse, citiesResponse] = await Promise.all([
      this.runReport({
        propertyId,
        startDate,
        endDate,
        metrics: ['sessions', 'activeUsers', 'screenPageViews'],
        dimensions: ['country', 'countryId'],
        orderBy: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit,
      }),
      this.runReport({
        propertyId,
        startDate,
        endDate,
        metrics: ['sessions', 'activeUsers'],
        dimensions: ['city', 'country'],
        orderBy: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit,
      }),
    ])
    
    return {
      countries: countriesResponse.rows,
      cities: citiesResponse.rows,
    }
  }

  /**
   * Get conversion data
   */
  async getConversionData(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    conversions: number
    conversionRate: number
    conversionValue: number
    goals: AnalyticsRow[]
  }> {
    const [conversionResponse, goalsResponse] = await Promise.all([
      this.runReport({
        propertyId,
        startDate,
        endDate,
        metrics: ['conversions', 'sessions', 'totalRevenue'],
      }),
      this.runReport({
        propertyId,
        startDate,
        endDate,
        metrics: ['conversions', 'totalRevenue'],
        dimensions: ['eventName'],
        filters: [
          {
            fieldName: 'eventName',
            operation: 'CONTAINS',
            value: 'conversion',
          },
        ],
        orderBy: [{ metric: { metricName: 'conversions' }, desc: true }],
        limit: 20,
      }),
    ])
    
    const totals = conversionResponse.totals[0]?.metricValues || []
    const conversions = parseInt(totals[0]?.value || '0', 10)
    const sessions = parseInt(totals[1]?.value || '0', 10)
    const revenue = parseFloat(totals[2]?.value || '0')
    
    return {
      conversions,
      conversionRate: sessions > 0 ? (conversions / sessions) * 100 : 0,
      conversionValue: revenue,
      goals: goalsResponse.rows,
    }
  }

  /**
   * Store Analytics data in database
   */
  async storeAnalyticsData(
    projectId: string,
    propertyId: string,
    data: AnalyticsRow[],
    date: string,
    dataType: 'TRAFFIC' | 'PAGES' | 'SOURCES' | 'DEVICES' | 'GEOGRAPHY' | 'CONVERSIONS'
  ): Promise<void> {
    try {
      const analyticsData = data.map(row => ({
        projectId,
        propertyId,
        date: new Date(date),
        dataType,
        dimensions: row.dimensionValues.map(d => d.value),
        metrics: row.metricValues.map(m => parseFloat(m.value) || 0),
        createdAt: new Date(),
      }))

      await this.prisma.analyticsData.createMany({
        data: analyticsData,
        skipDuplicates: true,
      })
      
      // Update project's last sync timestamp
      await this.prisma.project.update({
        where: { id: projectId },
        data: { 
          lastGaSyncAt: new Date(),
          gaConnected: true,
        },
      })
    } catch (error) {
      console.error('Error storing Analytics data:', error)
      throw new Error('Failed to store Analytics data')
    }
  }

  /**
   * Sync all data for a project
   */
  async syncProjectData(
    projectId: string,
    userId: string,
    organizationId: string,
    propertyId: string,
    days = 30
  ): Promise<void> {
    try {
      // Initialize credentials
      const initialized = await this.initializeWithStoredCredentials(userId, organizationId)
      if (!initialized) {
        throw new Error('Google Analytics not connected')
      }

      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]

      // Sync traffic sources
      const sourcesData = await this.getTrafficSources(propertyId, startDate, endDate)
      await this.storeAnalyticsData(projectId, propertyId, sourcesData, endDate, 'SOURCES')

      // Sync top pages
      const pagesData = await this.getTopPages(propertyId, startDate, endDate)
      await this.storeAnalyticsData(projectId, propertyId, pagesData, endDate, 'PAGES')

      // Sync device data
      const deviceData = await this.getDeviceData(propertyId, startDate, endDate)
      await this.storeAnalyticsData(
        projectId,
        propertyId,
        [...deviceData.devices, ...deviceData.browsers],
        endDate,
        'DEVICES'
      )

      // Sync geographical data
      const geoData = await this.getGeographicalData(propertyId, startDate, endDate)
      await this.storeAnalyticsData(
        projectId,
        propertyId,
        [...geoData.countries, ...geoData.cities],
        endDate,
        'GEOGRAPHY'
      )

      // Sync conversion data
      const conversionData = await this.getConversionData(propertyId, startDate, endDate)
      await this.storeAnalyticsData(
        projectId,
        propertyId,
        conversionData.goals,
        endDate,
        'CONVERSIONS'
      )

      // Log successful sync
      await this.prisma.auditLog.create({
        data: {
          userId,
          organizationId,
          action: 'GA_DATA_SYNC',
          entityType: 'PROJECT',
          entityId: projectId,
          metadata: {
            propertyId,
            startDate,
            endDate,
            sourcesCount: sourcesData.length,
            pagesCount: pagesData.length,
          },
        },
      })
    } catch (error) {
      console.error('Error syncing Analytics data:', error)
      throw new Error('Failed to sync Analytics data')
    }
  }

  /**
   * Build dimension filter for API queries
   */
  private buildDimensionFilter(filters?: AnalyticsFilter[]): any {
    if (!filters || filters.length === 0) {
      return undefined
    }
    
    const filterExpressions = filters.map(filter => ({
      filter: {
        fieldName: filter.fieldName,
        stringFilter: {
          matchType: this.getMatchType(filter.operation),
          value: filter.value,
        },
      },
    }))
    
    return {
      andGroup: {
        expressions: filterExpressions,
      },
    }
  }

  /**
   * Convert filter operation to Analytics API match type
   */
  private getMatchType(operation: string): string {
    switch (operation) {
      case 'EQUALS':
        return 'EXACT'
      case 'CONTAINS':
        return 'CONTAINS'
      case 'GREATER_THAN':
        return 'GREATER_THAN'
      case 'LESS_THAN':
        return 'LESS_THAN'
      default:
        return 'EXACT'
    }
  }
}