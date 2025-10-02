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

  describe('Sorting Functionality', () => {
    it('should sort keywords by position ascending', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={mockKeywords} />)
      
      const sortButton = screen.getByTestId('sort-position')
      await user.click(sortButton)
      
      // After sorting by position (ascending), kw2 should be first
      const rows = screen.getAllByTestId(/^keyword-row-/)
      expect(rows[0]).toHaveAttribute('data-testid', 'keyword-row-kw2') // position 3
    })

    it('should toggle sort order on second click', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={mockKeywords} />)
      
      const sortButton = screen.getByTestId('sort-position')
      
      // First click - ascending
      await user.click(sortButton)
      let rows = screen.getAllByTestId(/^keyword-row-/)
      expect(rows[0]).toHaveAttribute('data-testid', 'keyword-row-kw2') // position 3
      
      // Second click - descending
      await user.click(sortButton)
      rows = screen.getAllByTestId(/^keyword-row-/)
      expect(rows[0]).toHaveAttribute('data-testid', 'keyword-row-kw3') // position 15
    })

    it('should sort keywords by search volume', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={mockKeywords} />)
      
      const sortButton = screen.getByTestId('sort-volume')
      await user.click(sortButton)
      
      // After sorting by volume (ascending), kw2 should be first
      const rows = screen.getAllByTestId(/^keyword-row-/)
      expect(rows[0]).toHaveAttribute('data-testid', 'keyword-row-kw2') // volume 2100
    })

    it('should display sort indicators', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={mockKeywords} />)
      
      const sortButton = screen.getByTestId('sort-position')
      await user.click(sortButton)
      
      expect(screen.getByTestId('sort-indicator-position')).toHaveTextContent('↑')
    })
  })

  describe('Pagination', () => {
    const manyKeywords = Array.from({ length: 25 }, (_, i) => ({
      id: `kw${i + 1}`,
      keyword: `keyword ${i + 1}`,
      projectId: 'proj1',
      searchVolume: 1000 + i * 100,
      currentPosition: i + 1,
    }))

    it('should display pagination controls when keywords exceed page size', () => {
      render(<KeywordDashboard projectId="proj1" keywords={manyKeywords} />)
      
      expect(screen.getByTestId('pagination-controls')).toBeInTheDocument()
      expect(screen.getByTestId('page-info')).toHaveTextContent('Page 1 of 3')
    })

    it('should show only first page of keywords initially', () => {
      render(<KeywordDashboard projectId="proj1" keywords={manyKeywords} />)
      
      // Should show first 10 keywords
      expect(screen.getByTestId('keyword-row-kw1')).toBeInTheDocument()
      expect(screen.getByTestId('keyword-row-kw10')).toBeInTheDocument()
      
      // Should not show 11th keyword
      expect(screen.queryByTestId('keyword-row-kw11')).not.toBeInTheDocument()
    })

    it('should navigate to next page', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={manyKeywords} />)
      
      const nextButton = screen.getByTestId('next-page-button')
      await user.click(nextButton)
      
      // Should show second page keywords
      expect(screen.getByTestId('keyword-row-kw11')).toBeInTheDocument()
      expect(screen.getByTestId('keyword-row-kw20')).toBeInTheDocument()
      
      // Should not show first page keywords
      expect(screen.queryByTestId('keyword-row-kw1')).not.toBeInTheDocument()
      
      // Page info should update
      expect(screen.getByTestId('page-info')).toHaveTextContent('Page 2 of 3')
    })

    it('should navigate to previous page', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={manyKeywords} />)
      
      const nextButton = screen.getByTestId('next-page-button')
      const prevButton = screen.getByTestId('prev-page-button')
      
      // Go to page 2
      await user.click(nextButton)
      expect(screen.getByTestId('page-info')).toHaveTextContent('Page 2 of 3')
      
      // Go back to page 1
      await user.click(prevButton)
      expect(screen.getByTestId('page-info')).toHaveTextContent('Page 1 of 3')
      expect(screen.getByTestId('keyword-row-kw1')).toBeInTheDocument()
    })

    it('should disable previous button on first page', () => {
      render(<KeywordDashboard projectId="proj1" keywords={manyKeywords} />)
      
      const prevButton = screen.getByTestId('prev-page-button')
      expect(prevButton).toBeDisabled()
    })

    it('should disable next button on last page', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={manyKeywords} />)
      
      const nextButton = screen.getByTestId('next-page-button')
      
      // Navigate to last page (page 3)
      await user.click(nextButton) // page 2
      await user.click(nextButton) // page 3
      
      expect(nextButton).toBeDisabled()
    })

    it('should change page size', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={manyKeywords} />)
      
      const pageSizeSelect = screen.getByTestId('page-size-select')
      await user.selectOptions(pageSizeSelect, '20')
      
      // Should show 20 keywords now
      expect(screen.getByTestId('keyword-row-kw1')).toBeInTheDocument()
      expect(screen.getByTestId('keyword-row-kw20')).toBeInTheDocument()
      
      // Page info should update
      expect(screen.getByTestId('page-info')).toHaveTextContent('Page 1 of 2')
    })
  })

  describe('Bulk Actions', () => {
    it('should display checkbox for each keyword row', () => {
      render(<KeywordDashboard projectId="proj1" keywords={mockKeywords} />)
      
      expect(screen.getByTestId('checkbox-kw1')).toBeInTheDocument()
      expect(screen.getByTestId('checkbox-kw2')).toBeInTheDocument()
      expect(screen.getByTestId('checkbox-kw3')).toBeInTheDocument()
    })

    it('should select individual keyword on checkbox click', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={mockKeywords} />)
      
      const checkbox = screen.getByTestId('checkbox-kw1')
      await user.click(checkbox)
      
      expect(checkbox).toBeChecked()
      expect(screen.getByTestId('selected-count')).toHaveTextContent('1 selected')
    })

    it('should select all keywords with select-all checkbox', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={mockKeywords} />)
      
      const selectAllCheckbox = screen.getByTestId('select-all-checkbox')
      await user.click(selectAllCheckbox)
      
      expect(screen.getByTestId('checkbox-kw1')).toBeChecked()
      expect(screen.getByTestId('checkbox-kw2')).toBeChecked()
      expect(screen.getByTestId('checkbox-kw3')).toBeChecked()
      expect(screen.getByTestId('selected-count')).toHaveTextContent('3 selected')
    })

    it('should deselect all when select-all is clicked again', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={mockKeywords} />)
      
      const selectAllCheckbox = screen.getByTestId('select-all-checkbox')
      
      // Select all
      await user.click(selectAllCheckbox)
      expect(screen.getByTestId('checkbox-kw1')).toBeChecked()
      
      // Deselect all
      await user.click(selectAllCheckbox)
      expect(screen.getByTestId('checkbox-kw1')).not.toBeChecked()
      expect(screen.queryByTestId('selected-count')).not.toBeInTheDocument()
    })

    it('should show bulk action toolbar when keywords are selected', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={mockKeywords} />)
      
      // Initially hidden
      expect(screen.queryByTestId('bulk-actions-toolbar')).not.toBeInTheDocument()
      
      // Select a keyword
      const checkbox = screen.getByTestId('checkbox-kw1')
      await user.click(checkbox)
      
      // Toolbar should appear
      expect(screen.getByTestId('bulk-actions-toolbar')).toBeInTheDocument()
      expect(screen.getByTestId('bulk-delete-button')).toBeInTheDocument()
    })

    it('should call onDelete with selected IDs when bulk delete is clicked', async () => {
      const user = userEvent.setup()
      const mockOnDelete = vi.fn()
      render(
        <KeywordDashboard 
          projectId="proj1" 
          keywords={mockKeywords}
          onBulkDelete={mockOnDelete}
        />
      )
      
      // Select two keywords
      await user.click(screen.getByTestId('checkbox-kw1'))
      await user.click(screen.getByTestId('checkbox-kw3'))
      
      // Click bulk delete
      const deleteButton = screen.getByTestId('bulk-delete-button')
      await user.click(deleteButton)
      
      // Should show confirmation dialog
      expect(screen.getByTestId('delete-confirmation')).toBeInTheDocument()
      expect(screen.getByText(/delete 2 keywords/i)).toBeInTheDocument()
      
      // Confirm deletion
      const confirmButton = screen.getByTestId('confirm-delete-button')
      await user.click(confirmButton)
      
      expect(mockOnDelete).toHaveBeenCalledWith(['kw1', 'kw3'])
    })

    it('should clear selection after successful bulk delete', async () => {
      const user = userEvent.setup()
      const mockOnDelete = vi.fn()
      render(
        <KeywordDashboard 
          projectId="proj1" 
          keywords={mockKeywords}
          onBulkDelete={mockOnDelete}
        />
      )
      
      // Select and delete
      await user.click(screen.getByTestId('checkbox-kw1'))
      await user.click(screen.getByTestId('bulk-delete-button'))
      await user.click(screen.getByTestId('confirm-delete-button'))
      
      // Selection should be cleared
      expect(screen.queryByTestId('selected-count')).not.toBeInTheDocument()
      expect(screen.queryByTestId('bulk-actions-toolbar')).not.toBeInTheDocument()
    })

    it('should cancel bulk delete on cancel button', async () => {
      const user = userEvent.setup()
      const mockOnDelete = vi.fn()
      render(
        <KeywordDashboard 
          projectId="proj1" 
          keywords={mockKeywords}
          onBulkDelete={mockOnDelete}
        />
      )
      
      // Select and start delete
      await user.click(screen.getByTestId('checkbox-kw1'))
      await user.click(screen.getByTestId('bulk-delete-button'))
      
      // Cancel
      const cancelButton = screen.getByTestId('cancel-delete-button')
      await user.click(cancelButton)
      
      // Dialog should close, delete not called
      expect(screen.queryByTestId('delete-confirmation')).not.toBeInTheDocument()
      expect(mockOnDelete).not.toHaveBeenCalled()
      
      // Selection should remain
      expect(screen.getByTestId('checkbox-kw1')).toBeChecked()
    })
  })

  describe('Export Functionality', () => {
    it('should render export button', () => {
      render(
        <KeywordDashboard 
          projectId="proj1" 
          keywords={mockKeywords}
        />
      )

      expect(screen.getByTestId('export-button')).toBeInTheDocument()
    })

    it('should not show export button when no keywords (empty state)', () => {
      render(
        <KeywordDashboard 
          projectId="proj1" 
          keywords={[]}
        />
      )

      // Empty state is shown, no toolbar
      expect(screen.queryByTestId('export-button')).not.toBeInTheDocument()
      expect(screen.getByTestId('keyword-empty-state')).toBeInTheDocument()
    })

    it('should enable export button when keywords exist', () => {
      render(
        <KeywordDashboard 
          projectId="proj1" 
          keywords={mockKeywords}
        />
      )

      const exportButton = screen.getByTestId('export-button')
      expect(exportButton).not.toBeDisabled()
    })

    it('should show export button with text and icon', () => {
      render(
        <KeywordDashboard 
          projectId="proj1" 
          keywords={mockKeywords}
        />
      )

      const exportButton = screen.getByTestId('export-button')
      expect(exportButton).toHaveTextContent(/export csv/i)
      expect(exportButton).toHaveTextContent('↓')
    })

    it('should disable export button when filtered results are empty', async () => {
      const user = userEvent.setup()
      render(
        <KeywordDashboard 
          projectId="proj1" 
          keywords={mockKeywords}
        />
      )

      // Search for non-existent keyword
      const searchInput = screen.getByPlaceholderText(/search keywords/i)
      await user.type(searchInput, 'nonexistent')

      // Export button should be disabled
      const exportButton = screen.getByTestId('export-button')
      expect(exportButton).toBeDisabled()
    })
  })

  describe('Advanced Filtering', () => {
    const keywordsWithAllFields = [
      {
        id: 'kw1',
        keyword: 'seo analytics platform',
        projectId: 'proj1',
        searchVolume: 5400,
        difficulty: 'MEDIUM' as const,
        priority: 'high' as const,
        currentPosition: 8,
        confidenceScore: 94,
      },
      {
        id: 'kw2',
        keyword: 'keyword tracking tool',
        projectId: 'proj1',
        searchVolume: 2100,
        difficulty: 'EASY' as const,
        priority: 'medium' as const,
        currentPosition: 3,
        confidenceScore: 96,
      },
      {
        id: 'kw3',
        keyword: 'rank tracking software',
        projectId: 'proj1',
        searchVolume: 8900,
        difficulty: 'HARD' as const,
        priority: 'low' as const,
        currentPosition: 15,
        confidenceScore: 88,
      },
    ]

    it('should render FilterPanel component', () => {
      render(<KeywordDashboard projectId="proj1" keywords={keywordsWithAllFields} />)
      
      expect(screen.getByTestId('filter-panel')).toBeInTheDocument()
    })

    it('should filter keywords by difficulty', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={keywordsWithAllFields} />)
      
      // Check difficulty EASY filter
      const easyCheckbox = screen.getByTestId('difficulty-easy')
      await user.click(easyCheckbox)
      
      // Should only show EASY difficulty keyword
      expect(screen.getByTestId('keyword-row-kw2')).toBeInTheDocument()
      expect(screen.queryByTestId('keyword-row-kw1')).not.toBeInTheDocument()
      expect(screen.queryByTestId('keyword-row-kw3')).not.toBeInTheDocument()
    })

    it('should filter keywords by priority', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={keywordsWithAllFields} />)
      
      // Check priority high filter
      const highPriorityCheckbox = screen.getByTestId('priority-high')
      await user.click(highPriorityCheckbox)
      
      // Should only show high priority keyword
      expect(screen.getByTestId('keyword-row-kw1')).toBeInTheDocument()
      expect(screen.queryByTestId('keyword-row-kw2')).not.toBeInTheDocument()
      expect(screen.queryByTestId('keyword-row-kw3')).not.toBeInTheDocument()
    })

    it('should filter keywords by position range', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={keywordsWithAllFields} />)
      
      // Filter positions 1-10
      const minInput = screen.getByTestId('position-min')
      const maxInput = screen.getByTestId('position-max')
      
      await user.type(minInput, '1')
      await user.type(maxInput, '10')
      
      // Should show keywords with positions 3 and 8
      expect(screen.getByTestId('keyword-row-kw1')).toBeInTheDocument()
      expect(screen.getByTestId('keyword-row-kw2')).toBeInTheDocument()
      expect(screen.queryByTestId('keyword-row-kw3')).not.toBeInTheDocument()
    })

    it('should filter keywords by search volume range', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={keywordsWithAllFields} />)
      
      // Filter volume 5000-10000
      const minInput = screen.getByTestId('volume-min')
      const maxInput = screen.getByTestId('volume-max')
      
      await user.type(minInput, '5000')
      await user.type(maxInput, '10000')
      
      // Should show keywords with volumes 5400 and 8900
      expect(screen.getByTestId('keyword-row-kw1')).toBeInTheDocument()
      expect(screen.getByTestId('keyword-row-kw3')).toBeInTheDocument()
      expect(screen.queryByTestId('keyword-row-kw2')).not.toBeInTheDocument()
    })

    it('should combine multiple filter criteria', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={keywordsWithAllFields} />)
      
      // Filter: MEDIUM difficulty + high priority + position 1-10
      await user.click(screen.getByTestId('difficulty-medium'))
      await user.click(screen.getByTestId('priority-high'))
      await user.type(screen.getByTestId('position-min'), '1')
      await user.type(screen.getByTestId('position-max'), '10')
      
      // Should only show kw1 (MEDIUM + high + position 8)
      expect(screen.getByTestId('keyword-row-kw1')).toBeInTheDocument()
      expect(screen.queryByTestId('keyword-row-kw2')).not.toBeInTheDocument()
      expect(screen.queryByTestId('keyword-row-kw3')).not.toBeInTheDocument()
    })

    it('should combine filters with search query', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={keywordsWithAllFields} />)
      
      // Search for "tracking" + filter by EASY difficulty
      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'tracking')
      
      await user.click(screen.getByTestId('difficulty-easy'))
      
      // Should only show kw2 (has "tracking" + EASY)
      expect(screen.getByTestId('keyword-row-kw2')).toBeInTheDocument()
      expect(screen.queryByTestId('keyword-row-kw1')).not.toBeInTheDocument()
      expect(screen.queryByTestId('keyword-row-kw3')).not.toBeInTheDocument()
    })

    it('should update results count after filtering', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={keywordsWithAllFields} />)
      
      // Initially shows all
      expect(screen.getByText('Showing 3 of 3 keywords')).toBeInTheDocument()
      
      // Apply filter
      await user.click(screen.getByTestId('difficulty-easy'))
      
      // Should show filtered count
      expect(screen.getByText('Showing 1 of 3 keywords')).toBeInTheDocument()
    })

    it('should reset filters when reset button is clicked', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={keywordsWithAllFields} />)
      
      // Apply filters
      await user.click(screen.getByTestId('difficulty-easy'))
      await user.click(screen.getByTestId('priority-high'))
      
      // Only 0 keywords match (no keyword is both EASY and high priority)
      expect(screen.queryByTestId('keyword-row-kw1')).not.toBeInTheDocument()
      expect(screen.queryByTestId('keyword-row-kw2')).not.toBeInTheDocument()
      expect(screen.queryByTestId('keyword-row-kw3')).not.toBeInTheDocument()
      
      // Reset filters
      await user.click(screen.getByTestId('reset-filters-button'))
      
      // Should show all keywords again
      expect(screen.getByTestId('keyword-row-kw1')).toBeInTheDocument()
      expect(screen.getByTestId('keyword-row-kw2')).toBeInTheDocument()
      expect(screen.getByTestId('keyword-row-kw3')).toBeInTheDocument()
    })

    it('should reset to page 1 when filters change', async () => {
      const user = userEvent.setup()
      const manyKeywords = Array.from({ length: 25 }, (_, i) => ({
        id: `kw${i + 1}`,
        keyword: `keyword ${i + 1}`,
        projectId: 'proj1',
        searchVolume: 1000 + i * 100,
        currentPosition: i + 1,
        difficulty: i % 2 === 0 ? 'EASY' as const : 'MEDIUM' as const, // Changed to %2 for more EASY keywords
        priority: 'medium' as const,
      }))
      
      render(<KeywordDashboard projectId="proj1" keywords={manyKeywords} />)
      
      // Go to page 2
      await user.click(screen.getByTestId('next-page-button'))
      expect(screen.getByTestId('page-info')).toHaveTextContent('Page 2 of 3')
      
      // Apply filter - should have 13 EASY keywords (indices 0,2,4,...,24), which is 2 pages
      await user.click(screen.getByTestId('difficulty-easy'))
      
      // Should reset to page 1
      expect(screen.getByTestId('page-info')).toHaveTextContent('Page 1 of 2')
    })

    it('should work with filters and sorting together', async () => {
      const user = userEvent.setup()
      render(<KeywordDashboard projectId="proj1" keywords={keywordsWithAllFields} />)
      
      // Filter by EASY and MEDIUM difficulty
      await user.click(screen.getByTestId('difficulty-easy'))
      await user.click(screen.getByTestId('difficulty-medium'))
      
      // Sort by position
      await user.click(screen.getByTestId('sort-position'))
      
      // Should show kw2 first (position 3), then kw1 (position 8)
      const rows = screen.getAllByTestId(/^keyword-row-/)
      expect(rows).toHaveLength(2)
      expect(rows[0]).toHaveAttribute('data-testid', 'keyword-row-kw2')
      expect(rows[1]).toHaveAttribute('data-testid', 'keyword-row-kw1')
    })

    it('should handle keywords without filter fields gracefully', async () => {
      const user = userEvent.setup()
      const keywordsWithMissingFields = [
        {
          id: 'kw1',
          keyword: 'keyword one',
          projectId: 'proj1',
          // No difficulty, priority, position, or volume
        },
        {
          id: 'kw2',
          keyword: 'keyword two',
          projectId: 'proj1',
          difficulty: 'EASY' as const,
          priority: 'high' as const,
          currentPosition: 5,
          searchVolume: 1000,
        },
      ]
      
      render(<KeywordDashboard projectId="proj1" keywords={keywordsWithMissingFields} />)
      
      // Apply filter - kw1 shouldn't match because it has no difficulty
      await user.click(screen.getByTestId('difficulty-easy'))
      
      expect(screen.getByTestId('keyword-row-kw2')).toBeInTheDocument()
      expect(screen.queryByTestId('keyword-row-kw1')).not.toBeInTheDocument()
    })
  })
})
