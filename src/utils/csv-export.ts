/**
 * CSV Export Utilities
 * Functions for exporting keyword data to CSV format
 */

import type { KeywordData } from '@/components/keywords/keyword-dashboard'

/**
 * Escape CSV field value
 * Handles commas and quotes properly
 */
function escapeCSVField(value: string | number | undefined): string {
  if (value === undefined || value === null) {
    return ''
  }
  
  const stringValue = String(value)
  
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  
  return stringValue
}

/**
 * Format number with 2 decimal places
 */
function formatNumber(value: number | undefined, decimals: number = 2): string {
  if (value === undefined || value === null) {
    return ''
  }
  return value.toFixed(decimals)
}

/**
 * Format percentage (0.075 -> 7.50)
 */
function formatPercentage(value: number | undefined): string {
  if (value === undefined || value === null) {
    return ''
  }
  return (value * 100).toFixed(2)
}

/**
 * Convert keyword data array to CSV string
 */
export function convertKeywordsToCSV(keywords: KeywordData[]): string {
  if (!keywords || keywords.length === 0) {
    return ''
  }

  // CSV Headers
  const headers = [
    'Keyword',
    'Category',
    'Priority',
    'Position',
    'Trend',
    'Search Volume',
    'Difficulty',
    'CPC',
    'Competition',
    'Clicks',
    'Impressions',
    'CTR'
  ]

  // Build CSV rows
  const rows = keywords.map(keyword => {
    return [
      escapeCSVField(keyword.keyword),
      escapeCSVField(keyword.category),
      escapeCSVField(keyword.priority),
      escapeCSVField(keyword.currentPosition),
      escapeCSVField(keyword.positionTrend),
      escapeCSVField(keyword.searchVolume),
      escapeCSVField(keyword.difficulty),
      formatNumber(keyword.cpc),
      formatPercentage(keyword.competition),
      escapeCSVField(keyword.gscClicks),
      escapeCSVField(keyword.gscImpressions),
      formatPercentage(keyword.gscCtr)
    ].join(',')
  })

  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n')
}

/**
 * Export keywords to CSV file download
 */
export function exportToCSV(keywords: KeywordData[], filename: string = 'keywords'): void {
  // Don't export if no data
  if (!keywords || keywords.length === 0) {
    return
  }

  // Convert to CSV
  const csvContent = convertKeywordsToCSV(keywords)
  
  // Create blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  
  // Create download link
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  // Add timestamp to filename
  const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const fullFilename = `${filename}_${timestamp}.csv`
  
  link.href = url
  link.download = fullFilename
  link.style.display = 'none'
  
  // Trigger download
  document.body.appendChild(link)
  link.click()
  
  // Cleanup
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
