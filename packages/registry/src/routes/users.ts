/**
 * User management routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { query, queryOne } from '../db/index.js';
import { User, Package } from '../types.js';
import { optionalAuth } from '../middleware/auth.js';

export async function userRoutes(server: FastifyInstance) {
  // Get user profile
  server.get('/:username', {
    preHandler: [optionalAuth],
    schema: {
      tags: ['users'],
      description: 'Get user profile by username',
      params: {
        type: 'object',
        properties: {
          username: { type: 'string' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          include_deprecated: { type: 'boolean', default: false, description: 'Include deprecated packages (only for own profile)' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { username } = request.params as { username: string };
    const { include_deprecated = false } = request.query as { include_deprecated?: boolean };

    const user = await queryOne<User>(
      server,
      `SELECT id, username, avatar_url, verified_author, created_at
       FROM users
       WHERE username = $1 AND is_active = TRUE`,
      [username]
    );

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Check if user is viewing their own profile
    const loggedInUser = request.user;
    const isOwnProfile = loggedInUser?.user_id === user.id;

    // Only allow including deprecated packages for own profile
    const showDeprecated = include_deprecated && isOwnProfile;
    const deprecatedFilter = showDeprecated ? '' : 'AND (deprecated = false OR deprecated IS NULL)';

    // Get user's packages
    const packagesResult = await query<Package>(
      server,
      `SELECT * FROM packages
       WHERE author_id = $1 AND visibility = 'public'
         ${deprecatedFilter}
       ORDER BY total_downloads DESC`,
      [user.id]
    );

    // Get stats
    const statsResult = await queryOne<{
      total_packages: string;
      total_downloads: string;
    }>(
      server,
      `SELECT
         COUNT(*) as total_packages,
         COALESCE(SUM(total_downloads), 0) as total_downloads
       FROM packages
       WHERE author_id = $1 AND visibility = 'public'
         ${deprecatedFilter}`,
      [user.id]
    );

    return {
      ...user,
      packages: packagesResult.rows,
      stats: {
        total_packages: parseInt(statsResult?.total_packages || '0', 10),
        total_downloads: parseInt(statsResult?.total_downloads || '0', 10),
      },
      is_own_profile: isOwnProfile,
    };
  });

  // Get user's packages
  server.get('/:username/packages', {
    preHandler: [optionalAuth],
    schema: {
      tags: ['users'],
      description: 'Get packages published by user',
      params: {
        type: 'object',
        properties: {
          username: { type: 'string' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 20, minimum: 1, maximum: 100 },
          offset: { type: 'number', default: 0, minimum: 0 },
          include_deprecated: { type: 'boolean', default: false, description: 'Include deprecated packages (only for own profile)' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { username } = request.params as { username: string };
    const { limit = 20, offset = 0, include_deprecated = false } = request.query as {
      limit?: number;
      offset?: number;
      include_deprecated?: boolean;
    };

    // Get user ID
    const user = await queryOne<User>(
      server,
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Check if user is viewing their own profile
    const loggedInUser = request.user;
    const isOwnProfile = loggedInUser?.user_id === user.id;

    // Only allow including deprecated packages for own profile
    const showDeprecated = include_deprecated && isOwnProfile;
    const deprecatedFilter = showDeprecated ? '' : 'AND (deprecated = false OR deprecated IS NULL)';

    // Get packages
    const result = await query<Package>(
      server,
      `SELECT * FROM packages
       WHERE author_id = $1 AND visibility = 'public'
         ${deprecatedFilter}
       ORDER BY total_downloads DESC
       LIMIT $2 OFFSET $3`,
      [user.id, limit, offset]
    );

    // Get total count
    const countResult = await queryOne<{ count: string }>(
      server,
      `SELECT COUNT(*) as count FROM packages
       WHERE author_id = $1 AND visibility = 'public'
         ${deprecatedFilter}`,
      [user.id]
    );
    const total = parseInt(countResult?.count || '0', 10);

    return {
      packages: result.rows,
      total,
      offset,
      limit,
      is_own_profile: isOwnProfile,
    };
  });
}
