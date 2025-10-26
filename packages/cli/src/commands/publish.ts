/**
 * Publish command implementation
 */

import { Command } from 'commander';
import { readFile, stat, mkdir, rm } from 'fs/promises';
import { join, basename } from 'path';
import { createReadStream } from 'fs';
import * as tar from 'tar';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { telemetry } from '../core/telemetry';
import type { PackageManifest, PackageFileMetadata } from '../types/registry';
import {
  marketplaceToManifest,
  validateMarketplaceJson,
  type MarketplaceJson,
} from '../core/marketplace-converter';
import { validateManifestSchema } from '../core/schema-validator';

interface PublishOptions {
  access?: 'public' | 'private';
  tag?: string;
  dryRun?: boolean;
}

/**
 * Try to find and load a manifest file
 * Checks for:
 * 1. prpm.json (native format)
 * 2. .claude/marketplace.json (Claude format)
 */
async function findAndLoadManifest(): Promise<{ manifest: PackageManifest; source: string }> {
  // Try prpm.json first (native format)
  const prpmJsonPath = join(process.cwd(), 'prpm.json');
  try {
    const content = await readFile(prpmJsonPath, 'utf-8');
    const manifest = JSON.parse(content);
    const validated = validateManifest(manifest);
    return { manifest: validated, source: 'prpm.json' };
  } catch (error) {
    // If it's a validation error, throw it immediately (don't try marketplace.json)
    if (error instanceof Error && (
      error.message.includes('Manifest validation failed') ||
      error.message.includes('Claude skill') ||
      error.message.includes('SKILL.md')
    )) {
      throw error;
    }
    // Otherwise, prpm.json not found or invalid JSON, try marketplace.json
  }

  // Try .claude/marketplace.json (Claude format)
  const marketplaceJsonPath = join(process.cwd(), '.claude', 'marketplace.json');
  try {
    const content = await readFile(marketplaceJsonPath, 'utf-8');
    const marketplaceData = JSON.parse(content);

    if (!validateMarketplaceJson(marketplaceData)) {
      throw new Error('Invalid marketplace.json format');
    }

    // Convert marketplace.json to PRPM manifest
    const manifest = marketplaceToManifest(marketplaceData as MarketplaceJson);

    // Validate the converted manifest
    const validated = validateManifest(manifest);

    return { manifest: validated, source: '.claude/marketplace.json' };
  } catch (error) {
    // marketplace.json not found or invalid
  }

  // Neither file found
  throw new Error(
    'No manifest file found. Expected either:\n' +
    '  - prpm.json in the current directory, or\n' +
    '  - .claude/marketplace.json (Claude format)'
  );
}

/**
 * Validate package manifest
 */
function validateManifest(manifest: PackageManifest): PackageManifest {
  // First, validate against JSON schema
  const schemaValidation = validateManifestSchema(manifest);
  if (!schemaValidation.valid) {
    const errorMessages = schemaValidation.errors?.join('\n  - ') || 'Unknown validation error';
    throw new Error(`Manifest validation failed:\n  - ${errorMessages}`);
  }

  // Additional custom validations (beyond what JSON schema can express)

  // Check if using enhanced format (file objects)
  const hasEnhancedFormat = manifest.files.some(f => typeof f === 'object');

  if (hasEnhancedFormat) {
    // Check if files have multiple distinct formats
    const fileFormats = new Set(
      (manifest.files as PackageFileMetadata[])
        .filter(f => typeof f === 'object')
        .map(f => f.format)
    );

    // Only suggest "collection" if there are multiple distinct formats
    if (fileFormats.size > 1 && manifest.subtype !== 'collection') {
      console.warn('⚠️  Package contains multiple file formats. Consider setting subtype to "collection" for clarity.');
    }
  }

  // Enforce SKILL.md filename for Claude skills
  if (manifest.format === 'claude' && manifest.subtype === 'skill') {
    const filePaths = normalizeFilePaths(manifest.files);
    const hasSkillMd = filePaths.some(path => path.endsWith('/SKILL.md') || path === 'SKILL.md');

    if (!hasSkillMd) {
      throw new Error(
        'Claude skills must contain a SKILL.md file.\n' +
        'According to Claude documentation at https://docs.claude.com/en/docs/claude-code/skills,\n' +
        'skills must have a file named SKILL.md in their directory.\n' +
        'Please rename your skill file to SKILL.md (all caps) and update your prpm.json files array.'
      );
    }

    // Validate skill name length (max 64 characters)
    if (manifest.name.length > 64) {
      throw new Error(
        `Claude skill name "${manifest.name}" exceeds 64 character limit (${manifest.name.length} characters).\n` +
        'According to Claude documentation, skill names must be max 64 characters.\n' +
        'Please shorten your package name.'
      );
    }

    // Validate skill name format (lowercase, numbers, hyphens only)
    if (!/^[a-z0-9-]+$/.test(manifest.name)) {
      throw new Error(
        `Claude skill name "${manifest.name}" contains invalid characters.\n` +
        'According to Claude documentation, skill names must use lowercase letters, numbers, and hyphens only.\n' +
        'Please update your package name.'
      );
    }

    // Validate description length (max 1024 characters)
    if (manifest.description.length > 1024) {
      throw new Error(
        `Claude skill description exceeds 1024 character limit (${manifest.description.length} characters).\n` +
        'According to Claude documentation, skill descriptions must be max 1024 characters.\n' +
        'Please shorten your description.'
      );
    }

    // Warn if description is approaching the limit (80% = 819 chars)
    if (manifest.description.length > 819) {
      console.warn(
        `⚠️  Warning: Skill description is ${manifest.description.length}/1024 characters (${Math.round(manifest.description.length / 1024 * 100)}% of limit).\n` +
        '   Consider keeping it concise for better discoverability.'
      );
    }

    // Warn if description is too short (less than 100 chars)
    if (manifest.description.length < 100) {
      console.warn(
        `⚠️  Warning: Skill description is only ${manifest.description.length} characters.\n` +
        '   Claude uses descriptions for skill discovery - consider adding more detail about:\n' +
        '   - What the skill does\n' +
        '   - When Claude should use it\n' +
        '   - What problems it solves'
      );
    }
  }

  return manifest;
}

/**
 * Normalize files array to string paths
 * Converts both simple and enhanced formats to string array
 */
function normalizeFilePaths(files: string[] | PackageFileMetadata[]): string[] {
  return files.map(file => {
    if (typeof file === 'string') {
      return file;
    } else {
      return file.path;
    }
  });
}

/**
 * Create tarball from current directory
 */
async function createTarball(manifest: PackageManifest): Promise<Buffer> {
  const tmpDir = join(tmpdir(), `prpm-${randomBytes(8).toString('hex')}`);
  const tarballPath = join(tmpDir, 'package.tar.gz');

  try {
    // Create temp directory
    await mkdir(tmpDir, { recursive: true });

    // Get files to include - normalize to string paths
    const filePaths = normalizeFilePaths(manifest.files);

    // Add standard files if not already included
    const standardFiles = ['prpm.json', 'README.md', 'LICENSE'];
    for (const file of standardFiles) {
      if (!filePaths.includes(file)) {
        filePaths.push(file);
      }
    }

    // Check which files exist
    const existingFiles: string[] = [];
    for (const file of filePaths) {
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
  } finally {
    // Clean up temp directory
    try {
      await rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
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

    // Read and validate manifest first to check if org is specified
    console.log('🔍 Validating package manifest...');
    const { manifest, source } = await findAndLoadManifest();
    packageName = manifest.name;
    version = manifest.version;

    // Get user info to check for organizations
    console.log('🔍 Checking authentication...');
    const client = getRegistryClient(config);
    let userInfo: any;
    let selectedOrgId: string | undefined;

    try {
      userInfo = await client.whoami();

      // Check if organization is specified in manifest
      if (manifest.organization) {
        // Find org by name or ID
        const orgFromManifest = userInfo.organizations?.find(
          (org: any) => org.name === manifest.organization || org.id === manifest.organization
        );

        if (!orgFromManifest) {
          console.error(`❌ Organization "${manifest.organization}" not found or you are not a member.`);
          console.error('   Available organizations:');
          if (userInfo.organizations && userInfo.organizations.length > 0) {
            userInfo.organizations.forEach((org: any) => {
              console.error(`   - ${org.name} (${org.role})`);
            });
          } else {
            console.error('   (none)');
          }
          process.exit(1);
        }

        // Check if user has publishing rights
        if (!['owner', 'admin', 'maintainer'].includes(orgFromManifest.role)) {
          console.error(`❌ You do not have permission to publish to organization "${orgFromManifest.name}".`);
          console.error(`   Your role: ${orgFromManifest.role}`);
          console.error(`   Required: owner, admin, or maintainer`);
          process.exit(1);
        }

        selectedOrgId = orgFromManifest.id;
        console.log(`   Organization from manifest: ${orgFromManifest.name} (${orgFromManifest.role})`);
      }
      // Only prompt if no org specified in manifest and user has orgs
      else if (userInfo.organizations && userInfo.organizations.length > 0) {
        const { default: inquirer } = await import('inquirer');

        const publishOptions = [
          { name: `Personal (${userInfo.username})`, value: null },
          ...userInfo.organizations
            .filter((org: any) => ['owner', 'admin', 'maintainer'].includes(org.role))
            .map((org: any) => ({
              name: `${org.name} (${org.role})`,
              value: org.id,
            })),
        ];

        if (publishOptions.length > 1) {
          const answer = await inquirer.prompt([
            {
              type: 'list',
              name: 'publisher',
              message: 'Publish this package as:',
              choices: publishOptions,
            },
          ]);
          selectedOrgId = answer.publisher;
        }
      }
    } catch (err) {
      console.log('   Could not fetch user organizations, publishing as personal package');
    }
    console.log('');

    console.log(`   Source: ${source}`);
    console.log(`   Package: ${manifest.name}@${manifest.version}`);
    console.log(`   Format: ${manifest.format} | Subtype: ${manifest.subtype || 'rule (default)'}`);
    console.log(`   Description: ${manifest.description}`);
    if (selectedOrgId && userInfo) {
      const selectedOrg = userInfo.organizations.find((org: any) => org.id === selectedOrgId);
      console.log(`   Publishing to: ${selectedOrg?.name || 'organization'}`);
    }
    console.log('');

    // Create tarball
    console.log('📦 Creating package tarball...');
    const tarball = await createTarball(manifest);

    // Display size in KB or MB depending on size
    const sizeInBytes = tarball.length;
    const sizeInKB = sizeInBytes / 1024;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    let sizeDisplay: string;
    if (sizeInMB >= 1) {
      sizeDisplay = `${sizeInMB.toFixed(2)}MB`;
    } else {
      sizeDisplay = `${sizeInKB.toFixed(2)}KB`;
    }

    console.log(`   Size: ${sizeDisplay}`);
    console.log('');

    if (options.dryRun) {
      console.log('✅ Dry run successful! Package is ready to publish.');
      console.log('   Run without --dry-run to publish.');
      success = true;
      return;
    }

    // Publish to registry
    console.log('🚀 Publishing to registry...');
    const result = await client.publish(manifest, tarball, selectedOrgId ? { orgId: selectedOrgId } : undefined);

    console.log('');
    console.log('✅ Package published successfully!');
    console.log('');
    console.log(`   Package: ${manifest.name}@${result.version}`);
    console.log(`   Install: prpm install ${manifest.name}`);
    console.log(`   View: ${config.registryUrl}/packages/${result.package_id}`);
    console.log('');

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Failed to publish package: ${error}\n`);

    // Provide helpful hints based on error type
    if (error.includes('Manifest validation failed')) {
      console.log('💡 Common validation issues:');
      console.log('   - Missing required fields (name, version, description, format)');
      console.log('   - Invalid format or subtype values');
      console.log('   - Description too short (min 10 chars) or too long (max 500 chars)');
      console.log('   - Package name must be lowercase with hyphens only');
      console.log('');
      console.log('💡 For Claude skills specifically:');
      console.log('   - Add "subtype": "skill" to your prpm.json');
      console.log('   - Ensure files include a SKILL.md file');
      console.log('   - Package name must be max 64 characters');
      console.log('');
      console.log('💡 View the schema: prpm schema');
      console.log('');
    } else if (error.includes('SKILL.md')) {
      console.log('💡 Claude skills require:');
      console.log('   - A file named SKILL.md (all caps) in your package');
      console.log('   - "format": "claude" and "subtype": "skill" in prpm.json');
      console.log('');
    } else if (error.includes('No manifest file found')) {
      console.log('💡 Create a manifest file:');
      console.log('   - Run: prpm init');
      console.log('   - Or create prpm.json manually');
      console.log('');
    }

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
    await telemetry.shutdown();
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
    .action(async (options: PublishOptions) => {
      await handlePublish(options);
      process.exit(0);
    });
}
