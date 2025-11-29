/**
 * Claude Plugin Format Parser
 * Converts Claude plugin format (plugin.json + agents/skills/commands) to canonical format
 */

import type {
  CanonicalPackage,
  PackageMetadata,
  Section,
  MetadataSection,
} from './types/canonical.js';
import { setTaxonomy } from './taxonomy-utils.js';

/**
 * MCP Server configuration
 */
export interface MCPServer {
  type?: 'stdio' | 'http' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

/**
 * Claude plugin.json structure
 */
export interface ClaudePluginJson {
  name: string;
  version?: string;
  description?: string;
  author?: string;
  license?: string;
  repository?: string;
  homepage?: string;
  keywords?: string[];
  mcpServers?: Record<string, MCPServer>;
}

/**
 * Plugin contents (discovered files)
 */
export interface PluginContents {
  agents?: string[];    // List of agent file paths
  skills?: string[];    // List of skill file paths
  commands?: string[];  // List of command file paths
}

/**
 * Parse Claude plugin format into canonical format
 *
 * @param pluginJson - Parsed plugin.json content
 * @param contents - Discovered plugin contents (agents, skills, commands)
 * @param metadata - Package metadata from prpm.json
 */
export function fromClaudePlugin(
  pluginJson: ClaudePluginJson,
  contents: PluginContents,
  metadata: Partial<PackageMetadata> & Pick<PackageMetadata, 'id' | 'name' | 'version' | 'author'>
): CanonicalPackage {
  const sections: Section[] = [];

  // Extract metadata from plugin.json
  const metadataSection: MetadataSection = {
    type: 'metadata',
    data: {
      title: pluginJson.name || metadata.name,
      description: pluginJson.description || '',
      version: pluginJson.version || metadata.version || '1.0.0',
      author: pluginJson.author || metadata.author,
      // Store MCP servers in metadata for later extraction
      claudePlugin: {
        mcpServers: pluginJson.mcpServers,
        contents: {
          agents: contents.agents || [],
          skills: contents.skills || [],
          commands: contents.commands || [],
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
  if (contents.agents?.length) {
    contentsSummary.push(`- **Agents**: ${contents.agents.length} agents`);
  }
  if (contents.skills?.length) {
    contentsSummary.push(`- **Skills**: ${contents.skills.length} skills`);
  }
  if (contents.commands?.length) {
    contentsSummary.push(`- **Commands**: ${contents.commands.length} commands`);
  }
  if (pluginJson.mcpServers && Object.keys(pluginJson.mcpServers).length > 0) {
    contentsSummary.push(`- **MCP Servers**: ${Object.keys(pluginJson.mcpServers).join(', ')}`);
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
    author: pluginJson.author || metadata.author || 'unknown',
    tags: pluginJson.keywords || metadata.tags || [],
    content: {
      format: 'canonical',
      version: '1.0',
      sections,
    },
    sourceFormat: 'claude-plugin',
    metadata: {
      title: metadataSection.data.title,
      description: metadataSection.data.description,
      version: metadataSection.data.version,
      author: metadataSection.data.author,
      claudePlugin: metadataSection.data.claudePlugin,
    },
  };

  // Set taxonomy
  setTaxonomy(pkg, 'claude-plugin', 'plugin');

  return pkg as CanonicalPackage;
}

/**
 * Parse plugin.json file content
 */
export function parsePluginJson(content: string): ClaudePluginJson {
  try {
    return JSON.parse(content) as ClaudePluginJson;
  } catch (error) {
    throw new Error(`Failed to parse plugin.json: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract MCP servers from plugin.json
 */
export function extractMCPServers(pluginJson: ClaudePluginJson): Record<string, MCPServer> {
  return pluginJson.mcpServers || {};
}
