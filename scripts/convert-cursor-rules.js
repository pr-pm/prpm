#!/usr/bin/env node

/**
 * Convert cursor rules from docs/scraped-data/ to PRPM package format
 *
 * Transforms cursor rules with `content` field into proper PRPM packages
 * with type: "rule" and saves to root directory for seeding
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const sourceFiles = [
  'docs/scraped-data/scraped-cursor-directory-enhanced.json',
  'docs/scraped-data/scraped-cursor-official-rules.json',
  'docs/scraped-data/scraped-patrickjs-cursorrules.json',
  'docs/scraped-data/scraped-jhonma82-cursorrules.json',
  'docs/scraped-data/scraped-flyeric-cursorrules.json',
  'docs/scraped-data/scraped-blefnk-cursorrules.json',
  'docs/scraped-data/scraped-ivangrynenko-cursorrules.json',
];

function convertToPackage(rule, sourceFile) {
  const author = (rule.author || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);

  const packageName = (rule.name || 'unnamed')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);

  const id = `@${author}/${packageName}`;

  return {
    id,
    display_name: rule.name || 'Unnamed Rule',
    description: rule.description || `Cursor rule for ${rule.name || 'development'}`,
    type: 'rule', // Changed from 'cursor' to 'rule'
    category: rule.category || 'development',
    subcategory: rule.subcategory,
    tags: rule.tags || [],
    keywords: rule.keywords || [],
    content: rule.content, // The actual cursor rule content
    author_id: `@${author}`,
    author_name: rule.author || 'Unknown',
    source_url: rule.sourceUrl || rule.source_url,
    official: false,
    verified_author: rule.verified || false,
    version: '1.0.0',
    license: 'MIT',
    visibility: 'public',
    quality_score: calculateQualityScore(rule),
  };
}

function calculateQualityScore(rule) {
  let score = 50;

  if (rule.content && rule.content.length > 500) score += 20;
  else if (rule.content && rule.content.length > 200) score += 10;

  if (rule.description) score += 10;
  if (rule.tags && rule.tags.length > 2) score += 10;
  if (rule.verified) score += 10;

  return Math.min(score, 100);
}

console.log('🔄 Converting cursor rules to PRPM package format\n');

let allPackages = [];
let totalConverted = 0;

for (const file of sourceFiles) {
  try {
    console.log(`📖 Reading ${file}...`);
    const data = JSON.parse(readFileSync(file, 'utf-8'));
    const rules = Array.isArray(data) ? data : [data];

    console.log(`   Found ${rules.length} rules`);

    const packages = rules
      .filter(rule => rule.content) // Only include rules with actual content
      .map(rule => convertToPackage(rule, file));

    console.log(`   ✅ Converted ${packages.length} packages (${rules.length - packages.length} skipped - no content)`);

    allPackages.push(...packages);
    totalConverted += packages.length;
  } catch (error) {
    console.error(`   ❌ Error processing ${file}:`, error.message);
  }
}

// Save to root directory
const outputFile = 'converted-cursor-rules-all.json';
writeFileSync(outputFile, JSON.stringify(allPackages, null, 2));

console.log(`\n✅ Conversion complete!`);
console.log(`   Total packages: ${totalConverted}`);
console.log(`   Output: ${outputFile}`);
console.log(`\n📝 Next steps:`);
console.log(`   1. Add '${outputFile}' to seed-packages.ts scrapedFiles array`);
console.log(`   2. Run: cd packages/registry && npx tsx scripts/seed-packages.ts`);
