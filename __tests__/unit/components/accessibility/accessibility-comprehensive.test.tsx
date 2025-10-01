/**
 * @fileoverview Comprehensive Accessibility Tests
 * Tests for screen reader compatibility, keyboard navigation, ARIA patterns, and WCAG compliance
 */

import React, { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

// Mock axe-core for accessibility testing
vi.mock('axe-core', () => ({
  run: vi.fn(() => Promise.resolve({ violations: [] }))
}))

// Mock utilities
vi.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}))

// Complex component for accessibility testing
const AccessibleDashboard = () => {
  const [selectedTab, setSelectedTab] = useState(0)
  const [announcements, setAnnouncements] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const tabs = ['Overview', 'Details', 'Settings']

  const handleTabChange = (index: number) => {
    setSelectedTab(index)
    setAnnouncements([`Switched to ${tabs[index]} tab`])
  }

  const handleProgressUpdate = () => {
    setAnnouncements(['Progress updated to 75%'])
  }

  return (
    <div>
      {/* Screen Reader Announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        data-testid="announcements"
      >
        {announcements.map((announcement, index) => (
          <span key={index}>{announcement}</span>
        ))}
      </div>

      {/* Main Navigation */}
      <nav aria-label="Main navigation" role="navigation">
        <ul className="flex space-x-4" role="tablist">
          {tabs.map((tab, index) => (
            <li key={tab} role="presentation">
              <button
                role="tab"
                aria-selected={selectedTab === index}
                aria-controls={`panel-${index}`}
                id={`tab-${index}`}
                tabIndex={selectedTab === index ? 0 : -1}
                onClick={() => handleTabChange(index)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') {
                    e.preventDefault()
                    const nextIndex = (index + 1) % tabs.length
                    handleTabChange(nextIndex)
                    document.getElementById(`tab-${nextIndex}`)?.focus()
                  } else if (e.key === 'ArrowLeft') {
                    e.preventDefault()
                    const prevIndex = index === 0 ? tabs.length - 1 : index - 1
                    handleTabChange(prevIndex)
                    document.getElementById(`tab-${prevIndex}`)?.focus()
                  }
                }}
                className={`px-4 py-2 rounded ${
                  selectedTab === index 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {tab}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Tab Panels */}
      <div className="mt-4">
        {tabs.map((tab, index) => (
          <div
            key={tab}
            role="tabpanel"
            id={`panel-${index}`}
            aria-labelledby={`tab-${index}`}
            hidden={selectedTab !== index}
            tabIndex={0}
          >
            <h2 className="text-xl font-bold">{tab} Content</h2>
            
            {index === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Project Progress</CardTitle>
                  <CardDescription>Current project completion status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress 
                      value={75} 
                      aria-label="Project completion progress"
                      aria-describedby="progress-description"
                    />
                    <p id="progress-description" className="text-sm text-gray-600">
                      75% complete - 3 of 4 milestones achieved
                    </p>
                    <Button 
                      onClick={handleProgressUpdate}
                      aria-describedby="progress-help"
                    >
                      Update Progress
                    </Button>
                    <p id="progress-help" className="sr-only">
                      Click to manually update the project progress
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {index === 1 && (
              <div>
                <p>Detailed information about the project</p>
                <div className="mt-4">
                  <h3 className="font-semibold">Status Indicators</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="success" aria-label="Active status">Active</Badge>
                    <Badge variant="secondary" aria-label="Development phase">In Development</Badge>
                    <Badge variant="destructive" aria-label="2 critical issues">2 Issues</Badge>
                  </div>
                </div>
              </div>
            )}

            {index === 2 && (
              <div>
                <h3 className="font-semibold mb-4">Advanced Settings</h3>
                <div className="space-y-4">
                  <fieldset className="border p-4 rounded">
                    <legend className="font-medium px-2">Notification Preferences</legend>
                    <div className="space-y-2 mt-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked />
                        <span>Email notifications</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" />
                        <span>Push notifications</span>
                      </label>
                    </div>
                  </fieldset>

                  <div>
                    <Button
                      variant="outline"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      aria-expanded={showAdvanced}
                      aria-controls="advanced-options"
                    >
                      {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                    </Button>
                    
                    <div 
                      id="advanced-options"
                      className={`mt-4 p-4 border rounded ${showAdvanced ? 'block' : 'hidden'}`}
                      aria-hidden={!showAdvanced}
                    >
                      <h4 className="font-medium mb-2">Advanced Configuration</h4>
                      <p>Additional settings would appear here</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Skip Links for Screen Readers */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-blue-600 text-white p-2"
      >
        Skip to main content
      </a>
    </div>
  )
}

// Form with comprehensive accessibility
const AccessibleForm = () => {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'email':
        return !value ? 'Email is required' : 
               !value.includes('@') ? 'Please enter a valid email address' : ''
      case 'password':
        return !value ? 'Password is required' :
               value.length < 8 ? 'Password must be at least 8 characters' : ''
      default:
        return ''
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    const newErrors = {
      email: validateField('email', email),
      password: validateField('password', password)
    }
    
    setErrors(newErrors)
    
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Login form">
      <fieldset disabled={loading}>
        <legend className="text-lg font-semibold mb-4">Sign In to Your Account</legend>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : 'email-help'}
              className={`w-full p-2 border rounded ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
            />
            <p id="email-help" className="text-xs text-gray-600 mt-1">
              We'll never share your email with anyone else
            </p>
            {errors.email && (
              <p id="email-error" role="alert" className="text-sm text-red-600 mt-1">
                <span aria-hidden="true">⚠ </span>
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : 'password-help'}
              className={`w-full p-2 border rounded ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your password"
            />
            <p id="password-help" className="text-xs text-gray-600 mt-1">
              Must be at least 8 characters long
            </p>
            {errors.password && (
              <p id="password-error" role="alert" className="text-sm text-red-600 mt-1">
                <span aria-hidden="true">⚠ </span>
                {errors.password}
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            aria-describedby="submit-help"
            className="w-full"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2" aria-hidden="true">⟳</span>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
          <p id="submit-help" className="sr-only">
            Click to submit the login form
          </p>
        </div>
      </fieldset>

      {loading && (
        <div 
          role="status" 
          aria-live="polite" 
          className="mt-4 text-center text-sm text-gray-600"
        >
          <span className="sr-only">Signing in, please wait...</span>
          <div className="flex items-center justify-center">
            <div className="animate-spin mr-2">⟳</div>
            Processing your request...
          </div>
        </div>
      )}
    </form>
  )
}

describe('Comprehensive Accessibility Tests', () => {
  describe('Screen Reader Support', () => {
    it('should provide proper live announcements', async () => {
      const user = userEvent.setup()
      render(<AccessibleDashboard />)

      const detailsTab = screen.getByRole('tab', { name: 'Details' })
      await user.click(detailsTab)

      const announcements = screen.getByTestId('announcements')
      expect(announcements).toHaveTextContent('Switched to Details tab')
    })

    it('should have proper aria-live regions', () => {
      render(<AccessibleDashboard />)

      const liveRegion = screen.getByTestId('announcements')
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true')
    })

    it('should provide descriptive labels for progress indicators', () => {
      render(<AccessibleDashboard />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-label', 'Project completion progress')
      expect(progressBar).toHaveAttribute('aria-describedby', 'progress-description')

      const description = screen.getByText('75% complete - 3 of 4 milestones achieved')
      expect(description).toHaveAttribute('id', 'progress-description')
    })

    it('should provide screen reader only content', () => {
      render(<AccessibleDashboard />)

      const skipLink = screen.getByText('Skip to main content')
      expect(skipLink).toHaveClass('sr-only')

      const helpText = screen.getByText('Click to manually update the project progress')
      expect(helpText).toHaveClass('sr-only')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support arrow key navigation in tabs', async () => {
      const user = userEvent.setup()
      render(<AccessibleDashboard />)

      const overviewTab = screen.getByRole('tab', { name: 'Overview' })
      const detailsTab = screen.getByRole('tab', { name: 'Details' })
      const settingsTab = screen.getByRole('tab', { name: 'Settings' })

      overviewTab.focus()
      expect(overviewTab).toHaveFocus()
      expect(overviewTab).toHaveAttribute('aria-selected', 'true')

      await user.keyboard('{ArrowRight}')
      expect(detailsTab).toHaveFocus()
      expect(detailsTab).toHaveAttribute('aria-selected', 'true')

      await user.keyboard('{ArrowRight}')
      expect(settingsTab).toHaveFocus()
      expect(settingsTab).toHaveAttribute('aria-selected', 'true')

      // Should wrap around
      await user.keyboard('{ArrowRight}')
      expect(overviewTab).toHaveFocus()
      expect(overviewTab).toHaveAttribute('aria-selected', 'true')
    })

    it('should support reverse navigation with left arrow', async () => {
      const user = userEvent.setup()
      render(<AccessibleDashboard />)

      const overviewTab = screen.getByRole('tab', { name: 'Overview' })
      const settingsTab = screen.getByRole('tab', { name: 'Settings' })

      overviewTab.focus()
      await user.keyboard('{ArrowLeft}')
      
      expect(settingsTab).toHaveFocus()
      expect(settingsTab).toHaveAttribute('aria-selected', 'true')
    })

    it('should manage tab index properly for tab list', () => {
      render(<AccessibleDashboard />)

      const overviewTab = screen.getByRole('tab', { name: 'Overview' })
      const detailsTab = screen.getByRole('tab', { name: 'Details' })
      const settingsTab = screen.getByRole('tab', { name: 'Settings' })

      expect(overviewTab).toHaveAttribute('tabindex', '0')
      expect(detailsTab).toHaveAttribute('tabindex', '-1')
      expect(settingsTab).toHaveAttribute('tabindex', '-1')
    })

    it('should make tab panels focusable', () => {
      render(<AccessibleDashboard />)

      const panel = screen.getByRole('tabpanel', { name: 'Overview' })
      expect(panel).toHaveAttribute('tabindex', '0')
    })
  })

  describe('ARIA Patterns and Relationships', () => {
    it('should implement proper tab/tabpanel relationships', () => {
      render(<AccessibleDashboard />)

      const overviewTab = screen.getByRole('tab', { name: 'Overview' })
      const overviewPanel = screen.getByRole('tabpanel', { hidden: false })

      expect(overviewTab).toHaveAttribute('aria-controls', 'panel-0')
      expect(overviewTab).toHaveAttribute('id', 'tab-0')
      expect(overviewPanel).toHaveAttribute('aria-labelledby', 'tab-0')
      expect(overviewPanel).toHaveAttribute('id', 'panel-0')
    })

    it('should properly hide inactive tab panels', async () => {
      const user = userEvent.setup()
      render(<AccessibleDashboard />)

      const detailsTab = screen.getByRole('tab', { name: 'Details' })
      await user.click(detailsTab)

      const overviewPanel = screen.getByRole('tabpanel', { name: 'Overview Content', hidden: true })
      const detailsPanel = screen.getByRole('tabpanel', { name: 'Details Content', hidden: false })

      expect(overviewPanel).toHaveAttribute('hidden')
      expect(detailsPanel).not.toHaveAttribute('hidden')
    })

    it('should use proper expandable/collapsible pattern', async () => {
      const user = userEvent.setup()
      render(<AccessibleDashboard />)

      const settingsTab = screen.getByRole('tab', { name: 'Settings' })
      await user.click(settingsTab)

      const expandButton = screen.getByRole('button', { name: 'Show Advanced Options' })
      expect(expandButton).toHaveAttribute('aria-expanded', 'false')
      expect(expandButton).toHaveAttribute('aria-controls', 'advanced-options')

      const advancedOptions = screen.getByText('Additional settings would appear here').parentElement
      expect(advancedOptions).toHaveAttribute('aria-hidden', 'true')

      await user.click(expandButton)

      expect(expandButton).toHaveAttribute('aria-expanded', 'true')
      expect(expandButton).toHaveTextContent('Hide Advanced Options')
      expect(advancedOptions).toHaveAttribute('aria-hidden', 'false')
    })

    it('should provide proper form labeling and error association', () => {
      render(<AccessibleForm />)

      const emailInput = screen.getByLabelText('Email Address *')
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-help')

      const passwordInput = screen.getByLabelText('Password *')
      expect(passwordInput).toHaveAttribute('aria-describedby', 'password-help')
    })

    it('should associate form errors with inputs', async () => {
      const user = userEvent.setup()
      render(<AccessibleForm />)

      const submitButton = screen.getByRole('button', { name: 'Sign In' })
      await user.click(submitButton)

      await waitFor(() => {
        const emailInput = screen.getByLabelText('Email Address *')
        expect(emailInput).toHaveAttribute('aria-invalid', 'true')
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error')

        const emailError = screen.getByRole('alert')
        expect(emailError).toHaveTextContent('Email is required')
        expect(emailError).toHaveAttribute('id', 'email-error')
      })
    })
  })

  describe('Form Accessibility', () => {
    it('should use fieldset and legend for form grouping', () => {
      render(<AccessibleForm />)

      const fieldset = screen.getByRole('group', { name: 'Sign In to Your Account' })
      expect(fieldset.tagName).toBe('FIELDSET')

      const legend = screen.getByText('Sign In to Your Account')
      expect(legend.tagName).toBe('LEGEND')
    })

    it('should disable form controls during loading', async () => {
      const user = userEvent.setup()
      render(<AccessibleForm />)

      const emailInput = screen.getByLabelText('Email Address *')
      const passwordInput = screen.getByLabelText('Password *')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        const fieldset = screen.getByRole('group')
        expect(fieldset).toBeDisabled()
        expect(submitButton).toBeDisabled()
        expect(submitButton).toHaveTextContent('Signing In...')
      })
    })

    it('should provide loading status announcements', async () => {
      const user = userEvent.setup()
      render(<AccessibleForm />)

      const emailInput = screen.getByLabelText('Email Address *')
      const passwordInput = screen.getByLabelText('Password *')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        const statusMessage = screen.getByRole('status')
        expect(statusMessage).toHaveAttribute('aria-live', 'polite')
        expect(statusMessage).toHaveTextContent('Signing in, please wait...')
      })
    })
  })

  describe('Badge and Status Accessibility', () => {
    it('should provide accessible labels for status badges', async () => {
      const user = userEvent.setup()
      render(<AccessibleDashboard />)

      const detailsTab = screen.getByRole('tab', { name: 'Details' })
      await user.click(detailsTab)

      const activeBadge = screen.getByText('Active')
      const developmentBadge = screen.getByText('In Development')
      const issuesBadge = screen.getByText('2 Issues')

      expect(activeBadge).toHaveAttribute('aria-label', 'Active status')
      expect(developmentBadge).toHaveAttribute('aria-label', 'Development phase')
      expect(issuesBadge).toHaveAttribute('aria-label', '2 critical issues')
    })
  })

  describe('Navigation Accessibility', () => {
    it('should use proper navigation landmarks', () => {
      render(<AccessibleDashboard />)

      const nav = screen.getByRole('navigation', { name: 'Main navigation' })
      expect(nav).toBeInTheDocument()

      const tablist = screen.getByRole('tablist')
      expect(tablist).toBeInTheDocument()
    })

    it('should provide skip links for screen readers', () => {
      render(<AccessibleDashboard />)

      const skipLink = screen.getByRole('link', { name: 'Skip to main content' })
      expect(skipLink).toHaveAttribute('href', '#main-content')
      expect(skipLink).toHaveClass('sr-only')
    })
  })

  describe('Focus Management', () => {
    it('should maintain proper focus visibility', async () => {
      const user = userEvent.setup()
      render(<AccessibleDashboard />)

      const overviewTab = screen.getByRole('tab', { name: 'Overview' })
      await user.tab()
      
      // Should be able to focus on the first tab
      expect(overviewTab).toHaveFocus()
    })

    it('should manage focus when expanding/collapsing content', async () => {
      const user = userEvent.setup()
      render(<AccessibleDashboard />)

      const settingsTab = screen.getByRole('tab', { name: 'Settings' })
      await user.click(settingsTab)

      const expandButton = screen.getByRole('button', { name: 'Show Advanced Options' })
      await user.click(expandButton)

      // Focus should remain on the expand button
      expect(expandButton).toHaveFocus()
      expect(expandButton).toHaveTextContent('Hide Advanced Options')
    })
  })

  describe('Error Handling Accessibility', () => {
    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup()
      render(<AccessibleForm />)

      const submitButton = screen.getByRole('button', { name: 'Sign In' })
      await user.click(submitButton)

      await waitFor(() => {
        const errorAlerts = screen.getAllByRole('alert')
        expect(errorAlerts).toHaveLength(2) // email and password errors
        
        expect(errorAlerts[0]).toHaveTextContent('Email is required')
        expect(errorAlerts[1]).toHaveTextContent('Password is required')
      })
    })

    it('should clear error associations when errors are resolved', async () => {
      const user = userEvent.setup()
      render(<AccessibleForm />)

      const emailInput = screen.getByLabelText('Email Address *')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      await user.click(submitButton)

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true')
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error')
      })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'false')
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-help')
      })
    })
  })
})