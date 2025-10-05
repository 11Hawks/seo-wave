/**
 * Bulk Keywords Import API Routes
 * Handles bulk keyword operations including CSV import and Google Search Console import
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { KeywordTrackingService, KeywordData, getKeywordTrackingService } from '@/lib/keyword-tracking'
import { rateLimitAPI, rateLimitHeaders } from '@/lib/rate-limiting-unified'
import { auditLog } from '@/lib/audit-logger'
import { z } from 'zod'
import csv from 'csv-parse/sync'

// Input validation schemas
const BulkCreateSchema = z.object({
  projectId: z.string().cuid(),
  keywords: z.array(z.object({
    keyword: z.string().min(1).max(500),
    searchVolume: z.number().int().min(0).optional(),
    difficulty: z.enum(['VERY_EASY', 'EASY', 'MEDIUM', 'HARD', 'VERY_HARD']).optional(),
    cpc: z.number().min(0).optional(),
    competition: z.number().min(0).max(1).optional(),
    intent: z.string().optional(),
    country: z.string().length(2).optional(),
    language: z.string().length(2).optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional()
  })).min(1).max(500)
})

const GSCImportSchema = z.object({
  projectId: z.string().cuid(),
  siteUrl: z.string().url(),
  days: z.number().int().min(1).max(365).optional().default(30),
  minImpressions: z.number().int().min(1).optional().default(10),
  minClicks: z.number().int().min(0).optional().default(0),
  maxKeywords: z.number().int().min(1).max(1000).optional().default(500),
  categories: z.array(z.string()).optional(),
  organizationId: z.string().cuid()
})

const CSVImportSchema = z.object({
  projectId: z.string().cuid(),
  csvData: z.string().min(1),
  mapping: z.object({
    keyword: z.string(),
    searchVolume: z.string().optional(),
    difficulty: z.string().optional(),
    cpc: z.string().optional(),
    competition: z.string().optional(),
    intent: z.string().optional(),
    category: z.string().optional(),
    tags: z.string().optional(),
    priority: z.string().optional()
  })
})

// POST /api/keywords/bulk - Bulk create keywords
export async function POST(request: NextRequest) {
  try {
    // Rate limiting (more restrictive for bulk operations)
    const rateLimitResult = await rateLimitAPI(request, 'keywords-bulk', 10, 60)
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

    // Parse request body
    const body = await request.json()
    const { operation = 'create' } = body

    const keywordService = getKeywordTrackingService()

    // Handle different bulk operations
    switch (operation) {
      case 'create':
        return await handleBulkCreate(body, keywordService, session, rateLimitResult)
      
      case 'gsc-import':
        return await handleGSCImport(body, keywordService, session, rateLimitResult)
      
      case 'csv-import':
        return await handleCSVImport(body, keywordService, session, rateLimitResult)
      
      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
    }

  } catch (error) {
    console.error('Bulk keywords POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle bulk keyword creation
async function handleBulkCreate(
  body: any,
  keywordService: KeywordTrackingService,
  session: any,
  rateLimitResult: any
) {
  const validation = BulkCreateSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation error',
      details: validation.error.issues
    }, { status: 400 })
  }

  const { projectId, keywords } = validation.data
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
    keywords: [] as any[]
  }

  // Process keywords in batches to avoid overwhelming the system
  const batchSize = 20
  for (let i = 0; i < keywords.length; i += batchSize) {
    const batch = keywords.slice(i, i + batchSize)
    
    await Promise.all(batch.map(async (keywordData) => {
      try {
        // Check for existing keyword
        const existing = await keywordService.findKeywordByProjectAndKeyword(
          projectId,
          keywordData.keyword
        )

        if (existing) {
          results.skipped++
          results.errors.push(`Keyword "${keywordData.keyword}" already exists`)
          return
        }

        // Create keyword
        const keyword = await keywordService.addKeyword(
          projectId,
          keywordData,
          session.user.id!
        )

        // Start initial rank tracking
        const rankings = await keywordService.trackKeywordRanking(
          keyword.id,
          projectId,
          session.user.id!
        )

        // Calculate accuracy
        const accuracy = await keywordService.calculateKeywordAccuracy(
          keyword.id,
          rankings
        )

        results.success++
        results.keywords.push({
          id: keyword.id,
          keyword: keyword.keyword,
          rankings: rankings.length,
          confidenceScore: accuracy.confidenceScore
        })

      } catch (error) {
        results.failed++
        results.errors.push(`Failed to create "${keywordData.keyword}": ${error.message}`)
        console.error(`Error creating keyword ${keywordData.keyword}:`, error)
      }
    }))
  }

  // Audit logging
  await auditLog({
    userId: session.user.id!,
    organizationId: session.user.organizationId!,
    action: 'keywords.bulk.create',
    resource: `project:${projectId}`,
    details: {
      projectId,
      total: keywords.length,
      success: results.success,
      failed: results.failed,
      skipped: results.skipped
    }
  })

  return NextResponse.json({
    message: `Bulk creation completed: ${results.success} created, ${results.skipped} skipped, ${results.failed} failed`,
    results
  }, {
    status: results.failed === 0 ? 200 : 207, // 207 Multi-Status for partial success
    headers: rateLimitHeaders(rateLimitResult)
  })
}

// Handle Google Search Console import
async function handleGSCImport(
  body: any,
  keywordService: KeywordTrackingService,
  session: any,
  rateLimitResult: any
) {
  const validation = GSCImportSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation error',
      details: validation.error.issues
    }, { status: 400 })
  }

  const { projectId, siteUrl, days, minImpressions, minClicks, maxKeywords, organizationId } = validation.data

  try {
    // Import keywords from Google Search Console
    const importResult = await keywordService.importFromGSC(
      projectId,
      siteUrl,
      session.user.id!,
      organizationId,
      days,
      minImpressions
    )

    // Limit results if maxKeywords is specified
    if (maxKeywords && importResult.success > maxKeywords) {
      // This is handled in the service layer, but we document it here
    }

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId: session.user.organizationId!,
      action: 'keywords.bulk.gsc-import',
      resource: `project:${projectId}`,
      details: {
        projectId,
        siteUrl,
        days,
        minImpressions,
        minClicks,
        maxKeywords,
        results: importResult
      }
    })

    return NextResponse.json({
      message: `GSC import completed: ${importResult.success} imported, ${importResult.skipped} skipped, ${importResult.failed} failed`,
      results: importResult,
      siteUrl,
      dateRange: {
        days,
        from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      }
    }, {
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('GSC import error:', error)
    return NextResponse.json({
      error: 'GSC import failed',
      details: error.message
    }, { status: 500 })
  }
}

// Handle CSV import
async function handleCSVImport(
  body: any,
  keywordService: KeywordTrackingService,
  session: any,
  rateLimitResult: any
) {
  const validation = CSVImportSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation error',
      details: validation.error.issues
    }, { status: 400 })
  }

  const { projectId, csvData, mapping } = validation.data

  try {
    // Parse CSV data
    const records = csv.parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    if (records.length === 0) {
      return NextResponse.json({ error: 'No data found in CSV' }, { status: 400 })
    }

    if (records.length > 500) {
      return NextResponse.json({ error: 'CSV contains too many rows (max 500)' }, { status: 400 })
    }

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
      keywords: [] as any[]
    }

    // Process CSV records in batches
    const batchSize = 20
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (record, index) => {
        try {
          const rowNumber = i + index + 1

          // Map CSV columns to keyword data
          const keywordData: KeywordData = {
            keyword: record[mapping.keyword]?.trim()
          }

          if (!keywordData.keyword) {
            results.failed++
            results.errors.push(`Row ${rowNumber}: Missing keyword`)
            return
          }

          // Map optional fields
          if (mapping.searchVolume && record[mapping.searchVolume]) {
            const volume = parseInt(record[mapping.searchVolume])
            if (!isNaN(volume)) keywordData.searchVolume = volume
          }

          if (mapping.cpc && record[mapping.cpc]) {
            const cpc = parseFloat(record[mapping.cpc])
            if (!isNaN(cpc)) keywordData.cpc = cpc
          }

          if (mapping.competition && record[mapping.competition]) {
            const comp = parseFloat(record[mapping.competition])
            if (!isNaN(comp) && comp >= 0 && comp <= 1) keywordData.competition = comp
          }

          if (mapping.difficulty && record[mapping.difficulty]) {
            const difficulty = record[mapping.difficulty].toUpperCase()
            if (['VERY_EASY', 'EASY', 'MEDIUM', 'HARD', 'VERY_HARD'].includes(difficulty)) {
              keywordData.difficulty = difficulty as any
            }
          }

          if (mapping.intent && record[mapping.intent]) {
            keywordData.intent = record[mapping.intent].trim()
          }

          if (mapping.category && record[mapping.category]) {
            keywordData.category = record[mapping.category].trim()
          }

          if (mapping.priority && record[mapping.priority]) {
            const priority = record[mapping.priority].toLowerCase()
            if (['low', 'medium', 'high', 'critical'].includes(priority)) {
              keywordData.priority = priority as any
            }
          }

          if (mapping.tags && record[mapping.tags]) {
            keywordData.tags = record[mapping.tags]
              .split(',')
              .map(tag => tag.trim())
              .filter(Boolean)
          }

          // Check for existing keyword
          const existing = await keywordService.findKeywordByProjectAndKeyword(
            projectId,
            keywordData.keyword
          )

          if (existing) {
            results.skipped++
            results.errors.push(`Row ${rowNumber}: Keyword "${keywordData.keyword}" already exists`)
            return
          }

          // Create keyword
          const keyword = await keywordService.addKeyword(
            projectId,
            keywordData,
            session.user.id!
          )

          results.success++
          results.keywords.push({
            id: keyword.id,
            keyword: keyword.keyword,
            rowNumber
          })

        } catch (error) {
          results.failed++
          results.errors.push(`Row ${i + index + 1}: ${error.message}`)
          console.error(`Error processing CSV row ${i + index + 1}:`, error)
        }
      }))
    }

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId: session.user.organizationId!,
      action: 'keywords.bulk.csv-import',
      resource: `project:${projectId}`,
      details: {
        projectId,
        totalRows: records.length,
        mapping,
        results: {
          success: results.success,
          failed: results.failed,
          skipped: results.skipped
        }
      }
    })

    return NextResponse.json({
      message: `CSV import completed: ${results.success} imported, ${results.skipped} skipped, ${results.failed} failed`,
      results,
      totalRows: records.length
    }, {
      status: results.failed === 0 ? 200 : 207, // 207 Multi-Status for partial success
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json({
      error: 'CSV import failed',
      details: error.message
    }, { status: 500 })
  }
}