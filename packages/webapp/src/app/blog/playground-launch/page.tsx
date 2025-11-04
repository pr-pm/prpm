import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Introducing PRPM Playground: Test AI Prompts Before You Install",
  description: "Test any PRPM package with real AI models directly in your browser or CLI. Compare results, share discoveries, and make informed decisions before installing.",
  openGraph: {
    title: "Introducing PRPM Playground: Test AI Prompts Before You Install",
    description: "Test any PRPM package with real AI models directly in your browser or CLI. Compare results, share discoveries, and make informed decisions.",
    images: ['/og-playground.png'],
  },
}

export default function PlaygroundLaunchPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Launch', 'Feature', 'Playground']}
          title="Introducing PRPM Playground: Test AI Prompts Before You Install"
          author="PRPM Team"
          date="November 4, 2025"
          readTime="8 min read"
        />

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 mb-8">
            <p className="text-xl text-gray-300 leading-relaxed italic mb-0">
              Today, we're launching PRPM Playground — the first interactive testing environment for AI prompts and packages. Test any package with real AI models, compare results against baselines, share your discoveries with the community, and make informed decisions before installing.
            </p>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">The Problem: You Can't Test Before You Buy</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Imagine finding an npm package with a great name and description, but no way to try it before installing. You'd download it, import it into your codebase, and only then discover it doesn't work for your use case. That's frustrating, right?
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            Until today, that's exactly how AI prompts and packages worked. You'd find a promising prompt on PRPM — maybe a code reviewer, a documentation writer, or a brainstorming assistant — but you had no way to test it before installing. You'd have to:
          </p>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-6 mb-6">
            <ol className="space-y-3 text-gray-300 list-decimal list-inside">
              <li>Install the package locally</li>
              <li>Set up your AI coding environment</li>
              <li>Create a test scenario</li>
              <li>Try it with your AI model</li>
              <li>Uninstall if it doesn't meet your needs</li>
            </ol>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            This wastes time, creates friction, and makes it harder to discover the perfect package for your workflow. <strong className="text-white">We believe you should be able to test drive prompts just like you test drive a car before buying.</strong>
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">The Solution: PRPM Playground</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            PRPM Playground solves this by letting you test any package with real AI models — directly in your browser or from the CLI. No installation required. No setup needed. Just instant, interactive testing.
          </p>

          <div className="bg-gradient-to-br from-prpm-accent/10 via-prpm-dark-card to-prpm-dark border border-prpm-accent/30 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">🎮 What You Can Do</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1 text-xl">•</span>
                <span><strong className="text-white">Test instantly:</strong> Click "Test in Playground" on any package and start testing immediately</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1 text-xl">•</span>
                <span><strong className="text-white">Choose your model:</strong> Claude Sonnet, Opus, GPT-4o, GPT-4o Mini — use the model you actually work with</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1 text-xl">•</span>
                <span><strong className="text-white">Compare results:</strong> Test the same input with and without the package prompt to see the difference</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1 text-xl">•</span>
                <span><strong className="text-white">Multi-turn conversations:</strong> Have back-and-forth discussions to really stress test the package</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1 text-xl">•</span>
                <span><strong className="text-white">Share discoveries:</strong> Share test results with your team or the community</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1 text-xl">•</span>
                <span><strong className="text-white">See community results:</strong> View how others tested the package before you</span>
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">How It Works</h2>

          <h3 className="text-2xl font-semibold text-white mt-8 mb-4">1. From the Web (Browser)</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Every package on PRPM now has a "Test in Playground" button. Click it, enter your input, and get instant results.
          </p>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-500 mb-3">Example: Testing a code review package</p>
            <div className="space-y-4">
              <div>
                <div className="text-blue-400 text-sm mb-2">📥 Your Input:</div>
                <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4 text-gray-300 font-mono text-sm">
                  Review this code: console.log('hello')
                </div>
              </div>
              <div>
                <div className="text-green-400 text-sm mb-2">🤖 Assistant Response:</div>
                <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4 text-gray-300">
                  <p className="mb-3">Code Review Analysis:</p>
                  <ul className="space-y-2 text-sm">
                    <li>✓ Syntax is correct</li>
                    <li>⚠️ Consider using a logger instead of console.log for production</li>
                    <li>💡 Add context to the log message (e.g., what event triggered this)</li>
                    <li>🔒 No security concerns detected</li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-prpm-border pt-4 flex items-center justify-between text-sm">
                <span className="text-gray-500">Model: Claude Sonnet 3.5</span>
                <span className="text-gray-500">Tokens: 234 | Credits: 1</span>
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-semibold text-white mt-8 mb-4">2. From the CLI (Command Line)</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Prefer the terminal? Test packages without ever leaving your command line:
          </p>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-6 mb-6 font-mono text-sm">
            <div className="mb-4">
              <div className="text-gray-500 mb-2"># Single test</div>
              <div className="text-prpm-accent-light">prpm playground @user/code-reviewer "Review this: console.log('hello')"</div>
            </div>
            <div className="mb-4">
              <div className="text-gray-500 mb-2"># Interactive conversation mode</div>
              <div className="text-prpm-accent-light">prpm playground @user/brainstorm-assistant --interactive</div>
            </div>
            <div className="mb-4">
              <div className="text-gray-500 mb-2"># Compare with and without the package</div>
              <div className="text-prpm-accent-light">prpm playground @user/optimizer "Optimize this function" --compare</div>
            </div>
            <div>
              <div className="text-gray-500 mb-2"># Use a different model</div>
              <div className="text-prpm-accent-light">prpm playground @user/complex-task "Analyze this" --model opus</div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Why This Matters for Package Consumers</h2>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-8 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">🎯 Make Better Decisions</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Before Playground, you had to rely on package descriptions and download counts. Now you can actually test the package with your own use cases and see real results. No more installing a dozen packages to find the right one.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">🔬 Compare Scientifically</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              The <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded">--compare</code> mode lets you test the same input twice: once with the package prompt, once without. This shows you exactly what value the package adds. Does it actually make the AI better, or is it just prompt fluff?
            </p>

            <h3 className="text-xl font-bold text-white mb-4">🤝 Learn from the Community</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Every package detail page now shows recent community test results. See how others are using the package, what inputs they tried, and whether they found it helpful. It's like reading reviews, but with actual proof of performance.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">💰 Try Before You Subscribe</h3>
            <p className="text-gray-300 leading-relaxed">
              Start with 5 free trial credits. Test a few packages, find your favorites, then subscribe to PRPM+ for unlimited testing ($6/month for 100 monthly credits). No commitment required until you're sure this is valuable.
            </p>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Why This Matters for Package Authors</h2>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-8 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">📈 More Downloads</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              When users can test your package instantly, they're more likely to trust it and install it. Playground removes the biggest barrier to adoption: uncertainty. <strong className="text-white">Show, don't tell.</strong>
            </p>

            <h3 className="text-xl font-bold text-white mb-4">🎓 Better Documentation</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Shared test results become living documentation. Instead of writing examples in your README, users see real examples from actual testing. The best use cases naturally surface through community testing.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">📊 Real Usage Data</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              See how users are actually testing your package. What inputs are they trying? What models do they prefer? This data helps you improve your package to match real-world usage patterns.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">🏆 Social Proof</h3>
            <p className="text-gray-300 leading-relaxed">
              When users share helpful test results, it creates social proof for your package. High helpfulness ratings and view counts signal quality to potential users. The best packages naturally rise to the top.
            </p>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Model Support & Pricing</h2>

          <p className="text-gray-300 leading-relaxed mb-6">
            Playground supports all major AI models so you can test with the model you actually use:
          </p>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-prpm-dark-card border-b border-prpm-border">
                <tr>
                  <th className="text-left p-4 text-white">Model</th>
                  <th className="text-left p-4 text-white">Best For</th>
                  <th className="text-left p-4 text-white">Credit Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-prpm-border">
                <tr>
                  <td className="p-4 text-gray-300 font-mono">Claude Sonnet 3.5</td>
                  <td className="p-4 text-gray-300">Balanced performance (default)</td>
                  <td className="p-4 text-prpm-accent">1x credits</td>
                </tr>
                <tr>
                  <td className="p-4 text-gray-300 font-mono">GPT-4o Mini</td>
                  <td className="p-4 text-gray-300">Fast, simple tasks</td>
                  <td className="p-4 text-green-400">0.5x credits</td>
                </tr>
                <tr>
                  <td className="p-4 text-gray-300 font-mono">GPT-4o</td>
                  <td className="p-4 text-gray-300">Advanced reasoning</td>
                  <td className="p-4 text-yellow-400">2x credits</td>
                </tr>
                <tr>
                  <td className="p-4 text-gray-300 font-mono">Claude Opus</td>
                  <td className="p-4 text-gray-300">Most capable, complex tasks</td>
                  <td className="p-4 text-red-400">5x credits</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-gradient-to-r from-prpm-accent/10 to-prpm-dark border border-prpm-accent/30 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">💳 Credit System</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">•</span>
                <span><strong className="text-white">Free tier:</strong> 5 trial credits to get started</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">•</span>
                <span><strong className="text-white">PRPM+ subscription:</strong> 100 monthly credits for $6/month (org members: $3/month)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">•</span>
                <span><strong className="text-white">Credit packs:</strong> Buy additional credits that never expire ($5 for 100)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">•</span>
                <span><strong className="text-white">Token-based pricing:</strong> 1 credit = 5,000 tokens (prevents abuse)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">•</span>
                <span><strong className="text-white">Rollover credits:</strong> Unused monthly credits roll over (max 200, 1-month expiry)</span>
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Technical Deep Dive</h2>

          <p className="text-gray-300 leading-relaxed mb-6">
            For the technically curious, here's how Playground works under the hood:
          </p>

          <h3 className="text-2xl font-semibold text-white mt-8 mb-4">Architecture</h3>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-6 mb-6">
            <ol className="space-y-4 text-gray-300 list-decimal list-inside">
              <li>
                <strong className="text-white">Package Loading:</strong> When you click "Test in Playground", we fetch the package prompt from our registry or S3 storage
              </li>
              <li>
                <strong className="text-white">Model Integration:</strong> We send your input + the package prompt to the selected AI model via official APIs (Anthropic or OpenAI)
              </li>
              <li>
                <strong className="text-white">Token Counting:</strong> We calculate exact token usage using the same tokenizers as the model providers
              </li>
              <li>
                <strong className="text-white">Credit Deduction:</strong> Credits are deducted based on actual tokens used (1 credit = 5,000 tokens) with model multipliers
              </li>
              <li>
                <strong className="text-white">Session Persistence:</strong> Multi-turn conversations are stored server-side with session IDs for continuity
              </li>
              <li>
                <strong className="text-white">Result Sharing:</strong> When you share a result, we generate a unique token and make the session publicly viewable
              </li>
            </ol>
          </div>

          <h3 className="text-2xl font-semibold text-white mt-8 mb-4">Privacy & Security</h3>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-6">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong className="text-white">No prompt storage:</strong> Package prompts are loaded on-demand and never stored with your inputs</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong className="text-white">Private by default:</strong> All test sessions are private unless you explicitly share them</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong className="text-white">IP hashing:</strong> View tracking uses SHA-256 hashed IPs for privacy</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong className="text-white">Official APIs:</strong> We use official Anthropic and OpenAI APIs with enterprise-grade security</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong className="text-white">Cost monitoring:</strong> Real-time cost tracking prevents abuse and ensures sustainability</span>
              </li>
            </ul>
          </div>

          <h3 className="text-2xl font-semibold text-white mt-8 mb-4">Performance Optimizations</h3>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-6 mb-6">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">⚡</span>
                <span><strong className="text-white">Materialized views:</strong> Top shared results are pre-computed and refreshed hourly for instant loading</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">⚡</span>
                <span><strong className="text-white">Session caching:</strong> Multi-turn conversations reuse session data to avoid re-sending context</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">⚡</span>
                <span><strong className="text-white">Efficient polling:</strong> CLI commands poll APIs every 2 seconds with exponential backoff</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1">⚡</span>
                <span><strong className="text-white">Token limits:</strong> 20,000 token limit per request prevents runaway costs</span>
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Real-World Use Cases</h2>

          <div className="space-y-8 mb-8">
            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-3">🔍 Evaluating Code Review Packages</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                You're looking for a code review package. You find three options: <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded">@user/basic-reviewer</code>, <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded">@expert/security-first</code>, and <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded">@team/comprehensive-review</code>.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Instead of guessing, you test all three with the same code snippet. The comprehensive reviewer catches subtle bugs the others miss. You see community results confirming it works well for React code. Decision made in 5 minutes instead of hours of trial and error.
              </p>
            </div>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-3">💡 Testing Documentation Generators</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                You need to generate API documentation. You test <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded">@docs/api-generator</code> with your actual API code. The output is good, but you wonder if the package actually helps or if the model would do this anyway.
              </p>
              <p className="text-gray-300 leading-relaxed">
                You run the same test with <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded">--compare</code> mode. The baseline model produces generic docs. The package version includes proper OpenAPI specs, example requests, and error handling docs. Clear winner.
              </p>
            </div>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-3">🎨 Finding the Right Brainstorming Assistant</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                You want a brainstorming assistant for product features. You start an interactive session with <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded">@creative/feature-brainstorm</code> using <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded">prpm playground @creative/feature-brainstorm --interactive</code>.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Over 10 turns, you describe your product and get increasingly refined feature ideas. The package keeps track of context perfectly. You share the best result with your team. They're impressed and install it immediately.
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">What's Next</h2>

          <p className="text-gray-300 leading-relaxed mb-6">
            Playground is just the beginning. Here's what we're working on:
          </p>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-6 mb-8">
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1 text-xl">🔮</span>
                <div>
                  <strong className="text-white">A/B Testing:</strong> Compare multiple packages side-by-side with the same input
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1 text-xl">📊</span>
                <div>
                  <strong className="text-white">Analytics Dashboard:</strong> Package authors get detailed analytics on how users test their packages
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1 text-xl">🤖</span>
                <div>
                  <strong className="text-white">More Models:</strong> Gemini, Llama, and other models coming soon
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1 text-xl">🎯</span>
                <div>
                  <strong className="text-white">Test Collections:</strong> Test entire collections of packages in one flow
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent mt-1 text-xl">🔗</span>
                <div>
                  <strong className="text-white">Shareable Test Suites:</strong> Create and share comprehensive test suites for package validation
                </div>
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Get Started Today</h2>

          <p className="text-gray-300 leading-relaxed mb-6">
            Ready to start testing? Here's how:
          </p>

          <div className="bg-gradient-to-br from-prpm-accent/20 via-prpm-dark-card to-prpm-dark border border-prpm-accent/50 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Quick Start Guide</h3>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold">1</div>
                  <h4 className="text-lg font-semibold text-white">Browse Packages</h4>
                </div>
                <p className="text-gray-300 ml-11">
                  Visit <Link href="/search" className="text-prpm-accent hover:underline">prpm.dev/search</Link> and find a package you want to test
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold">2</div>
                  <h4 className="text-lg font-semibold text-white">Click Test in Playground</h4>
                </div>
                <p className="text-gray-300 ml-11">
                  Every package has a prominent "Test in Playground" button — click it
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold">3</div>
                  <h4 className="text-lg font-semibold text-white">Enter Your Test Input</h4>
                </div>
                <p className="text-gray-300 ml-11">
                  Type the input you'd actually use with this package in your real workflow
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold">4</div>
                  <h4 className="text-lg font-semibold text-white">Get Instant Results</h4>
                </div>
                <p className="text-gray-300 ml-11">
                  See the AI's response in seconds, complete with token usage and credit costs
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold">5</div>
                  <h4 className="text-lg font-semibold text-white">Share or Install</h4>
                </div>
                <p className="text-gray-300 ml-11">
                  Love the results? Install the package. Want to share? Click the share button and send the link to your team.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-6 mb-8 font-mono text-sm">
            <div className="text-gray-500 mb-3"># Or from the CLI:</div>
            <div className="space-y-2">
              <div className="text-prpm-accent-light">npm install -g prpm</div>
              <div className="text-prpm-accent-light">prpm login</div>
              <div className="text-prpm-accent-light">prpm playground @user/package "your test input"</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-prpm-accent/10 to-prpm-dark border border-prpm-accent/30 rounded-xl p-8 mb-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Start Testing Now</h3>
            <p className="text-gray-300 mb-6">5 free credits • No credit card required • Test in seconds</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/playground"
                className="px-8 py-3 bg-prpm-accent hover:bg-prpm-accent/80 text-white font-semibold rounded-lg transition-colors"
              >
                Open Playground
              </Link>
              <Link
                href="/search"
                className="px-8 py-3 bg-prpm-dark-card hover:bg-prpm-dark border border-prpm-border hover:border-prpm-accent text-gray-300 font-semibold rounded-lg transition-colors"
              >
                Browse Packages
              </Link>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Join the Conversation</h2>

          <p className="text-gray-300 leading-relaxed mb-6">
            We'd love to hear your feedback on Playground:
          </p>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent">•</span>
                <span>What packages are you testing? Share your discoveries!</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent">•</span>
                <span>Found a package that doesn't work as expected? Share the test result to help others</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent">•</span>
                <span>Package authors: How has Playground impacted your download numbers?</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-prpm-accent">•</span>
                <span>What features would make Playground even more useful?</span>
              </li>
            </ul>
          </div>

          <div className="bg-prpm-dark border border-prpm-border rounded-xl p-6 mb-8">
            <p className="text-gray-300 mb-4">
              Share your thoughts:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li>🐦 Twitter: <a href="https://twitter.com/prpm_dev" className="text-prpm-accent hover:underline">@prpm_dev</a></li>
              <li>💬 Discord: <a href="https://discord.gg/prpm" className="text-prpm-accent hover:underline">Join our community</a></li>
              <li>📧 Email: <a href="mailto:hello@prpm.dev" className="text-prpm-accent hover:underline">hello@prpm.dev</a></li>
            </ul>
          </div>

          <hr className="border-prpm-border my-12" />

          <p className="text-gray-400 text-sm italic">
            PRPM Playground is available now for all users. Web interface at <Link href="/playground" className="text-prpm-accent hover:underline">prpm.dev/playground</Link>, CLI via <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded">npm install -g prpm</code>. Start testing today!
          </p>
        </div>
      </article>

      <BlogFooter />
    </main>
  )
}
