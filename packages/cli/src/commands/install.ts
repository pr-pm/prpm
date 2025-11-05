/**
 * Install command - Install packages from registry
 */

import { Command } from 'commander';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { saveFile, getDestinationDir, stripAuthorNamespace, autoDetectFormat } from '../core/filesystem';
import { addPackage } from '../core/lockfile';
import { telemetry } from '../core/telemetry';
import { Package, Format, Subtype } from '../types';
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
 * Get icon for package format and subtype
 */
function getPackageIcon(format: Format, subtype: Subtype): string {
  // Subtype icons take precedence
  const subtypeIcons: Record<Subtype, string> = {
    'skill': '🎓',
    'agent': '🤖',
    'slash-command': '⚡',
    'rule': '📋',
    'prompt': '💬',
    'collection': '📦',
    'chatmode': '💬',
    'tool': '🔧',
  };

  // Format-specific icons for rules/defaults
  const formatIcons: Record<Format, string> = {
    'claude': '🤖',
    'cursor': '📋',
    'windsurf': '🌊',
    'continue': '➡️',
    'copilot': '✈️',
    'kiro': '🎯',
    'mcp': '🔗',
    'agents.md': '📝',
    'generic': '📦',
  };

  return subtypeIcons[subtype] || formatIcons[format] || '📦';
}

/**
 * Get human-readable label for package format and subtype
 */
function getPackageLabel(format: Format, subtype: Subtype): string {
  const formatLabels: Record<Format, string> = {
    'claude': 'Claude',
    'cursor': 'Cursor',
    'windsurf': 'Windsurf',
    'continue': 'Continue',
    'copilot': 'GitHub Copilot',
    'kiro': 'Kiro',
    'mcp': 'MCP',
    'agents.md': 'Agents.md',
    'generic': '',
  };

  const subtypeLabels: Record<Subtype, string> = {
    'skill': 'Skill',
    'agent': 'Agent',
    'slash-command': 'Slash Command',
    'rule': 'Rule',
    'prompt': 'Prompt',
    'collection': 'Collection',
    'chatmode': 'Chat Mode',
    'tool': 'Tool',
  };

  const formatLabel = formatLabels[format];
  const subtypeLabel = subtypeLabels[subtype];

  if (format === 'generic') {
    return subtypeLabel;
  }

  return `${formatLabel} ${subtypeLabel}`;
}

export async function handleInstall(
  packageSpec: string,
  options: {
    version?: string;
    as?: string;
    subtype?: Subtype;
    frozenLockfile?: boolean;
    fromCollection?: {
      scope: string;
      name_slug: string;
      version?: string;
    };
  }
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    // Check if this is explicitly a collection install (collections/name)
    if (packageSpec.startsWith('collections/')) {
      const collectionId = packageSpec.replace('collections/', '');
      console.log(`📥 Installing ${collectionId}@latest...`);
      const { handleCollectionInstall } = await import('./collections.js');
      return await handleCollectionInstall(collectionId, {
        format: options.as,
        skipOptional: false,
        dryRun: false,
      });
    }

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
        console.log(`   🔄 Format: ${installedPkg.format || 'unknown'} | Subtype: ${installedPkg.subtype || 'unknown'}`);
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
    const typeIcon = getPackageIcon(pkg.format, pkg.subtype);
    const typeLabel = getPackageLabel(pkg.format, pkg.subtype);
    console.log(`   ${pkg.name} ${pkg.official ? '🏅' : ''}`);
    console.log(`   ${pkg.description || 'No description'}`);
    console.log(`   ${typeIcon} Type: ${typeLabel}`);

    // Determine format preference with auto-detection
    let format: string | undefined = options.as;

    // Auto-detect format if not explicitly specified
    if (!format) {
      const detectedFormat = await autoDetectFormat();
      if (detectedFormat) {
        format = detectedFormat;
        console.log(`   🔍 Auto-detected ${format} format (found .${format}/ directory)`);
      } else {
        // No existing directories found, use package's native format
        format = pkg.format;
      }
    }

    // Special handling for Claude packages: default to CLAUDE.md if it doesn't exist
    // BUT only for packages that are generic rules (not skills, agents, or commands)
    if (!options.as && pkg.format === 'claude' && pkg.subtype === 'rule') {
      const { fileExists } = await import('../core/filesystem.js');
      const claudeMdExists = await fileExists('CLAUDE.md');

      if (!claudeMdExists) {
        // CLAUDE.md doesn't exist, install as CLAUDE.md (recommended format for Claude Code)
        format = 'claude-md';
        console.log(`   💡 Installing as CLAUDE.md (recommended for Claude Code)`);
        console.log(`      To install as skill instead, use: prpm install ${packageId} --as claude`);
      } else {
        // CLAUDE.md already exists, install as skill to avoid overwriting
        console.log(`   ℹ️  CLAUDE.md already exists, installing as skill in .claude/skills/`);
      }
    }

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

    // Determine effective format and subtype (from conversion or package native format)
    const effectiveFormat = (format as Format) || pkg.format;
    const effectiveSubtype = options.subtype || pkg.subtype;

    // Extract all files from tarball
    const extractedFiles = await extractTarball(tarball, packageId);

    // Track where files were saved for user feedback
    let destPath: string;
    let fileCount = 0;

    // Special handling for CLAUDE.md format (goes in project root)
    if (format === 'claude-md') {
      if (extractedFiles.length !== 1) {
        throw new Error('CLAUDE.md format only supports single-file packages');
      }

      let mainFile = extractedFiles[0].content;
      destPath = 'CLAUDE.md';

      await saveFile(destPath, mainFile);
      fileCount = 1;
    }
    // Check if this is a multi-file package
    else if (extractedFiles.length === 1) {
      const destDir = getDestinationDir(effectiveFormat, effectiveSubtype, pkg.name);

      // Single file package
      let mainFile = extractedFiles[0].content;
      // Determine file extension based on effective format
      // Cursor rules use .mdc, but slash commands and other files use .md
      const fileExtension = (effectiveFormat === 'cursor' && format === 'cursor') ? 'mdc' : 'md';
      const packageName = stripAuthorNamespace(packageId);

      // For Claude skills, use SKILL.md filename in the package directory
      // For agents.md, use package-name/AGENTS.md directory structure
      // For other formats, use package name as filename
      if (effectiveFormat === 'claude' && effectiveSubtype === 'skill') {
        destPath = `${destDir}/SKILL.md`;
      } else if (effectiveFormat === 'agents.md') {
        destPath = `${destDir}/${packageName}/AGENTS.md`;
      } else {
        destPath = `${destDir}/${packageName}.${fileExtension}`;
      }

      // Handle cursor format - add header if missing for .mdc files
      if (format === 'cursor' && effectiveFormat === 'cursor') {
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
      const destDir = getDestinationDir(effectiveFormat, effectiveSubtype, pkg.name);

      // Multi-file package - create directory for package
      // For Claude skills, destDir already includes package name, so use it directly
      const packageName = stripAuthorNamespace(packageId);
      const packageDir = (effectiveFormat === 'claude' && effectiveSubtype === 'skill')
        ? destDir
        : `${destDir}/${packageName}`;
      destPath = packageDir;
      console.log(`   📁 Multi-file package - creating directory: ${packageDir}`);

      // For Claude skills, verify SKILL.md exists
      if (effectiveFormat === 'claude' && effectiveSubtype === 'skill') {
        const skillMdIndex = extractedFiles.findIndex(f =>
          f.name === 'SKILL.md' || f.name.endsWith('/SKILL.md')
        );

        if (skillMdIndex === -1) {
          // SKILL.md not found, look for common variations and auto-rename
          const skillFileIndex = extractedFiles.findIndex(f =>
            f.name.toLowerCase().endsWith('skill.md') ||
            (f.name.endsWith('.md') && extractedFiles.length === 1) // Single .md file
          );

          if (skillFileIndex !== -1) {
            const oldName = extractedFiles[skillFileIndex].name;
            const basePath = oldName.substring(0, oldName.lastIndexOf('/') + 1);
            const newName = basePath + 'SKILL.md';
            console.log(`   ⚠️  Auto-fixing skill filename: ${oldName} → ${newName}`);
            console.log(`      (Claude skills must be named SKILL.md per official documentation)`);
            extractedFiles[skillFileIndex].name = newName;
          } else {
            throw new Error(
              'Claude skills must contain a SKILL.md file. ' +
              'According to Claude documentation, skills must have a file named SKILL.md in their directory. ' +
              'No suitable file found to rename. Please update the package to follow this requirement.'
            );
          }
        }
      }

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
      format: pkg.format, // Preserve original package format
      subtype: pkg.subtype, // Preserve original package subtype
      installedPath: destPath,
      fromCollection: options.fromCollection,
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
        convertTo: options.as,
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

        // Files to exclude from package content (metadata files)
        const excludeFiles = ['package.tar', 'prpm.json', 'README.md', 'LICENSE', 'LICENSE.txt', 'LICENSE.md'];

        for (const entry of extractedFiles) {
          if (entry.isFile() && !excludeFiles.includes(entry.name)) {
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
    .option('--as <format>', 'Convert and install in specific format (cursor, claude, continue, windsurf, copilot, kiro, agents.md, canonical)')
    .option('--format <format>', 'Alias for --as')
    .option('--subtype <subtype>', 'Specify subtype when converting (skill, agent, rule, etc.)')
    .option('--frozen-lockfile', 'Fail if lock file needs to be updated (for CI)')
    .action(async (packageSpec: string, options: { version?: string; as?: string; format?: string; subtype?: string; frozenLockfile?: boolean }) => {
      // Support both --as and --format (format is alias for as)
      const convertTo = options.format || options.as;

      if (convertTo && !['cursor', 'claude', 'continue', 'windsurf', 'copilot', 'kiro', 'agents.md', 'canonical'].includes(convertTo)) {
        console.error('❌ Format must be one of: cursor, claude, continue, windsurf, copilot, kiro, agents.md, canonical');
        console.log('\n💡 Examples:');
        console.log('   prpm install my-package --as cursor       # Convert to Cursor format');
        console.log('   prpm install my-package --format claude   # Convert to Claude format');
        console.log('   prpm install my-package --format kiro     # Convert to Kiro format');
        console.log('   prpm install my-package --format agents.md # Convert to Agents.md format');
        console.log('   prpm install my-package                   # Install in native format');
        process.exit(1);
      }

      await handleInstall(packageSpec, {
        version: options.version,
        as: convertTo,
        subtype: options.subtype as Subtype | undefined,
        frozenLockfile: options.frozenLockfile
      });
      process.exit(0);
    });

  return command;
}
