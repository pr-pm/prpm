/**
 * MCP (Model Context Protocol) Server Utilities
 *
 * Handles merging and removing MCP server configurations from:
 * - Claude: Project-local .mcp.json or Global ~/.claude/settings.json
 * - Codex: Project-local codex.toml or Global ~/.codex/config.toml
 * - Gemini: Extension-specific gemini-extension.json files
 * - Kiro: Agent-specific .kiro/agents/*.json files
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import * as TOML from 'smol-toml';

/**
 * Supported editors for MCP server installation
 */
export type MCPEditor = 'claude' | 'codex';

/**
 * List of supported MCP editors
 */
export const MCP_EDITORS: readonly MCPEditor[] = ['claude', 'codex'] as const;

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
  // Codex-specific fields
  cwd?: string;
  env_vars?: string[];
  bearer_token_env_var?: string;
  http_headers?: Record<string, string>;
  env_http_headers?: Record<string, string>;
  enabled?: boolean;
  enabled_tools?: string[];
  disabled_tools?: string[];
  startup_timeout_sec?: number;
  tool_timeout_sec?: number;
}

/**
 * Codex TOML configuration structure
 */
export interface CodexConfig {
  mcp_servers?: Record<string, MCPServer>;
  [key: string]: unknown;
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
 * Get the path to the MCP config file for Claude
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
 * Get the path to the Codex MCP config file
 *
 * @param global - If true, return global config path (~/.codex/config.toml)
 * @param projectDir - Project directory (default: cwd)
 */
export function getCodexMCPConfigPath(global: boolean = false, projectDir: string = process.cwd()): string {
  if (global) {
    return join(homedir(), '.codex', 'config.toml');
  }
  return join(projectDir, 'codex.toml');
}

/**
 * Get the path to the MCP config file for a specific editor
 *
 * @param editor - Target editor (claude, codex)
 * @param global - If true, return global config path
 * @param projectDir - Project directory (default: cwd)
 */
export function getEditorMCPConfigPath(
  editor: MCPEditor,
  global: boolean = false,
  projectDir: string = process.cwd()
): string {
  switch (editor) {
    case 'codex':
      return getCodexMCPConfigPath(global, projectDir);
    case 'claude':
    default:
      return getMCPConfigPath(global, projectDir);
  }
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
 * Read Codex TOML configuration from file
 *
 * @param configPath - Path to config.toml file
 * @returns Parsed config or empty config if file doesn't exist
 */
export function readCodexConfig(configPath: string): CodexConfig {
  if (!existsSync(configPath)) {
    return { mcp_servers: {} };
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const parsed = TOML.parse(content) as CodexConfig;
    return parsed;
  } catch (error) {
    // If file is empty or invalid TOML, return empty config
    return { mcp_servers: {} };
  }
}

/**
 * Write Codex TOML configuration to file
 *
 * @param configPath - Path to config.toml file
 * @param config - Config to write
 */
export function writeCodexConfig(configPath: string, config: CodexConfig): void {
  // Ensure directory exists
  const dir = dirname(configPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(configPath, TOML.stringify(config as Record<string, unknown>) + '\n');
}

/**
 * Convert Claude/standard MCP server config to Codex format
 *
 * Codex uses different field names:
 * - stdio servers: command, args, cwd, env
 * - http servers: url, bearer_token_env_var, http_headers
 */
function toCodexServerConfig(server: MCPServer): Record<string, unknown> {
  const codexServer: Record<string, unknown> = {};

  // Handle stdio servers (command-based)
  if (server.command) {
    codexServer.command = server.command;
    if (server.args && server.args.length > 0) {
      codexServer.args = server.args;
    }
    if (server.cwd) {
      codexServer.cwd = server.cwd;
    }
    if (server.env && Object.keys(server.env).length > 0) {
      codexServer.env = server.env;
    }
  }

  // Handle http servers (url-based)
  if (server.url) {
    codexServer.url = server.url;
    if (server.bearer_token_env_var) {
      codexServer.bearer_token_env_var = server.bearer_token_env_var;
    }
    if (server.http_headers && Object.keys(server.http_headers).length > 0) {
      codexServer.http_headers = server.http_headers;
    }
    if (server.env_http_headers && Object.keys(server.env_http_headers).length > 0) {
      codexServer.env_http_headers = server.env_http_headers;
    }
  }

  // Common optional fields
  if (server.enabled !== undefined) {
    codexServer.enabled = server.enabled;
  }
  if (server.enabled_tools && server.enabled_tools.length > 0) {
    codexServer.enabled_tools = server.enabled_tools;
  }
  if (server.disabled_tools && server.disabled_tools.length > 0) {
    codexServer.disabled_tools = server.disabled_tools;
  }
  if (server.startup_timeout_sec !== undefined) {
    codexServer.startup_timeout_sec = server.startup_timeout_sec;
  }
  if (server.tool_timeout_sec !== undefined) {
    codexServer.tool_timeout_sec = server.tool_timeout_sec;
  }

  return codexServer;
}

/**
 * Merge MCP servers into Codex TOML configuration
 *
 * @param servers - MCP servers to merge
 * @param global - If true, merge into global config (~/.codex/config.toml)
 * @param projectDir - Project directory for local config
 */
export function mergeCodexMCPServers(
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

  const configPath = getCodexMCPConfigPath(global, projectDir);
  const config = readCodexConfig(configPath);

  // Ensure mcp_servers object exists (Codex uses underscore, not camelCase)
  if (!config.mcp_servers) {
    config.mcp_servers = {};
  }

  for (const [name, server] of Object.entries(servers)) {
    if (config.mcp_servers[name]) {
      // Server already exists - skip and warn
      result.skipped.push(name);
      result.warnings.push(`MCP server '${name}' already exists in Codex config, keeping existing configuration`);
    } else {
      // Convert to Codex format and add
      config.mcp_servers[name] = toCodexServerConfig(server) as MCPServer;
      result.added.push(name);
    }
  }

  // Only write if we added something
  if (result.added.length > 0) {
    writeCodexConfig(configPath, config);
  }

  return result;
}

/**
 * Remove MCP servers from Codex TOML configuration
 *
 * @param servers - MCP servers that were installed (original config for comparison)
 * @param global - If true, remove from global config
 * @param projectDir - Project directory for local config
 */
export function removeCodexMCPServers(
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

  const configPath = getCodexMCPConfigPath(global, projectDir);

  if (!existsSync(configPath)) {
    return result;
  }

  const config = readCodexConfig(configPath);

  if (!config.mcp_servers) {
    return result;
  }

  for (const [name, originalServer] of Object.entries(servers)) {
    const currentServer = config.mcp_servers[name];

    if (!currentServer) {
      // Server doesn't exist (already removed or never installed)
      continue;
    }

    // Convert original to Codex format for comparison
    const originalCodexServer = toCodexServerConfig(originalServer);
    if (serversEqual(currentServer as MCPServer, originalCodexServer as MCPServer)) {
      // Config unchanged - safe to remove
      delete config.mcp_servers[name];
      result.removed.push(name);
    } else {
      // Config modified by user - keep it
      result.kept.push(name);
      result.warnings.push(`Keeping modified MCP server '${name}' in Codex config`);
    }
  }

  // Clean up empty mcp_servers object
  if (Object.keys(config.mcp_servers).length === 0) {
    delete config.mcp_servers;
  }

  // Only write if we removed something
  if (result.removed.length > 0) {
    writeCodexConfig(configPath, config);
  }

  return result;
}

/**
 * Merge MCP servers into configuration for any supported editor
 *
 * @param servers - MCP servers to merge
 * @param editor - Target editor (claude, codex)
 * @param global - If true, merge into global config
 * @param projectDir - Project directory for local config
 */
export function mergeEditorMCPServers(
  servers: Record<string, MCPServer>,
  editor: MCPEditor = 'claude',
  global: boolean = false,
  projectDir: string = process.cwd()
): MCPMergeResult {
  switch (editor) {
    case 'codex':
      return mergeCodexMCPServers(servers, global, projectDir);
    case 'claude':
    default:
      return mergeMCPServers(servers, global, projectDir);
  }
}

/**
 * Remove MCP servers from configuration for any supported editor
 *
 * @param servers - MCP servers that were installed
 * @param editor - Target editor (claude, codex)
 * @param global - If true, remove from global config
 * @param projectDir - Project directory for local config
 */
export function removeEditorMCPServers(
  servers: Record<string, MCPServer>,
  editor: MCPEditor = 'claude',
  global: boolean = false,
  projectDir: string = process.cwd()
): MCPRemoveResult {
  switch (editor) {
    case 'codex':
      return removeCodexMCPServers(servers, global, projectDir);
    case 'claude':
    default:
      return removeMCPServers(servers, global, projectDir);
  }
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
