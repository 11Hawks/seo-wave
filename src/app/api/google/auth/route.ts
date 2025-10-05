import { NextRequest, NextResponse } from 'next/server'
import { rateLimitAPI, rateLimitHeaders } from '@/lib/rate-limiting-unified'
import { GoogleAPIService } from '@/lib/google-api-service'

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimitAPI(request, 'google-auth', 20)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: rateLimitHeaders(rateLimitResult)
        }
      )
    }

    // Get Google OAuth service instance
    const googleService = GoogleAPIService.getInstance()
    
    // Generate state token for security
    const state = Math.random().toString(36).substring(2) + Date.now().toString(36)
    
    // Get Google OAuth authorization URL
    const authUrl = googleService.getAuthUrl(state)

    return NextResponse.json({
      authUrl,
      state
    }, {
      status: 200,
      headers: rateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('Google auth URL generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Google auth URL' },
      { status: 500 }
    )
  }
}