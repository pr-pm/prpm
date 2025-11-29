/**
 * MCP Server Package Parser
 *
 * Converts MCP server configuration JSON to canonical format
 */

import type { CanonicalPackage, PackageMetadata } from './types/canonical.js';
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
 * MCP Server package JSON structure
 */
export interface MCPServerJson {
  name: string;
  description?: string;
  version?: string;
  author?: string;
  repository?: string;
  homepage?: string;
  license?: string;
  mcpServers: Record<string, MCPServer>;
}

/**
 * Parse MCP server package JSON into canonical format
 *
 * @param mcpServerJson - Parsed MCP server package configuration
 * @param metadata - Package metadata (id, name, version, author)
 * @returns Canonical package
 */
export function fromMCPServer(
  mcpServerJson: MCPServerJson,
  metadata: Partial<PackageMetadata> & Pick<PackageMetadata, 'id' | 'name' | 'version' | 'author'>
): CanonicalPackage {
  const pkg: Partial<CanonicalPackage> = {
    id: metadata.id,
    version: mcpServerJson.version || metadata.version,
    name: mcpServerJson.name || metadata.name,
    description: mcpServerJson.description || metadata.description || 'MCP Server package',
    author: mcpServerJson.author || metadata.author,
    organization: metadata.organization,
    tags: metadata.tags || ['mcp', 'server'],
    license: mcpServerJson.license || metadata.license,
    repository: mcpServerJson.repository || metadata.repository,
    homepage: mcpServerJson.homepage || metadata.homepage,
  };

  // Set taxonomy
  setTaxonomy(pkg, 'mcp', 'server');

  // Build content sections
  const sections: CanonicalPackage['content']['sections'] = [];

  // Metadata section
  sections.push({
    type: 'metadata',
    data: {
      title: pkg.name!,
      description: pkg.description!,
    },
  });

  // Build server descriptions for instructions
  const serverDescriptions: string[] = [];
  for (const [serverName, serverConfig] of Object.entries(mcpServerJson.mcpServers)) {
    const serverType = serverConfig.type || 'stdio';
    if (serverType === 'stdio' && serverConfig.command) {
      const args = serverConfig.args?.join(' ') || '';
      serverDescriptions.push(`- **${serverName}**: \`${serverConfig.command} ${args}\``);
    } else if ((serverType === 'http' || serverType === 'sse') && serverConfig.url) {
      serverDescriptions.push(`- **${serverName}**: ${serverConfig.url} (${serverType})`);
    }

    // Add env vars info if present
    if (serverConfig.env && Object.keys(serverConfig.env).length > 0) {
      const envVars = Object.keys(serverConfig.env).join(', ');
      serverDescriptions.push(`  - Environment: ${envVars}`);
    }
  }

  // Instructions section with server details
  if (serverDescriptions.length > 0) {
    sections.push({
      type: 'instructions',
      title: 'MCP Servers',
      content: `This package provides the following MCP servers:\n\n${serverDescriptions.join('\n')}`,
    });
  }

  // Store MCP server config in metadata for installation
  pkg.metadata = {
    title: pkg.name,
    description: pkg.description,
    claudePlugin: {
      mcpServers: mcpServerJson.mcpServers,
    },
  };

  pkg.content = {
    format: 'canonical',
    version: '1.0',
    sections,
  };

  return pkg as CanonicalPackage;
}

/**
 * Parse MCP server JSON string
 *
 * @param jsonString - Raw JSON string
 * @returns Parsed MCPServerJson object
 */
export function parseMCPServerJson(jsonString: string): MCPServerJson {
  const parsed = JSON.parse(jsonString);

  // Validate required fields
  if (!parsed.name) {
    throw new Error('MCP server package must have a name');
  }

  if (!parsed.mcpServers || typeof parsed.mcpServers !== 'object') {
    throw new Error('MCP server package must have mcpServers configuration');
  }

  if (Object.keys(parsed.mcpServers).length === 0) {
    throw new Error('MCP server package must define at least one server');
  }

  // Validate each server config
  for (const [serverName, serverConfig] of Object.entries(parsed.mcpServers)) {
    const config = serverConfig as MCPServer;
    const serverType = config.type || 'stdio';

    if (serverType === 'stdio' && !config.command) {
      throw new Error(`MCP server '${serverName}' of type stdio must have a command`);
    }

    if ((serverType === 'http' || serverType === 'sse') && !config.url) {
      throw new Error(`MCP server '${serverName}' of type ${serverType} must have a url`);
    }
  }

  return parsed as MCPServerJson;
}

/**
 * Extract MCP servers from canonical package metadata
 *
 * @param pkg - Canonical package
 * @returns MCP server configurations or null
 */
export function extractMCPServers(pkg: CanonicalPackage): Record<string, MCPServer> | null {
  // Check claudePlugin metadata (used by both plugins and MCP server packages)
  if (pkg.metadata?.claudePlugin?.mcpServers) {
    return pkg.metadata.claudePlugin.mcpServers as Record<string, MCPServer>;
  }

  return null;
}
