/**
 * Stripe service for managing subscriptions and payments
 */

import Stripe from 'stripe';
import type { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db/index.js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

// Subscription price IDs (to be set in environment variables)
const VERIFIED_PLAN_PRICE_ID = process.env.STRIPE_VERIFIED_PLAN_PRICE_ID || '';

export interface CreateCheckoutSessionParams {
  orgId: string;
  orgName: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  status: string | null;
  plan: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
}

/**
 * Create a Stripe customer for an organization
 */
export async function createCustomer(
  server: FastifyInstance,
  orgId: string,
  orgName: string,
  email?: string
): Promise<string> {
  try {
    const customer = await stripe.customers.create({
      name: orgName,
      email,
      metadata: {
        org_id: orgId,
        org_name: orgName,
      },
    });

    // Update organization with Stripe customer ID
    await query(
      server,
      'UPDATE organizations SET stripe_customer_id = $1 WHERE id = $2',
      [customer.id, orgId]
    );

    server.log.info({ orgId, customerId: customer.id }, '✅ Created Stripe customer');

    return customer.id;
  } catch (error) {
    server.log.error({ error, orgId }, '❌ Failed to create Stripe customer');
    throw error;
  }
}

/**
 * Get or create a Stripe customer for an organization
 */
export async function getOrCreateCustomer(
  server: FastifyInstance,
  orgId: string,
  orgName: string,
  email?: string
): Promise<string> {
  // Check if customer already exists
  const org = await queryOne<{ stripe_customer_id: string | null }>(
    server,
    'SELECT stripe_customer_id FROM organizations WHERE id = $1',
    [orgId]
  );

  if (org?.stripe_customer_id) {
    return org.stripe_customer_id;
  }

  // Create new customer
  return createCustomer(server, orgId, orgName, email);
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  server: FastifyInstance,
  params: CreateCheckoutSessionParams
): Promise<string> {
  try {
    const { orgId, orgName, successUrl, cancelUrl, customerEmail } = params;

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(server, orgId, orgName, customerEmail);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: VERIFIED_PLAN_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        org_id: orgId,
        org_name: orgName,
      },
      subscription_data: {
        metadata: {
          org_id: orgId,
          org_name: orgName,
        },
      },
    });

    server.log.info({ orgId, sessionId: session.id }, '✅ Created checkout session');

    return session.url || '';
  } catch (error) {
    server.log.error({ error, orgId: params.orgId }, '❌ Failed to create checkout session');
    throw error;
  }
}

/**
 * Create a Stripe Customer Portal session for subscription management
 */
export async function createPortalSession(
  server: FastifyInstance,
  orgId: string,
  returnUrl: string
): Promise<string> {
  try {
    const org = await queryOne<{ stripe_customer_id: string | null }>(
      server,
      'SELECT stripe_customer_id FROM organizations WHERE id = $1',
      [orgId]
    );

    if (!org?.stripe_customer_id) {
      throw new Error('No Stripe customer found for organization');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: returnUrl,
    });

    server.log.info({ orgId, sessionId: session.id }, '✅ Created portal session');

    return session.url;
  } catch (error) {
    server.log.error({ error, orgId }, '❌ Failed to create portal session');
    throw error;
  }
}

/**
 * Get subscription status for an organization
 */
export async function getSubscriptionStatus(
  server: FastifyInstance,
  orgId: string
): Promise<SubscriptionStatus> {
  const org = await queryOne<{
    subscription_status: string | null;
    subscription_plan: string;
    subscription_cancel_at_period_end: boolean;
    subscription_end_date: Date | null;
  }>(
    server,
    `SELECT subscription_status, subscription_plan, subscription_cancel_at_period_end, subscription_end_date
     FROM organizations WHERE id = $1`,
    [orgId]
  );

  if (!org) {
    return {
      isActive: false,
      status: null,
      plan: 'free',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
    };
  }

  return {
    isActive: org.subscription_status === 'active' || org.subscription_status === 'trialing',
    status: org.subscription_status,
    plan: org.subscription_plan,
    cancelAtPeriodEnd: org.subscription_cancel_at_period_end,
    currentPeriodEnd: org.subscription_end_date,
  };
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(
  server: FastifyInstance,
  orgId: string
): Promise<void> {
  try {
    const org = await queryOne<{ stripe_subscription_id: string | null }>(
      server,
      'SELECT stripe_subscription_id FROM organizations WHERE id = $1',
      [orgId]
    );

    if (!org?.stripe_subscription_id) {
      throw new Error('No active subscription found');
    }

    await stripe.subscriptions.update(org.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Update database
    await query(
      server,
      'UPDATE organizations SET subscription_cancel_at_period_end = true WHERE id = $1',
      [orgId]
    );

    server.log.info({ orgId }, '✅ Subscription set to cancel at period end');
  } catch (error) {
    server.log.error({ error, orgId }, '❌ Failed to cancel subscription');
    throw error;
  }
}

/**
 * Resume a canceled subscription
 */
export async function resumeSubscription(
  server: FastifyInstance,
  orgId: string
): Promise<void> {
  try {
    const org = await queryOne<{ stripe_subscription_id: string | null }>(
      server,
      'SELECT stripe_subscription_id FROM organizations WHERE id = $1',
      [orgId]
    );

    if (!org?.stripe_subscription_id) {
      throw new Error('No active subscription found');
    }

    await stripe.subscriptions.update(org.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    // Update database
    await query(
      server,
      'UPDATE organizations SET subscription_cancel_at_period_end = false WHERE id = $1',
      [orgId]
    );

    server.log.info({ orgId }, '✅ Subscription resumed');
  } catch (error) {
    server.log.error({ error, orgId }, '❌ Failed to resume subscription');
    throw error;
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhookEvent(
  server: FastifyInstance,
  event: Stripe.Event
): Promise<void> {
  const eventType = event.type;

  server.log.info({ eventType, eventId: event.id }, '📬 Processing Stripe webhook event');

  try {
    switch (eventType) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(server, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(server, subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(server, invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(server, invoice);
        break;
      }

      case 'payment_method.attached': {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        await handlePaymentMethodAttached(server, paymentMethod);
        break;
      }

      default:
        server.log.info({ eventType }, 'ℹ️  Unhandled webhook event type');
    }

    // Log event to subscription_events table
    const orgId = await getOrgIdFromEvent(server, event);
    if (orgId) {
      await logSubscriptionEvent(server, orgId, event);
    }
  } catch (error) {
    server.log.error({ error, eventType, eventId: event.id }, '❌ Error handling webhook event');
    throw error;
  }
}

/**
 * Handle subscription update/creation
 */
async function handleSubscriptionUpdate(
  server: FastifyInstance,
  subscription: Stripe.Subscription
): Promise<void> {
  const orgId = subscription.metadata.org_id;

  if (!orgId) {
    server.log.warn({ subscriptionId: subscription.id }, 'Subscription missing org_id metadata');
    return;
  }

  await query(
    server,
    `UPDATE organizations
     SET stripe_subscription_id = $1,
         subscription_status = $2,
         subscription_plan = $3,
         subscription_start_date = $4,
         subscription_end_date = $5,
         subscription_cancel_at_period_end = $6,
         is_verified = $7
     WHERE id = $8`,
    [
      subscription.id,
      subscription.status,
      'verified',
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
      subscription.cancel_at_period_end,
      subscription.status === 'active' || subscription.status === 'trialing',
      orgId,
    ]
  );

  server.log.info({ orgId, subscriptionId: subscription.id }, '✅ Subscription updated');
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(
  server: FastifyInstance,
  subscription: Stripe.Subscription
): Promise<void> {
  const orgId = subscription.metadata.org_id;

  if (!orgId) {
    server.log.warn({ subscriptionId: subscription.id }, 'Subscription missing org_id metadata');
    return;
  }

  await query(
    server,
    `UPDATE organizations
     SET subscription_status = 'canceled',
         subscription_plan = 'free',
         subscription_end_date = $1,
         is_verified = false
     WHERE id = $2`,
    [new Date(subscription.ended_at ? subscription.ended_at * 1000 : Date.now()), orgId]
  );

  server.log.info({ orgId, subscriptionId: subscription.id }, '✅ Subscription deleted');
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(
  server: FastifyInstance,
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

  if (!customerId) {
    return;
  }

  const org = await queryOne<{ id: string }>(
    server,
    'SELECT id FROM organizations WHERE stripe_customer_id = $1',
    [customerId]
  );

  if (!org) {
    return;
  }

  // Create or update invoice record
  await query(
    server,
    `INSERT INTO invoices (org_id, stripe_invoice_id, stripe_payment_intent_id, amount_due, amount_paid, currency, status, invoice_date, paid_at, invoice_pdf_url, hosted_invoice_url, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (stripe_invoice_id) DO UPDATE
     SET status = $7, amount_paid = $5, paid_at = $9, updated_at = NOW()`,
    [
      org.id,
      invoice.id,
      typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id,
      invoice.amount_due,
      invoice.amount_paid,
      invoice.currency,
      invoice.status,
      new Date(invoice.created * 1000),
      invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
      invoice.invoice_pdf,
      invoice.hosted_invoice_url,
      JSON.stringify(invoice.metadata),
    ]
  );

  server.log.info({ orgId: org.id, invoiceId: invoice.id }, '✅ Invoice paid');
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(
  server: FastifyInstance,
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

  if (!customerId) {
    return;
  }

  const org = await queryOne<{ id: string }>(
    server,
    'SELECT id FROM organizations WHERE stripe_customer_id = $1',
    [customerId]
  );

  if (!org) {
    return;
  }

  // Update organization subscription status
  await query(
    server,
    `UPDATE organizations SET subscription_status = 'past_due' WHERE id = $1`,
    [org.id]
  );

  // Update invoice record
  await query(
    server,
    `INSERT INTO invoices (org_id, stripe_invoice_id, stripe_payment_intent_id, amount_due, amount_paid, currency, status, invoice_date, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (stripe_invoice_id) DO UPDATE
     SET status = $7, updated_at = NOW()`,
    [
      org.id,
      invoice.id,
      typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id,
      invoice.amount_due,
      invoice.amount_paid,
      invoice.currency,
      'open',
      new Date(invoice.created * 1000),
      JSON.stringify(invoice.metadata),
    ]
  );

  server.log.warn({ orgId: org.id, invoiceId: invoice.id }, '⚠️  Invoice payment failed');
}

/**
 * Handle payment method attachment
 */
async function handlePaymentMethodAttached(
  server: FastifyInstance,
  paymentMethod: Stripe.PaymentMethod
): Promise<void> {
  const customerId = typeof paymentMethod.customer === 'string' ? paymentMethod.customer : paymentMethod.customer?.id;

  if (!customerId) {
    return;
  }

  const org = await queryOne<{ id: string }>(
    server,
    'SELECT id FROM organizations WHERE stripe_customer_id = $1',
    [customerId]
  );

  if (!org) {
    return;
  }

  // Store payment method details
  if (paymentMethod.card) {
    await query(
      server,
      `INSERT INTO payment_methods (org_id, stripe_payment_method_id, card_brand, card_last4, card_exp_month, card_exp_year, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (stripe_payment_method_id) DO UPDATE
       SET is_default = true, updated_at = NOW()`,
      [
        org.id,
        paymentMethod.id,
        paymentMethod.card.brand,
        paymentMethod.card.last4,
        paymentMethod.card.exp_month,
        paymentMethod.card.exp_year,
      ]
    );

    // Set other payment methods to non-default
    await query(
      server,
      `UPDATE payment_methods SET is_default = false
       WHERE org_id = $1 AND stripe_payment_method_id != $2`,
      [org.id, paymentMethod.id]
    );

    server.log.info({ orgId: org.id, paymentMethodId: paymentMethod.id }, '✅ Payment method attached');
  }
}

/**
 * Get org ID from Stripe event
 */
async function getOrgIdFromEvent(
  server: FastifyInstance,
  event: Stripe.Event
): Promise<string | null> {
  const data = event.data.object as any;

  // Try to get org_id from metadata
  if (data.metadata?.org_id) {
    return data.metadata.org_id;
  }

  // Try to get org from customer ID
  if (data.customer) {
    const customerId = typeof data.customer === 'string' ? data.customer : data.customer.id;
    const org = await queryOne<{ id: string }>(
      server,
      'SELECT id FROM organizations WHERE stripe_customer_id = $1',
      [customerId]
    );
    return org?.id || null;
  }

  return null;
}

/**
 * Log subscription event to database
 */
async function logSubscriptionEvent(
  server: FastifyInstance,
  orgId: string,
  event: Stripe.Event
): Promise<void> {
  const data = event.data.object as any;

  await query(
    server,
    `INSERT INTO subscription_events (org_id, stripe_event_id, event_type, subscription_status, subscription_plan, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (stripe_event_id) DO NOTHING`,
    [
      orgId,
      event.id,
      event.type,
      data.status || null,
      data.metadata?.plan || null,
      JSON.stringify(event.data.object),
    ]
  );
}

export { stripe };
