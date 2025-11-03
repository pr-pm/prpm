/**
 * Public Author Profile Routes
 * View author profiles and their packages (no authentication required)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { optionalAuth } from '../middleware/auth.js';
import { userRepository } from '../db/repositories/user-repository.js';
import { packageRepository } from '../db/repositories/package-repository.js';

export default async function authorsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/authors/:username
   * Get public author profile with their packages
   */
  fastify.get<{
    Params: { username: string };
    Querystring: { sort?: string; limit?: number; offset?: number };
  }>(
    '/:username',
    {
      preHandler: [optionalAuth], // Allow both authenticated and unauthenticated requests
      schema: {
        tags: ['Authors'],
        description: 'Get public author profile',
        params: {
          type: 'object',
          properties: {
            username: { type: 'string' },
          },
          required: ['username'],
        },
        querystring: {
          type: 'object',
          properties: {
            sort: {
              type: 'string',
              enum: ['downloads', 'recent', 'name'],
              default: 'downloads',
            },
            limit: { type: 'number', default: 100, minimum: 1, maximum: 500 },
            offset: { type: 'number', default: 0, minimum: 0 },
          },
        },
      },
    },
    async (request, reply) => {
      const { username } = request.params;
      const { sort = 'downloads', limit = 100, offset = 0 } = request.query;

      try {
        // Get user info (case-insensitive lookup)
        const user = await userRepository.findByUsernameCaseInsensitive(username);

        if (!user) {
          return reply.code(404).send({ error: 'Author not found' });
        }

        // Check if logged-in user is viewing their own profile
        const loggedInUserId = request.user?.user_id;
        const isOwnProfile = loggedInUserId === user.id;

        // Get total stats for ALL packages (not limited)
        const stats = await packageRepository.getAuthorStats(user.id, isOwnProfile);

        // Get author's packages (limited for display)
        const pkgs = await packageRepository.getAuthorPackages(user.id, {
          includePrivate: isOwnProfile,
          sort: sort as 'downloads' | 'recent' | 'name',
          limit,
          offset,
        });

        return reply.send({
          author: {
            username: user.username,
            verified: user.verifiedAuthor || false,
            github_username: user.githubUsername,
            joined: user.createdAt,
            has_claimed_account: Boolean(user.githubUsername),
            avatar_url: user.avatarUrl,
          },
          stats: {
            total_packages: stats.totalPackages,
            total_downloads: stats.totalDownloads,
            average_rating: stats.avgRating ? parseFloat(stats.avgRating.toFixed(2)) : null,
            total_ratings: stats.totalRatings,
          },
          packages: pkgs.map((pkg) => ({
            id: pkg.id,
            name: pkg.name,
            description: pkg.description,
            format: pkg.format,
            license: pkg.license,
            license_url: pkg.licenseUrl,
            subtype: pkg.subtype,
            visibility: pkg.visibility,
            snippet: pkg.snippet,
            total_downloads: pkg.totalDownloads || 0,
            weekly_downloads: pkg.weeklyDownloads || 0,
            monthly_downloads: pkg.monthlyDownloads || 0,
            rating_average: pkg.ratingAverage ? parseFloat(pkg.ratingAverage.toString()) : null,
            rating_count: pkg.ratingCount || 0,
            created_at: pkg.createdAt,
            updated_at: pkg.updatedAt,
            tags: pkg.tags || [],
          })),
          pagination: {
            showing: pkgs.length,
            total: stats.totalPackages,
            limit: limit,
            offset: offset,
            hasMore: offset + limit < stats.totalPackages,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch author profile',
        });
      }
    }
  );

  /**
   * GET /api/v1/authors/:username/unclaimed
   * Get unclaimed packages for an author (no auth required)
   */
  fastify.get<{
    Params: { username: string };
  }>(
    '/:username/unclaimed',
    {
      schema: {
        tags: ['Authors'],
        description: 'Get unclaimed packages for an author',
        params: {
          type: 'object',
          properties: {
            username: { type: 'string' },
          },
          required: ['username'],
        },
      },
    },
    async (request, reply) => {
      const { username } = request.params;

      try {
        // Get unclaimed packages by author name (case-insensitive)
        const unclaimedPackages = await packageRepository.getUnclaimedByAuthorName(username);

        return reply.send({
          author_name: username,
          unclaimed_packages: unclaimedPackages.map((pkg) => ({
            id: pkg.id,
            name: pkg.name,
            description: pkg.description,
            format: pkg.format,
            subtype: pkg.subtype,
            total_downloads: pkg.totalDownloads || 0,
            created_at: pkg.createdAt,
            tags: pkg.tags || [],
          })),
          total: unclaimedPackages.length,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch unclaimed packages',
        });
      }
    }
  );

  fastify.log.info('✅ Author profile routes registered');
}
