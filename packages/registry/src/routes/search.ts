/**
 * Search and discovery routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { query } from '../db/index.js';
import { cacheGet, cacheSet } from '../cache/redis.js';
import { Package, PackageType } from '../types.js';
import { getSearchProvider } from '../search/index.js';

export async function searchRoutes(server: FastifyInstance) {
  // Full-text search
  server.get('/', {
    schema: {
      tags: ['search'],
      description: 'Search packages by name, description, tags, or keywords',
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string', minLength: 2 },
          type: { type: 'string', enum: ['cursor', 'claude', 'continue', 'windsurf', 'generic'] },
          tags: { type: 'array', items: { type: 'string' } },
          limit: { type: 'number', default: 20, minimum: 1, maximum: 100 },
          offset: { type: 'number', default: 0, minimum: 0 },
          sort: { type: 'string', enum: ['downloads', 'created', 'updated', 'quality', 'rating'], default: 'downloads' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { q, type, tags, limit = 20, offset = 0, sort = 'downloads' } = request.query as {
      q: string;
      type?: PackageType;
      tags?: string[];
      limit?: number;
      offset?: number;
      sort?: 'downloads' | 'created' | 'updated' | 'quality' | 'rating';
    };

    // Build cache key
    const cacheKey = `search:${JSON.stringify(request.query)}`;

    // Check cache
    const cached = await cacheGet<any>(server, cacheKey);
    if (cached) {
      return cached;
    }

    // Use search provider (PostgreSQL or OpenSearch)
    const searchProvider = getSearchProvider(server);
    const response = await searchProvider.search(q, {
      type,
      tags,
      sort,
      limit,
      offset,
    });

    // Cache for 5 minutes
    await cacheSet(server, cacheKey, response, 300);

    return response;
  });

  // Trending packages (most downloaded in last 7 days)
  server.get('/trending', {
    schema: {
      tags: ['search'],
      description: 'Get trending packages based on recent downloads',
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['cursor', 'claude', 'continue', 'windsurf', 'generic'] },
          limit: { type: 'number', default: 20, minimum: 1, maximum: 100 },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { type, limit = 20 } = request.query as {
      type?: string;
      limit?: number;
    };

    const cacheKey = `search:trending:${type || 'all'}:${limit}`;
    const cached = await cacheGet<any>(server, cacheKey);
    if (cached) {
      return cached;
    }

    const conditions: string[] = ["visibility = 'public'"];
    const params: unknown[] = [];

    if (type) {
      conditions.push('type = $1');
      params.push(type);
    }

    const whereClause = conditions.join(' AND ');

    const result = await query<Package>(
      server,
      `SELECT * FROM packages
       WHERE ${whereClause}
       ORDER BY weekly_downloads DESC, total_downloads DESC
       LIMIT $${params.length + 1}`,
      [...params, limit]
    );

    const response = { packages: result.rows };

    // Cache for 1 hour
    await cacheSet(server, cacheKey, response, 3600);

    return response;
  });

  // Featured packages
  server.get('/featured', {
    schema: {
      tags: ['search'],
      description: 'Get featured packages',
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['cursor', 'claude', 'continue', 'windsurf', 'generic'] },
          limit: { type: 'number', default: 20, minimum: 1, maximum: 100 },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { type, limit = 20 } = request.query as {
      type?: string;
      limit?: number;
    };

    const cacheKey = `search:featured:${type || 'all'}:${limit}`;
    const cached = await cacheGet<any>(server, cacheKey);
    if (cached) {
      return cached;
    }

    const conditions: string[] = ["visibility = 'public'", 'featured = TRUE'];
    const params: unknown[] = [];

    if (type) {
      conditions.push('type = $1');
      params.push(type);
    }

    const whereClause = conditions.join(' AND ');

    const result = await query<Package>(
      server,
      `SELECT * FROM packages
       WHERE ${whereClause}
       ORDER BY quality_score DESC NULLS LAST, total_downloads DESC
       LIMIT $${params.length + 1}`,
      [...params, limit]
    );

    const response = { packages: result.rows };

    // Cache for 1 hour
    await cacheSet(server, cacheKey, response, 3600);

    return response;
  });

  // Get all unique tags
  server.get('/tags', {
    schema: {
      tags: ['search'],
      description: 'Get list of all package tags with counts',
    },
  }, async (request, reply) => {
    const cacheKey = 'search:tags';
    const cached = await cacheGet<any>(server, cacheKey);
    if (cached) {
      return cached;
    }

    const result = await query<{ tag: string; count: string }>(
      server,
      `SELECT unnest(tags) as tag, COUNT(*) as count
       FROM packages
       WHERE visibility = 'public'
       GROUP BY tag
       ORDER BY count DESC, tag ASC`
    );

    const response = {
      tags: result.rows.map(r => ({
        name: r.tag,
        count: parseInt(r.count, 10),
      })),
    };

    // Cache for 1 hour
    await cacheSet(server, cacheKey, response, 3600);

    return response;
  });

  // Get all categories
  server.get('/categories', {
    schema: {
      tags: ['search'],
      description: 'Get list of all package categories with counts',
    },
  }, async (request, reply) => {
    const cacheKey = 'search:categories';
    const cached = await cacheGet<any>(server, cacheKey);
    if (cached) {
      return cached;
    }

    const result = await query<{ category: string; count: string }>(
      server,
      `SELECT category, COUNT(*) as count
       FROM packages
       WHERE visibility = 'public' AND category IS NOT NULL
       GROUP BY category
       ORDER BY count DESC, category ASC`
    );

    const response = {
      categories: result.rows.map(r => ({
        name: r.category,
        count: parseInt(r.count, 10),
      })),
    };

    // Cache for 1 hour
    await cacheSet(server, cacheKey, response, 3600);

    return response;
  });
}
