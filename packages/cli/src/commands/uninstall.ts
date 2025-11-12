/**
 * Uninstall command implementation
 */

import { Command } from 'commander';
import { removePackage } from '../core/lockfile';
import { stripAuthorNamespace } from '../core/filesystem';
import { promises as fs } from 'fs';
import { CLIError } from '../core/errors';

/**
 * Handle the uninstall command
 */
export async function handleUninstall(name: string): Promise<void> {
  try {
    console.log(`🗑️  Uninstalling package: ${name}`);

    // Remove from lockfile and get package info
    const pkg = await removePackage(name);

    if (!pkg) {
      throw new CLIError(`❌ Package "${name}" not found`, 1);
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

    console.log(`✅ Successfully uninstalled ${name}`);

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
    .description('Uninstall a prompt package')
    .argument('<id>', 'Package ID to uninstall')
    .alias('remove')  // Keep 'remove' as an alias for backwards compatibility
    .action(handleUninstall);

  return command;
}
