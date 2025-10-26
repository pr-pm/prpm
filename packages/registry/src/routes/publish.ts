/**
 * Package publishing routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { query, queryOne } from '../db/index.js';
import { cacheDelete, cacheDeletePattern } from '../cache/redis.js';
import { uploadPackage } from '../storage/s3.js';
import {
  validateManifest,
  validatePackageName,
  validatePackageSize,
  validateFileExtensions,
  PackageManifest,
} from '../validation/package.js';
import { toError } from '../types/errors.js';
import { config } from '../config.js';
import { Package, PackageVersion } from '../types.js';
import * as semver from 'semver';
import { updatePackageQualityScore } from '../scoring/quality-scorer.js';

export async function publishRoutes(server: FastifyInstance) {
  // Publish package
  server.post('/', {
    onRequest: [server.authenticate],
    schema: {
      tags: ['packages'],
      description: 'Publish a new package or version',
      consumes: ['multipart/form-data'],
      // Skip body validation for multipart - will be parsed manually
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.user_id;

    try {
      // Get manifest and tarball
      let manifest: PackageManifest;
      let tarball: Buffer | undefined;
      let orgId: string | undefined;

      // Parse form fields
      const fields: Record<string, any> = {};
      try {
        for await (const part of request.parts()) {
          console.log('Received part:', part.type, part.fieldname);
          if (part.type === 'field') {
            fields[part.fieldname] = part.value;
          } else if (part.type === 'file') {
            if (part.fieldname === 'tarball') {
              const chunks: Buffer[] = [];
              for await (const chunk of part.file) {
                chunks.push(chunk);
              }
              tarball = Buffer.concat(chunks);
              console.log('Tarball size:', tarball.length);
            }
          }
        }
      } catch (parseError) {
        console.error('Error parsing multipart data:', parseError);
        throw parseError;
      }

      // Extract org_id if provided
      if (fields.org_id) {
        orgId = fields.org_id;
      }

      // Validate manifest field
      if (!fields.manifest) {
        return reply.status(400).send({ error: 'Missing manifest field' });
      }

      try {
        manifest = JSON.parse(fields.manifest);
      } catch {
        return reply.status(400).send({ error: 'Invalid manifest JSON' });
      }

      if (!tarball) {
        return reply.status(400).send({ error: 'Missing tarball file' });
      }

      // Validate manifest
      const manifestValidation = validateManifest(manifest);
      if (!manifestValidation.valid) {
        // Log validation errors for debugging
        console.log('Manifest validation failed:', manifestValidation.errors);
        return reply.status(400).send({
          error: 'Invalid manifest',
          details: manifestValidation.errors,
        });
      }

      // Validate package name
      const nameValidation = validatePackageName(manifest.name);
      if (!nameValidation.valid) {
        return reply.status(400).send({ error: nameValidation.error });
      }

      // Validate package size
      const sizeValidation = validatePackageSize(tarball.length, config.packages.maxSize);
      if (!sizeValidation.valid) {
        return reply.status(400).send({ error: sizeValidation.error });
      }

      // Validate file extensions
      const extValidation = validateFileExtensions(manifest.files, config.packages.allowedExtensions);
      if (!extValidation.valid) {
        return reply.status(400).send({ error: extValidation.error });
      }

      // If org_id is specified, verify user has permission to publish to that org
      if (orgId) {
        const orgMembership = await queryOne<{ role: string }>(
          server,
          `SELECT role FROM organization_members
           WHERE org_id = $1 AND user_id = $2`,
          [orgId, userId]
        );

        if (!orgMembership) {
          return reply.status(403).send({
            error: 'You are not a member of this organization',
          });
        }

        // Check if user has publishing rights (owner, admin, or maintainer can publish)
        if (!['owner', 'admin', 'maintainer'].includes(orgMembership.role)) {
          return reply.status(403).send({
            error: `You do not have permission to publish packages for this organization. Required role: owner, admin, or maintainer. Your role: ${orgMembership.role}`,
          });
        }
      }

      // Check if package exists
      const existingPackage = await queryOne<Package>(
        server,
        'SELECT * FROM packages WHERE id = $1',
        [manifest.name]
      );

      // If package exists, check ownership
      if (existingPackage) {
        // Package owned by user
        if (existingPackage.author_id && !existingPackage.org_id) {
          if (existingPackage.author_id !== userId && !request.user.is_admin) {
            return reply.status(403).send({
              error: 'You do not have permission to publish to this package',
            });
          }
        }
        // Package owned by org
        else if (existingPackage.org_id) {
          const orgMembership = await queryOne<{ role: string }>(
            server,
            `SELECT role FROM organization_members
             WHERE org_id = $1 AND user_id = $2`,
            [existingPackage.org_id, userId]
          );

          if (!orgMembership || !['owner', 'admin', 'maintainer'].includes(orgMembership.role)) {
            return reply.status(403).send({
              error: 'You do not have permission to publish to this organization package',
            });
          }
        }
        // Package not owned - shouldn't happen but check anyway
        else {
          if (!request.user.is_admin) {
            return reply.status(403).send({
              error: 'You do not have permission to publish to this package',
            });
          }
        }

        // Check if version already exists
        const existingVersion = await queryOne(
          server,
          'SELECT * FROM package_versions WHERE package_id = $1 AND version = $2',
          [manifest.name, manifest.version]
        );

        if (existingVersion) {
          return reply.status(409).send({
            error: `Version ${manifest.version} already exists. Bump version to publish.`,
          });
        }

        // Validate version is higher than existing versions
        const versions = await query<PackageVersion>(
          server,
          'SELECT version FROM package_versions WHERE package_id = $1 ORDER BY published_at DESC',
          [manifest.name]
        );

        const latestVersion = versions.rows[0]?.version;
        if (latestVersion && semver.lte(manifest.version, latestVersion)) {
          return reply.status(400).send({
            error: `Version ${manifest.version} must be higher than latest version ${latestVersion}`,
          });
        }
      }

      // Upload tarball to S3
      const upload = await uploadPackage(server, manifest.name, manifest.version, tarball);

      // Create package if it doesn't exist
      if (!existingPackage) {
        // Get username from user if author not provided
        let authorName: string;
        if (manifest.author) {
          authorName = typeof manifest.author === 'string' ? manifest.author : manifest.author.name;
        } else {
          // Fetch username from database
          const userRecord = await queryOne<{ username: string }>(
            server,
            'SELECT username FROM users WHERE id = $1',
            [userId]
          );
          authorName = userRecord?.username || 'Unknown';
        }

        await query(
          server,
          `INSERT INTO packages (
            id, description, author_id, org_id, type, license,
            repository_url, homepage_url, documentation_url,
            tags, keywords, category, last_published_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
          [
            manifest.name,
            manifest.description,
            orgId ? null : userId,  // If publishing to org, don't set author_id
            orgId || null,          // Set org_id if publishing to org
            manifest.type,
            manifest.license || null,
            manifest.repository || null,
            manifest.homepage || null,
            manifest.documentation || null,
            manifest.tags || [],
            manifest.keywords || [],
            manifest.category || null,
          ]
        );

        server.log.info(`Created new package: ${manifest.name}${orgId ? ` for organization ${orgId}` : ''}`);
      } else {
        // Update package last_published_at
        await query(
          server,
          'UPDATE packages SET last_published_at = NOW(), updated_at = NOW() WHERE id = $1',
          [manifest.name]
        );
      }

      // Create package version
      await query(
        server,
        `INSERT INTO package_versions (
          package_id, version, description, changelog, tarball_url,
          content_hash, file_size, dependencies, peer_dependencies,
          engines, metadata, is_prerelease, published_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          manifest.name,
          manifest.version,
          manifest.description,
          fields.changelog || null,
          upload.url,
          upload.hash,
          upload.size,
          JSON.stringify(manifest.dependencies || {}),
          JSON.stringify(manifest.peerDependencies || {}),
          JSON.stringify(manifest.engines || {}),
          JSON.stringify({ files: manifest.files, main: manifest.main }),
          semver.prerelease(manifest.version) !== null,
          userId,
        ]
      );

      // Update package version count
      await query(
        server,
        'UPDATE packages SET version_count = (SELECT COUNT(*) FROM package_versions WHERE package_id = $1) WHERE id = $1',
        [manifest.name]
      );

      // Invalidate caches
      await cacheDelete(server, `package:${manifest.name}`);
      await cacheDeletePattern(server, 'packages:list:*');
      await cacheDeletePattern(server, 'search:*');

      // Update quality score
      try {
        const qualityScore = await updatePackageQualityScore(server, manifest.name);
        server.log.info({ packageId: manifest.name, qualityScore }, 'Updated quality score after publish');
      } catch (err) {
        const error = toError(err);
        server.log.warn({ error: error.message, packageId: manifest.name }, 'Failed to update quality score');
      }

      // Index in search engine if available
      // TODO: Add search indexing

      server.log.info(`Published ${manifest.name}@${manifest.version} by user ${userId}`);

      return reply.status(201).send({
        success: true,
        package_id: manifest.name,
        version: manifest.version,
        message: `Successfully published ${manifest.name}@${manifest.version}`,
        tarball_url: upload.url,
      });
    } catch (error: unknown) {
      const err = toError(error);
      server.log.error({ error: err.message, stack: err.stack }, 'Publish error');
      console.error('Publish error:', err);
      console.error('Error stack:', err.stack);
      return reply.status(500).send({
        error: 'Failed to publish package',
        message: err.message,
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
      });
    }
  });
}
