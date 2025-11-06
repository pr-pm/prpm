import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Best Windsurf Rules for AI Coding: Complete Guide 2025 - PRPM",
  description: "Discover the best Windsurf rules for AI-powered development. Compare PRPM vs Playbooks vs Windsurf.run. Get CLI installation, version control, testing, and free starter collections.",
  keywords: "windsurf rules, best windsurf rules, windsurf ai editor, windsurf coding rules, ai coding rules, cursor rules, windsurf.run, playbooks windsurf",
  openGraph: {
    title: "Best Windsurf Rules for AI Coding: Complete Guide 2025",
    description: "Find and install the best Windsurf rules. Compare top platforms: PRPM, Playbooks, Windsurf.run. Free CLI, testing playground, and format conversion.",
  },
}

export default function DiscoveringWindsurfRulesPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Windsurf Rules', 'AI Coding', 'Best Practices']}
          title="Best Windsurf Rules for AI Coding: Complete Guide 2025"
          subtitle="Compare top platforms, find quality rules, and build better apps with Windsurf AI editor"
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

          <p><strong><a href="https://windsurf.com/editor/directory" target="_blank">Windsurf rules</a></strong> are custom instructions that guide the Windsurf AI editor to write better code for your specific tech stack, coding style, and project requirements. Whether you're building with React, Next.js, Django, or any modern framework, the right Windsurf rules dramatically improve AI-generated code quality.</p>

          <p>This guide compares the <strong>best Windsurf rules</strong> platforms and shows you how to find, test, and install quality rules for your projects.</p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Where to Find the Best Windsurf Rules</h2>
          </div>

          <p>The Windsurf ecosystem is rapidly growing with three main platforms offering rules discovery:</p>

          <div className="not-prose mb-8">
            <h3 className="text-2xl font-bold text-white mb-3 mt-6">1. PRPM (prpm.dev) - Full Package Management</h3>
          </div>

          <p><strong>Best for:</strong> Developers who want CLI installation, version control, testing before installing, and cross-editor compatibility.</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li><strong>CLI installation:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded">prpm install @package-name</code> — no manual file copying</li>
              <li><strong>Testing playground:</strong> Test rules with real AI models before installing</li>
              <li><strong>Quality metrics:</strong> Ratings, download counts, automated quality scoring</li>
              <li><strong>Version control:</strong> Semantic versioning, update management, dependency tracking</li>
              <li><strong>Format conversion:</strong> Install Cursor rules, Claude skills, or Copilot instructions as Windsurf format</li>
              <li><strong>Free tier:</strong> Unlimited browsing, installation, and publishing</li>
            </ul>
          </div>

          <div className="not-prose mb-8">
            <h3 className="text-2xl font-bold text-white mb-3 mt-6">2. Windsurf.run - Curated Directory</h3>
          </div>

          <p><strong>Best for:</strong> Browsing Windsurf-specific rules and MCP server integrations.</p>

          <p className="mt-2 text-sm text-gray-400"><em>Note: From the same creators as cursor.directory</em></p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li><strong>Curated collection:</strong> Focused on quality over quantity</li>
              <li><strong>MCP servers:</strong> Integrations for GitHub, PostgreSQL, Supabase, Docker, Kubernetes</li>
              <li><strong>Framework rules:</strong> Next.js, React, Vue, NestJS, FastAPI, Django, Flask</li>
              <li><strong>Manual installation:</strong> Copy-paste from web interface</li>
              <li><strong>No version control:</strong> Static rules, no update mechanism</li>
              <li><strong>UI quirk:</strong> Infinite scroll appears endless but actually repeats entries after first page</li>
              <li><strong>Advertisements:</strong> Site contains ads that can distract from content discovery</li>
            </ul>
          </div>

          <div className="not-prose mb-8">
            <h3 className="text-2xl font-bold text-white mb-3 mt-6">3. Playbooks (playbooks.com) - Community Learning Platform</h3>
          </div>

          <p><strong>Best for:</strong> Beginners learning AI-assisted development ("vibe coding").</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li><strong>Free tutorials:</strong> Learn-by-doing approach for beginners</li>
              <li><strong>Community forum:</strong> Troubleshooting and peer support</li>
              <li><strong>Example prompts:</strong> Adaptable rules for various tech stacks</li>
              <li><strong>Multi-tool support:</strong> Rules for Cursor, Windsurf, Cline, Lovable</li>
              <li><strong>No CLI:</strong> Manual copying required</li>
              <li><strong>Limited discovery:</strong> Smaller rule collection</li>
              <li><strong>Advertisements:</strong> Ad-supported model may interrupt user experience</li>
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
                  <th className="text-left p-3 text-white font-semibold">Windsurf.run</th>
                  <th className="text-left p-3 text-white font-semibold">Playbooks</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">CLI Installation</td>
                  <td className="p-3 text-green-400">✓ prpm install</td>
                  <td className="p-3 text-red-400">✗ Manual copy</td>
                  <td className="p-3 text-red-400">✗ Manual copy</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Testing Before Install</td>
                  <td className="p-3 text-green-400">✓ Playground</td>
                  <td className="p-3 text-red-400">✗ None</td>
                  <td className="p-3 text-red-400">✗ None</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Quality Metrics</td>
                  <td className="p-3 text-green-400">✓ Ratings, downloads</td>
                  <td className="p-3 text-yellow-400">~ Curated only</td>
                  <td className="p-3 text-yellow-400">~ Community votes</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Version Control</td>
                  <td className="p-3 text-green-400">✓ Semantic versioning</td>
                  <td className="p-3 text-red-400">✗ Static rules</td>
                  <td className="p-3 text-red-400">✗ Static examples</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Format Conversion</td>
                  <td className="p-3 text-green-400">✓ Any format → Windsurf</td>
                  <td className="p-3 text-red-400">✗ Windsurf only</td>
                  <td className="p-3 text-yellow-400">~ Multi-tool examples</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Collection Size</td>
                  <td className="p-3 text-green-400">2100+ packages</td>
                  <td className="p-3 text-yellow-400">~50 curated</td>
                  <td className="p-3 text-yellow-400">~30 tutorials</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Update Management</td>
                  <td className="p-3 text-green-400">✓ prpm update</td>
                  <td className="p-3 text-red-400">✗ Manual re-copy</td>
                  <td className="p-3 text-red-400">✗ Manual tracking</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Learning Resources</td>
                  <td className="p-3 text-green-400">✓ Docs + Examples</td>
                  <td className="p-3 text-yellow-400">~ Basic guides</td>
                  <td className="p-3 text-green-400">✓ Full tutorials</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Advertisements</td>
                  <td className="p-3 text-green-400">✗ Ad-free</td>
                  <td className="p-3 text-red-400">✓ Contains ads</td>
                  <td className="p-3 text-red-400">✓ Ad-supported</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Best For</td>
                  <td className="p-3 text-green-400">Production teams</td>
                  <td className="p-3">Quick exploration</td>
                  <td className="p-3">Learning basics</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">How to Find the Best Windsurf Rules for Your Stack</h2>
          </div>

          <p>Finding quality Windsurf rules for your specific tech stack is crucial for AI-assisted development. Here's what to look for:</p>

          <div className="not-prose mb-8">
            <h3 className="text-2xl font-bold text-white mb-3 mt-6">1. Match Your Framework</h3>
          </div>

          <p>The best Windsurf rules are tailored to your stack. Look for rules specifically designed for:</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li><strong>Frontend:</strong> React, Next.js, Vue, Svelte, Angular</li>
              <li><strong>Backend:</strong> Node.js, Django, FastAPI, Rails, NestJS</li>
              <li><strong>Mobile:</strong> React Native, Flutter, Expo</li>
              <li><strong>Full-stack:</strong> T3 Stack, RedwoodJS, Remix</li>
            </ul>
          </div>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">2. Check Quality Signals</h3>
          </div>

          <p>On PRPM, every Windsurf rule package includes quality metrics:</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li><strong>Automated quality score:</strong> 0-5 rating based on content analysis</li>
              <li><strong>Download count:</strong> How many developers trust this rule</li>
              <li><strong>User ratings:</strong> Real feedback from production use</li>
              <li><strong>Test coverage:</strong> Verified examples and test cases</li>
              <li><strong>Maintenance status:</strong> Last updated, version history</li>
            </ul>
          </div>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">3. Test Before Installing</h3>
          </div>

          <p>PRPM's playground lets you test Windsurf rules with real AI models before installing:</p>

          <pre className="mt-4"><code>{`# Test a rule with your actual prompt
prpm playground @react/modern-patterns "Create a form with validation"

# See exactly what code quality you'll get
# Then decide if it's the right rule for you`}</code></pre>

          <p className="mt-4">No other Windsurf rules platform offers this — Windsurf.run and Playbooks require manual installation before you can test.</p>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">4. Version Control & Updates</h3>
          </div>

          <p>The best Windsurf rules evolve with framework updates. PRPM provides semantic versioning:</p>

          <pre className="mt-4"><code>{`# Install specific version
prpm install @next/app-router@1.2.0

# Update to latest
prpm update @next/app-router

# See changelog
prpm info @next/app-router`}</code></pre>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Quick Start</h2>
          </div>

          <pre><code>{`# Install PRPM CLI
npm install -g prpm

# Search best Windsurf rules for your stack
prpm search "react" --format windsurf
prpm search "next.js" --format windsurf
prpm search "django" --format windsurf

# Test before installing (unique to PRPM)
prpm playground @stevermeister/react-best-practices "Create form component"

# Install Windsurf rules
prpm install @stevermeister/react-best-practices

# Install for Next.js full-stack
prpm install @andra2112s/nextjs-typescript-fullstack

# Or convert any Cursor/Claude rule to Windsurf format
prpm install @cursor/typescript-strict --format windsurf

# Publish your own Windsurf rules
prpm init
prpm publish`}</code></pre>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Popular Windsurf Rules Collections</h2>
          </div>

          <p>Here are popular Windsurf rules packages available on PRPM:</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-3">
              <li><strong>@stevermeister/react-best-practices:</strong> Comprehensive React development with TypeScript, hooks, and modern patterns</li>
              <li><strong>@andra2112s/nextjs-typescript-fullstack:</strong> Next.js 15 full-stack with App Router, Server Components, and TypeScript</li>
              <li><strong>@stevermeister/vue-composition-api:</strong> Vue 3 Composition API with Pinia, Vite, and TypeScript</li>
              <li><strong>@stevermeister/fastapi-modern:</strong> Modern FastAPI with async patterns, Pydantic V2, and best practices</li>
              <li><strong>@stevermeister/django-python:</strong> Django development with async ORM, type hints, and production patterns</li>
              <li><strong>@stevermeister/typescript-strict:</strong> Strict TypeScript configuration with modern features and type safety</li>
              <li><strong>@kinopeee/cascade-core-principles:</strong> Windsurf Cascade AI assistant core operating principles</li>
              <li><strong>@obviousworks/vibe-coding-global-rules:</strong> Universal AI coding standards for simplicity, security, and feature-based development</li>
            </ul>
          </div>

          <p className="mt-6">Browse all 2100+ packages at <Link href="/search?format=windsurf" className="text-prpm-accent hover:underline">prpm.dev/search</Link></p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Choosing the Right Platform</h2>
          </div>

          <p><strong>Use PRPM if:</strong> You want professional package management, CLI installation, testing before installing, version control, and cross-editor compatibility. Best for production teams and serious developers.</p>

          <p className="mt-4"><strong>Use Windsurf.run if:</strong> You want a curated directory of Windsurf-specific rules and MCP server integrations from the cursor.directory team. Good for quick exploration, but note the actual collection is smaller than it appears (infinite scroll repeats entries).</p>

          <p className="mt-4"><strong>Use Playbooks if:</strong> You're new to AI-assisted coding and want tutorials and community support. Best for beginners learning the basics of "vibe coding."</p>

          <p className="mt-6"><strong>Pro tip:</strong> Most professional developers use PRPM for production work and reference Windsurf.run for MCP server discovery. Be aware that Windsurf.run's endless scroll creates the illusion of more content than actually exists—entries eventually start repeating. Both Windsurf.run and Playbooks use ad-supported models, while PRPM is completely ad-free for an uninterrupted development workflow.</p>

          <div className="not-prose my-12 p-8 bg-gradient-to-br from-prpm-accent/10 to-prpm-green/10 border border-prpm-accent/30 rounded-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Start Using the Best Windsurf Rules Today</h3>
            <p className="text-gray-300 mb-6">
              Get CLI installation, quality metrics, testing playground, and version control for your Windsurf AI editor. 2100+ packages available now.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/search?format=windsurf"
                className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent/80 text-white font-semibold rounded-lg transition-all"
              >
                Browse Windsurf Rules
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
            <Link href="/blog/discovering-claude-skills-prpm-vs-competition" className="block p-6 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent rounded-xl transition-all">
              <h3 className="text-lg font-bold text-white mb-2">Discovering Claude Skills</h3>
              <p className="text-gray-400 text-sm">PRPM vs The Competition</p>
            </Link>
          </div>
        </div>
      </article>

      <BlogFooter
        postTitle="Best Windsurf Rules for AI Coding: Complete Guide 2025"
        postUrl="/blog/discovering-windsurf-rules"
      />
    </main>
  )
}
