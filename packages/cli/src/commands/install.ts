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
import { Package, Format, Subtype, FORMATS, FORMAT_NATIVE_SUBTYPES } from '../types';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import * as tar from 'tar';
import { CLIError } from '../core/errors';
import { promptYesNo } from '../core/prompts';
import path from 'path';
import zlib from 'zlib';
import fs from 'fs/promises';
import os from 'os';
import semver from 'semver';
import { handleCollectionInstall } from './collections.js';
import {
  readLockfile,
  writeLockfile,
  createLockfile,
  addToLockfile,
  setPackageIntegrity,
  verifyPackageIntegrity,
  getLockedVersion,
  getLockfileKey,
  parseLockfileKey,
} from '../core/lockfile';
import { applyCursorConfig, hasMDCHeader, addMDCHeader } from '../core/cursor-config';
import { applyClaudeConfig, hasClaudeHeader } from '../core/claude-config';
import { addSkillToManifest, type SkillManifestEntry } from '../core/agents-md-progressive.js';
import { mergeEditorMCPServers, getMCPConfigLocation, type MCPServer, type MCPEditor, MCP_EDITORS } from '../core/mcp.js';
import { installSnippet, type SnippetConfig } from '../core/snippet.js';
import {
  fromCursor,
  fromClaude,
  fromContinue,
  fromCopilot,
  fromKiro,
  fromWindsurf,
  fromAgentsMd,
  fromGemini,
  fromGeminiPlugin,
  parsePluginJson,
  parseMCPServerJson,
  toCursor,
  toClaude,
  toContinue,
  toCopilot,
  VALID_HOOK_MAPPING_STRATEGIES,
  isValidHookMappingStrategy,
  toKiro,
  toWindsurf,
  toAgentsMd,
  toGemini,
  toGeminiPlugin,
  toRuler,
  toOpencode,
  toDroid,
  toTrae,
  toAider,
  toZencoder,
  toReplit,
  toCodex,
  toCursorHooks,
  validateFormat,
  getNestedIndicator,
  getFilePatterns,
  getFileExtension,
  getDefaultSubtype,
  resolveFormatForSubtype,
  type CanonicalPackage,
  type HookMappingStrategy,
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
    'plugin': '🔌',
    'extension': '📦',
    'server': '🖥️',
    'snippet': '📎',
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
    'gemini-extension': '✨',
    'gemini.md': '✨',
    'claude.md': '🤖',
    'opencode': '⚡',
    'droid': '🏭',
    'trae': '🎯',
    'aider': '🤝',
    'zencoder': '⚡',
    'replit': '🔮',
    'zed': '⚡',
    'codex': '🧠',
    'amp': '⚡',
    'mcp': '🔗',
    'agents.md': '📝',
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
    'gemini-extension': 'Gemini Extension',
    'gemini.md': 'Gemini',
    'claude.md': 'Claude',
    'opencode': 'OpenCode',
    'droid': 'Factory Droid',
    'trae': 'Trae',
    'aider': 'Aider',
    'zencoder': 'Zencoder',
    'replit': 'Replit',
    'zed': 'Zed',
    'codex': 'Codex',
    'amp': 'Amp',
    'mcp': 'MCP',
    'agents.md': 'Agents.md',
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
    'plugin': 'Plugin',
    'extension': 'Extension',
    'server': 'Server',
    'snippet': 'Snippet',
  };

  const formatLabel = formatLabels[format];
  const subtypeLabel = subtypeLabels[subtype];

  if (format === 'generic') {
    return subtypeLabel;
  }

  return `${formatLabel} ${subtypeLabel}`;
}


/**
 * Find the main file in a multi-file package based on format/subtype conventions.
 * Uses the format-registry.json as the single source of truth.
 */
function findMainFile(
  files: Array<{ name: string; content: string }>,
  format: string,
  subtype: string
): { name: string; content: string } | null {
  // 1. Check nestedIndicator from format registry (e.g., SKILL.md for Claude skills)
  const nestedIndicator = getNestedIndicator(format, subtype);
  if (nestedIndicator) {
    const match = files.find(f => {
      const filename = path.basename(f.name);
      return filename.toLowerCase() === nestedIndicator.toLowerCase();
    });
    if (match) return match;
  }

  // 2. Check filePatterns from format registry (e.g., ["*.mdc"] for Cursor rules)
  const filePatterns = getFilePatterns(format, subtype);
  if (filePatterns) {
    for (const pattern of filePatterns) {
      for (const file of files) {
        const filename = path.basename(file.name);
        if (pattern.startsWith('*')) {
          // Glob pattern like *.mdc or *.md
          const extension = pattern.slice(1); // Remove the *
          if (filename.endsWith(extension)) {
            return file;
          }
        } else {
          // Exact filename match (case-insensitive)
          if (filename.toLowerCase() === pattern.toLowerCase()) {
            return file;
          }
        }
      }
    }
  }

  // 3. Fallback: look for common main file names
  const fallbackPatterns = [
    'SKILL.md', 'skill.md',
    'agent.md', 'AGENT.md',
    'command.md', 'COMMAND.md',
    'rule.md', 'RULE.md',
    'index.md', 'INDEX.md',
    'main.md', 'MAIN.md',
    'README.md',
  ];

  for (const pattern of fallbackPatterns) {
    for (const file of files) {
      const filename = path.basename(file.name);
      if (filename.toLowerCase() === pattern.toLowerCase()) {
        return file;
      }
    }
  }

  // 4. Last resort: return the first .md file
  const mdFile = files.find(f => f.name.endsWith('.md'));
  if (mdFile) {
    return mdFile;
  }

  return null;
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
    global?: boolean; // Install MCP servers to global config
    editor?: MCPEditor; // Target editor for MCP server installation (claude, codex)
    hookMapping?: HookMappingStrategy; // Hook mapping strategy for cross-format hook conversion
    eager?: boolean; // Force skill/agent to always activate (not on-demand)
    fromCollection?: {
      scope?: string;
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
        eager: options.eager,
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

    // Determine target format for installation check
    // Priority: 1. --as flag, 2. config default, 3. auto-detect, 4. package native format
    let targetFormat = options.as;
    if (!targetFormat) {
      targetFormat = config.defaultFormat || (await autoDetectFormat()) || undefined;
    }

    // Get locked version for the specific format if available
    const lockedVersion = getLockedVersion(lockfile, packageId, targetFormat);

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

    // Check if package is already installed in the same format (skip if --force option is set)
    if (!options.force && lockfile && targetFormat) {
      // Try to find an existing installation
      // For snippets, the key includes location, so we need to search
      const requestedLocation = options.location?.trim();
      let installedPkg: typeof lockfile.packages[string] | undefined;
      let matchedKey: string | undefined;

      // First, check for snippet installations at the requested location (or default AGENTS.md)
      const snippetLocation = requestedLocation || 'AGENTS.md';
      const snippetKey = getLockfileKey(packageId, targetFormat, snippetLocation);
      if (lockfile.packages[snippetKey]) {
        installedPkg = lockfile.packages[snippetKey];
        matchedKey = snippetKey;
      }

      // If not found as snippet, check for non-snippet installation
      if (!installedPkg) {
        const standardKey = getLockfileKey(packageId, targetFormat);
        if (lockfile.packages[standardKey]) {
          installedPkg = lockfile.packages[standardKey];
          matchedKey = standardKey;
        }
      }

      if (installedPkg) {
        const requestedVersion = options.version || specVersion;

        // Check if installing to a different location than what's already installed
        // This allows installing the same package to multiple files (especially for snippets)
        const existingLocation = installedPkg.snippetMetadata?.targetPath || installedPkg.installedPath;
        let isDifferentLocation = false;

        if (requestedLocation && existingLocation) {
          if (installedPkg.subtype === 'snippet') {
            // For snippets, location refers directly to the target file
            isDifferentLocation = path.resolve(requestedLocation) !== path.resolve(existingLocation);
          } else {
            // For other formats, location is a directory; compare directory paths
            const existingDir = path.dirname(existingLocation);
            isDifferentLocation = path.resolve(requestedLocation) !== path.resolve(existingDir);
          }
        }

        // If no specific version requested, or same version requested
        if (!requestedVersion || requestedVersion === 'latest' || requestedVersion === installedPkg.version) {
          // If installing to a different location, proceed with install
          if (isDifferentLocation) {
            console.log(`📦 Installing ${packageId} to different location: ${requestedLocation}`);
            console.log(`   (already installed at: ${existingLocation})`);
          } else {
            console.log(`\n✨ Package already installed!`);
            console.log(`   📦 ${packageId}@${installedPkg.version}`);
            console.log(`   🔄 Format: ${installedPkg.format || 'unknown'} | Subtype: ${installedPkg.subtype || 'unknown'}`);
            console.log(`\n💡 To reinstall or upgrade:`);
            console.log(`   prpm upgrade ${packageId}     # Upgrade to latest version`);
            console.log(`   prpm uninstall ${packageId}   # Uninstall first, then install`);
            console.log(`   prpm install ${packageId} --as <format>  # Install in different format`);
            success = true;
            return;
          }
        } else {
          // Different version requested - allow upgrade/downgrade
          console.log(`📦 Upgrading ${packageId}: ${installedPkg.version} → ${requestedVersion}`);
        }
      } else if (options.as) {
        // Different format explicitly requested - check if any other format is installed
        const existingFormats: string[] = [];
        for (const key of Object.keys(lockfile.packages)) {
          const parsed = parseLockfileKey(key);
          if (parsed.packageId === packageId && parsed.format) {
            existingFormats.push(parsed.format);
          }
        }
        if (existingFormats.length > 0) {
          console.log(`📦 Installing ${packageId} in ${targetFormat} format (already have ${existingFormats.join(', ')} version${existingFormats.length > 1 ? 's' : ''})`);
        }
      }
    }

    console.log(`📥 Installing ${packageId}@${version}...`);

    const client = getRegistryClient(config);

    // Check if this is a collection first (by trying to fetch it)
    // Collections can be: name or name@version
    let isCollection = false;
    try {
      // Try to fetch as collection
      await client.getCollection(packageId, version === 'latest' ? undefined : version);
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

    // Apply format fallback if target format doesn't support the source subtype
    // e.g., gemini doesn't support skills/agents, fall back to gemini.md
    if (options.as && format && format !== 'canonical') {
      const fallbackResult = resolveFormatForSubtype(format, pkg.subtype);
      if (fallbackResult.fallbackUsed) {
        console.log(`   ⚠️  ${fallbackResult.reason}`);
        format = fallbackResult.format;
      }
      // Only show conversion message when format actually differs from source
      // Skip for snippets - they don't need format conversion
      if (format !== pkg.format && pkg.subtype !== 'snippet') {
        console.log(`   🔄 Converting to ${format} format...`);
      }
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
      // Check if version is a semver range (e.g., ^1.0.0, ~1.2.3)
      let resolvedVersion = version;

      if (semver.validRange(version) && !semver.valid(version)) {
        // It's a semver range, not an exact version - need to resolve it
        console.log(`   🔍 Resolving semver range: ${version}`);

        // Get all available versions
        const versionsData = await client.getPackageVersions(packageId);
        const availableVersions = versionsData.versions.map(v => v.version);

        // Find the best matching version
        const maxSatisfying = semver.maxSatisfying(availableVersions, version);

        if (!maxSatisfying) {
          throw new Error(`No version found matching range "${version}". Available versions: ${availableVersions.join(', ')}`);
        }

        resolvedVersion = maxSatisfying;
        console.log(`   ✓ Resolved to version ${resolvedVersion}`);
      }

      const versionInfo = await client.getPackageVersion(packageId, resolvedVersion);
      tarballUrl = versionInfo.tarball_url;
      actualVersion = resolvedVersion;
      console.log(`   📦 Installing version ${resolvedVersion}`);
    }

    // Download package in native format (conversion happens client-side)
    console.log(`   ⬇️  Downloading...`);
    const tarball = await client.downloadPackage(tarballUrl);

    // Verify integrity if we have a lockfile with integrity hash for this package
    // Only verify if the version matches - different versions will have different hashes
    const lockfileKeyForVerification = getLockfileKey(packageId, targetFormat);
    const existingEntry = lockfile?.packages[lockfileKeyForVerification];
    if (existingEntry?.integrity && existingEntry.version === actualVersion) {
      console.log(`   🔒 Verifying integrity...`);
      const isValid = verifyPackageIntegrity(lockfile!, packageId, tarball, targetFormat);
      if (!isValid) {
        throw new CLIError(
          `❌ Integrity verification failed for ${packageId}\n\n` +
          `The downloaded package does not match the expected hash from prpm.lock.\n` +
          `This could indicate:\n` +
          `  • A corrupted download\n` +
          `  • A modified package on the registry\n` +
          `  • A potential security issue\n\n` +
          `💡 To force installation anyway, delete the package from prpm.lock and retry.`
        );
      }
      console.log(`   ✓ Integrity verified`);
    }

    // Extract tarball and save files
    console.log(`   📂 Extracting...`);

    // Determine effective format and subtype (from conversion or package native format)
    const effectiveFormat = (format as Format) || pkg.format;
    const effectiveSubtype = options.subtype || pkg.subtype;

    // Extract all files from tarball
    let extractedFiles = await extractTarball(tarball, packageId);

    // Client-side format conversion (if --as flag is specified)
    // Skip conversion for snippets - they're raw content that doesn't need format conversion
    if (options.as && format && format !== pkg.format && effectiveSubtype !== 'snippet') {
      console.log(`   🔄 Converting from ${pkg.format} to ${format}...`);

      // Find the main file to convert
      // For single-file packages, use the only file
      // For multi-file packages, find the main file based on format/subtype conventions
      let sourceContent: string;

      if (extractedFiles.length === 1) {
        sourceContent = extractedFiles[0].content;
      } else {
        // Multi-file package: find the main file
        const mainFile = findMainFile(extractedFiles, pkg.format, pkg.subtype);
        if (!mainFile) {
          throw new CLIError(
            `Could not identify main file for multi-file ${pkg.format} ${pkg.subtype} package. ` +
            `Expected files like SKILL.md, agent.md, or similar main entry points.`
          );
        }
        console.log(`   📄 Using main file: ${mainFile.name}`);
        sourceContent = mainFile.content;
      }

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
            // Check subtype: extension uses fromGeminiPlugin, slash-command uses fromGemini
            if (pkg.subtype === 'extension') {
              canonicalPkg = fromGeminiPlugin(sourceContent, metadata);
            } else {
              canonicalPkg = fromGemini(sourceContent, metadata);
            }
            break;
          default:
            throw new CLIError(`Unsupported source format for conversion: ${pkg.format}`);
        }
      } catch (error: any) {
        throw new CLIError(`Failed to parse ${pkg.format} format: ${error.message}`);
      }

      // Convert from canonical to target format
      let convertedContent: string;
      const targetFormat = format?.toLowerCase();

      try {
        switch (targetFormat) {
          case 'cursor':
            // Check if targeting cursor hooks subtype
            if (effectiveSubtype === 'hook') {
              const cursorHooksResult = toCursorHooks(canonicalPkg, {
                hookMappingStrategy: options.hookMapping || 'auto'
              });
              convertedContent = cursorHooksResult.content;
            } else {
              const cursorResult = toCursor(canonicalPkg);
              convertedContent = cursorResult.content;
            }
            break;
          case 'claude':
          case 'claude.md':
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
            // Native Gemini CLI format (TOML with prompt = """)
            if (effectiveSubtype === 'extension') {
              const geminiPluginResult = toGeminiPlugin(canonicalPkg);
              convertedContent = geminiPluginResult.content;
            } else {
              const geminiResult = toGemini(canonicalPkg);
              convertedContent = geminiResult.content;
            }
            break;
          case 'gemini.md':
            // Progressive disclosure format (plain markdown for GEMINI.md manifest)
            const geminiMdResult = toAgentsMd(canonicalPkg);
            convertedContent = geminiMdResult.content;
            break;
          case 'ruler':
            convertedContent = toRuler(canonicalPkg).content;
            break;
          case 'opencode':
            convertedContent = toOpencode(canonicalPkg).content;
            break;
          case 'droid':
            convertedContent = toDroid(canonicalPkg).content;
            break;
          case 'trae':
            convertedContent = toTrae(canonicalPkg).content;
            break;
          case 'aider':
            convertedContent = toAider(canonicalPkg).content;
            break;
          case 'zencoder':
            convertedContent = toZencoder(canonicalPkg).content;
            break;
          case 'replit':
            convertedContent = toReplit(canonicalPkg).content;
            break;
          case 'codex':
            // Codex uses AGENTS.md with section-based slash commands
            convertedContent = toCodex(canonicalPkg).content;
            break;
          case 'generic':
            convertedContent = toCursor(canonicalPkg).content;
            break;
          case 'canonical':
            convertedContent = JSON.stringify(canonicalPkg, null, 2);
            break;
          default:
            throw new CLIError(`Unsupported target format for conversion: ${targetFormat || format}`);
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

    // Allow --location for snippets (to override target file) regardless of format
    const isSnippet = effectiveSubtype === 'snippet';
    if (locationOverride && !locationSupportedFormats.includes(effectiveFormat) && !isSnippet) {
      console.log(`   ⚠️  --location option currently applies to Cursor, Agents.md, or snippet installs. Ignoring provided value for ${effectiveFormat}.`);
      locationOverride = undefined;
    }

    // Track where files were saved for user feedback
    let destPath = ''; // Will be set based on format/subtype before saving
    let destDir = ''; // Destination directory (needed for progressive disclosure)
    let fileCount = 0;
    let hookMetadata: { events: string[]; hookId: string } | undefined = undefined;
    let pluginMetadata: { files: string[]; mcpServers?: Record<string, MCPServer>; mcpGlobal?: boolean; mcpEditor?: MCPEditor } | undefined = undefined;
    let snippetMetadata: { targetPath: string; config: SnippetConfig } | undefined = undefined;

    // Special handling for Claude plugins (bundles of agents, skills, commands, and MCP servers)
    // Note: claude plugins are format: 'claude', subtype: 'plugin'
    const isClaudePlugin = (pkg.format === 'claude' && pkg.subtype === 'plugin');
    if (isClaudePlugin) {
      console.log(`   🔌 Installing Claude Plugin...`);

      // Find and parse plugin.json
      const pluginJsonFile = extractedFiles.find(f =>
        f.name === 'plugin.json' ||
        f.name === '.claude-plugin/plugin.json' ||
        f.name.endsWith('/plugin.json')
      );

      let pluginConfig: { mcpServers?: Record<string, MCPServer> } = {};
      if (pluginJsonFile) {
        try {
          pluginConfig = parsePluginJson(pluginJsonFile.content);
        } catch (err) {
          console.log(`   ⚠️  Warning: Could not parse plugin.json: ${err}`);
        }
      }

      // Track all installed files for the lockfile
      const installedFiles: string[] = [];

      // Install agents to .claude/agents/
      const agentFiles = extractedFiles.filter(f =>
        f.name.startsWith('agents/') && f.name.endsWith('.md')
      );
      if (agentFiles.length > 0) {
        await fs.mkdir('.claude/agents', { recursive: true });
        for (const file of agentFiles) {
          const filename = path.basename(file.name);
          const destFile = `.claude/agents/${filename}`;
          await saveFile(destFile, file.content);
          installedFiles.push(destFile);
        }
        console.log(`   ✓ Installed ${agentFiles.length} agents to .claude/agents/`);
      }

      // Install skills to .claude/skills/
      const skillFiles = extractedFiles.filter(f =>
        f.name.startsWith('skills/') && (f.name.endsWith('.md') || f.name.includes('SKILL.md'))
      );
      if (skillFiles.length > 0) {
        for (const file of skillFiles) {
          // Preserve skill directory structure (e.g., skills/my-skill/SKILL.md)
          const relativePath = file.name.replace(/^skills\//, '');
          const destFile = `.claude/skills/${relativePath}`;
          const destFileDir = path.dirname(destFile);
          await fs.mkdir(destFileDir, { recursive: true });
          await saveFile(destFile, file.content);
          installedFiles.push(destFile);
        }
        console.log(`   ✓ Installed ${skillFiles.length} skill files to .claude/skills/`);
      }

      // Install commands to .claude/commands/
      const commandFiles = extractedFiles.filter(f =>
        f.name.startsWith('commands/') && f.name.endsWith('.md')
      );
      if (commandFiles.length > 0) {
        await fs.mkdir('.claude/commands', { recursive: true });
        for (const file of commandFiles) {
          const filename = path.basename(file.name);
          const destFile = `.claude/commands/${filename}`;
          await saveFile(destFile, file.content);
          installedFiles.push(destFile);
        }
        console.log(`   ✓ Installed ${commandFiles.length} commands to .claude/commands/`);
      }

      // Merge MCP servers if present
      if (pluginConfig.mcpServers && Object.keys(pluginConfig.mcpServers).length > 0) {
        const editor = options.editor || 'claude';
        const globalOnlyEditors = ['windsurf', 'zed'];
        const localOnlyEditors = ['trae'];
        const isGlobal = globalOnlyEditors.includes(editor) ? true : (options.global || false);
        if (globalOnlyEditors.includes(editor)) {
          console.log(`   Note: ${editor.charAt(0).toUpperCase() + editor.slice(1)} only supports global MCP configuration`);
        }
        if (localOnlyEditors.includes(editor) && options.global) {
          console.log(`   Note: ${editor.charAt(0).toUpperCase() + editor.slice(1)} only supports project-local MCP configuration, ignoring --global`);
        }
        const mcpResult = mergeEditorMCPServers(
          pluginConfig.mcpServers,
          editor,
          isGlobal,
          process.cwd()
        );

        if (mcpResult.added.length > 0) {
          const location = getMCPConfigLocation(editor, isGlobal);
          console.log(`   ✓ Added MCP servers to ${location}: ${mcpResult.added.join(', ')}`);
        }
        if (mcpResult.skipped.length > 0) {
          console.log(`   ⚠️  Skipped existing MCP servers: ${mcpResult.skipped.join(', ')}`);
        }

        // Store in pluginMetadata for lockfile
        pluginMetadata = {
          files: installedFiles,
          mcpServers: pluginConfig.mcpServers,
          mcpGlobal: isGlobal,
          mcpEditor: editor,
        };
      } else {
        pluginMetadata = {
          files: installedFiles,
        };
      }

      destPath = '.claude/';
      fileCount = installedFiles.length;
    }
    // Special handling for MCP server packages (install server configs to .mcp.json)
    else if (effectiveFormat === 'mcp' && effectiveSubtype === 'server') {
      console.log(`   🔧 Installing MCP Server...`);

      // Find and parse the MCP server config file
      const mcpServerFile = extractedFiles.find(f =>
        f.name === 'mcp-server.json' ||
        f.name.endsWith('/mcp-server.json') ||
        (f.name.endsWith('.json') && !f.name.includes('/'))
      );

      if (!mcpServerFile) {
        throw new Error('MCP server package must contain a JSON configuration file');
      }

      let mcpServerConfig;
      try {
        mcpServerConfig = parseMCPServerJson(mcpServerFile.content);
      } catch (error) {
        throw new Error(`Failed to parse MCP server config: ${error instanceof Error ? error.message : error}`);
      }

      // Merge MCP servers into config (supports Claude, Codex, etc.)
      const editor = options.editor || 'claude';
      const globalOnlyEditors = ['windsurf', 'zed'];
      const localOnlyEditors = ['trae'];
      const isGlobal = globalOnlyEditors.includes(editor) ? true : (options.global || false);
      if (globalOnlyEditors.includes(editor)) {
        console.log(`   Note: ${editor.charAt(0).toUpperCase() + editor.slice(1)} only supports global MCP configuration`);
      }
      if (localOnlyEditors.includes(editor) && options.global) {
        console.log(`   Note: ${editor.charAt(0).toUpperCase() + editor.slice(1)} only supports project-local MCP configuration, ignoring --global`);
      }
      const mcpResult = mergeEditorMCPServers(
        mcpServerConfig.mcpServers,
        editor,
        isGlobal
      );

      if (mcpResult.added.length > 0) {
        const location = getMCPConfigLocation(editor, isGlobal);
        console.log(`   ✓ Added MCP servers to ${location}: ${mcpResult.added.join(', ')}`);
      }

      if (mcpResult.skipped.length > 0) {
        console.log(`   ⚠️  Skipped existing MCP servers: ${mcpResult.skipped.join(', ')}`);
      }

      for (const warning of mcpResult.warnings) {
        console.log(`   ⚠️  ${warning}`);
      }

      // Store in pluginMetadata for lockfile (reuse same structure)
      pluginMetadata = {
        files: [], // No files to track for MCP server packages
        mcpServers: mcpServerConfig.mcpServers,
        mcpGlobal: isGlobal,
        mcpEditor: editor,
      };

      destPath = getMCPConfigLocation(editor, isGlobal);
      fileCount = Object.keys(mcpServerConfig.mcpServers).length;
    }
    // Special handling for snippet packages (append content to existing files)
    else if (effectiveSubtype === 'snippet') {
      console.log(`   📎 Installing Snippet...`);

      if (extractedFiles.length !== 1) {
        throw new Error('Snippet packages must contain exactly one file');
      }

      const snippetContent = extractedFiles[0].content;

      // Get snippet config from package metadata
      // The snippet config should be in pkg.snippet (from prpm.json)
      const snippetConfig: SnippetConfig = (pkg as any).snippet || {
        target: 'AGENTS.md', // Default target
        position: 'append',
      };

      // Allow --location to override the target file (e.g., --location CLAUDE.md)
      if (locationOverride) {
        snippetConfig.target = locationOverride;
        console.log(`   📁 Using custom target: ${locationOverride}`);
      }

      if (!snippetConfig.target) {
        throw new Error('Snippet package must specify a target file in prpm.json');
      }

      const result = await installSnippet(
        snippetContent,
        packageId,
        actualVersion || version,
        snippetConfig
      );

      destPath = result.targetPath;
      fileCount = 1;

      // Store snippet metadata for lockfile
      snippetMetadata = {
        targetPath: result.targetPath,
        config: snippetConfig,
      };

      if (result.created) {
        console.log(`   ✓ Created ${result.targetPath} with snippet content`);
      } else {
        console.log(`   ✓ Appended snippet to ${result.targetPath} (${result.position})`);
      }
    }
    // Special handling for CLAUDE.md format (goes in project root)
    else if (format === 'claude-md') {
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
      // Determine file extension from format registry (e.g., .mdc for cursor, .toml for gemini)
      // Use fallback to default subtype if the exact subtype isn't in the registry
      let registryExtension = getFileExtension(effectiveFormat, effectiveSubtype);
      if (!registryExtension) {
        const defaultSubtype = getDefaultSubtype(effectiveFormat);
        if (defaultSubtype) {
          registryExtension = getFileExtension(effectiveFormat, defaultSubtype);
        }
      }
      // Strip leading dot if present, default to 'md'
      const fileExtension = registryExtension?.replace(/^\./, '') || 'md';
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
      } else if (effectiveFormat === 'agents.md' || effectiveFormat === 'gemini.md' || effectiveFormat === 'claude.md' || effectiveFormat === 'codex') {
        // For manifest formats, use progressive disclosure (install to .openskills/ or .openagents/)
        if (effectiveSubtype === 'skill') {
          // Skills go to .openskills/package-name/ directory
          destPath = `${destDir}/SKILL.md`;
          console.log(`   📦 Installing skill to ${destDir}/ for progressive disclosure`);
        } else if (effectiveSubtype === 'agent') {
          // Agents go to .openagents/package-name/ directory
          destPath = `${destDir}/AGENT.md`;
          console.log(`   🤖 Installing agent to ${destDir}/ for progressive disclosure`);
        } else if (effectiveSubtype === 'slash-command') {
          // Commands go to .opencommands/ directory (no subdirectory, just the file)
          destPath = `${destDir}/${packageName}.md`;
          console.log(`   ⚡ Installing command to ${destDir}/ for progressive disclosure`);
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
      } else if (effectiveFormat === 'copilot' && (effectiveSubtype === 'chatmode' || effectiveSubtype === 'rule')) {
        // Official GitHub Copilot naming conventions - only for native subtypes (rule, chatmode)
        // skill/agent subtypes need progressive disclosure via AGENTS.md (handled in else block)
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
      } else if (effectiveFormat === 'aider') {
        // Aider progressive disclosure: store primary content per resource type
        if (effectiveSubtype === 'skill') {
          destPath = `${destDir}/SKILL.md`;
        } else if (effectiveSubtype === 'agent') {
          destPath = `${destDir}/AGENT.md`;
        } else {
          destPath = `${destDir}/CONVENTIONS.md`;
        }
      } else if (effectiveFormat === 'droid' && effectiveSubtype === 'skill') {
        // Factory Droid skills use SKILL.md inside the skill directory
        destPath = `${destDir}/SKILL.md`;
      } else if (effectiveFormat === 'copilot' && effectiveSubtype === 'skill') {
        // GitHub Copilot skills use SKILL.md inside the skill directory
        destPath = `${destDir}/SKILL.md`;
      } else {
        // Check if this format/subtype needs progressive disclosure
        // (format supports the subtype but doesn't have native file location for it)
        const nativeSubtypes = FORMAT_NATIVE_SUBTYPES[effectiveFormat as Format];
        const needsProgressiveDisclosureHere = nativeSubtypes &&
          !nativeSubtypes.includes(effectiveSubtype as Subtype) &&
          (effectiveSubtype === 'skill' || effectiveSubtype === 'agent' || effectiveSubtype === 'slash-command');

        if (needsProgressiveDisclosureHere) {
          // Use progressive disclosure directories
          if (effectiveSubtype === 'skill') {
            destDir = `.openskills/${packageName}`;
            destPath = `${destDir}/SKILL.md`;
            console.log(`   📦 Installing skill to ${destDir}/ for progressive disclosure`);
          } else if (effectiveSubtype === 'agent') {
            destDir = `.openagents/${packageName}`;
            destPath = `${destDir}/AGENT.md`;
            console.log(`   🤖 Installing agent to ${destDir}/ for progressive disclosure`);
          } else if (effectiveSubtype === 'slash-command') {
            destDir = '.opencommands';
            destPath = `${destDir}/${packageName}.md`;
            console.log(`   ⚡ Installing command to ${destDir}/ for progressive disclosure`);
          }
        } else {
          destPath = `${destDir}/${packageName}.${fileExtension}`;
        }
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
        // Ensure destPath is set for hooks (should be set earlier, but TypeScript can't verify)
        destPath = destPath || `${destDir}/settings.json`;

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
      // Multi-file package handling
      const packageName = stripAuthorNamespace(packageId);

      // Check if this format/subtype needs progressive disclosure (same check as single-file branch)
      // This ensures skills go to .openskills/ for formats that don't natively support them
      const nativeSubtypesMulti = FORMAT_NATIVE_SUBTYPES[effectiveFormat as Format];
      const needsProgressiveDisclosureMulti = nativeSubtypesMulti &&
        !nativeSubtypesMulti.includes(effectiveSubtype as Subtype) &&
        (effectiveSubtype === 'skill' || effectiveSubtype === 'agent' || effectiveSubtype === 'slash-command');

      if (needsProgressiveDisclosureMulti) {
        // Use progressive disclosure directories for multi-file packages
        if (effectiveSubtype === 'skill') {
          destDir = `.openskills/${packageName}`;
          console.log(`   📦 Installing multi-file skill to ${destDir}/ for progressive disclosure`);
        } else if (effectiveSubtype === 'agent') {
          destDir = `.openagents/${packageName}`;
          console.log(`   🤖 Installing multi-file agent to ${destDir}/ for progressive disclosure`);
        } else if (effectiveSubtype === 'slash-command') {
          destDir = `.opencommands/${packageName}`;
          console.log(`   ⚡ Installing multi-file command to ${destDir}/ for progressive disclosure`);
        }
      } else {
        // Use format's native directory
        destDir = getDestinationDir(effectiveFormat, effectiveSubtype, pkg.name);
      }

      if (locationOverride && effectiveFormat === 'cursor') {
        const relativeDestDir = destDir.startsWith('./') ? destDir.slice(2) : destDir;
        destDir = path.join(locationOverride, relativeDestDir);
        console.log(`   📁 Installing Cursor package to custom location: ${destDir}`);
      }

      // Multi-file package - create directory for package
      // For Claude skills, destDir already includes package name, so use it directly
      // For Cursor rules converted from Claude skills, use flat structure
      const isCursorConversion = (effectiveFormat === 'cursor' && pkg.format === 'claude' && pkg.subtype === 'skill');
      const packageDir = (effectiveFormat === 'claude' && effectiveSubtype === 'skill')
        ? destDir
        : isCursorConversion
        ? destDir // Cursor uses flat structure
        : needsProgressiveDisclosureMulti
        ? destDir // Progressive disclosure already includes package name
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

    // Handle AGENTS.md manifest update for progressive disclosure skills/agents/commands
    let progressiveDisclosureMetadata: {
      mode: 'progressive';
      resourceDir: string;
      manifestPath: string;
      resourceName: string;
      resourceType: 'skill' | 'agent' | 'command';
      skillsDir?: string;
      skillName?: string;
      eager?: boolean; // Whether this skill/agent/command should always activate
    } | undefined;

    // Check if this format/subtype needs progressive disclosure using FORMAT_NATIVE_SUBTYPES
    // Progressive disclosure is needed when:
    // 1. The subtype is skill, agent, or slash-command AND
    // 2. The format doesn't have native support for that subtype (not in FORMAT_NATIVE_SUBTYPES)
    const nativeSubtypes = FORMAT_NATIVE_SUBTYPES[effectiveFormat as Format];
    const isProgressiveDisclosureSubtype = effectiveSubtype === 'skill' || effectiveSubtype === 'agent' || effectiveSubtype === 'slash-command';
    const hasNativeSupport = nativeSubtypes?.includes(effectiveSubtype as Subtype) ?? false;
    const needsProgressiveDisclosure = isProgressiveDisclosureSubtype && !hasNativeSupport;

    if (needsProgressiveDisclosure && !options.noAppend) {
      // Override destDir to use .openskills/.openagents/.opencommands
      const resourceName = stripAuthorNamespace(packageId);
      if (effectiveSubtype === 'skill') {
        destDir = `.openskills/${resourceName}`;
      } else if (effectiveSubtype === 'agent') {
        destDir = `.openagents/${resourceName}`;
      } else if (effectiveSubtype === 'slash-command') {
        destDir = '.opencommands';
      }

      // Ensure destDir is defined (should always be set by this point for skill/agent installations)
      if (!destDir) {
        throw new Error('Internal error: destDir not set for progressive disclosure installation');
      }

      const manifestPath = options.manifestFile || getManifestFilename(effectiveFormat);
      // resourceName already declared above when setting destDir
      const resourceType = effectiveSubtype === 'slash-command' ? 'command' : effectiveSubtype as 'skill' | 'agent' | 'command';
      let mainFile: string;
      if (resourceType === 'command') {
        mainFile = `${resourceName}.md`;
      } else if (resourceType === 'agent') {
        mainFile = 'AGENT.md';
      } else {
        mainFile = 'SKILL.md';
      }

      // Determine eager setting with precedence: CLI flag > package-level > default (lazy)
      // options.eager is: true (--eager), false (--lazy), or undefined (no flag)
      let resolvedEager: boolean | undefined;
      if (options.eager !== undefined) {
        // CLI flag takes highest priority
        resolvedEager = options.eager;
      } else if (pkg.eager !== undefined) {
        // Package-level eager setting from registry metadata
        resolvedEager = pkg.eager;
      }
      // Default is undefined (treated as false/lazy by manifest generator)

      // Add skill or agent to manifest file (AGENTS.md, GEMINI.md, CLAUDE.md, etc.)
      const manifestEntry: SkillManifestEntry = {
        name: resourceName,
        description: pkg.description || `${pkg.name} ${resourceType}`,
        skillPath: destDir,
        mainFile,
        resourceType,
        eager: resolvedEager,
      };

      await addSkillToManifest(manifestEntry, manifestPath);
      const eagerLabel = resolvedEager ? ' (eager)' : '';
      console.log(`   ✓ Added ${resourceType}${eagerLabel} to ${manifestPath} manifest`);

      progressiveDisclosureMetadata = {
        mode: 'progressive',
        resourceDir: destDir,
        manifestPath,
        resourceName,
        resourceType,
        // Legacy fields for backward compatibility
        skillsDir: destDir,
        skillName: resourceName,
        eager: resolvedEager,
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
      pluginMetadata, // Track plugin installation metadata for uninstall
      snippetMetadata, // Track snippet installation metadata for uninstall
    });

    // For snippets, include the target path in the key
    const snippetTargetPath = effectiveSubtype === 'snippet' ? snippetMetadata?.targetPath : undefined;
    setPackageIntegrity(updatedLockfile, packageId, tarball, effectiveFormat, snippetTargetPath);
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
      const isEager = progressiveDisclosureMetadata.eager;
      console.log(`\n🎓 Skill installed with progressive disclosure`);
      console.log(`   📝 Skill added to ${manifestFile} manifest`);
      if (isEager) {
        console.log(`   🔥 This skill will be loaded at the START of every session (eager mode)`);
        console.log(`   ⚡ Your AI agent will always apply this skill - no activation needed`);
      } else {
        console.log(`   💡 The skill is available but not loaded into context by default`);
        console.log(`   ⚡ Your AI agent will activate this skill automatically when relevant based on its description`);
      }
    }

    // Show plugin installation summary
    if (pluginMetadata) {
      console.log(`\n🔌 Plugin installation complete`);
      console.log(`   📦 Installed ${pluginMetadata.files.length} file(s)`);
      if (pluginMetadata.mcpServers && Object.keys(pluginMetadata.mcpServers).length > 0) {
        const serverCount = Object.keys(pluginMetadata.mcpServers).length;
        const location = pluginMetadata.mcpGlobal ? '~/.claude/settings.json' : '.mcp.json';
        console.log(`   🔧 Configured ${serverCount} MCP server(s) in ${location}`);
      }
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

/**
 * Validate that a path is safe and doesn't escape the target directory
 * Prevents path traversal attacks (e.g., ../../../etc/passwd)
 */
function isPathSafe(targetDir: string, filePath: string): boolean {
  // Resolve the full path
  const resolvedPath = path.resolve(targetDir, filePath);
  const resolvedTarget = path.resolve(targetDir);

  // Check that the resolved path starts with the target directory
  // This prevents ../ path traversal attacks
  return resolvedPath.startsWith(resolvedTarget + path.sep) || resolvedPath === resolvedTarget;
}

/**
 * Check if a filename contains potentially dangerous patterns
 */
function hasUnsafePathPatterns(filePath: string): boolean {
  // Check for path traversal patterns
  if (filePath.includes('..')) return true;

  // Check for absolute paths (Unix and Windows)
  if (filePath.startsWith('/')) return true;
  if (/^[a-zA-Z]:/.test(filePath)) return true;

  // Check for null bytes (can truncate paths in some systems)
  if (filePath.includes('\0')) return true;

  return false;
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
      strict: true, // Enable strict mode to reject malformed archives
      // Security: filter out dangerous entries before extraction
      filter: (entryPath: string, entry) => {
        // Block symlinks - they can be used for path traversal attacks
        // Check if entry has a 'type' property (ReadEntry) vs Stats
        const entryType = 'type' in entry ? entry.type : null;
        if (entryType === 'SymbolicLink' || entryType === 'Link') {
          console.warn(`   ⚠️  Blocked symlink in package: ${entryPath}`);
          return false;
        }

        // Also check isSymbolicLink() for Stats objects
        if ('isSymbolicLink' in entry && entry.isSymbolicLink()) {
          console.warn(`   ⚠️  Blocked symlink in package: ${entryPath}`);
          return false;
        }

        // Block entries with unsafe path patterns
        if (hasUnsafePathPatterns(entryPath)) {
          console.warn(`   ⚠️  Blocked unsafe path in package: ${entryPath}`);
          return false;
        }

        // Verify the path stays within the extraction directory
        if (!isPathSafe(tmpDir, entryPath)) {
          console.warn(`   ⚠️  Blocked path traversal attempt: ${entryPath}`);
          return false;
        }

        return true;
      },
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
  hookMapping?: HookMappingStrategy;
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
    for (const lockfileKey of packageIds) {
      const lockEntry = lockfile.packages[lockfileKey];

      // Parse lockfile key to get package ID and format (outside try block for error handling)
      const { packageId, format } = parseLockfileKey(lockfileKey);
      const displayName = format ? `${packageId} (${format})` : packageId;

      try {
        // Extract package spec (strip version if present in packageId)
        const packageSpec = packageId.includes('@') && !packageId.startsWith('@')
          ? packageId.substring(0, packageId.lastIndexOf('@'))
          : packageId;

        console.log(`  Installing ${displayName}...`);

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
          hookMapping: options.hookMapping,
          fromCollection: lockEntry.fromCollection, // Preserve collection metadata
        });

        successCount++;
      } catch (error) {
        // Check if this is a success exit (CLIError with exitCode 0)
        if (error instanceof CLIError && error.exitCode === 0) {
          successCount++;
        } else {
          failCount++;
          console.error(`  ❌ Failed to install ${displayName}:`);
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
    .option('--as <format>', `Convert and install in specific format (${FORMATS.join(', ')})`)
    .option('--format <format>', 'Alias for --as')
    .option('--location <path>', 'Custom location for installed files (Agents.md or nested Cursor rules)')
    .option('--subtype <subtype>', 'Specify subtype when converting (skill, agent, rule, etc.)')
    .option('--hook-mapping <strategy>', 'Hook mapping strategy: auto (default), strict, skip', 'auto')
    .option('--frozen-lockfile', 'Fail if lock file needs to be updated (for CI)')
    .option('-y, --yes', 'Auto-confirm prompts (overwrite files without asking)')
    .option('--no-append', 'Skip adding skill to manifest file (skill files only)')
    .option('--manifest-file <filename>', 'Custom manifest filename for progressive disclosure')
    .option('--eager', 'Force skill/agent to always activate (not on-demand)')
    .option('--lazy', 'Use default on-demand activation (overrides package eager setting)')
    .option('--global', 'Install MCP servers to global config (e.g., ~/.claude/settings.json, ~/.codex/config.toml, ~/.cursor/mcp.json, ~/.kiro/settings/mcp.json)')
    .option('--editor <editor>', 'Target editor for MCP server installation (claude, codex, cursor, windsurf, vscode, gemini, opencode, kiro, trae, amp, zed)', 'claude')
    .action(async (packageSpec: string | undefined, options: { version?: string; as?: string; format?: string; subtype?: string; hookMapping?: string; frozenLockfile?: boolean; yes?: boolean; location?: string; noAppend?: boolean; manifestFile?: string; eager?: boolean; lazy?: boolean; global?: boolean; editor?: string }) => {
      // Support both --as and --format (format is alias for as)
      const convertTo = (options.format || options.as) as Format | undefined;
      const validFormats = FORMATS;

      if (convertTo && !validFormats.includes(convertTo)) {
        throw new CLIError(`❌ Format must be one of: ${validFormats.join(', ')}\n\n💡 Examples:\n   prpm install my-package --as cursor       # Convert to Cursor format\n   prpm install my-package --format claude   # Convert to Claude format\n   prpm install my-package --format claude.md # Convert to Claude.md format\n   prpm install my-package --format kiro     # Convert to Kiro format\n   prpm install my-package --format agents.md # Convert to Agents.md format\n   prpm install my-package --format gemini.md # Convert to Gemini format\n   prpm install my-package                   # Install in native format`, 1);
      }

      // Validate editor for MCP server installation
      if (options.editor && !MCP_EDITORS.includes(options.editor as MCPEditor)) {
        throw new CLIError(
          `Invalid MCP editor: ${options.editor}\n\nSupported editors: ${MCP_EDITORS.join(', ')}\n\n💡 Examples:\n   prpm install my-mcp-server --editor claude    # Install to .mcp.json\n   prpm install my-mcp-server --editor codex     # Install to codex.toml\n   prpm install my-mcp-server --editor cursor    # Install to .cursor/mcp.json\n   prpm install my-mcp-server --editor windsurf  # Install to ~/.codeium/windsurf/mcp_config.json\n   prpm install my-mcp-server --editor vscode    # Install to .vscode/mcp.json\n   prpm install my-mcp-server --editor gemini    # Install to .gemini/settings.json\n   prpm install my-mcp-server --editor opencode  # Install to opencode.json\n   prpm install my-mcp-server --editor kiro      # Install to .kiro/settings/mcp.json\n   prpm install my-mcp-server --editor trae      # Install to .trae/mcp.json\n   prpm install my-mcp-server --editor amp       # Install to .amp/settings.json\n   prpm install my-mcp-server --editor zed       # Install to ~/.config/zed/settings.json`
        );
      }

      // Validate hook mapping strategy
      if (options.hookMapping && !isValidHookMappingStrategy(options.hookMapping)) {
        throw new CLIError(
          `Invalid hook mapping strategy: ${options.hookMapping}\n\nValid strategies: ${VALID_HOOK_MAPPING_STRATEGIES.join(', ')}`
        );
      }

      // If no package specified, install from lockfile
      if (!packageSpec) {
        await installFromLockfile({
          as: convertTo,
          subtype: options.subtype as Subtype | undefined,
          frozenLockfile: options.frozenLockfile,
          location: options.location,
          hookMapping: options.hookMapping as HookMappingStrategy | undefined,
        });
        return;
      }

      // Determine eager setting: --eager flag takes precedence, then --lazy, then undefined (use package default)
      const eager = options.eager ? true : options.lazy ? false : undefined;

      await handleInstall(packageSpec, {
        version: options.version,
        as: convertTo,
        subtype: options.subtype as Subtype | undefined,
        frozenLockfile: options.frozenLockfile,
        force: options.yes,
        location: options.location,
        noAppend: options.noAppend,
        manifestFile: options.manifestFile,
        hookMapping: options.hookMapping as HookMappingStrategy | undefined,
        eager,
        global: options.global,
        editor: options.editor as MCPEditor | undefined,
      });
    });

  return command;
}
