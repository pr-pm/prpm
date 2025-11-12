/**
 * AI Search command - AI-powered semantic search (PRPM+ feature)
 */

import { Command } from 'commander';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { telemetry } from '../core/telemetry';
import { CLIError } from '../core/errors';

interface AISearchResult {
  package_id: string;
  name: string;
  description: string | null;
  similarity_score: number;
  quality_score_normalized: number;
  popularity_score_normalized: number;
  final_score: number;
  ai_use_case_description: string | null;
  ai_best_for: string | null;
  ai_similar_to: string[];
  total_downloads: number;
  format: string;
  subtype: string;
}

interface AISearchResponse {
  results: AISearchResult[];
  total_matches: number;
  execution_time_ms: number;
  query: string;
}

/**
 * Display AI search results with match scores
 */
function displayAIResults(response: AISearchResponse): void {
  const { results, total_matches, execution_time_ms, query } = response;

  console.log('\n' + '═'.repeat(80));
  console.log(`✨ AI Search Results for "${query}"`);
  console.log(`   ${total_matches} matches found in ${execution_time_ms}ms`);
  console.log('═'.repeat(80) + '\n');

  results.forEach((result, idx) => {
    const matchPercent = Math.round(result.similarity_score * 100);
    const matchColor = matchPercent >= 80 ? '\x1b[32m' : matchPercent >= 60 ? '\x1b[33m' : '\x1b[36m';
    const downloads = result.total_downloads >= 1000
      ? `${(result.total_downloads / 1000).toFixed(1)}k`
      : result.total_downloads;

    console.log(`\x1b[1m${idx + 1}. ${result.name}\x1b[0m ${matchColor}${matchPercent}% match\x1b[0m`);

    if (result.ai_use_case_description) {
      console.log(`   💡 ${result.ai_use_case_description}`);
    } else if (result.description) {
      console.log(`   ${result.description}`);
    }

    if (result.ai_best_for) {
      console.log(`   ✨ Best for: ${result.ai_best_for}`);
    }

    console.log(`   📦 ${result.format} ${result.subtype} | 📥 ${downloads} downloads`);

    if (result.ai_similar_to && result.ai_similar_to.length > 0) {
      console.log(`   🔗 Similar to: ${result.ai_similar_to.slice(0, 3).join(', ')}`);
    }

    console.log();
  });

  console.log('═'.repeat(80));
}

/**
 * Display PRPM+ upgrade prompt
 */
function displayUpgradePrompt(): void {
  console.log('\n' + '╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('║' + '  ✨ AI-Powered Search requires PRPM+'.padEnd(78) + '║');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('║' + '  Semantic search understands what you\'re trying to build:'.padEnd(78) + '║');
  console.log('║' + '    • Natural language queries'.padEnd(78) + '║');
  console.log('║' + '    • Intent-based matching'.padEnd(78) + '║');
  console.log('║' + '    • AI-enriched package descriptions'.padEnd(78) + '║');
  console.log('║' + '    • Similar package recommendations'.padEnd(78) + '║');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('║' + '  🎁 14-day free trial | $19/month'.padEnd(78) + '║');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('║' + '  Upgrade: https://prpm.dev/pricing'.padEnd(78) + '║');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('╚' + '═'.repeat(78) + '╝\n');
}

export async function handleAISearch(
  query: string,
  options: { limit?: number; format?: string; subtype?: string }
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;
  let response: AISearchResponse | null = null;

  try {
    if (!query || query.trim().length === 0) {
      console.log('❌ Please provide a search query');
      console.log('\n💡 Examples:');
      console.log('   prpm ai-search "build a REST API with authentication"');
      console.log('   prpm ai-search "Python testing best practices"');
      console.log('   prpm ai-search "React component architecture patterns"');
      console.log('   prpm ai-search "setting up CI/CD pipeline"');
      return;
    }

    console.log(`✨ AI searching for "${query}"...`);

    const config = await getConfig();
    const client = getRegistryClient(config);

    // Check if user is authenticated
    if (!config.token) {
      console.log('\n❌ Authentication required for AI search');
      console.log('   Please login first: \x1b[36mprpm login\x1b[0m\n');
      displayUpgradePrompt();
      throw new CLIError('Authentication required', 1);
    }

    // Build search request
    const searchRequest: any = {
      query,
      limit: options.limit || 10,
    };

    if (options.format || options.subtype) {
      searchRequest.filters = {};
      if (options.format) searchRequest.filters.format = options.format;
      if (options.subtype) searchRequest.filters.subtype = options.subtype;
    }

    // Call AI search endpoint
    const registryUrl = config.registryUrl || 'https://registry.prpm.dev';
    const res = await fetch(`${registryUrl}/api/v1/ai-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`,
      },
      body: JSON.stringify(searchRequest),
    });

    if (res.status === 401) {
      console.log('\n❌ Authentication failed');
      console.log('   Please login again: \x1b[36mprpm login\x1b[0m\n');
      displayUpgradePrompt();
      throw new CLIError('Authentication failed', 1);
    }

    if (res.status === 403) {
      // User doesn't have PRPM+ access
      const errorData = await res.json().catch(() => ({}));
      console.log('\n❌ AI search requires PRPM+ subscription');

      if (errorData.upgrade_info?.trial_available) {
        console.log('   🎁 Start your 14-day free trial today!');
      }

      displayUpgradePrompt();
      throw new CLIError('PRPM+ subscription required', 1);
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      throw new Error(`API error ${res.status}: ${errorText}`);
    }

    response = await res.json();

    if (!response || response.results.length === 0) {
      console.log('\n❌ No packages found for your query');
      console.log('\nTry:');
      console.log('  - Rephrasing your query');
      console.log('  - Being more specific about your use case');
      console.log('  - Using traditional search: \x1b[36mprpm search <query>\x1b[0m');
      return;
    }

    // Display results
    displayAIResults(response);

    console.log('\n💡 \x1b[1mQuick Actions:\x1b[0m');
    console.log('   Install: \x1b[36mprpm install <package-name>\x1b[0m');
    console.log('   More info: \x1b[36mprpm info <package-name>\x1b[0m');
    console.log('   View in browser: \x1b[36mhttps://prpm.dev/search\x1b[0m\n');

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);

    if (!error.includes('Authentication') && !error.includes('subscription')) {
      console.error(`\n❌ AI search failed: ${error}`);
      console.log('\n💡 Tip: Try traditional search instead:');
      console.log(`   \x1b[36mprpm search ${query}\x1b[0m\n`);
    }

    throw new CLIError(error, 1);
  } finally {
    await telemetry.track({
      command: 'ai-search',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        query: query.substring(0, 100),
        format: options.format,
        subtype: options.subtype,
        resultCount: success && response ? response.results.length : 0,
        executionTime: response?.execution_time_ms,
      },
    });

    await telemetry.shutdown();
  }
}

export function createAISearchCommand(): Command {
  const command = new Command('ai-search');

  command
    .description('AI-powered semantic search (PRPM+ feature)')
    .argument('<query>', 'Natural language search query')
    .option('--limit <number>', 'Number of results to return (default: 10)', '10')
    .option('--format <format>', 'Filter by package format (cursor, claude, continue, etc.)')
    .option('--subtype <subtype>', 'Filter by package subtype (rule, agent, skill, etc.)')
    .action(async (query: string, options: { limit?: string; format?: string; subtype?: string }) => {
      const limit = options.limit ? parseInt(options.limit, 10) : 10;

      await handleAISearch(query, { limit, format: options.format, subtype: options.subtype });
    });

  return command;
}
