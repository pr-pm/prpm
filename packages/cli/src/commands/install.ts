/**
 * Install command - Install packages from registry
 */

import { Command } from 'commander';
import { getRegistryClient } from '@prpm/registry-client';
import { getConfig } from '../core/user-config';
import { saveFile, getDestinationDir } from '../core/filesystem';
import { addPackage } from '../core/lockfile';
import { telemetry } from '../core/telemetry';
import { Package, PackageType } from '../types';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGunzip } from 'zlib';
import * as tar from 'tar';
import {
  readLockfile,
  writeLockfile,
  createLockfile,
  addToLockfile,
  setPackageIntegrity,
  getLockedVersion,
} from '../core/lockfile';
import { applyCursorConfig, hasMDCHeader } from '../core/cursor-config';
import { applyClaudeConfig, hasClaudeHeader } from '../core/claude-config';

/**
 * Get icon for package type
 */
function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    'claude-skill': '🎓',
    'claude-agent': '🤖',
    'claude-slash-command': '⚡',
    'claude': '🤖',
    'cursor': '📋',
    'windsurf': '🌊',
    'continue': '➡️',
    'mcp': '🔗',
    'generic': '📦',
    // Legacy mappings
    skill: '🎓',
    agent: '🤖',
    rule: '📋',
    plugin: '🔌',
    prompt: '💬',
    workflow: '⚡',
    tool: '🔧',
    template: '📄',
  };
  return icons[type] || '📦';
}

/**
 * Get human-readable label for package type
 */
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'claude-skill': 'Claude Skill',
    'claude-agent': 'Claude Agent',
    'claude-slash-command': 'Claude Slash Command',
    'claude': 'Claude Agent',
    'cursor': 'Cursor Rule',
    'windsurf': 'Windsurf Rule',
    'continue': 'Continue Rule',
    'mcp': 'MCP Server',
    'generic': 'Package',
    // Legacy mappings
    skill: 'Skill',
    agent: 'Agent',
    rule: 'Rule',
    plugin: 'Plugin',
    prompt: 'Prompt',
    workflow: 'Workflow',
    tool: 'Tool',
    template: 'Template',
  };
  return labels[type] || type;
}

export async function handleInstall(
  packageSpec: string,
  options: { version?: string; type?: PackageType; as?: string; frozenLockfile?: boolean }
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    // Parse package spec (e.g., "react-rules" or "react-rules@1.2.0" or "@prpm/pkg@1.0.0")
    // For scoped packages (@scope/name), the first @ is part of the package name
    let packageId: string;
    let specVersion: string | undefined;

    if (packageSpec.startsWith('@')) {
      // Scoped package: @scope/name or @scope/name@version
      const match = packageSpec.match(/^(@[^/]+\/[^@]+)(?:@(.+))?$/);
      if (!match) {
        throw new Error('Invalid package spec format. Use: @scope/package or @scope/package@version');
      }
      packageId = match[1];
      specVersion = match[2];
    } else {
      // Unscoped package: name or name@version
      const parts = packageSpec.split('@');
      packageId = parts[0];
      specVersion = parts[1];
    }

    // Read existing lock file
    const lockfile = await readLockfile();
    const lockedVersion = getLockedVersion(lockfile, packageId);

    // Determine version to install
    let version: string;
    if (options.frozenLockfile) {
      // Frozen lockfile mode - must use exact locked version
      if (!lockedVersion) {
        throw new Error(`Package ${packageId} not found in lock file. Run without --frozen-lockfile to update.`);
      }
      version = lockedVersion;
    } else {
      // Normal mode - use specified version or locked version or latest
      version = options.version || specVersion || lockedVersion || 'latest';
    }

    console.log(`📥 Installing ${packageId}@${version}...`);

    const config = await getConfig();
    const client = getRegistryClient(config);

    // Determine format preference
    const format = options.as || config.defaultFormat || detectProjectFormat() || 'cursor';
    if (format !== 'canonical') {
      console.log(`   🔄 Converting to ${format} format...`);
    }

    // Get package info
    const pkg = await client.getPackage(packageId);
    const typeIcon = getTypeIcon(pkg.type);
    const typeLabel = getTypeLabel(pkg.type);
    console.log(`   ${pkg.name} ${pkg.official ? '🏅' : ''}`);
    console.log(`   ${pkg.description || 'No description'}`);
    console.log(`   ${typeIcon} Type: ${typeLabel}`);

    // Determine version to install
    let tarballUrl: string;
    if (version === 'latest') {
      if (!pkg.latest_version) {
        throw new Error('No versions available for this package');
      }
      tarballUrl = pkg.latest_version.tarball_url;
      console.log(`   📦 Installing version ${pkg.latest_version.version}`);
    } else {
      const versionInfo = await client.getPackageVersion(packageId, version);
      tarballUrl = versionInfo.tarball_url;
      console.log(`   📦 Installing version ${version}`);
    }

    // Download package in requested format
    console.log(`   ⬇️  Downloading...`);
    const tarball = await client.downloadPackage(tarballUrl, { format });

    // Extract tarball and save files
    console.log(`   📂 Extracting...`);
    // Use format to determine directory, not package type
    const effectiveType = format === 'claude' ? 'claude-skill' :
                          format === 'cursor' ? 'cursor' :
                          format === 'continue' ? 'continue' :
                          format === 'windsurf' ? 'windsurf' :
                          (options.type || pkg.type);
    const destDir = getDestinationDir(effectiveType as PackageType);

    // For MVP, assume single file in tarball
    // TODO: Implement proper tar extraction
    let mainFile = await extractMainFile(tarball, packageId);

    // Determine file extension based on format
    const fileExtension = format === 'cursor' ? 'mdc' : 'md';
    const destPath = `${destDir}/${packageId}.${fileExtension}`;

    // Apply cursor config if downloading in cursor format
    if (format === 'cursor' && hasMDCHeader(mainFile)) {
      if (config.cursor) {
        console.log(`   ⚙️  Applying cursor config...`);
        mainFile = applyCursorConfig(mainFile, config.cursor);
      }
    }

    // Apply Claude config if downloading in Claude format
    if (format === 'claude' && hasClaudeHeader(mainFile)) {
      if (config.claude) {
        console.log(`   ⚙️  Applying Claude agent config...`);
        mainFile = applyClaudeConfig(mainFile, config.claude);
      }
    }

    await saveFile(destPath, mainFile);

    // Update or create lock file
    const updatedLockfile = lockfile || createLockfile();
    const actualVersion = version === 'latest' ? pkg.latest_version?.version : version;

    addToLockfile(updatedLockfile, packageId, {
      version: actualVersion || version,
      tarballUrl,
      type: pkg.type,
      format,
    });

    setPackageIntegrity(updatedLockfile, packageId, tarball);
    await writeLockfile(updatedLockfile);

    // Update lockfile (already done above via addToLockfile + writeLockfile)
    // No need to call addPackage again as it would be redundant

    console.log(`\n✅ Successfully installed ${packageId}`);
    console.log(`   📁 Saved to: ${destPath}`);
    console.log(`   🔒 Lock file updated`);
    console.log(`\n💡 This package has been downloaded ${pkg.total_downloads.toLocaleString()} times`);

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Installation failed: ${error}`);
    console.log(`\n💡 Tips:`);
    console.log(`   - Check package name: prpm search <query>`);
    console.log(`   - Get package info: prpm info <package>`);
    process.exit(1);
  } finally {
    await telemetry.track({
      command: 'install',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        packageId: packageSpec.split('@')[0],
        version: options.version || 'latest',
        type: options.type,
      },
    });
    await telemetry.shutdown();
  }
}

/**
 * Extract main file from tarball
 * TODO: Implement proper tar extraction with tar library
 */
async function extractMainFile(tarball: Buffer, packageId: string): Promise<string> {
  // Placeholder implementation
  // In reality, we need to:
  // 1. Extract tar.gz
  // 2. Find main file (from manifest or naming convention)
  // 3. Return file contents

  // For now, assume tarball is just gzipped content
  const zlib = await import('zlib');
  return new Promise((resolve, reject) => {
    zlib.gunzip(tarball, (err, result) => {
      if (err) reject(err);
      else resolve(result.toString('utf-8'));
    });
  });
}

/**
 * Detect project format from existing directories
 */
function detectProjectFormat(): string | null {
  const fs = require('fs');

  if (fs.existsSync('.cursor/rules') || fs.existsSync('.cursor')) return 'cursor';
  if (fs.existsSync('.claude/agents') || fs.existsSync('.claude')) return 'claude';
  if (fs.existsSync('.continue')) return 'continue';
  if (fs.existsSync('.windsurf')) return 'windsurf';

  return null;
}

export function createInstallCommand(): Command {
  const command = new Command('install');

  command
    .description('Install a package from the registry')
    .argument('<package>', 'Package to install (e.g., react-rules or react-rules@1.2.0)')
    .option('--version <version>', 'Specific version to install')
    .option('--type <type>', 'Override package type (cursor, claude, continue)')
    .option('--as <format>', 'Download in specific format (cursor, claude, continue, windsurf)')
    .option('--frozen-lockfile', 'Fail if lock file needs to be updated (for CI)')
    .action(async (packageSpec: string, options: { format?: string; save?: boolean; dev?: boolean; global?: boolean; type?: string; as?: string; frozenLockfile?: boolean }) => {
      if (options.type && !['cursor', 'claude', 'continue', 'windsurf', 'generic'].includes(options.type)) {
        console.error('❌ Type must be one of: cursor, claude, continue, windsurf, generic');
        process.exit(1);
      }

      if (options.as && !['cursor', 'claude', 'continue', 'windsurf', 'canonical'].includes(options.as)) {
        console.error('❌ Format must be one of: cursor, claude, continue, windsurf, canonical');
        process.exit(1);
      }

      await handleInstall(packageSpec, {
        type: options.type as PackageType | undefined,
        as: options.as,
        frozenLockfile: options.frozenLockfile
      });
    });

  return command;
}
