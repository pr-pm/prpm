/**
 * Schema serving routes
 * Serves JSON Schema files for package validation
 */

import { FastifyInstance } from 'fastify';
import { readFileSync, accessSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the schemas directory path
const currentDirname = (() => {
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  try {
    const importMeta = (0, eval)('import.meta');
    return dirname(fileURLToPath(importMeta.url));
  } catch (e) {
    return join(process.cwd(), 'packages', 'registry', 'dist', 'routes');
  }
})();

// Try multiple possible schema directory locations
// This handles different execution contexts (dev, prod, tests)
const schemaDirCandidates = [
  join(currentDirname, '..', '..', '..', 'converters', 'schemas'), // from dist/routes/ (production)
  join(currentDirname, '..', '..', 'converters', 'schemas'), // from dist/ (if dist is flatter)
  join(process.cwd(), '..', 'converters', 'schemas'), // when cwd is packages/registry (dev with tsx)
  join(process.cwd(), 'packages', 'converters', 'schemas'), // when cwd is project root
];

// Default to first candidate, then try to find one that actually exists
let schemasDir: string = schemaDirCandidates[0];
for (const candidate of schemaDirCandidates) {
  try {
    accessSync(candidate);
    schemasDir = candidate;
    break;
  } catch {
    continue;
  }
}

// Log if we couldn't find an existing directory
if (schemasDir === schemaDirCandidates[0]) {
  try {
    accessSync(schemasDir);
  } catch {
    console.error('Could not find schemas directory. Tried:', schemaDirCandidates);
    console.error('Falling back to:', schemasDir);
  }
}

// Base format schemas (format-only, no subtype)
const BASE_SCHEMAS = [
  'cursor.schema.json',
  'claude.schema.json',
  'continue.schema.json',
  'windsurf.schema.json',
  'copilot.schema.json',
  'kiro-steering.schema.json',
  'droid.schema.json',
  'opencode.schema.json',
  'gemini.schema.json',
  'ruler.schema.json',
  'agents-md.schema.json',
  'canonical.schema.json',
];

// Subtype schemas (format + subtype)
const SUBTYPE_SCHEMAS: Record<string, { format: string; subtype: string }> = {
  // Claude subtypes
  'claude-agent.schema.json': { format: 'claude', subtype: 'agent' },
  'claude-skill.schema.json': { format: 'claude', subtype: 'skill' },
  'claude-slash-command.schema.json': { format: 'claude', subtype: 'slash-command' },
  'claude-hook.schema.json': { format: 'claude', subtype: 'hook' },

  // Cursor subtypes
  'cursor-command.schema.json': { format: 'cursor', subtype: 'command' },

  // Kiro subtypes
  'kiro-agent.schema.json': { format: 'kiro', subtype: 'agent' },
  'kiro-hook.schema.json': { format: 'kiro', subtype: 'hook' },

  // Factory Droid subtypes
  'droid-skill.schema.json': { format: 'droid', subtype: 'skill' },
  'droid-slash-command.schema.json': { format: 'droid', subtype: 'slash-command' },
  'droid-hook.schema.json': { format: 'droid', subtype: 'hook' },

  // OpenCode subtypes
  'opencode-slash-command.schema.json': { format: 'opencode', subtype: 'slash-command' },
};

// Combined list of all available schemas
const AVAILABLE_SCHEMAS = [...BASE_SCHEMAS, ...Object.keys(SUBTYPE_SCHEMAS)];

// Schema cache to avoid repeated file reads
const schemaCache = new Map<string, object>();

export async function schemaRoutes(server: FastifyInstance) {
  /**
   * GET /schemas
   * List all available schemas
   */
  server.get(
    '/',
    {
      schema: {
        description: 'List all available JSON Schema files',
        tags: ['schemas'],
        response: {
          200: {
            type: 'object',
            properties: {
              schemas: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    url: { type: 'string' },
                    format: { type: 'string' },
                    subtype: { type: ['string', 'null'] }
                  }
                }
              },
              total: { type: 'number' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const baseUrl = 'https://registry.prpm.dev';

      const schemas = AVAILABLE_SCHEMAS.map(filename => {
        let format: string;
        let subtype: string | null = null;
        let url: string;

        // Check if this is a subtype schema
        if (filename in SUBTYPE_SCHEMAS) {
          const subtypeInfo = SUBTYPE_SCHEMAS[filename];
          format = subtypeInfo.format;
          subtype = subtypeInfo.subtype;
          url = `${baseUrl}/api/v1/schemas/${format}/${subtype}.json`;
        } else {
          // Base schema - extract format from filename
          // Handle special cases: kiro-steering → kiro-steering, agents-md → agents-md
          format = filename.replace('.schema.json', '');
          url = `${baseUrl}/api/v1/schemas/${format}.json`;
        }

        return {
          name: filename,
          url,
          format,
          subtype
        };
      });

      return {
        schemas,
        total: schemas.length
      };
    }
  );

  /**
   * GET /schemas/:format.json
   * Retrieve a base format schema
   */
  server.get(
    '/:format.json',
    {
      schema: {
        description: 'Get a base format JSON Schema file',
        tags: ['schemas'],
        params: {
          type: 'object',
          required: ['format'],
          properties: {
            format: {
              type: 'string',
              description: 'Format name (e.g., cursor, claude, opencode)',
              pattern: '^[a-z0-9-]+$'
            }
          }
        }
      }
    },
    async (request, reply) => {
      const { format } = request.params as { format: string };
      const schemaFilename = `${format}.schema.json`;

      // Check if schema is in the allowed list
      if (!AVAILABLE_SCHEMAS.includes(schemaFilename)) {
        return reply.code(404).send({
          error: 'Schema not found',
          message: `Base format schema "${format}" does not exist`,
          available: AVAILABLE_SCHEMAS.filter(s => !s.includes('-'))
        });
      }

      // Check cache first
      if (schemaCache.has(schemaFilename)) {
        reply.header('Content-Type', 'application/schema+json');
        reply.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        return schemaCache.get(schemaFilename);
      }

      // Load schema from file
      try {
        const schemaPath = join(schemasDir, schemaFilename);
        const schemaContent = readFileSync(schemaPath, 'utf-8');
        const schema = JSON.parse(schemaContent);

        // Cache the parsed schema
        schemaCache.set(schemaFilename, schema);

        reply.header('Content-Type', 'application/schema+json');
        reply.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        return schema;
      } catch (error) {
        server.log.error({ error, format, schemaPath: join(schemasDir, schemaFilename) }, 'Failed to load schema');

        return reply.code(500).send({
          error: 'Internal server error',
          message: 'Failed to load schema file'
        });
      }
    }
  );

  /**
   * GET /schemas/:format/:subtype.json
   * Retrieve a subtype schema
   */
  server.get(
    '/:format/:subtype.json',
    {
      schema: {
        description: 'Get a subtype JSON Schema file',
        tags: ['schemas'],
        params: {
          type: 'object',
          required: ['format', 'subtype'],
          properties: {
            format: {
              type: 'string',
              description: 'Format name (e.g., claude, cursor, droid)',
              pattern: '^[a-z0-9-]+$'
            },
            subtype: {
              type: 'string',
              description: 'Subtype name (e.g., agent, skill, slash-command)',
              pattern: '^[a-z0-9-]+$'
            }
          }
        }
      }
    },
    async (request, reply) => {
      const { format, subtype } = request.params as { format: string; subtype: string };
      const schemaFilename = `${format}-${subtype}.schema.json`;

      // Check if schema is in the allowed list
      if (!AVAILABLE_SCHEMAS.includes(schemaFilename)) {
        return reply.code(404).send({
          error: 'Schema not found',
          message: `Subtype schema "${format}/${subtype}" does not exist`,
          available: AVAILABLE_SCHEMAS.filter(s => s.startsWith(format + '-'))
        });
      }

      // Check cache first
      if (schemaCache.has(schemaFilename)) {
        reply.header('Content-Type', 'application/schema+json');
        reply.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        return schemaCache.get(schemaFilename);
      }

      // Load schema from file
      try {
        const schemaPath = join(schemasDir, schemaFilename);
        const schemaContent = readFileSync(schemaPath, 'utf-8');
        const schema = JSON.parse(schemaContent);

        // Cache the parsed schema
        schemaCache.set(schemaFilename, schema);

        reply.header('Content-Type', 'application/schema+json');
        reply.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        return schema;
      } catch (error) {
        server.log.error({ error, format, subtype }, 'Failed to load schema');

        return reply.code(500).send({
          error: 'Internal server error',
          message: 'Failed to load schema file'
        });
      }
    }
  );
}
