/**
 * Test Infrastructure Validation
 * Ensures the testing setup is working correctly
 */

import { describe, it, expect, vi } from 'vitest'
import { testUtils } from '../src/__tests__/utils/test-utils'
import '../src/__tests__/utils/custom-matchers'

describe('Test Infrastructure', () => {
  describe('Basic Setup', () => {
    it('should have Vitest configured correctly', () => {
      expect(typeof describe).toBe('function')
      expect(typeof it).toBe('function')
      expect(typeof expect).toBe('function')
      expect(typeof vi).toBe('object') // vi is an object containing mock utilities
      expect(typeof vi.fn).toBe('function')
    })

    it('should have test utilities available', () => {
      expect(testUtils).toBeDefined()
      expect(testUtils.waitFor).toBeDefined()
      expect(testUtils.createMockEvent).toBeDefined()
      expect(testUtils.generateId).toBeDefined()
    })

    it('should have environment variables set for testing', () => {
      expect(process.env.PREVIEW_MODE).toBe('true')
      expect(process.env.DISABLE_AUTH).toBe('true')
      expect(process.env.SKIP_ENV_VALIDATION).toBe('true')
    })
  })

  describe('Custom Matchers', () => {
    it('should validate confidence scores correctly', () => {
      expect(94).toHaveValidConfidenceScore()
      expect(80).toHaveValidConfidenceScore()
      expect(100).toHaveValidConfidenceScore()
      expect(79).not.toHaveValidConfidenceScore()
      expect(101).not.toHaveValidConfidenceScore()
    })

    it('should validate keyword data structure', () => {
      const validKeyword = {
        id: 'test-id',
        keyword: 'test keyword',
        position: 5,
        confidence: 94,
      }
      
      expect(validKeyword).toBeValidKeywordData()
      
      const invalidKeyword = {
        id: 'test-id',
        // Missing required fields
      }
      
      expect(invalidKeyword).not.toBeValidKeywordData()
    })

    it('should validate API responses', () => {
      const successResponse = {
        success: true,
        data: { test: true },
        timestamp: new Date().toISOString(),
      }
      
      expect(successResponse).toHaveValidApiResponse()
      
      const errorResponse = {
        success: false,
        error: 'Test error',
        timestamp: new Date().toISOString(),
      }
      
      expect(errorResponse).toHaveValidApiResponse()
    })

    it('should check accuracy thresholds', () => {
      expect(95).toBeWithinAccuracyThreshold(90)
      expect(85).not.toBeWithinAccuracyThreshold(90)
    })

    it('should validate ML metrics', () => {
      const validMetrics = {
        accuracy: 94,
        confidence: 87,
        modelVersion: '2.1.0',
        lastUpdated: new Date().toISOString(),
      }
      
      expect(validMetrics).toHaveValidMLMetrics()
    })
  })

  describe('Mock Data Generation', () => {
    it('should generate unique IDs', () => {
      const id1 = testUtils.generateId()
      const id2 = testUtils.generateId()
      
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
    })

    it('should generate valid email addresses', () => {
      const email = testUtils.generateEmail()
      
      expect(email).toMatch(/^test-\d+@example\.com$/)
    })

    it('should generate test keywords', () => {
      const keyword = testUtils.generateKeyword()
      
      expect(keyword).toMatch(/^test-keyword-[a-z0-9]+$/)
    })

    it('should create mock API responses', () => {
      const successResponse = testUtils.mockApiSuccess({ test: true })
      const errorResponse = testUtils.mockApiError('Test error')
      
      expect(successResponse).toHaveValidApiResponse()
      expect(errorResponse).toHaveValidApiResponse()
    })
  })

  describe('Mock Service Worker', () => {
    it('should intercept API calls', async () => {
      const response = await fetch('/api/health')
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.status).toBe('ok')
    })

    it('should handle ML confidence endpoint', async () => {
      const response = await fetch('/api/test/ml-confidence')
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.status).toBe('operational')
      expect(data.accuracy).toBe(94)
    })
  })
})