/**
 * PRMP Registry Server
 */

import 'dotenv/config';
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
    },
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
  await setupDatabase(server);

  // Redis cache
  await setupRedis(server);

  // Authentication
  await setupAuth(server);

  // Telemetry & Analytics
  await registerTelemetryPlugin(server);

  // API routes
  await registerRoutes(server);

  // Health check
  server.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
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

    console.log(`
🚀 PRMP Registry Server is running!

📍 Server:        http://${config.host}:${config.port}
📚 API Docs:      http://${config.host}:${config.port}/docs
🏥 Health Check:  http://${config.host}:${config.port}/health

Environment: ${process.env.NODE_ENV || 'development'}
    `);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await telemetry.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await telemetry.shutdown();
  process.exit(0);
});

start();
