/**
 * Utility functions for development workflow enforcement
 */

import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Check if working in PRPM repository
 */
export function isPrpmRepository(workingDirectory: string): boolean {
  const indicators = [
    'packages/cli',
    'public-documentation',
    '.claude/skills/prpm-development'
  ];

  return indicators.some(path => existsSync(join(workingDirectory, path)));
}

/**
 * Detect what type of work is being done based on git branch and context
 */
export function detectWorkType(gitBranch?: string): {
  isCLIWork: boolean;
  isDocsWork: boolean;
  isBlogWork: boolean;
  isSkillWork: boolean;
} {
  if (!gitBranch) {
    return {
      isCLIWork: false,
      isDocsWork: false,
      isBlogWork: false,
      isSkillWork: false
    };
  }

  const branchLower = gitBranch.toLowerCase();

  return {
    isCLIWork: branchLower.includes('cli') ||
               branchLower.includes('command') ||
               branchLower.includes('publish') ||
               branchLower.includes('install') ||
               branchLower.includes('feature'),
    isDocsWork: branchLower.includes('docs') ||
                branchLower.includes('documentation'),
    isBlogWork: branchLower.includes('blog') ||
                branchLower.includes('post'),
    isSkillWork: branchLower.includes('skill') ||
                 branchLower.includes('agent') ||
                 branchLower.includes('hook')
  };
}

/**
 * Generate reminders for CLI work
 */
export function getCLIWorkReminders(): string[] {
  return [
    '📝 CLI FEATURE WORKFLOW CHECKLIST:',
    '',
    '1. Public Documentation:',
    '   - Update relevant .mdx files in public-documentation/',
    '   - Add examples to guides if applicable',
    '   - Update CLI reference if commands changed',
    '',
    '2. Skills Documentation:',
    '   - Check if prpm-development skill needs updates',
    '   - Update prpm-json-best-practices if manifest changed',
    '   - Update any format-specific skills if affected',
    '',
    '3. Schema Updates:',
    '   - Update prpm-manifest.schema.json if manifest fields changed',
    '   - Validate schema changes with test fixtures',
    '',
    '4. Testing:',
    '   - Add/update tests for new features',
    '   - Run full test suite before committing',
    '',
    '⚠️ IMPORTANT: Documentation and skills should be updated BEFORE or WITH code changes, not after!'
  ];
}

/**
 * Generate reminders for blog work
 */
export function getBlogWorkReminders(): string[] {
  return [
    '📝 BLOG POST WORKFLOW CHECKLIST:',
    '',
    '1. Writing Process:',
    '   - Use the prpm-blog-writer agent for consistent structure',
    '   - Apply human-writing skill to avoid AI-generated patterns',
    '   - Follow PRPM blog post template and tone',
    '',
    '2. Technical Depth:',
    '   - Include code examples with proper syntax highlighting',
    '   - Add real-world use cases and practical examples',
    '   - Link to relevant documentation',
    '',
    '3. After Publishing:',
    '   - Update docs/sitemap.xml with new blog post URL',
    '   - Update blog index if not automated',
    '   - Check all internal links work',
    '',
    '⚠️ REQUIRED: Always use prpm-blog-writer agent AND human-writing skill for blog posts!'
  ];
}

/**
 * Generate reminders for documentation work
 */
export function getDocsWorkReminders(): string[] {
  return [
    '📝 DOCUMENTATION WORKFLOW CHECKLIST:',
    '',
    '1. Structure:',
    '   - Follow documentation-standards skill guidelines',
    '   - Use consistent MDX formatting',
    '   - Add proper frontmatter metadata',
    '',
    '2. Content:',
    '   - Include practical examples',
    '   - Add code snippets with explanations',
    '   - Link to related documentation',
    '',
    '3. Navigation:',
    '   - Update mint.json if adding new pages',
    '   - Ensure proper page ordering',
    '   - Verify all links work',
    '',
    '4. Cross-Reference:',
    '   - Check if related skills need updates',
    '   - Update CLI help text if needed',
    '   - Keep README.md in sync with docs'
  ];
}

/**
 * Generate reminders for skill work
 */
export function getSkillWorkReminders(): string[] {
  return [
    '📝 SKILL DEVELOPMENT WORKFLOW CHECKLIST:',
    '',
    '1. Skill Structure:',
    '   - Follow creating-skills best practices',
    '   - Include clear examples and use cases',
    '   - Add proper YAML frontmatter',
    '',
    '2. Documentation:',
    '   - Add skill to relevant guides in public-documentation/',
    '   - Update skills index if maintained',
    '   - Include installation instructions',
    '',
    '3. Testing:',
    '   - Test skill with actual scenarios',
    '   - Verify CSO (Claude Skills Optimization)',
    '   - Check skill discovery and searchability',
    '',
    '4. Publishing:',
    '   - Add to prpm.json packages array',
    '   - Set appropriate tags and metadata',
    '   - Test with prpm install before publishing'
  ];
}

/**
 * Build context string with development guidelines
 */
export function buildDevelopmentContext(workType: ReturnType<typeof detectWorkType>): string {
  const contexts: string[] = [];

  contexts.push('You are working in the PRPM repository.');
  contexts.push('');

  if (workType.isCLIWork) {
    contexts.push('IMPORTANT: This appears to be CLI/feature work.');
    contexts.push('Remember to update:');
    contexts.push('- public-documentation/ with new feature docs');
    contexts.push('- Relevant skills (prpm-development, prpm-json-best-practices, etc.)');
    contexts.push('- JSON schemas if manifest changed');
    contexts.push('');
  }

  if (workType.isBlogWork) {
    contexts.push('IMPORTANT: This appears to be blog post work.');
    contexts.push('Requirements:');
    contexts.push('- MUST use prpm-blog-writer agent');
    contexts.push('- MUST apply human-writing skill');
    contexts.push('- MUST update sitemap after publishing');
    contexts.push('');
  }

  if (workType.isDocsWork) {
    contexts.push('IMPORTANT: This appears to be documentation work.');
    contexts.push('Remember to:');
    contexts.push('- Follow documentation-standards skill');
    contexts.push('- Update mint.json navigation if adding pages');
    contexts.push('- Keep related skills in sync');
    contexts.push('');
  }

  if (workType.isSkillWork) {
    contexts.push('IMPORTANT: This appears to be skill development work.');
    contexts.push('Remember to:');
    contexts.push('- Follow creating-skills best practices');
    contexts.push('- Add documentation to public-documentation/');
    contexts.push('- Test before publishing');
    contexts.push('');
  }

  return contexts.join('\n');
}
