/**
 * Install command - Install packages from registries
 */

import { Command } from 'commander';
import { getEnabledRegistries, getDefaultRegistry } from './registry';
import { Registry, PackageType } from '../types';
import { addPackage } from '../core/config';
import { downloadFile } from '../core/downloader';
import { getDestinationDir } from '../core/filesystem';
import path from 'path';

interface InstallOptions {
  registry?: string;
  version?: string;
  for?: string; // Install to multiple tools
}

export function createInstallCommand(): Command {
  const command = new Command('install');

  command
    .description('Install a package from a registry')
    .argument('<name>', 'Package name to install')
    .option('--registry <name>', 'Registry to install from')
    .option('--version <version>', 'Specific version to install (default: latest)')
    .option('--for <tools>', 'Install to multiple tools (comma-separated)')
    .action(async (packageName: string, options: InstallOptions) => {
      try {
        console.log(`\n📦 Installing ${packageName}...\n`);

        // Determine registry
        let registry: Registry;
        if (options.registry) {
          const registries = await getEnabledRegistries();
          const found = registries.find((r) => r.name === options.registry);
          if (!found) {
            console.error(`❌ Registry "${options.registry}" not found`);
            process.exit(1);
          }
          registry = found;
        } else {
          registry = await getDefaultRegistry();
        }

        console.log(`   Registry: ${registry.name}`);
        console.log(`   Package:  ${packageName}`);

        // Fetch package info
        const packageInfo = await fetchPackageInfo(
          registry,
          packageName,
          options.version
        );

        console.log(`   Version:  ${packageInfo.version}`);
        if (packageInfo.description) {
          console.log(`   Description: ${packageInfo.description}`);
        }

        // Download content
        console.log('\n📥 Downloading...');
        const content = await downloadPackageContent(
          registry,
          packageName,
          packageInfo.version
        );

        // Determine target tools
        const targetTools = options.for
          ? options.for.split(',').map((t) => t.trim())
          : packageInfo.tools || ['cursor'];

        // Install to each tool
        console.log(`\n📁 Installing to ${targetTools.length} ${targetTools.length === 1 ? 'tool' : 'tools'}...`);

        for (const tool of targetTools) {
          try {
            const toolDir = getDestinationDir(tool as PackageType);
            const fileName = `${packageName}.md`;
            const destPath = path.join(process.cwd(), toolDir, fileName);

            // Write file
            const fs = await import('fs/promises');
            await fs.mkdir(path.dirname(destPath), { recursive: true });
            await fs.writeFile(destPath, content, 'utf-8');

            console.log(`   ✅ ${tool}: ${destPath}`);

            // Add to config
            await addPackage({
              id: `${packageName}-${tool}`,
              type: tool as any,
              url: `${registry.url}/packages/${packageName}/${packageInfo.version}`,
              dest: destPath,
              version: packageInfo.version,
              metadata: {
                description: packageInfo.description,
                author: packageInfo.author,
                tags: packageInfo.tags,
              },
            });
          } catch (error) {
            console.error(`   ❌ ${tool}: Installation failed`);
          }
        }

        console.log('\n✅ Installation complete!\n');
      } catch (error) {
        if (error instanceof Error) {
          console.error(`\n❌ Installation failed: ${error.message}\n`);
        } else {
          console.error('\n❌ Installation failed with unknown error\n');
        }
        process.exit(1);
      }
    });

  return command;
}

/**
 * Fetch package info from registry
 */
async function fetchPackageInfo(
  registry: Registry,
  packageName: string,
  version?: string
): Promise<{
  version: string;
  description?: string;
  author?: string;
  tags?: string[];
  tools?: string[];
}> {
  // In a real implementation:
  // const url = version
  //   ? `${registry.url}/packages/${packageName}/${version}`
  //   : `${registry.url}/packages/${packageName}`;
  //
  // const response = await fetch(url, {
  //   headers: registry.auth?.token
  //     ? { Authorization: `Bearer ${registry.auth.token}` }
  //     : {},
  // });
  //
  // if (!response.ok) {
  //   throw new Error(`Package not found: ${packageName}`);
  // }
  //
  // return await response.json();

  // Mock data for now
  console.log('   ⚠️  Note: Registry server not yet deployed. Using mock data.');

  return {
    version: version || '1.0.0',
    description: `Mock package: ${packageName}`,
    author: 'Unknown',
    tags: ['mock'],
    tools: ['cursor'],
  };
}

/**
 * Download package content from registry
 */
async function downloadPackageContent(
  registry: Registry,
  packageName: string,
  version: string
): Promise<string> {
  // In a real implementation:
  // const url = `${registry.url}/packages/${packageName}/${version}`;
  //
  // const response = await fetch(url, {
  //   headers: registry.auth?.token
  //     ? { Authorization: `Bearer ${registry.auth.token}` }
  //     : {},
  // });
  //
  // if (!response.ok) {
  //   throw new Error(`Download failed: ${response.statusText}`);
  // }
  //
  // const data = await response.json();
  // return data.content;

  // Mock content for now
  return `# ${packageName}

This is a mock package downloaded from a registry.

Version: ${version}

To use this package, the registry server needs to be deployed.
See REGISTRY_IMPLEMENTATION.md for deployment instructions.
`;
}
