import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Claude Desktop & Claude Code: A Technical Deep Dive",
  description: "Explore Claude's skills system, CLAUDE.md project context, and best practices for optimizing AI context with Claude Search Optimization (CSO).",
  openGraph: {
    title: "Claude Desktop & Claude Code: A Technical Deep Dive",
    description: "Deep dive into Claude's skills-based system and project context files.",
  },
}

export default function ClaudeDeepDivePost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      {/* Navigation */}
      <nav className="border-b border-prpm-border bg-prpm-dark-card backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3">
                <Image src="/logo-icon.svg" alt="PRPM Logo" width={40} height={40} className="w-10 h-10" />
                <span className="text-2xl font-bold bg-gradient-to-r from-prpm-accent to-prpm-purple bg-clip-text text-transparent">
                  PRPM
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/search" className="text-gray-400 hover:text-white transition-colors">
                  Search
                </Link>
                <Link href="/authors" className="text-gray-400 hover:text-white transition-colors">
                  Authors
                </Link>
                <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">
                  Blog
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/pr-pm/prpm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blog
        </Link>

        <header className="mb-12">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-medium">
              Claude
            </span>
            <span className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-medium">
              Skills
            </span>
            <span className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-medium">
              Deep Dive
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 text-white leading-tight">
            Claude Desktop & Claude Code: A Technical Deep Dive
          </h1>

          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span>By PRPM Team</span>
            <span>•</span>
            <span>October 26, 2025</span>
            <span>•</span>
            <span>15 min read</span>
          </div>
        </header>

        <div className="prose prose-invert prose-lg max-w-none">
          <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 mb-8">
            <p className="text-xl text-gray-300 leading-relaxed italic mb-0">
              Claude has four officially supported systems for providing context: CLAUDE.md for project-specific context, <a href="https://docs.claude.com/en/docs/claude-code/skills" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline">Skills</a> for reusable reference documentation, <a href="https://docs.claude.com/en/docs/claude-code/sub-agents" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline">Agents</a> for project-specific tasks, and <a href="https://docs.claude.com/en/docs/claude-code/slash-commands" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline">Commands</a> for quick actions. This deep dive explores Claude's unique approach to context management and optimization.
            </p>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Introduction</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Claude's <a href="https://docs.claude.com/en/docs/claude-code/skills" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline">skills system</a> represents a reference-based approach to AI customization. Unlike other formats that emphasize always-on rules, Claude uses a discoverable skills-based system where each skill is optimized for Claude's search system. Read more about <a href="https://support.claude.com/en/articles/12512176-what-are-skills" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline">what skills are</a> and Anthropic's vision for <a href="https://www.anthropic.com/news/skills" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline">agent skills</a>.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">CLAUDE.md: Always-On Project Context</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            According to Anthropic's official best practices, CLAUDE.md is a special configuration file that Claude Code automatically pulls into context when starting a conversation. It serves as your project's persistent memory.
          </p>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">What to include in CLAUDE.md:</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">✓</span>
                <span>Common bash commands (<code className="bg-prpm-dark px-2 py-1 rounded">npm run build</code>, <code className="bg-prpm-dark px-2 py-1 rounded">npm test</code>)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">✓</span>
                <span>Core files and utility functions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">✓</span>
                <span>Code style guidelines (ES modules vs CommonJS, naming conventions)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">✓</span>
                <span>Testing instructions and coverage requirements</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">✓</span>
                <span>Unexpected project behaviors or gotchas</span>
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Skills: Reusable Reference Documentation</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Skills are self-contained reference guides for proven techniques, patterns, or tools. Unlike CLAUDE.md (which is always loaded), skills are discoverable - Claude consults them only when relevant.
          </p>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">📁 Required File Structure & Naming</h3>
            <p className="text-gray-300 mb-3">
              According to <a href="https://docs.claude.com/en/docs/claude-code/skills" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline">Claude's official documentation</a>, skills have strict requirements:
            </p>
            <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4 font-mono text-sm text-gray-400 mb-4">
              .claude/skills/<br/>
              └── my-skill/<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;└── SKILL.md  ← Must be named SKILL.md (all caps)
            </div>
            <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4 mb-3">
              <p className="text-white font-semibold mb-2">Character Limits:</p>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-prpm-accent">•</span>
                  <span><strong>Skill name:</strong> Max 64 characters, lowercase letters, numbers, and hyphens only</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-prpm-accent">•</span>
                  <span><strong>Description:</strong> Max 1024 characters (aim for 100-800 for optimal discoverability)</span>
                </li>
              </ul>
            </div>
            <p className="text-gray-300 text-sm">
              PRPM enforces these requirements during package installation and publishing to ensure compatibility with Claude Desktop and Claude Code.
            </p>
          </div>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Claude Search Optimization (CSO)</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Future Claude instances read the <code className="bg-prpm-dark border border-prpm-border px-2 py-1 rounded">description</code> field to decide if a skill is relevant. Bad descriptions mean skills won't be found.
          </p>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-6 mb-6">
            <p className="text-gray-300 mb-4">✅ <strong>Good</strong>: Specific triggers + clear benefit</p>
            <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4 mb-4 font-mono text-sm text-gray-400">
              description: Use when encountering TypeScript type errors or designing type-safe APIs - provides patterns for strict typing, type guards, and generic constraints
            </div>

            <p className="text-gray-300 mb-4">❌ <strong>Bad</strong>: Too vague</p>
            <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4 font-mono text-sm text-gray-400">
              description: For TypeScript help
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Skills vs Agents vs Commands vs CLAUDE.md</h2>
          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-6">
            <table className="w-full text-gray-300 text-sm">
              <thead>
                <tr className="border-b border-prpm-border">
                  <th className="text-left py-2 pr-4">Type</th>
                  <th className="text-left py-2 pr-4">Activation</th>
                  <th className="text-left py-2">Use Case</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-prpm-border/50">
                <tr>
                  <td className="py-2 pr-4 font-bold">CLAUDE.md</td>
                  <td className="py-2 pr-4">Always (auto-loaded)</td>
                  <td className="py-2">"Run pnpm install", "Use App Router"</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-bold">Skills</td>
                  <td className="py-2 pr-4">On-demand (search)</td>
                  <td className="py-2">"How to implement rate limiting"</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-bold">Agents</td>
                  <td className="py-2 pr-4">Explicit invoke</td>
                  <td className="py-2">@agent-name invocation</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-bold">Commands</td>
                  <td className="py-2 pr-4">Slash command</td>
                  <td className="py-2">/review-code, /write-tests</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Best Practices</h2>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Optimize for Discovery (CSO)</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Write skill descriptions that start with triggering conditions ("Use when...") and include specific symptoms that developers will search for.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Match Specificity to Degrees of Freedom</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            For creative tasks with high degrees of freedom, provide broad guidance. For critical operations with low degrees of freedom, provide explicit step-by-step instructions.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Official Resources</h2>
          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">📚 Claude Documentation</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">→</span>
                <span>
                  <a href="https://docs.claude.com/en/docs/claude-code/skills" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline font-semibold">Skills Documentation</a>
                  {' '}- Official technical documentation for Claude Code skills
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">→</span>
                <span>
                  <a href="https://docs.claude.com/en/docs/claude-code/sub-agents" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline font-semibold">Sub-Agents Documentation</a>
                  {' '}- How to create and use Claude sub-agents
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">→</span>
                <span>
                  <a href="https://docs.claude.com/en/docs/claude-code/slash-commands" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline font-semibold">Slash Commands Documentation</a>
                  {' '}- Creating custom slash commands
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">→</span>
                <span>
                  <a href="https://support.claude.com/en/articles/12512176-what-are-skills" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline font-semibold">What are Skills?</a>
                  {' '}- Claude support article explaining skills concept
                </span>
              </li>
            </ul>

            <h3 className="text-xl font-bold text-white mb-4 mt-6">🔬 Anthropic Blog Posts</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-prpm-purple mt-1">→</span>
                <span>
                  <a href="https://www.anthropic.com/news/skills" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline font-semibold">Skills Announcement</a>
                  {' '}- Anthropic's vision for agent skills
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-purple mt-1">→</span>
                <span>
                  <a href="https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline font-semibold">Equipping Agents for the Real World</a>
                  {' '}- Deep technical dive into agent skills architecture
                </span>
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Conclusion</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Claude's skills system represents a reference-based approach where skills are documentation, not instructions. CSO optimization is critical for discovery, and examples matter more than explanations. PRPM fully supports Claude's frontmatter parsing, skills vs agents detection, and CSO validation.
          </p>

          <div className="bg-gradient-to-r from-prpm-accent/20 to-prpm-purple/20 border border-prpm-accent/30 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Explore More Format Deep Dives</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/blog/copilot-deep-dive"
                className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all"
              >
                GitHub Copilot Deep Dive
              </Link>
              <Link
                href="/blog"
                className="px-6 py-3 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white rounded-lg font-semibold transition-all"
              >
                View All Posts
              </Link>
            </div>
          </div>
        </div>

        <footer className="mt-12 pt-8 border-t border-prpm-border">
          <div className="flex items-center justify-between">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Blog
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm">Share this post:</span>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Claude Desktop & Claude Code: A Technical Deep Dive')}&url=${encodeURIComponent('https://prpm.dev/blog/claude-deep-dive')}&via=prpmdev`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#1DA1F2] transition-colors"
                aria-label="Share on Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </article>
    </main>
  )
}
