/**
 * AI Assistant Benchmarks API
 *
 * Public and admin endpoints for managing and viewing benchmark data
 */

import { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../middleware/auth.js';

interface BenchmarkSuite {
  id: string;
  name: string;
  description: string | null;
  version: string;
  test_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BenchmarkTest {
  id: string;
  suite_id: string;
  package_id: string | null;
  name: string;
  category: string;
  difficulty: number;
  prompt: string;
  expected_behavior: string | null;
  language: string | null;
  framework: string | null;
  tags: string[];
}

interface BenchmarkRun {
  id: string;
  suite_id: string;
  assistant_name: string;
  assistant_version: string | null;
  assistant_model: string | null;
  status: string;
  total_tests: number;
  completed_tests: number;
  passed_tests: number;
  overall_score: number | null;
  correctness_score: number | null;
  quality_score: number | null;
  context_score: number | null;
  speed_score: number | null;
  started_at: string;
  completed_at: string | null;
}

interface LeaderboardEntry {
  assistant_name: string;
  assistant_version: string | null;
  assistant_model: string | null;
  suite_name: string;
  suite_version: string;
  overall_score: number;
  correctness_score: number;
  quality_score: number;
  context_score: number;
  speed_score: number;
  total_tests: number;
  passed_tests: number;
  pass_rate: number;
  rank: number;
  completed_at: string;
}

const benchmarksRoutes: FastifyPluginAsync = async (fastify) => {
  // ============================================================================
  // PUBLIC ENDPOINTS
  // ============================================================================

  /**
   * GET /api/v1/benchmarks/suites
   * List all active benchmark suites
   */
  fastify.get('/suites', async (request, reply) => {
    const suites = await fastify.pg.query<BenchmarkSuite>(
      `SELECT id, name, description, version, test_count, created_at, updated_at
       FROM benchmark_suites
       WHERE is_active = TRUE
       ORDER BY created_at DESC`
    );

    return reply.send({
      suites: suites.rows,
      count: suites.rowCount,
    });
  });

  /**
   * GET /api/v1/benchmarks/suites/:id
   * Get benchmark suite details with tests
   */
  fastify.get<{ Params: { id: string } }>(
    '/suites/:id',
    async (request, reply) => {
      const { id } = request.params;

      const suiteResult = await fastify.pg.query<BenchmarkSuite>(
        `SELECT * FROM benchmark_suites WHERE id = $1`,
        [id]
      );

      if (suiteResult.rowCount === 0) {
        return reply.status(404).send({ error: 'Benchmark suite not found' });
      }

      const testsResult = await fastify.pg.query<BenchmarkTest>(
        `SELECT id, suite_id, package_id, name, category, difficulty,
                prompt, expected_behavior, language, framework, tags
         FROM benchmark_tests
         WHERE suite_id = $1
         ORDER BY category, difficulty, created_at`,
        [id]
      );

      return reply.send({
        suite: suiteResult.rows[0],
        tests: testsResult.rows,
      });
    }
  );

  /**
   * GET /api/v1/benchmarks/leaderboard
   * Get public leaderboard
   */
  fastify.get<{
    Querystring: {
      suite_id?: string;
      category?: string;
      limit?: string;
    };
  }>('/leaderboard', async (request, reply) => {
    const { suite_id, category, limit = '50' } = request.query;

    let query = `
      SELECT * FROM benchmark_leaderboard
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 0;

    if (suite_id) {
      paramCount++;
      query += ` AND suite_name = (SELECT name FROM benchmark_suites WHERE id = $${paramCount})`;
      params.push(suite_id);
    }

    query += ` ORDER BY rank ASC LIMIT $${++paramCount}`;
    params.push(parseInt(limit));

    const result = await fastify.pg.query<LeaderboardEntry>(query, params);

    // If category filter, get category-specific scores
    let categoryPerformance = null;
    if (category) {
      const catResult = await fastify.pg.query(
        `SELECT * FROM benchmark_category_performance
         WHERE category = $1
         ORDER BY avg_score DESC`,
        [category]
      );
      categoryPerformance = catResult.rows;
    }

    return reply.send({
      leaderboard: result.rows,
      category_performance: categoryPerformance,
      filters: {
        suite_id,
        category,
        limit: parseInt(limit),
      },
    });
  });

  /**
   * GET /api/v1/benchmarks/compare
   * Compare multiple assistants side-by-side
   */
  fastify.get<{
    Querystring: {
      assistants: string; // comma-separated: "cursor,claude-code,copilot"
      suite_id?: string;
    };
  }>('/compare', async (request, reply) => {
    const { assistants, suite_id } = request.query;

    if (!assistants) {
      return reply.status(400).send({ error: 'assistants parameter required' });
    }

    const assistantList = assistants.split(',').map((a) => a.trim());

    let query = `
      SELECT
        l.*,
        (SELECT json_agg(cp)
         FROM benchmark_category_performance cp
         WHERE cp.assistant_name = l.assistant_name
           AND cp.assistant_version = l.assistant_version
        ) AS category_breakdown
      FROM benchmark_leaderboard l
      WHERE assistant_name = ANY($1)
    `;
    const params: any[] = [assistantList];

    if (suite_id) {
      query += ` AND suite_name = (SELECT name FROM benchmark_suites WHERE id = $2)`;
      params.push(suite_id);
    }

    query += ` ORDER BY overall_score DESC`;

    const result = await fastify.pg.query(query, params);

    return reply.send({
      comparison: result.rows,
      assistants: assistantList,
      suite_id,
    });
  });

  /**
   * GET /api/v1/benchmarks/runs/:id
   * Get detailed results for a specific run
   */
  fastify.get<{ Params: { id: string } }>('/runs/:id', async (request, reply) => {
    const { id } = request.params;

    const runResult = await fastify.pg.query<BenchmarkRun>(
      `SELECT * FROM benchmark_runs WHERE id = $1`,
      [id]
    );

    if (runResult.rowCount === 0) {
      return reply.status(404).send({ error: 'Benchmark run not found' });
    }

    const resultsQuery = await fastify.pg.query(
      `SELECT
         res.*,
         t.name AS test_name,
         t.category,
         t.difficulty,
         t.prompt
       FROM benchmark_results res
       JOIN benchmark_tests t ON res.test_id = t.id
       WHERE res.run_id = $1
       ORDER BY t.category, t.difficulty, t.created_at`,
      [id]
    );

    return reply.send({
      run: runResult.rows[0],
      results: resultsQuery.rows,
    });
  });

  // ============================================================================
  // ADMIN ENDPOINTS (Require Authentication)
  // ============================================================================

  /**
   * POST /api/v1/benchmarks/suites
   * Create a new benchmark suite (admin only)
   */
  fastify.post<{
    Body: {
      name: string;
      description?: string;
      version: string;
    };
  }>(
    '/suites',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      const { name, description, version } = request.body;

      if (!name || !version) {
        return reply.status(400).send({ error: 'name and version are required' });
      }

      const result = await fastify.pg.query<BenchmarkSuite>(
        `INSERT INTO benchmark_suites (name, description, version)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [name, description || null, version]
      );

      return reply.status(201).send({
        suite: result.rows[0],
      });
    }
  );

  /**
   * POST /api/v1/benchmarks/tests
   * Add a test to a suite (admin only)
   */
  fastify.post<{
    Body: {
      suite_id: string;
      package_id?: string;
      name: string;
      category: string;
      difficulty: number;
      prompt: string;
      expected_behavior?: string;
      test_code?: string;
      language?: string;
      framework?: string;
      tags?: string[];
    };
  }>(
    '/tests',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      const {
        suite_id,
        package_id,
        name,
        category,
        difficulty,
        prompt,
        expected_behavior,
        test_code,
        language,
        framework,
        tags,
      } = request.body;

      if (!suite_id || !name || !category || !prompt) {
        return reply.status(400).send({
          error: 'suite_id, name, category, and prompt are required',
        });
      }

      const result = await fastify.pg.query<BenchmarkTest>(
        `INSERT INTO benchmark_tests
         (suite_id, package_id, name, category, difficulty, prompt,
          expected_behavior, test_code, language, framework, tags, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          suite_id,
          package_id || null,
          name,
          category,
          difficulty || 5,
          prompt,
          expected_behavior || null,
          test_code || null,
          language || null,
          framework || null,
          tags || [],
          request.user?.user_id || null,
        ]
      );

      return reply.status(201).send({
        test: result.rows[0],
      });
    }
  );

  /**
   * POST /api/v1/benchmarks/runs
   * Start a new benchmark run (admin only)
   */
  fastify.post<{
    Body: {
      suite_id: string;
      assistant_name: string;
      assistant_version?: string;
      assistant_model?: string;
      runner_version?: string;
      environment?: Record<string, any>;
    };
  }>(
    '/runs',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      const {
        suite_id,
        assistant_name,
        assistant_version,
        assistant_model,
        runner_version,
        environment,
      } = request.body;

      if (!suite_id || !assistant_name) {
        return reply.status(400).send({
          error: 'suite_id and assistant_name are required',
        });
      }

      // Get test count from suite
      const suiteResult = await fastify.pg.query(
        `SELECT test_count FROM benchmark_suites WHERE id = $1`,
        [suite_id]
      );

      if (suiteResult.rowCount === 0) {
        return reply.status(404).send({ error: 'Suite not found' });
      }

      const result = await fastify.pg.query<BenchmarkRun>(
        `INSERT INTO benchmark_runs
         (suite_id, assistant_name, assistant_version, assistant_model,
          total_tests, runner_version, environment, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          suite_id,
          assistant_name,
          assistant_version || null,
          assistant_model || null,
          suiteResult.rows[0].test_count,
          runner_version || null,
          environment || {},
          request.user?.user_id || null,
        ]
      );

      return reply.status(201).send({
        run: result.rows[0],
      });
    }
  );

  /**
   * POST /api/v1/benchmarks/results
   * Submit a test result (admin only or via API key)
   */
  fastify.post<{
    Body: {
      run_id: string;
      test_id: string;
      status: string;
      response_time_ms?: number;
      correctness_score: number;
      quality_score: number;
      context_score: number;
      speed_score: number;
      generated_code?: string;
      test_passed: boolean;
      error_log?: string;
      metadata?: Record<string, any>;
    };
  }>(
    '/results',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      const {
        run_id,
        test_id,
        status,
        response_time_ms,
        correctness_score,
        quality_score,
        context_score,
        speed_score,
        generated_code,
        test_passed,
        error_log,
        metadata,
      } = request.body;

      if (!run_id || !test_id) {
        return reply.status(400).send({ error: 'run_id and test_id required' });
      }

      // Calculate total score
      const totalScore =
        correctness_score * 0.4 +
        quality_score * 0.3 +
        context_score * 0.2 +
        speed_score * 0.1;

      // Get assistant info from run
      const runInfo = await fastify.pg.query(
        `SELECT assistant_name, assistant_version FROM benchmark_runs WHERE id = $1`,
        [run_id]
      );

      if (runInfo.rowCount === 0) {
        return reply.status(404).send({ error: 'Run not found' });
      }

      const result = await fastify.pg.query(
        `INSERT INTO benchmark_results
         (run_id, test_id, assistant_name, assistant_version, status,
          response_time_ms, correctness_score, quality_score, context_score,
          speed_score, total_score, generated_code, test_passed, error_log, metadata,
          started_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
         RETURNING *`,
        [
          run_id,
          test_id,
          runInfo.rows[0].assistant_name,
          runInfo.rows[0].assistant_version,
          status,
          response_time_ms || null,
          correctness_score,
          quality_score,
          context_score,
          speed_score,
          totalScore,
          generated_code || null,
          test_passed,
          error_log || null,
          metadata || {},
        ]
      );

      return reply.status(201).send({
        result: result.rows[0],
      });
    }
  );

  /**
   * PATCH /api/v1/benchmarks/runs/:id
   * Update run status (e.g., mark as completed)
   */
  fastify.patch<{
    Params: { id: string };
    Body: {
      status: string;
    };
  }>(
    '/runs/:id',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      const { id } = request.params;
      const { status } = request.body;

      const result = await fastify.pg.query(
        `UPDATE benchmark_runs
         SET status = $1,
             completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END
         WHERE id = $2
         RETURNING *`,
        [status, id]
      );

      if (result.rowCount === 0) {
        return reply.status(404).send({ error: 'Run not found' });
      }

      return reply.send({
        run: result.rows[0],
      });
    }
  );
};

export default benchmarksRoutes;
