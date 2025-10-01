/**
 * Custom Jest/Vitest Matchers
 * Domain-specific assertions for SEO Analytics Platform
 */

import { expect } from 'vitest'
import type { MatcherResult } from 'expect'

// Extend Vitest's expect interface
interface CustomMatchers<R = unknown> {
  toHaveValidConfidenceScore(): R
  toBeValidKeywordData(): R
  toHaveValidApiResponse(): R
  toBeWithinAccuracyThreshold(threshold: number): R
  toHaveValidMLMetrics(): R
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

// Custom matcher: Check if confidence score is valid (80-100%)
expect.extend({
  toHaveValidConfidenceScore(received: number): MatcherResult {
    const pass = typeof received === 'number' && received >= 80 && received <= 100
    
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid confidence score (80-100%)`
          : `Expected ${received} to be a valid confidence score (80-100%), got ${typeof received} ${received}`,
    }
  },
})

// Custom matcher: Check if keyword data structure is valid
expect.extend({
  toBeValidKeywordData(received: any): MatcherResult {
    const isValid = 
      received &&
      typeof received === 'object' &&
      typeof received.id === 'string' &&
      typeof received.keyword === 'string' &&
      typeof received.position === 'number' &&
      received.position >= 1 &&
      typeof received.confidence === 'number' &&
      received.confidence >= 80 &&
      received.confidence <= 100

    return {
      pass: isValid,
      message: () =>
        isValid
          ? `Expected keyword data not to be valid`
          : `Expected valid keyword data with id, keyword, position (>=1), and confidence (80-100%), got ${JSON.stringify(received)}`,
    }
  },
})

// Custom matcher: Check API response structure (flexible for different patterns)
expect.extend({
  toHaveValidApiResponse(received: any): MatcherResult {
    if (!received || typeof received !== 'object') {
      return {
        pass: false,
        message: () => `Expected valid API response object, got ${typeof received}`,
      }
    }

    // Pattern 1: Standard API response with success field and data
    const isStandardApiResponse = 
      typeof received.success === 'boolean' &&
      (received.success ? 'data' in received : 'error' in received)

    // Pattern 2: Standard API response with success field and nested objects
    const isNestedSuccessResponse = 
      typeof received.success === 'boolean' &&
      received.success === true &&
      (received.accuracy || received.user || received.authUrl || received.confidence || received.alerts || received.model)

    // Pattern 3: Health check response with status field
    const isHealthResponse = 
      typeof received.status === 'string' &&
      received.status === 'ok'

    // Pattern 4: ML confidence response
    const isMLResponse = 
      typeof received.status === 'string' &&
      received.status === 'operational' &&
      typeof received.accuracy === 'number'

    // Pattern 5: tRPC response
    const isTRPCResponse = 
      received.result &&
      typeof received.result === 'object' &&
      received.result.data &&
      typeof received.result.data === 'object'

    const hasValidStructure = isStandardApiResponse || isNestedSuccessResponse || isHealthResponse || isMLResponse || isTRPCResponse

    return {
      pass: hasValidStructure,
      message: () =>
        hasValidStructure
          ? `Expected API response not to be valid`
          : `Expected valid API response (standard, health, ML, or tRPC format), got ${JSON.stringify(received)}`,
    }
  },
})

// Custom matcher: Check if value is within accuracy threshold
expect.extend({
  toBeWithinAccuracyThreshold(received: number, threshold: number): MatcherResult {
    const pass = typeof received === 'number' && received >= threshold
    
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be within accuracy threshold of ${threshold}%`
          : `Expected ${received} to be within accuracy threshold of ${threshold}%, but it was below`,
    }
  },
})

// Custom matcher: Check ML metrics structure
expect.extend({
  toHaveValidMLMetrics(received: any): MatcherResult {
    const isValid = 
      received &&
      typeof received === 'object' &&
      typeof received.accuracy === 'number' &&
      received.accuracy >= 80 &&
      typeof received.confidence === 'number' &&
      received.confidence >= 80 &&
      typeof received.modelVersion === 'string' &&
      typeof received.lastUpdated === 'string'

    return {
      pass: isValid,
      message: () =>
        isValid
          ? `Expected ML metrics not to be valid`
          : `Expected valid ML metrics with accuracy (>=80), confidence (>=80), modelVersion, and lastUpdated, got ${JSON.stringify(received)}`,
    }
  },
})

// Export helper functions for complex validations
export const validators = {
  // Validate SEO data structure
  isValidSEOData: (data: any) => {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.keyword === 'string' &&
      typeof data.position === 'number' &&
      data.position >= 1 &&
      typeof data.volume === 'number' &&
      data.volume >= 0 &&
      typeof data.difficulty === 'number' &&
      data.difficulty >= 0 &&
      data.difficulty <= 100
    )
  },

  // Validate accuracy report structure
  isValidAccuracyReport: (report: any) => {
    return (
      report &&
      typeof report === 'object' &&
      typeof report.overallAccuracy === 'number' &&
      report.overallAccuracy >= 80 &&
      typeof report.averageConfidence === 'number' &&
      report.averageConfidence >= 80 &&
      typeof report.dataFreshness === 'number' &&
      report.dataFreshness >= 0 &&
      report.dataFreshness <= 100 &&
      typeof report.lastUpdated === 'string'
    )
  },

  // Validate rate limit headers
  isValidRateLimitHeaders: (headers: any) => {
    return (
      headers &&
      typeof headers === 'object' &&
      typeof headers['X-RateLimit-Limit'] === 'string' &&
      typeof headers['X-RateLimit-Remaining'] === 'string' &&
      typeof headers['X-RateLimit-Reset'] === 'string' &&
      typeof headers['X-RateLimit-Used'] === 'string'
    )
  },

  // Validate Google API response
  isValidGoogleAPIResponse: (response: any) => {
    return (
      response &&
      typeof response === 'object' &&
      (response.success === true || response.success === false) &&
      (response.success ? 'data' in response : 'error' in response)
    )
  },
}