/**
 * Blog Workflow Hook
 *
 * Enforces use of prpm-blog-writer agent and human-writing skill for blog posts.
 * Reminds about sitemap updates after publishing.
 */

import { readFileSync } from 'fs';
import {
  isBlogRelatedPrompt,
  isWritingBlogContent,
  isSitemapRelated,
  getBlogWritingReminders,
  getSitemapReminders,
  buildBlogContext
} from './hook-utils';

/**
 * Read hook input from stdin
 */
function readStdin(): any {
  try {
    const input = readFileSync(0, 'utf-8');
    return JSON.parse(input);
  } catch {
    return {};
  }
}

/**
 * Exit with code
 */
function exitHook(code: number): never {
  process.exit(code);
}

/**
 * Main hook execution
 */
async function main() {
  try {
    const input = readStdin();
    const userPrompt = input.userPrompt || input.prompt || '';

    // Check if this is blog-related work
    if (!isBlogRelatedPrompt(userPrompt)) {
      exitHook(0);
    }

    const reminders: string[] = [];
    let additionalContext = '';

    // User is writing blog content - enforce agent and skill usage
    if (isWritingBlogContent(userPrompt)) {
      reminders.push(...getBlogWritingReminders());
      additionalContext = buildBlogContext();

      // Output warnings and context
      if (additionalContext) {
        console.error('\n' + additionalContext + '\n');
      }

      if (reminders.length > 0) {
        console.error('\n' + reminders.join('\n') + '\n');
      }

      console.error('\n⚠️ IMPORTANT: Use prpm-blog-writer agent AND human-writing skill for this blog post.\n');

      exitHook(0);
    }

    // User is working on sitemap
    if (isSitemapRelated(userPrompt)) {
      reminders.push(...getSitemapReminders());

      if (reminders.length > 0) {
        console.error('\n' + reminders.join('\n') + '\n');
      }

      exitHook(0);
    }

    // General blog-related work - provide basic reminders
    reminders.push(
      '📝 BLOG WORKFLOW REMINDERS:',
      '',
      '- Writing blog posts? Use prpm-blog-writer agent + human-writing skill',
      '- Published a post? Update sitemap.xml',
      '- Editing existing post? Maintain consistent tone and structure',
      '- All blog posts should include code examples and practical use cases'
    );

    if (reminders.length > 0) {
      console.error('\n' + reminders.join('\n') + '\n');
    }

    exitHook(0);
  } catch (error) {
    // Don't block if hook fails
    console.error('Blog workflow hook error:', error);
    exitHook(0);
  }
}

// Run the hook
main();
