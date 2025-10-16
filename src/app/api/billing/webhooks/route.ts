export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Stripe Webhooks API Route
 * Handles Stripe webhook events for subscription and payment management
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/stripe';
import { StripeWebhookEvent, MappedSubscriptionStatus } from '@/types/stripe';


/**
 * POST /api/billing/webhooks
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature);
    
    console.log(`Processing webhook event: ${event.type}`);

    // Handle the event
    switch (event.type as StripeWebhookEvent) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    // Get customer metadata
    const customer = await prisma.billingCustomer.findUnique({
      where: { stripeCustomerId: subscription.customer as string },
    });

    if (!customer) {
      console.error(`Customer not found for subscription: ${subscription.id}`);
      return;
    }

    // Get the price/plan information
    const priceId = subscription.items.data[0]?.price.id;
    const plan = await prisma.billingPlan.findFirst({
      where: { stripePriceId: priceId },
    });

    if (!plan) {
      console.error(`Plan not found for price: ${priceId}`);
      return;
    }

    // Create subscription record
    await prisma.billingSubscription.create({
      data: {
        stripeSubscriptionId: subscription.id,
        customerId: customer.id,
        planId: plan.id,
        status: mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialStart: subscription.trial_start 
          ? new Date(subscription.trial_start * 1000) 
          : null,
        trialEnd: subscription.trial_end 
          ? new Date(subscription.trial_end * 1000) 
          : null,
      },
    });

    console.log(`Subscription created: ${subscription.id}`);

  } catch (error) {
    console.error('Error handling subscription created:', error);
    throw error;
  }
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const existingSubscription = await prisma.billingSubscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!existingSubscription) {
      console.error(`Subscription not found: ${subscription.id}`);
      return;
    }

    // Get the plan information
    const priceId = subscription.items.data[0]?.price.id;
    const plan = await prisma.billingPlan.findFirst({
      where: { stripePriceId: priceId },
    });

    if (!plan) {
      console.error(`Plan not found for price: ${priceId}`);
      return;
    }

    // Update subscription record
    await prisma.billingSubscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        planId: plan.id,
        status: mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at 
          ? new Date(subscription.canceled_at * 1000) 
          : null,
        trialStart: subscription.trial_start 
          ? new Date(subscription.trial_start * 1000) 
          : null,
        trialEnd: subscription.trial_end 
          ? new Date(subscription.trial_end * 1000) 
          : null,
      },
    });

    console.log(`Subscription updated: ${subscription.id}`);

  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

/**
 * Handle subscription deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    await prisma.billingSubscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });

    console.log(`Subscription deleted: ${subscription.id}`);

  } catch (error) {
    console.error('Error handling subscription deleted:', error);
    throw error;
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    // Get customer
    const customer = await prisma.billingCustomer.findUnique({
      where: { stripeCustomerId: invoice.customer as string },
    });

    if (!customer) {
      console.error(`Customer not found for invoice: ${invoice.id}`);
      return;
    }

    // Create or update invoice record
    await prisma.billingInvoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      create: {
        stripeInvoiceId: invoice.id,
        customerId: customer.id,
        subscriptionId: invoice.subscription as string,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status || 'unknown',
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        paidAt: invoice.status_transitions.paid_at 
          ? new Date(invoice.status_transitions.paid_at * 1000)
          : new Date(),
        dueDate: invoice.due_date 
          ? new Date(invoice.due_date * 1000)
          : null,
      },
      update: {
        status: invoice.status || 'unknown',
        paidAt: invoice.status_transitions.paid_at 
          ? new Date(invoice.status_transitions.paid_at * 1000)
          : new Date(),
      },
    });

    console.log(`Payment succeeded for invoice: ${invoice.id}`);

  } catch (error) {
    console.error('Error handling payment succeeded:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    // Get customer
    const customer = await prisma.billingCustomer.findUnique({
      where: { stripeCustomerId: invoice.customer as string },
      include: { user: true },
    });

    if (!customer) {
      console.error(`Customer not found for invoice: ${invoice.id}`);
      return;
    }

    // Update invoice record
    await prisma.billingInvoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      create: {
        stripeInvoiceId: invoice.id,
        customerId: customer.id,
        subscriptionId: invoice.subscription as string,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: invoice.status || 'unknown',
        dueDate: invoice.due_date 
          ? new Date(invoice.due_date * 1000)
          : null,
      },
      update: {
        status: invoice.status || 'unknown',
      },
    });

    // Create notification for payment failure
    if (customer.user) {
      await prisma.notification.create({
        data: {
          userId: customer.user.id,
          type: 'BILLING_ALERT',
          status: 'UNREAD',
          title: 'Payment Failed',
          message: `Your payment of ${invoice.amount_due / 100} ${invoice.currency.toUpperCase()} has failed. Please update your payment method to continue using our services.`,
          data: {
            invoiceId: invoice.id,
            amount: invoice.amount_due,
            currency: invoice.currency,
          },
        },
      });
    }

    console.log(`Payment failed for invoice: ${invoice.id}`);

  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
}

/**
 * Handle completed checkout session
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log(`Checkout completed: ${session.id}`);
    
    // Additional processing if needed
    // The subscription.created event will handle the main logic

  } catch (error) {
    console.error('Error handling checkout completed:', error);
    throw error;
  }
}

/**
 * Map Stripe subscription status to our enum
 */
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): 
  'ACTIVE' | 'CANCELED' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'PAST_DUE' | 'TRIALING' | 'UNPAID' {
  switch (stripeStatus) {
    case 'active':
      return 'ACTIVE';
    case 'canceled':
      return 'CANCELED';
    case 'incomplete':
      return 'INCOMPLETE';
    case 'incomplete_expired':
      return 'INCOMPLETE_EXPIRED';
    case 'past_due':
      return 'PAST_DUE';
    case 'trialing':
      return 'TRIALING';
    case 'unpaid':
      return 'UNPAID';
    default:
      return 'ACTIVE'; // Default fallback
  }
}