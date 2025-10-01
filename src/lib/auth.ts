/**
 * NextAuth.js configuration for the SEO Analytics Platform
 * Implements secure authentication with multiple providers and database sessions
 */

import { NextAuthOptions, DefaultSession, DefaultUser } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';

// Define types locally to avoid Prisma dependency issues
type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

/**
 * Module augmentation for NextAuth types
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
      status: UserStatus;
      organizationId: string | undefined;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: UserRole;
    status: UserStatus;
    organizationId: string | undefined;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    role: UserRole;
    status: UserStatus;
    organizationId: string | undefined;
  }
}

/**
 * Rate limiting for authentication attempts
 */
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Check if user account is locked due to too many failed attempts
 */
async function isAccountLocked(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { loginAttempts: true, lockedUntil: true },
  });

  if (!user) return false;

  return (
    user.loginAttempts >= MAX_LOGIN_ATTEMPTS &&
    user.lockedUntil !== null &&
    user.lockedUntil > new Date()
  );
}

/**
 * Increment failed login attempts and potentially lock account
 */
async function handleFailedLogin(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, loginAttempts: true },
  });

  if (!user) return;

  const attempts = user.loginAttempts + 1;
  const lockedUntil = attempts >= MAX_LOGIN_ATTEMPTS 
    ? new Date(Date.now() + LOCKOUT_DURATION)
    : null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      loginAttempts: attempts,
      lockedUntil,
    },
  });
}

/**
 * Reset login attempts on successful authentication
 */
async function resetLoginAttempts(email: string): Promise<void> {
  await prisma.user.update({
    where: { email },
    data: {
      loginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });
}

/**
 * Create audit log entry for authentication events
 */
async function createAuditLog(
  userId: string,
  action: 'LOGIN' | 'LOGOUT',
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resource: 'auth',
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      details: { timestamp: new Date().toISOString() },
    },
  });
}

// Check if authentication should be disabled
const isPreviewMode = process.env.PREVIEW_MODE === 'true' || process.env.DISABLE_AUTH === 'true';

/**
 * NextAuth.js configuration
 */
export const authOptions: NextAuthOptions = {
  // Only use Prisma adapter if not in preview mode
  ...(isPreviewMode ? {} : { adapter: PrismaAdapter(prisma) }),
  
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    newUser: '/onboarding',
  },
  
  providers: isPreviewMode ? [] : [
    /**
     * Google OAuth Provider
     */
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID || 'dev-client-id',
      clientSecret: env.GOOGLE_CLIENT_SECRET || 'dev-client-secret',
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/webmasters.readonly',
            'https://www.googleapis.com/auth/analytics.readonly',
          ].join(' '),
        },
      },
    }),
    
    /**
     * Email/Password Credentials Provider
     */
    ...(isPreviewMode ? [] : [CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Check if account is locked
        const isLocked = await isAccountLocked(credentials.email);
        if (isLocked) {
          throw new Error('Account temporarily locked due to too many failed attempts');
        }

        // Find user in database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            status: true,
            passwordHash: true,
            organizationMembers: {
              where: { role: 'OWNER' },
              select: { organizationId: true },
            },
          },
        });

        if (!user || !user.passwordHash) {
          await handleFailedLogin(credentials.email);
          throw new Error('Invalid credentials');
        }

        // Verify password
        const isValidPassword = await compare(credentials.password, user.passwordHash);
        if (!isValidPassword) {
          await handleFailedLogin(credentials.email);
          throw new Error('Invalid credentials');
        }

        // Check user status
        if (user.status !== 'ACTIVE') {
          throw new Error(`Account is ${user.status.toLowerCase()}`);
        }

        // Reset login attempts on successful authentication
        await resetLoginAttempts(credentials.email);

        // Create audit log
        const ipAddress = req.headers?.['x-forwarded-for'] as string || 
                          req.headers?.['x-real-ip'] as string;
        const userAgent = req.headers?.['user-agent'] as string;
        
        await createAuditLog(user.id, 'LOGIN', ipAddress, userAgent);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          status: user.status,
          organizationId: user.organizationMembers[0]?.organizationId || '',
        };
      },
    })]),
  ],
  
  callbacks: {
    /**
     * JWT callback - runs whenever a JWT is accessed
     */
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.status = user.status;
        token.organizationId = user.organizationId || undefined;
      }

      // Handle OAuth account linking
      if (account && account.provider === 'google') {
        // Store OAuth tokens for Google API access
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          create: {
            userId: token.userId,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token || null,
            refresh_token: account.refresh_token || null,
            expires_at: account.expires_at || null,
            token_type: account.token_type || null,
            scope: account.scope || null,
            id_token: account.id_token || null,
          },
          update: {
            access_token: account.access_token || null,
            refresh_token: account.refresh_token || null,
            expires_at: account.expires_at || null,
          },
        });
      }

      return token;
    },
    
    /**
     * Session callback - runs whenever a session is accessed
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.organizationId = token.organizationId;
      }
      
      return session;
    },
    
    /**
     * Redirect callback - controls where users are redirected after authentication
     */
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      
      // Default redirect
      return `${baseUrl}/dashboard`;
    },
  },
  
  events: {
    /**
     * Sign out event - create audit log
     */
    async signOut({ token }) {
      if (token?.userId) {
        await createAuditLog(token.userId as string, 'LOGOUT');
      }
    },
    
    /**
     * Create user event - set up default organization
     */
    async createUser({ user }) {
      // Create default personal organization for new users
      const organization = await prisma.organization.create({
        data: {
          name: `${user.name || user.email}'s Organization`,
          slug: `${user.id}-org`,
          ownerId: user.id,
        },
      });

      // Add user as organization member
      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: 'OWNER',
        },
      });

      // Update user with organization reference
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'ACTIVE' },
      });
    },
  },
  
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Utility functions for authentication
 */

/**
 * Get current user session server-side
 */
export async function getCurrentUser(req: any, res: any) {
  const session = await getServerSession(req, res, authOptions);
  return session?.user;
}

/**
 * Require authentication middleware
 */
export function requireAuth(handler: any) {
  return async (req: any, res: any) => {
    const user = await getCurrentUser(req, res);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account not active' });
    }
    
    req.user = user;
    return handler(req, res);
  };
}

/**
 * Require specific role middleware
 */
export function requireRole(roles: UserRole[]) {
  return (handler: any) => {
    return async (req: any, res: any) => {
      const user = await getCurrentUser(req, res);
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      if (!roles.includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      req.user = user;
      return handler(req, res);
    };
  };
}

// Import getServerSession at the end to avoid circular dependency
import { getServerSession } from 'next-auth/next';