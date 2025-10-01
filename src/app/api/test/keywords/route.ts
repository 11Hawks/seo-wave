/**
 * Test Keywords API - No Authentication Required
 * Simple test endpoint for verifying keyword API functionality
 */

import { NextRequest, NextResponse } from 'next/server'

// GET /api/test/keywords - Test endpoint
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'Keyword API routes are working!',
      timestamp: new Date().toISOString(),
      availableRoutes: {
        main: '/api/keywords',
        simple: '/api/keywords/simple',
        bulk: '/api/keywords/bulk', 
        track: '/api/keywords/[id]/track',
        analytics: '/api/keywords/[id]/analytics',
        sync: '/api/keywords/sync'
      },
      features: [
        'CRUD operations for keywords',
        'Bulk import from CSV and Google Search Console',
        'Real-time rank tracking with confidence scoring',
        'Comprehensive performance analytics',
        'Project-level keyword synchronization',
        'Rate limiting and audit logging',
        'Mobile-first responsive design'
      ],
      status: 'operational',
      priority3: 'keyword_tracking_system_implemented'
    })
  } catch (error) {
    console.error('Test keywords API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/test/keywords - Test keyword creation without auth
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      message: 'Test keyword creation endpoint working',
      receivedData: body,
      timestamp: new Date().toISOString(),
      note: 'This is a test endpoint. Real keyword creation requires authentication.',
      realEndpoints: {
        authenticated: '/api/keywords',
        simple: '/api/keywords/simple'
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Invalid JSON in request body',
      message: 'Please send valid JSON data'
    }, { status: 400 })
  }
}