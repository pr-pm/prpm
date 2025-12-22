/**
 * GitHub Package Cache Routes
 * Shared cache for GitHub repository tarballs to reduce GitHub API calls
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';

/** Cache key prefix for GitHub tarballs */
const GITHUB_CACHE_PREFIX = 'github:cache:';

/** LRU tracking sorted set */
const GITHUB_CACHE_LRU = 'github:cache:lru';

/** Maximum number of cached repos (LRU eviction after this) */
const MAX_CACHE_ITEMS = 500;

/** TTL for cached tarballs (30 days) */
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;

/** Maximum tarball size to cache (50MB) */
const MAX_TARBALL_SIZE = 50 * 1024 * 1024;

/**
 * Get cache key for a GitHub repo tarball
 */
function getCacheKey(owner: string, repo: string, sha: string): string {
  return `${GITHUB_CACHE_PREFIX}${owner}:${repo}:${sha}`;
}

export async function githubCacheRoutes(server: FastifyInstance) {
  // Add content type parser for application/gzip to accept binary tarballs
  server.addContentTypeParser('application/gzip', { parseAs: 'buffer' }, (req, body, done) => {
    done(null, body);
  });

  /**
   * Get cached GitHub tarball
   * GET /api/v1/github-cache/:owner/:repo/:sha
   */
  server.get('/:owner/:repo/:sha', {
    schema: {
      tags: ['github-cache'],
      description: 'Get cached GitHub repository tarball',
      params: {
        type: 'object',
        required: ['owner', 'repo', 'sha'],
        properties: {
          owner: { type: 'string', description: 'GitHub repository owner' },
          repo: { type: 'string', description: 'GitHub repository name' },
          sha: { type: 'string', description: 'Commit SHA' },
        },
      },
      response: {
        200: {
          description: 'Cached tarball (gzipped)',
          type: 'string',
          format: 'binary',
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { owner, repo, sha } = request.params as {
      owner: string;
      repo: string;
      sha: string;
    };

    const cacheKey = getCacheKey(owner, repo, sha);

    try {
      // Get from Redis as binary buffer
      const cached = await server.redis.getBuffer(cacheKey);

      if (!cached) {
        return reply.status(404).send({ error: 'Not found in cache' });
      }

      // Update LRU tracking (move to front)
      await server.redis.zadd(GITHUB_CACHE_LRU, Date.now(), cacheKey);

      server.log.info(
        { owner, repo, sha: sha.slice(0, 7), size: cached.length },
        'GitHub cache hit'
      );

      reply.header('Content-Type', 'application/gzip');
      reply.header('Content-Length', cached.length);
      reply.header('X-Cache', 'HIT');

      return reply.send(cached);
    } catch (error) {
      server.log.error({ error, owner, repo, sha }, 'GitHub cache get failed');
      return reply.status(500).send({ error: 'Cache error' });
    }
  });

  /**
   * Store GitHub tarball in cache
   * POST /api/v1/github-cache/:owner/:repo/:sha
   */
  server.post('/:owner/:repo/:sha', {
    schema: {
      tags: ['github-cache'],
      description: 'Store GitHub repository tarball in cache',
      params: {
        type: 'object',
        required: ['owner', 'repo', 'sha'],
        properties: {
          owner: { type: 'string', description: 'GitHub repository owner' },
          repo: { type: 'string', description: 'GitHub repository name' },
          sha: { type: 'string', description: 'Commit SHA' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            cached: { type: 'boolean' },
            size: { type: 'number' },
          },
        },
        413: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            maxSize: { type: 'number' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { owner, repo, sha } = request.params as {
      owner: string;
      repo: string;
      sha: string;
    };

    // Body is already parsed as Buffer by the content type parser
    const body = request.body as Buffer;

    if (!body || body.length === 0) {
      return reply.status(400).send({ error: 'Empty body' });
    }

    if (body.length > MAX_TARBALL_SIZE) {
      return reply.status(413).send({
        error: 'Tarball too large',
        maxSize: MAX_TARBALL_SIZE,
      });
    }

    const cacheKey = getCacheKey(owner, repo, sha);

    try {
      // Check if already cached
      const exists = await server.redis.exists(cacheKey);
      if (exists) {
        // Update LRU tracking
        await server.redis.zadd(GITHUB_CACHE_LRU, Date.now(), cacheKey);
        return { success: true, cached: false, size: body.length };
      }

      // Store in Redis with TTL
      await server.redis.setex(cacheKey, CACHE_TTL_SECONDS, body);

      // Add to LRU tracking
      await server.redis.zadd(GITHUB_CACHE_LRU, Date.now(), cacheKey);

      // Evict old entries if over limit
      const count = await server.redis.zcard(GITHUB_CACHE_LRU);
      if (count > MAX_CACHE_ITEMS) {
        // Get oldest entries to evict
        const toEvict = await server.redis.zrange(
          GITHUB_CACHE_LRU,
          0,
          count - MAX_CACHE_ITEMS - 1
        );

        if (toEvict.length > 0) {
          // Delete the cached tarballs
          await server.redis.del(...toEvict);
          // Remove from LRU set
          await server.redis.zrem(GITHUB_CACHE_LRU, ...toEvict);

          server.log.info(
            { evicted: toEvict.length },
            'Evicted old GitHub cache entries'
          );
        }
      }

      server.log.info(
        { owner, repo, sha: sha.slice(0, 7), size: body.length },
        'GitHub cache stored'
      );

      return { success: true, cached: true, size: body.length };
    } catch (error) {
      server.log.error({ error, owner, repo, sha }, 'GitHub cache store failed');
      return reply.status(500).send({ error: 'Cache error' });
    }
  });

  /**
   * Get cache stats
   * GET /api/v1/github-cache/stats
   */
  server.get('/stats', {
    schema: {
      tags: ['github-cache'],
      description: 'Get GitHub cache statistics',
      response: {
        200: {
          type: 'object',
          properties: {
            count: { type: 'number', description: 'Number of cached items' },
            maxItems: { type: 'number', description: 'Maximum cache size' },
            ttlSeconds: { type: 'number', description: 'TTL for cached items' },
          },
        },
      },
    },
  }, async () => {
    const count = await server.redis.zcard(GITHUB_CACHE_LRU);

    return {
      count,
      maxItems: MAX_CACHE_ITEMS,
      ttlSeconds: CACHE_TTL_SECONDS,
    };
  });
}
