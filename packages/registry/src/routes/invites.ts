/**
 * Author Invite Routes
 * White carpet onboarding for top package authors
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

interface InviteParams {
  token: string;
}

interface ClaimInviteBody {
  github_username?: string;
  email?: string;
}

interface CreateInviteBody {
  author_username: string;
  package_count: number;
  invite_message?: string;
  expires_in_days?: number;
}

interface ListInvitesQuery {
  status?: 'pending' | 'claimed' | 'expired' | 'revoked';
  limit?: number;
  offset?: number;
}

export async function inviteRoutes(server: FastifyInstance) {
  /**
   * GET /api/v1/invites/:token
   * Validate and retrieve invite details
   */
  server.get<{ Params: InviteParams }>(
    '/:token',
    {
      schema: {
        description: 'Get author invite details by token',
        tags: ['invites'],
        params: {
          type: 'object',
          properties: {
            token: { type: 'string', minLength: 64, maxLength: 64 }
          },
          required: ['token']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              invite: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  author_username: { type: 'string' },
                  package_count: { type: 'number' },
                  invite_message: { type: 'string' },
                  status: { type: 'string' },
                  expires_at: { type: 'string' },
                  created_at: { type: 'string' }
                }
              }
            }
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Params: InviteParams }>, reply: FastifyReply) => {
      const { token } = request.params;

      try {
        // Fetch invite details
        const result = await server.pg.query(
          `SELECT
            id,
            author_username,
            package_count,
            invite_message,
            status,
            expires_at,
            created_at
          FROM author_invites
          WHERE token = $1`,
          [token]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'Invite not found',
            message: 'This invite link is invalid or has been revoked.'
          });
        }

        const invite = result.rows[0];

        // Check if expired
        if (new Date(invite.expires_at) < new Date()) {
          await server.pg.query(
            `UPDATE author_invites SET status = 'expired' WHERE token = $1`,
            [token]
          );

          return reply.status(410).send({
            error: 'Invite expired',
            message: 'This invite link has expired. Please contact support for a new invite.'
          });
        }

        // Check if already claimed
        if (invite.status === 'claimed') {
          return reply.status(410).send({
            error: 'Invite already claimed',
            message: 'This invite has already been used.'
          });
        }

        // Check if revoked
        if (invite.status === 'revoked') {
          return reply.status(403).send({
            error: 'Invite revoked',
            message: 'This invite has been revoked.'
          });
        }

        return reply.send({
          invite: {
            id: invite.id,
            author_username: invite.author_username,
            package_count: invite.package_count,
            invite_message: invite.invite_message,
            status: invite.status,
            expires_at: invite.expires_at,
            created_at: invite.created_at
          }
        });
      } catch (error) {
        server.log.error(error);
        return reply.status(500).send({
          error: 'Server error',
          message: 'Failed to retrieve invite details'
        });
      }
    }
  );

  /**
   * POST /api/v1/invites/:token/claim
   * Claim an author invite (requires authentication)
   */
  server.post<{ Params: InviteParams; Body: ClaimInviteBody }>(
    '/:token/claim',
    {
      schema: {
        description: 'Claim an author invite',
        tags: ['invites'],
        params: {
          type: 'object',
          properties: {
            token: { type: 'string', minLength: 64, maxLength: 64 }
          },
          required: ['token']
        },
        body: {
          type: 'object',
          properties: {
            github_username: { type: 'string' },
            email: { type: 'string', format: 'email' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  username: { type: 'string' },
                  claimed_author_username: { type: 'string' },
                  verified_author: { type: 'boolean' },
                  package_count: { type: 'number' }
                }
              }
            }
          }
        }
      },
      preHandler: requireAuth
    },
    async (request: FastifyRequest<{ Params: InviteParams; Body: ClaimInviteBody }>, reply: FastifyReply) => {
      const { token } = request.params;
      const { github_username, email } = request.body;
      const userId = request.user?.user_id;

      if (!userId) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'You must be logged in to claim an invite'
        });
      }

      try {
        // Start transaction
        const client = await server.pg.connect();

        try {
          await client.query('BEGIN');

          // Fetch and lock the invite
          const inviteResult = await client.query(
            `SELECT * FROM author_invites WHERE token = $1 FOR UPDATE`,
            [token]
          );

          if (inviteResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return reply.status(404).send({
              error: 'Invite not found',
              message: 'Invalid invite token'
            });
          }

          const invite = inviteResult.rows[0];

          // Validate invite status
          if (invite.status !== 'pending') {
            await client.query('ROLLBACK');
            return reply.status(400).send({
              error: 'Invalid invite',
              message: `This invite is ${invite.status}`
            });
          }

          if (new Date(invite.expires_at) < new Date()) {
            await client.query('ROLLBACK');
            return reply.status(410).send({
              error: 'Invite expired',
              message: 'This invite has expired'
            });
          }

          // Check if username already claimed
          const existingClaim = await client.query(
            `SELECT id FROM users WHERE claimed_author_username = $1`,
            [invite.author_username]
          );

          if (existingClaim.rows.length > 0 && existingClaim.rows[0].id !== userId) {
            await client.query('ROLLBACK');
            return reply.status(409).send({
              error: 'Username already claimed',
              message: 'This author username has already been claimed by another user'
            });
          }

          // Update user with claimed author identity
          await client.query(
            `UPDATE users
            SET
              claimed_author_username = $1,
              verified_author = TRUE,
              github_username = COALESCE($2, github_username),
              email = COALESCE($3, email),
              author_claimed_at = NOW(),
              updated_at = NOW()
            WHERE id = $4`,
            [invite.author_username, github_username, email, userId]
          );

          // Mark invite as claimed
          await client.query(
            `UPDATE author_invites
            SET
              status = 'claimed',
              claimed_by = $1,
              claimed_at = NOW(),
              updated_at = NOW()
            WHERE id = $2`,
            [userId, invite.id]
          );

          // Create author claim record
          await client.query(
            `INSERT INTO author_claims (
              invite_id,
              user_id,
              author_username,
              verification_method,
              github_username,
              github_verified,
              packages_claimed,
              verified_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [
              invite.id,
              userId,
              invite.author_username,
              github_username ? 'github' : 'email',
              github_username,
              !!github_username,
              invite.package_count
            ]
          );

          // Update package ownership
          await client.query(
            `UPDATE packages
            SET author_id = $1, updated_at = NOW()
            WHERE id LIKE $2`,
            [userId, `@${invite.author_username}/%`]
          );

          await client.query('COMMIT');

          // Fetch updated user
          const userResult = await server.pg.query(
            `SELECT
              id,
              username,
              claimed_author_username,
              verified_author,
              email,
              github_username
            FROM users
            WHERE id = $1`,
            [userId]
          );

          const user = userResult.rows[0];

          server.log.info({
            userId,
            authorUsername: invite.author_username,
            packageCount: invite.package_count
          }, 'Author invite claimed successfully');

          return reply.send({
            success: true,
            message: `Successfully claimed @${invite.author_username}! You now own ${invite.package_count} packages.`,
            user: {
              id: user.id,
              username: user.username,
              claimed_author_username: user.claimed_author_username,
              verified_author: user.verified_author,
              package_count: invite.package_count
            }
          });

        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }

      } catch (error) {
        server.log.error(error);
        return reply.status(500).send({
          error: 'Server error',
          message: 'Failed to claim invite'
        });
      }
    }
  );

  /**
   * GET /api/v1/invites/stats
   * Get invite statistics (admin only)
   */
  server.get(
    '/stats',
    {
      schema: {
        description: 'Get invite statistics',
        tags: ['invites'],
        response: {
          200: {
            type: 'object',
            properties: {
              total_invites: { type: 'number' },
              pending: { type: 'number' },
              claimed: { type: 'number' },
              expired: { type: 'number' },
              revoked: { type: 'number' },
              total_packages: { type: 'number' },
              claimed_packages: { type: 'number' }
            }
          }
        }
      },
      preHandler: requireAdmin()
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try{
        const result = await server.pg.query(`
          SELECT
            COUNT(*) FILTER (WHERE status = 'pending') as pending,
            COUNT(*) FILTER (WHERE status = 'claimed') as claimed,
            COUNT(*) FILTER (WHERE status = 'expired') as expired,
            COUNT(*) FILTER (WHERE status = 'revoked') as revoked,
            COUNT(*) as total_invites,
            SUM(package_count) as total_packages,
            SUM(package_count) FILTER (WHERE status = 'claimed') as claimed_packages
          FROM author_invites
        `);

        const stats = result.rows[0];

        return reply.send({
          total_invites: parseInt(stats.total_invites),
          pending: parseInt(stats.pending),
          claimed: parseInt(stats.claimed),
          expired: parseInt(stats.expired),
          revoked: parseInt(stats.revoked),
          total_packages: parseInt(stats.total_packages) || 0,
          claimed_packages: parseInt(stats.claimed_packages) || 0
        });
      } catch (error) {
        server.log.error(error);
        return reply.status(500).send({
          error: 'Server error',
          message: 'Failed to retrieve invite statistics'
        });
      }
    }
  );

  /**
   * POST /api/v1/invites
   * Create a new author invite (admin only)
   */
  server.post<{ Body: CreateInviteBody }>(
    '/',
    {
      schema: {
        description: 'Create a new author invite',
        tags: ['invites'],
        body: {
          type: 'object',
          properties: {
            author_username: { type: 'string', minLength: 1 },
            package_count: { type: 'number', minimum: 1 },
            invite_message: { type: 'string' },
            expires_in_days: { type: 'number', minimum: 1, maximum: 365 }
          },
          required: ['author_username', 'package_count']
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              invite: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  token: { type: 'string' },
                  author_username: { type: 'string' },
                  package_count: { type: 'number' },
                  invite_message: { type: 'string' },
                  expires_at: { type: 'string' },
                  invite_url: { type: 'string' }
                }
              }
            }
          }
        }
      },
      preHandler: requireAdmin()
    },
    async (request: FastifyRequest<{ Body: CreateInviteBody }>, reply: FastifyReply) => {

      const { author_username, package_count, invite_message, expires_in_days = 30 } = request.body;

      try {
        // Generate secure token (64 chars)
        const crypto = await import('crypto');
        const token = crypto.randomBytes(32).toString('hex');

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expires_in_days);

        // Create invite
        const result = await server.pg.query(
          `INSERT INTO author_invites (
            token,
            author_username,
            package_count,
            invite_message,
            status,
            expires_at,
            created_by
          ) VALUES ($1, $2, $3, $4, 'pending', $5, $6)
          RETURNING id, token, author_username, package_count, invite_message, expires_at, created_at`,
          [token, author_username, package_count, invite_message || null, expiresAt, request.user?.user_id]
        );

        const invite = result.rows[0];

        // Generate invite URL
        const baseUrl = process.env.WEBAPP_URL || 'https://prpm.dev';
        const inviteUrl = `${baseUrl}/claim/${token}`;

        server.log.info({
          authorUsername: author_username,
          packageCount: package_count,
          expiresAt
        }, 'Author invite created');

        return reply.status(201).send({
          success: true,
          invite: {
            id: invite.id,
            token: invite.token,
            author_username: invite.author_username,
            package_count: invite.package_count,
            invite_message: invite.invite_message,
            expires_at: invite.expires_at,
            invite_url: inviteUrl
          }
        });

      } catch (error) {
        server.log.error(error);
        return reply.status(500).send({
          error: 'Server error',
          message: 'Failed to create invite'
        });
      }
    }
  );

  /**
   * GET /api/v1/invites
   * List all invites (admin only)
   */
  server.get<{ Querystring: ListInvitesQuery }>(
    '/',
    {
      schema: {
        description: 'List all author invites',
        tags: ['invites'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['pending', 'claimed', 'expired', 'revoked'] },
            limit: { type: 'number', minimum: 1, maximum: 100 },
            offset: { type: 'number', minimum: 0 }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              invites: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    author_username: { type: 'string' },
                    package_count: { type: 'number' },
                    status: { type: 'string' },
                    expires_at: { type: 'string' },
                    created_at: { type: 'string' },
                    claimed_at: { type: 'string' },
                    claimed_by: { type: 'string' }
                  }
                }
              },
              total: { type: 'number' },
              limit: { type: 'number' },
              offset: { type: 'number' }
            }
          }
        }
      },
      preHandler: requireAdmin()
    },
    async (request: FastifyRequest<{ Querystring: ListInvitesQuery }>, reply: FastifyReply) => {

      const { status, limit = 50, offset = 0 } = request.query;

      try {
        // Build query
        let query = `
          SELECT
            id,
            author_username,
            package_count,
            invite_message,
            status,
            expires_at,
            created_at,
            claimed_at,
            claimed_by
          FROM author_invites
        `;

        const params: any[] = [];
        if (status) {
          query += ` WHERE status = $1`;
          params.push(status);
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await server.pg.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM author_invites';
        const countParams: any[] = [];
        if (status) {
          countQuery += ' WHERE status = $1';
          countParams.push(status);
        }

        const countResult = await server.pg.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        return reply.send({
          invites: result.rows,
          total,
          limit,
          offset
        });

      } catch (error) {
        server.log.error(error);
        return reply.status(500).send({
          error: 'Server error',
          message: 'Failed to retrieve invites'
        });
      }
    }
  );

  /**
   * DELETE /api/v1/invites/:token
   * Revoke an invite (admin only)
   */
  server.delete<{ Params: InviteParams }>(
    '/:token',
    {
      schema: {
        description: 'Revoke an author invite',
        tags: ['invites'],
        params: {
          type: 'object',
          properties: {
            token: { type: 'string', minLength: 64, maxLength: 64 }
          },
          required: ['token']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: requireAdmin()
    },
    async (request: FastifyRequest<{ Params: InviteParams }>, reply: FastifyReply) => {

      const { token } = request.params;

      try {
        const result = await server.pg.query(
          `UPDATE author_invites
          SET status = 'revoked', updated_at = NOW()
          WHERE token = $1 AND status = 'pending'
          RETURNING id, author_username`,
          [token]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'Invite not found',
            message: 'Invite not found or already claimed/revoked'
          });
        }

        const invite = result.rows[0];

        server.log.info({
          inviteId: invite.id,
          authorUsername: invite.author_username
        }, 'Invite revoked');

        return reply.send({
          success: true,
          message: `Invite for @${invite.author_username} has been revoked`
        });

      } catch (error) {
        server.log.error(error);
        return reply.status(500).send({
          error: 'Server error',
          message: 'Failed to revoke invite'
        });
      }
    }
  );

  server.log.info('✅ Invite routes registered');
}
