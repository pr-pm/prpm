/**
 * Index command implementation
 */

import { Command } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';
import { listPackages, addPackage } from '../core/config';
import { generateId } from '../core/filesystem';
import { Package, PackageType } from '../types';

/**
 * Scan directory for files and return file information
 */
async function scanDirectory(dirPath: string, type: PackageType): Promise<Array<{ filePath: string; filename: string; id: string }>> {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    const results: Array<{ filePath: string; filename: string; id: string }> = [];
    
    for (const file of files) {
      if (file.isFile()) {
        const filePath = path.join(dirPath, file.name);
        const id = generateId(file.name);
        results.push({
          filePath,
          filename: file.name,
          id
        });
      }
    }
    
    return results;
  } catch (error) {
    // Directory doesn't exist or can't be read
    return [];
  }
}

/**
 * Check if a package is already registered
 */
function isPackageRegistered(packages: Package[], id: string, filePath: string): boolean {
  return packages.some(pkg => 
    pkg.id === id || pkg.dest === filePath
  );
}

/**
 * Handle the index command
 */
export async function handleIndex(): Promise<void> {
  try {
    console.log('🔍 Scanning for existing prompt files...');
    
    // Get currently registered packages
    const existingPackages = await listPackages();
    console.log(`📋 Found ${existingPackages.length} already registered packages`);
    
    let totalFound = 0;
    let totalAdded = 0;
    
    // Scan .cursor/rules directory
    console.log('\n📁 Scanning .cursor/rules/...');
    const cursorFiles = await scanDirectory('.cursor/rules', 'cursor');
    totalFound += cursorFiles.length;
    
    for (const file of cursorFiles) {
      if (!isPackageRegistered(existingPackages, file.id, file.filePath)) {
        const pkg: Package = {
          id: file.id,
          type: 'cursor',
          url: `file://${path.resolve(file.filePath)}`, // Use file:// URL for local files
          dest: file.filePath
        };
        
        await addPackage(pkg);
        console.log(`  ✅ Added: ${file.filename} (${file.id})`);
        totalAdded++;
      } else {
        console.log(`  ⏭️  Skipped: ${file.filename} (already registered)`);
      }
    }
    
    // Scan .claude/agents directory
    console.log('\n📁 Scanning .claude/agents/...');
    const claudeFiles = await scanDirectory('.claude/agents', 'claude');
    totalFound += claudeFiles.length;
    
    for (const file of claudeFiles) {
      if (!isPackageRegistered(existingPackages, file.id, file.filePath)) {
        const pkg: Package = {
          id: file.id,
          type: 'claude',
          url: `file://${path.resolve(file.filePath)}`, // Use file:// URL for local files
          dest: file.filePath
        };
        
        await addPackage(pkg);
        console.log(`  ✅ Added: ${file.filename} (${file.id})`);
        totalAdded++;
      } else {
        console.log(`  ⏭️  Skipped: ${file.filename} (already registered)`);
      }
    }
    
    // Summary
    console.log('\n📊 Index Summary:');
    console.log(`   📁 Total files found: ${totalFound}`);
    console.log(`   ➕ New packages added: ${totalAdded}`);
    console.log(`   ⏭️  Already registered: ${totalFound - totalAdded}`);
    
    if (totalAdded > 0) {
      console.log(`\n✅ Successfully indexed ${totalAdded} new packages!`);
    } else {
      console.log('\n✨ All existing files are already registered.');
    }
    
  } catch (error) {
    console.error(`❌ Failed to index packages: ${error}`);
    process.exit(1);
  }
}

/**
 * Create the index command
 */
export function createIndexCommand(): Command {
  const command = new Command('index');
  
  command
    .description('Scan existing .cursor/rules/ and .claude/agents/ directories and register unregistered files')
    .action(handleIndex);
  
  return command;
}
