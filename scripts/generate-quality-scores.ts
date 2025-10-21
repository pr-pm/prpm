#!/usr/bin/env tsx
/**
 * Generate quality scores for all scraped packages
 * Applies systematic scoring methodology to ensure consistency
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface Package {
  id?: string;
  name?: string;
  display_name?: string;
  description?: string;
  content?: string;
  type?: string;
  tags?: string[];
  category?: string;
  author?: string;
  author_id?: string;
  official?: boolean;
  verified?: boolean;
  verified_author?: boolean;
  stars?: number;
  forks?: number;
  last_updated?: string;
  quality_score?: number;
  [key: string]: any;
}

/**
 * Calculate quality score based on methodology
 * Score range: 0.00 to 5.00
 */
function calculateQualityScore(pkg: Package): number {
  let score = 0;

  // ========================================
  // Content Quality (2.0 points max)
  // ========================================

  const description = pkg.description || '';
  const content = pkg.content || '';
  const combinedText = description + ' ' + content;
  const textLength = combinedText.length;

  // Clarity & Specificity (0.5 points)
  if (description === '---' || description === 'v.description,' || !description || description.trim().length < 10) {
    // Placeholder or broken description - major penalty
    score += 0.0;
  } else if (textLength > 200 && description.length > 50) {
    score += 0.5; // Good description
  } else if (textLength > 100) {
    score += 0.3; // Decent description
  } else {
    score += 0.1; // Minimal description
  }

  // Structure & Organization (0.5 points)
  const hasStructure = content.includes('#') || content.includes('##') || content.includes('###');
  const hasSections = content.includes('## ') || content.includes('### ');
  if (hasStructure && hasSections) {
    score += 0.5;
  } else if (hasStructure) {
    score += 0.3;
  } else if (textLength > 500) {
    score += 0.2; // Long content likely has some structure
  } else {
    score += 0.1;
  }

  // Examples & Patterns (0.5 points)
  const hasCodeBlocks = content.includes('```') || content.includes('    '); // Code blocks or indented code
  const hasExamples = content.toLowerCase().includes('example') ||
                     content.toLowerCase().includes('usage') ||
                     content.includes('✅') || content.includes('❌');
  if (hasCodeBlocks && hasExamples) {
    score += 0.5;
  } else if (hasCodeBlocks || hasExamples) {
    score += 0.3;
  } else {
    score += 0.1;
  }

  // Documentation Quality (0.3 points)
  const tags = pkg.tags || [];
  const hasGoodMetadata = tags.length >= 3 && description.length > 30;
  if (hasGoodMetadata && pkg.category) {
    score += 0.3;
  } else if (tags.length > 0 && description.length > 20) {
    score += 0.2;
  } else {
    score += 0.1;
  }

  // Length Appropriateness (0.2 points)
  if (textLength < 200) {
    score += 0.0; // Too short
  } else if (textLength >= 500 && textLength <= 10000) {
    score += 0.2; // Ideal range
  } else if (textLength >= 200 && textLength < 500) {
    score += 0.1; // Short but acceptable
  } else if (textLength > 10000 && textLength <= 50000) {
    score += 0.15; // Long but manageable
  } else {
    score += 0.1; // Very long, might be hard to use
  }

  // ========================================
  // Author Credibility (1.5 points max)
  // ========================================

  // Official Package (0.5 points)
  if (pkg.official === true) {
    score += 0.5;
  } else {
    score += 0.0;
  }

  // Verified Author (0.5 points)
  if (pkg.verified === true || pkg.verified_author === true) {
    score += 0.5;
  } else {
    score += 0.0;
  }

  // Community Trust (0.5 points) - based on stars
  const stars = pkg.stars || 0;
  if (stars > 10000) {
    score += 0.5;
  } else if (stars >= 1000) {
    score += 0.3;
  } else if (stars >= 100) {
    score += 0.2;
  } else {
    score += 0.1;
  }

  // ========================================
  // Engagement Potential (1.0 point max)
  // ========================================

  // Utility & Usefulness (0.4 points)
  const category = pkg.category || '';
  const type = pkg.type || '';

  // Higher utility for certain categories
  const highUtilityCategories = ['development', 'devops', 'testing', 'security', 'database'];
  const isHighUtility = highUtilityCategories.includes(category.toLowerCase());

  if (isHighUtility && textLength > 1000) {
    score += 0.4;
  } else if (isHighUtility || textLength > 800) {
    score += 0.3;
  } else if (textLength > 400) {
    score += 0.2;
  } else {
    score += 0.1;
  }

  // Completeness (0.3 points)
  const seemsComplete = content.length > 500 &&
                       (content.includes('```') || hasStructure) &&
                       description.length > 30;
  if (seemsComplete) {
    score += 0.3;
  } else if (content.length > 300 || description.length > 50) {
    score += 0.2;
  } else {
    score += 0.1;
  }

  // Novelty/Uniqueness (0.3 points)
  const name = pkg.display_name || pkg.name || pkg.id || '';
  const isMeta = tags.includes('meta') || name.toLowerCase().includes('creating') ||
                 name.toLowerCase().includes('writing');
  const isSpecialized = tags.length > 5 || category.length > 0;

  if (isMeta) {
    score += 0.3; // Meta packages are unique
  } else if (isSpecialized && textLength > 800) {
    score += 0.25;
  } else if (isSpecialized) {
    score += 0.2;
  } else {
    score += 0.15;
  }

  // ========================================
  // Maintenance (0.5 points max)
  // ========================================

  // Recent Updates (0.3 points)
  const lastUpdated = pkg.last_updated ? new Date(pkg.last_updated) : null;
  const now = new Date();
  const monthsAgo = lastUpdated ? (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24 * 30) : 999;

  if (monthsAgo < 3) {
    score += 0.3;
  } else if (monthsAgo < 6) {
    score += 0.2;
  } else if (monthsAgo < 12) {
    score += 0.1;
  } else {
    score += 0.05;
  }

  // Version Info (0.2 points)
  if (pkg.version && pkg.version !== '1.0.0') {
    score += 0.2; // Has been versioned beyond initial
  } else if (pkg.version) {
    score += 0.15; // Has version
  } else {
    score += 0.0;
  }

  // ========================================
  // Penalties and Bonuses
  // ========================================

  // Placeholder description penalty
  if (description === '---' || description === 'v.description,' || description.includes('undefined')) {
    score -= 1.0; // Heavy penalty
  }

  // Meta package bonus
  if (isMeta && textLength > 500) {
    score += 0.2;
  }

  // Round to 2 decimal places and clamp to 0-5 range
  score = Math.round(score * 100) / 100;
  score = Math.max(0.00, Math.min(5.00, score));

  return score;
}

/**
 * Normalize existing quality score if on 0-100 scale
 */
function normalizeQualityScore(existingScore: number | undefined): number | null {
  if (existingScore === undefined || existingScore === null) {
    return null;
  }

  // If score is > 5, assume it's on 0-100 scale
  if (existingScore > 5) {
    return Math.round((existingScore / 100) * 5 * 100) / 100; // Convert to 0-5 scale
  }

  return existingScore;
}

async function main() {
  const scrapedDir = join(__dirname, '..', 'data', 'scraped');
  const files = readdirSync(scrapedDir).filter(f => f.endsWith('.json'));

  console.log(`\n📊 Generating quality scores for ${files.length} files...\n`);

  let totalPackages = 0;
  let packagesScored = 0;
  let packagesNormalized = 0;
  let packagesSkipped = 0;

  for (const file of files) {
    const filePath = join(scrapedDir, file);

    try {
      console.log(`\n📦 Processing: ${file}`);

      const data = JSON.parse(readFileSync(filePath, 'utf-8'));
      const packages = Array.isArray(data) ? data : data.packages || [];

      if (packages.length === 0) {
        console.log(`  ⏭️  No packages found, skipping`);
        continue;
      }

      console.log(`  Found ${packages.length} packages`);
      totalPackages += packages.length;

      let fileScored = 0;
      let fileNormalized = 0;

      for (const pkg of packages) {
        const existingScore = pkg.quality_score;

        if (existingScore !== undefined && existingScore !== null) {
          // Normalize existing score
          const normalized = normalizeQualityScore(existingScore);
          if (normalized !== null && normalized !== existingScore) {
            pkg.quality_score = normalized;
            fileNormalized++;
            packagesNormalized++;
          }
        } else {
          // Calculate new score
          pkg.quality_score = calculateQualityScore(pkg);
          fileScored++;
          packagesScored++;
        }
      }

      // Write back to file
      writeFileSync(filePath, JSON.stringify(packages, null, 2) + '\n', 'utf-8');

      console.log(`  ✅ Scored: ${fileScored}, Normalized: ${fileNormalized}`);

    } catch (error) {
      console.error(`  ❌ Error processing ${file}:`, error instanceof Error ? error.message : String(error));
      packagesSkipped++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 Quality Scoring Summary:');
  console.log(`   📦 Total packages: ${totalPackages}`);
  console.log(`   ✅ Newly scored: ${packagesScored}`);
  console.log(`   🔄 Normalized: ${packagesNormalized}`);
  console.log(`   ⏭️  Skipped: ${packagesSkipped}`);
  console.log('='.repeat(80) + '\n');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
