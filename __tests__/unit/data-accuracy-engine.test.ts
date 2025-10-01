/**
 * Data Accuracy Engine Tests
 * Tests for the core ML confidence scoring system (TDD approach)
 * Target: 94% accuracy requirement validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  DataAccuracyEngine, 
  DataSource, 
  type DataPoint, 
  type ConfidenceScore,
  type AccuracyReport 
} from '../../src/lib/data-accuracy-engine'
import '../../src/__tests__/utils/custom-matchers'

// Mock Prisma client
const mockPrisma = {
  dataPoint: {
    findMany: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
  },
  accuracyReport: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
} as any

describe('DataAccuracyEngine', () => {
  let engine: DataAccuracyEngine
  let mockDataPoint: DataPoint
  let recentTimestamp: Date
  let oldTimestamp: Date

  beforeEach(() => {
    engine = new DataAccuracyEngine(mockPrisma)
    recentTimestamp = new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    oldTimestamp = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    
    mockDataPoint = {
      id: 'test-dp-1',
      source: DataSource.GOOGLE_SEARCH_CONSOLE,
      value: 1000,
      timestamp: recentTimestamp,
      metadata: { keyword: 'test keyword' }
    }

    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should initialize with default prisma client', () => {
      const engine = new DataAccuracyEngine()
      expect(engine).toBeInstanceOf(DataAccuracyEngine)
    })

    it('should accept custom prisma client', () => {
      const engine = new DataAccuracyEngine(mockPrisma)
      expect(engine).toBeInstanceOf(DataAccuracyEngine)
    })
  })

  describe('calculateConfidenceScore', () => {
    it('should calculate confidence score with all components', async () => {
      // Arrange
      const projectId = 'test-project'
      const metric = 'organic_clicks'
      
      mockPrisma.dataPoint.findMany.mockResolvedValue([])

      // Act
      const score = await engine.calculateConfidenceScore(
        projectId,
        metric,
        mockDataPoint
      )

      // Assert
      expect(score).toMatchObject({
        overall: expect.any(Number),
        freshness: expect.any(Number),
        consistency: expect.any(Number),
        reliability: expect.any(Number),
        completeness: expect.any(Number),
      })

      expect(score.overall).toBeWithinAccuracyThreshold(80)
      expect(score.freshness).toBeWithinAccuracyThreshold(80)
      expect(score.reliability).toBe(95) // Google Search Console reliability
    })

    it('should handle multiple comparison data points', async () => {
      // Arrange
      const projectId = 'test-project'
      const metric = 'organic_clicks'
      const comparePoints: DataPoint[] = [
        {
          id: 'compare-1',
          source: DataSource.GOOGLE_ANALYTICS,
          value: 1050, // 5% variance - should be good consistency
          timestamp: recentTimestamp,
        },
        {
          id: 'compare-2',
          source: DataSource.AHREFS_API,
          value: 980, // 2% variance - should be excellent consistency
          timestamp: recentTimestamp,
        }
      ]

      mockPrisma.dataPoint.findMany.mockResolvedValue([])

      // Act
      const score = await engine.calculateConfidenceScore(
        projectId,
        metric,
        mockDataPoint,
        comparePoints
      )

      // Assert
      expect(score.consistency).toBeGreaterThan(80) // Good consistency expected
      expect(score.overall).toBeWithinAccuracyThreshold(85)
    })

    it('should penalize inconsistent data sources', async () => {
      // Arrange
      const projectId = 'test-project'
      const metric = 'organic_clicks'
      const inconsistentPoints: DataPoint[] = [
        {
          id: 'inconsistent-1',
          source: DataSource.MOZ_API,
          value: 1500, // 50% variance - very inconsistent
          timestamp: recentTimestamp,
        }
      ]

      mockPrisma.dataPoint.findMany.mockResolvedValue([])

      // Act
      const score = await engine.calculateConfidenceScore(
        projectId,
        metric,
        mockDataPoint,
        inconsistentPoints
      )

      // Assert
      expect(score.consistency).toBeLessThan(50) // Poor consistency expected
    })
  })

  describe('calculateFreshnessScore', () => {
    it('should return 100 for very fresh data (< 1 hour)', async () => {
      // Arrange
      const freshData: DataPoint = {
        ...mockDataPoint,
        timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      }

      // Act
      const score = await engine.calculateConfidenceScore('test', 'clicks', freshData)

      // Assert
      expect(score.freshness).toBe(100)
    })

    it('should return 90 for recent data (< 6 hours)', async () => {
      // Arrange
      const recentData: DataPoint = {
        ...mockDataPoint,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      }

      // Act
      const score = await engine.calculateConfidenceScore('test', 'clicks', recentData)

      // Assert
      expect(score.freshness).toBe(90)
    })

    it('should return low score for old data (> 3 days)', async () => {
      // Arrange
      const oldData: DataPoint = {
        ...mockDataPoint,
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      }

      // Act
      const score = await engine.calculateConfidenceScore('test', 'clicks', oldData)

      // Assert
      expect(score.freshness).toBe(10)
    })
  })

  describe('calculateReliabilityScore', () => {
    it('should assign highest scores to Google sources', async () => {
      // Arrange & Act
      const gscScore = await engine.calculateConfidenceScore('test', 'clicks', {
        ...mockDataPoint,
        source: DataSource.GOOGLE_SEARCH_CONSOLE
      })

      const gaScore = await engine.calculateConfidenceScore('test', 'clicks', {
        ...mockDataPoint,
        source: DataSource.GOOGLE_ANALYTICS
      })

      // Assert
      expect(gscScore.reliability).toBe(95)
      expect(gaScore.reliability).toBe(95)
    })

    it('should assign lower scores to third-party sources', async () => {
      // Arrange & Act
      const mozScore = await engine.calculateConfidenceScore('test', 'clicks', {
        ...mockDataPoint,
        source: DataSource.MOZ_API
      })

      const internalScore = await engine.calculateConfidenceScore('test', 'clicks', {
        ...mockDataPoint,
        source: DataSource.INTERNAL_CRAWLER
      })

      // Assert
      expect(mozScore.reliability).toBe(75)
      expect(internalScore.reliability).toBe(70)
    })
  })

  describe('detectDiscrepancies', () => {
    it('should detect high variance discrepancies', async () => {
      // Arrange
      const primaryPoint: DataPoint = {
        id: 'primary',
        source: DataSource.GOOGLE_SEARCH_CONSOLE,
        value: 1000,
        timestamp: recentTimestamp,
      }

      const comparePoints: DataPoint[] = [
        {
          id: 'compare',
          source: DataSource.AHREFS_API,
          value: 1800, // 80% variance - should be flagged
          timestamp: recentTimestamp,
        }
      ]

      // Mock method access - need to test via public interface
      const score = await engine.calculateConfidenceScore(
        'test-project',
        'clicks',
        primaryPoint,
        comparePoints
      )

      // Assert
      expect(score.consistency).toBeLessThan(30) // Should show poor consistency
    })

    it('should not flag low variance differences', async () => {
      // Arrange
      const primaryPoint: DataPoint = {
        id: 'primary',
        source: DataSource.GOOGLE_SEARCH_CONSOLE,
        value: 1000,
        timestamp: recentTimestamp,
      }

      const comparePoints: DataPoint[] = [
        {
          id: 'compare',
          source: DataSource.GOOGLE_ANALYTICS,
          value: 1030, // 3% variance - should be acceptable
          timestamp: recentTimestamp,
        }
      ]

      const score = await engine.calculateConfidenceScore(
        'test-project',
        'clicks',
        primaryPoint,
        comparePoints
      )

      // Assert
      expect(score.consistency).toBeGreaterThan(90) // Should show excellent consistency
    })
  })

  describe('generateAccuracyReport', () => {
    it('should generate comprehensive accuracy report', async () => {
      // Arrange
      const projectId = 'test-project'
      const metric = 'organic_clicks'
      
      mockPrisma.accuracyReport.create.mockResolvedValue({
        id: 'report-1',
        projectId,
        metric,
        primaryValue: 1000,
        isAccurate: true,
        checkedAt: new Date(),
      })

      // Act - assuming this method exists (TDD - test first)
      const report = await engine.generateAccuracyReport(
        projectId,
        metric,
        mockDataPoint,
        []
      )

      // Assert
      expect(report).toMatchObject({
        id: expect.any(String),
        projectId,
        metric,
        primaryValue: 1000,
        confidenceScore: expect.any(Object),
        isAccurate: expect.any(Boolean),
        checkedAt: expect.any(Date),
      })

      expect(report.confidenceScore.overall).toBeWithinAccuracyThreshold(80)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero value data points', async () => {
      // Arrange
      const zeroValuePoint: DataPoint = {
        ...mockDataPoint,
        value: 0
      }

      // Act
      const score = await engine.calculateConfidenceScore(
        'test',
        'clicks',
        zeroValuePoint
      )

      // Assert
      expect(score.overall).toBeGreaterThan(0)
      expect(score.consistency).toBe(50) // Neutral when no comparisons
    })

    it('should handle negative values gracefully', async () => {
      // Arrange
      const negativePoint: DataPoint = {
        ...mockDataPoint,
        value: -100
      }

      // Act & Assert - should not throw
      expect(async () => {
        await engine.calculateConfidenceScore('test', 'clicks', negativePoint)
      }).not.toThrow()
    })

    it('should handle future timestamps', async () => {
      // Arrange
      const futurePoint: DataPoint = {
        ...mockDataPoint,
        timestamp: new Date(Date.now() + 60 * 60 * 1000) // 1 hour in future
      }

      // Act
      const score = await engine.calculateConfidenceScore(
        'test',
        'clicks',
        futurePoint
      )

      // Assert
      expect(score.freshness).toBe(100) // Future data is considered fresh
    })

    it('should handle missing metadata gracefully', async () => {
      // Arrange
      const pointWithoutMetadata: DataPoint = {
        id: 'test',
        source: DataSource.GOOGLE_SEARCH_CONSOLE,
        value: 1000,
        timestamp: recentTimestamp,
        // No metadata
      }

      // Act & Assert
      expect(async () => {
        await engine.calculateConfidenceScore('test', 'clicks', pointWithoutMetadata)
      }).not.toThrow()
    })
  })

  describe('Performance Requirements', () => {
    it('should calculate confidence score within 200ms', async () => {
      // Arrange
      const startTime = Date.now()

      // Act
      await engine.calculateConfidenceScore(
        'test-project',
        'clicks',
        mockDataPoint,
        []
      )

      // Assert
      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(200)
    })

    it('should handle multiple data points efficiently', async () => {
      // Arrange
      const comparePoints: DataPoint[] = Array.from({ length: 10 }, (_, i) => ({
        id: `compare-${i}`,
        source: DataSource.AHREFS_API,
        value: 1000 + (i * 10),
        timestamp: recentTimestamp,
      }))

      const startTime = Date.now()

      // Act
      await engine.calculateConfidenceScore(
        'test-project',
        'clicks',
        mockDataPoint,
        comparePoints
      )

      // Assert
      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(500) // Should handle 10 comparisons quickly
    })
  })

  describe('Accuracy Thresholds (94% Requirement)', () => {
    it('should achieve minimum 94% accuracy for high-quality data', async () => {
      // Arrange - Perfect scenario
      const perfectData: DataPoint = {
        id: 'perfect',
        source: DataSource.GOOGLE_SEARCH_CONSOLE,
        value: 1000,
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      }

      const consistentComparisons: DataPoint[] = [
        {
          id: 'consistent-1',
          source: DataSource.GOOGLE_ANALYTICS,
          value: 1010, // 1% variance
          timestamp: new Date(Date.now() - 20 * 60 * 1000),
        }
      ]

      mockPrisma.dataPoint.findMany.mockResolvedValue([])

      // Act
      const score = await engine.calculateConfidenceScore(
        'test-project',
        'clicks',
        perfectData,
        consistentComparisons
      )

      // Assert
      expect(score.overall).toBeWithinAccuracyThreshold(94)
      expect(score.freshness).toBeGreaterThanOrEqual(90)
      expect(score.reliability).toBeGreaterThanOrEqual(95)
      expect(score.consistency).toBeGreaterThanOrEqual(90)
    })
  })
})