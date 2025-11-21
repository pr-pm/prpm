import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Tool Composition is Your AI Superpower - PRPM",
  description: "AI tooling moves too fast to support everything natively. Instead: OpenSkills generates content, Ruler splices it into AGENTS.md, and boom—universal compatibility.",
  openGraph: {
    title: "Tool Composition is Your AI Superpower",
    description: "How OpenSkills + Ruler = universal AI instructions across any IDE. Composition beats native integration.",
  },
}

export default function OpenSkillsCrossIDECompatibilityPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Technical', 'Tool Composition', 'OpenSkills', 'Ruler']}
          title="Tool Composition is Your AI Superpower"
          subtitle="Why OpenSkills + Ruler beats native format support"
          author="PRPM Team"
          date="November 20, 2025"
          readTime="8 min read"
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
        ">

          <blockquote className="border-l-4 border-prpm-accent pl-6 italic text-gray-400 my-8 text-lg">
            The AI tooling landscape moves too fast to support everything natively. But composing tools? That's how you build superpowers.
          </blockquote>

          <p>
            New AI editors launch every week. Formats evolve daily. Cursor rules, Claude skills, Continue prompts, Windsurf cascades, Kiro steering, agents.md, OpenSkills—the list grows faster than any package manager can keep up.
          </p>

          <p>
            We could play whack-a-mole adding native support for each format. Or we could get smarter about composition.
          </p>

          <p>
            Here's what we discovered: <strong>OpenSkills content + Ruler pipeline = universal compatibility across every IDE</strong>. No native format support needed. Just two specialized tools working together.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Discovery</h2>
          </div>

          <p>
            Instead of adding OpenSkills as a native format in PRPM (more code to maintain, more conversions to test, more edge cases to debug), we found a better path.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">The Composition Workflow</h3>

            <ol className="list-decimal list-inside text-gray-300 space-y-6 mb-8">
              <li>
                <strong className="text-white">Generate OpenSkills content</strong> (from Claude Code, PRPM packages, or write your own)
              </li>
              <li>
                <strong className="text-white">Save it to <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.ruler/openskills.md</code></strong>
              </li>
              <li>
                <strong className="text-white">Ruler automatically splices</strong> all <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.ruler/*.md</code> files into <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">AGENTS.md</code>
              </li>
              <li>
                <strong className="text-white">Boom</strong>—that OpenSkills content now works in <strong>any</strong> tool that reads <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">agents.md</code>: Cursor, Windsurf, Continue, future editors
              </li>
            </ol>

            <p className="text-gray-300 leading-relaxed mb-8">
              No native PRPM support for OpenSkills needed. No format converters. No special installation logic. Just two tools composing elegantly.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">What is Ruler?</h2>
          </div>

          <p>
            <Link href="https://okigu.com/ruler" className="text-prpm-accent hover:underline font-medium">Ruler</Link> is a beautifully simple tool: it combines plain markdown files from your <code>.ruler/</code> directory and automatically splices them into <code>AGENTS.md</code>.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">How Ruler Works</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Drop any markdown file into <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.ruler/</code>:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`.ruler/
├── typescript-conventions.md
├── api-design-patterns.md
├── openskills-content.md
└── custom-instructions.md`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              Ruler reads all of them, splices them together with proper markdown formatting, and outputs a single <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">AGENTS.md</code> file.
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              That <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">AGENTS.md</code> is now readable by <strong>any AI editor</strong> that supports the agents.md format: Cursor, Windsurf, Continue, and future tools.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Why This is Genius</h3>

            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
              <li><strong className="text-white">Simple, focused tool</strong>: Ruler does one thing (splice markdown) and does it perfectly</li>
              <li><strong className="text-white">Universal output</strong>: <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">AGENTS.md</code> works across all major AI editors</li>
              <li><strong className="text-white">Composable</strong>: Works with content from anywhere—OpenSkills, Claude skills, hand-written markdown, PRPM packages</li>
              <li><strong className="text-white">No lock-in</strong>: If Ruler disappears tomorrow, you still have plain markdown files</li>
            </ul>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">What is OpenSkills?</h2>
          </div>

          <p>
            OpenSkills is a minimal skill format from the Claude Code ecosystem. The spec is beautifully simple:
          </p>

          <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
            <li><strong className="text-white">Markdown content</strong> with instructions and guidelines</li>
            <li><strong className="text-white">YAML frontmatter</strong> with just <code>name</code> and <code>description</code></li>
            <li><strong className="text-white">That's it</strong>—no complex schema, no tool specifications</li>
          </ul>

          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
            <code className="text-sm text-gray-300 font-mono">{`---
name: refactor-helper
description: Assists with code refactoring
---

# Refactor Helper

Helps refactor code while maintaining functionality.

## Guidelines

- Preserve existing behavior
- Improve code structure and readability
- Update tests accordingly
- Maintain backward compatibility`}</code>
          </pre>

          <p>
            It's essentially a subset of Claude skills format: same structure, same install location (<code>.claude/skills/</code>), but minimal frontmatter.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Composition: OpenSkills + Ruler</h2>
          </div>

          <p>
            Here's how the pieces fit together to create universal compatibility:
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Step 1: Generate OpenSkills Content</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Run OpenSkills sync to generate content:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# OpenSkills generates content and adds it to AGENTS.md
npx openskills sync

# This creates/updates AGENTS.md with OpenSkills-generated content`}</code>
            </pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Step 2: Extract to Ruler Directory</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Take the OpenSkills-generated content from <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">AGENTS.md</code> and save it to a separate file in <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.ruler/</code>:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Extract OpenSkills content to Ruler directory
# (manually copy the OpenSkills section from AGENTS.md)
# Save as .ruler/openskills.md

# Now you can manage it alongside other rules
.ruler/
├── openskills.md          # From OpenSkills sync
├── typescript-rules.md    # Your custom rules
└── api-conventions.md     # Team conventions`}</code>
            </pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Step 3: Ruler Manages Everything</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Ruler reads all <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.ruler/*.md</code> files (including your extracted OpenSkills content) and combines them:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Ruler output: AGENTS.md
<!-- Source: .ruler/openskills.md -->
# OpenSkills Content
[Content from OpenSkills sync]

<!-- Source: .ruler/typescript-rules.md -->
# TypeScript Rules
[Your custom TypeScript conventions]

<!-- Source: .ruler/api-conventions.md -->
# API Conventions
[Your team's API guidelines]`}</code>
            </pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Step 4: Universal Compatibility</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Now that <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">AGENTS.md</code> works in:
            </p>

            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
              <li><strong className="text-white">Cursor</strong>: Reads <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">AGENTS.md</code> natively</li>
              <li><strong className="text-white">Windsurf</strong>: Supports agents.md format</li>
              <li><strong className="text-white">Continue</strong>: Can read agents.md</li>
              <li><strong className="text-white">Future AI editors</strong>: Any tool that supports agents.md (and many will)</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              You just made OpenSkills content work everywhere <strong>without PRPM needing native OpenSkills support</strong>.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Why Composition Beats Native Integration</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">1. Things Are Moving FAST</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              New AI editors launch weekly. Formats evolve daily. Building native support for every format means:
            </p>

            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
              <li>Endless format converters to write and maintain</li>
              <li>Test coverage for every format × every conversion path</li>
              <li>Breaking changes when formats evolve</li>
              <li>Constant catch-up with new tools</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              That's exhausting and unsustainable.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">2. Composition Scales Infinitely</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Instead of PRPM supporting OpenSkills natively, we compose:
            </p>

            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
              <li><strong className="text-white">PRPM</strong> handles package distribution and Claude format (the superset)</li>
              <li><strong className="text-white">Ruler</strong> handles markdown splicing and universal output</li>
              <li><strong className="text-white">OpenSkills</strong> content (which is compatible with Claude format) flows through both</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              Each tool does one thing well. Compose them, and you get superpowers.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">3. Interoperability &gt; Native Integration</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              The Unix philosophy: build small, focused tools that work well together. Apply it to AI tooling:
            </p>

            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
              <li>Ruler doesn't care where markdown comes from (Claude, OpenSkills, hand-written)</li>
              <li>PRPM doesn't care where packages get consumed (Ruler, direct install, manual copy)</li>
              <li>OpenSkills doesn't care what splices it into agents.md (Ruler, custom scripts, manual)</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              Loose coupling. Maximum flexibility. Composable power.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Meta Lesson</h2>
          </div>

          <p>
            This isn't just about OpenSkills and Ruler. It's a mindset shift for how we think about AI tooling.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Stop Building Everything</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              When a new format or tool emerges, ask:
            </p>

            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
              <li><strong className="text-white">Can we compose existing tools instead of building native support?</strong></li>
              <li>Is there a specialized tool that already does this well?</li>
              <li>Can we bridge formats with minimal glue code instead of full converters?</li>
              <li>Does this tool play well with others, or does it demand lock-in?</li>
            </ul>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Favor Composability</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Build tools that:
            </p>

            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
              <li>Accept standard inputs (plain text, markdown, JSON)</li>
              <li>Produce standard outputs (markdown, JSON, files)</li>
              <li>Don't assume what comes before or after them</li>
              <li>Work equally well in pipelines or standalone</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              Ruler is a perfect example: it doesn't care if you're using PRPM, Claude, OpenSkills, or hand-written markdown. It just splices <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.ruler/*.md</code> into <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">AGENTS.md</code>. Beautifully focused. Infinitely composable.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Practical Workflow Summary</h2>
          </div>

          <p>
            Here's the complete end-to-end workflow:
          </p>

          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
            <code className="text-sm text-gray-300 font-mono">{`# 1. Generate OpenSkills content
npx openskills sync
# This creates/updates AGENTS.md with OpenSkills-generated content

# 2. Extract OpenSkills content to Ruler directory
# (manually copy the OpenSkills section from AGENTS.md)
# Save to .ruler/openskills.md

# 3. Add your own custom instructions alongside it
echo "# TypeScript Conventions\\n\\n..." > .ruler/typescript.md
echo "# API Patterns\\n\\n..." > .ruler/api-patterns.md

# 4. Ruler manages everything together
# Your .ruler/ directory now has:
# - openskills.md (from OpenSkills sync)
# - typescript.md (your custom rules)
# - api-patterns.md (team conventions)

# 5. Ruler splices all .ruler/*.md files into AGENTS.md
# Install Ruler: https://okigu.com/ruler

# 6. Now your composed content works in:
# - Cursor (reads AGENTS.md)
# - Windsurf (reads AGENTS.md)
# - Continue (reads AGENTS.md)
# - Any future tool that supports agents.md

# No native OpenSkills support needed in PRPM.
# Just tool composition.`}</code>
          </pre>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">What Other Tool Combinations Unlock Superpowers?</h2>
          </div>

          <p>
            OpenSkills + Ruler is just one example. The AI tooling ecosystem is full of specialized, well-designed tools waiting to be composed.
          </p>

          <p>
            Think about combinations like:
          </p>

          <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
            <li><strong className="text-white">PRPM + Git hooks</strong>: Auto-sync packages across team via git</li>
            <li><strong className="text-white">Claude skills + Continue prompts</strong>: Cross-pollinate best practices</li>
            <li><strong className="text-white">Ruler + Custom scripts</strong>: Dynamic agents.md generation based on project context</li>
            <li><strong className="text-white">PRPM + CI/CD</strong>: Automated package publishing from monorepos</li>
          </ul>

          <p>
            The future of AI tooling isn't one universal format or one mega-tool that does everything. It's specialized tools that compose elegantly together.
          </p>

          <p>
            <strong>Composition is the superpower.</strong>
          </p>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-4">Try It Yourself</h2>
            <p className="text-gray-300 leading-relaxed text-lg mb-6">
              Install PRPM, grab Ruler, and start composing tools. Discover your own superpower combinations.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/getting-started"
                className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-hover text-white font-semibold rounded-lg transition-colors inline-block"
              >
                Get Started with PRPM
              </Link>
              <a
                href="https://okigu.com/ruler"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white font-semibold rounded-lg transition-colors inline-block"
              >
                Learn About Ruler
              </a>
            </div>
          </div>

        </div>

        <BlogFooter postTitle="Tool Composition is Your AI Superpower" postUrl="/blog/openskills-cross-ide-compatibility" />
      </article>
    </main>
  )
}
