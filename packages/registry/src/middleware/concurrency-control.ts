/**
 * Concurrency Control Middleware
 *
 * Limits the number of concurrent operations to prevent server overload.
 * Uses a distributed semaphore pattern with Redis for cross-instance coordination.
 *
 * Algorithm:
 * - Uses Redis INCR/DECR for atomic slot acquisition across all server instances
 * - Each acquire() atomically increments the counter, checks if over limit
 * - If over limit, immediately decrements and queues locally (or rejects if queue full)
 * - Local queue with polling retries acquisition until timeout
 * - TTL on Redis key provides failsafe - if key expires, all slots are released
 * - CRITICAL: Fails closed if Redis unavailable (returns 503, doesn't allow request)
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import type { Redis } from 'ioredis';
import { toError } from '../types/errors.js';

interface QueuedRequest {
  resolve: () => void;
  reject: (error: Error) => void;
  timestamp: number;
  retryInterval?: ReturnType<typeof setInterval>;
}

// Redis key for the distributed semaphore counter
const REDIS_KEY = 'semaphore:publish:current';
// TTL in seconds - failsafe to reset if something goes wrong
const REDIS_TTL_SECONDS = 60;

/**
 * Distributed Semaphore for controlling concurrent operations across server instances
 *
 * Uses Redis for distributed state:
 * - Counter stored in Redis tracks total concurrent operations across all instances
 * - Local queue handles requests waiting for a slot (no need to distribute queue)
 * - Polling mechanism retries acquisition for queued requests
 */
class DistributedSemaphore {
  private queue: QueuedRequest[] = [];
  // Local tracking for status reporting (approximate, for monitoring only)
  private localCurrent = 0;

  constructor(
    private readonly maxConcurrent: number,
    private readonly maxQueueSize: number = 50,
    private readonly queueTimeoutMs: number = 30000, // 30 seconds
    private readonly pollIntervalMs: number = 100 // Poll every 100ms for queued requests
  ) {}

  /**
   * Acquire a slot in the distributed semaphore
   *
   * Algorithm:
   * 1. Atomically increment Redis counter
   * 2. If counter <= max, we got a slot - refresh TTL and return
   * 3. If counter > max, decrement immediately and either queue or reject
   * 4. Queued requests poll periodically to retry acquisition
   *
   * @param redis - Redis client from request.server.redis
   * @returns Promise that resolves when slot acquired
   * @throws Error if queue full, timeout, or Redis unavailable
   */
  async acquire(redis: Redis): Promise<void> {
    // CRITICAL: Fail closed if Redis is unavailable
    // We must NOT allow requests through if we can't coordinate
    if (!redis) {
      throw new Error('REDIS_UNAVAILABLE: Cannot coordinate concurrency without Redis');
    }

    try {
      // Atomically increment and get new value
      const current = await redis.incr(REDIS_KEY);

      // If we got a slot, refresh TTL and return
      if (current <= this.maxConcurrent) {
        // Refresh TTL on successful acquire (keeps key alive while in use)
        await redis.expire(REDIS_KEY, REDIS_TTL_SECONDS);
        this.localCurrent++;
        return;
      }

      // Over limit - immediately release the increment we just made
      await redis.decr(REDIS_KEY);

      // Queue is full - reject with 503
      if (this.queue.length >= this.maxQueueSize) {
        throw new Error(`Server at capacity. Queue full (${this.queue.length}/${this.maxQueueSize}). Please try again later.`);
      }

      // Wait in queue with polling
      return this.waitInQueue(redis);
    } catch (error) {
      const err = toError(error);
      // Re-throw our own errors (queue full, redis unavailable, timeout)
      if (
        err.message.includes('Queue full') ||
        err.message.includes('REDIS_UNAVAILABLE') ||
        err.message.includes('timed out')
      ) {
        throw err;
      }
      // Redis connection error - fail closed
      throw new Error(`REDIS_UNAVAILABLE: ${err.message}`);
    }
  }

  /**
   * Wait in queue and poll for available slot
   */
  private waitInQueue(redis: Redis): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const startTime = Date.now();

      // Timeout handler
      const timeout = setTimeout(() => {
        // Clean up
        if (queuedRequest.retryInterval) {
          clearInterval(queuedRequest.retryInterval);
        }
        const index = this.queue.indexOf(queuedRequest);
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
        reject(new Error('Request timed out waiting in queue'));
      }, this.queueTimeoutMs);

      const queuedRequest: QueuedRequest = {
        resolve: () => {
          clearTimeout(timeout);
          if (queuedRequest.retryInterval) {
            clearInterval(queuedRequest.retryInterval);
          }
          resolve();
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          if (queuedRequest.retryInterval) {
            clearInterval(queuedRequest.retryInterval);
          }
          reject(error);
        },
        timestamp: startTime,
      };

      // Polling retry logic
      queuedRequest.retryInterval = setInterval(async () => {
        try {
          // Try to acquire a slot
          const current = await redis.incr(REDIS_KEY);

          if (current <= this.maxConcurrent) {
            // Got a slot! Refresh TTL and resolve
            await redis.expire(REDIS_KEY, REDIS_TTL_SECONDS);
            this.localCurrent++;

            // Remove from queue and resolve
            const index = this.queue.indexOf(queuedRequest);
            if (index !== -1) {
              this.queue.splice(index, 1);
            }
            queuedRequest.resolve();
          } else {
            // Still over limit - release and keep waiting
            await redis.decr(REDIS_KEY);
          }
        } catch (error) {
          // Redis error during poll - reject the request
          const err = toError(error);
          const index = this.queue.indexOf(queuedRequest);
          if (index !== -1) {
            this.queue.splice(index, 1);
          }
          queuedRequest.reject(new Error(`REDIS_UNAVAILABLE: ${err.message}`));
        }
      }, this.pollIntervalMs);

      this.queue.push(queuedRequest);
    });
  }

  /**
   * Release a slot in the distributed semaphore
   *
   * @param redis - Redis client from request.server.redis
   */
  async release(redis: Redis): Promise<void> {
    this.localCurrent = Math.max(0, this.localCurrent - 1);

    if (!redis) {
      // Can't release to Redis, but we've updated local tracking
      // The TTL failsafe will eventually clean up the Redis counter
      return;
    }

    try {
      const newValue = await redis.decr(REDIS_KEY);
      // Ensure counter doesn't go negative (shouldn't happen, but be safe)
      if (newValue < 0) {
        await redis.set(REDIS_KEY, '0', 'EX', REDIS_TTL_SECONDS);
      }
    } catch {
      // Failed to release in Redis - TTL will eventually clean up
      // Log would be handled by caller
    }
  }

  /**
   * Get current status (for monitoring)
   * Note: 'current' is local approximation; true distributed count is in Redis
   */
  getStatus() {
    return {
      current: this.localCurrent,
      max: this.maxConcurrent,
      queued: this.queue.length,
      maxQueueSize: this.maxQueueSize,
    };
  }

  /**
   * Get accurate distributed count from Redis
   */
  async getDistributedCount(redis: Redis): Promise<number> {
    if (!redis) return this.localCurrent;
    try {
      const value = await redis.get(REDIS_KEY);
      return value ? parseInt(value, 10) : 0;
    } catch {
      return this.localCurrent;
    }
  }
}

// Global distributed semaphore for publish operations
// Limit to 5 concurrent publishes across ALL instances to prevent overload in production
// CI_MODE uses much higher limits for integration testing
const isCI = process.env.CI_MODE === 'true';
const publishSemaphore = new DistributedSemaphore(
  isCI ? 100 : 5,      // 100 concurrent in CI, 5 in prod
  isCI ? 500 : 50,     // 500 queue in CI, 50 in prod
  isCI ? 120000 : 30000, // 2 min timeout in CI, 30s in prod
  isCI ? 50 : 100      // Poll interval: 50ms in CI (faster tests), 100ms in prod
);

/**
 * Middleware factory for concurrency control
 *
 * Uses distributed semaphore backed by Redis for cross-instance coordination.
 * The Redis client is obtained from request.server.redis.
 *
 * CRITICAL: Fails closed - if Redis is unavailable, returns 503
 */
export function createConcurrencyController(semaphore: DistributedSemaphore = publishSemaphore) {
  return async function concurrencyControlMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const startTime = Date.now();
    const redis = request.server.redis;

    try {
      // Try to acquire semaphore slot (uses Redis for distributed coordination)
      await semaphore.acquire(redis);

      const queueTime = Date.now() - startTime;
      if (queueTime > 100) {
        request.server.log.info(
          { queueTime, ...semaphore.getStatus() },
          'Request waited in queue'
        );
      }

      // Store release function in request for handler to call
      // Captures redis client for proper distributed release
      (request as any)._releaseSemaphore = () => semaphore.release(redis);

      // Set up automatic release on response completion
      reply.raw.on('finish', () => {
        if ((request as any)._releaseSemaphore) {
          (request as any)._releaseSemaphore();
          (request as any)._releaseSemaphore = null;
        }
      });

      // Also handle connection errors/close
      request.raw.on('error', () => {
        if ((request as any)._releaseSemaphore) {
          (request as any)._releaseSemaphore();
          (request as any)._releaseSemaphore = null;
        }
      });

      request.raw.on('close', () => {
        if ((request as any)._releaseSemaphore) {
          (request as any)._releaseSemaphore();
          (request as any)._releaseSemaphore = null;
        }
      });

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // CRITICAL: Redis unavailable - fail closed with 503
      if (err.message.includes('REDIS_UNAVAILABLE')) {
        request.server.log.error(
          { error: err.message, userId: (request.user as any)?.user_id },
          'Redis unavailable - failing closed'
        );

        return reply.code(503).send({
          error: 'Service Unavailable',
          message: 'Service temporarily unavailable. Please try again.',
          retryAfter: 10,
        });
      }

      if (err.message.includes('Queue full') || err.message.includes('at capacity')) {
        request.server.log.warn(
          { ...semaphore.getStatus(), userId: (request.user as any)?.user_id },
          'Server at capacity - rejecting request'
        );

        return reply.code(503).send({
          error: 'Service Unavailable',
          message: 'Server is currently processing many requests. Please try again in a few moments.',
          retryAfter: 30,
        });
      }

      if (err.message.includes('timed out')) {
        request.server.log.warn(
          { queueTime: Date.now() - startTime, userId: (request.user as any)?.user_id },
          'Request timed out in queue'
        );

        return reply.code(503).send({
          error: 'Service Unavailable',
          message: 'Request timed out waiting for server capacity. Please try again.',
          retryAfter: 10,
        });
      }

      // Other errors
      throw err;
    }
  };
}

/**
 * Get current publish concurrency status (for monitoring)
 * Note: Returns local status. For accurate distributed count, use getPublishConcurrencyStatusAsync
 */
export function getPublishConcurrencyStatus() {
  return publishSemaphore.getStatus();
}

/**
 * Get current publish concurrency status including distributed count from Redis
 */
export async function getPublishConcurrencyStatusAsync(redis: Redis | null) {
  const localStatus = publishSemaphore.getStatus();
  if (!redis) {
    return { ...localStatus, distributedCurrent: null };
  }
  const distributedCurrent = await publishSemaphore.getDistributedCount(redis);
  return { ...localStatus, distributedCurrent };
}
