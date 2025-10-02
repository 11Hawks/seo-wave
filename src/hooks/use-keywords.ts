/**
 * useKeywords Hook
 * React hook for managing keyword data with CRUD operations
 */

import { useState, useEffect, useCallback } from 'react'

export interface KeywordInput {
  keyword: string
  searchVolume?: number
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
  priority?: 'low' | 'medium' | 'high'
  currentPosition?: number
  [key: string]: any
}

export interface Keyword extends KeywordInput {
  id: string
  projectId: string
}

export interface UseKeywordsResult {
  keywords: Keyword[]
  isLoading: boolean
  error: string | null
  createKeyword: (data: KeywordInput) => Promise<Keyword>
  updateKeyword: (id: string, data: Partial<KeywordInput>) => Promise<Keyword>
  deleteKeyword: (id: string) => Promise<void>
  bulkDelete: (ids: string[]) => Promise<void>
  refetch: () => Promise<void>
}

/**
 * Hook for managing keywords for a specific project
 * @param projectId - The project ID to fetch keywords for (null to skip fetching)
 * @param apiEndpoint - Optional custom API endpoint (defaults to /api/keywords)
 */
export function useKeywords(
  projectId: string | null,
  apiEndpoint: string = '/api/keywords'
): UseKeywordsResult {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch keywords
  const fetchKeywords = useCallback(async () => {
    if (!projectId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${apiEndpoint}?projectId=${projectId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setKeywords(data.keywords || [])
    } catch (err) {
      console.error('Failed to fetch keywords:', err)
      setError('Failed to fetch keywords')
      setKeywords([])
    } finally {
      setIsLoading(false)
    }
  }, [projectId, apiEndpoint])

  // Initial fetch
  useEffect(() => {
    if (projectId) {
      fetchKeywords()
    }
  }, [projectId, fetchKeywords])

  // Create keyword
  const createKeyword = useCallback(
    async (data: KeywordInput): Promise<Keyword> => {
      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            projectId,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        const newKeyword = result.keyword

        // Optimistically update local state
        setKeywords(prev => [...prev, newKeyword])

        return newKeyword
      } catch (err) {
        console.error('Failed to create keyword:', err)
        throw new Error('Failed to create keyword')
      }
    },
    [projectId, apiEndpoint]
  )

  // Update keyword
  const updateKeyword = useCallback(
    async (id: string, data: Partial<KeywordInput>): Promise<Keyword> => {
      try {
        const response = await fetch(`${apiEndpoint}/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        const updatedKeyword = result.keyword

        // Optimistically update local state
        setKeywords(prev =>
          prev.map(kw => (kw.id === id ? updatedKeyword : kw))
        )

        return updatedKeyword
      } catch (err) {
        console.error('Failed to update keyword:', err)
        throw new Error('Failed to update keyword')
      }
    },
    [apiEndpoint]
  )

  // Delete keyword
  const deleteKeyword = useCallback(
    async (id: string): Promise<void> => {
      try {
        const response = await fetch(`${apiEndpoint}/${id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // Optimistically update local state
        setKeywords(prev => prev.filter(kw => kw.id !== id))
      } catch (err) {
        console.error('Failed to delete keyword:', err)
        throw new Error('Failed to delete keyword')
      }
    },
    [apiEndpoint]
  )

  // Bulk delete keywords
  const bulkDelete = useCallback(
    async (ids: string[]): Promise<void> => {
      try {
        const response = await fetch(`${apiEndpoint}/bulk-delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // Optimistically update local state
        setKeywords(prev => prev.filter(kw => !ids.includes(kw.id)))
      } catch (err) {
        console.error('Failed to bulk delete keywords:', err)
        throw new Error('Failed to bulk delete keywords')
      }
    },
    [apiEndpoint]
  )

  // Refetch keywords
  const refetch = useCallback(async () => {
    await fetchKeywords()
  }, [fetchKeywords])

  return {
    keywords,
    isLoading,
    error,
    createKeyword,
    updateKeyword,
    deleteKeyword,
    bulkDelete,
    refetch,
  }
}
