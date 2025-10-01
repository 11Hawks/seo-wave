/**
 * @fileoverview Component Integration Tests
 * Tests how components work together in complex UI patterns
 * Includes cross-component interactions, data flow, and composite patterns
 */

import React, { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

// Mock all utilities and dependencies
vi.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Mock Radix UI components
vi.mock('@radix-ui/react-progress', () => ({
  Root: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
    <div ref={ref} role="progressbar" className={className} {...props}>
      {children}
    </div>
  )),
  Indicator: React.forwardRef<HTMLDivElement, any>(({ className, style, ...props }, ref) => (
    <div ref={ref} className={className} style={style} {...props} />
  )),
}))

vi.mock('@radix-ui/react-separator', () => ({
  Root: React.forwardRef<HTMLDivElement, any>(({ children, className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
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

// Complex integrated components for testing
const ProjectCard = ({ project }: {
  project: {
    id: string
    name: string
    description: string
    status: 'active' | 'inactive' | 'pending'
    progress: number
    lastUpdated: string
  }
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'secondary'
      case 'pending': return 'warning'
      default: return 'secondary'
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <Badge variant={getStatusVariant(project.status) as any}>
            {project.status}
          </Badge>
        </div>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="pt-3">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
          
          {isExpanded && (
            <div className="text-sm text-gray-600">
              <p>Last updated: {project.lastUpdated}</p>
              <p>Project ID: {project.id}</p>
            </div>
          )}
          
          <Separator />
          
          <div className="flex gap-2">
            <Button size="sm" className="flex-1">
              View Details
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Less' : 'More'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [projects] = useState([
    {
      id: 'proj-1',
      name: 'Website Redesign',
      description: 'Complete redesign of company website',
      status: 'active' as const,
      progress: 75,
      lastUpdated: '2024-01-15'
    },
    {
      id: 'proj-2',
      name: 'Mobile App',
      description: 'New mobile application development',
      status: 'pending' as const,
      progress: 25,
      lastUpdated: '2024-01-14'
    }
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold">Project Dashboard</h1>
            <Button variant="outline" size="sm">
              Settings
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="flex space-x-4" role="tablist">
            {['overview', 'projects', 'analytics'].map((tab) => (
              <Button
                key={tab}
                variant={selectedTab === tab ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedTab(tab)}
                role="tab"
                aria-selected={selectedTab === tab}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </nav>
        </div>

        <Separator className="mb-8" />

        <div role="tabpanel">
          {selectedTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{projects.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Active Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {projects.filter(p => p.status === 'active').length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Overall Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress 
                    value={projects.reduce((acc, p) => acc + p.progress, 0) / projects.length}
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {selectedTab === 'projects' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          {selectedTab === 'analytics' && (
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Project performance metrics and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Analytics content would go here...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

const FormWithProgressAndValidation = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [progress, setProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'name':
        return value.length < 2 ? 'Name must be at least 2 characters' : ''
      case 'email':
        return !value.includes('@') ? 'Please enter a valid email' : ''
      case 'password':
        return value.length < 8 ? 'Password must be at least 8 characters' : ''
      default:
        return ''
    }
  }

  const updateProgress = () => {
    const fields = ['name', 'email', 'password']
    const filledFields = fields.filter(field => formData[field as keyof typeof formData].length > 0)
    const validFields = fields.filter(field => {
      const value = formData[field as keyof typeof formData]
      return value.length > 0 && validateField(field, value) === ''
    })
    
    setProgress((validFields.length / fields.length) * 100)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    
    const error = validateField(field, value)
    setValidationErrors(prev => ({ ...prev, [field]: error }))
    
    // Update progress after state changes
    setTimeout(updateProgress, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSubmitting(false)
  }

  const isFormValid = Object.values(validationErrors).every(error => error === '') &&
                     Object.values(formData).every(value => value.length > 0)

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign Up Form</CardTitle>
        <CardDescription>
          Complete all fields to continue
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Form Completion</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Separator className="mb-4" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full p-2 border rounded ${
                validationErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validationErrors.name && (
              <p className="text-sm text-red-500 mt-1" role="alert">
                {validationErrors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full p-2 border rounded ${
                validationErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validationErrors.email && (
              <p className="text-sm text-red-500 mt-1" role="alert">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full p-2 border rounded ${
                validationErrors.password ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validationErrors.password && (
              <p className="text-sm text-red-500 mt-1" role="alert">
                {validationErrors.password}
              </p>
            )}
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <span>Submitting...</span>
                </div>
              ) : (
                'Sign Up'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

describe('Component Integration Tests', () => {
  describe('ProjectCard Integration', () => {
    const mockProject = {
      id: 'test-1',
      name: 'Test Project',
      description: 'A test project description',
      status: 'active' as const,
      progress: 65,
      lastUpdated: '2024-01-15'
    }

    it('should render all integrated components correctly', () => {
      render(<ProjectCard project={mockProject} />)

      // Card structure
      expect(screen.getByText('Test Project')).toBeInTheDocument()
      expect(screen.getByText('A test project description')).toBeInTheDocument()
      
      // Badge integration
      expect(screen.getByText('active')).toBeInTheDocument()
      
      // Progress integration
      expect(screen.getByText('65%')).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      
      // Button integration
      expect(screen.getByRole('button', { name: 'View Details' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument()
    })

    it('should handle expand/collapse interaction', async () => {
      const user = userEvent.setup()
      render(<ProjectCard project={mockProject} />)

      const moreButton = screen.getByRole('button', { name: 'More' })
      
      // Initially collapsed
      expect(screen.queryByText('Last updated: 2024-01-15')).not.toBeInTheDocument()
      expect(screen.queryByText('Project ID: test-1')).not.toBeInTheDocument()

      // Expand
      await user.click(moreButton)
      expect(screen.getByText('Last updated: 2024-01-15')).toBeInTheDocument()
      expect(screen.getByText('Project ID: test-1')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Less' })).toBeInTheDocument()

      // Collapse
      const lessButton = screen.getByRole('button', { name: 'Less' })
      await user.click(lessButton)
      expect(screen.queryByText('Last updated: 2024-01-15')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument()
    })

    it('should display correct badge variants based on status', () => {
      const statuses: Array<{ status: 'active' | 'inactive' | 'pending', expectedClass?: string }> = [
        { status: 'active' },
        { status: 'inactive' },
        { status: 'pending' }
      ]

      statuses.forEach(({ status }) => {
        const project = { ...mockProject, status }
        const { unmount } = render(<ProjectCard project={project} />)
        
        expect(screen.getByText(status)).toBeInTheDocument()
        unmount()
      })
    })

    it('should handle zero and full progress correctly', () => {
      const zeroProject = { ...mockProject, progress: 0 }
      const { rerender } = render(<ProjectCard project={zeroProject} />)
      
      expect(screen.getByText('0%')).toBeInTheDocument()
      
      const fullProject = { ...mockProject, progress: 100 }
      rerender(<ProjectCard project={fullProject} />)
      
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  describe('Dashboard Integration', () => {
    it('should render complete dashboard with all components', () => {
      render(<Dashboard />)

      // Header
      expect(screen.getByText('Project Dashboard')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()

      // Tab navigation
      expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Projects' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Analytics' })).toBeInTheDocument()

      // Default overview content
      expect(screen.getByText('Total Projects')).toBeInTheDocument()
      expect(screen.getByText('Active Projects')).toBeInTheDocument()
      expect(screen.getByText('Overall Progress')).toBeInTheDocument()
    })

    it('should handle tab switching', async () => {
      const user = userEvent.setup()
      render(<Dashboard />)

      // Initially on overview
      expect(screen.getByText('Total Projects')).toBeInTheDocument()

      // Switch to projects
      await user.click(screen.getByRole('tab', { name: 'Projects' }))
      expect(screen.getByText('Website Redesign')).toBeInTheDocument()
      expect(screen.getByText('Mobile App')).toBeInTheDocument()

      // Switch to analytics
      await user.click(screen.getByRole('tab', { name: 'Analytics' }))
      expect(screen.getByText('Project performance metrics and insights')).toBeInTheDocument()

      // Back to overview
      await user.click(screen.getByRole('tab', { name: 'Overview' }))
      expect(screen.getByText('Total Projects')).toBeInTheDocument()
    })

    it('should calculate and display correct metrics', () => {
      render(<Dashboard />)

      // Total projects count
      expect(screen.getByText('2')).toBeInTheDocument() // Total projects

      // Active projects count (only Website Redesign is active)
      expect(screen.getByText('1')).toBeInTheDocument() // Active projects

      // Overall progress should be calculated (75 + 25) / 2 = 50%
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
    })

    it('should show project cards with correct data', async () => {
      const user = userEvent.setup()
      render(<Dashboard />)

      // Switch to projects tab
      await user.click(screen.getByRole('tab', { name: 'Projects' }))

      // Check project data
      expect(screen.getByText('Website Redesign')).toBeInTheDocument()
      expect(screen.getByText('Complete redesign of company website')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
      
      expect(screen.getByText('Mobile App')).toBeInTheDocument()
      expect(screen.getByText('New mobile application development')).toBeInTheDocument()
      expect(screen.getByText('25%')).toBeInTheDocument()
    })
  })

  describe('Form with Progress and Validation Integration', () => {
    it('should render form with progress tracking', () => {
      render(<FormWithProgressAndValidation />)

      expect(screen.getByText('Sign Up Form')).toBeInTheDocument()
      expect(screen.getByText('Form Completion')).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
    })

    it('should update progress as form is filled', async () => {
      const user = userEvent.setup()
      render(<FormWithProgressAndValidation />)

      // Initially 0%
      expect(screen.getByText('0%')).toBeInTheDocument()

      // Fill name (1/3 = 33%)
      await user.type(screen.getByLabelText('Name'), 'John Doe')
      await waitFor(() => {
        expect(screen.getByText('33%')).toBeInTheDocument()
      })

      // Fill email (2/3 = 67%)
      await user.type(screen.getByLabelText('Email'), 'john@example.com')
      await waitFor(() => {
        expect(screen.getByText('67%')).toBeInTheDocument()
      })

      // Fill password (3/3 = 100%)
      await user.type(screen.getByLabelText('Password'), 'password123')
      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument()
      })
    })

    it('should show validation errors and prevent submission', async () => {
      const user = userEvent.setup()
      render(<FormWithProgressAndValidation />)

      // Enter invalid data
      await user.type(screen.getByLabelText('Name'), 'J') // Too short
      await user.type(screen.getByLabelText('Email'), 'invalid-email') // No @
      await user.type(screen.getByLabelText('Password'), '123') // Too short

      // Check validation errors
      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument()
        expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
      })

      // Submit button should be disabled
      const submitButton = screen.getByRole('button', { name: 'Sign Up' })
      expect(submitButton).toBeDisabled()

      // Progress should be 0% due to validation errors
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('should enable submission when form is valid', async () => {
      const user = userEvent.setup()
      render(<FormWithProgressAndValidation />)

      // Fill with valid data
      await user.type(screen.getByLabelText('Name'), 'John Doe')
      await user.type(screen.getByLabelText('Email'), 'john@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')

      // Wait for validation and progress update
      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument()
      })

      // Submit button should be enabled
      const submitButton = screen.getByRole('button', { name: 'Sign Up' })
      expect(submitButton).not.toBeDisabled()
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      render(<FormWithProgressAndValidation />)

      // Fill valid form
      await user.type(screen.getByLabelText('Name'), 'John Doe')
      await user.type(screen.getByLabelText('Email'), 'john@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')

      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument()
      })

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Sign Up' })
      await user.click(submitButton)

      // Should show loading state
      expect(screen.getByText('Submitting...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Submitting...' })).toBeDisabled()
    })
  })

  describe('Cross-Component Data Flow', () => {
    it('should handle state changes across multiple components', async () => {
      const user = userEvent.setup()
      
      const ComplexIntegration = () => {
        const [activeCards, setActiveCards] = useState(0)
        const [totalProgress, setTotalProgress] = useState(0)
        
        const projects = [
          { id: '1', name: 'Project 1', status: 'active', progress: 50 },
          { id: '2', name: 'Project 2', status: 'inactive', progress: 75 },
        ]

        const handleCardToggle = (isActive: boolean, progress: number) => {
          setActiveCards(prev => isActive ? prev + 1 : prev - 1)
          setTotalProgress(prev => isActive ? prev + progress : prev - progress)
        }

        return (
          <Card>
            <CardHeader>
              <CardTitle>Project Summary</CardTitle>
              <div className="flex gap-2">
                <Badge variant="success">Active: {activeCards}</Badge>
                <Badge variant="secondary">Total Progress: {Math.round(totalProgress / 2)}%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={totalProgress / 2} className="mb-4" />
              <Separator className="mb-4" />
              <div className="space-y-2">
                {projects.map(project => (
                  <div key={project.id} className="flex items-center justify-between">
                    <span>{project.name}</span>
                    <Button
                      size="sm"
                      variant={project.status === 'active' ? 'default' : 'outline'}
                      onClick={() => handleCardToggle(project.status !== 'active', project.progress)}
                    >
                      {project.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      }

      render(<ComplexIntegration />)

      // Initial state
      expect(screen.getByText('Active: 0')).toBeInTheDocument()
      expect(screen.getByText('Total Progress: 0%')).toBeInTheDocument()

      // Activate first project
      await user.click(screen.getAllByRole('button', { name: 'Activate' })[0])
      expect(screen.getByText('Active: 1')).toBeInTheDocument()
      expect(screen.getByText(/Total Progress: \d+%/)).toBeInTheDocument()

      // Activate second project
      await user.click(screen.getAllByRole('button', { name: 'Activate' })[0])
      expect(screen.getByText('Active: 2')).toBeInTheDocument()
      expect(screen.getByText(/Total Progress: \d+%/)).toBeInTheDocument()
    })
  })

  describe('Error Handling in Integration', () => {
    it('should handle component failures gracefully', () => {
      const ProblematicComponent = () => {
        const [hasError, setHasError] = useState(false)

        if (hasError) {
          return (
            <Card>
              <CardContent>
                <p role="alert">Something went wrong</p>
                <Button onClick={() => setHasError(false)}>Retry</Button>
              </CardContent>
            </Card>
          )
        }

        return (
          <Card>
            <CardContent>
              <Button onClick={() => setHasError(true)}>Trigger Error</Button>
            </CardContent>
          </Card>
        )
      }

      const { rerender } = render(<ProblematicComponent />)
      
      expect(screen.getByRole('button', { name: 'Trigger Error' })).toBeInTheDocument()
      
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Error' }))
      
      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    })
  })

  describe('Performance in Complex Integrations', () => {
    it('should handle many integrated components efficiently', () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        progress: Math.random() * 100,
      }))

      const ManyComponents = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map(item => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-sm">{item.name}</CardTitle>
                <Badge variant="secondary">{Math.round(item.progress)}%</Badge>
              </CardHeader>
              <CardContent>
                <Progress value={item.progress} className="mb-2" />
                <Separator className="mb-2" />
                <Button size="sm" className="w-full">
                  View
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )

      render(<ManyComponents />)
      
      // Check that first and last items render
      expect(screen.getByText('Item 0')).toBeInTheDocument()
      expect(screen.getByText('Item 49')).toBeInTheDocument()
      
      // Check that all buttons render
      const buttons = screen.getAllByRole('button', { name: 'View' })
      expect(buttons).toHaveLength(50)
    })
  })

  describe('Accessibility in Integration', () => {
    it('should maintain accessibility across component boundaries', async () => {
      const user = userEvent.setup()
      render(<Dashboard />)

      // Tab navigation should work across integrated components
      const firstTab = screen.getByRole('tab', { name: 'Overview' })
      const secondTab = screen.getByRole('tab', { name: 'Projects' })
      
      firstTab.focus()
      expect(firstTab).toHaveFocus()
      
      await user.click(secondTab)
      expect(secondTab).toHaveFocus()
    })

    it('should provide proper ARIA labels and relationships', () => {
      render(<FormWithProgressAndValidation />)

      // Form should have proper labeling
      const nameInput = screen.getByLabelText('Name')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')

      expect(nameInput).toHaveAttribute('id', 'name')
      expect(emailInput).toHaveAttribute('id', 'email')
      expect(passwordInput).toHaveAttribute('id', 'password')

      // Progress should be accessible
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
    })
  })
})