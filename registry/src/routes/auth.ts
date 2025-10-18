/**
 * Authentication routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { queryOne, query } from '../db/index.js';
import { User, JWTPayload } from '../types.js';
import { nanoid } from 'nanoid';
import '../types/jwt.js';

export async function authRoutes(server: FastifyInstance) {
  // GitHub OAuth callback
  server.get('/github/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore - fastify-oauth2 types
      const token = await server.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

      // Fetch user data from GitHub
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
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
          Authorization: `Bearer ${token.access_token}`,
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

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return reply.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}`);
    } catch (error: any) {
      server.log.error('GitHub OAuth error:', error);
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

    return user;
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
    const token = `prmp_${nanoid(32)}`;

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
