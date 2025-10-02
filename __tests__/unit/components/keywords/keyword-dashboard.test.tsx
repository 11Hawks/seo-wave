/**
 * Keyword Dashboard - Basic Test Suite
 * TDD Phase 1 - Fresh start
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import KeywordDashboard from '@/components/keywords/keyword-dashboard'

const mockKeywords = [
  {
    id: 'kw1',
    keyword: 'seo analytics platform',
    projectId: 'proj1',
    searchVolume: 5400,
    difficulty: 'MEDIUM' as const,
    currentPosition: 8,
    confidenceScore: 94,
    positionTrend: 'up' as const,
  },
  {
    id: 'kw2',
    keyword: 'keyword tracking tool',
    projectId: 'proj1',
    searchVolume: 2100,
    difficulty: 'EASY' as const,
    currentPosition: 3,
    confidenceScore: 96,
    positionTrend: 'stable' as const,
  },
  {
    id: 'kw3',
    keyword: 'rank tracking software',
    projectId: 'proj1',
    searchVolume: 8900,
    difficulty: 'HARD' as const,
    currentPosition: 15,
    confidenceScore: 88,
    positionTrend: 'down' as const,
  },
]

describe('KeywordDashboard Component', () => {
  describe('Basic Rendering', () => {
    it('should render dashboard with keywords', () => {
      render(<KeywordDashboard projectId="proj1" keywords={mockKeywords} />)
      
      expect(screen.getByTestId('keyword-dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('keyword-toolbar')).toBeInTheDocument()
      expect(screen.getByTestId('keyword-list')).toBeInTheDocument()
    })

    it('should display all keywords in the list', () => {
      render(<KeywordDashboard projectId="proj1" keywords={mockKeywords} />)
      
      expect(screen.getByTestId('keyword-row-kw1')).toBeInTheDocument()
      expect(screen.getByTestId('keyword-row-kw2')).toBeInTheDocument()
      expect(screen.getByTestId('keyword-row-kw3')).toBeInTheDocument()
    })

    it('should display keyword metrics', () => {
      render(<KeywordDashboard projectId="proj1" keywords={mockKeywords} />)
      
      expect(screen.getByText('seo analytics platform')).toBeInTheDocument()
      expect(screen.getByText('Volume: 5400')).toBeInTheDocument()
      expect(screen.getByText('Position: 8')).toBeInTheDocument()
      expect(screen.getByText('Confidence: 94%')).toBeInTheDocument()
    })

    it('should show loading state when isLoading is true', () => {
      render(<KeywordDashboard projectId="proj1" keywords={[]} isLoading={true} />)
      
      expect(screen.getByTestId('keyword-loading-skeleton')).toBeInTheDocument()
      expect(screen.getAllByTestId('skeleton-loader')).toHaveLength(5)
    })

    it('should show error state when error is present', () => {
      render(<KeywordDashboard projectId="proj1" keywords={[]} error="Failed to load" />)
      
      expect(screen.getByTestId('keyword-error-state')).toBeInTheDocument()
      expect(screen.getByText('Failed to load')).toBeInTheDocument()
      expect(screen.getByTestId('error-retry-button')).toBeInTheDocument()
    })

    it('should show empty state when no keywords', () => {
      render(<KeywordDashboard projectId="proj1" keywords={[]} />)
      
      expect(screen.getByTestId('keyword-empty-state')).toBeInTheDocument()
      expect(screen.getByText('No keywords found')).toBeInTheDocument()
      expect(screen.getByTestId('add-keyword-button')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should filter keywords by search term', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={mockKeywords} />)
      
      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'tracking')
      
      // Should show keywords with "tracking" in name
      expect(screen.getByTestId('keyword-row-kw2')).toBeInTheDocument()
      expect(screen.getByTestId('keyword-row-kw3')).toBeInTheDocument()
      
      // Should not show keyword without "tracking"
      expect(screen.queryByTestId('keyword-row-kw1')).not.toBeInTheDocument()
    })

    it('should update results count after filtering', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={mockKeywords} />)
      
      // Initially shows all
      expect(screen.getByText('Showing 3 of 3 keywords')).toBeInTheDocument()
      
      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'tracking')
      
      // After filtering shows subset
      expect(screen.getByText('Showing 2 of 3 keywords')).toBeInTheDocument()
    })

    it('should show all keywords when search is cleared', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={mockKeywords} />)
      
      const searchInput = screen.getByTestId('search-input')
      
      // Type search term
      await user.type(searchInput, 'tracking')
      expect(screen.queryByTestId('keyword-row-kw1')).not.toBeInTheDocument()
      
      // Clear search
      await user.clear(searchInput)
      expect(screen.getByTestId('keyword-row-kw1')).toBeInTheDocument()
      expect(screen.getByTestId('keyword-row-kw2')).toBeInTheDocument()
      expect(screen.getByTestId('keyword-row-kw3')).toBeInTheDocument()
    })
  })

  describe('Position Trends', () => {
    it('should display position trend indicators', () => {
      render(<KeywordDashboard projectId="proj1" keywords={mockKeywords} />)
      
      const upTrend = screen.getByTestId('trend-kw1')
      expect(upTrend).toHaveTextContent('↑')
      expect(upTrend).toHaveClass('trend-up')
      
      const downTrend = screen.getByTestId('trend-kw3')
      expect(downTrend).toHaveTextContent('↓')
      expect(downTrend).toHaveClass('trend-down')
    })
  })
})
