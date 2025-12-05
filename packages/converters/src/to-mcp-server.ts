/**
 * MCP Server Package Generator
 *
 * Converts canonical format to MCP server configuration JSON
 */

import type { CanonicalPackage, ConversionResult } from './types/canonical.js';
import type { MCPServerJson, MCPServer } from './from-mcp-server.js';

/**
 * Conversion result specific to MCP server format
 */
export interface MCPServerConversionResult extends ConversionResult {
  format: 'mcp';
  mcpServerJson: MCPServerJson;
}

/**
 * Convert canonical package to MCP server package format
 *
 * @param pkg - Canonical package
 * @returns Conversion result with MCP server JSON
 */
export function toMCPServer(pkg: CanonicalPackage): MCPServerConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  // Extract MCP servers from metadata
  let mcpServers: Record<string, MCPServer> = {};

  if (pkg.metadata?.claudePlugin?.mcpServers) {
    mcpServers = pkg.metadata.claudePlugin.mcpServers as Record<string, MCPServer>;
  } else {
    // No MCP servers defined - this is a significant issue for MCP format
    warnings.push('No MCP servers defined in package metadata');
    qualityScore -= 50;
  }

  // Build the MCP server JSON
  const mcpServerJson: MCPServerJson = {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    author: pkg.author,
    mcpServers,
  };

  // Add optional fields
  if (pkg.repository) {
    mcpServerJson.repository = pkg.repository;
  }
  if (pkg.homepage) {
    mcpServerJson.homepage = pkg.homepage;
  }
  if (pkg.license) {
    mcpServerJson.license = pkg.license;
  }

  // Check for quality issues
  if (!mcpServerJson.description) {
    warnings.push('Missing description');
    qualityScore -= 10;
  }

  if (Object.keys(mcpServers).length === 0) {
    warnings.push('No MCP servers defined - package will not add any servers');
    qualityScore -= 30;
  }

  // Validate server configurations
  for (const [serverName, serverConfig] of Object.entries(mcpServers)) {
    const serverType = serverConfig.type || 'stdio';

    if (serverType === 'stdio' && !serverConfig.command) {
      warnings.push(`Server '${serverName}' is missing command for stdio type`);
      qualityScore -= 10;
    }

    if ((serverType === 'http' || serverType === 'sse') && !serverConfig.url) {
      warnings.push(`Server '${serverName}' is missing url for ${serverType} type`);
      qualityScore -= 10;
    }
  }

  // Generate JSON content
  const content = JSON.stringify(mcpServerJson, null, 2);

  return {
    content,
    format: 'mcp',
    warnings: warnings.length > 0 ? warnings : undefined,
    lossyConversion: false,
    qualityScore: Math.max(0, qualityScore),
    mcpServerJson,
  };
}

/**
 * Generate MCP server package JSON from server configurations
 *
 * @param name - Package name
 * @param servers - MCP server configurations
 * @param options - Additional package options
 * @returns MCP server JSON string
 */
export function generateMCPServerPackage(
  name: string,
  servers: Record<string, MCPServer>,
  options: {
    description?: string;
    version?: string;
    author?: string;
    repository?: string;
    homepage?: string;
    license?: string;
  } = {}
): string {
  const mcpServerJson: MCPServerJson = {
    name,
    description: options.description || `MCP server package: ${name}`,
    version: options.version || '1.0.0',
    author: options.author,
    repository: options.repository,
    homepage: options.homepage,
    license: options.license,
    mcpServers: servers,
  };

  // Clean up undefined values
  const cleaned = JSON.parse(JSON.stringify(mcpServerJson));

  return JSON.stringify(cleaned, null, 2);
}
