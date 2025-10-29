/**
 * Stripe webhook routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { stripe, handleWebhookEvent } from '../services/stripe.js';
import Stripe from 'stripe';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function webhookRoutes(server: FastifyInstance) {
  // Stripe webhook endpoint
  server.post('/stripe', {
    config: {
      // Disable body parsing for webhook verification
      rawBody: true,
    },
    schema: {
      tags: ['webhooks'],
      description: 'Stripe webhook endpoint for subscription events',
      hide: true, // Hide from Swagger docs
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const signature = request.headers['stripe-signature'];

    if (!signature || typeof signature !== 'string') {
      server.log.warn('Missing Stripe signature header');
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Missing Stripe signature',
      });
    }

    if (!STRIPE_WEBHOOK_SECRET) {
      server.log.error('STRIPE_WEBHOOK_SECRET not configured');
      return reply.status(500).send({
        error: 'Configuration Error',
        message: 'Webhook secret not configured',
      });
    }

    try {
      // Get raw body for webhook verification
      const rawBody = (request as any).rawBody;

      if (!rawBody) {
        server.log.error('Raw body not available for webhook verification');
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Raw body not available',
        });
      }

      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        STRIPE_WEBHOOK_SECRET
      ) as Stripe.Event;

      server.log.info({
        eventId: event.id,
        eventType: event.type,
      }, '📬 Received Stripe webhook');

      // Handle the event
      await handleWebhookEvent(server, event);

      server.log.info({
        eventId: event.id,
        eventType: event.type,
      }, '✅ Webhook processed successfully');

      return reply.send({ received: true });
    } catch (error) {
      if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
        server.log.warn({ error: error.message }, '⚠️  Invalid webhook signature');
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid signature',
        });
      }

      server.log.error({ error }, '❌ Webhook processing failed');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to process webhook',
      });
    }
  });
}
