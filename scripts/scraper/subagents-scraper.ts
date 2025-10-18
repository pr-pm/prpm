/**
 * Subagents.cc Scraper
 * Note: This scraper uses web scraping which may break if the site structure changes
 * Consider reaching out to the site owner for API access
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

interface SubagentData {
  name: string;
  description: string;
  content: string;
  category: string;
  downloads?: number;
  author: string;
  sourceUrl: string;
  tags: string[];
}

/**
 * Note: This is a placeholder implementation
 *
 * The actual implementation would require:
 * 1. Web scraping library (puppeteer, playwright, or cheerio)
 * 2. Analysis of subagents.cc HTML structure
 * 3. Ethical scraping with rate limiting
 *
 * Alternative approach: Contact subagents.cc owner for:
 * - API access
 * - Data export
 * - Partnership/integration
 */

async function scrapeSubagents(): Promise<SubagentData[]> {
  console.log('🔍 Scraping subagents.cc...');
  console.log('');
  console.log('⚠️  Note: This requires web scraping implementation');
  console.log('');
  console.log('Recommended approaches:');
  console.log('1. Contact site owner for API access or data export');
  console.log('2. Implement web scraping with puppeteer/playwright');
  console.log('3. Manual curation of top agents');
  console.log('');
  console.log('Based on web research, known agents include:');
  console.log('- Frontend Developer (Engineering, 656 downloads)');
  console.log('- Backend Architect (Engineering, 496 downloads)');
  console.log('- UI Designer (Design, 489 downloads)');
  console.log('- Code Reviewer (Code Review, 384 downloads)');
  console.log('- Debugger (Debugging, 287 downloads)');
  console.log('- UX Researcher (Design, 240 downloads)');
  console.log('');

  // Manual dataset based on research
  const knownAgents: SubagentData[] = [
    {
      name: 'frontend-developer-subagents',
      description: 'Use this agent when building user interfaces, implementing React/Vue/Angular components, and creating interactive web applications.',
      content: generateAgentContent('Frontend Developer', 'Expert in building modern user interfaces with React, Vue, and Angular. Focuses on component architecture, state management, and responsive design.'),
      category: 'Engineering',
      downloads: 656,
      author: 'Michael Galpert',
      sourceUrl: 'https://subagents.cc/',
      tags: ['frontend', 'react', 'vue', 'angular', 'javascript', 'typescript', 'ui'],
    },
    {
      name: 'backend-architect-subagents',
      description: 'Use this agent when designing APIs, building server-side logic, implementing databases, and creating scalable backend systems.',
      content: generateAgentContent('Backend Architect', 'Expert in designing and implementing scalable backend systems. Specializes in API design, database architecture, and microservices.'),
      category: 'Engineering',
      downloads: 496,
      author: 'Michael Galpert',
      sourceUrl: 'https://subagents.cc/',
      tags: ['backend', 'api', 'database', 'architecture', 'microservices', 'scalability'],
    },
    {
      name: 'ui-designer-subagents',
      description: 'Use this agent when creating user interfaces, designing components, building design systems, and ensuring visual consistency.',
      content: generateAgentContent('UI Designer', 'Expert in creating beautiful and functional user interfaces. Specializes in design systems, component libraries, and visual design.'),
      category: 'Design',
      downloads: 489,
      author: 'Michael Galpert',
      sourceUrl: 'https://subagents.cc/',
      tags: ['ui', 'design', 'design-system', 'components', 'visual-design'],
    },
    {
      name: 'code-reviewer-subagents',
      description: 'Expert code review specialist. Proactively reviews code for quality, security, and maintainability.',
      content: generateAgentContent('Code Reviewer', 'Expert in reviewing code for quality, security vulnerabilities, and best practices. Provides constructive feedback and improvement suggestions.'),
      category: 'Code Review',
      downloads: 384,
      author: 'Anand Tyagi',
      sourceUrl: 'https://subagents.cc/',
      tags: ['code-review', 'quality', 'security', 'best-practices', 'refactoring'],
    },
    {
      name: 'debugger-subagents',
      description: 'Debugging specialist for errors, test failures, and unexpected behavior.',
      content: generateAgentContent('Debugger', 'Expert in debugging complex issues, analyzing stack traces, and identifying root causes. Specializes in systematic debugging approaches.'),
      category: 'Debugging',
      downloads: 287,
      author: 'Anand Tyagi',
      sourceUrl: 'https://subagents.cc/',
      tags: ['debugging', 'troubleshooting', 'errors', 'testing', 'diagnostics'],
    },
    {
      name: 'ux-researcher-subagents',
      description: 'Use this agent when conducting user research, analyzing user behavior, creating journey maps, and improving user experience.',
      content: generateAgentContent('UX Researcher', 'Expert in user research methodologies, user behavior analysis, and UX strategy. Focuses on understanding user needs and improving experiences.'),
      category: 'Design',
      downloads: 240,
      author: 'Michael Galpert',
      sourceUrl: 'https://subagents.cc/',
      tags: ['ux', 'research', 'user-testing', 'journey-maps', 'personas'],
    },
  ];

  return knownAgents;
}

/**
 * Generate agent content in .clinerules format
 */
function generateAgentContent(title: string, description: string): string {
  return `# ${title}

${description}

## Role and Expertise

You are a specialized ${title} with deep expertise in your domain. You provide expert guidance, best practices, and actionable recommendations.

## Guidelines

1. **Be Specific**: Provide concrete, actionable advice
2. **Be Thorough**: Cover all important aspects
3. **Be Current**: Use modern best practices and tools
4. **Be Clear**: Explain complex concepts in simple terms
5. **Be Helpful**: Focus on solving the user's problem

## Communication Style

- Direct and professional
- Technical but accessible
- Example-driven when appropriate
- Proactive in identifying issues

## Key Responsibilities

- Analyze requirements and constraints
- Provide expert recommendations
- Explain trade-offs and alternatives
- Share best practices and patterns
- Help troubleshoot issues
`;
}

/**
 * Main function
 */
async function main() {
  console.log('🕷️  Subagents.cc Scraper\n');

  const agents = await scrapeSubagents();

  if (agents.length === 0) {
    console.log('⚠️  No agents scraped. See implementation notes above.');
    return;
  }

  // Save to JSON
  const outputDir = join(process.cwd(), 'scripts', 'scraped');
  await mkdir(outputDir, { recursive: true });

  const outputPath = join(outputDir, 'subagents.json');
  await writeFile(outputPath, JSON.stringify(agents, null, 2));

  console.log(`✅ Saved ${agents.length} agents to: ${outputPath}`);
  console.log('');
  console.log('📊 Stats:');
  console.log(`   Total agents: ${agents.length}`);
  console.log(`   Categories: ${new Set(agents.map(a => a.category)).size}`);
  console.log(`   Authors: ${new Set(agents.map(a => a.author)).size}`);
  console.log('');
  console.log('💡 Next steps:');
  console.log('   1. Consider contacting subagents.cc for partnership');
  console.log('   2. Implement proper web scraping if needed');
  console.log('   3. Get permission before large-scale scraping');
}

main().catch(console.error);
