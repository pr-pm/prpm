import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Best Way to Discover Claude Skills - Large Collection - PRPM vs ctx.directory, SkillsMP, CursorHow",
  description: "The best way to discover Claude skills. Access a large collection with PRPM. Compare to ctx.directory, SkillsMP, CursorHow, and dotcursorrules. One command vs manual copy-paste.",
  openGraph: {
    title: "Best Way to Discover Claude Skills - Large Collection",
    description: "Why PRPM is the best way to discover Claude skills with a large collection and unified marketplace.",
  },
}

export default function DiscoveringClaudeSkillsPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Claude', 'Discovery', 'Comparison']}
          title="Best Way to Discover Claude Skills: Large Collection"
          subtitle="Compare PRPM's large collection to ctx.directory, SkillsMP, CursorHow, and dotcursorrules"
          author="PRPM Team"
          date="November 4, 2025"
          readTime="5 min read"
        />

        <div className="prose prose-invert prose-lg max-w-none
          prose-headings:text-white prose-headings:font-bold
          prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
          prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
          prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-4
          prose-a:text-prpm-accent prose-a:no-underline hover:prose-a:underline
          prose-code:text-prpm-accent prose-code:bg-prpm-dark-card/50 prose-code:px-2 prose-code:py-1 prose-code:rounded
          prose-pre:bg-prpm-dark-card prose-pre:border prose-pre:border-prpm-border prose-pre:rounded-xl prose-pre:p-6
          prose-strong:text-white
          prose-ul:my-4 prose-ul:text-gray-300
          prose-li:text-gray-300
        ">

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">The Current State</h2>
          </div>

          <p>Looking for a large collection of Claude skills? You'll find scattered options across multiple platforms with no unified access:</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li><a href="https://ctx.directory" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline">ctx.directory</a> - Browse by creator, copy markdown files</li>
              <li><a href="https://skillsmp.com" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline">SkillsMP</a> - Search marketplace, download files</li>
              <li><a href="https://davila7.github.io/claude-code-templates/" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline">Claude Code Templates</a> - GitHub Pages collection, manual copy</li>
              <li><a href="https://claude-plugins.dev" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline">Claude Plugins</a> - Third-party plugin directory (different from skills)</li>
              <li>GitHub repos, Discord, Reddit</li>
            </ul>
          </div>

          <p>PRPM provides a large collection of Claude skills unified with Cursor rules, Copilot instructions, and more — all in one searchable registry with CLI installation and version control.</p>

          <div className="not-prose bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 my-6">
            <p className="text-blue-400 font-semibold mb-2">💡 Note: Skills vs Anthropic's Plugin System</p>
            <p className="text-gray-300 text-sm mb-2">
              Claude Code has an <a href="https://www.claude.com/blog/claude-code-plugins" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">official plugin system</a> that packages slash commands, subagents, MCP servers, and hooks. Skills are markdown files with instructions that can be part of plugins.
            </p>
            <p className="text-gray-300 text-sm mb-0">
              PRPM focuses on cross-platform package distribution (Claude, Cursor, Copilot, etc.) with CLI installation and version control, while Anthropic's plugins are Claude Code-specific. <a href="/blog/prpm-vs-plugins" className="text-blue-400 hover:underline">Learn more about the difference →</a>
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Feature Comparison</h2>
          </div>

          <div className="not-prose overflow-x-auto mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-prpm-border">
                  <th className="text-left p-3 text-white font-semibold">Feature</th>
                  <th className="text-left p-3 text-white font-semibold">ctx.directory</th>
                  <th className="text-left p-3 text-white font-semibold">SkillsMP</th>
                  <th className="text-left p-3 text-white font-semibold">Claude Code Templates</th>
                  <th className="text-left p-3 text-prpm-accent font-semibold">PRPM</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Large Collection</td>
                  <td className="p-3">Partial</td>
                  <td className="p-3">Claude only</td>
                  <td className="p-3">Small</td>
                  <td className="p-3 text-green-400">✅ All formats</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">CLI Install</td>
                  <td className="p-3">❌</td>
                  <td className="p-3">❌</td>
                  <td className="p-3">❌</td>
                  <td className="p-3 text-green-400">✅</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Version Control</td>
                  <td className="p-3">❌</td>
                  <td className="p-3">❌</td>
                  <td className="p-3">❌</td>
                  <td className="p-3 text-green-400">✅</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Format Conversion</td>
                  <td className="p-3">❌</td>
                  <td className="p-3">❌</td>
                  <td className="p-3">❌</td>
                  <td className="p-3 text-green-400">✅</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Testing Playground</td>
                  <td className="p-3">❌</td>
                  <td className="p-3">❌</td>
                  <td className="p-3">❌</td>
                  <td className="p-3 text-green-400">✅</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Unified Search</td>
                  <td className="p-3">Partial</td>
                  <td className="p-3">Claude only</td>
                  <td className="p-3">❌</td>
                  <td className="p-3 text-green-400">✅ All formats</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Collections</td>
                  <td className="p-3">❌</td>
                  <td className="p-3">❌</td>
                  <td className="p-3">❌</td>
                  <td className="p-3 text-green-400">✅</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Why PRPM</h2>
          </div>

          <div className="not-prose mb-8">
            <h3 className="text-2xl font-bold text-white mb-3">One Command Installation</h3>
          </div>

          <p>Other platforms:</p>
          <div className="not-prose mb-4">
            <ol className="list-decimal ml-6 text-gray-300 space-y-2">
              <li>Find skill on website</li>
              <li>Copy markdown content</li>
              <li>Create <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded text-sm">.claude/skills/name.md</code></li>
              <li>Paste content</li>
              <li>Hope it works</li>
            </ol>
          </div>

          <p>PRPM:</p>
          <pre><code>prpm install @author/code-review-skill</code></pre>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">Version Control</h3>
          </div>

          <p>Other platforms: Manually check for updates, re-download, replace files.</p>
          <p>PRPM: <code>prpm update</code> shows what's changed, updates everything.</p>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">Format Conversion</h3>
          </div>

          <p>Other platforms: Claude skills stay Claude skills.</p>
          <p>PRPM: Install any package for any editor. Convert Claude skills to Cursor rules automatically.</p>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">Testing Before Installing</h3>
          </div>

          <p>Other platforms: Install and hope it works.</p>
          <p>PRPM: Test in playground with real AI models. See actual results before committing.</p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Quick Start</h2>
          </div>

          <pre><code>{`# Install CLI
npm install -g prpm

# Search for Claude skills
prpm search claude skill

# Test in playground (5 free credits)
prpm playground @author/code-review-skill

# Install
prpm install @author/code-review-skill

# Keep updated
prpm update`}</code></pre>

          <div className="not-prose my-12 p-8 bg-gradient-to-br from-prpm-accent/10 to-prpm-green/10 border border-prpm-accent/30 rounded-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Access Our Large Collection of Claude Skills</h3>
            <p className="text-gray-300 mb-6">
              Browse our large collection of Claude skills, Cursor rules, Copilot instructions, and more. CLI installation, version control, testing playground.
            </p>
            <div className="flex gap-4">
              <Link
                href="/search?format=claude"
                className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent/80 text-white font-semibold rounded-lg transition-all"
              >
                Browse Large Collection
              </Link>
              <Link
                href="/playground"
                className="px-6 py-3 bg-prpm-dark border border-prpm-border hover:border-prpm-accent text-white font-semibold rounded-lg transition-all"
              >
                Try Playground
              </Link>
            </div>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Related Posts</h2>
          </div>

          <div className="not-prose grid gap-4 md:grid-cols-2 mb-8">
            <Link href="/blog/prpm-vs-plugins" className="block p-6 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent rounded-xl transition-all">
              <h3 className="text-lg font-bold text-white mb-2">PRPM vs Claude Plugins</h3>
              <p className="text-gray-400 text-sm">What's the difference?</p>
            </Link>
            <Link href="/blog/discovering-cursor-rules" className="block p-6 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent rounded-xl transition-all">
              <h3 className="text-lg font-bold text-white mb-2">Finding Cursor Rules</h3>
              <p className="text-gray-400 text-sm">Beyond cursor.directory</p>
            </Link>
            <Link href="/blog/playground-launch" className="block p-6 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent rounded-xl transition-all">
              <h3 className="text-lg font-bold text-white mb-2">PRPM Playground</h3>
              <p className="text-gray-400 text-sm">Test before installing</p>
            </Link>
            <Link href="/blog/when-to-use-claude-skill-vs-subagent" className="block p-6 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent rounded-xl transition-all">
              <h3 className="text-lg font-bold text-white mb-2">Skills vs Sub-Agents</h3>
              <p className="text-gray-400 text-sm">When to use each in Claude Code</p>
            </Link>
          </div>
        </div>
      </article>

      <BlogFooter
        postTitle="Best Way to Discover Claude Skills: Large Collection"
        postUrl="/blog/discovering-claude-skills-prpm-vs-competition"
      />
    </main>
  )
}
