/**
 * Install command - Install packages from registry
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { saveFile, getDestinationDir, stripAuthorNamespace, autoDetectFormat, fileExists, getManifestFilename } from '../core/filesystem';
import { addPackage } from '../core/lockfile';
import { telemetry } from '../core/telemetry';
import { Package, Format, Subtype } from '../types';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import * as tar from 'tar';
import { CLIError } from '../core/errors';
import { promptYesNo } from '../core/prompts';
import path from 'path';
import zlib from 'zlib';
import fs from 'fs/promises';
import os from 'os';
import { handleCollectionInstall } from './collections.js';
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
import { addSkillToManifest, type SkillManifestEntry } from '../core/agents-md-progressive.js';
import {
  fromCursor,
  fromClaude,
  fromContinue,
  fromCopilot,
  fromKiro,
  fromWindsurf,
  fromAgentsMd,
  fromGemini,
  toCursor,
  toClaude,
  toContinue,
  toCopilot,
  toKiro,
  toWindsurf,
  toAgentsMd,
  toGemini,
  validateFormat,
  type CanonicalPackage,
} from '@pr-pm/converters';

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
    'hook': '🪝',
    'workflow': '🔄',
    'template': '📄',
  };

  // Format-specific icons for rules/defaults
  const formatIcons: Record<Format, string> = {
    'claude': '🤖',
    'cursor': '📋',
    'windsurf': '🌊',
    'continue': '➡️',
    'copilot': '✈️',
    'kiro': '🎯',
    'gemini': '✨',
    'gemini.md': '✨',
    'claude.md': '🤖',
    'opencode': '⚡',
    'droid': '🏭',
    'mcp': '🔗',
    'agents.md': '📝',
    'gemini.md': '✨',
    'claude.md': '🤖',
    'ruler': '📏',
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
    'gemini': 'Gemini',
    'gemini.md': 'Gemini',
    'claude.md': 'Claude',
    'opencode': 'OpenCode',
    'droid': 'Factory Droid',
    'mcp': 'MCP',
    'agents.md': 'Agents.md',
    'gemini.md': 'Gemini.md',
    'claude.md': 'Claude.md',
    'ruler': 'Ruler',
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
    'hook': 'Hook',
    'workflow': 'Workflow',
    'template': 'Template',
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
    force?: boolean;
    location?: string;
    noAppend?: boolean; // Skip manifest file update for skills
    manifestFile?: string; // Custom manifest filename (default: AGENTS.md)
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

    // Load config early (will be needed for format detection and later)
    const config = await getConfig();

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

    // Determine target format for installation check
    // Priority: 1. --as flag, 2. config default, 3. auto-detect, 4. package native format
    let targetFormat = options.as;
    if (!targetFormat) {
      targetFormat = config.defaultFormat || (await autoDetectFormat()) || undefined;
    }

    // Check if package is already installed in the same format (skip if --force option is set)
    if (!options.force && lockfile && lockfile.packages[packageId]) {
      const installedPkg = lockfile.packages[packageId];
      const requestedVersion = options.version || specVersion;

      // Check if installing in the same format
      const sameFormat = !targetFormat || installedPkg.format === targetFormat;

      // If no specific version requested, or same version requested, AND same format
      if (sameFormat && (!requestedVersion || requestedVersion === 'latest' || requestedVersion === installedPkg.version)) {
        console.log(`\n✨ Package already installed!`);
        console.log(`   📦 ${packageId}@${installedPkg.version}`);
        console.log(`   🔄 Format: ${installedPkg.format || 'unknown'} | Subtype: ${installedPkg.subtype || 'unknown'}`);
        console.log(`\n💡 To reinstall or upgrade:`);
        console.log(`   prpm upgrade ${packageId}     # Upgrade to latest version`);
        console.log(`   prpm uninstall ${packageId}   # Uninstall first, then install`);
        console.log(`   prpm install ${packageId} --as <format>  # Install in different format`);
        success = true;
        return;
      } else if (!sameFormat) {
        // Different format requested - allow installation
        console.log(`📦 Installing ${packageId} in ${targetFormat} format (already have ${installedPkg.format} version)`);
      } else if (requestedVersion !== installedPkg.version) {
        // Different version requested - allow upgrade/downgrade
        console.log(`📦 Upgrading ${packageId}: ${installedPkg.version} → ${requestedVersion}`);
      }
    }

    console.log(`📥 Installing ${packageId}@${version}...`);

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

    // Check if this is a Claude hook and show informational message
    if (pkg.format === 'claude' && pkg.subtype === 'hook') {
      // Only show detailed warning if not part of a collection (to avoid spam)
      if (!options.fromCollection) {
        console.log(`\n📌 Installing Claude Hook`);
        console.log(`   ⚠️  Note: Hooks execute shell commands automatically.`);
        console.log(`   📖 Review the hook configuration in .claude/settings.json after installation.`);
        console.log();
      } else {
        // Brief message for collection installs
        console.log(`   🪝 Hook (merges into .claude/settings.json)`);
      }
    }

    // Determine format preference with priority order:
    // 1. CLI --as flag (highest priority)
    // 2. defaultFormat from .prpmrc config
    // 3. Auto-detection based on existing directories
    // 4. Package native format (fallback)
    let format: string | undefined = options.as;

    if (!format) {
      // Check for config default format
      if (config.defaultFormat) {
        format = config.defaultFormat;
        console.log(`   ⚙️  Using default format from config: ${format}`);
      } else {
        // Auto-detect format based on existing directories
        const detectedFormat = await autoDetectFormat();
        if (detectedFormat) {
          format = detectedFormat;
          console.log(`   🔍 Auto-detected ${format} format (found .${format}/ directory)`);
        } else {
          // No config or detection, use package's native format
          format = pkg.format;
        }
      }
    }

    // Special handling for Claude packages: default to CLAUDE.md if it doesn't exist
    // BUT only for packages that are generic rules (not skills, agents, or commands)
    if (!options.as && pkg.format === 'claude' && pkg.subtype === 'rule') {
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
    let actualVersion: string;
    if (version === 'latest') {
      if (!pkg.latest_version) {
        throw new Error('No versions available for this package');
      }
      tarballUrl = pkg.latest_version.tarball_url;
      actualVersion = pkg.latest_version.version;
      console.log(`   📦 Installing version ${pkg.latest_version.version}`);
    } else {
      const versionInfo = await client.getPackageVersion(packageId, version);
      tarballUrl = versionInfo.tarball_url;
      actualVersion = version;
      console.log(`   📦 Installing version ${version}`);
    }

    // Download package in native format (conversion happens client-side)
    console.log(`   ⬇️  Downloading...`);
    const tarball = await client.downloadPackage(tarballUrl);

    // Extract tarball and save files
    console.log(`   📂 Extracting...`);

    // Determine effective format and subtype (from conversion or package native format)
    const effectiveFormat = (format as Format) || pkg.format;
    const effectiveSubtype = options.subtype || pkg.subtype;

    // Extract all files from tarball
    let extractedFiles = await extractTarball(tarball, packageId);

    // Client-side format conversion (if --as flag is specified)
    if (options.as && format && format !== pkg.format) {
      console.log(`   🔄 Converting from ${pkg.format} to ${format}...`);

      // Only convert single-file packages
      if (extractedFiles.length !== 1) {
        throw new CLIError('Format conversion is only supported for single-file packages');
      }

      const sourceContent = extractedFiles[0].content;

      // Extract author from package name scope (@author/package-name)
      const scopeMatch = packageId.match(/^@([^/]+)\//);
      const author = scopeMatch ? scopeMatch[1] : 'unknown';

      const metadata = {
        id: packageId,
        name: pkg.name || packageId,
        version: actualVersion,
        author,
        tags: pkg.tags || [],
      };

      // Parse source format to canonical
      let canonicalPkg: CanonicalPackage;
      const sourceFormat = pkg.format.toLowerCase();

      try {
        switch (sourceFormat) {
          case 'cursor':
            canonicalPkg = fromCursor(sourceContent, metadata);
            break;
          case 'claude':
            canonicalPkg = fromClaude(sourceContent, metadata);
            break;
          case 'windsurf':
            canonicalPkg = fromWindsurf(sourceContent, metadata);
            break;
          case 'kiro':
            canonicalPkg = fromKiro(sourceContent, metadata);
            break;
          case 'copilot':
            canonicalPkg = fromCopilot(sourceContent, metadata);
            break;
          case 'continue':
            canonicalPkg = fromContinue(JSON.parse(sourceContent), metadata);
            break;
          case 'agents.md':
            canonicalPkg = fromAgentsMd(sourceContent, metadata);
            break;
          case 'gemini':
            canonicalPkg = fromGemini(sourceContent, metadata);
            break;
          default:
            throw new CLIError(`Unsupported source format for conversion: ${pkg.format}`);
        }
      } catch (error: any) {
        throw new CLIError(`Failed to parse ${pkg.format} format: ${error.message}`);
      }

      // Convert from canonical to target format
      let convertedContent: string;

      try {
        switch (format) {
          case 'cursor':
            const cursorResult = toCursor(canonicalPkg);
            convertedContent = cursorResult.content;
            break;
          case 'claude':
            const claudeResult = toClaude(canonicalPkg);
            convertedContent = claudeResult.content;
            break;
          case 'continue':
            const continueResult = toContinue(canonicalPkg);
            convertedContent = continueResult.content;
            break;
          case 'windsurf':
            const windsurfResult = toWindsurf(canonicalPkg);
            convertedContent = windsurfResult.content;
            break;
          case 'copilot':
            const copilotResult = toCopilot(canonicalPkg);
            convertedContent = copilotResult.content;
            break;
          case 'kiro':
            const kiroResult = toKiro(canonicalPkg, {
              kiroConfig: { inclusion: 'always' }
            });
            convertedContent = kiroResult.content;
            break;
          case 'agents.md':
            const agentsResult = toAgentsMd(canonicalPkg);
            convertedContent = agentsResult.content;
            break;
          case 'gemini':
            const geminiResult = toGemini(canonicalPkg);
            convertedContent = geminiResult.content;
            break;
          default:
            throw new CLIError(`Unsupported target format for conversion: ${format}`);
        }
      } catch (error: any) {
        throw new CLIError(`Failed to convert to ${format} format: ${error.message}`);
      }

      if (!convertedContent) {
        throw new CLIError('Conversion failed: No content generated');
      }

      // Replace extracted content with converted content
      extractedFiles = [{
        name: extractedFiles[0].name,
        content: convertedContent
      }];

      console.log(`   ✓ Converted from ${pkg.format} to ${format}`);
    }

    const locationSupportedFormats: Format[] = ['agents.md', 'cursor'];
    let locationOverride = options.location?.trim();

    if (locationOverride && !locationSupportedFormats.includes(effectiveFormat)) {
      console.log(`   ⚠️  --location option currently applies to Cursor or Agents.md installs. Ignoring provided value for ${effectiveFormat}.`);
      locationOverride = undefined;
    }

    // Track where files were saved for user feedback
    let destPath: string;
    let destDir = ''; // Destination directory (needed for progressive disclosure)
    let fileCount = 0;
    let hookMetadata: { events: string[]; hookId: string } | undefined = undefined;

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
      destDir = getDestinationDir(effectiveFormat, effectiveSubtype, pkg.name);

      if (locationOverride && effectiveFormat === 'cursor') {
        const relativeDestDir = destDir.startsWith('./') ? destDir.slice(2) : destDir;
        destDir = path.join(locationOverride, relativeDestDir);
        console.log(`   📁 Installing Cursor package to custom location: ${destDir}`);
      }

      // Single file package
      let mainFile = extractedFiles[0].content;
      // Determine file extension based on effective format
      // Cursor rules use .mdc, but slash commands and other files use .md
      const fileExtension = (effectiveFormat === 'cursor' && format === 'cursor') ? 'mdc' : 'md';
      const packageName = stripAuthorNamespace(packageId);

      // For Claude skills, use SKILL.md filename in the package directory
      // For agents.md, always install as AGENTS.md in the project root
      // For Copilot, use official naming conventions
      // For other formats, use package name as filename
      if (effectiveFormat === 'claude' && effectiveSubtype === 'skill') {
        destPath = `${destDir}/SKILL.md`;
      } else if (effectiveFormat === 'claude' && effectiveSubtype === 'hook') {
        // Claude hooks are merged into settings.json
        destPath = `${destDir}/settings.json`;
      } else if (effectiveFormat === 'agents.md' || effectiveFormat === 'gemini.md' || effectiveFormat === 'claude.md') {
        // For manifest formats, use progressive disclosure (install to .openskills/ or .openagents/)
        if (effectiveSubtype === 'skill') {
          // Skills go to .openskills/package-name/ directory
          destPath = `${destDir}/SKILL.md`;
          console.log(`   📦 Installing skill to ${destDir}/ for progressive disclosure`);
        } else if (effectiveSubtype === 'agent') {
          // Agents go to .openagents/package-name/ directory
          destPath = `${destDir}/AGENT.md`;
          console.log(`   🤖 Installing agent to ${destDir}/ for progressive disclosure`);
        } else {
          // Non-skill/agent packages go to root manifest file
          const manifestFilename = getManifestFilename(effectiveFormat);
          let targetPath = manifestFilename;
          if (locationOverride) {
            targetPath = path.join(locationOverride, `${manifestFilename.replace('.md', '.override.md')}`);
            console.log(`   📁 Installing to custom location: ${targetPath}`);
          }
          destPath = targetPath;

          if (await fileExists(destPath)) {
            if (options.force) {
              console.log(`   ⚠️  ${destPath} already exists - overwriting (forced).`);
            } else {
              console.log(`   ⚠️  ${destPath} already exists.`);
              const overwrite = await promptYesNo(
                `   Overwrite existing ${destPath}? (y/N): `,
                `   ⚠️  Non-interactive terminal detected. Remove or rename ${destPath} to continue.`
              );
              if (!overwrite) {
                console.log(`   🚫 Skipping install to avoid overwriting ${destPath}`);
                success = true;
                return;
              }
            }
          }
        }
      } else if (effectiveFormat === 'copilot') {
        // Official GitHub Copilot naming conventions
        if (effectiveSubtype === 'chatmode') {
          // Chat modes: .github/chatmodes/NAME.chatmode.md
          destPath = `${destDir}/${packageName}.chatmode.md`;
        } else {
          // Path-specific instructions: .github/instructions/NAME.instructions.md
          destPath = `${destDir}/${packageName}.instructions.md`;
        }
      } else if (effectiveFormat === 'kiro' && effectiveSubtype === 'hook') {
        // Kiro hooks use .kiro.hook extension (JSON files)
        destPath = `${destDir}/${packageName}.kiro.hook`;
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

      // Special handling for Claude hooks - merge into settings.json
      if (effectiveFormat === 'claude' && effectiveSubtype === 'hook') {

        // Parse the hook configuration from the downloaded file
        let hookConfig: any;
        try {
          hookConfig = JSON.parse(mainFile);
        } catch (err) {
          throw new Error(`Invalid hook configuration: ${err}. Hook file must be valid JSON.`);
        }

        // Validate hook configuration against schema
        const validation = validateFormat('claude', hookConfig, 'hook');
        if (!validation.valid) {
          console.log(chalk.yellow(`   ⚠️  Hook validation warning: ${validation.errors[0].message}`));
        }

        // Generate unique hook ID for this installation
        const hookId = `${packageId}@${actualVersion || version}`;

        // Read existing settings.json if it exists
        let existingSettings: any = { hooks: {} };
        if (await fileExists(destPath)) {
          try {
            const existingContent = await fs.readFile(destPath, 'utf-8');
            existingSettings = JSON.parse(existingContent);
            if (!existingSettings.hooks) {
              existingSettings.hooks = {};
            }
          } catch (err) {
            console.log(`   ⚠️  Warning: Could not parse existing settings.json, creating new one.`);
            existingSettings = { hooks: {} };
          }
        }

        // Track which events this hook adds to
        const events: string[] = [];

        // Merge the new hook configuration
        // Assume the downloaded file contains a hooks object
        if (hookConfig.hooks) {
          for (const [event, eventHooks] of Object.entries(hookConfig.hooks)) {
            if (!existingSettings.hooks[event]) {
              existingSettings.hooks[event] = [];
            }

            // Add hook ID to each hook config for tracking
            const hooksWithId = (eventHooks as any[]).map(hook => ({
              ...hook,
              __prpm_hook_id: hookId, // Internal tracking ID
            }));

            // Add new hooks to the event
            existingSettings.hooks[event] = [
              ...existingSettings.hooks[event],
              ...hooksWithId
            ];

            events.push(event);
          }
          console.log(`   ✓ Merged hook configuration into settings.json`);

          // Store metadata for lockfile
          hookMetadata = { events, hookId };
        }

        mainFile = JSON.stringify(existingSettings, null, 2);
      }

      await saveFile(destPath, mainFile);
      fileCount = 1;
    } else {
      destDir = getDestinationDir(effectiveFormat, effectiveSubtype, pkg.name);

      if (locationOverride && effectiveFormat === 'cursor') {
        const relativeDestDir = destDir.startsWith('./') ? destDir.slice(2) : destDir;
        destDir = path.join(locationOverride, relativeDestDir);
        console.log(`   📁 Installing Cursor package to custom location: ${destDir}`);
      }

      // Multi-file package - create directory for package
      // For Claude skills, destDir already includes package name, so use it directly
      // For Cursor rules converted from Claude skills, use flat structure
      const packageName = stripAuthorNamespace(packageId);
      const isCursorConversion = (effectiveFormat === 'cursor' && pkg.format === 'claude' && pkg.subtype === 'skill');
      const packageDir = (effectiveFormat === 'claude' && effectiveSubtype === 'skill')
        ? destDir
        : isCursorConversion
        ? destDir // Cursor uses flat structure
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

      // Track JSON files for @reference insertion in Cursor conversion
      const jsonFiles: string[] = [];

      for (const file of extractedFiles) {
        // Strip the tarball's root directory prefix to preserve subdirectories
        // Example: ".claude/skills/agent-builder/docs/examples.md" → "docs/examples.md"
        //          ".claude/skills/agent-builder/SKILL.md" → "SKILL.md"

        // Find the common prefix (the package's root directory in the tarball)
        const pathParts = file.name.split('/');

        // For Claude skills, the tarball structure is typically: .claude/skills/package-name/...
        // We want to strip everything up to and including the package-name directory
        let relativeFileName = file.name;

        // Find the skills directory index
        const skillsDirIndex = pathParts.indexOf('skills');
        if (skillsDirIndex !== -1 && pathParts.length > skillsDirIndex + 2) {
          // Skip: .claude/skills/package-name/ and keep the rest
          relativeFileName = pathParts.slice(skillsDirIndex + 2).join('/');
        } else if (pathParts.length > 1) {
          // Fallback: just take the filename (last part)
          relativeFileName = pathParts[pathParts.length - 1];
        }

        let fileContent = file.content;
        let fileName = relativeFileName;

        // Handle Cursor conversion from Claude skill
        if (isCursorConversion) {
          // Convert SKILL.md to .mdc
          if (fileName === 'SKILL.md' || fileName.endsWith('/SKILL.md')) {
            fileName = `${packageName}.mdc`;

            // Add MDC header if missing
            if (!hasMDCHeader(fileContent)) {
              console.log(`   ⚠️  Adding MDC header to converted skill...`);
              fileContent = addMDCHeader(fileContent, pkg.description);
            }

            // Apply cursor config if available
            if (config.cursor) {
              console.log(`   ⚙️  Applying cursor config...`);
              fileContent = applyCursorConfig(fileContent, config.cursor);
            }
          }
          // Track JSON files for @reference
          else if (fileName.endsWith('.json')) {
            // Flatten structure - remove subdirectories
            const jsonFileName = fileName.split('/').pop() || fileName;
            fileName = jsonFileName;
            jsonFiles.push(jsonFileName);
          }
          // For other files (docs, etc), flatten the structure
          else {
            fileName = fileName.split('/').pop() || fileName;
          }
        }

        const filePath = `${packageDir}/${fileName}`;
        await saveFile(filePath, fileContent);
        fileCount++;
      }

      // Add @references to .mdc file for JSON files
      if (isCursorConversion && jsonFiles.length > 0) {
        const mdcFile = `${packageDir}/${packageName}.mdc`;
        let mdcContent = await fs.readFile(mdcFile, 'utf-8');

        // Find the end of frontmatter (if exists)
        const frontmatterMatch = mdcContent.match(/^---\n[\s\S]*?\n---\n/);
        if (frontmatterMatch) {
          const frontmatterEnd = frontmatterMatch[0].length;
          const beforeFrontmatter = mdcContent.slice(0, frontmatterEnd);
          const afterFrontmatter = mdcContent.slice(frontmatterEnd);

          // Add @references right after frontmatter
          const references = jsonFiles.map(f => `@${f}`).join('\n');
          mdcContent = `${beforeFrontmatter}\n${references}\n${afterFrontmatter}`;

          await saveFile(mdcFile, mdcContent);
          console.log(`   ✓ Added ${jsonFiles.length} @reference(s) to ${packageName}.mdc`);
        }
      }
    }

    // Handle AGENTS.md manifest update for progressive disclosure skills
    let progressiveDisclosureMetadata: {
      mode: 'progressive';
      resourceDir: string;
      manifestPath: string;
      resourceName: string;
      resourceType: 'skill' | 'agent';
      skillsDir?: string;
      skillName?: string;
    } | undefined;

    if ((effectiveFormat === 'agents.md' || effectiveFormat === 'gemini.md' || effectiveFormat === 'claude.md') && (effectiveSubtype === 'skill' || effectiveSubtype === 'agent') && !options.noAppend) {
      // Ensure destDir is defined (should always be set by this point for skill/agent installations)
      if (!destDir) {
        throw new Error('Internal error: destDir not set for progressive disclosure installation');
      }

      const manifestPath = options.manifestFile || getManifestFilename(effectiveFormat);
      const resourceName = stripAuthorNamespace(packageId);
      const resourceType = effectiveSubtype as 'skill' | 'agent';
      const mainFile = resourceType === 'agent' ? 'AGENT.md' : 'SKILL.md';

      // Add skill or agent to manifest file (AGENTS.md, GEMINI.md, CLAUDE.md, etc.)
      const manifestEntry: SkillManifestEntry = {
        name: resourceName,
        description: pkg.description || `${pkg.name} ${resourceType}`,
        skillPath: destDir,
        mainFile,
        resourceType,
      };

      await addSkillToManifest(manifestEntry, manifestPath);
      console.log(`   ✓ Added ${resourceType} to ${manifestPath} manifest`);

      progressiveDisclosureMetadata = {
        mode: 'progressive',
        resourceDir: destDir,
        manifestPath,
        resourceName,
        resourceType,
        // Legacy fields for backward compatibility
        skillsDir: destDir,
        skillName: resourceName,
      };
    }

    // Update or create lock file
    const updatedLockfile = lockfile || createLockfile();

    addToLockfile(updatedLockfile, packageId, {
      version: actualVersion || version,
      tarballUrl,
      format: effectiveFormat, // Installed format
      subtype: effectiveSubtype, // Installed subtype
      sourceFormat: pkg.format,
      sourceSubtype: pkg.subtype,
      installedPath: destPath,
      fromCollection: options.fromCollection,
      hookMetadata, // Track hook installation metadata for uninstall
      progressiveDisclosure: progressiveDisclosureMetadata,
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

    // Show progressive disclosure hint for skills
    if (progressiveDisclosureMetadata && !options.noAppend) {
      const manifestFile = progressiveDisclosureMetadata.manifestPath;
      console.log(`\n🎓 Skill installed with progressive disclosure`);
      console.log(`   📝 Skill added to ${manifestFile} manifest`);
      console.log(`   💡 The skill is available but not loaded into context by default`);
      console.log(`   ⚡ To activate: Add skill usage to your code or let the agent discover it`);
    }

    console.log(`\n💡 This package has been downloaded ${newDownloadCount.toLocaleString()} times`);

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    throw new CLIError(`\n❌ Installation failed: ${error}\n\n💡 Tips:\n   - Check package name: prpm search <query>\n   - Get package info: prpm info <package>`, 1);
  } finally {
    await telemetry.track({
      command: 'install',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        packageId: packageSpec ? packageSpec.split('@')[0] : 'lockfile',
        version: options.version || 'latest',
        convertTo: options.as,
      },
    });
    await telemetry.shutdown();
  }
}

/**
 * Extract main file from tarball
 */
interface ExtractedFile {
  name: string;
  content: string;
}

async function extractTarball(tarball: Buffer, packageId: string): Promise<ExtractedFile[]> {
  // Attempt to decompress
  let decompressed: Buffer;
  try {
    decompressed = await new Promise<Buffer>((resolve, reject) => {
      zlib.gunzip(tarball, (err, result) => {
        if (err) {
          // If gunzip fails, it might be a raw file already (not gzipped)
          // But standard packages should be gzipped tarballs.
          // We'll reject to be safe, or we could try to treat as raw if we supported that.
          reject(new Error(`Failed to decompress tarball: ${err.message}`));
          return;
        }
        resolve(result);
      });
    });
  } catch (error: any) {
     throw new CLIError(`Package decompression failed: ${error.message}`);
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prpm-'));
  const cleanup = async () => {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  };

  const excludedNames = new Set([
    'prpm.json',
    'README',
    'README.md',
    'README.txt',
    'LICENSE',
    'LICENSE.txt',
    'LICENSE.md',
  ]);

  try {
    const extract = tar.extract({
      cwd: tmpDir,
      strict: false,
    });

    await pipeline(Readable.from(decompressed), extract);

    const extractedFiles = await collectExtractedFiles(tmpDir, excludedNames, fs);

    if (extractedFiles.length === 0) {
      throw new CLIError('Package archive contains no valid files');
    }

    return extractedFiles;
  } catch (error: any) {
    // Fallback for raw file downloads (backward compatibility)
    // If tar extraction failed, it might be a single file download
    if (error.message.includes('TAR_BAD_ARCHIVE') || error.message.includes('unexpected end of file')) {
      return [{
        name: `${packageId}.md`, // Default name
        content: decompressed.toString('utf-8')
      }];
    }
    throw new CLIError(`Failed to extract package files: ${error.message}`);
  } finally {
    await cleanup();
  }
}

async function collectExtractedFiles(
  rootDir: string,
  excludedNames: Set<string>,
  fs: typeof import('fs/promises')
): Promise<ExtractedFile[]> {
  const files: ExtractedFile[] = [];
  const dirs = [rootDir];

  while (dirs.length > 0) {
    const currentDir = dirs.pop();
    if (!currentDir) continue;

    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        dirs.push(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (excludedNames.has(entry.name)) {
        continue;
      }

      const content = await fs.readFile(fullPath, 'utf-8');
      const relativePath = path.relative(rootDir, fullPath).split(path.sep).join('/');

      files.push({
        name: relativePath,
        content,
      });
    }
  }

  return files;
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

/**
 * Install all packages from prpm.lock
 */
export async function installFromLockfile(options: {
  as?: string;
  subtype?: Subtype;
  frozenLockfile?: boolean;
  location?: string;
}): Promise<void> {
  try {
    // Read lockfile
    const lockfile = await readLockfile();

    if (!lockfile) {
      throw new CLIError('❌ No prpm.lock file found\n\n💡 Run "prpm install <package>" first to create a lockfile, or initialize a new project with "prpm init"', 1);
    }

    const packageIds = Object.keys(lockfile.packages);

    if (packageIds.length === 0) {
      console.log('✅ No packages to install (prpm.lock is empty)');
      return;
    }

    console.log(`📦 Installing ${packageIds.length} package${packageIds.length === 1 ? '' : 's'} from prpm.lock...\n`);

    let successCount = 0;
    let failCount = 0;

    // Install each package from lockfile
    for (const packageId of packageIds) {
      const lockEntry = lockfile.packages[packageId];

      try {
        // Extract package spec (strip version if present in packageId)
        const packageSpec = packageId.includes('@') && !packageId.startsWith('@')
          ? packageId.substring(0, packageId.lastIndexOf('@'))
          : packageId;

        console.log(`  Installing ${packageId}...`);

        let locationOverride = options.location;
        if (!locationOverride && lockEntry.format === 'agents.md' && lockEntry.installedPath) {
          const baseName = path.basename(lockEntry.installedPath);
          if (baseName === 'AGENTS.override.md') {
            locationOverride = path.dirname(lockEntry.installedPath);
          } else if (baseName !== 'AGENTS.md') {
            // If the lockfile contains a non-standard filename, honor its directory
            locationOverride = path.dirname(lockEntry.installedPath);
          }
        }

        // Preserve manifest file from lockfile for progressive disclosure
        const manifestFile = lockEntry.progressiveDisclosure?.manifestPath;

        await handleInstall(packageSpec, {
          version: lockEntry.version,
          as: options.as || lockEntry.format,
          subtype: options.subtype || lockEntry.subtype as Subtype | undefined,
          frozenLockfile: options.frozenLockfile,
          force: true, // Force reinstall when installing from lockfile
          location: locationOverride,
          manifestFile,
        });

        successCount++;
      } catch (error) {
        // Check if this is a success exit (CLIError with exitCode 0)
        if (error instanceof CLIError && error.exitCode === 0) {
          successCount++;
        } else {
          failCount++;
          console.error(`  ❌ Failed to install ${packageId}:`);
          console.error(`     Type: ${error?.constructor?.name}`);
          console.error(`     Message: ${error instanceof Error ? error.message : String(error)}`);
          if (error instanceof CLIError) {
            console.error(`     ExitCode: ${error.exitCode}`);
          }
        }
      }
    }

    console.log(`\n✅ Installed ${successCount}/${packageIds.length} packages`);

    if (failCount > 0) {
      throw new CLIError(`❌ ${failCount} package${failCount === 1 ? '' : 's'} failed to install`, 1);
    }

  } catch (error) {
    if (error instanceof CLIError) {
      throw error;
    }
    throw new CLIError(`❌ Failed to install from lockfile: ${error}`, 1);
  }
}

export function createInstallCommand(): Command {
  const command = new Command('install');

  command
    .description('Install a package from the registry, or install all packages from prpm.lock if no package specified')
    .argument('[package]', 'Package to install (e.g., react-rules or react-rules@1.2.0). If omitted, installs all packages from prpm.lock')
    .option('--version <version>', 'Specific version to install')
    .option('--as <format>', 'Convert and install in specific format (cursor, claude, continue, windsurf, copilot, kiro, agents.md, gemini.md, claude.md, canonical)')
    .option('--format <format>', 'Alias for --as')
    .option('--location <path>', 'Custom location for installed files (Agents.md or nested Cursor rules)')
    .option('--subtype <subtype>', 'Specify subtype when converting (skill, agent, rule, etc.)')
    .option('--frozen-lockfile', 'Fail if lock file needs to be updated (for CI)')
    .option('--no-append', 'Skip adding skill to manifest file (skill files only)')
    .option('--manifest-file <filename>', 'Custom manifest filename for progressive disclosure (default: AGENTS.md)', 'AGENTS.md')
    .action(async (packageSpec: string | undefined, options: { version?: string; as?: string; format?: string; subtype?: string; frozenLockfile?: boolean; location?: string; noAppend?: boolean; manifestFile?: string }) => {
      // Support both --as and --format (format is alias for as)
      const convertTo = options.format || options.as;

      if (convertTo && !['cursor', 'claude', 'continue', 'windsurf', 'copilot', 'kiro', 'agents.md', 'gemini.md', 'claude.md', 'canonical', 'gemini'].includes(convertTo)) {
        throw new CLIError('❌ Format must be one of: cursor, claude, continue, windsurf, copilot, kiro, agents.md, canonical, gemini\n\n💡 Examples:\n   prpm install my-package --as cursor       # Convert to Cursor format\n   prpm install my-package --format claude   # Convert to Claude format\n   prpm install my-package --format kiro     # Convert to Kiro format\n   prpm install my-package --format agents.md # Convert to Agents.md format\n   prpm install my-package                   # Install in native format', 1);
      }

      // If no package specified, install from lockfile
      if (!packageSpec) {
        await installFromLockfile({
          as: convertTo,
          subtype: options.subtype as Subtype | undefined,
          frozenLockfile: options.frozenLockfile,
          location: options.location,
        });
        return;
      }

      await handleInstall(packageSpec, {
        version: options.version,
        as: convertTo,
        subtype: options.subtype as Subtype | undefined,
        frozenLockfile: options.frozenLockfile,
        location: options.location,
        noAppend: options.noAppend,
        manifestFile: options.manifestFile,
      });
    });

  return command;
}
