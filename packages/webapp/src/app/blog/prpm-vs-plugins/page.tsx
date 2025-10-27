import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import Tag from '@/components/Tag'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata = {
  title: 'PRPM and Claude Plugins: Working Together',
  description: 'How PRPM complements Anthropic\'s Claude Code plugin system. Learn why cross-platform and platform-specific solutions strengthen the AI coding ecosystem.',
}

export default function PRPMvsPluginsPage() {
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-8">
      <Header showDashboard showAccount />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <BackLink href="/blog">← Back to Blog</BackLink>

        <BlogPostHeader
          tags={['PRPM', 'Explainer', 'Vision']}
          title="PRPM and Claude Plugins: Working Together"
          subtitle="How PRPM complements Anthropic's Claude Code plugin system. Learn why cross-platform and platform-specific solutions strengthen the AI coding ecosystem."
          author="PRPM Team"
          date="October 27, 2024"
          readTime="6 min read"
        />

        <article className="prose prose-invert prose-lg max-w-none">
          <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-r-lg p-6 mb-12">
            <p className="text-lg font-semibold text-blue-400 mb-2">TL;DR</p>
            <p className="text-gray-300 mb-0">
              Anthropic's Claude Code plugins represent the future of AI environments—deeply integrated, elegantly designed, and optimized for Claude users. PRPM takes inspiration from that approach and extends it across the entire AI coding ecosystem for cross-platform compatibility. They work better together.
            </p>
          </div>

          <p className="text-xl text-gray-300 leading-relaxed mb-12">
            One of the most common questions we get is: <strong>"Is PRPM just another plugins marketplace?"</strong> The short answer: We're complementary, not competing. Claude Code pioneered the structured AI package approach, and PRPM helps spread that pattern across all AI coding tools. Let's explore how they work together.
          </p>

          <h2 id="what-is-prpm" className="text-3xl font-bold text-white mt-12 mb-6 group scroll-mt-24">
            <a href="#what-is-prpm" className="inline-flex items-center gap-2 no-underline hover:no-underline">
              What is PRPM?
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-prpm-accent text-xl">🔗</span>
            </a>
          </h2>

          <div className="bg-prpm-accent/5 border-l-4 border-prpm-accent rounded-r-lg p-6 mb-6">
            <p className="text-prpm-accent font-bold text-lg mb-2">AI Knowledge as Code</p>
            <p className="text-gray-300 mb-0">
              PRPM treats prompts, rules, and AI context as <strong>first-class code assets</strong> — reusable, shareable, and version-controlled — just like your application dependencies.
            </p>
          </div>

          <div className="bg-prpm-dark-card border border-prpm-accent/30 rounded-lg p-6 my-8">
            <p className="text-prpm-accent font-semibold mb-2">PRPM manages:</p>
            <ul className="space-y-2 mb-0">
                <li>📝 <strong>AI instructions, rules, and context files</strong> (<code>.cursor/rules</code>, <code>SKILL.md</code>, <code>agents.md</code>)</li>
              <li>🎯 <strong>Plain text/markdown files</strong> that guide AI behavior</li>
              <li>🔄 <strong>Version controlled</strong> alongside your code</li>
              <li>🚀 <strong>Works immediately</strong> with existing AI tools (Cursor, Claude, Windsurf, etc.)</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold text-gray-200 mt-8 mb-4">Example:</h3>
          <pre className="bg-prpm-dark border border-prpm-border rounded-lg p-4 overflow-x-auto mb-12">
            <code>{`prpm install @patrickjs/react-typescript-rules
# Installs .cursor/rules/react-typescript.mdc
# Your AI now follows React best practices automatically`}</code>
          </pre>

          <h2 id="what-is-claude-plugins" className="text-3xl font-bold text-white mt-16 mb-6 group scroll-mt-24">
            <a href="#what-is-claude-plugins" className="inline-flex items-center gap-2 no-underline hover:no-underline">
              What Are Claude Code Plugins?
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-prpm-accent text-xl">🔗</span>
            </a>
          </h2>

          <p className="text-lg text-gray-300 mb-8">
            <strong>Claude Code got it right.</strong> Anthropic built an elegant plugin system that recognized a fundamental truth: AI assistants need structured, shareable instruction packages, not just traditional IDE extensions.
          </p>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 my-8">
            <p className="text-blue-400 font-semibold mb-2">Claude Code's Plugin System includes:</p>
            <ul className="space-y-2 mb-0">
              <li>🎯 <strong>Skills</strong> — AI instructions and prompts that guide Claude's behavior</li>
              <li>🤖 <strong>Agents</strong> — Multi-step task definitions for complex workflows</li>
              <li>⚡ <strong>Commands</strong> — Reusable AI workflows triggered on demand</li>
              <li>🔗 <strong>Hooks</strong> — Event-based triggers for contextual assistance</li>
              <li>🛠️ <strong>MCP Servers</strong> — Optional tool integrations when needed</li>
            </ul>
            <p className="text-sm text-gray-400 mt-4 mb-0">
              Claude plugins are <strong>declarative packages</strong> distributed via JSON-based marketplaces. They're not traditional "plugins" in the executable code sense—they're structured AI instruction packages, which is a brilliant approach that prioritizes safety and simplicity.
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 my-8">
            <p className="text-blue-400 font-semibold mb-3">💡 Bridge Between Ecosystems:</p>
            <p className="mb-2 text-gray-300">
              We designed PRPM to work seamlessly with Claude Code's plugin format. If you already have a <code>.claude/marketplace.json</code> file, just run <code>prpm publish</code> and PRPM will automatically convert and publish your package—no extra work required.
            </p>
            <p className="mb-0 text-gray-300 text-sm">
              This means you can publish to <em>both</em> Claude Code's marketplace (reaching Claude users) <em>and</em> PRPM (reaching users across all AI coding tools). We built this bridge intentionally to honor the great work Anthropic has done with Claude Code plugins.
            </p>
          </div>

          <h2 id="comparison" className="text-3xl font-bold text-white mt-16 mb-6 group scroll-mt-24">
            <a href="#comparison" className="inline-flex items-center gap-2 no-underline hover:no-underline">
              Side-by-Side Comparison
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-prpm-accent text-xl">🔗</span>
            </a>
          </h2>

          <div className="overflow-x-auto my-8">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-prpm-border">
                  <th className="text-left py-3 px-3 text-gray-300">Aspect</th>
                  <th className="text-left py-3 px-3 text-blue-400">Claude Code Plugins</th>
                  <th className="text-left py-3 px-3 text-prpm-accent">PRPM</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-prpm-border/50">
                  <td className="py-3 px-3 font-semibold">What</td>
                  <td className="py-3 px-3">AI instruction packages (Skills, Agents, Commands)</td>
                  <td className="py-3 px-3">AI instructions (text/markdown files)</td>
                </tr>
                <tr className="border-b border-prpm-border/50">
                  <td className="py-3 px-3 font-semibold">Platform</td>
                  <td className="py-3 px-3">Claude Code only (optimized integration)</td>
                  <td className="py-3 px-3">Cross-platform (Cursor, Claude, Windsurf, Continue)</td>
                </tr>
                <tr className="border-b border-prpm-border/50">
                  <td className="py-3 px-3 font-semibold">Where</td>
                  <td className="py-3 px-3">Claude Code config (global or project)</td>
                  <td className="py-3 px-3">Project directory (committed with code)</td>
                </tr>
                <tr className="border-b border-prpm-border/50">
                  <td className="py-3 px-3 font-semibold">Format</td>
                  <td className="py-3 px-3">JSON manifests + markdown files</td>
                  <td className="py-3 px-3">Markdown, text files (auto-converts)</td>
                </tr>
                <tr className="border-b border-prpm-border/50">
                  <td className="py-3 px-3 font-semibold">Best For</td>
                  <td className="py-3 px-3">Claude Code power users wanting deep integration</td>
                  <td className="py-3 px-3">Teams using multiple AI tools</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold">Distribution</td>
                  <td className="py-3 px-3">Claude plugin marketplaces</td>
                  <td className="py-3 px-3">Universal registry (prpm.dev)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 id="analogy" className="text-3xl font-bold text-white mt-16 mb-6 group scroll-mt-24">
            <a href="#analogy" className="inline-flex items-center gap-2 no-underline hover:no-underline">
              Think of It Like This
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-prpm-accent text-xl">🔗</span>
            </a>
          </h2>

          <div className="grid md:grid-cols-2 gap-6 my-10">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
              <h3 className="text-blue-400 text-xl font-bold mb-3 mt-0">Claude Code Plugins</h3>
              <p className="text-sm mb-2 text-gray-300">Like <strong>App Store apps</strong></p>
              <p className="mb-0 text-gray-300 text-sm">Curated, polished packages optimized for Claude Code. Pioneered the structured AI instruction approach. If you're all-in on Claude Code, this is your home.</p>
            </div>
            <div className="bg-prpm-accent/10 border border-prpm-accent/30 rounded-lg p-6">
              <h3 className="text-prpm-accent text-xl font-bold mb-3 mt-0">PRPM</h3>
              <p className="text-sm mb-2 text-gray-300">Like <strong>npm/pip/gem</strong></p>
              <p className="mb-0 text-gray-300 text-sm">Cross-platform package manager inspired by Claude Code's approach. Distributes AI instructions across Cursor, Claude, Windsurf, Continue, and more.</p>
            </div>
          </div>

          <h2 id="what-makes-prpm-special" className="text-3xl font-bold text-white mt-16 mb-6 group scroll-mt-24">
            <a href="#what-makes-prpm-special" className="inline-flex items-center gap-2 no-underline hover:no-underline">
              How PRPM Complements Claude Code
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-prpm-accent text-xl">🔗</span>
            </a>
          </h2>

          <p className="text-lg text-gray-300 mb-8">
            Claude Code showed us that structured AI packages are the future. PRPM takes that insight and extends it to solve the cross-platform challenge.
          </p>

          <div className="grid md:grid-cols-3 gap-6 my-10">
            <div className="bg-prpm-accent/10 border border-prpm-accent/30 rounded-lg p-6">
              <h3 className="text-prpm-accent text-xl font-bold mb-4 mt-0">🌍 Cross-Platform Bridge</h3>
              <p className="text-gray-300 mb-0">
                Your team uses Cursor, Claude Code, and Windsurf? PRPM auto-converts between formats so everyone gets the same instructions in their preferred tool. Claude pioneered the approach; PRPM spreads it across the ecosystem.
              </p>
            </div>

            <div className="bg-prpm-accent/10 border border-prpm-accent/30 rounded-lg p-6">
              <h3 className="text-prpm-accent text-xl font-bold mb-4 mt-0">📦 Familiar Workflow</h3>
              <p className="text-gray-300 mb-0">
                <code>prpm install</code>, <code>prpm update</code>, <code>prpm search</code> — the same workflow developers know from npm/pip. Version-controlled and committed with your code.
              </p>
            </div>

            <div className="bg-prpm-accent/10 border border-prpm-accent/30 rounded-lg p-6">
              <h3 className="text-prpm-accent text-xl font-bold mb-4 mt-0">🚀 Universal Discovery</h3>
              <p className="text-gray-300 mb-0">
                One registry with <strong>1,500+ packages</strong> that work across all tools. Discover packages regardless of which AI coding assistant you use, with quality ratings and curated collections.
              </p>
            </div>
          </div>

          <h2 id="collections-vs-marketplaces" className="text-3xl font-bold text-white mt-16 mb-6 group scroll-mt-24">
            <a href="#collections-vs-marketplaces" className="inline-flex items-center gap-2 no-underline hover:no-underline">
              Collections vs Marketplaces: Multi-Author Curation
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-prpm-accent text-xl">🔗</span>
            </a>
          </h2>

          <p className="text-lg text-gray-300 mb-8">
            While both PRPM and plugin marketplaces offer curated discovery, there's a key architectural difference:
          </p>

          <div className="grid md:grid-cols-2 gap-6 my-10">
            <div className="bg-prpm-border/20 border border-prpm-border rounded-lg p-6">
              <h3 className="text-gray-200 text-xl font-bold mb-4 mt-0">Plugin Marketplaces</h3>
              <p className="text-gray-300 mb-4">
                Typically tied to a <strong>single author or organization</strong>. When you install a marketplace, you're trusting one curator's plugins.
              </p>
              <p className="text-sm text-gray-400 mb-0">
                Example: An author creates a marketplace with their own plugins bundled together.
              </p>
            </div>

            <div className="bg-prpm-accent/10 border border-prpm-accent/30 rounded-lg p-6">
              <h3 className="text-prpm-accent text-xl font-bold mb-4 mt-0">PRPM Collections</h3>
              <p className="text-gray-300 mb-4">
                Can curate packages from <strong>multiple authors across the ecosystem</strong>. A single collection can bundle the best practices from dozens of different contributors.
              </p>
              <p className="text-sm text-gray-400 mb-0">
                Example: <code>@prpm/react-essentials</code> includes packages from @patrickjs, @react, @typescript, and @testing experts.
              </p>
            </div>
          </div>

          <div className="bg-prpm-dark-card border border-prpm-accent/30 rounded-lg p-6 my-8">
            <h4 className="text-lg text-white font-bold mb-3 mt-0">Why This Matters</h4>
            <p className="text-gray-300 mb-4">
              PRPM collections work like <strong>curated playlists across the entire ecosystem</strong>. Instead of being limited to one author's work, you get the best packages from the entire community, thoughtfully organized by domain experts.
            </p>
            <pre className="bg-prpm-dark border border-prpm-border rounded-lg p-4 overflow-x-auto mb-0">
              <code>{`prpm install collection/nextjs-production
# Installs best practices from:
# - @patrickjs (Next.js architecture)
# - @vercel (deployment patterns)
# - @typescript (type safety rules)
# - @testing (integration test patterns)
# All curated into one cohesive collection`}</code>
            </pre>
          </div>

          <h2 id="complementary" className="text-3xl font-bold text-white mt-16 mb-6 group scroll-mt-24">
            <a href="#complementary" className="inline-flex items-center gap-2 no-underline hover:no-underline">
              They Complement Each Other!
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-prpm-accent text-xl">🔗</span>
            </a>
          </h2>

          <p className="text-lg text-gray-300 mb-8">
            The key insight: <strong>these aren't competing solutions</strong> — they solve different problems in your AI coding workflow:
          </p>

          <div className="grid md:grid-cols-3 gap-6 my-10">
            <div className="bg-prpm-accent/10 border border-prpm-accent/30 rounded-lg p-6">
              <h3 className="text-prpm-accent text-xl font-bold mb-3 mt-0">PRPM</h3>
              <p className="text-gray-300 mb-0">Project-specific AI instructions (coding standards, architecture patterns)</p>
            </div>
            <div className="bg-prpm-border/20 border border-prpm-border rounded-lg p-6">
              <h3 className="text-gray-200 text-xl font-bold mb-3 mt-0">Claude Plugins</h3>
              <p className="text-gray-300 mb-0">Tool integrations (commands, agents, MCP servers, hooks)</p>
            </div>
            <div className="bg-prpm-border/20 border border-prpm-border rounded-lg p-6">
              <h3 className="text-gray-200 text-xl font-bold mb-3 mt-0">IDE Extensions</h3>
              <p className="text-gray-300 mb-0">UI enhancements (panels, syntax highlighting, debuggers)</p>
            </div>
          </div>

          <div className="bg-prpm-accent/5 border-l-4 border-prpm-accent rounded-r-lg p-8 my-12">
            <p className="text-gray-300 text-lg mb-4">
              <strong className="text-white">Anthropic's Claude marketplace represents the future of AI environments.</strong>
            </p>
            <p className="text-gray-300 text-lg mb-4">
              <strong className="text-prpm-accent">PRPM represents the future of AI interoperability</strong> — the ability to take your rules, agents, and context wherever you work.
            </p>
            <p className="text-gray-300 text-lg mb-0">
              We admire what Anthropic has built. PRPM's goal is simply to make that intelligence <strong>distributable</strong> — so your AI knowledge doesn't depend on where it runs.
            </p>
          </div>

          <h2 id="getting-started" className="text-3xl font-bold text-white mt-16 mb-6 group scroll-mt-24">
            <a href="#getting-started" className="inline-flex items-center gap-2 no-underline hover:no-underline">
              Getting Started
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-prpm-accent text-xl">🔗</span>
            </a>
          </h2>

          <p className="text-gray-300 mb-6">
            PRPM is still small — but it's open, evolving fast, and shaped by developer feedback. Every new package expands what AI tools can do together. Ready to try it?
          </p>

          <div className="bg-prpm-dark-card border border-prpm-accent/30 rounded-lg p-6 my-6">
            <pre className="bg-prpm-dark border border-prpm-border rounded-lg p-4 overflow-x-auto mb-4">
              <code>{`# Install PRPM
npm install -g prpm

# Search for packages
prpm search react

# Install packages for your project
prpm install @patrickjs/react-typescript-rules

# Update packages
prpm update`}</code>
            </pre>
            <p className="mb-0 text-center">
              <a href="/search" className="text-prpm-accent hover:text-prpm-accent-light font-semibold">
                Browse 1,500+ packages →
              </a>
            </p>
          </div>
        </article>

        <BlogFooter
          postTitle="PRPM and Claude Plugins: Working Together"
          postUrl="/blog/prpm-vs-plugins"
        />
      </div>
    </div>
  )
}
