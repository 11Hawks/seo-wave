/**
 * Data Accuracy Report API
 * Generate and retrieve data accuracy reports
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { DataAccuracyEngine, DataPoint, DataSource } from '@/lib/data-accuracy-engine'
import { AccuracyNotificationManager } from '@/lib/accuracy-notifications'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()
const accuracyEngine = new DataAccuracyEngine(prisma)
const notificationManager = new AccuracyNotificationManager(prisma)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      projectId,
      metric,
      primaryDataPoint,
      compareDataPoints = [],
    } = body

    if (!projectId || !metric || !primaryDataPoint) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, metric, primaryDataPoint' },
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
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Convert request data to DataPoint format
    const primary: DataPoint = {
      id: primaryDataPoint.id || `primary_${Date.now()}`,
      source: primaryDataPoint.source as DataSource,
      value: primaryDataPoint.value,
      timestamp: new Date(primaryDataPoint.timestamp || Date.now()),
      metadata: primaryDataPoint.metadata,
    }

    const comparisons: DataPoint[] = compareDataPoints.map((dp: any, index: number) => ({
      id: dp.id || `compare_${index}_${Date.now()}`,
      source: dp.source as DataSource,
      value: dp.value,
      timestamp: new Date(dp.timestamp || Date.now()),
      metadata: dp.metadata,
    }))

    // Generate accuracy report
    const report = await accuracyEngine.generateAccuracyReport(
      projectId,
      metric,
      primary,
      comparisons
    )

    // Process notifications
    const alerts = await notificationManager.processAccuracyReport(report)

    return NextResponse.json({
      success: true,
      report,
      alerts,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Accuracy report generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate accuracy report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

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
    const metric = searchParams.get('metric')
    const days = parseInt(searchParams.get('days') || '30', 10)

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
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
                  role: { in: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] },
                },
              },
            },
          },
        ],
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Get accuracy history
    const history = await accuracyEngine.getAccuracyHistory(projectId, metric, days)

    // Get current accuracy status
    const status = await accuracyEngine.getProjectAccuracyStatus(projectId)

    // Get active alerts
    const alerts = await notificationManager.getActiveAlerts(projectId)

    return NextResponse.json({
      success: true,
      projectId,
      metric,
      status,
      history,
      alerts,
      retrievedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Accuracy report retrieval error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve accuracy reports',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}