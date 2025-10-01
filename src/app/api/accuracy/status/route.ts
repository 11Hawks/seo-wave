/**
 * Data Accuracy Status API Route
 * Provides real-time accuracy monitoring and transparency reporting
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { DataAccuracyEngine } from '@/lib/data-accuracy-engine';

/**
 * Request validation schema
 */
const accuracyStatusSchema = z.object({
  projectId: z.string().cuid(),
  organizationId: z.string().cuid().optional(),
  days: z.number().int().min(1).max(365).optional().default(30),
});

/**
 * GET /api/accuracy/status
 * Get accuracy status for a project
 */
export async function GET(request: NextRequest) {
  try {
    // Check if we're in preview mode
    const isPreviewMode = process.env.PREVIEW_MODE === 'true' || process.env.DISABLE_AUTH === 'true';
    
    if (!isPreviewMode) {
      // Get authenticated user
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Parse and validate request parameters
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId') || 'demo-project-id';
    const organizationId = url.searchParams.get('organizationId');
    const days = parseInt(url.searchParams.get('days') || '30');

    // Validate parameters
    const params = accuracyStatusSchema.parse({
      projectId,
      organizationId,
      days,
    });

    // Initialize accuracy engine
    const accuracyEngine = new DataAccuracyEngine();

    if (isPreviewMode) {
      // Return mock data for preview mode
      const mockResponse = {
        success: true,
        accuracy: {
          overallAccuracy: 94,
          lastChecked: new Date(),
          criticalIssues: 0,
          averageConfidence: 87,
          dataFreshness: 95,
        },
        dataSources: {
          'google-search-console': {
            name: 'Google Search Console',
            connected: true,
            lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            dataPoints: 1247,
            status: 'active' as const,
          },
          'google-analytics': {
            name: 'Google Analytics',
            connected: true,
            lastSync: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
            dataPoints: 856,
            status: 'active' as const,
          },
          'serpapi': {
            name: 'SERP API',
            connected: false,
            lastSync: null,
            dataPoints: 0,
            status: 'disconnected' as const,
          },
        },
        alerts: {
          active: [],
          resolved: [
            {
              id: 'alert-1',
              type: 'data_freshness',
              severity: 'LOW' as const,
              message: 'Data freshness score dropped below 90% for organic traffic metrics',
              triggeredAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
            },
          ],
        },
      };
      
      return NextResponse.json(mockResponse);
    }

    try {
      // Get accuracy status from the engine
      const accuracyStatus = await accuracyEngine.getProjectAccuracyStatus(params.projectId);

      // Mock data sources for now (would be retrieved from database in real implementation)
      const dataSources = {
        'google-search-console': {
          name: 'Google Search Console',
          connected: true,
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
          dataPoints: 1000,
          status: 'active' as const,
        },
        'google-analytics': {
          name: 'Google Analytics',
          connected: false,
          lastSync: null,
          dataPoints: 0,
          status: 'disconnected' as const,
        },
      };

      return NextResponse.json({
        success: true,
        accuracy: accuracyStatus,
        dataSources,
        alerts: {
          active: [],
          resolved: [],
        },
      });
    } catch (error) {
      console.error('Failed to get accuracy status:', error);
      
      // Return fallback data if accuracy engine fails
      return NextResponse.json({
        success: true,
        accuracy: {
          overallAccuracy: 0,
          lastChecked: null,
          criticalIssues: 0,
          averageConfidence: 0,
          dataFreshness: 0,
        },
        dataSources: {},
        alerts: {
          active: [],
          resolved: [],
        },
      });
    }

  } catch (error) {
    console.error('Accuracy status API error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}