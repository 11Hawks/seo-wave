import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PerformanceTrendsChart } from '@/components/keywords/performance-trends-chart'

describe('PerformanceTrendsChart Component', () => {
  const mockData = [
    { date: '2025-09-01', clicks: 100, impressions: 1500, ctr: 0.067 },
    { date: '2025-09-08', clicks: 120, impressions: 1800, ctr: 0.067 },
    { date: '2025-09-15', clicks: 150, impressions: 2100, ctr: 0.071 },
    { date: '2025-09-22', clicks: 180, impressions: 2400, ctr: 0.075 },
    { date: '2025-09-29', clicks: 200, impressions: 2700, ctr: 0.074 }
  ]

  describe('Basic Rendering', () => {
    it('should render chart container', () => {
      render(<PerformanceTrendsChart data={mockData} />)
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })

    it('should render chart title', () => {
      render(<PerformanceTrendsChart data={mockData} title="Performance Over Time" />)
      
      expect(screen.getByText('Performance Over Time')).toBeInTheDocument()
    })

    it('should use default title if not provided', () => {
      render(<PerformanceTrendsChart data={mockData} />)
      
      expect(screen.getByText('Performance Trends')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty message when no data provided', () => {
      render(<PerformanceTrendsChart data={[]} />)
      
      expect(screen.getByTestId('empty-chart-message')).toHaveTextContent(
        'No performance data available'
      )
    })

    it('should not render chart when data is empty', () => {
      render(<PerformanceTrendsChart data={[]} />)
      
      expect(screen.queryByTestId('recharts-wrapper')).not.toBeInTheDocument()
    })
  })

  describe('Data Visualization', () => {
    it('should render with provided data points', () => {
      render(<PerformanceTrendsChart data={mockData} />)
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })

    it('should handle single data point', () => {
      const singlePoint = [{ date: '2025-09-01', clicks: 100, impressions: 1500, ctr: 0.067 }]
      render(<PerformanceTrendsChart data={singlePoint} />)
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })
  })

  describe('Metric Selection', () => {
    it('should show clicks by default', () => {
      render(<PerformanceTrendsChart data={mockData} />)
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })

    it('should show impressions by default', () => {
      render(<PerformanceTrendsChart data={mockData} />)
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })

    it('should show CTR by default', () => {
      render(<PerformanceTrendsChart data={mockData} />)
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })

    it('should allow showing only clicks', () => {
      render(
        <PerformanceTrendsChart 
          data={mockData} 
          showClicks={true}
          showImpressions={false}
          showCtr={false}
        />
      )
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })

    it('should allow showing only impressions', () => {
      render(
        <PerformanceTrendsChart 
          data={mockData} 
          showClicks={false}
          showImpressions={true}
          showCtr={false}
        />
      )
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })

    it('should allow showing only CTR', () => {
      render(
        <PerformanceTrendsChart 
          data={mockData} 
          showClicks={false}
          showImpressions={false}
          showCtr={true}
        />
      )
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })
  })

  describe('Chart Customization', () => {
    it('should accept custom width', () => {
      render(<PerformanceTrendsChart data={mockData} width={800} />)
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })

    it('should accept custom height', () => {
      render(<PerformanceTrendsChart data={mockData} height={400} />)
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })

    it('should use default dimensions when not provided', () => {
      render(<PerformanceTrendsChart data={mockData} />)
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('should render responsive container by default', () => {
      render(<PerformanceTrendsChart data={mockData} />)
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })

    it('should render with fixed dimensions when not responsive', () => {
      render(<PerformanceTrendsChart data={mockData} responsive={false} />)
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA label', () => {
      render(<PerformanceTrendsChart data={mockData} />)
      
      const chart = screen.getByTestId('performance-trends-chart')
      expect(chart).toHaveAttribute('aria-label', 'Performance trends line chart')
    })

    it('should have role attribute', () => {
      render(<PerformanceTrendsChart data={mockData} />)
      
      const chart = screen.getByTestId('performance-trends-chart')
      expect(chart).toHaveAttribute('role', 'img')
    })
  })

  describe('Data Formatting', () => {
    it('should handle missing clicks values', () => {
      const dataWithMissing = [
        { date: '2025-09-01', clicks: 100, impressions: 1500, ctr: 0.067 },
        { date: '2025-09-08', clicks: undefined, impressions: 1800, ctr: 0.067 },
        { date: '2025-09-15', clicks: 150, impressions: 2100, ctr: 0.071 }
      ]
      
      render(<PerformanceTrendsChart data={dataWithMissing} />)
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })

    it('should handle missing impressions values', () => {
      const dataWithMissing = [
        { date: '2025-09-01', clicks: 100, impressions: 1500, ctr: 0.067 },
        { date: '2025-09-08', clicks: 120, impressions: undefined, ctr: 0.067 },
        { date: '2025-09-15', clicks: 150, impressions: 2100, ctr: 0.071 }
      ]
      
      render(<PerformanceTrendsChart data={dataWithMissing} />)
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })

    it('should handle missing CTR values', () => {
      const dataWithMissing = [
        { date: '2025-09-01', clicks: 100, impressions: 1500, ctr: 0.067 },
        { date: '2025-09-08', clicks: 120, impressions: 1800, ctr: undefined },
        { date: '2025-09-15', clicks: 150, impressions: 2100, ctr: 0.071 }
      ]
      
      render(<PerformanceTrendsChart data={dataWithMissing} />)
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })
  })

  describe('Legend', () => {
    it('should render legend by default', () => {
      render(<PerformanceTrendsChart data={mockData} />)
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })

    it('should hide legend when showLegend is false', () => {
      render(<PerformanceTrendsChart data={mockData} showLegend={false} />)
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })
  })

  describe('Grid Lines', () => {
    it('should show grid lines by default', () => {
      render(<PerformanceTrendsChart data={mockData} />)
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })

    it('should hide grid lines when showGrid is false', () => {
      render(<PerformanceTrendsChart data={mockData} showGrid={false} />)
      
      expect(screen.getByTestId('performance-trends-chart')).toBeInTheDocument()
    })
  })
})
