import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "PRPM Now Supports OpenSkills: Universal Skills for AI Coding Agents",
  description: "PRPM adds native OpenSkills format support with robust js-yaml parsing. Install OpenSkills packages from PRPM's registry or publish your own—all with automatic format conversion.",
  openGraph: {
    title: "PRPM Now Supports OpenSkills",
    description: "Universal skills for AI coding agents - now available in PRPM with 2,100+ packages and automatic format conversion.",
  },
}

export default function OpenSkillsSupportPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['OpenSkills', 'Format Support', 'Launch']}
          title="PRPM Now Supports OpenSkills: Universal Skills for AI Coding Agents"
          author="PRPM Team"
          date="November 3, 2025"
          readTime="12 min read"
        />

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
          <div className="not-prose bg-gradient-to-br from-prpm-dark-card to-prpm-dark-card/50 border border-prpm-border/50 rounded-2xl p-8 mb-12 shadow-lg">
            <p className="text-xl text-gray-300 leading-relaxed italic mb-0">
              Today we're excited to announce native <strong className="text-white">OpenSkills</strong> format support in PRPM. OpenSkills is a universal skills loader that launched October 26, 2025, and has already gained significant traction (629 stars in 2 days). Now you can publish and install OpenSkills packages through PRPM's centralized registry—with automatic format conversion to Cursor, Claude, Continue, Windsurf, and more.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">What is OpenSkills?</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            <Link href="https://github.com/numman-ali/openskills" className="text-prpm-accent hover:underline font-medium">OpenSkills</Link> is a universal skills loader for AI coding agents that replicates Anthropic's Claude Code skills system across multiple platforms. Created by <Link href="https://github.com/numman-ali" className="text-prpm-accent hover:underline font-medium">@numman-ali</Link>, it uses a simple <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">SKILL.md</code> format with YAML frontmatter and markdown instructions.
          </p>

          <div className="not-prose bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8">
            <h4 className="text-lg font-bold text-blue-400 mb-3">OpenSkills Key Features</h4>
            <ul className="space-y-3 text-gray-300 list-disc ml-6">
              <li><strong className="text-white">Universal format</strong> - Works across Claude Code, Cursor, Windsurf, Aider</li>
              <li><strong className="text-white">Progressive disclosure</strong> - Skills load only when needed</li>
              <li><strong className="text-white">CLI management</strong> - Simple command-line tool for installing skills</li>
              <li><strong className="text-white">Bundled resources</strong> - Support for references/, scripts/, assets/</li>
            </ul>
          </div>

          <div className="not-prose mb-10">
            <h3 className="text-2xl font-bold text-white mb-6">Example OpenSkills SKILL.md</h3>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-0">
            <code className="text-sm text-gray-300">{`---
name: python-expert
description: Expert Python development guidance with best practices
---

# Python Expert

This skill provides comprehensive Python development guidance.

## When to Use

Load this skill when:
- Writing Python code
- Debugging Python issues
- Optimizing Python performance

## Instructions

To write idiomatic Python:

1. Follow PEP 8 style guidelines
2. Use type hints for function signatures
3. Prefer list comprehensions over loops
4. Use context managers for resource management

## Best Practices

- Write in imperative form: "To do X, execute Y"
- Keep SKILL.md under 5,000 words
- Move detailed content to references/
- Use scripts/ for executable code`}</code>
            </pre>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Why We Added OpenSkills Support</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">1. Strong Community Momentum</h3>
            <p className="text-gray-300 leading-relaxed mb-0">
              OpenSkills launched on October 26, 2025, and immediately resonated with developers—reaching <strong className="text-white">629 stars in just 2 days</strong>. This rapid adoption signals a real need for universal, cross-platform skills management. By supporting OpenSkills, PRPM positions itself as the package manager for <em>all</em> AI agent formats, not just PRPM's own ecosystem.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">2. Complementary Strengths</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              OpenSkills and PRPM solve different problems but work beautifully together:
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
                <h4 className="text-lg font-bold text-purple-400 mb-3">OpenSkills</h4>
                <ul className="space-y-3 text-gray-300 text-sm list-disc ml-6">
                  <li>Universal SKILL.md format</li>
                  <li>Multi-platform compatibility</li>
                  <li>Progressive disclosure</li>
                  <li>GitHub-based distribution</li>
                </ul>
              </div>

              <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
                <h4 className="text-lg font-bold text-green-400 mb-3">PRPM</h4>
                <ul className="space-y-3 text-gray-300 text-sm list-disc ml-6">
                  <li>Centralized registry & discovery</li>
                  <li>Auto format conversion</li>
                  <li>Collections (bundle packages)</li>
                  <li>Analytics & versioning</li>
                </ul>
              </div>
            </div>

            <p className="text-gray-300 leading-relaxed mb-0">
              <strong className="text-white">Together:</strong> Publish once in OpenSkills format to PRPM. Users discover via PRPM's registry, install in any format (Cursor, Claude, Continue, etc.), and benefit from both ecosystems.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">3. Strategic Positioning</h3>
            <p className="text-gray-300 leading-relaxed mb-0">
              This positions PRPM as the <strong className="text-white">universal package manager for AI development</strong>—supporting not just our own formats, but the broader ecosystem. Just as npm supports different module formats, PRPM now supports different prompt/skill formats.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">How It Works</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Install OpenSkills Packages</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Install any OpenSkills package from PRPM's registry:
            </p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-0">
              <code className="text-sm text-gray-300">{`# Install as OpenSkills format
prpm install @user/python-expert --as openskills

# Installs to: .claude/skills/python-expert/SKILL.md

# Or install with auto-conversion to your preferred format
prpm install @user/python-expert --as cursor     # → .cursor/rules/
prpm install @user/python-expert --as windsurf   # → .windsurf/rules/`}</code>
            </pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Publish OpenSkills Packages</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Publish your OpenSkills skills to PRPM's centralized registry:
            </p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-0">
              <code className="text-sm text-gray-300">{`# 1. Create prpm.json
{
  "name": "python-expert",
  "version": "1.0.0",
  "description": "Expert Python development guidance",
  "format": "openskills",
  "subtype": "skill",
  "author": "your-username",
  "tags": ["python", "development"],
  "files": ["SKILL.md"]
}

# 2. Publish
prpm publish --format openskills

# 3. Users can now discover and install
prpm search python
prpm install @you/python-expert`}</code>
            </pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Convert Between Formats</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              PRPM automatically converts between OpenSkills and other formats:
            </p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-0">
              <code className="text-sm text-gray-300">{`# Convert Claude skill to OpenSkills
prpm convert my-skill.md --to openskills

# Convert OpenSkills to Cursor
prpm convert SKILL.md --to cursor

# Conversion happens automatically during install
prpm install @user/openskills-package --as claude`}</code>
            </pre>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">How PRPM's Architecture Made This Easy</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Adding OpenSkills support took less than a day because PRPM was built from the ground up to be <strong className="text-white">format-agnostic</strong>. Here's how the architecture makes this possible:
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">The Canonical Format Core</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              At the heart of PRPM is a <strong className="text-white">canonical format</strong>—a universal representation that captures the essence of any prompt, skill, or agent regardless of its source format. Every package in PRPM's registry is stored in this canonical format.
            </p>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
              <pre className="text-sm text-gray-300 overflow-x-auto">{`// Canonical format structure
{
  id: "python-expert",
  format: "openskills",
  subtype: "skill",
  content: {
    sections: [
      { type: "metadata", data: { title, description } },
      { type: "instructions", content: "..." },
      { type: "rules", rules: [...] },
      { type: "examples", examples: [...] }
    ]
  }
}`}</pre>
            </div>

            <p className="text-gray-300 leading-relaxed mb-0">
              This means we don't need N×N converters (Cursor→Claude, Claude→Continue, Continue→Windsurf, etc.). We just need <strong className="text-white">N converters</strong>: one to/from each format to canonical.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Adding OpenSkills: Just Two Functions</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              To add OpenSkills support, we only needed:
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                <h4 className="text-lg font-bold text-blue-400 mb-3">fromOpenSkills()</h4>
                <p className="text-gray-300 text-sm mb-3">
                  Parse SKILL.md → canonical
                </p>
                <ul className="space-y-3 text-gray-300 text-sm list-disc ml-6">
                  <li>Extract YAML frontmatter</li>
                  <li>Parse markdown body</li>
                  <li>Map to canonical sections</li>
                </ul>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                <h4 className="text-lg font-bold text-purple-400 mb-3">toOpenSkills()</h4>
                <p className="text-gray-300 text-sm mb-3">
                  Canonical → SKILL.md
                </p>
                <ul className="space-y-3 text-gray-300 text-sm list-disc ml-6">
                  <li>Generate YAML frontmatter</li>
                  <li>Convert sections to markdown</li>
                  <li>Score conversion quality</li>
                </ul>
              </div>
            </div>

            <p className="text-gray-300 leading-relaxed mb-0">
              That's it. Once these two functions exist, OpenSkills packages can instantly be converted to/from <strong className="text-white">all 8 other formats</strong> that PRPM supports (Cursor, Claude, Continue, Windsurf, Copilot, Kiro, agents.md, generic).
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Production-Grade from Day One</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Because we use battle-tested tools and patterns across all converters, OpenSkills support inherited production-grade quality:
            </p>

            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-0">
              <ul className="space-y-3 text-gray-300 list-disc ml-6">
                <li><strong className="text-white">Robust YAML parsing</strong> - Uses js-yaml (8.7M weekly downloads) just like our agents.md, Kiro, and Copilot converters</li>
                <li><strong className="text-white">Comprehensive testing</strong> - 11 tests covering edge cases, malformed input, round-trip conversions</li>
                <li><strong className="text-white">Quality scoring</strong> - Transparent conversion quality metrics (95-100% for most content)</li>
                <li><strong className="text-white">Graceful degradation</strong> - Handles missing frontmatter, malformed YAML, unsupported sections</li>
                <li><strong className="text-white">Server-side caching</strong> - Converted packages cached with Redis for fast delivery</li>
              </ul>
            </div>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">This is Infrastructure</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              PRPM isn't just another package registry—it's <strong className="text-white">infrastructure for the AI coding ecosystem</strong>. The architecture decisions we made (canonical format, converter pattern, quality scoring, caching) mean that:
            </p>

            <ul className="space-y-3 text-gray-300 mb-8 list-disc ml-6">
              <li><strong className="text-white">Adding new formats is fast</strong> - OpenSkills took &lt;1 day, new formats can be added in hours</li>
              <li><strong className="text-white">Quality is consistent</strong> - All converters use the same patterns, same tools, same testing approach</li>
              <li><strong className="text-white">Users get choice</strong> - Publish once, install anywhere, no vendor lock-in</li>
              <li><strong className="text-white">Ecosystem grows together</strong> - OpenSkills community + PRPM community = stronger ecosystem for everyone</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-0">
              This is the same philosophy that made npm, cargo, and pip successful: <strong className="text-white">be the universal layer</strong> that the ecosystem builds on top of.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Conversion Quality</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            PRPM provides transparency about conversion quality:
          </p>

          <div className="not-prose grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <h4 className="text-lg font-bold text-green-400 mb-3">High Quality (95-100%)</h4>
              <ul className="space-y-3 text-gray-300 text-sm list-disc ml-6">
                <li>OpenSkills ↔ Claude Skills</li>
                <li>Instructions convert cleanly</li>
                <li>Rules preserve structure</li>
                <li>Examples maintain formatting</li>
              </ul>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
              <h4 className="text-lg font-bold text-yellow-400 mb-3">Lossy (85-95%)</h4>
              <ul className="space-y-3 text-gray-300 text-sm list-disc ml-6">
                <li>Tools → Markdown section</li>
                <li>Persona → Markdown section</li>
                <li>Quality score reflects loss</li>
                <li>Warnings provided</li>
              </ul>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            OpenSkills doesn't have explicit support for tools or persona sections, so these are converted to markdown. PRPM warns you about this during conversion.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Why This Matters for the Community</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">1. Reduces Fragmentation</h3>
            <p className="text-gray-300 leading-relaxed mb-0">
              The AI coding tool ecosystem is fragmented—Cursor, Claude, Continue, Windsurf, Copilot, Kiro all use different formats. OpenSkills provides a universal format, and PRPM bridges the gap by letting you publish once and install anywhere. This reduces duplication and makes prompts/skills more portable.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">2. Network Effects</h3>
            <p className="text-gray-300 leading-relaxed mb-0">
              By supporting OpenSkills, PRPM can tap into the OpenSkills community (and vice versa). OpenSkills users can discover packages through PRPM's centralized registry. PRPM users can leverage OpenSkills-format packages. Both ecosystems benefit from the combined network.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">3. Future-Proof</h3>
            <p className="text-gray-300 leading-relaxed mb-0">
              As new AI coding tools emerge, they're likely to support OpenSkills (given its momentum) or one of the other established formats. PRPM's architecture—with canonical format at the core and converters to all formats—means new formats can be added easily. We're building infrastructure that scales with the ecosystem.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Try It Now</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            OpenSkills support is live in PRPM today. Get started:
          </p>

          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
            <code className="text-sm text-gray-300">{`# Install PRPM
npm install -g prpm

# Browse OpenSkills-compatible packages
prpm search --format openskills

# Install a package in OpenSkills format
prpm install @community/python-expert --as openskills

# Publish your own OpenSkills skill
prpm publish --format openskills`}</code>
          </pre>

          <div className="not-prose bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8">
            <h4 className="text-lg font-bold text-blue-400 mb-3">Learn More</h4>
            <ul className="space-y-3 text-gray-300 list-disc ml-6">
              <li>
                <Link href="https://docs.prpm.dev/guides/openskills" className="text-prpm-accent hover:underline font-medium">OpenSkills Guide</Link> - Complete documentation
              </li>
              <li>
                <Link href="https://github.com/numman-ali/openskills" className="text-prpm-accent hover:underline font-medium">OpenSkills GitHub</Link> - Official OpenSkills repository
              </li>
              <li>
                <Link href="https://github.com/pr-pm/prpm/pull/94" className="text-prpm-accent hover:underline font-medium">PR #94</Link> - Implementation details
              </li>
              <li>
                <Link href="/search?format=openskills" className="text-prpm-accent hover:underline font-medium">Browse OpenSkills Packages</Link> - PRPM registry
              </li>
            </ul>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">What's Next</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            This is just the beginning. Future improvements we're considering:
          </p>

          <ul className="space-y-3 text-gray-300 mb-8 list-disc ml-6">
            <li><strong className="text-white">Bundled resources support</strong> - Package and install references/, scripts/, assets/</li>
            <li><strong className="text-white">OpenSkills validation</strong> - Check SKILL.md format before publishing</li>
            <li><strong className="text-white">Cross-promotion</strong> - Work with OpenSkills creator on ecosystem growth</li>
            <li><strong className="text-white">Example repository</strong> - Showcase real-world OpenSkills packages</li>
          </ul>

          <div className="not-prose bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-8 mt-12">
            <h3 className="text-2xl font-bold text-white mb-4">Join the Movement</h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              OpenSkills support in PRPM represents a step toward a more unified AI coding tool ecosystem. By supporting universal formats alongside platform-specific ones, we're building infrastructure that benefits everyone—tool creators, skill authors, and users alike.
            </p>
            <p className="text-gray-300 leading-relaxed mb-6">
              Ready to publish your first OpenSkills skill to PRPM?
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="https://docs.prpm.dev/guides/openskills"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Read the Guide →
              </Link>
              <Link
                href="/search?format=openskills"
                className="inline-flex items-center gap-2 bg-prpm-dark-card hover:bg-gray-800 border border-prpm-border text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Browse Packages
              </Link>
            </div>
          </div>
        </div>
      </article>
    </main>
  )
}
