/**
 * PricingPlans Component Tests
 * Tests for the pricing plans display with billing intervals and selection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PricingPlans } from '@/components/billing/pricing-plans'

// Mock the formatCurrency utility
vi.mock('@/lib/utils', () => ({
  formatCurrency: vi.fn((amount: number, currency: string) => {
    return `${currency}$${amount.toFixed(2)}`
  }),
  cn: vi.fn((...classes: any[]) => classes.filter(Boolean).join(' '))
}))

describe('PricingPlans Component', () => {
  const mockPlans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for small projects',
      amount: 9.99,
      currency: 'usd',
      interval: 'month' as const,
      stripePriceId: 'price_starter_monthly',
      features: [
        'Up to 3 projects',
        'Basic keyword tracking',
        'Email support'
      ],
      limits: {
        maxProjects: 3,
        maxUsers: 1,
        maxKeywords: 100
      }
    },
    {
      id: 'starter-yearly',
      name: 'Starter',
      description: 'Perfect for small projects',
      amount: 99.99,
      currency: 'usd',
      interval: 'year' as const,
      stripePriceId: 'price_starter_yearly',
      features: [
        'Up to 3 projects',
        'Basic keyword tracking',
        'Email support'
      ],
      limits: {
        maxProjects: 3,
        maxUsers: 1,
        maxKeywords: 100
      }
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Best for growing businesses',
      amount: 29.99,
      currency: 'usd',
      interval: 'month' as const,
      stripePriceId: 'price_pro_monthly',
      features: [
        'Up to 10 projects',
        'Advanced keyword tracking',
        'Priority support',
        'API access'
      ],
      limits: {
        maxProjects: 10,
        maxUsers: 5,
        maxKeywords: 1000
      },
      isPopular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations',
      amount: 99.99,
      currency: 'usd',
      interval: 'month' as const,
      stripePriceId: 'price_enterprise_monthly',
      features: [
        'Unlimited projects',
        'White-label options',
        'Dedicated support',
        'Custom integrations'
      ],
      limits: {
        maxProjects: -1,
        maxUsers: -1,
        maxKeywords: -1
      }
    }
  ]

  const defaultProps = {
    plans: mockPlans,
    onSelectPlan: vi.fn(),
    loading: false,
    showTrialInfo: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render with monthly plans by default', () => {
      render(<PricingPlans {...defaultProps} />)
      
      expect(screen.getByText('Starter')).toBeInTheDocument()
      expect(screen.getByText('Pro')).toBeInTheDocument()
      expect(screen.getByText('Enterprise')).toBeInTheDocument()
      expect(screen.getByText('USD$9.99')).toBeInTheDocument()
      expect(screen.getByText('USD$29.99')).toBeInTheDocument()
    })

    it('should render plan descriptions', () => {
      render(<PricingPlans {...defaultProps} />)
      
      expect(screen.getByText('Perfect for small projects')).toBeInTheDocument()
      expect(screen.getByText('Best for growing businesses')).toBeInTheDocument()
      expect(screen.getByText('For large organizations')).toBeInTheDocument()
    })

    it('should render plan features', () => {
      render(<PricingPlans {...defaultProps} />)
      
      expect(screen.getByText('Up to 3 projects')).toBeInTheDocument()
      expect(screen.getByText('Advanced keyword tracking')).toBeInTheDocument()
      expect(screen.getByText('White-label options')).toBeInTheDocument()
    })

    it('should render plan limits', () => {
      render(<PricingPlans {...defaultProps} />)
      
      expect(screen.getByText('3 projects')).toBeInTheDocument()
      expect(screen.getByText('1 team members')).toBeInTheDocument()
      expect(screen.getByText('100 tracked keywords')).toBeInTheDocument()
      expect(screen.getByText('Unlimited projects')).toBeInTheDocument()
      expect(screen.getByText('Unlimited team members')).toBeInTheDocument()
    })
  })

  describe('Billing Interval Toggle', () => {
    it('should switch to yearly plans when yearly is selected', async () => {
      const user = userEvent.setup()
      render(<PricingPlans {...defaultProps} />)
      
      const yearlyButton = screen.getByRole('button', { name: /yearly/i })
      await user.click(yearlyButton)
      
      expect(screen.getByText('USD$99.99')).toBeInTheDocument()
      expect(screen.queryByText('USD$9.99')).not.toBeInTheDocument()
    })

    it('should show save badge for yearly option', () => {
      render(<PricingPlans {...defaultProps} />)
      
      expect(screen.getByText('Save 20%')).toBeInTheDocument()
    })

    it('should highlight selected billing interval', async () => {
      const user = userEvent.setup()
      render(<PricingPlans {...defaultProps} />)
      
      const monthlyButton = screen.getByRole('button', { name: /monthly/i })
      const yearlyButton = screen.getByRole('button', { name: /yearly/i })
      
      expect(monthlyButton).toHaveClass('bg-background', 'shadow-sm')
      expect(yearlyButton).not.toHaveClass('bg-background')
      
      await user.click(yearlyButton)
      
      expect(yearlyButton).toHaveClass('bg-background', 'shadow-sm')
      expect(monthlyButton).not.toHaveClass('bg-background')
    })

    it('should show savings calculation for yearly plans', async () => {
      const user = userEvent.setup()
      render(<PricingPlans {...defaultProps} />)
      
      const yearlyButton = screen.getByRole('button', { name: /yearly/i })
      await user.click(yearlyButton)
      
      // Should show savings calculation (difference between monthly * 12 and yearly price)
      expect(screen.getByText(/Save USD\$/)).toBeInTheDocument()
    })
  })

  describe('Popular Plan Indicator', () => {
    it('should show popular badge on popular plan', () => {
      render(<PricingPlans {...defaultProps} />)
      
      expect(screen.getByText('Most Popular')).toBeInTheDocument()
    })

    it('should highlight popular plan with different styling', () => {
      render(<PricingPlans {...defaultProps} />)
      
      const proCard = screen.getByText('Pro').closest('[class*="Card"]')
      expect(proCard).toHaveClass('border-primary', 'ring-1', 'ring-primary')
    })
  })

  describe('Current Plan Indicator', () => {
    it('should show current plan badge when currentPlanId matches', () => {
      render(<PricingPlans {...defaultProps} currentPlanId="pro" />)
      
      expect(screen.getByText('Current Plan')).toBeInTheDocument()
    })

    it('should highlight current plan with different styling', () => {
      render(<PricingPlans {...defaultProps} currentPlanId="starter" />)
      
      const starterCard = screen.getByText('Starter').closest('[class*="Card"]')
      expect(starterCard).toHaveClass('border-green-500', 'ring-1', 'ring-green-500')
    })

    it('should disable button for current plan', () => {
      render(<PricingPlans {...defaultProps} currentPlanId="pro" />)
      
      const proButton = screen.getByRole('button', { name: 'Current Plan' })
      expect(proButton).toBeDisabled()
    })
  })

  describe('Plan Selection', () => {
    it('should call onSelectPlan when plan is selected', async () => {
      const user = userEvent.setup()
      const mockOnSelectPlan = vi.fn()
      
      render(<PricingPlans {...defaultProps} onSelectPlan={mockOnSelectPlan} />)
      
      const starterButton = screen.getByRole('button', { name: 'Choose Plan' })
      await user.click(starterButton)
      
      expect(mockOnSelectPlan).toHaveBeenCalledWith('starter', 'price_starter_monthly')
    })

    it('should disable all buttons when loading', () => {
      render(<PricingPlans {...defaultProps} loading={true} />)
      
      const buttons = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Processing...') || 
        btn.textContent?.includes('Choose Plan')
      )
      
      buttons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })

    it('should show processing text when loading', () => {
      render(<PricingPlans {...defaultProps} loading={true} />)
      
      expect(screen.getAllByText('Processing...')).toHaveLength(3) // 3 monthly plans
    })

    it('should use different button variant for popular plan', () => {
      render(<PricingPlans {...defaultProps} />)
      
      const proButton = screen.getByText('Pro').closest('[class*="Card"]')?.querySelector('button')
      expect(proButton).not.toHaveClass('outline') // Should be default variant, not outline
    })
  })

  describe('Trial Information', () => {
    it('should show trial information by default', () => {
      render(<PricingPlans {...defaultProps} />)
      
      expect(screen.getByText('14-Day Free Trial')).toBeInTheDocument()
      expect(screen.getByText(/No credit card required during trial/)).toBeInTheDocument()
    })

    it('should hide trial information when showTrialInfo is false', () => {
      render(<PricingPlans {...defaultProps} showTrialInfo={false} />)
      
      expect(screen.queryByText('14-Day Free Trial')).not.toBeInTheDocument()
    })

    it('should show cancellation policy in trial info', () => {
      render(<PricingPlans {...defaultProps} />)
      
      expect(screen.getByText(/Cancel anytime with 60-day advance notice/)).toBeInTheDocument()
    })
  })

  describe('Transparent Billing Promise', () => {
    it('should show billing transparency section', () => {
      render(<PricingPlans {...defaultProps} />)
      
      expect(screen.getByText('Our Transparent Billing Promise')).toBeInTheDocument()
    })

    it('should list transparency promises', () => {
      render(<PricingPlans {...defaultProps} />)
      
      expect(screen.getByText('60-day advance notice before any price changes')).toBeInTheDocument()
      expect(screen.getByText('Real-time usage tracking and alerts')).toBeInTheDocument()
      expect(screen.getByText('No hidden fees or surprise charges')).toBeInTheDocument()
      expect(screen.getByText('Easy 2-click cancellation anytime')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button labels', () => {
      render(<PricingPlans {...defaultProps} />)
      
      expect(screen.getAllByRole('button', { name: 'Choose Plan' })).toHaveLength(3)
      expect(screen.getByRole('button', { name: /monthly/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /yearly/i })).toBeInTheDocument()
    })

    it('should have proper heading structure', () => {
      render(<PricingPlans {...defaultProps} />)
      
      expect(screen.getByRole('heading', { name: 'Our Transparent Billing Promise' })).toBeInTheDocument()
    })

    it('should have accessible pricing display', () => {
      render(<PricingPlans {...defaultProps} />)
      
      // Price should be clearly associated with plan name
      expect(screen.getByText('USD$9.99')).toBeInTheDocument()
      expect(screen.getByText('per month')).toBeInTheDocument()
    })

    it('should provide keyboard navigation for billing interval', async () => {
      render(<PricingPlans {...defaultProps} />)
      
      const monthlyButton = screen.getByRole('button', { name: /monthly/i })
      const yearlyButton = screen.getByRole('button', { name: /yearly/i })
      
      monthlyButton.focus()
      expect(monthlyButton).toHaveFocus()
      
      fireEvent.keyDown(monthlyButton, { key: 'Tab' })
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive grid classes', () => {
      render(<PricingPlans {...defaultProps} />)
      
      const grid = screen.getByText('Starter').closest('.grid')
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
    })

    it('should have responsive text sizes for headings', () => {
      render(<PricingPlans {...defaultProps} />)
      
      const heading = screen.getByText('Our Transparent Billing Promise')
      expect(heading).toHaveClass('text-lg')
    })

    it('should have responsive billing interval toggle', () => {
      render(<PricingPlans {...defaultProps} />)
      
      const toggleContainer = screen.getByRole('button', { name: /monthly/i }).parentElement
      expect(toggleContainer).toHaveClass('flex', 'items-center', 'space-x-4')
    })
  })

  describe('Edge Cases', () => {
    it('should handle plans with no features', () => {
      const plansWithoutFeatures = [
        {
          ...mockPlans[0],
          features: []
        }
      ]
      
      render(<PricingPlans {...defaultProps} plans={plansWithoutFeatures} />)
      
      expect(screen.getByText('Starter')).toBeInTheDocument()
    })

    it('should handle empty plans array', () => {
      render(<PricingPlans {...defaultProps} plans={[]} />)
      
      // Should not crash and should still show billing interval toggle
      expect(screen.getByRole('button', { name: /monthly/i })).toBeInTheDocument()
    })

    it('should handle missing stripePriceId gracefully', async () => {
      const user = userEvent.setup()
      const plansWithoutPrice = [
        {
          ...mockPlans[0],
          stripePriceId: ''
        }
      ]
      const mockOnSelectPlan = vi.fn()
      
      render(<PricingPlans {...defaultProps} plans={plansWithoutPrice} onSelectPlan={mockOnSelectPlan} />)
      
      const button = screen.getByRole('button', { name: 'Choose Plan' })
      await user.click(button)
      
      expect(mockOnSelectPlan).toHaveBeenCalledWith('starter', '')
    })

    it('should format unlimited values correctly', () => {
      render(<PricingPlans {...defaultProps} />)
      
      // Enterprise plan has -1 limits which should show as "Unlimited"
      expect(screen.getByText('Unlimited projects')).toBeInTheDocument()
      expect(screen.getByText('Unlimited team members')).toBeInTheDocument()
      expect(screen.getByText('Unlimited tracked keywords')).toBeInTheDocument()
    })

    it('should handle large numbers with proper formatting', () => {
      const planWithLargeNumbers = [
        {
          ...mockPlans[0],
          limits: {
            maxProjects: 1000,
            maxUsers: 500,
            maxKeywords: 50000
          }
        }
      ]
      
      render(<PricingPlans {...defaultProps} plans={planWithLargeNumbers} />)
      
      expect(screen.getByText('50,000 tracked keywords')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily when props change', () => {
      const { rerender } = render(<PricingPlans {...defaultProps} />)
      
      // Re-render with same props
      rerender(<PricingPlans {...defaultProps} />)
      
      // Component should still be functional
      expect(screen.getByText('Starter')).toBeInTheDocument()
    })

    it('should handle frequent billing interval changes', async () => {
      const user = userEvent.setup()
      render(<PricingPlans {...defaultProps} />)
      
      const monthlyButton = screen.getByRole('button', { name: /monthly/i })
      const yearlyButton = screen.getByRole('button', { name: /yearly/i })
      
      // Rapid switching should not cause issues
      await user.click(yearlyButton)
      await user.click(monthlyButton)
      await user.click(yearlyButton)
      await user.click(monthlyButton)
      
      expect(screen.getByText('USD$9.99')).toBeInTheDocument()
    })
  })
})