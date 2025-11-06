/**
 * Custom Prompt Routes (Simplified Approach)
 *
 * SECURITY: Isolation-based security (no complex validation)
 * - No tools enabled (text-only)
 * - Custom prompt IS the system (no other context)
 * - User sees everything (transparent)
 * - Rate limited per user
 * - 2x credit cost
 *
 * For verified authors only.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PlaygroundService } from '../services/playground.js';
import { createRateLimiter } from '../middleware/rate-limit.js';
import { sanitizeUserInput, SECURITY_LIMITS } from '../middleware/security.js';

const CustomPromptRunSchema = z.object({
  custom_prompt: z.string()
    .min(10, 'Custom prompt too short (minimum 10 characters)')
    .max(50000, 'Custom prompt too long (maximum 50000 characters)'),
  input: z.string()
    .min(1, 'User input is required')
    .max(SECURITY_LIMITS.MAX_USER_INPUT_LENGTH),
  model: z.enum(['sonnet', 'opus', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo']).optional().default('sonnet'),
  session_id: z.string().uuid().optional(),
});

export async function customPromptRoutes(server: FastifyInstance) {
  const playgroundService = new PlaygroundService(server);
  const rateLimiter = createRateLimiter();

  // =====================================================
  // POST /api/v1/custom-prompt/run
  // Execute playground with custom prompt (verified authors only)
  // =====================================================
  server.post(
    '/run',
    {
      preHandler: [server.authenticate, rateLimiter],
      schema: {
        description: 'Execute playground with custom prompt (verified authors only, isolated sandbox)',
        tags: ['custom-prompt'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['custom_prompt', 'input'],
          properties: {
            custom_prompt: {
              type: 'string',
              minLength: 10,
              maxLength: 50000,
              description: 'Your custom system prompt (will be used as-is, no other context)',
            },
            input: {
              type: 'string',
              minLength: 1,
              maxLength: 10000,
              description: 'Test input to send to the model',
            },
            model: {
              type: 'string',
              enum: ['sonnet', 'opus', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
              default: 'sonnet',
            },
            session_id: {
              type: 'string',
              format: 'uuid',
              description: 'Optional session ID for conversation continuity',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              session_id: { type: 'string' },
              response: { type: 'string' },
              credits_spent: { type: 'number' },
              credits_remaining: { type: 'number' },
              tokens_used: { type: 'number' },
              duration_ms: { type: 'number' },
              model: { type: 'string' },
              is_custom_prompt: { type: 'boolean' },
              warnings: { type: 'array' },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = CustomPromptRunSchema.parse(request.body);
        const userId = request.user?.user_id;

        if (!userId) {
          return reply.code(401).send({
            error: 'unauthorized',
            message: 'Authentication required',
          });
        }

        // SECURITY: Verify user is a verified author
        const userCheck = await server.pg.query(
          'SELECT verified_author FROM users WHERE id = $1',
          [userId]
        );

        if (!userCheck.rows[0]?.verified_author) {
          server.log.warn({ userId }, 'Non-verified user attempted custom prompt');

          return reply.code(403).send({
            error: 'verified_author_required',
            message: 'Custom prompts are only available to verified authors. Link your GitHub account to get verified.',
          });
        }

        // Simple usability checks (warnings only, never block)
        const warnings: string[] = [];

        if (body.custom_prompt.length < 50) {
          warnings.push('Your custom prompt is very short. Consider adding more context for better results.');
        }

        if (body.custom_prompt.length > 20000) {
          warnings.push('Your custom prompt is very long. This will be expensive and may hit token limits.');
        }

        // Check for common issues (helpful, not blocking)
        if (/ignore.*previous/i.test(body.custom_prompt)) {
          warnings.push('Tip: Phrases like "ignore previous" may confuse the AI.');
        }

        // Sanitize user input
        const input = sanitizeUserInput(body.input);

        server.log.info({
          userId,
          customPromptLength: body.custom_prompt.length,
          inputLength: input.length,
          model: body.model,
          warningCount: warnings.length,
        }, 'Custom prompt execution (verified author)');

        // Execute with strict isolation
        const result = await playgroundService.executeCustomPrompt(userId, {
          custom_prompt: body.custom_prompt,
          input,
          session_id: body.session_id,
          model: body.model,
        });

        return reply.code(200).send({
          ...result,
          is_custom_prompt: true,
          warnings: warnings.length > 0 ? warnings : undefined,
        });
      } catch (error: any) {
        server.log.error({ error }, 'Custom prompt execution failed');

        if (error.name === 'ZodError') {
          return reply.code(400).send({
            error: 'validation_error',
            message: error.errors[0]?.message || 'Invalid request data',
          });
        }

        // Handle insufficient credits
        if (error.message?.includes('Insufficient credits')) {
          const match = error.message.match(/Need (\d+) but have (\d+)/);
          if (match) {
            return reply.code(402).send({
              error: 'insufficient_credits',
              message: error.message,
              required_credits: parseInt(match[1]),
              available_credits: parseInt(match[2]),
              purchase_url: '/playground/credits/buy',
            });
          }
        }

        return reply.code(500).send({
          error: 'execution_failed',
          message: error.message || 'Failed to execute custom prompt',
        });
      }
    }
  );

  // =====================================================
  // GET /api/v1/custom-prompt/info
  // Get information about custom prompt feature
  // =====================================================
  server.get(
    '/info',
    {
      schema: {
        description: 'Get information about custom prompt feature',
        tags: ['custom-prompt'],
        response: {
          200: {
            type: 'object',
            properties: {
              available: { type: 'boolean' },
              requirements: { type: 'object' },
              limits: { type: 'object' },
              pricing: { type: 'object' },
              tips: { type: 'array' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Check if user is authenticated and verified
      let available = false;
      if (request.user?.user_id) {
        const userCheck = await server.pg.query(
          'SELECT verified_author FROM users WHERE id = $1',
          [request.user.user_id]
        );
        available = userCheck.rows[0]?.verified_author || false;
      }

      return reply.code(200).send({
        available,
        requirements: {
          verified_author: true,
          github_linked: true,
          description: 'Link your GitHub account to become a verified author',
        },
        limits: {
          max_prompt_length: 50000,
          min_prompt_length: 10,
          recommended_length: '500-5000 characters',
          max_tokens_output: 1024,
          max_conversation_turns: 3,
          timeout_seconds: 30,
        },
        pricing: {
          credit_multiplier: 2.0,
          description: 'Custom prompts cost 2x normal credits due to no caching',
          example: 'Sonnet normally 2 credits → Custom prompt 4 credits',
        },
        sandbox: {
          tools_enabled: false,
          description: 'Custom prompts run in isolated sandbox (text-only, no WebFetch/Task)',
          why: 'Your custom prompt IS the entire system - no other context or tools available',
        },
        tips: [
          'Be clear and specific about the role/task',
          'Keep prompts under 5000 characters for best results',
          'Test with simple inputs first',
          'Use comparison mode to test against published packages',
          'Your prompt is fully visible in the UI (transparent)',
        ],
      });
    }
  );
}
