#!/usr/bin/env tsx

/**
 * Seed new troubleshooting skills to the database
 * Run: npm run seed:skills
 */

import { config } from 'dotenv';
import { Pool } from 'pg';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createHash } from 'crypto';
import tar from 'tar';
import { tmpdir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from registry root
config({ path: join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://prpm:prpm@localhost:5434/prpm';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT !== 'https://s3.amazonaws.com' ? process.env.S3_ENDPOINT : undefined,
  credentials: process.env.S3_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      }
    : undefined,
});

interface ScrapedPackage {
  id?: string;
  name: string;
  description?: string;
  content?: string;
  author?: string;
  author_id?: string;
  tags?: string[];
  category?: string;
  type?: string;
  source_url?: string;
  version?: string;
  official?: boolean;
  verified?: boolean;
}

/**
 * Create tarball from content and upload to S3
 */
async function uploadPackageToS3(
  packageId: string,
  version: string,
  content: string,
  type: string
): Promise<{ url: string; hash: string; size: number }> {
  const tempDir = join(tmpdir(), `prpm-seed-${Date.now()}-${Math.random().toString(36).substring(7)}`);

  try {
    // Create temp directory
    mkdirSync(tempDir, { recursive: true });

    // Determine file extension based on type
    const ext = ['cursor', 'windsurf', 'continue'].includes(type) ? '.mdc' : '.md';
    const filename = `content${ext}`;
    const filePath = join(tempDir, filename);

    // Write content to file
    writeFileSync(filePath, content, 'utf-8');

    // Create tarball
    const tarballPath = join(tempDir, 'package.tar.gz');
    await tar.create(
      {
        gzip: true,
        file: tarballPath,
        cwd: tempDir,
      },
      [filename]
    );

    // Read tarball
    const tarballBuffer = readFileSync(tarballPath);
    const hash = createHash('sha256').update(tarballBuffer).digest('hex');

    // Upload to S3
    const key = `packages/${packageId}/${version}/package.tar.gz`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET || 'prpm-packages',
        Key: key,
        Body: tarballBuffer,
        ContentType: 'application/gzip',
        Metadata: {
          packageId,
          version,
          hash,
        },
      })
    );

    // Generate URL
    const bucket = process.env.S3_BUCKET || 'prpm-packages';
    const region = process.env.S3_REGION || 'us-east-1';
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return {
      url,
      hash,
      size: tarballBuffer.length,
    };
  } finally {
    // Clean up temp directory
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.warn(`  ⚠️  Failed to clean up temp directory: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

async function seedSkills() {
  try {
    console.log('🌱 Seeding new skills...');

    // Load skills data
    const skillsPath = join(__dirname, 'seed', 'new-skills.json');
    const skills: ScrapedPackage[] = JSON.parse(readFileSync(skillsPath, 'utf-8'));

    console.log(`📦 Found ${skills.length} skills to seed`);

    let totalPackages = 0;
    let totalAttempted = 0;
    let totalSkipped = 0;

    for (const pkg of skills) {
      totalAttempted++;
      try {
        // Determine package ID
        let packageId: string;

        // If pkg.id already looks like a proper namespaced package (starts with @scope/),
        // use it as-is
        if (pkg.id && pkg.id.startsWith('@') && pkg.id.includes('/')) {
          packageId = pkg.id;
        } else {
          // Extract author and create namespaced package ID
          // Format: @author/package-name
          let authorRaw = pkg.author_id || pkg.author || 'unknown';
          // Remove @ prefix if it exists
          if (authorRaw.startsWith('@')) {
            authorRaw = authorRaw.substring(1);
          }
          const author = authorRaw
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 50);

          const baseName = (pkg.id || pkg.name || `package-${totalPackages}`)
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 80);

          // Create namespaced ID: @author/package
          packageId = `@${author}/${baseName}`;
        }

        // Extract author from packageId for author_id field
        const author = packageId.split('/')[0].substring(1); // Remove @ and get scope

        // Map package type to valid database type
        // Valid types: 'cursor', 'claude', 'claude-skill', 'claude-agent', 'claude-slash-command', 'continue', 'windsurf', 'generic', 'mcp'
        let type = pkg.type || 'claude-skill';

        // Map 'skill' to 'claude-skill' for backwards compatibility
        if (type === 'skill') {
          type = 'claude-skill';
        }

        // Initialize tags array
        let tags = Array.isArray(pkg.tags) ? [...pkg.tags] : [];
        if (type === 'claude-skill' && !tags.includes('claude-skill')) {
          tags.push('claude-skill');
        }

        // Determine if package is official and verified
        const isOfficial = !!(pkg.official);
        const isVerified = !!(pkg.verified || pkg.official);

        // Create or get user for this author
        let authorUserId: string | null = null;
        try {
          const userResult = await pool.query(
            `INSERT INTO users (username, verified_author, created_at, updated_at)
             VALUES ($1, $2, NOW(), NOW())
             ON CONFLICT (username) DO UPDATE SET updated_at = NOW()
             RETURNING id`,
            [author, isVerified]
          );
          authorUserId = userResult.rows[0]?.id || null;
        } catch (err) {
          console.error(`  ⚠️  Failed to create/get user for author ${author}: ${err instanceof Error ? err.message : String(err)}`);
        }

        // Insert package
        const pkgResult = await pool.query(
          `INSERT INTO packages (
            name,
            description,
            author_id,
            type,
            category,
            tags,
            repository_url,
            visibility,
            verified,
            featured,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          ON CONFLICT (name) DO NOTHING
          RETURNING id`,
          [
            packageId,
            pkg.description || `${pkg.name} - AI prompt package`,
            authorUserId,
            type,
            pkg.category || 'general',
            tags,
            pkg.source_url || null,
            'public',
            isVerified,
            isOfficial,
          ]
        );

        // If package already exists, skip version insert
        if (pkgResult.rows.length === 0) {
          totalSkipped++;
          console.log(`  ⏭️  Skipped: ${packageId} (already exists)`);
          continue;
        }

        // Get the UUID package_id from the insert result
        const dbPackageId = pkgResult.rows[0].id;

        // Upload package content to S3
        const content = pkg.content || pkg.description || `# ${pkg.name}\n\n${pkg.description || 'No description'}`;
        const version = pkg.version || '1.0.0';
        let uploadResult;
        try {
          uploadResult = await uploadPackageToS3(packageId, version, content, type);
        } catch (err) {
          console.error(`  ⚠️  Failed to upload to S3 for ${packageId}: ${err instanceof Error ? err.message : String(err)}`);
          totalSkipped++;
          // Delete the package we just inserted since upload failed
          await pool.query('DELETE FROM packages WHERE id = $1', [dbPackageId]);
          continue;
        }

        // Insert initial version with S3 URL
        await pool.query(
          `INSERT INTO package_versions (
            package_id,
            version,
            tarball_url,
            content_hash,
            file_size,
            changelog,
            metadata,
            published_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          ON CONFLICT (package_id, version) DO NOTHING`,
          [
            dbPackageId,
            version,
            uploadResult.url,
            uploadResult.hash,
            uploadResult.size,
            'Initial version',
            JSON.stringify({
              sourceUrl: pkg.source_url || null,
              originalType: pkg.type,
            }),
          ]
        );

        // Update version_count for the package
        await pool.query(
          `UPDATE packages
           SET version_count = (SELECT COUNT(*) FROM package_versions WHERE package_id = $1)
           WHERE id = $1`,
          [dbPackageId]
        );

        console.log(`  ✅ Inserted: ${packageId}`);
        totalPackages++;
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`  ⚠️  Failed to insert package: ${error.message}`);
        totalSkipped++;
      }
    }

    console.log(`\n✅ Successfully seeded ${totalPackages} packages!`);
    console.log(`⏭️  Skipped ${totalSkipped} duplicates`);
    console.log(`📋 Total attempted: ${totalAttempted}`);
  } catch (error: unknown) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedSkills().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
