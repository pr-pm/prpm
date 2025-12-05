/**
 * Claude Plugin Format Converter
 * Converts canonical format to Claude plugin format (plugin.json + file structure)
 */

import type {
  CanonicalPackage,
  ConversionResult,
} from './types/canonical.js';
import type { ClaudePluginJson, MCPServer, PluginContents } from './from-claude-plugin.js';

/**
 * Result of converting to Claude plugin format
 * Includes the plugin.json content and metadata about what files are included
 */
export interface ClaudePluginConversionResult extends ConversionResult {
  /** Parsed plugin.json structure for programmatic access */
  pluginJson: ClaudePluginJson;
  /** List of files that should be included in the plugin */
  pluginContents: PluginContents;
}

/**
 * Convert canonical package to Claude plugin format
 *
 * Note: Unlike other converters that return a single content string,
 * this returns a plugin.json structure plus metadata about bundled files.
 * The actual agents/skills/commands are stored separately in the package tarball.
 */
export function toClaudePlugin(
  pkg: CanonicalPackage,
): ClaudePluginConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    // Extract metadata section
    const metadata = pkg.content.sections.find(s => s.type === 'metadata');

    // Get stored plugin data from metadata (if came from a plugin originally)
    const storedPluginData = metadata?.type === 'metadata' ? metadata.data.claudePlugin : undefined;

    // Build plugin.json structure
    const pluginJson: ClaudePluginJson = {
      name: pkg.name || pkg.id,
      version: pkg.version,
      description: pkg.description || (metadata?.type === 'metadata' ? metadata.data.description : ''),
      author: pkg.author,
    };

    // Add MCP servers if present
    if (storedPluginData?.mcpServers && Object.keys(storedPluginData.mcpServers).length > 0) {
      pluginJson.mcpServers = storedPluginData.mcpServers;
    }

    // Add keywords/tags
    if (pkg.tags && pkg.tags.length > 0) {
      pluginJson.keywords = pkg.tags;
    }

    // Get plugin contents from stored metadata
    const pluginContents: PluginContents = storedPluginData?.contents || {
      agents: [],
      skills: [],
      commands: [],
    };

    // Generate plugin.json content string
    const content = JSON.stringify(pluginJson, null, 2);

    // Check for missing data
    if (!pluginJson.description) {
      warnings.push('Missing description');
      qualityScore -= 5;
    }

    if (!pluginJson.mcpServers || Object.keys(pluginJson.mcpServers).length === 0) {
      // Not necessarily a problem - plugins can exist without MCP servers
      // Just note it for transparency
      warnings.push('No MCP servers configured');
    }

    const totalFiles = (pluginContents.agents?.length || 0) +
                      (pluginContents.skills?.length || 0) +
                      (pluginContents.commands?.length || 0);

    if (totalFiles === 0 && (!pluginJson.mcpServers || Object.keys(pluginJson.mcpServers).length === 0)) {
      warnings.push('Plugin has no agents, skills, commands, or MCP servers');
      qualityScore -= 20;
    }

    return {
      content,
      format: 'claude', // format: claude + subtype: plugin
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion: false, // Plugin format preserves all data
      qualityScore,
      pluginJson,
      pluginContents,
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '{}',
      format: 'claude', // format: claude + subtype: plugin
      warnings,
      lossyConversion: true,
      qualityScore: 0,
      pluginJson: { name: pkg.name || pkg.id },
      pluginContents: {},
    };
  }
}

/**
 * Generate the plugin.json file content as a string
 */
export function generatePluginJson(pluginJson: ClaudePluginJson): string {
  return JSON.stringify(pluginJson, null, 2);
}

/**
 * Create a minimal plugin.json for a new plugin
 */
export function createMinimalPluginJson(
  name: string,
  options?: {
    version?: string;
    description?: string;
    author?: string;
    mcpServers?: Record<string, MCPServer>;
  }
): ClaudePluginJson {
  return {
    name,
    version: options?.version || '1.0.0',
    description: options?.description,
    author: options?.author,
    mcpServers: options?.mcpServers,
  };
}
