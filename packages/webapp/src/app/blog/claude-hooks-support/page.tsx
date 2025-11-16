import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "PRPM Now Supports Claude Code Hooks - Install Automation in One Command",
  description: "Install Claude Code hooks as packages. One command replaces manual JSON config. Auto-format code, log commands, protect files—share hooks via PRPM registry.",
  openGraph: {
    title: "PRPM Now Supports Claude Code Hooks",
    description: "Install Claude hooks with prpm install @prpm/prettier-on-save. No JSON editing. Clean uninstalls. Collections for complete workflows.",
  },
}

export default function ClaudeHooksSupportPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Feature Release', 'Claude Code', 'Hooks', 'Automation']}
          title="PRPM Now Supports Claude Code Hooks"
          subtitle="Install automation scripts as packages—no JSON editing required"
          author="PRPM Team"
          date="November 12, 2025"
          readTime="7 min read"
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
          prose-hr:border-prpm-border prose-hr:my-12
        ">
          {/* Intro */}
          <p className="text-gray-300 leading-relaxed mb-8">
            You can now install Claude Code hooks as packages. One command replaces manual JSON configuration. No copy-pasting, no hunting through settings files.
          </p>

          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8"><code className="text-sm text-gray-300 font-mono">{`$ prpm install @prpm/prettier-on-save
✓ Installed @prpm/prettier-on-save@1.0.0
  Merged hook into .claude/settings.json
  Hook will trigger on: PostToolUse (Edit, Write)`}</code></pre>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">What Are Claude Hooks?</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Hooks are automated scripts that run during Claude Code operations. Think git hooks, but for your AI assistant. When Claude writes a file, runs a test, or starts a session, hooks let you inject custom logic.
          </p>

          <div className="not-prose mb-10">
            <p className="text-gray-300 leading-relaxed mb-6"><strong className="text-white">Common use cases:</strong></p>
            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li>Run prettier after Claude edits code</li>
              <li>Log all bash commands Claude executes</li>
              <li>Block writes to sensitive files like <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.env</code></li>
              <li>Send desktop notifications when Claude needs input</li>
              <li>Validate code before it gets written</li>
            </ul>
          </div>

          <div className="not-prose mb-8">
            <p className="text-gray-300 leading-relaxed mb-6"><strong className="text-white">Claude Code supports 9 hook events:</strong></p>
            <table className="w-full border-collapse text-gray-300">
              <thead className="border-b-2 border-prpm-border">
                <tr>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Event</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Trigger Point</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">PreToolUse</code></td>
                  <td className="px-4 py-4 border border-prpm-border">Before Claude calls a tool</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">PostToolUse</code></td>
                  <td className="px-4 py-4 border border-prpm-border">After a tool completes</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">UserPromptSubmit</code></td>
                  <td className="px-4 py-4 border border-prpm-border">When you submit a message</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">SessionStart</code></td>
                  <td className="px-4 py-4 border border-prpm-border">When Claude Code starts</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">SessionEnd</code></td>
                  <td className="px-4 py-4 border border-prpm-border">When Claude Code shuts down</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Problem: Manual Setup</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Before PRPM hook support, installing a Claude hook required multiple error-prone steps:
          </p>

          <div className="not-prose mb-10">
            <ol className="text-gray-300 space-y-6 mb-8 list-decimal list-inside">
              <li>Find the hook code (GitHub, docs, Twitter)</li>
              <li>Open <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">~/.claude/settings.json</code> or <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.claude/settings.json</code></li>
              <li>Understand the JSON structure</li>
              <li>Copy-paste the hook config</li>
              <li>Fix syntax errors (forgot a comma? start over)</li>
              <li>Repeat for every project</li>
            </ol>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Want to share a hook with your team? Send them JSON and hope they paste it correctly. Want to update a hook? Manually edit every project's settings file.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Fix: Hooks as Packages</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Install a hook like any other package:
          </p>

          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8"><code className="text-sm text-gray-300 font-mono">{`$ prpm install @prpm/prettier-on-save
✓ Installed @prpm/prettier-on-save@1.0.0
  Merged hook into .claude/settings.json
  Hook will trigger on: PostToolUse (Edit, Write)`}</code></pre>

          <p className="text-gray-300 leading-relaxed mb-8">
            PRPM merges the hook into your existing settings without clobbering custom config. Multiple hooks in the same event? No problem—they run in parallel.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Where Hooks Install</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Hooks install to your project's <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.claude/settings.json</code> file:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-4"><code className="text-sm text-gray-300 font-mono">{`$ prpm install @prpm/prettier-on-save

# Installs to: .claude/settings.json (project directory)`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              Each project gets its own hooks. Commit <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.claude/settings.json</code> to git so your team shares the same automation.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Tracking and Uninstalling</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Each package in <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.claude/settings.json</code> includes tracking metadata:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{
          "type": "command",
          "command": "prettier --write \${file}"
        }],
        "__prpm_hook_id": "@prpm/prettier-on-save@1.0.0"
      }
    ]
  }
}`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-6">
              The <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">__prpm_hook_id</code> field tracks which package installed the hook. When you uninstall, PRPM removes only that hook's config—your other hooks stay intact.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`$ prpm uninstall @prpm/prettier-on-save
✓ Removed hook from .claude/settings.json
  Cleaned up PostToolUse event (now empty)`}</code></pre>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Hook Collections</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Want a full workflow? Install a collection:
          </p>

          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`$ prpm install @prpm/secure-coding

# Installs:
# - @prpm/block-env-writes
# - @prpm/validate-credentials
# - @prpm/audit-file-deletes
# - @prpm/sensitive-data-scanner

✓ Installed 4 hooks`}</code></pre>

          <p className="text-gray-300 leading-relaxed mb-8">
            Collections bundle related hooks. One command sets up your entire security policy.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Publishing Hooks</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Creating a hook package:
          </p>

          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`$ mkdir my-hook && cd my-hook
$ prpm init

Format: claude
Subtype: hook
Name: my-awesome-hook`}</code></pre>

          <p className="text-gray-300 leading-relaxed mb-6">
            Write your hook in the package file (JSON format):
          </p>

          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "echo \\"Running: $(echo $CLAUDE_TOOL_INPUT | jq -r .command)\\""
        }]
      }
    ]
  }
}`}</code></pre>

          <p className="text-gray-300 leading-relaxed mb-6">
            Publish:
          </p>

          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`$ prpm publish
✓ Published @yourname/my-awesome-hook@1.0.0`}</code></pre>

          <p className="text-gray-300 leading-relaxed mb-8">
            Now anyone can install it: <code>prpm install @yourname/my-awesome-hook</code>
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Real Examples</h2>
          </div>

          <div className="not-prose mb-10">
            <p className="text-gray-300 leading-relaxed mb-8">
              Here are hooks you can install right now:
            </p>

            <div className="space-y-6">
              <div>
                <p className="text-white font-semibold mb-3">Auto-format on edit:</p>
                <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-4 overflow-x-auto"><code className="text-sm text-gray-300 font-mono">prpm install @prpm/prettier-on-save</code></pre>
              </div>

              <div>
                <p className="text-white font-semibold mb-3">Log all bash commands:</p>
                <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-4 overflow-x-auto"><code className="text-sm text-gray-300 font-mono">prpm install @prpm/command-logger</code></pre>
              </div>

              <div>
                <p className="text-white font-semibold mb-3">Block sensitive file writes:</p>
                <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-4 overflow-x-auto"><code className="text-sm text-gray-300 font-mono">prpm install @prpm/protect-env-files</code></pre>
              </div>

              <div>
                <p className="text-white font-semibold mb-3">Desktop notifications:</p>
                <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-4 overflow-x-auto"><code className="text-sm text-gray-300 font-mono">prpm install @prpm/desktop-alerts</code></pre>
              </div>

              <div>
                <p className="text-white font-semibold mb-3">Full security suite:</p>
                <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-4 overflow-x-auto"><code className="text-sm text-gray-300 font-mono">prpm install @prpm/secure-coding</code></pre>
              </div>
            </div>
          </div>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-4">Try It Now</h2>

            <pre className="bg-prpm-dark border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`# Install PRPM
npm install -g prpm

# Install a hook
prpm install @prpm/command-logger

# See it in action
# (next time Claude runs a bash command, it logs to ~/claude-commands.log)`}</code></pre>

            <p className="text-gray-300 leading-relaxed text-lg mb-0">
              Browse available hooks at{' '}
              <Link href="/search?format=claude&subtype=hook" className="text-prpm-accent hover:underline font-medium">
                prpm.dev/search?format=claude&subtype=hook
              </Link>
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-4">What's Next</h2>

            <ul className="text-gray-300 space-y-3 mb-6 list-disc ml-6">
              <li><strong className="text-white">Hook templates</strong> - Starter templates for common patterns</li>
              <li><strong className="text-white">Hook testing tools</strong> - Test hooks before deploying</li>
              <li><strong className="text-white">Hook marketplace</strong> - Curated collection of verified hooks</li>
              <li><strong className="text-white">Hook analytics</strong> - See which hooks save you the most time</li>
            </ul>

            <p className="text-gray-300 leading-relaxed text-lg mb-0">
              Want to write hooks? Check out{' '}
              <Link href="/blog/claude-hooks-best-practices" className="text-prpm-accent hover:underline font-medium">
                Claude Code Hooks Best Practices
              </Link>.
            </p>
          </div>
        </div>

        <BlogFooter postTitle="PRPM Now Supports Claude Code Hooks" postUrl="/blog/claude-hooks-support" />
      </article>
    </main>
  )
}
