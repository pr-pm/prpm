import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Best Cursor Rules: Complete Guide 2025 - PRPM",
  description: "Discover the best Cursor rules for AI-powered development. Compare PRPM vs cursor.directory. Get CLI installation, version control, format conversion, and a testing playground.",
  openGraph: {
    title: "Best Cursor Rules: Complete Guide 2025",
    description: "Find and install the best Cursor rules. Get CLI installation, version control, format conversion, and testing playground. Compare PRPM vs cursor.directory.",
  },
}

export default function DiscoveringCursorRulesPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Cursor', 'Discovery', 'Comparison']}
          title="Best Cursor Rules: Complete Guide 2025"
          subtitle="Compare PRPM vs cursor.directory for discovering and installing Cursor rules"
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

          <p>Finding Cursor rules means browsing multiple sources:</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li><a href="https://cursor.directory" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline">cursor.directory</a> - The main marketplace, browse and copy files</li>
              <li><a href="https://dotcursorrules.com" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline">dotcursorrules.com</a> - Community collection, manual download</li>
              <li><a href="https://www.cursorhow.com/en/agent-skills-hub" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline">CursorHow</a> - Mixed with Claude skills</li>
              <li>GitHub repos, Twitter, Reddit</li>
            </ul>
          </div>

          <p>These work fine for single-project setups, but fall short when you need:</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li>Version control and update notifications</li>
              <li>CLI installation (no more copy-paste)</li>
              <li>Format conversion (use Cursor rules in Claude, Copilot, etc.)</li>
              <li>Testing before installing</li>
              <li>Team-wide package management</li>
            </ul>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Feature Comparison</h2>
          </div>

          <div className="not-prose overflow-x-auto mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-prpm-border">
                  <th className="text-left p-3 text-white font-semibold">Feature</th>
                  <th className="text-left p-3 text-white font-semibold">cursor.directory</th>
                  <th className="text-left p-3 text-white font-semibold">dotcursorrules</th>
                  <th className="text-left p-3 text-prpm-accent font-semibold">PRPM</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Installation</td>
                  <td className="p-3">Copy-paste</td>
                  <td className="p-3">Manual download</td>
                  <td className="p-3 text-green-400">CLI command</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Version Control</td>
                  <td className="p-3">❌</td>
                  <td className="p-3">❌</td>
                  <td className="p-3 text-green-400">✅</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Updates</td>
                  <td className="p-3">Manual</td>
                  <td className="p-3">Manual</td>
                  <td className="p-3 text-green-400">prpm update</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Format Conversion</td>
                  <td className="p-3">❌</td>
                  <td className="p-3">❌</td>
                  <td className="p-3 text-green-400">✅ All editors</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Testing</td>
                  <td className="p-3">❌</td>
                  <td className="p-3">❌</td>
                  <td className="p-3 text-green-400">✅ Playground</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Collections</td>
                  <td className="p-3">❌</td>
                  <td className="p-3">❌</td>
                  <td className="p-3 text-green-400">✅</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">CI/CD Integration</td>
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

          <p>cursor.directory: Find rule, copy content, create <code>.cursorrules</code>, paste, save. Repeat for multiple rules.</p>
          <p>PRPM: <code>prpm install @nextjs/app-router</code> — Done in 3 seconds.</p>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">Version Control & Updates</h3>
          </div>

          <p>cursor.directory: Rule authors update their rules. You never know unless you manually check.</p>
          <p>PRPM: <code>prpm outdated</code> shows what changed. Update with one command, see changelogs.</p>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">Format Conversion</h3>
          </div>

          <p>cursor.directory: Cursor rules stay Cursor rules.</p>
          <p>PRPM: Install any Cursor rule for Claude, Copilot, Windsurf automatically. <code>prpm install @react/hooks --format claude</code></p>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">Testing Before Installing</h3>
          </div>

          <p>cursor.directory: Read description, hope it works.</p>
          <p>PRPM: Test with real AI models in <Link href="/playground" className="text-prpm-accent hover:underline">playground</Link>. See actual output before committing.</p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Quick Start</h2>
          </div>

          <pre><code>{`# Install CLI
npm install -g prpm

# Search for Cursor rules
prpm search "next.js" --format cursor

# Test in playground
prpm playground @nextjs/app-router "Create server action"

# Install
prpm install @nextjs/app-router

# Install collection for complete setup
prpm install @prpm/cursor-essentials

# Keep updated
prpm update`}</code></pre>

          <div className="not-prose my-12 p-8 bg-gradient-to-br from-prpm-accent/10 to-prpm-green/10 border border-prpm-accent/30 rounded-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Upgrade Your Cursor Workflow</h3>
            <p className="text-gray-300 mb-6">
              7,000+ packages with CLI installation, version control, and format conversion. Move beyond manual copy-paste.
            </p>
            <div className="flex gap-4">
              <Link
                href="/search?format=cursor"
                className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent/80 text-white font-semibold rounded-lg transition-all"
              >
                Browse Cursor Rules
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
            <Link href="/blog/top-50-cursor-rules" className="block p-6 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent rounded-xl transition-all">
              <h3 className="text-lg font-bold text-white mb-2">Top 50 Cursor Rules</h3>
              <p className="text-gray-400 text-sm">Supercharge your workflow</p>
            </Link>
            <Link href="/blog/discovering-claude-skills-prpm-vs-competition" className="block p-6 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent rounded-xl transition-all">
              <h3 className="text-lg font-bold text-white mb-2">Discovering Claude Skills</h3>
              <p className="text-gray-400 text-sm">PRPM vs The Competition</p>
            </Link>
          </div>
        </div>
      </article>

      <BlogFooter
        postTitle="Best Cursor Rules: Complete Guide 2025"
        postUrl="/blog/discovering-cursor-rules"
      />
    </main>
  )
}
