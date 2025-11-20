import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Best Kiro Hooks for Development Automation: Complete Guide 2025 - PRPM",
  description: "Discover the best Kiro hooks for event-driven automation. Test synchronization, documentation updates, accessibility audits. Compare PRPM vs GitHub vs manual hooks. Get CLI installation and quality metrics.",
  keywords: "kiro hooks, kiro automation, event-driven hooks, kiro best practices, test synchronization, documentation automation, accessibility hooks, kiro.dev hooks",
  openGraph: {
    title: "Best Kiro Hooks for Development Automation: Complete Guide 2025",
    description: "Find and install the best Kiro hooks for automatic test updates, documentation sync, and code quality checks. CLI installation, testing playground, and version control.",
  },
}

export default function KiroHooksAutomationPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Kiro', 'Hooks', 'Automation', 'AI Coding']}
          title="Best Kiro Hooks for Development Automation: Complete Guide 2025"
          subtitle="Event-driven automation that keeps tests, docs, and code quality in sync—automatically"
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

          <p><strong>Kiro hooks</strong> are event-driven automation scripts that trigger when you edit, create, or delete files. Unlike static rules, the best Kiro hooks automatically keep tests synchronized with implementation changes, update documentation when APIs evolve, and enforce code quality—all without manual intervention.</p>

          <p>This guide shows you where to find the <strong>best Kiro hooks</strong>, how to install them with CLI tools, and which automation patterns work best for test synchronization, documentation updates, and code quality enforcement.</p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">What Makes Kiro Hooks Different?</h2>
          </div>

          <p>Kiro hooks are <strong>event-driven automation</strong> that fundamentally changes how AI assistants interact with your development workflow:</p>

          <div className="not-prose mb-10">
            <h3 className="text-2xl font-bold text-white mb-4">Event-Driven vs. Prompt-Based</h3>
            <p className="text-gray-300 leading-relaxed mb-6">Traditional AI coding follows a request-response pattern. Kiro hooks flip this model—they trigger automatically based on file events:</p>

            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
              <li><strong>fileEdited:</strong> Triggers when you modify a file (e.g., "Component changed? Update tests.")</li>
              <li><strong>fileCreated:</strong> Triggers on new files (e.g., "New component? Generate tests.")</li>
              <li><strong>fileDeleted:</strong> Triggers on deletion (e.g., "Route deleted? Remove tests.")</li>
              <li><strong>manual:</strong> Manual trigger for on-demand checks (e.g., "Run security audit")</li>
            </ul>
          </div>

          <div className="not-prose mb-10">
            <h3 className="text-2xl font-bold text-white mb-4">Hook Structure: JSON Files</h3>
            <p className="text-gray-300 leading-relaxed mb-6">Kiro hooks are stored as <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded">.kiro.hook</code> files in <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded">.kiro/hooks/</code>:</p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
              <code className="text-sm text-gray-300 font-mono">{`{
  "enabled": true,
  "name": "Test Synchronization",
  "description": "Update tests when implementation changes",
  "version": "1",
  "when": {
    "type": "fileEdited",
    "patterns": ["src/components/**/*.tsx"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "Implementation changed. Update tests."
  }
}`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-6"><strong>Key fields:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded">enabled</code> toggles the hook on/off, <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded">when.type</code> defines the event trigger, <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded">when.patterns</code> specifies which files, and <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded">then.prompt</code> contains AI instructions.</p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Where to Find the Best Kiro Hooks</h2>
          </div>

          <p>Kiro hooks are a new feature (introduced 2024), so finding quality automation patterns is challenging. Here are the main sources:</p>

          <div className="not-prose mb-10">
            <h3 className="text-2xl font-bold text-white mb-4">1. PRPM (prpm.dev) - Centralized Registry</h3>
            <p className="text-gray-300 leading-relaxed mb-6"><strong>Best for:</strong> Production teams who want CLI installation, quality scoring, and version control.</p>

            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
              <li><strong>CLI installation:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded">prpm install @author/hook-name</code></li>
              <li><strong>Testing playground:</strong> Test hooks with real AI models before installing</li>
              <li><strong>Quality metrics:</strong> Automated 0-5 star scoring</li>
              <li><strong>Version control:</strong> Semantic versioning with update notifications</li>
              <li><strong>Format conversion:</strong> Convert other automation patterns to Kiro format</li>
            </ul>
          </div>

          <div className="not-prose mb-10">
            <h3 className="text-2xl font-bold text-white mb-4">2. Official Kiro Docs - Example Hooks</h3>
            <p className="text-gray-300 leading-relaxed mb-6"><strong>Best for:</strong> Learning hook structure and understanding intended patterns.</p>

            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
              <li><strong>Official documentation:</strong> Hook specs from Kiro creators</li>
              <li><strong>Reference implementations:</strong> Shows proper JSON structure</li>
              <li><strong>Manual installation:</strong> Copy-paste JSON files</li>
              <li><strong>Limited examples:</strong> ~3-5 starter hooks</li>
            </ul>
          </div>

          <div className="not-prose mb-10">
            <h3 className="text-2xl font-bold text-white mb-4">3. GitHub Community - Real-World Patterns</h3>
            <p className="text-gray-300 leading-relaxed mb-6"><strong>Best for:</strong> Exploring specialized hooks from production use.</p>

            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
              <li><strong>Community contributions:</strong> Hooks from developers using Kiro in production</li>
              <li><strong>Manual extraction:</strong> Clone repos, copy <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded">.kiro.hook</code> files</li>
              <li><strong>No quality signals:</strong> Can't verify hook quality without testing</li>
            </ul>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Feature Comparison</h2>
          </div>

          <div className="not-prose overflow-x-auto mb-8">
            <table className="w-full border-collapse text-gray-300">
              <thead className="border-b-2 border-prpm-border">
                <tr>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Feature</th>
                  <th className="text-left text-prpm-accent bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">PRPM</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Official Kiro</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">GitHub</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">CLI Installation</td>
                  <td className="px-4 py-4 border border-prpm-border text-green-400">✓</td>
                  <td className="px-4 py-4 border border-prpm-border text-red-400">✗</td>
                  <td className="px-4 py-4 border border-prpm-border text-red-400">✗</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Testing Playground</td>
                  <td className="px-4 py-4 border border-prpm-border text-green-400">✓</td>
                  <td className="px-4 py-4 border border-prpm-border text-red-400">✗</td>
                  <td className="px-4 py-4 border border-prpm-border text-red-400">✗</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Quality Metrics</td>
                  <td className="px-4 py-4 border border-prpm-border text-green-400">✓</td>
                  <td className="px-4 py-4 border border-prpm-border text-yellow-400">~</td>
                  <td className="px-4 py-4 border border-prpm-border text-red-400">✗</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Version Control</td>
                  <td className="px-4 py-4 border border-prpm-border text-green-400">✓</td>
                  <td className="px-4 py-4 border border-prpm-border text-yellow-400">~</td>
                  <td className="px-4 py-4 border border-prpm-border text-yellow-400">~</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Best For</td>
                  <td className="px-4 py-4 border border-prpm-border text-green-400">Production</td>
                  <td className="px-4 py-4 border border-prpm-border">Learning</td>
                  <td className="px-4 py-4 border border-prpm-border">Exploring</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Common Kiro Hook Patterns</h2>
          </div>

          <p className="mb-8">The most valuable automation patterns developers use:</p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">1. Test Synchronization</h3>
            <p className="text-gray-300 leading-relaxed mb-6"><strong>Problem:</strong> Implementation changes, tests fall out of sync, coverage gaps appear.</p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
              <code className="text-sm text-gray-300 font-mono">{`{
  "enabled": true,
  "name": "Test Sync",
  "description": "Update tests when implementation changes",
  "version": "1",
  "when": {
    "type": "fileEdited",
    "patterns": ["src/**/*.ts", "!**/*.test.ts"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "Implementation changed. Update tests:\\n1. Find test file\\n2. Add tests for new functionality\\n3. Update assertions\\n4. Verify 80%+ coverage"
  }
}`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-6"><strong>Value:</strong> Keeps test coverage consistent. Catches regressions immediately.</p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">2. Documentation Updates</h3>
            <p className="text-gray-300 leading-relaxed mb-6"><strong>Problem:</strong> API routes change, documentation gets stale.</p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
              <code className="text-sm text-gray-300 font-mono">{`{
  "enabled": true,
  "name": "API Documentation Sync",
  "description": "Update docs when API routes change",
  "version": "1",
  "when": {
    "type": "fileEdited",
    "patterns": ["src/pages/api/**/*.ts", "app/api/**/*.ts"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "API route edited. Update docs:\\n1. Update OpenAPI spec\\n2. Document schemas\\n3. Add examples\\n4. Update README"
  }
}`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-6"><strong>Value:</strong> Documentation stays synchronized. Integration partners get accurate specs.</p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">3. Accessibility Audits</h3>
            <p className="text-gray-300 leading-relaxed mb-6"><strong>Problem:</strong> UI components ship without accessibility tests.</p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
              <code className="text-sm text-gray-300 font-mono">{`{
  "enabled": true,
  "name": "Accessibility Checker",
  "description": "Audit accessibility on UI changes",
  "version": "1",
  "when": {
    "type": "fileEdited",
    "patterns": ["src/components/**/*.tsx"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "UI changed. Check accessibility:\\n1. Verify ARIA labels\\n2. Check keyboard navigation\\n3. Test color contrast\\n4. Add a11y tests"
  }
}`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-6"><strong>Value:</strong> Catches accessibility issues during development, not production.</p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Quick Start: Installing Kiro Hooks</h2>
          </div>

          <pre className="mb-8"><code>{`# Install PRPM CLI
npm install -g prpm

# Search for Kiro hooks
prpm search "test" --format kiro --subtype hook

# Test before installing
prpm playground @author/test-sync-hook

# Install hooks
prpm install @author/test-sync-hook

# Hooks go to .kiro/hooks/*.kiro.hook

# Update installed hooks
prpm update

# Publish your own
prpm init kiro
prpm publish`}</code></pre>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Writing Effective Hooks</h2>
          </div>

          <p className="mb-8">Best practices for high-quality hooks:</p>

          <div className="not-prose mb-10">
            <h3 className="text-2xl font-bold text-white mb-4">1. Use Specific File Patterns</h3>
            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
              <li><strong>Good:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded">"src/components/**/*.tsx"</code></li>
              <li><strong>Bad:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded">"**/*.tsx"</code> (too broad)</li>
              <li><strong>Exclusions:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded">"!**/*.test.ts"</code></li>
            </ul>
          </div>

          <div className="not-prose mb-10">
            <h3 className="text-2xl font-bold text-white mb-4">2. Write Clear Prompts</h3>
            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
              <li><strong>Good:</strong> "1. Find test. 2. Add tests. 3. Verify coverage."</li>
              <li><strong>Bad:</strong> "Update tests." (too vague)</li>
              <li>Use numbered lists for step-by-step automation</li>
            </ul>
          </div>

          <div className="not-prose mb-10">
            <h3 className="text-2xl font-bold text-white mb-4">3. Choose the Right Event</h3>
            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
              <li><strong>fileEdited:</strong> Real-time checks (syntax, validation)</li>
              <li><strong>fileCreated:</strong> Scaffolding (generate boilerplate)</li>
              <li><strong>fileDeleted:</strong> Cleanup (remove tests, update docs)</li>
              <li><strong>manual:</strong> On-demand audits (security, accessibility)</li>
            </ul>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Choosing the Right Source</h2>
          </div>

          <p className="mb-8"><strong>Use PRPM if:</strong> You want professional package management with CLI installation, testing playground, version control, and quality metrics. Best for production teams.</p>

          <p className="mb-8"><strong>Use Official Kiro docs if:</strong> You want reference implementations to understand hook structure. Good for learning.</p>

          <p className="mb-8"><strong>Use GitHub if:</strong> You're exploring community patterns or need specialized hooks. No quality guarantees.</p>

          <p className="mb-8"><strong>Pro tip:</strong> Start with PRPM's example hooks, test them in the playground, then customize for your workflow.</p>

          <div className="not-prose my-12 p-8 bg-gradient-to-br from-prpm-accent/10 to-prpm-green/10 border border-prpm-accent/30 rounded-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Start Using Kiro Hooks Today</h3>
            <p className="text-gray-300 mb-6">
              Get CLI installation, quality metrics, testing playground, and version control for event-driven automation.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/search?format=kiro&subtype=hook"
                className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent/80 text-white font-semibold rounded-lg transition-all"
              >
                Browse Kiro Hooks
              </Link>
              <a
                href="https://docs.prpm.dev"
                className="px-6 py-3 bg-prpm-dark border border-prpm-border hover:border-prpm-accent text-white font-semibold rounded-lg transition-all"
              >
                Read Documentation
              </a>
            </div>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Related Posts</h2>
          </div>

          <div className="not-prose grid gap-4 md:grid-cols-2 mb-8">
            <Link href="/blog/best-kiro-steering-rules" className="block p-6 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent rounded-xl transition-all">
              <h3 className="text-lg font-bold text-white mb-2">Best Kiro Steering Rules</h3>
              <p className="text-gray-400 text-sm">Context-aware AI development with domain-specific rules</p>
            </Link>
            <Link href="/blog/kiro-deep-dive" className="block p-6 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent rounded-xl transition-all">
              <h3 className="text-lg font-bold text-white mb-2">Kiro Steering Files: Technical Deep Dive</h3>
              <p className="text-gray-400 text-sm">Understanding Kiro's modular architecture</p>
            </Link>
          </div>
        </div>
      </article>

      <BlogFooter
        postTitle="Best Kiro Hooks for Development Automation: Complete Guide 2025"
        postUrl="/blog/kiro-hooks-automation"
      />
    </main>
  )
}
