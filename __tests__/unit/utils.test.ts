/**
 * Utils Library Tests
 * Comprehensive tests for utility functions (TDD approach)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
  formatRelativeTime,
  slugify,
  truncate,
  isValidEmail,
  generateId,
  deepClone,
  debounce,
  throttle,
  sleep,
  isBrowser,
  getInitials,
  formatBytes,
  getColorByValue,
  safeJsonParse
} from '../../src/lib/utils'

describe('Utils Library Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('cn (className utility)', () => {
    it('should combine class names correctly', () => {
      const result = cn('base-class', 'additional-class')
      expect(result).toContain('base-class')
      expect(result).toContain('additional-class')
    })

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'hidden')
      expect(result).toContain('base')
      expect(result).toContain('conditional')
      expect(result).not.toContain('hidden')
    })

    it('should resolve Tailwind conflicts', () => {
      const result = cn('p-4', 'p-8')
      expect(result).toBe('p-8') // Should keep the last one
    })

    it('should handle empty or undefined inputs', () => {
      const result = cn(undefined, null, '', 'valid-class')
      expect(result).toBe('valid-class')
    })
  })

  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      const result = formatCurrency(2599) // 25.99 in cents
      expect(result).toBe('$25.99')
    })

    it('should format different currencies', () => {
      const result = formatCurrency(1000, 'EUR', 'en-US')
      expect(result).toBe('€10.00')
    })

    it('should handle zero amounts', () => {
      const result = formatCurrency(0)
      expect(result).toBe('$0.00')
    })

    it('should handle large amounts', () => {
      const result = formatCurrency(1000000) // $10,000
      expect(result).toBe('$10,000.00')
    })

    it('should handle negative amounts', () => {
      const result = formatCurrency(-500)
      expect(result).toBe('-$5.00')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers under 1000 as-is', () => {
      expect(formatNumber(999)).toBe('999')
      expect(formatNumber(0)).toBe('0')
      expect(formatNumber(1)).toBe('1')
    })

    it('should format thousands with K suffix', () => {
      expect(formatNumber(1000)).toBe('1.0K')
      expect(formatNumber(1500)).toBe('1.5K')
      expect(formatNumber(999999)).toBe('1000.0K')
    })

    it('should format millions with M suffix', () => {
      expect(formatNumber(1000000)).toBe('1.0M')
      expect(formatNumber(2500000)).toBe('2.5M')
      expect(formatNumber(1000000000)).toBe('1000.0M')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentages with default 1 decimal', () => {
      expect(formatPercentage(85.678)).toBe('85.7%')
      expect(formatPercentage(100)).toBe('100.0%')
    })

    it('should format percentages with custom decimals', () => {
      expect(formatPercentage(85.678, 2)).toBe('85.68%')
      expect(formatPercentage(85.678, 0)).toBe('86%')
    })

    it('should handle zero and negative percentages', () => {
      expect(formatPercentage(0)).toBe('0.0%')
      expect(formatPercentage(-5.5)).toBe('-5.5%')
    })
  })

  describe('formatDate', () => {
    it('should format Date objects with default options', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const result = formatDate(date)
      expect(result).toMatch(/Jan 15, 2024/)
    })

    it('should format date strings', () => {
      const result = formatDate('2024-01-15')
      expect(result).toMatch(/Jan 15, 2024/)
    })

    it('should format timestamps', () => {
      const timestamp = new Date('2024-01-15').getTime()
      const result = formatDate(timestamp)
      expect(result).toMatch(/Jan 15, 2024/)
    })

    it('should handle custom formatting options', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const result = formatDate(date, { 
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      expect(result).toMatch(/January 15, 2024/)
    })
  })

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      // Mock current time to ensure consistent tests
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should format "just now" for very recent times', () => {
      const recent = new Date('2024-01-15T11:59:45Z')
      expect(formatRelativeTime(recent)).toBe('15 seconds ago') // 15 seconds difference
    })

    it('should format "just now" for sub-second differences', () => {
      const now = new Date()
      expect(formatRelativeTime(now)).toBe('just now')
    })

    it('should format minutes ago', () => {
      const minutes = new Date('2024-01-15T11:30:00Z')
      expect(formatRelativeTime(minutes)).toBe('30 minutes ago')
    })

    it('should format hours ago', () => {
      const hours = new Date('2024-01-15T10:00:00Z')
      expect(formatRelativeTime(hours)).toBe('2 hours ago')
    })

    it('should format days ago', () => {
      const days = new Date('2024-01-13T12:00:00Z')
      expect(formatRelativeTime(days)).toBe('2 days ago')
    })

    it('should format weeks ago', () => {
      const weeks = new Date('2024-01-01T12:00:00Z')
      expect(formatRelativeTime(weeks)).toBe('2 weeks ago')
    })
  })

  describe('slugify', () => {
    it('should convert text to URL-friendly slug', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('SEO Analytics Platform')).toBe('seo-analytics-platform')
    })

    it('should handle special characters', () => {
      expect(slugify('Hello, World!')).toBe('hello-world')
      expect(slugify('Test@#$%^&*()123')).toBe('test123')
    })

    it('should handle multiple spaces and dashes', () => {
      expect(slugify('  hello   world  ')).toBe('hello-world')
      expect(slugify('hello---world___test')).toBe('hello-world-test')
    })

    it('should handle edge cases', () => {
      expect(slugify('')).toBe('')
      expect(slugify('   ')).toBe('')
      expect(slugify('---')).toBe('')
    })
  })

  describe('truncate', () => {
    const longText = 'This is a very long text that should be truncated at some point'

    it('should truncate text longer than specified length', () => {
      const result = truncate(longText, 20)
      expect(result).toBe('This is a very long ...')
      expect(result.length).toBe(23) // 20 + '...'
    })

    it('should return original text if shorter than length', () => {
      const shortText = 'Short text'
      const result = truncate(shortText, 20)
      expect(result).toBe(shortText)
    })

    it('should handle exact length matches', () => {
      const exactText = 'Exactly twenty chars'
      const result = truncate(exactText, 20)
      expect(result).toBe(exactText)
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('test.email+tag@domain.co.uk')).toBe(true)
      expect(isValidEmail('user123@sub.domain.org')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('user@domain')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(isValidEmail('user with spaces@domain.com')).toBe(false)
      expect(isValidEmail('user@@domain.com')).toBe(false)
    })
  })

  describe('generateId', () => {
    it('should generate ID with default length of 8', () => {
      const id = generateId()
      expect(id).toHaveLength(8)
      expect(/^[A-Za-z0-9]+$/.test(id)).toBe(true)
    })

    it('should generate ID with custom length', () => {
      const id = generateId(12)
      expect(id).toHaveLength(12)
      expect(/^[A-Za-z0-9]+$/.test(id)).toBe(true)
    })

    it('should generate unique IDs', () => {
      const ids = Array.from({ length: 100 }, () => generateId())
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(100) // All IDs should be unique
    })

    it('should handle edge cases', () => {
      expect(generateId(0)).toBe('')
      expect(generateId(1)).toHaveLength(1)
    })
  })

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42)
      expect(deepClone('hello')).toBe('hello')
      expect(deepClone(true)).toBe(true)
      expect(deepClone(null)).toBe(null)
    })

    it('should clone arrays deeply', () => {
      const arr = [1, { a: 2 }, [3, 4]]
      const cloned = deepClone(arr)
      
      expect(cloned).toEqual(arr)
      expect(cloned).not.toBe(arr)
      expect(cloned[1]).not.toBe(arr[1])
      expect(cloned[2]).not.toBe(arr[2])
    })

    it('should clone objects deeply', () => {
      const obj = { a: 1, b: { c: 2 }, d: [1, 2, 3] }
      const cloned = deepClone(obj)
      
      expect(cloned).toEqual(obj)
      expect(cloned).not.toBe(obj)
      expect(cloned.b).not.toBe(obj.b)
      expect(cloned.d).not.toBe(obj.d)
    })

    it('should clone Date objects', () => {
      const date = new Date('2024-01-15')
      const cloned = deepClone(date)
      
      expect(cloned).toEqual(date)
      expect(cloned).not.toBe(date)
      expect(cloned.getTime()).toBe(date.getTime())
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const mockFn = vi.fn()
      const debounced = debounce(mockFn, 100)
      
      debounced('arg1')
      debounced('arg2')
      debounced('arg3')
      
      expect(mockFn).not.toHaveBeenCalled()
      
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenLastCalledWith('arg3')
    })

    it('should reset timer on new calls', async () => {
      const mockFn = vi.fn()
      const debounced = debounce(mockFn, 100)
      
      debounced('arg1')
      
      setTimeout(() => debounced('arg2'), 50)
      
      await new Promise(resolve => setTimeout(resolve, 120))
      expect(mockFn).not.toHaveBeenCalled()
      
      await new Promise(resolve => setTimeout(resolve, 80))
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenLastCalledWith('arg2')
    })
  })

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      const mockFn = vi.fn()
      const throttled = throttle(mockFn, 100)
      
      throttled('arg1')
      throttled('arg2')
      throttled('arg3')
      
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg1')
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      throttled('arg4')
      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenLastCalledWith('arg4')
    })
  })

  describe('sleep', () => {
    it('should wait for specified milliseconds', async () => {
      const start = Date.now()
      await sleep(100)
      const end = Date.now()
      
      expect(end - start).toBeGreaterThanOrEqual(90) // Allow some variance
    })
  })

  describe('isBrowser', () => {
    it('should return false in Node.js environment', () => {
      // In jsdom environment, window is defined, so we need to check differently
      // Let's temporarily delete window to test the Node.js behavior
      const originalWindow = globalThis.window
      delete (globalThis as any).window
      
      expect(isBrowser()).toBe(false)
      
      // Restore window
      ;(globalThis as any).window = originalWindow
    })

    it('should return true when window is defined', () => {
      // Mock window object
      Object.defineProperty(globalThis, 'window', {
        value: {},
        writable: true
      })
      
      expect(isBrowser()).toBe(true)
      
      // Cleanup
      delete (globalThis as any).window
    })
  })

  describe('getInitials', () => {
    it('should get initials from full names', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('Jane Mary Smith')).toBe('JM')
      expect(getInitials('Madonna')).toBe('M')
    })

    it('should handle edge cases', () => {
      expect(getInitials('')).toBe('')
      expect(getInitials('a')).toBe('A')
      expect(getInitials('a b c d e f')).toBe('AB') // Max 2 characters
    })

    it('should handle special characters', () => {
      expect(getInitials('Jean-Claude Van Damme')).toBe('JV') // J from Jean-Claude, V from Van
      expect(getInitials("O'Connor")).toBe('O')
    })
  })

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1048576)).toBe('1 MB')
      expect(formatBytes(1073741824)).toBe('1 GB')
    })

    it('should handle decimals correctly', () => {
      expect(formatBytes(1536)).toBe('1.5 KB')
      expect(formatBytes(1536, 0)).toBe('2 KB')
      expect(formatBytes(1536, 3)).toBe('1.5 KB') // parseFloat removes trailing zeros
    })

    it('should handle large numbers', () => {
      expect(formatBytes(1099511627776)).toBe('1 TB')
    })
  })

  describe('getColorByValue', () => {
    const thresholds = { good: 80, warning: 60 }

    it('should return success for good values', () => {
      expect(getColorByValue(90, thresholds)).toBe('success')
      expect(getColorByValue(80, thresholds)).toBe('success')
    })

    it('should return warning for moderate values', () => {
      expect(getColorByValue(70, thresholds)).toBe('warning')
      expect(getColorByValue(60, thresholds)).toBe('warning')
    })

    it('should return destructive for poor values', () => {
      expect(getColorByValue(50, thresholds)).toBe('destructive')
      expect(getColorByValue(0, thresholds)).toBe('destructive')
    })
  })

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const json = '{"name": "John", "age": 30}'
      const result = safeJsonParse(json, {})
      
      expect(result).toEqual({ name: 'John', age: 30 })
    })

    it('should return fallback for invalid JSON', () => {
      const invalidJson = '{"name": "John", age: 30}' // Missing quotes
      const fallback = { error: true }
      const result = safeJsonParse(invalidJson, fallback)
      
      expect(result).toBe(fallback)
    })

    it('should handle different fallback types', () => {
      expect(safeJsonParse('invalid', null)).toBe(null)
      expect(safeJsonParse('invalid', [])).toEqual([])
      expect(safeJsonParse('invalid', 'fallback')).toBe('fallback')
    })
  })
})