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
import '../types/jwt.js';

const SALT_ROUNDS = 10;

/**
 * Helper function to fetch user data from GitHub and create/update user
 */
async function authenticateWithGitHub(server: FastifyInstance, accessToken: string): Promise<{ user: User; jwtToken: string }> {
  // Fetch user data from GitHub
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!userResponse.ok) {
    throw new Error('Failed to fetch GitHub user data');
  }

  const githubUser = await userResponse.json();

  // Fetch user email
  const emailResponse = await fetch('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  interface GitHubEmail {
    email: string;
    primary: boolean;
    verified: boolean;
  }
  const emails = (await emailResponse.json()) as GitHubEmail[];
  const primaryEmail = emails.find((e) => e.primary)?.email || emails[0]?.email;

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
      `INSERT INTO users (username, email, github_id, github_username, avatar_url, last_login_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        githubUser.login,
        primaryEmail,
        String(githubUser.id),
        githubUser.login,
        githubUser.avatar_url,
      ]
    );
  } else {
    // Update last login
    await query(
      server,
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
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

  // Override GitHub OAuth start to support custom redirect parameter
  server.get('/github', async (request: FastifyRequest, reply: FastifyReply) => {
    // Check if GitHub OAuth is configured
    // @ts-ignore - fastify-oauth2 types
    if (!server.githubOAuth2) {
      return reply.status(503).send({
        error: 'GitHub OAuth not configured',
        message: 'GitHub authentication is not available. Please configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.',
      });
    }

    const { redirect } = request.query as { redirect?: string };

    // Generate state parameter for security
    const state = nanoid(32);

    // Store redirect URL if provided
    if (redirect) {
      pendingRedirects.set(state, redirect);
      // Clean up after 10 minutes
      setTimeout(() => pendingRedirects.delete(state), 10 * 60 * 1000);
    }

    // Get the OAuth authorization URL
    // @ts-ignore - fastify-oauth2 types
    const authUrl = await server.githubOAuth2.generateAuthorizationUri(request, reply);

    // Add state parameter
    const urlWithState = new URL(authUrl);
    urlWithState.searchParams.set('state', state);

    return reply.redirect(urlWithState.toString());
  });

  // GitHub OAuth callback
  server.get('/github/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { state } = request.query as { state?: string };

      // @ts-ignore - fastify-oauth2 types
      const token = await server.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

      const { user, jwtToken } = await authenticateWithGitHub(server, token.access_token);

      // Check if there's a pending redirect for this state
      let redirectUrl = state ? pendingRedirects.get(state) : undefined;

      // Clean up
      if (state) {
        pendingRedirects.delete(state);
      }

      if (redirectUrl) {
        // CLI or custom redirect - include token and username
        const url = new URL(redirectUrl);
        url.searchParams.set('token', jwtToken);
        url.searchParams.set('username', user.username);
        return reply.redirect(url.toString());
      }

      // Default: redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return reply.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}&username=${user.username}`);
    } catch (error: unknown) {
      const err = toError(error);
      server.log.error({ error: err.message }, 'GitHub OAuth error');
      return reply.status(500).send({ error: 'Authentication failed' });
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
