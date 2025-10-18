/**
 * Claude Agents Scraper
 * Scrapes Claude agents from multiple sources
 */

import { Octokit } from '@octokit/rest';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

interface ScrapedAgent {
  name: string;
  description: string;
  content: string;
  source: string;
  sourceUrl: string;
  author: string;
  category?: string;
  downloads?: number;
  tags: string[];
  type: 'claude' | 'claude-skill';
}

/**
 * Scrape from valllabh/claude-agents repository
 */
async function scrapeVallabhAgents(octokit: Octokit): Promise<ScrapedAgent[]> {
  console.log('🔍 Scraping valllabh/claude-agents...');

  const agents: ScrapedAgent[] = [];
  const owner = 'valllabh';
  const repo = 'claude-agents';

  try {
    // Get repository contents
    const { data: contents } = await octokit.repos.getContent({
      owner,
      repo,
      path: 'claude/agents',
    });

    if (!Array.isArray(contents)) {
      return agents;
    }

    // Filter .md files
    const agentFiles = contents.filter(file => file.name.endsWith('.md'));

    console.log(`   Found ${agentFiles.length} agent files`);

    for (const file of agentFiles) {
      try {
        // Get file content
        const { data: fileData } = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path,
        });

        if ('content' in fileData) {
          const content = Buffer.from(fileData.content, 'base64').toString('utf-8');

          // Extract agent name from filename
          const agentName = file.name.replace('.md', '').toLowerCase();

          // Extract description from content (first non-empty line after title)
          const lines = content.split('\n').filter(l => l.trim());
          let description = '';
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].startsWith('#') && lines[i].length > 20) {
              description = lines[i].trim();
              break;
            }
          }

          // Extract tags from content
          const tags = extractTags(content, agentName);

          agents.push({
            name: `${agentName}-valllabh`,
            description: description || `${agentName} agent for Claude`,
            content,
            source: 'valllabh/claude-agents',
            sourceUrl: fileData.html_url || '',
            author: 'valllabh',
            tags,
            type: 'claude',
          });

          console.log(`   ✓ Extracted ${agentName}`);
        }
      } catch (error) {
        console.error(`   ✗ Failed to fetch ${file.name}:`, error);
      }

      // Rate limiting
      await sleep(100);
    }
  } catch (error) {
    console.error('Failed to scrape valllabh/claude-agents:', error);
  }

  return agents;
}

/**
 * Scrape from wshobson/agents repository
 */
async function scrapeWshobsonAgents(octokit: Octokit): Promise<ScrapedAgent[]> {
  console.log('🔍 Scraping wshobson/agents...');

  const agents: ScrapedAgent[] = [];
  const owner = 'wshobson';
  const repo = 'agents';

  try {
    // Get repository contents (plugins directory)
    const { data: contents } = await octokit.repos.getContent({
      owner,
      repo,
      path: 'plugins',
    });

    if (!Array.isArray(contents)) {
      return agents;
    }

    console.log(`   Found ${contents.length} plugin directories`);

    // Process each plugin directory
    for (const plugin of contents.filter(f => f.type === 'dir')) {
      try {
        // Check if plugin has agents subdirectory
        const { data: pluginContents } = await octokit.repos.getContent({
          owner,
          repo,
          path: plugin.path,
        });

        if (!Array.isArray(pluginContents)) {
          continue;
        }

        const agentsDir = pluginContents.find(f => f.name === 'agents' && f.type === 'dir');

        if (!agentsDir) {
          continue;
        }

        // Get agents in this plugin
        const { data: agentFiles } = await octokit.repos.getContent({
          owner,
          repo,
          path: agentsDir.path,
        });

        if (!Array.isArray(agentFiles)) {
          continue;
        }

        // Process each agent file
        for (const file of agentFiles.filter(f => f.name.endsWith('.md'))) {
          try {
            const { data: fileData } = await octokit.repos.getContent({
              owner,
              repo,
              path: file.path,
            });

            if ('content' in fileData) {
              const content = Buffer.from(fileData.content, 'base64').toString('utf-8');

              const agentName = file.name.replace('.md', '').toLowerCase();
              const category = plugin.name;

              // Extract description
              const lines = content.split('\n').filter(l => l.trim());
              let description = '';
              for (let i = 0; i < lines.length; i++) {
                if (!lines[i].startsWith('#') && lines[i].length > 20) {
                  description = lines[i].trim();
                  break;
                }
              }

              const tags = extractTags(content, agentName);
              tags.push(category);

              agents.push({
                name: `${agentName}-${category}-wshobson`,
                description: description || `${agentName} agent for ${category}`,
                content,
                source: 'wshobson/agents',
                sourceUrl: fileData.html_url || '',
                author: 'wshobson',
                category,
                tags,
                type: 'claude',
              });

              console.log(`   ✓ Extracted ${category}/${agentName}`);
            }
          } catch (error) {
            console.error(`   ✗ Failed to fetch ${file.name}:`, error);
          }

          await sleep(100);
        }
      } catch (error) {
        console.error(`   ✗ Failed to process plugin ${plugin.name}:`, error);
      }

      await sleep(200);
    }
  } catch (error) {
    console.error('Failed to scrape wshobson/agents:', error);
  }

  return agents;
}

/**
 * Extract tags from content
 */
function extractTags(content: string, agentName: string): string[] {
  const tags = new Set<string>();

  // Add agent name components as tags
  agentName.split(/[-_]/).forEach(part => {
    if (part.length > 2) {
      tags.add(part.toLowerCase());
    }
  });

  // Common keywords to look for
  const keywords = [
    'react', 'vue', 'angular', 'typescript', 'javascript', 'python', 'java',
    'backend', 'frontend', 'fullstack', 'api', 'database', 'sql', 'nosql',
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'devops', 'ci/cd',
    'security', 'testing', 'debugging', 'review', 'architecture',
    'design', 'ux', 'ui', 'product', 'agile', 'scrum',
  ];

  const lowerContent = content.toLowerCase();
  keywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      tags.add(keyword);
    }
  });

  // Limit to top 10 tags
  return Array.from(tags).slice(0, 10);
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main scraper function
 */
async function main() {
  console.log('🕷️  Starting Claude Agents scraper...\n');

  if (!GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable required');
    console.error('   Get token from: https://github.com/settings/tokens');
    process.exit(1);
  }

  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  // Scrape all sources
  const allAgents: ScrapedAgent[] = [];

  // Source 1: valllabh/claude-agents
  const vallabhAgents = await scrapeVallabhAgents(octokit);
  allAgents.push(...vallabhAgents);

  console.log('');

  // Source 2: wshobson/agents
  const wshobsonAgents = await scrapeWshobsonAgents(octokit);
  allAgents.push(...wshobsonAgents);

  console.log('');
  console.log('='.repeat(60));
  console.log('✅ Scraping complete!');
  console.log('='.repeat(60));
  console.log(`   Scraped ${allAgents.length} agents`);
  console.log(`   - valllabh/claude-agents: ${vallabhAgents.length}`);
  console.log(`   - wshobson/agents: ${wshobsonAgents.length}`);
  console.log('');

  // Save to JSON
  const outputDir = join(process.cwd(), 'scripts', 'scraped');
  await mkdir(outputDir, { recursive: true });

  const outputPath = join(outputDir, 'claude-agents.json');
  await writeFile(outputPath, JSON.stringify(allAgents, null, 2));

  console.log(`💾 Saved to: ${outputPath}`);
  console.log('');

  // Stats
  const stats = {
    total: allAgents.length,
    bySour ce: {
      'valllabh/claude-agents': vallabhAgents.length,
      'wshobson/agents': wshobsonAgents.length,
    },
    topTags: getTopTags(allAgents, 10),
    topAuthors: getTopAuthors(allAgents),
  };

  console.log('📊 Stats:');
  console.log(`   Total agents: ${stats.total}`);
  console.log(`   Top tags: ${stats.topTags.join(', ')}`);
  console.log(`   Authors: ${stats.topAuthors.join(', ')}`);
  console.log('');
}

/**
 * Get top tags
 */
function getTopTags(agents: ScrapedAgent[], limit: number): string[] {
  const tagCounts = new Map<string, number>();

  agents.forEach(agent => {
    agent.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

/**
 * Get top authors
 */
function getTopAuthors(agents: ScrapedAgent[]): string[] {
  const authors = new Set(agents.map(a => a.author));
  return Array.from(authors);
}

// Run scraper
main().catch(console.error);
