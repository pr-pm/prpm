import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Discovering Claude Skills, Agents & Commands: PRPM vs The Competition - PRPM",
  description: "How PRPM compares to ctx.directory, SkillsMP, and Claude Plugins for discovering Claude skills. Learn why unified package management beats scattered marketplaces.",
  openGraph: {
    title: "Discovering Claude Skills: PRPM vs The Competition",
    description: "Compare PRPM to ctx.directory, SkillsMP, and Claude Plugins for discovering and installing Claude skills, agents, and commands.",
  },
}

export default function DiscoveringClaudeSkillsPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Claude', 'Discovery', 'Comparison']}
          title="Discovering Claude Skills, Agents & Commands: PRPM vs The Competition"
          subtitle="How PRPM stacks up against ctx.directory, SkillsMP, and Claude Plugins for finding and installing Claude packages"
          author="PRPM Team"
          date="November 4, 2025"
          readTime="10 min read"
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
              Claude Desktop and Claude Code introduced skills, agents, and commands—powerful ways to extend AI capabilities. But finding quality packages means navigating multiple marketplaces with different formats and installation methods. This post compares PRPM to ctx.directory, SkillsMP, and Claude Plugins to show why unified package management wins.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Problem: Scattered Discovery</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            You want to add a code review skill to Claude. Where do you look? You've got options:
          </p>

          <div className="not-prose mb-16">
            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-0">
              <li><strong className="text-white">ctx.directory</strong> - Browse skills by creator, copy markdown files manually</li>
              <li><strong className="text-white">SkillsMP</strong> - Search a marketplace, download individual skills</li>
              <li><strong className="text-white">Claude Plugins</strong> - Discover plugins (not skills), different installation flow</li>
              <li><strong className="text-white">GitHub repositories</strong> - Search repos, clone, figure out structure yourself</li>
              <li><strong className="text-white">Discord/Reddit</strong> - Ask around, hope someone shares their setup</li>
            </ul>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Each platform has its own discovery mechanism, format, and installation process. No unified search. No version control. No way to know which packages are maintained or compatible with your setup. It's the equivalent of installing npm packages by manually downloading files from different websites.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Competitors: Detailed Comparison</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">ctx.directory</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              <a href="https://ctx.directory" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline font-medium">ctx.directory</a> is a creator-focused marketplace where developers publish their Claude skills organized by author profile.
            </p>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
              <h4 className="text-lg font-bold text-white mb-4">What ctx.directory Does Well</h4>
              <ul className="list-disc ml-6 text-gray-300 space-y-2">
                <li>Clean, browseable interface organized by creator</li>
                <li>Good for discovering individual authors' collections</li>
                <li>Shows skill descriptions and examples</li>
              </ul>
            </div>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
              <h4 className="text-lg font-bold text-white mb-4">What's Missing</h4>
              <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-0">
                <li><strong className="text-white">No CLI installation:</strong> You copy-paste markdown files manually into <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded text-sm">.claude/skills/</code></li>
                <li><strong className="text-white">No version control:</strong> Skills update, but you won't know unless you check back</li>
                <li><strong className="text-white">No format conversion:</strong> Claude skills only—can't use them in Cursor or other editors</li>
                <li><strong className="text-white">Limited search:</strong> Browse by creator, not by use case or category</li>
                <li><strong className="text-white">No dependency management:</strong> If a skill relies on another, you're on your own</li>
                <li><strong className="text-white">No quality metrics:</strong> No ratings, downloads, or community feedback visible</li>
              </ul>
            </div>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">SkillsMP (Skills Marketplace)</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              <a href="https://skillsmp.com" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline font-medium">SkillsMP</a> is a dedicated marketplace for Claude skills with search and categorization.
            </p>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
              <h4 className="text-lg font-bold text-white mb-4">What SkillsMP Does Well</h4>
              <ul className="list-disc ml-6 text-gray-300 space-y-2">
                <li>Searchable marketplace with categories</li>
                <li>Skill ratings and downloads visible</li>
                <li>Preview skill content before downloading</li>
              </ul>
            </div>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
              <h4 className="text-lg font-bold text-white mb-4">What's Missing</h4>
              <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-0">
                <li><strong className="text-white">Manual installation:</strong> Download files, move them to <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded text-sm">.claude/skills/</code> yourself</li>
                <li><strong className="text-white">No CLI tooling:</strong> Can't install from terminal or automate setup</li>
                <li><strong className="text-white">No version updates:</strong> You download once, updates require manual re-download</li>
                <li><strong className="text-white">Claude-only:</strong> Skills locked to Claude format, can't convert to Cursor rules</li>
                <li><strong className="text-white">No collections:</strong> Can't install curated sets of skills at once</li>
                <li><strong className="text-white">No testing:</strong> No playground to try skills before installing</li>
              </ul>
            </div>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Claude Plugins Marketplace</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              <a href="https://claude-plugins.dev" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline font-medium">Claude Plugins</a> focuses on executable plugins (MCP-based tools) rather than skills/agents.
            </p>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
              <h4 className="text-lg font-bold text-white mb-4">What Claude Plugins Does Well</h4>
              <ul className="list-disc ml-6 text-gray-300 space-y-2">
                <li>Specialized marketplace for MCP plugins</li>
                <li>Clear plugin descriptions and capabilities</li>
                <li>Installation instructions for each plugin</li>
              </ul>
            </div>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-8">
              <h4 className="text-lg font-bold text-white mb-4">Why It's Different</h4>
              <p className="text-gray-300 mb-4">
                Claude Plugins solves a <strong className="text-white">different problem</strong>. Plugins are executable code that extend Claude's capabilities (like connecting to Figma or Slack). Skills are AI instructions written in markdown.
              </p>
              <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-0">
                <li><strong className="text-white">Plugins = Code:</strong> Require installation, API keys, permissions</li>
                <li><strong className="text-white">Skills = Instructions:</strong> Pure text, no execution environment needed</li>
              </ul>
              <p className="text-gray-300 mt-4 mb-0">
                PRPM focuses on the instruction layer (skills, agents, rules), not the executable layer (plugins). Both are valuable, but they serve different purposes. Read our <Link href="/blog/prpm-vs-plugins" className="text-prpm-accent hover:underline font-medium">detailed comparison post</Link> for more.
              </p>
            </div>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The PRPM Advantage</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            PRPM treats Claude skills, agents, and commands like npm packages. One unified system for discovery, installation, updates, and format conversion.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">1. CLI Installation</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Install any Claude skill with a single command. PRPM handles file placement, format conversion, and dependencies automatically.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Install a Claude skill
prpm install @code-and-craft/code-reviewer

# Install to specific editor format
prpm install @code-and-craft/code-reviewer --format cursor

# Install multiple packages at once
prpm install @claude/python-expert @claude/test-generator

# Install from a collection
prpm install @prpm/claude-essentials`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              No manual copying. No figuring out directory structures. Just install and use.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">2. Version Control & Updates</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Every PRPM package has semantic versioning. Check for updates, lock to specific versions, or auto-update with confidence.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Check for updates
prpm outdated

# Update all packages
prpm update

# Update specific package
prpm update @code-and-craft/code-reviewer

# Install specific version
prpm install @code-and-craft/code-reviewer@1.2.0`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              Package authors publish new versions, and you get a clear changelog showing what changed. Update when you're ready.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">3. Format Conversion</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Found a great Claude skill but use Cursor? PRPM automatically converts between formats so packages work across all AI editors.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Install Claude skill as Cursor rule
prpm install @claude/python-expert --format cursor

# Same package, different format
prpm install @claude/python-expert --format copilot

# Check available formats
prpm info @claude/python-expert`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              One package registry, multiple editor formats. Packages published in any format can be installed in any editor.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">4. Test Before Installing</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              PRPM Playground lets you test any Claude skill with real AI models before installing. Compare results, see actual outputs, make informed decisions.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Test in CLI with Claude Sonnet
prpm playground @code-and-craft/code-reviewer "Review this: console.log('test')"

# Test interactively
prpm playground @claude/brainstorm-assistant --interactive

# Compare with/without package
prpm playground @claude/optimizer "Improve this function" --compare`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              Or use the <Link href="/playground" className="text-prpm-accent hover:underline font-medium">web playground</Link> to test any package in your browser. See our <Link href="/blog/playground-launch" className="text-prpm-accent hover:underline font-medium">playground announcement</Link> for details.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">5. Collections for Curated Sets</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Install curated collections of Claude skills designed to work together. Perfect for onboarding or setting up new projects.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Install Claude essentials collection
prpm install @prpm/claude-essentials

# Python development collection
prpm install @prpm/python-dev-claude

# Code review toolkit
prpm install @prpm/review-suite`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              Collections bundle 5-10 packages that complement each other, giving you a complete setup in one command.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">6. Quality Scoring & Analytics</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Every package on PRPM shows quality metrics: downloads, ratings, playground test results, and verified authors.
            </p>

            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
              <li><strong className="text-white">Download counts:</strong> See which packages the community trusts</li>
              <li><strong className="text-white">Star ratings:</strong> User feedback on package quality</li>
              <li><strong className="text-white">Test results:</strong> How many users tested in playground, helpfulness ratings</li>
              <li><strong className="text-white">Verified authors:</strong> Badge for PRPM+ subscribers and known contributors</li>
              <li><strong className="text-white">Last updated:</strong> See if packages are actively maintained</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-0">
              Make informed decisions based on real community data, not just descriptions.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Feature Comparison Table</h2>
          </div>

          <div className="not-prose mb-8">
            <table className="w-full border-collapse text-gray-300">
              <thead className="border-b-2 border-prpm-border">
                <tr>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Feature</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">ctx.directory</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">SkillsMP</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">PRPM</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">CLI Installation</td>
                  <td className="px-4 py-4 border border-prpm-border text-red-400">✗ Manual copy-paste</td>
                  <td className="px-4 py-4 border border-prpm-border text-red-400">✗ Manual download</td>
                  <td className="px-4 py-4 border border-prpm-border text-green-400">✓ One command</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Version Control</td>
                  <td className="px-4 py-4 border border-prpm-border text-red-400">✗ No versioning</td>
                  <td className="px-4 py-4 border border-prpm-border text-red-400">✗ No versioning</td>
                  <td className="px-4 py-4 border border-prpm-border text-green-400">✓ Semantic versioning</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Format Conversion</td>
                  <td className="px-4 py-4 border border-prpm-border text-red-400">✗ Claude only</td>
                  <td className="px-4 py-4 border border-prpm-border text-red-400">✗ Claude only</td>
                  <td className="px-4 py-4 border border-prpm-border text-green-400">✓ All formats</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Testing Playground</td>
                  <td className="px-4 py-4 border border-prpm-border text-red-400">✗ No testing</td>
                  <td className="px-4 py-4 border border-prpm-border text-red-400">✗ No testing</td>
                  <td className="px-4 py-4 border border-prpm-border text-green-400">✓ Web & CLI</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Collections</td>
                  <td className="px-4 py-4 border border-prpm-border text-red-400">✗ Individual only</td>
                  <td className="px-4 py-4 border border-prpm-border text-red-400">✗ Individual only</td>
                  <td className="px-4 py-4 border border-prpm-border text-green-400">✓ Curated sets</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Quality Metrics</td>
                  <td className="px-4 py-4 border border-prpm-border text-yellow-400">~ Basic info</td>
                  <td className="px-4 py-4 border border-prpm-border text-yellow-400">~ Ratings/downloads</td>
                  <td className="px-4 py-4 border border-prpm-border text-green-400">✓ Full analytics</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Package Updates</td>
                  <td className="px-4 py-4 border border-prpm-border text-red-400">✗ Manual check</td>
                  <td className="px-4 py-4 border border-prpm-border text-red-400">✗ Manual check</td>
                  <td className="px-4 py-4 border border-prpm-border text-green-400">✓ prpm update</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border font-semibold">Search & Discovery</td>
                  <td className="px-4 py-4 border border-prpm-border text-yellow-400">~ By creator</td>
                  <td className="px-4 py-4 border border-prpm-border text-green-400">✓ Searchable</td>
                  <td className="px-4 py-4 border border-prpm-border text-green-400">✓ Full search</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Real-World Workflow Comparison</h2>
          </div>

          <div className="not-prose space-y-8 mb-16">
            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Scenario: Setting Up Code Review Skills</h3>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-prpm-accent mb-3">With ctx.directory or SkillsMP</h4>
                <ol className="list-decimal list-inside text-gray-300 space-y-2 text-sm">
                  <li>Browse marketplace website</li>
                  <li>Read descriptions, try to find the right skill</li>
                  <li>Copy skill markdown content</li>
                  <li>Create <code className="text-prpm-accent bg-prpm-dark px-1.5 py-0.5 rounded text-xs">.claude/skills/code-reviewer.md</code> manually</li>
                  <li>Paste content, save file</li>
                  <li>Restart Claude to load skill</li>
                  <li>Try it, hope it works</li>
                  <li>If it doesn't, repeat from step 1 with different skill</li>
                  <li>Come back in 2 weeks, manually check if skill updated</li>
                </ol>
                <p className="text-gray-400 text-sm mt-3 mb-0"><strong>Time:</strong> 10-15 minutes per skill, no guarantee of quality</p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-prpm-accent mb-3">With PRPM</h4>
                <pre className="bg-prpm-dark border border-prpm-border/50 rounded-lg p-4 text-sm mb-3"><code className="text-gray-300 font-mono">{`# Test first
prpm playground @code-and-craft/code-reviewer "Review console.log('test')"

# Looks good, install it
prpm install @code-and-craft/code-reviewer

# Install related packages
prpm install @prpm/review-suite

# Check for updates later
prpm update`}</code></pre>
                <p className="text-gray-400 text-sm mb-0"><strong>Time:</strong> 2-3 minutes, tested before installing, auto-updates</p>
              </div>
            </div>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">When to Use Each Platform</h2>
          </div>

          <div className="not-prose space-y-6 mb-16">
            <div className="bg-prpm-dark-card/50 border border-prpm-border/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-3">Use ctx.directory when...</h3>
              <ul className="list-disc ml-6 text-gray-300 space-y-2 text-sm mb-0">
                <li>You want to explore specific creators' work</li>
                <li>You're okay with manual copy-paste installation</li>
                <li>You only use Claude Desktop/Code (no other editors)</li>
                <li>You don't need version control or updates</li>
              </ul>
            </div>

            <div className="bg-prpm-dark-card/50 border border-prpm-border/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-3">Use SkillsMP when...</h3>
              <ul className="list-disc ml-6 text-gray-300 space-y-2 text-sm mb-0">
                <li>You want a searchable marketplace for Claude skills</li>
                <li>You're okay with manual download and installation</li>
                <li>You value ratings and community feedback</li>
                <li>You're committed to Claude-only workflow</li>
              </ul>
            </div>

            <div className="bg-prpm-dark-card/50 border border-prpm-accent/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-prpm-accent mb-3">Use PRPM when...</h3>
              <ul className="list-disc ml-6 text-gray-300 space-y-2 text-sm mb-0">
                <li>You want CLI-based package management (like npm)</li>
                <li>You use multiple AI editors (Cursor, Claude, Copilot, etc.)</li>
                <li>You need version control and automatic updates</li>
                <li>You want to test packages before installing</li>
                <li>You're managing packages across teams or projects</li>
                <li>You need format conversion between different editors</li>
                <li>You value unified search across all package types</li>
              </ul>
            </div>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Getting Started with PRPM</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Ready to try unified package management for Claude skills? Here's how to get started:
          </p>

          <div className="not-prose bg-gradient-to-br from-prpm-accent/20 via-prpm-dark-card to-prpm-dark border border-prpm-accent/50 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Quick Start</h3>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">1</div>
                  <h4 className="text-lg font-semibold text-white">Install PRPM CLI</h4>
                </div>
                <pre className="bg-prpm-dark border border-prpm-border/50 rounded-lg p-4 ml-11"><code className="text-sm text-gray-300 font-mono">npm install -g prpm</code></pre>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">2</div>
                  <h4 className="text-lg font-semibold text-white">Search for Claude Skills</h4>
                </div>
                <pre className="bg-prpm-dark border border-prpm-border/50 rounded-lg p-4 ml-11"><code className="text-sm text-gray-300 font-mono">{`prpm search "code review" --format claude
# Or browse at prpm.dev/search?format=claude`}</code></pre>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">3</div>
                  <h4 className="text-lg font-semibold text-white">Test in Playground</h4>
                </div>
                <pre className="bg-prpm-dark border border-prpm-border/50 rounded-lg p-4 ml-11"><code className="text-sm text-gray-300 font-mono">{`prpm playground @author/skill "your test input"
# Or use web playground at prpm.dev/playground`}</code></pre>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">4</div>
                  <h4 className="text-lg font-semibold text-white">Install Package</h4>
                </div>
                <pre className="bg-prpm-dark border border-prpm-border/50 rounded-lg p-4 ml-11"><code className="text-sm text-gray-300 font-mono">{`prpm install @author/skill
# Automatically places in .claude/skills/`}</code></pre>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">5</div>
                  <h4 className="text-lg font-semibold text-white">Keep Updated</h4>
                </div>
                <pre className="bg-prpm-dark border border-prpm-border/50 rounded-lg p-4 ml-11"><code className="text-sm text-gray-300 font-mono">{`prpm update
# Check and install updates for all packages`}</code></pre>
              </div>
            </div>
          </div>

          <div className="not-prose mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Popular Claude Skills to Try</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-4">
                <h4 className="text-lg font-semibold text-white mb-2">Code Review</h4>
                <p className="text-sm text-gray-400 mb-3">Expert code review with security focus</p>
                <code className="text-xs text-prpm-accent">prpm install @code-and-craft/code-reviewer</code>
              </div>

              <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-4">
                <h4 className="text-lg font-semibold text-white mb-2">Test Generator</h4>
                <p className="text-sm text-gray-400 mb-3">Generate comprehensive unit tests</p>
                <code className="text-xs text-prpm-accent">prpm install @testing/unit-test-generator</code>
              </div>

              <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-4">
                <h4 className="text-lg font-semibold text-white mb-2">Documentation Writer</h4>
                <p className="text-sm text-gray-400 mb-3">Auto-generate API docs and READMEs</p>
                <code className="text-xs text-prpm-accent">prpm install @docs/api-documenter</code>
              </div>

              <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-4">
                <h4 className="text-lg font-semibold text-white mb-2">Claude Essentials</h4>
                <p className="text-sm text-gray-400 mb-3">Complete starter collection</p>
                <code className="text-xs text-prpm-accent">prpm install @prpm/claude-essentials</code>
              </div>
            </div>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-accent/10 to-prpm-dark border border-prpm-accent/30 rounded-xl p-8 mb-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Start Discovering Better</h3>
            <p className="text-gray-300 mb-6">2,100+ packages, unified search, CLI installation, format conversion, and testing playground</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/search?format=claude"
                className="px-8 py-3 bg-prpm-accent hover:bg-prpm-accent/80 text-white font-semibold rounded-lg transition-colors"
              >
                Browse Claude Skills
              </Link>
              <Link
                href="/playground"
                className="px-8 py-3 bg-prpm-dark-card hover:bg-prpm-dark border border-prpm-border hover:border-prpm-accent text-gray-300 font-semibold rounded-lg transition-colors"
              >
                Try the Playground
              </Link>
            </div>
          </div>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-4">Questions?</h2>

            <p className="text-gray-300 leading-relaxed text-lg mb-4">
              Wondering how PRPM compares for other AI editors? Check out our comparison posts:
            </p>

            <ul className="list-disc ml-6 text-gray-300 space-y-2 mb-4">
              <li><Link href="/blog/discovering-cursor-rules" className="text-prpm-accent hover:underline font-medium">Cursor Rules: PRPM vs cursor.directory</Link></li>
              <li><Link href="/blog/discovering-copilot-instructions" className="text-prpm-accent hover:underline font-medium">GitHub Copilot Instructions Discovery</Link></li>
              <li><Link href="/blog/prpm-vs-plugins" className="text-prpm-accent hover:underline font-medium">PRPM vs Claude Plugins: What's the Difference?</Link></li>
            </ul>

            <p className="text-gray-300 leading-relaxed text-lg mb-0">
              Have questions or feedback? <a href="https://twitter.com/prpm_dev" className="text-prpm-accent hover:underline font-medium">@prpm_dev</a> or <a href="mailto:hello@prpm.dev" className="text-prpm-accent hover:underline font-medium">hello@prpm.dev</a>
            </p>
          </div>
        </div>
      </article>

      <BlogFooter postTitle="Discovering Claude Skills, Agents & Commands: PRPM vs The Competition" postUrl="/blog/discovering-claude-skills-prpm-vs-competition" />
    </main>
  )
}
