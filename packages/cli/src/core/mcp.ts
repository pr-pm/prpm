/**
 * MCP (Model Context Protocol) Server Utilities
 *
 * Handles merging and removing MCP server configurations from:
 * - Claude: Project-local .mcp.json or Global ~/.claude/settings.json
 * - Codex: Project-local .codex/config.toml or Global ~/.codex/config.toml
 * - Cursor: Project-local .cursor/mcp.json or Global ~/.cursor/mcp.json
 * - Windsurf: Global ~/.codeium/windsurf/mcp_config.json (global only)
 * - VS Code: Project-local .vscode/mcp.json or Global platform-specific mcp.json
 * - Gemini: Project-local .gemini/settings.json or Global ~/.gemini/settings.json
 * - OpenCode: Project-local opencode.json or Global ~/.config/opencode/opencode.json
 * - Kiro: Project-local .kiro/settings/mcp.json or Global ~/.kiro/settings/mcp.json
 * - Trae: Project-local .trae/mcp.json
 * - Amp: Project-local .amp/settings.json or Global ~/.amp/settings.json
 * - Zed: Global ~/.config/zed/settings.json
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import * as TOML from 'smol-toml';

/**
 * Supported editors for MCP server installation
 */
export type MCPEditor = 'claude' | 'codex' | 'cursor' | 'windsurf' | 'vscode' | 'gemini' | 'opencode' | 'kiro' | 'trae' | 'amp' | 'zed';

/**
 * List of supported MCP editors
 */
export const MCP_EDITORS: readonly MCPEditor[] = ['claude', 'codex', 'cursor', 'windsurf', 'vscode', 'gemini', 'opencode', 'kiro', 'trae', 'amp', 'zed'] as const;

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
 * VS Code MCP configuration file structure
 * VS Code uses "servers" key instead of "mcpServers"
 */
export interface VSCodeMCPConfig {
  inputs?: Array<{
    type: string;
    id: string;
    description: string;
    password?: boolean;
  }>;
  servers?: Record<string, MCPServer>;
  [key: string]: unknown;
}

/**
 * OpenCode MCP configuration file structure
 * OpenCode uses "mcp" key with type: "local" structure
 */
export interface OpenCodeMCPConfig {
  mcp?: Record<string, OpenCodeMCPServer>;
  [key: string]: unknown;
}

/**
 * OpenCode MCP server entry
 */
export interface OpenCodeMCPServer {
  type?: 'local';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  enabled?: boolean;
}

/**
 * Amp MCP configuration file structure
 * Amp uses "amp.mcpServers" dotted key
 */
export interface AmpMCPConfig {
  'amp.mcpServers'?: Record<string, MCPServer>;
  [key: string]: unknown;
}

/**
 * Zed MCP configuration structure
 * Zed uses "context_servers" key with a different server structure
 */
export interface ZedMCPConfig {
  context_servers?: Record<string, ZedMCPServer>;
  [key: string]: unknown;
}

/**
 * Zed MCP server entry
 */
export interface ZedMCPServer {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
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
  return join(projectDir, '.codex', 'config.toml');
}

/**
 * Get the path to the Cursor MCP config file
 *
 * @param global - If true, return global config path (~/.cursor/mcp.json)
 * @param projectDir - Project directory (default: cwd)
 */
export function getCursorMCPConfigPath(global: boolean = false, projectDir: string = process.cwd()): string {
  if (global) {
    return join(homedir(), '.cursor', 'mcp.json');
  }
  return join(projectDir, '.cursor', 'mcp.json');
}

/**
 * Get the path to the Windsurf MCP config file
 * Note: Windsurf only supports global configuration
 */
export function getWindsurfMCPConfigPath(): string {
  return join(homedir(), '.codeium', 'windsurf', 'mcp_config.json');
}

/**
 * Get the path to the VS Code MCP config file
 *
 * @param global - If true, return global config path (platform-specific)
 * @param projectDir - Project directory (default: cwd)
 */
export function getVSCodeMCPConfigPath(global: boolean = false, projectDir: string = process.cwd()): string {
  if (global) {
    if (process.platform === 'darwin') {
      return join(homedir(), 'Library', 'Application Support', 'Code', 'User', 'mcp.json');
    } else if (process.platform === 'win32') {
      return join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), 'Code', 'User', 'mcp.json');
    } else {
      return join(homedir(), '.config', 'Code', 'User', 'mcp.json');
    }
  }
  return join(projectDir, '.vscode', 'mcp.json');
}

/**
 * Get the path to the Gemini CLI settings file
 *
 * @param global - If true, return global config path (~/.gemini/settings.json)
 * @param projectDir - Project directory (default: cwd)
 */
export function getGeminiMCPConfigPath(global: boolean = false, projectDir: string = process.cwd()): string {
  if (global) {
    return join(homedir(), '.gemini', 'settings.json');
  }
  return join(projectDir, '.gemini', 'settings.json');
}

/**
 * Get the path to the OpenCode config file
 *
 * @param global - If true, return global config path (~/.config/opencode/opencode.json)
 * @param projectDir - Project directory (default: cwd)
 */
export function getOpenCodeMCPConfigPath(global: boolean = false, projectDir: string = process.cwd()): string {
  if (global) {
    return join(homedir(), '.config', 'opencode', 'opencode.json');
  }
  return join(projectDir, 'opencode.json');
}

/**
 * Get the path to the Kiro MCP config file
 *
 * @param global - If true, return global config path (~/.kiro/settings/mcp.json)
 * @param projectDir - Project directory (default: cwd)
 */
export function getKiroMCPConfigPath(global: boolean = false, projectDir: string = process.cwd()): string {
  if (global) {
    return join(homedir(), '.kiro', 'settings', 'mcp.json');
  }
  return join(projectDir, '.kiro', 'settings', 'mcp.json');
}

/**
 * Get the path to the Trae MCP config file
 * Note: Trae only supports project-local configuration
 *
 * @param projectDir - Project directory (default: cwd)
 */
export function getTraeMCPConfigPath(projectDir: string = process.cwd()): string {
  return join(projectDir, '.trae', 'mcp.json');
}

/**
 * Get the path to the Amp MCP config file
 *
 * @param global - If true, return global config path (~/.amp/settings.json)
 * @param projectDir - Project directory (default: cwd)
 */
export function getAmpMCPConfigPath(global: boolean = false, projectDir: string = process.cwd()): string {
  if (global) {
    return join(homedir(), '.amp', 'settings.json');
  }
  return join(projectDir, '.amp', 'settings.json');
}

/**
 * Get the path to the Zed MCP config file
 * Note: Zed only supports global configuration via settings.json
 */
export function getZedMCPConfigPath(): string {
  if (process.platform === 'darwin') {
    return join(homedir(), '.config', 'zed', 'settings.json');
  } else if (process.platform === 'win32') {
    return join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), 'Zed', 'settings.json');
  }
  return join(homedir(), '.config', 'zed', 'settings.json');
}

/**
 * Get the path to the MCP config file for a specific editor
 *
 * @param editor - Target editor
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
    case 'cursor':
      return getCursorMCPConfigPath(global, projectDir);
    case 'windsurf':
      return getWindsurfMCPConfigPath();
    case 'vscode':
      return getVSCodeMCPConfigPath(global, projectDir);
    case 'gemini':
      return getGeminiMCPConfigPath(global, projectDir);
    case 'opencode':
      return getOpenCodeMCPConfigPath(global, projectDir);
    case 'kiro':
      return getKiroMCPConfigPath(global, projectDir);
    case 'trae':
      return getTraeMCPConfigPath(projectDir);
    case 'amp':
      return getAmpMCPConfigPath(global, projectDir);
    case 'zed':
      return getZedMCPConfigPath();
    case 'claude':
    default:
      return getMCPConfigPath(global, projectDir);
  }
}

/**
 * Get human-readable config location string for display
 */
export function getMCPConfigLocation(editor: MCPEditor, global: boolean): string {
  switch (editor) {
    case 'codex':
      return global ? '~/.codex/config.toml' : '.codex/config.toml';
    case 'cursor':
      return global ? '~/.cursor/mcp.json' : '.cursor/mcp.json';
    case 'windsurf':
      return '~/.codeium/windsurf/mcp_config.json';
    case 'vscode': {
      if (!global) return '.vscode/mcp.json';
      if (process.platform === 'win32') return '%APPDATA%/Code/User/mcp.json';
      if (process.platform === 'darwin') return '~/Library/Application Support/Code/User/mcp.json';
      return '~/.config/Code/User/mcp.json';
    }
    case 'gemini':
      return global ? '~/.gemini/settings.json' : '.gemini/settings.json';
    case 'opencode':
      return global ? '~/.config/opencode/opencode.json' : 'opencode.json';
    case 'kiro':
      return global ? '~/.kiro/settings/mcp.json' : '.kiro/settings/mcp.json';
    case 'trae':
      return '.trae/mcp.json';
    case 'amp':
      return global ? '~/.amp/settings.json' : '.amp/settings.json';
    case 'zed':
      return '~/.config/zed/settings.json';
    case 'claude':
    default:
      return global ? '~/.claude/settings.json' : '.mcp.json';
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
 * Read VS Code MCP configuration from file
 *
 * @param configPath - Path to config file
 * @returns Parsed config or empty config if file doesn't exist
 */
export function readVSCodeMCPConfig(configPath: string): VSCodeMCPConfig {
  if (!existsSync(configPath)) {
    return { servers: {} };
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as VSCodeMCPConfig;
  } catch (error) {
    // If file is empty or invalid JSON, return empty config
    return { servers: {} };
  }
}

/**
 * Write VS Code MCP configuration to file
 *
 * @param configPath - Path to config file
 * @param config - Config to write
 */
export function writeVSCodeMCPConfig(configPath: string, config: VSCodeMCPConfig): void {
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
    // Codex expects env vars as --env KEY=VALUE args, not as a nested env object
    const envArgs: string[] = [];
    if (server.env && Object.keys(server.env).length > 0) {
      for (const [key, value] of Object.entries(server.env)) {
        envArgs.push('--env', `${key}=${value}`);
      }
    }
    if (server.args && server.args.length > 0 || envArgs.length > 0) {
      codexServer.args = [...(server.args || []), ...envArgs];
    }
    if (server.cwd) {
      codexServer.cwd = server.cwd;
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
 * Convert standard MCP server config to VS Code format
 *
 * VS Code expects explicit "type" field:
 * - stdio servers: type = "stdio"
 * - http servers: type = "http"
 */
function toVSCodeServerConfig(server: MCPServer): MCPServer {
  const vscodeServer: MCPServer = { ...server };

  if (vscodeServer.command) {
    vscodeServer.type = 'stdio';
  } else if (vscodeServer.url) {
    vscodeServer.type = 'http';
  }

  return vscodeServer;
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
 * Merge MCP servers into VS Code MCP configuration
 *
 * @param servers - MCP servers to merge
 * @param global - If true, merge into global config
 * @param projectDir - Project directory for local config
 */
export function mergeVSCodeMCPServers(
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

  const configPath = getVSCodeMCPConfigPath(global, projectDir);
  const config = readVSCodeMCPConfig(configPath);

  // Ensure servers object exists (VS Code uses "servers", not "mcpServers")
  if (!config.servers) {
    config.servers = {};
  }

  for (const [name, server] of Object.entries(servers)) {
    if (config.servers[name]) {
      // Server already exists - skip and warn
      result.skipped.push(name);
      result.warnings.push(`MCP server '${name}' already exists in VS Code config, keeping existing configuration`);
    } else {
      // Convert to VS Code format and add
      config.servers[name] = toVSCodeServerConfig(server);
      result.added.push(name);
    }
  }

  // Only write if we added something
  if (result.added.length > 0) {
    writeVSCodeMCPConfig(configPath, config);
  }

  return result;
}

/**
 * Remove MCP servers from VS Code MCP configuration
 *
 * @param servers - MCP servers that were installed (original config for comparison)
 * @param global - If true, remove from global config
 * @param projectDir - Project directory for local config
 */
export function removeVSCodeMCPServers(
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

  const configPath = getVSCodeMCPConfigPath(global, projectDir);

  if (!existsSync(configPath)) {
    return result;
  }

  const config = readVSCodeMCPConfig(configPath);

  if (!config.servers) {
    return result;
  }

  for (const [name, originalServer] of Object.entries(servers)) {
    const currentServer = config.servers[name];

    if (!currentServer) {
      // Server doesn't exist (already removed or never installed)
      continue;
    }

    // Convert original to VS Code format for comparison
    const originalVSCodeServer = toVSCodeServerConfig(originalServer);
    if (serversEqual(currentServer, originalVSCodeServer)) {
      // Config unchanged - safe to remove
      delete config.servers[name];
      result.removed.push(name);
    } else {
      // Config modified by user - keep it
      result.kept.push(name);
      result.warnings.push(`Keeping modified MCP server '${name}' in VS Code config`);
    }
  }

  // Clean up empty servers object
  if (Object.keys(config.servers).length === 0) {
    delete config.servers;
  }

  // Only write if we removed something
  if (result.removed.length > 0) {
    writeVSCodeMCPConfig(configPath, config);
  }

  return result;
}

/**
 * Merge MCP servers into configuration for any supported editor
 *
 * @param servers - MCP servers to merge
 * @param editor - Target editor (see MCP_EDITORS for full list)
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
    case 'cursor':
      return mergeCursorMCPServers(servers, global, projectDir);
    case 'windsurf':
      return mergeWindsurfMCPServers(servers);
    case 'vscode':
      return mergeVSCodeMCPServers(servers, global, projectDir);
    case 'gemini':
      return mergeGeminiSettingsMCPServers(servers, global, projectDir);
    case 'opencode':
      return mergeOpenCodeMCPServers(servers, global, projectDir);
    case 'kiro':
      return mergeKiroMCPServers(servers, global, projectDir);
    case 'trae':
      return mergeTraeMCPServers(servers, projectDir);
    case 'amp':
      return mergeAmpMCPServers(servers, global, projectDir);
    case 'zed':
      return mergeZedMCPServers(servers);
    case 'claude':
    default:
      return mergeMCPServers(servers, global, projectDir);
  }
}

/**
 * Remove MCP servers from configuration for any supported editor
 *
 * @param servers - MCP servers that were installed
 * @param editor - Target editor (see MCP_EDITORS for full list)
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
    case 'cursor':
      return removeCursorMCPServers(servers, global, projectDir);
    case 'windsurf':
      return removeWindsurfMCPServers(servers);
    case 'vscode':
      return removeVSCodeMCPServers(servers, global, projectDir);
    case 'gemini':
      return removeGeminiSettingsMCPServers(servers, global, projectDir);
    case 'opencode':
      return removeOpenCodeMCPServers(servers, global, projectDir);
    case 'kiro':
      return removeKiroMCPServers(servers, global, projectDir);
    case 'trae':
      return removeTraeMCPServers(servers, projectDir);
    case 'amp':
      return removeAmpMCPServers(servers, global, projectDir);
    case 'zed':
      return removeZedMCPServers(servers);
    case 'claude':
    default:
      return removeMCPServers(servers, global, projectDir);
  }
}

/**
 * Internal: Merge MCP servers into a JSON config file using mcpServers key
 * Shared by Claude, Cursor, Windsurf, Gemini, Kiro, and Trae (all use same format)
 */
function mergeMCPServersToPath(
  servers: Record<string, MCPServer>,
  configPath: string
): MCPMergeResult {
  const result: MCPMergeResult = {
    added: [],
    skipped: [],
    warnings: [],
  };

  if (!servers || Object.keys(servers).length === 0) {
    return result;
  }

  const config = readMCPConfig(configPath);

  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  for (const [name, server] of Object.entries(servers)) {
    if (config.mcpServers[name]) {
      result.skipped.push(name);
      result.warnings.push(`MCP server '${name}' already exists, keeping existing configuration`);
    } else {
      config.mcpServers[name] = server;
      result.added.push(name);
    }
  }

  if (result.added.length > 0) {
    writeMCPConfig(configPath, config);
  }

  return result;
}

/**
 * Internal: Remove MCP servers from a JSON config file using mcpServers key
 * Shared by Claude, Cursor, Windsurf, Gemini, Kiro, and Trae (all use same format)
 */
function removeMCPServersFromPath(
  servers: Record<string, MCPServer>,
  configPath: string
): MCPRemoveResult {
  const result: MCPRemoveResult = {
    removed: [],
    kept: [],
    warnings: [],
  };

  if (!servers || Object.keys(servers).length === 0) {
    return result;
  }

  if (!existsSync(configPath)) {
    return result;
  }

  const config = readMCPConfig(configPath);

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
      result.warnings.push(`Keeping modified MCP server '${name}'`);
    }
  }

  if (Object.keys(config.mcpServers).length === 0) {
    delete config.mcpServers;
  }

  if (result.removed.length > 0) {
    writeMCPConfig(configPath, config);
  }

  return result;
}

/**
 * Merge MCP servers into Claude configuration
 */
export function mergeMCPServers(
  servers: Record<string, MCPServer>,
  global: boolean = false,
  projectDir: string = process.cwd()
): MCPMergeResult {
  return mergeMCPServersToPath(servers, getMCPConfigPath(global, projectDir));
}

/**
 * Remove MCP servers from Claude configuration
 */
export function removeMCPServers(
  servers: Record<string, MCPServer>,
  global: boolean = false,
  projectDir: string = process.cwd()
): MCPRemoveResult {
  return removeMCPServersFromPath(servers, getMCPConfigPath(global, projectDir));
}

/**
 * Merge MCP servers into Cursor configuration
 * Cursor uses the same JSON format as Claude (mcpServers key)
 */
export function mergeCursorMCPServers(
  servers: Record<string, MCPServer>,
  global: boolean = false,
  projectDir: string = process.cwd()
): MCPMergeResult {
  return mergeMCPServersToPath(servers, getCursorMCPConfigPath(global, projectDir));
}

/**
 * Remove MCP servers from Cursor configuration
 */
export function removeCursorMCPServers(
  servers: Record<string, MCPServer>,
  global: boolean = false,
  projectDir: string = process.cwd()
): MCPRemoveResult {
  return removeMCPServersFromPath(servers, getCursorMCPConfigPath(global, projectDir));
}

/**
 * Merge MCP servers into Windsurf configuration
 * Windsurf uses the same JSON format as Claude but only supports global config
 */
export function mergeWindsurfMCPServers(
  servers: Record<string, MCPServer>,
): MCPMergeResult {
  return mergeMCPServersToPath(servers, getWindsurfMCPConfigPath());
}

/**
 * Remove MCP servers from Windsurf configuration
 */
export function removeWindsurfMCPServers(
  servers: Record<string, MCPServer>,
): MCPRemoveResult {
  return removeMCPServersFromPath(servers, getWindsurfMCPConfigPath());
}

/**
 * Read OpenCode MCP configuration from file
 */
export function readOpenCodeConfig(configPath: string): OpenCodeMCPConfig {
  if (!existsSync(configPath)) {
    return { mcp: {} };
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as OpenCodeMCPConfig;
  } catch (error) {
    return { mcp: {} };
  }
}

/**
 * Write OpenCode MCP configuration to file
 */
export function writeOpenCodeConfig(configPath: string, config: OpenCodeMCPConfig): void {
  const dir = dirname(configPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
}

/**
 * Convert standard MCP server config to OpenCode format
 * OpenCode uses type: "local" for stdio servers
 */
function toOpenCodeServerConfig(server: MCPServer): OpenCodeMCPServer {
  const ocServer: OpenCodeMCPServer = {};

  if (server.command) {
    ocServer.type = 'local';
    ocServer.command = server.command;
    if (server.args && server.args.length > 0) {
      ocServer.args = server.args;
    }
    if (server.env && Object.keys(server.env).length > 0) {
      ocServer.env = server.env;
    }
  }

  if (server.url) {
    ocServer.url = server.url;
  }

  return ocServer;
}

/**
 * Merge MCP servers into OpenCode configuration
 */
export function mergeOpenCodeMCPServers(
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

  const configPath = getOpenCodeMCPConfigPath(global, projectDir);
  const config = readOpenCodeConfig(configPath);

  if (!config.mcp) {
    config.mcp = {};
  }

  for (const [name, server] of Object.entries(servers)) {
    if (config.mcp[name]) {
      result.skipped.push(name);
      result.warnings.push(`MCP server '${name}' already exists in OpenCode config, keeping existing configuration`);
    } else {
      config.mcp[name] = toOpenCodeServerConfig(server);
      result.added.push(name);
    }
  }

  if (result.added.length > 0) {
    writeOpenCodeConfig(configPath, config);
  }

  return result;
}

/**
 * Remove MCP servers from OpenCode configuration
 */
export function removeOpenCodeMCPServers(
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

  const configPath = getOpenCodeMCPConfigPath(global, projectDir);

  if (!existsSync(configPath)) {
    return result;
  }

  const config = readOpenCodeConfig(configPath);

  if (!config.mcp) {
    return result;
  }

  for (const [name, originalServer] of Object.entries(servers)) {
    const currentServer = config.mcp[name];

    if (!currentServer) {
      continue;
    }

    const originalOCServer = toOpenCodeServerConfig(originalServer);
    if (serversEqual(currentServer as unknown as MCPServer, originalOCServer as unknown as MCPServer)) {
      delete config.mcp[name];
      result.removed.push(name);
    } else {
      result.kept.push(name);
      result.warnings.push(`Keeping modified MCP server '${name}' in OpenCode config`);
    }
  }

  if (Object.keys(config.mcp).length === 0) {
    delete config.mcp;
  }

  if (result.removed.length > 0) {
    writeOpenCodeConfig(configPath, config);
  }

  return result;
}

/**
 * Merge MCP servers into Kiro settings
 * Kiro uses the same mcpServers format as Claude
 */
export function mergeKiroMCPServers(
  servers: Record<string, MCPServer>,
  global: boolean = false,
  projectDir: string = process.cwd()
): MCPMergeResult {
  return mergeMCPServersToPath(servers, getKiroMCPConfigPath(global, projectDir));
}

/**
 * Remove MCP servers from Kiro settings
 */
export function removeKiroMCPServers(
  servers: Record<string, MCPServer>,
  global: boolean = false,
  projectDir: string = process.cwd()
): MCPRemoveResult {
  return removeMCPServersFromPath(servers, getKiroMCPConfigPath(global, projectDir));
}

/**
 * Merge MCP servers into Trae configuration
 * Trae uses the same mcpServers format as Claude, project-local only
 */
export function mergeTraeMCPServers(
  servers: Record<string, MCPServer>,
  projectDir: string = process.cwd()
): MCPMergeResult {
  return mergeMCPServersToPath(servers, getTraeMCPConfigPath(projectDir));
}

/**
 * Remove MCP servers from Trae configuration
 */
export function removeTraeMCPServers(
  servers: Record<string, MCPServer>,
  projectDir: string = process.cwd()
): MCPRemoveResult {
  return removeMCPServersFromPath(servers, getTraeMCPConfigPath(projectDir));
}

/**
 * Read Amp MCP configuration from file
 */
export function readAmpConfig(configPath: string): AmpMCPConfig {
  if (!existsSync(configPath)) {
    return { 'amp.mcpServers': {} };
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as AmpMCPConfig;
  } catch (error) {
    return { 'amp.mcpServers': {} };
  }
}

/**
 * Write Amp MCP configuration to file
 */
export function writeAmpConfig(configPath: string, config: AmpMCPConfig): void {
  const dir = dirname(configPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
}

/**
 * Merge MCP servers into Amp configuration
 * Amp uses "amp.mcpServers" dotted key
 */
export function mergeAmpMCPServers(
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

  const configPath = getAmpMCPConfigPath(global, projectDir);
  const config = readAmpConfig(configPath);

  if (!config['amp.mcpServers']) {
    config['amp.mcpServers'] = {};
  }

  for (const [name, server] of Object.entries(servers)) {
    if (config['amp.mcpServers'][name]) {
      result.skipped.push(name);
      result.warnings.push(`MCP server '${name}' already exists in Amp config, keeping existing configuration`);
    } else {
      config['amp.mcpServers'][name] = server;
      result.added.push(name);
    }
  }

  if (result.added.length > 0) {
    writeAmpConfig(configPath, config);
  }

  return result;
}

/**
 * Remove MCP servers from Amp configuration
 */
export function removeAmpMCPServers(
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

  const configPath = getAmpMCPConfigPath(global, projectDir);

  if (!existsSync(configPath)) {
    return result;
  }

  const config = readAmpConfig(configPath);

  if (!config['amp.mcpServers']) {
    return result;
  }

  for (const [name, originalServer] of Object.entries(servers)) {
    const currentServer = config['amp.mcpServers'][name];

    if (!currentServer) {
      continue;
    }

    if (serversEqual(currentServer, originalServer)) {
      delete config['amp.mcpServers'][name];
      result.removed.push(name);
    } else {
      result.kept.push(name);
      result.warnings.push(`Keeping modified MCP server '${name}' in Amp config`);
    }
  }

  if (Object.keys(config['amp.mcpServers']).length === 0) {
    delete config['amp.mcpServers'];
  }

  if (result.removed.length > 0) {
    writeAmpConfig(configPath, config);
  }

  return result;
}

/**
 * Read Zed MCP configuration from settings.json
 */
export function readZedConfig(configPath: string): ZedMCPConfig {
  if (!existsSync(configPath)) {
    return { context_servers: {} };
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as ZedMCPConfig;
  } catch (error) {
    return { context_servers: {} };
  }
}

/**
 * Write Zed MCP configuration to settings.json
 */
export function writeZedConfig(configPath: string, config: ZedMCPConfig): void {
  const dir = dirname(configPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
}

/**
 * Convert standard MCP server config to Zed format
 * Zed uses command/args/env directly (similar but no type field)
 */
function toZedServerConfig(server: MCPServer): ZedMCPServer {
  const zedServer: ZedMCPServer = {};

  if (server.command) {
    zedServer.command = server.command;
    if (server.args && server.args.length > 0) {
      zedServer.args = server.args;
    }
    if (server.env && Object.keys(server.env).length > 0) {
      zedServer.env = server.env;
    }
  }

  if (server.url) {
    zedServer.url = server.url;
  }

  return zedServer;
}

/**
 * Merge MCP servers into Zed configuration
 * Zed uses "context_servers" key and only supports global config
 */
export function mergeZedMCPServers(
  servers: Record<string, MCPServer>,
): MCPMergeResult {
  const result: MCPMergeResult = {
    added: [],
    skipped: [],
    warnings: [],
  };

  if (!servers || Object.keys(servers).length === 0) {
    return result;
  }

  const configPath = getZedMCPConfigPath();
  const config = readZedConfig(configPath);

  if (!config.context_servers) {
    config.context_servers = {};
  }

  for (const [name, server] of Object.entries(servers)) {
    if (config.context_servers[name]) {
      result.skipped.push(name);
      result.warnings.push(`MCP server '${name}' already exists in Zed config, keeping existing configuration`);
    } else {
      config.context_servers[name] = toZedServerConfig(server);
      result.added.push(name);
    }
  }

  if (result.added.length > 0) {
    writeZedConfig(configPath, config);
  }

  return result;
}

/**
 * Remove MCP servers from Zed configuration
 */
export function removeZedMCPServers(
  servers: Record<string, MCPServer>,
): MCPRemoveResult {
  const result: MCPRemoveResult = {
    removed: [],
    kept: [],
    warnings: [],
  };

  if (!servers || Object.keys(servers).length === 0) {
    return result;
  }

  const configPath = getZedMCPConfigPath();

  if (!existsSync(configPath)) {
    return result;
  }

  const config = readZedConfig(configPath);

  if (!config.context_servers) {
    return result;
  }

  for (const [name, originalServer] of Object.entries(servers)) {
    const currentServer = config.context_servers[name];

    if (!currentServer) {
      continue;
    }

    const originalZedServer = toZedServerConfig(originalServer);
    if (serversEqual(currentServer as unknown as MCPServer, originalZedServer as unknown as MCPServer)) {
      delete config.context_servers[name];
      result.removed.push(name);
    } else {
      result.kept.push(name);
      result.warnings.push(`Keeping modified MCP server '${name}' in Zed config`);
    }
  }

  if (Object.keys(config.context_servers).length === 0) {
    delete config.context_servers;
  }

  if (result.removed.length > 0) {
    writeZedConfig(configPath, config);
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
 * Merge MCP servers into Gemini CLI settings.json
 * Used by the --editor gemini flag. Gemini settings.json uses { mcpServers } format.
 */
export function mergeGeminiSettingsMCPServers(
  servers: Record<string, MCPServer>,
  global: boolean = false,
  projectDir: string = process.cwd()
): MCPMergeResult {
  return mergeMCPServersToPath(servers, getGeminiMCPConfigPath(global, projectDir));
}

/**
 * Remove MCP servers from Gemini CLI settings.json
 */
export function removeGeminiSettingsMCPServers(
  servers: Record<string, MCPServer>,
  global: boolean = false,
  projectDir: string = process.cwd()
): MCPRemoveResult {
  return removeMCPServersFromPath(servers, getGeminiMCPConfigPath(global, projectDir));
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
