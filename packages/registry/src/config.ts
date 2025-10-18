/**
 * Registry configuration from environment variables
 */

import { RegistryConfig } from './types.js';

export function loadConfig(): RegistryConfig {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    logLevel: process.env.LOG_LEVEL || 'info',

    database: {
      url: process.env.DATABASE_URL || 'postgresql://prmp:prmp@localhost:5432/prmp_registry',
    },

    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    meilisearch: {
      host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
      apiKey: process.env.MEILISEARCH_API_KEY || '',
    },

    jwt: {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },

    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/github/callback',
    },

    s3: {
      endpoint: process.env.S3_ENDPOINT || 'https://s3.amazonaws.com',
      region: process.env.S3_REGION || 'us-east-1',
      bucket: process.env.S3_BUCKET || 'prmp-packages',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },

    rateLimit: {
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      window: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    },

    packages: {
      maxSize: parseInt(process.env.MAX_PACKAGE_SIZE || '10485760', 10), // 10MB
      allowedExtensions: (process.env.ALLOWED_FILE_EXTENSIONS || '.md,.json,.yaml,.yml,.txt').split(','),
    },
  };
}

export const config = loadConfig();
