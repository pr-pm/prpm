/**
 * Search command - Search for packages across multiple registries
 */

import { Command } from 'commander';
import { getEnabledRegistries } from './registry';
import { Registry } from '../types';

interface SearchOptions {
  registry?: string;
  all?: boolean;
  tool?: string;
  tag?: string;
  role?: string;
  limit?: string;
}

interface SearchResult {
  name: string;
  version: string;
  description?: string;
  author?: string;
  downloads?: number;
  rating?: number;
  tags?: string[];
  tools?: string[];
  roles?: string[];
  registry: string;
}

export function createSearchCommand(): Command {
  const command = new Command('search');

  command
    .description('Search for packages across registries')
    .argument('<query>', 'Search query')
    .option('--registry <name>', 'Search specific registry only')
    .option('--all', 'Search all configured registries', false)
    .option('--tool <tool>', 'Filter by tool type (cursor, claude, etc.)')
    .option('--tag <tag>', 'Filter by tag')
    .option('--role <role>', 'Filter by role')
    .option('--limit <number>', 'Limit results per registry', '10')
    .action(async (query: string, options: SearchOptions) => {
      try {
        console.log(`\n🔍 Searching for: "${query}"\n`);

        const results = await searchRegistries(query, options);

        if (results.length === 0) {
          console.log('No results found.');
          console.log('\nTry:');
          console.log('  - Different keywords');
          console.log('  - Broader search terms');
          console.log('  - Adding more registries with: prmp registry add <url>\n');
          return;
        }

        displayResults(results);
      } catch (error) {
        if (error instanceof Error) {
          console.error(`\n❌ Search failed: ${error.message}\n`);
        } else {
          console.error('\n❌ Search failed with unknown error\n');
        }
        process.exit(1);
      }
    });

  return command;
}

/**
 * Search across multiple registries
 */
async function searchRegistries(
  query: string,
  options: SearchOptions
): Promise<SearchResult[]> {
  const registries = await getEnabledRegistries();
  const limit = parseInt(options.limit || '10');

  // Filter to specific registry if requested
  let targetRegistries = registries;
  if (options.registry) {
    targetRegistries = registries.filter((r) => r.name === options.registry);
    if (targetRegistries.length === 0) {
      throw new Error(`Registry "${options.registry}" not found`);
    }
  }

  // Search all registries in parallel
  console.log(`Searching ${targetRegistries.length} ${targetRegistries.length === 1 ? 'registry' : 'registries'}...`);

  const searchPromises = targetRegistries.map((registry) =>
    searchRegistry(registry, query, options, limit)
  );

  const resultsPerRegistry = await Promise.allSettled(searchPromises);

  // Aggregate results
  const allResults: SearchResult[] = [];

  resultsPerRegistry.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allResults.push(...result.value);
    } else {
      console.warn(`⚠️  ${targetRegistries[index].name} search failed: ${result.reason}`);
    }
  });

  // Sort by relevance (rating, downloads)
  allResults.sort((a, b) => {
    const scoreA = (a.rating || 0) * 10 + Math.log10((a.downloads || 0) + 1);
    const scoreB = (b.rating || 0) * 10 + Math.log10((b.downloads || 0) + 1);
    return scoreB - scoreA;
  });

  return allResults;
}

/**
 * Search a single registry
 */
async function searchRegistry(
  registry: Registry,
  query: string,
  options: SearchOptions,
  limit: number
): Promise<SearchResult[]> {
  // Build query params
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
  });

  if (options.tool) params.set('tool', options.tool);
  if (options.tag) params.set('tag', options.tag);
  if (options.role) params.set('role', options.role);

  const url = `${registry.url}/search?${params}`;

  // In a real implementation, this would use fetch
  // For now, return mock data for demonstration

  // const response = await fetch(url, {
  //   headers: registry.auth?.token
  //     ? { Authorization: `Bearer ${registry.auth.token}` }
  //     : {},
  // });
  //
  // if (!response.ok) {
  //   throw new Error(`Search failed: ${response.statusText}`);
  // }
  //
  // const data = await response.json();
  // return data.results.map((pkg: any) => ({
  //   ...pkg,
  //   registry: registry.name,
  // }));

  // Mock data for now
  console.log(`   Querying ${registry.name}...`);

  return []; // Empty results for now until registry server is deployed
}

/**
 * Display search results
 */
function displayResults(results: SearchResult[]): void {
  console.log(`Found ${results.length} ${results.length === 1 ? 'result' : 'results'}:\n`);

  // Group by registry
  const byRegistry = results.reduce((acc, result) => {
    if (!acc[result.registry]) {
      acc[result.registry] = [];
    }
    acc[result.registry].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  // Display grouped results
  Object.entries(byRegistry).forEach(([registryName, packages]) => {
    console.log(`📦 From: ${registryName} (${packages.length} ${packages.length === 1 ? 'result' : 'results'})\n`);

    packages.slice(0, 5).forEach((pkg, index) => {
      const rating = pkg.rating ? `⭐ ${pkg.rating.toFixed(1)}` : '';
      const downloads = pkg.downloads
        ? `📥 ${formatNumber(pkg.downloads)}`
        : '';
      const stats = [rating, downloads].filter(Boolean).join('  ');

      console.log(`${index + 1}. ${pkg.name}@${pkg.version} ${stats}`);
      if (pkg.description) {
        console.log(`   ${pkg.description}`);
      }
      if (pkg.tags && pkg.tags.length > 0) {
        console.log(`   Tags: ${pkg.tags.join(', ')}`);
      }
      console.log('');
    });
  });

  console.log('\nTo install a package:');
  console.log('  prmp install <package-name> [--registry <name>]\n');
}

/**
 * Format number with k/M suffix
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}
