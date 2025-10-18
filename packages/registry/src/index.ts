/**
 * PRMP Registry Server
 */

import 'dotenv/config';
import crypto from 'crypto';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config.js';
import { setupDatabase } from './db/index.js';
import { setupRedis } from './cache/redis.js';
import { setupAuth } from './auth/index.js';
import { registerRoutes } from './routes/index.js';
import { registerTelemetryPlugin, telemetry } from './telemetry/index.js';

async function buildServer() {
  const server = Fastify({
    logger: {
      level: config.logLevel,
      serializers: {
        req(request) {
          return {
            method: request.method,
            url: request.url,
            headers: request.headers ? {
              host: request.headers.host,
              'user-agent': request.headers['user-agent'],
            } : undefined,
            remoteAddress: request.ip,
            remotePort: request.socket?.remotePort,
          };
        },
        res(reply) {
          return {
            statusCode: reply.statusCode,
          };
        },
      },
    },
    requestIdLogLabel: 'reqId',
    requestIdHeader: 'x-request-id',
    genReqId: (req) => (req.headers?.['x-request-id'] as string) || crypto.randomUUID(),
  });

  // Security headers
  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // Rate limiting
  await server.register(rateLimit, {
    max: 100, // 100 requests
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      statusCode: 429,
    }),
  });

  // CORS
  await server.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Multipart file upload support
  await server.register(multipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max file size
      files: 1, // Max 1 file per request
    },
  });

  // Swagger documentation
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'PRMP Registry API',
        description: 'Central registry for prompts, agents, and cursor rules',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://${config.host}:${config.port}`,
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'packages', description: 'Package management' },
        { name: 'collections', description: 'Package collections' },
        { name: 'search', description: 'Search and discovery' },
        { name: 'users', description: 'User management' },
        { name: 'organizations', description: 'Organization management' },
      ],
    },
  });

  await server.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Database connection
  await setupDatabase(server as any);

  // Redis cache
  await setupRedis(server as any);

  // Authentication
  await setupAuth(server as any);

  // Telemetry & Analytics
  await registerTelemetryPlugin(server as any);

  // API routes
  await registerRoutes(server);

  // Enhanced health check with dependency status
  server.get('/health', async (request, reply) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'unknown',
        redis: 'unknown',
        storage: 'unknown',
      },
    };

    try {
      // Check database
      await server.pg.query('SELECT 1');
      health.services.database = 'ok';
    } catch (error) {
      health.services.database = 'error';
      health.status = 'degraded';
      request.log.error({ error }, 'Database health check failed');
    }

    try {
      // Check Redis
      await server.redis.ping();
      health.services.redis = 'ok';
    } catch (error) {
      health.services.redis = 'error';
      health.status = 'degraded';
      request.log.error({ error }, 'Redis health check failed');
    }

    // S3 is checked lazily (we don't want to slow down health checks)
    health.services.storage = 'ok';

    if (health.status === 'degraded') {
      reply.status(503);
    }

    return health;
  });

  // Global error handler
  server.setErrorHandler((error, request, reply) => {
    // Log the error with request context
    request.log.error(
      {
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code,
          statusCode: error.statusCode,
        },
        req: {
          method: request.method,
          url: request.url,
          params: request.params,
          query: request.query,
        },
      },
      'Request failed'
    );

    // Don't expose internal errors in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const statusCode = error.statusCode || 500;

    reply.status(statusCode).send({
      error: error.name || 'Internal Server Error',
      message: isDevelopment ? error.message : 'An unexpected error occurred',
      statusCode,
      ...(isDevelopment && { stack: error.stack }),
      requestId: request.id,
    });
  });

  return server;
}

async function start() {
  try {
    const server = await buildServer();

    await server.listen({
      port: config.port,
      host: config.host,
    });

    server.log.info(
      {
        port: config.port,
        host: config.host,
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
          server: `http://${config.host}:${config.port}`,
          docs: `http://${config.host}:${config.port}/docs`,
          health: `http://${config.host}:${config.port}/health`,
        },
      },
      '🚀 PRMP Registry Server started'
    );
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Track server instance for graceful shutdown
let serverInstance: Awaited<ReturnType<typeof buildServer>> | null = null;

// Handle graceful shutdown
process.on('SIGINT', async () => {
  if (serverInstance) {
    serverInstance.log.info('👋 Shutting down gracefully (SIGINT)...');
    await serverInstance.close();
  }
  await telemetry.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (serverInstance) {
    serverInstance.log.info('👋 Shutting down gracefully (SIGTERM)...');
    await serverInstance.close();
  }
  await telemetry.shutdown();
  process.exit(0);
});

// Start server
(async () => {
  try {
    serverInstance = await buildServer();
    await start();
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
})();
