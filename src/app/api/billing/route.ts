import { NextRequest, NextResponse } from 'next/server'
import { rateLimitAPI } from '@/lib/rate-limiting-unified'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimitAPI(request, 'billing', 30)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || ''
          }
        }
      )
    }

    // In preview mode, return mock billing data
    if (process.env.NODE_ENV === 'test' || process.env.PREVIEW_MODE === 'true') {
      const mockBillingData = {
        plan: {
          name: 'Pro Plan',
          price: 29,
          currency: 'USD',
          interval: 'month',
          features: [
            'Unlimited keyword tracking',
            'ML confidence scoring',
            'Google API integration',
            'Advanced analytics',
            'Priority support'
          ]
        },
        usage: {
          apiCalls: 15420,
          keywordsTracked: 127,
          confidenceCalculations: 3456,
          period: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          }
        },
        limits: {
          apiCallsLimit: 50000,
          keywordsLimit: 1000,
          confidenceCalculationsLimit: 10000
        },
        status: 'active',
        nextBillingDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        subscriptionId: 'sub_mock_123456789'
      }

      return NextResponse.json(mockBillingData, {
        status: 200,
        headers: {
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || ''
        }
      })
    }

    // Production billing logic would fetch real data from Stripe/billing provider
    // For now, return basic structure
    const billingData = {
      plan: {
        name: 'Free Plan',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: [
          'Basic keyword tracking',
          'Limited API calls',
          'Community support'
        ]
      },
      usage: {
        apiCalls: 0,
        keywordsTracked: 0,
        confidenceCalculations: 0,
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      },
      limits: {
        apiCallsLimit: 1000,
        keywordsLimit: 10,
        confidenceCalculationsLimit: 100
      },
      status: 'active'
    }

    return NextResponse.json(billingData, {
      status: 200,
      headers: {
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || ''
      }
    })

  } catch (error) {
    console.error('Billing data error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve billing information' },
      { status: 500 }
    )
  }
}