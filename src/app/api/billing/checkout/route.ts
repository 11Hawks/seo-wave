/**
 * Stripe Checkout API Route
 * Creates checkout sessions for subscription purchases
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCheckoutSession, createStripeCustomer } from '@/lib/stripe';
import { createRateLimitMiddleware } from '@/lib/rate-limiting-unified';
import { env } from '@/lib/env';


/**
 * Request validation schema
 */
const checkoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  organizationId: z.string().optional(),
  returnUrl: z.string().url().optional(),
});

/**
 * Rate limiting for checkout creation
 */
const rateLimiter = createRateLimitMiddleware(
  10, // 10 requests
  60 * 1000, // per minute
  100 // per 100 unique tokens
);

/**
 * POST /api/billing/checkout
 * Create a Stripe checkout session for subscription
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiter(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { priceId, organizationId, returnUrl } = checkoutSchema.parse(body);

    // Get user and organization details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        billingCustomer: true,
        organizationMembers: {
          where: organizationId ? { organizationId } : { role: 'OWNER' },
          include: { organization: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Determine the organization
    const organization = user.organizationMembers[0]?.organization;
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to manage billing
    const member = user.organizationMembers.find(m => 
      m.organizationId === organization.id
    );
    if (member?.role !== 'OWNER' && member?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions for billing management' },
        { status: 403 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId: string;
    let billingCustomer = user.billingCustomer;

    if (!billingCustomer) {
      // Create Stripe customer
      const stripeCustomer = await createStripeCustomer({
        email: user.email,
        name: user.name || undefined,
        organizationName: organization.name,
        userId: user.id,
        organizationId: organization.id,
      });

      // Create billing customer record
      billingCustomer = await prisma.billingCustomer.create({
        data: {
          stripeCustomerId: stripeCustomer.id,
          userId: user.id,
          organizationId: organization.id,
          email: user.email,
          name: user.name,
        },
      });

      stripeCustomerId = stripeCustomer.id;
    } else {
      stripeCustomerId = billingCustomer.stripeCustomerId;
    }

    // Get the price details to validate
    const price = await prisma.billingPlan.findFirst({
      where: { stripePriceId: priceId, isActive: true },
    });

    if (!price) {
      return NextResponse.json(
        { error: 'Invalid or inactive price' },
        { status: 400 }
      );
    }

    // Create checkout session
    const baseUrl = env.NEXT_PUBLIC_APP_URL;
    const checkoutSession = await createCheckoutSession({
      customerId: stripeCustomerId,
      priceId,
      successUrl: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: returnUrl || `${baseUrl}/billing/plans`,
      trialDays: 14, // 14-day free trial
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        resource: 'checkout_session',
        resourceId: checkoutSession.id,
        details: {
          priceId,
          organizationId: organization.id,
          amount: price.amount,
          currency: price.currency,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
      },
    });

  } catch (error) {
    console.error('Checkout creation error:', error);

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

    // Generic error response
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/billing/checkout
 * Get available pricing plans
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get active billing plans
    const plans = await prisma.billingPlan.findMany({
      where: { isActive: true },
      orderBy: { amount: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        amount: plan.amount,
        currency: plan.currency,
        interval: plan.interval.toLowerCase(),
        stripePriceId: plan.stripePriceId,
        features: plan.features,
        limits: {
          maxProjects: plan.maxProjects,
          maxUsers: plan.maxUsers,
          maxKeywords: plan.maxKeywords,
        },
      })),
    });

  } catch (error) {
    console.error('Plans fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}