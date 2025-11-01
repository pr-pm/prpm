import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Introducing PRPM: The Universal Registry for AI Coding Tools",
  description: "Today, we're excited to launch PRPM - a universal package manager for AI prompts, agents, skills, and slash commands.",
  openGraph: {
    title: "Introducing PRPM: The Universal Registry for AI Coding Tools",
    description: "Learn about our vision for making AI coding tools accessible and shareable.",
  },
}

export default function IntroducingPRPMPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Launch', 'Announcement', 'Vision']}
          title="Introducing PRPM: The Universal Registry for AI Coding Tools"
          author="PRPM Team"
          date="October 23, 2025"
          readTime="5 min read"
        />

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 mb-8">
            <p className="text-xl text-gray-300 leading-relaxed italic mb-0">
              Today, we're thrilled to announce the launch of PRPM (Prompt Package Manager) — a universal registry for AI prompts, agents, skills, and slash commands that work across Cursor, Claude, Continue, Windsurf, and more.
            </p>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">The Problem We're Solving</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            As AI coding assistants have exploded in popularity, developers are creating incredible prompts, custom skills, and specialized agents. But there's a problem: these tools are scattered across GitHub repos, Discord servers, Twitter threads, and personal notes. There's no central place to discover, share, or manage them.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            Even worse, each AI tool has its own format. A prompt that works perfectly in Cursor won't work in Continue. An agent built for Claude Code needs to be rewritten for Windsurf. Developers are reinventing the wheel, and the community's best work is locked in silos.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Our Vision</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            We believe that AI coding tools should be as easy to share and install as npm packages. PRPM brings the familiar package manager experience to the world of AI prompts and tools:
          </p>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-6 mb-6">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">✓</span>
                <span><strong className="text-white">Universal Registry:</strong> One place to discover 1,500+ prompts, agents, skills, and collections</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">✓</span>
                <span><strong className="text-white">Cross-Platform:</strong> Works with Cursor, Claude, Continue, Windsurf, and more — all from one file</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">✓</span>
                <span><strong className="text-white">CLI-First:</strong> Install and manage tools with familiar npm-like commands</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">✓</span>
                <span><strong className="text-white">Collections:</strong> Bundle related tools together for complete workflow setups</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">✓</span>
                <span><strong className="text-white">Verified Authors:</strong> Claim your packages and track analytics</span>
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Getting Started</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Getting started with PRPM is simple:
          </p>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-6 mb-6 font-mono text-sm">
            <div className="mb-4">
              <div className="text-gray-500 mb-2"># Install the CLI</div>
              <div className="text-prpm-accent-light">npm install -g prpm</div>
            </div>
            <div className="mb-4">
              <div className="text-gray-500 mb-2"># Search for packages</div>
              <div className="text-prpm-accent-light">prpm search react</div>
            </div>
            <div>
              <div className="text-gray-500 mb-2"># Install a package</div>
              <div className="text-prpm-accent-light">prpm install @sanjeed5/react-best-practices</div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">What's Next</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            This is just the beginning. We're actively working on:
          </p>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-6">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-prpm-green mt-1">→</span>
                <span><strong className="text-white">Web Publishing:</strong> Publish packages directly from the webapp</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-green mt-1">→</span>
                <span><strong className="text-white">Enhanced Analytics:</strong> Detailed download stats, ratings, and community feedback</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-green mt-1">→</span>
                <span><strong className="text-white">prpm+:</strong> Advanced tooling for both using and writing prompts</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-green mt-1">→</span>
                <span><strong className="text-white">Team Features:</strong> Private registries and organization accounts</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-green mt-1">→</span>
                <span><strong className="text-white">AI-Powered Discovery:</strong> Smart recommendations based on your workflow</span>
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Join the Community</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            PRPM is built for the developer community, by developers. We're open source and welcome contributions:
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <a
              href="https://github.com/pr-pm/prpm"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              Star on GitHub
            </a>
            <Link
              href="/search"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white rounded-lg font-semibold transition-all"
            >
              Browse Packages
            </Link>
          </div>

          <div className="bg-gradient-to-r from-prpm-accent/20 to-prpm-green/20 border border-prpm-accent/30 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to get started?</h3>
            <p className="text-gray-300 mb-6">
              Install the CLI and start exploring 1,500+ packages today
            </p>
            <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4 font-mono text-prpm-accent-light inline-block">
              npm install -g prpm
            </div>
          </div>
        </div>

        <BlogFooter postTitle="Introducing PRPM: The Universal Registry for AI Coding Tools" postUrl="/blog/introducing-prpm" />
      </article>
    </main>
  )
}
