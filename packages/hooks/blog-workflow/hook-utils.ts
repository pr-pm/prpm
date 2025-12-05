/**
 * Utility functions for blog workflow enforcement
 */

/**
 * Detect if user is asking about blog-related work
 */
export function isBlogRelatedPrompt(prompt: string): boolean {
  const blogKeywords = [
    'blog post',
    'blog',
    'article',
    'write post',
    'writing post',
    'sitemap',
    'publish post',
    'publishing post'
  ];

  const lowerPrompt = prompt.toLowerCase();
  return blogKeywords.some(keyword => lowerPrompt.includes(keyword));
}

/**
 * Detect if user is requesting to write/create blog content
 */
export function isWritingBlogContent(prompt: string): boolean {
  const writingKeywords = [
    'write a blog',
    'write blog',
    'create blog',
    'create a blog',
    'draft blog',
    'draft a blog',
    'new blog post',
    'blog post about'
  ];

  const lowerPrompt = prompt.toLowerCase();
  return writingKeywords.some(keyword => lowerPrompt.includes(keyword));
}

/**
 * Detect if user is asking about sitemap updates
 */
export function isSitemapRelated(prompt: string): boolean {
  return prompt.toLowerCase().includes('sitemap');
}

/**
 * Generate blog writing requirements reminder
 */
export function getBlogWritingReminders(): string[] {
  return [
    '📝 BLOG POST WRITING REQUIREMENTS:',
    '',
    '⚠️ MANDATORY: You MUST use the following for blog posts:',
    '',
    '1. prpm-blog-writer agent:',
    '   - Ensures consistent PRPM blog structure',
    '   - Applies proper tone and formatting',
    '   - Includes required sections',
    '   ',
    '2. human-writing skill:',
    '   - Eliminates AI-generated patterns',
    '   - Makes content sound natural and authentic',
    '   - Avoids corporate speak and generic phrasing',
    '',
    '3. After publishing:',
    '   - Update docs/sitemap.xml with new post URL',
    '   - Verify all links work',
    '   - Check blog index is updated',
    '',
    '❌ DO NOT write blog posts without using these tools!',
    '✅ USE: Invoke prpm-blog-writer agent AND apply human-writing skill'
  ];
}

/**
 * Generate sitemap update reminders
 */
export function getSitemapReminders(): string[] {
  return [
    '📝 SITEMAP UPDATE CHECKLIST:',
    '',
    '1. Add new blog post URL to docs/sitemap.xml:',
    '   <url>',
    '     <loc>https://prpm.dev/blog/your-post-slug</loc>',
    '     <lastmod>YYYY-MM-DD</lastmod>',
    '     <changefreq>monthly</changefreq>',
    '     <priority>0.8</priority>',
    '   </url>',
    '',
    '2. Update lastmod date for blog index if changed',
    '',
    '3. Validate sitemap:',
    '   - Check XML syntax is valid',
    '   - Verify all URLs are accessible',
    '   - Ensure dates are in YYYY-MM-DD format',
    '',
    '4. Test sitemap:',
    '   - Visit https://prpm.dev/sitemap.xml',
    '   - Use Google Search Console sitemap validator'
  ];
}

/**
 * Build enhanced context for blog writing
 */
export function buildBlogContext(): string {
  return `
BLOG WRITING CONTEXT:

You are being asked to write blog content for PRPM. This requires specific tools and workflows:

REQUIRED TOOLS:
1. prpm-blog-writer agent - For consistent structure and tone
2. human-writing skill - For natural, authentic voice

WORKFLOW:
1. Use prpm-blog-writer agent to draft the post
2. Apply human-writing skill to eliminate AI patterns
3. Include code examples and practical use cases
4. Link to relevant documentation
5. After publishing, update sitemap.xml

WHY THIS MATTERS:
- PRPM blog posts follow a specific structure and tone
- AI-generated content is immediately noticeable and hurts credibility
- Consistent quality maintains reader trust
- Proper sitemap updates ensure SEO and discoverability

DO NOT proceed with blog writing without using these tools!
`.trim();
}
