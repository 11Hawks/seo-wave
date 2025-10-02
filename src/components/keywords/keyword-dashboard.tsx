/**
 * Keyword Dashboard Component
 * Main dashboard for keyword tracking with list view, filters, and bulk actions
 * Created fresh - TDD approach
 */

'use client'

import React, { useState, useMemo } from 'react'

export interface KeywordData {
  id: string
  keyword: string
  projectId: string
  searchVolume?: number
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
  cpc?: number
  competition?: number
  currentPosition?: number
  gscPosition?: number
  gscClicks?: number
  gscImpressions?: number
  gscCtr?: number
  confidenceScore?: number
  tags?: string[]
  priority?: 'low' | 'medium' | 'high'
  category?: string
  positionTrend?: 'up' | 'down' | 'stable'
}

interface KeywordDashboardProps {
  projectId: string
  keywords?: KeywordData[]
  isLoading?: boolean
  error?: string
}

const KeywordDashboard: React.FC<KeywordDashboardProps> = ({
  projectId,
  keywords = [],
  isLoading = false,
  error,
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  // Filter keywords by search term
  const filteredKeywords = useMemo(() => {
    if (!searchTerm) return keywords
    return keywords.filter(kw => 
      kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [keywords, searchTerm])

  // Loading state
  if (isLoading) {
    return (
      <div data-testid="keyword-loading-skeleton" className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} data-testid="skeleton-loader" className="h-16 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div data-testid="keyword-error-state" className="p-8 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          data-testid="error-retry-button"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  // Empty state
  if (keywords.length === 0) {
    return (
      <div data-testid="keyword-empty-state" className="p-8 text-center">
        <p className="text-gray-600 mb-4">No keywords found</p>
        <button 
          data-testid="add-keyword-button"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Keyword
        </button>
      </div>
    )
  }

  return (
    <div data-testid="keyword-dashboard" className="space-y-6">
      {/* Toolbar */}
      <div data-testid="keyword-toolbar" className="flex items-center gap-4">
        <input
          type="text"
          data-testid="search-input"
          placeholder="Search keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded"
        />
        <button 
          data-testid="add-keyword-button"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Keyword
        </button>
      </div>

      {/* Keyword List */}
      <div data-testid="keyword-list" className="space-y-2">
        {filteredKeywords.map((keyword) => (
          <div
            key={keyword.id}
            data-testid={`keyword-row-${keyword.id}`}
            className="p-4 border rounded hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold">{keyword.keyword}</h3>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  {keyword.searchVolume && (
                    <span data-testid={`search-volume-${keyword.id}`}>
                      Volume: {keyword.searchVolume}
                    </span>
                  )}
                  {keyword.currentPosition && (
                    <span data-testid={`position-${keyword.id}`}>
                      Position: {keyword.currentPosition}
                    </span>
                  )}
                  {keyword.confidenceScore && (
                    <span data-testid={`confidence-${keyword.id}`}>
                      Confidence: {keyword.confidenceScore}%
                    </span>
                  )}
                </div>
              </div>
              {keyword.positionTrend && (
                <span 
                  data-testid={`trend-${keyword.id}`}
                  className={`trend-${keyword.positionTrend}`}
                >
                  {keyword.positionTrend === 'up' ? '↑' : keyword.positionTrend === 'down' ? '↓' : '→'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Results count */}
      {filteredKeywords.length > 0 && (
        <div data-testid="results-count" className="text-sm text-gray-600">
          Showing {filteredKeywords.length} of {keywords.length} keywords
        </div>
      )}
    </div>
  )
}

export default KeywordDashboard
