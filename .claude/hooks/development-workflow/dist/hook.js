#!/usr/bin/env node
"use strict";

// ../../.claude/hooks/development-workflow/src/hook.ts
var import_fs2 = require("fs");

// ../../.claude/hooks/development-workflow/src/hook-utils.ts
var import_fs = require("fs");
var import_path = require("path");
function isPrpmRepository(workingDirectory) {
  const indicators = [
    "packages/cli",
    "public-documentation",
    ".claude/skills/prpm-development"
  ];
  return indicators.some((path) => (0, import_fs.existsSync)((0, import_path.join)(workingDirectory, path)));
}
function detectWorkType(gitBranch) {
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
    isCLIWork: branchLower.includes("cli") || branchLower.includes("command") || branchLower.includes("publish") || branchLower.includes("install") || branchLower.includes("feature"),
    isDocsWork: branchLower.includes("docs") || branchLower.includes("documentation"),
    isBlogWork: branchLower.includes("blog") || branchLower.includes("post"),
    isSkillWork: branchLower.includes("skill") || branchLower.includes("agent") || branchLower.includes("hook")
  };
}
function getCLIWorkReminders() {
  return [
    "\u{1F4DD} CLI FEATURE WORKFLOW CHECKLIST:",
    "",
    "1. Public Documentation:",
    "   - Update relevant .mdx files in public-documentation/",
    "   - Add examples to guides if applicable",
    "   - Update CLI reference if commands changed",
    "",
    "2. Skills Documentation:",
    "   - Check if prpm-development skill needs updates",
    "   - Update prpm-json-best-practices if manifest changed",
    "   - Update any format-specific skills if affected",
    "",
    "3. Schema Updates:",
    "   - Update prpm-manifest.schema.json if manifest fields changed",
    "   - Validate schema changes with test fixtures",
    "",
    "4. Testing:",
    "   - Add/update tests for new features",
    "   - Run full test suite before committing",
    "",
    "\u26A0\uFE0F IMPORTANT: Documentation and skills should be updated BEFORE or WITH code changes, not after!"
  ];
}
function getBlogWorkReminders() {
  return [
    "\u{1F4DD} BLOG POST WORKFLOW CHECKLIST:",
    "",
    "1. Writing Process:",
    "   - Use the prpm-blog-writer agent for consistent structure",
    "   - Apply human-writing skill to avoid AI-generated patterns",
    "   - Follow PRPM blog post template and tone",
    "",
    "2. Technical Depth:",
    "   - Include code examples with proper syntax highlighting",
    "   - Add real-world use cases and practical examples",
    "   - Link to relevant documentation",
    "",
    "3. After Publishing:",
    "   - Update docs/sitemap.xml with new blog post URL",
    "   - Update blog index if not automated",
    "   - Check all internal links work",
    "",
    "\u26A0\uFE0F REQUIRED: Always use prpm-blog-writer agent AND human-writing skill for blog posts!"
  ];
}
function getDocsWorkReminders() {
  return [
    "\u{1F4DD} DOCUMENTATION WORKFLOW CHECKLIST:",
    "",
    "1. Structure:",
    "   - Follow documentation-standards skill guidelines",
    "   - Use consistent MDX formatting",
    "   - Add proper frontmatter metadata",
    "",
    "2. Content:",
    "   - Include practical examples",
    "   - Add code snippets with explanations",
    "   - Link to related documentation",
    "",
    "3. Navigation:",
    "   - Update mint.json if adding new pages",
    "   - Ensure proper page ordering",
    "   - Verify all links work",
    "",
    "4. Cross-Reference:",
    "   - Check if related skills need updates",
    "   - Update CLI help text if needed",
    "   - Keep README.md in sync with docs"
  ];
}
function getSkillWorkReminders() {
  return [
    "\u{1F4DD} SKILL DEVELOPMENT WORKFLOW CHECKLIST:",
    "",
    "1. Skill Structure:",
    "   - Follow creating-skills best practices",
    "   - Include clear examples and use cases",
    "   - Add proper YAML frontmatter",
    "",
    "2. Documentation:",
    "   - Add skill to relevant guides in public-documentation/",
    "   - Update skills index if maintained",
    "   - Include installation instructions",
    "",
    "3. Testing:",
    "   - Test skill with actual scenarios",
    "   - Verify CSO (Claude Skills Optimization)",
    "   - Check skill discovery and searchability",
    "",
    "4. Publishing:",
    "   - Add to prpm.json packages array",
    "   - Set appropriate tags and metadata",
    "   - Test with prpm install before publishing"
  ];
}
function buildDevelopmentContext(workType) {
  const contexts = [];
  contexts.push("You are working in the PRPM repository.");
  contexts.push("");
  if (workType.isCLIWork) {
    contexts.push("IMPORTANT: This appears to be CLI/feature work.");
    contexts.push("Remember to update:");
    contexts.push("- public-documentation/ with new feature docs");
    contexts.push("- Relevant skills (prpm-development, prpm-json-best-practices, etc.)");
    contexts.push("- JSON schemas if manifest changed");
    contexts.push("");
  }
  if (workType.isBlogWork) {
    contexts.push("IMPORTANT: This appears to be blog post work.");
    contexts.push("Requirements:");
    contexts.push("- MUST use prpm-blog-writer agent");
    contexts.push("- MUST apply human-writing skill");
    contexts.push("- MUST update sitemap after publishing");
    contexts.push("");
  }
  if (workType.isDocsWork) {
    contexts.push("IMPORTANT: This appears to be documentation work.");
    contexts.push("Remember to:");
    contexts.push("- Follow documentation-standards skill");
    contexts.push("- Update mint.json navigation if adding pages");
    contexts.push("- Keep related skills in sync");
    contexts.push("");
  }
  if (workType.isSkillWork) {
    contexts.push("IMPORTANT: This appears to be skill development work.");
    contexts.push("Remember to:");
    contexts.push("- Follow creating-skills best practices");
    contexts.push("- Add documentation to public-documentation/");
    contexts.push("- Test before publishing");
    contexts.push("");
  }
  return contexts.join("\n");
}

// ../../.claude/hooks/development-workflow/src/hook.ts
function readStdin() {
  try {
    const input = (0, import_fs2.readFileSync)(0, "utf-8");
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
    const workingDirectory = input.workingDirectory || process.cwd();
    const gitBranch = input.gitBranch;
    if (!isPrpmRepository(workingDirectory)) {
      exitHook(0);
    }
    const workType = detectWorkType(gitBranch);
    const reminders = [];
    if (workType.isCLIWork) {
      reminders.push(...getCLIWorkReminders());
    }
    if (workType.isBlogWork) {
      reminders.push(...getBlogWorkReminders());
    }
    if (workType.isDocsWork) {
      reminders.push(...getDocsWorkReminders());
    }
    if (workType.isSkillWork) {
      reminders.push(...getSkillWorkReminders());
    }
    const additionalContext = buildDevelopmentContext(workType);
    if (!workType.isCLIWork && !workType.isBlogWork && !workType.isDocsWork && !workType.isSkillWork) {
      reminders.push(
        "\u{1F4DD} PRPM DEVELOPMENT GENERAL GUIDELINES:",
        "",
        "- Keep documentation in sync with code changes",
        "- Update relevant skills when features change",
        "- Follow existing patterns and conventions",
        "- Test thoroughly before committing",
        "",
        "Branch naming helps activate specific workflows:",
        "- *-cli-*, *-feature-*, *-command-* \u2192 CLI workflow",
        "- *-blog-*, *-post-* \u2192 Blog workflow",
        "- *-docs-*, *-documentation-* \u2192 Docs workflow",
        "- *-skill-*, *-agent-*, *-hook-* \u2192 Skill workflow"
      );
    }
    if (additionalContext) {
      console.log(additionalContext);
    }
    if (reminders.length > 0) {
      console.error("\n" + reminders.join("\n") + "\n");
    }
    exitHook(0);
  } catch (error) {
    console.error("Development workflow hook error:", error);
    exitHook(0);
  }
}
main();
