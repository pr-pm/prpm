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
import { startCronScheduler } from './services/cron-scheduler.js';
import { SeoDataService } from './services/seo-data.js';

async function buildServer() {
  // Configure logger with pino-pretty for colored output
  const loggerConfig = process.env.NODE_ENV === 'production'
    ? {
        level: config.logLevel,
      }
    : {
        level: config.logLevel,
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
            colorize: true,
            levelFirst: true,
            messageFormat: '{msg}',
            customColors: 'info:blue,warn:yellow,error:red,debug:gray',
            customLevels: 'debug:10,info:20,warn:30,error:40',
          },
        },
        serializers: {
          req(request: any) {
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
          res(reply: any) {
            return {
              statusCode: reply.statusCode,
            };
          },
        },
      };

  const server = Fastify({
    logger: loggerConfig,
    requestIdLogLabel: 'reqId',
    requestIdHeader: 'x-request-id',
    genReqId: (req) => (req.headers?.['x-request-id'] as string) || crypto.randomUUID(),
    bodyLimit: 100 * 1024 * 1024, // 100MB max request body (for large package uploads)
  });

  // Attach config to server for access in routes
  server.decorate('config', config);

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

  // Setup Redis first (required for rate limiting)
  // NOTE: Redis must be set up before rate limiting because we use it as the store
  // for distributed, per-IP and per-user rate limiting across multiple server instances
  server.log.info('🔌 Connecting to Redis...');
  try {
    await setupRedis(server);
    server.log.info('✅ Redis connected');
  } catch (error) {
    server.log.error({ error }, '❌ Redis connection failed');
    throw new Error(`Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Rate limiting with Redis store (per-IP or per-user)
  // Uses Redis to track limits across distributed server instances
  // Authenticated users: limited per user ID
  // Anonymous users: limited per IP address
  await server.register(rateLimit, {
    max: 100, // 100 requests
    timeWindow: '1 minute',
    skipOnError: true,
    redis: server.redis, // Use Redis for distributed rate limiting
    // Generate unique key per IP address or authenticated user
    keyGenerator: (request) => {
      // For authenticated users, use user ID
      const userId = (request.user as any)?.user_id;
      if (userId) {
        return `ratelimit:user:${userId}`;
      }

      // For anonymous users, use IP address
      // Support both direct connections and proxied connections
      const ip = request.headers['x-forwarded-for'] ||
                 request.headers['x-real-ip'] ||
                 request.ip;

      return `ratelimit:ip:${ip}`;
    },
    errorResponseBuilder: () => ({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      statusCode: 429,
    }),
    // Exempt requests from official webapp, CLI, and specific endpoints
    allowList: (request) => {
      const path = request.url || '';
      const origin = request.headers.origin || '';
      const referer = request.headers.referer || '';
      const userAgent = request.headers['user-agent'] || '';

      // NEVER rate limit requests from official webapp domains
      const webappDomains = [
        'prpm.dev',
        'www.prpm.dev',
        'localhost:3000',
        'localhost:5173',
      ];

      const isWebappRequest = webappDomains.some(domain =>
        origin.includes(domain) || referer.includes(domain)
      );

      if (isWebappRequest) {
        return true; // Exempt all webapp requests
      }

      // NEVER rate limit requests from official CLI
      // CLI identifies itself with User-Agent: prpm-cli/version
      const isCliRequest = userAgent.startsWith('prpm-cli/');

      if (isCliRequest) {
        return true; // Exempt all CLI requests
      }

      // Also exempt build-time and SEO endpoints
      // These endpoints are authenticated via tokens and used for:
      // - /ssg-data: Fetching all packages for static site generation (X-SSG-Token)
      // - /seo/: Generating sitemap data for search engines
      // NO RATE LIMITS on these endpoints to allow fast builds
      return (
        path.includes('/ssg-data') ||    // Build-time data fetching (unlimited)
        path.includes('/seo/')            // SEO sitemap generation (unlimited)
      );
    },
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

  // Raw body parser for Stripe webhooks
  server.addContentTypeParser('application/json', { parseAs: 'buffer' }, async (req: any, body: Buffer) => {
    // Store raw body for webhook signature verification
    req.rawBody = body;

    // Parse JSON normally
    try {
      return JSON.parse(body.toString('utf8'));
    } catch (err) {
      throw new Error('Invalid JSON');
    }
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
        { name: 'Analytics', description: 'Download tracking, stats, and trending' },
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

  // Database connection with retry logic
  server.log.info('🔌 Connecting to database...');
  try {
    await setupDatabase(server);
    server.log.info('✅ Database connected');
  } catch (error) {
    server.log.error({ error }, '❌ Database connection failed');
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Authentication
  server.log.info('🔐 Setting up authentication...');
  try {
    await setupAuth(server);
    server.log.info('✅ Authentication configured');
  } catch (error) {
    server.log.error({ error }, '❌ Authentication setup failed');
    throw new Error(`Authentication setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Telemetry & Analytics
  server.log.info('📊 Initializing telemetry...');
  try {
    await registerTelemetryPlugin(server);
    server.log.info('✅ Telemetry initialized');
  } catch (error) {
    server.log.error({ error }, '❌ Telemetry initialization failed');
    throw new Error(`Telemetry initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // API routes
  server.log.info('🛣️  Registering API routes...');
  await registerRoutes(server);
  server.log.info('✅ Routes registered');

  // SEO data service (async rebuilds for SSG data)
  const seoDataService = new SeoDataService(server);
  if (seoDataService.isEnabled()) {
    server.log.info('🗂️  SEO data service enabled');
  } else {
    server.log.info('🗂️  SEO data service disabled');
  }
  server.decorate('seoData', seoDataService);

  // Start centralized cron scheduler (includes migration cron)
  server.log.info('⏰ Starting cron scheduler...');
  startCronScheduler(server);

  // Request logging hook
  server.addHook('onRequest', async (request, reply) => {
    request.log.debug({
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent']
    }, `➡️  ${request.method} ${request.url}`);
  });

  // Response logging hook
  server.addHook('onResponse', async (request, reply) => {
    request.log.debug({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime
    }, `⬅️  ${request.method} ${request.url} - ${reply.statusCode} (${Math.round(reply.elapsedTime)}ms)`);
  });

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

async function start(server: Awaited<ReturnType<typeof buildServer>>) {
  try {
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
    server.log.error({ error }, 'Failed to start server');
    throw error;
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
    console.log('🚀 Initializing PRMP Registry Server...');
    serverInstance = await buildServer();
    await start(serverInstance);
  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
  }
})();

// Export server instance for use in jobs
export { serverInstance as server, buildServer };
