import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "PRPM Now Supports OpenSkills: Universal Skills for AI Coding Agents",
  description: "PRPM adds native OpenSkills format support with robust js-yaml parsing. Install OpenSkills packages from PRPM's registry or publish your own - all with automatic format conversion.",
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

        <div className="prose prose-invert prose-lg max-w-none">
          <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 mb-8">
            <p className="text-xl text-gray-300 leading-relaxed italic mb-0">
              Today we're excited to announce native <strong className="text-white">OpenSkills</strong> format support in PRPM. OpenSkills is a universal skills loader that launched October 26, 2025, and has already gained significant traction (629 stars in 2 days). Now you can publish and install OpenSkills packages through PRPM's centralized registry—with automatic format conversion to Cursor, Claude, Continue, Windsurf, and more.
            </p>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">What is OpenSkills?</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            <Link href="https://github.com/numman-ali/openskills" className="text-blue-400 hover:text-blue-300 underline">OpenSkills</Link> is a universal skills loader for AI coding agents that replicates Anthropic's Claude Code skills system across multiple platforms. Created by <Link href="https://github.com/numman-ali" className="text-blue-400 hover:text-blue-300 underline">@numman-ali</Link>, it uses a simple <code className="bg-prpm-dark border border-prpm-border px-2 py-1 rounded">SKILL.md</code> format with YAML frontmatter and markdown instructions.
          </p>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
            <h4 className="text-lg font-bold text-blue-400 mb-3">🎓 OpenSkills Key Features</h4>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-blue-400">•</span>
                <div><strong className="text-white">Universal format</strong> - Works across Claude Code, Cursor, Windsurf, Aider</div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400">•</span>
                <div><strong className="text-white">Progressive disclosure</strong> - Skills load only when needed</div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400">•</span>
                <div><strong className="text-white">CLI management</strong> - Simple command-line tool for installing skills</div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400">•</span>
                <div><strong className="text-white">Bundled resources</strong> - Support for references/, scripts/, assets/</div>
              </li>
            </ul>
          </div>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Example OpenSkills SKILL.md</h3>
          <pre className="bg-prpm-dark border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
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

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Why We Added OpenSkills Support</h2>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">1. Strong Community Momentum</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            OpenSkills launched on October 26, 2025, and immediately resonated with developers—reaching <strong className="text-white">629 stars in just 2 days</strong>. This rapid adoption signals a real need for universal, cross-platform skills management. By supporting OpenSkills, PRPM positions itself as the package manager for <em>all</em> AI agent formats, not just PRPM's own ecosystem.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">2. Complementary Strengths</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            OpenSkills and PRPM solve different problems but work beautifully together:
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <h4 className="text-lg font-bold text-purple-400 mb-3">🎓 OpenSkills</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Universal SKILL.md format</li>
                <li>• Multi-platform compatibility</li>
                <li>• Progressive disclosure</li>
                <li>• GitHub-based distribution</li>
              </ul>
            </div>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <h4 className="text-lg font-bold text-green-400 mb-3">📦 PRPM</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Centralized registry & discovery</li>
                <li>• Auto format conversion</li>
                <li>• Collections (bundle packages)</li>
                <li>• Analytics & versioning</li>
              </ul>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            <strong className="text-white">Together:</strong> Publish once in OpenSkills format to PRPM. Users discover via PRPM's registry, install in any format (Cursor, Claude, Continue, etc.), and benefit from both ecosystems.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">3. Strategic Positioning</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            This positions PRPM as the <strong className="text-white">universal package manager for AI development</strong>—supporting not just our own formats, but the broader ecosystem. Just as npm supports different module formats, PRPM now supports different prompt/skill formats.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">How It Works</h2>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Install OpenSkills Packages</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            Install any OpenSkills package from PRPM's registry:
          </p>
          <pre className="bg-prpm-dark border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
            <code className="text-sm text-gray-300">{`# Install as OpenSkills format
prpm install @user/python-expert --as openskills

# Installs to: .claude/skills/python-expert/SKILL.md

# Or install with auto-conversion to your preferred format
prpm install @user/python-expert --as cursor     # → .cursor/rules/
prpm install @user/python-expert --as windsurf   # → .windsurf/rules/`}</code>
          </pre>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Publish OpenSkills Packages</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            Publish your OpenSkills skills to PRPM's centralized registry:
          </p>
          <pre className="bg-prpm-dark border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
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

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Convert Between Formats</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            PRPM automatically converts between OpenSkills and other formats:
          </p>
          <pre className="bg-prpm-dark border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
            <code className="text-sm text-gray-300">{`# Convert Claude skill to OpenSkills
prpm convert my-skill.md --to openskills

# Convert OpenSkills to Cursor
prpm convert SKILL.md --to cursor

# Conversion happens automatically during install
prpm install @user/openskills-package --as claude`}</code>
          </pre>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Technical Deep Dive: Robust YAML Parsing</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            One of the key challenges in supporting OpenSkills was handling the variety of YAML frontmatter that users might write. We initially built a simple string-based parser, but quickly realized it couldn't handle real-world complexity.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">The Problem with Simple Parsing</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            Our first implementation used basic string splitting:
          </p>
          <pre className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 overflow-x-auto mb-6">
            <code className="text-sm text-gray-300">{`// ❌ Simple parser - breaks on complex YAML
const lines = frontmatterContent.split('\\n');
for (const line of lines) {
  const colonIndex = line.indexOf(':');
  if (colonIndex > 0) {
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    frontmatter[key] = value;
  }
}`}</code>
          </pre>

          <p className="text-gray-300 leading-relaxed mb-4">
            <strong className="text-white">This failed on:</strong>
          </p>
          <ul className="space-y-2 text-gray-300 mb-6 ml-6">
            <li className="flex items-start gap-3">
              <span className="text-red-400">✗</span>
              <div>Multi-line strings (<code className="bg-prpm-dark border border-prpm-border px-2 py-1 rounded text-xs">description: &gt;</code>)</div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400">✗</span>
              <div>Arrays (<code className="bg-prpm-dark border border-prpm-border px-2 py-1 rounded text-xs">tags: [python, testing]</code>)</div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400">✗</span>
              <div>Nested objects</div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400">✗</span>
              <div>Quoted strings with colons (<code className="bg-prpm-dark border border-prpm-border px-2 py-1 rounded text-xs">"Contains: colon"</code>)</div>
            </li>
          </ul>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">The Solution: js-yaml</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            We replaced the simple parser with <code className="bg-prpm-dark border border-prpm-border px-2 py-1 rounded">js-yaml</code>, the industry-standard YAML parsing library:
          </p>
          <pre className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 overflow-x-auto mb-6">
            <code className="text-sm text-gray-300">{`// ✅ Robust parser with js-yaml
import yaml from 'js-yaml';

try {
  const frontmatter = yaml.load(frontmatterContent) as Record<string, any>;
  return { frontmatter: frontmatter || {}, body };
} catch (error) {
  // Graceful fallback for malformed YAML
  console.warn('Failed to parse YAML:', error);
  return { frontmatter: {}, body };
}`}</code>
          </pre>

          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
            <h4 className="text-lg font-bold text-green-400 mb-3">✨ Benefits of js-yaml</h4>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <div><strong className="text-white">Handles complex YAML</strong> - Multi-line strings, arrays, nested objects</div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <div><strong className="text-white">Battle-tested</strong> - Used by thousands of projects, 8.7M weekly downloads on npm</div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <div><strong className="text-white">Graceful error handling</strong> - Falls back to empty frontmatter on parse errors</div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <div><strong className="text-white">Consistent</strong> - Same library used in our agents.md, Kiro, and Copilot converters</div>
              </li>
            </ul>
          </div>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Now Supports Complex YAML</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            With js-yaml, PRPM can parse sophisticated OpenSkills frontmatter:
          </p>
          <pre className="bg-prpm-dark border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
            <code className="text-sm text-gray-300">{`---
name: advanced-skill
description: >
  This is a multi-line description
  that spans multiple lines and
  preserves line breaks appropriately
tags:
  - python
  - testing
  - best-practices
config:
  level: advanced
  duration: 30min
  prerequisites:
    - basic-python
    - git-fundamentals
examples:
  - "Use like: prpm install"
  - "Convert: prpm convert"
---`}</code>
          </pre>

          <p className="text-gray-300 leading-relaxed mb-6">
            All of this now parses correctly, extracting nested config, arrays of tags, and quoted strings with special characters.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Test Coverage: 11/11 Passing</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            We added comprehensive test coverage to ensure robustness:
          </p>
          <pre className="bg-prpm-dark border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
            <code className="text-sm text-gray-300">{`✓ fromOpenSkills > parses basic SKILL.md format
✓ fromOpenSkills > handles missing frontmatter gracefully
✓ fromOpenSkills > extracts H1 title from body
✓ fromOpenSkills > handles complex YAML with multiline strings
✓ fromOpenSkills > handles YAML with nested objects
✓ fromOpenSkills > handles YAML with quoted strings containing colons
✓ fromOpenSkills > handles malformed YAML gracefully
✓ toOpenSkills > converts canonical to SKILL.md format
✓ toOpenSkills > handles tools section with warning
✓ toOpenSkills > handles rules and examples sections
✓ round-trip conversion > preserves content through round-trip`}</code>
          </pre>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Conversion Quality</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            PRPM provides transparency about conversion quality:
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <h4 className="text-lg font-bold text-green-400 mb-3">High Quality (95-100%)</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• OpenSkills ↔ Claude Skills</li>
                <li>• Instructions convert cleanly</li>
                <li>• Rules preserve structure</li>
                <li>• Examples maintain formatting</li>
              </ul>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
              <h4 className="text-lg font-bold text-yellow-400 mb-3">Lossy (85-95%)</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Tools → Markdown section</li>
                <li>• Persona → Markdown section</li>
                <li>• Quality score reflects loss</li>
                <li>• Warnings provided</li>
              </ul>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            OpenSkills doesn't have explicit support for tools or persona sections, so these are converted to markdown. PRPM warns you about this during conversion.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Why This Matters for the Community</h2>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">1. Reduces Fragmentation</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            The AI coding tool ecosystem is fragmented—Cursor, Claude, Continue, Windsurf, Copilot, Kiro all use different formats. OpenSkills provides a universal format, and PRPM bridges the gap by letting you publish once and install anywhere. This reduces duplication and makes prompts/skills more portable.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">2. Network Effects</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            By supporting OpenSkills, PRPM can tap into the OpenSkills community (and vice versa). OpenSkills users can discover packages through PRPM's centralized registry. PRPM users can leverage OpenSkills-format packages. Both ecosystems benefit from the combined network.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">3. Future-Proof</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            As new AI coding tools emerge, they're likely to support OpenSkills (given its momentum) or one of the other established formats. PRPM's architecture—with canonical format at the core and converters to all formats—means new formats can be added easily. We're building infrastructure that scales with the ecosystem.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Try It Now</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            OpenSkills support is live in PRPM today. Get started:
          </p>
          <pre className="bg-prpm-dark border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
            <code className="text-sm text-gray-300">{`# Install PRPM
npm install -g prpm

# Browse OpenSkills-compatible packages
prpm search --format openskills

# Install a package in OpenSkills format
prpm install @community/python-expert --as openskills

# Publish your own OpenSkills skill
prpm publish --format openskills`}</code>
          </pre>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
            <h4 className="text-lg font-bold text-blue-400 mb-3">📚 Learn More</h4>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-blue-400">•</span>
                <div>
                  <Link href="https://docs.prpm.dev/guides/openskills" className="text-blue-400 hover:text-blue-300 underline">OpenSkills Guide</Link> - Complete documentation
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400">•</span>
                <div>
                  <Link href="https://github.com/numman-ali/openskills" className="text-blue-400 hover:text-blue-300 underline">OpenSkills GitHub</Link> - Official OpenSkills repository
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400">•</span>
                <div>
                  <Link href="https://github.com/pr-pm/prpm/pull/94" className="text-blue-400 hover:text-blue-300 underline">PR #94</Link> - Implementation details
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400">•</span>
                <div>
                  <Link href="/search?format=openskills" className="text-blue-400 hover:text-blue-300 underline">Browse OpenSkills Packages</Link> - PRPM registry
                </div>
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">What's Next</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            This is just the beginning. Future improvements we're considering:
          </p>
          <ul className="space-y-2 text-gray-300 mb-6 ml-6">
            <li className="flex items-start gap-3">
              <span className="text-purple-400">→</span>
              <div><strong className="text-white">Bundled resources support</strong> - Package and install references/, scripts/, assets/</div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400">→</span>
              <div><strong className="text-white">OpenSkills validation</strong> - Check SKILL.md format before publishing</div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400">→</span>
              <div><strong className="text-white">Cross-promotion</strong> - Work with OpenSkills creator on ecosystem growth</div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400">→</span>
              <div><strong className="text-white">Example repository</strong> - Showcase real-world OpenSkills packages</div>
            </li>
          </ul>

          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-8 mt-12">
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

      <BlogFooter
        previousPost={{
          title: "Top 50 Cursor Rules",
          href: "/blog/top-50-cursor-rules"
        }}
        nextPost={{
          title: "agents.md: The Complete Guide",
          href: "/blog/agents-md-deep-dive"
        }}
      />
    </main>
  )
}
