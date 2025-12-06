/**
 * MCP Transformer
 *
 * Utility for transforming MCP (Model Context Protocol) server configurations
 * between Gemini extensions and Claude plugins.
 *
 * Both formats use nearly identical MCP server structures:
 * - Gemini: mcpServers in gemini-extension.json
 * - Claude: mcpServers in claude_desktop_config.json or plugin.json
 *
 * Compatibility: 85-95% lossless conversion
 */

/**
 * MCP Server configuration structure (shared between Gemini and Claude)
 */
export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  disabled?: boolean;
}

/**
 * Gemini-specific MCP servers structure
 */
export interface GeminiMCPServers {
  [serverName: string]: MCPServerConfig;
}

/**
 * Claude-specific MCP servers structure
 */
export interface ClaudeMCPServers {
  [serverName: string]: MCPServerConfig;
}

/**
 * Transformation result with warnings
 */
export interface TransformResult<T> {
  servers: T;
  warnings: string[];
  lossless: boolean;
}

/**
 * Transform Gemini MCP servers to Claude format
 *
 * @param geminiServers - MCP servers from Gemini extension
 * @returns Transformed servers with warnings
 */
export function geminiToClaudeMCP(
  geminiServers: GeminiMCPServers
): TransformResult<ClaudeMCPServers> {
  const warnings: string[] = [];
  const servers: ClaudeMCPServers = {};
  let lossless = true;

  for (const [name, config] of Object.entries(geminiServers)) {
    servers[name] = {
      command: config.command,
    };

    if (config.args) {
      servers[name].args = [...config.args];
    }

    if (config.env) {
      servers[name].env = { ...config.env };

      // Check for Gemini-specific variable substitutions
      const hasGeminiVars = Object.values(config.env).some(
        val => val.includes('${extensionPath}') || val.includes('${home}')
      );

      if (hasGeminiVars) {
        warnings.push(
          `MCP server '${name}' uses Gemini variable substitutions (\${extensionPath}, \${home}). ` +
          `Claude uses different variable syntax - manual adjustment may be needed.`
        );
        lossless = false;
      }
    }

    if (config.disabled) {
      servers[name].disabled = config.disabled;
    }
  }

  return {
    servers,
    warnings,
    lossless,
  };
}

/**
 * Transform Claude MCP servers to Gemini format
 *
 * @param claudeServers - MCP servers from Claude plugin
 * @returns Transformed servers with warnings
 */
export function claudeToGeminiMCP(
  claudeServers: ClaudeMCPServers
): TransformResult<GeminiMCPServers> {
  const warnings: string[] = [];
  const servers: GeminiMCPServers = {};
  let lossless = true;

  for (const [name, config] of Object.entries(claudeServers)) {
    servers[name] = {
      command: config.command,
    };

    if (config.args) {
      servers[name].args = [...config.args];
    }

    if (config.env) {
      servers[name].env = { ...config.env };

      // Check for Claude-specific patterns
      const hasClaudePatterns = Object.values(config.env).some(
        val => val.includes('${CLAUDE_') || val.includes('%APPDATA%')
      );

      if (hasClaudePatterns) {
        warnings.push(
          `MCP server '${name}' uses Claude-specific patterns. ` +
          `Consider using Gemini variable syntax: \${extensionPath}, \${home}`
        );
        lossless = false;
      }
    }

    if (config.disabled) {
      servers[name].disabled = config.disabled;
    }
  }

  return {
    servers,
    warnings,
    lossless,
  };
}

/**
 * Validate MCP server configuration
 *
 * @param config - MCP server config to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateMCPServer(config: MCPServerConfig): string[] {
  const errors: string[] = [];

  if (!config.command) {
    errors.push('MCP server must have a command');
  }

  if (config.args && !Array.isArray(config.args)) {
    errors.push('MCP server args must be an array');
  }

  if (config.env && typeof config.env !== 'object') {
    errors.push('MCP server env must be an object');
  }

  if (config.disabled !== undefined && typeof config.disabled !== 'boolean') {
    errors.push('MCP server disabled must be a boolean');
  }

  return errors;
}

/**
 * Merge multiple MCP server configurations
 * Useful when combining servers from multiple sources
 *
 * @param serverSets - Multiple server configuration objects to merge
 * @returns Merged servers with conflict warnings
 */
export function mergeMCPServers(
  ...serverSets: (GeminiMCPServers | ClaudeMCPServers)[]
): TransformResult<GeminiMCPServers> {
  const warnings: string[] = [];
  const servers: GeminiMCPServers = {};
  let lossless = true;

  for (const serverSet of serverSets) {
    for (const [name, config] of Object.entries(serverSet)) {
      if (servers[name]) {
        warnings.push(
          `MCP server '${name}' defined multiple times. Using latest definition.`
        );
        lossless = false;
      }
      servers[name] = { ...config };
    }
  }

  return {
    servers,
    warnings,
    lossless,
  };
}
