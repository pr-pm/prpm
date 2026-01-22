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
 * Rate limiter for package publishing with token bucket algorithm
 * SECURITY: Uses Redis for persistent rate limiting with queuing for bulk publishes
 *
 * Token Bucket Algorithm:
 * - Burst capacity: 20 tokens (allows bulk publishing up to 20 packages immediately)
 * - Refill rate: 10 tokens per minute (sustainable rate)
 * - Max queue wait: 30 seconds (prevents infinite hangs)
 *
 * This allows bulk publishing to proceed smoothly while preventing abuse
 */
export function createPublishRateLimiter() {
  return async function publishRateLimitMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const userId = (request.user as any)?.user_id;

    if (!userId) {
      return; // Auth middleware will handle this
    }

    const key = `ratelimit:publish:tokens:${userId}`;
    const now = Date.now();

    // Check for CI_MODE to bypass strict limits for testing
    const isCI = process.env.CI_MODE === 'true';

    // Token bucket parameters
    const maxTokens = isCI ? 1000 : 20;           // Burst capacity (can publish 20 immediately)
    const refillRate = isCI ? 1000 / 60 : 10 / 60;     // 10 tokens per minute (or 1000 in CI)
    const maxWaitMs = isCI ? 120000 : 30000;        // Max 30 seconds wait time (or 2m in CI)

    try {
      const redis = request.server.redis;

      // Get current token count and last refill time
      const data = await redis.get(key);
      let tokens: number;
      let lastRefill: number;

      if (!data) {
        // First request - start with full bucket
        tokens = maxTokens;
        lastRefill = now;
      } else {
        const [storedTokens, storedTime] = data.split(':').map(Number);

        // Calculate tokens added since last refill
        const timePassed = (now - storedTime) / 1000; // in seconds
        const tokensToAdd = timePassed * refillRate;
        tokens = Math.min(maxTokens, storedTokens + tokensToAdd);
        lastRefill = now;
      }

      // Check if we have tokens available
      if (tokens >= 1) {
        // Consume 1 token
        tokens -= 1;

        // Store updated token count (expire after 2 minutes of inactivity)
        await redis.setex(key, 120, `${tokens}:${lastRefill}`);

        // Add rate limit headers
        reply.header('X-RateLimit-Limit', maxTokens);
        reply.header('X-RateLimit-Remaining', Math.floor(tokens));
        reply.header('X-RateLimit-Bucket', 'token-bucket');

        return; // Proceed with request
      }

      // No tokens available - calculate wait time
      const tokensNeeded = 1 - tokens; // How many tokens we need
      const waitTimeMs = Math.ceil((tokensNeeded / refillRate) * 1000);

      if (waitTimeMs > maxWaitMs) {
        // Wait time too long - reject with 429
        reply.header('X-RateLimit-Limit', maxTokens);
        reply.header('X-RateLimit-Remaining', 0);
        reply.header('Retry-After', Math.ceil(waitTimeMs / 1000));

        request.server.log.warn({
          userId,
          waitTimeMs,
          tokens,
        }, 'Publish rate limit exceeded - wait time too long');

        return reply.code(429).send({
          error: 'rate_limit_exceeded',
          message: `Publishing rate limit exceeded. Please wait ${Math.ceil(waitTimeMs / 1000)} seconds before trying again.`,
          retryAfter: Math.ceil(waitTimeMs / 1000),
        });
      }

      // Wait for tokens to refill, then proceed
      request.server.log.info({
        userId,
        waitTimeMs,
        tokensAvailable: tokens,
      }, 'Publish request queued - waiting for rate limit tokens');

      await new Promise(resolve => setTimeout(resolve, waitTimeMs));

      // After waiting, recalculate tokens
      const dataAfterWait = await redis.get(key);
      if (dataAfterWait) {
        const [storedTokens, storedTime] = dataAfterWait.split(':').map(Number);
        const timePassed = (Date.now() - storedTime) / 1000;
        const tokensToAdd = timePassed * refillRate;
        tokens = Math.min(maxTokens, storedTokens + tokensToAdd);
      } else {
        tokens = maxTokens;
      }

      // Consume 1 token
      tokens = Math.max(0, tokens - 1);

      // Store updated token count
      await redis.setex(key, 120, `${tokens}:${Date.now()}`);

      // Add rate limit headers
      reply.header('X-RateLimit-Limit', maxTokens);
      reply.header('X-RateLimit-Remaining', Math.floor(tokens));
      reply.header('X-RateLimit-Waited', waitTimeMs);

      request.server.log.info({
        userId,
        waitedMs: waitTimeMs,
        tokensRemaining: Math.floor(tokens),
      }, 'Publish request proceeded after queue wait');

      return; // Proceed with request

    } catch (error) {
      // SECURITY: Fail closed on Redis errors - reject the request
      request.server.log.error({ error, userId }, 'Publish rate limiting Redis error - rejecting request');
      return reply.code(503).send({
        error: 'Service Unavailable',
        message: 'Rate limiting service temporarily unavailable. Please try again.',
        retryAfter: 30,
      });
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

/**
 * Global system-wide rate limiter for package publishing
 * SECURITY: Prevents system overload from multiple users publishing simultaneously
 *
 * Uses a sliding window counter approach:
 * - Shared across ALL users (not per-user)
 * - Limit: 50 publishes per minute system-wide (1000 in CI mode)
 * - Fails CLOSED on Redis errors to prevent abuse during outages
 *
 * @returns Fastify middleware function
 */
export function createGlobalPublishRateLimiter() {
  return async function globalPublishRateLimitMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const key = 'ratelimit:publish:global';
    const now = Date.now();

    // Check for CI_MODE to allow higher limits for testing
    const isCI = process.env.CI_MODE === 'true';

    // Global rate limit parameters
    const maxRequestsPerMinute = isCI ? 1000 : 50;
    const windowSeconds = 60;

    try {
      const redis = request.server.redis;

      // Use atomic INCR to prevent race conditions under high concurrency
      const newCount = await redis.incr(key);

      // Set TTL on first request in window (when count becomes 1)
      if (newCount === 1) {
        await redis.expire(key, windowSeconds);
      }

      // Get TTL to calculate reset time
      const ttl = await redis.ttl(key);
      const resetAt = ttl > 0 ? now + (ttl * 1000) : now + (windowSeconds * 1000);

      // Add rate limit headers
      reply.header('X-Global-RateLimit-Limit', maxRequestsPerMinute);
      reply.header('X-Global-RateLimit-Remaining', Math.max(0, maxRequestsPerMinute - newCount));
      reply.header('X-Global-RateLimit-Reset', Math.ceil(resetAt / 1000));

      // Check if limit exceeded
      if (newCount > maxRequestsPerMinute) {
        const retryAfter = Math.ceil((resetAt - now) / 1000);

        reply.header('Retry-After', retryAfter);

        request.server.log.warn({
          count: newCount,
          limit: maxRequestsPerMinute,
        }, 'Global publish rate limit exceeded');

        return reply.code(429).send({
          error: 'rate_limit_exceeded',
          message: 'System publish rate limit exceeded. The registry is experiencing high traffic. Please try again shortly.',
          retryAfter,
        });
      }
    } catch (error) {
      // SECURITY: Fail closed on Redis errors - reject the request
      request.server.log.error({ error }, 'Global rate limiting Redis error - rejecting request');
      return reply.code(503).send({
        error: 'Service Unavailable',
        message: 'Rate limiting service temporarily unavailable. Please try again.',
        retryAfter: 30,
      });
    }
  };
}

/**
 * Daily quota limiter for package publishing
 * SECURITY: Enforces per-user daily publish limits to prevent abuse
 *
 * Quota tiers:
 * - Free users: 50 packages per day
 * - PRPM+ subscribers (prpm_plus_status = 'active'): 200 packages per day
 * - Verified organization members: 500 packages per day
 *
 * Uses Redis INCR with daily keys (YYYY-MM-DD format)
 * TTL of 48 hours allows for timezone differences
 * Fails CLOSED on Redis errors
 *
 * @returns Fastify middleware function
 */
export function createDailyPublishQuota() {
  // Check for CI_MODE to allow higher limits for testing
  const isCI = process.env.CI_MODE === 'true';

  return async function dailyPublishQuotaMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const userId = (request.user as any)?.user_id;

    if (!userId) {
      return; // Auth middleware will handle this
    }

    // CI_MODE: Skip quota checks entirely for integration testing
    if (isCI) {
      return;
    }

    // Get current date in YYYY-MM-DD format (UTC)
    const today = new Date().toISOString().split('T')[0];
    const key = `quota:publish:daily:${userId}:${today}`;

    // TTL of 48 hours (172800 seconds) to handle timezone differences
    const ttlSeconds = 172800;

    try {
      const redis = request.server.redis;

      // Determine user's quota tier
      let dailyLimit = 50; // Default: free tier
      let tier = 'free';

      // Check if user has PRPM+ subscription
      const userResult = await request.server.pg.query(
        `SELECT prpm_plus_status FROM users WHERE id = $1`,
        [userId]
      );

      const isSubscriber = userResult.rows[0]?.prpm_plus_status === 'active';

      if (isSubscriber) {
        dailyLimit = 200;
        tier = 'prpm_plus';
      }

      // Check if user is member of verified organization (higher priority)
      const orgResult = await request.server.pg.query(
        `SELECT o.id, o.is_verified
         FROM organization_members om
         JOIN organizations o ON om.org_id = o.id
         WHERE om.user_id = $1 AND o.is_verified = TRUE
         LIMIT 1`,
        [userId]
      );

      const isOrgMember = orgResult.rows.length > 0;

      if (isOrgMember) {
        dailyLimit = 500;
        tier = 'organization';
      }

      // Use atomic INCR to prevent race conditions under high concurrency
      const newCount = await redis.incr(key);

      // Set TTL on first request (when count becomes 1)
      if (newCount === 1) {
        await redis.expire(key, ttlSeconds);
      }

      // Check if quota exceeded AFTER atomic increment
      if (newCount > dailyLimit) {
        // Decrement since we're rejecting this request
        await redis.decr(key);

        request.server.log.warn({
          userId,
          count: newCount - 1, // Actual count before this rejected request
          dailyLimit,
          tier,
        }, 'Daily publish quota exceeded');

        reply.header('X-Quota-Limit', dailyLimit);
        reply.header('X-Quota-Remaining', 0);
        reply.header('X-Quota-Tier', tier);

        return reply.code(429).send({
          error: 'quota_exceeded',
          message: `Daily publish quota exceeded. You have published ${newCount - 1}/${dailyLimit} packages today. Quota resets at midnight UTC.`,
          quotaLimit: dailyLimit,
          quotaUsed: newCount - 1,
          tier,
        });
      }

      // Add quota headers
      reply.header('X-Quota-Limit', dailyLimit);
      reply.header('X-Quota-Remaining', Math.max(0, dailyLimit - newCount));
      reply.header('X-Quota-Tier', tier);

      request.server.log.debug({
        userId,
        count: newCount,
        dailyLimit,
        tier,
      }, 'Daily publish quota check passed');

    } catch (error) {
      // SECURITY: Fail closed on Redis errors - reject the request
      request.server.log.error({ error, userId }, 'Daily quota Redis error - rejecting request');
      return reply.code(503).send({
        error: 'Service Unavailable',
        message: 'Rate limiting service temporarily unavailable. Please try again.',
        retryAfter: 30,
      });
    }
  };
}
