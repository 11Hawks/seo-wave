/**
 * Simple Google OAuth Callback Route
 * Handles OAuth callback for all Google services
 */

import { NextRequest, NextResponse } from 'next/server'
import { SimpleGoogleService } from '@/lib/google-simple'
import { GoogleAPIService } from '@/lib/google-api-service'
import { rateLimitAPI } from '@/lib/rate-limiting-unified'
import { z } from 'zod'

const callbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=oauth_denied`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=missing_params`
      )
    }

    // Parse state to get user info and service type
    const [userId, organizationId, service] = state.split(':')
    
    if (!userId || !organizationId || !service) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=invalid_state`
      )
    }

    // Initialize appropriate Google service
    let clientId: string = ''
    let clientSecret: string = ''
    
    if (service === 'search-console') {
      clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID!
      clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET!
    } else if (service === 'analytics') {
      clientId = process.env.GOOGLE_ANALYTICS_CLIENT_ID!
      clientSecret = process.env.GOOGLE_ANALYTICS_CLIENT_SECRET!
    } else {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=invalid_service`
      )
    }

    const googleService = new SimpleGoogleService(
      clientId,
      clientSecret,
      `${process.env.NEXTAUTH_URL}/api/google/callback`
    )
    
    // Exchange code for tokens
    const credentials = await googleService.exchangeCodeForTokens(code)
    
    // For now, just redirect with success
    // In a full implementation, you would store the credentials in the database
    console.log(`Google ${service} connected successfully for user ${userId}`)
    console.log('Credentials received:', {
      hasAccessToken: !!credentials.access_token,
      hasRefreshToken: !!credentials.refresh_token,
      scopes: credentials.scope,
      expiryDate: new Date(credentials.expiry_date),
    })
    
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/integrations?success=${service}_connected`
    )
  } catch (error) {
    console.error('Google callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=connection_failed`
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimitAPI(request, 'google-callback', 20)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || ''
          }
        }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = callbackSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid callback parameters',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { code, state } = validationResult.data

    // Exchange code for tokens using GoogleAPIService
    const googleService = GoogleAPIService.getInstance()
    const tokens = await googleService.exchangeCodeForTokens(code)

    return NextResponse.json({
      success: true,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        scope: tokens.scope
      }
    }, {
      status: 200,
      headers: {
        'X-RateLimit-Limit': '20',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || ''
      }
    })

  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.json(
      { error: 'OAuth callback failed' },
      { status: 500 }
    )
  }
}