/**
 * Fastify module augmentation for custom properties
 */

import { FastifyRequest, FastifyInstance } from 'fastify';
import { PostgresDb } from '@fastify/postgres';
import { Redis } from 'ioredis';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
    startTime?: number;
  }

  interface FastifyInstance {
    pg: PostgresDb;
    redis: Redis;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    optionalAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export interface AuthUser {
  user_id: string;
  username: string;
  email?: string;
  is_admin?: boolean;
  scopes?: string[];
}

export {};
