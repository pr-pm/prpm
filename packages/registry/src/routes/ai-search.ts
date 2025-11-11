/**
 * AI Search Routes
 * AI-powered semantic search (PRPM+ feature)
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AISearchService } from '../services/ai-search.js';
import type { AISearchQuery } from '@pr-pm/types';

/**
 * Middleware to check PRPM+ access for AI search
 */
async function checkPRPMPlusAccess(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request.user as any)?.user_id;

  if (!userId) {
    return reply.code(401).send({
      error: 'authentication_required',
      message: 'AI Search requires authentication',
      upgrade_info: {
        feature: 'AI-Powered Semantic Search',
        plan_required: 'PRPM+',
        price: '$19/month',
        benefits: [
          'Unlimited AI semantic search',
          'Natural language package discovery',
          'AI-powered recommendations',
          '100 monthly playground credits',
          'Priority support'
        ],
        upgrade_url: '/pricing',
        trial_available: true,
        trial_duration: '14 days'
      }
    });
  }

  // Check subscription tier
  const userResult = await request.server.pg.query(
    `SELECT subscription_tier, subscription_status, trial_ends_at
     FROM users
     WHERE id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    return reply.code(403).send({ error: 'user_not_found' });
  }

  const user = userResult.rows[0];
  const now = new Date();
  const trialActive = user.trial_ends_at && new Date(user.trial_ends_at) > now;

  // Allow if PRPM+ member or active trial
  if (user.subscription_tier === 'prpm_plus' && user.subscription_status === 'active') {
    return; // Access granted
  }

  if (trialActive) {
    return; // Trial access granted
  }

  // No access - send upgrade prompt
  return reply.code(403).send({
    error: 'prpm_plus_required',
    message: 'AI Search is a PRPM+ feature. Upgrade to unlock unlimited semantic search.',
    upgrade_info: {
      feature: 'AI-Powered Semantic Search',
      plan_required: 'PRPM+',
      price: '$19/month',
      current_tier: user.subscription_tier || 'free',
      benefits: [
        'Unlimited AI semantic search',
        'Natural language package discovery',
        'AI-powered recommendations',
        'Similar packages suggestions',
        '100 monthly playground credits (rollover to 200)',
        'Verified author badge',
        'Priority email support'
      ],
      upgrade_url: '/pricing',
      trial_available: !user.trial_ends_at,
      trial_duration: '14 days'
    }
  });
}

export async function aiSearchRoutes(server: FastifyInstance) {
  const aiSearchService = new AISearchService(server);

  /**
   * POST /ai-search
   * Perform AI-powered semantic search
   */
  server.post('/', {
    preHandler: [server.authenticate, checkPRPMPlusAccess],
    schema: {
      description: 'AI-powered semantic search for packages (PRPM+ feature)',
      tags: ['ai-search', 'prpm-plus'],
      body: {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'string',
            minLength: 3,
            maxLength: 500,
            description: 'Natural language search query'
          },
          filters: {
            type: 'object',
            properties: {
              format: { type: 'string' },
              subtype: { type: 'string' },
              language: { type: 'string' },
              framework: { type: 'string' },
              min_quality: { type: 'number', minimum: 0, maximum: 5 },
              categories: { type: 'array', items: { type: 'string' } },
              use_cases: { type: 'array', items: { type: 'string' } }
            }
          },
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 50,
            default: 10
          },
          offset: {
            type: 'number',
            minimum: 0,
            default: 0
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            results: { type: 'array' },
            query: { type: 'string' },
            total_matches: { type: 'number' },
            execution_time_ms: { type: 'number' },
            search_metadata: { type: 'object' }
          }
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            upgrade_info: { type: 'object' }
          }
        },
        403: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            upgrade_info: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const userId = (request.user as any).user_id;
    const searchQuery: AISearchQuery = request.body as AISearchQuery;

    try {
      const results = await aiSearchService.search(searchQuery, userId);

      server.log.info({
        userId,
        query: searchQuery.query,
        results_count: results.results.length,
        execution_time: results.execution_time_ms
      }, 'AI search completed successfully');

      return reply.code(200).send(results);
    } catch (error) {
      server.log.error({
        error,
        userId,
        query: searchQuery.query
      }, 'AI search error');

      return reply.code(500).send({
        error: 'search_failed',
        message: 'An error occurred during AI search. Please try again.'
      });
    }
  });

  /**
   * GET /ai-search/similar/:packageId
   * Get similar packages using AI
   */
  server.get('/similar/:packageId', {
    preHandler: [server.authenticate, checkPRPMPlusAccess],
    schema: {
      description: 'Get similar packages using AI embeddings (PRPM+ feature)',
      tags: ['ai-search', 'prpm-plus'],
      params: {
        type: 'object',
        required: ['packageId'],
        properties: {
          packageId: { type: 'string', format: 'uuid' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 20,
            default: 5
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            similar_packages: { type: 'array' },
            source_package_id: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { packageId } = request.params as { packageId: string };
    const { limit } = request.query as { limit?: number };

    try {
      const similarPackages = await aiSearchService.getSimilarPackages(
        packageId,
        limit || 5
      );

      return reply.code(200).send({
        similar_packages: similarPackages,
        source_package_id: packageId
      });
    } catch (error) {
      server.log.error({ error, packageId }, 'Failed to get similar packages');

      return reply.code(500).send({
        error: 'similar_packages_failed',
        message: 'Failed to retrieve similar packages'
      });
    }
  });

  /**
   * GET /ai-search/access
   * Check if user has AI search access (for frontend)
   */
  server.get('/access', {
    preHandler: [server.authenticate],
    schema: {
      description: 'Check if user has access to AI search',
      tags: ['ai-search', 'prpm-plus'],
      response: {
        200: {
          type: 'object',
          properties: {
            has_access: { type: 'boolean' },
            reason: { type: 'string' },
            trial_expires_at: { type: 'string', nullable: true },
            upgrade_info: { type: 'object', nullable: true }
          }
        }
      }
    }
  }, async (request, reply) => {
    const userId = (request.user as any).user_id;

    const userResult = await server.pg.query(
      `SELECT subscription_tier, subscription_status, trial_ends_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return reply.code(200).send({
        has_access: false,
        reason: 'user_not_found',
        trial_expires_at: null,
        upgrade_info: null
      });
    }

    const user = userResult.rows[0];
    const now = new Date();
    const trialActive = user.trial_ends_at && new Date(user.trial_ends_at) > now;

    if (user.subscription_tier === 'prpm_plus' && user.subscription_status === 'active') {
      return reply.code(200).send({
        has_access: true,
        reason: 'prpm_plus_member',
        trial_expires_at: null,
        upgrade_info: null
      });
    }

    if (trialActive) {
      return reply.code(200).send({
        has_access: true,
        reason: 'trial_active',
        trial_expires_at: user.trial_ends_at,
        upgrade_info: null
      });
    }

    return reply.code(200).send({
      has_access: false,
      reason: 'no_subscription',
      trial_expires_at: null,
      upgrade_info: {
        feature: 'AI-Powered Semantic Search',
        plan_required: 'PRPM+',
        price: '$19/month',
        current_tier: user.subscription_tier || 'free',
        upgrade_url: '/pricing',
        trial_available: !user.trial_ends_at,
        trial_duration: '14 days'
      }
    });
  });
}
