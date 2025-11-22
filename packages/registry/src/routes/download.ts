/**
 * Package Download Routes with Format Conversion
 * Supports downloading packages in any format via ?format= parameter
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queryOne } from '../db/index.js';
import { PackageVersion } from '@pr-pm/types';
import { getCanonicalPackage } from '../storage/canonical.js';
import { convertToFormat } from '../services/conversion.js';
import { lazyMigratePackage, isLazyMigrationEnabled } from '../services/migration.js';
import type { Format } from '@pr-pm/types';

export async function downloadRoutes(server: FastifyInstance) {
  /**
   * Download package with optional format conversion
   * GET /api/download/:packageName
   * Query params:
   *   - version: Package version (required)
   *   - format: Target format for conversion (optional)
   */
  server.get('/:packageName', {
    schema: {
      tags: ['download'],
      description: 'Download package with optional format conversion',
      params: {
        type: 'object',
        required: ['packageName'],
        properties: {
          packageName: {
            type: 'string',
            description: 'Package name (e.g., author/package-name)',
          },
        },
      },
      querystring: {
        type: 'object',
        required: ['version'],
        properties: {
          version: {
            type: 'string',
            description: 'Package version',
          },
          format: {
            type: 'string',
            enum: ['cursor', 'claude', 'continue', 'windsurf', 'copilot', 'kiro', 'ruler', 'agents.md', 'gemini', 'droid', 'opencode', 'generic'],
            description: 'Target format for conversion (optional)',
          },
        },
      },
      response: {
        200: {
          description: 'Package content in requested format',
          type: 'string',
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { packageName: rawPackageName } = request.params as { packageName: string };
    const { version, format: targetFormat } = request.query as {
      version: string;
      format?: Format;
    };

    // Decode URL-encoded package name
    const packageName = decodeURIComponent(rawPackageName);

    server.log.info(
      { packageName, version, targetFormat },
      'Download request with format conversion'
    );

    try {
      // Get package version metadata
      const pkgVersion = await queryOne<PackageVersion & { package_id: string; package_name: string; format: Format }>(
        server,
        `SELECT pv.*, p.id as package_id, p.name as package_name, p.format
         FROM package_versions pv
         JOIN packages p ON p.id = pv.package_id
         WHERE p.name = $1 AND pv.version = $2 AND p.visibility = 'public'`,
        [packageName, version]
      );

      if (!pkgVersion) {
        return reply.status(404).send({
          error: 'Package version not found',
          message: `Package ${packageName}@${version} not found or not public`,
        });
      }

      // Get canonical package (tries canonical.json, falls back to tarball)
      const canonical = await getCanonicalPackage(
        server,
        pkgVersion.package_id,
        packageName,
        version
      );

      // Lazy migrate if enabled and not already migrated
      if (isLazyMigrationEnabled()) {
        // Fire and forget - don't block the response
        lazyMigratePackage(
          server,
          pkgVersion.package_id,
          packageName,
          version
        ).catch((error) => {
          server.log.warn(
            { error, packageName, version },
            'Lazy migration failed (non-blocking)'
          );
        });
      }

      // Determine target format (use requested format or original format)
      const outputFormat = targetFormat || canonical.format;

      // Convert to target format
      const result = await convertToFormat(
        server,
        canonical,
        outputFormat
      );

      // Log warnings if any
      if (result.warnings && result.warnings.length > 0) {
        server.log.warn(
          { packageName, version, warnings: result.warnings },
          'Format conversion produced warnings'
        );
      }

      // Set appropriate headers
      reply.header('Content-Type', result.contentType);
      reply.header('Content-Disposition', `attachment; filename="${result.filename}"`);

      // Add conversion metadata headers
      reply.header('X-Source-Format', canonical.format);
      reply.header('X-Target-Format', outputFormat);
      if (result.lossyConversion) {
        reply.header('X-Lossy-Conversion', 'true');
      }
      if (result.warnings) {
        reply.header('X-Conversion-Warnings', JSON.stringify(result.warnings));
      }

      server.log.info(
        {
          packageName,
          version,
          sourceFormat: canonical.format,
          targetFormat: outputFormat,
          size: result.content.length,
          lossy: result.lossyConversion,
        },
        'Successfully converted and served package'
      );

      return reply.send(result.content);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      server.log.error(
        {
          error: errorMessage,
          errorStack: error instanceof Error ? error.stack : undefined,
          packageName,
          version,
          targetFormat,
        },
        'Failed to download package with format conversion'
      );

      return reply.status(500).send({
        error: 'Download failed',
        message: errorMessage,
      });
    }
  });

  /**
   * Get conversion compatibility info
   * GET /api/download/compatibility
   */
  server.get('/compatibility', {
    schema: {
      tags: ['download'],
      description: 'Check format conversion compatibility',
      querystring: {
        type: 'object',
        required: ['from', 'to'],
        properties: {
          from: {
            type: 'string',
            enum: ['cursor', 'claude', 'continue', 'windsurf', 'copilot', 'kiro', 'ruler', 'agents.md', 'gemini', 'droid', 'opencode', 'generic'],
          },
          to: {
            type: 'string',
            enum: ['cursor', 'claude', 'continue', 'windsurf', 'copilot', 'kiro', 'ruler', 'agents.md', 'gemini', 'droid', 'opencode', 'generic'],
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            compatible: { type: 'boolean' },
            qualityScore: { type: 'number' },
            lossy: { type: 'boolean' },
            warnings: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { from, to } = request.query as { from: Format; to: Format };

    const { getConversionQualityScore, isLossyConversion } = await import('../services/conversion.js');

    const qualityScore = getConversionQualityScore(from, to);
    const lossy = await isLossyConversion(from, to);

    const warnings: string[] = [];
    if (lossy) {
      warnings.push(`Conversion from ${from} to ${to} may lose some features`);
    }
    if (qualityScore < 80) {
      warnings.push(`Conversion quality score is ${qualityScore}% - some features may not translate perfectly`);
    }

    return {
      compatible: true,
      qualityScore,
      lossy,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  });
}
