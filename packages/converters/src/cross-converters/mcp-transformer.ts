/**
 * MCP Transformer
 *
 * Utility for transforming MCP (Model Context Protocol) server configurations
 * between different AI coding assistants.
 *
 * Supported formats:
 * - Gemini: mcpServers in gemini-extension.json
 * - Claude: mcpServers in claude_desktop_config.json or plugin.json
 * - Kiro: mcpServers in .kiro/agents/*.json (with optional timeout field)
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
 * Kiro-specific MCP server configuration (includes timeout)
 */
export interface KiroMCPServerConfig extends MCPServerConfig {
  timeout?: number;
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
 * Kiro-specific MCP servers structure
 */
export interface KiroMCPServers {
  [serverName: string]: KiroMCPServerConfig;
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
        val => typeof val === 'string' && (val.includes('${extensionPath}') || val.includes('${home}'))
      );

      if (hasGeminiVars) {
        warnings.push(
          `MCP server '${name}' uses Gemini variable substitutions (\${extensionPath}, \${home}). ` +
          `Claude uses different variable syntax - manual adjustment may be needed.`
        );
        lossless = false;
      }
    }

    if (config.disabled !== undefined) {
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

    if (config.disabled !== undefined) {
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

  // Check env is either undefined or a non-null object
  if (config.env !== undefined && (typeof config.env !== 'object' || config.env === null)) {
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

/**
 * Transform Kiro MCP servers to Claude format
 *
 * @param kiroServers - MCP servers from Kiro agent
 * @returns Transformed servers with warnings
 */
export function kiroToClaudeMCP(
  kiroServers: KiroMCPServers
): TransformResult<ClaudeMCPServers> {
  const warnings: string[] = [];
  const servers: ClaudeMCPServers = {};
  let lossless = true;

  for (const [name, config] of Object.entries(kiroServers)) {
    servers[name] = {
      command: config.command,
    };

    if (config.args) {
      servers[name].args = [...config.args];
    }

    if (config.env) {
      servers[name].env = { ...config.env };
    }

    if (config.disabled !== undefined) {
      servers[name].disabled = config.disabled;
    }

    // Kiro-specific timeout field is not supported in Claude
    if (config.timeout !== undefined) {
      warnings.push(
        `MCP server '${name}' has timeout=${config.timeout}ms which is not supported in Claude format. This field will be lost.`
      );
      lossless = false;
    }
  }

  return {
    servers,
    warnings,
    lossless,
  };
}

/**
 * Transform Claude MCP servers to Kiro format
 *
 * @param claudeServers - MCP servers from Claude plugin
 * @returns Transformed servers with warnings
 */
export function claudeToKiroMCP(
  claudeServers: ClaudeMCPServers
): TransformResult<KiroMCPServers> {
  const warnings: string[] = [];
  const servers: KiroMCPServers = {};
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
    }

    if (config.disabled !== undefined) {
      servers[name].disabled = config.disabled;
    }

    // Note: timeout is not set as it's not available in Claude format
    // Users can manually add it if needed
  }

  return {
    servers,
    warnings,
    lossless,
  };
}

/**
 * Transform Kiro MCP servers to Gemini format
 *
 * @param kiroServers - MCP servers from Kiro agent
 * @returns Transformed servers with warnings
 */
export function kiroToGeminiMCP(
  kiroServers: KiroMCPServers
): TransformResult<GeminiMCPServers> {
  const warnings: string[] = [];
  const servers: GeminiMCPServers = {};
  let lossless = true;

  for (const [name, config] of Object.entries(kiroServers)) {
    servers[name] = {
      command: config.command,
    };

    if (config.args) {
      servers[name].args = [...config.args];
    }

    if (config.env) {
      servers[name].env = { ...config.env };
    }

    if (config.disabled !== undefined) {
      servers[name].disabled = config.disabled;
    }

    // Kiro-specific timeout field is not supported in Gemini
    if (config.timeout !== undefined) {
      warnings.push(
        `MCP server '${name}' has timeout=${config.timeout}ms which is not supported in Gemini format. This field will be lost.`
      );
      lossless = false;
    }
  }

  return {
    servers,
    warnings,
    lossless,
  };
}

/**
 * Transform Gemini MCP servers to Kiro format
 *
 * @param geminiServers - MCP servers from Gemini extension
 * @returns Transformed servers with warnings
 */
export function geminiToKiroMCP(
  geminiServers: GeminiMCPServers
): TransformResult<KiroMCPServers> {
  const warnings: string[] = [];
  const servers: KiroMCPServers = {};
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
        val => typeof val === 'string' && (val.includes('${extensionPath}') || val.includes('${home}'))
      );

      if (hasGeminiVars) {
        warnings.push(
          `MCP server '${name}' uses Gemini variable substitutions (\${extensionPath}, \${home}). ` +
          `These may need manual adjustment for Kiro.`
        );
        lossless = false;
      }
    }

    if (config.disabled !== undefined) {
      servers[name].disabled = config.disabled;
    }

    // Note: timeout is not set as it's not available in Gemini format
    // Users can manually add it if needed
  }

  return {
    servers,
    warnings,
    lossless,
  };
}

/**
 * Environment variable translation mappings
 *
 * Kiro uses standard env vars similar to Claude (${HOME}, etc.)
 * Gemini uses its own syntax (${extensionPath}, ${home})
 */
const ENV_VAR_MAPPINGS: Record<string, Record<string, string>> = {
  'gemini-to-claude': {
    '${extensionPath}': '${CLAUDE_EXTENSIONS_PATH}',
    '${home}': '${HOME}',
  },
  'claude-to-gemini': {
    '${CLAUDE_EXTENSIONS_PATH}': '${extensionPath}',
    '${HOME}': '${home}',
    '%APPDATA%': '${home}',
  },
  // Kiro uses standard env vars similar to Claude
  'gemini-to-kiro': {
    '${extensionPath}': '${KIRO_EXTENSIONS_PATH}',
    '${home}': '${HOME}',
  },
  'kiro-to-gemini': {
    '${KIRO_EXTENSIONS_PATH}': '${extensionPath}',
    '${HOME}': '${home}',
    '%APPDATA%': '${home}',
  },
  // Claude and Kiro use similar env var conventions, minimal translation needed
  'kiro-to-claude': {
    '${KIRO_EXTENSIONS_PATH}': '${CLAUDE_EXTENSIONS_PATH}',
  },
  'claude-to-kiro': {
    '${CLAUDE_EXTENSIONS_PATH}': '${KIRO_EXTENSIONS_PATH}',
  },
};

/**
 * Translate environment variable syntax between formats
 *
 * @param envValue - Environment variable value to translate
 * @param direction - Translation direction
 * @returns Translated value and whether translation occurred
 */
export function translateEnvVar(
  envValue: string,
  direction: 'gemini-to-claude' | 'claude-to-gemini' | 'kiro-to-claude' | 'claude-to-kiro' | 'gemini-to-kiro' | 'kiro-to-gemini'
): { value: string; translated: boolean } {
  let translated = false;
  let value = envValue;

  // Get mappings for this direction (if available)
  const mappings = ENV_VAR_MAPPINGS[direction];
  if (mappings) {
    for (const [from, to] of Object.entries(mappings)) {
      if (value.includes(from)) {
        value = value.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
        translated = true;
      }
    }
  }

  return { value, translated };
}

/**
 * Translate all environment variables in an MCP server config
 *
 * @param config - MCP server config
 * @param direction - Translation direction
 * @returns Translated config and list of warnings
 */
export function translateMCPServerEnv(
  config: MCPServerConfig | KiroMCPServerConfig,
  direction: 'gemini-to-claude' | 'claude-to-gemini' | 'kiro-to-claude' | 'claude-to-kiro' | 'gemini-to-kiro' | 'kiro-to-gemini'
): { config: MCPServerConfig | KiroMCPServerConfig; warnings: string[] } {
  const warnings: string[] = [];

  if (!config.env) {
    return { config, warnings };
  }

  const translatedEnv: Record<string, string> = {};
  let anyTranslated = false;

  for (const [key, value] of Object.entries(config.env)) {
    const { value: translatedValue, translated } = translateEnvVar(value, direction);
    translatedEnv[key] = translatedValue;
    if (translated) {
      anyTranslated = true;
    }
  }

  if (anyTranslated) {
    warnings.push(`Environment variables were automatically translated for target format`);
  }

  return {
    config: { ...config, env: translatedEnv },
    warnings,
  };
}
