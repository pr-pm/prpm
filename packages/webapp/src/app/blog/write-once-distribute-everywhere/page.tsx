import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Write Once. Distribute Everywhere: Why Package Publishers Choose PRPM",
  description: "The only AI package manager with lossless cross-format conversion—publish in one format, install in eight.",
  openGraph: {
    title: "Write Once. Distribute Everywhere: Why Package Publishers Choose PRPM",
    description: "The only AI package manager with lossless cross-format conversion—publish in one format, install in eight.",
  },
}

export default function WriteOnceDistributeEverywherePost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Technical', 'Package Publishing', 'Format Conversion', 'Developer Experience']}
          title="Write Once. Distribute Everywhere"
          subtitle="The only AI package manager with lossless cross-format conversion—publish in one format, install in eight."
          author="PRPM Team"
          date="December 6, 2025"
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
          prose-table:my-8
          prose-th:text-white prose-th:font-semibold prose-th:text-left prose-th:p-3 prose-th:border-b prose-th:border-prpm-border
          prose-td:text-gray-300 prose-td:p-3 prose-td:border-b prose-td:border-prpm-border/50
        ">
          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Problem Every Package Publisher Faces</h2>
          </div>

          <p>
            You&apos;ve built the perfect Cursor rule for React best practices. It took weeks to refine. Now developers using Claude Code, Continue, Windsurf, and Copilot want it too.
          </p>

          <p>Your options:</p>

          <ol>
            <li><strong>Maintain eight separate versions</strong> - Different repos, different formats, different update cycles</li>
            <li><strong>Pick one format and tell others &quot;sorry&quot;</strong> - Lose 80% of potential users</li>
            <li><strong>Copy-paste with manual tweaks</strong> - Introduce bugs, forget which version has which fix</li>
            <li><strong>Give up on multi-platform support</strong> - Watch your package&apos;s reach plateau</li>
          </ol>

          <p>
            None of these are good. All waste your time. And when AI tooling evolves monthly, the maintenance burden compounds.
          </p>

          <p>
            <strong>PRPM solves this:</strong> Write your package once in any format. The registry handles conversion to all eight formats automatically. Users get the right format for their editor. You publish once.
          </p>

          <hr />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-green rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">How It Works: The Technical Reality</h2>
          </div>

          <p>
            PRPM doesn&apos;t just transform text files. It performs <strong>lossless, semantically-aware conversions</strong> that preserve format-specific features while adapting to each platform&apos;s conventions.
          </p>

          <h3>Real Example: Cursor Multi-File Rules</h3>

          <p>Say you publish a Cursor rule that references multiple files with <code>@file</code> syntax:</p>

          <pre><code>{`---
description: React TypeScript best practices
globs:
  - "**/*.tsx"
  - "**/*.ts"
---

# React Component Standards

When creating components, reference @components/Button.tsx for the canonical
pattern. All components must follow @docs/architecture.md conventions.

Use TypeScript strict mode as defined in @tsconfig.json.`}</code></pre>

          <p><strong>What happens when a Claude Code user installs it:</strong></p>

          <pre><code>{`prpm install @yourname/react-best-practices --as claude --subtype skill`}</code></pre>

          <p>PRPM&apos;s converter:</p>

          <ol>
            <li><strong>Recognizes the Cursor format</strong> - Parses YAML frontmatter and MDC content</li>
            <li><strong>Extracts file references</strong> - Identifies <code>@components/Button.tsx</code>, <code>@docs/architecture.md</code>, <code>@tsconfig.json</code></li>
            <li><strong>Converts to Claude skill syntax</strong> - Transforms to Claude&apos;s frontmatter structure</li>
            <li><strong>Preserves glob patterns</strong> - Maps Cursor&apos;s glob logic to Claude&apos;s <code>allowed-tools</code> if specified</li>
            <li><strong>Maintains semantic intent</strong> - The instruction about &quot;canonical pattern&quot; stays intact</li>
            <li><strong>Generates valid output</strong> - Passes Claude&apos;s schema validation</li>
          </ol>

          <p>The user gets a working Claude skill. You didn&apos;t write two versions. Zero maintenance burden.</p>

          <hr />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Format Support: All Eight Major Platforms</h2>
          </div>

          <p>PRPM supports every major AI coding platform, each with complete JSON schemas and validation:</p>

          <div className="overflow-x-auto my-8">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Format</th>
                  <th>File Location</th>
                  <th>Frontmatter</th>
                  <th>Key Features</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Cursor</strong></td>
                  <td><code>.cursor/rules</code></td>
                  <td>Required</td>
                  <td>4 rule types, MDC format, <code>@file</code> references</td>
                </tr>
                <tr>
                  <td><strong>Claude Code</strong></td>
                  <td><code>.claude/{'{agents,skills,commands}'}/ </code></td>
                  <td>Required</td>
                  <td>allowed-tools, model selection, hooks</td>
                </tr>
                <tr>
                  <td><strong>Continue</strong></td>
                  <td><code>.continue/rules/*.md</code></td>
                  <td>Required</td>
                  <td>Globs, regex, alwaysApply logic</td>
                </tr>
                <tr>
                  <td><strong>Windsurf</strong></td>
                  <td><code>.windsurf/rules</code></td>
                  <td>None</td>
                  <td>Plain markdown, 12k character limit</td>
                </tr>
                <tr>
                  <td><strong>GitHub Copilot</strong></td>
                  <td><code>.github/copilot-instructions.md</code></td>
                  <td>Optional</td>
                  <td>Two-tier, comma-separated patterns</td>
                </tr>
                <tr>
                  <td><strong>Kiro Steering</strong></td>
                  <td><code>.kiro/steering/*.md</code></td>
                  <td>Optional</td>
                  <td>Inclusion modes, foundational types</td>
                </tr>
                <tr>
                  <td><strong>Kiro Hooks</strong></td>
                  <td><code>.kiro/hooks/*.json</code></td>
                  <td>N/A (JSON)</td>
                  <td>Event-driven file automations</td>
                </tr>
                <tr>
                  <td><strong>agents.md</strong></td>
                  <td><code>agents.md</code></td>
                  <td>None</td>
                  <td>Plain markdown only</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>Each format has different conventions. PRPM knows them all.</p>

          <hr />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-green rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Technical Excellence: Why Conversion Works</h2>
          </div>

          <h3>1. Lossless Transformation</h3>

          <p>PRPM&apos;s converters don&apos;t strip features—they <strong>map equivalent capabilities</strong> across formats.</p>

          <p><strong>Example: File Pattern Matching</strong></p>

          <ul>
            <li><strong>Cursor:</strong> <code>globs: [&quot;**/*.tsx&quot;]</code></li>
            <li><strong>Continue:</strong> <code>applyTo: {'{ globs: ["**/*.tsx"] }'}</code></li>
            <li><strong>Copilot:</strong> <code>applyTo: &quot;*.tsx, **/*.tsx&quot;</code></li>
            <li><strong>Windsurf:</strong> (Frontmatter-free, embedded in content)</li>
          </ul>

          <p>Same intent, different syntax. PRPM handles the translation.</p>

          <h3>2. Format-Specific Features Preserved</h3>

          <p>Some platforms have unique features. PRPM preserves them when possible:</p>

          <p><strong>Claude Code&apos;s <code>allowed-tools</code>:</strong></p>

          <pre><code>{`---
name: "Safe Migration Assistant"
description: "Helps with migrations without file deletion"
allowed-tools:
  - read_file
  - write_file
---`}</code></pre>

          <p>
            When converted to Cursor, this becomes a <strong>comment annotation</strong> so users understand the intended tool restrictions. When converted to Windsurf (which has no tool restrictions), it&apos;s documented in the content.
          </p>

          <h3>3. Round-Trip Safety</h3>

          <p>
            Convert Cursor → Claude → Cursor? You get the same result (minus format-specific metadata that has no equivalent). PRPM&apos;s test suite includes <strong>cross-format round-trip validation</strong> to catch regressions.
          </p>

          <hr />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Real-World Scenario: Publishing a TypeScript Migration Package</h2>
          </div>

          <p>Let&apos;s say you maintain Next.js and want to ship a package for the Pages Router → App Router migration.</p>

          <h3>Traditional Approach (Manual Multi-Format)</h3>

          <p><strong>Week 1:</strong> Write the Cursor version</p>
          <ul>
            <li>Create <code>.cursorrules</code> file</li>
            <li>Test with Cursor IDE</li>
            <li>Publish to GitHub</li>
          </ul>

          <p><strong>Week 2:</strong> Port to Continue</p>
          <ul>
            <li>Rewrite frontmatter (different required fields)</li>
            <li>Adjust glob patterns (different syntax)</li>
            <li>Test with Continue</li>
            <li>Create separate repo or branch</li>
          </ul>

          <p><strong>Week 3:</strong> Port to Claude Code</p>
          <ul>
            <li>Rewrite as Claude skill</li>
            <li>Add <code>allowed-tools</code> restrictions</li>
            <li>Convert <code>@file</code> references to plain text</li>
            <li>Test with Claude</li>
            <li>Another repo or branch</li>
          </ul>

          <p><strong>Week 4:</strong> Port to Windsurf</p>
          <ul>
            <li>Strip frontmatter (Windsurf doesn&apos;t use it)</li>
            <li>Ensure under 12k character limit</li>
            <li>Test with Windsurf</li>
            <li>Yet another repo</li>
          </ul>

          <p><strong>Result:</strong> Four repos, four update cycles, constant sync issues. When you fix a bug in the Cursor version, you have to remember to update the other three.</p>

          <h3>PRPM Approach (Write Once)</h3>

          <p><strong>Week 1:</strong> Write the package once in your preferred format (say, Cursor)</p>

          <pre><code>{`prpm init
# Edit .cursor/rules/nextjs-app-router-migration.md
prpm publish @nextjs/app-router-migration`}</code></pre>

          <p><strong>That&apos;s it.</strong></p>

          <p>Users install in their preferred format automatically:</p>

          <pre><code>{`# Cursor user
prpm install @nextjs/app-router-migration

# Claude user
prpm install @nextjs/app-router-migration --as claude --subtype skill

# Continue user
prpm install @nextjs/app-router-migration --as continue

# Windsurf user
prpm install @nextjs/app-router-migration --as windsurf`}</code></pre>

          <p>PRPM converts on-the-fly. Every user gets a validated, working package. You maintain one version.</p>

          <hr />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-green rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Developer Experience: What Publishers Get</h2>
          </div>

          <h3>1. Publish Once, Reach Everyone</h3>

          <p>7,000+ packages in PRPM. Most were written in a single format and converted to support all platforms. Package authors don&apos;t think about formats—PRPM does.</p>

          <h3>2. Automatic Schema Validation</h3>

          <p>Before publishing, PRPM validates against the source format&apos;s JSON schema. Before conversion, PRPM validates against the target format&apos;s schema. Users never get broken packages.</p>

          <pre><code>{`$ prpm publish

✓ Validating against cursor.schema.json
✓ Testing conversions (claude-skill, continue-prompt, windsurf-rule...)
✓ Published @yourname/package@1.0.0`}</code></pre>

          <h3>3. Future-Proof</h3>

          <p>New AI editor launches? PRPM adds conversion support. Your existing package automatically works with it. No republish needed.</p>

          <p><strong>Real example:</strong> When Claude Code launched hooks support in November 2024, PRPM added <code>claude-hook</code> conversion. Every existing package with equivalent automation became compatible <strong>retroactively</strong>.</p>

          <h3>4. Analytics Across Formats</h3>

          <p>PRPM tracks downloads <strong>by format</strong>:</p>

          <pre><code>{`@yourname/package downloads (last 30 days):
- cursor: 450
- claude-skill: 320
- continue-prompt: 180
- windsurf-rule: 120
- copilot-instruction: 90`}</code></pre>

          <p>You see which platforms your users prefer. No need to maintain separate analytics per repo.</p>

          <hr />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Getting Started as a Publisher</h2>
          </div>

          <h3>Step 1: Create Your Package</h3>

          <p>Write in your preferred format:</p>

          <pre><code>{`mkdir my-package
cd my-package
prpm init

# Choose your format:
# 1. Cursor (MDC with YAML frontmatter)
# 2. Claude (skill/agent/command)
# 3. Continue (prompt with frontmatter)
# ... or any other

# Edit the generated file`}</code></pre>

          <h3>Step 2: Test Locally</h3>

          <pre><code>{`# Test conversion to all formats
prpm convert --input=.cursor/rules/main.md --validate-all

✓ cursor: valid
✓ claude-skill: valid
✓ continue-prompt: valid
✓ windsurf-rule: valid
✓ copilot-instruction: valid`}</code></pre>

          <h3>Step 3: Publish</h3>

          <pre><code>{`# One command, all formats supported
prpm publish

✓ Published @yourname/my-package@1.0.0
  Supports: cursor, claude-skill, claude-agent, continue-prompt,
            windsurf-rule, copilot-instruction, kiro-steering, agents-md`}</code></pre>

          <h3>Step 4: Monitor Analytics</h3>

          <pre><code>{`prpm stats @yourname/my-package

Downloads by format:
  cursor: ████████████ 450
  claude-skill: ████████ 320
  continue-prompt: █████ 180
  ...

Total downloads: 1,240`}</code></pre>

          <hr />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-green rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Why This Matters for the Ecosystem</h2>
          </div>

          <h3>For Package Authors</h3>
          <ul>
            <li><strong>10x reach</strong> with same effort (one package, eight platforms)</li>
            <li><strong>Zero maintenance burden</strong> from format differences</li>
            <li><strong>Future-proof</strong> against new editors launching</li>
          </ul>

          <h3>For Package Users</h3>
          <ul>
            <li><strong>More packages available</strong> for their preferred editor</li>
            <li><strong>Guaranteed compatibility</strong> (schema-validated conversions)</li>
            <li><strong>Consistent updates</strong> (author publishes once, everyone benefits)</li>
          </ul>

          <h3>For the AI Coding Community</h3>
          <ul>
            <li><strong>Knowledge sharing accelerates</strong> - Best practices spread across platforms</li>
            <li><strong>Fragmentation reduces</strong> - No more &quot;this only works in Cursor&quot;</li>
            <li><strong>Innovation compounds</strong> - Authors focus on content quality, not format maintenance</li>
          </ul>

          <hr />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Call to Action: Publish Your First Package</h2>
          </div>

          <p>Ready to reach developers across all AI coding platforms?</p>

          <pre><code>{`# Install PRPM
npm install -g prpm

# Create your package
prpm init

# Publish once
prpm publish @yourname/package

# Reach everyone`}</code></pre>

          <p>Your package will work in Cursor, Claude, Continue, Windsurf, Copilot, Kiro, agents.md, and every future platform PRPM supports.</p>

          <p className="text-2xl font-bold text-white"><strong>Write once. Distribute everywhere.</strong></p>

          <hr />

          <h2>Additional Resources</h2>

          <ul>
            <li><Link href="/blog/format-specifications-guide">Format Specifications Guide</Link> - Complete reference for all eight formats</li>
            <li><Link href="/blog/json-schemas-for-ai-prompts">JSON Schemas for AI Prompts</Link> - Deep dive on PRPM&apos;s validation system</li>
            <li><a href="https://docs.prpm.dev/publishing">Publishing Documentation</a> - Step-by-step publishing guide</li>
          </ul>

        </div>
      </article>

      <BlogFooter postTitle="Write Once. Distribute Everywhere: Why Package Publishers Choose PRPM" postUrl="/blog/write-once-distribute-everywhere" />
    </main>
  )
}
