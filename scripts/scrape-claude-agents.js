#!/usr/bin/env node

/**
 * Scrape Claude Agents and Slash Commands from GitHub
 *
 * SETUP:
 * 1. Set environment variable:
 *    export GITHUB_TOKEN=ghp_your_token_here
 *
 * 2. Run script:
 *    node scripts/scrape-claude-agents.js
 *
 * This will scrape:
 * - github.com/wshobson/agents (Claude agents)
 * - github.com/valllabh/claude-agents (Claude agents and slash commands)
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { Octokit } from '@octokit/rest';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN environment variable not set!');
  console.log('\n📝 Run: export GITHUB_TOKEN=ghp_your_token_here\n');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Load existing packages to avoid duplicates
let existingPackages = [];
const OUTPUT_FILE = 'scraped-claude-agents.json';

if (existsSync(OUTPUT_FILE)) {
  existingPackages = JSON.parse(readFileSync(OUTPUT_FILE, 'utf-8'));
  console.log(`📦 Loaded ${existingPackages.length} existing packages`);
}

const existingIds = new Set(existingPackages.map(p => p.id));
const newPackages = [];

/**
 * Fetch README content from a GitHub repo
 */
async function fetchReadme(owner, repo, path = '') {
  try {
    const params = { owner, repo };
    if (path) {
      params.path = `${path}/README.md`;
    }
    const { data } = await octokit.repos.getReadme(params);
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return content;
  } catch (error) {
    const status = error.status || error.response?.status;
    if (status === 403 || error.message?.includes('rate limit')) {
      throw error;
    }
    return null;
  }
}

/**
 * Fetch directory contents from a GitHub repo
 */
async function fetchDirectoryContents(owner, repo, path = '') {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    const status = error.status || error.response?.status;
    if (status === 403 || error.message?.includes('rate limit')) {
      throw error;
    }
    console.error(`   ⚠️  Could not fetch directory ${path} for ${owner}/${repo}`);
    return [];
  }
}

/**
 * Fetch file content from a GitHub repo
 */
async function fetchFileContent(owner, repo, path) {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (data.content) {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch (error) {
    const status = error.status || error.response?.status;
    if (status === 403 || error.message?.includes('rate limit')) {
      throw error;
    }
    return null;
  }
}

/**
 * Parse agent metadata from file content
 */
function parseAgentMetadata(content, filename) {
  const metadata = {
    name: filename.replace(/\.(md|txt)$/, '').replace(/[-_]/g, ' '),
    description: '',
    tags: [],
    category: 'utility'
  };

  if (!content) return metadata;

  // Try to extract title from markdown
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    metadata.name = titleMatch[1].trim();
  }

  // Extract description from first paragraph
  const descMatch = content.match(/^(?:#{1,6}[^\n]*\n+)?([^\n#]+)/);
  if (descMatch) {
    metadata.description = descMatch[1].trim().substring(0, 200);
  }

  // Infer category from content
  const text = content.toLowerCase();
  if (text.includes('code') || text.includes('programming')) metadata.category = 'development';
  if (text.includes('test') || text.includes('qa')) metadata.category = 'testing';
  if (text.includes('document') || text.includes('writing')) metadata.category = 'documentation';
  if (text.includes('data') || text.includes('analysis')) metadata.category = 'data';
  if (text.includes('security') || text.includes('audit')) metadata.category = 'security';

  return metadata;
}

/**
 * Parse slash command metadata
 */
function parseSlashCommandMetadata(content, filename) {
  const metadata = {
    name: filename.replace(/\.(md|txt|js|ts)$/, '').replace(/[-_]/g, ' '),
    description: '',
    tags: ['slash-command'],
    category: 'utility'
  };

  if (!content) return metadata;

  // Extract command name from content
  const commandMatch = content.match(/\/([a-z-]+)/);
  if (commandMatch) {
    metadata.name = `/${commandMatch[1]}`;
  }

  // Extract description
  const descMatch = content.match(/(?:description|about|summary)[:=]\s*([^\n]+)/i);
  if (descMatch) {
    metadata.description = descMatch[1].trim();
  } else {
    const firstLine = content.split('\n')[0];
    metadata.description = firstLine.substring(0, 200);
  }

  return metadata;
}

/**
 * Scrape wshobson/agents repository (Claude plugins)
 */
async function scrapeWshobsonAgents() {
  const owner = 'wshobson';
  const repo = 'agents';

  console.log(`\n📖 Scraping ${owner}/${repo}...`);

  const { data: repoData } = await octokit.repos.get({ owner, repo });

  let count = 0;

  // Get plugins directory
  const plugins = await fetchDirectoryContents(owner, repo, 'plugins');

  for (const plugin of plugins) {
    if (plugin.type !== 'dir') continue;

    console.log(`   📁 Processing plugin: ${plugin.name}`);

    // Check for agents subdirectory
    const agentsPath = `${plugin.path}/agents`;
    const agentsDir = await fetchDirectoryContents(owner, repo, agentsPath);

    for (const agentFile of agentsDir) {
      if (agentFile.type !== 'file') continue;
      if (!agentFile.name.endsWith('.md') && !agentFile.name.endsWith('.txt')) continue;

      const id = `@${owner}/${repo}/${plugin.name}/${agentFile.name.replace(/\.[^.]+$/, '')}`;

      if (existingIds.has(id)) continue;

      const content = await fetchFileContent(owner, repo, agentFile.path);
      const metadata = parseAgentMetadata(content, agentFile.name);

      const package_data = {
        id,
        display_name: `${plugin.name}: ${metadata.name}`,
        description: metadata.description || `Claude agent for ${plugin.name}`,
        type: 'claude-agent',
        category: metadata.category,
        tags: ['agent', 'claude', plugin.name, ...metadata.tags],
        keywords: extractKeywords(metadata.name, metadata.description),
        author_id: `@${owner}`,
        author_name: owner,
        repository_url: `${repoData.html_url}/blob/main/${agentFile.path}`,
        official: false,
        verified_author: false,
        version: '1.0.0',
        license: repoData.license?.spdx_id || 'MIT',
        visibility: 'public',
        quality_score: 80,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        last_updated: repoData.updated_at,
        language: 'Markdown'
      };

      newPackages.push(package_data);
      existingIds.add(id);
      count++;

      console.log(`      ✅ ${id} 🤖`);
    }

    // Check for commands subdirectory (slash commands)
    const commandsPath = `${plugin.path}/commands`;
    const commandsDir = await fetchDirectoryContents(owner, repo, commandsPath);

    for (const commandFile of commandsDir) {
      if (commandFile.type !== 'file') continue;
      if (!commandFile.name.endsWith('.md') && !commandFile.name.endsWith('.txt')) continue;

      const id = `@${owner}/${repo}/${plugin.name}/${commandFile.name.replace(/\.[^.]+$/, '')}`;

      if (existingIds.has(id)) continue;

      const content = await fetchFileContent(owner, repo, commandFile.path);
      const metadata = parseSlashCommandMetadata(content, commandFile.name);

      const package_data = {
        id,
        display_name: `${plugin.name}: ${metadata.name}`,
        description: metadata.description || `Slash command for ${plugin.name}`,
        type: 'claude-slash-command',
        category: metadata.category,
        tags: ['slash-command', 'claude', plugin.name, ...metadata.tags],
        keywords: extractKeywords(metadata.name, metadata.description),
        author_id: `@${owner}`,
        author_name: owner,
        repository_url: `${repoData.html_url}/blob/main/${commandFile.path}`,
        official: false,
        verified_author: false,
        version: '1.0.0',
        license: repoData.license?.spdx_id || 'MIT',
        visibility: 'public',
        quality_score: 80,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        last_updated: repoData.updated_at,
        language: 'Markdown'
      };

      newPackages.push(package_data);
      existingIds.add(id);
      count++;

      console.log(`      ✅ ${id} ⚡`);
    }
  }

  return count;
}

/**
 * Scrape valllabh/claude-agents repository
 */
async function scrapeValllabhClaudeAgents() {
  const owner = 'valllabh';
  const repo = 'claude-agents';

  console.log(`\n📖 Scraping ${owner}/${repo}...`);

  const { data: repoData } = await octokit.repos.get({ owner, repo });

  let count = 0;

  // Check for claude/agents directory
  const agentsPath = 'claude/agents';
  const agentFiles = await fetchDirectoryContents(owner, repo, agentsPath);

  console.log(`   📁 Processing ${agentsPath}`);

  for (const file of agentFiles) {
    if (file.type !== 'file') continue;
    if (!file.name.endsWith('.md')) continue;

    const id = `@${owner}/${repo}/${file.name.replace(/\.[^.]+$/, '')}`;

    if (existingIds.has(id)) continue;

    const content = await fetchFileContent(owner, repo, file.path);
    const metadata = parseAgentMetadata(content, file.name);

    const package_data = {
      id,
      display_name: metadata.name,
      description: metadata.description || 'Claude agent configuration',
      type: 'claude-agent',
      category: metadata.category,
      tags: ['agent', 'claude', ...metadata.tags],
      keywords: extractKeywords(metadata.name, metadata.description),
      author_id: `@${owner}`,
      author_name: owner,
      repository_url: `${repoData.html_url}/blob/main/${file.path}`,
      official: false,
      verified_author: false,
      version: '1.0.0',
      license: repoData.license?.spdx_id || 'MIT',
      visibility: 'public',
      quality_score: 75,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      last_updated: repoData.updated_at,
      language: 'Markdown'
    };

    newPackages.push(package_data);
    existingIds.add(id);
    count++;

    console.log(`      ✅ ${id} 🤖`);
  }

  return count;
}

/**
 * Helper: Extract keywords from text
 */
function extractKeywords(name, description) {
  const text = `${name} ${description}`.toLowerCase();
  const words = text.match(/\b\w{4,}\b/g) || [];
  return [...new Set(words)].slice(0, 15);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Claude Agents & Slash Commands scraping');
  console.log(`📊 Using GitHub API with token\n`);

  // Check rate limit
  const { data: rateLimit } = await octokit.rateLimit.get();
  console.log(`⏱️  Rate limit remaining: ${rateLimit.rate.remaining}/${rateLimit.rate.limit}`);
  console.log(`⏰  Resets at: ${new Date(rateLimit.rate.reset * 1000).toLocaleTimeString()}\n`);

  let totalNew = 0;

  try {
    // Scrape both repositories
    totalNew += await scrapeWshobsonAgents();
    totalNew += await scrapeValllabhClaudeAgents();

    // Combine and save
    const allPackages = [...existingPackages, ...newPackages];

    writeFileSync(OUTPUT_FILE, JSON.stringify(allPackages, null, 2));

    // Separate by type
    const agents = allPackages.filter(p => p.type === 'claude-agent');
    const slashCommands = allPackages.filter(p => p.type === 'claude-slash-command');

    writeFileSync('scraped-claude-agents-only.json', JSON.stringify(agents, null, 2));
    writeFileSync('scraped-claude-slash-commands.json', JSON.stringify(slashCommands, null, 2));

    console.log('\n\n✅ Scraping complete!');
    console.log(`📦 Total packages: ${allPackages.length}`);
    console.log(`🆕 New packages: ${totalNew}`);
    console.log(`🤖 Claude agents: ${agents.length}`);
    console.log(`⚡ Slash commands: ${slashCommands.length}`);
    console.log(`📁 Saved to ${OUTPUT_FILE}`);

  } catch (error) {
    console.error('❌ Error during scraping:', error.message);
    throw error;
  }

  // Final rate limit check
  const { data: finalRateLimit } = await octokit.rateLimit.get();
  console.log(`\n⏱️  Rate limit remaining: ${finalRateLimit.rate.remaining}/${finalRateLimit.rate.limit}`);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
