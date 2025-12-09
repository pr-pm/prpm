/**
 * Uninstall command implementation
 */

import { Command } from 'commander';
import { removePackage, readLockfile, writeLockfile, getLockfileKey, parseLockfileKey, getCollectionFromLockfile, removeCollectionFromLockfile } from '../core/lockfile';
import { stripAuthorNamespace } from '../core/filesystem';
import { FORMATS } from '../types';
import { promises as fs } from 'fs';
import { CLIError } from '../core/errors';
import { removeSkillFromManifest } from '../core/agents-md-progressive.js';
import { promptYesNo } from '../core/prompts';
import { removeMCPServers } from '../core/mcp.js';
import * as readline from 'readline';

/**
 * Prompt user to select from multiple formats
 */
async function promptForFormat(packageId: string, formats: string[]): Promise<string> {
  console.log(`\n📦 Multiple formats found for ${packageId}:`);
  formats.forEach((fmt, idx) => {
    console.log(`   ${idx + 1}. ${fmt}`);
  });
  console.log(`   ${formats.length + 1}. All formats`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('\nSelect format to uninstall (number): ', (answer) => {
      rl.close();
      const choice = parseInt(answer.trim(), 10);

      if (choice > 0 && choice <= formats.length) {
        resolve(formats[choice - 1]);
      } else if (choice === formats.length + 1) {
        resolve('all');
      } else {
        console.log('Invalid choice, uninstalling all formats');
        resolve('all');
      }
    });
  });
}

/**
 * Handle uninstalling a collection and all its packages
 */
async function handleCollectionUninstall(
  collectionKey: string,
  collection: { name_slug: string; version?: string; packages: string[] } | null,
  lockfile: any,
  requestedFormat?: string
): Promise<void> {
  if (!collection) {
    throw new CLIError(`❌ Collection "collections/${collectionKey}" not found in lockfile`, 1);
  }

  console.log(`\n📦 Uninstalling collection: ${collectionKey}`);
  console.log(`   ${collection.packages.length} packages to uninstall\n`);

  let uninstalledCount = 0;
  let failedCount = 0;

  // Uninstall each package in the collection
  for (const packageId of collection.packages) {
    try {
      // Find all lockfile keys for this package that match the collection
      const matchingKeys: string[] = [];
      for (const key of Object.keys(lockfile.packages)) {
        const parsed = parseLockfileKey(key);
        if (parsed.packageId === packageId) {
          const pkg = lockfile.packages[key];
          // Check if this package was installed from this collection
          if (pkg.fromCollection?.name_slug === collectionKey) {
            // If format is specified, only include matching format
            if (requestedFormat) {
              if (pkg.format === requestedFormat || parsed.format === requestedFormat) {
                matchingKeys.push(key);
              }
            } else {
              matchingKeys.push(key);
            }
          }
        }
      }

      if (matchingKeys.length === 0) {
        console.log(`   ⚠️  ${packageId}: not found (may have been uninstalled manually)`);
        continue;
      }

      // Uninstall each matching format
      for (const lockfileKey of matchingKeys) {
        const parsed = parseLockfileKey(lockfileKey);
        const formatDisplay = parsed.format ? ` (${parsed.format})` : '';

        // Use the existing uninstall logic for individual packages
        await uninstallSinglePackage(lockfileKey, packageId, lockfile);
        console.log(`   ✓ ${packageId}${formatDisplay}`);
        uninstalledCount++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`   ✗ ${packageId}: ${errorMessage}`);
      failedCount++;
    }
  }

  // Remove collection from lockfile
  removeCollectionFromLockfile(lockfile, collectionKey);
  await writeLockfile(lockfile);

  console.log(`\n✅ Collection uninstalled`);
  console.log(`   ${uninstalledCount} packages removed`);
  if (failedCount > 0) {
    console.log(`   ${failedCount} packages failed to uninstall`);
  }
  console.log(`   🔒 Collection removed from lock file`);
}

/**
 * Uninstall a single package by its lockfile key
 * Extracted from handleUninstall for reuse in collection uninstall
 */
async function uninstallSinglePackage(
  lockfileKey: string,
  packageId: string,
  lockfile: any
): Promise<void> {
  const parsed = parseLockfileKey(lockfileKey);
  const pkg = await removePackage(lockfileKey);

  if (!pkg) {
    throw new Error(`Package not found in lockfile`);
  }

  // Special handling for progressive disclosure skills and agents
  if (pkg.progressiveDisclosure) {
    const { manifestPath, resourceName, skillName } = pkg.progressiveDisclosure;
    const name = resourceName || skillName;

    if (name) {
      try {
        await removeSkillFromManifest(name, manifestPath);
      } catch (error) {
        // Silently continue - manifest may have been modified manually
      }
    }
  }

  // Special handling for Claude plugins and MCP server packages
  if (pkg.pluginMetadata) {
    const { files, mcpServers, mcpGlobal } = pkg.pluginMetadata;

    for (const filePath of files) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err.code !== 'ENOENT') {
          // Silently continue
        }
      }
    }

    if (mcpServers && Object.keys(mcpServers).length > 0) {
      removeMCPServers(mcpServers, mcpGlobal || false);
    }

    return;
  }

  // Special handling for Claude hooks
  if (pkg.format === 'claude' && pkg.subtype === 'hook' && pkg.hookMetadata) {
    const settingsPath = pkg.installedPath || '.claude/settings.json';

    try {
      const settingsContent = await fs.readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(settingsContent);

      if (settings.hooks) {
        for (const event of pkg.hookMetadata.events) {
          if (settings.hooks[event]) {
            settings.hooks[event] = settings.hooks[event].filter(
              (hook: any) => hook.__prpm_hook_id !== pkg.hookMetadata!.hookId
            );

            if (settings.hooks[event].length === 0) {
              delete settings.hooks[event];
            }
          }
        }

        await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
      }
    } catch (error) {
      // Silently continue - settings may have been modified manually
    }

    return;
  }

  // Standard file/directory uninstall
  const targetPath = pkg.installedPath;

  if (!targetPath) {
    throw new Error('Installation path unknown');
  }

  try {
    const stats = await fs.stat(targetPath);

    if (stats.isDirectory()) {
      await fs.rm(targetPath, { recursive: true, force: true });
    } else if (stats.isFile()) {
      await fs.unlink(targetPath);
    }
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}

/**
 * Handle the uninstall command
 */
export async function handleUninstall(name: string, options: { format?: string; as?: string } = {}): Promise<void> {
  try {
    const requestedFormat = options.format || options.as;

    if (requestedFormat && !FORMATS.includes(requestedFormat as any)) {
      throw new CLIError(`❌ Format must be one of: ${FORMATS.join(', ')}`, 1);
    }

    // Read lockfile to find all formats for this package
    const lockfile = await readLockfile();

    if (!lockfile) {
      throw new CLIError('❌ No prpm.lock file found', 1);
    }

    // Check if this is a collection (starts with 'collections/' or exists in lockfile.collections)
    const isCollectionPrefix = name.startsWith('collections/');
    const collectionKey = isCollectionPrefix ? name.replace('collections/', '') : name;
    const collection = getCollectionFromLockfile(lockfile, collectionKey);

    if (collection || isCollectionPrefix) {
      // Handle collection uninstall
      await handleCollectionUninstall(collectionKey, collection, lockfile, requestedFormat);
      return;
    }

    // Find all lockfile keys for this package
    const matchingKeys: string[] = [];
    for (const key of Object.keys(lockfile.packages)) {
      const parsed = parseLockfileKey(key);
      if (parsed.packageId === name) {
        matchingKeys.push(key);
      }
    }

    if (matchingKeys.length === 0) {
      throw new CLIError(`❌ Package "${name}" not found`, 1);
    }

    // Determine which format(s) to uninstall
    let keysToUninstall: string[];

    if (requestedFormat) {
      // Specific format requested
      const requestedKey = getLockfileKey(name, requestedFormat);
      if (!lockfile.packages[requestedKey]) {
        // Check if package exists without format suffix
        if (lockfile.packages[name] && lockfile.packages[name].format === requestedFormat) {
          keysToUninstall = [name];
        } else {
          throw new CLIError(`❌ Package "${name}" with format "${requestedFormat}" not found`, 1);
        }
      } else {
        keysToUninstall = [requestedKey];
      }
    } else if (matchingKeys.length > 1) {
      // Multiple formats exist - prompt user
      const formats = matchingKeys.map(key => {
        const parsed = parseLockfileKey(key);
        return parsed.format || lockfile.packages[key].format || 'unknown';
      });

      const selectedFormat = await promptForFormat(name, formats);

      if (selectedFormat === 'all') {
        keysToUninstall = matchingKeys;
      } else {
        const selectedKey = matchingKeys[formats.indexOf(selectedFormat)];
        keysToUninstall = [selectedKey];
      }
    } else {
      // Single format exists
      keysToUninstall = matchingKeys;
    }

    // Uninstall each selected format
    for (const lockfileKey of keysToUninstall) {
      const parsed = parseLockfileKey(lockfileKey);
      const formatDisplay = parsed.format ? ` (${parsed.format})` : '';

      console.log(`\n🗑️  Uninstalling package: ${name}${formatDisplay}`);

      // Remove from lockfile and get package info
      const pkg = await removePackage(lockfileKey);

    if (!pkg) {
      throw new CLIError(`❌ Package "${name}" not found`, 1);
    }

    // Special handling for progressive disclosure skills and agents
    if (pkg.progressiveDisclosure) {
      const { manifestPath, resourceName, skillName } = pkg.progressiveDisclosure;
      // Use resourceName (new) or fall back to skillName (legacy)
      const name = resourceName || skillName;

      if (name) {
        try {
          // Remove skill or agent from AGENTS.md manifest
          await removeSkillFromManifest(name, manifestPath);
          console.log(`   📝 Removed from ${manifestPath} manifest`);
        } catch (error) {
          console.warn(`   ⚠️  Failed to remove from manifest: ${error}`);
        }
      }
    }

    // Special handling for Claude plugins and MCP server packages
    if (pkg.pluginMetadata) {
      const isMCPServerOnly = pkg.pluginMetadata.files.length === 0 && pkg.pluginMetadata.mcpServers;
      console.log(isMCPServerOnly ? `   🔧 Uninstalling MCP server...` : `   🔌 Uninstalling Claude plugin...`);

      // Remove installed files
      const { files, mcpServers, mcpGlobal } = pkg.pluginMetadata;
      let filesRemoved = 0;

      for (const filePath of files) {
        try {
          await fs.unlink(filePath);
          filesRemoved++;
          console.log(`   🗑️  Deleted: ${filePath}`);
        } catch (error) {
          const err = error as NodeJS.ErrnoException;
          if (err.code !== 'ENOENT') {
            console.warn(`   ⚠️  Failed to delete ${filePath}: ${err.message}`);
          }
        }
      }

      if (filesRemoved > 0) {
        console.log(`   📦 Removed ${filesRemoved} file(s)`);
      }

      // Remove MCP servers (only if unchanged from original)
      if (mcpServers && Object.keys(mcpServers).length > 0) {
        const mcpResult = removeMCPServers(mcpServers, mcpGlobal || false);

        if (mcpResult.removed.length > 0) {
          const location = mcpGlobal ? '~/.claude/settings.json' : '.mcp.json';
          console.log(`   🔧 Removed ${mcpResult.removed.length} MCP server(s) from ${location}`);
        }

        for (const warning of mcpResult.warnings) {
          console.log(`   ⚠️  ${warning}`);
        }
      }

      console.log(`✅ Successfully uninstalled ${name}${formatDisplay}`);
      continue; // Move to next package if multiple
    }

    // Special handling for Claude hooks
    if (pkg.format === 'claude' && pkg.subtype === 'hook' && pkg.hookMetadata) {
      const settingsPath = pkg.installedPath || '.claude/settings.json';

      try {
        // Read settings.json
        const settingsContent = await fs.readFile(settingsPath, 'utf-8');
        const settings = JSON.parse(settingsContent);

        if (settings.hooks) {
          let removedCount = 0;

          // Remove hooks with matching hook ID from each event
          for (const event of pkg.hookMetadata.events) {
            if (settings.hooks[event]) {
              const originalLength = settings.hooks[event].length;
              settings.hooks[event] = settings.hooks[event].filter(
                (hook: any) => hook.__prpm_hook_id !== pkg.hookMetadata!.hookId
              );
              const newLength = settings.hooks[event].length;
              removedCount += originalLength - newLength;

              // Clean up empty event arrays
              if (settings.hooks[event].length === 0) {
                delete settings.hooks[event];
              }
            }
          }

          // Write updated settings back
          await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
          console.log(`   🪝 Removed ${removedCount} hook(s) from ${settingsPath}`);
        }
      } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') {
          console.warn(`   ⚠️  Settings file not found: ${settingsPath}`);
        } else {
          throw new Error(`Failed to remove hooks from settings: ${error}`);
        }
      }

      console.log(`✅ Successfully uninstalled ${name}`);
      return;
    }

    // Standard file/directory uninstall for non-hook packages
    const packageName = stripAuthorNamespace(name);
    let targetPath: string;

    if (pkg.installedPath) {
      // Use the exact path where it was installed (from lock file)
      targetPath = pkg.installedPath;
      console.log(`   📍 Using installation path from lock file: ${targetPath}`);
    } else {
      // Fallback: warn user that installedPath is missing (shouldn't happen with recent installations)
      console.warn(`   ⚠️  No installation path in lock file for ${name}`);
      console.warn(`   ⚠️  This may indicate an old or corrupted lock file`);
      throw new CLIError(`Cannot uninstall ${name}: installation path unknown`, 1);
    }

    // Check if the target path is a directory or file and delete accordingly
    try {
      const stats = await fs.stat(targetPath);

      if (stats.isDirectory()) {
        // Delete entire directory
        await fs.rm(targetPath, { recursive: true, force: true });
        console.log(`   🗑️  Deleted directory: ${targetPath}`);
      } else if (stats.isFile()) {
        // Delete single file
        await fs.unlink(targetPath);
        console.log(`   🗑️  Deleted file: ${targetPath}`);
      }
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        console.warn(`   ⚠️  File/directory not found: ${targetPath}`);
      } else {
        throw err;
      }
    }

      console.log(`✅ Successfully uninstalled ${name}${formatDisplay}`);
    }

  } catch (error) {
    if (error instanceof CLIError) {
      throw error;
    }
    throw new CLIError(`❌ Failed to uninstall package: ${error}`, 1);
  }
}

/**
 * Create the uninstall command
 */
export function createUninstallCommand(): Command {
  const command = new Command('uninstall');

  command
    .description('Uninstall a prompt package or collection')
    .argument('<id>', 'Package ID or collection name (e.g., collections/my-collection)')
    .option('--format <format>', 'Specific format to uninstall (if multiple formats installed)')
    .option('--as <format>', 'Alias for --format (use when multiple formats are installed)')
    .alias('remove')  // Keep 'remove' as an alias for backwards compatibility
    .action(handleUninstall);

  return command;
}
