/**
 * Search routes integration tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { searchRoutes } from '../search';

describe('Search Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = Fastify();

    // Mock authenticate decorator
    server.decorate('authenticate', async () => {});

    // Create mock query function
    const mockQuery = async (sql: string, params?: unknown[]) => {
      // Mock search query
      if (sql.includes('to_tsvector') || sql.includes('websearch_to_tsquery')) {
        const query = params?.[0] as string || '';
        if (query.includes('react')) {
          return {
            rows: [
              {
                id: 'react-pkg-1',
                name: 'react-cursor-rules',
                description: 'React coding rules',
                author: 'test-author',
                type: 'cursor',
                tags: ['react', 'javascript'],
                downloads: 1000,
                stars: 50,
                visibility: 'public',
                created_at: new Date(),
                updated_at: new Date(),
              },
              {
                id: 'react-pkg-2',
                name: 'react-typescript',
                description: 'React with TypeScript',
                author: 'test-author-2',
                type: 'cursor',
                tags: ['react', 'typescript'],
                downloads: 800,
                stars: 40,
                visibility: 'public',
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
            command: 'SELECT',
            rowCount: 2,
            oid: 0,
            fields: [],
          };
        }
        return {
          rows: [],
          command: 'SELECT',
          rowCount: 0,
          oid: 0,
          fields: [],
        };
      }

      // Mock COUNT query for search
      if (sql.includes('COUNT(*) as count')) {
        return {
          rows: [{ count: '2' }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: [],
        };
      }

      // Mock trending packages query
      if (sql.includes('ORDER BY downloads DESC')) {
        return {
          rows: [
            {
              id: 'trending-1',
              name: 'trending-package',
              description: 'A trending package',
              author: 'popular-author',
              type: 'cursor',
              tags: ['trending'],
              downloads: 5000,
              stars: 200,
              visibility: 'public',
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: [],
        };
      }

      // Mock featured packages query
      if (sql.includes('featured = true') || sql.includes('official = true')) {
        return {
          rows: [
            {
              id: 'featured-1',
              name: 'official-package',
              description: 'An official featured package',
              author: 'prpm',
              type: 'cursor',
              tags: ['official'],
              downloads: 10000,
              stars: 500,
              featured: true,
              official: true,
              visibility: 'public',
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: [],
        };
      }

      // Mock tags query
      if (sql.includes('unnest(tags)') || sql.includes('DISTINCT tags')) {
        return {
          rows: [
            { tag: 'react', count: 150 },
            { tag: 'typescript', count: 120 },
            { tag: 'javascript', count: 200 },
          ],
          command: 'SELECT',
          rowCount: 3,
          oid: 0,
          fields: [],
        };
      }

      // Mock categories query
      if (sql.includes('DISTINCT category') || sql.includes('GROUP BY category')) {
        return {
          rows: [
            { category: 'development', count: 50 },
            { category: 'productivity', count: 30 },
            { category: 'ai-tools', count: 25 },
          ],
          command: 'SELECT',
          rowCount: 3,
          oid: 0,
          fields: [],
        };
      }

      // Mock slash commands query
      if (sql.includes("type = 'claude-slash-command'")) {
        return {
          rows: [
            {
              id: 'slash-1',
              name: 'test-command',
              description: 'A test slash command',
              author: 'test-author',
              type: 'claude-slash-command',
              tags: ['command'],
              downloads: 100,
              stars: 10,
              visibility: 'public',
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: [],
        };
      }

      // Mock authors query
      if (sql.includes('DISTINCT author') || sql.includes('GROUP BY author')) {
        return {
          rows: [
            { author: 'test-author-1', package_count: 10, total_downloads: 5000 },
            { author: 'test-author-2', package_count: 5, total_downloads: 2000 },
          ],
          command: 'SELECT',
          rowCount: 2,
          oid: 0,
          fields: [],
        };
      }

      return {
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      };
    };

    // Mock database
    (server as any).decorate('pg', {
      query: mockQuery,
      connect: async () => ({
        query: mockQuery,
        release: () => {},
      }),
    } as any);

    await server.register(searchRoutes, { prefix: '/api/v1/search' });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /api/v1/search', () => {
    it('should search packages by query', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search?q=react',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body.packages)).toBe(true);
      expect(body.packages.length).toBeGreaterThan(0);
      expect(body.packages[0].name).toContain('react');
    });

    it('should return empty results for no matches', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search?q=nonexistent',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.packages).toEqual([]);
    });

    it('should filter by type', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search?q=react&type=cursor',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should filter by tags', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search?q=react&tags=javascript',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should support pagination', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search?q=react&limit=10&offset=0',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('offset');
      expect(body).toHaveProperty('limit');
    });

    it('should filter by author', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search?q=react&author=test-author',
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api/v1/search/trending', () => {
    it('should return trending packages', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search/trending',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body.packages)).toBe(true);
      expect(body.packages.length).toBeGreaterThan(0);
    });

    it('should support limit parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search/trending?limit=5',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should filter trending by type', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search/trending?type=cursor',
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api/v1/search/featured', () => {
    it('should return featured packages', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search/featured',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body.packages)).toBe(true);
    });

    it('should support limit parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search/featured?limit=10',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should filter featured by type', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search/featured?type=cursor',
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api/v1/search/tags', () => {
    it('should return all tags', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search/tags',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body.tags)).toBe(true);
      expect(body.tags.length).toBeGreaterThan(0);
      expect(body.tags[0]).toHaveProperty('tag');
      expect(body.tags[0]).toHaveProperty('count');
    });

    it('should support limit parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search/tags?limit=50',
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api/v1/search/categories', () => {
    it('should return all categories', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search/categories',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body.categories)).toBe(true);
      expect(body.categories.length).toBeGreaterThan(0);
      expect(body.categories[0]).toHaveProperty('category');
      expect(body.categories[0]).toHaveProperty('count');
    });
  });

  describe('GET /api/v1/search/slash-commands', () => {
    it('should return slash commands', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search/slash-commands',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body.packages)).toBe(true);
    });

    it('should support search query', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search/slash-commands?q=test',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should support pagination', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search/slash-commands?limit=20&offset=0',
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api/v1/search/authors', () => {
    it('should return authors list', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search/authors',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body.authors)).toBe(true);
      expect(body.authors.length).toBeGreaterThan(0);
      expect(body.authors[0]).toHaveProperty('author');
      expect(body.authors[0]).toHaveProperty('package_count');
    });

    it('should support pagination', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search/authors?limit=20&offset=0',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should support sorting', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/search/authors?sortBy=downloads',
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
