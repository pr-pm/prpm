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
  droidHookSchema,
  droidSkillSchema,
  droidSlashCommandSchema,
  kiroAgentSchema,
  kiroHookSchema,
  opencodeSlashCommandSchema,
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
];

const SUBTYPE_SCHEMA_ENTRIES: [string, JsonSchema][] = [
  ['claude-agent.schema.json', claudeAgentSchema],
  ['claude-skill.schema.json', claudeSkillSchema],
  ['claude-slash-command.schema.json', claudeSlashCommandSchema],
  ['claude-hook.schema.json', claudeHookSchema],
  ['cursor-command.schema.json', cursorCommandSchema],
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
          // Handle special cases: kiro-steering → kiro-steering, gemini-md → gemini-md
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
}
