/**
 * MCP (Model Context Protocol) Server Utilities
 *
 * Handles merging and removing MCP server configurations from:
 * - Claude: Project-local .mcp.json or Global ~/.claude/settings.json
 * - Gemini: Extension-specific gemini-extension.json files
 * - Kiro: Agent-specific .kiro/agents/*.json files
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

/**
 * MCP Server configuration - compatible with converter types
 * Uses the same structure as the converter's MCPServer for type compatibility
 */
export interface MCPServer {
  type?: 'stdio' | 'http' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

/**
 * MCP configuration file structure
 */
export interface MCPConfig {
  mcpServers?: Record<string, MCPServer>;
  [key: string]: unknown;
}

/**
 * Result of merging MCP servers
 */
export interface MCPMergeResult {
  added: string[];
  skipped: string[];
  warnings: string[];
}

/**
 * Result of removing MCP servers
 */
export interface MCPRemoveResult {
  removed: string[];
  kept: string[];
  warnings: string[];
}

/**
 * Get the path to the MCP config file
 *
 * @param global - If true, return global config path (~/.claude/settings.json)
 * @param projectDir - Project directory (default: cwd)
 */
export function getMCPConfigPath(global: boolean = false, projectDir: string = process.cwd()): string {
  if (global) {
    return join(homedir(), '.claude', 'settings.json');
  }
  return join(projectDir, '.mcp.json');
}

/**
 * Read MCP configuration from file
 *
 * @param configPath - Path to config file
 * @returns Parsed config or empty config if file doesn't exist
 */
export function readMCPConfig(configPath: string): MCPConfig {
  if (!existsSync(configPath)) {
    return { mcpServers: {} };
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as MCPConfig;
  } catch (error) {
    // If file is empty or invalid JSON, return empty config
    return { mcpServers: {} };
  }
}

/**
 * Write MCP configuration to file
 *
 * @param configPath - Path to config file
 * @param config - Config to write
 */
export function writeMCPConfig(configPath: string, config: MCPConfig): void {
  // Ensure directory exists
  const dir = dirname(configPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
}

/**
 * Merge MCP servers into configuration
 *
 * Behavior:
 * - Adds new servers that don't exist
 * - Skips existing servers (preserves user config)
 * - Returns warnings for skipped servers
 *
 * @param servers - MCP servers to merge
 * @param global - If true, merge into global config
 * @param projectDir - Project directory for local config
 */
export function mergeMCPServers(
  servers: Record<string, MCPServer>,
  global: boolean = false,
  projectDir: string = process.cwd()
): MCPMergeResult {
  const result: MCPMergeResult = {
    added: [],
    skipped: [],
    warnings: [],
  };

  if (!servers || Object.keys(servers).length === 0) {
    return result;
  }

  const configPath = getMCPConfigPath(global, projectDir);
  const config = readMCPConfig(configPath);

  // Ensure mcpServers object exists
  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  for (const [name, server] of Object.entries(servers)) {
    if (config.mcpServers[name]) {
      // Server already exists - skip and warn
      result.skipped.push(name);
      result.warnings.push(`MCP server '${name}' already exists, keeping existing configuration`);
    } else {
      // Add new server
      config.mcpServers[name] = server;
      result.added.push(name);
    }
  }

  // Only write if we added something
  if (result.added.length > 0) {
    writeMCPConfig(configPath, config);
  }

  return result;
}

/**
 * Remove MCP servers from configuration
 *
 * Behavior:
 * - Removes servers if config matches what was installed (unchanged)
 * - Keeps servers if user has modified the config
 * - Returns warnings for kept servers
 *
 * @param servers - MCP servers that were installed (original config for comparison)
 * @param global - If true, remove from global config
 * @param projectDir - Project directory for local config
 */
export function removeMCPServers(
  servers: Record<string, MCPServer>,
  global: boolean = false,
  projectDir: string = process.cwd()
): MCPRemoveResult {
  const result: MCPRemoveResult = {
    removed: [],
    kept: [],
    warnings: [],
  };

  if (!servers || Object.keys(servers).length === 0) {
    return result;
  }

  const configPath = getMCPConfigPath(global, projectDir);

  if (!existsSync(configPath)) {
    // Config doesn't exist, nothing to remove
    return result;
  }

  const config = readMCPConfig(configPath);

  if (!config.mcpServers) {
    return result;
  }

  for (const [name, originalServer] of Object.entries(servers)) {
    const currentServer = config.mcpServers[name];

    if (!currentServer) {
      // Server doesn't exist (already removed or never installed)
      continue;
    }

    if (serversEqual(currentServer, originalServer)) {
      // Config unchanged - safe to remove
      delete config.mcpServers[name];
      result.removed.push(name);
    } else {
      // Config modified by user - keep it
      result.kept.push(name);
      result.warnings.push(`Keeping modified MCP server '${name}'`);
    }
  }

  // Clean up empty mcpServers object
  if (Object.keys(config.mcpServers).length === 0) {
    delete config.mcpServers;
  }

  // Only write if we removed something
  if (result.removed.length > 0) {
    writeMCPConfig(configPath, config);
  }

  return result;
}

/**
 * Check if two MCP server configs are equal
 */
function serversEqual(a: MCPServer, b: MCPServer): boolean {
  // Compare serialized JSON to handle nested objects
  // Cast to Record<string, unknown> for sortObject compatibility
  return JSON.stringify(sortObject(a as unknown as Record<string, unknown>)) === JSON.stringify(sortObject(b as unknown as Record<string, unknown>));
}

/**
 * Sort object keys for consistent comparison
 */
function sortObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    const value = obj[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sorted[key] = sortObject(value as Record<string, unknown>);
    } else {
      sorted[key] = value;
    }
  }
  return sorted;
}

/**
 * Check if any MCP servers are configured in the project or globally
 */
export function hasMCPServers(projectDir: string = process.cwd()): {
  local: boolean;
  global: boolean;
  servers: string[];
} {
  const localConfig = readMCPConfig(getMCPConfigPath(false, projectDir));
  const globalConfig = readMCPConfig(getMCPConfigPath(true));

  const localServers = Object.keys(localConfig.mcpServers || {});
  const globalServers = Object.keys(globalConfig.mcpServers || {});

  return {
    local: localServers.length > 0,
    global: globalServers.length > 0,
    servers: [...new Set([...localServers, ...globalServers])],
  };
}

/**
 * Merge MCP servers into a Gemini extension file
 *
 * @param extensionPath - Path to the gemini-extension.json file
 * @param servers - MCP servers to merge
 * @returns Merge result
 */
export function mergeGeminiMCPServers(
  extensionPath: string,
  servers: Record<string, MCPServer>
): MCPMergeResult {
  const result: MCPMergeResult = {
    added: [],
    skipped: [],
    warnings: [],
  };

  if (!servers || Object.keys(servers).length === 0) {
    return result;
  }

  // Read existing extension config
  let config: MCPConfig = { mcpServers: {} };
  // Track mcpServers separately to satisfy TypeScript's type narrowing
  let mcpServers: Record<string, MCPServer> = {};

  if (existsSync(extensionPath)) {
    try {
      const content = readFileSync(extensionPath, 'utf-8');
      const parsed = JSON.parse(content) as MCPConfig;
      config = parsed;
      mcpServers = parsed.mcpServers ?? {};
      config.mcpServers = mcpServers;
    } catch (error) {
      result.warnings.push(`Failed to read extension file: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  } else {
    mcpServers = config.mcpServers!;
  }

  // Merge servers
  for (const [name, server] of Object.entries(servers)) {
    if (mcpServers[name]) {
      result.skipped.push(name);
      result.warnings.push(`MCP server '${name}' already exists in extension, keeping existing configuration`);
    } else {
      mcpServers[name] = server;
      result.added.push(name);
    }
  }

  // Write back only if we added something
  if (result.added.length > 0) {
    try {
      const dir = dirname(extensionPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(extensionPath, JSON.stringify(config, null, 2) + '\n');
    } catch (error) {
      result.warnings.push(`Failed to write extension file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return result;
}

/**
 * Remove MCP servers from a Gemini extension file
 *
 * @param extensionPath - Path to the gemini-extension.json file
 * @param servers - MCP servers that were originally installed
 * @returns Remove result
 */
export function removeGeminiMCPServers(
  extensionPath: string,
  servers: Record<string, MCPServer>
): MCPRemoveResult {
  const result: MCPRemoveResult = {
    removed: [],
    kept: [],
    warnings: [],
  };

  if (!servers || Object.keys(servers).length === 0) {
    return result;
  }

  if (!existsSync(extensionPath)) {
    return result;
  }

  try {
    const content = readFileSync(extensionPath, 'utf-8');
    const config = JSON.parse(content);

    if (!config.mcpServers) {
      return result;
    }

    for (const [name, originalServer] of Object.entries(servers)) {
      const currentServer = config.mcpServers[name];

      if (!currentServer) {
        continue;
      }

      if (serversEqual(currentServer, originalServer)) {
        delete config.mcpServers[name];
        result.removed.push(name);
      } else {
        result.kept.push(name);
        result.warnings.push(`Keeping modified MCP server '${name}' in Gemini extension`);
      }
    }

    // Clean up empty mcpServers
    if (Object.keys(config.mcpServers).length === 0) {
      delete config.mcpServers;
    }

    // Write back if we removed something
    if (result.removed.length > 0) {
      writeFileSync(extensionPath, JSON.stringify(config, null, 2) + '\n');
    }
  } catch (error) {
    result.warnings.push(`Failed to process extension file: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}
