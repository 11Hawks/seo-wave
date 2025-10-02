import React, { useEffect } from 'react'
import type { KeywordData } from './keyword-dashboard'
import { PositionHistoryChart } from './position-history-chart'
import { PerformanceTrendsChart } from './performance-trends-chart'

interface KeywordDetailModalProps {
  keyword: KeywordData
  isOpen: boolean
  onClose: () => void
}

export const KeywordDetailModal: React.FC<KeywordDetailModalProps> = ({
  keyword,
  isOpen,
  onClose
}) => {
  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Don't render if not open
  if (!isOpen) return null

  // Helper functions for formatting
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined) return 'N/A'
    return num.toLocaleString()
  }

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined) return 'N/A'
    return `$${amount.toFixed(2)}`
  }

  const formatPercentage = (value: number | undefined): string => {
    if (value === undefined) return 'N/A'
    const percentage = value * 100
    // Remove decimal if it's a whole number
    return `${percentage % 1 === 0 ? Math.round(percentage) : percentage.toFixed(1)}%`
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable' | undefined): string => {
    if (!trend) return '→'
    if (trend === 'up') return '↑'
    if (trend === 'down') return '↓'
    return '→'
  }

  const getPriorityColor = (priority: string | undefined): string => {
    if (priority === 'high') return 'bg-red-100 text-red-800'
    if (priority === 'medium') return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const handleBackdropClick = () => {
    onClose()
  }

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div 
      data-testid="modal-backdrop"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        data-testid="keyword-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-header"
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={handleContentClick}
      >
        <div data-testid="modal-content">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-start">
            <div>
              <h2 id="modal-header" data-testid="modal-header" className="text-2xl font-bold text-gray-900">
                {keyword.keyword}
              </h2>
              {keyword.category && (
                <p data-testid="keyword-category" className="text-sm text-gray-500 mt-1">
                  {keyword.category}
                </p>
              )}
            </div>
            <button
              data-testid="close-button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Basic Information */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
              <div className="flex gap-2 items-center">
                {keyword.priority && (
                  <span 
                    data-testid="priority-badge"
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(keyword.priority)}`}
                  >
                    {keyword.priority}
                  </span>
                )}
                {keyword.tags && keyword.tags.length > 0 && (
                  <div data-testid="tags-section" className="flex gap-2">
                    {keyword.tags.map(tag => (
                      <span
                        key={tag}
                        data-testid={`tag-${tag}`}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* SEO Metrics */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">SEO Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Search Volume</p>
                  <p data-testid="metric-searchVolume" className="text-xl font-semibold text-gray-900">
                    {formatNumber(keyword.searchVolume)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Difficulty</p>
                  <p data-testid="metric-difficulty" className="text-xl font-semibold text-gray-900">
                    {keyword.difficulty || 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">CPC</p>
                  <p data-testid="metric-cpc" className="text-xl font-semibold text-gray-900">
                    {formatCurrency(keyword.cpc)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Competition</p>
                  <p data-testid="metric-competition" className="text-xl font-semibold text-gray-900">
                    {formatPercentage(keyword.competition)}
                  </p>
                </div>
              </div>
            </section>

            {/* Current Performance */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Performance</h3>
              <div className="space-y-4">
                {/* Position */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Current Position</p>
                      <p data-testid="performance-position" className="text-3xl font-bold text-gray-900">
                        {keyword.currentPosition || 'N/A'}
                      </p>
                    </div>
                    {keyword.positionTrend && (
                      <span 
                        data-testid="trend-indicator"
                        className={`text-4xl ${
                          keyword.positionTrend === 'up' ? 'text-green-500' :
                          keyword.positionTrend === 'down' ? 'text-red-500' :
                          'text-gray-400'
                        }`}
                      >
                        {getTrendIcon(keyword.positionTrend)}
                      </span>
                    )}
                  </div>
                </div>

                {/* GSC Data */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Clicks</p>
                    <p data-testid="gsc-clicks" className="text-xl font-semibold text-gray-900">
                      {formatNumber(keyword.gscClicks)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Impressions</p>
                    <p data-testid="gsc-impressions" className="text-xl font-semibold text-gray-900">
                      {formatNumber(keyword.gscImpressions)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">CTR</p>
                    <p data-testid="gsc-ctr" className="text-xl font-semibold text-gray-900">
                      {formatPercentage(keyword.gscCtr)}
                    </p>
                  </div>
                </div>

                {/* Confidence Score */}
                {keyword.confidenceScore !== undefined && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Confidence Score</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${keyword.confidenceScore * 100}%` }}
                        />
                      </div>
                      <span data-testid="confidence-score" className="text-lg font-semibold text-gray-900">
                        {formatPercentage(keyword.confidenceScore)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Historical Charts */}
            {keyword.history && keyword.history.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Historical Data</h3>
                
                {/* Position History Chart */}
                <div className="mb-6">
                  <PositionHistoryChart
                    data={keyword.history.map(h => ({
                      date: h.date,
                      position: h.position,
                      impressions: h.impressions
                    }))}
                    height={300}
                  />
                </div>

                {/* Performance Trends Chart */}
                <div>
                  <PerformanceTrendsChart
                    data={keyword.history.map(h => ({
                      date: h.date,
                      clicks: h.clicks,
                      impressions: h.impressions,
                      ctr: h.ctr
                    }))}
                    height={300}
                  />
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
