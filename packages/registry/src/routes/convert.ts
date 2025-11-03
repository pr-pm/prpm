/**
 * Format Conversion Routes
 * Handles server-side conversion between editor formats
 */

import type { FastifyInstance } from 'fastify';
import { toCursor } from '../converters/to-cursor.js';
import { toClaude, toClaudeMd } from '../converters/to-claude.js';
import { toContinue } from '../converters/to-continue.js';
import { toCopilot } from '../converters/to-copilot.js';
import { toKiro } from '../converters/to-kiro.js';
import { toWindsurf } from '../converters/to-windsurf.js';
import { toAgentsMd } from '../converters/to-agents-md.js';
import type { CanonicalPackage } from '../types/canonical.js';
import { packageRepository, packageVersionRepository } from '../db/repositories/index.js';

export async function convertRoutes(server: FastifyInstance) {
  /**
   * GET /packages/:id/download?format=cursor
   * Download package in specific format
   */
  server.get(
    '/:id/download',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: ['cursor', 'claude', 'continue', 'windsurf', 'copilot', 'kiro', 'agents.md', 'canonical'],
              default: 'canonical',
            },
            version: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { format = 'canonical', version = 'latest' } = request.query as {
        format?: string;
        version?: string;
      };

      try {
        // Get package from database
        const pkg = await packageRepository.findById(id);
        if (!pkg) {
          return reply.code(404).send({
            error: 'Package not found',
            id,
            version,
          });
        }

        // Get version (latest or specific)
        const pkgVersion = version === 'latest'
          ? await packageVersionRepository.findLatestVersion(pkg.id)
          : await packageVersionRepository.findByPackageAndVersion(pkg.id, version);

        if (!pkgVersion) {
          return reply.code(404).send({
            error: 'Version not found',
            id,
            version,
          });
        }

        // Merge package and version data for compatibility with existing code
        const pkgData: any = {
          ...pkg,
          version: pkgVersion.version,
          canonical_format: pkgVersion.metadata, // metadata contains canonical format
          tarball_url: pkgVersion.tarballUrl,
          author: pkg.authorId, // Map authorId to author for compatibility
        };

        // Check cache first
        const cacheKey = `pkg:${id}:${pkgData.version}:${format}`;
        const cached = await server.redis.get(cacheKey);

        let content: string;

        if (cached) {
          content = cached;
        } else {
          // Convert to requested format
          const canonicalPkg: CanonicalPackage = pkgData.canonical_format || pkgData;
          const converted = await convertPackage(canonicalPkg, format);

          content = converted.content;

          // Cache for 1 hour
          await server.redis.setex(cacheKey, 3600, content);

          // Log conversion warnings if any
          if (converted.warnings && converted.warnings.length > 0) {
            server.log.warn({
              package: id,
              format,
              warnings: converted.warnings,
            });
          }
        }

        // Return as file download
        const canonicalPkg: CanonicalPackage = pkgData.canonical_format || pkgData;
        const filename = getFilenameForFormat(format, id, canonicalPkg);

        return reply
          .header('Content-Type', 'text/markdown; charset=utf-8')
          .header(
            'Content-Disposition',
            `attachment; filename="${filename}"`
          )
          .header('X-Package-Id', id)
          .header('X-Package-Version', pkgData.version)
          .header('X-Format', format)
          .send(content);
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({
          error: 'Failed to convert package',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  /**
   * GET /packages/:id/tarball?format=cursor
   * Download package tarball in specific format
   */
  server.get(
    '/:id/tarball',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: ['cursor', 'claude', 'continue', 'windsurf', 'copilot', 'kiro', 'agents.md', 'canonical'],
              default: 'canonical',
            },
            version: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { format = 'canonical', version = 'latest' } = request.query as {
        format?: string;
        version?: string;
      };

      try {
        // Get package
        const pkg = await packageRepository.findById(id);
        if (!pkg) {
          return reply.code(404).send({
            error: 'Package not found',
          });
        }

        // Get version (latest or specific)
        const pkgVersion = version === 'latest'
          ? await packageVersionRepository.findLatestVersion(pkg.id)
          : await packageVersionRepository.findByPackageAndVersion(pkg.id, version);

        if (!pkgVersion) {
          return reply.code(404).send({
            error: 'Version not found',
          });
        }

        // Merge package and version data
        const pkgData: any = {
          ...pkg,
          version: pkgVersion.version,
          canonical_format: pkgVersion.metadata,
          tarball_url: pkgVersion.tarballUrl,
          tarball_hash: pkgVersion.contentHash,
          size: pkgVersion.fileSize,
          author: pkg.authorId, // Map authorId to author for compatibility
        };

        // For canonical format, return original tarball
        if (format === 'canonical' && pkgData.tarball_url) {
          // Redirect to S3
          return reply.redirect(302, pkgData.tarball_url);
        }

        // Generate on-the-fly tarball with converted content
        const tar = require('tar-stream');
        const zlib = require('zlib');
        const pack = tar.pack();

        // Get converted content
        const canonicalPkg: CanonicalPackage = pkgData.canonical_format || pkgData;
        const converted = await convertPackage(canonicalPkg, format);

        // Create package.json
        const packageJson = {
          name: pkgData.id,
          version: pkgData.version,
          description: pkgData.description,
          format: pkgData.format,
          subtype: pkgData.subtype,
          targetFormat: format,
          author: pkgData.author,
          license: pkgData.license || 'MIT',
        };

        // Add package.json to tarball
        pack.entry(
          { name: 'package.json' },
          JSON.stringify(packageJson, null, 2)
        );

        // Add converted content
        const filename = getFilenameForFormat(format, pkgData.id, pkgData);
        pack.entry({ name: filename }, converted.content);

        // Finalize
        pack.finalize();

        // Compress
        const gzip = zlib.createGzip();
        pack.pipe(gzip);

        return reply
          .header('Content-Type', 'application/gzip')
          .header(
            'Content-Disposition',
            `attachment; filename="${id}-${pkgData.version}.tar.gz"`
          )
          .header('X-Package-Id', id)
          .header('X-Package-Version', pkgData.version)
          .header('X-Format', format)
          .send(gzip);
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({
          error: 'Failed to generate tarball',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  /**
   * POST /convert
   * Convert content between formats (without package ID)
   */
  server.post(
    '/convert',
    {
      schema: {
        body: {
          type: 'object',
          required: ['content', 'from', 'to'],
          properties: {
            content: { type: 'string' },
            from: {
              type: 'string',
              enum: ['cursor', 'claude', 'continue', 'windsurf', 'copilot', 'kiro', 'agents.md', 'auto'],
            },
            to: {
              type: 'string',
              enum: ['cursor', 'claude', 'continue', 'windsurf', 'copilot', 'kiro', 'agents.md', 'canonical'],
            },
            metadata: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                author: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { content, from, to, metadata = {} } = request.body as { content: string; from: string; to: string; metadata?: Record<string, unknown> };

      try {
        // TODO: Implement parsers for each format
        // For now, return a placeholder

        return reply.send({
          success: true,
          from,
          to,
          content: `Converted from ${from} to ${to}`,
          warnings: ['Conversion not fully implemented yet'],
        });
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({
          error: 'Conversion failed',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );
}

/**
 * Convert package to requested format
 */
async function convertPackage(
  pkg: CanonicalPackage,
  format: string
): Promise<{ content: string; warnings?: string[] }> {
  switch (format) {
    case 'cursor':
      return toCursor(pkg);

    case 'claude':
      return toClaude(pkg);

    case 'claude-md':
      return toClaudeMd(pkg);

    case 'continue':
      return toContinue(pkg);

    case 'windsurf':
      return toWindsurf(pkg);

    case 'copilot': {
      // GitHub Copilot format
      const copilotConfig = pkg.metadata?.copilotConfig;
      return toCopilot(pkg, { copilotConfig });
    }

    case 'kiro': {
      // Kiro format
      const kiroConfig = pkg.metadata?.kiroConfig;
      if (!kiroConfig?.inclusion) {
        return {
          content: '',
          warnings: ['Kiro format requires inclusion mode in package metadata'],
        };
      }
      // Type assertion: we've verified inclusion exists above
      return toKiro(pkg, { kiroConfig: kiroConfig as { filename?: string; inclusion: 'always' | 'fileMatch' | 'manual'; fileMatchPattern?: string; domain?: string } });
    }

    case 'agents.md':
      return toAgentsMd(pkg);

    case 'canonical':
    default:
      return {
        content: JSON.stringify(pkg, null, 2),
      };
  }
}

/**
 * Get appropriate filename for format
 */
function getFilenameForFormat(format: string, packageId: string, pkg?: CanonicalPackage): string {
  switch (format) {
    case 'cursor':
      return `.cursorrules`;
    case 'claude':
      return `${packageId}.md`;
    case 'claude-md':
      return 'CLAUDE.md';
    case 'continue':
      return `.continuerc.json`;
    case 'windsurf':
      return `.windsurfrules`;
    case 'copilot': {
      // GitHub Copilot: path-specific instructions need NAME.instructions.md
      const instructionName = pkg?.metadata?.copilotConfig?.instructionName || packageId;
      return pkg?.metadata?.copilotConfig?.applyTo
        ? `${instructionName}.instructions.md`
        : 'copilot-instructions.md';
    }
    case 'kiro': {
      // Kiro: files in .kiro/steering/ with descriptive names
      const filename = pkg?.metadata?.kiroConfig?.filename || packageId;
      return `${filename}.md`;
    }
    case 'agents.md':
      return 'AGENTS.md';
    default:
      return `${packageId}.json`;
  }
}
