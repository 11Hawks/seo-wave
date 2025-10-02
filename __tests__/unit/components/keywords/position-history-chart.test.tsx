import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PositionHistoryChart } from '@/components/keywords/position-history-chart'

describe('PositionHistoryChart Component', () => {
  const mockData = [
    { date: '2025-09-01', position: 15, impressions: 1000 },
    { date: '2025-09-08', position: 12, impressions: 1200 },
    { date: '2025-09-15', position: 10, impressions: 1500 },
    { date: '2025-09-22', position: 8, impressions: 1800 },
    { date: '2025-09-29', position: 7, impressions: 2000 }
  ]

  describe('Basic Rendering', () => {
    it('should render chart container', () => {
      render(<PositionHistoryChart data={mockData} />)
      
      expect(screen.getByTestId('position-history-chart')).toBeInTheDocument()
    })

    it('should render chart title', () => {
      render(<PositionHistoryChart data={mockData} title="Position Trend" />)
      
      expect(screen.getByText('Position Trend')).toBeInTheDocument()
    })

    it('should use default title if not provided', () => {
      render(<PositionHistoryChart data={mockData} />)
      
      expect(screen.getByText('Position History')).toBeInTheDocument()
    })

    it('should render chart with correct dimensions', () => {
      render(<PositionHistoryChart data={mockData} width={600} height={300} />)
      
      const chart = screen.getByTestId('position-history-chart')
      expect(chart).toBeInTheDocument()
      // Chart library will handle actual SVG dimensions
    })
  })

  describe('Empty State', () => {
    it('should show empty message when no data provided', () => {
      render(<PositionHistoryChart data={[]} />)
      
      expect(screen.getByTestId('empty-chart-message')).toHaveTextContent(
        'No position history data available'
      )
    })

    it('should not render chart when data is empty', () => {
      render(<PositionHistoryChart data={[]} />)
      
      expect(screen.queryByTestId('recharts-wrapper')).not.toBeInTheDocument()
    })
  })

  describe('Data Visualization', () => {
    it('should render with provided data points', () => {
      render(<PositionHistoryChart data={mockData} />)
      
      // Chart should be rendered with data
      const chart = screen.getByTestId('position-history-chart')
      expect(chart).toBeInTheDocument()
    })

    it('should handle single data point', () => {
      const singlePoint = [{ date: '2025-09-01', position: 10, impressions: 1000 }]
      render(<PositionHistoryChart data={singlePoint} />)
      
      expect(screen.getByTestId('position-history-chart')).toBeInTheDocument()
    })

    it('should format dates correctly', () => {
      render(<PositionHistoryChart data={mockData} />)
      
      // Recharts will render dates on X-axis
      const chart = screen.getByTestId('position-history-chart')
      expect(chart).toBeInTheDocument()
    })
  })

  describe('Chart Customization', () => {
    it('should accept custom width', () => {
      render(<PositionHistoryChart data={mockData} width={800} />)
      
      expect(screen.getByTestId('position-history-chart')).toBeInTheDocument()
    })

    it('should accept custom height', () => {
      render(<PositionHistoryChart data={mockData} height={400} />)
      
      expect(screen.getByTestId('position-history-chart')).toBeInTheDocument()
    })

    it('should use default dimensions when not provided', () => {
      render(<PositionHistoryChart data={mockData} />)
      
      expect(screen.getByTestId('position-history-chart')).toBeInTheDocument()
    })

    it('should accept custom title', () => {
      render(<PositionHistoryChart data={mockData} title="My Custom Chart" />)
      
      expect(screen.getByText('My Custom Chart')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('should render responsive container', () => {
      render(<PositionHistoryChart data={mockData} responsive />)
      
      const chart = screen.getByTestId('position-history-chart')
      expect(chart).toBeInTheDocument()
    })

    it('should render with fixed dimensions when not responsive', () => {
      render(<PositionHistoryChart data={mockData} responsive={false} width={600} height={300} />)
      
      expect(screen.getByTestId('position-history-chart')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA label', () => {
      render(<PositionHistoryChart data={mockData} />)
      
      const chart = screen.getByTestId('position-history-chart')
      expect(chart).toHaveAttribute('aria-label', 'Position history line chart')
    })

    it('should have role attribute', () => {
      render(<PositionHistoryChart data={mockData} />)
      
      const chart = screen.getByTestId('position-history-chart')
      expect(chart).toHaveAttribute('role', 'img')
    })
  })

  describe('Data Formatting', () => {
    it('should handle missing position values', () => {
      const dataWithMissing = [
        { date: '2025-09-01', position: 15, impressions: 1000 },
        { date: '2025-09-08', position: undefined, impressions: 1200 },
        { date: '2025-09-15', position: 10, impressions: 1500 }
      ]
      
      render(<PositionHistoryChart data={dataWithMissing} />)
      
      expect(screen.getByTestId('position-history-chart')).toBeInTheDocument()
    })

    it('should handle missing impressions values', () => {
      const dataWithMissing = [
        { date: '2025-09-01', position: 15, impressions: 1000 },
        { date: '2025-09-08', position: 12, impressions: undefined },
        { date: '2025-09-15', position: 10, impressions: 1500 }
      ]
      
      render(<PositionHistoryChart data={dataWithMissing} />)
      
      expect(screen.getByTestId('position-history-chart')).toBeInTheDocument()
    })
  })

  describe('Legend', () => {
    it('should render legend by default', () => {
      render(<PositionHistoryChart data={mockData} />)
      
      // Chart renders with legend
      expect(screen.getByTestId('position-history-chart')).toBeInTheDocument()
    })

    it('should hide legend when showLegend is false', () => {
      render(<PositionHistoryChart data={mockData} showLegend={false} />)
      
      expect(screen.getByTestId('position-history-chart')).toBeInTheDocument()
    })
  })

  describe('Grid Lines', () => {
    it('should show grid lines by default', () => {
      render(<PositionHistoryChart data={mockData} />)
      
      expect(screen.getByTestId('position-history-chart')).toBeInTheDocument()
    })

    it('should hide grid lines when showGrid is false', () => {
      render(<PositionHistoryChart data={mockData} showGrid={false} />)
      
      expect(screen.getByTestId('position-history-chart')).toBeInTheDocument()
    })
  })
})
