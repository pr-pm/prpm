/**
 * Rate Limiting Middleware for Playground
 *
 * Implements tiered rate limiting based on user subscription level:
 * - Free users: 5 requests per minute
 * - PRPM+ users: 20 requests per minute
 * - Organization members: 100 requests per minute
 *
 * SECURITY: Uses Redis for distributed rate limiting (persistent across restarts)
 */

import { FastifyRequest, FastifyReply } from 'fastify';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Get rate limit configuration based on user tier
 */
async function getRateLimitConfig(
  server: any,
  userId: string
): Promise<RateLimitConfig> {
  try {
    // Check if user has PRPM+ subscription
    const userResult = await server.pg.query(
      `SELECT prpm_plus_status FROM users WHERE id = $1`,
      [userId]
    );

    const isSubscriber = userResult.rows[0]?.prpm_plus_status === 'active';

    if (isSubscriber) {
      return {
        maxRequests: 20,
        windowMs: 60000, // 1 minute
      };
    }

    // Check if user is member of verified organization
    const orgResult = await server.pg.query(
      `SELECT o.id, o.is_verified
       FROM organization_members om
       JOIN organizations o ON om.org_id = o.id
       WHERE om.user_id = $1 AND o.is_verified = TRUE
       LIMIT 1`,
      [userId]
    );

    const isOrgMember = orgResult.rows.length > 0;

    if (isOrgMember) {
      return {
        maxRequests: 100,
        windowMs: 60000, // 1 minute
      };
    }

    // Free tier
    return {
      maxRequests: 5,
      windowMs: 60000, // 1 minute
    };
  } catch (error) {
    // On error, use conservative limits
    return {
      maxRequests: 5,
      windowMs: 60000,
    };
  }
}

/**
 * Rate limit middleware factory using Redis
 * SECURITY: Distributed rate limiting that persists across server restarts
 */
export function createRateLimiter() {
  return async function rateLimitMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const userId = (request.user as any)?.user_id;

    if (!userId) {
      // No user ID, skip rate limiting (auth middleware will handle)
      return;
    }

    // Get user's rate limit config
    const config = await getRateLimitConfig(request.server, userId);

    // Create unique key for this user
    const key = `ratelimit:playground:${userId}`;
    const now = Date.now();
    const windowSeconds = Math.ceil(config.windowMs / 1000);

    try {
      // SECURITY: Use Redis for distributed rate limiting
      const redis = request.server.redis;

      // Get current count
      const currentCount = await redis.get(key);
      const count = currentCount ? parseInt(currentCount, 10) : 0;

      // Get TTL to calculate reset time
      const ttl = await redis.ttl(key);
      const resetAt = ttl > 0 ? now + (ttl * 1000) : now + config.windowMs;

      if (count === 0) {
        // First request in window
        await redis.setex(key, windowSeconds, '1');

        reply.header('X-RateLimit-Limit', config.maxRequests);
        reply.header('X-RateLimit-Remaining', config.maxRequests - 1);
        reply.header('X-RateLimit-Reset', Math.ceil((now + config.windowMs) / 1000));

        return;
      }

      // Increment counter
      const newCount = count + 1;
      await redis.setex(key, windowSeconds, String(newCount));

      // Add rate limit headers
      reply.header('X-RateLimit-Limit', config.maxRequests);
      reply.header('X-RateLimit-Remaining', Math.max(0, config.maxRequests - newCount));
      reply.header('X-RateLimit-Reset', Math.ceil(resetAt / 1000));

      // Check if limit exceeded
      if (newCount > config.maxRequests) {
        const retryAfter = Math.ceil((resetAt - now) / 1000);

        reply.header('Retry-After', retryAfter);

        return reply.code(429).send({
          error: 'rate_limit_exceeded',
          message: `Rate limit exceeded. Maximum ${config.maxRequests} requests per minute.`,
          retryAfter,
          upgradeUrl: '/playground/credits',
        });
      }
    } catch (error) {
      // FALLBACK: If Redis fails, log error but allow request (fail open)
      request.server.log.error({ error, userId }, 'Rate limiting Redis error - allowing request');
      return;
    }
  };
}

/**
 * Stricter rate limit for credit purchases to prevent abuse
 * SECURITY: Uses Redis for persistent rate limiting
 */
export function createPurchaseRateLimiter() {
  return async function purchaseRateLimitMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const userId = (request.user as any)?.user_id;

    if (!userId) {
      return;
    }

    const key = `ratelimit:purchase:${userId}`;
    const now = Date.now();
    const windowSeconds = 60; // 1 minute
    const maxRequests = 3; // Only 3 purchase attempts per minute

    try {
      const redis = request.server.redis;

      // Get current count
      const currentCount = await redis.get(key);
      const count = currentCount ? parseInt(currentCount, 10) : 0;

      // Get TTL
      const ttl = await redis.ttl(key);
      const resetAt = ttl > 0 ? now + (ttl * 1000) : now + (windowSeconds * 1000);

      if (count === 0) {
        // First request in window
        await redis.setex(key, windowSeconds, '1');
        return;
      }

      // Increment counter
      const newCount = count + 1;
      await redis.setex(key, windowSeconds, String(newCount));

      if (newCount > maxRequests) {
        const retryAfter = Math.ceil((resetAt - now) / 1000);

        reply.header('Retry-After', retryAfter);

        return reply.code(429).send({
          error: 'rate_limit_exceeded',
          message: 'Too many purchase attempts. Please try again later.',
          retryAfter,
        });
      }
    } catch (error) {
      // FALLBACK: If Redis fails, log error but allow request
      request.server.log.error({ error, userId }, 'Purchase rate limiting Redis error - allowing request');
      return;
    }
  };
}
