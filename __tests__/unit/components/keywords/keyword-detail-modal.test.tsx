import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KeywordDetailModal } from '@/components/keywords/keyword-detail-modal'
import type { KeywordData } from '@/components/keywords/keyword-dashboard'

describe('KeywordDetailModal Component', () => {
  const mockKeyword: KeywordData = {
    id: 'kw1',
    keyword: 'seo tools',
    projectId: 'proj1',
    searchVolume: 5000,
    difficulty: 'MEDIUM',
    cpc: 2.5,
    competition: 0.65,
    currentPosition: 8,
    gscPosition: 7,
    gscClicks: 150,
    gscImpressions: 2000,
    gscCtr: 0.075,
    confidenceScore: 0.85,
    tags: ['analytics', 'tools'],
    priority: 'high',
    category: 'SEO Software',
    positionTrend: 'up'
  }

  describe('Basic Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByTestId('keyword-detail-modal')).toBeInTheDocument()
    })

    it('should not render modal when isOpen is false', () => {
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={false}
          onClose={vi.fn()}
        />
      )

      expect(screen.queryByTestId('keyword-detail-modal')).not.toBeInTheDocument()
    })

    it('should display keyword name in modal header', () => {
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByTestId('modal-header')).toHaveTextContent('seo tools')
    })

    it('should display close button', () => {
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByTestId('close-button')).toBeInTheDocument()
    })
  })

  describe('Basic Information Section', () => {
    it('should display category if provided', () => {
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByTestId('keyword-category')).toHaveTextContent('SEO Software')
    })

    it('should display priority badge', () => {
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      const priorityBadge = screen.getByTestId('priority-badge')
      expect(priorityBadge).toHaveTextContent('high')
    })

    it('should display tags if provided', () => {
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByTestId('tag-analytics')).toHaveTextContent('analytics')
      expect(screen.getByTestId('tag-tools')).toHaveTextContent('tools')
    })

    it('should not display tags section if no tags', () => {
      const keywordNoTags = { ...mockKeyword, tags: undefined }
      render(
        <KeywordDetailModal 
          keyword={keywordNoTags}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.queryByTestId('tags-section')).not.toBeInTheDocument()
    })
  })

  describe('SEO Metrics Section', () => {
    it('should display search volume with formatting', () => {
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByTestId('metric-searchVolume')).toHaveTextContent('5,000')
    })

    it('should display difficulty level', () => {
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByTestId('metric-difficulty')).toHaveTextContent('MEDIUM')
    })

    it('should display CPC with currency formatting', () => {
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByTestId('metric-cpc')).toHaveTextContent('$2.50')
    })

    it('should display competition as percentage', () => {
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByTestId('metric-competition')).toHaveTextContent('65%')
    })

    it('should show N/A for missing optional metrics', () => {
      const keywordMissingMetrics = {
        ...mockKeyword,
        cpc: undefined,
        competition: undefined
      }
      render(
        <KeywordDetailModal 
          keyword={keywordMissingMetrics}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByTestId('metric-cpc')).toHaveTextContent('N/A')
      expect(screen.getByTestId('metric-competition')).toHaveTextContent('N/A')
    })
  })

  describe('Current Performance Section', () => {
    it('should display current position', () => {
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByTestId('performance-position')).toHaveTextContent('8')
    })

    it('should display position trend indicator', () => {
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      const trendIndicator = screen.getByTestId('trend-indicator')
      expect(trendIndicator).toBeInTheDocument()
      expect(trendIndicator).toHaveTextContent('↑') // Up arrow for 'up' trend
    })

    it('should display GSC metrics when available', () => {
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByTestId('gsc-clicks')).toHaveTextContent('150')
      expect(screen.getByTestId('gsc-impressions')).toHaveTextContent('2,000')
      expect(screen.getByTestId('gsc-ctr')).toHaveTextContent('7.5%')
    })

    it('should show N/A for missing GSC metrics', () => {
      const keywordNoGSC = {
        ...mockKeyword,
        gscClicks: undefined,
        gscImpressions: undefined,
        gscCtr: undefined
      }
      render(
        <KeywordDetailModal 
          keyword={keywordNoGSC}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByTestId('gsc-clicks')).toHaveTextContent('N/A')
      expect(screen.getByTestId('gsc-impressions')).toHaveTextContent('N/A')
      expect(screen.getByTestId('gsc-ctr')).toHaveTextContent('N/A')
    })

    it('should display confidence score as percentage', () => {
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByTestId('confidence-score')).toHaveTextContent('85%')
    })
  })

  describe('Modal Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnClose = vi.fn()
      
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByTestId('close-button'))

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup()
      const mockOnClose = vi.fn()
      
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByTestId('modal-backdrop'))

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should not close when modal content is clicked', async () => {
      const user = userEvent.setup()
      const mockOnClose = vi.fn()
      
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByTestId('modal-content'))

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('should call onClose when Escape key is pressed', async () => {
      const user = userEvent.setup()
      const mockOnClose = vi.fn()
      
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      await user.keyboard('{Escape}')

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <KeywordDetailModal 
          keyword={mockKeyword}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      const modal = screen.getByTestId('keyword-detail-modal')
      expect(modal).toHaveAttribute('role', 'dialog')
      expect(modal).toHaveAttribute('aria-modal', 'true')
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-header')
    })
  })

  describe('Historical Charts', () => {
    it('should not render charts section when no history data', () => {
      const keywordNoHistory = { ...mockKeyword, history: undefined }
      render(
        <KeywordDetailModal 
          keyword={keywordNoHistory}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.queryByText('Historical Data')).not.toBeInTheDocument()
    })

    it('should not render charts section when history is empty array', () => {
      const keywordEmptyHistory = { ...mockKeyword, history: [] }
      render(
        <KeywordDetailModal 
          keyword={keywordEmptyHistory}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.queryByText('Historical Data')).not.toBeInTheDocument()
    })

    it('should render charts section when history data exists', () => {
      const keywordWithHistory = {
        ...mockKeyword,
        history: [
          { date: '2025-09-01', position: 15, clicks: 100, impressions: 1500, ctr: 0.067 },
          { date: '2025-09-08', position: 12, clicks: 120, impressions: 1800, ctr: 0.067 },
          { date: '2025-09-15', position: 10, clicks: 150, impressions: 2100, ctr: 0.071 }
        ]
      }
      render(
        <KeywordDetailModal 
          keyword={keywordWithHistory}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByText('Historical Data')).toBeInTheDocument()
    })

    it('should render position history chart when history data exists', () => {
      const keywordWithHistory = {
        ...mockKeyword,
        history: [
          { date: '2025-09-01', position: 15, clicks: 100, impressions: 1500, ctr: 0.067 },
          { date: '2025-09-08', position: 12, clicks: 120, impressions: 1800, ctr: 0.067 }
        ]
      }
      render(
        <KeywordDetailModal 
          keyword={keywordWithHistory}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByTestId('position-history-chart')).toBeInTheDocument()
    })

    it('should render performance trends chart when history data exists', () => {
      const keywordWithHistory = {
        ...mockKeyword,
        history: [
          { date: '2025-09-01', position: 15, clicks: 100, impressions: 1500, ctr: 0.067 },
          { date: '2025-09-08', position: 12, clicks: 120, impressions: 1800, ctr: 0.067 }
        ]
      }
      render(
        <KeywordDetailModal 
          keyword={keywordWithHistory}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })
  })
})
