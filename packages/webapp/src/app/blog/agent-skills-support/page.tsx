import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "PRPM Now Supports Agent Skills: Build Once, Deploy Everywhere - PRPM",
  description: "Agent Skills is Anthropic's open format for packaging procedural knowledge. PRPM adds native support with validation, cross-format conversion, and registry integration across Copilot, Claude, Cursor, and more.",
  openGraph: {
    title: "PRPM Now Supports Agent Skills: Build Once, Deploy Everywhere",
    description: "Write skills once in Agent Skills format, convert to any AI editor. PRPM brings universal portability to procedural knowledge.",
  },
}

export default function AgentSkillsSupportPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Feature Release', 'Agent Skills', 'Format Conversion', 'Integration']}
          title="PRPM Now Supports Agent Skills: Build Once, Deploy Everywhere"
          subtitle="Anthropic's open format for procedural knowledge is now a first-class citizen in PRPM—with validation, conversion, and cross-platform portability."
          author="PRPM Team"
          date="December 20, 2025"
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
          prose-table:border-collapse prose-table:w-full prose-table:my-8 prose-table:text-gray-300
          prose-thead:border-b-2 prose-thead:border-prpm-border
          prose-th:text-left prose-th:text-white prose-th:bg-prpm-dark-card prose-th:px-4 prose-th:py-4 prose-th:font-semibold prose-th:border prose-th:border-prpm-border
          prose-td:px-4 prose-td:py-4 prose-td:border prose-td:border-prpm-border
          prose-hr:border-prpm-border prose-hr:my-12
        ">

          <p className="text-gray-300 leading-relaxed mb-8">
            Anthropic released <a href="https://agentskills.io/home" target="_blank" rel="noopener noreferrer">Agent Skills</a>—an open format for packaging procedural knowledge, company-specific patterns, and domain expertise into reusable folders. Skills are discoverable by AI agents, work across multiple tools, and capture institutional knowledge in portable, auditable packages.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            PRPM now has native Agent Skills support with JSON schema validation, bidirectional format conversion, and registry integration. Write a skill once, install it anywhere.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">What Is Agent Skills?</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            <a href="https://agentskills.io" target="_blank" rel="noopener noreferrer">Agent Skills</a> is Anthropic's open standard for packaging procedural knowledge. Instead of writing tribal knowledge in Notion docs or keeping migration patterns in your head, you write them as <code>SKILL.md</code> files that AI agents can discover and apply.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Structure: Folder + SKILL.md</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Skills live in subdirectories with a canonical structure:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`.github/skills/
  api-testing/
    SKILL.md          # Required
    test-template.ts  # Optional bundled resources
    examples/         # Optional supporting files

.claude/skills/
  migration-helper/
    SKILL.md
    scripts/
      migrate.sh`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              The <code>SKILL.md</code> file contains YAML frontmatter with metadata and markdown content with procedures:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`---
name: api-testing
description: Guides testing of REST APIs using Jest and Supertest
---

# API Testing Skill

This skill helps you write comprehensive API tests.

## Procedures

1. Set up test environment with Supertest
2. Write endpoint tests with assertions
3. Mock external dependencies
4. Test error handling

## Resources

- [Test template](./test-template.ts)
- [Example tests](./examples/)`}</code>
            </pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Progressive Disclosure</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              AI agents discover skills through a three-level system:
            </p>

            <ol className="list-decimal list-inside text-gray-300 space-y-6 mb-8">
              <li><strong className="text-white">Discovery:</strong> Agent reads frontmatter metadata to identify relevant skills</li>
              <li><strong className="text-white">Loading:</strong> When matched, full <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">SKILL.md</code> body enters context</li>
              <li><strong className="text-white">Access:</strong> Referenced resources (scripts, templates) load only when needed</li>
            </ol>

            <p className="text-gray-300 leading-relaxed mb-8">
              This keeps context windows clean while ensuring agents have the knowledge they need.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Ecosystem Adoption</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Agent Skills already works across major AI coding tools:
            </p>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><strong className="text-white">GitHub Copilot:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">.github/skills/&lt;name&gt;/SKILL.md</code> (VS Code Insiders with <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">chat.useAgentSkills</code> enabled)</li>
              <li><strong className="text-white">Claude Code:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">.claude/skills/&lt;name&gt;/SKILL.md</code></li>
              <li><strong className="text-white">Factory Droid:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">.factory/skills/&lt;name&gt;/SKILL.md</code></li>
              <li><strong className="text-white">OpenAI Codex CLI:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">.agents/skills/&lt;name&gt;/SKILL.md</code></li>
              <li><strong className="text-white">VS Code:</strong> Native support in progress</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              One skill format, multiple platforms. This is the portability promise.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">What PRPM Added</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            PRPM treats Agent Skills as a first-class format alongside Cursor rules, Windsurf rules, and 24 others. Here's what we built:
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">1. Native Format Support</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Install skills directly from the PRPM registry with automatic format detection:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Install to GitHub Copilot skills directory
prpm install @prpm/api-testing --format copilot --subtype skill

# Install to Claude Code skills directory
prpm install @prpm/api-testing --format claude --subtype skill

# Install to Factory Droid skills directory
prpm install @prpm/api-testing --format droid --subtype skill`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              PRPM handles the directory structure, validates the format, and updates your package lockfile.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">2. JSON Schema Validation</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              We ship comprehensive JSON schemas for Agent Skills across all supported platforms:
            </p>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">copilot-skill.schema.json</code> - GitHub Copilot skills</li>
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">claude-skill.schema.json</code> - Claude Code skills</li>
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">droid-skill.schema.json</code> - Factory Droid skills</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              These schemas validate required fields, enforce character limits, and provide IDE autocomplete:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`{
  "frontmatter": {
    "name": "api-testing",           // Required, kebab-case, max 64 chars
    "description": "Guides testing…" // Required, max 1024 chars
  },
  "content": "# API Testing\\n\\n..."  // Markdown body
}`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              Publishing fails early with clear error messages when skills don't conform to spec.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">3. Bidirectional Format Conversion</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Convert between Agent Skills and any other PRPM format:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Convert Cursor rule to GitHub Copilot skill
prpm convert .cursor/rules/api-testing.mdc \\
  --to copilot --subtype skill \\
  --output .github/skills/api-testing/SKILL.md

# Convert Claude skill to Windsurf rule
prpm convert .claude/skills/migration-helper/SKILL.md \\
  --to windsurf \\
  --output .windsurf/rules/migration-helper.md

# Convert skill to AGENTS.md format
prpm convert .github/skills/testing/SKILL.md \\
  --to agents.md --subtype skill`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              Conversion preserves:
            </p>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li>Name and description metadata</li>
              <li>Procedural instructions</li>
              <li>Code examples</li>
              <li>Resource references (when supported by target format)</li>
            </ul>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">4. Registry Integration</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Skills are indexed in the PRPM registry with dedicated filters:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Search for GitHub Copilot skills
prpm search "testing" --format copilot --subtype skill

# Search for Claude Code skills
prpm search "migration" --format claude --subtype skill

# Search for any skill across all formats
prpm search "api" --subtype skill`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              Registry benefits:
            </p>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li>Download analytics per skill</li>
              <li>Version management with semver</li>
              <li>Quality scores based on Anthropic's best practices</li>
              <li>Package collections for common workflows</li>
            </ul>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Cross-Platform Portability</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            The power of PRPM's Agent Skills support is cross-platform portability. Write once, deploy everywhere.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Scenario: Multi-Editor Team</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Your team uses different AI editors:
            </p>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li>Frontend devs use Cursor</li>
              <li>Backend devs use Claude Code</li>
              <li>DevOps uses GitHub Copilot</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              You publish a company-wide API testing skill:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Author writes once (any format)
cd my-skill-package
prpm init

# Create skill in preferred format (GitHub Copilot)
mkdir -p .github/skills/api-testing
cat > .github/skills/api-testing/SKILL.md << 'EOF'
---
name: api-testing
description: Company API testing standards with Jest and Supertest
---

# API Testing Skill

[Your company's testing procedures...]
EOF

# Publish to company registry
prpm publish @acme/api-testing`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              Team members install in their preferred format:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Frontend dev (Cursor user)
prpm install @acme/api-testing --format cursor

# Backend dev (Claude Code user)
prpm install @acme/api-testing --format claude --subtype skill

# DevOps (GitHub Copilot user)
prpm install @acme/api-testing --format copilot --subtype skill`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              PRPM automatically converts the skill to each editor's native format. Everyone gets the same knowledge, tailored to their tool.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Format Comparison Table</h3>

            <div className="not-prose mb-8">
              <table className="w-full border-collapse text-gray-300">
                <thead className="border-b-2 border-prpm-border">
                  <tr>
                    <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Format</th>
                    <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Location</th>
                    <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Structure</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">GitHub Copilot</strong></td>
                    <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">.github/skills/&lt;name&gt;/SKILL.md</code></td>
                    <td className="px-4 py-4 border border-prpm-border">Subdirectory with SKILL.md</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Claude Code</strong></td>
                    <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">.claude/skills/&lt;name&gt;/SKILL.md</code></td>
                    <td className="px-4 py-4 border border-prpm-border">Subdirectory with SKILL.md</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Factory Droid</strong></td>
                    <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">.factory/skills/&lt;name&gt;/SKILL.md</code></td>
                    <td className="px-4 py-4 border border-prpm-border">Subdirectory with SKILL.md</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Codex CLI</strong></td>
                    <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">.agents/skills/&lt;name&gt;/SKILL.md</code></td>
                    <td className="px-4 py-4 border border-prpm-border">Subdirectory with SKILL.md</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Cursor</strong></td>
                    <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">.cursor/rules/*.mdc</code></td>
                    <td className="px-4 py-4 border border-prpm-border">Converted to MDC rule</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Windsurf</strong></td>
                    <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">.windsurf/rules/*.md</code></td>
                    <td className="px-4 py-4 border border-prpm-border">Converted to plain markdown</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-gray-300 leading-relaxed mb-0">
              PRPM handles the structural differences automatically.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Real-World Example: Testing Skills</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Let's build a real testing skill and deploy it across multiple editors.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Step 1: Create the Skill</h3>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`mkdir -p testing-skill/.github/skills/api-testing
cd testing-skill

cat > .github/skills/api-testing/SKILL.md << 'EOF'
---
name: api-testing
description: Comprehensive API testing with Jest, Supertest, and OpenAPI validation
---

# API Testing Skill

## When to Use

- Creating new REST API endpoints
- Adding test coverage to existing APIs
- Validating OpenAPI spec compliance

## Procedures

### 1. Set Up Test Environment

\`\`\`typescript
import request from 'supertest';
import { app } from '../src/app';

describe('API Tests', () => {
  // Tests here
});
\`\`\`

### 2. Write Endpoint Tests

Test each endpoint with:
- Valid inputs (200/201 responses)
- Invalid inputs (400 responses)
- Authentication failures (401 responses)
- Authorization failures (403 responses)
- Not found scenarios (404 responses)

### 3. Validate Response Schemas

\`\`\`typescript
expect(response.body).toMatchObject({
  id: expect.any(String),
  name: expect.any(String),
  createdAt: expect.any(String),
});
\`\`\`

### 4. Test Error Handling

\`\`\`typescript
it('returns 400 for invalid email', async () => {
  const response = await request(app)
    .post('/api/users')
    .send({ email: 'invalid' });

  expect(response.status).toBe(400);
  expect(response.body.error).toContain('email');
});
\`\`\`

## Best Practices

- Mock external services
- Use meaningful test descriptions
- Test edge cases (empty arrays, null values)
- Verify error messages are helpful
- Check rate limiting behavior

## Resources

- [Test template](./test-template.ts)
- [Example tests](./examples/)
EOF

# Create supporting files
cat > .github/skills/api-testing/test-template.ts << 'EOF'
import request from 'supertest';
import { app } from '../src/app';

describe('GET /api/resource', () => {
  it('returns 200 with data', async () => {
    const response = await request(app).get('/api/resource');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
});
EOF`}</code>
            </pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Step 2: Publish to PRPM</h3>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Initialize package
prpm init

# Edit prpm.json
cat > prpm.json << 'EOF'
{
  "name": "@yourcompany/api-testing-skill",
  "version": "1.0.0",
  "description": "API testing best practices for REST endpoints",
  "format": "copilot",
  "subtype": "skill",
  "tags": ["testing", "api", "jest", "supertest"],
  "files": [
    ".github/skills/api-testing/SKILL.md",
    ".github/skills/api-testing/test-template.ts"
  ]
}
EOF

# Publish
prpm publish`}</code>
            </pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Step 3: Install Across Editors</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Team members can now install this skill in any editor:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# GitHub Copilot (preserves SKILL.md structure)
prpm install @yourcompany/api-testing-skill

# Claude Code (converts to Claude skill format)
prpm install @yourcompany/api-testing-skill --format claude --subtype skill

# Cursor (converts to Cursor rule)
prpm install @yourcompany/api-testing-skill --format cursor

# Windsurf (converts to plain markdown)
prpm install @yourcompany/api-testing-skill --format windsurf`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              Each editor gets the skill in its native format. Same knowledge, different structure.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Why This Matters</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">1. No More Copy-Paste</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Before Agent Skills + PRPM:
            </p>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li>Write testing guidelines in Notion</li>
              <li>Copy-paste into <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">.cursorrules</code></li>
              <li>Manually convert to Claude skill format</li>
              <li>Rewrite for GitHub Copilot instructions</li>
              <li>Update all copies when something changes</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              After:
            </p>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li>Write once as Agent Skills format</li>
              <li>Publish to PRPM</li>
              <li>Install converts automatically</li>
              <li>Update with <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">prpm upgrade</code></li>
            </ul>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">2. Capture Institutional Knowledge</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Your senior engineers' tribal knowledge can now be:
            </p>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li>Packaged as skills</li>
              <li>Versioned with semver</li>
              <li>Discovered through PRPM search</li>
              <li>Applied by AI agents automatically</li>
              <li>Updated as patterns evolve</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              Example skills companies are publishing:
            </p>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">@acme/database-migrations</code> - How we safely change schemas</li>
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">@acme/security-review</code> - Security checklist for new features</li>
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">@acme/api-design</code> - REST API conventions</li>
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">@acme/incident-response</code> - On-call debugging procedures</li>
            </ul>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">3. Format-Agnostic Publishing</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Package authors don't need to support every editor:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Publish once in any format
prpm publish @vendor/migration-helper

# Users install for their editor
prpm install @vendor/migration-helper --format cursor
prpm install @vendor/migration-helper --format claude --subtype skill
prpm install @vendor/migration-helper --format copilot --subtype skill

# PRPM converts automatically
# Package author supports all editors without extra work`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              This is the write-once-deploy-everywhere promise PRPM was built for.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Validation and Quality</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            PRPM validates Agent Skills against <a href="https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices" target="_blank" rel="noopener noreferrer">Anthropic's official best practices</a>:
          </p>

          <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
            <li>Clear, specific descriptions (no vague "helps with" language)</li>
            <li>Procedural instructions with concrete steps</li>
            <li>Code examples that demonstrate patterns</li>
            <li>Resource references that add value</li>
            <li>Proper frontmatter structure</li>
          </ul>

          <p className="text-gray-300 leading-relaxed mb-8">
            Publishing fails with helpful feedback:
          </p>

          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
            <code className="text-sm text-gray-300 font-mono">{`$ prpm publish

✗ Validation failed:
  - frontmatter.name: must be kebab-case
  - frontmatter.description: exceeds 1024 character limit
  - content: missing procedural instructions

Fix these errors and try again.`}</code>
          </pre>

          <p className="text-gray-300 leading-relaxed mb-8">
            Quality scores in the registry reflect adherence to best practices. Skills with higher scores rank better in search results.
          </p>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-4">Get Started with Agent Skills</h2>

            <p className="text-gray-300 leading-relaxed text-lg mb-0">
              Agent Skills support is available in PRPM now. Install skills from the registry or publish your own.
            </p>
          </div>

          <div className="bg-gradient-to-r from-prpm-accent/10 to-prpm-purple/10 border border-prpm-accent/30 rounded-2xl p-8 my-12">
            <h3 className="text-2xl font-bold text-white mb-4">
              Try Agent Skills Today
            </h3>
            <p className="text-gray-300 mb-6">
              Search for skills in the registry, install to your editor, or publish your team's expertise
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/search?subtype=skill"
                className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-hover text-white font-semibold rounded-lg transition-colors"
              >
                Browse Skills
              </Link>
              <a
                href="https://docs.prpm.dev/formats/agent-skills"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white font-semibold rounded-lg transition-colors"
              >
                Read the Docs
              </a>
              <a
                href="https://agentskills.io"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white font-semibold rounded-lg transition-colors"
              >
                Agent Skills Spec
              </a>
            </div>
          </div>

        </div>
      </article>

      <BlogFooter
        postTitle="PRPM Now Supports Agent Skills: Build Once, Deploy Everywhere"
        postUrl="/blog/agent-skills-support"
      />
    </main>
  )
}
