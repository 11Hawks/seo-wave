/**
 * @fileoverview Card Component Tests
 * Tests the flexible Card components and their composition
 * Includes accessibility, styling, and component integration
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

// Mock the utils function
vi.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}))

describe('Card Components', () => {
  describe('Card', () => {
    it('should render with default classes', () => {
      render(<Card data-testid="card">Test Card</Card>)
      
      const card = screen.getByTestId('card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass(
        'rounded-lg',
        'border',
        'bg-card',
        'text-card-foreground',
        'shadow-sm'
      )
    })

    it('should accept custom className', () => {
      render(
        <Card data-testid="card" className="custom-class">
          Test Card
        </Card>
      )
      
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-class')
    })

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>()
      render(<Card ref={ref}>Test Card</Card>)
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('should spread additional props', () => {
      render(
        <Card data-testid="card" id="test-id" role="region" aria-label="Card component">
          Test Card
        </Card>
      )
      
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('id', 'test-id')
      expect(card).toHaveAttribute('role', 'region')
      expect(card).toHaveAttribute('aria-label', 'Card component')
    })

    it('should render children correctly', () => {
      render(
        <Card>
          <div data-testid="child">Child Content</div>
        </Card>
      )
      
      expect(screen.getByTestId('child')).toBeInTheDocument()
      expect(screen.getByText('Child Content')).toBeInTheDocument()
    })
  })

  describe('CardHeader', () => {
    it('should render with default classes', () => {
      render(<CardHeader data-testid="header">Header Content</CardHeader>)
      
      const header = screen.getByTestId('header')
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
    })

    it('should accept custom className', () => {
      render(
        <CardHeader data-testid="header" className="custom-header">
          Header Content
        </CardHeader>
      )
      
      const header = screen.getByTestId('header')
      expect(header).toHaveClass('custom-header')
    })

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>()
      render(<CardHeader ref={ref}>Header Content</CardHeader>)
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('should render header content', () => {
      render(
        <CardHeader>
          <h2>Card Title</h2>
          <p>Card Description</p>
        </CardHeader>
      )
      
      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card Description')).toBeInTheDocument()
    })
  })

  describe('CardTitle', () => {
    it('should render as h3 with default classes', () => {
      render(<CardTitle>Test Title</CardTitle>)
      
      const title = screen.getByRole('heading', { level: 3 })
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass(
        'text-2xl',
        'font-semibold',
        'leading-none',
        'tracking-tight'
      )
      expect(title).toHaveTextContent('Test Title')
    })

    it('should accept custom className', () => {
      render(<CardTitle className="custom-title">Test Title</CardTitle>)
      
      const title = screen.getByRole('heading', { level: 3 })
      expect(title).toHaveClass('custom-title')
    })

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLHeadingElement>()
      render(<CardTitle ref={ref}>Test Title</CardTitle>)
      
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement)
      expect(ref.current?.tagName).toBe('H3')
    })

    it('should have proper accessibility', () => {
      render(<CardTitle>Accessible Title</CardTitle>)
      
      const title = screen.getByRole('heading', { name: 'Accessible Title' })
      expect(title).toBeInTheDocument()
    })

    it('should support additional props', () => {
      render(
        <CardTitle id="title-id" data-testid="title">
          Test Title
        </CardTitle>
      )
      
      const title = screen.getByTestId('title')
      expect(title).toHaveAttribute('id', 'title-id')
    })
  })

  describe('CardDescription', () => {
    it('should render as paragraph with default classes', () => {
      render(<CardDescription>Test Description</CardDescription>)
      
      const description = screen.getByText('Test Description')
      expect(description.tagName).toBe('P')
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })

    it('should accept custom className', () => {
      render(
        <CardDescription className="custom-description">
          Test Description
        </CardDescription>
      )
      
      const description = screen.getByText('Test Description')
      expect(description).toHaveClass('custom-description')
    })

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLParagraphElement>()
      render(<CardDescription ref={ref}>Test Description</CardDescription>)
      
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement)
    })

    it('should support additional props', () => {
      render(
        <CardDescription data-testid="description" id="desc-id">
          Test Description
        </CardDescription>
      )
      
      const description = screen.getByTestId('description')
      expect(description).toHaveAttribute('id', 'desc-id')
    })
  })

  describe('CardContent', () => {
    it('should render with default classes', () => {
      render(<CardContent data-testid="content">Content</CardContent>)
      
      const content = screen.getByTestId('content')
      expect(content).toHaveClass('p-6', 'pt-0')
    })

    it('should accept custom className', () => {
      render(
        <CardContent data-testid="content" className="custom-content">
          Content
        </CardContent>
      )
      
      const content = screen.getByTestId('content')
      expect(content).toHaveClass('custom-content')
    })

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>()
      render(<CardContent ref={ref}>Content</CardContent>)
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('should render complex content', () => {
      render(
        <CardContent>
          <div data-testid="nested">Nested Content</div>
          <button>Action Button</button>
        </CardContent>
      )
      
      expect(screen.getByTestId('nested')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument()
    })
  })

  describe('CardFooter', () => {
    it('should render with default classes', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>)
      
      const footer = screen.getByTestId('footer')
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
    })

    it('should accept custom className', () => {
      render(
        <CardFooter data-testid="footer" className="custom-footer">
          Footer
        </CardFooter>
      )
      
      const footer = screen.getByTestId('footer')
      expect(footer).toHaveClass('custom-footer')
    })

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>()
      render(<CardFooter ref={ref}>Footer</CardFooter>)
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('should render footer actions', () => {
      render(
        <CardFooter>
          <button>Cancel</button>
          <button>Save</button>
        </CardFooter>
      )
      
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    })
  })

  describe('Card Composition', () => {
    it('should work together as complete card', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Complete Card</CardTitle>
            <CardDescription>This is a complete card example</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the main content of the card.</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      )
      
      const card = screen.getByTestId('complete-card')
      expect(card).toBeInTheDocument()
      
      expect(screen.getByRole('heading', { name: 'Complete Card' })).toBeInTheDocument()
      expect(screen.getByText('This is a complete card example')).toBeInTheDocument()
      expect(screen.getByText('This is the main content of the card.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
    })

    it('should handle partial composition', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Simple Card</CardTitle>
          </CardHeader>
          <CardContent>
            Simple content
          </CardContent>
        </Card>
      )
      
      expect(screen.getByRole('heading', { name: 'Simple Card' })).toBeInTheDocument()
      expect(screen.getByText('Simple content')).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should handle nested cards', () => {
      render(
        <Card data-testid="outer-card">
          <CardContent>
            <Card data-testid="inner-card">
              <CardContent>Nested card</CardContent>
            </Card>
          </CardContent>
        </Card>
      )
      
      expect(screen.getByTestId('outer-card')).toBeInTheDocument()
      expect(screen.getByTestId('inner-card')).toBeInTheDocument()
      expect(screen.getByText('Nested card')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should support ARIA attributes', () => {
      render(
        <Card
          role="article"
          aria-label="Product card"
          aria-describedby="card-description"
        >
          <CardHeader>
            <CardTitle>Product Name</CardTitle>
            <CardDescription id="card-description">
              Product description
            </CardDescription>
          </CardHeader>
        </Card>
      )
      
      const card = screen.getByRole('article')
      expect(card).toHaveAttribute('aria-label', 'Product card')
      expect(card).toHaveAttribute('aria-describedby', 'card-description')
      
      const description = screen.getByText('Product description')
      expect(description).toHaveAttribute('id', 'card-description')
    })

    it('should maintain proper heading hierarchy', () => {
      render(
        <div>
          <h1>Page Title</h1>
          <h2>Section Title</h2>
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )
      
      const h1 = screen.getByRole('heading', { level: 1 })
      const h2 = screen.getByRole('heading', { level: 2 })
      const h3 = screen.getByRole('heading', { level: 3 })
      
      expect(h1).toBeInTheDocument()
      expect(h2).toBeInTheDocument()
      expect(h3).toBeInTheDocument()
    })

    it('should support keyboard navigation when interactive', () => {
      render(
        <Card tabIndex={0} data-testid="interactive-card">
          <CardContent>Interactive card</CardContent>
        </Card>
      )
      
      const card = screen.getByTestId('interactive-card')
      expect(card).toHaveAttribute('tabindex', '0')
    })
  })

  describe('Styling Integration', () => {
    it('should merge custom classes correctly', () => {
      render(
        <Card className="bg-red-500 shadow-lg" data-testid="styled-card">
          <CardHeader className="bg-blue-500">
            <CardTitle className="text-white">Styled Card</CardTitle>
          </CardHeader>
        </Card>
      )
      
      const card = screen.getByTestId('styled-card')
      expect(card).toHaveClass('bg-red-500', 'shadow-lg')
      // Should also have default classes
      expect(card).toHaveClass('rounded-lg', 'border')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      render(
        <Card
          className={isActive ? 'border-blue-500' : 'border-gray-200'}
          data-testid="conditional-card"
        >
          Content
        </Card>
      )
      
      const card = screen.getByTestId('conditional-card')
      expect(card).toHaveClass('border-blue-500')
      expect(card).not.toHaveClass('border-gray-200')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      render(<Card data-testid="empty-card" />)
      
      const card = screen.getByTestId('empty-card')
      expect(card).toBeInTheDocument()
      expect(card).toBeEmptyDOMElement()
    })

    it('should handle null children gracefully', () => {
      render(
        <Card data-testid="null-children">
          {null}
          {undefined}
          {false}
          Content
        </Card>
      )
      
      const card = screen.getByTestId('null-children')
      expect(card).toBeInTheDocument()
      expect(card).toHaveTextContent('Content')
    })

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(1000)
      render(
        <Card>
          <CardContent data-testid="long-content">{longContent}</CardContent>
        </Card>
      )
      
      const content = screen.getByTestId('long-content')
      expect(content).toHaveTextContent(longContent)
    })

    it('should handle special characters in content', () => {
      render(
        <Card>
          <CardTitle>Title with "quotes" & &lt;symbols&gt;</CardTitle>
          <CardContent>Content with émojis 🚀 and symbols ©®™</CardContent>
        </Card>
      )
      
      expect(screen.getByText('Title with "quotes" & <symbols>')).toBeInTheDocument()
      expect(screen.getByText('Content with émojis 🚀 and symbols ©®™')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const renderSpy = vi.fn()
      
      const TestCard = ({ count }: { count: number }) => {
        renderSpy()
        return (
          <Card>
            <CardContent>Render count: {count}</CardContent>
          </Card>
        )
      }
      
      const { rerender } = render(<TestCard count={1} />)
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      rerender(<TestCard count={1} />)
      expect(renderSpy).toHaveBeenCalledTimes(2)
      
      rerender(<TestCard count={2} />)
      expect(renderSpy).toHaveBeenCalledTimes(3)
    })

    it('should handle rapid prop changes', () => {
      const { rerender } = render(
        <Card className="bg-red-500" data-testid="changing-card">
          Content 1
        </Card>
      )
      
      for (let i = 0; i < 100; i++) {
        rerender(
          <Card className={`bg-red-${500 + i}`} data-testid="changing-card">
            Content {i}
          </Card>
        )
      }
      
      const card = screen.getByTestId('changing-card')
      expect(card).toHaveTextContent('Content 99')
    })
  })

  describe('Component Integration', () => {
    it('should work with form elements', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Form Card</CardTitle>
          </CardHeader>
          <CardContent>
            <form data-testid="card-form">
              <input type="text" placeholder="Name" />
              <textarea placeholder="Description"></textarea>
            </form>
          </CardContent>
          <CardFooter>
            <button type="submit" form="card-form">Submit</button>
          </CardFooter>
        </Card>
      )
      
      expect(screen.getByTestId('card-form')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Description')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
    })

    it('should work with other UI components', () => {
      render(
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Dashboard</CardTitle>
              <button>Settings</button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>Metric 1</div>
              <div>Metric 2</div>
            </div>
          </CardContent>
        </Card>
      )
      
      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
      expect(screen.getByText('Metric 1')).toBeInTheDocument()
      expect(screen.getByText('Metric 2')).toBeInTheDocument()
    })
  })
})