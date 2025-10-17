/**
 * Install command - Install packages from registry
 */

import { Command } from 'commander';
import { getRegistryClient } from '../core/registry-client';
import { saveFile, getDestinationDir } from '../core/filesystem';
import { addPackage } from '../core/config';
import { telemetry } from '../core/telemetry';
import { Package, PackageType } from '../types';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGunzip } from 'zlib';
import * as tar from 'tar';

export async function handleInstall(
  packageSpec: string,
  options: { version?: string; type?: PackageType }
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    // Parse package spec (e.g., "react-rules" or "react-rules@1.2.0")
    const [packageId, specVersion] = packageSpec.split('@');
    const version = options.version || specVersion || 'latest';

    console.log(`📥 Installing ${packageId}@${version}...`);

    const client = getRegistryClient();

    // Get package info
    const pkg = await client.getPackage(packageId);
    console.log(`   ${pkg.display_name} - ${pkg.description || 'No description'}`);

    // Determine version to install
    let tarballUrl: string;
    if (version === 'latest') {
      if (!pkg.latest_version) {
        throw new Error('No versions available for this package');
      }
      tarballUrl = pkg.latest_version.tarball_url;
      console.log(`   📦 Installing version ${pkg.latest_version.version}`);
    } else {
      const versionInfo = await client.getPackageVersion(packageId, version);
      tarballUrl = versionInfo.tarball_url;
      console.log(`   📦 Installing version ${version}`);
    }

    // Download package
    console.log(`   ⬇️  Downloading...`);
    const tarball = await client.downloadPackage(tarballUrl);

    // Extract tarball and save files
    console.log(`   📂 Extracting...`);
    const type = options.type || pkg.type;
    const destDir = getDestinationDir(type);

    // For MVP, assume single file in tarball
    // TODO: Implement proper tar extraction
    const mainFile = await extractMainFile(tarball, packageId);
    const destPath = `${destDir}/${packageId}.md`;

    await saveFile(destPath, mainFile);

    // Update configuration
    const packageRecord: Package = {
      id: packageId,
      type,
      url: tarballUrl,
      dest: destPath,
      version: version === 'latest' ? pkg.latest_version?.version : version,
    };

    await addPackage(packageRecord);

    console.log(`\n✅ Successfully installed ${packageId}`);
    console.log(`   📁 Saved to: ${destPath}`);
    console.log(`\n💡 This package has been downloaded ${pkg.total_downloads.toLocaleString()} times`);

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Installation failed: ${error}`);
    console.log(`\n💡 Tips:`);
    console.log(`   - Check package name: prmp search <query>`);
    console.log(`   - Get package info: prmp info <package>`);
    console.log(`   - Install from URL: prmp add <url> --as <type>`);
    process.exit(1);
  } finally {
    await telemetry.track({
      command: 'install',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        packageId: packageSpec.split('@')[0],
        version: options.version || 'latest',
        type: options.type,
      },
    });
  }
}

/**
 * Extract main file from tarball
 * TODO: Implement proper tar extraction with tar library
 */
async function extractMainFile(tarball: Buffer, packageId: string): Promise<string> {
  // Placeholder implementation
  // In reality, we need to:
  // 1. Extract tar.gz
  // 2. Find main file (from manifest or naming convention)
  // 3. Return file contents

  // For now, assume tarball is just gzipped content
  const zlib = await import('zlib');
  return new Promise((resolve, reject) => {
    zlib.gunzip(tarball, (err, result) => {
      if (err) reject(err);
      else resolve(result.toString('utf-8'));
    });
  });
}

export function createInstallCommand(): Command {
  const command = new Command('install');

  command
    .description('Install a package from the registry')
    .argument('<package>', 'Package to install (e.g., react-rules or react-rules@1.2.0)')
    .option('--version <version>', 'Specific version to install')
    .option('--type <type>', 'Override package type (cursor, claude, continue)')
    .action(async (packageSpec: string, options: any) => {
      if (options.type && !['cursor', 'claude', 'continue', 'windsurf', 'generic'].includes(options.type)) {
        console.error('❌ Type must be one of: cursor, claude, continue, windsurf, generic');
        process.exit(1);
      }

      await handleInstall(packageSpec, options);
    });

  return command;
}
