import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "JSON Schemas for Every AI Prompt Format - PRPM",
  description: "PRPM ships comprehensive JSON schemas for 15+ AI prompt formats. Get IDE autocomplete, validate in CI/CD, and build tools with confidence.",
  openGraph: {
    title: "JSON Schemas for Every AI Prompt Format",
    description: "Comprehensive schemas for Cursor, Claude, Continue, Windsurf, Copilot, Kiro, and more. Validate prompts before publishing.",
  },
}

export default function JSONSchemasPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Technical', 'Developer Experience', 'Format Specifications']}
          title="JSON Schemas for Every AI Prompt Format"
          subtitle="Get IDE autocomplete, validate in CI/CD, and build tools with confidence—PRPM ships comprehensive schemas for 15+ AI prompt formats."
          author="PRPM Team"
          date="November 28, 2025"
          readTime="10 min read"
        />

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none
          prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
          prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:scroll-mt-20
          prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4 prose-h3:scroll-mt-20
          prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6
          prose-a:text-prpm-accent prose-a:no-underline prose-a:font-medium hover:prose-a:underline
          prose-code:text-prpm-accent prose-code:bg-prpm-dark-card/50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-[0.9em] prose-code:font-mono prose-code:border prose-code:border-prpm-border/30
          prose-pre:bg-prpm-dark-card prose-pre:border prose-pre:border-prpm-border prose-pre:rounded-xl prose-pre:p-6 prose-pre:my-8 prose-pre:overflow-x-auto
          prose-strong:text-white prose-strong:font-semibold
          prose-ul:my-6 prose-ul:space-y-2 prose-ul:text-gray-300
          prose-ol:my-6 prose-ol:space-y-2 prose-ol:text-gray-300
          prose-li:text-gray-300 prose-li:leading-relaxed
          prose-blockquote:border-l-4 prose-blockquote:border-prpm-accent prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-400 prose-blockquote:my-8
          prose-hr:border-prpm-border prose-hr:my-12
        ">
          {/* Intro */}
          <p className="text-gray-300 leading-relaxed mb-8">
            Writing prompt files for AI coding assistants feels like the Wild West. Cursor wants YAML frontmatter with <code>description</code>. Claude needs <code>name</code> and <code>allowed-tools</code>. Windsurf? No frontmatter at all. Make a typo in a field name and your prompt silently breaks.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            As part of building PRPM's universal format converter, we created something the AI coding ecosystem desperately needed: <strong>comprehensive JSON schemas for every major AI prompt format</strong>. These schemas define the structure, required fields, and validation rules for 15+ formats including Cursor, Claude Code, Continue, Windsurf, GitHub Copilot, Kiro, Ruler, and newer tools like Factory Droid, OpenCode, and Trae.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">What Are JSON Schemas?</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            JSON Schema is a vocabulary that lets you annotate and validate JSON (and YAML) documents. Think of it like TypeScript types, but for data files. A schema describes:
          </p>

          <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
            <li>What fields are required vs optional</li>
            <li>Data types (string, number, boolean, array)</li>
            <li>Format constraints (e.g., email addresses, URIs)</li>
            <li>Allowed values (enums)</li>
            <li>Patterns and validation rules</li>
          </ul>

          <p className="text-gray-300 leading-relaxed mb-8">
            For AI prompt formats—which mix YAML frontmatter with Markdown content—schemas provide a source of truth for what makes a valid prompt file.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Why PRPM Built These Schemas</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">1. Format Conversion Requires Precision</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              PRPM converts prompts between 15+ formats. To do that reliably, we need to know exactly what each format expects. Schemas let us:
            </p>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><strong>Validate input:</strong> Catch malformed prompts before conversion</li>
              <li><strong>Validate output:</strong> Ensure conversions produce valid files</li>
              <li><strong>Handle subtypes:</strong> Claude agents vs skills vs slash commands have different requirements</li>
              <li><strong>Preserve metadata:</strong> Know which fields are format-specific vs universal</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              Every converter in <code>@pr-pm/converters</code> uses these schemas for validation.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">2. Publishing Needs Validation</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              When you run <code>prpm publish</code>, the CLI validates your package against the schema for your declared format and subtype. This catches errors before they reach the registry:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8"><code className="text-sm text-gray-300 font-mono">{`$ prpm publish

❌ Validation failed:
  - Missing required field: description
  - /frontmatter/model: must be one of [sonnet, opus, haiku, inherit]
  - /frontmatter/allowed-tools: pattern mismatch

Fix these errors and try again.`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              Clear error messages tell you exactly what's wrong and where.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">3. Documentation Is a First-Class Output</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Schemas aren't just for validation—they're living documentation. Each schema includes:
            </p>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><code>$comment</code> with link to official docs</li>
              <li><code>description</code> fields explaining each property</li>
              <li><code>examples</code> showing real-world usage</li>
              <li>Pattern explanations for complex fields</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              The schemas in <code>packages/converters/schemas/</code> serve as the canonical reference for format specifications.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Practical Use Cases</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">IDE Autocomplete and IntelliSense</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              VS Code (and most modern editors) support YAML Language Server, which uses JSON schemas to provide autocomplete, validation, and hover documentation.
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              Add this to your workspace <code>.vscode/settings.json</code>:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`{
  "yaml.schemas": {
    "https://registry.prpm.dev/api/v1/schemas/cursor.json": ".cursor/rules/*.md",
    "https://registry.prpm.dev/api/v1/schemas/claude/agent.json": ".claude/agents/*.md",
    "https://registry.prpm.dev/api/v1/schemas/claude/skill.json": ".claude/skills/*.md",
    "https://registry.prpm.dev/api/v1/schemas/continue.json": ".continue/rules/*.md"
  }
}`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              Now when you edit Cursor rules or Claude agents, you get:
            </p>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li>Field suggestions as you type frontmatter</li>
              <li>Inline documentation for each field</li>
              <li>Red squiggles for invalid values</li>
              <li>Enum suggestions (e.g., Claude model choices)</li>
            </ul>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">CI/CD Validation</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Add schema validation to your GitHub Actions workflow to catch invalid prompts before they reach production:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`name: Validate Prompts

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install PRPM
        run: npm install -g prpm

      - name: Validate all packages
        run: |
          for dir in packages/*/; do
            cd "$dir"
            prpm validate
            cd ../..
          done`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              The <code>prpm validate</code> command checks your <code>prpm.json</code> manifest and all referenced files against their schemas.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Building Tools on PRPM</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              If you're building tooling around AI prompts—linters, editors, quality analyzers—schemas give you a programmatic way to validate prompt files:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`import { validateMarkdown } from '@pr-pm/converters';

// Validate a Cursor rule file
const cursorRule = readFileSync('.cursor/rules/react.md', 'utf-8');
const result = validateMarkdown('cursor', cursorRule, 'rule');

if (!result.valid) {
  console.error('Validation errors:', result.errors);
  result.errors.forEach(err => {
    console.error(\`  - \${err.message}\`);
  });
  process.exit(1);
}

// Validate a Claude agent with subtype-specific schema
const claudeAgent = readFileSync('.claude/agents/code-reviewer.md', 'utf-8');
const result2 = validateMarkdown('claude', claudeAgent, 'agent');

if (result2.warnings.length > 0) {
  console.warn('Warnings:', result2.warnings);
}`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              The validation API returns structured errors with paths and messages, making it easy to surface issues to users.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Format Conversion with the CLI</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              The PRPM CLI includes a <code>convert</code> command that leverages these schemas to safely convert between formats:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`# Convert a Cursor rule to Claude skill format
$ prpm convert .cursor/rules/react.md --to claude --subtype skill

✅ Validated input (cursor:rule)
✅ Converted to claude:skill
✅ Validated output
📄 Wrote: .claude/skills/react.md

# Convert entire directories
$ prpm convert .cursor/rules/ --to continue --output .continue/rules/

Converting 12 files...
✅ 12/12 files converted successfully
⚠️  2 warnings (optional fields missing)
❌ 0 errors`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              The CLI validates both input and output using the appropriate schemas, catching errors before they reach your filesystem.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Programmatic Conversion with Validation</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              For building tools, use the conversion API which includes built-in schema validation:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`import { convertToFormat, validateFormat } from '@pr-pm/converters';

// Convert Cursor rule to Claude skill
const cursorRule = readFileSync('.cursor/rules/refactoring.md', 'utf-8');

// Validate input
const inputValid = validateMarkdown('cursor', cursorRule, 'rule');
if (!inputValid.valid) {
  throw new Error('Invalid Cursor rule');
}

// Convert
const claudeSkill = convertToFormat(cursorRule, 'cursor', 'claude', 'skill');

// Validate output
const outputValid = validateMarkdown('claude', claudeSkill, 'skill');
if (!outputValid.valid) {
  console.error('Conversion produced invalid Claude skill');
  console.error('This is a converter bug, please report it');
}`}</code></pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Write Once, Publish Everywhere</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              For package publishers, schemas enable a powerful workflow: write your prompt in one format, then publish to all 15+ formats with confidence.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`# Write once in your preferred format (e.g., Claude skill)
$ cat .claude/skills/typescript-best-practices.md

---
name: typescript-best-practices
description: TypeScript coding standards and best practices
---

# TypeScript Best Practices
...

# Publish to PRPM registry (canonical format)
$ prpm publish
✅ Validated against claude:skill schema
✅ Published to registry

# Generate distributions for all formats
$ prpm convert .claude/skills/typescript-best-practices.md --to cursor
$ prpm convert .claude/skills/typescript-best-practices.md --to continue
$ prpm convert .claude/skills/typescript-best-practices.md --to windsurf
$ prpm convert .claude/skills/typescript-best-practices.md --to copilot
# ... 15+ formats supported

# Each conversion is validated against target format's schema
✅ cursor:rule - validated
✅ continue:rule - validated
✅ windsurf:rule - validated
✅ copilot:repository - validated`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              Schemas ensure every converted output is valid for its target format. Users can install your package in any format they prefer:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`# User A (Cursor user)
$ prpm install typescript-best-practices --format cursor
📥 Installed to .cursor/rules/typescript-best-practices.md

# User B (Claude user)
$ prpm install typescript-best-practices --format claude
📥 Installed to .claude/skills/typescript-best-practices.md

# User C (Continue user)
$ prpm install typescript-best-practices --format continue
📥 Installed to .continue/rules/typescript-best-practices.md`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              Behind the scenes, PRPM converts from the canonical format to the requested format and validates the output. Publishers maintain one source, users get their preferred format—all guaranteed valid by schemas.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Schema Coverage</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            PRPM ships schemas for 29 format/subtype combinations across 15+ AI coding tools:
          </p>

          <div className="not-prose mb-8">
            <table className="w-full border-collapse text-gray-300">
              <thead className="border-b-2 border-prpm-border">
                <tr>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Format</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Subtypes</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Schema Files</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Cursor</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">rule, slash-command</td>
                  <td className="px-4 py-4 border border-prpm-border">2 schemas</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Claude Code</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">agent, skill, slash-command, hook</td>
                  <td className="px-4 py-4 border border-prpm-border">5 schemas</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Continue</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">rule</td>
                  <td className="px-4 py-4 border border-prpm-border">1 schema</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Windsurf</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">rule</td>
                  <td className="px-4 py-4 border border-prpm-border">1 schema</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">GitHub Copilot</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">repository, path</td>
                  <td className="px-4 py-4 border border-prpm-border">1 schema</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Kiro</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">steering, hook, agent</td>
                  <td className="px-4 py-4 border border-prpm-border">3 schemas</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Ruler</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">rule</td>
                  <td className="px-4 py-4 border border-prpm-border">1 schema</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Factory Droid</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">skill, slash-command, hook</td>
                  <td className="px-4 py-4 border border-prpm-border">4 schemas</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">OpenCode</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">agent, slash-command</td>
                  <td className="px-4 py-4 border border-prpm-border">3 schemas</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">agents.md</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">agent</td>
                  <td className="px-4 py-4 border border-prpm-border">1 schema</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Trae</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">rule</td>
                  <td className="px-4 py-4 border border-prpm-border">1 schema</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Aider</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">rule</td>
                  <td className="px-4 py-4 border border-prpm-border">1 schema</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Zencoder</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">rule</td>
                  <td className="px-4 py-4 border border-prpm-border">1 schema</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Replit</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">rule</td>
                  <td className="px-4 py-4 border border-prpm-border">1 schema</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Canonical</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">universal format</td>
                  <td className="px-4 py-4 border border-prpm-border">1 schema</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Each schema includes examples, detailed field descriptions, and links to official documentation.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Real Example: Cursor Rules Schema</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Let's look at the Cursor rules schema to see what validation it provides:
          </p>

          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://registry.prpm.dev/api/v1/schemas/cursor.json",
  "$comment": "https://cursor.com/docs/context/rules",
  "title": "Cursor Rules Format",
  "description": "JSON Schema for Cursor .cursor/rules format",
  "type": "object",
  "required": ["frontmatter", "content"],
  "properties": {
    "frontmatter": {
      "type": "object",
      "required": ["description"],
      "properties": {
        "description": {
          "type": "string",
          "description": "Human-readable description (REQUIRED)"
        },
        "globs": {
          "type": "array",
          "description": "File patterns to apply this rule to",
          "items": { "type": "string" }
        },
        "alwaysApply": {
          "type": "boolean",
          "description": "Whether to apply this rule to all files",
          "default": false
        }
      }
    },
    "content": {
      "type": "string",
      "description": "Markdown content following the frontmatter"
    }
  }
}`}</code></pre>

          <p className="text-gray-300 leading-relaxed mb-8">
            This schema enforces:
          </p>

          <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
            <li><strong>Required fields:</strong> <code>description</code> must be present in frontmatter</li>
            <li><strong>Type safety:</strong> <code>globs</code> must be an array of strings, <code>alwaysApply</code> must be boolean</li>
            <li><strong>Structure:</strong> Both <code>frontmatter</code> and <code>content</code> required at top level</li>
            <li><strong>Documentation:</strong> Inline descriptions explain each field's purpose</li>
          </ul>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Advanced: Subtype-Specific Schemas</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Some formats support multiple subtypes with different requirements. Claude Code is a great example:
          </p>

          <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
            <li><strong>Agents:</strong> Need <code>name</code>, <code>description</code>, optional <code>model</code> and <code>allowed-tools</code></li>
            <li><strong>Skills:</strong> Similar to agents but may have different tool restrictions</li>
            <li><strong>Slash commands:</strong> Different frontmatter structure with command-specific fields</li>
            <li><strong>Hooks:</strong> Event-driven, JSON format with different validation rules</li>
          </ul>

          <p className="text-gray-300 leading-relaxed mb-8">
            PRPM provides subtype-specific schemas for stricter validation:
          </p>

          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`// Base Claude schema (general)
https://registry.prpm.dev/api/v1/schemas/claude.json

// Subtype-specific schemas (stricter)
https://registry.prpm.dev/api/v1/schemas/claude/agent.json
https://registry.prpm.dev/api/v1/schemas/claude/skill.json
https://registry.prpm.dev/api/v1/schemas/claude/slash-command.json
https://registry.prpm.dev/api/v1/schemas/claude/hook.json`}</code></pre>

          <p className="text-gray-300 leading-relaxed mb-8">
            The validation API automatically uses the appropriate schema based on format and subtype:
          </p>

          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`// Validates against claude-agent.schema.json
const result = validateMarkdown('claude', content, 'agent');

// Validates against claude-skill.schema.json
const result2 = validateMarkdown('claude', content, 'skill');`}</code></pre>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Accessing the Schemas</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            All schemas are available in three ways:
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">1. Source Repository</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Browse schemas directly in the PRPM repository:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`packages/converters/schemas/
├── cursor.schema.json
├── cursor-command.schema.json
├── claude.schema.json
├── claude-agent.schema.json
├── claude-skill.schema.json
├── claude-slash-command.schema.json
├── claude-hook.schema.json
├── continue.schema.json
├── windsurf.schema.json
├── copilot.schema.json
├── kiro-steering.schema.json
├── kiro-hook.schema.json
├── kiro-agent.schema.json
├── ruler.schema.json
├── droid.schema.json
├── droid-skill.schema.json
├── droid-slash-command.schema.json
├── droid-hook.schema.json
├── opencode.schema.json
├── opencode-slash-command.schema.json
├── agents-md.schema.json
├── trae.schema.json
├── aider.schema.json
├── zencoder.schema.json
├── replit.schema.json
├── gemini.schema.json
├── gemini-md.schema.json
└── canonical.schema.json`}</code></pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">2. Registry API</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Access schemas via HTTPS for IDE integration and tooling. Browse all available schemas at the <Link href="https://registry.prpm.dev/api/v1/schemas" className="text-prpm-accent hover:underline font-medium">schema reference endpoint</Link>:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`# Base format schemas
https://registry.prpm.dev/api/v1/schemas/{format}.json

# Subtype schemas (where applicable)
https://registry.prpm.dev/api/v1/schemas/{format}/{subtype}.json

# Examples:
https://registry.prpm.dev/api/v1/schemas/cursor.json
https://registry.prpm.dev/api/v1/schemas/claude/agent.json
https://registry.prpm.dev/api/v1/schemas/kiro/hook.json`}</code></pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">3. npm Package</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Use the validation API in your JavaScript/TypeScript projects:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`npm install @pr-pm/converters

import { validateMarkdown, validateFormat } from '@pr-pm/converters';

const result = validateMarkdown('cursor', content, 'rule');`}</code></pre>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Contributing and Maintenance</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            AI prompt formats are evolving rapidly. If you notice:
          </p>

          <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
            <li>A format added new fields we're missing</li>
            <li>Schema validation rejecting valid prompts</li>
            <li>Missing schemas for new formats</li>
            <li>Documentation that could be clearer</li>
          </ul>

          <p className="text-gray-300 leading-relaxed mb-8">
            Open an issue or PR in the <Link href="https://github.com/pr-pm/prpm" className="text-prpm-accent hover:underline font-medium">PRPM repository</Link>. When updating schemas:
          </p>

          <ol className="text-gray-300 space-y-6 mb-8 list-decimal list-inside">
            <li><strong className="text-white">Verify against official docs:</strong> Link to the authoritative source in <code>$comment</code></li>
            <li><strong className="text-white">Update converters:</strong> Schema changes may require converter updates</li>
            <li><strong className="text-white">Add tests:</strong> Include test cases for new fields or validation rules</li>
            <li><strong className="text-white">Update docs:</strong> Keep <code>packages/converters/docs/</code> in sync with schemas</li>
          </ol>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">What This Enables</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            With comprehensive schemas for 15+ AI prompt formats, we've unlocked:
          </p>

          <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
            <li><strong>Reliable format conversion:</strong> Input and output validation ensures correct transformations</li>
            <li><strong>Better developer experience:</strong> IDE autocomplete and inline docs reduce errors</li>
            <li><strong>CI/CD integration:</strong> Catch invalid prompts before they reach production</li>
            <li><strong>Ecosystem tooling:</strong> Build linters, editors, and analyzers with confidence</li>
            <li><strong>Living documentation:</strong> Schemas serve as the source of truth for format specs</li>
          </ul>

          <p className="text-gray-300 leading-relaxed mb-8">
            Most importantly, schemas make PRPM's universal format conversion possible. Converting between 15 formats means validating 29 format/subtype combinations—without schemas, that would be error-prone guesswork.
          </p>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-4">Get Started</h2>

            <p className="text-gray-300 leading-relaxed text-lg mb-0">
              Start using PRPM's schemas today. Add IDE autocomplete to your prompt files, validate in CI/CD, or build tools using the validation API. All schemas are open source and available via the registry API.
            </p>
          </div>

          <div className="not-prose flex flex-wrap gap-4 mb-12">
            <Link
              href="https://github.com/pr-pm/prpm/tree/main/packages/converters/schemas"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              Browse Schemas
            </Link>
            <Link
              href="/search"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white rounded-lg font-semibold transition-all"
            >
              Search Packages
            </Link>
          </div>
        </div>

        <BlogFooter postTitle="JSON Schemas for Every AI Prompt Format" postUrl="/blog/json-schemas-for-ai-prompts" />
      </article>
    </main>
  )
}
