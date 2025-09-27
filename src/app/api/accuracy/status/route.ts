/**
 * Data Accuracy Status API
 * Real-time accuracy monitoring and status endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { DataAccuracyEngine } from '@/lib/data-accuracy-engine'
import { AccuracyNotificationManager } from '@/lib/accuracy-notifications'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()
const accuracyEngine = new DataAccuracyEngine(prisma)
const notificationManager = new AccuracyNotificationManager(prisma)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const organizationId = searchParams.get('organizationId')

    // Handle single project status
    if (projectId) {
      return await this.getProjectStatus(projectId, session.user.id)
    }

    // Handle organization-wide status
    if (organizationId) {
      return await this.getOrganizationStatus(organizationId, session.user.id)
    }

    // Handle user's overall status
    return await this.getUserStatus(session.user.id)
  } catch (error) {
    console.error('Accuracy status error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve accuracy status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

async function getProjectStatus(projectId: string, userId: string) {
  // Verify user has access to the project
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { userId },
        {
          organization: {
            members: {
              some: {
                userId,
                role: { in: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] },
              },
            },
          },
        },
      ],
    },
    include: {
      searchConsoleData: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
      analyticsData: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!project) {
    return NextResponse.json(
      { error: 'Project not found or access denied' },
      { status: 404 }
    )
  }

  // Get project accuracy status
  const status = await accuracyEngine.getProjectAccuracyStatus(projectId)

  // Get recent alerts
  const alerts = await notificationManager.getActiveAlerts(projectId)
  const alertStats = await notificationManager.getAlertStatistics(projectId, 7)

  // Get data source status
  const dataSources = {
    searchConsole: {
      connected: project.gscConnected,
      lastSync: project.lastGscSyncAt,
      dataPoints: project.searchConsoleData.length,
      status: project.gscConnected ? 'active' : 'disconnected',
    },
    analytics: {
      connected: project.gaConnected,
      lastSync: project.lastGaSyncAt,
      dataPoints: project.analyticsData.length,
      status: project.gaConnected ? 'active' : 'disconnected',
    },
  }

  return NextResponse.json({
    success: true,
    project: {
      id: project.id,
      name: project.name,
      domain: project.domain,
    },
    accuracy: status,
    dataSources,
    alerts: {
      active: alerts.length,
      statistics: alertStats,
    },
    lastUpdated: new Date().toISOString(),
  })
}

async function getOrganizationStatus(organizationId: string, userId: string) {
  // Verify user has access to the organization
  const organization = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              userId,
              role: { in: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] },
            },
          },
        },
      ],
    },
    include: {
      projects: {
        select: {
          id: true,
          name: true,
          domain: true,
          gscConnected: true,
          gaConnected: true,
          lastGscSyncAt: true,
          lastGaSyncAt: true,
        },
      },
    },
  })

  if (!organization) {
    return NextResponse.json(
      { error: 'Organization not found or access denied' },
      { status: 404 }
    )
  }

  // Get accuracy status for all projects
  const projectStatuses = await Promise.all(
    organization.projects.map(async (project) => {
      const status = await accuracyEngine.getProjectAccuracyStatus(project.id)
      const alerts = await notificationManager.getActiveAlerts(project.id)
      
      return {
        project: {
          id: project.id,
          name: project.name,
          domain: project.domain,
        },
        accuracy: status,
        alerts: alerts.length,
        dataSources: {
          searchConsole: project.gscConnected,
          analytics: project.gaConnected,
        },
      }
    })
  )

  // Calculate organization-wide metrics
  const totalProjects = projectStatuses.length
  const connectedProjects = projectStatuses.filter(
    p => p.dataSources.searchConsole || p.dataSources.analytics
  ).length
  
  const averageAccuracy = totalProjects > 0 
    ? Math.round(
        projectStatuses.reduce((sum, p) => sum + p.accuracy.overallAccuracy, 0) / totalProjects
      )
    : 0

  const totalAlerts = projectStatuses.reduce((sum, p) => sum + p.alerts, 0)

  const averageConfidence = totalProjects > 0
    ? Math.round(
        projectStatuses.reduce((sum, p) => sum + p.accuracy.averageConfidence, 0) / totalProjects
      )
    : 0

  return NextResponse.json({
    success: true,
    organization: {
      id: organization.id,
      name: organization.name,
    },
    overview: {
      totalProjects,
      connectedProjects,
      averageAccuracy,
      averageConfidence,
      totalAlerts,
      connectionRate: Math.round((connectedProjects / Math.max(totalProjects, 1)) * 100),
    },
    projects: projectStatuses,
    lastUpdated: new Date().toISOString(),
  })
}

async function getUserStatus(userId: string) {
  // Get user's projects and organizations
  const userProjects = await prisma.project.findMany({
    where: {
      OR: [
        { userId },
        {
          organization: {
            members: {
              some: {
                userId,
                role: { in: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] },
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      domain: true,
      gscConnected: true,
      gaConnected: true,
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  // Get accuracy status for all user's projects
  const projectAccuracies = await Promise.all(
    userProjects.map(async (project) => {
      const status = await accuracyEngine.getProjectAccuracyStatus(project.id)
      return {
        projectId: project.id,
        accuracy: status.overallAccuracy,
        confidence: status.averageConfidence,
        alerts: status.criticalIssues,
      }
    })
  )

  const totalProjects = userProjects.length
  const connectedProjects = userProjects.filter(
    p => p.gscConnected || p.gaConnected
  ).length

  const averageAccuracy = totalProjects > 0
    ? Math.round(
        projectAccuracies.reduce((sum, p) => sum + p.accuracy, 0) / totalProjects
      )
    : 0

  const averageConfidence = totalProjects > 0
    ? Math.round(
        projectAccuracies.reduce((sum, p) => sum + p.confidence, 0) / totalProjects
      )
    : 0

  const totalAlerts = projectAccuracies.reduce((sum, p) => sum + p.alerts, 0)

  return NextResponse.json({
    success: true,
    user: {
      id: userId,
    },
    overview: {
      totalProjects,
      connectedProjects,
      averageAccuracy,
      averageConfidence,
      totalAlerts,
      connectionRate: Math.round((connectedProjects / Math.max(totalProjects, 1)) * 100),
    },
    projects: userProjects.map((project, index) => ({
      project: {
        id: project.id,
        name: project.name,
        domain: project.domain,
        organization: project.organization?.name,
      },
      accuracy: projectAccuracies[index],
      dataSources: {
        searchConsole: project.gscConnected,
        analytics: project.gaConnected,
      },
    })),
    lastUpdated: new Date().toISOString(),
  })
}

// Export the functions to avoid TypeScript issues
export { getProjectStatus, getOrganizationStatus, getUserStatus }