/**
 * Google Data Sync API Route
 * Triggers manual sync of Google Search Console and Analytics data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Redis } from 'ioredis'
import { PrismaClient } from '@prisma/client'
import { GoogleSearchConsoleService } from '@/lib/google-search-console'
import { GoogleAnalyticsService } from '@/lib/google-analytics'
import { authOptions } from '@/lib/auth'

// Initialize services
const redis = new Redis(process.env.REDIS_URL!)
const prisma = new PrismaClient()

interface SyncRequest {
  projectId: string
  organizationId: string
  services: Array<'SEARCH_CONSOLE' | 'ANALYTICS'>
  siteUrl?: string
  propertyId?: string
  days?: number
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body: SyncRequest = await request.json()
    const { projectId, organizationId, services, siteUrl, propertyId, days = 30 } = body

    // Validate required fields
    if (!projectId || !organizationId || !services?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, organizationId, services' },
        { status: 400 }
      )
    }

    // Verify user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: session.user.id },
          {
            organization: {
              members: {
                some: {
                  userId: session.user.id,
                  role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
                },
              },
            },
          },
        ],
      },
      include: {
        organization: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    const results = {
      searchConsole: null as any,
      analytics: null as any,
      errors: [] as string[],
    }

    // Sync Google Search Console data
    if (services.includes('SEARCH_CONSOLE')) {
      try {
        if (!siteUrl) {
          results.errors.push('Site URL is required for Search Console sync')
        } else {
          const gscService = new GoogleSearchConsoleService(redis, prisma)
          await gscService.syncProjectData(
            projectId,
            session.user.id,
            organizationId,
            siteUrl,
            days
          )
          results.searchConsole = {
            success: true,
            message: `Search Console data synced for ${days} days`,
            siteUrl,
            days,
          }
        }
      } catch (error) {
        console.error('Search Console sync error:', error)
        results.errors.push(`Search Console sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Sync Google Analytics data
    if (services.includes('ANALYTICS')) {
      try {
        if (!propertyId) {
          results.errors.push('Property ID is required for Analytics sync')
        } else {
          const gaService = new GoogleAnalyticsService(redis, prisma)
          await gaService.syncProjectData(
            projectId,
            session.user.id,
            organizationId,
            propertyId,
            days
          )
          results.analytics = {
            success: true,
            message: `Analytics data synced for ${days} days`,
            propertyId,
            days,
          }
        }
      } catch (error) {
        console.error('Analytics sync error:', error)
        results.errors.push(`Analytics sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Return results
    const hasErrors = results.errors.length > 0
    const hasSuccess = results.searchConsole?.success || results.analytics?.success

    return NextResponse.json(
      {
        success: hasSuccess && !hasErrors,
        partial: hasSuccess && hasErrors,
        results,
        syncedAt: new Date().toISOString(),
      },
      { status: hasErrors && !hasSuccess ? 500 : 200 }
    )
  } catch (error) {
    console.error('Google data sync error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to sync Google data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Get Google integration status for the organization
    const integrations = await prisma.googleIntegration.findMany({
      where: {
        userId: session.user.id,
        organizationId,
        isActive: true,
      },
      select: {
        service: true,
        properties: true,
        lastSyncAt: true,
        createdAt: true,
        scopes: true,
      },
    })

    const status = {
      searchConsole: {
        connected: false,
        sites: [] as string[],
        lastSyncAt: null as Date | null,
      },
      analytics: {
        connected: false,
        properties: [] as string[],
        lastSyncAt: null as Date | null,
      },
    }

    integrations.forEach(integration => {
      if (integration.service === 'SEARCH_CONSOLE') {
        status.searchConsole.connected = true
        status.searchConsole.sites = integration.properties
        status.searchConsole.lastSyncAt = integration.lastSyncAt
      } else if (integration.service === 'ANALYTICS') {
        status.analytics.connected = true
        status.analytics.properties = integration.properties
        status.analytics.lastSyncAt = integration.lastSyncAt
      }
    })

    return NextResponse.json({
      status,
      organizationId,
      userId: session.user.id,
    })
  } catch (error) {
    console.error('Google integration status error:', error)
    return NextResponse.json(
      { error: 'Failed to get integration status' },
      { status: 500 }
    )
  }
}