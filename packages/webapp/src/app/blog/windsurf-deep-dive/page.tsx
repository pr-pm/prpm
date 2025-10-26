import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: "Windsurf Rules: A Technical Deep Dive",
  description: "Explore Windsurf's radically simple single-file markdown approach, PRPM's implementation, and best practices for maximum impact with minimum syntax.",
  openGraph: {
    title: "Windsurf Rules: A Technical Deep Dive",
    description: "Deep dive into Windsurf's minimalist approach to AI code editor configuration.",
  },
}

export default function WindsurfDeepDivePost() {
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
            <span className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-medium">Windsurf</span>
            <span className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-medium">Simplicity</span>
            <span className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-medium">Deep Dive</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 text-white leading-tight">
            Windsurf Rules: A Technical Deep Dive
          </h1>

          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span>By PRPM Team</span>
            <span>•</span>
            <span>October 26, 2025</span>
            <span>•</span>
            <span>9 min read</span>
          </div>
        </header>

        <div className="prose prose-invert prose-lg max-w-none">
          <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 mb-8">
            <p className="text-xl text-gray-300 leading-relaxed italic mb-0">
              Windsurf is an AI-first code editor that takes a radically simple approach to configuration: a single .windsurfrules file at your project root containing plain markdown. No frontmatter, no special syntax, no configuration files - just markdown.
            </p>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Introduction</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Windsurf's minimalist philosophy makes rules zero-configuration, git-friendly, universal, and approachable. The core principle: <strong>Maximum impact with minimum syntax</strong>.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Format Specification</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Windsurf uses a single file at the project root: <code className="bg-prpm-dark border border-prpm-border px-2 py-1 rounded">.windsurfrules</code>. That's it. No directories, no multiple files, no config files.
          </p>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-6 mb-6 font-mono text-sm">
            <div className="text-gray-400 mb-2">your-project/</div>
            <div className="text-gray-400 mb-2">├── .windsurfrules    ← The entire configuration</div>
            <div className="text-gray-400 mb-2">├── src/</div>
            <div className="text-gray-400 mb-2">├── tests/</div>
            <div className="text-gray-400">└── package.json</div>
          </div>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">File Format</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Pure markdown without frontmatter. No YAML frontmatter. No special directives. Just markdown.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Simplicity as Design</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Windsurf's minimalism is intentional design, not a limitation.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Advantages of Simplicity</h3>
          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-6">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">1.</span>
                <span><strong>Zero Learning Curve:</strong> Just write markdown. That's it.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">2.</span>
                <span><strong>No Configuration Overhead:</strong> No frontmatter fields, glob syntax, or inclusion modes to learn</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">3.</span>
                <span><strong>Universal Compatibility:</strong> Renders perfectly on GitHub, works in any markdown editor</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">4.</span>
                <span><strong>Git-Friendly:</strong> Simple, clear diffs with no frontmatter noise</span>
              </li>
            </ul>
          </div>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Trade-offs of Simplicity</h3>
          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-6">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-gray-400 mt-1">•</span>
                <span><strong>No Conditional Application:</strong> All rules apply to entire project, always</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gray-400 mt-1">•</span>
                <span><strong>No Metadata:</strong> No author, version, tags storage</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gray-400 mt-1">•</span>
                <span><strong>No Format-Specific Features:</strong> Pure markdown content only</span>
              </li>
            </ul>
            <p className="text-gray-300 mt-4">Mitigation: Use section headers to organize by context, store metadata externally (e.g., in prpm.json)</p>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">PRPM's Implementation</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Windsurf's simplicity means minimal parsing logic. PRPM preserves content as-is with a single instructions section containing the entire file content.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Best Practices</h2>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Use Clear Section Headers</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Organize by domain/concern rather than file type. Use sections like "Language & Type Safety", "Testing", "Code Quality" rather than a flat list of rules.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Include Context with Rules</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Provide rationale for rules. Use the pattern: rule followed by indented <code className="bg-prpm-dark border border-prpm-border px-2 py-1 rounded">*Rationale: explanation*</code>.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Keep It Concise</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Write scannable points rather than novel-length rules. Aim for clarity and brevity.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Conclusion</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Windsurf's single-file, plain-markdown approach represents simplicity as a feature. PRPM respects this simplicity with minimal parsing, lossless roundtrip for simple content, clear warnings when features are lost, and quality scoring that reflects conversion fidelity.
          </p>

          <div className="bg-gradient-to-r from-prpm-accent/20 to-prpm-purple/20 border border-prpm-accent/30 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">One More Format to Explore</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/blog/kiro-deep-dive" className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all">
                Kiro Deep Dive
              </Link>
              <Link href="/blog" className="px-6 py-3 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white rounded-lg font-semibold transition-all">
                View All Posts
              </Link>
            </div>
          </div>
        </div>

        <footer className="mt-12 pt-8 border-t border-prpm-border">
          <Link href="/blog" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>
        </footer>
      </article>
    </main>
  )
}
