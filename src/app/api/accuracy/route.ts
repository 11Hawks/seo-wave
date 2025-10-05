import { NextRequest, NextResponse } from 'next/server'
import { rateLimitAPI, rateLimitHeaders } from '@/lib/rate-limiting-unified'
import { DataAccuracyEngine } from '@/lib/data-accuracy-engine'

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimitAPI(request, 'accuracy', 30) // Lower limit for detailed reports
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: rateLimitHeaders(rateLimitResult)
        }
      )
    }

    // Get comprehensive accuracy report
    const accuracyReport = await DataAccuracyEngine.getAccuracyReport()

    return NextResponse.json(accuracyReport, {
      status: 200,
      headers: {
        ...rateLimitHeaders(rateLimitResult),
        'Cache-Control': 'public, max-age=600' // Cache for 10 minutes
      }
    })

  } catch (error) {
    console.error('Accuracy report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate accuracy report' },
      { status: 500 }
    )
  }
}