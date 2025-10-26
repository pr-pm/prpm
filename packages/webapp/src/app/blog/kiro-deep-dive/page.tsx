import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Kiro Steering Files: A Technical Deep Dive",
  description: "Explore Kiro's domain-organized steering files, inclusion modes, and the three foundational files that provide core project context.",
  openGraph: {
    title: "Kiro Steering Files: A Technical Deep Dive",
    description: "Deep dive into Kiro's modular, context-aware prompt engineering system.",
  },
}

export default function KiroDeepDivePost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <nav className="border-b border-prpm-border bg-prpm-dark-card backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo-icon.svg" alt="PRPM Logo" width={40} height={40} className="w-10 h-10" />
              <span className="text-2xl font-bold bg-gradient-to-r from-prpm-accent to-prpm-purple bg-clip-text text-transparent">PRPM</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/search" className="text-gray-400 hover:text-white transition-colors">Search</Link>
              <Link href="/authors" className="text-gray-400 hover:text-white transition-colors">Authors</Link>
              <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link>
            </div>
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
            <span className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-medium">Kiro</span>
            <span className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-medium">Steering</span>
            <span className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-medium">Deep Dive</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 text-white leading-tight">
            Kiro Steering Files: A Technical Deep Dive
          </h1>

          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span>By PRPM Team</span>
            <span>•</span>
            <span>October 26, 2025</span>
            <span>•</span>
            <span>13 min read</span>
          </div>
        </header>

        <div className="prose prose-invert prose-lg max-w-none">
          <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 mb-8">
            <p className="text-xl text-gray-300 leading-relaxed italic mb-0">
              Kiro is an AI coding assistant that takes a unique approach to prompt engineering: instead of a single monolithic configuration file, it uses domain-organized steering files. Each steering file focuses on a specific aspect of your codebase and can be activated based on context.
            </p>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Introduction</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            This architectural decision makes Kiro's prompt system modular (concerns are separated into focused files), context-aware (rules apply only when relevant), scalable (easy to add new domains), and maintainable (changes are isolated).
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">The Three Foundational Files</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Kiro recognizes three special steering files that provide core project context:
          </p>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-3">1. product.md - Product Overview</h3>
            <p className="text-gray-300 mb-2">Defines your product's purpose, target users, key features, and business objectives. Helps Kiro understand the "why" behind technical decisions.</p>
            
            <h3 className="text-xl font-bold text-white mb-3 mt-6">2. tech.md - Technology Stack</h3>
            <p className="text-gray-300 mb-2">Documents frameworks, libraries, development tools, and technical constraints. When Kiro suggests implementations, it prefers your established stack.</p>
            
            <h3 className="text-xl font-bold text-white mb-3 mt-6">3. structure.md - Project Structure</h3>
            <p className="text-gray-300 mb-2">Outlines file organization, naming conventions, import patterns, and architectural decisions. Ensures generated code fits seamlessly into your codebase.</p>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Inclusion Modes</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Kiro's inclusion modes determine when a steering file becomes active during AI interactions.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">1. Always Inclusion</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            <strong>Trigger:</strong> Active for all AI interactions<br/>
            <strong>Use case:</strong> Universal rules that should always apply
          </p>
          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-4 mb-6 font-mono text-sm">
            <div className="text-gray-400">---</div>
            <div className="text-gray-400">inclusion: always</div>
            <div className="text-gray-400">---</div>
          </div>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">2. File Match Inclusion</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            <strong>Trigger:</strong> Active when working with files matching the glob pattern<br/>
            <strong>Use case:</strong> Context-specific rules
          </p>
          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-4 mb-6 font-mono text-sm">
            <div className="text-gray-400">---</div>
            <div className="text-gray-400">inclusion: fileMatch</div>
            <div className="text-gray-400">fileMatchPattern: "**/*.test.ts"</div>
            <div className="text-gray-400">---</div>
          </div>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">3. Manual Inclusion</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            <strong>Trigger:</strong> Active only when explicitly requested by user<br/>
            <strong>Use case:</strong> On-demand checklists and specialized reviews
          </p>
          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-4 mb-6 font-mono text-sm">
            <div className="text-gray-400">---</div>
            <div className="text-gray-400">inclusion: manual</div>
            <div className="text-gray-400">---</div>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">PRPM's Implementation</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            PRPM's Kiro parser extracts frontmatter and content, validates required fields (inclusion is mandatory), detects foundational file types, and stores Kiro-specific configuration in metadata.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Key Design Decisions</h3>
          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-6">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-prpm-purple mt-1">1.</span>
                <span><strong>Foundational Files:</strong> Keep as 'rule' subtype with specialized tags (kiro-product, kiro-tech, kiro-structure)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-purple mt-1">2.</span>
                <span><strong>Frontmatter Validation:</strong> Strict on inclusion field, permissive on others</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-purple mt-1">3.</span>
                <span><strong>Glob Pattern Storage:</strong> Store as string, document .gitignore syntax</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-purple mt-1">4.</span>
                <span><strong>Quality Scoring:</strong> Deduct for unsupported features when converting to Kiro</span>
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Best Practices</h2>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Organization by Domain</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Organize by domain/concern (product.md, tech.md, structure.md, testing.md, security.md, api-design.md) rather than by file type.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Use Specific File Patterns</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Use targeted patterns like <code className="bg-prpm-dark border border-prpm-border px-2 py-1 rounded">**/*.test.ts</code> instead of overly broad patterns like <code className="bg-prpm-dark border border-prpm-border px-2 py-1 rounded">**/*.ts</code>.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Include Rationale and Examples</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Provide rationale for rules and concrete code examples showing both good and bad patterns.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Conclusion</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Kiro's steering file approach represents a paradigm shift in prompt engineering with modular concerns, context-aware rules, scalable organization, and maintainable structure. PRPM fully supports Kiro's unique features including frontmatter parsing, foundational file detection, cross-format conversion, and quality scoring.
          </p>

          <div className="bg-gradient-to-r from-prpm-accent/20 to-prpm-purple/20 border border-prpm-accent/30 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Explore All Format Deep Dives</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/blog/cursor-deep-dive" className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all">
                Start with Cursor
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
