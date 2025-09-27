/**
 * Stripe Configuration and Utilities
 * Handles payment processing, subscription management, and billing operations
 */

import Stripe from 'stripe';
import { env } from '@/lib/env';

/**
 * Stripe instance for server-side operations
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
  appInfo: {
    name: 'SEO Analytics Platform',
    version: '1.0.0',
  },
});

/**
 * Webhook event verification
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
}

/**
 * Create a Stripe customer
 */
export async function createStripeCustomer(params: {
  email: string;
  name?: string;
  organizationName?: string;
  userId?: string;
  organizationId?: string;
}): Promise<Stripe.Customer> {
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    description: params.organizationName,
    metadata: {
      userId: params.userId || '',
      organizationId: params.organizationId || '',
    },
  });

  return customer;
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: params.customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    subscription_data: {
      trial_period_days: params.trialDays,
      metadata: {
        customerId: params.customerId,
      },
    },
    billing_address_collection: 'required',
    tax_id_collection: {
      enabled: true,
    },
    consent_collection: {
      terms_of_service: 'required',
      privacy_policy: 'required',
    },
  });

  return session;
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Get customer subscriptions
 */
export async function getCustomerSubscriptions(
  customerId: string
): Promise<Stripe.Subscription[]> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    expand: ['data.default_payment_method', 'data.items.data.price'],
  });

  return subscriptions.data;
}

/**
 * Cancel a subscription with proper timing
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAt?: number // Unix timestamp
): Promise<Stripe.Subscription> {
  const updateData: Stripe.SubscriptionUpdateParams = {
    cancel_at_period_end: true,
  };

  // If cancelAt is provided and it's more than 60 days from now
  if (cancelAt) {
    const now = Math.floor(Date.now() / 1000);
    const minCancelTime = now + (60 * 24 * 60 * 60); // 60 days from now
    
    if (cancelAt >= minCancelTime) {
      updateData.cancel_at = cancelAt;
    }
  }

  const subscription = await stripe.subscriptions.update(
    subscriptionId,
    updateData
  );

  return subscription;
}

/**
 * Immediately cancel subscription (for violations)
 */
export async function cancelSubscriptionImmediately(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}

/**
 * Update subscription
 */
export async function updateSubscription(
  subscriptionId: string,
  priceId: string,
  prorationBehavior: 'create_prorations' | 'none' = 'create_prorations'
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  const updatedSubscription = await stripe.subscriptions.update(
    subscriptionId,
    {
      items: [
        {
          id: subscription.items.data[0]?.id,
          price: priceId,
        },
      ],
      proration_behavior: prorationBehavior,
    }
  );

  return updatedSubscription;
}

/**
 * Record usage for metered billing
 */
export async function recordUsage(
  subscriptionItemId: string,
  quantity: number,
  timestamp?: number
): Promise<Stripe.UsageRecord> {
  const usageRecord = await stripe.subscriptionItems.createUsageRecord(
    subscriptionItemId,
    {
      quantity,
      timestamp: timestamp || Math.floor(Date.now() / 1000),
      action: 'increment',
    }
  );

  return usageRecord;
}

/**
 * Get usage records for a subscription item
 */
export async function getUsageRecords(
  subscriptionItemId: string,
  startingAfter?: string
): Promise<Stripe.UsageRecord[]> {
  const usageRecords = await stripe.subscriptionItems.listUsageRecordSummaries(
    subscriptionItemId,
    {
      starting_after: startingAfter,
    }
  );

  return usageRecords.data;
}

/**
 * Create a price for a product
 */
export async function createPrice(params: {
  productId: string;
  unitAmount: number;
  currency: string;
  recurring: {
    interval: 'month' | 'year';
    interval_count?: number;
  };
  metadata?: Record<string, string>;
}): Promise<Stripe.Price> {
  const price = await stripe.prices.create({
    product: params.productId,
    unit_amount: params.unitAmount,
    currency: params.currency,
    recurring: params.recurring,
    metadata: params.metadata,
  });

  return price;
}

/**
 * Get upcoming invoice for a customer
 */
export async function getUpcomingInvoice(
  customerId: string
): Promise<Stripe.Invoice | null> {
  try {
    const invoice = await stripe.invoices.retrieveUpcoming({
      customer: customerId,
    });
    return invoice;
  } catch (error) {
    // No upcoming invoice
    return null;
  }
}

/**
 * List customer invoices
 */
export async function getCustomerInvoices(
  customerId: string,
  limit: number = 10
): Promise<Stripe.Invoice[]> {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
    expand: ['data.subscription', 'data.payment_intent'],
  });

  return invoices.data;
}

/**
 * Send billing notification email (60-day notice)
 */
export async function sendBillingNotification(
  customerId: string,
  type: 'renewal_60_days' | 'renewal_30_days' | 'renewal_7_days' | 'overuse_warning' | 'payment_failed'
): Promise<void> {
  // This would integrate with your email service
  // For now, we'll log the notification
  console.log(`Billing notification sent to customer ${customerId}: ${type}`);
  
  // TODO: Implement actual email sending with templates
  // - Use SendGrid, SES, or similar service
  // - Create email templates for each notification type
  // - Store notification history in database
}

/**
 * Calculate proration amount
 */
export async function calculateProration(
  subscriptionId: string,
  newPriceId: string
): Promise<{
  prorationAmount: number;
  currentPeriodEnd: number;
}> {
  // Create a preview invoice to see the proration
  const invoice = await stripe.invoices.retrieveUpcoming({
    subscription: subscriptionId,
    subscription_items: [
      {
        id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0]?.id,
        price: newPriceId,
      },
    ],
  });

  const prorationAmount = invoice.lines.data
    .filter(line => line.proration)
    .reduce((sum, line) => sum + (line.amount || 0), 0);

  return {
    prorationAmount,
    currentPeriodEnd: invoice.period_end,
  };
}

/**
 * Stripe webhook event types for type safety
 */
export type StripeWebhookEvent = 
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'customer.created'
  | 'customer.updated'
  | 'checkout.session.completed';

/**
 * Common Stripe error handling
 */
export function handleStripeError(error: unknown): string {
  if (error instanceof Stripe.errors.StripeError) {
    switch (error.type) {
      case 'card_error':
        return error.message || 'Card was declined';
      case 'rate_limit_error':
        return 'Too many requests made to the API too quickly';
      case 'invalid_request_error':
        return 'Invalid parameters were supplied to Stripe';
      case 'api_error':
        return 'An error occurred internally with Stripe';
      case 'connection_error':
        return 'Some kind of error occurred during the HTTPS communication';
      case 'authentication_error':
        return 'Probably used incorrect API key';
      default:
        return 'An unknown error occurred';
    }
  }
  
  return 'An unexpected error occurred';
}