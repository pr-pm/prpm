/**
 * User configuration management for ~/.prmprc
 * Stores global settings like registry URL and authentication token
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface UserConfig {
  registryUrl?: string;
  token?: string;
  username?: string;
  telemetryEnabled?: boolean;
  defaultFormat?: 'cursor' | 'claude' | 'continue' | 'windsurf' | 'canonical';
}

const CONFIG_FILE = join(homedir(), '.prmprc');
const DEFAULT_REGISTRY_URL = 'https://registry.promptpm.dev';

/**
 * Get user configuration
 */
export async function getConfig(): Promise<UserConfig> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data) as UserConfig;

    // Ensure registryUrl has default
    if (!config.registryUrl) {
      config.registryUrl = DEFAULT_REGISTRY_URL;
    }

    return config;
  } catch (error) {
    // If file doesn't exist, return default config
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        registryUrl: DEFAULT_REGISTRY_URL,
        telemetryEnabled: true,
      };
    }
    throw new Error(`Failed to read user config: ${error}`);
  }
}

/**
 * Save user configuration
 */
export async function saveConfig(config: UserConfig): Promise<void> {
  try {
    const data = JSON.stringify(config, null, 2);
    await fs.writeFile(CONFIG_FILE, data, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to save user config: ${error}`);
  }
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
  await saveConfig(config);
}

/**
 * Get registry URL (with fallback to default)
 */
export async function getRegistryUrl(): Promise<string> {
  const config = await getConfig();
  return config.registryUrl || DEFAULT_REGISTRY_URL;
}
