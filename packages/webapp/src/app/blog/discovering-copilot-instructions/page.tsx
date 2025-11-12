import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Best GitHub Copilot Instructions: Complete Guide 2025 - PRPM",
  description: "Discover the best GitHub Copilot instructions and chat modes for AI-powered development. Compare PRPM vs GitHub Gists vs awesome-copilot. Get CLI installation, version control, testing, and quality-scored collections.",
  keywords: "github copilot instructions, best github copilot instructions, copilot-instructions.md, github copilot custom instructions, github copilot chat modes, ai coding, github copilot rules, awesome copilot",
  openGraph: {
    title: "Best GitHub Copilot Instructions: Complete Guide 2025",
    description: "Find and install the best GitHub Copilot instructions and chat modes. Compare top sources: PRPM, GitHub Gists, awesome-copilot. Free CLI, testing playground, and format conversion.",
  },
}

export default function DiscoveringCopilotInstructionsPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['GitHub Copilot', 'Best Practices', 'AI Coding']}
          title="Best GitHub Copilot Instructions: Complete Guide 2025"
          subtitle="Compare top sources, find quality instructions, and build better apps with GitHub Copilot AI"
          author="PRPM Team"
          date="November 6, 2025"
          readTime="8 min read"
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

          <p><strong><a href="https://github.blog/changelog/2024-07-09-github-copilot-custom-instructions-is-now-available-in-public-preview/" target="_blank">GitHub Copilot instructions</a></strong> are custom guidelines that shape how GitHub Copilot generates code for your repository. GitHub supports three types: <strong>repository-wide instructions</strong> (<code>.github/copilot-instructions.md</code>), <strong>path-specific instructions</strong> (<code>.github/instructions/*.instructions.md</code>), and <strong><a href="https://code.visualstudio.com/docs/copilot/customization/custom-chat-modes" target="_blank">custom chat modes</a></strong> (<code>.github/chatmodes/*.chatmode.md</code>) that create specialized AI personas for tasks like code review, testing, or architecture design.</p>

          <p>Whether you're building with React, Next.js, Python, or Go, the right GitHub Copilot instructions and chat modes dramatically improve AI-generated code quality, enforce conventions, and reduce the need for manual corrections.</p>

          <p>This guide compares the <strong>best GitHub Copilot instructions</strong> sources and shows you how to find, test, and install quality instructions and chat modes for your projects.</p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Where to Find the Best GitHub Copilot Instructions</h2>
          </div>

          <p>GitHub Copilot instructions are scattered across multiple sources with varying quality. Here are the main places developers look:</p>

          <div className="not-prose mb-8">
            <h3 className="text-2xl font-bold text-white mb-3 mt-6">1. PRPM (prpm.dev) - Full Package Management</h3>
          </div>

          <p><strong>Best for:</strong> Developers who want CLI installation, version control, testing before installing, and cross-editor compatibility.</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li><strong>CLI installation:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded">prpm install @package-name</code> — no manual file copying</li>
              <li><strong>Testing playground:</strong> Test instructions with real AI models before installing</li>
              <li><strong>Quality metrics:</strong> Automated quality scoring (0-5 stars), download counts, user ratings</li>
              <li><strong>Version control:</strong> Semantic versioning, update management, dependency tracking</li>
              <li><strong>Format conversion:</strong> Install Cursor rules, Claude skills, or Windsurf rules as Copilot format</li>
              <li><strong>All Copilot types:</strong> Repository-wide (<code>.github/copilot-instructions.md</code>), path-specific (<code>.github/instructions/*.instructions.md</code>), and chat modes (<code>.github/chatmodes/*.chatmode.md</code>)</li>
              <li><strong>6000+ packages:</strong> Largest collection including awesome-copilot packages</li>
              <li><strong>Free tier:</strong> Unlimited browsing, installation, and publishing</li>
            </ul>
          </div>

          <div className="not-prose mb-8">
            <h3 className="text-2xl font-bold text-white mb-3 mt-6">2. GitHub Awesome-Copilot - Official Collection</h3>
          </div>

          <p><strong>Best for:</strong> Developers looking for Microsoft-curated, official Copilot instructions.</p>

          <p className="mt-2 text-sm text-gray-400"><em>Source: <a href="https://github.com/github/awesome-copilot" target="_blank" className="text-prpm-accent hover:underline">github.com/github/awesome-copilot</a></em></p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li><strong>Official Microsoft collection:</strong> Maintained by GitHub team</li>
              <li><strong>High-quality examples:</strong> Go, Power Apps, accessibility, CosmosDB</li>
              <li><strong>Chat modes included:</strong> Power BI expert, performance expert, and other specialized personas</li>
              <li><strong>Single repository:</strong> All instructions in one GitHub repo</li>
              <li><strong>Manual installation:</strong> Clone repo and copy files manually</li>
              <li><strong>No version control:</strong> Must pull repo for updates</li>
              <li><strong>No testing:</strong> Install first, test later</li>
              <li><strong>Limited discoverability:</strong> Browse repo structure, no search</li>
            </ul>
          </div>

          <div className="not-prose mb-8">
            <h3 className="text-2xl font-bold text-white mb-3 mt-6">3. GitHub Gists - Community Sharing</h3>
          </div>

          <p><strong>Best for:</strong> Quick snippets and one-off instructions shared by individual developers.</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li><strong>Easy sharing:</strong> Create and share Gists quickly</li>
              <li><strong>Community-driven:</strong> Developers share what works for them</li>
              <li><strong>Fragmented:</strong> No central index, hard to discover quality content</li>
              <li><strong>No quality signals:</strong> Can't tell if instruction is good without trying</li>
              <li><strong>Stale content:</strong> Gists rarely updated, may use outdated patterns</li>
              <li><strong>Manual process:</strong> Copy-paste into your <code>.github/copilot-instructions.md</code></li>
              <li><strong>No version tracking:</strong> No way to know when instructions change</li>
            </ul>
          </div>

          <div className="not-prose mb-8">
            <h3 className="text-2xl font-bold text-white mb-3 mt-6">4. Public Repositories - Embedded Instructions</h3>
          </div>

          <p><strong>Best for:</strong> Learning from real-world projects and seeing instructions in context.</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li><strong>Real-world examples:</strong> See how production projects use Copilot</li>
              <li><strong>Context available:</strong> Understand why specific instructions were chosen</li>
              <li><strong>Hard to find:</strong> Instructions buried in repo files, difficult to search</li>
              <li><strong>Project-specific:</strong> May not generalize to your use case</li>
              <li><strong>No reusability:</strong> Must manually extract and adapt</li>
              <li><strong>Update tracking:</strong> Impossible to track changes across repos</li>
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
                  <th className="text-left p-3 text-white font-semibold">Awesome-Copilot</th>
                  <th className="text-left p-3 text-white font-semibold">GitHub Gists</th>
                  <th className="text-left p-3 text-white font-semibold">Public Repos</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">CLI Installation</td>
                  <td className="p-3 text-green-400">✓ prpm install</td>
                  <td className="p-3 text-red-400">✗ Manual copy</td>
                  <td className="p-3 text-red-400">✗ Manual copy</td>
                  <td className="p-3 text-red-400">✗ Clone & extract</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Testing Before Install</td>
                  <td className="p-3 text-green-400">✓ Playground</td>
                  <td className="p-3 text-red-400">✗ None</td>
                  <td className="p-3 text-red-400">✗ None</td>
                  <td className="p-3 text-red-400">✗ None</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Quality Metrics</td>
                  <td className="p-3 text-green-400">✓ Automated scoring</td>
                  <td className="p-3 text-yellow-400">~ Microsoft curated</td>
                  <td className="p-3 text-red-400">✗ None</td>
                  <td className="p-3 text-red-400">✗ None</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Version Control</td>
                  <td className="p-3 text-green-400">✓ Semantic versioning</td>
                  <td className="p-3 text-yellow-400">~ Git commits</td>
                  <td className="p-3 text-yellow-400">~ Gist revisions</td>
                  <td className="p-3 text-yellow-400">~ Repo history</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Format Conversion</td>
                  <td className="p-3 text-green-400">✓ Any format → Copilot</td>
                  <td className="p-3 text-red-400">✗ Copilot only</td>
                  <td className="p-3 text-red-400">✗ As published</td>
                  <td className="p-3 text-red-400">✗ As published</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Collection Size</td>
                  <td className="p-3 text-green-400">6000+ packages</td>
                  <td className="p-3 text-yellow-400">~60 official</td>
                  <td className="p-3 text-yellow-400">Scattered</td>
                  <td className="p-3 text-yellow-400">Unknown</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Update Management</td>
                  <td className="p-3 text-green-400">✓ prpm update</td>
                  <td className="p-3 text-yellow-400">~ git pull</td>
                  <td className="p-3 text-red-400">✗ Manual check</td>
                  <td className="p-3 text-red-400">✗ Manual tracking</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Discoverability</td>
                  <td className="p-3 text-green-400">✓ Search & filter</td>
                  <td className="p-3 text-yellow-400">~ Browse repo</td>
                  <td className="p-3 text-red-400">✗ Scattered</td>
                  <td className="p-3 text-red-400">✗ Hidden in code</td>
                </tr>
                <tr className="border-b border-prpm-border/30">
                  <td className="p-3 font-semibold">Best For</td>
                  <td className="p-3 text-green-400">Production teams</td>
                  <td className="p-3">Learning official patterns</td>
                  <td className="p-3">Quick snippets</td>
                  <td className="p-3">Real-world examples</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">How to Find the Best GitHub Copilot Instructions</h2>
          </div>

          <p>Finding quality GitHub Copilot instructions for your specific tech stack is crucial. Here's what to look for:</p>

          <div className="not-prose mb-8">
            <h3 className="text-2xl font-bold text-white mb-3 mt-6">1. Match Your Technology Stack</h3>
          </div>

          <p>The best GitHub Copilot instructions are tailored to your frameworks and languages. Look for instructions designed for:</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li><strong>Languages:</strong> TypeScript, Python, Go, Java, JavaScript</li>
              <li><strong>Frontend:</strong> React, Next.js, Vue, Angular, Svelte</li>
              <li><strong>Backend:</strong> Node.js, Django, FastAPI, NestJS, Flask</li>
              <li><strong>Cloud:</strong> Azure Cosmos DB, Power Platform, AWS services</li>
              <li><strong>Domains:</strong> Accessibility, testing, performance, security</li>
            </ul>
          </div>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">2. Check Quality Signals</h3>
          </div>

          <p>On PRPM, every GitHub Copilot instruction package includes quality metrics:</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li><strong>Automated quality score:</strong> 0-5 star rating based on content analysis</li>
              <li><strong>Download count:</strong> How many developers trust this instruction</li>
              <li><strong>User ratings:</strong> Real feedback from production use</li>
              <li><strong>Official badge:</strong> Identifies packages from awesome-copilot</li>
              <li><strong>Maintenance status:</strong> Last updated, version history</li>
            </ul>
          </div>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">3. Test Before Installing</h3>
          </div>

          <p>PRPM's playground lets you test GitHub Copilot instructions with real AI models before committing:</p>

          <pre className="mt-4"><code>{`# Test instruction with your actual prompt
prpm playground @awesome-copilot/copilot-go "Create HTTP server with middleware"

# See exactly what code quality you'll get
# Then decide if it's the right instruction for your project`}</code></pre>

          <p className="mt-4">No other source offers this — Gists and repos require installation before you can test effectiveness.</p>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">4. Version Control & Updates</h3>
          </div>

          <p>The best GitHub Copilot instructions evolve with framework updates. PRPM provides semantic versioning:</p>

          <pre className="mt-4"><code>{`# Install specific version
prpm install @awesome-copilot/copilot-go@1.0.0

# Update to latest
prpm update @awesome-copilot/copilot-go

# See changelog
prpm info @awesome-copilot/copilot-go`}</code></pre>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Quick Start</h2>
          </div>

          <pre><code>{`# Install PRPM CLI
npm install -g prpm

# Search best GitHub Copilot instructions
prpm search "react" --format copilot
prpm search "python" --format copilot
prpm search "go" --format copilot

# Test before installing (unique to PRPM)
prpm playground @awesome-copilot/copilot-go "Create REST API"

# Install GitHub Copilot instructions
prpm install @awesome-copilot/copilot-go

# Install for accessibility
prpm install @awesome-copilot/copilot-a11y

# Or convert any Cursor/Claude rule to Copilot format
prpm install @cursor/typescript-strict --format copilot

# Keep instructions updated
prpm update`}</code></pre>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Popular GitHub Copilot Instructions & Chat Modes</h2>
          </div>

          <p>Here are popular GitHub Copilot instruction packages and chat modes available on PRPM (including the full awesome-copilot collection):</p>

          <div className="not-prose mb-8">
            <h3 className="text-2xl font-bold text-white mb-3 mt-6">Instructions (copilot-instructions.md)</h3>
          </div>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-3">
              <li><strong>@awesome-copilot/copilot-go:</strong> Idiomatic Go practices and community standards for writing clean Go code</li>
              <li><strong>@awesome-copilot/copilot-a11y:</strong> Creating accessible code with WCAG compliance and ARIA best practices</li>
              <li><strong>@awesome-copilot/copilot-power-apps-code-apps:</strong> Power Apps Code Apps with TypeScript, React, and Power Platform integration</li>
              <li><strong>@awesome-copilot/copilot-power-apps-canvas-yaml:</strong> Power Apps Canvas Apps YAML structure with Power Fx formulas</li>
              <li><strong>@awesome-copilot/copilot-cosmosdb-datamodeling:</strong> Azure Cosmos DB data modeling with NoSQL best practices</li>
              <li><strong>@awesome-copilot/copilot-github-copilot-starter:</strong> Complete GitHub Copilot configuration for new projects</li>
              <li><strong>@awesome-copilot/copilot-power-platform-connector:</strong> Power Platform Custom Connectors with Swagger 2.0</li>
            </ul>
          </div>

          <div className="not-prose mb-8 mt-8">
            <h3 className="text-2xl font-bold text-white mb-3">Chat Modes (copilot-chat-modes.md)</h3>
          </div>

          <p>Chat modes create specialized AI personas for specific development tasks:</p>

          <div className="not-prose mb-8">
            <ul className="list-disc ml-6 text-gray-300 space-y-3">
              <li><strong>@awesome-copilot/copilot-power-bi-visualization-expert:</strong> Expert Power BI report design and visualization guidance with Microsoft best practices</li>
              <li><strong>@awesome-copilot/copilot-power-bi-performance-expert:</strong> Power BI performance optimization for troubleshooting and monitoring queries</li>
            </ul>
          </div>

          <p className="mt-6">Browse all 6000+ packages at <Link href="/search?format=copilot" className="text-prpm-accent hover:underline">prpm.dev/search</Link></p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Choosing the Right Source</h2>
          </div>

          <p><strong>Use PRPM if:</strong> You want professional package management, CLI installation, testing before installing, version control, and cross-editor compatibility. Best for production teams and developers who value quality signals and automated workflows.</p>

          <p className="mt-4"><strong>Use awesome-copilot repository if:</strong> You want official Microsoft-curated instructions and don't mind cloning a repo. Good for learning official patterns, but requires manual file management and offers no testing capability.</p>

          <p className="mt-4"><strong>Use GitHub Gists if:</strong> You're looking for quick, one-off snippets from community members. Good for experimentation, but no quality guarantees and difficult to discover or maintain.</p>

          <p className="mt-4"><strong>Use public repositories if:</strong> You want to see real-world examples in production context. Best for learning, but instructions are buried in code and hard to extract or reuse.</p>

          <p className="mt-6"><strong>Pro tip:</strong> Most professional developers use PRPM for production work because it includes all awesome-copilot packages plus thousands more, with quality scoring, CLI installation, and testing. PRPM automatically indexes awesome-copilot and makes it searchable alongside community packages, giving you the best of both official Microsoft content and community contributions.</p>

          <div className="not-prose my-12 p-8 bg-gradient-to-br from-prpm-accent/10 to-prpm-green/10 border border-prpm-accent/30 rounded-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Start Using the Best GitHub Copilot Instructions Today</h3>
            <p className="text-gray-300 mb-6">
              Get CLI installation, quality metrics, testing playground, and version control for your GitHub Copilot workflow. 6000+ packages including all awesome-copilot instructions.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/search?format=copilot"
                className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent/80 text-white font-semibold rounded-lg transition-all"
              >
                Browse Copilot Instructions
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
            <Link href="/blog/discovering-claude-skills-prpm-vs-competition" className="block p-6 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent rounded-xl transition-all">
              <h3 className="text-lg font-bold text-white mb-2">Discovering Claude Skills</h3>
              <p className="text-gray-400 text-sm">PRPM vs The Competition</p>
            </Link>
            <Link href="/blog/discovering-cursor-rules" className="block p-6 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent rounded-xl transition-all">
              <h3 className="text-lg font-bold text-white mb-2">Finding Cursor Rules</h3>
              <p className="text-gray-400 text-sm">Beyond cursor.directory</p>
            </Link>
          </div>
        </div>
      </article>

      <BlogFooter
        postTitle="Best GitHub Copilot Instructions: Complete Guide 2025"
        postUrl="/blog/discovering-copilot-instructions"
      />
    </main>
  )
}
