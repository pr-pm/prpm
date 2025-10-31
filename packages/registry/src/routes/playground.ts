/**
 * Playground API Routes
 *
 * Handles playground execution, session management, and sharing.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PlaygroundService } from '../services/playground.js';
import { PlaygroundCreditsService } from '../services/playground-credits.js';

// Request validation schemas
const PlaygroundRunSchema = z.object({
  packageId: z.string().uuid('Invalid package ID'),
  packageVersion: z.string().optional(),
  userInput: z.string().min(1, 'User input is required').max(10000, 'Input too long'),
  conversationId: z.string().uuid().optional(),
  model: z.enum(['sonnet', 'opus']).optional().default('sonnet'),
});

const EstimateCreditSchema = z.object({
  packageId: z.string().uuid('Invalid package ID'),
  userInput: z.string().min(1).max(10000),
  model: z.enum(['sonnet', 'opus']).optional().default('sonnet'),
});

const ShareSessionSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
});

export async function playgroundRoutes(server: FastifyInstance) {
  const playgroundService = new PlaygroundService(server);
  const creditsService = new PlaygroundCreditsService(server);

  // =====================================================
  // POST /api/v1/playground/run
  // Execute a playground run
  // =====================================================
  server.post(
    '/run',
    {
      preHandler: server.authenticate,
      schema: {
        description: 'Execute a playground run with a package prompt',
        tags: ['playground'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['packageId', 'userInput'],
          properties: {
            packageId: { type: 'string', format: 'uuid' },
            packageVersion: { type: 'string' },
            userInput: { type: 'string', minLength: 1, maxLength: 10000 },
            conversationId: { type: 'string', format: 'uuid' },
            model: { type: 'string', enum: ['sonnet', 'opus'], default: 'sonnet' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              response: { type: 'string' },
              conversationId: { type: 'string' },
              creditsSpent: { type: 'number' },
              creditsRemaining: { type: 'number' },
              tokensUsed: { type: 'number' },
              durationMs: { type: 'number' },
              model: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          402: {
            type: 'object',
            properties: {
              error: { type: 'string', enum: ['insufficient_credits'] },
              message: { type: 'string' },
              requiredCredits: { type: 'number' },
              availableCredits: { type: 'number' },
              purchaseUrl: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = PlaygroundRunSchema.parse(request.body);
        const userId = request.user?.user_id;

        if (!userId) {
          return reply.code(401).send({
            error: 'unauthorized',
            message: 'User not authenticated',
          });
        }

        server.log.info(
          { userId, packageId: body.packageId, conversationId: body.conversationId },
          'Starting playground run'
        );

        const result = await playgroundService.executePrompt(userId, body);

        return reply.code(200).send(result);
      } catch (error: any) {
        server.log.error({ error }, 'Playground run failed');

        // Handle insufficient credits
        if (error.message?.includes('Insufficient credits')) {
          const match = error.message.match(/Need (\d+) but have (\d+)/);
          if (match) {
            return reply.code(402).send({
              error: 'insufficient_credits',
              message: error.message,
              requiredCredits: parseInt(match[1]),
              availableCredits: parseInt(match[2]),
              purchaseUrl: '/playground/credits/buy',
            });
          }
        }

        return reply.code(400).send({
          error: 'playground_run_failed',
          message: error.message || 'Failed to execute playground run',
        });
      }
    }
  );

  // =====================================================
  // POST /api/v1/playground/estimate
  // Estimate credit cost before running
  // =====================================================
  server.post(
    '/estimate',
    {
      preHandler: server.authenticate,
      schema: {
        description: 'Estimate credit cost for a playground run',
        tags: ['playground'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['packageId', 'userInput'],
          properties: {
            packageId: { type: 'string', format: 'uuid' },
            userInput: { type: 'string', minLength: 1, maxLength: 10000 },
            model: { type: 'string', enum: ['sonnet', 'opus'], default: 'sonnet' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              estimatedCredits: { type: 'number' },
              estimatedTokens: { type: 'number' },
              model: { type: 'string' },
              canAfford: { type: 'boolean' },
              currentBalance: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = EstimateCreditSchema.parse(request.body);
        const userId = request.user?.user_id;

        if (!userId) {
          return reply.code(401).send({
            error: 'unauthorized',
            message: 'User not authenticated',
          });
        }

        // Load package prompt to estimate
        const packagePrompt = await playgroundService.loadPackagePrompt(body.packageId);

        // Estimate credits
        const estimatedCredits = playgroundService.estimateCredits(
          packagePrompt.length,
          body.userInput.length,
          body.model
        );

        const estimatedTokens = Math.floor(
          ((packagePrompt.length + body.userInput.length) / 4) * 1.3
        );

        // Check if user can afford
        const canAfford = await creditsService.canAfford(userId, estimatedCredits);
        const balance = await creditsService.getBalance(userId);

        return reply.code(200).send({
          estimatedCredits,
          estimatedTokens,
          model: body.model === 'opus' ? 'claude-3-opus-20240229' : 'claude-3-5-sonnet-20241022',
          canAfford,
          currentBalance: balance.balance,
        });
      } catch (error: any) {
        server.log.error({ error }, 'Credit estimation failed');
        return reply.code(400).send({
          error: 'estimation_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // GET /api/v1/playground/sessions
  // List user's playground sessions
  // =====================================================
  server.get(
    '/sessions',
    {
      preHandler: server.authenticate,
      schema: {
        description: 'List user playground sessions',
        tags: ['playground'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 20, maximum: 100 },
            offset: { type: 'number', default: 0 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              sessions: { type: 'array' },
              total: { type: 'number' },
              pagination: {
                type: 'object',
                properties: {
                  limit: { type: 'number' },
                  offset: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user?.user_id;

        if (!userId) {
          return reply.code(401).send({
            error: 'unauthorized',
            message: 'User not authenticated',
          });
        }
        const { limit = 20, offset = 0 } = request.query as any;

        const result = await playgroundService.listSessions(userId, {
          limit: Math.min(limit, 100),
          offset,
        });

        return reply.code(200).send({
          sessions: result.sessions,
          total: result.total,
          pagination: {
            limit,
            offset,
          },
        });
      } catch (error: any) {
        server.log.error({ error }, 'Failed to list sessions');
        return reply.code(500).send({
          error: 'list_sessions_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // GET /api/v1/playground/sessions/:id
  // Get specific session
  // =====================================================
  server.get(
    '/sessions/:id',
    {
      preHandler: server.authenticate,
      schema: {
        description: 'Get a specific playground session',
        tags: ['playground'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user?.user_id;

        if (!userId) {
          return reply.code(401).send({
            error: 'unauthorized',
            message: 'User not authenticated',
          });
        }

        const session = await playgroundService.getSession(id, userId);

        if (!session) {
          return reply.code(404).send({
            error: 'session_not_found',
            message: 'Session not found or unauthorized',
          });
        }

        return reply.code(200).send(session);
      } catch (error: any) {
        server.log.error({ error }, 'Failed to get session');
        return reply.code(500).send({
          error: 'get_session_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // DELETE /api/v1/playground/sessions/:id
  // Delete a session
  // =====================================================
  server.delete(
    '/sessions/:id',
    {
      preHandler: server.authenticate,
      schema: {
        description: 'Delete a playground session',
        tags: ['playground'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user?.user_id;

        if (!userId) {
          return reply.code(401).send({
            error: 'unauthorized',
            message: 'User not authenticated',
          });
        }

        await playgroundService.deleteSession(id, userId);

        return reply.code(200).send({
          message: 'Session deleted successfully',
        });
      } catch (error: any) {
        server.log.error({ error }, 'Failed to delete session');
        return reply.code(400).send({
          error: 'delete_session_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // POST /api/v1/playground/sessions/:id/share
  // Share a session publicly
  // =====================================================
  server.post(
    '/sessions/:id/share',
    {
      preHandler: server.authenticate,
      schema: {
        description: 'Share a playground session publicly',
        tags: ['playground'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              shareToken: { type: 'string' },
              shareUrl: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user?.user_id;

        if (!userId) {
          return reply.code(401).send({
            error: 'unauthorized',
            message: 'User not authenticated',
          });
        }

        const shareToken = await playgroundService.shareSession(id, userId);

        // Build share URL
        const baseUrl = process.env.FRONTEND_URL || 'https://prpm.dev';
        const shareUrl = `${baseUrl}/playground/shared/${shareToken}`;

        return reply.code(200).send({
          shareToken,
          shareUrl,
        });
      } catch (error: any) {
        server.log.error({ error }, 'Failed to share session');
        return reply.code(400).send({
          error: 'share_session_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // GET /api/v1/playground/shared/:token
  // Get shared session (public access)
  // =====================================================
  server.get(
    '/shared/:token',
    {
      schema: {
        description: 'Get a publicly shared playground session',
        tags: ['playground'],
        params: {
          type: 'object',
          properties: {
            token: { type: 'string' },
          },
          required: ['token'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { token } = request.params as { token: string };

        const session = await playgroundService.getSessionByShareToken(token);

        if (!session) {
          return reply.code(404).send({
            error: 'session_not_found',
            message: 'Shared session not found',
          });
        }

        return reply.code(200).send(session);
      } catch (error: any) {
        server.log.error({ error }, 'Failed to get shared session');
        return reply.code(500).send({
          error: 'get_shared_session_failed',
          message: error.message,
        });
      }
    }
  );
}
