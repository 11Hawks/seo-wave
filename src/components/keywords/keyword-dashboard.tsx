/**
 * Keyword Dashboard Component
 * Main dashboard for keyword tracking with list view, filters, and bulk actions
 * Created fresh - TDD approach
 */

'use client'

import React, { useState, useMemo } from 'react'
import { exportToCSV } from '@/utils/csv-export'

export interface HistoricalDataPoint {
  date: string
  position?: number
  clicks?: number
  impressions?: number
  ctr?: number
}

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
  history?: HistoricalDataPoint[]
}

interface KeywordDashboardProps {
  projectId: string
  keywords?: KeywordData[]
  isLoading?: boolean
  error?: string
  onBulkDelete?: (ids: string[]) => void
}

const KeywordDashboard: React.FC<KeywordDashboardProps> = ({
  projectId,
  keywords = [],
  isLoading = false,
  error,
  onBulkDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<'position' | 'volume' | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Handle sort
  const handleSort = (field: 'position' | 'volume') => {
    if (sortField === field) {
      // Toggle order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortOrder('asc')
    }
    // Reset to first page when sorting changes
    setCurrentPage(1)
  }

  // Filter keywords by search term
  const filteredKeywords = useMemo(() => {
    if (!searchTerm) return keywords
    return keywords.filter(kw => 
      kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [keywords, searchTerm])

  // Sort filtered keywords
  const sortedKeywords = useMemo(() => {
    if (!sortField) return filteredKeywords

    return [...filteredKeywords].sort((a, b) => {
      let aValue: number
      let bValue: number

      if (sortField === 'position') {
        aValue = a.currentPosition || 999
        bValue = b.currentPosition || 999
      } else {
        aValue = a.searchVolume || 0
        bValue = b.searchVolume || 0
      }

      if (sortOrder === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })
  }, [filteredKeywords, sortField, sortOrder])

  // Paginate sorted keywords
  const totalPages = Math.ceil(sortedKeywords.length / pageSize)
  const paginatedKeywords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return sortedKeywords.slice(startIndex, endIndex)
  }, [sortedKeywords, currentPage, pageSize])

  // Reset to page 1 when search changes
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedKeywords.length && selectedIds.length > 0) {
      // Deselect all
      setSelectedIds([])
    } else {
      // Select all on current page
      setSelectedIds(paginatedKeywords.map(k => k.id))
    }
  }

  const handleSelectKeyword = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleBulkDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmBulkDelete = () => {
    if (onBulkDelete && selectedIds.length > 0) {
      onBulkDelete(selectedIds)
      setSelectedIds([])
      setShowDeleteDialog(false)
    }
  }

  const cancelBulkDelete = () => {
    setShowDeleteDialog(false)
  }

  const handleExport = () => {
    // Export the currently visible (filtered/sorted) keywords
    exportToCSV(sortedKeywords, `keywords_${projectId}`)
  }

  const isAllSelected = paginatedKeywords.length > 0 && 
                        selectedIds.length === paginatedKeywords.length

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
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded"
        />
        <button
          data-testid="export-button"
          onClick={handleExport}
          disabled={sortedKeywords.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span>↓</span>
          Export CSV
        </button>
        <button 
          data-testid="add-keyword-button"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Keyword
        </button>
      </div>

      {/* Bulk actions toolbar */}
      {selectedIds.length > 0 && (
        <div data-testid="bulk-actions-toolbar" className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded">
          <span data-testid="selected-count" className="text-sm font-medium">
            {selectedIds.length} selected
          </span>
          <button
            data-testid="bulk-delete-button"
            onClick={handleBulkDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* Sort controls */}
      <div className="flex items-center gap-4">
        <input
          type="checkbox"
          data-testid="select-all-checkbox"
          checked={isAllSelected}
          onChange={handleSelectAll}
          className="w-4 h-4 cursor-pointer"
        />
        <span className="text-sm text-gray-600">Select all</span>
        <span className="text-sm text-gray-600">Sort by:</span>
        <button
          data-testid="sort-position"
          onClick={() => handleSort('position')}
          className="px-3 py-1 border rounded hover:bg-gray-50 text-sm"
        >
          Position
          {sortField === 'position' && (
            <span data-testid="sort-indicator-position" className="ml-1">
              {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </button>
        <button
          data-testid="sort-volume"
          onClick={() => handleSort('volume')}
          className="px-3 py-1 border rounded hover:bg-gray-50 text-sm"
        >
          Volume
          {sortField === 'volume' && (
            <span data-testid="sort-indicator-volume" className="ml-1">
              {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </button>
      </div>

      {/* Keyword List */}
      <div data-testid="keyword-list" className="space-y-2">
        {paginatedKeywords.map((keyword) => (
          <div
            key={keyword.id}
            data-testid={`keyword-row-${keyword.id}`}
            className="p-4 border rounded hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  data-testid={`checkbox-${keyword.id}`}
                  checked={selectedIds.includes(keyword.id)}
                  onChange={() => handleSelectKeyword(keyword.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 cursor-pointer"
                />
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
          </div>
        ))}
      </div>

      {/* Results count */}
      {sortedKeywords.length > 0 && (
        <div data-testid="results-count" className="text-sm text-gray-600">
          Showing {sortedKeywords.length} of {keywords.length} keywords
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div data-testid="pagination-controls" className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Page size:</span>
            <select
              data-testid="page-size-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <span data-testid="page-info" className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                data-testid="prev-page-button"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              <button
                data-testid="next-page-button"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div data-testid="delete-confirmation" className="bg-white p-6 rounded-lg shadow-xl max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedIds.length} keyword{selectedIds.length > 1 ? 's' : ''}?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                data-testid="cancel-delete-button"
                onClick={cancelBulkDelete}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                data-testid="confirm-delete-button"
                onClick={confirmBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KeywordDashboard
