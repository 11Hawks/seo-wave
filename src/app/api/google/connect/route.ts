/**
 * Simple Google API Connection Route
 * Provides basic Google OAuth flow without heavy dependencies
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SimpleGoogleService } from '@/lib/google-simple'

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
    const service = searchParams.get('service') // 'search-console' or 'analytics'
    const organizationId = searchParams.get('organizationId')
    
    if (!service || !organizationId) {
      return NextResponse.json(
        { error: 'Service and organization ID are required' },
        { status: 400 }
      )
    }

    let scopes: string[] = []
    let clientId: string = ''
    let clientSecret: string = ''
    
    if (service === 'search-console') {
      scopes = [
        'https://www.googleapis.com/auth/webmasters.readonly',
        'https://www.googleapis.com/auth/webmasters',
      ]
      clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID!
      clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET!
    } else if (service === 'analytics') {
      scopes = [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/analytics',
      ]
      clientId = process.env.GOOGLE_ANALYTICS_CLIENT_ID!
      clientSecret = process.env.GOOGLE_ANALYTICS_CLIENT_SECRET!
    } else {
      return NextResponse.json(
        { error: 'Invalid service type' },
        { status: 400 }
      )
    }

    // Initialize Google service
    const googleService = new SimpleGoogleService(
      clientId,
      clientSecret,
      `${process.env.NEXTAUTH_URL}/api/google/callback`
    )
    
    // Generate authorization URL
    const state = `${session.user.id}:${organizationId}:${service}`
    const authUrl = googleService.generateAuthUrl(scopes, state)

    return NextResponse.json({
      authUrl,
      service,
      organizationId,
      state,
    })
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize Google authentication' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      message: 'Google integration status',
      connected: false,
      availableServices: ['search-console', 'analytics'],
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