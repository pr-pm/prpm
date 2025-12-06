/**
 * Schema serving routes
 * Serves JSON Schema files for package validation
 */

import { FastifyInstance } from 'fastify';
import {
  agentsMdSchema,
  canonicalSchema,
  claudeSchema,
  continueSchema,
  copilotSchema,
  cursorSchema,
  droidSchema,
  geminiMdSchema,
  geminiSchema,
  kiroSteeringSchema,
  opencodeSchema,
  rulerSchema,
  windsurfSchema,
  traeSchema,
  aiderSchema,
  zencoderSchema,
  replitSchema,
  claudeAgentSchema,
  claudeHookSchema,
  claudeSkillSchema,
  claudeSlashCommandSchema,
  cursorCommandSchema,
  cursorHooksSchema,
  droidHookSchema,
  droidSkillSchema,
  droidSlashCommandSchema,
  kiroAgentSchema,
  kiroHookSchema,
  opencodeSlashCommandSchema,
  formatRegistrySchema,
  getFormatRegistry,
} from '@pr-pm/converters';

type JsonSchema = Record<string, unknown>;

const BASE_SCHEMA_ENTRIES: [string, JsonSchema][] = [
  ['cursor.schema.json', cursorSchema],
  ['claude.schema.json', claudeSchema],
  ['continue.schema.json', continueSchema],
  ['windsurf.schema.json', windsurfSchema],
  ['copilot.schema.json', copilotSchema],
  ['kiro-steering.schema.json', kiroSteeringSchema],
  ['droid.schema.json', droidSchema],
  ['opencode.schema.json', opencodeSchema],
  ['gemini.schema.json', geminiSchema],
  ['ruler.schema.json', rulerSchema],
  ['agents-md.schema.json', agentsMdSchema],
  ['gemini-md.schema.json', geminiMdSchema],
  ['canonical.schema.json', canonicalSchema],
  ['trae.schema.json', traeSchema],
  ['aider.schema.json', aiderSchema],
  ['zencoder.schema.json', zencoderSchema],
  ['replit.schema.json', replitSchema],
  ['format-registry.schema.json', formatRegistrySchema],
];

const SUBTYPE_SCHEMA_ENTRIES: [string, JsonSchema][] = [
  ['claude-agent.schema.json', claudeAgentSchema],
  ['claude-skill.schema.json', claudeSkillSchema],
  ['claude-slash-command.schema.json', claudeSlashCommandSchema],
  ['claude-hook.schema.json', claudeHookSchema],
  ['cursor-command.schema.json', cursorCommandSchema],
  ['cursor-hooks.schema.json', cursorHooksSchema],
  ['kiro-agent.schema.json', kiroAgentSchema],
  ['kiro-hook.schema.json', kiroHookSchema],
  ['droid-skill.schema.json', droidSkillSchema],
  ['droid-slash-command.schema.json', droidSlashCommandSchema],
  ['droid-hook.schema.json', droidHookSchema],
  ['opencode-slash-command.schema.json', opencodeSlashCommandSchema],
];

const SCHEMAS = new Map<string, JsonSchema>([
  ...BASE_SCHEMA_ENTRIES,
  ...SUBTYPE_SCHEMA_ENTRIES,
]);

const BASE_SCHEMAS = BASE_SCHEMA_ENTRIES.map(([filename]) => filename);

const SUBTYPE_SCHEMAS: Record<string, { format: string; subtype: string }> = {
  // Claude subtypes
  'claude-agent.schema.json': { format: 'claude', subtype: 'agent' },
  'claude-skill.schema.json': { format: 'claude', subtype: 'skill' },
  'claude-slash-command.schema.json': { format: 'claude', subtype: 'slash-command' },
  'claude-hook.schema.json': { format: 'claude', subtype: 'hook' },

  // Cursor subtypes
  'cursor-command.schema.json': { format: 'cursor', subtype: 'command' },
  'cursor-hooks.schema.json': { format: 'cursor', subtype: 'hooks' },

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

const AVAILABLE_SCHEMAS = [...BASE_SCHEMAS, ...Object.keys(SUBTYPE_SCHEMAS)];

export async function schemaRoutes(server: FastifyInstance) {
  /**
   * GET /schemas
   * List all available schemas with navigation and grouping
   */
  server.get(
    '/',
    {
      schema: {
        description: 'List all available JSON Schema files with navigation, grouping, and metadata',
        tags: ['schemas'],
        querystring: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              description: 'Filter by format (e.g., claude, cursor)'
            },
            grouped: {
              type: 'boolean',
              description: 'Return schemas grouped by format',
              default: false
            }
          }
        },
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
                    subtype: { type: ['string', 'null'] },
                    description: { type: 'string' },
                    title: { type: 'string' }
                  }
                }
              },
              grouped: {
                type: 'object',
                additionalProperties: true
              },
              total: { type: 'number' },
              formats: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const { format: filterFormat, grouped } = request.query as { format?: string; grouped?: boolean };
      const baseUrl = 'https://registry.prpm.dev';

      // Build schema list with metadata
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
          format = filename.replace('.schema.json', '');
          url = `${baseUrl}/api/v1/schemas/${format}.json`;
        }

        // Get schema metadata
        const schemaData = SCHEMAS.get(filename);
        const description = (schemaData as any)?.description || '';
        const title = (schemaData as any)?.title || '';

        return {
          name: filename,
          url,
          format,
          subtype,
          description,
          title
        };
      });

      // Filter by format if requested
      const filteredSchemas = filterFormat
        ? schemas.filter(s => s.format === filterFormat)
        : schemas;

      // Get unique formats
      const formats = [...new Set(schemas.map(s => s.format))].sort();

      // Build grouped response if requested
      let groupedData: Record<string, any> | undefined;
      if (grouped) {
        groupedData = {};

        for (const format of formats) {
          const formatSchemas = schemas.filter(s => s.format === format);
          const baseSchema = formatSchemas.find(s => s.subtype === null);
          const subtypeSchemas = formatSchemas.filter(s => s.subtype !== null);

          groupedData[format] = {
            format,
            base: baseSchema ? {
              name: baseSchema.name,
              url: baseSchema.url,
              description: baseSchema.description,
              title: baseSchema.title
            } : null,
            subtypes: subtypeSchemas.map(s => ({
              name: s.name,
              url: s.url,
              subtype: s.subtype,
              description: s.description,
              title: s.title
            }))
          };
        }
      }

      return {
        schemas: filteredSchemas,
        grouped: groupedData,
        total: filteredSchemas.length,
        formats
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

      // Get schema from imported map
      const schema = SCHEMAS.get(schemaFilename);

      if (!schema) {
        return reply.code(404).send({
          error: 'Schema not found',
          message: `Schema "${format}" not found in imports`
        });
      }

      reply.header('Content-Type', 'application/schema+json');
      reply.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      return schema;
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

      // Get schema from imported map
      const schema = SCHEMAS.get(schemaFilename);

      if (!schema) {
        return reply.code(404).send({
          error: 'Schema not found',
          message: `Schema "${format}/${subtype}" not found in imports`
        });
      }

      reply.header('Content-Type', 'application/schema+json');
      reply.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      return schema;
    }
  );

  /**
   * GET /schemas/format-registry
   * Retrieve the format registry data (directory structures for all formats)
   */
  server.get(
    '/format-registry',
    {
      schema: {
        description: 'Get the format registry containing directory structures and file patterns for all AI editor formats',
        tags: ['schemas'],
      }
    },
    async (request, reply) => {
      const registry = getFormatRegistry();

      reply.header('Content-Type', 'application/json');
      reply.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      return registry;
    }
  );
}
