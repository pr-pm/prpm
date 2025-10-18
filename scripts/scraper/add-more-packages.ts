#!/usr/bin/env node
/**
 * Add more high-quality packages to the scraped data
 */

import * as fs from 'fs/promises';
import * as path from 'path';

async function fetchRaw(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return await response.text();
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// More Claude agents from kevinschawinski
const MORE_CLAUDE = [
  {
    name: 'plan-orchestrator-kevinschawinski',
    url: 'https://raw.githubusercontent.com/kevinschawinski/claude-agents/main/plan-orchestrator.md',
    description: 'Research planning and task orchestration agent',
    author: 'kevinschawinski',
    tags: ['planning', 'orchestration', 'research'],
  },
  {
    name: 'evidence-gatherer-kevinschawinski',
    url: 'https://raw.githubusercontent.com/kevinschawinski/claude-agents/main/evidence-gatherer.md',
    description: 'Evidence gathering and research specialist',
    author: 'kevinschawinski',
    tags: ['research', 'evidence', 'gathering'],
  },
  {
    name: 'tool-runner-kevinschawinski',
    url: 'https://raw.githubusercontent.com/kevinschawinski/claude-agents/main/tool-runner.md',
    description: 'Tool execution and automation specialist',
    author: 'kevinschawinski',
    tags: ['automation', 'tools', 'execution'],
  },
  {
    name: 'answer-writer-kevinschawinski',
    url: 'https://raw.githubusercontent.com/kevinschawinski/claude-agents/main/answer-writer.md',
    description: 'Answer synthesis and writing specialist',
    author: 'kevinschawinski',
    tags: ['writing', 'synthesis'],
  },
  {
    name: 'quality-guard-kevinschawinski',
    url: 'https://raw.githubusercontent.com/kevinschawinski/claude-agents/main/quality-guard.md',
    description: 'Code quality and review specialist',
    author: 'kevinschawinski',
    tags: ['quality', 'review', 'testing'],
  },
  {
    name: 'documentation-writer-kevinschawinski',
    url: 'https://raw.githubusercontent.com/kevinschawinski/claude-agents/main/documentation-writer.md',
    description: 'Technical documentation specialist',
    author: 'kevinschawinski',
    tags: ['documentation', 'writing'],
  },
];

// More Cursor rules from awesome-cursorrules
const MORE_CURSOR = [
  {
    name: 'cursorrules-flutter-dart',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/flutter-development-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for Flutter and Dart development',
    author: 'PatrickJS',
    tags: ['flutter', 'dart', 'mobile'],
    category: 'flutter',
  },
  {
    name: 'cursorrules-unity-csharp',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/unity-game-development-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for Unity game development',
    author: 'PatrickJS',
    tags: ['unity', 'csharp', 'gamedev'],
    category: 'unity',
  },
  {
    name: 'cursorrules-nestjs-typescript',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/typescript-nestjs-best-practices-cursorrules-promp/.cursorrules',
    description: 'Cursor rules for NestJS and TypeScript best practices',
    author: 'PatrickJS',
    tags: ['nestjs', 'typescript', 'backend'],
    category: 'nestjs',
  },
  {
    name: 'cursorrules-django-rest',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/django-rest-framework-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for Django REST Framework',
    author: 'PatrickJS',
    tags: ['django', 'rest', 'python'],
    category: 'django',
  },
  {
    name: 'cursorrules-graphql-nodejs',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/graphql-nodejs-typescript-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for GraphQL with Node.js and TypeScript',
    author: 'PatrickJS',
    tags: ['graphql', 'nodejs', 'typescript'],
    category: 'graphql',
  },
  {
    name: 'cursorrules-docker-devops',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/docker-containerization-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for Docker and containerization',
    author: 'PatrickJS',
    tags: ['docker', 'devops', 'containers'],
    category: 'docker',
  },
  {
    name: 'cursorrules-kubernetes',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/kubernetes-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for Kubernetes',
    author: 'PatrickJS',
    tags: ['kubernetes', 'devops', 'orchestration'],
    category: 'kubernetes',
  },
  {
    name: 'cursorrules-terraform',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/terraform-infrastructure-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for Terraform infrastructure',
    author: 'PatrickJS',
    tags: ['terraform', 'iac', 'devops'],
    category: 'terraform',
  },
  {
    name: 'cursorrules-postgresql',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/postgresql-database-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for PostgreSQL database development',
    author: 'PatrickJS',
    tags: ['postgresql', 'database', 'sql'],
    category: 'database',
  },
  {
    name: 'cursorrules-redis',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/redis-caching-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for Redis caching',
    author: 'PatrickJS',
    tags: ['redis', 'caching', 'database'],
    category: 'redis',
  },
];

// More MCP servers (community-contributed)
const MORE_MCP = [
  {
    name: 'mcp-postgres',
    description: 'PostgreSQL database integration MCP server',
    source: 'modelcontextprotocol/servers',
    sourceUrl: 'https://github.com/modelcontextprotocol/servers',
    author: 'modelcontextprotocol',
    tags: ['mcp', 'postgres', 'database'],
    content: `# PostgreSQL MCP Server

Connect AI assistants to PostgreSQL databases.

## Features
- Execute queries
- Schema inspection
- Data manipulation
- Transaction support

Source: https://github.com/modelcontextprotocol/servers`,
  },
  {
    name: 'mcp-slack',
    description: 'Slack integration MCP server',
    source: 'modelcontextprotocol/servers',
    sourceUrl: 'https://github.com/modelcontextprotocol/servers',
    author: 'modelcontextprotocol',
    tags: ['mcp', 'slack', 'communication'],
    content: `# Slack MCP Server

Integrate AI assistants with Slack workspaces.

## Features
- Send and read messages
- Channel management
- User information
- Search conversations

Source: https://github.com/modelcontextprotocol/servers`,
  },
  {
    name: 'mcp-google-drive',
    description: 'Google Drive integration MCP server',
    source: 'modelcontextprotocol/servers',
    sourceUrl: 'https://github.com/modelcontextprotocol/servers',
    author: 'modelcontextprotocol',
    tags: ['mcp', 'google-drive', 'storage'],
    content: `# Google Drive MCP Server

Access and manage Google Drive files.

## Features
- File upload/download
- Folder navigation
- Search files
- Sharing permissions

Source: https://github.com/modelcontextprotocol/servers`,
  },
  {
    name: 'mcp-brave-search',
    description: 'Brave Search API integration',
    source: 'modelcontextprotocol/servers',
    sourceUrl: 'https://github.com/modelcontextprotocol/servers',
    author: 'modelcontextprotocol',
    tags: ['mcp', 'search', 'brave'],
    content: `# Brave Search MCP Server

Web search capabilities using Brave Search API.

## Features
- Web search
- Privacy-focused
- High-quality results
- API integration

Source: https://github.com/modelcontextprotocol/servers`,
  },
  {
    name: 'mcp-puppeteer',
    description: 'Browser automation with Puppeteer',
    source: 'modelcontextprotocol/servers',
    sourceUrl: 'https://github.com/modelcontextprotocol/servers',
    author: 'modelcontextprotocol',
    tags: ['mcp', 'puppeteer', 'automation'],
    content: `# Puppeteer MCP Server

Browser automation and web scraping.

## Features
- Page navigation
- Screenshot capture
- Form interaction
- JavaScript execution

Source: https://github.com/modelcontextprotocol/servers`,
  },
];

async function main() {
  console.log('🚀 Adding more packages...\n');

  // Load existing data
  const existingPath = path.join(__dirname, '../../scraped-packages-additional.json');
  const existingData = JSON.parse(await fs.readFile(existingPath, 'utf-8'));

  let claudeAdded = 0;
  let cursorAdded = 0;
  let mcpAdded = 0;

  // Add more Claude agents
  console.log('📦 Fetching additional Claude agents...\n');
  for (const pkg of MORE_CLAUDE) {
    try {
      console.log(`  Fetching ${pkg.name}...`);
      const content = await fetchRaw(pkg.url);

      existingData.claude.push({
        ...pkg,
        content,
        source: pkg.author,
        sourceUrl: pkg.url,
        type: 'claude',
      });

      console.log(`  ✅ ${pkg.name} (${content.length} chars)`);
      claudeAdded++;
      await delay(1000);
    } catch (error: any) {
      console.log(`  ⏭️  Skipping ${pkg.name}: ${error.message}`);
    }
  }

  // Add more Cursor rules
  console.log('\n📦 Fetching additional Cursor rules...\n');
  for (const pkg of MORE_CURSOR) {
    try {
      console.log(`  Fetching ${pkg.name}...`);
      const content = await fetchRaw(pkg.url);

      existingData.cursor.push({
        ...pkg,
        content,
        source: pkg.author,
        sourceUrl: pkg.url,
        type: 'cursor',
      });

      console.log(`  ✅ ${pkg.name} (${content.length} chars)`);
      cursorAdded++;
      await delay(1000);
    } catch (error: any) {
      console.log(`  ⏭️  Skipping ${pkg.name}: ${error.message}`);
    }
  }

  // Add more MCP servers
  console.log('\n📦 Adding additional MCP servers...\n');
  for (const pkg of MORE_MCP) {
    existingData.mcp.push({
      ...pkg,
      type: 'mcp',
    });
    console.log(`  ✅ ${pkg.name}`);
    mcpAdded++;
  }

  // Save updated data
  await fs.writeFile(existingPath, JSON.stringify(existingData, null, 2));

  console.log('\n📊 Added Packages:');
  console.log(`   Claude: +${claudeAdded} (total: ${existingData.claude.length})`);
  console.log(`   Cursor: +${cursorAdded} (total: ${existingData.cursor.length})`);
  console.log(`   MCP: +${mcpAdded} (total: ${existingData.mcp.length})`);
  console.log(`   Total: ${existingData.claude.length + existingData.cursor.length + existingData.mcp.length}`);
  console.log(`\n✅ Updated: ${existingPath}\n`);
}

main().catch(console.error);
