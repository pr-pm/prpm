import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: "agents.md: A Deep Dive into OpenAI's Open Standard for AI Coding Agents",
  description: "Explore agents.md format specification, PRPM's implementation approach, and the simplicity philosophy behind this open standard.",
  openGraph: {
    title: "agents.md: A Deep Dive",
    description: "Deep dive into OpenAI's open standard for AI coding agent configuration.",
  },
}

export default function AgentsMdDeepDivePost() {
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
            <span className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-medium">agents.md</span>
            <span className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-medium">OpenAI</span>
            <span className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-medium">Deep Dive</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 text-white leading-tight">
            agents.md: A Deep Dive into OpenAI's Open Standard
          </h1>

          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span>By PRPM Team</span>
            <span>•</span>
            <span>October 26, 2025</span>
            <span>•</span>
            <span>16 min read</span>
          </div>
        </header>

        <div className="prose prose-invert prose-lg max-w-none">
          <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 mb-8">
            <p className="text-xl text-gray-300 leading-relaxed italic mb-0">
              In a fragmented ecosystem where every AI coding tool uses its own configuration format, agents.md emerges as a refreshing attempt at standardization. Created through collaboration between OpenAI, Google, and other major players, agents.md is an open, simple, and tool-agnostic format for providing project-specific guidance.
            </p>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">The Simplicity Philosophy</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            agents.md's design philosophy is <strong>radical simplicity</strong>: single file, plain markdown, optional metadata, human-first, and tool-agnostic. No directory structure, no special syntax, no custom extensions - just markdown.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Why This Matters</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            The AI coding tool landscape is fragmented with Cursor using <code className="bg-prpm-dark border border-prpm-border px-2 py-1 rounded">.cursor/rules/</code>, GitHub Copilot using <code className="bg-prpm-dark border border-prpm-border px-2 py-1 rounded">.github/copilot-instructions.md</code>, Claude using <code className="bg-prpm-dark border border-prpm-border px-2 py-1 rounded">.claude/skills/</code>, and more. agents.md provides a neutral, open standard that all these tools can support.
          </p>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-6">
            <p className="text-gray-300 mb-4"><strong>Key insight:</strong> The format's power is in what it doesn't require:</p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">•</span>
                <span>No frontmatter (unless you want it)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">•</span>
                <span>No specific sections (organize however makes sense)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">•</span>
                <span>No special syntax (just markdown)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">•</span>
                <span>No tool-specific features (works everywhere)</span>
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">PRPM's Implementation</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            PRPM treats agents.md as a flexible, unstructured format. The implementation includes optional frontmatter handling, auto-description extraction from first paragraph, flexible section parsing, auto-tag inference, and graceful fallbacks.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Design Decisions</h3>
          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-6">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-prpm-purple mt-1">1.</span>
                <span><strong>Optional Frontmatter:</strong> Respects simplicity - frontmatter is entirely optional</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-purple mt-1">2.</span>
                <span><strong>Auto-Description Extraction:</strong> Extracts from first paragraph if not provided</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-purple mt-1">3.</span>
                <span><strong>Section Type Inference:</strong> Infers semantic types from content structure</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-purple mt-1">4.</span>
                <span><strong>Auto-Tag Inference:</strong> Automatically detects technology tags from content</span>
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Best Practices</h2>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Project Overview</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Start with a clear project description. AI agents need context first - the "what" and "why" before the "how".
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Section Organization</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Organize by concern, not by file type. Group related guidelines together (Code Style, Testing Strategy, Error Handling, Security) rather than mixing unrelated concerns.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Why agents.md Matters</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            The AI coding tool landscape is fragmented today, but agents.md points toward a future where developers write guidance once (not 6 times), AI tools compete on features (not lock-in), open standards win over proprietary formats, and the community shares patterns freely.
          </p>

          <div className="bg-gradient-to-r from-prpm-accent/20 to-prpm-purple/20 border border-prpm-accent/30 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Explore More Formats</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/blog/continue-deep-dive" className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all">
                Continue Deep Dive
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
          </div>
        </footer>
      </article>
    </main>
  )
}
