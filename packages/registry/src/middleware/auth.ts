/**
 * Authentication and Authorization Middleware
 * Provides JWT-based auth and role-based access control
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthUser } from '../types/fastify.js';

/**
 * Require authentication - user must be logged in
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Verify JWT token
    await request.jwtVerify();
    
    // User is authenticated and available in request.user
  } catch (err) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Authentication required. Please log in.',
      statusCode: 401,
    });
  }
}

/**
 * Require admin role
 */
export function requireAdmin() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // First verify they're authenticated
      await request.jwtVerify();

      const user = request.user;
      if (!user) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required. Please log in.',
          statusCode: 401,
        });
      }

      // Check if user is admin
      if (!user.is_admin) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'This action requires admin privileges.',
          statusCode: 403,
        });
      }
    } catch (err) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required. Please log in.',
        statusCode: 401,
      });
    }
  };
}

/**
 * Require resource ownership - user must own the resource
 */
export function requireOwnership(getResourceOwnerId: (request: FastifyRequest) => Promise<string>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Verify authentication
      await request.jwtVerify();

      const user = request.user;
      if (!user) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required. Please log in.',
          statusCode: 401,
        });
      }

      // Admins can access any resource
      if (user.is_admin) {
        return;
      }

      // Get the resource owner ID
      const ownerId = await getResourceOwnerId(request);

      // Check if user owns the resource
      if (user.user_id !== ownerId) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to access this resource.',
          statusCode: 403,
        });
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('token')) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required. Please log in.',
          statusCode: 401,
        });
      }
      throw err;
    }
  };
}

/**
 * Optional auth - adds user to request if authenticated, but doesn't require it
 */
export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
    // User is now available in request.user if token is valid
    request.log.debug({ userId: request.user?.user_id, hasUser: !!request.user }, 'optionalAuth: JWT verified successfully');
  } catch (err) {
    // Ignore errors, authentication is optional
    // request.user will be undefined
    request.log.debug({ error: err instanceof Error ? err.message : String(err) }, 'optionalAuth: JWT verification failed');
  }
}

/**
 * Require verified user (email verified, account in good standing)
 */
export async function requireVerified(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();

    const user = request.user;
    if (!user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required. Please log in.',
        statusCode: 401,
      });
    }

    // For now, all authenticated users are considered verified
    // TODO: Add verified field to JWT payload
  } catch (err) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Authentication required. Please log in.',
      statusCode: 401,
    });
  }
}
