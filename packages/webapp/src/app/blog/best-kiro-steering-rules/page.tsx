import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Best Kiro Steering Rules: Complete Guide 2025 - PRPM",
  description: "Discover the best Kiro steering rules for context-aware AI development. Compare sources, get CLI installation, quality metrics, and domain-specific steering files for frontend, backend, and API design.",
  keywords: "kiro steering rules, best kiro steering rules, kiro ai, kiro steering files, context-aware AI, domain-specific rules, kiro editor",
  openGraph: {
    title: "Best Kiro Steering Rules: Complete Guide 2025",
    description: "Find and install the best Kiro steering rules. Get CLI installation, testing playground, and quality-scored domain-specific rules. Free starter collections.",
  },
}

export default function DiscoveringKiroSteeringRulesPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Kiro', 'Steering Rules', 'AI Coding']}
          title="Best Kiro Steering Rules: Complete Guide 2025"
          subtitle="Context-aware, domain-specific AI development with quality-scored steering files"
          author="PRPM Team"
          date="November 6, 2025"
          readTime="7 min read"
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

          <p><strong>Kiro steering rules</strong> are context-aware instructions organized by domain (frontend, backend, testing, API design) that guide AI coding assistants based on what file you're working in. Unlike one-size-fits-all rules, the best Kiro steering rules automatically apply different coding standards depending on whether you're in a React component, a database migration, or a test file.</p>

          <p>This guide shows you where to find the <strong>best Kiro steering rules</strong>, how to install them with CLI tools, and which domain-specific configurations work best for your tech stack.</p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">What Makes Kiro Steering Rules Different?</h2>
          </div>

          <p>Kiro's <strong>domain-based organization</strong> is fundamentally different from other AI editors:</p>

          <div className="not-prose mb-8">
            <h3 className="text-2xl font-bold text-white mb-3 mt-6">Context-Aware Architecture</h3>
          </div>

          <p>Kiro steering rules live in <code>.kiro/steering/DOMAIN.md</code> files where each domain targets specific file types:</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li><strong>frontend-standards.md</strong> → React components, JSX/TSX files, CSS modules</li>
              <li><strong>api-design.md</strong> → REST endpoints, GraphQL resolvers, API routes</li>
              <li><strong>database.md</strong> → Migrations, schema definitions, query builders</li>
              <li><strong>testing.md</strong> → Test files, mocks, fixtures</li>
              <li><strong>devops.md</strong> → CI/CD configs, Docker files, deployment scripts</li>
            </ul>
          </div>

          <p className="mt-6"><strong>Example</strong>: When you're editing <code>src/components/Button.tsx</code>, Kiro automatically applies frontend-standards.md rules. Switch to <code>tests/button.test.ts</code> and testing.md rules take over.</p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Where to Find the Best Kiro Steering Rules</h2>
          </div>

          <p>Kiro is relatively new (launched 2024), so finding quality steering rules is challenging. Here are the main sources:</p>

          <div className="not-prose mb-8">
            <h3 className="text-2xl font-bold text-white mb-3 mt-6">1. PRPM (prpm.dev) - Centralized Registry</h3>
          </div>

          <p><strong>Best for:</strong> Developers who want CLI installation, quality scoring, and version control for Kiro steering rules.</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li><strong>CLI installation:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded">prpm install @kiro-package</code> — automatic file placement</li>
              <li><strong>Testing playground:</strong> Test steering rules with real AI models before installing</li>
              <li><strong>Quality metrics:</strong> Automated 0-5 star scoring based on content analysis</li>
              <li><strong>Version control:</strong> Semantic versioning, update notifications, dependency management</li>
              <li><strong>Domain organization:</strong> Browse by frontend, backend, testing, API, devops</li>
              <li><strong>Format conversion:</strong> Use Cursor rules or Claude skills as Kiro steering files</li>
              <li><strong>All steering rules indexed:</strong> Including awesome-kiro collection</li>
            </ul>
          </div>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">2. GitHub jasonkneen/kiro - Official Examples</h3>
          </div>

          <p><strong>Best for:</strong> Developers who want official reference implementations from Kiro's creator.</p>

          <p className="mt-2 text-sm text-gray-400"><em>Source: <a href="https://github.com/jasonkneen/kiro" target="_blank" className="text-prpm-accent hover:underline">github.com/jasonkneen/kiro</a></em></p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li><strong>Official examples:</strong> Created by Jason Kneen (Kiro creator)</li>
              <li><strong>Domain templates:</strong> Frontend, API design, git workflow, project standards</li>
              <li><strong>Reference architecture:</strong> Shows intended folder structure and fileMatch patterns</li>
              <li><strong>Manual installation:</strong> Clone repo, copy <code>.kiro/steering/</code> directory manually</li>
              <li><strong>No version control:</strong> Must pull repo to check for updates</li>
              <li><strong>No quality metrics:</strong> Can't compare different approaches</li>
              <li><strong>Limited examples:</strong> ~5-10 starter files, not comprehensive</li>
            </ul>
          </div>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">3. GitHub Search - Community Sharing</h3>
          </div>

          <p><strong>Best for:</strong> Finding experimental or niche domain-specific steering rules.</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li><strong>Community contributions:</strong> Developers sharing their <code>.kiro/</code> directories</li>
              <li><strong>Real-world examples:</strong> See how teams use Kiro in production</li>
              <li><strong>Fragmented:</strong> Search "kiro steering" or ".kiro/steering" — results vary</li>
              <li><strong>No quality signals:</strong> Can't tell if rules are good without trying</li>
              <li><strong>Stale content:</strong> Repos may be abandoned or outdated</li>
              <li><strong>Manual extraction:</strong> Copy-paste files into your <code>.kiro/steering/</code> directory</li>
              <li><strong>No discovery:</strong> Hard to find domain-specific rules you need</li>
            </ul>
          </div>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">4. Start From Scratch - DIY Approach</h3>
          </div>

          <p><strong>Best for:</strong> Teams with unique requirements or very opinionated workflows.</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li><strong>Full control:</strong> Define exact rules for your team's needs</li>
              <li><strong>Custom domains:</strong> Create steering files for your specific tech stack</li>
              <li><strong>Time-consuming:</strong> Requires writing comprehensive rules from scratch</li>
              <li><strong>No validation:</strong> Can't test quality until you use them in development</li>
              <li><strong>Reinventing patterns:</strong> Miss out on community best practices</li>
              <li><strong>Maintenance burden:</strong> Must update rules as frameworks evolve</li>
            </ul>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Feature Comparison</h2>
          </div>

          <div className="not-prose overflow-x-auto mb-8">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-prpm-border">
                  <th className="text-left p-3 text-white font-semibold">Feature</th>
                  <th className="text-left p-3 text-prpm-accent font-semibold">PRPM</th>
                  <th className="text-left p-3 text-white font-semibold">Official Kiro</th>
                  <th className="text-left p-3 text-white font-semibold">GitHub Search</th>
                  <th className="text-left p-3 text-white font-semibold">From Scratch</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">CLI Installation</td>
                  <td className="p-3 text-green-400">✓ prpm install</td>
                  <td className="p-3 text-red-400">✗ Manual copy</td>
                  <td className="p-3 text-red-400">✗ Manual copy</td>
                  <td className="p-3 text-yellow-400">~ Create yourself</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Testing Before Install</td>
                  <td className="p-3 text-green-400">✓ Playground</td>
                  <td className="p-3 text-red-400">✗ None</td>
                  <td className="p-3 text-red-400">✗ None</td>
                  <td className="p-3 text-red-400">✗ Trial & error</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Quality Metrics</td>
                  <td className="p-3 text-green-400">✓ Automated scoring</td>
                  <td className="p-3 text-yellow-400">~ Creator-curated</td>
                  <td className="p-3 text-red-400">✗ None</td>
                  <td className="p-3 text-red-400">✗ Unknown</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Version Control</td>
                  <td className="p-3 text-green-400">✓ Semantic versioning</td>
                  <td className="p-3 text-yellow-400">~ Git commits</td>
                  <td className="p-3 text-yellow-400">~ Repo history</td>
                  <td className="p-3 text-yellow-400">~ Your git</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Domain Organization</td>
                  <td className="p-3 text-green-400">✓ Browse by domain</td>
                  <td className="p-3 text-yellow-400">~ Basic examples</td>
                  <td className="p-3 text-red-400">✗ Scattered</td>
                  <td className="p-3 text-green-400">✓ Full control</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Collection Size</td>
                  <td className="p-3 text-green-400">Growing catalog</td>
                  <td className="p-3 text-yellow-400">~5-10 examples</td>
                  <td className="p-3 text-yellow-400">Scattered</td>
                  <td className="p-3 text-yellow-400">Just yours</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Update Management</td>
                  <td className="p-3 text-green-400">✓ prpm update</td>
                  <td className="p-3 text-yellow-400">~ git pull</td>
                  <td className="p-3 text-red-400">✗ Manual check</td>
                  <td className="p-3 text-yellow-400">~ You maintain</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Format Conversion</td>
                  <td className="p-3 text-green-400">✓ From other editors</td>
                  <td className="p-3 text-red-400">✗ Kiro only</td>
                  <td className="p-3 text-red-400">✗ As published</td>
                  <td className="p-3 text-yellow-400">~ Manual adapt</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Best For</td>
                  <td className="p-3 text-green-400">Production teams</td>
                  <td className="p-3">Learning Kiro</td>
                  <td className="p-3">Exploring options</td>
                  <td className="p-3">Custom needs</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">How to Find the Best Kiro Steering Rules</h2>
          </div>

          <p>Finding quality Kiro steering rules for your specific domains is crucial. Here's what to look for:</p>

          <div className="not-prose mb-8">
            <h3 className="text-2xl font-bold text-white mb-3 mt-6">1. Match Your Domain Needs</h3>
          </div>

          <p>The best Kiro steering rules are organized by the domains you actually work in:</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li><strong>Frontend:</strong> React, Vue, Angular component patterns, CSS standards</li>
              <li><strong>Backend:</strong> API design, database queries, business logic patterns</li>
              <li><strong>Testing:</strong> Unit tests, integration tests, mocking strategies</li>
              <li><strong>DevOps:</strong> CI/CD configs, Docker, deployment automation</li>
              <li><strong>API Design:</strong> REST conventions, GraphQL schemas, error handling</li>
            </ul>
          </div>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">2. Check fileMatch Patterns</h3>
          </div>

          <p>Quality Kiro steering rules use precise <code>fileMatch</code> patterns to target the right files:</p>

          <pre className="mt-4"><code>{`---
fileMatch:
  - "src/components/**/*.tsx"
  - "src/components/**/*.jsx"
---

# Frontend Standards

[Rules apply only to component files]`}</code></pre>

          <p className="mt-4">Look for steering rules with comprehensive fileMatch patterns that cover your project structure.</p>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">3. Test Before Installing</h3>
          </div>

          <p>PRPM's playground lets you test Kiro steering rules before committing:</p>

          <pre className="mt-4"><code>{`# Test frontend steering rules
prpm playground @awesome-kiro/kiro-frontend-standards "Create button component"

# See how rules affect AI output
# Then decide if they match your team's standards`}</code></pre>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Quick Start</h2>
          </div>

          <pre><code>{`# Install PRPM CLI
npm install -g prpm

# Search Kiro steering rules by domain
prpm search "frontend" --format kiro
prpm search "api" --format kiro
prpm search "testing" --format kiro

# Test before installing
prpm playground @awesome-kiro/kiro-frontend-standards "Create component"

# Install Kiro steering rules
prpm install @awesome-kiro/kiro-frontend-standards
prpm install @awesome-kiro/kiro-api-design

# Or convert from other formats
prpm install @cursor/typescript-rules --format kiro

# Keep steering rules updated
prpm update`}</code></pre>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Popular Kiro Steering Rules</h2>
          </div>

          <p>Here are quality Kiro steering rule packages available on PRPM (including the awesome-kiro collection):</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-3">
              <li><strong>@awesome-kiro/kiro-project-standards:</strong> Language-specific style guides (ESLint for JS/TS, Black for Python)</li>
              <li><strong>@awesome-kiro/kiro-frontend-standards:</strong> Functional components with hooks, React best practices</li>
              <li><strong>@awesome-kiro/kiro-api-design:</strong> HTTP methods, RESTful patterns, API versioning</li>
              <li><strong>@awesome-kiro/kiro-development-environment:</strong> Node.js versions, environment configs, tooling setup</li>
              <li><strong>@awesome-kiro/kiro-git-workflow:</strong> Feature branches, commit conventions, PR standards</li>
            </ul>
          </div>

          <p className="mt-6">Browse all Kiro packages at <Link href="/search?format=kiro" className="text-prpm-accent hover:underline">prpm.dev/search</Link></p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Choosing the Right Source</h2>
          </div>

          <p><strong>Use PRPM if:</strong> You want professional package management with CLI installation, testing, version control, and quality metrics. Best for production teams who need domain-specific steering rules with automated workflows.</p>

          <p className="mt-4"><strong>Use official jasonkneen/kiro if:</strong> You want reference implementations from Kiro's creator and don't mind manual file management. Good for learning Kiro's intended architecture.</p>

          <p className="mt-4"><strong>Use GitHub Search if:</strong> You're exploring experimental steering rules or need very niche domain configurations. Good for discovery, but no quality guarantees.</p>

          <p className="mt-4"><strong>Start from scratch if:</strong> Your team has highly specialized workflows that don't match standard patterns. Best for custom requirements with in-house maintenance.</p>

          <p className="mt-6"><strong>Pro tip:</strong> Most teams start with PRPM's curated steering rules (including all awesome-kiro packages) and customize them for specific needs. This gives you quality baselines with the flexibility to adapt.</p>

          <div className="not-prose my-12 p-8 bg-gradient-to-br from-prpm-accent/10 to-prpm-green/10 border border-prpm-accent/30 rounded-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Start Using the Best Kiro Steering Rules Today</h3>
            <p className="text-gray-300 mb-6">
              Get CLI installation, quality metrics, testing playground, and domain-organized steering rules for your Kiro editor. Browse by frontend, backend, testing, API, and devops.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/search?format=kiro"
                className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent/80 text-white font-semibold rounded-lg transition-all"
              >
                Browse Kiro Steering Rules
              </Link>
              <a
                href="https://docs.prpm.dev"
                className="px-6 py-3 bg-prpm-dark border border-prpm-border hover:border-prpm-accent text-white font-semibold rounded-lg transition-all"
              >
                Read Documentation
              </a>
              <a
                href="https://github.com/pr-pm/prpm"
                className="px-6 py-3 bg-prpm-dark border border-prpm-border hover:border-prpm-accent text-white font-semibold rounded-lg transition-all"
              >
                View on GitHub
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
            <Link href="/blog/discovering-windsurf-rules" className="block p-6 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent rounded-xl transition-all">
              <h3 className="text-lg font-bold text-white mb-2">Best Windsurf Rules</h3>
              <p className="text-gray-400 text-sm">Complete Guide 2025</p>
            </Link>
          </div>
        </div>
      </article>

      <BlogFooter
        postTitle="Best Kiro Steering Rules: Complete Guide 2025"
        postUrl="/blog/best-kiro-steering-rules"
      />
    </main>
  )
}
