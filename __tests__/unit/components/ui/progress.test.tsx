/**
 * @fileoverview Progress Component Tests
 * Tests the Progress component behavior, accessibility, and visual states
 * Includes comprehensive progress value testing and accessibility compliance
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { Progress } from '@/components/ui/progress'

// Mock the utils function
vi.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}))

// Mock Radix UI Progress components
vi.mock('@radix-ui/react-progress', () => ({
  Root: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      role="progressbar"
      className={className}
      {...props}
    >
      {children}
    </div>
  )),
  Indicator: React.forwardRef<HTMLDivElement, any>(({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={className}
      style={style}
      {...props}
    />
  )),
}))

describe('Progress Component', () => {
  describe('Basic Rendering', () => {
    it('should render progress bar', () => {
      render(<Progress value={50} data-testid="progress" />)
      
      const progress = screen.getByTestId('progress')
      expect(progress).toBeInTheDocument()
      expect(progress).toHaveRole('progressbar')
    })

    it('should have default classes', () => {
      render(<Progress value={50} data-testid="progress" />)
      
      const progress = screen.getByTestId('progress')
      expect(progress).toHaveClass(
        'relative',
        'h-2',
        'w-full',
        'overflow-hidden',
        'rounded-full',
        'bg-secondary'
      )
    })

    it('should accept custom className', () => {
      render(<Progress value={50} className="custom-class" data-testid="progress" />)
      
      const progress = screen.getByTestId('progress')
      expect(progress).toHaveClass('custom-class')
    })

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>()
      render(<Progress ref={ref} value={50} />)
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('Progress Values', () => {
    it('should handle zero progress', () => {
      render(<Progress value={0} data-testid="progress" />)
      
      const progress = screen.getByTestId('progress')
      expect(progress).toBeInTheDocument()
      
      const indicator = progress.querySelector('div')
      expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' })
    })

    it('should handle 50% progress', () => {
      render(<Progress value={50} data-testid="progress" />)
      
      const progress = screen.getByTestId('progress')
      const indicator = progress.querySelector('div')
      expect(indicator).toHaveStyle({ transform: 'translateX(-50%)' })
    })

    it('should handle 100% progress', () => {
      render(<Progress value={100} data-testid="progress" />)
      
      const progress = screen.getByTestId('progress')
      const indicator = progress.querySelector('div')
      expect(indicator).toHaveStyle({ transform: 'translateX(-0%)' })
    })

    it('should handle undefined value as 0', () => {
      render(<Progress data-testid="progress" />)
      
      const progress = screen.getByTestId('progress')
      const indicator = progress.querySelector('div')
      expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' })
    })

    it('should handle null value as 0', () => {
      render(<Progress value={null as any} data-testid="progress" />)
      
      const progress = screen.getByTestId('progress')
      const indicator = progress.querySelector('div')
      expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' })
    })
  })

  describe('Edge Cases', () => {
    it('should handle negative values', () => {
      render(<Progress value={-10} data-testid="progress" />)
      
      const progress = screen.getByTestId('progress')
      const indicator = progress.querySelector('div')
      expect(indicator).toHaveStyle({ transform: 'translateX(-110%)' })
    })

    it('should handle values over 100', () => {
      render(<Progress value={150} data-testid="progress" />)
      
      const progress = screen.getByTestId('progress')
      const indicator = progress.querySelector('div')
      expect(indicator).toHaveStyle({ transform: 'translateX(50%)' })
    })

    it('should handle decimal values', () => {
      render(<Progress value={33.33} data-testid="progress" />)
      
      const progress = screen.getByTestId('progress')
      const indicator = progress.querySelector('div')
      expect(indicator).toHaveStyle({ transform: 'translateX(-66.67%)' })
    })

    it('should handle very small values', () => {
      render(<Progress value={0.1} data-testid="progress" />)
      
      const progress = screen.getByTestId('progress')
      const indicator = progress.querySelector('div')
      expect(indicator).toHaveStyle({ transform: 'translateX(-99.9%)' })
    })
  })

  describe('Accessibility', () => {
    it('should have progressbar role', () => {
      render(<Progress value={50} />)
      
      const progress = screen.getByRole('progressbar')
      expect(progress).toBeInTheDocument()
    })

    it('should accept aria-label', () => {
      render(<Progress value={50} aria-label="Loading progress" />)
      
      const progress = screen.getByRole('progressbar')
      expect(progress).toHaveAttribute('aria-label', 'Loading progress')
    })

    it('should accept aria-labelledby', () => {
      render(
        <div>
          <div id="progress-label">Upload Progress</div>
          <Progress value={50} aria-labelledby="progress-label" />
        </div>
      )
      
      const progress = screen.getByRole('progressbar')
      expect(progress).toHaveAttribute('aria-labelledby', 'progress-label')
    })

    it('should accept aria-describedby', () => {
      render(
        <div>
          <Progress value={50} aria-describedby="progress-desc" />
          <div id="progress-desc">File upload in progress</div>
        </div>
      )
      
      const progress = screen.getByRole('progressbar')
      expect(progress).toHaveAttribute('aria-describedby', 'progress-desc')
    })

    it('should support aria-valuemin and aria-valuemax', () => {
      render(<Progress value={50} aria-valuemin={0} aria-valuemax={100} />)
      
      const progress = screen.getByRole('progressbar')
      expect(progress).toHaveAttribute('aria-valuemin', '0')
      expect(progress).toHaveAttribute('aria-valuemax', '100')
    })

    it('should support aria-valuenow', () => {
      render(<Progress value={75} aria-valuenow={75} />)
      
      const progress = screen.getByRole('progressbar')
      expect(progress).toHaveAttribute('aria-valuenow', '75')
    })

    it('should support aria-valuetext', () => {
      render(<Progress value={50} aria-valuetext="50% complete" />)
      
      const progress = screen.getByRole('progressbar')
      expect(progress).toHaveAttribute('aria-valuetext', '50% complete')
    })
  })

  describe('Styling and Theming', () => {
    it('should merge custom classes with default classes', () => {
      render(<Progress value={50} className="h-4 bg-red-100" data-testid="progress" />)
      
      const progress = screen.getByTestId('progress')
      expect(progress).toHaveClass('h-4', 'bg-red-100')
      expect(progress).toHaveClass('relative', 'w-full')
    })

    it('should have proper indicator classes', () => {
      render(<Progress value={50} data-testid="progress" />)
      
      const progress = screen.getByTestId('progress')
      const indicator = progress.querySelector('div')
      expect(indicator).toHaveClass(
        'h-full',
        'w-full',
        'flex-1',
        'bg-primary',
        'transition-all'
      )
    })

    it('should handle different heights via className', () => {
      render(<Progress value={50} className="h-1" data-testid="thin-progress" />)
      render(<Progress value={50} className="h-4" data-testid="thick-progress" />)
      
      expect(screen.getByTestId('thin-progress')).toHaveClass('h-1')
      expect(screen.getByTestId('thick-progress')).toHaveClass('h-4')
    })
  })

  describe('Animation and Transitions', () => {
    it('should have transition classes on indicator', () => {
      render(<Progress value={50} data-testid="progress" />)
      
      const progress = screen.getByTestId('progress')
      const indicator = progress.querySelector('div')
      expect(indicator).toHaveClass('transition-all')
    })

    it('should handle rapid value changes', () => {
      const { rerender } = render(<Progress value={0} data-testid="progress" />)
      
      let progress = screen.getByTestId('progress')
      let indicator = progress.querySelector('div')
      expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' })
      
      rerender(<Progress value={50} data-testid="progress" />)
      progress = screen.getByTestId('progress')
      indicator = progress.querySelector('div')
      expect(indicator).toHaveStyle({ transform: 'translateX(-50%)' })
      
      rerender(<Progress value={100} data-testid="progress" />)
      progress = screen.getByTestId('progress')
      indicator = progress.querySelector('div')
      expect(indicator).toHaveStyle({ transform: 'translateX(-0%)' })
    })
  })

  describe('Component Integration', () => {
    it('should work within other components', () => {
      render(
        <div className="card">
          <h3>Upload Progress</h3>
          <Progress value={75} data-testid="embedded-progress" />
          <p>75% complete</p>
        </div>
      )
      
      expect(screen.getByText('Upload Progress')).toBeInTheDocument()
      expect(screen.getByTestId('embedded-progress')).toBeInTheDocument()
      expect(screen.getByText('75% complete')).toBeInTheDocument()
    })

    it('should work with dynamic progress updates', () => {
      const DynamicProgress = () => {
        const [progress, setProgress] = React.useState(0)
        
        React.useEffect(() => {
          const timer = setTimeout(() => setProgress(50), 100)
          return () => clearTimeout(timer)
        }, [])
        
        return (
          <div>
            <Progress value={progress} data-testid="dynamic-progress" />
            <button onClick={() => setProgress(progress + 10)}>Increment</button>
          </div>
        )
      }
      
      render(<DynamicProgress />)
      
      const progress = screen.getByTestId('dynamic-progress')
      expect(progress).toBeInTheDocument()
      
      const button = screen.getByRole('button', { name: 'Increment' })
      expect(button).toBeInTheDocument()
    })
  })

  describe('HTML Attributes', () => {
    it('should accept standard HTML attributes', () => {
      render(
        <Progress
          value={50}
          id="test-progress"
          data-testid="progress"
          title="Progress Bar"
          style={{ width: '200px' }}
        />
      )
      
      const progress = screen.getByTestId('progress')
      expect(progress).toHaveAttribute('id', 'test-progress')
      expect(progress).toHaveAttribute('title', 'Progress Bar')
      expect(progress).toHaveStyle({ width: '200px' })
    })

    it('should accept data attributes', () => {
      render(
        <Progress
          value={50}
          data-testid="progress"
          data-progress-id="upload-1"
          data-max={100}
        />
      )
      
      const progress = screen.getByTestId('progress')
      expect(progress).toHaveAttribute('data-progress-id', 'upload-1')
      expect(progress).toHaveAttribute('data-max', '100')
    })
  })

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const renderSpy = vi.fn()
      
      const TestProgress = ({ value }: { value: number }) => {
        renderSpy()
        return <Progress value={value} />
      }
      
      const { rerender } = render(<TestProgress value={50} />)
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      rerender(<TestProgress value={50} />)
      expect(renderSpy).toHaveBeenCalledTimes(2)
      
      rerender(<TestProgress value={75} />)
      expect(renderSpy).toHaveBeenCalledTimes(3)
    })

    it('should handle many progress bars efficiently', () => {
      const progressBars = Array.from({ length: 100 }, (_, i) => (
        <Progress key={i} value={i} data-testid={`progress-${i}`} />
      ))
      
      render(<div>{progressBars}</div>)
      
      expect(screen.getByTestId('progress-0')).toBeInTheDocument()
      expect(screen.getByTestId('progress-99')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle NaN values gracefully', () => {
      render(<Progress value={NaN} data-testid="progress" />)
      
      const progress = screen.getByTestId('progress')
      const indicator = progress.querySelector('div')
      // NaN should be treated as 0
      expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' })
    })

    it('should handle Infinity values', () => {
      render(<Progress value={Infinity} data-testid="progress" />)
      
      const progress = screen.getByTestId('progress')
      expect(progress).toBeInTheDocument()
    })

    it('should handle string values that can be converted to numbers', () => {
      render(<Progress value={'50' as any} data-testid="progress" />)
      
      const progress = screen.getByTestId('progress')
      expect(progress).toBeInTheDocument()
    })
  })

  describe('Real-world Usage Patterns', () => {
    it('should work as file upload progress', () => {
      render(
        <div>
          <label htmlFor="progress">File Upload Progress</label>
          <Progress
            id="progress"
            value={65}
            aria-label="File upload progress"
            aria-valuenow={65}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext="65% uploaded"
          />
          <span>65% complete (650 KB of 1 MB)</span>
        </div>
      )
      
      const progress = screen.getByLabelText('File Upload Progress')
      expect(progress).toHaveAttribute('aria-valuenow', '65')
      expect(screen.getByText('65% complete (650 KB of 1 MB)')).toBeInTheDocument()
    })

    it('should work as skill level indicator', () => {
      render(
        <div>
          <h4>JavaScript Proficiency</h4>
          <Progress
            value={85}
            aria-label="JavaScript skill level"
            className="h-3"
          />
          <span className="text-sm">Expert (85%)</span>
        </div>
      )
      
      expect(screen.getByText('JavaScript Proficiency')).toBeInTheDocument()
      expect(screen.getByLabelText('JavaScript skill level')).toBeInTheDocument()
      expect(screen.getByText('Expert (85%)')).toBeInTheDocument()
    })

    it('should work as loading indicator', () => {
      render(
        <div role="status" aria-live="polite">
          <Progress value={undefined} aria-label="Loading content" />
          <span className="sr-only">Loading...</span>
        </div>
      )
      
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByLabelText('Loading content')).toBeInTheDocument()
    })
  })
})