/**
 * Remove command implementation
 */

import { Command } from 'commander';
import { removePackage } from '../core/lockfile';
import { getDestinationDir, deleteFile, fileExists, stripAuthorNamespace } from '../core/filesystem';
import { promises as fs } from 'fs';
import { PackageType } from '../types';

/**
 * Handle the remove command
 */
export async function handleRemove(name: string): Promise<void> {
  try {
    console.log(`🗑️  Removing package: ${name}`);

    // Remove from lockfile and get package info
    const pkg = await removePackage(name);

    if (!pkg) {
      console.error(`❌ Package "${name}" not found`);
      process.exit(1);
    }

    // Determine file path based on package type and format
    const effectiveType = (pkg.format === 'claude' ? 'claude-skill' :
                          pkg.format === 'cursor' ? 'cursor' :
                          pkg.format === 'continue' ? 'continue' :
                          pkg.format === 'windsurf' ? 'windsurf' :
                          pkg.type) as PackageType;

    const destDir = getDestinationDir(effectiveType);
    const fileExtension = pkg.format === 'cursor' ? 'mdc' : 'md';

    // Strip author namespace to get just the package name
    const packageName = stripAuthorNamespace(name);

    // Try single file first
    const singleFilePath = `${destDir}/${packageName}.${fileExtension}`;

    if (await fileExists(singleFilePath)) {
      // Single file package
      await deleteFile(singleFilePath);
      console.log(`   🗑️  Deleted file: ${singleFilePath}`);
    } else {
      // Try multi-file package directory
      const packageDir = `${destDir}/${packageName}`;

      try {
        const stats = await fs.stat(packageDir);
        if (stats.isDirectory()) {
          await fs.rm(packageDir, { recursive: true, force: true });
          console.log(`   🗑️  Deleted directory: ${packageDir}`);
        }
      } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err.code !== 'ENOENT') {
          console.warn(`   ⚠️  Could not delete package files: ${err.message}`);
        }
      }
    }

    console.log(`✅ Successfully removed ${name}`);

    process.exit(0);
  } catch (error) {
    console.error(`❌ Failed to remove package: ${error}`);
    process.exit(1);
  }
}

/**
 * Create the remove command
 */
export function createRemoveCommand(): Command {
  const command = new Command('remove');
  
  command
    .description('Remove a prompt package')
    .argument('<id>', 'Package ID to remove')
    .action(handleRemove);
  
  return command;
}
