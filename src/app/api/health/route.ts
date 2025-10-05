import { NextRequest, NextResponse } from 'next/server'
import { rateLimitAPI, rateLimitHeaders } from '@/lib/rate-limiting-unified'

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimitAPI(request, 'health', 100) // Higher limit for health checks
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: rateLimitHeaders(rateLimitResult)
        }
      )
    }

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }

    return NextResponse.json(healthData, {
      status: 200,
      headers: rateLimitHeaders(rateLimitResult)
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}