import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "GitHub Copilot Instructions Discovery: The PRPM Advantage - PRPM",
  description: "How PRPM improves Copilot instructions discovery beyond scattered Gists and GitHub repos. Get CLI install, version control, and testing.",
  openGraph: {
    title: "GitHub Copilot Instructions Discovery: The PRPM Advantage",
    description: "Centralized marketplace for Copilot instructions with package management, testing, and format conversion.",
  },
}

export default function DiscoveringCopilotInstructionsPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['GitHub Copilot', 'Discovery', 'Marketplace']}
          title="GitHub Copilot Instructions Discovery: The PRPM Advantage"
          subtitle="From scattered Gists and repos to unified package management"
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

          <p>GitHub Copilot supports custom instructions via <code>.github/copilot-instructions.md</code> files. Shape AI behavior, enforce conventions, use specific libraries.</p>

          <p>But where do you find good instructions? The ecosystem is scattered:</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li>GitHub Gists (hard to search or organize)</li>
              <li>Public repos (instructions buried in files)</li>
              <li>Reddit/HackerNews (ephemeral threads)</li>
              <li>Blog posts (examples buried in prose)</li>
              <li>Internal wikis (knowledge stays private)</li>
            </ul>
          </div>

          <p>No unified search. No quality vetting. No versioning. Package management before npm existed.</p>

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
                  <td className="p-3">Finding instructions</td>
                  <td className="p-3">Search Gists, GitHub, Reddit</td>
                  <td className="p-3 text-green-400">prpm search --format copilot</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Installation</td>
                  <td className="p-3">Copy-paste manually</td>
                  <td className="p-3 text-green-400">prpm install @package</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Quality assessment</td>
                  <td className="p-3">Read code, hope it's good</td>
                  <td className="p-3 text-green-400">Ratings, downloads, tests</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Testing</td>
                  <td className="p-3">Install and try</td>
                  <td className="p-3 text-green-400">Playground before install</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3">Updates</td>
                  <td className="p-3">Manually check sources</td>
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
            <h3 className="text-2xl font-bold text-white mb-3">Centralized Marketplace</h3>
          </div>

          <p>Gists/repos: No unified search, no ratings, Gists rarely updated, instructions disappear in feeds.</p>
          <p>PRPM: Search all published Copilot instructions. Filter by language, framework, use case. See quality metrics.</p>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">CLI Installation</h3>
          </div>

          <p>Manual process: Find instruction, copy markdown, create <code>.github/copilot-instructions.md</code>, paste, fix conflicts.</p>
          <p>PRPM: <code>prpm install @nextjs/app-router-copilot</code> — File created, content merged, ready to use.</p>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">Version Control</h3>
          </div>

          <p>Gists/repos: Manually check for updates, re-download, replace files.</p>
          <p>PRPM: <code>prpm outdated</code> shows what changed. Update with changelogs. Deliberate, not accidental.</p>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">Format Conversion</h3>
          </div>

          <p>Locked to Copilot: Instructions only work in GitHub Copilot.</p>
          <p>PRPM: Install as Cursor rules, Claude skills, Windsurf rules. <code>prpm install @package --format cursor</code></p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Quick Start</h2>
          </div>

          <pre><code>{`# Install CLI
npm install -g prpm

# Search for Copilot instructions
prpm search "react" --format copilot

# Test in playground
prpm playground @react/hooks-copilot "Create useDebounce hook"

# Install
prpm install @react/hooks-copilot

# Install web dev collection
prpm install @prpm/copilot-webdev

# Keep updated
prpm update`}</code></pre>

          <div className="not-prose my-12 p-8 bg-gradient-to-br from-prpm-accent/10 to-prpm-green/10 border border-prpm-accent/30 rounded-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Upgrade Your Copilot Workflow</h3>
            <p className="text-gray-300 mb-6">
              Centralized marketplace with package management, testing, and format conversion. Stop hunting through Gists.
            </p>
            <div className="flex gap-4">
              <Link
                href="/search?format=copilot"
                className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent/80 text-white font-semibold rounded-lg transition-all"
              >
                Browse Copilot Instructions
              </Link>
              <a
                href="https://docs.prpm.dev"
                className="px-6 py-3 bg-prpm-dark border border-prpm-border hover:border-prpm-accent text-white font-semibold rounded-lg transition-all"
              >
                Publish Your Instructions
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

      <BlogFooter
        postTitle="GitHub Copilot Instructions Discovery: The PRPM Advantage"
        postUrl="/blog/discovering-copilot-instructions"
      />
    </main>
  )
}
