#!/usr/bin/env tsx

/**
 * Seed new troubleshooting skills to the database
 * Run: npm run seed:skills
 */

import pg from "pg";
import { readFileSync } from "fs";
import { join } from "path";

const { Pool } = pg;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "prpm_registry",
  user: process.env.DB_USER || "prpm",
  password: process.env.DB_PASSWORD || "prpm_dev_password",
});

interface PackageData {
  id: string;
  display_name: string;
  description: string;
  version: string;
  type: string;
  category: string;
  tags: string[];
  keywords: string[];
  author_id: string;
  author_name: string;
  license: string;
  visibility: string;
  verified_author: boolean;
  official: boolean;
  content: string;
  content_url: string;
  repository_url: string;
  homepage_url: string;
  documentation_url: string;
  download_url: string;
  file_path: string;
  install_location: string;
  quality_score: number;
  metadata: Record<string, any>;
}

async function seedSkills() {
  const client = await pool.connect();

  try {
    console.log("🌱 Seeding new skills...");

    // Load skills data
    const skillsPath = join(__dirname, "seed", "new-skills.json");
    const skills: PackageData[] = JSON.parse(readFileSync(skillsPath, "utf-8"));

    console.log(`📦 Found ${skills.length} skills to seed`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const skill of skills) {
      try {
        // Check if package already exists
        const existing = await client.query(
          "SELECT id, version FROM packages WHERE id = $1",
          [skill.id]
        );

        if (existing.rows.length > 0) {
          console.log(`⚠️  Package ${skill.id} already exists, updating...`);

          await client.query(
            `UPDATE packages SET
              display_name = $2,
              description = $3,
              version = $4,
              type = $5,
              category = $6,
              tags = $7,
              keywords = $8,
              author_id = $9,
              author_name = $10,
              license = $11,
              visibility = $12,
              verified_author = $13,
              official = $14,
              content = $15,
              content_url = $16,
              repository_url = $17,
              homepage_url = $18,
              documentation_url = $19,
              download_url = $20,
              file_path = $21,
              install_location = $22,
              quality_score = $23,
              metadata = $24,
              updated_at = NOW()
            WHERE id = $1`,
            [
              skill.id,
              skill.display_name,
              skill.description,
              skill.version,
              skill.type,
              skill.category,
              skill.tags,
              skill.keywords,
              skill.author_id,
              skill.author_name,
              skill.license,
              skill.visibility,
              skill.verified_author,
              skill.official,
              skill.content,
              skill.content_url,
              skill.repository_url,
              skill.homepage_url,
              skill.documentation_url,
              skill.download_url,
              skill.file_path,
              skill.install_location,
              skill.quality_score,
              JSON.stringify(skill.metadata),
            ]
          );

          updated++;
        } else {
          await client.query(
            `INSERT INTO packages (
              id, display_name, description, version, type, category,
              tags, keywords, author_id, author_name, license, visibility,
              verified_author, official, content, content_url, repository_url,
              homepage_url, documentation_url, download_url, file_path,
              install_location, quality_score, metadata
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
              $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
            )`,
            [
              skill.id,
              skill.display_name,
              skill.description,
              skill.version,
              skill.type,
              skill.category,
              skill.tags,
              skill.keywords,
              skill.author_id,
              skill.author_name,
              skill.license,
              skill.visibility,
              skill.verified_author,
              skill.official,
              skill.content,
              skill.content_url,
              skill.repository_url,
              skill.homepage_url,
              skill.documentation_url,
              skill.download_url,
              skill.file_path,
              skill.install_location,
              skill.quality_score,
              JSON.stringify(skill.metadata),
            ]
          );

          console.log(`✅ Inserted: ${skill.id} - ${skill.display_name}`);
          inserted++;
        }
      } catch (error) {
        console.error(`❌ Failed to seed ${skill.id}:`, error);
        skipped++;
      }
    }

    console.log("\n📊 Summary:");
    console.log(`   ✅ Inserted: ${inserted}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ⚠️  Skipped: ${skipped}`);
    console.log(`   📦 Total: ${skills.length}`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedSkills();
