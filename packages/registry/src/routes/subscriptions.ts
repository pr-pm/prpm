/**
 * Subscription and payment routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queryOne } from '../db/index.js';
import {
  createCheckoutSession,
  createPortalSession,
  getSubscriptionStatus,
  cancelSubscription,
  resumeSubscription,
} from '../services/stripe.js';

interface Organization {
  id: string;
  name: string;
}

export async function subscriptionRoutes(server: FastifyInstance) {
  // Create checkout session for new subscription
  server.post<{
    Body: {
      orgName: string;
      successUrl: string;
      cancelUrl: string;
    };
  }>('/checkout', {
    onRequest: [server.authenticate],
    schema: {
      tags: ['subscriptions'],
      description: 'Create a Stripe checkout session to start a subscription',
      body: {
        type: 'object',
        required: ['orgName', 'successUrl', 'cancelUrl'],
        properties: {
          orgName: { type: 'string' },
          successUrl: { type: 'string', format: 'uri' },
          cancelUrl: { type: 'string', format: 'uri' },
        },
      },
    },
  }, async (request, reply) => {
    const { orgName, successUrl, cancelUrl } = request.body;
    const userId = (request as any).user?.user_id;

    if (!userId) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'You must be logged in',
      });
    }

    server.log.info({
      action: 'create_checkout_session',
      orgName,
      userId,
    }, '💳 Creating checkout session');

    try {
      // Get organization
      const org = await queryOne<Organization>(
        server,
        'SELECT id, name FROM organizations WHERE name = $1',
        [orgName]
      );

      if (!org) {
        return reply.status(404).send({
          error: 'Not found',
          message: `Organization '${orgName}' not found`,
        });
      }

      // Check if user is owner or admin
      const membership = await queryOne<{ role: string }>(
        server,
        'SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2',
        [org.id, userId]
      );

      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to manage subscriptions for this organization',
        });
      }

      // Don't supply customer email - let user input it in Stripe checkout
      // This allows them to use a different email than their account email

      // Create checkout session
      const checkoutUrl = await createCheckoutSession(server, {
        orgId: org.id,
        orgName: org.name,
        successUrl,
        cancelUrl,
        customerEmail: undefined, // Let Stripe collect email
      });

      server.log.info({ orgId: org.id, userId }, '✅ Checkout session created');

      return reply.send({
        checkoutUrl,
        message: 'Checkout session created successfully',
      });
    } catch (error) {
      server.log.error({ error, orgName }, '❌ Failed to create checkout session');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to create checkout session',
      });
    }
  });

  // Create customer portal session for subscription management
  server.post<{
    Body: {
      orgName: string;
      returnUrl: string;
    };
  }>('/portal', {
    onRequest: [server.authenticate],
    schema: {
      tags: ['subscriptions'],
      description: 'Create a Stripe customer portal session for subscription management',
      body: {
        type: 'object',
        required: ['orgName', 'returnUrl'],
        properties: {
          orgName: { type: 'string' },
          returnUrl: { type: 'string', format: 'uri' },
        },
      },
    },
  }, async (request, reply) => {
    const { orgName, returnUrl } = request.body;
    const userId = (request as any).user?.user_id;

    if (!userId) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'You must be logged in',
      });
    }

    server.log.info({
      action: 'create_portal_session',
      orgName,
      userId,
    }, '🏢 Creating portal session');

    try {
      // Get organization
      const org = await queryOne<Organization>(
        server,
        'SELECT id, name FROM organizations WHERE name = $1',
        [orgName]
      );

      if (!org) {
        return reply.status(404).send({
          error: 'Not found',
          message: `Organization '${orgName}' not found`,
        });
      }

      // Check if user is owner or admin
      const membership = await queryOne<{ role: string }>(
        server,
        'SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2',
        [org.id, userId]
      );

      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to manage subscriptions for this organization',
        });
      }

      // Create portal session
      const portalUrl = await createPortalSession(server, org.id, returnUrl);

      server.log.info({ orgId: org.id, userId }, '✅ Portal session created');

      return reply.send({
        portalUrl,
        message: 'Portal session created successfully',
      });
    } catch (error) {
      server.log.error({ error, orgName }, '❌ Failed to create portal session');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to create portal session',
      });
    }
  });

  // Get subscription status for organization
  server.get<{
    Params: { orgName: string };
  }>('/:orgName/status', {
    onRequest: [server.authenticate],
    schema: {
      tags: ['subscriptions'],
      description: 'Get subscription status for an organization',
      params: {
        type: 'object',
        properties: {
          orgName: { type: 'string' },
        },
        required: ['orgName'],
      },
    },
  }, async (request, reply) => {
    const { orgName } = request.params;
    const userId = (request as any).user?.user_id;

    if (!userId) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'You must be logged in',
      });
    }

    server.log.info({
      action: 'get_subscription_status',
      orgName,
      userId,
    }, '📊 Getting subscription status');

    try {
      // Get organization
      const org = await queryOne<Organization>(
        server,
        'SELECT id, name FROM organizations WHERE name = $1',
        [orgName]
      );

      if (!org) {
        return reply.status(404).send({
          error: 'Not found',
          message: `Organization '${orgName}' not found`,
        });
      }

      // Check if user is member
      const membership = await queryOne<{ role: string }>(
        server,
        'SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2',
        [org.id, userId]
      );

      if (!membership) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You are not a member of this organization',
        });
      }

      // Get subscription status
      const status = await getSubscriptionStatus(server, org.id);

      server.log.info({ orgId: org.id, status: status.status }, '✅ Subscription status retrieved');

      return reply.send(status);
    } catch (error) {
      server.log.error({ error, orgName }, '❌ Failed to get subscription status');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to get subscription status',
      });
    }
  });

  // Cancel subscription
  server.post<{
    Params: { orgName: string };
  }>('/:orgName/cancel', {
    onRequest: [server.authenticate],
    schema: {
      tags: ['subscriptions'],
      description: 'Cancel subscription at period end',
      params: {
        type: 'object',
        properties: {
          orgName: { type: 'string' },
        },
        required: ['orgName'],
      },
    },
  }, async (request, reply) => {
    const { orgName } = request.params;
    const userId = (request as any).user?.user_id;

    if (!userId) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'You must be logged in',
      });
    }

    server.log.info({
      action: 'cancel_subscription',
      orgName,
      userId,
    }, '❌ Canceling subscription');

    try {
      // Get organization
      const org = await queryOne<Organization>(
        server,
        'SELECT id, name FROM organizations WHERE name = $1',
        [orgName]
      );

      if (!org) {
        return reply.status(404).send({
          error: 'Not found',
          message: `Organization '${orgName}' not found`,
        });
      }

      // Check if user is owner or admin
      const membership = await queryOne<{ role: string }>(
        server,
        'SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2',
        [org.id, userId]
      );

      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to manage subscriptions for this organization',
        });
      }

      // Cancel subscription
      await cancelSubscription(server, org.id);

      server.log.info({ orgId: org.id, userId }, '✅ Subscription canceled');

      return reply.send({
        message: 'Subscription will be canceled at the end of the billing period',
      });
    } catch (error) {
      server.log.error({ error, orgName }, '❌ Failed to cancel subscription');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to cancel subscription',
      });
    }
  });

  // Resume subscription
  server.post<{
    Params: { orgName: string };
  }>('/:orgName/resume', {
    onRequest: [server.authenticate],
    schema: {
      tags: ['subscriptions'],
      description: 'Resume a canceled subscription',
      params: {
        type: 'object',
        properties: {
          orgName: { type: 'string' },
        },
        required: ['orgName'],
      },
    },
  }, async (request, reply) => {
    const { orgName } = request.params;
    const userId = (request as any).user?.user_id;

    if (!userId) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'You must be logged in',
      });
    }

    server.log.info({
      action: 'resume_subscription',
      orgName,
      userId,
    }, '✅ Resuming subscription');

    try {
      // Get organization
      const org = await queryOne<Organization>(
        server,
        'SELECT id, name FROM organizations WHERE name = $1',
        [orgName]
      );

      if (!org) {
        return reply.status(404).send({
          error: 'Not found',
          message: `Organization '${orgName}' not found`,
        });
      }

      // Check if user is owner or admin
      const membership = await queryOne<{ role: string }>(
        server,
        'SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2',
        [org.id, userId]
      );

      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to manage subscriptions for this organization',
        });
      }

      // Resume subscription
      await resumeSubscription(server, org.id);

      server.log.info({ orgId: org.id, userId }, '✅ Subscription resumed');

      return reply.send({
        message: 'Subscription resumed successfully',
      });
    } catch (error) {
      server.log.error({ error, orgName }, '❌ Failed to resume subscription');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to resume subscription',
      });
    }
  });
}
