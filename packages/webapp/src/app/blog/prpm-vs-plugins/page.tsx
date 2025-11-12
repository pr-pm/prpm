import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import Tag from '@/components/Tag'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata = {
  title: 'PRPM vs Claude Plugins Marketplace: What\'s the Difference?',
  description: 'Understanding how PRPM differs from traditional plugin marketplaces and why both can coexist in your AI coding workflow.',
}

export default function PRPMvsPluginsPage() {
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-8">
      <Header showDashboard showAccount />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <BackLink href="/blog">← Back to Blog</BackLink>

        <BlogPostHeader
          tags={['PRPM', 'Explainer', 'Vision']}
          title="PRPM vs Claude Plugins Marketplace: What's the Difference?"
          subtitle="Understanding how PRPM differs from traditional plugin marketplaces and why both can coexist in your AI coding workflow."
          author="PRPM Team"
          date="October 27, 2024"
          readTime="5 min read"
        />

        <article className="prose prose-invert prose-lg max-w-none">
          <div className="bg-prpm-accent/10 border-l-4 border-prpm-accent rounded-r-lg p-6 mb-12">
            <p className="text-lg font-semibold text-prpm-accent mb-2">TL;DR</p>
            <p className="text-gray-300 mb-0">
              Claude's plugins extend one environment with tool integrations. PRPM distributes AI knowledge across all of them as portable, version-controlled packages. They complement each other.
            </p>
          </div>

          <p className="text-xl text-gray-300 leading-relaxed mb-12">
            One of the most common questions we get is: <strong>"Is PRPM just another plugins marketplace?"</strong> The short answer: No! While both help extend AI coding tools, they solve fundamentally different problems. Let's break it down.
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

          <h2 id="what-is-a-plugins-marketplace" className="text-3xl font-bold text-white mt-16 mb-6 group scroll-mt-24">
            <a href="#what-is-a-plugins-marketplace" className="inline-flex items-center gap-2 no-underline hover:no-underline">
              What is a Plugins Marketplace?
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-prpm-accent text-xl">🔗</span>
            </a>
          </h2>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6 my-8">
            <p className="text-gray-300 font-semibold mb-2">Plugin marketplaces distribute:</p>
            <ul className="space-y-2 mb-0">
              <li>💻 <strong>Extensible packages</strong> that bundle custom commands, agents, skills, MCP servers, and hooks</li>
              <li>🔌 <strong>Tool-level extensions</strong> that install via <code>/plugin install</code> and toggle on/off as needed</li>
              <li>⚙️ <strong>Curated catalogs</strong> where developers discover and share plugins</li>
              <li>🛠️ <strong>Single-command deployment</strong> of multiple features at once</li>
            </ul>
            <p className="text-sm text-gray-400 mt-4 mb-0">
              <strong>Note:</strong> Plugins can include the <strong>Model Context Protocol (MCP)</strong> to connect Claude to external data sources, APIs, and developer tools. Marketplaces can be public or organization-private.
            </p>
          </div>

          <h3 className="text-xl font-semibold text-gray-200 mt-8 mb-4">Examples:</h3>
          <ul className="space-y-3 mb-12">
            <li><strong>Claude Code Plugin:</strong> Bundles slash commands, agents, MCP servers, and hooks together</li>
            <li><strong>VSCode Extension:</strong> Adds UI panels, custom commands, syntax highlighting to VS Code</li>
            <li><strong>MCP Server (standalone):</strong> Runs a background process for database access, file operations, etc.</li>
          </ul>

          <h2 id="comparison" className="text-3xl font-bold text-white mt-16 mb-6 group scroll-mt-24">
            <a href="#comparison" className="inline-flex items-center gap-2 no-underline hover:no-underline">
              Side-by-Side Comparison
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-prpm-accent text-xl">🔗</span>
            </a>
          </h2>

          <div className="overflow-x-auto my-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-prpm-border">
                  <th className="text-left py-3 px-4 text-gray-300">Aspect</th>
                  <th className="text-left py-3 px-4 text-prpm-accent">PRPM</th>
                  <th className="text-left py-3 px-4 text-gray-300">Plugins Marketplace</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-prpm-border/50">
                  <td className="py-3 px-4 font-semibold">What</td>
                  <td className="py-3 px-4">AI instructions (text/markdown)</td>
                  <td className="py-3 px-4">Extension packages (manifests + configs)</td>
                </tr>
                <tr className="border-b border-prpm-border/50">
                  <td className="py-3 px-4 font-semibold">Where</td>
                  <td className="py-3 px-4">Project directory (committed)</td>
                  <td className="py-3 px-4">Global or project (toggle on/off)</td>
                </tr>
                <tr className="border-b border-prpm-border/50">
                  <td className="py-3 px-4 font-semibold">How</td>
                  <td className="py-3 px-4">AI reads files directly</td>
                  <td className="py-3 px-4">Claude loads and integrates</td>
                </tr>
                <tr className="border-b border-prpm-border/50">
                  <td className="py-3 px-4 font-semibold">Format</td>
                  <td className="py-3 px-4">Markdown, text files</td>
                  <td className="py-3 px-4">JSON manifests + configs</td>
                </tr>
                <tr className="border-b border-prpm-border/50">
                  <td className="py-3 px-4 font-semibold">Scope</td>
                  <td className="py-3 px-4">Per-project</td>
                  <td className="py-3 px-4">Global or per-project</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">Git-Friendly</td>
                  <td className="py-3 px-4">✅ Yes (commit with code)</td>
                  <td className="py-3 px-4">✅ Yes (can commit to repo)</td>
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
            <div className="bg-prpm-accent/10 border border-prpm-accent/30 rounded-lg p-6">
              <h3 className="text-prpm-accent text-xl font-bold mb-3 mt-0">PRPM is like npm/pip/gem</h3>
              <p className="mb-0 text-gray-300">Installing <strong>libraries and dependencies</strong> for your project. They're code/text that your application uses.</p>
            </div>
            <div className="bg-prpm-border/20 border border-prpm-border rounded-lg p-6">
              <h3 className="text-gray-200 text-xl font-bold mb-3 mt-0">Plugins are like Chrome Extensions</h3>
              <p className="mb-0 text-gray-300">Installing <strong>applications</strong> that extend the tool itself with new features and capabilities.</p>
            </div>
          </div>

          <h2 id="what-makes-prpm-special" className="text-3xl font-bold text-white mt-16 mb-6 group scroll-mt-24">
            <a href="#what-makes-prpm-special" className="inline-flex items-center gap-2 no-underline hover:no-underline">
              What Makes PRPM Special?
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-prpm-accent text-xl">🔗</span>
            </a>
          </h2>

          <div className="grid md:grid-cols-3 gap-6 my-10">
            <div className="bg-prpm-accent/10 border border-prpm-accent/30 rounded-lg p-6">
              <h3 className="text-prpm-accent text-xl font-bold mb-4 mt-0">🌍 Cross-Platform Portability</h3>
              <p className="text-gray-300 mb-0">
                Your AI setup isn't trapped inside a single tool. PRPM auto-converts packages between formats — install a Cursor rule and use it instantly in Claude Code, Windsurf, or Continue.
              </p>
            </div>

            <div className="bg-prpm-accent/10 border border-prpm-accent/30 rounded-lg p-6">
              <h3 className="text-prpm-accent text-xl font-bold mb-4 mt-0">📦 Familiar Workflow</h3>
              <p className="text-gray-300 mb-0">
                <code>prpm install</code>, <code>prpm update</code>, <code>prpm search</code> — manage AI instructions like you manage dependencies. Version-controlled and committed with your code.
              </p>
            </div>

            <div className="bg-prpm-accent/10 border border-prpm-accent/30 rounded-lg p-6">
              <h3 className="text-prpm-accent text-xl font-bold mb-4 mt-0">🚀 Centralized Discovery</h3>
              <p className="text-gray-300 mb-0">
                One registry with <strong>4,000+ community packages</strong>. Search by tech stack, filter by ratings, browse curated collections — no hunting across scattered marketplaces.
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
                Browse 6,000+ packages →
              </a>
            </p>
          </div>
        </article>

        <BlogFooter
          postTitle="PRPM vs Plugins Marketplace: What's the Difference?"
          postUrl="/blog/prpm-vs-plugins"
        />
      </div>
    </div>
  )
}
