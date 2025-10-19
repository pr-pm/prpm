/**
 * Package Upload Script
 * Bulk uploads scraped packages to the PRMP registry
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createWriteStream } from 'fs';
import * as tar from 'tar';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

interface ScrapedPackage {
  name: string;
  description: string;
  content: string;
  githubUrl: string;
  author: string;
  stars: number;
  lastUpdate: string;
  tags: string[];
}

interface UploadResult {
  success: boolean;
  package: string;
  error?: string;
}

const REGISTRY_URL = process.env.PRMP_REGISTRY_URL || 'https://registry.prmp.dev';
const CURATOR_TOKEN = process.env.PRMP_CURATOR_TOKEN; // Special token for curator account

/**
 * Create package manifest
 */
function createManifest(pkg: ScrapedPackage): any {
  return {
    name: pkg.name,
    version: '1.0.0',
    displayName: pkg.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    description: pkg.description,
    type: 'cursor',
    tags: pkg.tags,
    author: {
      name: pkg.author,
      github: pkg.githubUrl.split('/').slice(3, 4)[0],
    },
    repository: {
      type: 'git',
      url: pkg.githubUrl,
    },
    metadata: {
      originalAuthor: pkg.author,
      githubUrl: pkg.githubUrl,
      stars: pkg.stars,
      scrapedAt: new Date().toISOString(),
      lastUpdate: pkg.lastUpdate,
      unclaimed: true, // Flag for "claim your package" system
      curatedBy: 'prmp-curator',
    },
    files: [
      '.cursorrules'
    ],
    keywords: pkg.tags,
    license: 'See original repository',
  };
}

/**
 * Create tarball for package
 */
async function createTarball(pkg: ScrapedPackage, manifest: any): Promise<Buffer> {
  const tmpDir = join(tmpdir(), `prmp-${randomBytes(8).toString('hex')}`);
  await mkdir(tmpDir, { recursive: true });

  try {
    // Write files to temp directory
    const manifestPath = join(tmpDir, 'prmp.json');
    const rulesPath = join(tmpDir, '.cursorrules');

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    await writeFile(rulesPath, pkg.content);

    // Create tarball
    const tarballPath = join(tmpDir, 'package.tar.gz');
    await tar.create(
      {
        gzip: true,
        file: tarballPath,
        cwd: tmpDir,
      },
      ['prmp.json', '.cursorrules']
    );

    // Read tarball into buffer
    return await readFile(tarballPath);
  } finally {
    // Cleanup handled by OS tmp directory cleanup
  }
}

/**
 * Upload package to registry
 */
async function uploadPackage(pkg: ScrapedPackage): Promise<UploadResult> {
  try {
    const manifest = createManifest(pkg);
    const tarball = await createTarball(pkg, manifest);

    // Create form data
    const formData = new FormData();
    formData.append('manifest', JSON.stringify(manifest));
    formData.append('tarball', new Blob([tarball]), 'package.tar.gz');

    // Upload to registry
    const response = await fetch(`${REGISTRY_URL}/api/v1/packages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CURATOR_TOKEN}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || error.message || 'Upload failed');
    }

    return {
      success: true,
      package: pkg.name,
    };
  } catch (error) {
    return {
      success: false,
      package: pkg.name,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Main upload function
 */
async function main() {
  console.log('📦 PRMP Package Uploader\n');

  if (!CURATOR_TOKEN) {
    console.error('❌ PRMP_CURATOR_TOKEN environment variable required');
    console.error('   This token should have curator privileges on the registry');
    process.exit(1);
  }

  // Load scraped packages
  const scrapedPath = join(process.cwd(), 'scripts', 'scraped', 'cursor-rules.json');
  console.log(`📂 Loading packages from ${scrapedPath}...`);

  const scrapedData = await readFile(scrapedPath, 'utf-8');
  const packages: ScrapedPackage[] = JSON.parse(scrapedData);

  console.log(`   Found ${packages.length} packages\n`);

  // Upload packages with rate limiting
  const results: UploadResult[] = [];
  const batchSize = 5; // Upload 5 at a time
  const delay = 2000; // 2 second delay between batches

  for (let i = 0; i < packages.length; i += batchSize) {
    const batch = packages.slice(i, i + batchSize);
    console.log(`\n🚀 Uploading batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(packages.length / batchSize)}...`);

    const batchResults = await Promise.all(
      batch.map(async (pkg, idx) => {
        console.log(`   [${i + idx + 1}/${packages.length}] ${pkg.name}...`);
        const result = await uploadPackage(pkg);

        if (result.success) {
          console.log(`   ✓ ${pkg.name} uploaded successfully`);
        } else {
          console.log(`   ✗ ${pkg.name} failed: ${result.error}`);
        }

        return result;
      })
    );

    results.push(...batchResults);

    // Rate limit between batches
    if (i + batchSize < packages.length) {
      console.log(`   ⏳ Waiting ${delay / 1000}s before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\n' + '='.repeat(60));
  console.log('📊 Upload Summary');
  console.log('='.repeat(60));
  console.log(`✓ Successful: ${successful}/${packages.length}`);
  console.log(`✗ Failed: ${failed}/${packages.length}`);

  if (failed > 0) {
    console.log('\n❌ Failed packages:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`   - ${r.package}: ${r.error}`));
  }

  // Save results
  const resultsPath = join(process.cwd(), 'scripts', 'seed', 'upload-results.json');
  await writeFile(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total: packages.length,
    successful,
    failed,
    results,
  }, null, 2));

  console.log(`\n💾 Results saved to: ${resultsPath}`);
  console.log('\n✅ Upload complete!\n');
}

// Run upload
main().catch(console.error);
