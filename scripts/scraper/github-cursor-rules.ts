/**
 * GitHub Cursor Rules Scraper
 * Scrapes popular cursor rules repositories to bootstrap the registry
 */

import { Octokit } from '@octokit/rest';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

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

/**
 * Known cursor rules sources
 */
const CURSOR_RULES_SOURCES = [
  { org: 'PatrickJS', repo: 'awesome-cursorrules' },
  { org: 'pontusab', repo: 'cursor-directory' },
  // Add more as discovered
];

/**
 * Search GitHub for cursor rules
 */
async function searchCursorRules(): Promise<any[]> {
  const queries = [
    '.cursorrules',
    'cursor rules',
    'cursor ai rules',
    'cursor prompts',
  ];

  const results: any[] = [];

  for (const query of queries) {
    try {
      const response = await octokit.search.repos({
        q: query,
        sort: 'stars',
        order: 'desc',
        per_page: 50,
      });

      results.push(...response.data.items);
      console.log(`Found ${response.data.items.length} repos for "${query}"`);

      // Rate limit: wait 2 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error searching for "${query}":`, error);
    }
  }

  // Deduplicate by repo full name
  const unique = Array.from(
    new Map(results.map(item => [item.full_name, item])).values()
  );

  return unique;
}

/**
 * Extract cursor rules from a repository
 */
async function extractRulesFromRepo(owner: string, repo: string): Promise<ScrapedPackage[]> {
  const packages: ScrapedPackage[] = [];

  try {
    // Get repository info
    const repoInfo = await octokit.repos.get({ owner, repo });

    // Search for .cursorrules files or rules/ directory
    const searchResults = await octokit.search.code({
      q: `filename:.cursorrules repo:${owner}/${repo}`,
      per_page: 100,
    });

    for (const file of searchResults.data.items) {
      try {
        // Get file content
        const content = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path,
        });

        if ('content' in content.data) {
          const decoded = Buffer.from(content.data.content, 'base64').toString('utf-8');

          // Extract name from path
          const fileName = file.path.split('/').pop()?.replace('.cursorrules', '') || 'unknown';
          const packageName = `${fileName}-${owner}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');

          // Extract tags from content (look for common tech mentions)
          const tags = extractTags(decoded, fileName);

          packages.push({
            name: packageName,
            description: repoInfo.data.description || `Cursor rules from ${owner}/${repo}`,
            content: decoded,
            githubUrl: `https://github.com/${owner}/${repo}`,
            author: owner,
            stars: repoInfo.data.stargazers_count,
            lastUpdate: repoInfo.data.updated_at,
            tags,
          });

          console.log(`  ✓ Extracted ${packageName}`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to extract ${file.path}:`, error);
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error(`Failed to process ${owner}/${repo}:`, error);
  }

  return packages;
}

/**
 * Extract relevant tags from content
 */
function extractTags(content: string, fileName: string): string[] {
  const tags: Set<string> = new Set();

  // Tech stack detection
  const techKeywords = {
    react: ['react', 'jsx', 'tsx'],
    nextjs: ['next.js', 'nextjs', 'next'],
    vue: ['vue', 'vuejs'],
    angular: ['angular'],
    typescript: ['typescript', 'ts'],
    javascript: ['javascript', 'js'],
    python: ['python', 'py'],
    nodejs: ['node.js', 'nodejs', 'node'],
    tailwind: ['tailwind', 'tailwindcss'],
    api: ['api', 'rest', 'graphql'],
  };

  const lowerContent = content.toLowerCase();
  const lowerFileName = fileName.toLowerCase();

  for (const [tag, keywords] of Object.entries(techKeywords)) {
    if (keywords.some(kw => lowerContent.includes(kw) || lowerFileName.includes(kw))) {
      tags.add(tag);
    }
  }

  // Add generic tags based on content length and structure
  if (content.length > 5000) tags.add('comprehensive');
  if (content.includes('test') || content.includes('testing')) tags.add('testing');
  if (content.includes('example')) tags.add('examples');

  return Array.from(tags);
}

/**
 * Main scraper function
 */
async function main() {
  console.log('🕷️  Starting cursor rules scraper...\n');

  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable required');
    process.exit(1);
  }

  // Create output directory
  const outputDir = join(process.cwd(), 'scripts', 'scraped');
  await mkdir(outputDir, { recursive: true });

  // Search for repos
  console.log('🔍 Searching GitHub for cursor rules repositories...');
  const repos = await searchCursorRules();
  console.log(`\nFound ${repos.length} unique repositories\n`);

  // Extract rules from top repos (sorted by stars)
  const sortedRepos = repos
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 100); // Top 100 repos

  const allPackages: ScrapedPackage[] = [];

  for (const repo of sortedRepos) {
    console.log(`\n📦 Processing ${repo.full_name} (${repo.stargazers_count} ⭐)`);
    const [owner, repoName] = repo.full_name.split('/');
    const packages = await extractRulesFromRepo(owner, repoName);
    allPackages.push(...packages);

    // Rate limit: wait between repos
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Save results
  const outputPath = join(outputDir, 'cursor-rules.json');
  await writeFile(outputPath, JSON.stringify(allPackages, null, 2));

  console.log(`\n✅ Scraping complete!`);
  console.log(`   Scraped ${allPackages.length} packages`);
  console.log(`   Saved to: ${outputPath}`);
  console.log(`\n📊 Stats:`);
  console.log(`   Top authors: ${[...new Set(allPackages.map(p => p.author))].slice(0, 10).join(', ')}`);
  console.log(`   Total stars: ${allPackages.reduce((sum, p) => sum + p.stars, 0)}`);
  console.log(`   Top tags: ${getTopTags(allPackages, 10).join(', ')}`);
}

function getTopTags(packages: ScrapedPackage[], count: number): string[] {
  const tagCounts: Record<string, number> = {};
  packages.forEach(p => p.tags.forEach(tag => {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  }));

  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([tag]) => tag);
}

// Run scraper
main().catch(console.error);
