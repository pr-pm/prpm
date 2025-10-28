/**
 * Organization routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { query, queryOne } from '../db/index.js';
import { cacheGet, cacheSet } from '../cache/redis.js';

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
  downloads: number;
  is_featured: boolean;
  is_verified: boolean;
  last_published_at: Date;
  created_at: Date;
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
  }, async (request: FastifyRequest<{ Params: { orgName: string } }>, reply: FastifyReply) => {
    const { orgName } = request.params;

    server.log.info({
      action: 'get_organization',
      orgName,
    }, '🏢 Fetching organization details');

    // Check cache first
    const cacheKey = `org:${orgName}`;
    const cached = await cacheGet<OrganizationDetails>(server, cacheKey);
    if (cached) {
      server.log.info({ orgName }, '💾 Returning cached organization data');
      return reply.send(cached);
    }

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

      // Get organization packages
      const packagesResult = await query<OrganizationPackage>(
        server,
        `SELECT id, name, description, format, subtype, total_downloads as downloads, featured as is_featured, verified as is_verified, last_published_at, created_at
         FROM packages
         WHERE org_id = $1
         ORDER BY total_downloads DESC`,
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

      // Cache for 5 minutes
      await cacheSet(server, cacheKey, result, 300);

      server.log.info({
        orgName,
        packageCount: packagesResult.rows.length,
        memberCount: membersResult.rows.length,
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
               COUNT(DISTINCT om.user_id) as member_count
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
}
