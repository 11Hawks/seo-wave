/**
 * Mock Service Worker (MSW) Server Configuration
 * Handles API mocking for tests
 */

import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Define API mock handlers
export const handlers = [
  // Health check endpoints
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      redis: 'connected',
    })
  }),

  // tRPC health check
  http.get('/api/trpc/health', () => {
    return HttpResponse.json({
      result: {
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
        },
      },
    })
  }),

  // ML Confidence scoring
  http.post('/api/confidence/score', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      success: true,
      confidence: Math.floor(Math.random() * 20) + 80, // 80-100%
      factors: {
        dataFreshness: 0.95,
        sourceReliability: 0.92,
        historicalAccuracy: 0.94,
      },
      timestamp: new Date().toISOString(),
    })
  }),

  // ML Health check
  http.get('/api/test/ml-confidence', () => {
    return HttpResponse.json({
      status: 'operational',
      accuracy: 94,
      lastUpdated: new Date().toISOString(),
      modelVersion: '2.1.0',
    })
  }),

  // Keywords API
  http.get('/api/keywords', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: '1',
          keyword: 'seo analytics',
          position: 5,
          volume: 12000,
          difficulty: 65,
          confidence: 94,
        },
        {
          id: '2',
          keyword: 'marketing platform',
          position: 12,
          volume: 8500,
          difficulty: 72,
          confidence: 91,
        },
      ],
      total: 2,
    })
  }),

  http.post('/api/keywords', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      success: true,
      data: {
        id: Math.random().toString(36).substring(7),
        ...body,
        position: Math.floor(Math.random() * 50) + 1,
        confidence: Math.floor(Math.random() * 20) + 80,
        createdAt: new Date().toISOString(),
      },
    })
  }),

  // Accuracy reports
  http.get('/api/accuracy/status', () => {
    return HttpResponse.json({
      success: true,
      accuracy: {
        overallAccuracy: 94,
        averageConfidence: 87,
        dataFreshness: 95,
        lastUpdated: new Date().toISOString(),
      },
    })
  }),

  // Google API mocks
  http.get('/api/google/search-console/auth', () => {
    return HttpResponse.json({
      authUrl: 'https://accounts.google.com/oauth/authorize?mock=true',
    })
  }),

  http.get('/api/google/analytics/auth', () => {
    return HttpResponse.json({
      authUrl: 'https://accounts.google.com/oauth/authorize?mock=true',
    })
  }),

  // Auth endpoints
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as any
    
    // Validate password requirements
    if (body.password && body.password.length < 8) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          error: 'Password must be at least 8 characters long',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Validate terms acceptance
    if (!body.acceptTerms) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          error: 'Terms and conditions must be accepted',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Valid registration
    return HttpResponse.json({
      success: true,
      user: {
        id: 'test-user-id',
        email: body.email,
        name: body.name,
      },
    })
  }),

  // Billing mocks
  http.post('/api/billing/checkout', () => {
    return HttpResponse.json({
      success: true,
      checkoutUrl: 'https://checkout.stripe.com/mock-session',
    })
  }),

  // Rate limiting test endpoint
  http.get('/api/test/rate-limit', () => {
    return HttpResponse.json({
      success: true,
      remaining: 99,
      resetTime: new Date(Date.now() + 60000).toISOString(),
    })
  }),

  // Missing endpoints identified from test failures
  http.get('/api/confidence/ml', () => {
    return HttpResponse.json({
      success: true,
      model: {
        status: 'active',
        accuracy: 94.2,
        version: '2.1.0',
        lastTrained: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        features: ['dataFreshness', 'sourceReliability', 'historicalAccuracy'],
      },
    })
  }),

  http.get('/api/confidence/alerts', ({ request }) => {
    const url = new URL(request.url)
    const severity = url.searchParams.get('severity')
    
    const alerts = [
      {
        id: '1',
        type: 'confidence_drop',
        severity: 'high',
        message: 'Confidence score dropped below 80% for keyword "seo tools"',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2', 
        type: 'data_staleness',
        severity: 'medium',
        message: 'Data for domain example.com is 48 hours old',
        timestamp: new Date().toISOString(),
      },
      {
        id: '3',
        type: 'api_limit',
        severity: 'low',
        message: 'Approaching Google API rate limit (80% usage)',
        timestamp: new Date().toISOString(),
      },
    ]

    const filteredAlerts = severity ? alerts.filter(alert => alert.severity === severity) : alerts

    return HttpResponse.json({
      success: true,
      alerts: filteredAlerts,
    })
  }),

  http.post('/api/billing/portal', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      success: true,
      portalUrl: 'https://billing.stripe.com/mock-portal-session',
      customerId: body.customerId || 'cus_mock_customer',
    })
  }),

  // Handle 404 for non-existent routes
  http.get('/api/nonexistent', () => {
    return new HttpResponse(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }),

  // Handle OPTIONS requests for CORS
  http.options('/api/*', () => {
    return new HttpResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }),
]

// Create and export the server
export const server = setupServer(...handlers)