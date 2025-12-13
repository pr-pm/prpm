/**
 * Benchmarks Routes Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

// Mock requireAuth before importing benchmarksRoutes
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: async (request: any, reply: any) => {
    if (!request.headers.authorization) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    request.user = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      username: 'testuser',
      email: 'test@example.com',
      is_admin: true,
    };
  },
}));

import benchmarksRoutes from '../benchmarks.js';

describe('Benchmarks Routes', () => {
  let server: FastifyInstance;
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockSuiteId = '123e4567-e89b-12d3-a456-426614174001';
  const mockTestId = '123e4567-e89b-12d3-a456-426614174002';
  const mockRunId = '123e4567-e89b-12d3-a456-426614174003';

  let mockQuery: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    server = Fastify();

    // Mock pg plugin
    mockQuery = vi.fn();
    server.decorate('pg', {
      query: mockQuery,
    } as any);

    await server.register(benchmarksRoutes, { prefix: '/api/v1/benchmarks' });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // PUBLIC ENDPOINTS
  // ============================================================================

  describe('GET /api/v1/benchmarks/suites', () => {
    it('should return all active benchmark suites', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: mockSuiteId,
            name: 'PRPM Core v1.0',
            description: 'Initial benchmark suite',
            version: '1.0.0',
            test_count: 20,
            created_at: '2025-12-13T00:00:00Z',
            updated_at: '2025-12-13T00:00:00Z',
          },
        ],
        rowCount: 1,
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/benchmarks/suites',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.suites).toHaveLength(1);
      expect(body.suites[0].name).toBe('PRPM Core v1.0');
      expect(body.count).toBe(1);
    });
  });

  describe('GET /api/v1/benchmarks/suites/:id', () => {
    it('should return suite details with tests', async () => {
      mockQuery
        .mockResolvedValueOnce({
          // Suite query
          rows: [
            {
              id: mockSuiteId,
              name: 'PRPM Core v1.0',
              version: '1.0.0',
              test_count: 2,
            },
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          // Tests query
          rows: [
            {
              id: mockTestId,
              suite_id: mockSuiteId,
              name: 'React Custom Hook',
              category: 'code-generation',
              difficulty: 4,
              prompt: 'Create a useFetch hook...',
            },
          ],
          rowCount: 1,
        });

      const response = await server.inject({
        method: 'GET',
        url: `/api/v1/benchmarks/suites/${mockSuiteId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.suite.name).toBe('PRPM Core v1.0');
      expect(body.tests).toHaveLength(1);
      expect(body.tests[0].category).toBe('code-generation');
    });

    it('should return 404 for non-existent suite', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/benchmarks/suites/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Benchmark suite not found');
    });
  });

  describe('GET /api/v1/benchmarks/leaderboard', () => {
    it('should return leaderboard data', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            rank: 1,
            assistant_name: 'cursor',
            assistant_version: '0.42.3',
            suite_name: 'PRPM Core v1.0',
            overall_score: 87.5,
            correctness_score: 91.2,
            quality_score: 88.4,
            total_tests: 20,
            passed_tests: 18,
            pass_rate: 90.0,
          },
          {
            rank: 2,
            assistant_name: 'claude-code',
            assistant_version: '4.5',
            suite_name: 'PRPM Core v1.0',
            overall_score: 85.3,
            correctness_score: 89.1,
            quality_score: 90.2,
            total_tests: 20,
            passed_tests: 17,
            pass_rate: 85.0,
          },
        ],
        rowCount: 2,
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/benchmarks/leaderboard',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.leaderboard).toHaveLength(2);
      expect(body.leaderboard[0].rank).toBe(1);
      expect(body.leaderboard[0].assistant_name).toBe('cursor');
    });

    it('should filter by suite_id', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const response = await server.inject({
        method: 'GET',
        url: `/api/v1/benchmarks/leaderboard?suite_id=${mockSuiteId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('suite_name'),
        expect.arrayContaining([mockSuiteId, 50])
      );
    });
  });

  describe('GET /api/v1/benchmarks/compare', () => {
    it('should return 400 if assistants parameter missing', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/benchmarks/compare',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('assistants parameter required');
    });

    it('should compare multiple assistants', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            assistant_name: 'cursor',
            overall_score: 87.5,
            category_breakdown: [
              { category: 'code-generation', avg_score: 88.2 },
              { category: 'debugging', avg_score: 86.8 },
            ],
          },
          {
            assistant_name: 'claude-code',
            overall_score: 85.3,
            category_breakdown: [
              { category: 'code-generation', avg_score: 84.1 },
              { category: 'debugging', avg_score: 87.5 },
            ],
          },
        ],
        rowCount: 2,
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/benchmarks/compare?assistants=cursor,claude-code',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.comparison).toHaveLength(2);
      expect(body.assistants).toEqual(['cursor', 'claude-code']);
    });
  });

  describe('GET /api/v1/benchmarks/runs/:id', () => {
    it('should return run details with results', async () => {
      mockQuery
        .mockResolvedValueOnce({
          // Run query
          rows: [
            {
              id: mockRunId,
              suite_id: mockSuiteId,
              assistant_name: 'cursor',
              status: 'completed',
              overall_score: 87.5,
            },
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          // Results query
          rows: [
            {
              id: '123',
              test_id: mockTestId,
              test_name: 'React Custom Hook',
              category: 'code-generation',
              difficulty: 4,
              total_score: 88.3,
            },
          ],
          rowCount: 1,
        });

      const response = await server.inject({
        method: 'GET',
        url: `/api/v1/benchmarks/runs/${mockRunId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.run.assistant_name).toBe('cursor');
      expect(body.results).toHaveLength(1);
    });

    it('should return 404 for non-existent run', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/benchmarks/runs/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================

  describe('POST /api/v1/benchmarks/suites', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/benchmarks/suites',
        payload: {
          name: 'Test Suite',
          version: '1.0.0',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should create new benchmark suite', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: mockSuiteId,
            name: 'Test Suite',
            version: '1.0.0',
            test_count: 0,
          },
        ],
        rowCount: 1,
      });

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/benchmarks/suites',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          name: 'Test Suite',
          description: 'Test description',
          version: '1.0.0',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.suite.name).toBe('Test Suite');
    });

    it('should return 400 if required fields missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/benchmarks/suites',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          description: 'Missing name and version',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/benchmarks/tests', () => {
    it('should create new test', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: mockTestId,
            suite_id: mockSuiteId,
            name: 'React Custom Hook',
            category: 'code-generation',
          },
        ],
        rowCount: 1,
      });

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/benchmarks/tests',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          suite_id: mockSuiteId,
          name: 'React Custom Hook',
          category: 'code-generation',
          difficulty: 4,
          prompt: 'Create a useFetch hook...',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.test.name).toBe('React Custom Hook');
    });

    it('should return 400 if required fields missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/benchmarks/tests',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          name: 'Test without suite_id',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/benchmarks/runs', () => {
    it('should create new benchmark run', async () => {
      mockQuery
        .mockResolvedValueOnce({
          // Suite test count query
          rows: [{ test_count: 20 }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          // Insert run query
          rows: [
            {
              id: mockRunId,
              suite_id: mockSuiteId,
              assistant_name: 'cursor',
              total_tests: 20,
              status: 'pending',
            },
          ],
          rowCount: 1,
        });

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/benchmarks/runs',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          suite_id: mockSuiteId,
          assistant_name: 'cursor',
          assistant_version: '0.42.3',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.run.assistant_name).toBe('cursor');
      expect(body.run.total_tests).toBe(20);
    });

    it('should return 404 if suite not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/benchmarks/runs',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          suite_id: '00000000-0000-0000-0000-000000000000',
          assistant_name: 'cursor',
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/v1/benchmarks/results', () => {
    it('should submit test result', async () => {
      mockQuery
        .mockResolvedValueOnce({
          // Get run info
          rows: [
            {
              assistant_name: 'cursor',
              assistant_version: '0.42.3',
            },
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          // Insert result
          rows: [
            {
              id: '123',
              run_id: mockRunId,
              test_id: mockTestId,
              total_score: 88.3,
            },
          ],
          rowCount: 1,
        });

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/benchmarks/results',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          run_id: mockRunId,
          test_id: mockTestId,
          status: 'completed',
          response_time_ms: 3200,
          correctness_score: 90,
          quality_score: 85,
          context_score: 90,
          speed_score: 88,
          test_passed: true,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.result.total_score).toBe(88.3);
    });

    it('should return 400 if required fields missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/benchmarks/results',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          // Missing run_id and test_id
          correctness_score: 90,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 if run not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/benchmarks/results',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          run_id: '00000000-0000-0000-0000-000000000000',
          test_id: mockTestId,
          status: 'completed',
          correctness_score: 90,
          quality_score: 85,
          context_score: 90,
          speed_score: 88,
          test_passed: true,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/v1/benchmarks/runs/:id', () => {
    it('should update run status', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: mockRunId,
            status: 'completed',
            completed_at: '2025-12-13T12:00:00Z',
          },
        ],
        rowCount: 1,
      });

      const response = await server.inject({
        method: 'PATCH',
        url: `/api/v1/benchmarks/runs/${mockRunId}`,
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          status: 'completed',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.run.status).toBe('completed');
    });

    it('should return 404 if run not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const response = await server.inject({
        method: 'PATCH',
        url: '/api/v1/benchmarks/runs/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          status: 'completed',
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
