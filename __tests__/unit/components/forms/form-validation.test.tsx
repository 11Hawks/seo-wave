/**
 * @fileoverview Form Validation Tests
 * Tests form validation patterns, input validation, error handling
 * Includes comprehensive validation scenarios and accessibility testing
 */

import React, { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Button } from '@/components/ui/button'

// Mock toast hook
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// Test Form Components for validation scenarios
const EmailForm = ({ onSubmit }: { onSubmit?: (data: { email: string }) => void }) => {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<{ email?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateEmail = (value: string) => {
    if (!value) return 'Email is required'
    if (!value.includes('@')) return 'Please enter a valid email address'
    if (value.length < 3) return 'Email is too short'
    if (value.length > 254) return 'Email is too long'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) return 'Please enter a valid email format'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const emailError = validateEmail(email)
    setErrors({ email: emailError })

    if (!emailError) {
      try {
        await onSubmit?.({ email })
      } catch (error) {
        setErrors({ email: 'Submission failed' })
      }
    }
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} data-testid="email-form">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (errors.email) {
              setErrors({ ...errors, email: validateEmail(e.target.value) })
            }
          }}
          onBlur={() => setErrors({ ...errors, email: validateEmail(email) })}
          className={`w-full p-2 border rounded ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          placeholder="Enter your email"
        />
        {errors.email && (
          <p id="email-error" role="alert" className="text-sm text-red-600">
            {errors.email}
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting || !!errors.email}
        className="mt-4"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  )
}

const PasswordForm = ({ onSubmit }: { onSubmit?: (data: { password: string; confirmPassword: string }) => void }) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [showPassword, setShowPassword] = useState(false)

  const validatePassword = (value: string) => {
    if (!value) return 'Password is required'
    if (value.length < 8) return 'Password must be at least 8 characters'
    if (value.length > 128) return 'Password is too long'
    if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter'
    if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter'
    if (!/[0-9]/.test(value)) return 'Password must contain at least one number'
    if (!/[!@#$%^&*]/.test(value)) return 'Password must contain at least one special character'
    return ''
  }

  const validateConfirmPassword = (value: string, originalPassword: string) => {
    if (!value) return 'Please confirm your password'
    if (value !== originalPassword) return 'Passwords do not match'
    return ''
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const passwordError = validatePassword(password)
    const confirmError = validateConfirmPassword(confirmPassword, password)

    setErrors({
      password: passwordError,
      confirmPassword: confirmError,
    })

    if (!passwordError && !confirmError) {
      onSubmit?.({ password, confirmPassword })
    }
  }

  return (
    <form onSubmit={handleSubmit} data-testid="password-form">
      <div className="space-y-4">
        <div>
          <label htmlFor="password" className="text-sm font-medium">
            Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) {
                  setErrors({ ...errors, password: validatePassword(e.target.value) })
                }
              }}
              className={`w-full p-2 border rounded pr-10 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : 'password-help'}
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2 text-sm"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <p id="password-help" className="text-xs text-gray-600 mt-1">
            Must contain 8+ characters, uppercase, lowercase, number, and special character
          </p>
          {errors.password && (
            <p id="password-error" role="alert" className="text-sm text-red-600">
              {errors.password}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm Password *
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (errors.confirmPassword) {
                setErrors({ ...errors, confirmPassword: validateConfirmPassword(e.target.value, password) })
              }
            }}
            className={`w-full p-2 border rounded ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && (
            <p id="confirm-password-error" role="alert" className="text-sm text-red-600">
              {errors.confirmPassword}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" className="mt-4" disabled={!!errors.password || !!errors.confirmPassword}>
        Set Password
      </Button>
    </form>
  )
}

const ContactForm = ({ onSubmit }: { onSubmit?: (data: any) => Promise<void> }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium',
    agreeToTerms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = (name: string, value: any) => {
    switch (name) {
      case 'name':
        if (!value) return 'Name is required'
        if (value.length < 2) return 'Name must be at least 2 characters'
        if (value.length > 50) return 'Name must be less than 50 characters'
        return ''
      case 'email':
        if (!value) return 'Email is required'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return 'Please enter a valid email address'
        return ''
      case 'subject':
        if (!value) return 'Subject is required'
        if (value.length > 100) return 'Subject must be less than 100 characters'
        return ''
      case 'message':
        if (!value) return 'Message is required'
        if (value.length < 10) return 'Message must be at least 10 characters'
        if (value.length > 1000) return 'Message must be less than 1000 characters'
        return ''
      case 'agreeToTerms':
        if (!value) return 'You must agree to the terms and conditions'
        return ''
      default:
        return ''
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

    setFormData({ ...formData, [name]: newValue })

    if (errors[name]) {
      setErrors({ ...errors, [name]: validateField(name, newValue) })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const newErrors: Record<string, string> = {}
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData])
      if (error) newErrors[key] = error
    })

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      try {
        await onSubmit?.(formData)
      } catch (error) {
        setErrors({ submit: 'Failed to submit form. Please try again.' })
      }
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} data-testid="contact-form">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={(e) => setErrors({ ...errors, name: validateField('name', e.target.value) })}
            className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && <p id="name-error" role="alert" className="text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={(e) => setErrors({ ...errors, email: validateField('email', e.target.value) })}
            className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && <p id="email-error" role="alert" className="text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="subject" className="text-sm font-medium">Subject *</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className={`w-full p-2 border rounded ${errors.subject ? 'border-red-500' : 'border-gray-300'}`}
            aria-invalid={!!errors.subject}
          />
          {errors.subject && <p role="alert" className="text-sm text-red-600">{errors.subject}</p>}
        </div>

        <div>
          <label htmlFor="priority" className="text-sm font-medium">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="text-sm font-medium">Message *</label>
          <textarea
            id="message"
            name="message"
            rows={4}
            value={formData.message}
            onChange={handleChange}
            className={`w-full p-2 border rounded ${errors.message ? 'border-red-500' : 'border-gray-300'}`}
            aria-invalid={!!errors.message}
            placeholder="Enter your message..."
          />
          <div className="text-xs text-gray-500 mt-1">
            {formData.message.length}/1000 characters
          </div>
          {errors.message && <p role="alert" className="text-sm text-red-600">{errors.message}</p>}
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="rounded"
              aria-invalid={!!errors.agreeToTerms}
            />
            <span className="text-sm">I agree to the terms and conditions *</span>
          </label>
          {errors.agreeToTerms && <p role="alert" className="text-sm text-red-600">{errors.agreeToTerms}</p>}
        </div>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p role="alert" className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-4">
        {isSubmitting ? 'Submitting...' : 'Send Message'}
      </Button>
    </form>
  )
}

describe('Form Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Email Form Validation', () => {
    it('should validate required email field', async () => {
      const user = userEvent.setup()
      render(<EmailForm />)

      const submitButton = screen.getByRole('button', { name: 'Submit' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Email is required')
      })
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      render(<EmailForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'invalid-email')
      fireEvent.blur(emailInput)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address')
      })
    })

    it('should validate email length constraints', async () => {
      const user = userEvent.setup()
      render(<EmailForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      
      // Test minimum length
      await user.type(emailInput, 'a@')
      fireEvent.blur(emailInput)
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Email is too short')
      })

      // Test maximum length
      await user.clear(emailInput)
      await user.type(emailInput, 'a'.repeat(250) + '@test.com')
      fireEvent.blur(emailInput)
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Email is too long')
      })
    })

    it('should clear validation errors on valid input', async () => {
      const user = userEvent.setup()
      render(<EmailForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      
      // Enter invalid email
      await user.type(emailInput, 'invalid')
      fireEvent.blur(emailInput)
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Enter valid email
      await user.clear(emailInput)
      await user.type(emailInput, 'valid@email.com')
      
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })

    it('should submit form with valid email', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn()
      render(<EmailForm onSubmit={mockSubmit} />)

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: 'Submit' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({ email: 'test@example.com' })
      })
    })

    it('should handle submission errors', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn().mockRejectedValue(new Error('Server error'))
      render(<EmailForm onSubmit={mockSubmit} />)

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: 'Submit' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Submission failed')
      })
    })
  })

  describe('Password Form Validation', () => {
    it('should validate password requirements', async () => {
      const user = userEvent.setup()
      render(<PasswordForm />)

      const passwordInput = screen.getByLabelText(/^password/i)
      const tests = [
        { input: '', expected: 'Password is required' },
        { input: 'short', expected: 'Password must be at least 8 characters' },
        { input: 'lowercase123!', expected: 'Password must contain at least one uppercase letter' },
        { input: 'UPPERCASE123!', expected: 'Password must contain at least one lowercase letter' },
        { input: 'NoNumbers!', expected: 'Password must contain at least one number' },
        { input: 'NoSpecial123', expected: 'Password must contain at least one special character' },
      ]

      for (const test of tests) {
        await user.clear(passwordInput)
        if (test.input) {
          await user.type(passwordInput, test.input)
        }
        
        const submitButton = screen.getByRole('button', { name: 'Set Password' })
        await user.click(submitButton)

        await waitFor(() => {
          const alerts = screen.getAllByRole('alert')
          const passwordAlert = alerts.find(alert => alert.id === 'password-error')
          if (passwordAlert && test.expected.includes('Password')) {
            expect(passwordAlert).toHaveTextContent(test.expected)
          } else {
            expect(alerts[0]).toHaveTextContent(test.expected)
          }
        })
      }
    })

    it('should validate password confirmation matching', async () => {
      const user = userEvent.setup()
      render(<PasswordForm />)

      const passwordInput = screen.getByLabelText(/^password/i)
      const confirmInput = screen.getByLabelText(/confirm password/i)

      await user.type(passwordInput, 'ValidPass123!')
      await user.type(confirmInput, 'DifferentPass123!')

      const submitButton = screen.getByRole('button', { name: 'Set Password' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match')
      })
    })

    it('should toggle password visibility', async () => {
      const user = userEvent.setup()
      render(<PasswordForm />)

      const passwordInput = screen.getByLabelText(/^password/i)
      const toggleButton = screen.getByLabelText(/show password/i)

      expect(passwordInput).toHaveAttribute('type', 'password')

      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')
      expect(screen.getByLabelText(/hide password/i)).toBeInTheDocument()

      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should submit form with valid passwords', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn()
      render(<PasswordForm onSubmit={mockSubmit} />)

      const passwordInput = screen.getByLabelText(/^password/i)
      const confirmInput = screen.getByLabelText(/confirm password/i)

      const validPassword = 'ValidPassword123!'
      await user.type(passwordInput, validPassword)
      await user.type(confirmInput, validPassword)

      const submitButton = screen.getByRole('button', { name: 'Set Password' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          password: validPassword,
          confirmPassword: validPassword,
        })
      })
    })
  })

  describe('Contact Form Validation', () => {
    it('should validate all required fields', async () => {
      const user = userEvent.setup()
      render(<ContactForm />)

      const submitButton = screen.getByRole('button', { name: 'Send Message' })
      await user.click(submitButton)

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert')
        expect(alerts).toHaveLength(5) // name, email, subject, message, agreeToTerms
        expect(screen.getByText('Name is required')).toBeInTheDocument()
        expect(screen.getByText('Email is required')).toBeInTheDocument()
        expect(screen.getByText('Subject is required')).toBeInTheDocument()
        expect(screen.getByText('Message is required')).toBeInTheDocument()
        expect(screen.getByText('You must agree to the terms and conditions')).toBeInTheDocument()
      })
    })

    it('should validate field length constraints', async () => {
      const user = userEvent.setup()
      render(<ContactForm />)

      // Test name length
      const nameInput = screen.getByLabelText(/name/i)
      await user.type(nameInput, 'A')
      fireEvent.blur(nameInput)
      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument()
      })

      // Test message length
      const messageInput = screen.getByLabelText(/message/i)
      await user.type(messageInput, 'Short')
      await user.click(screen.getByRole('button', { name: 'Send Message' }))
      await waitFor(() => {
        expect(screen.getByText('Message must be at least 10 characters')).toBeInTheDocument()
      })
    })

    it('should show character count for message field', async () => {
      const user = userEvent.setup()
      render(<ContactForm />)

      const messageInput = screen.getByLabelText(/message/i)
      await user.type(messageInput, 'Hello world')

      expect(screen.getByText('11/1000 characters')).toBeInTheDocument()
    })

    it('should validate email format in contact form', async () => {
      const user = userEvent.setup()
      render(<ContactForm />)

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'invalid-email')
      fireEvent.blur(emailInput)

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })
    })

    it('should handle priority selection', async () => {
      const user = userEvent.setup()
      render(<ContactForm />)

      const prioritySelect = screen.getByLabelText(/priority/i)
      await user.selectOptions(prioritySelect, 'high')

      expect(prioritySelect).toHaveValue('high')
    })

    it('should submit form with all valid data', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn()
      render(<ContactForm onSubmit={mockSubmit} />)

      // Fill all required fields
      await user.type(screen.getByLabelText(/name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/subject/i), 'Test Subject')
      await user.type(screen.getByLabelText(/message/i), 'This is a test message that is long enough.')
      await user.click(screen.getByLabelText(/agree to the terms/i))

      const submitButton = screen.getByRole('button', { name: 'Send Message' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Test Subject',
          message: 'This is a test message that is long enough.',
          priority: 'medium',
          agreeToTerms: true,
        })
      })
    })

    it('should handle submission errors gracefully', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn().mockRejectedValue(new Error('Network error'))
      render(<ContactForm onSubmit={mockSubmit} />)

      // Fill required fields
      await user.type(screen.getByLabelText(/name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/subject/i), 'Test Subject')
      await user.type(screen.getByLabelText(/message/i), 'This is a test message that is long enough.')
      await user.click(screen.getByLabelText(/agree to the terms/i))

      const submitButton = screen.getByRole('button', { name: 'Send Message' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to submit form. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Form Accessibility', () => {
    it('should associate labels with form controls', () => {
      render(<EmailForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toHaveAttribute('id', 'email')
    })

    it('should use aria-invalid for validation states', async () => {
      const user = userEvent.setup()
      render(<EmailForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toHaveAttribute('aria-invalid', 'false')

      await user.type(emailInput, 'invalid')
      fireEvent.blur(emailInput)

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('should use aria-describedby for error messages', async () => {
      const user = userEvent.setup()
      render(<EmailForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'invalid')
      fireEvent.blur(emailInput)

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error')
        expect(screen.getByText(/please enter a valid email address/i)).toHaveAttribute('id', 'email-error')
      })
    })

    it('should use role="alert" for error messages', async () => {
      const user = userEvent.setup()
      render(<ContactForm />)

      const submitButton = screen.getByRole('button', { name: 'Send Message' })
      await user.click(submitButton)

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert')
        expect(alerts.length).toBeGreaterThan(0)
      })
    })

    it('should provide help text for password requirements', () => {
      render(<PasswordForm />)

      const helpText = screen.getByText(/must contain 8\+ characters/i)
      expect(helpText).toHaveAttribute('id', 'password-help')

      const passwordInput = screen.getByLabelText(/^password/i)
      expect(passwordInput).toHaveAttribute('aria-describedby', 'password-help')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through form fields', async () => {
      const user = userEvent.setup()
      render(<ContactForm />)

      await user.tab()
      expect(screen.getByLabelText(/name/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText(/email/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText(/subject/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText(/priority/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText(/message/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText(/agree to the terms/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('button', { name: 'Send Message' })).toHaveFocus()
    })

    it('should submit form on Enter key press', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn()
      render(<EmailForm onSubmit={mockSubmit} />)

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'test@example.com')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Real-time Validation', () => {
    it('should validate on blur', async () => {
      const user = userEvent.setup()
      render(<EmailForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'invalid')
      
      // No error should be shown yet
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      
      fireEvent.blur(emailInput)
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('should clear errors on valid input change', async () => {
      const user = userEvent.setup()
      render(<EmailForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      
      // Trigger error
      await user.type(emailInput, 'invalid')
      fireEvent.blur(emailInput)
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Fix the error
      await user.clear(emailInput)
      await user.type(emailInput, 'valid@example.com')

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  describe('Form State Management', () => {
    it('should disable submit button when form is invalid', async () => {
      const user = userEvent.setup()
      render(<EmailForm />)

      const submitButton = screen.getByRole('button', { name: 'Submit' })
      
      // Button should be enabled initially
      expect(submitButton).not.toBeDisabled()
      
      // Enter invalid email
      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'invalid')
      fireEvent.blur(emailInput)

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      let resolveSubmit: (value: any) => void
      const mockSubmit = vi.fn(() => new Promise(resolve => { resolveSubmit = resolve }))
      
      render(<EmailForm onSubmit={mockSubmit} />)

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: 'Submit' })
      await user.click(submitButton)

      expect(screen.getByRole('button', { name: 'Submitting...' })).toBeInTheDocument()
      
      resolveSubmit!({ success: true })
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
      })
    })
  })
})