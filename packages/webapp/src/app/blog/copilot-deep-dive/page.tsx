import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "GitHub Copilot Instructions: A Deep Dive into PRPM's Implementation",
  description: "Explore GitHub Copilot's two-tier instruction system, PRPM's technical implementation, and best practices for repository-wide and path-specific instructions.",
  openGraph: {
    title: "GitHub Copilot Instructions: A Deep Dive",
    description: "Deep dive into GitHub Copilot's instruction format and PRPM's implementation.",
  },
}

export default function CopilotDeepDivePost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
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
                <Link href="/search" className="text-gray-400 hover:text-white transition-colors">Search</Link>
                <Link href="/authors" className="text-gray-400 hover:text-white transition-colors">Authors</Link>
                <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link>
              </div>
            </div>
            <a href="https://github.com/pr-pm/prpm" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/blog" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blog
        </Link>

        <header className="mb-12">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-medium">GitHub Copilot</span>
            <span className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-medium">Instructions</span>
            <span className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-medium">Deep Dive</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 text-white leading-tight">
            GitHub Copilot Instructions: A Deep Dive
          </h1>

          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span>By PRPM Team</span>
            <span>•</span>
            <span>October 26, 2025</span>
            <span>•</span>
            <span>14 min read</span>
          </div>
        </header>

        <div className="prose prose-invert prose-lg max-w-none">
          <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 mb-8">
            <p className="text-xl text-gray-300 leading-relaxed italic mb-0">
              GitHub Copilot's instruction system represents a pragmatic approach to contextual AI assistance: provide global guidance for the entire repository while allowing fine-grained control for specific code paths. This deep dive explores the two-tier system and PRPM's implementation.
            </p>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Two-Tier Instruction System</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            GitHub Copilot's design reflects a key insight: not all guidance applies equally to all code. The two-tier system balances global consistency with contextual specificity.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Repository-Wide Layer</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            The <code className="bg-prpm-dark border border-prpm-border px-2 py-1 rounded">.github/copilot-instructions.md</code> file provides tech stack declaration, coding standards, project philosophy, and general patterns.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Path-Specific Layer</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            The <code className="bg-prpm-dark border border-prpm-border px-2 py-1 rounded">.github/instructions/*.instructions.md</code> files provide contextual patterns, domain rules, file-type conventions, and technology-specific guidance.
          </p>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-6 mb-6">
            <p className="text-gray-300 mb-2"><strong>The applyTo Field:</strong></p>
            <p className="text-gray-300 mb-4">Uses glob patterns to specify which files an instruction applies to:</p>
            <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4 font-mono text-sm">
              <div className="text-gray-400">---</div>
              <div className="text-gray-400">applyTo:</div>
              <div className="text-gray-400">  - "src/api/**/*.ts"</div>
              <div className="text-gray-400">  - "packages/*/src/api/**/*.ts"</div>
              <div className="text-gray-400">---</div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">PRPM's Implementation</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            PRPM's implementation handles both repository-wide and path-specific instructions with optional frontmatter parsing, applyTo storage, auto-tagging, and single instructions section for maximum fidelity.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Key Design Decisions</h3>
          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-6">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">1.</span>
                <span><strong>Optional Frontmatter:</strong> Repository-wide instructions don't need frontmatter (they apply everywhere)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">2.</span>
                <span><strong>applyTo as Array:</strong> Allows one instruction file to cover multiple patterns</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">3.</span>
                <span><strong>Single Instructions Section:</strong> Preserves perfect fidelity (lossless conversion)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">4.</span>
                <span><strong>Automatic Tagging:</strong> Auto-adds "repository-wide" or "path-specific" tags</span>
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Best Practices</h2>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Repository-Wide Instructions</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Provide high-level, project-wide guidance like tech stack, coding standards, and testing approach. Avoid file-type-specific patterns (those belong in path-specific instructions).
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Path-Specific Instructions</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Target specific file patterns with contextual guidance. Use specific patterns that match your project structure, not overly broad patterns.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Conclusion</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            GitHub Copilot's two-tier system (repository-wide + path-specific) balances simplicity with flexibility. PRPM's implementation focuses on fidelity, flexibility, and interoperability with seamless conversion to/from other formats.
          </p>

          <div className="bg-gradient-to-r from-prpm-accent/20 to-prpm-purple/20 border border-prpm-accent/30 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Continue Exploring</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/blog/agents-md-deep-dive" className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all">
                agents.md Deep Dive
              </Link>
              <Link href="/blog" className="px-6 py-3 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white rounded-lg font-semibold transition-all">
                View All Posts
              </Link>
            </div>
          </div>
        </div>

        <footer className="mt-12 pt-8 border-t border-prpm-border">
          <div className="flex items-center justify-between">
            <Link href="/blog" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Blog
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm">Share this post:</span>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('GitHub Copilot Instructions: A Deep Dive')}&url=${encodeURIComponent('https://prpm.dev/blog/copilot-deep-dive')}&via=prpmdev`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1DA1F2] transition-colors">
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
