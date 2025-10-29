/**
 * Catalog command - Discover and catalog existing packages
 */

import { Command } from 'commander';
import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join, relative, basename } from 'path';
import { telemetry } from '../core/telemetry';
import type { PackageManifest, MultiPackageManifest } from '../types/registry';
import { Format, Subtype } from '../types';

interface DiscoveredPackage {
  path: string;
  format: Format;
  subtype: Subtype;
  name: string;
  files: string[];
}

/**
 * Detect format and subtype from file path and content
 */
function detectPackageInfo(filePath: string, content: string): {
  format: Format;
  subtype: Subtype;
  name: string;
} | null {
  const fileName = basename(filePath);
  const lowerFileName = fileName.toLowerCase();

  // Claude skills - SKILL.md files
  if (fileName === 'SKILL.md') {
    const dirName = basename(join(filePath, '..'));
    return {
      format: 'claude',
      subtype: 'skill',
      name: dirName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    };
  }

  // Claude agents
  if (filePath.includes('.claude/agents') || filePath.includes('.claude-plugin/agents')) {
    return {
      format: 'claude',
      subtype: 'agent',
      name: fileName.replace(/\.(md|txt)$/, '').toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    };
  }

  // Cursor rules
  if (filePath.includes('.cursor/rules') || lowerFileName.endsWith('.mdc')) {
    return {
      format: 'cursor',
      subtype: 'rule',
      name: fileName.replace(/\.(md|mdc|txt)$/, '').toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    };
  }

  // Windsurf rules
  if (filePath.includes('.windsurf/rules')) {
    return {
      format: 'windsurf',
      subtype: 'rule',
      name: fileName.replace(/\.(md|txt)$/, '').toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    };
  }

  // Continue config
  if (filePath.includes('.continue/prompts')) {
    return {
      format: 'continue',
      subtype: 'prompt',
      name: fileName.replace(/\.(md|txt)$/, '').toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    };
  }

  // Generic markdown files in root that look like prompts
  if (lowerFileName.endsWith('.md') && content.length > 50) {
    return {
      format: 'generic',
      subtype: 'prompt',
      name: fileName.replace(/\.md$/, '').toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    };
  }

  return null;
}

/**
 * Recursively scan directories for packages
 */
async function scanDirectory(
  dirPath: string,
  baseDir: string,
  maxDepth: number = 5,
  currentDepth: number = 0
): Promise<DiscoveredPackage[]> {
  if (currentDepth > maxDepth) {
    return [];
  }

  const discovered: DiscoveredPackage[] = [];

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relativePath = relative(baseDir, fullPath);

      // Skip node_modules, .git, and other common dirs
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'build') {
        continue;
      }

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subDirPackages = await scanDirectory(fullPath, baseDir, maxDepth, currentDepth + 1);
        discovered.push(...subDirPackages);
      } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdc') || entry.name.endsWith('.txt'))) {
        // Check if this is a package file
        try {
          const content = await readFile(fullPath, 'utf-8');
          const packageInfo = detectPackageInfo(fullPath, content);

          if (packageInfo) {
            discovered.push({
              path: relativePath,
              format: packageInfo.format,
              subtype: packageInfo.subtype,
              name: packageInfo.name,
              files: [relativePath],
            });
          }
        } catch (err) {
          // Skip files we can't read
        }
      }
    }
  } catch (err) {
    // Skip directories we can't read
  }

  return discovered;
}

/**
 * Discover packages in specified directories
 */
export async function handleCatalog(
  directories: string[],
  options: {
    output?: string;
    append?: boolean;
    dryRun?: boolean;
  }
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    console.log('🔍 Scanning for packages...\n');

    const allDiscovered: DiscoveredPackage[] = [];

    // Scan each directory
    for (const dir of directories) {
      console.log(`   Scanning ${dir}...`);
      try {
        const dirStat = await stat(dir);
        if (!dirStat.isDirectory()) {
          console.log(`   ⚠️  Skipping ${dir} (not a directory)`);
          continue;
        }

        const discovered = await scanDirectory(dir, dir);
        allDiscovered.push(...discovered);
        console.log(`   Found ${discovered.length} package(s) in ${dir}`);
      } catch (err) {
        console.log(`   ⚠️  Could not access ${dir}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    console.log(`\n✨ Discovered ${allDiscovered.length} package(s) total:\n`);

    if (allDiscovered.length === 0) {
      console.log('No packages found. Try scanning different directories.');
      success = true;
      return;
    }

    // Display discovered packages
    const byFormat = new Map<Format, DiscoveredPackage[]>();
    for (const pkg of allDiscovered) {
      if (!byFormat.has(pkg.format)) {
        byFormat.set(pkg.format, []);
      }
      byFormat.get(pkg.format)!.push(pkg);
    }

    for (const [format, packages] of byFormat.entries()) {
      console.log(`📦 ${format} (${packages.length}):`);
      for (const pkg of packages) {
        console.log(`   - ${pkg.name} (${pkg.subtype}): ${pkg.path}`);
      }
      console.log('');
    }

    if (options.dryRun) {
      console.log('🔍 Dry run - would update prpm.json\n');
      success = true;
      return;
    }

    // Load or create prpm.json
    const prpmJsonPath = options.output || join(process.cwd(), 'prpm.json');
    let manifest: MultiPackageManifest;

    if (options.append) {
      try {
        const existingContent = await readFile(prpmJsonPath, 'utf-8');
        const existing = JSON.parse(existingContent);

        // Check if it's a multi-package manifest
        if ('packages' in existing && Array.isArray(existing.packages)) {
          manifest = existing as MultiPackageManifest;
        } else {
          // Convert single package to multi-package
          manifest = {
            name: 'multi-package',
            version: '1.0.0',
            packages: [existing as PackageManifest],
          };
        }
      } catch (err) {
        // File doesn't exist, create new
        manifest = {
          name: 'multi-package',
          version: '1.0.0',
          packages: [],
        };
      }
    } else {
      manifest = {
        name: 'multi-package',
        version: '1.0.0',
        packages: [],
      };
    }

    // Convert discovered packages to manifests
    const existingNames = new Set(manifest.packages.map(p => p.name));
    let addedCount = 0;

    for (const discovered of allDiscovered) {
      // Skip if already exists
      if (existingNames.has(discovered.name)) {
        console.log(`   ⚠️  Skipping ${discovered.name} (already in prpm.json)`);
        continue;
      }

      // Extract description from first file
      let description = `${discovered.format} ${discovered.subtype}`;
      try {
        const firstFilePath = join(process.cwd(), discovered.files[0]);
        const content = await readFile(firstFilePath, 'utf-8');
        const lines = content.split('\n').slice(0, 10);
        const descLine = lines.find(line => line.trim().length > 20 && !line.startsWith('#'));
        if (descLine) {
          description = descLine.trim().substring(0, 200);
        }
      } catch (err) {
        // Use default description
      }

      const packageManifest: PackageManifest = {
        name: discovered.name,
        version: '1.0.0',
        description,
        author: '', // User should fill this in
        format: discovered.format,
        subtype: discovered.subtype,
        files: discovered.files,
      };

      manifest.packages.push(packageManifest);
      addedCount++;
    }

    // Write updated prpm.json
    await writeFile(prpmJsonPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

    console.log(`\n✅ Updated ${prpmJsonPath}`);
    console.log(`   Added ${addedCount} new package(s)`);
    console.log(`   Total: ${manifest.packages.length} package(s)\n`);
    console.log('💡 Next steps:');
    console.log('   1. Review and edit package metadata in prpm.json');
    console.log('   2. Add author, license, and other fields');
    console.log('   3. Run: prpm publish --dry-run to validate');
    console.log('   4. Run: prpm publish to publish packages\n');

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Failed to catalog packages: ${error}\n`);
    process.exit(1);
  } finally {
    await telemetry.track({
      command: 'catalog',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        directories: directories.length,
      },
    });
    await telemetry.shutdown();
  }
}

/**
 * Create the catalog command
 */
export function createCatalogCommand(): Command {
  return new Command('catalog')
    .description('Discover and catalog existing packages from directories')
    .argument('[directories...]', 'Directories to scan for packages (defaults to current directory)', ['.'])
    .option('-o, --output <path>', 'Output path for prpm.json (default: ./prpm.json)')
    .option('-a, --append', 'Append to existing prpm.json instead of overwriting')
    .option('--dry-run', 'Show what would be cataloged without making changes')
    .action(async (directories: string[], options: { output?: string; append?: boolean; dryRun?: boolean }) => {
      await handleCatalog(directories, options);
      process.exit(0);
    });
}
