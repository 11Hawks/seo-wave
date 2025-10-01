/**
 * API Response Fixtures
 * Mock API responses for different scenarios (success, error, etc.)
 */

// Success responses
export const mockApiResponses = {
  // Generic success
  success: (data: any) => ({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }),

  // Generic error
  error: (message: string, code = 400) => ({
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
  }),

  // Health check
  health: {
    healthy: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      redis: 'connected',
      services: {
        ml: 'operational',
        google: 'connected',
        stripe: 'operational',
      },
    },
    unhealthy: {
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      redis: 'connected',
      services: {
        ml: 'degraded',
        google: 'error',
        stripe: 'operational',
      },
      errors: ['Database connection failed', 'Google API rate limited'],
    },
  },

  // ML Confidence responses
  mlConfidence: {
    success: {
      status: 'operational',
      accuracy: 94,
      lastUpdated: new Date().toISOString(),
      modelVersion: '2.1.0',
      metrics: {
        precision: 0.94,
        recall: 0.91,
        f1Score: 0.925,
      },
    },
    degraded: {
      status: 'degraded',
      accuracy: 87,
      lastUpdated: new Date().toISOString(),
      modelVersion: '2.0.8',
      warnings: ['Model performance below threshold'],
    },
    error: {
      status: 'error',
      error: 'ML service unavailable',
      lastUpdated: new Date().toISOString(),
    },
  },

  // Keywords API responses
  keywords: {
    list: {
      success: true,
      data: [
        {
          id: 'kw-1',
          keyword: 'seo analytics',
          position: 5,
          volume: 12000,
          difficulty: 65,
          confidence: 94,
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
      timestamp: new Date().toISOString(),
    },
    create: {
      success: true,
      data: {
        id: 'kw-new',
        keyword: 'new keyword',
        position: null,
        volume: 8500,
        difficulty: 72,
        confidence: 91,
        createdAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    },
    update: {
      success: true,
      data: {
        id: 'kw-1',
        keyword: 'updated keyword',
        position: 3,
        volume: 12000,
        difficulty: 65,
        confidence: 95,
        updatedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    },
    delete: {
      success: true,
      message: 'Keyword deleted successfully',
      timestamp: new Date().toISOString(),
    },
  },

  // Accuracy reports
  accuracy: {
    status: {
      success: true,
      data: {
        overallAccuracy: 94,
        averageConfidence: 87,
        dataFreshness: 95,
        totalKeywords: 150,
        lastUpdated: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    },
    report: {
      success: true,
      data: {
        id: 'report-1',
        accuracy: 94,
        confidence: 87,
        freshness: 95,
        trends: {
          accuracy: { current: 94, previous: 91, change: 3 },
          confidence: { current: 87, previous: 84, change: 3 },
        },
        generatedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    },
  },

  // Google API responses
  google: {
    authUrl: {
      authUrl: 'https://accounts.google.com/oauth/authorize?mock=true',
      state: 'mock-state-token',
    },
    callback: {
      success: true,
      message: 'Google account connected successfully',
      account: {
        email: 'user@gmail.com',
        verified_email: true,
        name: 'Test User',
      },
      timestamp: new Date().toISOString(),
    },
    searchConsole: {
      sites: [
        {
          siteUrl: 'https://example.com/',
          permissionLevel: 'siteOwner',
        },
      ],
      data: [
        {
          query: 'test keyword',
          clicks: 100,
          impressions: 1000,
          ctr: 0.1,
          position: 5.2,
        },
      ],
    },
    analytics: {
      accounts: [
        {
          id: 'UA-123456789-1',
          name: 'Test Website',
          webPropertyId: 'UA-123456789-1',
        },
      ],
      data: {
        pageviews: 5000,
        sessions: 3500,
        users: 2800,
        bounceRate: 0.35,
      },
    },
  },

  // Authentication responses
  auth: {
    register: {
      success: true,
      data: {
        user: {
          id: 'new-user-id',
          email: 'newuser@example.com',
          name: 'New User',
        },
        organization: {
          id: 'new-org-id',
          name: 'New Organization',
        },
      },
      timestamp: new Date().toISOString(),
    },
    login: {
      success: true,
      data: {
        user: {
          id: 'user-id',
          email: 'user@example.com',
          name: 'User',
        },
        session: 'session-token',
      },
      timestamp: new Date().toISOString(),
    },
  },

  // Billing responses
  billing: {
    checkout: {
      success: true,
      data: {
        checkoutUrl: 'https://checkout.stripe.com/mock-session',
        sessionId: 'cs_test_session_123',
      },
      timestamp: new Date().toISOString(),
    },
    portal: {
      success: true,
      data: {
        portalUrl: 'https://billing.stripe.com/p/session_123',
      },
      timestamp: new Date().toISOString(),
    },
    webhook: {
      received: true,
      processed: true,
      eventType: 'customer.subscription.updated',
      timestamp: new Date().toISOString(),
    },
  },

  // Rate limiting responses
  rateLimit: {
    allowed: {
      success: true,
      remaining: 95,
      resetTime: new Date(Date.now() + 60000).toISOString(),
      limit: 100,
      timestamp: new Date().toISOString(),
    },
    exceeded: {
      success: false,
      error: 'Rate limit exceeded',
      retryAfter: 60,
      timestamp: new Date().toISOString(),
    },
  },
}

// Error responses
export const mockErrorResponses = {
  validation: {
    success: false,
    error: 'Validation failed',
    details: [
      {
        field: 'email',
        message: 'Invalid email format',
      },
      {
        field: 'password',
        message: 'Password must be at least 8 characters',
      },
    ],
    timestamp: new Date().toISOString(),
  },
  authentication: {
    success: false,
    error: 'Authentication required',
    code: 401,
    timestamp: new Date().toISOString(),
  },
  authorization: {
    success: false,
    error: 'Insufficient permissions',
    code: 403,
    timestamp: new Date().toISOString(),
  },
  notFound: {
    success: false,
    error: 'Resource not found',
    code: 404,
    timestamp: new Date().toISOString(),
  },
  serverError: {
    success: false,
    error: 'Internal server error',
    code: 500,
    timestamp: new Date().toISOString(),
  },
  serviceUnavailable: {
    success: false,
    error: 'Service temporarily unavailable',
    code: 503,
    retryAfter: 300,
    timestamp: new Date().toISOString(),
  },
}