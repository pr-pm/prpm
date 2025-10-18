#!/usr/bin/env node
import { Octokit } from '@octokit/rest';
import * as fs from 'fs/promises';
import * as path from 'path';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

interface ScrapedPackage {
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

interface ScrapedData {
  claude: ScrapedPackage[];
  cursor: ScrapedPackage[];
  mcp: ScrapedPackage[];
}

const existingPackages = new Set<string>();

// Repositories to scrape
const CLAUDE_REPOS = [
  { owner: 'VoltAgent', repo: 'awesome-claude-code-subagents', path: '' },
  { owner: 'kevinschawinski', repo: 'claude-agents', path: '' },
  { owner: 'whichguy', repo: 'claude-code-agents', path: '' },
  { owner: 'anthropics', repo: 'claude-cookbooks', path: 'patterns/agents/prompts' },
  { owner: 'langgptai', repo: 'awesome-claude-prompts', path: '' },
  { owner: 'mitsuhiko', repo: 'agent-prompts', path: '' },
];

const CURSOR_REPOS = [
  { owner: 'PatrickJS', repo: 'awesome-cursorrules', path: 'rules' },
  { owner: 'ivangrynenko', repo: 'cursorrules', path: '' },
  { owner: 'grapeot', repo: 'devin.cursorrules', path: '' },
  { owner: 'chand1012', repo: 'cursorrules', path: '' },
];

const MCP_REPOS = [
  { owner: 'modelcontextprotocol', repo: 'servers', path: 'src' },
];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getRepoStars(owner: string, repo: string): Promise<number> {
  try {
    const { data } = await octokit.repos.get({ owner, repo });
    return data.stargazers_count || 0;
  } catch (error) {
    console.error(`Error getting stars for ${owner}/${repo}:`, error);
    return 0;
  }
}

async function getRepoContents(owner: string, repo: string, path: string = ''): Promise<any[]> {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    return Array.isArray(data) ? data : [data];
  } catch (error: any) {
    if (error?.status === 403) {
      console.error('Rate limit hit. Waiting...');
      await delay(60000); // Wait 1 minute
      return getRepoContents(owner, repo, path);
    }
    console.error(`Error getting contents for ${owner}/${repo}/${path}:`, error?.message);
    return [];
  }
}

async function getFileContent(owner: string, repo: string, path: string): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if ('content' in data && data.content) {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
  } catch (error: any) {
    if (error?.status === 403) {
      console.error('Rate limit hit. Waiting...');
      await delay(60000);
      return getFileContent(owner, repo, path);
    }
    console.error(`Error getting file ${owner}/${repo}/${path}:`, error?.message);
  }
  return null;
}

function extractMetadata(content: string, type: 'claude' | 'cursor' | 'mcp') {
  let description = '';
  let tags: string[] = [];

  // Extract YAML frontmatter
  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (yamlMatch) {
    const yaml = yamlMatch[1];
    const descMatch = yaml.match(/description:\s*(.+)/);
    if (descMatch) description = descMatch[1].trim();

    const tagsMatch = yaml.match(/tags:\s*\[([^\]]+)\]/);
    if (tagsMatch) {
      tags = tagsMatch[1].split(',').map(t => t.trim());
    }
  }

  // Fallback: extract from first paragraph or title
  if (!description) {
    const lines = content.split('\n').filter(l => l.trim());
    for (const line of lines) {
      if (line.startsWith('#')) {
        description = line.replace(/^#+\s*/, '').trim();
        break;
      } else if (line.length > 20 && !line.startsWith('```')) {
        description = line.trim();
        break;
      }
    }
  }

  // Auto-generate tags if none found
  if (tags.length === 0) {
    const contentLower = content.toLowerCase();
    const commonTags = ['react', 'typescript', 'python', 'nodejs', 'nextjs', 'vue', 'angular',
                        'testing', 'security', 'devops', 'api', 'backend', 'frontend'];
    tags = commonTags.filter(tag => contentLower.includes(tag));
  }

  return { description, tags };
}

async function scrapeClaudePrompts(): Promise<ScrapedPackage[]> {
  const packages: ScrapedPackage[] = [];
  console.log('\n🔍 Scraping Claude prompts/agents...\n');

  for (const { owner, repo, path: repoPath } of CLAUDE_REPOS) {
    console.log(`📦 Scraping ${owner}/${repo}...`);

    try {
      const stars = await getRepoStars(owner, repo);
      await delay(1000); // Rate limit prevention

      const contents = await getRepoContents(owner, repo, repoPath);
      await delay(1000);

      for (const item of contents) {
        if (item.type === 'file' && (item.name.endsWith('.md') || item.name.endsWith('.txt'))) {
          const content = await getFileContent(owner, repo, item.path);
          await delay(1000);

          if (content && content.length > 100) { // Quality filter
            const name = item.name.replace(/\.(md|txt)$/, '');
            const packageName = `${name}-${owner}`;

            if (existingPackages.has(packageName)) {
              console.log(`  ⏭️  Skipping ${packageName} (already exists)`);
              continue;
            }

            const { description, tags } = extractMetadata(content, 'claude');

            packages.push({
              name: packageName,
              description: description || `Claude agent from ${owner}/${repo}`,
              content,
              source: `${owner}/${repo}`,
              sourceUrl: `https://github.com/${owner}/${repo}/blob/main/${item.path}`,
              author: owner,
              tags: [...tags, 'agent', 'claude'],
              type: 'claude',
              stars,
            });

            console.log(`  ✅ Scraped: ${packageName} (${content.length} chars)`);
          }
        } else if (item.type === 'dir') {
          // Recursively explore subdirectories
          const subContents = await getRepoContents(owner, repo, item.path);
          await delay(1000);

          for (const subItem of subContents) {
            if (subItem.type === 'file' && (subItem.name.endsWith('.md') || subItem.name.endsWith('.txt'))) {
              const content = await getFileContent(owner, repo, subItem.path);
              await delay(1000);

              if (content && content.length > 100) {
                const name = subItem.name.replace(/\.(md|txt)$/, '');
                const packageName = `${name}-${owner}`;

                if (existingPackages.has(packageName)) continue;

                const { description, tags } = extractMetadata(content, 'claude');

                packages.push({
                  name: packageName,
                  description: description || `Claude agent from ${owner}/${repo}`,
                  content,
                  source: `${owner}/${repo}`,
                  sourceUrl: `https://github.com/${owner}/${repo}/blob/main/${subItem.path}`,
                  author: owner,
                  tags: [...tags, 'agent', 'claude'],
                  type: 'claude',
                  stars,
                });

                console.log(`  ✅ Scraped: ${packageName} (${content.length} chars)`);
              }
            }
          }
        }

        // Limit to avoid too many requests
        if (packages.length >= 30) break;
      }
    } catch (error: any) {
      console.error(`❌ Error scraping ${owner}/${repo}:`, error.message);
    }

    if (packages.length >= 30) break;
  }

  console.log(`\n✅ Scraped ${packages.length} Claude packages\n`);
  return packages;
}

async function scrapeCursorRules(): Promise<ScrapedPackage[]> {
  const packages: ScrapedPackage[] = [];
  console.log('\n🔍 Scraping Cursor rules...\n');

  for (const { owner, repo, path: repoPath } of CURSOR_REPOS) {
    console.log(`📦 Scraping ${owner}/${repo}...`);

    try {
      const stars = await getRepoStars(owner, repo);
      await delay(1000);

      const contents = await getRepoContents(owner, repo, repoPath);
      await delay(1000);

      for (const item of contents) {
        if (item.type === 'file' && item.name === '.cursorrules') {
          const content = await getFileContent(owner, repo, item.path);
          await delay(1000);

          if (content && content.length > 50) {
            const dirName = path.dirname(item.path).split('/').pop() || 'general';
            const packageName = `cursorrules-${dirName}-${owner}`;

            if (existingPackages.has(packageName)) continue;

            const { description, tags } = extractMetadata(content, 'cursor');

            packages.push({
              name: packageName,
              description: description || `Cursor rules for ${dirName}`,
              content,
              source: `${owner}/${repo}`,
              sourceUrl: `https://github.com/${owner}/${repo}/blob/main/${item.path}`,
              author: owner,
              tags: [...tags, 'cursor', 'rules', dirName],
              type: 'cursor',
              stars,
              category: dirName,
            });

            console.log(`  ✅ Scraped: ${packageName} (${content.length} chars)`);
          }
        } else if (item.type === 'dir') {
          // Recursively explore for .cursorrules files
          const subContents = await getRepoContents(owner, repo, item.path);
          await delay(1000);

          for (const subItem of subContents) {
            if (subItem.type === 'file' && subItem.name === '.cursorrules') {
              const content = await getFileContent(owner, repo, subItem.path);
              await delay(1000);

              if (content && content.length > 50) {
                const dirName = path.dirname(subItem.path).split('/').pop() || 'general';
                const packageName = `cursorrules-${dirName}-${owner}`;

                if (existingPackages.has(packageName)) continue;

                const { description, tags } = extractMetadata(content, 'cursor');

                packages.push({
                  name: packageName,
                  description: description || `Cursor rules for ${dirName}`,
                  content,
                  source: `${owner}/${repo}`,
                  sourceUrl: `https://github.com/${owner}/${repo}/blob/main/${subItem.path}`,
                  author: owner,
                  tags: [...tags, 'cursor', 'rules', dirName],
                  type: 'cursor',
                  stars,
                  category: dirName,
                });

                console.log(`  ✅ Scraped: ${packageName} (${content.length} chars)`);
              }
            }
          }
        }

        if (packages.length >= 30) break;
      }
    } catch (error: any) {
      console.error(`❌ Error scraping ${owner}/${repo}:`, error.message);
    }

    if (packages.length >= 30) break;
  }

  console.log(`\n✅ Scraped ${packages.length} Cursor packages\n`);
  return packages;
}

async function scrapeMCPServers(): Promise<ScrapedPackage[]> {
  const packages: ScrapedPackage[] = [];
  console.log('\n🔍 Scraping MCP servers...\n');

  const { owner, repo, path: repoPath } = MCP_REPOS[0];
  console.log(`📦 Scraping ${owner}/${repo}...`);

  try {
    const stars = await getRepoStars(owner, repo);
    await delay(1000);

    const contents = await getRepoContents(owner, repo, repoPath);
    await delay(1000);

    for (const item of contents) {
      if (item.type === 'dir') {
        // Each directory is an MCP server
        const serverName = item.name;

        // Try to find README or index file
        const serverContents = await getRepoContents(owner, repo, item.path);
        await delay(1000);

        let content = '';
        let description = '';

        // Look for package.json or README
        for (const file of serverContents) {
          if (file.name === 'README.md') {
            content = await getFileContent(owner, repo, file.path) || '';
            await delay(1000);
          } else if (file.name === 'package.json') {
            const pkgContent = await getFileContent(owner, repo, file.path);
            await delay(1000);
            if (pkgContent) {
              try {
                const pkg = JSON.parse(pkgContent);
                description = pkg.description || '';
              } catch (e) {}
            }
          }
        }

        if (content.length > 100 || description) {
          const packageName = `mcp-${serverName}`;

          if (existingPackages.has(packageName)) continue;

          const { description: extractedDesc, tags } = extractMetadata(content, 'mcp');

          packages.push({
            name: packageName,
            description: description || extractedDesc || `MCP server: ${serverName}`,
            content: content || `MCP Server: ${serverName}\n\n${description}`,
            source: `${owner}/${repo}`,
            sourceUrl: `https://github.com/${owner}/${repo}/tree/main/${item.path}`,
            author: owner,
            tags: [...tags, 'mcp', 'server', serverName],
            type: 'mcp',
            stars,
            category: 'mcp-server',
          });

          console.log(`  ✅ Scraped: ${packageName}`);
        }
      }

      if (packages.length >= 15) break;
    }
  } catch (error: any) {
    console.error(`❌ Error scraping ${owner}/${repo}:`, error.message);
  }

  console.log(`\n✅ Scraped ${packages.length} MCP packages\n`);
  return packages;
}

async function loadExistingPackages() {
  try {
    const existingPath = path.join(__dirname, '../scraped/claude-agents.json');
    const data = await fs.readFile(existingPath, 'utf-8');
    const packages = JSON.parse(data);
    packages.forEach((pkg: any) => existingPackages.add(pkg.name));
    console.log(`📚 Loaded ${existingPackages.size} existing packages to skip\n`);
  } catch (error) {
    console.log('📚 No existing packages found, starting fresh\n');
  }
}

async function main() {
  console.log('🚀 Starting package scraping...\n');

  await loadExistingPackages();

  const scrapedData: ScrapedData = {
    claude: [],
    cursor: [],
    mcp: [],
  };

  // Scrape all types
  scrapedData.claude = await scrapeClaudePrompts();
  scrapedData.cursor = await scrapeCursorRules();
  scrapedData.mcp = await scrapeMCPServers();

  // Save to file
  const outputPath = path.join(__dirname, '../../scraped-packages-additional.json');
  await fs.writeFile(outputPath, JSON.stringify(scrapedData, null, 2));

  console.log('\n📊 Scraping Summary:');
  console.log(`   Claude packages: ${scrapedData.claude.length}`);
  console.log(`   Cursor packages: ${scrapedData.cursor.length}`);
  console.log(`   MCP packages: ${scrapedData.mcp.length}`);
  console.log(`   Total: ${scrapedData.claude.length + scrapedData.cursor.length + scrapedData.mcp.length}`);
  console.log(`\n✅ Saved to: ${outputPath}`);
}

main().catch(console.error);
