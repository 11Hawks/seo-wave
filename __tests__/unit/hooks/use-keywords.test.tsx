/**
 * useKeywords Hook Tests
 * Tests for keyword data fetching and management hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useKeywords } from '@/hooks/use-keywords'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('useKeywords Hook', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('Data Fetching', () => {
    it('should fetch keywords for a project', async () => {
      const mockKeywords = [
        {
          id: 'kw1',
          keyword: 'test keyword',
          projectId: 'proj1',
          searchVolume: 1000,
          difficulty: 'MEDIUM',
          currentPosition: 5,
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ keywords: mockKeywords }),
      })

      const { result } = renderHook(() => useKeywords('proj1'))

      // Initially should be loading
      expect(result.current.isLoading).toBe(true)

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.keywords).toEqual(mockKeywords)
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useKeywords('proj1'))

      // Wait for error state
      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch keywords')
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.keywords).toEqual([])
    })

    it('should not fetch when projectId is null', () => {
      const { result } = renderHook(() => useKeywords(null))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.keywords).toEqual([])
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Create Keyword', () => {
    it('should create a new keyword', async () => {
      const mockKeyword = {
        id: 'kw-new',
        keyword: 'new keyword',
        projectId: 'proj1',
        searchVolume: 500,
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ keywords: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ keyword: mockKeyword }),
        })

      const { result } = renderHook(() => useKeywords('proj1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const newKeyword = await result.current.createKeyword({
        keyword: 'new keyword',
        searchVolume: 500,
      })

      expect(newKeyword).toEqual(mockKeyword)
    })

    it('should handle create errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ keywords: [] }),
        })
        .mockRejectedValueOnce(new Error('Create failed'))

      const { result } = renderHook(() => useKeywords('proj1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        result.current.createKeyword({ keyword: 'test' })
      ).rejects.toThrow('Failed to create keyword')
    })
  })

  describe('Update Keyword', () => {
    it('should update an existing keyword', async () => {
      const mockKeywords = [
        {
          id: 'kw1',
          keyword: 'test keyword',
          projectId: 'proj1',
          searchVolume: 1000,
        },
      ]

      const updatedKeyword = {
        ...mockKeywords[0],
        searchVolume: 2000,
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ keywords: mockKeywords }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ keyword: updatedKeyword }),
        })

      const { result } = renderHook(() => useKeywords('proj1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const updated = await result.current.updateKeyword('kw1', {
        searchVolume: 2000,
      })

      expect(updated).toEqual(updatedKeyword)
    })
  })

  describe('Delete Keyword', () => {
    it('should delete a keyword', async () => {
      const mockKeywords = [
        { id: 'kw1', keyword: 'test 1', projectId: 'proj1' },
        { id: 'kw2', keyword: 'test 2', projectId: 'proj1' },
      ]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ keywords: mockKeywords }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      const { result } = renderHook(() => useKeywords('proj1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.deleteKeyword('kw1')

      // Should have removed kw1 from local state
      expect(result.current.keywords).toHaveLength(1)
      expect(result.current.keywords[0].id).toBe('kw2')
    })
  })

  describe('Bulk Delete', () => {
    it('should delete multiple keywords', async () => {
      const mockKeywords = [
        { id: 'kw1', keyword: 'test 1', projectId: 'proj1' },
        { id: 'kw2', keyword: 'test 2', projectId: 'proj1' },
        { id: 'kw3', keyword: 'test 3', projectId: 'proj1' },
      ]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ keywords: mockKeywords }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, count: 2 }),
        })

      const { result } = renderHook(() => useKeywords('proj1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.bulkDelete(['kw1', 'kw2'])

      // Should have removed kw1 and kw2
      expect(result.current.keywords).toHaveLength(1)
      expect(result.current.keywords[0].id).toBe('kw3')
    })
  })

  describe('Refetch', () => {
    it('should refetch keywords on demand', async () => {
      const mockKeywords1 = [{ id: 'kw1', keyword: 'test 1', projectId: 'proj1' }]
      const mockKeywords2 = [
        { id: 'kw1', keyword: 'test 1', projectId: 'proj1' },
        { id: 'kw2', keyword: 'test 2', projectId: 'proj1' },
      ]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ keywords: mockKeywords1 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ keywords: mockKeywords2 }),
        })

      const { result } = renderHook(() => useKeywords('proj1'))

      await waitFor(() => {
        expect(result.current.keywords).toHaveLength(1)
      })

      await result.current.refetch()

      await waitFor(() => {
        expect(result.current.keywords).toHaveLength(2)
      })
    })
  })
})
