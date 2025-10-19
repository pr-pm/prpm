/**
 * Publish command implementation
 */

import { Command } from 'commander';
import { readFile, stat } from 'fs/promises';
import { join, basename } from 'path';
import { createReadStream } from 'fs';
import * as tar from 'tar';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { getRegistryClient } from '@prpm/registry-client';
import { getConfig } from '../core/user-config';
import { telemetry } from '../core/telemetry';

interface PublishOptions {
  access?: 'public' | 'private';
  tag?: string;
  dryRun?: boolean;
}

/**
 * Validate package manifest
 */
async function validateManifest(manifestPath: string): Promise<any> {
  try {
    const content = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    // Required fields
    const required = ['name', 'version', 'description', 'type'];
    const missing = required.filter(field => !manifest[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Validate name format
    if (!/^(@[a-z0-9-]+\/)?[a-z0-9-]+$/.test(manifest.name)) {
      throw new Error('Package name must be lowercase alphanumeric with hyphens only');
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      throw new Error('Version must be semver format (e.g., 1.0.0)');
    }

    // Validate type
    const validTypes = ['cursor', 'claude', 'continue', 'windsurf', 'generic'];
    if (!validTypes.includes(manifest.type)) {
      throw new Error(`Type must be one of: ${validTypes.join(', ')}`);
    }

    return manifest;
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      throw new Error('prpm.json not found. Run this command in your package directory.');
    }
    throw error;
  }
}

/**
 * Create tarball from current directory
 */
async function createTarball(manifest: any): Promise<Buffer> {
  const tmpDir = join(tmpdir(), `prpm-${randomBytes(8).toString('hex')}`);
  const tarballPath = join(tmpDir, 'package.tar.gz');

  try {
    // Get files to include (from manifest.files or default)
    const files = manifest.files || [
      'prpm.json',
      '.cursorrules',
      'README.md',
      'LICENSE',
      '.clinerules',
      '.continuerc.json',
      '.windsurfrules'
    ];

    // Check which files exist
    const existingFiles: string[] = [];
    for (const file of files) {
      try {
        await stat(file);
        existingFiles.push(file);
      } catch {
        // File doesn't exist, skip
      }
    }

    if (existingFiles.length === 0) {
      throw new Error('No package files found to include in tarball');
    }

    // Create tarball
    await tar.create(
      {
        gzip: true,
        file: tarballPath,
        cwd: process.cwd(),
      },
      existingFiles
    );

    // Read tarball into buffer
    const tarballBuffer = await readFile(tarballPath);

    // Check size (max 10MB)
    const sizeMB = tarballBuffer.length / (1024 * 1024);
    if (sizeMB > 10) {
      throw new Error(`Package size (${sizeMB.toFixed(2)}MB) exceeds 10MB limit`);
    }

    return tarballBuffer;
  } catch (error) {
    throw error;
  }
}

/**
 * Publish a package to the registry
 */
export async function handlePublish(options: PublishOptions): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;
  let packageName: string | undefined;
  let version: string | undefined;

  try {
    const config = await getConfig();

    // Check if logged in
    if (!config.token) {
      console.error('❌ Not logged in. Run "prpm login" first.');
      process.exit(1);
    }

    console.log('📦 Publishing package...\n');

    // Read and validate manifest
    console.log('🔍 Validating package manifest...');
    const manifestPath = join(process.cwd(), 'prpm.json');
    const manifest = await validateManifest(manifestPath);
    packageName = manifest.name;
    version = manifest.version;

    console.log(`   Package: ${manifest.name}@${manifest.version}`);
    console.log(`   Type: ${manifest.type}`);
    console.log(`   Description: ${manifest.description}`);
    console.log('');

    // Create tarball
    console.log('📦 Creating package tarball...');
    const tarball = await createTarball(manifest);
    const sizeMB = (tarball.length / (1024 * 1024)).toFixed(2);
    console.log(`   Size: ${sizeMB}MB`);
    console.log('');

    if (options.dryRun) {
      console.log('✅ Dry run successful! Package is ready to publish.');
      console.log('   Run without --dry-run to publish.');
      success = true;
      return;
    }

    // Publish to registry
    console.log('🚀 Publishing to registry...');
    const client = getRegistryClient(config);
    const result = await client.publish(manifest, tarball);

    console.log('');
    console.log('✅ Package published successfully!');
    console.log('');
    console.log(`   Package: ${result.name}@${result.version}`);
    console.log(`   Install: prpm install ${result.name}`);
    console.log(`   View: ${config.registryUrl}/packages/${result.id}`);
    console.log('');

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Failed to publish package: ${error}\n`);
    process.exit(1);
  } finally {
    // Track telemetry
    await telemetry.track({
      command: 'publish',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        packageName,
        version,
        dryRun: options.dryRun,
      },
    });
  }
}

/**
 * Create the publish command
 */
export function createPublishCommand(): Command {
  return new Command('publish')
    .description('Publish a package to the registry')
    .option('--access <type>', 'Package access (public or private)', 'public')
    .option('--tag <tag>', 'NPM-style tag (e.g., latest, beta)', 'latest')
    .option('--dry-run', 'Validate package without publishing')
    .action(handlePublish);
}
