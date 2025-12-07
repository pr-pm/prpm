/**
 * Format capabilities routes
 * Serves format capability data for AI editors
 */

import { FastifyInstance } from 'fastify';
import { getAllFormatCapabilities, getFormatCapability } from '@pr-pm/converters';

export async function formatRoutes(server: FastifyInstance) {
  /**
   * GET /formats/capabilities
   * Get all format capabilities (what each format supports)
   */
  server.get(
    '/capabilities',
    {
      schema: {
        description: 'Get format capabilities matrix - shows what features each AI editor format supports (skills, agents, hooks, agents.md, etc.)',
        tags: ['formats'],
        response: {
          200: {
            type: 'object',
            properties: {
              version: { type: 'string' },
              description: { type: 'string' },
              formats: {
                type: 'object',
                additionalProperties: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    supportsSkills: { type: 'boolean' },
                    supportsPlugins: { type: 'boolean' },
                    supportsExtensions: { type: 'boolean' },
                    supportsAgents: { type: 'boolean' },
                    supportsAgentsMd: { type: 'boolean' },
                    supportsSlashCommands: { type: 'boolean' },
                    markdownFallback: { type: 'string' },
                    notes: { type: 'string' }
                  }
                }
              },
              agentsMdSupport: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  formats: { type: 'array', items: { type: 'string' } },
                  notes: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const capabilities = getAllFormatCapabilities();

      reply.header('Content-Type', 'application/json');
      reply.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      return capabilities;
    }
  );

  /**
   * GET /formats/capabilities/:format
   * Get capabilities for a specific format
   */
  server.get(
    '/capabilities/:format',
    {
      schema: {
        description: 'Get capabilities for a specific AI editor format',
        tags: ['formats'],
        params: {
          type: 'object',
          required: ['format'],
          properties: {
            format: {
              type: 'string',
              description: 'Format name (e.g., cursor, claude, kiro, copilot)',
              pattern: '^[a-z0-9.-]+$'
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              format: { type: 'string' },
              name: { type: 'string' },
              supportsSkills: { type: 'boolean' },
              supportsPlugins: { type: 'boolean' },
              supportsExtensions: { type: 'boolean' },
              supportsAgents: { type: 'boolean' },
              supportsAgentsMd: { type: 'boolean' },
              supportsSlashCommands: { type: 'boolean' },
              markdownFallback: { type: 'string' },
              notes: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              availableFormats: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const { format } = request.params as { format: string };
      const capability = getFormatCapability(format as any);

      if (!capability) {
        const allCapabilities = getAllFormatCapabilities();
        return reply.code(404).send({
          error: 'Format not found',
          message: `Format "${format}" does not exist in the capabilities matrix`,
          availableFormats: Object.keys(allCapabilities.formats)
        });
      }

      reply.header('Content-Type', 'application/json');
      reply.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      return {
        format,
        ...capability
      };
    }
  );
}
