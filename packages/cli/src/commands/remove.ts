/**
 * Remove command implementation
 */

import { Command } from 'commander';
import { removePackage } from '../core/lockfile';

/**
 * Handle the remove command
 */
export async function handleRemove(id: string): Promise<void> {
  try {
    console.log(`🗑️  Removing package: ${id}`);

    // Remove from lockfile and get package info
    const pkg = await removePackage(id);

    if (!pkg) {
      console.error(`❌ Package "${id}" not found`);
      process.exit(1);
    }

    console.log(`✅ Successfully removed ${id} from lockfile`);
    console.log(`💡 Note: File is not deleted. Remove manually if needed.`);
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
