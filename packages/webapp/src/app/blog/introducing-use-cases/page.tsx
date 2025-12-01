import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Finding Your Perfect Package Just Got Easier: Introducing Use Cases - PRPM",
  description: "With over 7,000 packages in PRPM, we built a smarter way to discover what you need—organized by what you're trying to accomplish.",
  openGraph: {
    title: "Finding Your Perfect Package Just Got Easier: Introducing Use Cases",
    description: "Browse 7,000+ AI prompt packages by what you're building, not by format or author. AI-powered use case matching makes discovery simple.",
  },
}

export default function IntroducingUseCasesPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Features', 'Discovery', 'Search', 'AI']}
          title="Finding Your Perfect Package Just Got Easier: Introducing Use Cases"
          subtitle="With over 7,000 packages in PRPM, we built a smarter way to discover what you need—organized by what you're trying to accomplish."
          author="PRPM Team"
          date="December 1, 2025"
          readTime="8 min read"
        />

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none
          prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
          prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:scroll-mt-20
          prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4 prose-h3:scroll-mt-20
          prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6
          prose-a:text-prpm-accent prose-a:no-underline prose-a:font-medium hover:prose-a:underline
          prose-code:text-prpm-accent prose-code:bg-prpm-dark-card/50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-[0.9em] prose-code:font-mono prose-code:border prose-code:border-prpm-border/30
          prose-pre:bg-prpm-dark-card prose-pre:border prose-pre:border-prpm-border prose-pre:rounded-xl prose-pre:p-6 prose-pre:my-8 prose-pre:overflow-x-auto
          prose-strong:text-white prose-strong:font-semibold
          prose-ul:my-6 prose-ul:space-y-2 prose-ul:text-gray-300
          prose-ol:my-6 prose-ol:space-y-2 prose-ol:text-gray-300
          prose-li:text-gray-300 prose-li:leading-relaxed
          prose-blockquote:border-l-4 prose-blockquote:border-prpm-accent prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-400 prose-blockquote:my-8
          prose-hr:border-prpm-border prose-hr:my-12
        ">
          {/* Intro */}
          <p className="text-gray-300 leading-relaxed mb-8">
            Here's the problem: PRPM now has over 7,000 packages for AI coding assistants. That's incredible for the ecosystem, but it creates a new challenge—how do you actually find what you need?
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            You could search by author, but you don't know which authors build what you're looking for. You could filter by format (Cursor, Claude, Continue, etc.), but that only narrows things down to hundreds of options. You could browse tags like "react" or "typescript," but those don't tell you what problem a package solves.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            What you really want to know is: <strong>"Which packages help me with API development?"</strong> or <strong>"What's available for debugging frontend issues?"</strong>
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            That's why we built <strong>Use Cases</strong>—a new way to browse packages by what you're trying to accomplish, not by metadata like author or format.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Discovery Problem</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Let's say you want to build a REST API and you need help with validation, error handling, and documentation. You open PRPM and search "API"—you get 200+ results. Some are for testing APIs. Others are for consuming APIs. A few are about API design patterns. Which ones actually help you build and validate your endpoints?
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            Or imagine you're debugging a React app. You search "react debugging" and find packages about React hooks, performance optimization, component architecture, and state management. You're drowning in relevant-but-not-quite-right options.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            The fundamental issue: <strong>packages are organized by what they are, not by what they help you do</strong>. Formats describe the tool (Cursor, Claude, Continue). Authors describe who built it. Tags describe technologies used. None of these answer the question: "What problem does this solve?"
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Enter Use Cases</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Use Cases flip the script. Instead of asking "what format is this package?" they ask <strong>"what can I build with this package?"</strong>
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            We've organized the registry into 50 practical use cases that cover what developers actually do:
          </p>

          <div className="not-prose mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Development</h4>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>• API Development</li>
                  <li>• Frontend Development</li>
                  <li>• Database Design</li>
                  <li>• Authentication & Security</li>
                </ul>
              </div>
              <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Quality</h4>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>• Code Review</li>
                  <li>• Testing & QA</li>
                  <li>• Debugging & Troubleshooting</li>
                  <li>• Performance Optimization</li>
                </ul>
              </div>
              <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Documentation</h4>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>• API Documentation</li>
                  <li>• Technical Writing</li>
                  <li>• Code Documentation</li>
                  <li>• Onboarding Guides</li>
                </ul>
              </div>
              <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Operations</h4>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>• CI/CD & DevOps</li>
                  <li>• Infrastructure as Code</li>
                  <li>• Monitoring & Logging</li>
                  <li>• Deployment Automation</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Each use case is a lens into the registry. Click "API Development" and you see packages that help with endpoint design, validation, error handling, REST patterns, GraphQL, and API documentation—regardless of format, author, or programming language.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">How It Works</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">1. AI-Powered Auto-Tagging</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              When a package is published to PRPM, our AI enrichment process analyzes the package's name, description, README, and content. It then automatically tags the package with relevant use cases.
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              For example, a package called <code>api-error-handler</code> with a description about "standardizing REST API error responses" gets tagged with:
            </p>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><strong>API Development</strong> (primary)</li>
              <li><strong>Error Handling</strong></li>
              <li><strong>Backend Development</strong></li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              The tagging uses both exact keyword matching and fuzzy matching to catch variations. A package about "debugging performance issues in React components" matches <strong>Debugging & Troubleshooting</strong>, <strong>Performance Optimization</strong>, and <strong>Frontend Development</strong>.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">2. Browse by Use Case</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              The new <Link href="/use-cases" className="text-prpm-accent hover:underline font-medium">/use-cases</Link> page shows all 50 use cases with package counts and example queries. Each use case card displays:
            </p>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><strong>Name and description:</strong> What this use case covers</li>
              <li><strong>Package count:</strong> How many packages match this use case</li>
              <li><strong>Example query:</strong> An AI search query to get you started</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              Click any use case to see all matching packages, sorted by relevance and popularity.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">3. Filter Search Results</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              The search page now includes a <strong>Use Case filter</strong>. Start with a broad search, then narrow down by selecting a use case from the dropdown.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8"><code className="text-sm text-gray-300 font-mono">{`Example workflow:

1. Search "react hooks"
   → 150 results

2. Filter by Use Case: "Frontend Development"
   → 85 results

3. Further filter by Use Case: "State Management"
   → 23 highly relevant packages`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              You can combine use case filters with format, subtype, tags, and author filters for precise discovery.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">4. AI Search Integration</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Each use case includes an <strong>AI search example query</strong> that demonstrates how to find packages using natural language.
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              For "API Development," the example query might be: <em>"Find packages that help me build and validate REST API endpoints with proper error handling"</em>
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              Click the "Try this search" link to run the AI search immediately. The AI understands the intent, searches across embeddings, and returns packages ranked by how well they solve your specific problem.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Real-World Examples</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Finding Debugging Tools</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              <strong>Before Use Cases:</strong> Search "debug" → 300+ results mixing frontend debugging, backend debugging, build debugging, test debugging, and general troubleshooting.
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              <strong>With Use Cases:</strong> Go to <Link href="/use-cases" className="text-prpm-accent hover:underline font-medium">/use-cases</Link> → Click "Debugging & Troubleshooting" → See 45 packages specifically for finding and fixing bugs, organized by relevance.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Building a New Feature</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              You need to add authentication to your app. You browse to "Authentication & Security" use case and immediately see packages for:
            </p>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li>OAuth integration patterns</li>
              <li>JWT token validation</li>
              <li>Session management</li>
              <li>Role-based access control</li>
              <li>Security best practices</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              No more guessing whether a "React authentication" package is about UI components, backend validation, or security patterns. The use case tells you upfront.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Learning New Technologies</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Want to learn GraphQL? Browse "API Development" use case, then filter by tag "graphql" to see packages that teach GraphQL concepts, schema design, resolver patterns, and integration with REST.
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              The combination of use case + technology tag gives you learning resources focused on practical application, not just theory.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Technical Implementation</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            For those curious about how this works under the hood:
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Auto-Tagging Algorithm</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              When a package is published or updated, the AI enrichment service:
            </p>

            <ol className="text-gray-300 space-y-4 mb-8 list-decimal list-inside">
              <li><strong className="text-white">Extracts text:</strong> Package name, description, tags, and README content</li>
              <li><strong className="text-white">Keyword matching:</strong> Checks for exact matches against each use case's keyword list (e.g., "api", "endpoint", "rest" for "API Development")</li>
              <li><strong className="text-white">Fuzzy matching:</strong> Catches variations like "apis", "restful", "graphql endpoints"</li>
              <li><strong className="text-white">Scoring:</strong> Ranks matches by confidence based on keyword frequency and placement (title matches score higher than README mentions)</li>
              <li><strong className="text-white">Tagging:</strong> Applies top 1-3 most relevant use cases to the package</li>
            </ol>

            <p className="text-gray-300 leading-relaxed mb-8">
              The process is fast—takes under 100ms per package—and runs automatically whenever a package is published or updated.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Search Integration</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Use case filtering integrates seamlessly with PRPM's existing search infrastructure:
            </p>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><strong>PostgreSQL query:</strong> Use case filters translate to SQL joins on the <code>package_use_cases</code> table</li>
              <li><strong>Faceted search:</strong> Combine use cases with format, tags, author, and date filters</li>
              <li><strong>AI embeddings:</strong> Natural language searches factor in use case tags for better semantic matching</li>
            </ul>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Static Site Generation</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              The <code>/use-cases</code> page is pre-rendered at build time for instant loading. Package counts are updated daily to reflect the latest registry stats.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">What This Unlocks</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Use Cases aren't just a navigation feature—they change how you think about finding and using AI prompt packages:
          </p>

          <ul className="text-gray-300 space-y-4 mb-8 list-disc ml-6">
            <li><strong>Faster discovery:</strong> Go from "I need something for X" to relevant packages in one click</li>
            <li><strong>Better matches:</strong> Find packages that solve your actual problem, not just packages that mention your keywords</li>
            <li><strong>Cross-format visibility:</strong> See solutions across all AI assistants (Cursor, Claude, Continue, etc.) without being locked into one ecosystem</li>
            <li><strong>Learning paths:</strong> Explore related use cases to discover complementary packages (e.g., API Development → Testing → Deployment)</li>
            <li><strong>Curated collections:</strong> Package authors can tag their work with use cases to help users understand the intended application</li>
          </ul>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">What's Next</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            This is v1 of Use Cases. We have plans for:
          </p>

          <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
            <li><strong>Use case recommendations:</strong> "Users who installed this package also found these use cases helpful"</li>
            <li><strong>Custom use cases:</strong> Let verified authors define their own use cases for niche domains</li>
            <li><strong>Use case collections:</strong> Bundles of packages for common workflows (e.g., "Full-Stack Development" = API + Frontend + Database + Testing)</li>
            <li><strong>Improved AI tagging:</strong> Incorporate semantic analysis and user feedback to refine auto-tagging accuracy</li>
          </ul>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-4">Try Use Cases Today</h2>

            <p className="text-gray-300 leading-relaxed text-lg mb-0">
              Browse all 50 use cases and discover packages by what you're trying to build. No more guessing, no more scrolling through hundreds of irrelevant results—just the packages that solve your problem.
            </p>
          </div>

          <div className="not-prose flex flex-wrap gap-4 mb-12">
            <Link
              href="/use-cases"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Browse Use Cases
            </Link>
            <Link
              href="/search"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white rounded-lg font-semibold transition-all"
            >
              Try Search
            </Link>
          </div>
        </div>

        <BlogFooter postTitle="Finding Your Perfect Package Just Got Easier: Introducing Use Cases" postUrl="/blog/introducing-use-cases" />
      </article>
    </main>
  )
}
