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
import type { PackageManifest, PackageFileMetadata, MultiPackageManifest, Manifest } from '../types/registry';
import {
  marketplaceToManifest,
  validateMarketplaceJson,
  type MarketplaceJson,
} from '../core/marketplace-converter';
import { validateManifestSchema } from '../core/schema-validator';
import { extractLicenseInfo, validateLicenseInfo } from '../utils/license-extractor';
import { extractSnippet, validateSnippet } from '../utils/snippet-extractor';

interface PublishOptions {
  access?: 'public' | 'private';
  tag?: string;
  dryRun?: boolean;
}

/**
 * Try to find and load manifest files
 * Checks for:
 * 1. prpm.json (native format) - returns single manifest or array of packages
 * 2. .claude/marketplace.json (Claude format) - returns all plugins as separate manifests
 * 3. .claude-plugin/marketplace.json (Claude format - alternative location) - returns all plugins
 */
async function findAndLoadManifests(): Promise<{ manifests: PackageManifest[]; source: string }> {
  // Try prpm.json first (native format)
  const prpmJsonPath = join(process.cwd(), 'prpm.json');
  try {
    const content = await readFile(prpmJsonPath, 'utf-8');
    const manifest = JSON.parse(content) as Manifest;

    // Check if this is a multi-package manifest
    if ('packages' in manifest && Array.isArray(manifest.packages)) {
      const multiManifest = manifest as MultiPackageManifest;

      // Validate each package in the array
      const validatedManifests = multiManifest.packages.map((pkg, idx) => {
        // Inherit top-level fields if not specified in package - using explicit undefined checks
        const packageWithDefaults: PackageManifest = {
          name: pkg.name,
          version: pkg.version,
          description: pkg.description,
          format: pkg.format,
          files: pkg.files,
          author: pkg.author !== undefined ? pkg.author : multiManifest.author!,
          license: pkg.license !== undefined ? pkg.license : multiManifest.license,
          repository: pkg.repository !== undefined ? pkg.repository : multiManifest.repository,
          homepage: pkg.homepage !== undefined ? pkg.homepage : multiManifest.homepage,
          documentation: pkg.documentation !== undefined ? pkg.documentation : multiManifest.documentation,
          organization: pkg.organization !== undefined ? pkg.organization : multiManifest.organization,
          tags: pkg.tags !== undefined ? pkg.tags : multiManifest.tags,
          keywords: pkg.keywords !== undefined ? pkg.keywords : multiManifest.keywords,
          subtype: pkg.subtype,
          dependencies: pkg.dependencies,
          peerDependencies: pkg.peerDependencies,
          engines: pkg.engines,
          main: pkg.main,
        };

        return validateManifest(packageWithDefaults);
      });

      return { manifests: validatedManifests, source: 'prpm.json (multi-package)' };
    }

    // Single package manifest
    const validated = validateManifest(manifest as PackageManifest);
    return { manifests: [validated], source: 'prpm.json' };
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
    const marketplaceData = JSON.parse(content) as MarketplaceJson;

    if (!validateMarketplaceJson(marketplaceData)) {
      throw new Error('Invalid marketplace.json format');
    }

    // Convert each plugin in marketplace.json to a separate PRPM manifest
    const manifests: PackageManifest[] = [];
    for (let i = 0; i < marketplaceData.plugins.length; i++) {
      const manifest = marketplaceToManifest(marketplaceData, i);
      const validated = validateManifest(manifest);
      manifests.push(validated);
    }

    return { manifests, source: '.claude/marketplace.json' };
  } catch (error) {
    // marketplace.json not found or invalid at .claude path, try .claude-plugin
  }

  // Try .claude-plugin/marketplace.json (alternative Claude format)
  const marketplaceJsonPluginPath = join(process.cwd(), '.claude-plugin', 'marketplace.json');
  try {
    const content = await readFile(marketplaceJsonPluginPath, 'utf-8');
    const marketplaceData = JSON.parse(content) as MarketplaceJson;

    if (!validateMarketplaceJson(marketplaceData)) {
      throw new Error('Invalid marketplace.json format');
    }

    // Convert each plugin in marketplace.json to a separate PRPM manifest
    const manifests: PackageManifest[] = [];
    for (let i = 0; i < marketplaceData.plugins.length; i++) {
      const manifest = marketplaceToManifest(marketplaceData, i);
      const validated = validateManifest(manifest);
      manifests.push(validated);
    }

    return { manifests, source: '.claude-plugin/marketplace.json' };
  } catch (error) {
    // marketplace.json not found or invalid
  }

  // No manifest file found
  throw new Error(
    'No manifest file found. Expected either:\n' +
    '  - prpm.json in the current directory, or\n' +
    '  - .claude/marketplace.json (Claude format), or\n' +
    '  - .claude-plugin/marketplace.json (Claude format)'
  );
}

/**
 * Validate package manifest
 */
function validateManifest(manifest: PackageManifest): PackageManifest {
  // Set default subtype to 'rule' if not provided
  if (!manifest.subtype) {
    manifest.subtype = 'rule';
  }

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

    // Read and validate manifests
    console.log('🔍 Validating package manifest(s)...');
    const { manifests, source } = await findAndLoadManifests();

    if (manifests.length > 1) {
      console.log(`   Found ${manifests.length} plugins in ${source}`);
      console.log('   Will publish each plugin separately\n');
    }

    // Get user info to check for organizations (once for all packages)
    console.log('🔍 Checking authentication...');
    const client = getRegistryClient(config);
    let userInfo: any;

    try {
      userInfo = await client.whoami();
    } catch (err) {
      console.log('   Could not fetch user organizations, publishing as personal packages');
    }
    console.log('');

    // Track published packages
    const publishedPackages: Array<{ name: string; version: string; url: string }> = [];
    const failedPackages: Array<{ name: string; error: string }> = [];

    // Publish each manifest
    for (let i = 0; i < manifests.length; i++) {
      const manifest = manifests[i];
      packageName = manifest.name;
      version = manifest.version;

      if (manifests.length > 1) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📦 Publishing plugin ${i + 1} of ${manifests.length}`);
        console.log(`${'='.repeat(60)}\n`);
      }

      try {
        let selectedOrgId: string | undefined;

        // Check if organization is specified in manifest
        if (manifest.organization && userInfo) {
          const orgFromManifest = userInfo.organizations?.find(
            (org: any) => org.name === manifest.organization || org.id === manifest.organization
          );

          if (!orgFromManifest) {
            throw new Error(`Organization "${manifest.organization}" not found or you are not a member`);
          }

          // Check if user has publishing rights
          if (!['owner', 'admin', 'maintainer'].includes(orgFromManifest.role)) {
            throw new Error(
              `You do not have permission to publish to organization "${orgFromManifest.name}". ` +
              `Your role: ${orgFromManifest.role}. Required: owner, admin, or maintainer`
            );
          }

          selectedOrgId = orgFromManifest.id;
        }

        console.log(`   Source: ${source}`);
        console.log(`   Package: ${manifest.name}@${manifest.version}`);
        console.log(`   Format: ${manifest.format} | Subtype: ${manifest.subtype}`);
        console.log(`   Description: ${manifest.description}`);
        if (selectedOrgId && userInfo) {
          const selectedOrg = userInfo.organizations.find((org: any) => org.id === selectedOrgId);
          console.log(`   Publishing to: ${selectedOrg?.name || 'organization'}`);
        }
        console.log('');

        // Extract license information
        console.log('📄 Extracting license information...');
        const licenseInfo = await extractLicenseInfo(manifest.repository);

        // Update manifest with license information from LICENSE file if found
        // Only set fields that aren't already manually specified in prpm.json
        if (licenseInfo.type && !manifest.license) {
          manifest.license = licenseInfo.type;
        }
        if (licenseInfo.text && !manifest.license_text) {
          manifest.license_text = licenseInfo.text;
        }
        if (licenseInfo.url && !manifest.license_url) {
          manifest.license_url = licenseInfo.url || undefined;
        }

        // Validate and warn about license (optional - will extract if present)
        validateLicenseInfo(licenseInfo, manifest.name);
        console.log('');

        // Extract content snippet
        console.log('📝 Extracting content snippet...');
        const snippet = await extractSnippet(manifest);
        if (snippet) {
          manifest.snippet = snippet;
        }
        validateSnippet(snippet, manifest.name);
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
          publishedPackages.push({
            name: manifest.name,
            version: manifest.version,
            url: ''
          });
          continue;
        }

        // Publish to registry
        console.log('🚀 Publishing to registry...');
        const result = await client.publish(manifest, tarball, selectedOrgId ? { orgId: selectedOrgId } : undefined);

        // Determine the webapp URL based on registry URL
        let webappUrl: string;
        const registryUrl = config.registryUrl || 'https://registry.prpm.dev';
        if (registryUrl.includes('localhost') || registryUrl.includes('127.0.0.1')) {
          // Local development - webapp is on port 5173
          webappUrl = 'http://localhost:5173';
        } else if (registryUrl.includes('registry.prpm.dev')) {
          // Production - webapp is on prpm.dev
          webappUrl = 'https://prpm.dev';
        } else {
          // Default to registry URL for unknown environments
          webappUrl = registryUrl;
        }

        const packageUrl = `${webappUrl}/packages/${encodeURIComponent(manifest.name)}`;

        console.log('');
        console.log('✅ Package published successfully!');
        console.log('');
        console.log(`   Package: ${manifest.name}@${result.version}`);
        console.log(`   Install: prpm install ${manifest.name}`);
        console.log('');

        publishedPackages.push({
          name: manifest.name,
          version: result.version,
          url: packageUrl
        });
      } catch (err) {
        const pkgError = err instanceof Error ? err.message : String(err);
        console.error(`\n❌ Failed to publish ${manifest.name}: ${pkgError}\n`);
        failedPackages.push({
          name: manifest.name,
          error: pkgError
        });
      }
    }

    // Print summary if multiple packages
    if (manifests.length > 1) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 Publishing Summary`);
      console.log(`${'='.repeat(60)}\n`);

      if (publishedPackages.length > 0) {
        console.log(`✅ Successfully published ${publishedPackages.length} package(s):`);
        publishedPackages.forEach(pkg => {
          console.log(`   - ${pkg.name}@${pkg.version}`);
          if (pkg.url) {
            console.log(`     ${pkg.url}`);
          }
        });
        console.log('');
      }

      if (failedPackages.length > 0) {
        console.log(`❌ Failed to publish ${failedPackages.length} package(s):`);
        failedPackages.forEach(pkg => {
          console.log(`   - ${pkg.name}: ${pkg.error}`);
        });
        console.log('');
      }
    }

    success = publishedPackages.length > 0;

    if (failedPackages.length > 0 && publishedPackages.length === 0) {
      process.exit(1);
    }
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
