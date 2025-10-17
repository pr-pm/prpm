/**
 * User management routes
 */

import { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db/index.js';
import { User, Package } from '../types.js';

export async function userRoutes(server: FastifyInstance) {
  // Get user profile
  server.get('/:username', {
    schema: {
      tags: ['users'],
      description: 'Get user profile by username',
      params: {
        type: 'object',
        properties: {
          username: { type: 'string' },
        },
      },
    },
  }, async (request: any, reply) => {
    const { username } = request.params;

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

    // Get user's packages
    const packagesResult = await query<Package>(
      server,
      `SELECT * FROM packages
       WHERE author_id = $1 AND visibility = 'public'
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
       WHERE author_id = $1 AND visibility = 'public'`,
      [user.id]
    );

    return {
      ...user,
      packages: packagesResult.rows,
      stats: {
        total_packages: parseInt(statsResult?.total_packages || '0', 10),
        total_downloads: parseInt(statsResult?.total_downloads || '0', 10),
      },
    };
  });

  // Get user's packages
  server.get('/:username/packages', {
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
        },
      },
    },
  }, async (request: any, reply) => {
    const { username } = request.params;
    const { limit = 20, offset = 0 } = request.query;

    // Get user ID
    const user = await queryOne<User>(
      server,
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Get packages
    const result = await query<Package>(
      server,
      `SELECT * FROM packages
       WHERE author_id = $1 AND visibility = 'public'
       ORDER BY total_downloads DESC
       LIMIT $2 OFFSET $3`,
      [user.id, limit, offset]
    );

    // Get total count
    const countResult = await queryOne<{ count: string }>(
      server,
      `SELECT COUNT(*) as count FROM packages
       WHERE author_id = $1 AND visibility = 'public'`,
      [user.id]
    );
    const total = parseInt(countResult?.count || '0', 10);

    return {
      packages: result.rows,
      total,
      offset,
      limit,
    };
  });
}
