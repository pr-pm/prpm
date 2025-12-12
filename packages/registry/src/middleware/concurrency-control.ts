/**
 * Concurrency Control Middleware
 *
 * Limits the number of concurrent operations to prevent server overload.
 * Uses a semaphore pattern with a queue to manage concurrent requests.
 */

import { FastifyRequest, FastifyReply } from 'fastify';

interface QueuedRequest {
  resolve: () => void;
  reject: (error: Error) => void;
  timestamp: number;
}

/**
 * Semaphore for controlling concurrent operations
 */
class Semaphore {
  private current = 0;
  private queue: QueuedRequest[] = [];

  constructor(
    private readonly maxConcurrent: number,
    private readonly maxQueueSize: number = 50,
    private readonly queueTimeoutMs: number = 30000 // 30 seconds
  ) {}

  /**
   * Acquire a slot in the semaphore
   * Returns immediately if slots available, otherwise queues the request
   */
  async acquire(): Promise<void> {
    // If we have capacity, proceed immediately
    if (this.current < this.maxConcurrent) {
      this.current++;
      return Promise.resolve();
    }

    // Queue is full - reject with 503
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error(`Server at capacity. Queue full (${this.queue.length}/${this.maxQueueSize}). Please try again later.`);
    }

    // Wait in queue
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Remove from queue
        const index = this.queue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
        reject(new Error('Request timed out waiting in queue'));
      }, this.queueTimeoutMs);

      this.queue.push({
        resolve: () => {
          clearTimeout(timeout);
          resolve();
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Release a slot in the semaphore
   * Processes next queued request if any
   */
  release(): void {
    this.current--;

    // Process next in queue
    const next = this.queue.shift();
    if (next) {
      this.current++;
      next.resolve();
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      current: this.current,
      max: this.maxConcurrent,
      queued: this.queue.length,
      maxQueueSize: this.maxQueueSize,
    };
  }
}

// Global semaphore for publish operations
// Limit to 5 concurrent publishes to prevent overload in production
// CI_MODE uses much higher limits for integration testing
const isCI = process.env.CI_MODE === 'true';
const publishSemaphore = new Semaphore(
  isCI ? 100 : 5,      // 100 concurrent in CI, 5 in prod
  isCI ? 500 : 50,     // 500 queue in CI, 50 in prod
  isCI ? 120000 : 30000 // 2 min timeout in CI, 30s in prod
);

/**
 * Middleware factory for concurrency control
 */
export function createConcurrencyController(semaphore: Semaphore = publishSemaphore) {
  return async function concurrencyControlMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const startTime = Date.now();

    try {
      // Try to acquire semaphore slot
      await semaphore.acquire();

      const queueTime = Date.now() - startTime;
      if (queueTime > 100) {
        request.server.log.info(
          { queueTime, ...semaphore.getStatus() },
          'Request waited in queue'
        );
      }

      // Store release function in request for handler to call
      (request as any)._releaseSemaphore = () => semaphore.release();

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
 */
export function getPublishConcurrencyStatus() {
  return publishSemaphore.getStatus();
}
