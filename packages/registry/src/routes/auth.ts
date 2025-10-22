/**
 * Authentication routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { queryOne, query } from '../db/index.js';
import { User, JWTPayload } from '../types.js';
import { nanoid } from 'nanoid';
import { hash, compare } from 'bcrypt';
import { toError, getErrorMessage } from '../types/errors.js';
import { nangoService } from '../services/nango.js';
import '../types/jwt.js';

const SALT_ROUNDS = 10;

/**
 * Helper function to authenticate user with Nango connection
 */
async function authenticateWithNango(server: FastifyInstance, connectionId: string): Promise<{ user: User; jwtToken: string }> {
  // Get GitHub user data via Nango proxy
  const githubUser = await nangoService.getGitHubUser(connectionId);
  server.log.info({ login: githubUser.login, id: githubUser.id }, 'Fetched GitHub user data via Nango');

  // Get user emails via Nango proxy
  const { email: primaryEmail } = await nangoService.getGitHubUser(connectionId);

  if (!primaryEmail) {
    throw new Error('No email found in GitHub account');
  }

  // Find or create user
  let user = await queryOne<User>(
    server,
    'SELECT * FROM users WHERE github_id = $1',
    [String(githubUser.id)]
  );

  if (!user) {
    // Create new user
    user = await queryOne<User>(
      server,
      `INSERT INTO users (username, email, github_id, github_username, avatar_url, nango_connection_id, last_login_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        githubUser.login,
        primaryEmail,
        String(githubUser.id),
        githubUser.login,
        githubUser.avatar_url,
        connectionId,
      ]
    );
  } else {
    // Update last login, GitHub username, and connection ID
    await query(
      server,
      'UPDATE users SET last_login_at = NOW(), github_username = $2, nango_connection_id = $3 WHERE id = $1',
      [user.id, githubUser.login, connectionId]
    );
  }

  if (!user) {
    throw new Error('Failed to create or fetch user');
  }

  // Generate JWT
  const jwtToken = server.jwt.sign({
    user_id: user.id,
    username: user.username,
    email: user.email,
    is_admin: user.is_admin,
    scopes: ['read:packages', 'write:packages'],
  } as JWTPayload);

  return { user, jwtToken };
}

export async function authRoutes(server: FastifyInstance) {
  // Store redirect URLs temporarily (keyed by state parameter)
  const pendingRedirects = new Map<string, string>();
  
  // Store CLI authentication sessions (userId -> connectionId)
  const cliAuthSessions = new Map<string, string>();

  // Create Nango connect session for webapp
  server.post('/nango/connect-session', {
    schema: {
      body: {
        type: 'object',
        required: ['userId', 'email', 'displayName'],
        properties: {
          userId: { type: 'string' },
          email: { type: 'string' },
          displayName: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            connectSessionToken: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, email, displayName } = request.body as {
        userId: string;
        email: string;
        displayName: string;
      };

      const { token } = await nangoService.createConnectSession(
        userId,
        email,
        displayName
      );

      return reply.send({ connectSessionToken: token });
    } catch (error) {
      server.log.error(error, 'Failed to create Nango connect session');
      return reply.status(500).send({ error: 'Failed to create connect session' });
    }
  });

  // Create Nango connect session for CLI (returns connect link)
  server.post('/nango/cli/connect-session', {
    schema: {
      body: {
        type: 'object',
        required: ['userId', 'email', 'displayName'],
        properties: {
          userId: { type: 'string' },
          email: { type: 'string' },
          displayName: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            connectSessionToken: { type: 'string' },
            connect_link: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, email, displayName } = request.body as {
        userId: string;
        email: string;
        displayName: string;
      };

      const result = await nangoService.createCLIConnectSession(
        userId,
        email,
        displayName
      );

      return reply.send(result);
    } catch (error) {
      server.log.error(error, 'Failed to create Nango CLI connect session');
      return reply.status(500).send({ error: 'Failed to create connect session' });
    }
  });

  // Handle Nango webhook for connection events
  server.post('/nango/webhook', {
    schema: {
      body: {
        type: 'object',
        required: ['type', 'operation', 'success'],
        properties: {
          type: { type: 'string' },
          operation: { type: 'string' },
          success: { type: 'boolean' },
          connectionId: { type: 'string' },
          endUser: {
            type: 'object',
            properties: {
              endUserId: { type: 'string' },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { type, operation, success, connectionId, endUser } = request.body as {
        type: string;
        operation: string;
        success: boolean;
        connectionId?: string;
        endUser?: { endUserId: string };
      };

      server.log.info({ type, operation, success, connectionId, endUser }, 'Nango webhook received');

      if (type === 'auth' && operation === 'creation' && success && connectionId && endUser) {
        // Store the connection ID for the user
        // This will be used when the CLI polls for authentication completion
        server.log.info({ connectionId, userId: endUser.endUserId }, 'New connection established');
        
        // Store the connection ID for CLI authentication sessions
        cliAuthSessions.set(endUser.endUserId, connectionId);
      }

      return reply.send({ success: true });
    } catch (error) {
      server.log.error(error, 'Failed to handle Nango webhook');
      return reply.status(500).send({ error: 'Webhook processing failed' });
    }
  });

  // Poll for CLI authentication completion
  server.get('/nango/cli/status/:userId', {
    schema: {
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            authenticated: { type: 'boolean' },
            connectionId: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.params as { userId: string };
      
      // Check if we have a connection ID for this user
      const connectionId = cliAuthSessions.get(userId);
      
      if (connectionId) {
        // Clean up the session after use
        cliAuthSessions.delete(userId);
        
        return reply.send({
          authenticated: true,
          connectionId,
        });
      }
      
      return reply.send({
        authenticated: false,
        connectionId: null,
      });
    } catch (error) {
      server.log.error(error, 'Failed to check CLI authentication status');
      return reply.status(500).send({ error: 'Failed to check status' });
    }
  });

  // Handle Nango authentication callback
  server.post('/nango/callback', {
    schema: {
      body: {
        type: 'object',
        required: ['connectionId'],
        properties: {
          connectionId: { type: 'string' },
          redirectUrl: { type: 'string' },
          userId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token: { type: 'string' },
            username: { type: 'string' },
            redirectUrl: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { connectionId, redirectUrl, userId } = request.body as {
        connectionId: string;
        redirectUrl?: string;
        userId?: string;
      };

      server.log.info({ connectionId, userId }, 'Nango authentication callback received');

      // If userId is provided, this is a CLI authentication - store in sessions map
      if (userId) {
        server.log.info({ userId, connectionId }, 'Storing CLI auth session');
        cliAuthSessions.set(userId, connectionId);
      }

      const { user, jwtToken } = await authenticateWithNango(server, connectionId);

      server.log.info({ username: user.username }, 'User authenticated successfully via Nango');

      return reply.send({
        success: true,
        token: jwtToken,
        username: user.username,
        redirectUrl: redirectUrl || '/dashboard',
      });
    } catch (error) {
      server.log.error(error, 'Failed to authenticate with Nango');
      return reply.status(500).send({
        success: false,
        error: 'Authentication failed'
      });
    }
  });

  /**
   * Register with email/password
   * POST /api/v1/auth/register
   */
  server.post('/register', {
    schema: {
      tags: ['auth'],
      description: 'Register a new user with email and password',
      body: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 39 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                email: { type: 'string' },
              },
            },
            token: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { username, email, password } = request.body as {
      username: string;
      email: string;
      password: string;
    };

    try {
      // Check if username already exists
      const existingUsername = await queryOne<User>(
        server,
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (existingUsername) {
        return reply.status(400).send({
          error: 'Username already taken',
          message: 'This username is already registered',
        });
      }

      // Check if email already exists
      const existingEmail = await queryOne<User>(
        server,
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingEmail) {
        return reply.status(400).send({
          error: 'Email already registered',
          message: 'This email is already registered',
        });
      }

      // Hash password
      const passwordHash = await hash(password, SALT_ROUNDS);

      // Create user
      const user = await queryOne<User>(
        server,
        `INSERT INTO users (username, email, password_hash, last_login_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, username, email, avatar_url, verified_author, is_admin`,
        [username, email, passwordHash]
      );

      if (!user) {
        return reply.status(500).send({
          error: 'Failed to create user',
        });
      }

      // Generate JWT
      const jwtToken = server.jwt.sign({
        user_id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
        scopes: ['read:packages', 'write:packages'],
      } as JWTPayload);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token: jwtToken,
      };
    } catch (error: unknown) {
      const err = toError(error);
      server.log.error({ error: err.message }, 'Registration error');
      return reply.status(500).send({
        error: 'Registration failed',
        message: err.message,
      });
    }
  });

  /**
   * Login with email/password
   * POST /api/v1/auth/login
   */
  server.post('/login', {
    schema: {
      tags: ['auth'],
      description: 'Login with email and password',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                email: { type: 'string' },
                avatar_url: { type: 'string' },
                verified_author: { type: 'boolean' },
              },
            },
            token: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    try {
      // Find user by email
      const user = await queryOne<User>(
        server,
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (!user || !user.password_hash) {
        return reply.status(401).send({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        });
      }

      // Verify password
      const passwordValid = await compare(password, user.password_hash);

      if (!passwordValid) {
        return reply.status(401).send({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        });
      }

      // Update last login
      await query(
        server,
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      );

      // Generate JWT
      const jwtToken = server.jwt.sign({
        user_id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
        scopes: ['read:packages', 'write:packages'],
      } as JWTPayload);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
          verified_author: user.verified_author,
        },
        token: jwtToken,
      };
    } catch (error: unknown) {
      const err = toError(error);
      server.log.error({ error: err.message }, 'Login error');
      return reply.status(500).send({
        error: 'Login failed',
        message: err.message,
      });
    }
  });


  // Get current user
  server.get('/me', {
    onRequest: [server.authenticate],
    schema: {
      tags: ['auth'],
      description: 'Get current authenticated user',
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            avatar_url: { type: 'string' },
            verified_author: { type: 'boolean' },
            is_admin: { type: 'boolean' },
            package_count: { type: 'number' },
            total_downloads: { type: 'number' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.user_id;

    const user = await queryOne<User>(
      server,
      'SELECT id, username, email, avatar_url, verified_author, is_admin FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Get user's package count and total downloads
    const stats = await queryOne<{ package_count: string; total_downloads: string }>(
      server,
      `SELECT
        COUNT(p.id)::text as package_count,
        COALESCE(SUM(p.total_downloads), 0)::text as total_downloads
       FROM packages p
       WHERE p.author_id = $1`,
      [userId]
    );

    return {
      ...user,
      package_count: parseInt(stats?.package_count || '0', 10),
      total_downloads: parseInt(stats?.total_downloads || '0', 10),
    };
  });

  // Generate API token
  server.post('/token', {
    onRequest: [server.authenticate],
    schema: {
      tags: ['auth'],
      description: 'Generate a new API token',
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          scopes: {
            type: 'array',
            items: { type: 'string' },
            default: ['read:packages'],
          },
          expires_in: { type: 'string', default: '30d' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            name: { type: 'string' },
            expires_at: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.user_id;
    const { name, scopes = ['read:packages'], expires_in = '30d' } = request.body as {
      name: string;
      scopes?: string[];
      expires_in?: string;
    };

    // Generate random token
    const token = `prpm_${nanoid(32)}`;

    // Hash token for storage
    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Calculate expiration
    const expiresIn = parseExpiresIn(expires_in);
    const expiresAt = new Date(Date.now() + expiresIn);

    // Store token
    await query(
      server,
      `INSERT INTO access_tokens (user_id, token_hash, name, scopes, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, tokenHash, name, scopes, expiresAt]
    );

    return {
      token,
      name,
      expires_at: expiresAt.toISOString(),
    };
  });

  // List user's tokens
  server.get('/tokens', {
    onRequest: [server.authenticate],
    schema: {
      tags: ['auth'],
      description: 'List all API tokens for current user',
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.user_id;

    const result = await query(
      server,
      `SELECT id, name, scopes, is_active, last_used_at, expires_at, created_at
       FROM access_tokens
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return { tokens: result.rows };
  });

  // Revoke token
  server.delete('/tokens/:tokenId', {
    onRequest: [server.authenticate],
    schema: {
      tags: ['auth'],
      description: 'Revoke an API token',
      params: {
        type: 'object',
        properties: {
          tokenId: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.user_id;
    const { tokenId } = request.params as { tokenId: string };

    const result = await query(
      server,
      'DELETE FROM access_tokens WHERE id = $1 AND user_id = $2',
      [tokenId, userId]
    );

    if (result.rowCount === 0) {
      return reply.status(404).send({ error: 'Token not found' });
    }

    return { success: true, message: 'Token revoked' };
  });

  // Get unclaimed packages for authenticated user
  server.get('/me/unclaimed-packages', {
    onRequest: [server.authenticate],
    schema: {
      tags: ['auth'],
      description: 'Get packages that match the authenticated user\'s GitHub username but are not yet claimed',
      response: {
        200: {
          type: 'object',
          properties: {
            packages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  total_downloads: { type: 'number' },
                  created_at: { type: 'string' },
                },
              },
            },
            count: { type: 'number' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.user_id;

    try {
      // Get the user's GitHub username
      const user = await queryOne<User>(
        server,
        'SELECT github_username FROM users WHERE id = $1',
        [userId]
      );

      if (!user || !user.github_username) {
        return {
          packages: [],
          count: 0,
        };
      }

      // Find packages that match the GitHub username but aren't claimed by this user
      // Packages can be namespaced like @username/package-name or just username/package-name
      const packages = await query(
        server,
        `SELECT id, name, description, total_downloads, created_at
         FROM packages
         WHERE (
           name LIKE $1 || '/%'
           OR name LIKE '@' || $1 || '/%'
         )
         AND (author_id IS NULL OR author_id != $2)
         ORDER BY total_downloads DESC, created_at DESC`,
        [user.github_username, userId]
      );

      return {
        packages: packages.rows,
        count: packages.rows.length,
      };
    } catch (error: unknown) {
      const err = toError(error);
      server.log.error({ error: err.message }, 'Error fetching unclaimed packages');
      return reply.status(500).send({
        error: 'Failed to fetch unclaimed packages',
        message: err.message,
      });
    }
  });

  // Claim packages for authenticated user
  server.post('/claim', {
    onRequest: [server.authenticate],
    schema: {
      tags: ['auth'],
      description: 'Claim packages that match the authenticated user\'s GitHub username',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            claimed_count: { type: 'number' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.user_id;

    try {
      // Get the user's GitHub username
      const user = await queryOne<User>(
        server,
        'SELECT github_username FROM users WHERE id = $1',
        [userId]
      );

      if (!user || !user.github_username) {
        return reply.status(400).send({
          error: 'No GitHub account linked',
          message: 'You must have a GitHub account linked to claim packages',
        });
      }

      // Claim packages by updating their author_id
      const result = await query(
        server,
        `UPDATE packages
         SET author_id = $1
         WHERE (
           name LIKE $2 || '/%'
           OR name LIKE '@' || $2 || '/%'
         )
         AND (author_id IS NULL OR author_id != $1)`,
        [userId, user.github_username]
      );

      const claimedCount = result.rowCount || 0;

      if (claimedCount === 0) {
        return {
          success: true,
          claimed_count: 0,
          message: 'No packages to claim',
        };
      }

      // Log the claim action
      await query(
        server,
        `INSERT INTO audit_log (user_id, action, resource_type, metadata)
         VALUES ($1, 'packages.claim', 'package', $2)`,
        [userId, JSON.stringify({ claimed_count: claimedCount, github_username: user.github_username })]
      );

      return {
        success: true,
        claimed_count: claimedCount,
        message: `Successfully claimed ${claimedCount} package${claimedCount !== 1 ? 's' : ''}`,
      };
    } catch (error: unknown) {
      const err = toError(error);
      server.log.error({ error: err.message }, 'Error claiming packages');
      return reply.status(500).send({
        error: 'Failed to claim packages',
        message: err.message,
      });
    }
  });
}

// Helper to parse expires_in strings like "30d", "7d", "1h"
function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([dhm])$/);
  if (!match) {
    throw new Error('Invalid expires_in format. Use format like "30d", "7d", "1h"');
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'm':
      return value * 60 * 1000;
    default:
      throw new Error('Invalid time unit');
  }
}
