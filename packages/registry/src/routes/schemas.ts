/**
 * Schema serving routes
 * Serves JSON Schema files for package validation
 */

import { FastifyInstance } from 'fastify';
import { SCHEMAS, BASE_SCHEMAS, SUBTYPE_SCHEMAS, AVAILABLE_SCHEMAS } from '../schemas.js';

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
