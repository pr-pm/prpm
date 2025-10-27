/**
 * Authentication setup
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { config } from '../config.js';
import type { AuthUser } from '../types/fastify.js';

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
      // Dev mode bypass for mock token
      const authHeader = request.headers.authorization;
      const isDev = config.env === 'development' || process.env.NODE_ENV === 'development';

      server.log.debug({ isDev, configEnv: config.env, nodeEnv: process.env.NODE_ENV, authHeader }, 'Auth check');

      if (isDev && authHeader === 'Bearer dev-mock-token-khaliqgant') {
        server.log.info('Dev mode: Using mock token for khaliqgant');
        // Mock user for khaliqgant in dev mode
        const { queryOne } = await import('../db/index.js');
        type User = { id: string; username: string; email: string; is_admin: boolean };
        const user = await queryOne<User>(
          server,
          'SELECT id, username, email, is_admin FROM users WHERE username = $1',
          ['khaliqgant']
        );

        if (user) {
          // Manually set the user on the request as if JWT was verified
          const authUser: AuthUser = {
            user_id: user.id,
            username: user.username,
            email: user.email,
            is_admin: user.is_admin,
            scopes: ['read:packages', 'write:packages'],
          };
          request.user = authUser;
          return;
        }
      }

      await request.jwtVerify();
    } catch (error) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Optional JWT verification (doesn't fail if no token)
  server.decorate('optionalAuth', async function (request: FastifyRequest, reply: FastifyReply) {
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
    optionalAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
