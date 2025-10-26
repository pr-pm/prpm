import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'

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
      <Header />

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

        <BlogFooter postTitle="GitHub Copilot Instructions: A Deep Dive into PRPM's Implementation" postUrl="/blog/copilot-deep-dive" />
      </article>
    </main>
  )
}
