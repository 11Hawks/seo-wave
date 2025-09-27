/**
 * Google Search Console OAuth Authorization Route
 * Initiates OAuth flow for Google Search Console integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { SimpleGoogleService } from '@/lib/google-simple'
import { authOptions } from '@/lib/auth'

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

    // Get organization ID from query params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Initialize simple Google service
    const googleService = new SimpleGoogleService(
      process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID!,
      process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET!,
      `${process.env.NEXTAUTH_URL}/api/google/search-console/callback`
    )
    
    // Generate authorization URL with Search Console scopes
    const scopes = [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/webmasters',
    ]
    
    const authUrl = googleService.generateAuthUrl(scopes, session.user.id)

    return NextResponse.json({
      authUrl,
      service: 'SEARCH_CONSOLE',
      organizationId,
    })
  } catch (error) {
    console.error('Google Search Console auth error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize Google Search Console authentication' },
      { status: 500 }
    )
  }
}