/**
 * AI Search Routes
 * AI-powered semantic search (Free for everyone, including anonymous users)
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AISearchService } from '../services/ai-search.js';
import type { AISearchQuery } from '@pr-pm/types';

export async function aiSearchRoutes(server: FastifyInstance) {
  const aiSearchService = new AISearchService(server);

  /**
   * POST /ai-search
   * Perform AI-powered semantic search
   * No authentication required - open to everyone!
   */
  server.post('/', {
    schema: {
      description: 'AI-powered semantic search for packages (Free for everyone, no login required)',
      tags: ['ai-search'],
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
    const userId = (request.user as any)?.user_id || null; // Optional - works for anonymous users
    const searchQuery: AISearchQuery = request.body as AISearchQuery;

    try {
      const results = await aiSearchService.search(searchQuery, userId);

      server.log.info({
        userId: userId || 'anonymous',
        query: searchQuery.query,
        results_count: results.results.length,
        execution_time: results.execution_time_ms
      }, 'AI search completed successfully');

      return reply.code(200).send(results);
    } catch (error) {
      server.log.error({
        error,
        userId: userId || 'anonymous',
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
    schema: {
      description: 'Get similar packages using AI embeddings (Free for everyone, no login required)',
      tags: ['ai-search'],
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
   * Now free for everyone - always returns true
   */
  server.get('/access', {
    schema: {
      description: 'Check if user has access to AI search (Always true - free for everyone)',
      tags: ['ai-search'],
      response: {
        200: {
          type: 'object',
          properties: {
            has_access: { type: 'boolean' },
            reason: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    // AI search is now free for everyone, even anonymous users
    return reply.code(200).send({
      has_access: true,
      reason: 'free_for_all'
    });
  });
}
