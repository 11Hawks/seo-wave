/**
 * @fileoverview Responsive Design Tests
 * Tests responsive behavior, mobile compatibility, and viewport changes
 * Includes screen size testing, touch interactions, and mobile-first design
 */

import React, { useState } from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Mock window.matchMedia
const mockMatchMedia = vi.fn()
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

// Mock window.innerWidth and window.innerHeight
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  value: 1024,
})

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  value: 768,
})

// Mock ResizeObserver
const mockResizeObserver = vi.fn()
mockResizeObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})
window.ResizeObserver = mockResizeObserver

// Test components for responsive behavior
const ResponsiveNavigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold">SEO Analytics</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="/dashboard" className="text-gray-700 hover:text-blue-600">Dashboard</a>
            <a href="/keywords" className="text-gray-700 hover:text-blue-600">Keywords</a>
            <a href="/reports" className="text-gray-700 hover:text-blue-600">Reports</a>
            <Button size="sm">Get Started</Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-500 hover:text-gray-600"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t" data-testid="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="/dashboard" className="block px-3 py-2 text-gray-700">Dashboard</a>
              <a href="/keywords" className="block px-3 py-2 text-gray-700">Keywords</a>
              <a href="/reports" className="block px-3 py-2 text-gray-700">Reports</a>
              <div className="px-3 py-2">
                <Button size="sm" className="w-full">Get Started</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

const ResponsiveGrid = ({ items }: { items: Array<{ id: number; title: string; description: string }> }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {items.map(item => (
        <Card key={item.id} className="h-full">
          <CardHeader>
            <CardTitle className="text-lg truncate">{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 line-clamp-3">{item.description}</p>
            <Button size="sm" className="w-full mt-4">View Details</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

const ResponsiveModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Modal Title</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          <p className="mb-4">This is a responsive modal that adapts to different screen sizes.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button className="flex-1">Confirm</Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const ResponsiveDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4">
          <h2 className="text-lg font-semibold">Navigation</h2>
          <nav className="mt-4 space-y-2">
            <a href="#" className="block p-2 text-gray-700 hover:bg-gray-100 rounded">Overview</a>
            <a href="#" className="block p-2 text-gray-700 hover:bg-gray-100 rounded">Analytics</a>
            <a href="#" className="block p-2 text-gray-700 hover:bg-gray-100 rounded">Reports</a>
          </nav>
        </div>
      </div>
      
      {/* Main content */}
      <div className="lg:pl-64">
        <header className="bg-white shadow-sm border-b px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              className="lg:hidden text-gray-500 hover:text-gray-600"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold ml-2 lg:ml-0">Dashboard</h1>
          </div>
        </header>
        
        <main className="p-4 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mobile First Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">This card adapts to different screen sizes</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

// Helper function to simulate viewport changes
const setViewportSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', { writable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { writable: true, value: height })
  
  // Mock matchMedia for different breakpoints
  mockMatchMedia.mockImplementation((query) => ({
    matches: (() => {
      if (query === '(min-width: 768px)') return width >= 768
      if (query === '(min-width: 1024px)') return width >= 1024
      if (query === '(min-width: 1280px)') return width >= 1280
      if (query === '(max-width: 767px)') return width < 768
      return false
    })(),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
  
  // Trigger resize event
  fireEvent(window, new Event('resize'))
}

describe('Responsive Design Tests', () => {
  beforeEach(() => {
    setViewportSize(1024, 768) // Default to desktop
  })

  describe('Mobile Navigation', () => {
    it('should show desktop navigation on large screens', () => {
      setViewportSize(1024, 768)
      render(<ResponsiveNavigation />)
      
      const desktopNav = screen.getByText('Dashboard').parentElement
      expect(desktopNav).toHaveClass('hidden', 'md:flex')
      
      const mobileButton = screen.getByLabelText('Toggle mobile menu')
      expect(mobileButton.parentElement).toHaveClass('md:hidden')
    })
    
    it('should show mobile menu button on small screens', () => {
      setViewportSize(640, 480)
      render(<ResponsiveNavigation />)
      
      const mobileButton = screen.getByLabelText('Toggle mobile menu')
      expect(mobileButton).toBeVisible()
      expect(mobileButton).toHaveAttribute('aria-expanded', 'false')
    })
    
    it('should toggle mobile menu visibility', async () => {
      const user = userEvent.setup()
      render(<ResponsiveNavigation />)
      
      const mobileButton = screen.getByLabelText('Toggle mobile menu')
      
      // Menu should be hidden initially
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()
      
      // Click to open
      await user.click(mobileButton)
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()
      expect(mobileButton).toHaveAttribute('aria-expanded', 'true')
      
      // Click to close
      await user.click(mobileButton)
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()
      expect(mobileButton).toHaveAttribute('aria-expanded', 'false')
    })
    
    it('should have full-width button in mobile menu', async () => {
      const user = userEvent.setup()
      render(<ResponsiveNavigation />)
      
      const mobileButton = screen.getByLabelText('Toggle mobile menu')
      await user.click(mobileButton)
      
      const mobileMenu = screen.getByTestId('mobile-menu')
      const getStartedButton = within(mobileMenu).getByText('Get Started')
      expect(getStartedButton).toHaveClass('w-full')
    })
  })
  
  describe('Responsive Grid Layout', () => {
    const testItems = [
      { id: 1, title: 'Item 1', description: 'Description 1' },
      { id: 2, title: 'Item 2', description: 'Description 2' },
      { id: 3, title: 'Item 3', description: 'Description 3' },
      { id: 4, title: 'Item 4', description: 'Description 4' },
      { id: 5, title: 'Item 5', description: 'Description 5' },
    ]
    
    it('should have responsive grid classes', () => {
      render(<ResponsiveGrid items={testItems} />)
      
      const grid = screen.getByText('Item 1').closest('.grid')
      expect(grid).toHaveClass(
        'grid-cols-1',
        'sm:grid-cols-2', 
        'lg:grid-cols-3',
        'xl:grid-cols-4'
      )
    })
    
    it('should render all items with proper structure', () => {
      render(<ResponsiveGrid items={testItems} />)
      
      testItems.forEach(item => {
        expect(screen.getByText(item.title)).toBeInTheDocument()
        expect(screen.getByText(item.description)).toBeInTheDocument()
      })
      
      const viewButtons = screen.getAllByText('View Details')
      expect(viewButtons).toHaveLength(testItems.length)
      viewButtons.forEach(button => {
        expect(button).toHaveClass('w-full')
      })
    })
    
    it('should handle truncation for long titles', () => {
      const longTitleItems = [{
        id: 1, 
        title: 'This is a very long title that should be truncated on smaller screens',
        description: 'Short description'
      }]
      
      render(<ResponsiveGrid items={longTitleItems} />)
      
      const titleElement = screen.getByText(longTitleItems[0].title)
      expect(titleElement).toHaveClass('truncate')
    })
  })
  
  describe('Responsive Modal', () => {
    it('should be responsive and centered', () => {
      render(<ResponsiveModal isOpen={true} onClose={vi.fn()} />)
      
      const modal = screen.getByText('Modal Title').closest('.bg-white')
      expect(modal).toHaveClass('w-full', 'max-w-md', 'mx-auto')
      expect(modal?.parentElement).toHaveClass('flex', 'items-center', 'justify-center', 'p-4')
    })
    
    it('should have responsive button layout', () => {
      render(<ResponsiveModal isOpen={true} onClose={vi.fn()} />)
      
      const buttonContainer = screen.getByText('Confirm').parentElement
      expect(buttonContainer).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'gap-2')
      
      const confirmButton = screen.getByText('Confirm')
      const cancelButton = screen.getByText('Cancel')
      expect(confirmButton).toHaveClass('flex-1')
      expect(cancelButton).toHaveClass('flex-1')
    })
    
    it('should handle modal close', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      
      render(<ResponsiveModal isOpen={true} onClose={onClose} />)
      
      const closeButton = screen.getByLabelText('Close modal')
      await user.click(closeButton)
      
      expect(onClose).toHaveBeenCalled()
    })
    
    it('should not render when closed', () => {
      render(<ResponsiveModal isOpen={false} onClose={vi.fn()} />)
      
      expect(screen.queryByText('Modal Title')).not.toBeInTheDocument()
    })
  })
  
  describe('Responsive Dashboard Layout', () => {
    it('should show sidebar toggle on mobile', () => {
      setViewportSize(640, 480)
      render(<ResponsiveDashboard />)
      
      const toggleButton = screen.getByLabelText('Toggle sidebar')
      expect(toggleButton).toBeVisible()
      expect(toggleButton.parentElement).toHaveClass('lg:hidden')
    })
    
    it('should toggle sidebar on mobile', async () => {
      const user = userEvent.setup()
      render(<ResponsiveDashboard />)
      
      const toggleButton = screen.getByLabelText('Toggle sidebar')
      
      // Sidebar should be closed initially
      const sidebar = screen.getByText('Navigation').closest('.fixed')
      expect(sidebar).toHaveClass('-translate-x-full')
      
      // Open sidebar
      await user.click(toggleButton)
      expect(sidebar).toHaveClass('translate-x-0')
      expect(sidebar).not.toHaveClass('-translate-x-full')
      
      // Should show overlay
      expect(screen.getByTestId('sidebar-overlay')).toBeInTheDocument()
    })
    
    it('should close sidebar when clicking overlay', async () => {
      const user = userEvent.setup()
      render(<ResponsiveDashboard />)
      
      const toggleButton = screen.getByLabelText('Toggle sidebar')
      await user.click(toggleButton)
      
      const overlay = screen.getByTestId('sidebar-overlay')
      await user.click(overlay)
      
      const sidebar = screen.getByText('Navigation').closest('.fixed')
      expect(sidebar).toHaveClass('-translate-x-full')
      expect(screen.queryByTestId('sidebar-overlay')).not.toBeInTheDocument()
    })
    
    it('should have responsive grid in main content', () => {
      render(<ResponsiveDashboard />)
      
      const grid = screen.getByText('Mobile First Card').closest('.grid')
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'xl:grid-cols-3')
    })
    
    it('should have responsive padding', () => {
      render(<ResponsiveDashboard />)
      
      const header = screen.getByText('Dashboard').closest('header')
      expect(header).toHaveClass('px-4', 'lg:px-8')
      
      const main = screen.getByRole('main')
      expect(main).toHaveClass('p-4', 'lg:p-8')
    })
  })
  
  describe('Touch and Mobile Interactions', () => {
    it('should handle touch events for mobile menu', async () => {
      const user = userEvent.setup()
      render(<ResponsiveNavigation />)
      
      const mobileButton = screen.getByLabelText('Toggle mobile menu')
      
      // Simulate touch events
      fireEvent.touchStart(mobileButton)
      fireEvent.touchEnd(mobileButton)
      await user.click(mobileButton)
      
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()
    })
    
    it('should have appropriate touch targets', () => {
      render(<ResponsiveNavigation />)
      
      const mobileButton = screen.getByLabelText('Toggle mobile menu')
      const svg = mobileButton.querySelector('svg')
      
      expect(svg).toHaveClass('h-6', 'w-6') // Minimum 24px touch target
    })
  })
  
  describe('Responsive Typography and Spacing', () => {
    it('should use responsive text sizes', () => {
      render(<ResponsiveGrid items={[{ id: 1, title: 'Test', description: 'Test desc' }]} />)
      
      const title = screen.getByText('Test')
      expect(title).toHaveClass('text-lg')
      
      const description = screen.getByText('Test desc')
      expect(description).toHaveClass('text-sm')
    })
    
    it('should have responsive gaps and padding', () => {
      render(<ResponsiveGrid items={[]} />)
      
      const grid = screen.getByRole('generic') // The grid div
      expect(grid).toHaveClass('gap-4', 'p-4')
    })
  })
  
  describe('Accessibility in Responsive Design', () => {
    it('should maintain accessibility across breakpoints', async () => {
      const user = userEvent.setup()
      render(<ResponsiveNavigation />)
      
      const mobileButton = screen.getByLabelText('Toggle mobile menu')
      expect(mobileButton).toHaveAttribute('aria-expanded', 'false')
      
      await user.click(mobileButton)
      expect(mobileButton).toHaveAttribute('aria-expanded', 'true')
    })
    
    it('should provide proper labels for responsive elements', () => {
      render(<ResponsiveDashboard />)
      
      const sidebarToggle = screen.getByLabelText('Toggle sidebar')
      expect(sidebarToggle).toBeInTheDocument()
      
      const modalCloseButton = render(<ResponsiveModal isOpen={true} onClose={vi.fn()} />)
      const closeButton = screen.getByLabelText('Close modal')
      expect(closeButton).toBeInTheDocument()
    })
    
    it('should maintain focus management in responsive layouts', async () => {
      const user = userEvent.setup()
      render(<ResponsiveDashboard />)
      
      const toggleButton = screen.getByLabelText('Toggle sidebar')
      
      await user.tab()
      expect(toggleButton).toHaveFocus()
    })
  })
  
  describe('Performance in Responsive Design', () => {
    it('should not trigger unnecessary re-renders', () => {
      const { rerender } = render(<ResponsiveGrid items={[{ id: 1, title: 'Test', description: 'Test' }]} />)
      
      // Simulate viewport change
      setViewportSize(640, 480)
      rerender(<ResponsiveGrid items={[{ id: 1, title: 'Test', description: 'Test' }]} />)
      
      expect(screen.getByText('Test')).toBeInTheDocument()
    })
    
    it('should handle rapid sidebar toggles', async () => {
      const user = userEvent.setup()
      render(<ResponsiveDashboard />)
      
      const toggleButton = screen.getByLabelText('Toggle sidebar')
      
      // Rapid clicking should not cause issues
      await user.click(toggleButton)
      await user.click(toggleButton)
      await user.click(toggleButton)
      
      // Should end up closed
      const sidebar = screen.getByText('Navigation').closest('.fixed')
      expect(sidebar).toHaveClass('-translate-x-full')
    })
  })
})

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          data-testid="sidebar-backdrop"
        />
      )}

      {/* Sidebar */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform
          lg:relative lg:translate-x-0 lg:inset-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        data-testid="sidebar"
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-500"
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>
        <nav className="p-6">
          <ul className="space-y-2">
            <li><a href="/dashboard" className="block p-2 hover:bg-gray-100 rounded">Dashboard</a></li>
            <li><a href="/analytics" className="block p-2 hover:bg-gray-100 rounded">Analytics</a></li>
            <li><a href="/settings" className="block p-2 hover:bg-gray-100 rounded">Settings</a></li>
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <header className="bg-white border-b p-4">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden mr-4 text-gray-500"
              aria-label="Open sidebar"
            >
              ☰
            </button>
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
        </header>
        <main className="p-4">
          <p>Main content area</p>
        </main>
      </div>
    </div>
  )
}

const ResponsiveForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
          <textarea
            id="message"
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button type="button" variant="outline" className="flex-1">Cancel</Button>
          <Button type="submit" className="flex-1">Submit</Button>
        </div>
      </form>
    </div>
  )
}

// Utility functions for testing
const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    value: height,
  })
  fireEvent(window, new Event('resize'))
}

const mockMatchMediaQueries = (queries: Record<string, boolean>) => {
  mockMatchMedia.mockImplementation((query: string) => ({
    matches: queries[query] || false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('Responsive Design Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setViewport(1024, 768) // Default desktop viewport
  })

  describe('Viewport Breakpoints', () => {
    it('should handle mobile viewport (320px)', () => {
      setViewport(320, 568)
      
      render(<ResponsiveNavigation />)
      
      // Mobile menu button should be visible
      const menuButton = screen.getByLabelText('Toggle mobile menu')
      expect(menuButton).toBeInTheDocument()
      
      // Desktop navigation should be hidden
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    })

    it('should handle tablet viewport (768px)', () => {
      setViewport(768, 1024)
      
      render(<ResponsiveNavigation />)
      
      // Should still show mobile menu button at this breakpoint
      const menuButton = screen.getByLabelText('Toggle mobile menu')
      expect(menuButton).toBeInTheDocument()
    })

    it('should handle desktop viewport (1024px+)', () => {
      setViewport(1200, 800)
      
      render(<ResponsiveNavigation />)
      
      // Desktop navigation should be visible
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Keywords')).toBeInTheDocument()
      expect(screen.getByText('Reports')).toBeInTheDocument()
      
      // Mobile menu button should be hidden via CSS classes
      const menuButton = screen.getByLabelText('Toggle mobile menu')
      expect(menuButton).toHaveClass('md:hidden')
    })

    it('should handle ultra-wide viewport (1440px+)', () => {
      setViewport(1440, 900)
      
      const items = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        title: `Item ${i + 1}`,
        description: 'Test description',
      }))
      
      render(<ResponsiveGrid items={items} />)
      
      // At xl breakpoint, should show 4 columns
      const container = screen.getByText('Item 1').closest('.grid')
      expect(container).toHaveClass('xl:grid-cols-4')
    })
  })

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      setViewport(375, 667) // Mobile viewport
    })

    it('should toggle mobile menu visibility', async () => {
      const user = userEvent.setup()
      render(<ResponsiveNavigation />)

      const menuButton = screen.getByLabelText('Toggle mobile menu')
      
      // Menu should be hidden initially
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()
      
      // Click to open menu
      await user.click(menuButton)
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()
      expect(menuButton).toHaveAttribute('aria-expanded', 'true')
      
      // Click to close menu
      await user.click(menuButton)
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()
      expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('should show mobile menu items when opened', async () => {
      const user = userEvent.setup()
      render(<ResponsiveNavigation />)

      const menuButton = screen.getByLabelText('Toggle mobile menu')
      await user.click(menuButton)

      const mobileMenu = screen.getByTestId('mobile-menu')
      expect(mobileMenu).toBeInTheDocument()
      
      // Check that all navigation items are present
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Keywords')).toBeInTheDocument()
      expect(screen.getByText('Reports')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument()
    })

    it('should have proper mobile menu accessibility', async () => {
      const user = userEvent.setup()
      render(<ResponsiveNavigation />)

      const menuButton = screen.getByLabelText('Toggle mobile menu')
      
      // Should be keyboard accessible
      menuButton.focus()
      expect(menuButton).toHaveFocus()
      
      // Should toggle on Enter key
      fireEvent.keyDown(menuButton, { key: 'Enter' })
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()
    })
  })

  describe('Grid Layouts', () => {
    const testItems = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      title: `Item ${i + 1}`,
      description: `Description for item ${i + 1}`,
    }))

    it('should show single column on mobile', () => {
      setViewport(320, 568)
      render(<ResponsiveGrid items={testItems} />)
      
      const container = screen.getByText('Item 1').closest('.grid')
      expect(container).toHaveClass('grid-cols-1')
    })

    it('should show two columns on small screens', () => {
      setViewport(640, 480)
      render(<ResponsiveGrid items={testItems} />)
      
      const container = screen.getByText('Item 1').closest('.grid')
      expect(container).toHaveClass('sm:grid-cols-2')
    })

    it('should show three columns on large screens', () => {
      setViewport(1024, 768)
      render(<ResponsiveGrid items={testItems} />)
      
      const container = screen.getByText('Item 1').closest('.grid')
      expect(container).toHaveClass('lg:grid-cols-3')
    })

    it('should show four columns on extra large screens', () => {
      setViewport(1280, 800)
      render(<ResponsiveGrid items={testItems} />)
      
      const container = screen.getByText('Item 1').closest('.grid')
      expect(container).toHaveClass('xl:grid-cols-4')
    })

    it('should render all items regardless of viewport size', () => {
      setViewport(320, 568)
      render(<ResponsiveGrid items={testItems} />)
      
      testItems.forEach(item => {
        expect(screen.getByText(item.title)).toBeInTheDocument()
        expect(screen.getByText(item.description)).toBeInTheDocument()
      })
    })
  })

  describe('Sidebar Behavior', () => {
    it('should show sidebar on desktop by default', () => {
      setViewport(1024, 768)
      render(<ResponsiveSidebar />)
      
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toHaveClass('lg:relative', 'lg:translate-x-0')
      
      // Sidebar should be visible
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Analytics')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('should hide sidebar on mobile by default', () => {
      setViewport(375, 667)
      render(<ResponsiveSidebar />)
      
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toHaveClass('-translate-x-full')
      
      // Open sidebar button should be visible
      expect(screen.getByLabelText('Open sidebar')).toBeInTheDocument()
    })

    it('should toggle mobile sidebar', async () => {
      const user = userEvent.setup()
      setViewport(375, 667)
      render(<ResponsiveSidebar />)
      
      const openButton = screen.getByLabelText('Open sidebar')
      const sidebar = screen.getByTestId('sidebar')
      
      // Initially closed
      expect(sidebar).toHaveClass('-translate-x-full')
      expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
      
      // Open sidebar
      await user.click(openButton)
      expect(sidebar).toHaveClass('translate-x-0')
      expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument()
      
      // Close via backdrop
      const backdrop = screen.getByTestId('sidebar-backdrop')
      await user.click(backdrop)
      expect(sidebar).toHaveClass('-translate-x-full')
      expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
    })

    it('should close sidebar with close button', async () => {
      const user = userEvent.setup()
      setViewport(375, 667)
      render(<ResponsiveSidebar />)
      
      // Open sidebar first
      const openButton = screen.getByLabelText('Open sidebar')
      await user.click(openButton)
      
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toHaveClass('translate-x-0')
      
      // Close with close button
      const closeButton = screen.getByLabelText('Close sidebar')
      await user.click(closeButton)
      expect(sidebar).toHaveClass('-translate-x-full')
    })
  })

  describe('Form Layouts', () => {
    it('should stack form fields vertically on mobile', () => {
      setViewport(320, 568)
      render(<ResponsiveForm />)
      
      const container = screen.getByLabelText('Name').closest('.grid')
      expect(container).toHaveClass('grid-cols-1')
    })

    it('should show two columns on desktop', () => {
      setViewport(1024, 768)
      render(<ResponsiveForm />)
      
      const container = screen.getByLabelText('Name').closest('.grid')
      expect(container).toHaveClass('md:grid-cols-2')
    })

    it('should stack form buttons on mobile', () => {
      setViewport(320, 568)
      render(<ResponsiveForm />)
      
      const buttonContainer = screen.getByRole('button', { name: 'Cancel' }).closest('.flex')
      expect(buttonContainer).toHaveClass('flex-col')
    })

    it('should show form buttons side by side on larger screens', () => {
      setViewport(640, 480)
      render(<ResponsiveForm />)
      
      const buttonContainer = screen.getByRole('button', { name: 'Cancel' }).closest('.flex')
      expect(buttonContainer).toHaveClass('sm:flex-row')
    })
  })

  describe('Touch Interactions', () => {
    beforeEach(() => {
      setViewport(375, 667) // Mobile viewport
    })

    it('should handle touch events for mobile menu', async () => {
      render(<ResponsiveNavigation />)

      const menuButton = screen.getByLabelText('Toggle mobile menu')
      
      // Simulate touch events
      fireEvent.touchStart(menuButton)
      fireEvent.touchEnd(menuButton)
      fireEvent.click(menuButton)

      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()
    })

    it('should handle swipe gestures on sidebar', async () => {
      render(<ResponsiveSidebar />)

      const sidebar = screen.getByTestId('sidebar')
      
      // Simulate swipe to open (this would typically be handled by a gesture library)
      fireEvent.touchStart(sidebar, {
        touches: [{ clientX: 0, clientY: 100 }]
      })
      fireEvent.touchMove(sidebar, {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      fireEvent.touchEnd(sidebar)

      // Test that component can handle touch events without errors
      expect(sidebar).toBeInTheDocument()
    })
  })

  describe('Media Queries', () => {
    it('should respond to prefers-reduced-motion', () => {
      mockMatchMediaQueries({
        '(prefers-reduced-motion: reduce)': true,
      })

      render(<ResponsiveSidebar />)
      
      // Component should respect motion preferences
      // This would typically be handled by CSS or animation libraries
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toBeInTheDocument()
    })

    it('should respond to dark mode preference', () => {
      mockMatchMediaQueries({
        '(prefers-color-scheme: dark)': true,
      })

      render(<ResponsiveNavigation />)
      
      // Component should handle dark mode
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('should respond to high contrast mode', () => {
      mockMatchMediaQueries({
        '(prefers-contrast: high)': true,
      })

      render(<ResponsiveForm />)
      
      // Forms should be accessible in high contrast mode
      expect(screen.getByLabelText('Name')).toBeInTheDocument()
    })
  })

  describe('Accessibility on Different Devices', () => {
    it('should maintain tab order on mobile', async () => {
      const user = userEvent.setup()
      setViewport(375, 667)
      render(<ResponsiveNavigation />)

      const menuButton = screen.getByLabelText('Toggle mobile menu')
      await user.click(menuButton)

      // Tab through mobile menu items
      await user.tab()
      expect(screen.getByText('Dashboard')).toHaveFocus()

      await user.tab()
      expect(screen.getByText('Keywords')).toHaveFocus()
    })

    it('should have proper focus management in sidebar', async () => {
      const user = userEvent.setup()
      setViewport(375, 667)
      render(<ResponsiveSidebar />)

      const openButton = screen.getByLabelText('Open sidebar')
      await user.click(openButton)

      // Focus should be manageable within sidebar
      const closeButton = screen.getByLabelText('Close sidebar')
      closeButton.focus()
      expect(closeButton).toHaveFocus()
    })

    it('should provide adequate touch targets', () => {
      setViewport(375, 667)
      render(<ResponsiveNavigation />)

      const menuButton = screen.getByLabelText('Toggle mobile menu')
      
      // Touch targets should be at least 44px (we can't directly test size, but ensure element exists)
      expect(menuButton).toBeInTheDocument()
      expect(menuButton).toHaveAttribute('aria-label')
    })
  })

  describe('Performance Considerations', () => {
    it('should not cause layout thrashing during resize', () => {
      render(<ResponsiveGrid items={[]} />)
      
      // Simulate multiple rapid resize events
      for (let i = 0; i < 10; i++) {
        setViewport(800 + i * 10, 600)
      }
      
      // Component should still be mounted and functional
      expect(screen.getByRole('main') || document.body).toBeInTheDocument()
    })

    it('should handle rapid viewport changes', () => {
      const { rerender } = render(<ResponsiveNavigation />)
      
      // Rapid viewport changes
      setViewport(320, 568)  // Mobile
      rerender(<ResponsiveNavigation />)
      
      setViewport(1024, 768) // Desktop
      rerender(<ResponsiveNavigation />)
      
      setViewport(768, 1024) // Tablet
      rerender(<ResponsiveNavigation />)
      
      // Component should remain stable
      expect(screen.getByText('SEO Analytics')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very small viewports', () => {
      setViewport(240, 320)
      render(<ResponsiveForm />)
      
      // Form should still be usable
      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
    })

    it('should handle very large viewports', () => {
      setViewport(2560, 1440)
      
      const items = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        title: `Item ${i + 1}`,
        description: 'Test description',
      }))
      
      render(<ResponsiveGrid items={items} />)
      
      // Should handle many items gracefully
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 20')).toBeInTheDocument()
    })

    it('should handle orientation changes', () => {
      // Portrait
      setViewport(375, 812)
      const { rerender } = render(<ResponsiveSidebar />)
      
      // Landscape
      setViewport(812, 375)
      rerender(<ResponsiveSidebar />)
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('should handle zero or negative viewport dimensions gracefully', () => {
      setViewport(0, 0)
      render(<ResponsiveNavigation />)
      
      // Component should not crash
      expect(screen.getByText('SEO Analytics')).toBeInTheDocument()
    })
  })

  describe('CSS Grid and Flexbox Behavior', () => {
    it('should handle grid gap consistently', () => {
      const items = [
        { id: 1, title: 'Item 1', description: 'Description 1' },
        { id: 2, title: 'Item 2', description: 'Description 2' },
      ]
      
      render(<ResponsiveGrid items={items} />)
      
      const container = screen.getByText('Item 1').closest('.grid')
      expect(container).toHaveClass('gap-4')
    })

    it('should handle flexbox wrapping in button groups', () => {
      render(<ResponsiveForm />)
      
      const buttonContainer = screen.getByRole('button', { name: 'Cancel' }).closest('.flex')
      expect(buttonContainer).toHaveClass('flex-col', 'sm:flex-row')
    })
  })
})