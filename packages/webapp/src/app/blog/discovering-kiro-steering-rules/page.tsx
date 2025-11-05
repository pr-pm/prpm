import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Discovering Kiro Steering Rules: The First Marketplace - PRPM",
  description: "PRPM brings centralized discovery to Kiro steering files from day one. Stop searching GitHub repos and Discord—get CLI installation and version control.",
  openGraph: {
    title: "Discovering Kiro Steering Rules: The First Marketplace",
    description: "The first centralized marketplace for Kiro steering files with package management, searchability, and quality metrics.",
  },
}

export default function DiscoveringKiroRulesPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Kiro', 'Discovery', 'Marketplace']}
          title="Discovering Kiro Steering Rules: The First Marketplace"
          subtitle="From scattered GitHub repos to centralized package management"
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
            <h2 className="text-3xl font-bold text-white mb-0">The Current State</h2>
          </div>

          <p>Kiro's steering file system organizes rules by domain (frontend, backend, testing). Powerful approach, but there's no centralized marketplace.</p>

          <p>Finding Kiro steering files means:</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li>Searching GitHub for "kiro steering" or <code>.kiro</code></li>
              <li>Asking in Discord communities</li>
              <li>Sharing files manually with teammates</li>
              <li>Starting from scratch (most common)</li>
            </ul>
          </div>

          <p>Good steering files don't get discovered. Teams reinvent the wheel. Knowledge stays fragmented.</p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Feature Comparison</h2>
          </div>

          <div className="not-prose overflow-x-auto mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-prpm-border">
                  <th className="text-left p-3 text-white font-semibold">Task</th>
                  <th className="text-left p-3 text-white font-semibold">Before PRPM</th>
                  <th className="text-left p-3 text-prpm-accent font-semibold">With PRPM</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Finding steering files</td>
                  <td className="p-3">Search GitHub, ask Discord</td>
                  <td className="p-3 text-green-400">prpm search --format kiro</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Installation</td>
                  <td className="p-3">Clone repo, copy files manually</td>
                  <td className="p-3 text-green-400">prpm install @package</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Quality assessment</td>
                  <td className="p-3">Read code, hope it's good</td>
                  <td className="p-3 text-green-400">Ratings, downloads, tests</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Testing</td>
                  <td className="p-3">Install and try in project</td>
                  <td className="p-3 text-green-400">Playground with real models</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Updates</td>
                  <td className="p-3">Manually check repos</td>
                  <td className="p-3 text-green-400">prpm update</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Format conversion</td>
                  <td className="p-3">Manual rewrite</td>
                  <td className="p-3 text-green-400">--format flag</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Why PRPM</h2>
          </div>

          <div className="not-prose mb-8">
            <h3 className="text-2xl font-bold text-white mb-3">Centralized Search</h3>
          </div>

          <p>GitHub repos: No standardized naming, hard to find quality files, each repo organized differently.</p>
          <p>PRPM: Search all published Kiro steering files. Filter by use case, technology, domain. See ratings and download counts.</p>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">CLI Installation</h3>
          </div>

          <p>Manual copying: Clone repos, browse <code>.kiro/steering/</code>, copy files, organize into correct domains.</p>
          <p>PRPM: <code>prpm install @react/frontend-patterns</code> — Automatically places files in <code>.kiro/steering/frontend/</code></p>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">Quality Metrics</h3>
          </div>

          <p>GitHub: Read code, hope it's good. No community feedback visible.</p>
          <p>PRPM: Downloads, ratings, playground test results, verified authors, last updated timestamps.</p>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">Format Conversion</h3>
          </div>

          <p>Locked to Kiro: Steering files only work in Kiro.</p>
          <p>PRPM: Install as Cursor rules, Claude skills, or any supported format. Cross-editor compatibility.</p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Quick Start</h2>
          </div>

          <pre><code>{`# Install CLI
npm install -g prpm

# Search for Kiro steering files
prpm search "react" --format kiro

# Test in playground
prpm playground @react/frontend-patterns "Create form with validation"

# Install (automatically organized in .kiro/steering/)
prpm install @react/frontend-patterns

# Install full-stack collection
prpm install @prpm/kiro-fullstack

# Keep updated
prpm update`}</code></pre>

          <div className="not-prose my-12 p-8 bg-gradient-to-br from-prpm-accent/10 to-prpm-green/10 border border-prpm-accent/30 rounded-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Be Part of the Kiro Ecosystem</h3>
            <p className="text-gray-300 mb-6">
              The first centralized marketplace for Kiro steering files. Shape the ecosystem from day one.
            </p>
            <div className="flex gap-4">
              <Link
                href="/search?format=kiro"
                className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent/80 text-white font-semibold rounded-lg transition-all"
              >
                Browse Kiro Packages
              </Link>
              <a
                href="https://docs.prpm.dev"
                className="px-6 py-3 bg-prpm-dark border border-prpm-border hover:border-prpm-accent text-white font-semibold rounded-lg transition-all"
              >
                Publish Your Steering Files
              </a>
            </div>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Related Posts</h2>
          </div>

          <div className="not-prose grid gap-4 md:grid-cols-2 mb-8">
            <Link href="/blog/discovering-claude-skills-prpm-vs-competition" className="block p-6 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent rounded-xl transition-all">
              <h3 className="text-lg font-bold text-white mb-2">Discovering Claude Skills</h3>
              <p className="text-gray-400 text-sm">PRPM vs The Competition</p>
            </Link>
            <Link href="/blog/discovering-cursor-rules" className="block p-6 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent rounded-xl transition-all">
              <h3 className="text-lg font-bold text-white mb-2">Finding Cursor Rules</h3>
              <p className="text-gray-400 text-sm">Beyond cursor.directory</p>
            </Link>
          </div>
        </div>
      </article>

      <BlogFooter />
    </main>
  )
}
