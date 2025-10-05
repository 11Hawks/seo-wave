/**
 * Authentication security validation helpers
 * Evaluate environment configuration for NextAuth and related secrets.
 */

export interface AuthSecurityReport {
  warnings: string[]
  errors: string[]
}

export interface AuthSecurityOptions {
  isPreviewMode?: boolean
  nodeEnv?: string
  minSecretLength?: number
}

const DEFAULT_JWT_SECRET = 'development-jwt-secret-key-32-characters'
const DEFAULT_ENCRYPTION_KEY = 'development-encryption-key-32-chars'

/**
 * Evaluate authentication-related environment variables and surface warnings or errors.
 */
export function evaluateAuthSecurity(
  env: NodeJS.ProcessEnv,
  options: AuthSecurityOptions = {}
): AuthSecurityReport {
  const warnings: string[] = []
  const errors: string[] = []

  const {
    isPreviewMode = false,
    nodeEnv = env.NODE_ENV ?? 'development',
    minSecretLength = 32,
  } = options

  const isProduction = nodeEnv === 'production'
  const shouldError = isProduction && !isPreviewMode

  const nextAuthSecret = env.NEXTAUTH_SECRET
  if (!nextAuthSecret || nextAuthSecret.length < minSecretLength) {
    const message = `NEXTAUTH_SECRET must be set and at least ${minSecretLength} characters long.`
    if (shouldError) {
      errors.push(message)
    } else {
      warnings.push(message)
    }
  }

  const nextAuthUrl = env.NEXTAUTH_URL
  if (!nextAuthUrl && shouldError) {
    errors.push('NEXTAUTH_URL must be configured for production deployments.')
  }

  const jwtSecret = env.JWT_SECRET
  if (!jwtSecret || jwtSecret === DEFAULT_JWT_SECRET) {
    const message = 'JWT_SECRET is missing or using the insecure development default.'
    if (shouldError) {
      errors.push(message)
    } else {
      warnings.push(message)
    }
  }

  const encryptionKey = env.ENCRYPTION_KEY
  if (!encryptionKey || encryptionKey === DEFAULT_ENCRYPTION_KEY) {
    const message = 'ENCRYPTION_KEY is missing or using the insecure development default.'
    if (shouldError) {
      errors.push(message)
    } else {
      warnings.push(message)
    }
  }

  return { warnings, errors }
}
