/**
 * Redis cache setup and utilities
 */

import { FastifyInstance } from 'fastify';
import fastifyRedis from '@fastify/redis';
import { config } from '../config.js';

export async function setupRedis(server: FastifyInstance) {
  await server.register(fastifyRedis, {
    url: config.redis.url,
    closeClient: true,
  });

  // Test connection
  try {
    await server.redis.ping();
    server.log.info('✅ Redis connected');
  } catch (error) {
    server.log.error('❌ Redis connection failed:', error);
    throw error;
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
  } catch (error) {
    server.log.warn(`Cache get failed for key ${key}:`, error);
    return null;
  }
}

export async function cacheSet(
  server: FastifyInstance,
  key: string,
  value: any,
  ttlSeconds: number = 300
): Promise<void> {
  try {
    await server.redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    server.log.warn(`Cache set failed for key ${key}:`, error);
  }
}

export async function cacheDelete(
  server: FastifyInstance,
  key: string
): Promise<void> {
  try {
    await server.redis.del(key);
  } catch (error) {
    server.log.warn(`Cache delete failed for key ${key}:`, error);
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
  } catch (error) {
    server.log.warn(`Cache delete pattern failed for ${pattern}:`, error);
  }
}
