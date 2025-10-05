import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const originalEnv = { ...process.env }
const mockGetServerSession = vi.fn()

vi.mock('next-auth/next', () => ({
  getServerSession: mockGetServerSession,
}))

vi.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: vi.fn(() => ({})),
}))

vi.mock('next-auth/providers/google', () => ({
  default: vi.fn(() => ({ id: 'google', name: 'Google' })),
}))

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn((config) => ({ id: 'credentials', name: 'Credentials', ...config })),
}))

vi.mock('bcryptjs', () => ({
  compare: vi.fn().mockResolvedValue(true),
}))

const prismaMock = {
  user: {
    findUnique: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(null),
  },
  auditLog: {
    create: vi.fn().mockResolvedValue(null),
  },
  account: {
    upsert: vi.fn().mockResolvedValue(null),
  },
  organization: {
    create: vi.fn().mockResolvedValue({ id: 'org' }),
  },
  organizationMember: {
    create: vi.fn().mockResolvedValue(null),
  },
}

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

vi.mock('@/lib/env', () => ({
  env: {
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
  },
}))

const secureSecret = 'secure-nextauth-secret-value-with-length-32-characters'
const secureJwt = 'secure-jwt-secret-value-with-length-32-characters'
const secureEncryption = 'secure-encryption-key-with-length-32-characters'

function restoreEnv() {
  Object.keys(process.env).forEach((key) => delete process.env[key])
  Object.assign(process.env, originalEnv)
}

function applyEnv(overrides: Record<string, string | undefined>) {
  Object.entries(overrides).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  })
}

describe('Auth configuration security status', () => {
  beforeEach(() => {
    restoreEnv()
    vi.resetModules()
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-id' } })
  })

  afterEach(() => {
    restoreEnv()
  })

  it('disables authentication when preview mode is enabled', async () => {
    applyEnv({
      NODE_ENV: 'production',
      PREVIEW_MODE: 'true',
      DISABLE_AUTH: undefined,
      NEXTAUTH_SECRET: undefined,
      JWT_SECRET: secureJwt,
      ENCRYPTION_KEY: secureEncryption,
      NEXTAUTH_URL: undefined,
    })

    const { authSecurityStatus, getCurrentUser } = await import('../../src/lib/auth')

    expect(authSecurityStatus.isAuthDisabled).toBe(true)
    expect(authSecurityStatus.reason).toBe('preview-mode')

    const user = await getCurrentUser({}, {})
    expect(user).toBeNull()
    expect(mockGetServerSession).not.toHaveBeenCalled()
  })

  it('disables authentication when explicitly instructed', async () => {
    applyEnv({
      NODE_ENV: 'development',
      PREVIEW_MODE: 'false',
      DISABLE_AUTH: 'true',
      NEXTAUTH_SECRET: secureSecret,
      JWT_SECRET: secureJwt,
      ENCRYPTION_KEY: secureEncryption,
      NEXTAUTH_URL: 'http://localhost:3000',
    })

    const { authSecurityStatus } = await import('../../src/lib/auth')

    expect(authSecurityStatus.isAuthDisabled).toBe(true)
    expect(authSecurityStatus.reason).toBe('explicitly-disabled')
  })

  it('throws an error for insecure configuration in production', async () => {
    applyEnv({
      NODE_ENV: 'production',
      PREVIEW_MODE: 'false',
      DISABLE_AUTH: undefined,
      NEXTAUTH_SECRET: undefined,
      JWT_SECRET: secureJwt,
      ENCRYPTION_KEY: secureEncryption,
      NEXTAUTH_URL: 'https://example.com',
    })

    await expect(import('../../src/lib/auth')).rejects.toThrow('NEXTAUTH_SECRET must be set')
  })

  it('keeps authentication enabled when configuration is secure', async () => {
    applyEnv({
      NODE_ENV: 'development',
      PREVIEW_MODE: 'false',
      DISABLE_AUTH: undefined,
      NEXTAUTH_SECRET: secureSecret,
      JWT_SECRET: secureJwt,
      ENCRYPTION_KEY: secureEncryption,
      NEXTAUTH_URL: 'http://localhost:3000',
    })

    const { authSecurityStatus, getCurrentUser } = await import('../../src/lib/auth')

    expect(authSecurityStatus.isAuthDisabled).toBe(false)
    expect(authSecurityStatus.reason).toBeNull()

    await getCurrentUser({}, {})
    expect(mockGetServerSession).toHaveBeenCalled()
  })

  it('treats production preview mode as safe even with missing secrets', async () => {
    applyEnv({
      NODE_ENV: 'production',
      PREVIEW_MODE: 'true',
      DISABLE_AUTH: undefined,
      NEXTAUTH_SECRET: undefined,
      JWT_SECRET: secureJwt,
      ENCRYPTION_KEY: secureEncryption,
      NEXTAUTH_URL: undefined,
    })

    const { authSecurityStatus } = await import('../../src/lib/auth')

    expect(authSecurityStatus.isPreviewMode).toBe(true)
    expect(authSecurityStatus.isAuthDisabled).toBe(true)
    expect(authSecurityStatus.reason).toBe('preview-mode')
  })

  it('normalizes email when authorizing credentials', async () => {
    prismaMock.user.findUnique.mockReset()
    prismaMock.user.findUnique.mockResolvedValue(null)

    applyEnv({
      NODE_ENV: 'development',
      PREVIEW_MODE: 'false',
      DISABLE_AUTH: undefined,
      NEXTAUTH_SECRET: secureSecret,
      JWT_SECRET: secureJwt,
      ENCRYPTION_KEY: secureEncryption,
      NEXTAUTH_URL: 'http://localhost:3000',
    })

    const { authOptions } = await import('../../src/lib/auth')
    const provider = authOptions.providers?.find(
      (candidate: any) => candidate.id === 'credentials'
    ) as any

    expect(provider).toBeDefined()

    await expect(
      provider.authorize(
        { email: 'MixedCase@Example.COM', password: 'password' },
        { headers: {} }
      )
    ).rejects.toThrow('Invalid credentials')

    expect(prismaMock.user.findUnique).toHaveBeenCalled()
    const firstCallArgs = prismaMock.user.findUnique.mock.calls[0]?.[0]
    expect(firstCallArgs?.where?.email).toBe('mixedcase@example.com')
  })
})
