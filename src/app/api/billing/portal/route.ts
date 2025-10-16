/**
 * Billing Portal API Route
 * Creates Stripe customer portal sessions for self-service billing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createBillingPortalSession } from '@/lib/stripe';
import { createRateLimitMiddleware } from '@/lib/rate-limiting-unified';
import { env } from '@/lib/env';


/**
 * Rate limiting for portal access
 */
const rateLimiter = createRateLimitMiddleware(
  5, // 5 requests
  60 * 1000, // per minute
  100 // per 100 unique tokens
);

/**
 * POST /api/billing/portal
 * Create a Stripe customer portal session
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

    // Get user with billing customer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        billingCustomer: true,
        organizationMembers: {
          where: { role: { in: ['OWNER', 'ADMIN'] } },
          include: { organization: true },
        },
      },
    });

    if (!user || !user.billingCustomer) {
      return NextResponse.json(
        { error: 'No billing account found' },
        { status: 404 }
      );
    }

    // Check permissions
    const canManageBilling = user.organizationMembers.some(
      member => member.role === 'OWNER' || member.role === 'ADMIN'
    );

    if (!canManageBilling) {
      return NextResponse.json(
        { error: 'Insufficient permissions for billing management' },
        { status: 403 }
      );
    }

    // Create billing portal session
    const portalSession = await createBillingPortalSession(
      user.billingCustomer.stripeCustomerId,
      `${env.NEXT_PUBLIC_APP_URL}/billing`
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        resource: 'billing_portal_session',
        resourceId: portalSession.id,
        details: {
          customerId: user.billingCustomer.stripeCustomerId,
          returnUrl: `${env.NEXT_PUBLIC_APP_URL}/billing`,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        portalUrl: portalSession.url,
      },
    });

  } catch (error) {
    console.error('Billing portal creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/billing/portal
 * Get current billing information and subscription status
 */
export async function GET(_request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user with billing information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        billingCustomer: {
          include: {
            subscriptions: {
              where: { 
                status: { 
                  in: ['ACTIVE', 'TRIALING', 'PAST_DUE', 'UNPAID'] 
                } 
              },
              include: { plan: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        organizationMembers: {
          where: { role: { in: ['OWNER', 'ADMIN'] } },
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

    // Check permissions
    const canViewBilling = user.organizationMembers.some(
      member => member.role === 'OWNER' || member.role === 'ADMIN'
    );

    if (!canViewBilling) {
      return NextResponse.json(
        { error: 'Insufficient permissions for billing access' },
        { status: 403 }
      );
    }

    const billingCustomer = user.billingCustomer;
    const activeSubscription = billingCustomer?.subscriptions[0];

    // Calculate usage metrics if subscription exists
    let usageMetrics = null;
    if (activeSubscription && user.organizationMembers[0]) {
      const organizationId = user.organizationMembers[0].organizationId;
      
      // Get current usage counts
      const [projectCount, userCount, keywordCount] = await Promise.all([
        prisma.project.count({
          where: { organizationId, status: 'ACTIVE' },
        }),
        prisma.organizationMember.count({
          where: { organizationId },
        }),
        prisma.keyword.count({
          where: { 
            project: { organizationId },
            isTracked: true,
          },
        }),
      ]);

      usageMetrics = {
        projects: {
          current: projectCount,
          limit: activeSubscription.plan.maxProjects,
        },
        users: {
          current: userCount,
          limit: activeSubscription.plan.maxUsers,
        },
        keywords: {
          current: keywordCount,
          limit: activeSubscription.plan.maxKeywords,
        },
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        hasSubscription: !!activeSubscription,
        subscription: activeSubscription ? {
          id: activeSubscription.id,
          status: activeSubscription.status,
          planName: activeSubscription.plan.name,
          planAmount: activeSubscription.plan.amount,
          planCurrency: activeSubscription.plan.currency,
          planInterval: activeSubscription.plan.interval,
          currentPeriodStart: activeSubscription.currentPeriodStart,
          currentPeriodEnd: activeSubscription.currentPeriodEnd,
          cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
          canceledAt: activeSubscription.canceledAt,
          trialStart: activeSubscription.trialStart,
          trialEnd: activeSubscription.trialEnd,
        } : null,
        usage: usageMetrics,
        billingHistory: [], // TODO: Implement billing history
        upcomingInvoice: null, // TODO: Implement upcoming invoice
        paymentMethod: null, // TODO: Implement payment method info
      },
    });

  } catch (error) {
    console.error('Billing info fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}