export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { rateLimitAPI } from '@/lib/rate-limiting-unified'
import { DataAccuracyEngine } from '@/lib/data-accuracy-engine'
import { z } from 'zod'


const confidenceQuerySchema = z.object({
  keyword: z.string().min(1, 'Keyword is required'),
  url: z.string().url('Valid URL is required').optional(),
  sources: z.string().transform(val => parseInt(val)).optional()
})

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimitAPI(request, 'confidence', 60)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '60',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || ''
          }
        }
      )
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryData = {
      keyword: searchParams.get('keyword'),
      url: searchParams.get('url'),
      sources: searchParams.get('sources')
    }

    const validationResult = confidenceQuerySchema.safeParse(queryData)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { keyword, url, sources } = validationResult.data

    // Calculate confidence score using ML engine
    const confidenceScore = await DataAccuracyEngine.calculateConfidenceScore({
      keyword,
      url: url || `https://example.com/search?q=${encodeURIComponent(keyword)}`,
      sources: sources || 3
    })

    return NextResponse.json(confidenceScore, {
      status: 200,
      headers: {
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    })

  } catch (error) {
    console.error('Confidence calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate confidence score' },
      { status: 500 }
    )
  }
}