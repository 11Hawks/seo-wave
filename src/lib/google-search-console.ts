/**
 * Google Search Console API Service
 * Provides comprehensive SEO data collection from Google Search Console
 */

import { google, searchconsole_v1 } from 'googleapis'
import { GoogleAPIService, GoogleAPICredentials } from './google-api'
import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'

// Types for Search Console data
export interface SearchConsoleQuery {
  query?: string
  country?: string
  device?: 'DESKTOP' | 'MOBILE' | 'TABLET'
  page?: string
  startDate: string
  endDate: string
  dimensions?: Array<'QUERY' | 'PAGE' | 'COUNTRY' | 'DEVICE' | 'DATE'>
  rowLimit?: number
  startRow?: number
}

export interface SearchConsoleRow {
  keys?: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchConsoleResponse {
  rows: SearchConsoleRow[]
  responseAggregationType?: string
}

export interface SearchConsoleSite {
  siteUrl: string
  permissionLevel: 'OWNER' | 'FULL_USER' | 'RESTRICTED_USER' | 'UNVERIFIED_USER'
}

export interface SearchConsoleIndexStatus {
  coverageState: 'Submitted and indexed' | 'Valid with warnings' | 'Error' | 'Excluded'
  crawledAs: 'DESKTOP' | 'MOBILE'
  googleCanonical?: string
  userCanonical?: string
  referringUrls?: string[]
}

/**
 * Google Search Console API Service Class
 */
export class GoogleSearchConsoleService extends GoogleAPIService {
  private searchConsole: searchconsole_v1.Searchconsole
  private readonly requiredScopes = [
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/webmasters',
  ]

  constructor(redis: Redis, prisma: PrismaClient) {
    super(
      process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID!,
      process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET!,
      `${process.env.NEXTAUTH_URL}/api/google/search-console/callback`,
      'search_console',
      redis,
      prisma
    )
    
    this.searchConsole = google.searchconsole({
      version: 'v1',
      auth: this.oauth2Client,
    })
  }

  /**
   * Generate authorization URL for Search Console
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
  ): Promise<SearchConsoleSite[]> {
    try {
      const credentials = await this.getTokensFromCode(code)
      this.setCredentials(credentials)
      
      // Get available sites
      const sites = await this.getSites()
      const siteUrls = sites.map(site => site.siteUrl)
      
      // Store credentials with available sites
      await this.storeCredentials(
        userId,
        organizationId,
        'SEARCH_CONSOLE',
        credentials,
        siteUrls
      )
      
      return sites
    } catch (error) {
      console.error('Error completing Search Console OAuth:', error)
      throw new Error('Failed to connect Google Search Console')
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
        'SEARCH_CONSOLE'
      )
      
      if (!credentials) {
        return false
      }
      
      this.setCredentials(credentials)
      return true
    } catch (error) {
      console.error('Error initializing Search Console credentials:', error)
      return false
    }
  }

  /**
   * Get list of verified sites
   */
  async getSites(): Promise<SearchConsoleSite[]> {
    return this.makeAPIRequest(async () => {
      const response = await this.searchConsole.sites.list()
      return response.data.siteEntry || []
    })
  }

  /**
   * Get search analytics data
   */
  async getSearchAnalytics(
    siteUrl: string,
    query: SearchConsoleQuery
  ): Promise<SearchConsoleResponse> {
    return this.makeAPIRequest(async () => {
      const response = await this.searchConsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: query.startDate,
          endDate: query.endDate,
          dimensions: query.dimensions || ['QUERY'],
          rowLimit: query.rowLimit || 1000,
          startRow: query.startRow || 0,
          dimensionFilterGroups: this.buildDimensionFilters(query),
        },
      })
      
      return {
        rows: response.data.rows || [],
        responseAggregationType: response.data.responseAggregationType,
      }
    })
  }

  /**
   * Get performance data for specific keywords
   */
  async getKeywordPerformance(
    siteUrl: string,
    keywords: string[],
    startDate: string,
    endDate: string,
    device?: 'DESKTOP' | 'MOBILE' | 'TABLET'
  ): Promise<SearchConsoleRow[]> {
    const allRows: SearchConsoleRow[] = []
    
    // Process keywords in batches to avoid API limits
    const batchSize = 100
    for (let i = 0; i < keywords.length; i += batchSize) {
      const keywordBatch = keywords.slice(i, i + batchSize)
      
      const query: SearchConsoleQuery = {
        startDate,
        endDate,
        dimensions: ['QUERY', 'DATE'],
        rowLimit: 25000,
        device,
      }
      
      const response = await this.getSearchAnalytics(siteUrl, query)
      
      // Filter for specific keywords
      const filteredRows = response.rows.filter(row => 
        row.keys && keywordBatch.includes(row.keys[0])
      )
      
      allRows.push(...filteredRows)
    }
    
    return allRows
  }

  /**
   * Get top pages performance
   */
  async getTopPages(
    siteUrl: string,
    startDate: string,
    endDate: string,
    limit = 100
  ): Promise<SearchConsoleRow[]> {
    const query: SearchConsoleQuery = {
      startDate,
      endDate,
      dimensions: ['PAGE'],
      rowLimit: limit,
    }
    
    const response = await this.getSearchAnalytics(siteUrl, query)
    return response.rows.sort((a, b) => b.clicks - a.clicks)
  }

  /**
   * Get top queries for a specific page
   */
  async getPageQueries(
    siteUrl: string,
    pageUrl: string,
    startDate: string,
    endDate: string,
    limit = 100
  ): Promise<SearchConsoleRow[]> {
    const query: SearchConsoleQuery = {
      page: pageUrl,
      startDate,
      endDate,
      dimensions: ['QUERY'],
      rowLimit: limit,
    }
    
    const response = await this.getSearchAnalytics(siteUrl, query)
    return response.rows.sort((a, b) => b.impressions - a.impressions)
  }

  /**
   * Get device performance breakdown
   */
  async getDevicePerformance(
    siteUrl: string,
    startDate: string,
    endDate: string
  ): Promise<SearchConsoleRow[]> {
    const query: SearchConsoleQuery = {
      startDate,
      endDate,
      dimensions: ['DEVICE'],
    }
    
    const response = await this.getSearchAnalytics(siteUrl, query)
    return response.rows
  }

  /**
   * Get country performance breakdown
   */
  async getCountryPerformance(
    siteUrl: string,
    startDate: string,
    endDate: string,
    limit = 50
  ): Promise<SearchConsoleRow[]> {
    const query: SearchConsoleQuery = {
      startDate,
      endDate,
      dimensions: ['COUNTRY'],
      rowLimit: limit,
    }
    
    const response = await this.getSearchAnalytics(siteUrl, query)
    return response.rows.sort((a, b) => b.clicks - a.clicks)
  }

  /**
   * Get sitemaps for a site
   */
  async getSitemaps(siteUrl: string): Promise<any[]> {
    return this.makeAPIRequest(async () => {
      const response = await this.searchConsole.sitemaps.list({ siteUrl })
      return response.data.sitemap || []
    })
  }

  /**
   * Submit a sitemap
   */
  async submitSitemap(siteUrl: string, feedpath: string): Promise<void> {
    return this.makeAPIRequest(async () => {
      await this.searchConsole.sitemaps.submit({
        siteUrl,
        feedpath,
      })
    })
  }

  /**
   * Get URL inspection data
   */
  async inspectUrl(siteUrl: string, inspectionUrl: string): Promise<any> {
    return this.makeAPIRequest(async () => {
      const response = await this.searchConsole.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl,
          siteUrl,
        },
      })
      return response.data
    })
  }

  /**
   * Store search console data in database
   */
  async storeSearchConsoleData(
    projectId: string,
    siteUrl: string,
    data: SearchConsoleRow[],
    date: string,
    dataType: 'KEYWORDS' | 'PAGES' | 'COUNTRIES' | 'DEVICES'
  ): Promise<void> {
    try {
      const searchConsoleData = data.map(row => ({
        projectId,
        siteUrl,
        date: new Date(date),
        dataType,
        dimensions: row.keys || [],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        createdAt: new Date(),
      }))

      await this.prisma.searchConsoleData.createMany({
        data: searchConsoleData,
        skipDuplicates: true,
      })
      
      // Update project's last sync timestamp
      await this.prisma.project.update({
        where: { id: projectId },
        data: { 
          lastGscSyncAt: new Date(),
          gscConnected: true,
        },
      })
    } catch (error) {
      console.error('Error storing Search Console data:', error)
      throw new Error('Failed to store Search Console data')
    }
  }

  /**
   * Sync all data for a project
   */
  async syncProjectData(
    projectId: string,
    userId: string,
    organizationId: string,
    siteUrl: string,
    days = 30
  ): Promise<void> {
    try {
      // Initialize credentials
      const initialized = await this.initializeWithStoredCredentials(userId, organizationId)
      if (!initialized) {
        throw new Error('Google Search Console not connected')
      }

      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]

      // Sync keywords data
      const keywordsData = await this.getSearchAnalytics(siteUrl, {
        startDate,
        endDate,
        dimensions: ['QUERY', 'DATE'],
        rowLimit: 5000,
      })
      
      await this.storeSearchConsoleData(
        projectId,
        siteUrl,
        keywordsData.rows,
        endDate,
        'KEYWORDS'
      )

      // Sync pages data
      const pagesData = await this.getTopPages(siteUrl, startDate, endDate, 1000)
      await this.storeSearchConsoleData(
        projectId,
        siteUrl,
        pagesData,
        endDate,
        'PAGES'
      )

      // Sync device data
      const deviceData = await this.getDevicePerformance(siteUrl, startDate, endDate)
      await this.storeSearchConsoleData(
        projectId,
        siteUrl,
        deviceData,
        endDate,
        'DEVICES'
      )

      // Sync country data
      const countryData = await this.getCountryPerformance(siteUrl, startDate, endDate)
      await this.storeSearchConsoleData(
        projectId,
        siteUrl,
        countryData,
        endDate,
        'COUNTRIES'
      )

      // Log successful sync
      await this.prisma.auditLog.create({
        data: {
          userId,
          organizationId,
          action: 'GSC_DATA_SYNC',
          entityType: 'PROJECT',
          entityId: projectId,
          metadata: {
            siteUrl,
            startDate,
            endDate,
            keywordCount: keywordsData.rows.length,
            pageCount: pagesData.length,
          },
        },
      })
    } catch (error) {
      console.error('Error syncing Search Console data:', error)
      throw new Error('Failed to sync Search Console data')
    }
  }

  /**
   * Build dimension filters for API queries
   */
  private buildDimensionFilters(query: SearchConsoleQuery): any[] {
    const filters: any[] = []
    
    if (query.query) {
      filters.push({
        filters: [
          {
            dimension: 'QUERY',
            operator: 'CONTAINS',
            expression: query.query,
          },
        ],
      })
    }
    
    if (query.page) {
      filters.push({
        filters: [
          {
            dimension: 'PAGE',
            operator: 'EQUALS',
            expression: query.page,
          },
        ],
      })
    }
    
    if (query.country) {
      filters.push({
        filters: [
          {
            dimension: 'COUNTRY',
            operator: 'EQUALS',
            expression: query.country,
          },
        ],
      })
    }
    
    if (query.device) {
      filters.push({
        filters: [
          {
            dimension: 'DEVICE',
            operator: 'EQUALS',
            expression: query.device,
          },
        ],
      })
    }
    
    return filters
  }
}