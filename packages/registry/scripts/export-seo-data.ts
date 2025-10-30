/**
 * Export SEO data with full package content to S3
 *
 * This script:
 * 1. Fetches all public packages from the database
 * 2. Downloads each package tarball from S3
 * 3. Extracts the full prompt content from the tarball
 * 4. Exports packages.json and collections.json with fullContent to S3
 *
 * Run with: npx tsx scripts/export-seo-data.ts
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { query } from '../src/db/index.js';
import { getDownloadUrl } from '../src/storage/s3.js';
import { createFastifyServer } from '../src/index.js';
import fetch from 'node-fetch';
import tar from 'tar-stream';
import { createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const S3_SEO_BUCKET = process.env.S3_SEO_BUCKET || 'prpm-prod-packages';
const S3_SEO_KEY_PACKAGES = 'seo-data/packages.json';
const S3_SEO_KEY_COLLECTIONS = 'seo-data/collections.json';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

const s3Client = new S3Client({
  region: AWS_REGION,
});

interface PackageRow {
  id: string;
  name: string;
  description: string | null;
  format: string;
  subtype: string;
  category: string | null;
  tags: string[];
  total_downloads: number;
  weekly_downloads: number;
  monthly_downloads: number;
  snippet: string | null;
  verified: boolean;
  featured: boolean;
  deprecated: boolean;
  deprecated_reason: string | null;
  license: string | null;
  license_url: string | null;
  license_text: string | null;
  repository_url: string | null;
  homepage_url: string | null;
  documentation_url: string | null;
  quality_score: number | null;
  rating_average: number | null;
  rating_count: number;
  version_count: number;
  readme: string | null;
  author_username: string | null;
  latest_version: string | null;
  latest_version_published_at: string | null;
  latest_version_file_size: number | null;
  latest_version_downloads: number | null;
  latest_version_changelog: string | null;
}

/**
 * Extract full content from package tarball
 */
async function extractFullContent(tarballUrl: string): Promise<string | null> {
  try {
    console.log(`  Downloading tarball: ${tarballUrl.substring(0, 80)}...`);

    const response = await fetch(tarballUrl);
    if (!response.ok) {
      console.error(`  ❌ Failed to download tarball: ${response.status} ${response.statusText}`);
      return null;
    }

    const buffer = await response.buffer();
    const readable = Readable.from(buffer);

    return new Promise<string | null>((resolve, reject) => {
      const extract = tar.extract();
      let fullContent: string | null = null;
      let foundFile = false;

      extract.on('entry', (header, stream, next) => {
        const filename = header.name;

        // Look for main prompt files (common patterns)
        const isPromptFile =
          filename.endsWith('.md') ||
          filename.endsWith('.mdc') ||
          filename.endsWith('.agents.md') ||
          filename.includes('SKILL.md') ||
          filename.includes('prompt') ||
          filename.includes('rule');

        if (isPromptFile && !foundFile) {
          console.log(`    Found prompt file: ${filename}`);
          const chunks: Buffer[] = [];

          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () => {
            fullContent = Buffer.concat(chunks).toString('utf-8');
            foundFile = true;
            next();
          });
          stream.on('error', next);
        } else {
          stream.on('end', next);
          stream.resume(); // Skip this file
        }
      });

      extract.on('finish', () => {
        resolve(fullContent);
      });

      extract.on('error', (err) => {
        console.error(`  ❌ Error extracting tarball: ${err.message}`);
        reject(err);
      });

      // Pipe through gunzip and tar extract
      readable
        .pipe(createGunzip())
        .pipe(extract);
    });
  } catch (error) {
    console.error(`  ❌ Error processing tarball: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Export packages with full content
 */
async function exportPackages(server: any) {
  console.log('\n📦 Exporting packages with full content...\n');

  // Fetch all public packages with their latest version info
  const result = await query<PackageRow>(
    server,
    `SELECT
      p.id, p.name, p.description, p.format, p.subtype,
      p.category, p.tags, p.total_downloads, p.weekly_downloads, p.monthly_downloads,
      p.snippet, p.verified, p.featured, p.deprecated, p.deprecated_reason,
      p.license, p.license_url, p.license_text,
      p.repository_url, p.homepage_url, p.documentation_url,
      p.quality_score, p.rating_average, p.rating_count, p.version_count,
      p.readme,
      u.username as author_username,
      pv.version as latest_version,
      pv.published_at as latest_version_published_at,
      pv.file_size as latest_version_file_size,
      pv.downloads as latest_version_downloads,
      pv.changelog as latest_version_changelog,
      pv.tarball_url as tarball_url
    FROM packages p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN LATERAL (
      SELECT version, published_at, file_size, downloads, changelog, tarball_url
      FROM package_versions
      WHERE package_id = p.id
      ORDER BY published_at DESC
      LIMIT 1
    ) pv ON true
    WHERE p.visibility = 'public'
    ORDER BY p.total_downloads DESC`
  );

  console.log(`Found ${result.rows.length} public packages\n`);

  const packagesWithFullContent = [];
  let successCount = 0;
  let failCount = 0;

  for (const pkg of result.rows) {
    console.log(`Processing: ${pkg.name}`);

    let fullContent: string | null = null;

    // Try to extract full content from tarball
    if (pkg['tarball_url']) {
      try {
        // For presigned URLs, use them directly; for S3 paths, generate presigned URL
        let downloadUrl: string;
        if (pkg['tarball_url'].startsWith('http')) {
          downloadUrl = pkg['tarball_url'];
        } else {
          // Generate presigned URL
          const [packageId, version] = [pkg.id, pkg.latest_version];
          downloadUrl = await getDownloadUrl(server, packageId, version!, 3600);
        }

        fullContent = await extractFullContent(downloadUrl);

        if (fullContent) {
          console.log(`  ✅ Extracted ${fullContent.length} characters`);
          successCount++;
        } else {
          console.log(`  ⚠️  Could not extract content, using snippet`);
          fullContent = pkg.snippet;
          failCount++;
        }
      } catch (error) {
        console.error(`  ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
        fullContent = pkg.snippet; // Fallback to snippet
        failCount++;
      }
    } else {
      console.log(`  ⚠️  No tarball URL, using snippet`);
      fullContent = pkg.snippet;
      failCount++;
    }

    // Build package export object
    const packageExport = {
      name: pkg.name,
      description: pkg.description,
      format: pkg.format,
      subtype: pkg.subtype,
      category: pkg.category,
      tags: pkg.tags,
      total_downloads: pkg.total_downloads,
      weekly_downloads: pkg.weekly_downloads,
      monthly_downloads: pkg.monthly_downloads,
      snippet: pkg.snippet, // Keep snippet for fallback
      fullContent: fullContent, // NEW: Full prompt content
      verified: pkg.verified,
      featured: pkg.featured,
      deprecated: pkg.deprecated,
      deprecated_reason: pkg.deprecated_reason,
      license: pkg.license,
      license_url: pkg.license_url,
      license_text: pkg.license_text,
      repository_url: pkg.repository_url,
      homepage_url: pkg.homepage_url,
      documentation_url: pkg.documentation_url,
      quality_score: pkg.quality_score,
      rating_average: pkg.rating_average,
      rating_count: pkg.rating_count,
      version_count: pkg.version_count,
      readme: pkg.readme,
      author: {
        username: pkg.author_username,
      },
      latest_version: pkg.latest_version ? {
        version: pkg.latest_version,
        published_at: pkg.latest_version_published_at,
        file_size: pkg.latest_version_file_size,
        downloads: pkg.latest_version_downloads,
        changelog: pkg.latest_version_changelog,
      } : null,
    };

    packagesWithFullContent.push(packageExport);
  }

  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Successfully extracted: ${successCount}`);
  console.log(`  ⚠️  Fallback to snippet: ${failCount}`);
  console.log(`  📦 Total packages: ${packagesWithFullContent.length}`);

  return packagesWithFullContent;
}

/**
 * Export collections
 */
async function exportCollections(server: any) {
  console.log('\n📚 Exporting collections...\n');

  const result = await query<any>(
    server,
    `SELECT
      name_slug, name_display, description, category, tags,
      package_count, downloads, stars, verified, featured,
      readme, created_at, updated_at
    FROM collections
    ORDER BY downloads DESC`
  );

  console.log(`Found ${result.rows.length} collections\n`);

  return result.rows;
}

/**
 * Upload data to S3
 */
async function uploadToS3(key: string, data: any) {
  console.log(`\n☁️  Uploading to S3: s3://${S3_SEO_BUCKET}/${key}`);

  const jsonData = JSON.stringify(data, null, 2);
  const sizeInMB = (jsonData.length / 1024 / 1024).toFixed(2);

  console.log(`  Size: ${sizeInMB} MB`);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_SEO_BUCKET,
      Key: key,
      Body: jsonData,
      ContentType: 'application/json',
      CacheControl: 'public, max-age=3600', // Cache for 1 hour
    })
  );

  console.log(`  ✅ Upload complete`);
}

/**
 * Main export function
 */
async function main() {
  console.log('=====================================');
  console.log('   SEO Data Export with Full Content');
  console.log('=====================================');

  // Create Fastify server (needed for database queries)
  const server = await createFastifyServer();

  try {
    // Export packages with full content
    const packages = await exportPackages(server);
    await uploadToS3(S3_SEO_KEY_PACKAGES, packages);

    // Export collections
    const collections = await exportCollections(server);
    await uploadToS3(S3_SEO_KEY_COLLECTIONS, collections);

    console.log('\n=====================================');
    console.log('✅ SEO Data Export Complete!');
    console.log('=====================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  } finally {
    await server.close();
  }
}

main();
