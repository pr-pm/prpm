/**
 * Newsletter subscription routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { queryOne } from '../db/index.js';
import { toError, getErrorMessage } from '../types/errors.js';

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type SubscribeRequest = FastifyRequest<{
  Body: z.infer<typeof subscribeSchema>;
}>;

export async function newsletterRoutes(server: FastifyInstance) {
  /**
   * POST /api/v1/newsletter/subscribe
   * Subscribe to newsletter
   */
  server.post(
    '/subscribe',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: SubscribeRequest, reply: FastifyReply) => {
      try {
        // Validate request body
        const { email } = subscribeSchema.parse(request.body);

        // Get IP address and user agent for tracking
        const ipAddress = request.ip;
        const userAgent = request.headers['user-agent'] || null;

        // Insert or update subscriber
        // Using ON CONFLICT to handle duplicate emails gracefully
        const subscriber = await queryOne<{ id: string; email: string }>(
          server,
          `INSERT INTO newsletter_subscribers (email, ip_address, user_agent, confirmed)
           VALUES ($1, $2, $3, TRUE)
           ON CONFLICT (email)
           DO UPDATE SET
             ip_address = EXCLUDED.ip_address,
             user_agent = EXCLUDED.user_agent,
             updated_at = NOW(),
             unsubscribed_at = NULL
           WHERE newsletter_subscribers.unsubscribed_at IS NOT NULL
           RETURNING id, email`,
          [email, ipAddress, userAgent]
        );

        if (subscriber) {
          server.log.info({ email, subscriberId: subscriber.id }, 'Newsletter subscription created/updated');

          return reply.send({
            success: true,
            message: 'Successfully subscribed to the newsletter!',
          });
        } else {
          // Email already subscribed and not unsubscribed
          server.log.info({ email }, 'Newsletter subscription already exists');

          return reply.send({
            success: true,
            message: 'You are already subscribed to the newsletter!',
          });
        }
      } catch (error: unknown) {
        const err = toError(error);

        // Handle validation errors
        if (err.name === 'ZodError') {
          return reply.code(400).send({
            error: 'Invalid email address',
          });
        }

        server.log.error({ error: err }, 'Newsletter subscription error');
        return reply.code(500).send({
          error: 'Failed to subscribe to newsletter',
        });
      }
    }
  );

  server.log.info('✅ Newsletter routes registered');
}
