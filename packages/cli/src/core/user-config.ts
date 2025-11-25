/**
 * User configuration management for ~/.prpmrc and .prpmrc
 * Stores global settings like registry URL and authentication token
 * Supports both user-level (~/.prpmrc) and repository-level (.prpmrc) config
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface CursorMDCConfig {
  version?: string;
  globs?: string[];
  alwaysApply?: boolean;
  author?: string;
  tags?: string[];
}

export interface ClaudeAgentConfig {
  /** Tools available to the agent (comma-separated). If omitted, inherits all tools */
  tools?: string;
  /** Model to use: 'sonnet', 'opus', 'haiku', or 'inherit' */
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
}

export interface CollectionsConfig {
  /** List of installed collections */
  installed?: string[];
  /** Preferred formats for collection installation */
  preferredFormats?: string[];
  /** Default category for browsing */
  defaultCategory?: string;
  /** Prefer official collections in search results */
  preferOfficial?: boolean;
  /** Auto-update collections */
  autoUpdate?: boolean;
  /** Tags to include when searching */
  includeTags?: string[];
  /** Tags to exclude when searching */
  excludeTags?: string[];
  /** Auto-install collections from config */
  autoInstall?: boolean;
}

export interface UserConfig {
  registryUrl?: string;
  token?: string;
  username?: string;
  userId?: string;
  email?: string;
  telemetryEnabled?: boolean;
  defaultFormat?: 'cursor' | 'claude' | 'continue' | 'windsurf' | 'canonical';
  /** Cursor MDC header configuration */
  cursor?: CursorMDCConfig;
  /** Claude agent header configuration */
  claude?: ClaudeAgentConfig;
  /** Collections configuration */
  collections?: CollectionsConfig;
}

const USER_CONFIG_FILE = join(homedir(), '.prpmrc');
const REPO_CONFIG_FILE = '.prpmrc';
const DEFAULT_REGISTRY_URL = 'https://registry.prpm.dev';

/**
 * Load configuration from a file
 */
async function loadConfigFile(filePath: string): Promise<UserConfig | null> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as UserConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw new Error(`Failed to read config from ${filePath}: ${error}`);
  }
}

/**
 * Get merged configuration from user and repository levels
 * Priority: CLI flags > environment > repo config > user config > defaults
 */
export async function getConfig(): Promise<UserConfig> {
  // Load user-level config (~/.prpmrc)
  const userConfig = await loadConfigFile(USER_CONFIG_FILE);

  // Load repository-level config (./prpmrc)
  const repoConfigPath = join(process.cwd(), REPO_CONFIG_FILE);
  const repoConfig = await loadConfigFile(repoConfigPath);

  // Merge configs (repo overrides user)
  const config: UserConfig = {
    ...userConfig,
    ...repoConfig,
  };

  // Deep merge nested objects
  if (userConfig?.cursor || repoConfig?.cursor) {
    config.cursor = {
      ...userConfig?.cursor,
      ...repoConfig?.cursor,
    };
  }

  if (userConfig?.claude || repoConfig?.claude) {
    config.claude = {
      ...userConfig?.claude,
      ...repoConfig?.claude,
    };
  }

  if (userConfig?.collections || repoConfig?.collections) {
    config.collections = {
      ...userConfig?.collections,
      ...repoConfig?.collections,
    };
  }

  // Allow environment variable to override registry URL
  if (process.env.PRPM_REGISTRY_URL) {
    config.registryUrl = process.env.PRPM_REGISTRY_URL;
  } else if (!config.registryUrl) {
    config.registryUrl = DEFAULT_REGISTRY_URL;
  }

  // Set defaults
  if (config.telemetryEnabled === undefined) {
    config.telemetryEnabled = true;
  }

  return config;
}

/**
 * Save user configuration to ~/.prpmrc
 */
export async function saveConfig(config: UserConfig): Promise<void> {
  try {
    const data = JSON.stringify(config, null, 2);
    await fs.writeFile(USER_CONFIG_FILE, data, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to save user config: ${error}`);
  }
}

/**
 * Save repository configuration to ./.prpmrc
 */
export async function saveRepoConfig(config: UserConfig): Promise<void> {
  try {
    const repoConfigPath = join(process.cwd(), REPO_CONFIG_FILE);
    const data = JSON.stringify(config, null, 2);
    await fs.writeFile(repoConfigPath, data, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to save repository config: ${error}`);
  }
}

/**
 * Get repository-level configuration only
 */
export async function getRepoConfig(): Promise<UserConfig | null> {
  const repoConfigPath = join(process.cwd(), REPO_CONFIG_FILE);
  return await loadConfigFile(repoConfigPath);
}

/**
 * Get user-level configuration only
 */
export async function getUserConfig(): Promise<UserConfig | null> {
  return await loadConfigFile(USER_CONFIG_FILE);
}

/**
 * Update specific config values
 */
export async function updateConfig(updates: Partial<UserConfig>): Promise<void> {
  const config = await getConfig();
  const newConfig = { ...config, ...updates };
  await saveConfig(newConfig);
}

/**
 * Clear authentication (logout)
 */
export async function clearAuth(): Promise<void> {
  const config = await getConfig();
  delete config.token;
  delete config.username;
  delete config.userId;
  delete config.email;
  await saveConfig(config);
}

/**
 * Get registry URL (with fallback to default)
 */
export async function getRegistryUrl(): Promise<string> {
  const config = await getConfig();
  return config.registryUrl || DEFAULT_REGISTRY_URL;
}
