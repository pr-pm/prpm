/**
 * Index command implementation
 */

import { Command } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';
import { listPackages, addPackage } from '../core/lockfile';
import { generateId } from '../core/filesystem';
import { PackageType } from '../types';

/**
 * Scan directory for files and return file information
 * Recursively scans subdirectories for Claude skills/agents
 */
async function scanDirectory(dirPath: string, type: PackageType): Promise<Array<{ filePath: string; filename: string; id: string }>> {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    const results: Array<{ filePath: string; filename: string; id: string }> = [];

    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);

      if (file.isFile()) {
        // Direct file in the directory
        const id = generateId(file.name);
        results.push({
          filePath: fullPath,
          filename: file.name,
          id
        });
      } else if (file.isDirectory()) {
        // For Claude skills/agents, scan subdirectories for SKILL.md or AGENT.md
        if (type === 'claude-skill' || type === 'claude') {
          try {
            const subFiles = await fs.readdir(fullPath, { withFileTypes: true });
            for (const subFile of subFiles) {
              if (subFile.isFile() && (subFile.name === 'SKILL.md' || subFile.name === 'AGENT.md')) {
                const subFilePath = path.join(fullPath, subFile.name);
                const id = file.name; // Use directory name as package ID
                results.push({
                  filePath: subFilePath,
                  filename: `${file.name}/${subFile.name}`,
                  id
                });
              }
            }
          } catch {
            // Subdirectory can't be read, skip it
          }
        }
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
function isPackageRegistered(packages: Array<{id: string}>, id: string): boolean {
  return packages.some(pkg => pkg.id === id);
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

    // Define directories to scan with their types
    const dirsToScan: Array<{ path: string; type: PackageType; label: string }> = [
      { path: '.cursor/rules', type: 'cursor', label: 'Cursor Rules' },
      { path: '.cursor/agents', type: 'cursor-agent', label: 'Cursor Agents' },
      { path: '.cursor/commands', type: 'cursor-slash-command', label: 'Cursor Slash Commands' },
      { path: '.claude/agents', type: 'claude', label: 'Claude Agents' },
      { path: '.claude/skills', type: 'claude-skill', label: 'Claude Skills' },
      { path: '.claude/commands', type: 'claude-slash-command', label: 'Claude Slash Commands' },
      { path: '.continue/rules', type: 'continue', label: 'Continue Rules' },
      { path: '.windsurf/rules', type: 'windsurf', label: 'Windsurf Rules' },
      { path: '.prompts', type: 'generic', label: 'Generic Prompts' },
      { path: '.mcp', type: 'mcp', label: 'MCP Servers' },
    ];

    // Scan each directory
    for (const dir of dirsToScan) {
      console.log(`\n📁 Scanning ${dir.path}/ (${dir.label})...`);
      const files = await scanDirectory(dir.path, dir.type);
      totalFound += files.length;

      for (const file of files) {
        if (!isPackageRegistered(existingPackages, file.id)) {
          await addPackage({
            id: file.id,
            version: '0.0.0', // Local files don't have versions
            tarballUrl: `file://${path.resolve(file.filePath)}`,
            type: dir.type,
            format: dir.type,
          });
          console.log(`  ✅ Added: ${file.filename} (${file.id})`);
          totalAdded++;
        } else {
          console.log(`  ⏭️  Skipped: ${file.filename} (already registered)`);
        }
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
    .description('Scan existing prompt directories (.cursor, .claude, .continue, .windsurf, .prompts, .mcp) and register unregistered files')
    .action(handleIndex);
  
  return command;
}
