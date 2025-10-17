/**
 * Route registration
 */

import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.js';
import { packageRoutes } from './packages.js';
import { searchRoutes } from './search.js';
import { userRoutes } from './users.js';

export async function registerRoutes(server: FastifyInstance) {
  // API v1 routes
  server.register(
    async (api) => {
      await api.register(authRoutes, { prefix: '/auth' });
      await api.register(packageRoutes, { prefix: '/packages' });
      await api.register(searchRoutes, { prefix: '/search' });
      await api.register(userRoutes, { prefix: '/users' });
    },
    { prefix: '/api/v1' }
  );

  server.log.info('✅ Routes registered');
}
