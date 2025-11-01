/**
 * Test Case API Routes
 *
 * Endpoints for managing AI-generated test cases
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { TestCaseGeneratorService } from '../services/test-case-generator.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

// Request schemas
const GetTestCasesQuerySchema = z.object({
  difficulty: z.enum(['basic', 'intermediate', 'advanced']).optional(),
  test_type: z.enum(['concept', 'practical', 'edge_case', 'comparison', 'quality']).optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
  sort: z.enum(['confidence', 'success_rate', 'usage']).default('confidence'),
});

const RecordUsageBodySchema = z.object({
  test_case_id: z.string().uuid(),
});

const RecordFeedbackBodySchema = z.object({
  test_case_id: z.string().uuid(),
  was_helpful: z.boolean(),
  feedback_comment: z.string().max(500).optional(),
});

export async function testCaseRoutes(server: FastifyInstance) {
  const generator = new TestCaseGeneratorService(server);

  /**
   * Get test cases for a package
   */
  server.get('/packages/:packageId/test-cases', {
    onRequest: [optionalAuth],
    schema: {
      tags: ['test-cases'],
      description: 'Get AI-generated test cases for a package',
      params: {
        type: 'object',
        properties: {
          packageId: { type: 'string', format: 'uuid' },
        },
        required: ['packageId'],
      },
      querystring: {
        type: 'object',
        properties: {
          difficulty: { type: 'string', enum: ['basic', 'intermediate', 'advanced'] },
          test_type: { type: 'string', enum: ['concept', 'practical', 'edge_case', 'comparison', 'quality'] },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 10 },
          sort: { type: 'string', enum: ['confidence', 'success_rate', 'usage'], default: 'confidence' },
        },
      },
    },
  }, async (
    request: FastifyRequest<{
      Params: { packageId: string };
      Querystring: z.infer<typeof GetTestCasesQuerySchema>;
    }>,
    reply: FastifyReply
  ) => {
    const { packageId } = request.params;
    const query = GetTestCasesQuerySchema.parse(request.query);

    server.log.info({
      action: 'get_test_cases',
      package_id: packageId,
      query,
    }, '🧪 Getting test cases for package');

    try {
      const testCases = await generator.getTestCases('package', packageId, {
        difficulty: query.difficulty,
        test_type: query.test_type,
        limit: query.limit,
        sort: query.sort,
      });

      return reply.code(200).send({
        test_cases: testCases,
        total: testCases.length,
      });
    } catch (error) {
      server.log.error({
        error: error instanceof Error ? error.message : String(error),
        package_id: packageId,
      }, '✗ Failed to get test cases');

      return reply.code(500).send({
        error: 'Failed to retrieve test cases',
      });
    }
  });

  /**
   * Get test cases for a collection
   */
  server.get('/collections/:collectionId/test-cases', {
    onRequest: [optionalAuth],
    schema: {
      tags: ['test-cases'],
      description: 'Get AI-generated test cases for a collection',
      params: {
        type: 'object',
        properties: {
          collectionId: { type: 'string', format: 'uuid' },
        },
        required: ['collectionId'],
      },
      querystring: {
        type: 'object',
        properties: {
          difficulty: { type: 'string', enum: ['basic', 'intermediate', 'advanced'] },
          test_type: { type: 'string', enum: ['concept', 'practical', 'edge_case', 'comparison', 'quality'] },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 10 },
          sort: { type: 'string', enum: ['confidence', 'success_rate', 'usage'], default: 'confidence' },
        },
      },
    },
  }, async (
    request: FastifyRequest<{
      Params: { collectionId: string };
      Querystring: z.infer<typeof GetTestCasesQuerySchema>;
    }>,
    reply: FastifyReply
  ) => {
    const { collectionId } = request.params;
    const query = GetTestCasesQuerySchema.parse(request.query);

    server.log.info({
      action: 'get_test_cases',
      collection_id: collectionId,
      query,
    }, '🧪 Getting test cases for collection');

    try {
      const testCases = await generator.getTestCases('collection', collectionId, {
        difficulty: query.difficulty,
        test_type: query.test_type,
        limit: query.limit,
        sort: query.sort,
      });

      return reply.code(200).send({
        test_cases: testCases,
        total: testCases.length,
      });
    } catch (error) {
      server.log.error({
        error: error instanceof Error ? error.message : String(error),
        collection_id: collectionId,
      }, '✗ Failed to get test cases');

      return reply.code(500).send({
        error: 'Failed to retrieve test cases',
      });
    }
  });

  /**
   * Record test case usage (when user runs a test)
   */
  server.post('/test-cases/record-usage', {
    onRequest: [optionalAuth],
    schema: {
      tags: ['test-cases'],
      description: 'Record that a user ran a test case',
      body: {
        type: 'object',
        properties: {
          test_case_id: { type: 'string', format: 'uuid' },
        },
        required: ['test_case_id'],
      },
    },
  }, async (
    request: FastifyRequest<{
      Body: z.infer<typeof RecordUsageBodySchema>;
    }>,
    reply: FastifyReply
  ) => {
    const { test_case_id } = RecordUsageBodySchema.parse(request.body);

    try {
      await generator.recordUsage(test_case_id);

      return reply.code(200).send({
        success: true,
      });
    } catch (error) {
      server.log.error({
        error: error instanceof Error ? error.message : String(error),
        test_case_id,
      }, '✗ Failed to record test case usage');

      return reply.code(500).send({
        error: 'Failed to record usage',
      });
    }
  });

  /**
   * Submit feedback on a test case
   */
  server.post('/test-cases/feedback', {
    onRequest: [requireAuth],
    schema: {
      tags: ['test-cases'],
      description: 'Submit feedback on test case helpfulness',
      body: {
        type: 'object',
        properties: {
          test_case_id: { type: 'string', format: 'uuid' },
          was_helpful: { type: 'boolean' },
          feedback_comment: { type: 'string', maxLength: 500 },
        },
        required: ['test_case_id', 'was_helpful'],
      },
    },
  }, async (
    request: FastifyRequest<{
      Body: z.infer<typeof RecordFeedbackBodySchema>;
    }>,
    reply: FastifyReply
  ) => {
    const userId = request.user?.user_id;
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { test_case_id, was_helpful, feedback_comment } =
      RecordFeedbackBodySchema.parse(request.body);

    server.log.info({
      action: 'submit_test_feedback',
      test_case_id,
      user_id: userId,
      was_helpful,
    }, '📝 Submitting test case feedback');

    try {
      await generator.recordFeedback(
        test_case_id,
        userId,
        was_helpful,
        feedback_comment
      );

      return reply.code(200).send({
        success: true,
      });
    } catch (error) {
      server.log.error({
        error: error instanceof Error ? error.message : String(error),
        test_case_id,
        user_id: userId,
      }, '✗ Failed to submit feedback');

      return reply.code(500).send({
        error: 'Failed to submit feedback',
      });
    }
  });
}
