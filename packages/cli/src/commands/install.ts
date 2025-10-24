/**
 * Install command - Install packages from registry
 */

import { Command } from 'commander';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { saveFile, getDestinationDir, stripAuthorNamespace } from '../core/filesystem';
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
import { applyCursorConfig, hasMDCHeader, addMDCHeader } from '../core/cursor-config';
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
    'cursor-agent': '🤖',
    'cursor-slash-command': '⚡',
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
    'cursor-agent': 'Cursor Agent',
    'cursor-slash-command': 'Cursor Slash Command',
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
    // Parse package spec (e.g., "react-rules" or "react-rules@1.2.0" or "@pr-pm/pkg@1.0.0")
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

    // Check if package is already installed
    if (lockfile && lockfile.packages[packageId]) {
      const installedPkg = lockfile.packages[packageId];
      const requestedVersion = options.version || specVersion;

      // If no specific version requested, or same version requested
      if (!requestedVersion || requestedVersion === 'latest' || requestedVersion === installedPkg.version) {
        console.log(`\n✨ Package already installed!`);
        console.log(`   📦 ${packageId}@${installedPkg.version}`);
        console.log(`   🔄 Format: ${installedPkg.format || installedPkg.type || 'unknown'}`);
        console.log(`\n💡 To reinstall or upgrade:`);
        console.log(`   prpm upgrade ${packageId}     # Upgrade to latest version`);
        console.log(`   prpm uninstall ${packageId}   # Uninstall first, then install`);
        success = true;
        return;
      } else if (requestedVersion !== installedPkg.version) {
        // Different version requested - allow upgrade/downgrade
        console.log(`📦 Upgrading ${packageId}: ${installedPkg.version} → ${requestedVersion}`);
      }
    }

    console.log(`📥 Installing ${packageId}@${version}...`);

    const config = await getConfig();
    const client = getRegistryClient(config);

    // Check if this is a collection first (by trying to fetch it)
    // Collections can be: name, scope/name, or @scope/name
    let isCollection = false;
    try {
      // Try to parse as collection
      let scope: string;
      let name_slug: string;

      const matchWithScope = packageId.match(/^@?([^/]+)\/([^/@]+)$/);
      if (matchWithScope) {
        [, scope, name_slug] = matchWithScope;
      } else {
        // No scope, assume 'collection' scope
        scope = 'collection';
        name_slug = packageId;
      }

      // Try to fetch as collection
      await client.getCollection(scope, name_slug, version === 'latest' ? undefined : version);
      isCollection = true;

      // If successful, delegate to collection install handler
      const { handleCollectionInstall } = await import('./collections.js');
      return await handleCollectionInstall(packageId, {
        format: options.as,
        skipOptional: false,
        dryRun: false,
      });
    } catch (err) {
      // Not a collection, continue with package install
      isCollection = false;
    }

    // Get package info
    const pkg = await client.getPackage(packageId);
    const typeIcon = getTypeIcon(pkg.type);
    const typeLabel = getTypeLabel(pkg.type);
    console.log(`   ${pkg.name} ${pkg.official ? '🏅' : ''}`);
    console.log(`   ${pkg.description || 'No description'}`);
    console.log(`   ${typeIcon} Type: ${typeLabel}`);

    // Determine format preference - use package type if no explicit conversion requested
    const format = options.as || pkg.type;
    if (options.as && format !== 'canonical') {
      console.log(`   🔄 Converting to ${format} format...`);
    }

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
    // Determine effective type based on format and original package type
    let effectiveType: PackageType;

    if (format === 'cursor') {
      // Map package types to cursor equivalents
      if (pkg.type === 'claude-slash-command' || pkg.type === 'cursor-slash-command') {
        effectiveType = 'cursor-slash-command';
      } else if (pkg.type === 'claude-agent' || pkg.type === 'cursor-agent') {
        effectiveType = 'cursor-agent';
      } else {
        effectiveType = 'cursor';
      }
    } else if (format === 'claude') {
      // Map package types to claude equivalents
      if (pkg.type === 'cursor-slash-command' || pkg.type === 'claude-slash-command') {
        effectiveType = 'claude-slash-command';
      } else if (pkg.type === 'cursor-agent' || pkg.type === 'claude-agent') {
        effectiveType = 'claude-agent';
      } else if (pkg.type === 'claude-skill') {
        effectiveType = 'claude-skill';
      } else {
        effectiveType = 'claude-agent';
      }
    } else if (format === 'continue' || format === 'windsurf') {
      effectiveType = format as PackageType;
    } else {
      effectiveType = (options.type || pkg.type) as PackageType;
    }

    const destDir = getDestinationDir(effectiveType);

    // Extract all files from tarball
    const extractedFiles = await extractTarball(tarball, packageId);

    // Track where files were saved for user feedback
    let destPath: string;
    let fileCount = 0;

    // Check if this is a multi-file package
    if (extractedFiles.length === 1) {
      // Single file package
      let mainFile = extractedFiles[0].content;
      // Determine file extension based on effective type
      // Cursor rules use .mdc, but slash commands and other files use .md
      const fileExtension = (effectiveType === 'cursor' && format === 'cursor') ? 'mdc' : 'md';
      const packageName = stripAuthorNamespace(packageId);
      destPath = `${destDir}/${packageName}.${fileExtension}`;

      // Handle cursor format - add header if missing for .mdc files
      if (format === 'cursor' && effectiveType === 'cursor') {
        if (!hasMDCHeader(mainFile)) {
          console.log(`   ⚠️  Adding missing MDC header...`);
          mainFile = addMDCHeader(mainFile, pkg.description);
        }
        // Apply cursor config if available
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
      fileCount = 1;
    } else {
      // Multi-file package - create directory for package
      const packageName = stripAuthorNamespace(packageId);
      const packageDir = `${destDir}/${packageName}`;
      destPath = packageDir;
      console.log(`   📁 Multi-file package - creating directory: ${packageDir}`);

      for (const file of extractedFiles) {
        const filePath = `${packageDir}/${file.name}`;
        await saveFile(filePath, file.content);
        fileCount++;
      }
    }

    // Update or create lock file
    const updatedLockfile = lockfile || createLockfile();
    const actualVersion = version === 'latest' ? pkg.latest_version?.version : version;

    addToLockfile(updatedLockfile, packageId, {
      version: actualVersion || version,
      tarballUrl,
      type: pkg.type,
      format,
      installedPath: destPath,
    });

    setPackageIntegrity(updatedLockfile, packageId, tarball);
    await writeLockfile(updatedLockfile);

    // Update lockfile (already done above via addToLockfile + writeLockfile)
    // No need to call addPackage again as it would be redundant

    // Track download analytics
    await client.trackDownload(packageId, {
      version: actualVersion || version,
      client: 'cli',
      format,
    });

    // Display the incremented download count
    const newDownloadCount = pkg.total_downloads + 1;

    console.log(`\n✅ Successfully installed ${packageId}`);
    console.log(`   📁 Saved to: ${destPath}`);
    console.log(`   🔒 Lock file updated`);
    console.log(`\n💡 This package has been downloaded ${newDownloadCount.toLocaleString()} times`);

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
interface ExtractedFile {
  name: string;
  content: string;
}

async function extractTarball(tarball: Buffer, packageId: string): Promise<ExtractedFile[]> {
  const files: ExtractedFile[] = [];
  const zlib = await import('zlib');
  const fs = await import('fs');
  const os = await import('os');
  const path = await import('path');

  return new Promise((resolve, reject) => {
    // Decompress gzip first
    zlib.gunzip(tarball, async (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      // Check if this is a tar archive by looking for tar header
      const isTar = result.length > 257 && result.toString('utf-8', 257, 262) === 'ustar';

      if (!isTar) {
        // Not a tar archive, treat as single gzipped file
        files.push({
          name: `${packageId}.md`,
          content: result.toString('utf-8')
        });
        resolve(files);
        return;
      }

      // Create temp directory for extraction
      const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'prpm-'));

      try {
        // Write tar data to temp file
        const tarPath = path.join(tmpDir, 'package.tar');
        await fs.promises.writeFile(tarPath, result);

        // Extract using tar library
        await tar.extract({
          file: tarPath,
          cwd: tmpDir,
        });

        // Read all extracted files
        const extractedFiles = await fs.promises.readdir(tmpDir, { withFileTypes: true, recursive: true });

        for (const entry of extractedFiles) {
          if (entry.isFile() && entry.name !== 'package.tar') {
            const filePath = path.join(entry.path || tmpDir, entry.name);
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const relativePath = path.relative(tmpDir, filePath);
            files.push({
              name: relativePath,
              content
            });
          }
        }

        if (files.length === 0) {
          // No files found, fall back to single file
          files.push({
            name: `${packageId}.md`,
            content: result.toString('utf-8')
          });
        }

        // Cleanup
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
        resolve(files);

      } catch (tarErr) {
        // Cleanup and fall back to single file
        await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        files.push({
          name: `${packageId}.md`,
          content: result.toString('utf-8')
        });
        resolve(files);
      }
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
