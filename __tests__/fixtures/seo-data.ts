/**
 * SEO Data Fixtures
 * Mock data for SEO analytics testing
 */

export const mockKeywordData = [
  {
    id: 'kw-1',
    keyword: 'seo analytics platform',
    position: 3,
    volume: 15000,
    difficulty: 68,
    confidence: 94,
    url: 'https://example.com/seo-analytics',
    clicks: 1250,
    impressions: 18500,
    ctr: 6.76,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'kw-2',
    keyword: 'marketing automation tools',
    position: 7,
    volume: 8900,
    difficulty: 72,
    confidence: 91,
    url: 'https://example.com/marketing-tools',
    clicks: 890,
    impressions: 12400,
    ctr: 7.18,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: 'kw-3',
    keyword: 'search console alternative',
    position: 12,
    volume: 5400,
    difficulty: 45,
    confidence: 88,
    url: 'https://example.com/search-console',
    clicks: 320,
    impressions: 6800,
    ctr: 4.71,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-17'),
  },
  {
    id: 'kw-4',
    keyword: 'keyword tracking software',
    position: 15,
    volume: 3200,
    difficulty: 58,
    confidence: 85,
    url: 'https://example.com/keyword-tracking',
    clicks: 180,
    impressions: 4200,
    ctr: 4.29,
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: 'kw-5',
    keyword: 'competitor analysis tool',
    position: 5,
    volume: 12000,
    difficulty: 75,
    confidence: 92,
    url: 'https://example.com/competitor-analysis',
    clicks: 980,
    impressions: 15600,
    ctr: 6.28,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-19'),
  },
]

export const mockAccuracyReport = {
  id: 'report-1',
  overallAccuracy: 94,
  averageConfidence: 87,
  dataFreshness: 95,
  totalKeywords: 150,
  highConfidenceKeywords: 142,
  lowConfidenceKeywords: 8,
  lastUpdated: new Date('2024-01-20').toISOString(),
  trends: {
    accuracy: {
      current: 94,
      previous: 91,
      change: +3,
    },
    confidence: {
      current: 87,
      previous: 84,
      change: +3,
    },
    freshness: {
      current: 95,
      previous: 93,
      change: +2,
    },
  },
  sources: [
    {
      name: 'Google Search Console',
      accuracy: 96,
      lastSync: new Date('2024-01-20').toISOString(),
    },
    {
      name: 'Google Analytics',
      accuracy: 94,
      lastSync: new Date('2024-01-20').toISOString(),
    },
    {
      name: 'Third-party APIs',
      accuracy: 89,
      lastSync: new Date('2024-01-19').toISOString(),
    },
  ],
}

export const mockMLMetrics = {
  accuracy: 94,
  confidence: 87,
  modelVersion: '2.1.0',
  lastUpdated: new Date('2024-01-20').toISOString(),
  trainingData: {
    samples: 50000,
    accuracy: 96.2,
    lastTraining: new Date('2024-01-15').toISOString(),
  },
  performance: {
    avgResponseTime: 125, // ms
    throughput: 1000, // requests/minute
    errorRate: 0.02, // 0.02%
  },
}

export const mockSearchConsoleData = [
  {
    query: 'seo analytics platform',
    clicks: 1250,
    impressions: 18500,
    ctr: 6.76,
    position: 3.2,
    page: 'https://example.com/seo-analytics',
    country: 'US',
    device: 'DESKTOP',
    date: new Date('2024-01-20'),
  },
  {
    query: 'marketing automation tools',
    clicks: 890,
    impressions: 12400,
    ctr: 7.18,
    position: 7.1,
    page: 'https://example.com/marketing-tools',
    country: 'US',
    device: 'MOBILE',
    date: new Date('2024-01-20'),
  },
  {
    query: 'search console alternative',
    clicks: 320,
    impressions: 6800,
    ctr: 4.71,
    position: 12.3,
    page: 'https://example.com/search-console',
    country: 'US',
    device: 'DESKTOP',
    date: new Date('2024-01-20'),
  },
]

export const mockAnalyticsData = [
  {
    page: '/seo-analytics',
    pageviews: 5420,
    uniquePageviews: 4850,
    timeOnPage: 245, // seconds
    bounceRate: 0.32,
    exitRate: 0.28,
    date: new Date('2024-01-20'),
  },
  {
    page: '/marketing-tools',
    pageviews: 3890,
    uniquePageviews: 3520,
    timeOnPage: 198,
    bounceRate: 0.38,
    exitRate: 0.35,
    date: new Date('2024-01-20'),
  },
  {
    page: '/search-console',
    pageviews: 2150,
    uniquePageviews: 1980,
    timeOnPage: 167,
    bounceRate: 0.42,
    exitRate: 0.39,
    date: new Date('2024-01-20'),
  },
]