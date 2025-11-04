/**
 * Suggested Test Inputs API Routes
 *
 * Allows package authors to create and manage suggested test inputs
 * for users to try when testing their packages.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

// Validation schemas
const CreateSuggestedInputSchema = z.object({
  package_id: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  suggested_input: z.string().min(1).max(10000),
  category: z.enum(['code-review', 'documentation', 'refactoring', 'general', 'testing', 'optimization']).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  estimated_credits: z.number().int().min(1).max(50).default(1),
  recommended_model: z.enum(['sonnet', 'opus', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo']).optional(),
  display_order: z.number().int().min(0).default(0),
});

const UpdateSuggestedInputSchema = CreateSuggestedInputSchema.partial().omit({ package_id: true });

const RecordUsageSchema = z.object({
  suggested_input_id: z.string().uuid(),
});

const MarkCompleteSchema = z.object({
  usage_id: z.string().uuid(),
  session_id: z.string().uuid(),
});

export async function suggestedTestInputsRoutes(server: FastifyInstance) {
  // =====================================================
  // GET /api/v1/suggested-inputs/package/:packageId
  // Get all suggested inputs for a package (public)
  // =====================================================
  server.get(
    '/package/:packageId',
    {
      schema: {
        description: 'Get suggested test inputs for a package',
        tags: ['suggested-inputs'],
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
            category: { type: 'string' },
            difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { packageId } = request.params as { packageId: string };
        const { category, difficulty } = request.query as { category?: string; difficulty?: string };

        let query = `
          SELECT
            id, package_id, title, description, suggested_input,
            category, difficulty, estimated_credits, recommended_model,
            display_order, usage_count, created_at
          FROM suggested_test_inputs
          WHERE package_id = $1 AND is_active = TRUE
        `;

        const params: any[] = [packageId];
        let paramIndex = 2;

        if (category) {
          query += ` AND category = $${paramIndex}`;
          params.push(category);
          paramIndex++;
        }

        if (difficulty) {
          query += ` AND difficulty = $${paramIndex}`;
          params.push(difficulty);
          paramIndex++;
        }

        query += ' ORDER BY display_order ASC, usage_count DESC';

        const result = await server.pg.query(query, params);

        return reply.code(200).send({
          suggested_inputs: result.rows,
          total: result.rows.length,
        });
      } catch (error: any) {
        server.log.error({ error }, 'Failed to get suggested inputs');
        return reply.code(500).send({
          error: 'get_suggested_inputs_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // POST /api/v1/suggested-inputs
  // Create a new suggested input (author only)
  // =====================================================
  server.post(
    '/',
    {
      preHandler: server.authenticate,
      schema: {
        description: 'Create a new suggested test input',
        tags: ['suggested-inputs'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['package_id', 'title', 'suggested_input'],
          properties: {
            package_id: { type: 'string', format: 'uuid' },
            title: { type: 'string', minLength: 1, maxLength: 100 },
            description: { type: 'string' },
            suggested_input: { type: 'string', minLength: 1, maxLength: 10000 },
            category: { type: 'string', enum: ['code-review', 'documentation', 'refactoring', 'general', 'testing', 'optimization'] },
            difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
            estimated_credits: { type: 'integer', minimum: 1, maximum: 50, default: 1 },
            recommended_model: { type: 'string', enum: ['sonnet', 'opus', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
            display_order: { type: 'integer', minimum: 0, default: 0 },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = CreateSuggestedInputSchema.parse(request.body);
        const userId = request.user?.user_id;

        if (!userId) {
          return reply.code(401).send({
            error: 'unauthorized',
            message: 'Authentication required',
          });
        }

        // Verify user is the package author
        const packageCheck = await server.pg.query(
          'SELECT author_id FROM packages WHERE id = $1',
          [body.package_id]
        );

        if (packageCheck.rows.length === 0) {
          return reply.code(404).send({
            error: 'package_not_found',
            message: 'Package not found',
          });
        }

        if (packageCheck.rows[0].author_id !== userId) {
          return reply.code(403).send({
            error: 'forbidden',
            message: 'Only package author can create suggested inputs',
          });
        }

        // Create suggested input
        const result = await server.pg.query(
          `INSERT INTO suggested_test_inputs
           (package_id, author_id, title, description, suggested_input, category,
            difficulty, estimated_credits, recommended_model, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING *`,
          [
            body.package_id,
            userId,
            body.title,
            body.description || null,
            body.suggested_input,
            body.category || null,
            body.difficulty,
            body.estimated_credits,
            body.recommended_model || null,
            body.display_order,
          ]
        );

        server.log.info(
          { suggestedInputId: result.rows[0].id, packageId: body.package_id },
          'Created suggested test input'
        );

        return reply.code(201).send(result.rows[0]);
      } catch (error: any) {
        server.log.error({ error }, 'Failed to create suggested input');
        return reply.code(400).send({
          error: 'create_suggested_input_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // PATCH /api/v1/suggested-inputs/:id
  // Update a suggested input (author only)
  // =====================================================
  server.patch(
    '/:id',
    {
      preHandler: server.authenticate,
      schema: {
        description: 'Update a suggested test input',
        tags: ['suggested-inputs'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const body = UpdateSuggestedInputSchema.parse(request.body);
        const userId = request.user?.user_id;

        if (!userId) {
          return reply.code(401).send({
            error: 'unauthorized',
            message: 'Authentication required',
          });
        }

        // Verify ownership
        const ownerCheck = await server.pg.query(
          'SELECT author_id FROM suggested_test_inputs WHERE id = $1',
          [id]
        );

        if (ownerCheck.rows.length === 0) {
          return reply.code(404).send({
            error: 'not_found',
            message: 'Suggested input not found',
          });
        }

        if (ownerCheck.rows[0].author_id !== userId) {
          return reply.code(403).send({
            error: 'forbidden',
            message: 'Only the author can update this suggested input',
          });
        }

        // Build update query dynamically
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        Object.entries(body).forEach(([key, value]) => {
          if (value !== undefined) {
            updates.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        });

        if (updates.length === 0) {
          return reply.code(400).send({
            error: 'no_updates',
            message: 'No fields to update',
          });
        }

        values.push(id);
        const query = `
          UPDATE suggested_test_inputs
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;

        const result = await server.pg.query(query, values);

        return reply.code(200).send(result.rows[0]);
      } catch (error: any) {
        server.log.error({ error }, 'Failed to update suggested input');
        return reply.code(400).send({
          error: 'update_suggested_input_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // DELETE /api/v1/suggested-inputs/:id
  // Delete (deactivate) a suggested input (author only)
  // =====================================================
  server.delete(
    '/:id',
    {
      preHandler: server.authenticate,
      schema: {
        description: 'Delete a suggested test input',
        tags: ['suggested-inputs'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user?.user_id;

        if (!userId) {
          return reply.code(401).send({
            error: 'unauthorized',
            message: 'Authentication required',
          });
        }

        // Verify ownership
        const ownerCheck = await server.pg.query(
          'SELECT author_id FROM suggested_test_inputs WHERE id = $1',
          [id]
        );

        if (ownerCheck.rows.length === 0) {
          return reply.code(404).send({
            error: 'not_found',
            message: 'Suggested input not found',
          });
        }

        if (ownerCheck.rows[0].author_id !== userId) {
          return reply.code(403).send({
            error: 'forbidden',
            message: 'Only the author can delete this suggested input',
          });
        }

        // Soft delete (deactivate)
        await server.pg.query(
          'UPDATE suggested_test_inputs SET is_active = FALSE WHERE id = $1',
          [id]
        );

        return reply.code(200).send({
          message: 'Suggested input deleted successfully',
        });
      } catch (error: any) {
        server.log.error({ error }, 'Failed to delete suggested input');
        return reply.code(400).send({
          error: 'delete_suggested_input_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // POST /api/v1/suggested-inputs/record-usage
  // Record when a user clicks a suggested input
  // =====================================================
  server.post(
    '/record-usage',
    {
      schema: {
        description: 'Record usage of a suggested input',
        tags: ['suggested-inputs'],
        body: {
          type: 'object',
          required: ['suggested_input_id'],
          properties: {
            suggested_input_id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = RecordUsageSchema.parse(request.body);
        const userId = request.user?.user_id || null;

        // Create IP hash for anonymous tracking
        const crypto = await import('crypto');
        const ipHash = crypto.createHash('sha256').update(request.ip).digest('hex');

        // Use database function to record usage
        const result = await server.pg.query(
          'SELECT increment_suggested_input_usage($1, $2, $3) as usage_id',
          [body.suggested_input_id, userId, ipHash]
        );

        return reply.code(200).send({
          usage_id: result.rows[0].usage_id,
          message: 'Usage recorded successfully',
        });
      } catch (error: any) {
        server.log.error({ error }, 'Failed to record suggested input usage');
        return reply.code(400).send({
          error: 'record_usage_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // POST /api/v1/suggested-inputs/mark-complete
  // Mark a suggested input usage as completed
  // =====================================================
  server.post(
    '/mark-complete',
    {
      schema: {
        description: 'Mark suggested input usage as completed with test',
        tags: ['suggested-inputs'],
        body: {
          type: 'object',
          required: ['usage_id', 'session_id'],
          properties: {
            usage_id: { type: 'string', format: 'uuid' },
            session_id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = MarkCompleteSchema.parse(request.body);

        // Use database function to mark complete
        await server.pg.query(
          'SELECT mark_suggested_input_test_complete($1, $2)',
          [body.usage_id, body.session_id]
        );

        return reply.code(200).send({
          message: 'Marked as complete successfully',
        });
      } catch (error: any) {
        server.log.error({ error }, 'Failed to mark suggested input complete');
        return reply.code(400).send({
          error: 'mark_complete_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // GET /api/v1/suggested-inputs/author/:authorId
  // Get all suggested inputs by an author (for dashboard)
  // =====================================================
  server.get(
    '/author/:authorId',
    {
      preHandler: server.authenticate,
      schema: {
        description: 'Get all suggested inputs created by an author',
        tags: ['suggested-inputs'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            authorId: { type: 'string', format: 'uuid' },
          },
          required: ['authorId'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { authorId } = request.params as { authorId: string };
        const userId = request.user?.user_id;

        // Only allow users to view their own suggested inputs
        if (userId !== authorId) {
          return reply.code(403).send({
            error: 'forbidden',
            message: 'Can only view your own suggested inputs',
          });
        }

        const result = await server.pg.query(
          `SELECT
            si.*,
            p.name as package_name,
            (SELECT COUNT(*) FROM suggested_input_usage WHERE suggested_input_id = si.id) as total_clicks,
            (SELECT COUNT(*) FROM suggested_input_usage WHERE suggested_input_id = si.id AND completed_test = TRUE) as completed_tests
           FROM suggested_test_inputs si
           JOIN packages p ON si.package_id = p.id
           WHERE si.author_id = $1
           ORDER BY si.created_at DESC`,
          [authorId]
        );

        return reply.code(200).send({
          suggested_inputs: result.rows,
          total: result.rows.length,
        });
      } catch (error: any) {
        server.log.error({ error }, 'Failed to get author suggested inputs');
        return reply.code(500).send({
          error: 'get_author_inputs_failed',
          message: error.message,
        });
      }
    }
  );
}
