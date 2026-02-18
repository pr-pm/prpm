/**
 * Cursor Plugin Format Converter
 * Converts canonical format to Cursor plugin format (.cursor-plugin/plugin.json + file structure)
 */

import type {
  CanonicalPackage,
  ConversionResult,
} from './types/canonical.js';
import type { CursorPluginJson, CursorMCPServer, CursorPluginContents } from './from-cursor-plugin.js';

/**
 * Result of converting to Cursor plugin format
 * Includes the plugin.json content and metadata about what files are included
 */
export interface CursorPluginConversionResult extends ConversionResult {
  /** Parsed plugin.json structure for programmatic access */
  pluginJson: CursorPluginJson;
  /** List of files that should be included in the plugin */
  pluginContents: CursorPluginContents;
}

/**
 * Convert canonical package to Cursor plugin format
 *
 * Returns a plugin.json structure plus metadata about bundled files.
 * The actual rules/agents/skills/commands are stored separately in the package.
 */
export function toCursorPlugin(
  pkg: CanonicalPackage,
): CursorPluginConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    // Extract metadata section
    const metadata = pkg.content.sections.find(s => s.type === 'metadata');

    // Get stored plugin data from metadata (if came from a cursor plugin originally)
    const storedPluginData = metadata?.type === 'metadata' ? metadata.data.cursorPlugin : undefined;

    // Build plugin.json structure
    const pluginJson: CursorPluginJson = {
      name: pkg.name || pkg.id,
    };

    // Add optional fields
    if (pkg.description || (metadata?.type === 'metadata' && metadata.data.description)) {
      pluginJson.description = pkg.description || (metadata?.type === 'metadata' ? metadata.data.description : '');
    }

    if (pkg.version) {
      pluginJson.version = pkg.version;
    }

    // Format author as object
    if (pkg.author) {
      const emailMatch = pkg.author.match(/^(.+?)\s*<(.+?)>$/);
      if (emailMatch) {
        pluginJson.author = { name: emailMatch[1].trim(), email: emailMatch[2] };
      } else {
        pluginJson.author = { name: pkg.author };
      }
    }

    if (pkg.homepage) {
      pluginJson.homepage = pkg.homepage;
    }

    if (pkg.repository) {
      pluginJson.repository = pkg.repository;
    }

    if (pkg.license) {
      pluginJson.license = pkg.license;
    }

    // Add keywords/tags
    if (pkg.tags && pkg.tags.length > 0) {
      pluginJson.keywords = pkg.tags;
    }

    // Restore logo
    if (storedPluginData?.logo) {
      pluginJson.logo = storedPluginData.logo;
    }

    // Add MCP servers if present
    if (storedPluginData?.mcpServers && Object.keys(storedPluginData.mcpServers).length > 0) {
      pluginJson.mcpServers = storedPluginData.mcpServers;
    }

    // Get plugin contents from stored metadata
    const pluginContents: CursorPluginContents = storedPluginData?.contents || {
      rules: [],
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

    const mcpServerCount = storedPluginData?.mcpServers
      ? Object.keys(storedPluginData.mcpServers).length
      : 0;

    if (mcpServerCount === 0) {
      warnings.push('No MCP servers configured');
    }

    const totalFiles = (pluginContents.rules?.length || 0) +
                      (pluginContents.agents?.length || 0) +
                      (pluginContents.skills?.length || 0) +
                      (pluginContents.commands?.length || 0) +
                      (pluginContents.hooks ? 1 : 0);

    if (totalFiles === 0 && mcpServerCount === 0) {
      warnings.push('Plugin has no rules, agents, skills, commands, hooks, or MCP servers');
      qualityScore -= 20;
    }

    return {
      content,
      format: 'cursor',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion: false,
      qualityScore: Math.max(0, qualityScore),
      pluginJson,
      pluginContents,
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '{}',
      format: 'cursor',
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
export function generateCursorPluginJson(pluginJson: CursorPluginJson): string {
  return JSON.stringify(pluginJson, null, 2);
}

/**
 * Create a minimal plugin.json for a new Cursor plugin
 */
export function createMinimalCursorPluginJson(
  name: string,
  options?: {
    version?: string;
    description?: string;
    author?: { name: string; email?: string };
    mcpServers?: Record<string, CursorMCPServer>;
  }
): CursorPluginJson {
  return {
    name,
    version: options?.version || '1.0.0',
    description: options?.description,
    author: options?.author,
    mcpServers: options?.mcpServers,
  };
}
