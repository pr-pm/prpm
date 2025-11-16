import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "The Complete Guide to PRPM: Every Feature You Need to Know",
  description: "PRPM is more than a package manager—it's a complete platform for discovering, testing, publishing, and managing AI coding tools.",
  openGraph: {
    title: "The Complete Guide to PRPM: Every Feature You Need to Know",
    description: "From universal package management to AI search, playground testing to author analytics—discover everything PRPM offers.",
  },
}

export default function PRPMCompleteFeatureGuidePost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Guide', 'Features', 'Platform Overview']}
          title="The Complete Guide to PRPM: Every Feature You Need to Know"
          author="PRPM Team"
          date="November 16, 2025"
          readTime="10 min read"
        />

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 mb-8">
            <p className="text-xl text-gray-300 leading-relaxed italic mb-0">
              PRPM is more than a package manager—it's a complete platform for discovering, testing, publishing, and managing AI coding tools. This guide walks through every major feature, explaining not just what each does, but why it matters and how it helps you build better software with AI.
            </p>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Table of Contents</h2>
          <ul className="text-gray-300 space-y-2 mb-8">
            <li><a href="#for-users" className="text-prpm-accent hover:underline">For Users: Discovery & Installation</a></li>
            <li><a href="#testing-tools" className="text-prpm-accent hover:underline">Testing Tools: The Playground</a></li>
            <li><a href="#for-authors" className="text-prpm-accent hover:underline">For Authors: Publishing & Analytics</a></li>
            <li><a href="#platform-features" className="text-prpm-accent hover:underline">Platform Features</a></li>
            <li><a href="#advanced-features" className="text-prpm-accent hover:underline">Advanced Features</a></li>
          </ul>

          <h2 id="for-users" className="text-3xl font-bold text-white mt-12 mb-4">For Users: Discovery & Installation</h2>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Universal Package Management</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            You find a great Cursor rule on GitHub. You copy it. Create a <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.cursor/rules/</code> file. Paste it in. Then you realize you also use Claude Code sometimes, so you need to rewrite it in their format. Repeat for Continue, Windsurf, Copilot...
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            <strong className="text-white">PRPM's Solution:</strong> Install once, use anywhere.
          </p>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
            <pre className="text-sm text-gray-300 overflow-x-auto"><code>{`# One package, any editor
prpm install @sanjeed5/react-best-practices

# Automatically converts to your editor's format:
# → .cursor/rules/ for Cursor
# → .claude/skills/ for Claude
# → .continue/prompts/ for Continue
# → .windsurf/rules/ for Windsurf
# → .github/copilot-instructions.md for Copilot
# → .kiro/steering/ for Kiro`}</code></pre>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            PRPM detects which AI editor you're using (or you can specify with <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">--as cursor</code>) and converts packages on-the-fly. Authors publish once in a canonical format. Users install in any editor. No manual conversion needed.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">7,500+ Cross-Platform Packages</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Browse packages for Cursor rules, Claude skills & agents, Continue prompts, Windsurf rules, GitHub Copilot instructions, Kiro steering files, and MCP configs. Every package works in every editor. No "Cursor-only" or "Claude-only" limitations.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Collections: Complete Setups in One Command</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Collections bundle related packages for complete workflow setups:
          </p>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
            <pre className="text-sm text-gray-300 overflow-x-auto"><code>{`prpm install collections/nextjs-pro
# Installs 20 packages:
# - Backend architect
# - Database architect
# - Cloud architect
# - API design patterns
# - Testing best practices
# - And 15 more...`}</code></pre>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            Instead of manually finding and installing a dozen packages for a new Next.js project, install one collection and get everything configured.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Smart Search with AI</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Traditional keyword search finds packages with "react" and "hooks" in the name. AI semantic search understands <em>"help me manage side effects in React"</em> and finds packages about useEffect, custom hooks, and state management—even if they don't use those exact words.
          </p>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
            <pre className="text-sm text-gray-300 overflow-x-auto"><code>{`# Traditional search
prpm search "react hooks"

# AI semantic search
prpm search "help me manage side effects in React" --ai`}</code></pre>
          </div>

          <h2 id="testing-tools" className="text-3xl font-bold text-white mt-12 mb-4">Testing Tools: The Playground</h2>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Interactive Playground</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Test packages with real AI models before installing. Run prompts, see actual output, make informed decisions. No more "install, try, uninstall, repeat."
          </p>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
            <pre className="text-sm text-gray-300 overflow-x-auto"><code>{`# CLI playground
prpm playground @vendor/package

# Web playground
https://prpm.dev/playground`}</code></pre>
          </div>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Model Comparison Mode</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Compare how different AI models respond to the same package. Test Claude Sonnet 3.5 vs GPT-4 vs Gemini Pro side-by-side. See which model works best for your use case.
          </p>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
            <pre className="text-sm text-gray-300 overflow-x-auto"><code>{`prpm playground @vendor/package --compare`}</code></pre>
          </div>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Free Credits System</h3>
          <ul className="text-gray-300 space-y-2 mb-8">
            <li><strong className="text-white">1 free anonymous run</strong> - Try before signup</li>
            <li><strong className="text-white">5 free credits on signup</strong> - Test multiple packages</li>
            <li><strong className="text-white">1,000 credits/month</strong> - For PRPM+ subscribers ($10/month)</li>
          </ul>

          <h2 id="for-authors" className="text-3xl font-bold text-white mt-12 mb-4">For Authors: Publishing & Analytics</h2>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Publish Once, Reach 4x+ Users</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Write your package once in a canonical format. PRPM automatically converts it to work in Cursor, Claude, Continue, Windsurf, Copilot, Kiro, and agents.md. Your package reaches users of all 7+ AI editors without writing 7 versions.
          </p>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
            <pre className="text-sm text-gray-300 overflow-x-auto"><code>{`# Publish once
prpm publish

# Automatically available for:
# - Cursor users (as .cursorrules)
# - Claude users (as .claude/skills/)
# - Continue users (as .continue/prompts/)
# - Windsurf users (as .windsurf/rules/)
# - Copilot users (as .github/copilot-instructions.md)
# - Kiro users (as .kiro/steering/)
# - agents.md users`}</code></pre>
          </div>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Comprehensive Analytics Dashboard</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Track downloads, views, stars, and playground usage. See which packages resonate, which formats are most popular, and how users discover your work.
          </p>

          <ul className="text-gray-300 space-y-2 mb-8">
            <li><strong className="text-white">Download analytics</strong> - Total, unique, by format</li>
            <li><strong className="text-white">Playground analytics</strong> - Test runs, compare mode usage, average rating</li>
            <li><strong className="text-white">Engagement metrics</strong> - Stars, views, time-series charts</li>
            <li><strong className="text-white">Format breakdown</strong> - See which editors your users prefer</li>
          </ul>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Author Verification</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Verified authors get a blue checkmark, priority ranking in search results, and access to advanced features like custom prompt testing in the playground.
          </p>

          <h2 id="platform-features" className="text-3xl font-bold text-white mt-12 mb-4">Platform Features</h2>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Quality Scoring Algorithm</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Every package gets a quality score (0-5 stars) based on content analysis, structure, metadata completeness, and community engagement. Scores help users find high-quality packages faster.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            <strong className="text-white">Scoring breakdown:</strong>
          </p>
          <ul className="text-gray-300 space-y-2 mb-8">
            <li><strong className="text-white">Content quality</strong> - Length, structure, examples</li>
            <li><strong className="text-white">Metadata completeness</strong> - Description, tags, version</li>
            <li><strong className="text-white">Community signals</strong> - Downloads, stars, playground usage</li>
            <li><strong className="text-white">Type-specific adjustments</strong> - Slash commands get +0.5, skills/agents get type-specific boosts</li>
          </ul>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Hybrid Search: Keyword + AI</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Traditional search (fast, precise) combined with AI semantic search (understands intent). Switch between modes or use both simultaneously.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Categories & Taxonomy</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Browse by category (Security, Testing, DevOps, AI/ML, etc.) or filter by tags. AI-powered categorization ensures packages are discoverable even if authors don't tag them perfectly.
          </p>

          <h2 id="advanced-features" className="text-3xl font-bold text-white mt-12 mb-4">Advanced Features</h2>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Organizations Support</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Create organization accounts to publish packages under a company namespace, manage team members, and share private packages within your organization.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Private Packages</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Keep proprietary prompts, internal coding standards, or company-specific agents private. Share only with your organization or specific team members.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">Version Management</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Semantic versioning (1.2.3) for packages. Users can pin specific versions, update automatically, or review changelog before upgrading.
          </p>

          <h3 className="text-2xl font-bold text-white mt-8 mb-4">GitHub Integration</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Import packages directly from GitHub repos. PRPM detects format, validates structure, and publishes automatically. Keep using Git for version control while leveraging PRPM for distribution.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Get Started</h2>

          <p className="text-gray-300 leading-relaxed mb-6">
            Install the PRPM CLI and try it out:
          </p>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
            <pre className="text-sm text-gray-300 overflow-x-auto"><code>{`# Install CLI
npm install -g prpm

# Search for packages
prpm search "react best practices"

# Install a package
prpm install @vendor/package-name

# Test in playground
prpm playground @vendor/package-name`}</code></pre>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Get Involved</h2>

          <ul className="text-gray-300 space-y-2 mb-8">
            <li><strong className="text-white">Browse packages:</strong> <Link href="/search" className="text-prpm-accent hover:underline">prpm.dev/search</Link></li>
            <li><strong className="text-white">Try the playground:</strong> <Link href="/playground" className="text-prpm-accent hover:underline">prpm.dev/playground</Link></li>
            <li><strong className="text-white">Read the docs:</strong> <a href="https://docs.prpm.dev" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline">docs.prpm.dev</a></li>
            <li><strong className="text-white">Follow us on Twitter:</strong> <a href="https://twitter.com/prpmdev" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline">@prpmdev</a></li>
            <li><strong className="text-white">Contribute:</strong> <a href="https://github.com/pr-pm/prpm" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline">GitHub</a></li>
          </ul>

          <p className="text-gray-300 leading-relaxed">
            Questions? Feedback? <Link href="/contact" className="text-prpm-accent hover:underline">Get in touch</Link>.
          </p>
        </div>
      </article>

      <BlogFooter />
    </main>
  )
}
