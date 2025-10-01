/**
 * @fileoverview Badge Component Tests
 * Tests the Badge component variants, styling, and accessibility
 * Includes comprehensive variant testing and user interaction scenarios
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Badge } from '@/components/ui/badge'

// Mock the utility functions
vi.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}))

// Mock class-variance-authority
vi.mock('class-variance-authority', () => ({
  cva: (base: string, config: any) => ({ variant }: { variant?: string }) => {
    const baseClasses = base
    const variantClass = config?.variants?.variant?.[variant || config?.defaultVariants?.variant || 'default'] || ''
    return `${baseClasses} ${variantClass}`.trim()
  },
}))

describe('Badge Component', () => {
  describe('Default Rendering', () => {
    it('should render with default variant', () => {
      render(<Badge data-testid="badge">Default Badge</Badge>)
      
      const badge = screen.getByTestId('badge')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveTextContent('Default Badge')
    })

    it('should render as div element', () => {
      render(<Badge data-testid="badge">Test</Badge>)
      
      const badge = screen.getByTestId('badge')
      expect(badge.tagName).toBe('DIV')
    })

    it('should have default classes', () => {
      render(<Badge data-testid="badge">Test</Badge>)
      
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'rounded-full',
        'border',
        'px-2.5',
        'py-0.5',
        'text-xs',
        'font-semibold',
        'transition-colors',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-ring',
        'focus:ring-offset-2'
      )
    })
  })

  describe('Variant Rendering', () => {
    it('should render default variant correctly', () => {
      render(<Badge variant="default" data-testid="badge">Default</Badge>)
      
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass(
        'border-transparent',
        'bg-primary',
        'text-primary-foreground',
        'hover:bg-primary/80'
      )
    })

    it('should render secondary variant correctly', () => {
      render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>)
      
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass(
        'border-transparent',
        'bg-secondary',
        'text-secondary-foreground',
        'hover:bg-secondary/80'
      )
    })

    it('should render destructive variant correctly', () => {
      render(<Badge variant="destructive" data-testid="badge">Destructive</Badge>)
      
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass(
        'border-transparent',
        'bg-destructive',
        'text-destructive-foreground',
        'hover:bg-destructive/80'
      )
    })

    it('should render outline variant correctly', () => {
      render(<Badge variant="outline" data-testid="badge">Outline</Badge>)
      
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('text-foreground')
    })

    it('should render success variant correctly', () => {
      render(<Badge variant="success" data-testid="badge">Success</Badge>)
      
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass(
        'border-transparent',
        'bg-green-500',
        'text-white',
        'hover:bg-green-500/80'
      )
    })

    it('should render warning variant correctly', () => {
      render(<Badge variant="warning" data-testid="badge">Warning</Badge>)
      
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass(
        'border-transparent',
        'bg-yellow-500',
        'text-white',
        'hover:bg-yellow-500/80'
      )
    })

    it('should render info variant correctly', () => {
      render(<Badge variant="info" data-testid="badge">Info</Badge>)
      
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass(
        'border-transparent',
        'bg-blue-500',
        'text-white',
        'hover:bg-blue-500/80'
      )
    })
  })

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      render(
        <Badge className="custom-class" data-testid="badge">
          Custom
        </Badge>
      )
      
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('custom-class')
    })

    it('should merge custom classes with variant classes', () => {
      render(
        <Badge variant="success" className="m-4 text-lg" data-testid="badge">
          Merged Classes
        </Badge>
      )
      
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('m-4', 'text-lg')
      expect(badge).toHaveClass('bg-green-500', 'text-white')
    })

    it('should handle multiple custom classes', () => {
      render(
        <Badge 
          className="shadow-lg border-2 bg-custom text-custom p-4" 
          data-testid="badge"
        >
          Multiple Classes
        </Badge>
      )
      
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('shadow-lg', 'border-2', 'bg-custom', 'text-custom', 'p-4')
    })
  })

  describe('Content Rendering', () => {
    it('should render text content', () => {
      render(<Badge>Text Badge</Badge>)
      
      expect(screen.getByText('Text Badge')).toBeInTheDocument()
    })

    it('should render with icons', () => {
      render(
        <Badge data-testid="icon-badge">
          <span data-testid="icon">🎯</span>
          Icon Badge
        </Badge>
      )
      
      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByText('Icon Badge')).toBeInTheDocument()
    })

    it('should render with complex children', () => {
      render(
        <Badge>
          <div data-testid="complex-child">
            <span>Complex</span>
            <strong>Content</strong>
          </div>
        </Badge>
      )
      
      expect(screen.getByTestId('complex-child')).toBeInTheDocument()
      expect(screen.getByText('Complex')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should handle empty content', () => {
      render(<Badge data-testid="empty-badge" />)
      
      const badge = screen.getByTestId('empty-badge')
      expect(badge).toBeEmptyDOMElement()
    })

    it('should handle numeric content', () => {
      render(<Badge>42</Badge>)
      
      expect(screen.getByText('42')).toBeInTheDocument()
    })
  })

  describe('HTML Attributes', () => {
    it('should accept standard HTML attributes', () => {
      render(
        <Badge
          id="test-badge"
          data-testid="badge"
          title="Test Badge"
          role="status"
          aria-label="Badge component"
        >
          Attributed Badge
        </Badge>
      )
      
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('id', 'test-badge')
      expect(badge).toHaveAttribute('title', 'Test Badge')
      expect(badge).toHaveAttribute('role', 'status')
      expect(badge).toHaveAttribute('aria-label', 'Badge component')
    })

    it('should handle event handlers', () => {
      const mockClick = vi.fn()
      const mockHover = vi.fn()
      
      render(
        <Badge
          onClick={mockClick}
          onMouseEnter={mockHover}
          data-testid="clickable-badge"
        >
          Clickable Badge
        </Badge>
      )
      
      const badge = screen.getByTestId('clickable-badge')
      fireEvent.click(badge)
      fireEvent.mouseEnter(badge)
      
      expect(mockClick).toHaveBeenCalledTimes(1)
      expect(mockHover).toHaveBeenCalledTimes(1)
    })

    it('should support data attributes', () => {
      render(
        <Badge
          data-testid="badge"
          data-value="test-value"
          data-count={5}
        >
          Data Badge
        </Badge>
      )
      
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-value', 'test-value')
      expect(badge).toHaveAttribute('data-count', '5')
    })
  })

  describe('Accessibility', () => {
    it('should be focusable when interactive', () => {
      render(
        <Badge tabIndex={0} data-testid="focusable-badge">
          Focusable Badge
        </Badge>
      )
      
      const badge = screen.getByTestId('focusable-badge')
      expect(badge).toHaveAttribute('tabindex', '0')
      
      badge.focus()
      expect(badge).toHaveFocus()
    })

    it('should support ARIA attributes', () => {
      render(
        <Badge
          role="status"
          aria-live="polite"
          aria-label="Status: Active"
          data-testid="aria-badge"
        >
          Active
        </Badge>
      )
      
      const badge = screen.getByTestId('aria-badge')
      expect(badge).toHaveAttribute('role', 'status')
      expect(badge).toHaveAttribute('aria-live', 'polite')
      expect(badge).toHaveAttribute('aria-label', 'Status: Active')
    })

    it('should provide screen reader friendly content', () => {
      render(
        <Badge aria-label="5 unread notifications">
          5
        </Badge>
      )
      
      const badge = screen.getByLabelText('5 unread notifications')
      expect(badge).toBeInTheDocument()
    })

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup()
      const mockClick = vi.fn()
      
      render(
        <div>
          <button>Previous</button>
          <Badge
            tabIndex={0}
            onClick={mockClick}
            onKeyDown={(e) => e.key === 'Enter' && mockClick()}
            data-testid="keyboard-badge"
          >
            Keyboard Badge
          </Badge>
          <button>Next</button>
        </div>
      )
      
      await user.tab()
      await user.tab()
      
      const badge = screen.getByTestId('keyboard-badge')
      expect(badge).toHaveFocus()
      
      await user.keyboard('{Enter}')
      expect(mockClick).toHaveBeenCalled()
    })
  })

  describe('State Management', () => {
    it('should handle dynamic variant changes', () => {
      const { rerender } = render(
        <Badge variant="default" data-testid="dynamic-badge">
          Dynamic
        </Badge>
      )
      
      const badge = screen.getByTestId('dynamic-badge')
      expect(badge).toHaveClass('bg-primary')
      
      rerender(
        <Badge variant="success" data-testid="dynamic-badge">
          Dynamic
        </Badge>
      )
      
      expect(badge).toHaveClass('bg-green-500')
      expect(badge).not.toHaveClass('bg-primary')
    })

    it('should handle dynamic content changes', () => {
      const { rerender } = render(
        <Badge data-testid="content-badge">Initial</Badge>
      )
      
      expect(screen.getByText('Initial')).toBeInTheDocument()
      
      rerender(
        <Badge data-testid="content-badge">Updated</Badge>
      )
      
      expect(screen.getByText('Updated')).toBeInTheDocument()
      expect(screen.queryByText('Initial')).not.toBeInTheDocument()
    })

    it('should handle conditional rendering', () => {
      const { rerender } = render(
        <div>
          {true && <Badge data-testid="conditional-badge">Visible</Badge>}
        </div>
      )
      
      expect(screen.getByTestId('conditional-badge')).toBeInTheDocument()
      
      rerender(
        <div>
          {false && <Badge data-testid="conditional-badge">Visible</Badge>}
        </div>
      )
      
      expect(screen.queryByTestId('conditional-badge')).not.toBeInTheDocument()
    })
  })

  describe('Interactive Behavior', () => {
    it('should respond to click events', async () => {
      const user = userEvent.setup()
      const mockClick = vi.fn()
      
      render(
        <Badge onClick={mockClick} data-testid="clickable">
          Click me
        </Badge>
      )
      
      const badge = screen.getByTestId('clickable')
      await user.click(badge)
      
      expect(mockClick).toHaveBeenCalledTimes(1)
    })

    it('should handle hover states', async () => {
      const user = userEvent.setup()
      const mockEnter = vi.fn()
      const mockLeave = vi.fn()
      
      render(
        <Badge
          onMouseEnter={mockEnter}
          onMouseLeave={mockLeave}
          data-testid="hoverable"
        >
          Hover me
        </Badge>
      )
      
      const badge = screen.getByTestId('hoverable')
      await user.hover(badge)
      expect(mockEnter).toHaveBeenCalledTimes(1)
      
      await user.unhover(badge)
      expect(mockLeave).toHaveBeenCalledTimes(1)
    })

    it('should support focus and blur events', () => {
      const mockFocus = vi.fn()
      const mockBlur = vi.fn()
      
      render(
        <Badge
          tabIndex={0}
          onFocus={mockFocus}
          onBlur={mockBlur}
          data-testid="focusable"
        >
          Focus me
        </Badge>
      )
      
      const badge = screen.getByTestId('focusable')
      fireEvent.focus(badge)
      expect(mockFocus).toHaveBeenCalledTimes(1)
      
      fireEvent.blur(badge)
      expect(mockBlur).toHaveBeenCalledTimes(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle null children gracefully', () => {
      render(
        <Badge data-testid="null-children">
          {null}
          {undefined}
          {false && 'hidden'}
          Visible
        </Badge>
      )
      
      const badge = screen.getByTestId('null-children')
      expect(badge).toHaveTextContent('Visible')
    })

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(100)
      render(<Badge data-testid="long-content">{longContent}</Badge>)
      
      const badge = screen.getByTestId('long-content')
      expect(badge).toHaveTextContent(longContent)
    })

    it('should handle special characters', () => {
      render(
        <Badge data-testid="special-chars">
          Special: @#$%^&*()_+ "quotes" & &lt;symbols&gt;
        </Badge>
      )
      
      const badge = screen.getByTestId('special-chars')
      expect(badge).toHaveTextContent('Special: @#$%^&*()_+ "quotes" & <symbols>')
    })

    it('should handle rapid prop changes', () => {
      const variants = ['default', 'secondary', 'destructive', 'success', 'warning', 'info']
      const { rerender } = render(<Badge variant="default" data-testid="rapid">Test</Badge>)
      
      variants.forEach(variant => {
        rerender(
          <Badge variant={variant as any} data-testid="rapid">
            Test
          </Badge>
        )
        
        const badge = screen.getByTestId('rapid')
        expect(badge).toBeInTheDocument()
      })
    })

    it('should handle zero and falsy values', () => {
      render(
        <div>
          <Badge data-testid="zero">0</Badge>
          <Badge data-testid="false">{false}</Badge>
          <Badge data-testid="empty-string">{''}</Badge>
        </div>
      )
      
      expect(screen.getByTestId('zero')).toHaveTextContent('0')
      expect(screen.getByTestId('false')).toBeEmptyDOMElement()
      expect(screen.getByTestId('empty-string')).toBeEmptyDOMElement()
    })
  })

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const renderSpy = vi.fn()
      
      const TestBadge = ({ count }: { count: number }) => {
        renderSpy()
        return <Badge>Count: {count}</Badge>
      }
      
      const { rerender } = render(<TestBadge count={1} />)
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      rerender(<TestBadge count={1} />)
      expect(renderSpy).toHaveBeenCalledTimes(2)
      
      rerender(<TestBadge count={2} />)
      expect(renderSpy).toHaveBeenCalledTimes(3)
    })

    it('should handle many badge instances efficiently', () => {
      const badges = Array.from({ length: 100 }, (_, i) => (
        <Badge key={i} variant={i % 2 === 0 ? 'default' : 'secondary'}>
          Badge {i}
        </Badge>
      ))
      
      render(<div>{badges}</div>)
      
      expect(screen.getAllByText(/Badge \d+/)).toHaveLength(100)
    })
  })

  describe('Component Integration', () => {
    it('should work within other components', () => {
      render(
        <div className="flex space-x-2">
          <Badge variant="success">Online</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="destructive">Offline</Badge>
        </div>
      )
      
      expect(screen.getByText('Online')).toBeInTheDocument()
      expect(screen.getByText('Pending')).toBeInTheDocument()
      expect(screen.getByText('Offline')).toBeInTheDocument()
    })

    it('should work as part of complex UI patterns', () => {
      render(
        <div className="card">
          <div className="card-header">
            <h3>User Profile</h3>
            <Badge variant="success">Premium</Badge>
          </div>
          <div className="card-content">
            <p>User details...</p>
            <div className="badges">
              <Badge variant="outline">React</Badge>
              <Badge variant="outline">TypeScript</Badge>
              <Badge variant="outline">Testing</Badge>
            </div>
          </div>
        </div>
      )
      
      expect(screen.getByText('User Profile')).toBeInTheDocument()
      expect(screen.getByText('Premium')).toBeInTheDocument()
      expect(screen.getByText('React')).toBeInTheDocument()
      expect(screen.getByText('TypeScript')).toBeInTheDocument()
      expect(screen.getByText('Testing')).toBeInTheDocument()
    })
  })
})