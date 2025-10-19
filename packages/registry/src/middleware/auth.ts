/**
 * Authentication and Authorization Middleware
 * Provides JWT-based auth and role-based access control
 */

import { FastifyRequest, FastifyReply } from 'fastify';

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  role: 'user' | 'admin' | 'moderator';
  githubId?: number;
  verified: boolean;
}

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
 * Require specific role (admin, moderator, etc.)
 */
export function requireRole(...allowedRoles: Array<'user' | 'admin' | 'moderator'>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // First verify they're authenticated
      await request.jwtVerify();

      const user = request.user as any as AuthUser;
      
      // Check if user has required role
      if (!allowedRoles.includes(user.role)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: `This action requires one of these roles: ${allowedRoles.join(', ')}`,
          statusCode: 403,
          requiredRoles: allowedRoles,
          userRole: user.role,
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

      const user = request.user as any as AuthUser;
      
      // Admins can access any resource
      if (user.role === 'admin') {
        return;
      }
      
      // Get the resource owner ID
      const ownerId = await getResourceOwnerId(request);
      
      // Check if user owns the resource
      if (user.id !== ownerId) {
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
  } catch (err) {
    // Ignore errors, authentication is optional
    // request.user will be undefined
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

    const user = request.user as any as AuthUser;
    
    if (!user.verified) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'This action requires a verified account.',
        statusCode: 403,
        verified: false,
      });
    }
  } catch (err) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Authentication required. Please log in.',
      statusCode: 401,
    });
  }
}
