/**
 * Show command - Display package contents before installing
 */

import { Command } from 'commander';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { telemetry } from '../core/telemetry';
import { CLIError } from '../core/errors';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import * as tar from 'tar';
import zlib from 'zlib';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

interface ExtractedFile {
  name: string;
  content: string;
  size: number;
}

/**
 * Extract all files from a tarball without installing
 */
async function extractTarballContents(tarball: Buffer): Promise<ExtractedFile[]> {
  // Attempt to decompress
  let decompressed: Buffer;
  try {
    decompressed = await new Promise<Buffer>((resolve, reject) => {
      zlib.gunzip(tarball, (err, result) => {
        if (err) {
          reject(new Error(`Failed to decompress tarball: ${err.message}`));
          return;
        }
        resolve(result);
      });
    });
  } catch (error: any) {
    throw new CLIError(`Package decompression failed: ${error.message}`);
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prpm-show-'));
  const cleanup = async () => {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  };

  try {
    const extract = tar.extract({
      cwd: tmpDir,
      strict: true,
    });

    await pipeline(Readable.from(decompressed), extract);

    // Collect all files
    const files: ExtractedFile[] = [];
    const dirs = [tmpDir];

    while (dirs.length > 0) {
      const currentDir = dirs.pop();
      if (!currentDir) continue;

      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          dirs.push(fullPath);
          continue;
        }

        if (!entry.isFile()) {
          continue;
        }

        const content = await fs.readFile(fullPath, 'utf-8');
        const stats = await fs.stat(fullPath);
        const relativePath = path.relative(tmpDir, fullPath).split(path.sep).join('/');

        files.push({
          name: relativePath,
          content,
          size: stats.size,
        });
      }
    }

    return files;
  } finally {
    await cleanup();
  }
}

/**
 * Format file size for display
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get file type icon based on extension
 */
function getFileIcon(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const iconMap: Record<string, string> = {
    '.md': '📄',
    '.mdc': '📋',
    '.json': '📦',
    '.toml': '⚙️',
    '.yaml': '⚙️',
    '.yml': '⚙️',
    '.ts': '📜',
    '.js': '📜',
    '.sh': '🔧',
    '.txt': '📝',
  };
  return iconMap[ext] || '📄';
}

export async function handleShow(
  packageSpec: string,
  options: {
    full?: boolean;
    json?: boolean;
    file?: string;
  }
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    // Parse package spec (e.g., "@user/pkg" or "@user/pkg@1.0.0")
    let packageId: string;
    let specVersion: string | undefined;

    if (packageSpec.startsWith('@')) {
      // Scoped package: @scope/name or @scope/name@version
      const match = packageSpec.match(/^(@[^/]+\/[^@]+)(?:@(.+))?$/);
      if (!match) {
        throw new Error('Invalid package spec format. Use: @scope/package or @scope/package@version');
      }
      packageId = match[1];
      specVersion = match[2];
    } else {
      // Unscoped package: name or name@version
      const parts = packageSpec.split('@');
      packageId = parts[0];
      specVersion = parts[1];
    }

    console.log(`📦 Fetching package contents for "${packageId}"...`);

    const config = await getConfig();
    const client = getRegistryClient(config);

    // Get package info
    const pkg = await client.getPackage(packageId);

    // Determine tarball URL
    let tarballUrl: string;
    let actualVersion: string;

    if (specVersion && specVersion !== 'latest') {
      const versionInfo = await client.getPackageVersion(packageId, specVersion);
      tarballUrl = versionInfo.tarball_url;
      actualVersion = specVersion;
    } else {
      if (!pkg.latest_version) {
        throw new Error('No versions available for this package');
      }
      tarballUrl = pkg.latest_version.tarball_url;
      actualVersion = pkg.latest_version.version;
    }

    console.log(`   Version: ${actualVersion}`);
    console.log(`   ⬇️  Downloading package...`);

    // Download the package
    const tarball = await client.downloadPackage(tarballUrl);

    console.log(`   📂 Extracting contents...\n`);

    // Extract files
    const files = await extractTarballContents(tarball);

    if (files.length === 0) {
      console.log('⚠️  Package contains no files');
      success = true;
      return;
    }

    // JSON output mode
    if (options.json) {
      const output = {
        package: packageId,
        version: actualVersion,
        format: pkg.format,
        subtype: pkg.subtype,
        description: pkg.description,
        files: files.map(f => ({
          path: f.name,
          size: f.size,
          content: options.full ? f.content : undefined,
        })),
      };
      console.log(JSON.stringify(output, null, 2));
      success = true;
      return;
    }

    // Display package header
    console.log('='.repeat(60));
    console.log(`  ${pkg.name} v${actualVersion}`);
    console.log('='.repeat(60));

    if (pkg.description) {
      console.log(`\n📝 ${pkg.description}`);
    }

    console.log(`\n📂 Type: ${pkg.format} ${pkg.subtype}`);
    console.log(`📦 Files: ${files.length}`);
    console.log(`📊 Total size: ${formatSize(files.reduce((sum, f) => sum + f.size, 0))}`);

    // If a specific file is requested
    if (options.file) {
      const targetFile = files.find(f =>
        f.name === options.file ||
        f.name.endsWith('/' + options.file) ||
        path.basename(f.name) === options.file
      );

      if (!targetFile) {
        console.log(`\n❌ File not found: ${options.file}`);
        console.log('\n📋 Available files:');
        for (const file of files) {
          console.log(`   ${getFileIcon(file.name)} ${file.name}`);
        }
        throw new CLIError(`File "${options.file}" not found in package`, 1);
      }

      console.log('\n' + '─'.repeat(60));
      console.log(`📄 ${targetFile.name} (${formatSize(targetFile.size)})`);
      console.log('─'.repeat(60));
      console.log(targetFile.content);
      success = true;
      return;
    }

    // List all files
    console.log('\n' + '─'.repeat(60));
    console.log('  📋 Package Contents');
    console.log('─'.repeat(60));

    for (const file of files) {
      console.log(`   ${getFileIcon(file.name)} ${file.name} (${formatSize(file.size)})`);
    }

    // If --full flag, show all file contents
    if (options.full) {
      console.log('\n' + '═'.repeat(60));
      console.log('  📖 Full File Contents');
      console.log('═'.repeat(60));

      for (const file of files) {
        console.log('\n' + '─'.repeat(60));
        console.log(`📄 ${file.name}`);
        console.log('─'.repeat(60));
        console.log(file.content);
      }
    } else {
      console.log('\n💡 Tip: Use --full to see complete file contents');
      console.log(`   prpm show ${packageSpec} --full`);
      console.log(`   prpm show ${packageSpec} --file <filename>  # View specific file`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n💻 To install: prpm install ${packageId}`);

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    if (err instanceof CLIError) {
      throw err;
    }
    throw new CLIError(
      `\n❌ Failed to show package contents: ${error}\n\n` +
      `💡 Tips:\n` +
      `   - Check the package ID spelling\n` +
      `   - Search for packages: prpm search <query>\n` +
      `   - Get package info: prpm info <package>`,
      1
    );
  } finally {
    await telemetry.track({
      command: 'show',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        packageName: packageSpec,
        full: options.full,
        json: options.json,
      },
    });
    await telemetry.shutdown();
  }
}

export function createShowCommand(): Command {
  const command = new Command('show');

  command
    .description('Display package contents before installing')
    .argument('<package>', 'Package ID to show (e.g., @user/package or @user/package@1.0.0)')
    .option('--full', 'Show complete file contents')
    .option('--file <name>', 'Show contents of a specific file')
    .option('--json', 'Output in JSON format (for programmatic use)')
    .action(async (packageSpec: string, options: { full?: boolean; file?: string; json?: boolean }) => {
      await handleShow(packageSpec, options);
    });

  return command;
}
