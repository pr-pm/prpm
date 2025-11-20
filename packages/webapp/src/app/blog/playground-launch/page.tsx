import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "PRPM Playground: Test Packages with Real AI Models Before Installing",
  description: "Test any PRPM package with Claude or GPT-4 directly in your browser or CLI. Compare results, share discoveries, and make informed decisions before installing.",
  openGraph: {
    title: "PRPM Playground: Test Packages with Real AI Models Before Installing",
    description: "Test any PRPM package with Claude or GPT-4 directly in your browser or CLI. Compare results and make informed decisions.",
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
          tags={['Launch', 'Feature']}
          title="PRPM Playground: Test Packages with Real AI Models Before Installing"
          author="PRPM Team"
          date="November 4, 2025"
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
        ">
          <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 mb-8">
            <p className="text-xl text-gray-300 leading-relaxed italic mb-0">
              Today, we're launching PRPM Playground—test any package with real AI models directly in your browser or CLI. Compare results against baselines, share discoveries with the community, and make informed decisions before installing.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Problem: No Way to Test Before Installing</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Imagine finding an claude agent package with great content but no way to try it before installing. You'd download it, import it into your codebase, and only then discover it doesn't solve your problem. That's exactly how AI prompt packages worked until today.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            You'd find a promising package on PRPM—maybe a code reviewer, documentation generator, or migration assistant—but had no way to test it without:
          </p>

          <div className="not-prose mb-16">
            <ol className="list-decimal list-inside text-gray-300 space-y-3 mb-8">
              <li>Installing the package locally</li>
              <li>Setting up your AI coding environment</li>
              <li>Creating a test scenario</li>
              <li>Trying it with your AI model</li>
              <li>Uninstalling if it doesn't work</li>
            </ol>

            <p className="text-gray-300 leading-relaxed mb-0">
              This friction makes discovery harder and wastes time. PRPM Playground removes it entirely.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Solution: Test with Real AI Models</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            PRPM Playground lets you test any package with Claude Sonnet, Claude Opus, GPT-4o, or GPT-4o Mini—directly in your browser or from the CLI. No installation required. No setup needed. Just instant, interactive testing with the models you actually use.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">What You Can Do</h3>

            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
              <li><strong className="text-white">Test instantly:</strong> Click "Test in Playground" on any package page</li>
              <li><strong className="text-white">Choose your model:</strong> Claude Sonnet, Opus, GPT-4o, GPT-4o Mini—use what you work with</li>
              <li><strong className="text-white">Compare results:</strong> Test with and without the package to see actual impact</li>
              <li><strong className="text-white">Multi-turn conversations:</strong> Have back-and-forth discussions to stress test packages</li>
              <li><strong className="text-white">Share discoveries:</strong> Share test results with your team or the community</li>
              <li><strong className="text-white">See community results:</strong> View how others tested the package</li>
            </ul>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">How It Works</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">From the Web Browser</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Every package on PRPM now has a "Test in Playground" button. Click it, enter your input, and get instant results from your chosen AI model.
            </p>

            <div className="bg-prpm-dark border border-prpm-border rounded-xl p-6 mb-8">
              <p className="text-sm text-gray-500 mb-4">Example: Testing a code review package</p>
              <div className="space-y-4">
                <div>
                  <div className="text-blue-400 text-sm font-medium mb-2">Your Input:</div>
                  <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4 text-gray-300 font-mono text-sm">
                    Review this code: console.log('hello')
                  </div>
                </div>
                <div>
                  <div className="text-green-400 text-sm font-medium mb-2">Assistant Response:</div>
                  <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4 text-gray-300">
                    <p className="mb-3 font-semibold">Code Review Analysis:</p>
                    <ul className="space-y-2 text-sm list-disc ml-6">
                      <li>Syntax is correct</li>
                      <li>Consider using a logger instead of console.log for production</li>
                      <li>Add context to the log message (e.g., what event triggered this)</li>
                      <li>No security concerns detected</li>
                    </ul>
                  </div>
                </div>
                <div className="border-t border-prpm-border pt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-500">Model: Claude Sonnet 3.5</span>
                  <span className="text-gray-500">Tokens: 234 | Credits: 1</span>
                </div>
              </div>
            </div>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">From the CLI</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Prefer the terminal? Test packages without leaving your command line:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Single test
prpm playground @user/code-reviewer "Review this: console.log('hello')"

# Interactive conversation mode
prpm playground @user/brainstorm-assistant --interactive

# Compare with and without the package
prpm playground @user/optimizer "Optimize this function" --compare

# Use a different model
prpm playground @user/complex-task "Analyze this" --model opus`}</code>
            </pre>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Why This Matters</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Make Better Decisions</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Before Playground, you relied on package descriptions and download counts. Now you can test with your own use cases and see real results. No more installing a dozen packages to find the right one.
            </p>

            <h3 className="text-2xl font-bold text-white mb-6">Compare Scientifically</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              The <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">--compare</code> mode lets you test the same input twice: once with the package prompt, once without. This shows you exactly what value the package adds. Does it actually improve the AI's output, or is it just prompt fluff?
            </p>

            <h3 className="text-2xl font-bold text-white mb-6">Learn from the Community</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Every package detail page shows recent community test results. See how others are using the package, what inputs they tried, and whether they found it helpful. It's like reading reviews with actual proof of performance.
            </p>

            <h3 className="text-2xl font-bold text-white mb-6">Try Before You Subscribe</h3>
            <p className="text-gray-300 leading-relaxed mb-0">
              Start with 5 free trial credits. Test a few packages, find your favorites, then subscribe to PRPM+ for 100 monthly credits. No commitment until you're sure this is valuable.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">For Package Authors</h2>
          </div>

          <div className="not-prose mb-16">
            <p className="text-gray-300 leading-relaxed mb-8">
              Playground benefits package authors just as much as users.
            </p>

            <h3 className="text-2xl font-bold text-white mb-6">More Downloads</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              When users can test your package instantly, they're more likely to trust it and install it. Playground removes the biggest barrier to adoption: uncertainty. Show, don't tell.
            </p>

            <h3 className="text-2xl font-bold text-white mb-6">Better Documentation</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Shared test results become living documentation. Instead of writing examples in your README, users see real examples from actual testing. The best use cases naturally surface through community testing.
            </p>

            <h3 className="text-2xl font-bold text-white mb-6">Real Usage Analytics</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Package authors get a comprehensive analytics dashboard showing exactly how users test their packages. See test volumes, popular models, credit usage patterns, session durations, and more. This real-world data helps you optimize your package for actual usage patterns.
            </p>

            <h3 className="text-2xl font-bold text-white mb-6">Social Proof & Recognition</h3>
            <p className="text-gray-300 leading-relaxed mb-0">
              When users share helpful test results, it creates social proof for your package. High helpfulness ratings and view counts signal quality to potential users. PRPM+ subscribers also get a special badge on their profile and packages, showing their commitment to the ecosystem.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Model Support & Pricing</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Playground supports all major AI models so you can test with the model you actually use:
          </p>

          <div className="not-prose mb-8">
            <table className="w-full border-collapse text-gray-300">
              <thead className="border-b-2 border-prpm-border">
                <tr>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Model</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Best For</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Credit Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-mono text-sm">Claude Sonnet 3.5</td>
                  <td className="px-4 py-4 border border-prpm-border">Balanced performance (default)</td>
                  <td className="px-4 py-4 border border-prpm-border text-prpm-accent font-semibold">1x credits</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-mono text-sm">GPT-4o Mini</td>
                  <td className="px-4 py-4 border border-prpm-border">Fast, simple tasks</td>
                  <td className="px-4 py-4 border border-prpm-border text-green-400 font-semibold">0.5x credits</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-mono text-sm">GPT-4o</td>
                  <td className="px-4 py-4 border border-prpm-border">Advanced reasoning</td>
                  <td className="px-4 py-4 border border-prpm-border text-yellow-400 font-semibold">2x credits</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-mono text-sm">Claude Opus</td>
                  <td className="px-4 py-4 border border-prpm-border">Most capable, complex tasks</td>
                  <td className="px-4 py-4 border border-prpm-border text-red-400 font-semibold">5x credits</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Credit System</h3>
            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-0">
              <li><strong className="text-white">Free tier:</strong> 5 trial credits to get started</li>
              <li><strong className="text-white">PRPM+ subscription:</strong> 100 monthly credits for $6/month (org members: $3/month)</li>
              <li><strong className="text-white">Credit packs:</strong> Buy additional credits that never expire ($5 for 100)</li>
              <li><strong className="text-white">Token-based pricing:</strong> 1 credit = 5,000 tokens (prevents abuse)</li>
              <li><strong className="text-white">Rollover credits:</strong> Unused monthly credits roll over (max 200, 1-month expiry)</li>
            </ul>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Real-World Use Cases</h2>
          </div>

          <div className="not-prose space-y-8 mb-16">
            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Evaluating Code Review Packages</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                You're looking for a code review package. You find three options: <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded text-sm">@user/basic-reviewer</code>, <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded text-sm">@expert/security-first</code>, and <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded text-sm">@team/comprehensive-review</code>.
              </p>
              <p className="text-gray-300 leading-relaxed mb-0">
                Instead of guessing, you test all three with the same code snippet. The comprehensive reviewer catches subtle bugs the others miss. You see community results confirming it works well for React code. Decision made in 5 minutes instead of hours of trial and error.
              </p>
            </div>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Testing Documentation Generators</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                You need to generate API documentation. You test <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded text-sm">@docs/api-generator</code> with your actual API code. The output is good, but you wonder if the package actually helps or if the model would do this anyway.
              </p>
              <p className="text-gray-300 leading-relaxed mb-0">
                You run the same test with <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded text-sm">--compare</code> mode. The baseline model produces generic docs. The package version includes proper OpenAPI specs, example requests, and error handling docs. Clear winner.
              </p>
            </div>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Finding the Right Brainstorming Assistant</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                You want a brainstorming assistant for product features. You start an interactive session with <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded text-sm">@creative/feature-brainstorm</code> using <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded text-sm">prpm playground @creative/feature-brainstorm --interactive</code>.
              </p>
              <p className="text-gray-300 leading-relaxed mb-0">
                Over 10 turns, you describe your product and get increasingly refined feature ideas. The package keeps track of context perfectly. You share the best result with your team. They're impressed and install it immediately.
              </p>
            </div>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">What's Next</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Playground is just the beginning. Here's what we're working on:
          </p>

          <div className="not-prose mb-16">
            <ul className="list-disc ml-6 text-gray-300 space-y-4 mb-0">
              <li>
                <strong className="text-white">Enhanced A/B Testing:</strong> Compare multiple packages side-by-side with the same input in a unified interface
              </li>
              <li>
                <strong className="text-white">More Models:</strong> Gemini, Llama, and other leading AI models coming soon
              </li>
              <li>
                <strong className="text-white">Test Collections:</strong> Test entire collections of packages in one flow
              </li>
              <li>
                <strong className="text-white">Shareable Test Suites:</strong> Create and share comprehensive test suites for package validation
              </li>
              <li>
                <strong className="text-white">Advanced Analytics:</strong> Deeper insights into package performance, user satisfaction metrics, and optimization recommendations
              </li>
            </ul>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Get Started</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Ready to start testing? Here's how:
          </p>

          <div className="not-prose bg-gradient-to-br from-prpm-accent/20 via-prpm-dark-card to-prpm-dark border border-prpm-accent/50 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Quick Start Guide</h3>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">1</div>
                  <h4 className="text-lg font-semibold text-white">Browse Packages</h4>
                </div>
                <p className="text-gray-300 ml-11 mb-0">
                  Visit <Link href="/search" className="text-prpm-accent hover:underline font-medium">prpm.dev/search</Link> and find a package you want to test
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">2</div>
                  <h4 className="text-lg font-semibold text-white">Click Test in Playground</h4>
                </div>
                <p className="text-gray-300 ml-11 mb-0">
                  Every package has a "Test in Playground" button—click it
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">3</div>
                  <h4 className="text-lg font-semibold text-white">Enter Your Test Input</h4>
                </div>
                <p className="text-gray-300 ml-11 mb-0">
                  Type the input you'd actually use with this package in your real workflow
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">4</div>
                  <h4 className="text-lg font-semibold text-white">Get Instant Results</h4>
                </div>
                <p className="text-gray-300 ml-11 mb-0">
                  See the AI's response in seconds, complete with token usage and credit costs
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">5</div>
                  <h4 className="text-lg font-semibold text-white">Share or Install</h4>
                </div>
                <p className="text-gray-300 ml-11 mb-0">
                  Love the results? Install the package. Want to share? Click the share button and send the link to your team.
                </p>
              </div>
            </div>
          </div>

          <div className="not-prose mb-8">
            <p className="text-gray-300 mb-4">Or from the CLI:</p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto">
              <code className="text-sm text-gray-300 font-mono">{`npm install -g prpm
prpm login
prpm playground @user/package "your test input"`}</code>
            </pre>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-accent/10 to-prpm-dark border border-prpm-accent/30 rounded-xl p-8 mb-8 text-center">
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

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-4">Questions?</h2>

            <p className="text-gray-300 leading-relaxed text-lg mb-4">
              We'd love to hear your feedback on Playground. Share your discoveries, report issues, or suggest features:
            </p>

            <ul className="list-disc ml-6 text-gray-300 space-y-2 mb-0">
              <li>Twitter: <a href="https://twitter.com/prpmdev" className="text-prpm-accent hover:underline font-medium">@prpmdev</a></li>
              <li>Email: <a href="mailto:hello@prpm.dev" className="text-prpm-accent hover:underline font-medium">hello@prpm.dev</a></li>
            </ul>
          </div>

          <p className="text-gray-400 text-sm italic">
            PRPM Playground is available now for all users. Web interface at <Link href="/playground" className="text-prpm-accent hover:underline">prpm.dev/playground</Link>, CLI via <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded">npm install -g prpm</code>. Start testing today.
          </p>
        </div>
      </article>

      <BlogFooter postTitle="PRPM Playground: Test Packages with Real AI Models Before Installing" postUrl="/blog/playground-launch" />
    </main>
  )
}
