/**
 * Package routes tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { packageRoutes } from '../packages';

describe('Package Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = Fastify();

    // Mock database
    server.decorate('pg', {
      query: async (sql: string, params?: any[]) => {
        // Mock different queries
        if (sql.includes('SELECT * FROM packages WHERE id')) {
          return {
            rows: [{
              id: 'test-package',
              name: 'Test Package',
              description: 'A test package',
              author: 'test-author',
              version: '1.0.0',
              downloads: 100,
              stars: 10
            }]
          };
        }

        if (sql.includes('SELECT * FROM packages')) {
          return {
            rows: [
              { id: 'pkg1', name: 'Package 1', downloads: 100 },
              { id: 'pkg2', name: 'Package 2', downloads: 50 }
            ]
          };
        }

        if (sql.includes('COUNT')) {
          return { rows: [{ count: '2' }] };
        }

        return { rows: [] };
      }
    });

    await server.register(packageRoutes, { prefix: '/api/v1/packages' });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /api/v1/packages/:id', () => {
    it('should return package details', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/packages/test-package'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('test-package');
      expect(body.name).toBe('Test Package');
    });

    it('should return 404 for non-existent package', async () => {
      server.decorate('pg', {
        query: async () => ({ rows: [] })
      }, { decorateReply: false });

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/packages/does-not-exist'
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/packages', () => {
    it('should list packages with pagination', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/packages?limit=10&offset=0'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body.packages)).toBe(true);
      expect(body.total).toBeDefined();
    });

    it('should filter by type', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/packages?type=cursor'
      });

      expect(response.statusCode).toBe(200);
    });

    it('should filter by tags', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/packages?tags=typescript&tags=nodejs'
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
