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
      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
            <p className="text-xl text-gray-300 leading-relaxed mb-0">
              When we launched PRPM, we had one goal: make AI coding tools as easy to share as npm packages. One month later, we've built something much bigger—a complete platform with over 7,500 packages, an interactive testing playground, AI-powered search, and tools for both users and authors. Here's everything you need to know.
            </p>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">The Core Idea: Install Once, Use Anywhere</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Here's the problem: you're tired of hunting through GitHub repos for quality prompts and rules. When you finally find something good, it's in the wrong format for your IDE. Or your team uses a mix of Cursor, Claude, and VS Code with Continue, and you're manually converting the same rules for each editor. It's tedious and wastes time.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            PRPM fixes this. Install a package once, and it works in every AI editor—whether you're sharing across a team or switching tools yourself:
          </p>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-6 mb-8 font-mono text-sm">
            <div className="text-gray-500 mb-2"># One command, any editor</div>
            <div className="text-prpm-accent-light mb-4">prpm install @sanjeed5/react-best-practices</div>
            <div className="text-gray-400 text-xs leading-relaxed">
              Automatically converts to:<br/>
              → .cursor/rules/ for Cursor<br/>
              → .claude/skills/ for Claude<br/>
              → .continue/prompts/ for Continue<br/>
              → .windsurf/rules/ for Windsurf<br/>
              → .github/copilot-instructions.md for GitHub Copilot<br/>
              → .kiro/steering/ for Kiro
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            We detect your editor and convert on-the-fly. Authors publish once, users install anywhere. No manual work, no format headaches.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Finding What You Need: 7,500+ Packages and Growing</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            PRPM's registry has over 7,500 packages spanning every major use case: React hooks guidance, Python type safety rules, AWS deployment best practices, API documentation generators, and more. We import quality packages from GitHub, ctx.directory, and community submissions.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            Finding packages is easy. Traditional keyword search works great if you know what you're looking for:
          </p>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-4 mb-6 font-mono text-sm">
            <div className="text-prpm-accent-light">prpm search "react hooks"</div>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            But what if you don't know the exact terminology? That's where AI semantic search comes in. Instead of guessing keywords, describe what you want:
          </p>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-4 mb-6 font-mono text-sm">
            <div className="text-purple-400">prpm ai-search "help me manage side effects in React"</div>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            The AI understands intent. It knows "side effects in React" relates to useEffect, data fetching, and lifecycle management. It finds packages you wouldn't have discovered with keyword search alone.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            You can also star packages and collections on the web app to save them for later. Build your own curated list of tools you use frequently.
          </p>

          <h3 className="text-2xl font-bold text-white mt-10 mb-4">Collections: Complete Setups in One Command</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Individual packages are great, but real workflows need multiple tools. Collections bundle related packages together. Want a complete Next.js setup with TypeScript rules, React best practices, Tailwind guidelines, and deployment checks? One command:
          </p>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-4 mb-6 font-mono text-sm">
            <div className="text-prpm-accent-light">prpm install collections/nextjs-pro</div>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            Collections get you from zero to productive instantly. We've created collections for Next.js, Python ML, AWS deployments, and more. You can also star collections to revisit them later or share with your team.
          </p>

          <h3 className="text-2xl font-bold text-white mt-10 mb-4">Quality Scores: Finding the Good Stuff</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            With thousands of packages, quality matters. Every package gets a 0-5 star rating based on content depth, structure, metadata completeness, and community signals like downloads and stars. High-quality packages surface first in search results.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Test Before You Install: The Playground</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Here's a common frustration: you find a package that sounds perfect. You install it, test it, realize it doesn't quite fit your workflow, uninstall it, and start over. Repeat a few times and you've wasted an hour.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            The PRPM playground fixes this. Test packages with real AI models before installing. Available both on the CLI and web:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4">
              <div className="text-sm font-semibold text-prpm-green mb-2">CLI</div>
              <code className="text-xs text-gray-300">prpm playground --package @vendor/pkg</code>
            </div>
            <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4">
              <div className="text-sm font-semibold text-prpm-green mb-2">Web</div>
              <code className="text-xs text-gray-300">https://prpm.dev/playground</code>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            You get 1 free anonymous playground run (no signup), 5 free credits when you sign up, and 100 credits per month with PRPM+ ($6/month). Credits roll over up to 200, so you never lose them.
          </p>

          <h3 className="text-2xl font-bold text-white mt-10 mb-4">Model Comparison: Find the Right AI for Your Use Case</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Not all AI models perform equally for every task. Claude Sonnet 3.5 excels at code generation. GPT-4 is strong at reasoning. Gemini Pro shines with multimodal tasks. The playground lets you test packages across all models side-by-side:
          </p>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-4 mb-6 font-mono text-sm">
            <div className="text-blue-400">prpm playground --package @vendor/pkg --compare</div>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            Run the same prompt with the same package on multiple models, compare outputs, and choose the best fit for your project.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">For Package Authors: Publish Once, Reach Everyone</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            If you're creating prompts, skills, or agents, you face a choice: pick one AI editor and limit your audience, or manually maintain separate versions for Cursor, Claude, Continue, Windsurf, and others. Both options are tedious.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            PRPM changes this. Write your package once in any format, publish it, and we handle all conversions. Your package works in every supported editor automatically. One version, 4x+ the reach.
          </p>

          <h3 className="text-2xl font-bold text-white mt-10 mb-4">Analytics That Actually Matter</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            See how your packages perform with detailed analytics: downloads, views, stars, and playground usage. Understand what's working, what needs improvement, and where your audience is coming from.
          </p>

          <h3 className="text-2xl font-bold text-white mt-10 mb-4">Custom Prompt Testing for Verified Authors</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Verified authors get access to custom prompt testing in the playground. Test your package with custom system prompts before publishing. A/B test different variations, iterate quickly, and validate quality across multiple AI models:
          </p>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-4 mb-6 font-mono text-sm">
            <div className="text-prpm-green">prpm playground --custom-prompt "You are..." --compare</div>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            This lets you ship higher quality packages faster. No more publishing, waiting for user feedback, and iterating publicly. Test privately, refine, then publish when it's ready.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Organizations and Private Packages</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            For teams and companies, PRPM offers organization accounts. Create a namespace for your company, invite team members, and publish private packages that only your organization can access. Keep proprietary prompts internal while still using PRPM's tooling for versioning, distribution, and analytics.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Everything Else Under the Hood</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Beyond the headline features, PRPM handles all the infrastructure details you'd expect from a mature package manager: semantic versioning, version pinning, package deprecation, GitHub integration for importing existing packages, download analytics, category browsing, and tag filtering.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Getting Started</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Ready to try PRPM? Install the CLI and you're good to go:
          </p>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-6 mb-6 font-mono text-sm">
            <div className="mb-4">
              <div className="text-gray-500 mb-2"># Install the CLI</div>
              <div className="text-prpm-accent-light">npm install -g prpm</div>
            </div>
            <div className="mb-4">
              <div className="text-gray-500 mb-2"># Search for packages</div>
              <div className="text-prpm-accent-light">prpm search "react best practices"</div>
            </div>
            <div className="mb-4">
              <div className="text-gray-500 mb-2"># Install a package</div>
              <div className="text-prpm-accent-light">prpm install @vendor/package-name</div>
            </div>
            <div>
              <div className="text-gray-500 mb-2"># Test in playground</div>
              <div className="text-prpm-accent-light">prpm playground --package @vendor/package-name</div>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Or browse packages on the web, star your favorites, and explore collections. The web experience mirrors the CLI—use whichever fits your workflow.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            <Link href="/search" className="flex items-center justify-center gap-2 px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all">
              Browse Packages
            </Link>
            <Link href="/playground" className="flex items-center justify-center gap-2 px-6 py-3 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white rounded-lg font-semibold transition-all">
              Try Playground
            </Link>
          </div>

          <div className="bg-gradient-to-r from-prpm-accent/20 to-prpm-green/20 border border-prpm-accent/30 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Open Source & Community-Driven</h3>
            <p className="text-gray-300 mb-6">
              PRPM is fully open source. We're building this platform with the community, for the community. Follow us on Twitter, check the docs, or contribute on GitHub.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://twitter.com/prpmdev"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-gray-300 hover:text-prpm-accent rounded-lg transition-all"
              >
                @prpmdev on Twitter
              </a>
              <a
                href="https://docs.prpm.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-gray-300 hover:text-prpm-accent rounded-lg transition-all"
              >
                Read the docs
              </a>
              <a
                href="https://github.com/pr-pm/prpm"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-gray-300 hover:text-prpm-accent rounded-lg transition-all"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </article>

      <BlogFooter postTitle="The Complete Guide to PRPM: Every Feature You Need to Know" postUrl="/blog/prpm-complete-feature-guide" />
    </main>
  )
}
