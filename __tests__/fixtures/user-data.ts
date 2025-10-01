/**
 * User Data Fixtures
 * Mock user and authentication data for testing
 */

import type { User, Organization, Subscription } from '@prisma/client'
import type { Session } from 'next-auth'

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    hashedPassword: 'hashed-password-123',
    organizationId: 'org-1',
    role: 'OWNER',
    status: 'ACTIVE',
    emailVerified: new Date('2024-01-01'),
    image: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'user-2',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    hashedPassword: 'hashed-password-456',
    organizationId: 'org-1',
    role: 'ADMIN',
    status: 'ACTIVE',
    emailVerified: new Date('2024-01-02'),
    image: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: 'user-3',
    email: 'mike.johnson@example.com',
    name: 'Mike Johnson',
    hashedPassword: 'hashed-password-789',
    organizationId: 'org-2',
    role: 'OWNER',
    status: 'ACTIVE',
    emailVerified: new Date('2024-01-03'),
    image: null,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-17'),
  },
]

export const mockOrganizations: Organization[] = [
  {
    id: 'org-1',
    name: 'Acme Marketing',
    slug: 'acme-marketing',
    plan: 'PROFESSIONAL',
    status: 'ACTIVE',
    settings: {
      timezone: 'America/New_York',
      currency: 'USD',
      notifications: {
        email: true,
        alerts: true,
        reports: true,
      },
    },
    billingEmail: 'billing@acmemarketing.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'org-2',
    name: 'Tech Startup Inc',
    slug: 'tech-startup-inc',
    plan: 'ENTERPRISE',
    status: 'ACTIVE',
    settings: {
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      notifications: {
        email: true,
        alerts: true,
        reports: false,
      },
    },
    billingEmail: 'finance@techstartup.com',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-17'),
  },
]

export const mockSubscriptions: Subscription[] = [
  {
    id: 'sub-1',
    organizationId: 'org-1',
    stripeCustomerId: 'cus_test123',
    stripeSubscriptionId: 'sub_test123',
    stripePriceId: 'price_professional',
    status: 'ACTIVE',
    currentPeriodStart: new Date('2024-01-01'),
    currentPeriodEnd: new Date('2024-02-01'),
    cancelAtPeriodEnd: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'sub-2',
    organizationId: 'org-2',
    stripeCustomerId: 'cus_test456',
    stripeSubscriptionId: 'sub_test456',
    stripePriceId: 'price_enterprise',
    status: 'ACTIVE',
    currentPeriodStart: new Date('2024-01-03'),
    currentPeriodEnd: new Date('2024-02-03'),
    cancelAtPeriodEnd: false,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-17'),
  },
]

export const mockSessions: Session[] = [
  {
    user: {
      id: 'user-1',
      email: 'john.doe@example.com',
      name: 'John Doe',
      image: null,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  },
  {
    user: {
      id: 'user-2',
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      image: null,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const mockAuthTokens = {
  google: {
    accessToken: 'mock-google-access-token',
    refreshToken: 'mock-google-refresh-token',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    scope: 'https://www.googleapis.com/auth/webmasters https://www.googleapis.com/auth/analytics.readonly',
  },
  nextAuth: {
    sessionToken: 'mock-session-token',
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  },
}

// Helper functions to create test data
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: `user-${Math.random().toString(36).substring(7)}`,
  email: `test-${Date.now()}@example.com`,
  name: 'Test User',
  hashedPassword: 'hashed-test-password',
  organizationId: 'test-org',
  role: 'OWNER',
  status: 'ACTIVE',
  emailVerified: new Date(),
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockSession = (overrides: Partial<Session> = {}): Session => ({
  user: {
    id: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  ...overrides,
})

export const createMockOrganization = (overrides: Partial<Organization> = {}): Organization => ({
  id: `org-${Math.random().toString(36).substring(7)}`,
  name: 'Test Organization',
  slug: 'test-organization',
  plan: 'PROFESSIONAL',
  status: 'ACTIVE',
  settings: {
    timezone: 'America/New_York',
    currency: 'USD',
    notifications: {
      email: true,
      alerts: true,
      reports: true,
    },
  },
  billingEmail: 'billing@test.com',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})