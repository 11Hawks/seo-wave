import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportToCSV, convertKeywordsToCSV } from '@/utils/csv-export'
import type { KeywordData } from '@/components/keywords/keyword-dashboard'

describe('CSV Export Utilities', () => {
  const mockKeywords: KeywordData[] = [
    {
      id: 'kw1',
      keyword: 'seo tools',
      projectId: 'proj1',
      searchVolume: 5000,
      difficulty: 'MEDIUM',
      cpc: 2.5,
      competition: 0.65,
      currentPosition: 8,
      gscClicks: 150,
      gscImpressions: 2000,
      gscCtr: 0.075,
      priority: 'high',
      category: 'SEO Software',
      positionTrend: 'up'
    },
    {
      id: 'kw2',
      keyword: 'keyword research',
      projectId: 'proj1',
      searchVolume: 3000,
      difficulty: 'EASY',
      cpc: 1.8,
      competition: 0.45,
      currentPosition: 12,
      gscClicks: 80,
      gscImpressions: 1200,
      gscCtr: 0.067,
      priority: 'medium',
      category: 'SEO Tools'
    }
  ]

  describe('convertKeywordsToCSV', () => {
    it('should return CSV string with headers', () => {
      const csv = convertKeywordsToCSV(mockKeywords)
      
      expect(csv).toContain('Keyword,Category,Priority,Position,Trend')
      expect(csv).toContain('Search Volume,Difficulty,CPC,Competition')
      expect(csv).toContain('Clicks,Impressions,CTR')
    })

    it('should include all keyword data in rows', () => {
      const csv = convertKeywordsToCSV(mockKeywords)
      
      expect(csv).toContain('seo tools')
      expect(csv).toContain('keyword research')
    })

    it('should format numbers correctly', () => {
      const csv = convertKeywordsToCSV(mockKeywords)
      
      expect(csv).toContain('5000') // search volume
      expect(csv).toContain('2.50') // CPC
      expect(csv).toContain('65.00') // competition percentage
    })

    it('should format CTR as percentage', () => {
      const csv = convertKeywordsToCSV(mockKeywords)
      
      expect(csv).toContain('7.50') // 0.075 as 7.50%
    })

    it('should handle missing optional fields', () => {
      const keywordWithMissing: KeywordData[] = [{
        id: 'kw3',
        keyword: 'test keyword',
        projectId: 'proj1'
      }]
      
      const csv = convertKeywordsToCSV(keywordWithMissing)
      
      expect(csv).toContain('test keyword')
      expect(csv).not.toContain('undefined')
      expect(csv).not.toContain('null')
    })

    it('should handle commas in keyword names', () => {
      const keywordWithComma: KeywordData[] = [{
        id: 'kw4',
        keyword: 'seo, tools, analytics',
        projectId: 'proj1'
      }]
      
      const csv = convertKeywordsToCSV(keywordWithComma)
      
      // Should be wrapped in quotes
      expect(csv).toContain('"seo, tools, analytics"')
    })

    it('should handle quotes in keyword names', () => {
      const keywordWithQuotes: KeywordData[] = [{
        id: 'kw5',
        keyword: 'best "seo" tools',
        projectId: 'proj1'
      }]
      
      const csv = convertKeywordsToCSV(keywordWithQuotes)
      
      // Quotes should be escaped
      expect(csv).toContain('best ""seo"" tools')
    })

    it('should return empty string for empty array', () => {
      const csv = convertKeywordsToCSV([])
      
      expect(csv).toBe('')
    })

    it('should include category when present', () => {
      const csv = convertKeywordsToCSV(mockKeywords)
      
      expect(csv).toContain('SEO Software')
      expect(csv).toContain('SEO Tools')
    })

    it('should include priority when present', () => {
      const csv = convertKeywordsToCSV(mockKeywords)
      
      expect(csv).toContain('high')
      expect(csv).toContain('medium')
    })

    it('should include position trend when present', () => {
      const csv = convertKeywordsToCSV(mockKeywords)
      
      expect(csv).toContain('up')
    })
  })

  describe('exportToCSV', () => {
    let createElementSpy: any
    let clickSpy: any
    let revokeObjectURLSpy: any

    beforeEach(() => {
      // Mock document.createElement
      clickSpy = vi.fn()
      const mockAnchor = {
        href: '',
        download: '',
        click: clickSpy,
        style: {}
      }
      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)
      
      // Mock URL.createObjectURL and revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
      revokeObjectURLSpy = vi.fn()
      global.URL.revokeObjectURL = revokeObjectURLSpy
      
      // Mock document.body
      document.body.appendChild = vi.fn()
      document.body.removeChild = vi.fn()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should create download link with CSV data', () => {
      exportToCSV(mockKeywords, 'test-export')
      
      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(global.URL.createObjectURL).toHaveBeenCalled()
    })

    it('should trigger download with correct filename', () => {
      exportToCSV(mockKeywords, 'my-keywords')
      
      const anchor = createElementSpy.mock.results[0].value
      expect(anchor.download).toContain('my-keywords')
      expect(anchor.download).toContain('.csv')
    })

    it('should include timestamp in filename', () => {
      exportToCSV(mockKeywords, 'keywords')
      
      const anchor = createElementSpy.mock.results[0].value
      expect(anchor.download).toMatch(/keywords_\d{4}-\d{2}-\d{2}\.csv/)
    })

    it('should trigger click on anchor element', () => {
      exportToCSV(mockKeywords, 'test')
      
      expect(clickSpy).toHaveBeenCalledTimes(1)
    })

    it('should clean up blob URL after download', () => {
      exportToCSV(mockKeywords, 'test')
      
      expect(revokeObjectURLSpy).toHaveBeenCalled()
    })

    it('should handle empty keywords array', () => {
      exportToCSV([], 'empty-export')
      
      // Should not throw error
      expect(createElementSpy).not.toHaveBeenCalled()
    })

    it('should use default filename when not provided', () => {
      exportToCSV(mockKeywords)
      
      const anchor = createElementSpy.mock.results[0].value
      expect(anchor.download).toContain('keywords')
    })
  })
})
