'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import Header from '../../components/Header'

export default function GettingStarted() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCommand(id)
      setTimeout(() => setCopiedCommand(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4 relative group">
      <button
        onClick={() => copyToClipboard(code, id)}
        className="absolute top-3 right-3 text-xs text-gray-500 hover:text-prpm-accent transition-colors opacity-0 group-hover:opacity-100"
      >
        {copiedCommand === id ? 'Copied!' : 'Copy'}
      </button>
      <code className="text-sm font-mono text-prpm-accent-light block overflow-x-auto">
        <span className="text-gray-600">$ </span>
        {code}
      </code>
    </div>
  )

  return (
    <div className="min-h-screen bg-prpm-dark">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Getting Started with PRPM
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Learn how to discover, test, and install AI prompts and rules in minutes
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-12">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <a href="#what-is-prpm" className="text-prpm-accent hover:text-prpm-accent-light transition-colors">
              1. What is PRPM?
            </a>
            <a href="#installation" className="text-prpm-accent hover:text-prpm-accent-light transition-colors">
              2. Installation
            </a>
            <a href="#discovering-packages" className="text-prpm-accent hover:text-prpm-accent-light transition-colors">
              3. Discovering Packages
            </a>
            <a href="#testing-playground" className="text-prpm-accent hover:text-prpm-accent-light transition-colors">
              4. Testing in Playground
            </a>
            <a href="#installing-packages" className="text-prpm-accent hover:text-prpm-accent-light transition-colors">
              5. Installing Packages
            </a>
          </div>
        </div>

        {/* Section 1: What is PRPM */}
        <section id="what-is-prpm" className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">What is PRPM?</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-4">
              PRPM (Prompt Package Manager) is like npm, but for AI prompts. It lets you discover, test, and install pre-built prompts, rules, and skills for AI coding assistants.
            </p>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 my-6">
              <h3 className="text-xl font-semibold text-white mb-4">The Problem PRPM Solves</h3>
              <div className="space-y-3 text-gray-400">
                <div className="flex gap-3">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Copy-pasting prompts from GitHub gists</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Maintaining separate configs for different AI tools</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>No way to test prompts before installing</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Manual updates when prompts improve</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-prpm-accent/10 to-prpm-green/10 border border-prpm-accent/30 rounded-xl p-6 my-6">
              <h3 className="text-xl font-semibold text-white mb-4">What You Get</h3>
              <div className="space-y-3 text-gray-300">
                <div className="flex gap-3">
                  <span className="text-prpm-accent mt-1">✓</span>
                  <span><strong>4,000+ packages</strong> - Battle-tested prompts and rules</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-prpm-accent mt-1">✓</span>
                  <span><strong>Test before install</strong> - Use the Playground with real AI models</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-prpm-accent mt-1">✓</span>
                  <span><strong>Universal format</strong> - Works with Cursor, Claude, Continue, Windsurf & more</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-prpm-accent mt-1">✓</span>
                  <span><strong>Easy updates</strong> - One command to update all packages</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Installation */}
        <section id="installation" className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Installation</h2>
          <p className="text-gray-300 mb-6">
            Install the PRPM CLI globally using npm:
          </p>
          <CodeBlock code="npm install -g prpm" id="install-cli" />
          <p className="text-gray-400 text-sm mt-4">
            Verify the installation:
          </p>
          <div className="mt-2">
            <CodeBlock code="prpm --version" id="verify-install" />
          </div>
        </section>

        {/* Section 3: Discovering Packages */}
        <section id="discovering-packages" className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Discovering Packages</h2>
          <p className="text-gray-300 mb-6">
            There are three ways to find packages:
          </p>

          <div className="space-y-6">
            {/* Web Registry */}
            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-prpm-accent/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-prpm-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">1. Browse the Web Registry</h3>
                  <p className="text-gray-400 mb-4">
                    <strong>Recommended for beginners.</strong> Browse all packages with full descriptions, README files, and the actual prompt contents.
                  </p>
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-prpm-accent hover:bg-prpm-accent/80 text-white rounded-lg transition-colors font-medium"
                  >
                    Browse Packages
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* CLI Search */}
            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-prpm-accent/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-prpm-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">2. Search from CLI</h3>
                  <p className="text-gray-400 mb-4">
                    Quick searches when you know what you're looking for.
                  </p>
                  <div className="space-y-2">
                    <CodeBlock code='prpm search typescript' id="search-typescript" />
                    <CodeBlock code='prpm search "test driven development"' id="search-tdd" />
                    <CodeBlock code='prpm trending' id="trending" />
                  </div>
                </div>
              </div>
            </div>

            {/* Collections */}
            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-prpm-accent/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-prpm-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">3. Browse Collections</h3>
                  <p className="text-gray-400 mb-4">
                    Curated bundles of packages for common workflows. Install multiple packages at once.
                  </p>
                  <div className="space-y-2 mb-4">
                    <CodeBlock code='prpm collections' id="collections-list" />
                    <CodeBlock code='prpm collections search frontend' id="collections-search" />
                  </div>
                  <Link
                    href="/search?tab=collections"
                    className="inline-flex items-center gap-2 text-prpm-accent hover:text-prpm-accent-light transition-colors"
                  >
                    View all collections →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Testing in Playground */}
        <section id="testing-playground" className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Testing Packages in the Playground</h2>

          <p className="text-gray-300 mb-6">
            The Playground lets you test any package with real AI models (Claude, GPT-4, etc.) before installing.
          </p>

          <div className="bg-gradient-to-br from-yellow-600/10 via-orange-600/10 to-yellow-600/10 border-2 border-yellow-500/30 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-white mb-3">How It Works</h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex gap-3">
                <span className="text-yellow-400">1.</span>
                <span>Enter your test input (e.g., "Review this code")</span>
              </div>
              <div className="flex gap-3">
                <span className="text-yellow-400">2.</span>
                <span>Choose an AI model (Claude Sonnet, GPT-4, etc.)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-yellow-400">3.</span>
                <span>See how the package's prompts guide the AI's response</span>
              </div>
              <div className="flex gap-3">
                <span className="text-yellow-400">4.</span>
                <span>Optionally use comparison mode to see with/without the package</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-3">Testing on the Web</h4>
              <p className="text-gray-300 mb-4">
                On any package page, click the <strong className="text-prpm-accent">"Test in Playground"</strong> button to try it instantly.
              </p>
              <Link
                href="/playground"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white rounded-lg transition-all font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Try the Playground
              </Link>
            </div>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-3">Testing from CLI</h4>
              <div className="space-y-2">
                <CodeBlock code='prpm playground @user/code-reviewer "Review this: console.log(x)"' id="playground-basic" />
                <p className="text-gray-400 text-sm my-2">Interactive mode for multi-turn conversations:</p>
                <CodeBlock code='prpm playground @user/brainstorm-assistant --interactive' id="playground-interactive" />
                <p className="text-gray-400 text-sm my-2">Comparison mode (with vs without package):</p>
                <CodeBlock code='prpm playground @user/typescript-helper "Explain generics" --compare' id="playground-compare" />
              </div>
            </div>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-3">Playground Credits</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 mb-1">Free Trial</div>
                  <div className="text-white font-semibold">5 credits</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">PRPM+</div>
                  <div className="text-white font-semibold">100 credits/month</div>
                  <div className="text-gray-500 text-xs">$6/month</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Credit Packs</div>
                  <div className="text-white font-semibold">100 credits</div>
                  <div className="text-gray-500 text-xs">$5 one-time</div>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-4">
                1 credit = 5,000 tokens. Most tests cost 1-3 credits.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Installing Packages */}
        <section id="installing-packages" className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Installing Packages</h2>

          <p className="text-gray-300 mb-6">
            Once you've reviewed and tested a package, installing is simple:
          </p>

          <div className="space-y-6">
            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-3">Auto-Detect Format</h4>
              <p className="text-gray-400 mb-4">
                Let PRPM detect your editor automatically:
              </p>
              <CodeBlock code='prpm install @username/typescript-rules' id="install-auto" />
              <p className="text-gray-400 text-sm mt-3">
                PRPM checks for <code className="text-prpm-accent">.cursor/</code>, <code className="text-prpm-accent">.claude/</code>, <code className="text-prpm-accent">.continue/</code>, etc. and installs to the right place.
              </p>
            </div>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-3">Specify Format</h4>
              <p className="text-gray-400 mb-4">
                Or explicitly choose your editor:
              </p>
              <div className="space-y-2">
                <CodeBlock code='prpm install @username/typescript-rules --as cursor' id="install-cursor" />
                <CodeBlock code='prpm install @username/typescript-rules --as claude' id="install-claude" />
                <CodeBlock code='prpm install @username/typescript-rules --as windsurf' id="install-windsurf" />
              </div>
            </div>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-3">Install Collections</h4>
              <p className="text-gray-400 mb-4">
                Install multiple packages at once with collections:
              </p>
              <CodeBlock code='prpm install collection/nextjs-pro' id="install-collection" />
              <p className="text-gray-400 text-sm mt-3">
                This installs 5+ packages: React best practices, TypeScript rules, Tailwind helpers, Next.js patterns, and component architecture.
              </p>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/search"
              className="group bg-prpm-dark-card border border-prpm-border rounded-xl p-6 hover:border-prpm-accent/50 transition-all"
            >
              <div className="w-10 h-10 mb-3 rounded-lg bg-prpm-accent/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-prpm-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-prpm-accent transition-colors">
                Browse Packages
              </h3>
              <p className="text-gray-400">
                Explore 4,000+ packages across all categories
              </p>
            </Link>

            <Link
              href="/playground"
              className="group bg-prpm-dark-card border border-prpm-border rounded-xl p-6 hover:border-prpm-accent/50 transition-all"
            >
              <div className="w-10 h-10 mb-3 rounded-lg bg-prpm-accent/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-prpm-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-prpm-accent transition-colors">
                Try the Playground
              </h3>
              <p className="text-gray-400">
                Test packages with real AI models before installing
              </p>
            </Link>

            <a
              href="https://docs.prpm.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-prpm-dark-card border border-prpm-border rounded-xl p-6 hover:border-prpm-accent/50 transition-all"
            >
              <div className="w-10 h-10 mb-3 rounded-lg bg-prpm-accent/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-prpm-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-prpm-accent transition-colors">
                Read the Docs
              </h3>
              <p className="text-gray-400">
                Complete documentation and advanced guides
              </p>
            </a>

            <Link
              href="/search?tab=collections"
              className="group bg-prpm-dark-card border border-prpm-border rounded-xl p-6 hover:border-prpm-accent/50 transition-all"
            >
              <div className="w-10 h-10 mb-3 rounded-lg bg-prpm-accent/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-prpm-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-prpm-accent transition-colors">
                View Collections
              </h3>
              <p className="text-gray-400">
                Curated package bundles for complete workflows
              </p>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-r from-prpm-accent/10 to-prpm-green/10 border border-prpm-accent/30 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to get started?
          </h2>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto">
            Install the CLI and discover your first packages in minutes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CodeBlock code='npm install -g prpm' id="final-install" />
          </div>
        </div>
      </main>
    </div>
  )
}
