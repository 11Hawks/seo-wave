import { NextRequest, NextResponse } from 'next/server'
import { GoogleAnalyticsService } from '@/lib/google-analytics'
import { getRedisClient, getPrismaClient } from '@/lib/service-factory'

export async function GET(request: NextRequest) {
  const redis = getRedisClient()
  const prisma = getPrismaClient()
  
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

    // Retrieve OAuth state data
    const stateData = await redis.get(`google_oauth_state:${state}`)
    if (!stateData) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=invalid_state`
      )
    }

    const { service, organizationId, userId } = JSON.parse(stateData)
    
    if (service !== 'ANALYTICS') {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=invalid_service`
      )
    }

    // Initialize Google Analytics service
    const gaService = new GoogleAnalyticsService(redis, prisma)
    
    // Complete OAuth flow
    const properties = await gaService.completeOAuth(code, userId, organizationId)
    
    // Clean up OAuth state
    await redis.del(`google_oauth_state:${state}`)
    
    // Redirect back to integrations page with success
    const propertyCount = properties.length
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/integrations?success=ga_connected&properties=${propertyCount}`
    )
  } catch (err) {
    console.error('Google Analytics callback error:', err)
    
    // Clean up OAuth state on error
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')
    if (state) {
      await redis.del(`google_oauth_state:${state}`)
    }
    
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=connection_failed`
    )
  }
}
