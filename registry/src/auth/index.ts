/**
 * Authentication setup
 */

import { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyOauth2 from '@fastify/oauth2';
import { config } from '../config.js';

export async function setupAuth(server: FastifyInstance) {
  // JWT authentication
  await server.register(fastifyJwt, {
    secret: config.jwt.secret,
  });

  // GitHub OAuth
  if (config.github.clientId && config.github.clientSecret) {
    await server.register(fastifyOauth2, {
      name: 'githubOAuth2',
      credentials: {
        client: {
          id: config.github.clientId,
          secret: config.github.clientSecret,
        },
        auth: fastifyOauth2.GITHUB_CONFIGURATION,
      },
      startRedirectPath: '/api/v1/auth/github',
      callbackUri: config.github.callbackUrl,
      scope: ['user:email', 'read:user'],
    });

    server.log.info('✅ GitHub OAuth configured');
  } else {
    server.log.warn('⚠️  GitHub OAuth not configured (missing credentials)');
  }

  // JWT verification decorator
  server.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (error) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Optional JWT verification (doesn't fail if no token)
  server.decorate('optionalAuth', async function (request: any) {
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
    authenticate: (request: any, reply: any) => Promise<void>;
    optionalAuth: (request: any) => Promise<void>;
  }
}
