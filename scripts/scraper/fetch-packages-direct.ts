#!/usr/bin/env node
/**
 * Direct package fetcher - fetches specific high-quality packages
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface Package {
  name: string;
  description: string;
  content: string;
  source: string;
  sourceUrl: string;
  author: string;
  tags: string[];
  type: 'claude' | 'cursor' | 'mcp';
  stars?: number;
  category?: string;
}

interface PackageData {
  claude: Package[];
  cursor: Package[];
  mcp: Package[];
}

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

// High-quality Claude agents to fetch
const CLAUDE_PACKAGES = [
  {
    name: 'api-designer-voltagent',
    url: 'https://raw.githubusercontent.com/VoltAgent/voltagent/main/categories/01-core-development/api-designer.md',
    description: 'REST and GraphQL API architect',
    author: 'VoltAgent',
    tags: ['api', 'rest', 'graphql', 'design'],
  },
  {
    name: 'backend-developer-voltagent',
    url: 'https://raw.githubusercontent.com/VoltAgent/voltagent/main/categories/01-core-development/backend-developer.md',
    description: 'Server-side expert for scalable APIs',
    author: 'VoltAgent',
    tags: ['backend', 'server', 'api'],
  },
  {
    name: 'frontend-developer-voltagent',
    url: 'https://raw.githubusercontent.com/VoltAgent/voltagent/main/categories/01-core-development/frontend-developer.md',
    description: 'UI/UX specialist for React, Vue, and Angular',
    author: 'VoltAgent',
    tags: ['frontend', 'react', 'vue', 'angular'],
  },
  {
    name: 'typescript-pro',
    url: 'https://raw.githubusercontent.com/VoltAgent/voltagent/main/categories/02-language-specialists/typescript-pro.md',
    description: 'TypeScript specialist',
    author: 'VoltAgent',
    tags: ['typescript', 'javascript'],
  },
  {
    name: 'python-pro',
    url: 'https://raw.githubusercontent.com/VoltAgent/voltagent/main/categories/02-language-specialists/python-pro.md',
    description: 'Python ecosystem master',
    author: 'VoltAgent',
    tags: ['python'],
  },
  {
    name: 'react-specialist',
    url: 'https://raw.githubusercontent.com/VoltAgent/voltagent/main/categories/02-language-specialists/react-specialist.md',
    description: 'React 18+ modern patterns expert',
    author: 'VoltAgent',
    tags: ['react', 'frontend'],
  },
  {
    name: 'cloud-architect-voltagent',
    url: 'https://raw.githubusercontent.com/VoltAgent/voltagent/main/categories/03-infrastructure/cloud-architect.md',
    description: 'AWS/GCP/Azure specialist',
    author: 'VoltAgent',
    tags: ['cloud', 'aws', 'gcp', 'azure'],
  },
  {
    name: 'devops-engineer-voltagent',
    url: 'https://raw.githubusercontent.com/VoltAgent/voltagent/main/categories/03-infrastructure/devops-engineer.md',
    description: 'CI/CD and automation expert',
    author: 'VoltAgent',
    tags: ['devops', 'cicd', 'automation'],
  },
  {
    name: 'code-reviewer-voltagent',
    url: 'https://raw.githubusercontent.com/VoltAgent/voltagent/main/categories/04-quality-security/code-reviewer.md',
    description: 'Code quality guardian',
    author: 'VoltAgent',
    tags: ['review', 'quality'],
  },
  {
    name: 'security-auditor',
    url: 'https://raw.githubusercontent.com/VoltAgent/voltagent/main/categories/04-quality-security/security-auditor.md',
    description: 'Security vulnerability expert',
    author: 'VoltAgent',
    tags: ['security', 'audit'],
  },
  {
    name: 'compiler-engineer-mitsuhiko',
    url: 'https://raw.githubusercontent.com/mitsuhiko/agent-prompts/main/compiler_engineer_agent.md',
    description: 'Compiler implementation specialist',
    author: 'mitsuhiko',
    tags: ['compiler', 'engineering'],
  },
  {
    name: 'language-architect-mitsuhiko',
    url: 'https://raw.githubusercontent.com/mitsuhiko/agent-prompts/main/language_architect_agent.md',
    description: 'Programming language design expert',
    author: 'mitsuhiko',
    tags: ['language', 'design', 'architecture'],
  },
  {
    name: 'runtime-engineer-mitsuhiko',
    url: 'https://raw.githubusercontent.com/mitsuhiko/agent-prompts/main/runtime_engineer_agent.md',
    description: 'Runtime system implementation specialist',
    author: 'mitsuhiko',
    tags: ['runtime', 'engineering'],
  },
  {
    name: 'research-lead-anthropic',
    url: 'https://raw.githubusercontent.com/anthropics/claude-cookbooks/main/patterns/agents/prompts/research_lead_agent.md',
    description: 'Research orchestration and analysis lead',
    author: 'anthropics',
    tags: ['research', 'analysis'],
  },
  {
    name: 'research-subagent-anthropic',
    url: 'https://raw.githubusercontent.com/anthropics/claude-cookbooks/main/patterns/agents/prompts/research_subagent.md',
    description: 'Research task execution specialist',
    author: 'anthropics',
    tags: ['research', 'analysis'],
  },
  {
    name: 'citations-agent-anthropic',
    url: 'https://raw.githubusercontent.com/anthropics/claude-cookbooks/main/patterns/agents/prompts/citations_agent.md',
    description: 'Citation and reference management',
    author: 'anthropics',
    tags: ['research', 'citations'],
  },
];

// High-quality Cursor rules to fetch
const CURSOR_PACKAGES = [
  {
    name: 'cursorrules-nextjs-typescript',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/nextjs-react-typescript-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for Next.js, React, and TypeScript development',
    author: 'PatrickJS',
    tags: ['nextjs', 'react', 'typescript'],
    category: 'nextjs',
  },
  {
    name: 'cursorrules-react-components',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/react-components-creation-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for React component creation',
    author: 'PatrickJS',
    tags: ['react', 'components'],
    category: 'react',
  },
  {
    name: 'cursorrules-python-fastapi',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/py-fast-api/.cursorrules',
    description: 'Cursor rules for Python FastAPI development',
    author: 'PatrickJS',
    tags: ['python', 'fastapi', 'backend'],
    category: 'python',
  },
  {
    name: 'cursorrules-nodejs-mongodb',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/nodejs-mongodb-cursorrules-prompt-file-tutorial/.cursorrules',
    description: 'Cursor rules for Node.js and MongoDB',
    author: 'PatrickJS',
    tags: ['nodejs', 'mongodb', 'backend'],
    category: 'nodejs',
  },
  {
    name: 'cursorrules-laravel-php',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/laravel-php-83-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for Laravel PHP 8.3',
    author: 'PatrickJS',
    tags: ['laravel', 'php', 'backend'],
    category: 'laravel',
  },
  {
    name: 'cursorrules-react-native-expo',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/react-native-expo-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for React Native and Expo',
    author: 'PatrickJS',
    tags: ['react-native', 'expo', 'mobile'],
    category: 'mobile',
  },
  {
    name: 'cursorrules-tailwind-nextjs',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/tailwind-css-nextjs-guide-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for Tailwind CSS and Next.js',
    author: 'PatrickJS',
    tags: ['tailwind', 'nextjs', 'css'],
    category: 'css',
  },
  {
    name: 'cursorrules-vue-typescript',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/vue-typescript-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for Vue.js and TypeScript',
    author: 'PatrickJS',
    tags: ['vue', 'typescript'],
    category: 'vue',
  },
  {
    name: 'cursorrules-angular-typescript',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/angular-typescript-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for Angular and TypeScript',
    author: 'PatrickJS',
    tags: ['angular', 'typescript'],
    category: 'angular',
  },
  {
    name: 'cursorrules-cypress-testing',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/cypress-e2e-testing-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for Cypress E2E testing',
    author: 'PatrickJS',
    tags: ['cypress', 'testing', 'e2e'],
    category: 'testing',
  },
  {
    name: 'cursorrules-django-python',
    url: 'https://raw.githubusercontent.com/ivangrynenko/cursorrules/main/.cursorrules.django.md',
    description: 'Cursor rules for Django Python development',
    author: 'ivangrynenko',
    tags: ['django', 'python'],
    category: 'django',
  },
  {
    name: 'cursorrules-drupal-php',
    url: 'https://raw.githubusercontent.com/ivangrynenko/cursorrules/main/.cursorrules.drupal.md',
    description: 'Cursor rules for Drupal PHP development',
    author: 'ivangrynenko',
    tags: ['drupal', 'php'],
    category: 'drupal',
  },
  {
    name: 'cursorrules-rust',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/rust-development-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for Rust development',
    author: 'PatrickJS',
    tags: ['rust'],
    category: 'rust',
  },
  {
    name: 'cursorrules-go-development',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/go-development-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for Go development',
    author: 'PatrickJS',
    tags: ['go', 'golang'],
    category: 'go',
  },
  {
    name: 'cursorrules-swiftui',
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/swiftui-guidelines-cursorrules-prompt-file/.cursorrules',
    description: 'Cursor rules for SwiftUI development',
    author: 'PatrickJS',
    tags: ['swift', 'swiftui', 'ios'],
    category: 'swift',
  },
];

// MCP servers info (will create description-based packages since we can't install them)
const MCP_PACKAGES = [
  {
    name: 'mcp-github',
    description: "GitHub's official MCP Server for accessing GitHub resources",
    source: 'github/github-mcp-server',
    sourceUrl: 'https://github.com/github/github-mcp-server',
    author: 'github',
    tags: ['mcp', 'github', 'server'],
    content: `# GitHub MCP Server

GitHub's official Model Context Protocol server for accessing GitHub resources.

## Features
- Access GitHub repositories
- Manage issues and pull requests
- Search code and repositories
- Access user and organization data

## Installation
\`\`\`bash
npm install @github/mcp-server
\`\`\`

## Configuration
Add to your MCP settings to enable GitHub integration with AI assistants.

Source: https://github.com/github/github-mcp-server`,
  },
  {
    name: 'mcp-gitlab',
    description: "GitLab's official MCP server for accessing GitLab project data",
    source: 'gitlab/gitlab-mcp-server',
    sourceUrl: 'https://docs.gitlab.com/user/gitlab_duo/model_context_protocol/mcp_server/',
    author: 'gitlab',
    tags: ['mcp', 'gitlab', 'server'],
    content: `# GitLab MCP Server

GitLab's official MCP server enabling AI tools to securely access project data.

## Features
- Access GitLab repositories and projects
- Manage merge requests and issues
- CI/CD pipeline integration
- Secure authentication

## Documentation
Visit: https://docs.gitlab.com/user/gitlab_duo/model_context_protocol/mcp_server/`,
  },
  {
    name: 'mcp-aws',
    description: 'AWS MCP servers bringing AWS best practices to development',
    source: 'awslabs/mcp',
    sourceUrl: 'https://github.com/awslabs/mcp',
    author: 'awslabs',
    tags: ['mcp', 'aws', 'cloud'],
    content: `# AWS MCP Servers

Specialized MCP servers that bring AWS best practices directly to your development workflow.

## Features
- AWS service integration
- Infrastructure as Code support
- Security and compliance
- Cost optimization insights

Source: https://github.com/awslabs/mcp`,
  },
  {
    name: 'mcp-azure',
    description: 'Microsoft Azure MCP server for Azure services',
    source: 'microsoft/mcp',
    sourceUrl: 'https://github.com/microsoft/mcp/tree/main/servers/Azure.Mcp.Server',
    author: 'microsoft',
    tags: ['mcp', 'azure', 'cloud'],
    content: `# Azure MCP Server

Gives MCP Clients access to key Azure services and tools.

## Features
- Azure resource management
- Service integration
- Authentication and security
- Cloud resource access

Source: https://github.com/microsoft/mcp`,
  },
  {
    name: 'mcp-cloudflare',
    description: 'Cloudflare MCP server for developer platform resources',
    source: 'cloudflare/mcp-server-cloudflare',
    sourceUrl: 'https://github.com/cloudflare/mcp-server-cloudflare',
    author: 'cloudflare',
    tags: ['mcp', 'cloudflare', 'edge'],
    content: `# Cloudflare MCP Server

Deploy, configure & interrogate Cloudflare developer platform resources.

## Features
- Workers deployment
- Pages configuration
- DNS management
- Edge computing resources

Source: https://github.com/cloudflare/mcp-server-cloudflare`,
  },
  {
    name: 'mcp-filesystem',
    description: 'Secure file operations with configurable access controls',
    source: 'modelcontextprotocol/servers',
    sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
    author: 'modelcontextprotocol',
    tags: ['mcp', 'filesystem', 'server'],
    content: `# Filesystem MCP Server

Official reference implementation for secure file operations.

## Features
- Secure file read/write operations
- Configurable access controls
- Directory management
- File search capabilities

Source: https://github.com/modelcontextprotocol/servers`,
  },
  {
    name: 'mcp-git',
    description: 'Tools to read, search, and manipulate Git repositories',
    source: 'modelcontextprotocol/servers',
    sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/git',
    author: 'modelcontextprotocol',
    tags: ['mcp', 'git', 'server'],
    content: `# Git MCP Server

Official reference implementation for Git operations.

## Features
- Read repository contents
- Search through commits
- Manipulate branches
- View diff and history

Source: https://github.com/modelcontextprotocol/servers`,
  },
  {
    name: 'mcp-memory',
    description: 'Knowledge graph-based persistent memory system',
    source: 'modelcontextprotocol/servers',
    sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
    author: 'modelcontextprotocol',
    tags: ['mcp', 'memory', 'knowledge-graph'],
    content: `# Memory MCP Server

Knowledge graph-based persistent memory system for AI assistants.

## Features
- Store and retrieve context
- Knowledge graph structure
- Entity relationships
- Persistent memory across sessions

Source: https://github.com/modelcontextprotocol/servers`,
  },
  {
    name: 'mcp-fetch',
    description: 'Web content fetching and conversion for efficient LLM usage',
    source: 'modelcontextprotocol/servers',
    sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
    author: 'modelcontextprotocol',
    tags: ['mcp', 'web', 'fetch'],
    content: `# Fetch MCP Server

Official reference implementation for web content fetching.

## Features
- Fetch web pages
- Convert to LLM-friendly format
- Handle various content types
- Efficient content processing

Source: https://github.com/modelcontextprotocol/servers`,
  },
  {
    name: 'mcp-sequential-thinking',
    description: 'Dynamic and reflective problem-solving through thought sequences',
    source: 'modelcontextprotocol/servers',
    sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking',
    author: 'modelcontextprotocol',
    tags: ['mcp', 'reasoning', 'thinking'],
    content: `# Sequential Thinking MCP Server

Enable dynamic and reflective problem-solving through thought sequences.

## Features
- Step-by-step reasoning
- Reflective thinking
- Problem decomposition
- Thought tracking

Source: https://github.com/modelcontextprotocol/servers`,
  },
];

async function fetchClaudePackages(): Promise<Package[]> {
  const packages: Package[] = [];
  console.log('\n🔍 Fetching Claude packages...\n');

  for (const pkg of CLAUDE_PACKAGES) {
    try {
      console.log(`  Fetching ${pkg.name}...`);
      const content = await fetchRaw(pkg.url);

      packages.push({
        ...pkg,
        content,
        source: pkg.author,
        sourceUrl: pkg.url,
        type: 'claude',
      });

      console.log(`  ✅ ${pkg.name} (${content.length} chars)`);
      await delay(1000); // Be nice to GitHub
    } catch (error: any) {
      console.log(`  ❌ Failed to fetch ${pkg.name}: ${error.message}`);
    }
  }

  console.log(`\n✅ Fetched ${packages.length} Claude packages\n`);
  return packages;
}

async function fetchCursorPackages(): Promise<Package[]> {
  const packages: Package[] = [];
  console.log('\n🔍 Fetching Cursor packages...\n');

  for (const pkg of CURSOR_PACKAGES) {
    try {
      console.log(`  Fetching ${pkg.name}...`);
      const content = await fetchRaw(pkg.url);

      packages.push({
        ...pkg,
        content,
        source: pkg.author,
        sourceUrl: pkg.url,
        type: 'cursor',
      });

      console.log(`  ✅ ${pkg.name} (${content.length} chars)`);
      await delay(1000);
    } catch (error: any) {
      console.log(`  ❌ Failed to fetch ${pkg.name}: ${error.message}`);
    }
  }

  console.log(`\n✅ Fetched ${packages.length} Cursor packages\n`);
  return packages;
}

function createMCPPackages(): Package[] {
  console.log('\n🔍 Creating MCP packages...\n');

  const packages = MCP_PACKAGES.map(pkg => ({
    ...pkg,
    type: 'mcp' as const,
  }));

  console.log(`✅ Created ${packages.length} MCP packages\n`);
  return packages;
}

async function main() {
  console.log('🚀 Starting direct package fetch...\n');

  const data: PackageData = {
    claude: [],
    cursor: [],
    mcp: [],
  };

  data.claude = await fetchClaudePackages();
  data.cursor = await fetchCursorPackages();
  data.mcp = createMCPPackages();

  const outputPath = path.join(__dirname, '../../scraped-packages-additional.json');
  await fs.writeFile(outputPath, JSON.stringify(data, null, 2));

  console.log('\n📊 Summary:');
  console.log(`   Claude packages: ${data.claude.length}`);
  console.log(`   Cursor packages: ${data.cursor.length}`);
  console.log(`   MCP packages: ${data.mcp.length}`);
  console.log(`   Total: ${data.claude.length + data.cursor.length + data.mcp.length}`);
  console.log(`\n✅ Saved to: ${outputPath}\n`);
}

main().catch(console.error);
