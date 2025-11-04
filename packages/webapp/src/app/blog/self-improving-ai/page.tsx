import Link from 'next/link'
import type { Metadata } from 'next'
import Image from 'next/image'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Self-Improving AI: How PRPM Teaches AI Assistants to Get Better at Their Job - PRPM",
  description: "Watch AI assistants automatically discover and install expertise packages from PRPM when they need specialized knowledge. A new paradigm for distributable intelligence.",
  openGraph: {
    title: "Self-Improving AI: How PRPM Teaches AI Assistants to Get Better at Their Job",
    description: "AI that knows when it needs help and installs the expertise it needs. See how PRPM's self-improving skill works.",
  },
}

export default function SelfImprovingAIPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Technical', 'Innovation', 'AI Development', 'Self-Improvement']}
          title="Self-Improving AI: How PRPM Teaches AI Assistants to Get Better at Their Job"
          subtitle="AI that recognizes its knowledge gaps and installs the expertise it needs, automatically"
          author="PRPM Team"
          date="November 5, 2025"
          readTime="12 min read"
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
          prose-table:border-collapse prose-table:w-full prose-table:my-8 prose-table:text-gray-300
          prose-thead:border-b-2 prose-thead:border-prpm-border
          prose-th:text-left prose-th:text-white prose-th:bg-prpm-dark-card prose-th:px-4 prose-th:py-3 prose-th:font-semibold prose-th:border prose-th:border-prpm-border
          prose-td:px-4 prose-td:py-3 prose-td:border prose-td:border-prpm-border
          prose-hr:border-prpm-border prose-hr:my-12
        ">

          <blockquote className="border-l-4 border-prpm-accent pl-6 italic text-gray-400 my-8 text-lg">
            Imagine an AI assistant that knows when it's out of its depth. One that recognizes "I'm working on Pulumi infrastructure—let me check if there's an expert package for this" and installs it automatically. That's not science fiction. It's shipping today.
          </blockquote>

          <p>
            You ask Claude to help with AWS infrastructure using Pulumi. Before it starts, it pauses and says: "I found an official Pulumi package that can help me do this better. Should I install it?"
          </p>

          <p>
            You say yes. Claude installs the package, loads patterns from developers who have built production Pulumi stacks, and immediately applies that knowledge to your task.
          </p>

          <p>
            This is the self-improving skill. It's one of PRPM's most innovative features—and a glimpse into how AI assistants will work in the future.
          </p>

          <h2 className="text-3xl font-bold text-white mt-16 mb-6">Watch It In Action</h2>

          <p>
            Here's what it looks like when Claude recognizes it needs specialized knowledge:
          </p>

          <div className="not-prose my-8 rounded-xl border border-prpm-border overflow-hidden bg-prpm-dark-card">
            <Image
              src="/demos/self-improve/demo.gif"
              alt="Self-improving AI in action: Claude detects a task, searches PRPM, and installs expertise"
              width={1200}
              height={675}
              className="w-full"
              unoptimized
            />
          </div>

          <p className="text-sm text-gray-400 -mt-4 mb-8 text-center">
            <a
              href="https://youtu.be/12ColynhYls"
              target="_blank"
              rel="noopener noreferrer"
              className="text-prpm-accent hover:underline"
            >
              Watch the full video on YouTube →
            </a>
          </p>

          <p>
            Notice what just happened: Claude didn't need explicit instructions. It saw keywords like "Pulumi" and "infrastructure," searched the PRPM registry, found relevant packages, and offered to install them. The entire flow took seconds.
          </p>

          <h2 className="text-3xl font-bold text-white mt-16 mb-6">The Problem: AI Assistants Don't Know What They Don't Know</h2>

          <p>
            Current AI coding assistants are impressive generalists. They can write React components, debug Python, and help with SQL queries. But they're also limited by their training data and base knowledge.
          </p>

          <p>
            When you ask Claude to help with a specialized task—say, setting up GitHub Actions workflows or optimizing Kubernetes manifests—it gives you generic advice based on general patterns. It doesn't know about your team's conventions, the latest best practices from the community, or the hard-won lessons from developers who've solved these exact problems.
          </p>

          <p>
            The knowledge exists. It's scattered across GitHub repos, blog posts, and internal docs. But there's no mechanism for the AI to discover and apply it when needed.
          </p>

          <div className="not-prose bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 my-12">
            <h3 className="text-2xl font-bold text-white mb-4">The Gap</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Think about human developers. When we encounter an unfamiliar task, we search for libraries, read documentation, and ask experts. We augment our knowledge actively.
            </p>
            <p className="text-gray-300 leading-relaxed mb-0">
              AI assistants have been stuck with their base knowledge. They can't actively seek out expertise. Until now.
            </p>
          </div>

          <h2 className="text-3xl font-bold text-white mt-16 mb-6">The Solution: Self-Improvement Through Package Discovery</h2>

          <p>
            PRPM's self-improving skill teaches AI assistants to recognize knowledge gaps and fill them automatically. It's a meta-skill: a skill that helps the AI acquire other skills.
          </p>

          <h3 className="text-2xl font-bold text-white mt-10 mb-4">How It Works</h3>

          <p>The self-improving skill follows a simple workflow:</p>

          <ol className="space-y-4 my-6 text-gray-300">
            <li>
              <strong className="text-white">Task Analysis:</strong> Claude analyzes your request for domain-specific keywords (aws, pulumi, terraform, react, playwright, etc.)
            </li>
            <li>
              <strong className="text-white">Automatic Search:</strong> It searches the PRPM registry for relevant expertise packages
            </li>
            <li>
              <strong className="text-white">Quality Filtering:</strong> It evaluates packages based on download counts, official status, and relevance
            </li>
            <li>
              <strong className="text-white">User Permission:</strong> It presents the top packages and asks for your approval
            </li>
            <li>
              <strong className="text-white">Installation & Application:</strong> Once approved, it installs the package and immediately applies that knowledge to your task
            </li>
          </ol>

          <p>
            The entire process is transparent. You see what Claude is thinking, what it found, and why it's suggesting specific packages.
          </p>

          <h3 className="text-2xl font-bold text-white mt-10 mb-4">Real-World Example</h3>

          <p>Let's walk through a concrete scenario:</p>

          <div className="not-prose bg-prpm-dark border border-prpm-border rounded-xl p-6 my-8">
            <p className="text-gray-300 mb-4">
              <strong className="text-white">You:</strong> "Help me build Pulumi + AWS Beanstalk infrastructure"
            </p>

            <div className="border-l-2 border-prpm-accent/30 pl-4 my-4 text-gray-400 text-sm space-y-2">
              <p className="mb-2 text-prpm-accent font-semibold">Claude's Internal Process:</p>
              <p>Keywords detected: Pulumi, Beanstalk, infrastructure</p>
              <p>Searching: <code className="text-prpm-accent-light bg-prpm-dark-card/50 px-2 py-1 rounded text-xs">prpm search "pulumi beanstalk infrastructure"</code></p>
              <p>Found: @prpm/pulumi-infrastructure (Official, 3.2K downloads)</p>
              <p>Confidence: High → Auto-suggest</p>
            </div>

            <p className="text-gray-300 mb-4">
              <strong className="text-white">Claude:</strong> "I found an official PRPM package that can help:
            </p>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4 my-4">
              <p className="text-prpm-accent font-semibold mb-2">📦 @prpm/pulumi-infrastructure</p>
              <p className="text-gray-400 text-sm mb-2">Official • 3.2K downloads</p>
              <ul className="text-gray-300 text-sm space-y-1 list-disc ml-5">
                <li>Pulumi TypeScript best practices</li>
                <li>AWS resource patterns</li>
                <li>Cost optimization guidelines</li>
              </ul>
            </div>

            <p className="text-gray-300 mb-4">Should I install this to enhance my Pulumi knowledge?"</p>

            <p className="text-gray-300 mb-4">
              <strong className="text-white">You:</strong> "Yes"
            </p>

            <div className="border-l-2 border-prpm-green/30 pl-4 my-4 text-gray-400 text-sm space-y-2">
              <p className="text-prpm-green">✓ Installing: prpm install @prpm/pulumi-infrastructure --as claude</p>
              <p className="text-prpm-green">✓ Loading knowledge from package</p>
              <p className="text-prpm-green">✓ Applying patterns to current task</p>
            </div>

            <p className="text-gray-300">
              <strong className="text-white">Claude:</strong> "Package installed! Now let's build your Beanstalk infrastructure with these patterns..."
            </p>
          </div>

          <p>
            Notice what changed: Claude went from general Pulumi knowledge to specific, battle-tested patterns from the PRPM community. It's now working with the same expertise that helped PRPM save 74% on infrastructure costs.
          </p>

          <h2 className="text-3xl font-bold text-white mt-16 mb-6">The Technical Approach</h2>

          <p>
            The self-improving skill is implemented as a Claude skill with intelligent triggering logic. Here's what makes it work:
          </p>

          <h3 className="text-2xl font-bold text-white mt-10 mb-4">Keyword Detection</h3>

          <p>The skill activates when Claude detects domain-specific keywords in your request:</p>

          <table className="w-full border-collapse my-8">
            <thead>
              <tr>
                <th className="text-left bg-prpm-dark-card px-4 py-3 border border-prpm-border text-white font-semibold">Domain</th>
                <th className="text-left bg-prpm-dark-card px-4 py-3 border border-prpm-border text-white font-semibold">Keywords</th>
                <th className="text-left bg-prpm-dark-card px-4 py-3 border border-prpm-border text-white font-semibold">Search Query</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr>
                <td className="px-4 py-3 border border-prpm-border">Infrastructure</td>
                <td className="px-4 py-3 border border-prpm-border">aws, pulumi, terraform, kubernetes</td>
                <td className="px-4 py-3 border border-prpm-border font-mono text-sm text-prpm-accent-light">prpm search "infrastructure &lt;tool&gt;"</td>
              </tr>
              <tr>
                <td className="px-4 py-3 border border-prpm-border">Testing</td>
                <td className="px-4 py-3 border border-prpm-border">test, playwright, jest, cypress</td>
                <td className="px-4 py-3 border border-prpm-border font-mono text-sm text-prpm-accent-light">prpm search "testing &lt;framework&gt;"</td>
              </tr>
              <tr>
                <td className="px-4 py-3 border border-prpm-border">CI/CD</td>
                <td className="px-4 py-3 border border-prpm-border">github-actions, gitlab-ci, deploy</td>
                <td className="px-4 py-3 border border-prpm-border font-mono text-sm text-prpm-accent-light">prpm search "deployment &lt;platform&gt;"</td>
              </tr>
              <tr>
                <td className="px-4 py-3 border border-prpm-border">Frameworks</td>
                <td className="px-4 py-3 border border-prpm-border">react, vue, next.js, express</td>
                <td className="px-4 py-3 border border-prpm-border font-mono text-sm text-prpm-accent-light">prpm search "&lt;framework&gt; best-practices"</td>
              </tr>
            </tbody>
          </table>

          <h3 className="text-2xl font-bold text-white mt-10 mb-4">Confidence-Based Filtering</h3>

          <p>
            Not all packages are equal. The self-improving skill uses a confidence system to decide what to suggest:
          </p>

          <div className="not-prose space-y-6 my-8">
            <div className="bg-prpm-dark-card border-l-4 border-prpm-green rounded-r-xl p-6">
              <h4 className="text-white font-bold mb-3">✓ High Confidence (Auto-suggest)</h4>
              <ul className="text-gray-300 space-y-2 text-sm list-disc ml-5">
                <li>Official packages from <code className="text-prpm-accent bg-prpm-dark/50 px-2 py-1 rounded">@prpm/*</code></li>
                <li>Featured packages vetted by PRPM team</li>
                <li>High download counts (&gt;1,000)</li>
                <li>Verified authors</li>
              </ul>
            </div>

            <div className="bg-prpm-dark-card border-l-4 border-yellow-500/50 rounded-r-xl p-6">
              <h4 className="text-white font-bold mb-3">⚠ Medium Confidence (Present options)</h4>
              <ul className="text-gray-300 space-y-2 text-sm list-disc ml-5">
                <li>Community packages (&lt;1,000 downloads)</li>
                <li>Multiple similar packages (let user choose)</li>
                <li>Tangentially related packages</li>
              </ul>
            </div>

            <div className="bg-prpm-dark-card border-l-4 border-red-500/50 rounded-r-xl p-6">
              <h4 className="text-white font-bold mb-3">✗ Low Confidence (Skip)</h4>
              <ul className="text-gray-300 space-y-2 text-sm list-disc ml-5">
                <li>Unverified packages</li>
                <li>Deprecated packages</li>
                <li>Zero or very low downloads</li>
              </ul>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-white mt-10 mb-4">Installation Command</h3>

          <p>
            When you approve a package, Claude runs:
          </p>

          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto my-8"><code className="text-sm text-gray-300 font-mono">{`prpm install @prpm/pulumi-infrastructure --as claude`}</code></pre>

          <p>
            The <code>--as claude</code> flag tells PRPM to install the package specifically for Claude Code. This means:
          </p>

          <ul className="space-y-2 my-6 text-gray-300">
            <li>The package gets converted to Claude's skill format automatically</li>
            <li>It's installed in the right directory (<code>~/.claude/skills/</code>)</li>
            <li>Claude can immediately load and use the new knowledge</li>
          </ul>

          <h2 className="text-3xl font-bold text-white mt-16 mb-6">Use Cases: When Self-Improvement Shines</h2>

          <h3 className="text-2xl font-bold text-white mt-10 mb-4">1. Infrastructure as Code</h3>

          <p>
            You're setting up AWS infrastructure with Pulumi. Instead of Claude giving you generic patterns, it discovers and installs:
          </p>

          <ul className="space-y-2 my-6 text-gray-300">
            <li><code>@prpm/pulumi-infrastructure</code> — Production patterns for Pulumi + AWS</li>
            <li><code>@sanjeed5/github-actions</code> — CI/CD workflows that catch issues early</li>
          </ul>

          <p>
            Your infrastructure gets built with patterns that have been battle-tested in production. The result: fewer bugs, better performance, lower costs.
          </p>

          <h3 className="text-2xl font-bold text-white mt-10 mb-4">2. Testing Workflows</h3>

          <p>
            You're adding Playwright tests to your Next.js app. Claude detects "playwright" and "next.js" and installs:
          </p>

          <ul className="space-y-2 my-6 text-gray-300">
            <li><code>@nextjs/app-router</code> — App Router conventions and gotchas</li>
            <li><code>@playwright/best-practices</code> — E2E testing patterns</li>
          </ul>

          <p>
            Now Claude writes tests that follow Next.js conventions and use Playwright idiomatically. The tests are more reliable and easier to maintain.
          </p>

          <h3 className="text-2xl font-bold text-white mt-10 mb-4">3. Framework Migrations</h3>

          <p>
            You're migrating from Next.js Pages Router to App Router. Claude detects the migration context and installs:
          </p>

          <ul className="space-y-2 my-6 text-gray-300">
            <li><code>@nextjs/app-router-migration</code> — Migration patterns and gotchas</li>
            <li><code>@react/server-components</code> — Server Component best practices</li>
          </ul>

          <p>
            The migration happens faster and with fewer regressions because Claude has access to patterns from developers who've done this migration successfully.
          </p>

          <h3 className="text-2xl font-bold text-white mt-10 mb-4">4. Language-Specific Conventions</h3>

          <p>
            You're writing TypeScript with strict type safety requirements. Claude detects TypeScript work and suggests:
          </p>

          <ul className="space-y-2 my-6 text-gray-300">
            <li><code>@typescript/type-safety</code> — Advanced typing patterns</li>
            <li><code>@your-team/typescript-conventions</code> — Your team's specific rules</li>
          </ul>

          <p>
            Code comes out matching your team's conventions automatically, reducing review cycles.
          </p>

          <h2 className="text-3xl font-bold text-white mt-16 mb-6">The Broader Vision: Distributable Intelligence</h2>

          <p>
            The self-improving skill is more than a neat feature. It's a glimpse into how software knowledge will be shared in the AI era.
          </p>

          <h3 className="text-2xl font-bold text-white mt-10 mb-4">From Documentation to Executable Knowledge</h3>

          <p>
            Traditional software distribution looks like this:
          </p>

          <ul className="space-y-2 my-6 text-gray-300">
            <li><strong className="text-white">Libraries:</strong> Executable code (npm, pip, cargo)</li>
            <li><strong className="text-white">Documentation:</strong> Human-readable guides</li>
            <li><strong className="text-white">Migration Guides:</strong> Step-by-step instructions</li>
          </ul>

          <p>
            But there's always been a gap: how do you share patterns, conventions, and domain expertise in a way that's both discoverable and executable?
          </p>

          <p>
            PRPM fills that gap. Packages are executable knowledge:
          </p>

          <ul className="space-y-2 my-6 text-gray-300">
            <li>AI assistants can discover them when needed</li>
            <li>They apply automatically to the current task</li>
            <li>They're version-controlled and updatable</li>
            <li>They work across different AI tools</li>
          </ul>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h3 className="text-2xl font-bold text-white mb-4">The Compounding Effect</h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              When you install a self-improving skill, you're not just making your AI assistant better at one task. You're teaching it how to continuously get better.
            </p>
            <p className="text-gray-300 leading-relaxed mb-0">
              Every task becomes an opportunity to discover and apply new expertise. The more you work, the more capable your AI becomes.
            </p>
          </div>

          <h3 className="text-2xl font-bold text-white mt-10 mb-4">Meta-Dogfooding: PRPM Uses PRPM</h3>

          <p>
            The self-improving skill isn't just a demo. We use it to build PRPM itself:
          </p>

          <ul className="space-y-3 my-6 text-gray-300">
            <li>
              <strong className="text-white">Infrastructure:</strong> Claude installs <code>@prpm/pulumi-infrastructure</code> and helps build PRPM's AWS deployment (74% cost savings from the patterns in that package)
            </li>
            <li>
              <strong className="text-white">CI/CD:</strong> Claude installs <code>@sanjeed5/github-actions</code> and generates validation workflows
            </li>
            <li>
              <strong className="text-white">Testing:</strong> Claude installs testing packages and writes E2E tests following best practices
            </li>
          </ul>

          <p>
            This means users get access to the same expertise that built PRPM. The packages aren't theoretical—they're proven in production.
          </p>

          <h2 className="text-3xl font-bold text-white mt-16 mb-6">Getting Started</h2>

          <p>
            Installing the self-improving skill takes less than 60 seconds:
          </p>

          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto my-8"><code className="text-sm text-gray-300 font-mono">{`# Install PRPM CLI
npm install -g prpm

# Install the self-improving skill for Claude
prpm install @prpm/self-improving --as claude

# Or for Cursor
prpm install @prpm/self-improve-cursor --as cursor

# Or for other tools
prpm install @prpm/self-improve-windsurf --as windsurf
prpm install @prpm/self-improve-continue --as continue`}</code></pre>

          <p>
            Once installed, the skill activates automatically when you work on infrastructure, testing, deployment, or framework-specific tasks.
          </p>

          <h3 className="text-2xl font-bold text-white mt-10 mb-4">Trying It Out</h3>

          <p>
            Start a new conversation with Claude and say something like:
          </p>

          <ul className="space-y-2 my-6 text-gray-300">
            <li>"Help me set up AWS infrastructure with Pulumi"</li>
            <li>"I need to add Playwright tests to my Next.js app"</li>
            <li>"Help me migrate from Jest to Vitest"</li>
            <li>"I'm setting up GitHub Actions for my monorepo"</li>
          </ul>

          <p>
            Watch Claude analyze the task, search PRPM, and suggest relevant packages. Accept the suggestions and see how the quality of assistance improves immediately.
          </p>

          <h2 className="text-3xl font-bold text-white mt-16 mb-6">Privacy and Control</h2>

          <p>
            Self-improvement happens transparently and with your control:
          </p>

          <ul className="space-y-3 my-6 text-gray-300">
            <li>
              <strong className="text-white">Local searches:</strong> All package searches happen locally—no data sent to PRPM servers
            </li>
            <li>
              <strong className="text-white">Explicit approval:</strong> Claude always asks permission before installing packages
            </li>
            <li>
              <strong className="text-white">Full transparency:</strong> You see exactly what Claude found and why it's suggesting specific packages
            </li>
            <li>
              <strong className="text-white">Reversible:</strong> You can uninstall packages anytime with <code>prpm uninstall</code>
            </li>
          </ul>

          <p>
            Download tracking only happens on installation, and no personal data is collected.
          </p>

          <h2 className="text-3xl font-bold text-white mt-16 mb-6">What's Next</h2>

          <p>
            The self-improving skill is just the beginning. We're working on:
          </p>

          <ul className="space-y-3 my-6 text-gray-300">
            <li>
              <strong className="text-white">Learning from outcomes:</strong> Track which packages were most helpful and surface them more prominently
            </li>
            <li>
              <strong className="text-white">Contextual collections:</strong> Suggest entire collections for common scenarios ("You're building a startup MVP? Here are 15 packages that will help")
            </li>
            <li>
              <strong className="text-white">Cross-project learning:</strong> Let AI assistants remember which packages worked well and proactively suggest them in similar contexts
            </li>
            <li>
              <strong className="text-white">Community curation:</strong> Surface packages that developers with similar workflows found valuable
            </li>
          </ul>

          <p>
            The goal is simple: AI assistants that get continuously better at their job by learning from the community.
          </p>

          <h2 className="text-3xl font-bold text-white mt-16 mb-6">Why This Matters</h2>

          <p>
            We're in the early days of AI-assisted development. Right now, AI assistants are impressive generalists but limited specialists.
          </p>

          <p>
            The self-improving skill changes that dynamic. It gives AI assistants the ability to acquire deep, specialized knowledge on demand—knowledge that comes from real developers solving real problems.
          </p>

          <p>
            This isn't about replacing human expertise. It's about making that expertise more discoverable and applicable. When a developer solves a hard problem—like optimizing Kubernetes configs or building resilient CI/CD pipelines—they can package that knowledge. Then every AI assistant can learn from it.
          </p>

          <p>
            The result is a positive feedback loop: better packages lead to better AI assistance, which helps developers build better software, which they package and share, making AI assistants even more capable.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-purple rounded-r-2xl p-8 my-12">
            <p className="text-xl text-gray-300 leading-relaxed italic mb-4">
              "The best way to predict the future is to invent it."
            </p>
            <p className="text-gray-400 text-sm mb-0">
              We're inventing a future where AI assistants continuously improve by learning from the developer community. The self-improving skill is how we get there.
            </p>
          </div>

          {/* Call to Action */}
          <div className="not-prose bg-gradient-to-r from-prpm-accent/10 to-prpm-purple/10 border border-prpm-accent/30 rounded-2xl p-8 my-12">
            <h3 className="text-2xl font-bold text-white mb-4">
              Try Self-Improving AI Today
            </h3>
            <p className="text-gray-300 mb-6">
              Install the self-improving skill and watch your AI assistant get smarter with every task
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://prpm.dev/packages/prpm/self-improving"
                className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-hover text-white font-semibold rounded-lg transition-colors inline-block"
              >
                Install the Skill
              </a>
              <a
                href="https://youtu.be/12ColynhYls"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white font-semibold rounded-lg transition-colors inline-block"
              >
                Watch the Demo
              </a>
              <Link
                href="/search"
                className="px-6 py-3 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white font-semibold rounded-lg transition-colors inline-block"
              >
                Browse Packages
              </Link>
            </div>
          </div>

        </div>
      </article>

      <BlogFooter />
    </main>
  )
}
