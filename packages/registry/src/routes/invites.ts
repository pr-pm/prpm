/**
 * Author Invite Routes
 * White carpet onboarding for top package authors
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface InviteParams {
  token: string;
}

interface ClaimInviteBody {
  github_username?: string;
  email?: string;
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
      preHandler: server.authenticate
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
      preHandler: server.authenticate
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // TODO: Add admin check
      // if (!request.user?.is_admin) {
      //   return reply.status(403).send({ error: 'Forbidden' });
      // }

      try {
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

  server.log.info('✅ Invite routes registered');
}
