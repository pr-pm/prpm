import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Discovering Kiro Steering Rules: Why PRPM Wins - PRPM",
  description: "How PRPM brings centralized discovery to Kiro steering files. Stop searching GitHub repos and Discord—get CLI installation, version control, and testing.",
  openGraph: {
    title: "Discovering Kiro Steering Rules: Why PRPM Wins",
    description: "The first centralized marketplace for Kiro steering files with package management, searchability, and quality metrics.",
  },
}

export default function DiscoveringKiroRulesPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Kiro', 'Discovery', 'Marketplace']}
          title="Discovering Kiro Steering Rules: Why PRPM Wins"
          subtitle="From scattered GitHub repos to centralized package management"
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
              Kiro's steering file system is powerful—domain-organized rules that guide AI behavior across your codebase. But finding quality steering files means searching GitHub repos, asking in Discord, and manually copying files into <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded text-sm">.kiro/steering/</code>. PRPM brings Kiro the centralized marketplace it deserves.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Problem: No Centralized Discovery</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Kiro is a newer AI coding assistant with a unique approach: steering files organized by domain (frontend, backend, testing) rather than monolithic configuration. It's excellent for separating concerns and managing complexity.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            But there's no central marketplace. Finding Kiro steering files means:
          </p>

          <div className="not-prose mb-16">
            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-0">
              <li><strong className="text-white">GitHub search:</strong> Search for "kiro steering" or ".kiro", wade through repos</li>
              <li><strong className="text-white">Discord communities:</strong> Ask around, hope someone shares their setup</li>
              <li><strong className="text-white">Personal networks:</strong> Share files manually with teammates</li>
              <li><strong className="text-white">Starting from scratch:</strong> Most developers just write their own</li>
            </ul>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            This fragmentation means good steering files don't get discovered, tested setups aren't shared, and everyone reinvents the wheel.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Current Discovery Methods</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">1. GitHub Repositories</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              The most common method: search GitHub for Kiro-related repos, clone them, browse file structures, copy steering files manually.
            </p>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
              <h4 className="text-lg font-bold text-white mb-3">Problems:</h4>
              <ul className="list-disc ml-6 text-gray-300 space-y-2 text-sm mb-0">
                <li>No standardized naming or structure</li>
                <li>Hard to find quality files among personal configs</li>
                <li>No way to test without cloning and trying</li>
                <li>No version tracking or update notifications</li>
                <li>Each repo has different organization</li>
              </ul>
            </div>

            <p className="text-gray-300 leading-relaxed mb-0">
              GitHub is great for open source projects, but it's not a package marketplace.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">2. Community Sharing (Discord/Slack)</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Kiro users share steering files in community channels. Someone asks for a React setup, another user pastes their files.
            </p>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
              <h4 className="text-lg font-bold text-white mb-3">Problems:</h4>
              <ul className="list-disc ml-6 text-gray-300 space-y-2 text-sm mb-0">
                <li>Conversations disappear in chat history</li>
                <li>No way to search historical shares</li>
                <li>No quality vetting or ratings</li>
                <li>Files pasted as code blocks (error-prone copying)</li>
                <li>No follow-up support or updates</li>
              </ul>
            </div>

            <p className="text-gray-300 leading-relaxed mb-0">
              Community sharing is valuable, but it's ephemeral and unstructured.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">3. Personal Collections</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Many teams maintain internal repos with their Kiro steering files. Copy between projects, update manually, share via internal docs.
            </p>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
              <h4 className="text-lg font-bold text-white mb-3">Problems:</h4>
              <ul className="list-disc ml-6 text-gray-300 space-y-2 text-sm mb-0">
                <li>Knowledge locked inside teams</li>
                <li>No benefit from community improvements</li>
                <li>Maintenance burden on each team</li>
                <li>No discoverability for new team members</li>
              </ul>
            </div>

            <p className="text-gray-300 leading-relaxed mb-0">
              Internal collections work, but they fragment the ecosystem.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">PRPM: The First Kiro Marketplace</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            PRPM brings centralized discovery and package management to Kiro. Search, install, update, and share steering files using the same tools developers already trust.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">1. Centralized Search</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Search across all published Kiro steering files by use case, technology, or domain.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Search for React steering files
prpm search "react" --format kiro

# Search for backend patterns
prpm search "backend API" --format kiro

# Browse all Kiro packages
prpm search --format kiro`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              Or use <Link href="/search?format=kiro" className="text-prpm-accent hover:underline font-medium">web search</Link> to browse with filters, ratings, and download counts.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">2. CLI Installation</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Install steering files directly to <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded text-sm">.kiro/steering/</code> with proper domain organization.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Install React frontend steering
prpm install @react/frontend-patterns

# Install backend API steering
prpm install @backend/rest-api-patterns

# Install complete full-stack collection
prpm install @prpm/kiro-fullstack

# Organized automatically in .kiro/steering/frontend/, .kiro/steering/backend/`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              PRPM respects Kiro's domain structure, placing files in the correct directories automatically.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">3. Version Control & Updates</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Every Kiro package has semantic versioning. Get updates when steering files improve.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Check for updates
prpm outdated

# Update specific package
prpm update @react/frontend-patterns

# Update all Kiro packages
prpm update --format kiro`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              No more wondering if your steering files are current. Get changelogs, update deliberately.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">4. Quality Metrics & Community Feedback</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Every package shows quality indicators: downloads, ratings, playground test results, verified authors.
            </p>

            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
              <li><strong className="text-white">Download counts:</strong> See which steering files are popular</li>
              <li><strong className="text-white">Star ratings:</strong> Community feedback on quality</li>
              <li><strong className="text-white">Test results:</strong> Playground usage and helpfulness ratings</li>
              <li><strong className="text-white">Verified authors:</strong> Trust signals for package maintainers</li>
              <li><strong className="text-white">Last updated:</strong> Active maintenance indicators</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-0">
              Make informed decisions based on community data, not guesswork.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">5. Testing Playground</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Test Kiro steering files with real AI models before installing. See how they actually behave.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Test React steering file
prpm playground @react/frontend-patterns "Create a form with validation"

# Compare with baseline
prpm playground @react/frontend-patterns "Create a form" --compare

# Interactive testing
prpm playground @backend/rest-api-patterns --interactive`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              Or use the <Link href="/playground" className="text-prpm-accent hover:underline font-medium">web playground</Link> to test in your browser with Claude or GPT-4.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">6. Format Conversion</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Found a great Kiro steering file but your team uses Cursor? PRPM handles format conversion automatically.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Install Kiro steering as Cursor rule
prpm install @react/frontend-patterns --format cursor

# Same package, different editors
prpm install @react/frontend-patterns --format claude
prpm install @react/frontend-patterns --format copilot`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              Cross-editor compatibility means you're never locked into one tool.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Comparison: Before & After PRPM</h2>
          </div>

          <div className="not-prose mb-8">
            <table className="w-full border-collapse text-gray-300">
              <thead className="border-b-2 border-prpm-border">
                <tr>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Task</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Before PRPM</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">With PRPM</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Finding steering files</td>
                  <td className="px-4 py-4 border border-prpm-border">Search GitHub, ask Discord</td>
                  <td className="px-4 py-4 border border-prpm-border text-prpm-accent">prpm search --format kiro</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Installation</td>
                  <td className="px-4 py-4 border border-prpm-border">Clone repo, copy files manually</td>
                  <td className="px-4 py-4 border border-prpm-border text-prpm-accent">prpm install @package</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Quality assessment</td>
                  <td className="px-4 py-4 border border-prpm-border">Read code, hope it's good</td>
                  <td className="px-4 py-4 border border-prpm-border text-prpm-accent">Ratings, downloads, test results</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Testing</td>
                  <td className="px-4 py-4 border border-prpm-border">Install and try in project</td>
                  <td className="px-4 py-4 border border-prpm-border text-prpm-accent">Playground with real models</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Updates</td>
                  <td className="px-4 py-4 border border-prpm-border">Manually check repos</td>
                  <td className="px-4 py-4 border border-prpm-border text-prpm-accent">prpm update</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Sharing with team</td>
                  <td className="px-4 py-4 border border-prpm-border">Share files or repo URLs</td>
                  <td className="px-4 py-4 border border-prpm-border text-prpm-accent">Share install commands</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Format conversion</td>
                  <td className="px-4 py-4 border border-prpm-border">Manual rewrite</td>
                  <td className="px-4 py-4 border border-prpm-border text-prpm-accent">--format flag</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Real-World Example</h2>
          </div>

          <div className="not-prose space-y-8 mb-16">
            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Scenario: Setting Up Kiro for Full-Stack Development</h3>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-prpm-accent mb-3">Before PRPM</h4>
                <ol className="list-decimal list-inside text-gray-300 space-y-2 text-sm">
                  <li>Search GitHub for "kiro frontend" steering files</li>
                  <li>Find a repo, clone it, browse <code className="text-prpm-accent bg-prpm-dark px-1.5 py-0.5 rounded text-xs">.kiro/steering/</code></li>
                  <li>Copy frontend files manually to your project</li>
                  <li>Search for "kiro backend" steering files</li>
                  <li>Clone another repo, copy backend files</li>
                  <li>Search for "kiro testing" steering files</li>
                  <li>Clone third repo, copy testing files</li>
                  <li>Manually organize all files into correct domains</li>
                  <li>Test in your project, debug conflicts</li>
                  <li>Add reminders to check repos for updates</li>
                </ol>
                <p className="text-gray-400 text-sm mt-3 mb-0"><strong>Time:</strong> 30-45 minutes, no guarantee files work together</p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-prpm-accent mb-3">With PRPM</h4>
                <pre className="bg-prpm-dark border border-prpm-border/50 rounded-lg p-4 text-sm mb-3"><code className="text-gray-300 font-mono">{`# Complete full-stack Kiro setup
prpm install @prpm/kiro-fullstack

# Or individual packages
prpm install @react/frontend-patterns @backend/rest-api @testing/integration

# Automatically organized in correct domains
# Check for updates later
prpm update`}</code></pre>
                <p className="text-gray-400 text-sm mb-0"><strong>Time:</strong> 30 seconds, curated packages tested to work together</p>
              </div>
            </div>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Building the Kiro Ecosystem</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Kiro is a newer tool, which means now is the perfect time to establish good discovery practices. PRPM offers the infrastructure the Kiro community needs:
          </p>

          <div className="not-prose mb-16">
            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-0">
              <li><strong className="text-white">For authors:</strong> Publish once, reach all Kiro users with analytics and feedback</li>
              <li><strong className="text-white">For users:</strong> Discover quality steering files without hunting through GitHub</li>
              <li><strong className="text-white">For teams:</strong> Share internal patterns easily while keeping sensitive ones private</li>
              <li><strong className="text-white">For the community:</strong> Build a shared knowledge base that grows with the ecosystem</li>
            </ul>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Early adoption of centralized package management will shape how the Kiro ecosystem develops. PRPM is ready to be that foundation.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Getting Started</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Ready to bring package management to Kiro? Here's how:
          </p>

          <div className="not-prose bg-gradient-to-br from-prpm-accent/20 via-prpm-dark-card to-prpm-dark border border-prpm-accent/50 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Quick Start</h3>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">1</div>
                  <h4 className="text-lg font-semibold text-white">Install PRPM</h4>
                </div>
                <pre className="bg-prpm-dark border border-prpm-border/50 rounded-lg p-4 ml-11"><code className="text-sm text-gray-300 font-mono">npm install -g prpm</code></pre>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">2</div>
                  <h4 className="text-lg font-semibold text-white">Search Kiro Packages</h4>
                </div>
                <pre className="bg-prpm-dark border border-prpm-border/50 rounded-lg p-4 ml-11"><code className="text-sm text-gray-300 font-mono">{`prpm search "react" --format kiro
# Or browse at prpm.dev/search?format=kiro`}</code></pre>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">3</div>
                  <h4 className="text-lg font-semibold text-white">Test in Playground</h4>
                </div>
                <pre className="bg-prpm-dark border border-prpm-border/50 rounded-lg p-4 ml-11"><code className="text-sm text-gray-300 font-mono">prpm playground @package "your test input"</code></pre>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">4</div>
                  <h4 className="text-lg font-semibold text-white">Install</h4>
                </div>
                <pre className="bg-prpm-dark border border-prpm-border/50 rounded-lg p-4 ml-11"><code className="text-sm text-gray-300 font-mono">prpm install @package</code></pre>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">5</div>
                  <h4 className="text-lg font-semibold text-white">Stay Updated</h4>
                </div>
                <pre className="bg-prpm-dark border border-prpm-border/50 rounded-lg p-4 ml-11"><code className="text-sm text-gray-300 font-mono">prpm update</code></pre>
              </div>
            </div>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-accent/10 to-prpm-dark border border-prpm-accent/30 rounded-xl p-8 mb-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Be Part of the Kiro Ecosystem</h3>
            <p className="text-gray-300 mb-6">First centralized marketplace for Kiro steering files with package management</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/search?format=kiro"
                className="px-8 py-3 bg-prpm-accent hover:bg-prpm-accent/80 text-white font-semibold rounded-lg transition-colors"
              >
                Browse Kiro Packages
              </Link>
              <a
                href="https://docs.prpm.dev"
                className="px-8 py-3 bg-prpm-dark-card hover:bg-prpm-dark border border-prpm-border hover:border-prpm-accent text-gray-300 font-semibold rounded-lg transition-colors"
              >
                Publish Your Steering Files
              </a>
            </div>
          </div>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-4">Related Posts</h2>

            <ul className="list-disc ml-6 text-gray-300 space-y-2 mb-0">
              <li><Link href="/blog/discovering-claude-skills-prpm-vs-competition" className="text-prpm-accent hover:underline font-medium">Discovering Claude Skills: PRPM vs The Competition</Link></li>
              <li><Link href="/blog/discovering-cursor-rules" className="text-prpm-accent hover:underline font-medium">Finding the Best Cursor Rules: Beyond cursor.directory</Link></li>
              <li><Link href="/blog/kiro-deep-dive" className="text-prpm-accent hover:underline font-medium">Kiro Steering Files: A Technical Deep Dive</Link></li>
            </ul>
          </div>
        </div>
      </article>

      <BlogFooter postTitle="Discovering Kiro Steering Rules: Why PRPM Wins" postUrl="/blog/discovering-kiro-steering-rules" />
    </main>
  )
}
