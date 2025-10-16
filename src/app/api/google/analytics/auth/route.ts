import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Redis } from 'ioredis'
import { PrismaClient } from '@prisma/client'
import { GoogleAnalyticsService } from '@/lib/google-analytics'
import { authOptions } from '@/lib/auth'
import { getRedisClient, getPrismaClient } from '@/lib/service-factory'
import { rateLimitAPI } from '@/lib/rate-limiting-unified'

// Initialize services

export async function GET(request: NextRequest) {
  try {
    const redis = getRedisClient()
    const prisma = getPrismaClient()

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get organization ID from query params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to the organization
    const orgMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: session.user.id,
        },
      },
    })

    if (!orgMember) {
      return NextResponse.json(
        { error: 'Access denied to organization' },
        { status: 403 }
      )
    }

    // Initialize Google Analytics service
    const gaService = new GoogleAnalyticsService(redis, prisma)
    
    // Generate authorization URL
    const authUrl = gaService.getAuthorizationUrl(session.user.id)
    
    // Store organization ID for callback
    await redis.setex(
      `google_oauth_state:${session.user.id}`,
      600, // 10 minutes expiry
      JSON.stringify({
        service: 'ANALYTICS',
        organizationId,
        userId: session.user.id,
      })
    )

    return NextResponse.json({
      authUrl,
      service: 'ANALYTICS',
      organizationId,
    })
  } catch (error) {
    console.error('Google Analytics auth error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize Google Analytics authentication' },
      { status: 500 }
    )
  }
}