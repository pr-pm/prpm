/**
 * Authentication setup
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { config } from '../config.js';

export async function setupAuth(server: FastifyInstance) {
  // JWT authentication
  await server.register(fastifyJwt, {
    secret: config.jwt.secret,
  });

  // Nango configuration check
  if (config.nango.apiKey && config.nango.host) {
    server.log.info('✅ Nango configured for GitHub authentication');
  } else {
    server.log.warn('⚠️  Nango not configured (missing API key or host)');
  }

  // JWT verification decorator
  server.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (error) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Optional JWT verification (doesn't fail if no token)
  server.decorate('optionalAuth', async function (request: FastifyRequest) {
    try {
      await request.jwtVerify();
    } catch {
      // Ignore errors, just don't set user
    }
  });
}

// Type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    optionalAuth: (request: FastifyRequest) => Promise<void>;
  }
}
