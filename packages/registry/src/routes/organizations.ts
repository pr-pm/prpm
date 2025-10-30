/**
 * Organization routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { query, queryOne } from '../db/index.js';
import { cacheGet, cacheSet } from '../cache/redis.js';
import { optionalAuth } from '../middleware/auth.js';

interface Organization {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  website_url: string | null;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

interface OrganizationMember {
  user_id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  role: string;
  joined_at: Date;
}

interface OrganizationPackage {
  id: string;
  name: string;
  description: string;
  format: string;
  subtype: string;
  visibility: string;
  total_downloads: number;
  weekly_downloads: number;
  is_featured: boolean;
  is_verified: boolean;
  last_published_at: Date;
  created_at: Date;
  tags: string[];
  license?: string;
  repository_url?: string;
  author_username?: string;
}

interface OrganizationDetails {
  organization: Organization;
  packages: OrganizationPackage[];
  members: OrganizationMember[];
  package_count: number;
  member_count: number;
}

export async function organizationRoutes(server: FastifyInstance) {
  // Get organization details with packages and members
  server.get('/:orgName', {
    preHandler: [optionalAuth], // Allow both authenticated and unauthenticated requests
    schema: {
      tags: ['organizations'],
      description: 'Get organization details including packages and members',
      params: {
        type: 'object',
        properties: {
          orgName: { type: 'string' },
        },
        required: ['orgName'],
      },
    },
  }, async (request, reply) => {
    const { orgName } = request.params as { orgName: string };

    server.log.info({
      action: 'get_organization',
      orgName,
      userId: request.user?.user_id,
    }, '🏢 Fetching organization details');

    // Note: We can't cache this response because it varies based on user authentication
    // Each user (member vs non-member) will see different packages

    try {
      // Get organization info
      const org = await queryOne<Organization>(
        server,
        `SELECT id, name, description, avatar_url, website_url, is_verified, created_at, updated_at
         FROM organizations
         WHERE name = $1`,
        [orgName]
      );

      if (!org) {
        return reply.status(404).send({
          error: 'Not found',
          message: `Organization '${orgName}' not found`,
        });
      }

      // Check if logged-in user is a member of this organization
      const loggedInUserId = request.user?.user_id;
      let isMember = false;

      server.log.info({
        hasUser: !!request.user,
        userId: loggedInUserId,
        orgId: org.id,
        orgName: org.name,
      }, '🔐 Checking organization membership');

      if (loggedInUserId) {
        const memberCheck = await queryOne<{ role: string }>(
          server,
          `SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2`,
          [org.id, loggedInUserId]
        );
        isMember = !!memberCheck;

        server.log.info({
          userId: loggedInUserId,
          orgId: org.id,
          isMember,
          role: memberCheck?.role,
        }, '👤 Membership check result');
      } else {
        server.log.info('❌ No authenticated user - showing public packages only');
      }

      // Build visibility filter based on whether user is a member
      const visibilityFilter = isMember
        ? `p.visibility IN ('public', 'private')`  // Show all packages if member
        : `p.visibility = 'public'`;                // Show only public packages otherwise

      // Get organization packages
      const packagesResult = await query<OrganizationPackage>(
        server,
        `SELECT
           p.id,
           p.name,
           p.description,
           p.format,
           p.subtype,
           p.visibility,
           p.total_downloads,
           p.weekly_downloads,
           p.featured as is_featured,
           p.verified as is_verified,
           p.last_published_at,
           p.created_at,
           p.tags,
           p.license,
           p.repository_url,
           u.username as author_username
         FROM packages p
         LEFT JOIN users u ON p.author_id = u.id
         WHERE p.org_id = $1 AND ${visibilityFilter}
         ORDER BY p.total_downloads DESC`,
        [org.id]
      );

      // Get organization members (both public and private)
      const membersResult = await query<OrganizationMember & { is_public: boolean }>(
        server,
        `SELECT
           CASE WHEN om.is_public THEN u.id ELSE NULL END as user_id,
           CASE WHEN om.is_public THEN u.username ELSE 'Private Member' END as username,
           CASE WHEN om.is_public THEN u.email ELSE '' END as email,
           CASE WHEN om.is_public THEN u.avatar_url ELSE NULL END as avatar_url,
           om.role,
           om.joined_at,
           COALESCE(om.is_public, TRUE) as is_public
         FROM organization_members om
         LEFT JOIN users u ON om.user_id = u.id
         WHERE om.org_id = $1
         ORDER BY
           CASE om.role
             WHEN 'owner' THEN 1
             WHEN 'admin' THEN 2
             WHEN 'maintainer' THEN 3
             WHEN 'member' THEN 4
           END,
           om.joined_at ASC`,
        [org.id]
      );

      const result: OrganizationDetails = {
        organization: org,
        packages: packagesResult.rows,
        members: membersResult.rows,
        package_count: packagesResult.rows.length,
        member_count: membersResult.rows.length,
      };

      // Don't cache because response varies by user authentication
      // Members see private packages, non-members don't

      server.log.info({
        orgName,
        packageCount: packagesResult.rows.length,
        memberCount: membersResult.rows.length,
        isMember,
        userId: loggedInUserId,
      }, '✅ Organization details fetched');

      return reply.send(result);
    } catch (error) {
      server.log.error({ error, orgName }, '❌ Failed to fetch organization');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to fetch organization details',
      });
    }
  });

  // List all organizations
  server.get('/', {
    schema: {
      tags: ['organizations'],
      description: 'List all organizations',
      querystring: {
        type: 'object',
        properties: {
          verified: { type: 'boolean' },
          limit: { type: 'number', default: 50, minimum: 1, maximum: 100 },
          offset: { type: 'number', default: 0, minimum: 0 },
        },
      },
    },
  }, async (request: FastifyRequest<{ Querystring: { verified?: boolean; limit?: number; offset?: number } }>, reply: FastifyReply) => {
    const { verified, limit = 50, offset = 0 } = request.query;

    server.log.info({
      action: 'list_organizations',
      filters: { verified },
      pagination: { limit, offset },
    }, '🏢 Listing organizations');

    try {
      let sql = `
        SELECT o.id, o.name, o.description, o.avatar_url, o.website_url, o.is_verified, o.created_at,
               COUNT(DISTINCT p.id) as package_count,
               COUNT(DISTINCT om.user_id) as member_count,
               COALESCE(SUM(p.total_downloads), 0) as total_downloads
        FROM organizations o
        LEFT JOIN packages p ON o.id = p.org_id
        LEFT JOIN organization_members om ON o.id = om.org_id
      `;

      const params: any[] = [];
      const conditions: string[] = [];

      if (verified !== undefined) {
        conditions.push(`o.is_verified = $${params.length + 1}`);
        params.push(verified);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }

      sql += `
        GROUP BY o.id
        ORDER BY package_count DESC, o.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      params.push(limit, offset);

      const organizationsResult = await query(server, sql, params);

      server.log.info({
        count: organizationsResult.rows.length,
        limit,
        offset,
      }, '✅ Organizations listed');

      return reply.send({
        organizations: organizationsResult.rows,
        limit,
        offset,
      });
    } catch (error) {
      server.log.error({ error }, '❌ Failed to list organizations');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to list organizations',
      });
    }
  });

  // Create a new organization (requires authentication)
  server.post<{ Body: { name: string; description?: string; website_url?: string } }>('/', {
    onRequest: [server.authenticate],
    schema: {
      tags: ['organizations'],
      description: 'Create a new organization',
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 50 },
          description: { type: 'string', maxLength: 500 },
          website_url: { type: 'string', format: 'uri' },
        },
      },
    },
  }, async (request, reply) => {
    const { name, description, website_url } = request.body;

    // Check if user is authenticated
    const userId = (request as any).user?.user_id;
    if (!userId) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'You must be logged in to create an organization',
      });
    }

    server.log.info({
      action: 'create_organization',
      name,
      userId,
    }, '🏢 Creating organization');

    try {
      // Check if organization name already exists
      const existing = await queryOne(
        server,
        'SELECT id FROM organizations WHERE name = $1',
        [name]
      );

      if (existing) {
        return reply.status(409).send({
          error: 'Conflict',
          message: `Organization '${name}' already exists`,
        });
      }

      // Create the organization
      const org = await queryOne<Organization>(
        server,
        `INSERT INTO organizations (name, description, website_url, is_verified, created_at, updated_at)
         VALUES ($1, $2, $3, false, NOW(), NOW())
         RETURNING id, name, description, avatar_url, website_url, is_verified, created_at, updated_at`,
        [name, description || null, website_url || null]
      );

      if (!org) {
        throw new Error('Failed to create organization');
      }

      // Add the creator as owner
      await query(
        server,
        `INSERT INTO organization_members (org_id, user_id, role, joined_at)
         VALUES ($1, $2, 'owner', NOW())`,
        [org.id, userId]
      );

      server.log.info({
        orgId: org.id,
        orgName: name,
        userId,
      }, '✅ Organization created');

      return reply.status(201).send({
        organization: org,
        message: 'Organization created successfully',
      });
    } catch (error) {
      server.log.error({ error, name }, '❌ Failed to create organization');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to create organization',
      });
    }
  });

  // Update organization (requires authentication and ownership/admin permissions)
  server.put<{ Params: { orgName: string }; Body: { description?: string; website_url?: string; avatar_url?: string } }>('/:orgName', {
    onRequest: [server.authenticate],
    schema: {
      tags: ['organizations'],
      description: 'Update an organization',
      params: {
        type: 'object',
        properties: {
          orgName: { type: 'string' },
        },
        required: ['orgName'],
      },
      body: {
        type: 'object',
        properties: {
          description: { type: 'string', maxLength: 500 },
          website_url: { type: 'string', format: 'uri' },
          avatar_url: { type: 'string', format: 'uri' },
        },
      },
    },
  }, async (request, reply) => {
    const { orgName } = request.params;
    const { description, website_url, avatar_url } = request.body;

    // Check if user is authenticated
    const userId = (request as any).user?.user_id;
    if (!userId) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'You must be logged in to update an organization',
      });
    }

    server.log.info({
      action: 'update_organization',
      orgName,
      userId,
    }, '🏢 Updating organization');

    try {
      // Get organization
      const org = await queryOne<Organization>(
        server,
        'SELECT id FROM organizations WHERE name = $1',
        [orgName]
      );

      if (!org) {
        return reply.status(404).send({
          error: 'Not found',
          message: `Organization '${orgName}' not found`,
        });
      }

      // Check if user is owner or admin of the organization
      const membership = await queryOne<{ role: string }>(
        server,
        `SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2`,
        [org.id, userId]
      );

      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to update this organization',
        });
      }

      // Check if organization is verified for avatar_url updates
      if (avatar_url !== undefined) {
        const orgDetails = await queryOne<{ is_verified: boolean }>(
          server,
          'SELECT is_verified FROM organizations WHERE id = $1',
          [org.id]
        );

        if (!orgDetails?.is_verified) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Only verified organizations can set a custom avatar URL. Please upgrade to a verified plan.',
          });
        }
      }

      // Build update query dynamically based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (description !== undefined) {
        updates.push(`description = $${paramCount}`);
        values.push(description || null);
        paramCount++;
      }

      if (website_url !== undefined) {
        updates.push(`website_url = $${paramCount}`);
        values.push(website_url || null);
        paramCount++;
      }

      if (avatar_url !== undefined) {
        updates.push(`avatar_url = $${paramCount}`);
        values.push(avatar_url || null);
        paramCount++;
      }

      if (updates.length === 0) {
        return reply.status(400).send({
          error: 'Bad request',
          message: 'No fields to update',
        });
      }

      updates.push(`updated_at = NOW()`);
      values.push(org.id);

      const updatedOrg = await queryOne<Organization>(
        server,
        `UPDATE organizations
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING id, name, description, avatar_url, website_url, is_verified, created_at, updated_at`,
        values
      );

      // Invalidate cache
      const cacheKey = `org:${orgName}`;
      await server.redis?.del(cacheKey);

      server.log.info({
        orgId: org.id,
        orgName,
        userId,
      }, '✅ Organization updated');

      return reply.send({
        organization: updatedOrg,
        message: 'Organization updated successfully',
      });
    } catch (error) {
      server.log.error({ error, orgName }, '❌ Failed to update organization');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to update organization',
      });
    }
  });
}
