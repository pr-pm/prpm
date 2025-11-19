#!/usr/bin/env node
"use strict";

// ../../.claude/hooks/blog-workflow/src/hook.ts
var import_fs = require("fs");

// ../../.claude/hooks/blog-workflow/src/hook-utils.ts
function isBlogRelatedPrompt(prompt) {
  const blogKeywords = [
    "blog post",
    "blog",
    "article",
    "write post",
    "writing post",
    "sitemap",
    "publish post",
    "publishing post"
  ];
  const lowerPrompt = prompt.toLowerCase();
  return blogKeywords.some((keyword) => lowerPrompt.includes(keyword));
}
function isWritingBlogContent(prompt) {
  const writingKeywords = [
    "write a blog",
    "write blog",
    "create blog",
    "create a blog",
    "draft blog",
    "draft a blog",
    "new blog post",
    "blog post about"
  ];
  const lowerPrompt = prompt.toLowerCase();
  return writingKeywords.some((keyword) => lowerPrompt.includes(keyword));
}
function isSitemapRelated(prompt) {
  return prompt.toLowerCase().includes("sitemap");
}
function getBlogWritingReminders() {
  return [
    "\u{1F4DD} BLOG POST WRITING REQUIREMENTS:",
    "",
    "\u26A0\uFE0F MANDATORY: You MUST use the following for blog posts:",
    "",
    "1. prpm-blog-writer agent:",
    "   - Ensures consistent PRPM blog structure",
    "   - Applies proper tone and formatting",
    "   - Includes required sections",
    "   ",
    "2. human-writing skill:",
    "   - Eliminates AI-generated patterns",
    "   - Makes content sound natural and authentic",
    "   - Avoids corporate speak and generic phrasing",
    "",
    "3. After publishing:",
    "   - Update docs/sitemap.xml with new post URL",
    "   - Verify all links work",
    "   - Check blog index is updated",
    "",
    "\u274C DO NOT write blog posts without using these tools!",
    "\u2705 USE: Invoke prpm-blog-writer agent AND apply human-writing skill"
  ];
}
function getSitemapReminders() {
  return [
    "\u{1F4DD} SITEMAP UPDATE CHECKLIST:",
    "",
    "1. Add new blog post URL to docs/sitemap.xml:",
    "   <url>",
    "     <loc>https://prpm.dev/blog/your-post-slug</loc>",
    "     <lastmod>YYYY-MM-DD</lastmod>",
    "     <changefreq>monthly</changefreq>",
    "     <priority>0.8</priority>",
    "   </url>",
    "",
    "2. Update lastmod date for blog index if changed",
    "",
    "3. Validate sitemap:",
    "   - Check XML syntax is valid",
    "   - Verify all URLs are accessible",
    "   - Ensure dates are in YYYY-MM-DD format",
    "",
    "4. Test sitemap:",
    "   - Visit https://prpm.dev/sitemap.xml",
    "   - Use Google Search Console sitemap validator"
  ];
}
function buildBlogContext() {
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

// ../../.claude/hooks/blog-workflow/src/hook.ts
function readStdin() {
  try {
    const input = (0, import_fs.readFileSync)(0, "utf-8");
    return JSON.parse(input);
  } catch {
    return {};
  }
}
function exitHook(code) {
  process.exit(code);
}
async function main() {
  try {
    const input = readStdin();
    const userPrompt = input.userPrompt || input.prompt || "";
    if (!isBlogRelatedPrompt(userPrompt)) {
      exitHook(0);
    }
    const reminders = [];
    let additionalContext = "";
    if (isWritingBlogContent(userPrompt)) {
      reminders.push(...getBlogWritingReminders());
      additionalContext = buildBlogContext();
      if (additionalContext) {
        console.error("\n" + additionalContext + "\n");
      }
      if (reminders.length > 0) {
        console.error("\n" + reminders.join("\n") + "\n");
      }
      console.error("\n\u26A0\uFE0F IMPORTANT: Use prpm-blog-writer agent AND human-writing skill for this blog post.\n");
      exitHook(0);
    }
    if (isSitemapRelated(userPrompt)) {
      reminders.push(...getSitemapReminders());
      if (reminders.length > 0) {
        console.error("\n" + reminders.join("\n") + "\n");
      }
      exitHook(0);
    }
    reminders.push(
      "\u{1F4DD} BLOG WORKFLOW REMINDERS:",
      "",
      "- Writing blog posts? Use prpm-blog-writer agent + human-writing skill",
      "- Published a post? Update sitemap.xml",
      "- Editing existing post? Maintain consistent tone and structure",
      "- All blog posts should include code examples and practical use cases"
    );
    if (reminders.length > 0) {
      console.error("\n" + reminders.join("\n") + "\n");
    }
    exitHook(0);
  } catch (error) {
    console.error("Blog workflow hook error:", error);
    exitHook(0);
  }
}
main();
