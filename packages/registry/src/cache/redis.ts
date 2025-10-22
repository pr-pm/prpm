/**
 * Redis cache setup and utilities
 */

import { FastifyInstance } from 'fastify';
import fastifyRedis from '@fastify/redis';
import { config } from '../config.js';
import { toError } from '../types/errors.js';

export async function setupRedis(server: FastifyInstance) {
  await server.register(fastifyRedis, {
    url: config.redis.url,
    closeClient: true,
  });

  // Test connection
  try {
    await server.redis.ping();
    server.log.info('✅ Redis connected');
  } catch (error: unknown) {
    const err = toError(error);
    server.log.error({ error: err.message }, '❌ Redis connection failed');
    throw err;
  }
}

// Cache utilities
export async function cacheGet<T>(
  server: FastifyInstance,
  key: string
): Promise<T | null> {
  try {
    const value = await server.redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error: unknown) {
    server.log.warn(`Cache get failed for key ${key}: ${toError(error).message}`);
    return null;
  }
}

export async function cacheSet(
  server: FastifyInstance,
  key: string,
  value: unknown,
  ttlSeconds: number = 300
): Promise<void> {
  try {
    await server.redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error: unknown) {
    server.log.warn(`Cache set failed for key ${key}: ${toError(error).message}`);
  }
}

export async function cacheDelete(
  server: FastifyInstance,
  key: string
): Promise<void> {
  try {
    await server.redis.del(key);
  } catch (error: unknown) {
    server.log.warn(`Cache delete failed for key ${key}: ${toError(error).message}`);
  }
}

export async function cacheDeletePattern(
  server: FastifyInstance,
  pattern: string
): Promise<void> {
  try {
    const keys = await server.redis.keys(pattern);
    if (keys.length > 0) {
      await server.redis.del(...keys);
    }
  } catch (error: unknown) {
    server.log.warn(`Cache delete pattern failed for ${pattern}: ${toError(error).message}`);
  }
}
