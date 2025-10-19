#!/usr/bin/env node

/**
 * Scrape MCP servers from GitHub using GitHub API
 *
 * SETUP:
 * 1. Create a GitHub Personal Access Token (PAT):
 *    - Go to https://github.com/settings/tokens
 *    - Click "Generate new token (classic)"
 *    - Select scopes: public_repo, read:org
 *    - Copy the token
 *
 * 2. Set environment variable:
 *    export GITHUB_TOKEN=ghp_your_token_here
 *
 * 3. Run script:
 *    node scripts/scrape-mcp-github.js
 *
 * RATE LIMITS:
 * - Without token: 60 requests/hour
 * - With token: 5,000 requests/hour
 *
 * RESUME CAPABILITY:
 * - Script saves progress to scrape-checkpoint.json after each source
 * - If interrupted, re-run the same command to resume from checkpoint
 * - Checkpoint tracks: completed sources, current search page
 * - Automatically clears checkpoint on successful completion
 *
 * This will scrape:
 * - github.com/modelcontextprotocol/servers (official)
 * - github.com/TensorBlock/awesome-mcp-servers (7260+ servers)
 * - github.com/wong2/awesome-mcp-servers
 * - github.com/punkpeye/awesome-mcp-servers
 * - Search GitHub for "mcp server" repos
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { Octokit } from '@octokit/rest';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN environment variable not set!');
  console.log('\n📝 To get a GitHub token:');
  console.log('   1. Go to https://github.com/settings/tokens');
  console.log('   2. Click "Generate new token (classic)"');
  console.log('   3. Select scopes: public_repo, read:org');
  console.log('   4. Copy the token');
  console.log('   5. Run: export GITHUB_TOKEN=ghp_your_token_here\n');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Load existing servers to avoid duplicates
let existingServers = [];
if (existsSync('scraped-mcp-servers-all.json')) {
  existingServers = JSON.parse(readFileSync('scraped-mcp-servers-all.json', 'utf-8'));
  console.log(`📦 Loaded ${existingServers.length} existing servers`);
}

const existingIds = new Set(existingServers.map(s => s.id));
const newServers = [];

// Load checkpoint for resume capability
const CHECKPOINT_FILE = 'scrape-checkpoint.json';
let checkpoint = {
  completed_sources: [],
  last_search_page: {}
};

if (existsSync(CHECKPOINT_FILE)) {
  checkpoint = JSON.parse(readFileSync(CHECKPOINT_FILE, 'utf-8'));
  console.log(`📍 Resuming from checkpoint: ${checkpoint.completed_sources.length} sources completed`);
}

function saveCheckpoint() {
  writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

function markSourceComplete(sourceName) {
  checkpoint.completed_sources.push(sourceName);
  saveCheckpoint();
}

/**
 * Fetch README content from a GitHub repo
 */
async function fetchReadme(owner, repo) {
  try {
    const { data } = await octokit.repos.getReadme({ owner, repo });
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return content;
  } catch (error) {
    console.error(`   ⚠️  Could not fetch README for ${owner}/${repo}`);
    return null;
  }
}

/**
 * Parse awesome-mcp-servers list
 */
async function scrapeAwesomeList(owner, repo) {
  const sourceName = `awesome:${owner}/${repo}`;

  // Skip if already completed
  if (checkpoint.completed_sources.includes(sourceName)) {
    console.log(`\n⏭️  Skipping ${owner}/${repo} (already completed)`);
    return 0;
  }

  console.log(`\n📖 Scraping ${owner}/${repo}...`);

  const readme = await fetchReadme(owner, repo);
  if (!readme) return 0;

  // Parse markdown links in format: [Name](url) - Description
  // or [Name](url): Description
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)[:\s-]*([^\n]+)/g;
  let match;
  let count = 0;

  while ((match = linkRegex.exec(readme)) !== null) {
    const [, name, url, description] = match;

    // Only process GitHub URLs
    if (!url.includes('github.com')) continue;

    // Extract owner/repo from URL
    const urlMatch = url.match(/github\.com\/([^/]+)\/([^/#?]+)/);
    if (!urlMatch) continue;

    const [, repoOwner, repoName] = urlMatch;
    const id = `@${repoOwner}/${repoName}`;

    if (existingIds.has(id)) continue;

    try {
      // Fetch repo details
      const { data: repoData } = await octokit.repos.get({
        owner: repoOwner,
        repo: repoName
      });

      // Fetch README to determine transport type
      const repoReadme = await fetchReadme(repoOwner, repoName) || '';
      const transportType = inferTransportType(description, repoReadme);
      const isRemote = isRemoteServer(description, repoReadme, transportType);

      const server = {
        id,
        display_name: name.trim(),
        description: description.trim() || repoData.description || 'No description',
        type: 'mcp',
        category: inferCategory(name, description, repoData.topics),
        tags: repoData.topics || extractTags(description),
        keywords: extractKeywords(name, description),
        author_id: `@${repoOwner}`,
        author_name: repoOwner,
        repository_url: repoData.html_url,
        npm_package: repoData.has_pages ? `@${repoOwner}/${repoName}` : undefined,
        official: owner === 'modelcontextprotocol' || owner === 'anthropics',
        verified_author: owner === 'modelcontextprotocol' || owner === 'anthropics',
        version: '1.0.0',
        license: repoData.license?.spdx_id || 'MIT',
        visibility: 'public',
        quality_score: calculateQualityScore(repoData),
        remote_server: isRemote,
        remote_url: isRemote ? `${repoData.html_url}#remote` : undefined,
        transport_type: transportType,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        last_updated: repoData.updated_at,
        language: repoData.language
      };

      newServers.push(server);
      existingIds.add(id);
      count++;

      console.log(`   ✅ ${id} - ${server.display_name} ${isRemote ? '🌐' : ''}`);

      // Rate limit: pause every 100 requests
      if (count % 100 === 0) {
        console.log(`   ⏸️  Pausing for rate limit...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      if (error.status === 404) {
        console.log(`   ⏭️  Skipping ${id} (not found)`);
      } else if (error.status === 403) {
        console.log(`   ⏸️  Rate limit hit, waiting 60s...`);
        await new Promise(resolve => setTimeout(resolve, 60000));
      } else {
        console.error(`   ❌ Error fetching ${id}:`, error.message);
      }
    }
  }

  // Mark source as complete
  markSourceComplete(sourceName);
  return count;
}

/**
 * Search GitHub for MCP server repositories
 */
async function searchGitHub(query, maxResults = 1000) {
  const sourceName = `search:${query}`;

  // Skip if already completed
  if (checkpoint.completed_sources.includes(sourceName)) {
    console.log(`\n⏭️  Skipping search "${query}" (already completed)`);
    return 0;
  }

  console.log(`\n🔍 Searching GitHub for: "${query}"...`);
  let count = 0;
  let page = checkpoint.last_search_page[query] || 1;
  const perPage = 100;

  if (page > 1) {
    console.log(`   📍 Resuming from page ${page}`);
  }

  while (count < maxResults) {
    try {
      const { data } = await octokit.search.repos({
        q: query,
        sort: 'stars',
        order: 'desc',
        per_page: perPage,
        page
      });

      if (data.items.length === 0) break;

      for (const repo of data.items) {
        const id = `@${repo.owner.login}/${repo.name}`;
        if (existingIds.has(id)) continue;

        // Check if it actually mentions MCP in README
        const readme = await fetchReadme(repo.owner.login, repo.name);
        if (!readme || !readme.toLowerCase().includes('mcp')) {
          console.log(`   ⏭️  Skipping ${id} (not MCP-related)`);
          continue;
        }

        const transportType = inferTransportType(repo.description || '', readme);
        const isRemote = isRemoteServer(repo.description || '', readme, transportType);

        const server = {
          id,
          display_name: repo.name.replace(/-/g, ' ').replace(/mcp/i, 'MCP'),
          description: repo.description || 'No description',
          type: 'mcp',
          category: inferCategory(repo.name, repo.description, repo.topics),
          tags: repo.topics || extractTags(repo.description || ''),
          keywords: extractKeywords(repo.name, repo.description || ''),
          author_id: `@${repo.owner.login}`,
          author_name: repo.owner.login,
          repository_url: repo.html_url,
          official: false,
          verified_author: false,
          version: '1.0.0',
          license: repo.license?.spdx_id || 'MIT',
          visibility: 'public',
          quality_score: calculateQualityScore(repo),
          remote_server: isRemote,
          remote_url: isRemote ? `${repo.html_url}#remote` : undefined,
          transport_type: transportType,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          last_updated: repo.updated_at,
          language: repo.language
        };

        newServers.push(server);
        existingIds.add(id);
        count++;

        console.log(`   ✅ ${id} - ${server.display_name} (⭐${repo.stargazers_count}) ${isRemote ? '🌐' : ''}`);
      }

      page++;

      // Save progress after each page
      checkpoint.last_search_page[query] = page;
      saveCheckpoint();

      // GitHub search rate limit: 30 requests/minute
      if (page % 5 === 0) {
        console.log(`   ⏸️  Pausing for search rate limit...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      if (error.status === 403) {
        console.log(`   ⏸️  Rate limit hit, waiting 60s...`);
        await new Promise(resolve => setTimeout(resolve, 60000));
      } else {
        console.error(`   ❌ Search error:`, error.message);
        break;
      }
    }
  }

  // Mark search as complete
  markSourceComplete(sourceName);
  delete checkpoint.last_search_page[query]; // Clean up page tracking
  saveCheckpoint();

  return count;
}

/**
 * Helper functions
 */
function inferCategory(name, description, topics = []) {
  const text = `${name} ${description} ${topics.join(' ')}`.toLowerCase();

  if (text.match(/database|postgres|mysql|mongo|redis|sql/)) return 'database';
  if (text.match(/cloud|aws|gcp|azure|s3|lambda/)) return 'cloud';
  if (text.match(/slack|discord|telegram|teams|chat|message/)) return 'communication';
  if (text.match(/github|gitlab|git|repository/)) return 'development';
  if (text.match(/ai|openai|claude|llm|gpt|ml/)) return 'ai';
  if (text.match(/file|filesystem|storage|drive/)) return 'storage';
  if (text.match(/api|rest|graphql|http/)) return 'api';
  if (text.match(/docker|kubernetes|k8s|container/)) return 'devops';
  if (text.match(/search|elastic|algolia/)) return 'search';
  if (text.match(/analytics|metrics|datadog|sentry/)) return 'monitoring';
  if (text.match(/payment|stripe|paypal/)) return 'payment';
  if (text.match(/email|sendgrid|mailchimp/)) return 'email';

  return 'utility';
}

function extractTags(text) {
  const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
  return [...new Set(words)].slice(0, 10);
}

function extractKeywords(name, description) {
  const text = `${name} ${description}`.toLowerCase();
  const words = text.match(/\b\w{4,}\b/g) || [];
  return [...new Set(words)].slice(0, 15);
}

function calculateQualityScore(repo) {
  let score = 50;

  if (repo.stargazers_count > 1000) score += 20;
  else if (repo.stargazers_count > 100) score += 15;
  else if (repo.stargazers_count > 10) score += 10;

  if (repo.has_wiki) score += 5;
  if (repo.has_issues) score += 5;
  if (repo.description) score += 5;
  if (repo.license) score += 5;

  const daysSinceUpdate = (Date.now() - new Date(repo.updated_at)) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate < 30) score += 10;
  else if (daysSinceUpdate < 90) score += 5;

  return Math.min(score, 100);
}

function inferTransportType(description, readme) {
  const text = `${description} ${readme}`.toLowerCase();

  if (text.includes('websocket') || text.includes('ws://') || text.includes('wss://')) return 'websocket';
  if (text.includes('sse') || text.includes('server-sent events') || text.includes('eventsource')) return 'sse';

  return 'stdio'; // default - most MCP servers use stdio
}

function isRemoteServer(description, readme, transportType) {
  // A server is only remote if it supports SSE or WebSocket transport
  // Stdio servers are always local (run as subprocesses)
  return transportType === 'sse' || transportType === 'websocket';
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting MCP server scraping with GitHub API');
  console.log(`📊 Rate limit: 5,000 requests/hour with token\n`);

  // Check rate limit
  const { data: rateLimit } = await octokit.rateLimit.get();
  console.log(`⏱️  Rate limit remaining: ${rateLimit.rate.remaining}/${rateLimit.rate.limit}`);
  console.log(`⏰  Resets at: ${new Date(rateLimit.rate.reset * 1000).toLocaleTimeString()}\n`);

  let totalNew = 0;

  // 1. Scrape awesome lists
  totalNew += await scrapeAwesomeList('TensorBlock', 'awesome-mcp-servers');
  totalNew += await scrapeAwesomeList('wong2', 'awesome-mcp-servers');
  totalNew += await scrapeAwesomeList('punkpeye', 'awesome-mcp-servers');
  totalNew += await scrapeAwesomeList('MobinX', 'awesome-mcp-list');
  totalNew += await scrapeAwesomeList('habitoai', 'awesome-mcp-servers');
  totalNew += await scrapeAwesomeList('appcypher', 'awesome-mcp-servers');

  // 2. Search GitHub for MCP servers (expanded for 10K goal)
  totalNew += await searchGitHub('mcp server', 1000);
  totalNew += await searchGitHub('model context protocol', 1000);
  totalNew += await searchGitHub('anthropic mcp', 500);
  totalNew += await searchGitHub('mcp-server', 1000);
  totalNew += await searchGitHub('modelcontextprotocol', 500);
  totalNew += await searchGitHub('claude mcp', 500);
  totalNew += await searchGitHub('mcp typescript', 500);
  totalNew += await searchGitHub('mcp python', 500);
  totalNew += await searchGitHub('mcp tool', 500);
  totalNew += await searchGitHub('mcp integration', 500);

  // 3. Combine and save
  const allServers = [...existingServers, ...newServers];

  writeFileSync(
    'scraped-mcp-servers-all.json',
    JSON.stringify(allServers, null, 2)
  );

  // Save remote servers separately
  const remoteServers = allServers.filter(s => s.remote_server);
  writeFileSync(
    'scraped-mcp-servers-remote.json',
    JSON.stringify(remoteServers, null, 2)
  );

  console.log('\n\n✅ Scraping complete!');
  console.log(`📦 Total servers: ${allServers.length}`);
  console.log(`🆕 New servers: ${totalNew}`);
  console.log(`🌐 Remote servers: ${remoteServers.length}`);
  console.log(`📁 Saved to scraped-mcp-servers-all.json`);
  console.log(`📁 Remote servers: scraped-mcp-servers-remote.json`);

  // Clean up checkpoint file on successful completion
  if (existsSync(CHECKPOINT_FILE)) {
    writeFileSync(CHECKPOINT_FILE, JSON.stringify({
      completed_sources: [],
      last_search_page: {}
    }, null, 2));
    console.log(`\n🧹 Checkpoint cleared (run completed successfully)`);
  }

  // Final rate limit check
  const { data: finalRateLimit } = await octokit.rateLimit.get();
  console.log(`\n⏱️  Rate limit remaining: ${finalRateLimit.rate.remaining}/${finalRateLimit.rate.limit}`);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
