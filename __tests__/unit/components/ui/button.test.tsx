/**
 * Button Component Tests
 * Tests for the reusable Button component with variants and interactions
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import userEvent from '@testing-library/user-event'

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: /click me/i })
      
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center')
      expect(button).not.toBeDisabled()
    })

    it('should render children correctly', () => {
      render(<Button>Test Button Content</Button>)
      expect(screen.getByText('Test Button Content')).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      render(<Button className="custom-class">Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Button variant="default">Default</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Destructive</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground')
    })

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border', 'border-input', 'bg-background')
    })

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground')
    })

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground')
    })

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-primary', 'underline-offset-4')
    })

    it('should render gradient variant', () => {
      render(<Button variant="gradient">Gradient</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('btn-gradient')
    })
  })

  describe('Sizes', () => {
    it('should render default size', () => {
      render(<Button size="default">Default Size</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'px-4', 'py-2')
    })

    it('should render small size', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9', 'px-3')
    })

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-11', 'px-8')
    })

    it('should render extra large size', () => {
      render(<Button size="xl">Extra Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-12', 'px-10', 'text-base')
    })

    it('should render icon size', () => {
      render(<Button size="icon">⚙️</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'w-10')
    })
  })

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })

    it('should show loading state', () => {
      render(<Button loading>Loading</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toBeDisabled()
      expect(screen.getByTestId('loading-spinner') || button.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('should be disabled when loading', () => {
      render(<Button loading>Loading Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should show loading spinner and text', () => {
      render(<Button loading>Save Changes</Button>)
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
      expect(screen.getByRole('button').querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onClick handler when clicked', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      
      render(<Button onClick={handleClick}>Clickable</Button>)
      const button = screen.getByRole('button')
      
      await user.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      
      render(<Button disabled onClick={handleClick}>Disabled</Button>)
      const button = screen.getByRole('button')
      
      await user.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should not call onClick when loading', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      
      render(<Button loading onClick={handleClick}>Loading</Button>)
      const button = screen.getByRole('button')
      
      await user.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should handle keyboard navigation', () => {
      render(<Button>Keyboard Button</Button>)
      const button = screen.getByRole('button')
      
      button.focus()
      expect(button).toHaveFocus()
      
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })
      fireEvent.keyDown(button, { key: ' ', code: 'Space' })
    })
  })

  describe('AsChild Prop', () => {
    it('should render as child component when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )
      
      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
      expect(link).toHaveClass('inline-flex', 'items-center') // Button classes applied to child
    })

    it('should render normal button when asChild is false', () => {
      render(<Button asChild={false}>Normal Button</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button role', () => {
      render(<Button>Accessible Button</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should support aria-label', () => {
      render(<Button aria-label="Custom label">🔄</Button>)
      expect(screen.getByLabelText('Custom label')).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      render(
        <>
          <Button aria-describedby="button-help">Action</Button>
          <div id="button-help">This button performs an action</div>
        </>
      )
      expect(screen.getByRole('button')).toHaveAttribute('aria-describedby', 'button-help')
    })

    it('should have focus-visible outline', () => {
      render(<Button>Focus Test</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('should have touch-target class for mobile accessibility', () => {
      render(<Button>Touch Target</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('touch-target')
    })
  })

  describe('HTML Attributes', () => {
    it('should pass through HTML button attributes', () => {
      render(
        <Button 
          type="submit" 
          name="test-button"
          value="test-value"
          data-testid="custom-button"
        >
          Submit
        </Button>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('name', 'test-button')
      expect(button).toHaveAttribute('value', 'test-value')
      expect(button).toHaveAttribute('data-testid', 'custom-button')
    })

    it('should support form attributes', () => {
      render(<Button form="test-form">Form Button</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('form', 'test-form')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<Button></Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should handle complex children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      )
      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Text')).toBeInTheDocument()
    })

    it('should handle loading with empty children', () => {
      render(<Button loading></Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should maintain accessibility on small screens', () => {
      render(<Button size="sm">Small Button</Button>)
      const button = screen.getByRole('button')
      
      // Button should still be large enough for touch targets
      expect(button).toHaveClass('h-9') // Height should be at least 44px equivalent
    })

    it('should be touch-friendly on mobile', () => {
      render(<Button>Mobile Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('touch-target')
    })
  })
})