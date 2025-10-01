/**
 * @fileoverview Separator Component Tests
 * Tests the Separator component behavior, orientations, and accessibility
 * Includes comprehensive separator styling and semantic usage tests
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { Separator } from '@/components/ui/separator'

// Mock the utils function
vi.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}))

// Mock Radix UI Separator
vi.mock('@radix-ui/react-separator', () => ({
  Root: React.forwardRef<HTMLDivElement, any>(({ children, className, orientation, decorative, ...props }, ref) => (
    <div
      ref={ref}
      role={decorative ? 'none' : 'separator'}
      aria-orientation={orientation}
      className={className}
      data-orientation={orientation}
      {...props}
    >
      {children}
    </div>
  )),
}))

describe('Separator Component', () => {
  describe('Basic Rendering', () => {
    it('should render separator element', () => {
      render(<Separator data-testid="separator" />)
      
      const separator = screen.getByTestId('separator')
      expect(separator).toBeInTheDocument()
    })

    it('should have default classes', () => {
      render(<Separator data-testid="separator" />)
      
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveClass('shrink-0', 'bg-border')
    })

    it('should accept custom className', () => {
      render(<Separator className="custom-class" data-testid="separator" />)
      
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveClass('custom-class')
    })

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>()
      render(<Separator ref={ref} />)
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('Orientation', () => {
    it('should render horizontal by default', () => {
      render(<Separator data-testid="separator" />)
      
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('data-orientation', 'horizontal')
      expect(separator).toHaveAttribute('aria-orientation', 'horizontal')
      expect(separator).toHaveClass('h-[1px]', 'w-full')
    })

    it('should render horizontal when explicitly set', () => {
      render(<Separator orientation="horizontal" data-testid="separator" />)
      
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('data-orientation', 'horizontal')
      expect(separator).toHaveAttribute('aria-orientation', 'horizontal')
      expect(separator).toHaveClass('h-[1px]', 'w-full')
    })

    it('should render vertical when specified', () => {
      render(<Separator orientation="vertical" data-testid="separator" />)
      
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('data-orientation', 'vertical')
      expect(separator).toHaveAttribute('aria-orientation', 'vertical')
      expect(separator).toHaveClass('h-full', 'w-[1px]')
    })
  })

  describe('Decorative Property', () => {
    it('should be decorative by default', () => {
      render(<Separator data-testid="separator" />)
      
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('role', 'none')
    })

    it('should be decorative when explicitly set to true', () => {
      render(<Separator decorative={true} data-testid="separator" />)
      
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('role', 'none')
    })

    it('should have separator role when decorative is false', () => {
      render(<Separator decorative={false} data-testid="separator" />)
      
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('role', 'separator')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for horizontal separator', () => {
      render(<Separator orientation="horizontal" decorative={false} />)
      
      const separator = screen.getByRole('separator')
      expect(separator).toHaveAttribute('aria-orientation', 'horizontal')
    })

    it('should have proper ARIA attributes for vertical separator', () => {
      render(<Separator orientation="vertical" decorative={false} />)
      
      const separator = screen.getByRole('separator')
      expect(separator).toHaveAttribute('aria-orientation', 'vertical')
    })

    it('should support aria-label for non-decorative separators', () => {
      render(<Separator decorative={false} aria-label="Section divider" />)
      
      const separator = screen.getByRole('separator')
      expect(separator).toHaveAttribute('aria-label', 'Section divider')
    })

    it('should support aria-labelledby', () => {
      render(
        <div>
          <h2 id="section-title">Section Title</h2>
          <Separator decorative={false} aria-labelledby="section-title" />
        </div>
      )
      
      const separator = screen.getByRole('separator')
      expect(separator).toHaveAttribute('aria-labelledby', 'section-title')
    })

    it('should not have role when decorative', () => {
      render(<Separator decorative={true} data-testid="separator" />)
      
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('role', 'none')
    })
  })

  describe('Styling Variations', () => {
    it('should merge custom classes with orientation classes', () => {
      render(
        <Separator
          orientation="horizontal"
          className="bg-red-500 opacity-50"
          data-testid="separator"
        />
      )
      
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveClass('bg-red-500', 'opacity-50')
      expect(separator).toHaveClass('h-[1px]', 'w-full')
    })

    it('should apply different thickness via custom classes', () => {
      render(<Separator className="h-[2px]" data-testid="thick-separator" />)
      
      const separator = screen.getByTestId('thick-separator')
      expect(separator).toHaveClass('h-[2px]')
    })

    it('should handle different colors via custom classes', () => {
      render(<Separator className="bg-blue-200" data-testid="colored-separator" />)
      
      const separator = screen.getByTestId('colored-separator')
      expect(separator).toHaveClass('bg-blue-200')
    })

    it('should handle margin and spacing via custom classes', () => {
      render(<Separator className="mx-4 my-2" data-testid="spaced-separator" />)
      
      const separator = screen.getByTestId('spaced-separator')
      expect(separator).toHaveClass('mx-4', 'my-2')
    })
  })

  describe('HTML Attributes', () => {
    it('should accept standard HTML attributes', () => {
      render(
        <Separator
          id="test-separator"
          data-testid="separator"
          title="Content divider"
          style={{ opacity: 0.5 }}
        />
      )
      
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('id', 'test-separator')
      expect(separator).toHaveAttribute('title', 'Content divider')
      expect(separator).toHaveStyle({ opacity: '0.5' })
    })

    it('should accept data attributes', () => {
      render(
        <Separator
          data-testid="separator"
          data-separator-type="section"
          data-index={1}
        />
      )
      
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('data-separator-type', 'section')
      expect(separator).toHaveAttribute('data-index', '1')
    })
  })

  describe('Component Integration', () => {
    it('should work within content sections', () => {
      render(
        <article>
          <section>
            <h2>Section 1</h2>
            <p>Content for section 1</p>
          </section>
          <Separator data-testid="section-separator" />
          <section>
            <h2>Section 2</h2>
            <p>Content for section 2</p>
          </section>
        </article>
      )
      
      expect(screen.getByText('Section 1')).toBeInTheDocument()
      expect(screen.getByTestId('section-separator')).toBeInTheDocument()
      expect(screen.getByText('Section 2')).toBeInTheDocument()
    })

    it('should work in navigation menus', () => {
      render(
        <nav className="flex items-center space-x-4">
          <a href="/home">Home</a>
          <Separator orientation="vertical" className="h-4" />
          <a href="/about">About</a>
          <Separator orientation="vertical" className="h-4" />
          <a href="/contact">Contact</a>
        </nav>
      )
      
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('About')).toBeInTheDocument()
      expect(screen.getByText('Contact')).toBeInTheDocument()
    })

    it('should work in form layouts', () => {
      render(
        <form className="space-y-4">
          <div>
            <label htmlFor="name">Name</label>
            <input type="text" id="name" />
          </div>
          <Separator />
          <div>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" />
          </div>
        </form>
      )
      
      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
    })

    it('should work in card layouts', () => {
      render(
        <div className="card">
          <div className="card-header">
            <h3>Card Title</h3>
          </div>
          <Separator />
          <div className="card-content">
            <p>Card content goes here</p>
          </div>
          <Separator />
          <div className="card-footer">
            <button>Action</button>
          </div>
        </div>
      )
      
      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card content goes here')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('should handle responsive visibility', () => {
      render(<Separator className="hidden md:block" data-testid="responsive-separator" />)
      
      const separator = screen.getByTestId('responsive-separator')
      expect(separator).toHaveClass('hidden', 'md:block')
    })

    it('should handle responsive orientation changes', () => {
      render(
        <div>
          <Separator orientation="horizontal" className="block md:hidden" data-testid="mobile-separator" />
          <Separator orientation="vertical" className="hidden md:block" data-testid="desktop-separator" />
        </div>
      )
      
      expect(screen.getByTestId('mobile-separator')).toHaveClass('block', 'md:hidden')
      expect(screen.getByTestId('desktop-separator')).toHaveClass('hidden', 'md:block')
    })
  })

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const renderSpy = vi.fn()
      
      const TestSeparator = ({ orientation }: { orientation: 'horizontal' | 'vertical' }) => {
        renderSpy()
        return <Separator orientation={orientation} />
      }
      
      const { rerender } = render(<TestSeparator orientation="horizontal" />)
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      rerender(<TestSeparator orientation="horizontal" />)
      expect(renderSpy).toHaveBeenCalledTimes(2)
      
      rerender(<TestSeparator orientation="vertical" />)
      expect(renderSpy).toHaveBeenCalledTimes(3)
    })

    it('should handle many separators efficiently', () => {
      const separators = Array.from({ length: 50 }, (_, i) => (
        <div key={i}>
          <p>Content {i}</p>
          <Separator data-testid={`separator-${i}`} />
        </div>
      ))
      
      render(<div>{separators}</div>)
      
      expect(screen.getByTestId('separator-0')).toBeInTheDocument()
      expect(screen.getByTestId('separator-49')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty content gracefully', () => {
      render(<Separator data-testid="empty-separator" />)
      
      const separator = screen.getByTestId('empty-separator')
      expect(separator).toBeEmptyDOMElement()
    })

    it('should handle rapid prop changes', () => {
      const orientations: Array<'horizontal' | 'vertical'> = ['horizontal', 'vertical']
      const { rerender } = render(<Separator orientation="horizontal" data-testid="changing-separator" />)
      
      orientations.forEach(orientation => {
        rerender(<Separator orientation={orientation} data-testid="changing-separator" />)
        
        const separator = screen.getByTestId('changing-separator')
        expect(separator).toHaveAttribute('data-orientation', orientation)
      })
    })

    it('should handle invalid orientation gracefully', () => {
      render(<Separator orientation={'invalid' as any} data-testid="invalid-separator" />)
      
      const separator = screen.getByTestId('invalid-separator')
      expect(separator).toBeInTheDocument()
    })
  })

  describe('Real-world Usage Patterns', () => {
    it('should work as breadcrumb separator', () => {
      render(
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2">
          <a href="/">Home</a>
          <Separator orientation="vertical" className="h-4" decorative={true} />
          <a href="/products">Products</a>
          <Separator orientation="vertical" className="h-4" decorative={true} />
          <span aria-current="page">Laptop</span>
        </nav>
      )
      
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Products')).toBeInTheDocument()
      expect(screen.getByText('Laptop')).toBeInTheDocument()
    })

    it('should work as toolbar separator', () => {
      render(
        <div className="toolbar flex items-center space-x-2 p-2 border-b">
          <button>Save</button>
          <button>Copy</button>
          <Separator orientation="vertical" className="h-6" />
          <button>Bold</button>
          <button>Italic</button>
          <Separator orientation="vertical" className="h-6" />
          <button>Undo</button>
          <button>Redo</button>
        </div>
      )
      
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
    })

    it('should work as content section divider', () => {
      render(
        <article className="prose">
          <section>
            <h2>Introduction</h2>
            <p>This is the introduction section.</p>
          </section>
          
          <Separator className="my-8" decorative={false} aria-label="End of introduction" />
          
          <section>
            <h2>Main Content</h2>
            <p>This is the main content section.</p>
          </section>
          
          <Separator className="my-8" decorative={false} aria-label="End of main content" />
          
          <section>
            <h2>Conclusion</h2>
            <p>This is the conclusion section.</p>
          </section>
        </article>
      )
      
      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Main Content')).toBeInTheDocument()
      expect(screen.getByText('Conclusion')).toBeInTheDocument()
      
      const separators = screen.getAllByRole('separator')
      expect(separators).toHaveLength(2)
      expect(separators[0]).toHaveAttribute('aria-label', 'End of introduction')
      expect(separators[1]).toHaveAttribute('aria-label', 'End of main content')
    })

    it('should work in sidebar navigation', () => {
      render(
        <aside className="sidebar w-64 border-r">
          <div className="p-4">
            <h2>Navigation</h2>
          </div>
          <Separator />
          <nav className="p-4 space-y-2">
            <a href="/dashboard">Dashboard</a>
            <a href="/projects">Projects</a>
          </nav>
          <Separator />
          <div className="p-4">
            <h3>Settings</h3>
            <a href="/profile">Profile</a>
            <a href="/preferences">Preferences</a>
          </div>
        </aside>
      )
      
      expect(screen.getByText('Navigation')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
  })

  describe('Theme Integration', () => {
    it('should work with different color schemes', () => {
      render(
        <div className="dark">
          <Separator className="bg-gray-600 dark:bg-gray-300" data-testid="themed-separator" />
        </div>
      )
      
      const separator = screen.getByTestId('themed-separator')
      expect(separator).toHaveClass('bg-gray-600', 'dark:bg-gray-300')
    })

    it('should support custom CSS properties', () => {
      render(
        <Separator
          style={{ '--separator-color': '#ff0000' } as any}
          className="bg-[var(--separator-color)]"
          data-testid="css-var-separator"
        />
      )
      
      const separator = screen.getByTestId('css-var-separator')
      expect(separator).toHaveClass('bg-[var(--separator-color)]')
    })
  })
})