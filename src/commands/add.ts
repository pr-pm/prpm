/**
 * Add command implementation
 */

import { Command } from 'commander';
import { downloadFile, extractFilename } from '../core/downloader';
import { getDestinationDir, saveFile, generateId, getFileExtension, getSpecialFilename } from '../core/filesystem';
import { addPackage } from '../core/config';
import { telemetry } from '../core/telemetry';
import { Package, PackageType } from '../types';

// Extract repository info from GitHub URL for popularity tracking
function extractRepoFromUrl(url: string): string {
  try {
    // Handle raw GitHub URLs: https://raw.githubusercontent.com/user/repo/branch/path
    const rawMatch = url.match(/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)/);
    if (rawMatch) {
      return `${rawMatch[1]}/${rawMatch[2]}`;
    }
    
    // Handle regular GitHub URLs: https://github.com/user/repo
    const githubMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (githubMatch) {
      return `${githubMatch[1]}/${githubMatch[2]}`;
    }
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Add a prompt package from a URL to multiple tools
 */
export async function handleAdd(
  url: string,
  type: PackageType,
  tools?: PackageType[]
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    console.log(`📥 Downloading from ${url}...`);

    // Download the file
    const content = await downloadFile(url);

    // Extract filename and generate ID
    const baseFilename = extractFilename(url);
    const id = generateId(baseFilename);

    // Determine which tools to install to
    const targetTools = tools && tools.length > 0 ? tools : [type];

    console.log(`📦 Installing to: ${targetTools.join(', ')}`);

    // Install to each tool
    const installedPaths: string[] = [];
    for (const targetType of targetTools) {
      // Get tool-specific filename
      const specialFilename = getSpecialFilename(targetType);
      const extension = getFileExtension(targetType);

      let filename: string;
      if (specialFilename) {
        filename = specialFilename;
      } else {
        // Replace the original extension with the tool-specific one
        const nameWithoutExt = baseFilename.replace(/\.[^/.]+$/, '');
        filename = nameWithoutExt + extension;
      }

      // Determine destination
      const destDir = getDestinationDir(targetType);
      const destPath = `${destDir}/${filename}`;

      // Save the file
      console.log(`   💾 ${targetType}: ${destPath}`);
      await saveFile(destPath, content);
      installedPaths.push(destPath);
    }

    // Create package record
    const pkg: Package = {
      id,
      type,
      url,
      dest: installedPaths[0], // Primary destination
      tools: targetTools,
    };

    // Update configuration
    await addPackage(pkg);

    console.log(`✅ Successfully added ${id}`);
    console.log(`   📁 Installed to ${targetTools.length} tool(s)`);
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
        // Package popularity tracking
        packageId: generateId(extractFilename(url)),
        packageType: type,
        sourceRepo: extractRepoFromUrl(url),
      },
    });
  }
}

/**
 * Validate package type
 */
function isValidPackageType(type: string): type is PackageType {
  const validTypes: PackageType[] = [
    'cursor',
    'claude',
    'windsurf',
    'continue',
    'aider',
    'copilot',
    'copilot-instructions',
    'copilot-path',
  ];
  return validTypes.includes(type as PackageType);
}

/**
 * Create the add command
 */
export function createAddCommand(): Command {
  const command = new Command('add');

  command
    .description('Add a prompt package from a URL')
    .argument('<url>', 'Raw GitHub URL to the prompt file')
    .option('--as <type>', 'Primary package type (default: cursor)', 'cursor')
    .option(
      '--for <tools>',
      'Install to multiple tools (comma-separated: cursor,claude,windsurf)'
    )
    .action(async (url: string, options: { as: string; for?: string }) => {
      const type = options.as as PackageType;

      if (!isValidPackageType(type)) {
        console.error(
          '❌ Invalid type. Must be one of: cursor, claude, windsurf, continue, aider, copilot, copilot-instructions, copilot-path'
        );
        process.exit(1);
      }

      // Parse multi-tool option
      let tools: PackageType[] | undefined;
      if (options.for) {
        const toolList = options.for.split(',').map((t) => t.trim());

        // Validate all tools
        for (const tool of toolList) {
          if (!isValidPackageType(tool)) {
            console.error(`❌ Invalid tool: ${tool}`);
            process.exit(1);
          }
        }

        tools = toolList as PackageType[];
      }

      await handleAdd(url, type, tools);
    });

  return command;
}
