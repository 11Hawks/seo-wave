/**
 * Test Utilities
 * Reusable utilities for testing React components and functionality
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'

// Mock tRPC provider for testing
const MockTRPCProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

// Test wrapper with all necessary providers
interface TestWrapperProps {
  children: React.ReactNode
  session?: Session | null
  queryClient?: QueryClient
}

function TestWrapper({ children, session = null, queryClient }: TestWrapperProps) {
  const client = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  })

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={client}>
        <MockTRPCProvider>
          {children}
        </MockTRPCProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: Session | null
  queryClient?: QueryClient
}

export function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { session, queryClient, ...renderOptions } = options

  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper session={session} queryClient={queryClient}>
        {children}
      </TestWrapper>
    ),
    ...renderOptions,
  })
}

// Mock session data
export const mockSession: Session = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
}

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  organizationId: 'test-org-id',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

// Helper functions for testing
export const testUtils = {
  // Wait for async operations
  waitFor: async (ms: number = 100) => {
    await new Promise(resolve => setTimeout(resolve, ms))
  },

  // Create mock event
  createMockEvent: (overrides = {}) => ({
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    target: { value: '' },
    currentTarget: { value: '' },
    ...overrides,
  }),

  // Generate random test data
  generateId: () => Math.random().toString(36).substring(7),
  generateEmail: () => `test-${Date.now()}@example.com`,
  generateKeyword: () => `test-keyword-${Math.random().toString(36).substring(7)}`,

  // Mock API responses
  mockApiSuccess: (data: any) => ({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }),

  mockApiError: (message: string, code = 400) => ({
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
  }),
}

// Export everything including the original render
export * from '@testing-library/react'
export { customRender as render }