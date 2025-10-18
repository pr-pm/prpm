/**
 * Collections routes tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { collectionRoutes } from '../collections';

describe('Collection Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = Fastify();

    // Mock database
    server.decorate('pg', {
      query: async (sql: string, params?: any[]) => {
        // Mock collection query
        if (sql.includes('SELECT c.* FROM collections')) {
          if (params?.[0] === 'collection' && params?.[1] === 'test-collection') {
            return {
              rows: [{
                id: 'test-collection',
                scope: 'collection',
                name: 'Test Collection',
                description: 'A test collection',
                version: '1.0.0',
                author: 'test-author',
                official: true,
                verified: true,
                category: 'development',
                tags: ['test', 'typescript'],
                downloads: 500,
                stars: 25,
                package_count: 3
              }]
            };
          }
        }

        // Mock collection packages query
        if (sql.includes('SELECT cp.*, p.id')) {
          return {
            rows: [
              {
                package_id: 'pkg1',
                package_version: '1.0.0',
                required: true,
                reason: 'Core package',
                install_order: 1,
                display_name: 'Package 1',
                description: 'First package'
              },
              {
                package_id: 'pkg2',
                package_version: '1.0.0',
                required: false,
                reason: 'Optional enhancement',
                install_order: 2,
                display_name: 'Package 2',
                description: 'Second package'
              }
            ]
          };
        }

        // Mock collections list
        if (sql.includes('COUNT(*) FROM collections')) {
          return { rows: [{ count: '5' }] };
        }

        if (sql.includes('FROM collections c')) {
          return {
            rows: [
              {
                id: 'typescript-fullstack',
                scope: 'collection',
                name: 'TypeScript Full Stack',
                official: true,
                package_count: 5,
                downloads: 1000
              },
              {
                id: 'pulumi-infrastructure',
                scope: 'collection',
                name: 'Pulumi Infrastructure',
                official: true,
                package_count: 7,
                downloads: 750
              }
            ]
          };
        }

        return { rows: [] };
      }
    });

    await server.register(collectionRoutes, { prefix: '/api/v1/collections' });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /api/v1/collections', () => {
    it('should list collections', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/collections'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body.collections)).toBe(true);
      expect(body.total).toBeDefined();
    });

    it('should filter by category', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/collections?category=development'
      });

      expect(response.statusCode).toBe(200);
    });

    it('should filter by official flag', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/collections?official=true'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.collections.every((c: any) => c.official === true));
    });

    it('should support pagination', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/collections?limit=10&offset=0'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.limit).toBe(10);
      expect(body.offset).toBe(0);
    });
  });

  describe('GET /api/v1/collections/:scope/:id', () => {
    it('should return collection details', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/collections/collection/test-collection'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('test-collection');
      expect(body.name).toBe('Test Collection');
      expect(Array.isArray(body.packages)).toBe(true);
      expect(body.packages.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent collection', async () => {
      server.decorate('pg', {
        query: async () => ({ rows: [] })
      }, { decorateReply: false });

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/collections/collection/does-not-exist'
      });

      expect(response.statusCode).toBe(404);
    });

    it('should support version parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/collections/collection/test-collection@1.0.0'
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('POST /api/v1/collections/:scope/:id/:version/install', () => {
    it('should return installation plan', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/collections/collection/test-collection/1.0.0/install?format=cursor'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.collection).toBeDefined();
      expect(Array.isArray(body.packagesToInstall)).toBe(true);
    });

    it('should skip optional packages when requested', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/collections/collection/test-collection/1.0.0/install?skipOptional=true'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.packagesToInstall.every((p: any) => p.required === true));
    });

    it('should respect format parameter', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/collections/collection/test-collection/1.0.0/install?format=claude'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.packagesToInstall.every((p: any) => p.format === 'claude'));
    });
  });
});
