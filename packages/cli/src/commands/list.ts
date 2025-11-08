/**
 * List command implementation
 */

import { Command } from 'commander';
import { listPackages } from '../core/lockfile';
import type { LockfilePackage } from '../core/lockfile';
import { telemetry } from '../core/telemetry';
import { promises as fs } from 'fs';
import path from 'path';
import { CLIError } from '../core/errors';
import { Format, Subtype } from '../types';

/**
 * Get destination directory based on package type
 */
function getDestinationDir(type: string): string {
  switch (type) {
    case 'cursor':
      return '.cursor/rules';
    case 'claude':
      return '.claude/agents';
    case 'claude-agent':
      return '.claude/agents';
    case 'claude-skill':
      return '.claude/skills';
    case 'claude-slash-command':
      return '.claude/commands';
    case 'continue':
      return '.continue/rules';
    case 'windsurf':
      return '.windsurf/rules';
    case 'agents.md':
      return '.agents';
    case 'generic':
      return '.prompts';
    case 'mcp':
      return '.mcp';
    default:
      return '.prompts';
  }
}

/**
 * Strip author namespace from package ID
 */
function stripAuthorNamespace(packageId: string): string {
  const parts = packageId.split('/');
  return parts[parts.length - 1];
}

/**
 * Find the actual file location for a package
 */
async function findPackageLocation(id: string, format?: string, subtype?: string): Promise<string | null> {
  if (!format) return null;

  const baseDir = getDestinationDir(format);

  // Strip author namespace to get actual package name used in file system
  const packageName = stripAuthorNamespace(id);

  // Try different file extensions based on format
  const extensions = format === 'cursor' ? ['.mdc', '.md'] : ['.md'];

  // Try direct file: <dir>/<packageName>.ext
  for (const ext of extensions) {
    const directPath = path.join(baseDir, `${packageName}${ext}`);
    try {
      await fs.access(directPath);
      return directPath;
    } catch {
      // File doesn't exist, continue
    }
  }

  // Try subdirectory: <dir>/<packageName>/SKILL.md or <dir>/<packageName>/AGENT.md
  if (subtype === 'skill') {
    const skillPath = path.join(baseDir, packageName, 'SKILL.md');
    try {
      await fs.access(skillPath);
      return skillPath;
    } catch {
      // Not found
    }
  }

  if (subtype === 'agent' || format === 'claude') {
    const agentPath = path.join(baseDir, packageName, 'AGENT.md');
    try {
      await fs.access(agentPath);
      return agentPath;
    } catch {
      // Not found
    }
  }

  return null;
}

/**
 * Display packages in a formatted table
 */
async function displayPackages(packages: Array<LockfilePackage & { id: string }>): Promise<void> {
  if (packages.length === 0) {
    console.log('📦 No packages installed');
    return;
  }

  console.log('📦 Installed packages:');
  console.log('');

  // Find file locations
  const packagesWithLocations = await Promise.all(
    packages.map(async pkg => ({
      ...pkg,
      location: await findPackageLocation(pkg.id, pkg.format, pkg.subtype)
    }))
  );

  // Helper to format type display
  const formatType = (format?: string, subtype?: string) => {
    if (!format) return '';
    return subtype ? `${format}/${subtype}` : format;
  };

  // Calculate column widths
  const idWidth = Math.max(8, ...packagesWithLocations.map(p => p.id.length));
  const versionWidth = Math.max(7, ...packagesWithLocations.map(p => p.version.length));
  const typeWidth = Math.max(6, ...packagesWithLocations.map(p => formatType(p.format, p.subtype).length));
  const locationWidth = Math.max(8, ...packagesWithLocations.map(p => (p.installedPath || 'N/A').length));

  // Header
  const header = [
    'ID'.padEnd(idWidth),
    'VERSION'.padEnd(versionWidth),
    'TYPE'.padEnd(typeWidth),
    'LOCATION'.padEnd(locationWidth)
  ].join(' | ');

  console.log(header);
  console.log('-'.repeat(header.length));

  // Rows
  packagesWithLocations.forEach(pkg => {
    const row = [
      pkg.id.padEnd(idWidth),
      pkg.version.padEnd(versionWidth),
      formatType(pkg.format, pkg.subtype).padEnd(typeWidth),
      (pkg.installedPath || 'N/A').padEnd(locationWidth)
    ].join(' | ');

    console.log(row);
  });

  console.log('');
  console.log(`Total: ${packages.length} package${packages.length === 1 ? '' : 's'}`);
}

/**
 * Handle the list command
 */
export async function handleList(): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;
  let packageCount = 0;

  try {
    const packages = await listPackages();
    packageCount = packages.length;
    await displayPackages(packages);
    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    throw new CLIError(`❌ Failed to list packages: ${error}`, 1);
  } finally {
    // Track telemetry
    await telemetry.track({
      command: 'list',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        packageCount,
      },
    });
    await telemetry.shutdown();
  }
}

/**
 * Create the list command
 */
export function createListCommand(): Command {
  const command = new Command('list');

  command
    .description('List all installed prompt packages')
    .action(async () => {
      await handleList();
      throw new CLIError('', 0);
    });

  return command;
}
