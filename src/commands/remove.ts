/**
 * Remove command implementation
 */

import { Command } from 'commander';
import { removePackage } from '../core/config';
import { deleteFile } from '../core/filesystem';

/**
 * Handle the remove command
 */
export async function handleRemove(id: string): Promise<void> {
  try {
    console.log(`🗑️  Removing package: ${id}`);
    
    // Remove from config and get package info
    const pkg = await removePackage(id);
    
    if (!pkg) {
      console.error(`❌ Package "${id}" not found`);
      process.exit(1);
    }
    
    // Delete the file
    console.log(`📁 Deleting file: ${pkg.dest}`);
    await deleteFile(pkg.dest);
    
    console.log(`✅ Successfully removed ${id} (${pkg.type})`);
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
