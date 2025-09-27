/**
 * User Registration API Route
 * Handles user account creation with validation and security measures
 */

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Registration request validation schema
 */
const registerSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  organizationName: z.string().min(2).max(100).optional(),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms of service'),
});

/**
 * Generate organization slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * POST /api/auth/register
 * Create new user account with organization
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 attempts per hour per IP
    const limiter = rateLimit({
      interval: 60 * 60 * 1000, // 1 hour
      uniqueTokenPerInterval: 500,
    });

    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    try {
      await limiter.check(5, ip);
    } catch {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: { id: true, status: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password with high salt rounds for security
    const passwordHash = await hash(validatedData.password, 12);

    // Generate organization slug
    const baseSlug = generateSlug(
      validatedData.organizationName || `${validatedData.name}'s Organization`
    );
    
    let organizationSlug = baseSlug;
    let counter = 1;
    
    // Ensure unique organization slug
    while (await prisma.organization.findUnique({ where: { slug: organizationSlug } })) {
      organizationSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create user and organization in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          passwordHash,
          name: validatedData.name,
          status: 'PENDING_VERIFICATION',
          role: 'MEMBER',
        },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          createdAt: true,
        },
      });

      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: validatedData.organizationName || `${validatedData.name}'s Organization`,
          slug: organizationSlug,
          ownerId: user.id,
          status: 'ACTIVE',
        },
      });

      // Add user as organization owner
      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: 'OWNER',
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          resource: 'user',
          resourceId: user.id,
          details: {
            email: user.email,
            organizationId: organization.id,
            registrationIP: ip,
          },
          ipAddress: ip,
          userAgent: request.headers.get('user-agent'),
        },
      });

      return { user, organization };
    });

    // TODO: Send email verification
    // await sendVerificationEmail(result.user.email, verificationToken);

    // Return success response (excluding sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          status: result.user.status,
        },
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          slug: result.organization.slug,
        },
      },
    });

  } catch (error) {
    console.error('Registration error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle database errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/register
 * Check registration requirements and limits
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    requirements: {
      password: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecialChar: true,
      },
      name: {
        minLength: 2,
        maxLength: 50,
      },
      organization: {
        optional: true,
        minLength: 2,
        maxLength: 100,
      },
    },
    limits: {
      attemptsPerHour: 5,
    },
  });
}