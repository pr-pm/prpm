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

    // Get the installation path from lock file if available, otherwise calculate it
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
