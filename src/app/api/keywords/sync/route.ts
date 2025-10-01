/**
 * Project Keyword Synchronization API Routes
 * Handles bulk synchronization of keywords across projects with Google Search Console
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { KeywordTrackingService } from '@/lib/keyword-tracking'
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limiting-unified'
import { auditLog } from '@/lib/audit-logger'
import { z } from 'zod'

// Input validation schema
const SyncProjectSchema = z.object({
  projectId: z.string().cuid(),
  organizationId: z.string().cuid(),
  syncOptions: z.object({
    updateExisting: z.boolean().optional().default(true),
    addNewKeywords: z.boolean().optional().default(true),
    updateRankings: z.boolean().optional().default(true),
    recalculateAccuracy: z.boolean().optional().default(true),
    maxKeywords: z.number().int().min(1).max(1000).optional().default(500),
    minImpressions: z.number().int().min(0).optional().default(10),
    daysBack: z.number().int().min(1).max(365).optional().default(30)
  }).optional().default({})
})

const BulkSyncSchema = z.object({
  projectIds: z.array(z.string().cuid()).min(1).max(20),
  organizationId: z.string().cuid(),
  syncOptions: z.object({
    updateExisting: z.boolean().optional().default(true),
    addNewKeywords: z.boolean().optional().default(true),
    updateRankings: z.boolean().optional().default(true),
    recalculateAccuracy: z.boolean().optional().default(true),
    maxKeywords: z.number().int().min(1).max(1000).optional().default(500),
    minImpressions: z.number().int().min(0).optional().default(10),
    daysBack: z.number().int().min(1).max(365).optional().default(30)
  }).optional().default({})
})

// POST /api/keywords/sync - Synchronize keywords for a project or multiple projects
export async function POST(request: NextRequest) {
  try {
    // Rate limiting (very restrictive for sync operations)
    const rateLimitResult = await rateLimit(request, 'keywords-sync', 3, 300) // 3 per 5 minutes
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Keyword sync is limited to 3 requests per 5 minutes.' },
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
    const { operation = 'single' } = body

    const keywordService = new KeywordTrackingService()

    // Handle different sync operations
    switch (operation) {
      case 'single':
        return await handleSingleProjectSync(body, keywordService, session, rateLimitResult)
      
      case 'bulk':
        return await handleBulkProjectSync(body, keywordService, session, rateLimitResult)
      
      default:
        return NextResponse.json({ error: 'Invalid operation. Use "single" or "bulk".' }, { status: 400 })
    }

  } catch (error) {
    console.error('Keywords sync API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle single project synchronization
async function handleSingleProjectSync(
  body: any,
  keywordService: KeywordTrackingService,
  session: any,
  rateLimitResult: any
) {
  const validation = SyncProjectSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation error',
      details: validation.error.issues
    }, { status: 400 })
  }

  const { projectId, organizationId, syncOptions } = validation.data
  const startTime = Date.now()

  try {
    // Get project information
    const project = await keywordService.getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Perform the synchronization
    const syncResult = await keywordService.syncProjectKeywords(
      projectId,
      session.user.id!,
      organizationId
    )

    const endTime = Date.now()
    const duration = endTime - startTime

    // If we have additional sync options, apply them
    let additionalResults = {
      rankingsUpdated: 0,
      accuracyRecalculated: 0
    }

    if (syncOptions.updateRankings) {
      // Update rankings for all keywords in the project
      const keywords = await keywordService.getProjectKeywords(projectId, { limit: syncOptions.maxKeywords })
      
      const rankingUpdates = await Promise.all(
        keywords.slice(0, 50).map(async (keyword) => { // Limit to 50 to avoid overwhelming APIs
          try {
            const rankings = await keywordService.trackKeywordRanking(
              keyword.id,
              projectId,
              session.user.id!
            )
            
            if (syncOptions.recalculateAccuracy && rankings.length > 0) {
              await keywordService.calculateKeywordAccuracy(keyword.id, rankings)
              additionalResults.accuracyRecalculated++
            }
            
            return rankings.length
          } catch (error) {
            console.error(`Error updating rankings for keyword ${keyword.id}:`, error)
            return 0
          }
        })
      )

      additionalResults.rankingsUpdated = rankingUpdates.reduce((sum, count) => sum + count, 0)
    }

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId: session.user.organizationId!,
      action: 'keywords.sync.project',
      resource: `project:${projectId}`,
      details: {
        projectId,
        organizationId,
        syncOptions,
        results: {
          ...syncResult,
          ...additionalResults
        },
        duration,
        success: syncResult.errors.length === 0
      }
    })

    return NextResponse.json({
      message: `Project synchronization completed in ${Math.round(duration / 1000)}s`,
      project: {
        id: project.id,
        name: project.name
      },
      results: {
        ...syncResult,
        ...additionalResults
      },
      syncOptions,
      performance: {
        duration,
        keywordsPerSecond: Math.round((syncResult.updated / duration) * 1000)
      },
      timestamp: new Date().toISOString()
    }, {
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Single project sync error:', error)
    
    // Audit logging for errors
    await auditLog({
      userId: session.user.id!,
      organizationId: session.user.organizationId!,
      action: 'keywords.sync.project.error',
      resource: `project:${projectId}`,
      details: {
        projectId,
        organizationId,
        syncOptions,
        error: error.message,
        duration: Date.now() - startTime
      }
    })

    return NextResponse.json({
      error: 'Project synchronization failed',
      details: error.message,
      projectId
    }, { status: 500 })
  }
}

// Handle bulk project synchronization
async function handleBulkProjectSync(
  body: any,
  keywordService: KeywordTrackingService,
  session: any,
  rateLimitResult: any
) {
  const validation = BulkSyncSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation error',
      details: validation.error.issues
    }, { status: 400 })
  }

  const { projectIds, organizationId, syncOptions } = validation.data
  const startTime = Date.now()

  const bulkResults = {
    total: projectIds.length,
    successful: 0,
    failed: 0,
    results: [] as any[],
    errors: [] as string[]
  }

  // Process projects sequentially to avoid overwhelming APIs
  for (const projectId of projectIds) {
    try {
      // Get project information
      const project = await keywordService.getProjectById(projectId)
      if (!project) {
        bulkResults.failed++
        bulkResults.errors.push(`Project ${projectId} not found`)
        continue
      }

      // Perform synchronization
      const syncResult = await keywordService.syncProjectKeywords(
        projectId,
        session.user.id!,
        organizationId
      )

      // Additional operations if requested
      let additionalResults = {
        rankingsUpdated: 0,
        accuracyRecalculated: 0
      }

      if (syncOptions.updateRankings) {
        const keywords = await keywordService.getProjectKeywords(projectId, { limit: 25 }) // Reduced limit for bulk operations
        
        for (const keyword of keywords.slice(0, 25)) {
          try {
            const rankings = await keywordService.trackKeywordRanking(
              keyword.id,
              projectId,
              session.user.id!
            )
            
            if (syncOptions.recalculateAccuracy && rankings.length > 0) {
              await keywordService.calculateKeywordAccuracy(keyword.id, rankings)
              additionalResults.accuracyRecalculated++
            }
            
            additionalResults.rankingsUpdated += rankings.length
          } catch (error) {
            // Continue with other keywords
            console.error(`Error updating rankings for keyword ${keyword.id}:`, error)
          }
        }
      }

      bulkResults.successful++
      bulkResults.results.push({
        projectId,
        projectName: project.name,
        status: 'success',
        results: {
          ...syncResult,
          ...additionalResults
        }
      })

      // Add delay between projects to be respectful to APIs
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay

    } catch (error) {
      bulkResults.failed++
      bulkResults.errors.push(`Project ${projectId}: ${error.message}`)
      bulkResults.results.push({
        projectId,
        status: 'error',
        error: error.message
      })
    }
  }

  const endTime = Date.now()
  const duration = endTime - startTime

  // Audit logging
  await auditLog({
    userId: session.user.id!,
    organizationId: session.user.organizationId!,
    action: 'keywords.sync.bulk',
    resource: `projects:${projectIds.join(',')}`,
    details: {
      projectIds,
      organizationId,
      syncOptions,
      results: bulkResults,
      duration,
      success: bulkResults.failed === 0
    }
  })

  const statusCode = bulkResults.failed === 0 ? 200 : (bulkResults.successful > 0 ? 207 : 500) // 207 Multi-Status for partial success

  return NextResponse.json({
    message: `Bulk synchronization completed: ${bulkResults.successful} successful, ${bulkResults.failed} failed`,
    bulkResults,
    syncOptions,
    performance: {
      duration,
      averageTimePerProject: Math.round(duration / projectIds.length),
      projectsPerMinute: Math.round((projectIds.length / duration) * 60000)
    },
    timestamp: new Date().toISOString()
  }, {
    status: statusCode,
    headers: rateLimitHeaders(rateLimitResult)
  })
}

// GET /api/keywords/sync - Get synchronization status and history
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 'keywords-read', 50, 60)
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const keywordService = new KeywordTrackingService()

    // Get sync history from audit logs
    const syncHistory = await keywordService.getSyncHistory(
      organizationId,
      projectId,
      limit
    )

    // Get current sync status for projects
    const projects = projectId 
      ? [await keywordService.getProjectById(projectId)]
      : await keywordService.getOrganizationProjects(organizationId)

    const projectStatuses = await Promise.all(
      projects.filter(Boolean).map(async (project) => {
        const keywordCount = await keywordService.countKeywords({ projectId: project.id })
        const lastSync = syncHistory.find(s => s.resource.includes(project.id))
        
        // Check for keywords that need updates (older than 24 hours)
        const staleKeywords = await keywordService.getStaleKeywords(project.id, 24 * 60 * 60 * 1000) // 24 hours in ms
        
        return {
          projectId: project.id,
          projectName: project.name,
          keywordCount,
          lastSync: lastSync ? {
            timestamp: lastSync.createdAt,
            status: lastSync.details.success ? 'success' : 'error',
            results: lastSync.details.results
          } : null,
          staleKeywords: staleKeywords.length,
          needsSync: staleKeywords.length > 0 || !lastSync,
          gscConnected: project.gscSiteUrl ? true : false
        }
      })
    )

    return NextResponse.json({
      syncHistory,
      projectStatuses,
      summary: {
        totalProjects: projectStatuses.length,
        projectsNeedingSync: projectStatuses.filter(p => p.needsSync).length,
        connectedProjects: projectStatuses.filter(p => p.gscConnected).length,
        totalKeywords: projectStatuses.reduce((sum, p) => sum + p.keywordCount, 0),
        totalStaleKeywords: projectStatuses.reduce((sum, p) => sum + p.staleKeywords, 0)
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
    console.error('Keywords sync status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}