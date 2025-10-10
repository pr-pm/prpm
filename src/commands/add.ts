/**
 * Add command implementation
 */

import { Command } from 'commander';
import { downloadFile, extractFilename } from '../core/downloader';
import { getDestinationDir, saveFile, generateId } from '../core/filesystem';
import { addPackage } from '../core/config';
import { telemetry } from '../core/telemetry';
import { Package, PackageType } from '../types';

/**
 * Add a prompt package from a URL
 */
export async function handleAdd(url: string, type: PackageType): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    console.log(`📥 Downloading from ${url}...`);
    
    // Download the file
    const content = await downloadFile(url);
    
    // Extract filename and generate ID
    const filename = extractFilename(url);
    const id = generateId(filename);
    
    // Determine destination
    const destDir = getDestinationDir(type);
    const destPath = `${destDir}/${filename}`;
    
    // Save the file
    console.log(`💾 Saving to ${destPath}...`);
    await saveFile(destPath, content);
    
    // Create package record
    const pkg: Package = {
      id,
      type,
      url,
      dest: destPath
    };
    
    // Update configuration
    await addPackage(pkg);
    
    console.log(`✅ Successfully added ${id} (${type})`);
    console.log(`   📁 Saved to: ${destPath}`);
    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`❌ Failed to add package: ${error}`);
    process.exit(1);
  } finally {
    // Track telemetry
    await telemetry.track({
      command: 'add',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        type,
        url: url.substring(0, 100), // Truncate long URLs
        filename: extractFilename(url),
      },
    });
  }
}

/**
 * Create the add command
 */
export function createAddCommand(): Command {
  const command = new Command('add');
  
  command
    .description('Add a prompt package from a URL')
    .argument('<url>', 'Raw GitHub URL to the prompt file')
    .option('--as <type>', 'Package type (cursor or claude)', 'cursor')
    .action(async (url: string, options: { as: string }) => {
      const type = options.as as PackageType;
      
      if (type !== 'cursor' && type !== 'claude') {
        console.error('❌ Type must be either "cursor" or "claude"');
        process.exit(1);
      }
      
      await handleAdd(url, type);
    });
  
  return command;
}
