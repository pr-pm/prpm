import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Windsurf Rules Discovery: Centralized from Day One - PRPM",
  description: "PRPM brings centralized discovery to Windsurf rules from the start. Skip the GitHub hunting phase—get CLI installation, version control, and testing now.",
  openGraph: {
    title: "Windsurf Rules Discovery: Centralized from Day One",
    description: "Why centralized package management is essential for Windsurf's early ecosystem. Build it right from the beginning.",
  },
}

export default function DiscoveringWindsurfRulesPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Windsurf', 'Discovery', 'Early Adoption']}
          title="Windsurf Rules Discovery: Centralized from Day One"
          subtitle="Building the right discovery infrastructure from the start"
          author="PRPM Team"
          date="November 4, 2025"
          readTime="4 min read"
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
            <h2 className="text-3xl font-bold text-white mb-0">The Opportunity</h2>
          </div>

          <p>Windsurf is new. Its ecosystem is forming now. Early adopters are creating rules, sharing setups, building patterns.</p>

          <p>But there's no centralized discovery yet. We've seen this before with Cursor, Claude, Copilot:</p>

          <div className="not-prose mb-8">
            <ol className="list-decimal ml-6 text-gray-300 space-y-2">
              <li>Tool launches with custom rule support</li>
              <li>Users create rules, share in Discord/Reddit</li>
              <li>GitHub repos accumulate scattered examples</li>
              <li>Discovery gets harder as ecosystem grows</li>
              <li>Someone builds a marketplace (years later)</li>
              <li>Knowledge is already fragmented</li>
            </ol>
          </div>

          <p><strong>Windsurf can skip this fragmentation.</strong> PRPM offers centralized discovery from day one.</p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Feature Comparison</h2>
          </div>

          <div className="not-prose overflow-x-auto mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-prpm-border">
                  <th className="text-left p-3 text-white font-semibold">Task</th>
                  <th className="text-left p-3 text-white font-semibold">Scattered Discovery</th>
                  <th className="text-left p-3 text-prpm-accent font-semibold">PRPM (Available Now)</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Finding rules</td>
                  <td className="p-3">Search GitHub, ask Discord</td>
                  <td className="p-3 text-green-400">prpm search --format windsurf</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Installation</td>
                  <td className="p-3">Clone repos, copy files</td>
                  <td className="p-3 text-green-400">prpm install @package</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Quality signals</td>
                  <td className="p-3">None</td>
                  <td className="p-3 text-green-400">Ratings, downloads, tests</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Testing</td>
                  <td className="p-3">Install and hope</td>
                  <td className="p-3 text-green-400">Playground with real models</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Updates</td>
                  <td className="p-3">Manual repo checks</td>
                  <td className="p-3 text-green-400">prpm update</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Cross-editor support</td>
                  <td className="p-3">Locked to Windsurf</td>
                  <td className="p-3 text-green-400">Convert to any format</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Why PRPM</h2>
          </div>

          <div className="not-prose mb-8">
            <h3 className="text-2xl font-bold text-white mb-3">Centralized from Day One</h3>
          </div>

          <p>Scattered approach: GitHub repos with no standardization, Discord messages that disappear, personal collections that stay private.</p>
          <p>PRPM: One place to search, install, and update. Standards emerge naturally. Community grows faster.</p>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">CLI Installation</h3>
          </div>

          <p>Manual: Search GitHub for "windsurf rules react", browse repos, copy files, create <code>.windsurfrules</code>, paste, fix conflicts.</p>
          <p>PRPM: <code>prpm install @react/modern-patterns --format windsurf</code> — Done. File created automatically.</p>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">Format Conversion</h3>
          </div>

          <p>Early ecosystem limitation: Few Windsurf-specific packages available.</p>
          <p>PRPM: Install any Cursor rule, Claude skill, or Copilot instruction as Windsurf format. Entire PRPM registry available from day one.</p>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">Be an Early Adopter</h3>
          </div>

          <p>Fragmented ecosystem: Knowledge stays scattered. Teams reinvent solutions.</p>
          <p>PRPM: Shape how the ecosystem develops. Publish first-mover packages. Benefit from centralized discovery early.</p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Quick Start</h2>
          </div>

          <pre><code>{`# Install CLI
npm install -g prpm

# Search Windsurf packages
prpm search --format windsurf

# Test before installing
prpm playground @react/modern-patterns "Create form component"

# Install
prpm install @react/modern-patterns --format windsurf

# Install complete starter collection
prpm install @prpm/windsurf-essentials

# Publish your own
prpm init
prpm publish`}</code></pre>

          <div className="not-prose my-12 p-8 bg-gradient-to-br from-prpm-accent/10 to-prpm-green/10 border border-prpm-accent/30 rounded-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Join the Windsurf Ecosystem</h3>
            <p className="text-gray-300 mb-6">
              Centralized discovery from day one. No fragmentation, no scattered repos. Build it right from the beginning.
            </p>
            <div className="flex gap-4">
              <Link
                href="/search?format=windsurf"
                className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent/80 text-white font-semibold rounded-lg transition-all"
              >
                Browse Windsurf Packages
              </Link>
              <a
                href="https://docs.prpm.dev"
                className="px-6 py-3 bg-prpm-dark border border-prpm-border hover:border-prpm-accent text-white font-semibold rounded-lg transition-all"
              >
                Publish Your Rules
              </a>
            </div>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Related Posts</h2>
          </div>

          <div className="not-prose grid gap-4 md:grid-cols-2 mb-8">
            <Link href="/blog/discovering-cursor-rules" className="block p-6 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent rounded-xl transition-all">
              <h3 className="text-lg font-bold text-white mb-2">Finding Cursor Rules</h3>
              <p className="text-gray-400 text-sm">Beyond cursor.directory</p>
            </Link>
            <Link href="/blog/discovering-claude-skills-prpm-vs-competition" className="block p-6 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent rounded-xl transition-all">
              <h3 className="text-lg font-bold text-white mb-2">Discovering Claude Skills</h3>
              <p className="text-gray-400 text-sm">PRPM vs The Competition</p>
            </Link>
          </div>
        </div>
      </article>

      <BlogFooter />
    </main>
  )
}
