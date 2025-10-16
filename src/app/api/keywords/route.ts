/**
 * Keywords API Routes
 * Comprehensive CRUD operations for keyword management with confidence scoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { KeywordTrackingService, KeywordData } from '@/lib/keyword-tracking'
import { rateLimitAPI, rateLimitHeaders } from '@/lib/rate-limiting-unified'
import { auditLog } from '@/lib/audit-logger'
import { z } from 'zod'

// Input validation schemas
const CreateKeywordSchema = z.object({
  projectId: z.string().cuid(),
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
})

const UpdateKeywordSchema = CreateKeywordSchema.partial().extend({
  id: z.string().cuid()
})

const BulkKeywordSchema = z.object({
  keywords: z.array(CreateKeywordSchema).min(1).max(100)
})

// GET /api/keywords - List keywords for a project
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitAPI(request, 'keywords-read', 100)
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
    const includeAccuracy = searchParams.get('includeAccuracy') === 'true'

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const keywordService = new KeywordTrackingService()
    
    // Build filter conditions
    const where: any = {
      projectId,
      ...(search && {
        keyword: {
          contains: search,
          mode: 'insensitive'
        }
      }),
      ...(category && { category }),
      ...(priority && { priority }),
      ...(tags && {
        tags: {
          hasSome: tags
        }
      })
    }

    // Get keywords with pagination
    const [keywords, totalCount] = await Promise.all([
      keywordService.getKeywords({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          rankings: {
            take: 1,
            orderBy: { checkedAt: 'desc' }
          },
          ...(includeAccuracy && {
            keywordAccuracy: {
              take: 1,
              orderBy: { calculatedAt: 'desc' }
            }
          })
        }
      }),
      keywordService.countKeywords(where)
    ])

    // Calculate performance metrics for each keyword
    const keywordsWithMetrics = await Promise.all(
      keywords.map(async (keyword) => {
        const performance = await keywordService.getKeywordPerformance(keyword.id)
        return {
          ...keyword,
          performance,
          latestRanking: keyword.rankings[0] || null,
          currentPosition: keyword.rankings[0]?.position || null,
          confidenceScore: includeAccuracy ? keyword.keywordAccuracy[0]?.confidenceScore : undefined
        }
      })
    )

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId: session.user.organizationId!,
      action: 'keywords.list',
      resource: `project:${projectId}`,
      details: {
        projectId,
        count: keywords.length,
        filters: { search, category, priority, tags }
      }
    })

    return NextResponse.json({
      keywords: keywordsWithMetrics,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      filters: {
        search,
        category,
        priority,
        tags
      }
    }, {
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Keywords GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/keywords - Create a new keyword
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitAPI(request, 'keywords-write', 50)
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
    const validation = CreateKeywordSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation error',
        details: validation.error.issues
      }, { status: 400 })
    }

    const keywordData: KeywordData = validation.data

    const keywordService = new KeywordTrackingService()
    
    // Check for duplicate keywords in the project
    const existingKeyword = await keywordService.findKeywordByProjectAndKeyword(
      keywordData.projectId,
      keywordData.keyword
    )

    if (existingKeyword) {
      return NextResponse.json({
        error: 'Keyword already exists in this project',
        existingKeyword: {
          id: existingKeyword.id,
          keyword: existingKeyword.keyword,
          createdAt: existingKeyword.createdAt
        }
      }, { status: 409 })
    }

    // Create the keyword
    const keyword = await keywordService.addKeyword(
      keywordData.projectId,
      keywordData,
      session.user.id!
    )

    // Start initial rank tracking
    const initialRankings = await keywordService.trackKeywordRanking(
      keyword.id,
      keywordData.projectId,
      session.user.id!,
      ['GSC'] // Start with Google Search Console
    )

    // Calculate initial accuracy score
    const accuracyData = await keywordService.calculateKeywordAccuracy(
      keyword.id,
      initialRankings
    )

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId: session.user.organizationId!,
      action: 'keywords.create',
      resource: `keyword:${keyword.id}`,
      details: {
        projectId: keywordData.projectId,
        keyword: keywordData.keyword,
        tags: keywordData.tags,
        category: keywordData.category,
        priority: keywordData.priority,
        initialRankingsCount: initialRankings.length,
        confidenceScore: accuracyData.confidenceScore
      }
    })

    return NextResponse.json({
      keyword,
      initialRankings,
      accuracyData,
      message: 'Keyword created successfully'
    }, {
      status: 201,
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Keywords POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/keywords - Update a keyword
export async function PUT(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitAPI(request, 'keywords-write', 50)
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
    const validation = UpdateKeywordSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation error',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { id, ...updateData } = validation.data

    const keywordService = new KeywordTrackingService()
    
    // Check if keyword exists and user has access
    const existingKeyword = await keywordService.getKeywordById(id)
    if (!existingKeyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 })
    }

    // Update the keyword
    const updatedKeyword = await keywordService.updateKeyword(
      id,
      updateData,
      session.user.id!
    )

    // Recalculate accuracy if keyword changed
    if (updateData.keyword && updateData.keyword !== existingKeyword.keyword) {
      // Get latest rankings
      const rankings = await keywordService.getKeywordRankings(id, 10)
      
      // Recalculate accuracy
      const accuracyData = await keywordService.calculateKeywordAccuracy(id, rankings)
      
      // Audit logging
      await auditLog({
        userId: session.user.id!,
        organizationId: session.user.organizationId!,
        action: 'keywords.update',
        resource: `keyword:${id}`,
        details: {
          changes: updateData,
          keywordChanged: true,
          newConfidenceScore: accuracyData.confidenceScore
        }
      })

      return NextResponse.json({
        keyword: updatedKeyword,
        accuracyData,
        message: 'Keyword updated and accuracy recalculated'
      }, {
        headers: rateLimitHeaders(rateLimitResult)
      })
    }

    // Audit logging for regular updates
    await auditLog({
      userId: session.user.id!,
      organizationId: session.user.organizationId!,
      action: 'keywords.update',
      resource: `keyword:${id}`,
      details: {
        changes: updateData,
        keywordChanged: false
      }
    })

    return NextResponse.json({
      keyword: updatedKeyword,
      message: 'Keyword updated successfully'
    }, {
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Keywords PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/keywords - Delete keywords
export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitAPI(request, 'keywords-write', 30, 60)
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

    // Parse query parameters for bulk delete or single delete
    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || []
    const single_id = searchParams.get('id')

    if (single_id) {
      ids.push(single_id)
    }

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No keyword IDs provided' }, { status: 400 })
    }

    if (ids.length > 50) {
      return NextResponse.json({ error: 'Cannot delete more than 50 keywords at once' }, { status: 400 })
    }

    const keywordService = new KeywordTrackingService()
    
    // Verify all keywords exist and get project info for audit
    const keywords = await keywordService.getKeywordsByIds(ids)
    const foundIds = keywords.map(k => k.id)
    const notFoundIds = ids.filter(id => !foundIds.includes(id))

    if (notFoundIds.length > 0) {
      return NextResponse.json({
        error: 'Some keywords not found',
        notFound: notFoundIds
      }, { status: 404 })
    }

    // Delete keywords and all related data (rankings, accuracy records)
    const deletedCount = await keywordService.deleteKeywords(ids, session.user.id!)

    // Audit logging
    await auditLog({
      userId: session.user.id!,
      organizationId: session.user.organizationId!,
      action: 'keywords.delete',
      resource: `keywords:${ids.join(',')}`,
      details: {
        deletedCount,
        keywordIds: ids,
        keywords: keywords.map(k => ({ id: k.id, keyword: k.keyword, projectId: k.projectId }))
      }
    })

    return NextResponse.json({
      message: `Successfully deleted ${deletedCount} keywords`,
      deletedCount,
      deletedIds: ids
    }, {
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Keywords DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}