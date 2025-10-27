/**
 * Package Quality Scoring Algorithm
 *
 * Calculates a quality score (0.00 - 5.00) for packages based on multiple factors.
 * This score determines search ranking and "best in class" designation.
 *
 * Scoring Factors:
 * 1. Content Quality (40%) - AI-evaluated prompt quality, documentation, examples
 * 2. Author Credibility (30%) - verification, history, reputation
 * 3. Engagement (20%) - downloads, stars, ratings
 * 4. Maintenance (10%) - recency, version count, updates
 */

import { FastifyInstance } from 'fastify';
import { query } from '../db/index.js';
import { evaluatePromptWithAI } from './ai-evaluator.js';

export interface QualityScoreFactors {
  // Content quality (0-2.0 points) - PROMPT FIRST
  promptContentQuality: number;    // 1.0 (actual prompt effectiveness)
  promptLength: number;            // 0.3 (substantial content)
  hasExamples: number;             // 0.2 (code examples/demonstrations)
  hasDocumentation: number;        // 0.2 (external docs)
  hasDescription: number;          // 0.1 (package description)
  descriptionQuality: number;      // 0.1 (description length/quality)
  hasRepository: number;           // 0.05 (source code)
  metadataQuality: number;         // 0.05 (tags, keywords, homepage)

  // Author credibility (0-1.5 points)
  isVerifiedAuthor: number;        // 0.5
  authorPackageCount: number;      // 0.3 (3+ packages)
  isOfficialPackage: number;       // 0.7

  // Engagement (0-1.0 points)
  downloadScore: number;           // 0.4 (logarithmic)
  starScore: number;               // 0.3 (if implemented)
  ratingScore: number;             // 0.3 (average rating)

  // Maintenance (0-0.5 points)
  recencyScore: number;            // 0.3 (last 30 days = max)
  versionCountScore: number;       // 0.2 (2+ versions)
}

export interface PackageQualityData {
  id: string;
  description?: string;
  documentation_url?: string;
  repository_url?: string;
  homepage_url?: string;
  keywords?: string[];
  tags?: string[];
  author_id: string;
  verified: boolean;
  official?: boolean;
  total_downloads: number;
  stars: number;
  rating_average?: number;
  rating_count: number;
  version_count: number;
  last_published_at?: Date;
  created_at: Date;

  // Prompt content fields
  content?: any; // Canonical format content
  readme?: string; // README content
  file_size?: number; // Tarball size as proxy for content
}

/**
 * Calculate quality score for a package
 */
export function calculateQualityScore(pkg: PackageQualityData): number {
  const factors: QualityScoreFactors = {
    // Content Quality (40% = 2.0 points) - PROMPT CONTENT FIRST
    promptContentQuality: scorePromptContent(pkg.content),           // 1.0 - THE MAIN FACTOR
    promptLength: scorePromptLength(pkg.content, pkg.readme),        // 0.3
    hasExamples: scoreExamples(pkg.content),                         // 0.2
    hasDocumentation: pkg.documentation_url ? 0.2 : 0,               // 0.2
    hasDescription: pkg.description && pkg.description.length > 20 ? 0.1 : 0,  // 0.1
    descriptionQuality: scoreDescriptionQuality(pkg.description),    // 0.1
    hasRepository: pkg.repository_url ? 0.05 : 0,                    // 0.05
    metadataQuality: scoreMetadata(pkg),                             // 0.05

    // Author Credibility (30% = 1.5 points)
    isVerifiedAuthor: pkg.verified ? 0.5 : 0,
    authorPackageCount: 0, // Calculated separately
    isOfficialPackage: pkg.official ? 0.7 : 0,

    // Engagement (20% = 1.0 points)
    downloadScore: scoreDownloads(pkg.total_downloads),
    starScore: scoreStars(pkg.stars),
    ratingScore: scoreRating(pkg.rating_average, pkg.rating_count),

    // Maintenance (10% = 0.5 points)
    recencyScore: scoreRecency(pkg.last_published_at || pkg.created_at),
    versionCountScore: scoreVersionCount(pkg.version_count),
  };

  // Sum all factors
  const totalScore = Object.values(factors).reduce((sum, val) => sum + val, 0);

  // Return clamped to 0-5 range with 2 decimal precision
  return Math.min(5.0, Math.max(0, Math.round(totalScore * 100) / 100));
}

/**
 * Calculate quality score for a package with AI evaluation (async)
 * Uses Claude API to evaluate prompt content quality
 */
export async function calculateQualityScoreWithAI(
  pkg: PackageQualityData,
  server: FastifyInstance
): Promise<number> {
  // Get AI evaluation score for prompt content (0.0 - 1.0, maps to max 1.0 points)
  const aiScore = await evaluatePromptWithAI(pkg.content, server);

  const factors: QualityScoreFactors = {
    // Content Quality (40% = 2.0 points) - AI-POWERED PROMPT EVALUATION
    promptContentQuality: aiScore,                                   // 1.0 - AI-EVALUATED
    promptLength: scorePromptLength(pkg.content, pkg.readme),        // 0.3
    hasExamples: scoreExamples(pkg.content),                         // 0.2
    hasDocumentation: pkg.documentation_url ? 0.2 : 0,               // 0.2
    hasDescription: pkg.description && pkg.description.length > 20 ? 0.1 : 0,  // 0.1
    descriptionQuality: scoreDescriptionQuality(pkg.description),    // 0.1
    hasRepository: pkg.repository_url ? 0.05 : 0,                    // 0.05
    metadataQuality: scoreMetadata(pkg),                             // 0.05

    // Author Credibility (30% = 1.5 points)
    isVerifiedAuthor: pkg.verified ? 0.5 : 0,
    authorPackageCount: 0, // Calculated separately
    isOfficialPackage: pkg.official ? 0.7 : 0,

    // Engagement (20% = 1.0 points)
    downloadScore: scoreDownloads(pkg.total_downloads),
    starScore: scoreStars(pkg.stars),
    ratingScore: scoreRating(pkg.rating_average, pkg.rating_count),

    // Maintenance (10% = 0.5 points)
    recencyScore: scoreRecency(pkg.last_published_at || pkg.created_at),
    versionCountScore: scoreVersionCount(pkg.version_count),
  };

  // Sum all factors
  const totalScore = Object.values(factors).reduce((sum, val) => sum + val, 0);

  // Return clamped to 0-5 range with 2 decimal precision
  return Math.min(5.0, Math.max(0, Math.round(totalScore * 100) / 100));
}

/**
 * Score prompt content quality (0-1.0 points) - THE MOST IMPORTANT FACTOR
 * Analyzes the actual prompt/rule/skill content for depth and usefulness
 */
function scorePromptContent(content?: any): number {
  if (!content) return 0;

  let score = 0;

  try {
    // For canonical format
    if (content.sections && Array.isArray(content.sections)) {
      const sections = content.sections;

      // Has multiple sections (shows structure and thought)
      if (sections.length >= 5) score += 0.3;
      else if (sections.length >= 3) score += 0.2;
      else if (sections.length >= 1) score += 0.1;

      // Check for different section types (shows comprehensiveness)
      const sectionTypes = new Set(sections.map((s: any) => s.type));
      if (sectionTypes.size >= 4) score += 0.2;  // 4+ different types
      else if (sectionTypes.size >= 2) score += 0.1;

      // Check total content length across all sections
      let totalContentLength = 0;
      sections.forEach((section: any) => {
        if (section.content) totalContentLength += section.content.length;
        if (section.items) totalContentLength += JSON.stringify(section.items).length;
        if (section.rules) totalContentLength += JSON.stringify(section.rules).length;
        if (section.examples) totalContentLength += JSON.stringify(section.examples).length;
      });

      // Substantial content
      if (totalContentLength >= 2000) score += 0.3;  // Very detailed
      else if (totalContentLength >= 1000) score += 0.2;  // Good depth
      else if (totalContentLength >= 500) score += 0.1;   // Basic depth
      else if (totalContentLength >= 200) score += 0.05;  // Minimal

      // Has instructions/rules section (core value)
      const hasInstructions = sections.some((s: any) =>
        s.type === 'instructions' || s.type === 'rules' || s.type === 'guidelines'
      );
      if (hasInstructions) score += 0.2;

    } else if (typeof content === 'string') {
      // For raw string content (fallback)
      if (content.length >= 2000) score += 0.5;
      else if (content.length >= 1000) score += 0.3;
      else if (content.length >= 500) score += 0.2;
      else if (content.length >= 200) score += 0.1;
    }

  } catch (error) {
    // If content parsing fails, give minimal score
    return 0.1;
  }

  return Math.min(1.0, score);
}

/**
 * Score prompt length and substance (0-0.3 points)
 * Checks both structured content and README
 */
function scorePromptLength(content?: any, readme?: string): number {
  let totalLength = 0;

  // Content length
  if (content) {
    if (typeof content === 'string') {
      totalLength += content.length;
    } else if (content.sections) {
      totalLength += JSON.stringify(content).length;
    }
  }

  // README length (additional documentation)
  if (readme) {
    totalLength += readme.length;
  }

  // Score based on combined length
  if (totalLength >= 5000) return 0.3;  // Very comprehensive
  if (totalLength >= 3000) return 0.25;
  if (totalLength >= 2000) return 0.2;
  if (totalLength >= 1000) return 0.15;
  if (totalLength >= 500) return 0.1;
  if (totalLength >= 200) return 0.05;
  return 0;
}

/**
 * Score examples in content (0-0.2 points)
 * Code examples and demonstrations are crucial for understanding
 */
function scoreExamples(content?: any): number {
  if (!content || !content.sections) return 0;

  try {
    const sections = content.sections;

    // Look for examples section
    const examplesSection = sections.find((s: any) => s.type === 'examples');
    if (examplesSection && examplesSection.examples) {
      const exampleCount = Array.isArray(examplesSection.examples)
        ? examplesSection.examples.length
        : 0;

      if (exampleCount >= 5) return 0.2;   // Excellent examples
      if (exampleCount >= 3) return 0.15;  // Good examples
      if (exampleCount >= 1) return 0.1;   // Has examples
    }

    // Check for code blocks in content
    const hasCodeBlocks = sections.some((s: any) => {
      const content = JSON.stringify(s);
      return content.includes('```') || content.includes('<code>');
    });

    if (hasCodeBlocks) return 0.1;

  } catch (error) {
    return 0;
  }

  return 0;
}

/**
 * Score description quality (0-0.1 points)
 * Package description should be concise but informative
 */
function scoreDescriptionQuality(description?: string): number {
  if (!description) return 0;

  const length = description.length;
  if (length >= 100 && length <= 300) return 0.1;  // Perfect length
  if (length >= 50 && length < 100) return 0.07;
  if (length > 300 && length <= 500) return 0.07;
  if (length > 20) return 0.03;
  return 0;
}

/**
 * Score metadata (0-0.05 points)
 * Tags, keywords, homepage - nice to have but not critical
 */
function scoreMetadata(pkg: PackageQualityData): number {
  let score = 0;

  if (pkg.tags && pkg.tags.length >= 3) score += 0.02;
  else if (pkg.tags && pkg.tags.length >= 1) score += 0.01;

  if (pkg.keywords && pkg.keywords.length >= 3) score += 0.02;
  else if (pkg.keywords && pkg.keywords.length > 0) score += 0.01;

  if (pkg.homepage_url) score += 0.01;

  return Math.min(0.05, score);
}


/**
 * Score downloads (0-0.4 points)
 * Logarithmic scale to prevent runaway leaders while rewarding popularity
 */
function scoreDownloads(downloads: number): number {
  if (downloads === 0) return 0;
  if (downloads < 5) return 0.05;
  if (downloads < 10) return 0.1;
  if (downloads < 25) return 0.15;
  if (downloads < 50) return 0.2;
  if (downloads < 100) return 0.25;
  if (downloads < 200) return 0.3;
  if (downloads < 500) return 0.35;
  return 0.4; // 500+ downloads
}

/**
 * Score stars (0-0.3 points)
 */
function scoreStars(stars: number): number {
  if (stars === 0) return 0;
  if (stars < 5) return 0.1;
  if (stars < 20) return 0.2;
  return 0.3; // 20+ stars
}

/**
 * Score rating (0-0.3 points)
 * Requires minimum number of ratings to be credible
 */
function scoreRating(average?: number, count?: number): number {
  if (!average || !count || count < 3) return 0;

  // Normalize to 0-0.3 scale (5.0 rating = 0.3 points)
  return (average / 5.0) * 0.3;
}

/**
 * Score recency (0-0.3 points)
 * Last 30 days = max score, degrades over time
 */
function scoreRecency(lastPublished: Date): number {
  const now = new Date();
  const daysSince = (now.getTime() - lastPublished.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSince <= 30) return 0.3;
  if (daysSince <= 90) return 0.2;
  if (daysSince <= 180) return 0.1;
  return 0.05; // Still maintained but old
}

/**
 * Score version count (0-0.2 points)
 * Shows active maintenance
 */
function scoreVersionCount(count: number): number {
  if (count === 1) return 0;
  if (count === 2) return 0.1;
  return 0.2; // 3+ versions
}

/**
 * Calculate author package count bonus
 */
async function getAuthorPackageCount(server: FastifyInstance, authorId: string): Promise<number> {
  const result = await query<{ count: number }>(
    server,
    'SELECT COUNT(*) as count FROM packages WHERE author_id = $1 AND visibility = $2',
    [authorId, 'public']
  );

  const count = result.rows[0]?.count || 0;

  if (count < 2) return 0;
  if (count < 5) return 0.15;
  return 0.3; // 5+ packages
}

/**
 * Update quality score for a single package
 */
export async function updatePackageQualityScore(
  server: FastifyInstance,
  packageId: string
): Promise<number> {
  server.log.info({ packageId }, '🎯 Starting quality score calculation');

  // Fetch package data with content fields for prompt analysis
  const pkgResult = await query<PackageQualityData>(
    server,
    `SELECT
      id, description, documentation_url, repository_url,
      homepage_url, keywords, tags, author_id, verified, official,
      total_downloads, stars, rating_average, rating_count, version_count,
      last_published_at, created_at,
      content, readme, file_size
     FROM packages
     WHERE id = $1`,
    [packageId]
  );

  if (pkgResult.rows.length === 0) {
    throw new Error(`Package not found: ${packageId}`);
  }

  const pkg = pkgResult.rows[0];

  server.log.info({
    packageId,
    type: 'metadata',
    verified: pkg.verified,
    official: pkg.official,
    downloads: pkg.total_downloads,
    stars: pkg.stars,
    versions: pkg.version_count
  }, '📋 Package metadata retrieved');

  // Calculate base score with AI evaluation
  const startTime = Date.now();
  let score = await calculateQualityScoreWithAI(pkg, server);
  const calculationTime = Date.now() - startTime;

  server.log.info({
    packageId,
    baseScore: score.toFixed(2),
    calculationTime
  }, '📊 Base score calculated');

  // Add author package count bonus
  const authorBonus = await getAuthorPackageCount(server, pkg.author_id);
  if (authorBonus > 0) {
    server.log.info({
      packageId,
      authorId: pkg.author_id,
      authorBonus: authorBonus.toFixed(2)
    }, '👤 Author bonus applied');
  }
  score += authorBonus;

  // Clamp to 0-5 range
  score = Math.min(5.0, Math.max(0, Math.round(score * 100) / 100));

  // Update in database
  await query(
    server,
    'UPDATE packages SET quality_score = $1 WHERE id = $2',
    [score, packageId]
  );

  server.log.info({
    packageId,
    finalScore: score,
    scoreBreakdown: {
      base: (score - authorBonus).toFixed(2),
      authorBonus: authorBonus.toFixed(2),
      total: score.toFixed(2)
    },
    totalTime: Date.now() - startTime
  }, `✅ Quality score updated: ${score.toFixed(2)}/5.00`);

  return score;
}

/**
 * Batch update quality scores for all packages
 */
export async function updateAllQualityScores(
  server: FastifyInstance,
  options: {
    batchSize?: number;
    type?: string;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<{ updated: number; failed: number }> {
  const { batchSize = 100, type, onProgress } = options;

  // Get all package IDs
  const query_text = type
    ? 'SELECT id FROM packages WHERE format = $1 ORDER BY created_at DESC'
    : 'SELECT id FROM packages ORDER BY created_at DESC';

  const params = type ? [type] : [];
  const result = await query<{ id: string }>(server, query_text, params);

  const packageIds = result.rows.map(row => row.id);
  const total = packageIds.length;
  let updated = 0;
  let failed = 0;

  server.log.info({ total, type }, 'Starting quality score update for all packages');

  // Process in batches
  for (let i = 0; i < packageIds.length; i += batchSize) {
    const batch = packageIds.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (pkgId) => {
        try {
          await updatePackageQualityScore(server, pkgId);
          updated++;
        } catch (error) {
          server.log.error({ error, packageId: pkgId }, 'Failed to update quality score');
          failed++;
        }
      })
    );

    if (onProgress) {
      onProgress(updated + failed, total);
    }

    // Small delay between batches to avoid overwhelming the DB
    if (i + batchSize < packageIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  server.log.info({ updated, failed, total }, 'Completed quality score update');

  return { updated, failed };
}

/**
 * Get quality score breakdown for debugging
 */
export async function getQualityScoreBreakdown(
  server: FastifyInstance,
  packageId: string
): Promise<{ score: number; factors: QualityScoreFactors }> {
  const pkgResult = await query<PackageQualityData>(
    server,
    `SELECT
      id, description, documentation_url, repository_url,
      homepage_url, keywords, tags, author_id, verified, official,
      total_downloads, stars, rating_average, rating_count, version_count,
      last_published_at, created_at,
      content, readme, file_size
     FROM packages
     WHERE id = $1`,
    [packageId]
  );

  if (pkgResult.rows.length === 0) {
    throw new Error(`Package not found: ${packageId}`);
  }

  const pkg = pkgResult.rows[0];

  // Get AI evaluation score
  const aiScore = await evaluatePromptWithAI(pkg.content, server);

  // Calculate factors using AI-powered approach
  const authorBonus = await getAuthorPackageCount(server, pkg.author_id);

  const factors: QualityScoreFactors = {
    // Content Quality (40% = 2.0 points) - AI-POWERED
    promptContentQuality: aiScore,
    promptLength: scorePromptLength(pkg.content, pkg.readme),
    hasExamples: scoreExamples(pkg.content),
    hasDocumentation: pkg.documentation_url ? 0.2 : 0,
    hasDescription: pkg.description && pkg.description.length > 20 ? 0.1 : 0,
    descriptionQuality: scoreDescriptionQuality(pkg.description),
    hasRepository: pkg.repository_url ? 0.05 : 0,
    metadataQuality: scoreMetadata(pkg),

    // Author Credibility (30% = 1.5 points)
    isVerifiedAuthor: pkg.verified ? 0.5 : 0,
    authorPackageCount: authorBonus,
    isOfficialPackage: pkg.official ? 0.7 : 0,

    // Engagement (20% = 1.0 points)
    downloadScore: scoreDownloads(pkg.total_downloads),
    starScore: scoreStars(pkg.stars),
    ratingScore: scoreRating(pkg.rating_average, pkg.rating_count),

    // Maintenance (10% = 0.5 points)
    recencyScore: scoreRecency(pkg.last_published_at || pkg.created_at),
    versionCountScore: scoreVersionCount(pkg.version_count),
  };

  const score = Object.values(factors).reduce((sum, val) => sum + val, 0);

  return {
    score: Math.min(5.0, Math.max(0, Math.round(score * 100) / 100)),
    factors
  };
}
