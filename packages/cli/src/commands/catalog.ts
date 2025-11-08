/**
 * Catalog command - Discover and catalog existing packages
 */

import { Command } from 'commander';
import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join, relative, basename } from 'path';
import { telemetry } from '../core/telemetry';
import type { PackageManifest, MultiPackageManifest } from '../types/registry';
import { Format, Subtype } from '../types';
import { readLockfile } from '../core/lockfile';
import { CLIError } from '../core/errors';

interface DiscoveredPackage {
  path: string;
  format: Format;
  subtype: Subtype;
  name: string;
  files: string[];
  scanDir: string; // The directory that was scanned (e.g., '.claude')
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
  scanDir: string,
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
        const subDirPackages = await scanDirectory(fullPath, baseDir, scanDir, maxDepth, currentDepth + 1);
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
              scanDir,
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
 * Extract description from file content
 * Tries multiple strategies:
 * 1. YAML frontmatter (---\ndescription: ...\n---)
 * 2. Markdown description field (description: ...)
 * 3. First substantial paragraph after title
 */
function extractDescription(content: string): string | null {
  const lines = content.split('\n');

  // Strategy 1: YAML frontmatter
  if (lines[0]?.trim() === '---') {
    let foundClosing = false;
    let frontmatterLines: string[] = [];

    for (let i = 1; i < lines.length && i < 50; i++) {
      const line = lines[i];
      if (line.trim() === '---') {
        foundClosing = true;
        break;
      }
      frontmatterLines.push(line);
    }

    if (foundClosing && frontmatterLines.length > 0) {
      // Parse YAML-like frontmatter
      for (const line of frontmatterLines) {
        const match = line.match(/^description:\s*(.+)$/i);
        if (match) {
          return match[1].trim().replace(/^["']|["']$/g, '').substring(0, 200);
        }
      }
    }
  }

  // Strategy 2: Look for "description:" field anywhere in first 20 lines
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i];
    const match = line.match(/^description:\s*(.+)$/i);
    if (match) {
      return match[1].trim().replace(/^["']|["']$/g, '').substring(0, 200);
    }
  }

  // Strategy 3: First substantial non-header paragraph
  let foundTitle = false;
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const line = lines[i].trim();

    // Skip empty lines and YAML frontmatter
    if (line === '' || line === '---') {
      continue;
    }

    // Skip markdown headers
    if (line.startsWith('#')) {
      foundTitle = true;
      continue;
    }

    // Found a substantial line after the title
    if (foundTitle && line.length >= 20 && !line.startsWith('```')) {
      return line.substring(0, 200);
    }

    // If no title found yet but line is substantial, use it
    if (!foundTitle && line.length >= 30) {
      return line.substring(0, 200);
    }
  }

  return null;
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

        const discovered = await scanDirectory(dir, dir, dir);
        allDiscovered.push(...discovered);
        console.log(`   Found ${discovered.length} package(s) in ${dir}`);
      } catch (err) {
        console.log(`   ⚠️  Could not access ${dir}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Read lockfile to exclude packages installed from other users
    const lockfile = await readLockfile();
    const installedPackageIds = new Set(lockfile ? Object.keys(lockfile.packages) : []);

    // Filter out packages that are installed from the registry (not user-created)
    const filteredDiscovered = allDiscovered.filter(pkg => {
      // Check if this package exists in lockfile
      // Package ID in lockfile could be: "package-name", "@author/package-name"
      // Check both formats
      const isInstalled = installedPackageIds.has(pkg.name) ||
                         Array.from(installedPackageIds).some(id => id.endsWith(`/${pkg.name}`));

      if (isInstalled) {
        console.log(`   ⏩ Skipping ${pkg.name} (installed from registry, not user-created)`);
        return false;
      }
      return true;
    });

    console.log(`\n✨ Discovered ${filteredDiscovered.length} package(s) total:\n`);

    if (filteredDiscovered.length === 0) {
      console.log('No user-created packages found. Try scanning different directories or check if all packages were installed from registry.');
      success = true;
      return;
    }

    // Display discovered packages
    const byFormat = new Map<Format, DiscoveredPackage[]>();
    for (const pkg of filteredDiscovered) {
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

    for (const discovered of filteredDiscovered) {
      // Skip if already exists
      if (existingNames.has(discovered.name)) {
        console.log(`   ⚠️  Skipping ${discovered.name} (already in prpm.json)`);
        continue;
      }

      // Extract description from first file
      let description = `${discovered.format} ${discovered.subtype}`;
      try {
        const firstFilePath = join(process.cwd(), discovered.scanDir, discovered.files[0]);
        const content = await readFile(firstFilePath, 'utf-8');
        const extractedDesc = extractDescription(content);
        if (extractedDesc) {
          description = extractedDesc;
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
    throw new CLIError(`\n❌ Failed to catalog packages: ${error}`, 1);
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
      // Handler completes normally = success (exit 0)
    });
}
