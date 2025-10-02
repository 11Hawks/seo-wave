import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterPanel } from '@/components/keywords/filter-panel'

describe('FilterPanel Component', () => {
  describe('Basic Rendering', () => {
    it('should render filter panel', () => {
      render(<FilterPanel onFilterChange={vi.fn()} />)
      
      expect(screen.getByTestId('filter-panel')).toBeInTheDocument()
    })

    it('should render filter title', () => {
      render(<FilterPanel onFilterChange={vi.fn()} />)
      
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })

    it('should render all filter sections', () => {
      render(<FilterPanel onFilterChange={vi.fn()} />)
      
      expect(screen.getByText('Difficulty')).toBeInTheDocument()
      expect(screen.getByText('Priority')).toBeInTheDocument()
      expect(screen.getByText('Position Range')).toBeInTheDocument()
      expect(screen.getByText('Search Volume')).toBeInTheDocument()
    })
  })

  describe('Difficulty Filter', () => {
    it('should render difficulty checkboxes', () => {
      render(<FilterPanel onFilterChange={vi.fn()} />)
      
      expect(screen.getByTestId('difficulty-easy')).toBeInTheDocument()
      expect(screen.getByTestId('difficulty-medium')).toBeInTheDocument()
      expect(screen.getByTestId('difficulty-hard')).toBeInTheDocument()
    })

    it('should call onFilterChange when difficulty is selected', async () => {
      const user = userEvent.setup()
      const mockOnFilterChange = vi.fn()
      
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      await user.click(screen.getByTestId('difficulty-easy'))
      
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          difficulty: ['EASY']
        })
      )
    })

    it('should allow multiple difficulty selections', async () => {
      const user = userEvent.setup()
      const mockOnFilterChange = vi.fn()
      
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      await user.click(screen.getByTestId('difficulty-easy'))
      await user.click(screen.getByTestId('difficulty-medium'))
      
      expect(mockOnFilterChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          difficulty: expect.arrayContaining(['EASY', 'MEDIUM'])
        })
      )
    })

    it('should unselect difficulty when clicked again', async () => {
      const user = userEvent.setup()
      const mockOnFilterChange = vi.fn()
      
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      await user.click(screen.getByTestId('difficulty-easy'))
      await user.click(screen.getByTestId('difficulty-easy'))
      
      expect(mockOnFilterChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          difficulty: []
        })
      )
    })
  })

  describe('Priority Filter', () => {
    it('should render priority checkboxes', () => {
      render(<FilterPanel onFilterChange={vi.fn()} />)
      
      expect(screen.getByTestId('priority-low')).toBeInTheDocument()
      expect(screen.getByTestId('priority-medium')).toBeInTheDocument()
      expect(screen.getByTestId('priority-high')).toBeInTheDocument()
    })

    it('should call onFilterChange when priority is selected', async () => {
      const user = userEvent.setup()
      const mockOnFilterChange = vi.fn()
      
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      await user.click(screen.getByTestId('priority-high'))
      
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: ['high']
        })
      )
    })

    it('should allow multiple priority selections', async () => {
      const user = userEvent.setup()
      const mockOnFilterChange = vi.fn()
      
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      await user.click(screen.getByTestId('priority-low'))
      await user.click(screen.getByTestId('priority-high'))
      
      expect(mockOnFilterChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          priority: expect.arrayContaining(['low', 'high'])
        })
      )
    })
  })

  describe('Position Range Filter', () => {
    it('should render position range input fields', () => {
      render(<FilterPanel onFilterChange={vi.fn()} />)
      
      expect(screen.getByTestId('position-min')).toBeInTheDocument()
      expect(screen.getByTestId('position-max')).toBeInTheDocument()
    })

    it('should call onFilterChange when position range is entered', async () => {
      const user = userEvent.setup()
      const mockOnFilterChange = vi.fn()
      
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      await user.type(screen.getByTestId('position-min'), '1')
      await user.type(screen.getByTestId('position-max'), '10')
      
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          positionRange: { min: 1, max: 10 }
        })
      )
    })

    it('should handle empty position range', async () => {
      const user = userEvent.setup()
      const mockOnFilterChange = vi.fn()
      
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      const minInput = screen.getByTestId('position-min')
      await user.type(minInput, '1')
      await user.clear(minInput)
      
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          positionRange: { min: null, max: null }
        })
      )
    })
  })

  describe('Search Volume Filter', () => {
    it('should render volume range input fields', () => {
      render(<FilterPanel onFilterChange={vi.fn()} />)
      
      expect(screen.getByTestId('volume-min')).toBeInTheDocument()
      expect(screen.getByTestId('volume-max')).toBeInTheDocument()
    })

    it('should call onFilterChange when volume range is entered', async () => {
      const user = userEvent.setup()
      const mockOnFilterChange = vi.fn()
      
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      await user.type(screen.getByTestId('volume-min'), '1000')
      await user.type(screen.getByTestId('volume-max'), '5000')
      
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          volumeRange: { min: 1000, max: 5000 }
        })
      )
    })
  })

  describe('Reset Filters', () => {
    it('should render reset button', () => {
      render(<FilterPanel onFilterChange={vi.fn()} />)
      
      expect(screen.getByTestId('reset-filters-button')).toBeInTheDocument()
    })

    it('should reset all filters when reset button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnFilterChange = vi.fn()
      
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      // Apply some filters
      await user.click(screen.getByTestId('difficulty-easy'))
      await user.click(screen.getByTestId('priority-high'))
      
      // Reset
      await user.click(screen.getByTestId('reset-filters-button'))
      
      expect(mockOnFilterChange).toHaveBeenLastCalledWith({
        difficulty: [],
        priority: [],
        positionRange: { min: null, max: null },
        volumeRange: { min: null, max: null }
      })
    })
  })

  describe('Active Filters Display', () => {
    it('should show active filter count when filters are applied', async () => {
      const user = userEvent.setup()
      
      render(<FilterPanel onFilterChange={vi.fn()} />)
      
      await user.click(screen.getByTestId('difficulty-easy'))
      await user.click(screen.getByTestId('priority-high'))
      
      expect(screen.getByTestId('active-filters-count')).toHaveTextContent('2')
    })

    it('should not show count when no filters are active', () => {
      render(<FilterPanel onFilterChange={vi.fn()} />)
      
      expect(screen.queryByTestId('active-filters-count')).not.toBeInTheDocument()
    })
  })

  describe('Collapsible Panel', () => {
    it('should toggle panel visibility', async () => {
      const user = userEvent.setup()
      
      render(<FilterPanel onFilterChange={vi.fn()} collapsible />)
      
      const toggleButton = screen.getByTestId('toggle-filters-button')
      
      // Panel should be visible by default
      expect(screen.getByTestId('filter-content')).toBeInTheDocument()
      
      // Click to collapse
      await user.click(toggleButton)
      
      // Panel should be hidden
      expect(screen.queryByTestId('filter-content')).not.toBeInTheDocument()
    })

    it('should show collapsed state indicator', async () => {
      const user = userEvent.setup()
      
      render(<FilterPanel onFilterChange={vi.fn()} collapsible />)
      
      const toggleButton = screen.getByTestId('toggle-filters-button')
      await user.click(toggleButton)
      
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
    })
  })
})
