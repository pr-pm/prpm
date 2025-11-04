import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "GitHub Copilot Instructions Discovery: The PRPM Advantage - PRPM",
  description: "How PRPM improves Copilot instructions discovery beyond scattered Gists and GitHub repos. Get CLI install, version control, and testing.",
  openGraph: {
    title: "GitHub Copilot Instructions Discovery: The PRPM Advantage",
    description: "Centralized marketplace for Copilot instructions with package management, testing, and format conversion.",
  },
}

export default function DiscoveringCopilotInstructionsPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['GitHub Copilot', 'Discovery', 'Marketplace']}
          title="GitHub Copilot Instructions Discovery: The PRPM Advantage"
          subtitle="From scattered Gists and repos to unified package management"
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
              GitHub Copilot's custom instructions let you shape AI behavior for your codebase. But finding quality instructions means hunting through Gists, GitHub repos, Reddit threads, and internal wikis. PRPM brings centralized discovery and package management to Copilot instructions.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Problem: Fragmented Discovery</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            GitHub Copilot supports custom instructions through <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded text-sm">.github/copilot-instructions.md</code> files. This is powerful—you can guide Copilot to follow your team's conventions, use specific libraries, or avoid certain patterns.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            But where do you find good instructions? The ecosystem is scattered:
          </p>

          <div className="not-prose mb-16">
            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-0">
              <li><strong className="text-white">GitHub Gists:</strong> Developers share instructions as Gists, hard to search or organize</li>
              <li><strong className="text-white">Public repos:</strong> Some repos have <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded text-xs">.github/copilot-instructions.md</code> you can copy</li>
              <li><strong className="text-white">Reddit/HackerNews:</strong> Occasional threads where users share their setups</li>
              <li><strong className="text-white">Blog posts:</strong> Tutorials with example instructions buried in prose</li>
              <li><strong className="text-white">Internal wikis:</strong> Teams document their own instructions privately</li>
            </ul>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            No unified search. No quality vetting. No versioning. It's like package management before npm existed.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Current Discovery Methods</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">1. GitHub Gists</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Many developers share Copilot instructions as Gists. You search for "copilot instructions" + your tech stack, find relevant Gists, read through them, copy what looks useful.
            </p>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
              <h4 className="text-lg font-bold text-white mb-3">Problems:</h4>
              <ul className="list-disc ml-6 text-gray-300 space-y-2 text-sm mb-0">
                <li>No unified search across all Gists</li>
                <li>No ratings or quality indicators</li>
                <li>Gists rarely updated once published</li>
                <li>Hard to discover related instructions</li>
                <li>No way to test before using</li>
              </ul>
            </div>

            <p className="text-gray-300 leading-relaxed mb-0">
              Gists are convenient for quick sharing, but they're not a discovery platform.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">2. Public GitHub Repositories</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Some developers browse popular open source repos to see what Copilot instructions they use. Copy the file, adapt to your project.
            </p>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
              <h4 className="text-lg font-bold text-white mb-3">Problems:</h4>
              <ul className="list-disc ml-6 text-gray-300 space-y-2 text-sm mb-0">
                <li>Only works if repo has instructions file</li>
                <li>Instructions often project-specific, not reusable</li>
                <li>No way to know which repos have good instructions</li>
                <li>Manually checking repos is time-consuming</li>
                <li>Instructions change without notification</li>
              </ul>
            </div>

            <p className="text-gray-300 leading-relaxed mb-0">
              Useful for inspiration, but not scalable for discovery.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">3. Community Forums & Social Media</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Reddit's r/github and r/programming, HackerNews, Twitter—people occasionally share Copilot instruction tips and full configurations.
            </p>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
              <h4 className="text-lg font-bold text-white mb-3">Problems:</h4>
              <ul className="list-disc ml-6 text-gray-300 space-y-2 text-sm mb-0">
                <li>Content gets buried in feeds</li>
                <li>No persistent, searchable database</li>
                <li>Instructions pasted as text (formatting issues)</li>
                <li>No follow-up or maintenance</li>
                <li>Hard to find later when you need them</li>
              </ul>
            </div>

            <p className="text-gray-300 leading-relaxed mb-0">
              Good for trending tips, terrible for long-term discovery.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The PRPM Solution</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            PRPM treats Copilot instructions like first-class packages. Centralized search, CLI installation, version control, testing—everything you'd expect from modern package management.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">1. Centralized Marketplace</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Search all published Copilot instructions in one place. Filter by language, framework, use case.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Search for Next.js instructions
prpm search "next.js" --format copilot

# Search for TypeScript best practices
prpm search "typescript" --format copilot

# Browse all Copilot packages
prpm search --format copilot`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              Or use <Link href="/search?format=copilot" className="text-prpm-accent hover:underline font-medium">web search</Link> with filters, ratings, and download counts visible.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">2. CLI Installation</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Install Copilot instructions directly to <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded text-sm">.github/copilot-instructions.md</code> with one command.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Install Next.js Copilot instructions
prpm install @nextjs/app-router-copilot

# Install TypeScript strict mode instructions
prpm install @typescript/strict-copilot

# Install complete web dev collection
prpm install @prpm/copilot-webdev`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              PRPM handles file creation, merging if instructions already exist, and proper formatting automatically.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">3. Version Control & Updates</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Every package has semantic versioning. Get changelogs, update when you're ready.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Check for updates
prpm outdated

# Shows:
# @nextjs/app-router-copilot: 1.2.0 → 1.3.0 (Added: Server Actions patterns)
# @react/hooks-copilot: 2.0.1 → 2.1.0 (Updated: React 19 compatibility)

# Update specific package
prpm update @nextjs/app-router-copilot

# Update all Copilot packages
prpm update --format copilot`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              No more manually checking Gists or repos for updates. PRPM notifies you when packages improve.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">4. Testing Playground</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Test Copilot instructions with real AI models before installing. See how they affect AI output.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Test Next.js instructions
prpm playground @nextjs/app-router-copilot "Create a server component with data fetching"

# Compare with/without instructions
prpm playground @nextjs/app-router-copilot "Create server component" --compare

# Interactive testing
prpm playground @react/hooks-copilot --interactive`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              Or use the <Link href="/playground" className="text-prpm-accent hover:underline font-medium">web playground</Link> to test with Claude or GPT-4 before committing to installation.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">5. Format Conversion</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Found great Copilot instructions but your team uses Cursor? PRPM converts between formats automatically.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Install Copilot instructions as Cursor rule
prpm install @nextjs/app-router-copilot --format cursor

# Same package, different editors
prpm install @nextjs/app-router-copilot --format claude
prpm install @nextjs/app-router-copilot --format windsurf

# Check available formats
prpm info @nextjs/app-router-copilot`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              Cross-editor compatibility means packages aren't locked to Copilot. One registry, all editors.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">6. Quality Metrics & Community Feedback</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Every package shows quality indicators: downloads, ratings, test results, verified authors.
            </p>

            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-0">
              <li><strong className="text-white">Download counts:</strong> See which instructions are trusted</li>
              <li><strong className="text-white">Star ratings:</strong> Community feedback on quality</li>
              <li><strong className="text-white">Playground tests:</strong> How many users tested, helpfulness ratings</li>
              <li><strong className="text-white">Verified authors:</strong> Trust signals for maintainers</li>
              <li><strong className="text-white">Last updated:</strong> Active maintenance indicators</li>
            </ul>
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
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Finding instructions</td>
                  <td className="px-4 py-4 border border-prpm-border">Search Gists, GitHub, Reddit</td>
                  <td className="px-4 py-4 border border-prpm-border text-prpm-accent">prpm search --format copilot</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Installation</td>
                  <td className="px-4 py-4 border border-prpm-border">Copy-paste manually</td>
                  <td className="px-4 py-4 border border-prpm-border text-prpm-accent">prpm install @package</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Quality assessment</td>
                  <td className="px-4 py-4 border border-prpm-border">Read code, hope it's good</td>
                  <td className="px-4 py-4 border border-prpm-border text-prpm-accent">Ratings, downloads, tests</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Testing</td>
                  <td className="px-4 py-4 border border-prpm-border">Install and try</td>
                  <td className="px-4 py-4 border border-prpm-border text-prpm-accent">Playground before install</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Updates</td>
                  <td className="px-4 py-4 border border-prpm-border">Manually check sources</td>
                  <td className="px-4 py-4 border border-prpm-border text-prpm-accent">prpm update</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Format conversion</td>
                  <td className="px-4 py-4 border border-prpm-border">Manual rewrite</td>
                  <td className="px-4 py-4 border border-prpm-border text-prpm-accent">--format flag</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Team sharing</td>
                  <td className="px-4 py-4 border border-prpm-border">Share Gist links/files</td>
                  <td className="px-4 py-4 border border-prpm-border text-prpm-accent">Share install commands</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Real-World Example</h2>
          </div>

          <div className="not-prose space-y-8 mb-16">
            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Scenario: Setting Up Copilot for React + TypeScript Project</h3>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-prpm-accent mb-3">Before PRPM</h4>
                <ol className="list-decimal list-inside text-gray-300 space-y-2 text-sm">
                  <li>Search Google for "GitHub Copilot React instructions"</li>
                  <li>Find a blog post, copy example instructions</li>
                  <li>Create <code className="text-prpm-accent bg-prpm-dark px-1.5 py-0.5 rounded text-xs">.github/copilot-instructions.md</code></li>
                  <li>Paste instructions, test Copilot</li>
                  <li>Search for "Copilot TypeScript instructions"</li>
                  <li>Find a Gist, copy and append to file</li>
                  <li>Search for "Copilot testing instructions"</li>
                  <li>Find another Gist, merge with existing instructions</li>
                  <li>File now has conflicts, fix manually</li>
                  <li>Test again, hope it works</li>
                  <li>Bookmark sources for future updates (rarely checked)</li>
                </ol>
                <p className="text-gray-400 text-sm mt-3 mb-0"><strong>Time:</strong> 20-30 minutes, no guarantee of quality or consistency</p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-prpm-accent mb-3">With PRPM</h4>
                <pre className="bg-prpm-dark border border-prpm-border/50 rounded-lg p-4 text-sm mb-3"><code className="text-gray-300 font-mono">{`# Test packages first
prpm playground @react/hooks-copilot "Create useDebounce hook"
prpm playground @typescript/strict-copilot "Create typed API client"

# Install complete collection
prpm install @prpm/copilot-react-ts

# Or individual packages
prpm install @react/hooks-copilot @typescript/strict-copilot @testing/vitest-copilot

# Check for updates later
prpm update`}</code></pre>
                <p className="text-gray-400 text-sm mb-0"><strong>Time:</strong> 2-3 minutes including testing, curated packages designed to work together</p>
              </div>
            </div>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Getting Started</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Ready to bring package management to GitHub Copilot? Here's how:
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
                  <h4 className="text-lg font-semibold text-white">Search Copilot Instructions</h4>
                </div>
                <pre className="bg-prpm-dark border border-prpm-border/50 rounded-lg p-4 ml-11"><code className="text-sm text-gray-300 font-mono">{`prpm search "react" --format copilot
# Or browse at prpm.dev/search?format=copilot`}</code></pre>
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
                  <h4 className="text-lg font-semibold text-white">Keep Updated</h4>
                </div>
                <pre className="bg-prpm-dark border border-prpm-border/50 rounded-lg p-4 ml-11"><code className="text-sm text-gray-300 font-mono">prpm update</code></pre>
              </div>
            </div>
          </div>

          <div className="not-prose mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Popular Copilot Instructions to Try</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-4">
                <h4 className="text-lg font-semibold text-white mb-2">React + Hooks</h4>
                <p className="text-sm text-gray-400 mb-3">Modern React patterns</p>
                <code className="text-xs text-prpm-accent">prpm install @react/hooks-copilot</code>
              </div>

              <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-4">
                <h4 className="text-lg font-semibold text-white mb-2">TypeScript Strict</h4>
                <p className="text-sm text-gray-400 mb-3">Type-safe coding</p>
                <code className="text-xs text-prpm-accent">prpm install @typescript/strict-copilot</code>
              </div>

              <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-4">
                <h4 className="text-lg font-semibold text-white mb-2">Testing Best Practices</h4>
                <p className="text-sm text-gray-400 mb-3">Vitest + Testing Library</p>
                <code className="text-xs text-prpm-accent">prpm install @testing/vitest-copilot</code>
              </div>

              <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-4">
                <h4 className="text-lg font-semibold text-white mb-2">Web Dev Complete</h4>
                <p className="text-sm text-gray-400 mb-3">Full stack collection</p>
                <code className="text-xs text-prpm-accent">prpm install @prpm/copilot-webdev</code>
              </div>
            </div>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-accent/10 to-prpm-dark border border-prpm-accent/30 rounded-xl p-8 mb-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Upgrade Your Copilot Workflow</h3>
            <p className="text-gray-300 mb-6">Centralized marketplace with package management, testing, and format conversion</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/search?format=copilot"
                className="px-8 py-3 bg-prpm-accent hover:bg-prpm-accent/80 text-white font-semibold rounded-lg transition-colors"
              >
                Browse Copilot Instructions
              </Link>
              <a
                href="https://docs.prpm.dev"
                className="px-8 py-3 bg-prpm-dark-card hover:bg-prpm-dark border border-prpm-border hover:border-prpm-accent text-gray-300 font-semibold rounded-lg transition-colors"
              >
                Publish Your Instructions
              </a>
            </div>
          </div>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-4">Related Posts</h2>

            <ul className="list-disc ml-6 text-gray-300 space-y-2 mb-0">
              <li><Link href="/blog/discovering-claude-skills-prpm-vs-competition" className="text-prpm-accent hover:underline font-medium">Discovering Claude Skills: PRPM vs The Competition</Link></li>
              <li><Link href="/blog/discovering-cursor-rules" className="text-prpm-accent hover:underline font-medium">Finding the Best Cursor Rules: Beyond cursor.directory</Link></li>
              <li><Link href="/blog/copilot-deep-dive" className="text-prpm-accent hover:underline font-medium">GitHub Copilot Instructions: A Deep Dive</Link></li>
            </ul>
          </div>
        </div>
      </article>

      <BlogFooter postTitle="GitHub Copilot Instructions Discovery: The PRPM Advantage" postUrl="/blog/discovering-copilot-instructions" />
    </main>
  )
}
