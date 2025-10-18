/**
 * Configuration management for .promptpm.json
 */

import { promises as fs } from 'fs';
import path from 'path';
import { Config, Package } from '../types';

const CONFIG_FILE = '.promptpm.json';

/**
 * Read the configuration file from the current directory
 */
export async function readConfig(): Promise<Config> {
  try {
    const configPath = path.resolve(CONFIG_FILE);
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data) as Config;
  } catch (error) {
    // If file doesn't exist, return empty config
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { sources: [] };
    }
    throw new Error(`Failed to read config: ${error}`);
  }
}

/**
 * Write the configuration file to the current directory
 */
export async function writeConfig(config: Config): Promise<void> {
  try {
    const configPath = path.resolve(CONFIG_FILE);
    const data = JSON.stringify(config, null, 2);
    await fs.writeFile(configPath, data, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write config: ${error}`);
  }
}

/**
 * Add a package to the configuration
 */
export async function addPackage(pkg: Package): Promise<void> {
  const config = await readConfig();
  
  // Check if package with same ID already exists
  const existingIndex = config.sources.findIndex(p => p.id === pkg.id);
  if (existingIndex >= 0) {
    // Update existing package
    config.sources[existingIndex] = pkg;
  } else {
    // Add new package
    config.sources.push(pkg);
  }
  
  await writeConfig(config);
}

/**
 * Remove a package from the configuration
 */
export async function removePackage(id: string): Promise<Package | null> {
  const config = await readConfig();
  const index = config.sources.findIndex(p => p.id === id);
  
  if (index === -1) {
    return null;
  }
  
  const removed = config.sources.splice(index, 1)[0];
  await writeConfig(config);
  return removed;
}

/**
 * Get a package by ID
 */
export async function getPackage(id: string): Promise<Package | null> {
  const config = await readConfig();
  return config.sources.find(p => p.id === id) || null;
}

/**
 * List all packages
 */
export async function listPackages(): Promise<Package[]> {
  const config = await readConfig();
  return config.sources;
}
