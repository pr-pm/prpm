import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import Tag from '@/components/Tag'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata = {
  title: 'PRPM vs Plugins Marketplace: What\'s the Difference?',
  description: 'Understanding how PRPM differs from traditional plugin marketplaces and why both can coexist in your AI coding workflow.',
}

export default function PRPMvsPluginsPage() {
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-8">
      <Header showDashboard showAccount />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <BackLink href="/blog">← Back to Blog</BackLink>

        <BlogPostHeader
          tags={['PRPM', 'Explainer', 'Architecture']}
          title="PRPM vs Plugins Marketplace: What's the Difference?"
          subtitle="Understanding how PRPM differs from traditional plugin marketplaces and why both can coexist in your AI coding workflow."
          author="PRPM Team"
          date="October 27, 2024"
          readTime="5 min read"
        />

        <article className="prose prose-invert prose-lg max-w-none">
          <p className="text-xl text-gray-300 leading-relaxed">
            One of the most common questions we get is: <strong>"Is PRPM just another plugins marketplace?"</strong> The short answer: No! While both help extend AI coding tools, they solve fundamentally different problems. Let's break it down.
          </p>

          <h2>What is PRPM?</h2>

          <div className="bg-prpm-dark-card border border-prpm-accent/30 rounded-lg p-6 my-6">
            <p className="text-prpm-accent font-semibold mb-2">PRPM manages:</p>
            <ul className="space-y-2 mb-0">
              <li>📝 <strong>AI instructions, rules, and context files</strong> (<code>.cursorrules</code>, <code>SKILL.md</code>, <code>agents.md</code>)</li>
              <li>🎯 <strong>Plain text/markdown files</strong> that guide AI behavior</li>
              <li>🔄 <strong>Version controlled</strong> alongside your code</li>
              <li>🚀 <strong>Works immediately</strong> with existing AI tools (Cursor, Claude, Windsurf, etc.)</li>
            </ul>
          </div>

          <p><strong>Example:</strong></p>
          <pre className="bg-prpm-dark border border-prpm-border rounded-lg p-4 overflow-x-auto">
            <code>{`prpm install @patrickjs/react-typescript-rules
# Installs .cursor/rules/react-typescript.mdc
# Your AI now follows React best practices automatically`}</code>
          </pre>

          <h2>What is a Plugins Marketplace?</h2>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6 my-6">
            <p className="text-gray-300 font-semibold mb-2">Plugins manage:</p>
            <ul className="space-y-2 mb-0">
              <li>💻 <strong>Executable code and tools</strong></li>
              <li>🔌 <strong>System-level installations</strong> (not per-project)</li>
              <li>⚙️ <strong>Runtime processes</strong> requiring permissions</li>
              <li>🛠️ <strong>New functionality</strong> added to the tool itself</li>
            </ul>
          </div>

          <p><strong>Examples:</strong></p>
          <ul>
            <li><strong>VSCode Extension:</strong> Adds UI panels, custom commands, syntax highlighting</li>
            <li><strong>MCP Server:</strong> Runs a background process that AI can call via API for database access, file operations, etc.</li>
          </ul>

          <h2>Side-by-Side Comparison</h2>

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
                  <td className="py-3 px-4">AI instructions (text files)</td>
                  <td className="py-3 px-4">Executable code</td>
                </tr>
                <tr className="border-b border-prpm-border/50">
                  <td className="py-3 px-4 font-semibold">Where</td>
                  <td className="py-3 px-4">Project directory</td>
                  <td className="py-3 px-4">Tool/system installation</td>
                </tr>
                <tr className="border-b border-prpm-border/50">
                  <td className="py-3 px-4 font-semibold">How</td>
                  <td className="py-3 px-4">AI reads files</td>
                  <td className="py-3 px-4">Tool executes code</td>
                </tr>
                <tr className="border-b border-prpm-border/50">
                  <td className="py-3 px-4 font-semibold">Security</td>
                  <td className="py-3 px-4">Low risk (just text)</td>
                  <td className="py-3 px-4">Higher risk (runs code)</td>
                </tr>
                <tr className="border-b border-prpm-border/50">
                  <td className="py-3 px-4 font-semibold">Scope</td>
                  <td className="py-3 px-4">Per-project</td>
                  <td className="py-3 px-4">System/tool-wide</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">Git-Friendly</td>
                  <td className="py-3 px-4">✅ Yes (commit with code)</td>
                  <td className="py-3 px-4">❌ No (external install)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Think of It Like This</h2>

          <div className="grid md:grid-cols-2 gap-6 my-8">
            <div className="bg-prpm-accent/10 border border-prpm-accent/30 rounded-lg p-6">
              <h3 className="text-prpm-accent text-xl font-bold mb-3 mt-0">PRPM is like npm/pip/gem</h3>
              <p className="mb-0 text-gray-300">Installing <strong>libraries and dependencies</strong> for your project. They're code/text that your application uses.</p>
            </div>
            <div className="bg-prpm-border/20 border border-prpm-border rounded-lg p-6">
              <h3 className="text-gray-200 text-xl font-bold mb-3 mt-0">Plugins are like Chrome Extensions</h3>
              <p className="mb-0 text-gray-300">Installing <strong>applications</strong> that extend the tool itself with new features and capabilities.</p>
            </div>
          </div>

          <h2>Why Does PRPM Exist?</h2>

          <p>Before PRPM, sharing AI instructions was a mess:</p>

          <div className="bg-red-900/10 border border-red-500/30 rounded-lg p-6 my-6">
            <p className="text-red-400 font-semibold mb-3">The Old Way:</p>
            <ul className="space-y-2 mb-0 text-gray-300">
              <li>❌ Copy-pasting rules from random GitHub repos</li>
              <li>❌ No versioning or update mechanism</li>
              <li>❌ Reinventing the wheel for every new project</li>
              <li>❌ No discoverability or quality standards</li>
              <li>❌ Teams using different, conflicting instructions</li>
            </ul>
          </div>

          <div className="bg-green-900/10 border border-green-500/30 rounded-lg p-6 my-6">
            <p className="text-green-400 font-semibold mb-3">The PRPM Way:</p>
            <ul className="space-y-2 mb-0 text-gray-300">
              <li>✅ <code>prpm install</code> gets you battle-tested practices instantly</li>
              <li>✅ <code>prpm update</code> keeps your AI context current</li>
              <li>✅ Search <strong>1,500+ packages</strong> for your exact stack</li>
              <li>✅ Version controlled, so your team stays in sync</li>
              <li>✅ Quality scores and ratings guide your choices</li>
            </ul>
          </div>

          <h2>Real-World Example</h2>

          <p>Let's say you're building a React + TypeScript app with Cursor:</p>

          <div className="space-y-4 my-6">
            <div>
              <p className="text-prpm-accent font-semibold mb-2">1. Install AI Instructions (PRPM)</p>
              <pre className="bg-prpm-dark border border-prpm-border rounded-lg p-4 overflow-x-auto">
                <code>{`prpm install @patrickjs/nextjs-typescript-rules
prpm install @react/hooks-best-practices
prpm install @company/api-conventions`}</code>
              </pre>
              <p className="text-sm text-gray-400 mt-2">
                Result: Your <code>.cursor/rules/</code> directory now contains instructions that guide the AI to follow your team's conventions.
              </p>
            </div>

            <div>
              <p className="text-gray-300 font-semibold mb-2">2. Install Tool Integrations (MCP)</p>
              <pre className="bg-prpm-dark border border-prpm-border rounded-lg p-4 overflow-x-auto">
                <code>{`# Install MCP server for database access
npx @modelcontextprotocol/server-postgres`}</code>
              </pre>
              <p className="text-sm text-gray-400 mt-2">
                Result: AI can now query your database directly (requires running process and permissions).
              </p>
            </div>

            <div>
              <p className="text-gray-300 font-semibold mb-2">3. Install IDE Extensions (Plugins)</p>
              <pre className="bg-prpm-dark border border-prpm-border rounded-lg p-4 overflow-x-auto">
                <code>{`code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode`}</code>
              </pre>
              <p className="text-sm text-gray-400 mt-2">
                Result: VS Code UI gets new panels, commands, and linting features.
              </p>
            </div>
          </div>

          <h2>They Coexist Beautifully!</h2>

          <p>The key insight: <strong>these aren't competing solutions</strong> — they solve different problems in your AI coding workflow:</p>

          <ul>
            <li><strong>PRPM</strong> → Project-specific AI instructions (coding standards, architecture patterns)</li>
            <li><strong>MCP</strong> → AI tool integrations (database access, API calls, file operations)</li>
            <li><strong>Extensions</strong> → IDE enhancements (UI features, syntax highlighting, debuggers)</li>
          </ul>

          <p>Each layer works together to create a powerful, customized development environment!</p>

          <h2>Getting Started</h2>

          <p>Ready to level up your AI coding workflow with PRPM?</p>

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

          <h2>Questions?</h2>

          <p>
            Still confused about the difference? Have more questions?
            Join our <a href="https://discord.gg/prpm" className="text-prpm-accent hover:text-prpm-accent-light">Discord community</a> or
            open a <a href="https://github.com/pr-pm/prpm/discussions" className="text-prpm-accent hover:text-prpm-accent-light">GitHub Discussion</a>.
            We're here to help! 🚀
          </p>
        </article>

        <BlogFooter
          postTitle="PRPM vs Plugins Marketplace: What's the Difference?"
          postUrl="/blog/prpm-vs-plugins"
        />
      </div>
    </div>
  )
}
