/**
 * Cursor Plugin Format Parser
 * Converts Cursor plugin format (.cursor-plugin/plugin.json + component directories) to canonical format
 */

import type {
  CanonicalPackage,
  PackageMetadata,
  Section,
  MetadataSection,
} from './types/canonical.js';
import { setTaxonomy } from './taxonomy-utils.js';

/**
 * MCP Server configuration for Cursor plugins
 */
export interface CursorMCPServer {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

/**
 * Author object for Cursor plugins
 */
export interface CursorPluginAuthor {
  name: string;
  email?: string;
}

/**
 * Cursor plugin.json structure
 * Based on https://cursor.com/docs/plugins/building
 */
export interface CursorPluginJson {
  name: string;
  description?: string;
  version?: string;
  author?: CursorPluginAuthor;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  logo?: string;
  rules?: string | string[];
  agents?: string | string[];
  skills?: string | string[];
  commands?: string | string[];
  hooks?: string | Record<string, unknown>;
  mcpServers?: string | Record<string, CursorMCPServer> | string[];
}

/**
 * Plugin contents (discovered component files)
 */
export interface CursorPluginContents {
  rules?: string[];
  agents?: string[];
  skills?: string[];
  commands?: string[];
  hooks?: string;
  mcpServers?: string[];
}

/**
 * Parse Cursor plugin format into canonical format
 *
 * @param pluginJson - Parsed plugin.json content
 * @param contents - Discovered plugin contents (rules, agents, skills, commands, hooks, mcpServers)
 * @param metadata - Package metadata from prpm.json
 */
export function fromCursorPlugin(
  pluginJson: CursorPluginJson,
  contents: CursorPluginContents,
  metadata: Partial<PackageMetadata> & Pick<PackageMetadata, 'id' | 'name' | 'version' | 'author'>
): CanonicalPackage {
  const sections: Section[] = [];

  // Format author string from object
  const authorStr = pluginJson.author
    ? (pluginJson.author.email
      ? `${pluginJson.author.name} <${pluginJson.author.email}>`
      : pluginJson.author.name)
    : metadata.author;

  // Resolve MCP servers (only inline objects, not string paths)
  const mcpServers = typeof pluginJson.mcpServers === 'object' && !Array.isArray(pluginJson.mcpServers)
    ? pluginJson.mcpServers as Record<string, CursorMCPServer>
    : undefined;

  // Extract metadata from plugin.json
  const metadataSection: MetadataSection = {
    type: 'metadata',
    data: {
      title: pluginJson.name || metadata.name,
      description: pluginJson.description || '',
      version: pluginJson.version || metadata.version || '1.0.0',
      author: authorStr,
      cursorPlugin: {
        logo: pluginJson.logo,
        mcpServers,
        contents: {
          rules: contents.rules || [],
          agents: contents.agents || [],
          skills: contents.skills || [],
          commands: contents.commands || [],
          hooks: contents.hooks,
        },
      },
    },
  };
  sections.push(metadataSection);

  // Add instructions section with plugin overview
  if (pluginJson.description) {
    sections.push({
      type: 'instructions',
      title: 'Overview',
      content: pluginJson.description,
    });
  }

  // Add context section listing plugin contents
  const contentsSummary: string[] = [];
  if (contents.rules?.length) {
    contentsSummary.push(`- **Rules**: ${contents.rules.length} rules`);
  }
  if (contents.agents?.length) {
    contentsSummary.push(`- **Agents**: ${contents.agents.length} agents`);
  }
  if (contents.skills?.length) {
    contentsSummary.push(`- **Skills**: ${contents.skills.length} skills`);
  }
  if (contents.commands?.length) {
    contentsSummary.push(`- **Commands**: ${contents.commands.length} commands`);
  }
  if (contents.hooks) {
    contentsSummary.push(`- **Hooks**: configured`);
  }
  if (mcpServers && Object.keys(mcpServers).length > 0) {
    contentsSummary.push(`- **MCP Servers**: ${Object.keys(mcpServers).join(', ')}`);
  }

  if (contentsSummary.length > 0) {
    sections.push({
      type: 'context',
      title: 'Plugin Contents',
      content: contentsSummary.join('\n'),
    });
  }

  // Create the canonical package
  const pkg: Partial<CanonicalPackage> = {
    id: metadata.id,
    version: pluginJson.version || metadata.version || '1.0.0',
    name: pluginJson.name || metadata.name,
    description: pluginJson.description || '',
    author: authorStr || 'unknown',
    tags: pluginJson.keywords || metadata.tags || [],
    license: pluginJson.license || metadata.license,
    repository: pluginJson.repository || metadata.repository,
    homepage: pluginJson.homepage || metadata.homepage,
    content: {
      format: 'canonical',
      version: '1.0',
      sections,
    },
    sourceFormat: 'cursor',
    metadata: {
      title: metadataSection.data.title,
      description: metadataSection.data.description,
      version: metadataSection.data.version,
      author: metadataSection.data.author,
      cursorPlugin: metadataSection.data.cursorPlugin,
    },
  };

  // Set taxonomy
  setTaxonomy(pkg, 'cursor', 'plugin');

  return pkg as CanonicalPackage;
}

/**
 * Parse plugin.json file content
 */
export function parseCursorPluginJson(content: string): CursorPluginJson {
  try {
    return JSON.parse(content) as CursorPluginJson;
  } catch (error) {
    throw new Error(`Failed to parse plugin.json: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract MCP servers from plugin.json (only inline objects)
 */
export function extractCursorMCPServers(pluginJson: CursorPluginJson): Record<string, CursorMCPServer> {
  if (typeof pluginJson.mcpServers === 'object' && !Array.isArray(pluginJson.mcpServers)) {
    return pluginJson.mcpServers as Record<string, CursorMCPServer>;
  }
  return {};
}
