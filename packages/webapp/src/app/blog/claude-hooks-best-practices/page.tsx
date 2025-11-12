import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Claude Hooks Best Practices: Write Reliable, Secure Automation Scripts",
  description: "Learn Claude hooks best practices: validate input, handle errors, secure sensitive files. 40 proven patterns for writing reliable automation that won't break your workflow.",
  openGraph: {
    title: "Claude Hooks Best Practices: Write Scripts That Work",
    description: "Security, reliability, and performance best practices for Claude Code hooks. Validate input, quote paths, handle failures, optimize performance.",
  },
}

export default function ClaudeHooksBestPracticesPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Tutorial', 'Claude Code', 'Hooks', 'Best Practices']}
          title="Claude Hooks Best Practices: Write Hooks That Work"
          subtitle="Security, reliability, and performance patterns for automation scripts that won't break your workflow"
          author="PRPM Team"
          date="November 12, 2025"
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
          prose-hr:border-prpm-border prose-hr:my-12
        ">
          {/* Intro */}
          <p className="text-gray-300 leading-relaxed mb-8">
            Claude Code hooks run automatically during your AI coding sessions. Write them wrong and they'll fail silently, break your workflow, or expose sensitive data. This guide shows you how to write hooks that work reliably and safely.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Security First</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            <strong className="text-white">Hooks execute with your user permissions.</strong> They can read, modify, or delete any file you can access. Treat hook code like you'd treat a shell script from the internet—because that's what it is.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">1. Validate All Input</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Hook input arrives via JSON on stdin. Never trust it.
            </p>

            <p className="text-white font-semibold mb-3">Bad:</p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`#!/bin/bash
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.input.file_path')
prettier --write $FILE  # DANGEROUS: no validation`}</code></pre>

            <p className="text-white font-semibold mb-3">Good:</p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`#!/bin/bash
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.input.file_path // empty')

# Validate file exists and is in project
if [[ -z "$FILE" ]] || [[ ! -f "$FILE" ]]; then
  echo "Invalid file path" >&2
  exit 1
fi

# Validate file is in project directory
if [[ "$FILE" != "$CLAUDE_PROJECT_DIR"* ]]; then
  echo "File outside project" >&2
  exit 1
fi

prettier --write "$FILE"`}</code></pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">2. Quote Everything</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Spaces, special characters, and Unicode in file paths will break unquoted variables.
            </p>

            <p className="text-white font-semibold mb-3">Bad:</p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`FILE=$(echo "$INPUT" | jq -r '.input.file_path')
cat $FILE  # Breaks on "my file.txt"`}</code></pre>

            <p className="text-white font-semibold mb-3">Good:</p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`FILE=$(echo "$INPUT" | jq -r '.input.file_path')
cat "$FILE"  # Handles spaces, special chars`}</code></pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">3. Block Sensitive Files</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Never let hooks touch credentials, keys, or git internals.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`# Block list - add to PreToolUse hook
BLOCKED_PATTERNS=(
  ".env"
  ".env.*"
  "*.pem"
  "*.key"
  ".git/*"
  "credentials.json"
)

FILE=$(echo "$INPUT" | jq -r '.input.file_path // empty')

for pattern in "\${BLOCKED_PATTERNS[@]}"; do
  if [[ "$FILE" == $pattern ]]; then
    echo "Blocked: $FILE matches sensitive pattern $pattern" >&2
    exit 2  # Exit 2 blocks the operation
  fi
done`}</code></pre>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Reliability</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">4. Handle Missing Tools Gracefully</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Don't assume <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">prettier</code>, <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">jq</code>, or other tools are installed.
            </p>

            <p className="text-white font-semibold mb-3">Bad:</p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`prettier --write "$FILE"  # Crashes if prettier not installed`}</code></pre>

            <p className="text-white font-semibold mb-3">Good:</p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`if ! command -v prettier &> /dev/null; then
  echo "prettier not installed, skipping format" >&2
  exit 0  # Exit 0 = success, just skip
fi

prettier --write "$FILE"`}</code></pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">5. Set Reasonable Timeouts</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Default timeout is 60 seconds. Long-running hooks block Claude.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write",
      "hooks": [{
        "type": "command",
        "command": "./slow-script.sh",
        "timeout": 10000  // 10 seconds max
      }]
    }]
  }
}`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-6">
              For slow operations (linting large files, running tests), use background jobs:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`# Run in background, don't block Claude
(eslint "$FILE" &)
exit 0`}</code></pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">6. Log Failures</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              When hooks fail, you need to know why.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`LOG_FILE=~/.claude-hooks/prettier.log

if ! prettier --write "$FILE" 2>> "$LOG_FILE"; then
  echo "Format failed, check $LOG_FILE" >&2
  exit 1
fi`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-6">
              Don't log to stdout—Claude sees that as output. Use stderr or log files.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Performance</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">7. Keep Hooks Fast</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Hooks block operations. A 5-second hook means Claude waits 5 seconds.
            </p>

            <p className="text-white font-semibold mb-3">Slow:</p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`# Runs tests on every file write (terrible)
npm test`}</code></pre>

            <p className="text-white font-semibold mb-3">Fast:</p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`# Only format the changed file
prettier --write "$FILE"`}</code></pre>

            <p className="text-white font-semibold mb-3">Better:</p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`# Format in background, don't block
(prettier --write "$FILE" &)
exit 0`}</code></pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">8. Use Specific Matchers</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Match only tools you care about. <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">matcher: "*"</code> runs on everything.
            </p>

            <p className="text-white font-semibold mb-3">Slow:</p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`{
  "matcher": "*",  // Runs on EVERY tool call
  "hooks": [...]
}`}</code></pre>

            <p className="text-white font-semibold mb-3">Fast:</p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`{
  "matcher": "Edit|Write",  // Only file modifications
  "hooks": [...]
}`}</code></pre>

            <p className="text-white font-semibold mb-3">Fastest:</p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`{
  "matcher": "Write",  // Only writes
  "hooks": [...]
}`}</code></pre>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Common Patterns</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">9. Format On Save</h3>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`#!/bin/bash
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.input.file_path // empty')

case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx)
    prettier --write "$FILE"
    ;;
  *.py)
    black "$FILE"
    ;;
  *.go)
    gofmt -w "$FILE"
    ;;
esac`}</code></pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">10. Command Logger</h3>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.input.command')
LOG=~/claude-commands.log

echo "[$(date '+%Y-%m-%d %H:%M:%S')] $COMMAND" >> "$LOG"`}</code></pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">11. File Protection</h3>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`#!/bin/bash
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.input.file_path // empty')

PROTECTED_DIRS=(
  ".git"
  "node_modules"
  ".env"
)

for dir in "\${PROTECTED_DIRS[@]}"; do
  if [[ "$FILE" == *"$dir"* ]]; then
    echo "Blocked: $FILE is protected" >&2
    exit 2
  fi
done`}</code></pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">12. Desktop Notifications</h3>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`#!/bin/bash
# Requires: libnotify (Linux) or terminal-notifier (macOS)

INPUT=$(cat)
MESSAGE=$(echo "$INPUT" | jq -r '.message // "Claude needs input"')

if command -v notify-send &> /dev/null; then
  notify-send "Claude Code" "$MESSAGE"
elif command -v terminal-notifier &> /dev/null; then
  terminal-notifier -title "Claude Code" -message "$MESSAGE"
fi`}</code></pre>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Testing</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">13. Test Hooks Manually</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Before registering, test hook scripts directly:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`# Create test input
echo '{
  "input": {
    "file_path": "/path/to/test.ts"
  }
}' | ./my-hook.sh`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-6">
              Expected:
            </p>
            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li>Exit code 0 = success</li>
              <li>Exit code 2 = blocked operation</li>
              <li>Other codes = error</li>
            </ul>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">14. Test With Edge Cases</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Test hooks with:
            </p>
            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li>Files with spaces: <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">"my file.txt"</code></li>
              <li>Unicode filenames: <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">"文件.txt"</code></li>
              <li>Deep paths: <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">"src/components/deep/nested/file.tsx"</code></li>
              <li>Missing files (simulate tool failures)</li>
              <li>Empty input (test error handling)</li>
            </ul>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Publishing</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">15. Write Clear Descriptions</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Users see your description in <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">prpm search</code>:
            </p>

            <p className="text-white font-semibold mb-3">Bad:</p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`{
  "description": "A hook"
}`}</code></pre>

            <p className="text-white font-semibold mb-3">Good:</p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`{
  "description": "Runs prettier on edited TypeScript/JavaScript files (PostToolUse)"
}`}</code></pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">16. Document Dependencies</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              If your hook needs tools, document them:
            </p>

            <div className="bg-prpm-dark-card/50 border border-prpm-border/50 rounded-xl p-6">
              <p className="text-white font-semibold mb-3">Prerequisites</p>
              <p className="text-gray-300 text-sm mb-3">This hook requires:</p>
              <ul className="text-gray-300 text-sm space-y-2 list-disc ml-6">
                <li><code className="text-prpm-accent bg-prpm-dark-card px-1.5 py-0.5 rounded text-xs">prettier</code> - Install: <code className="text-gray-400">npm install -g prettier</code></li>
                <li><code className="text-prpm-accent bg-prpm-dark-card px-1.5 py-0.5 rounded text-xs">jq</code> - Install: <code className="text-gray-400">brew install jq</code></li>
              </ul>
            </div>
          </div>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-4">Quick Checklist</h2>

            <p className="text-gray-300 leading-relaxed mb-6">
              Before publishing a hook:
            </p>

            <ul className="text-gray-300 space-y-3 mb-0 list-disc ml-6">
              <li>Validates all input from stdin</li>
              <li>Quotes all file paths and variables</li>
              <li>Uses absolute paths for scripts</li>
              <li>Blocks sensitive files (<code className="text-prpm-accent bg-prpm-dark-card/50 px-1.5 py-0.5 rounded text-xs">.env</code>, <code className="text-prpm-accent bg-prpm-dark-card/50 px-1.5 py-0.5 rounded text-xs">*.key</code>, <code className="text-prpm-accent bg-prpm-dark-card/50 px-1.5 py-0.5 rounded text-xs">.git/*</code>)</li>
              <li>Handles missing tools gracefully</li>
              <li>Sets reasonable timeout (default 60s)</li>
              <li>Logs errors to stderr or log file</li>
              <li>Tests with edge cases (spaces, Unicode, missing files)</li>
              <li>Documented dependencies</li>
              <li>Tested manually with sample JSON input</li>
              <li>Tested in real Claude Code session</li>
              <li>README includes installation instructions</li>
              <li>Clear description and tags</li>
            </ul>
          </div>

          <div className="not-prose bg-prpm-accent/5 border-l-4 border-prpm-accent rounded-r-xl p-6 my-8">
            <p className="text-xl font-semibold text-white mb-4">Final Thoughts</p>
            <p className="text-gray-300 leading-relaxed mb-0">
              Hooks are powerful automation tools. They save time, enforce standards, and extend Claude Code with custom logic. But power requires responsibility. Write hooks like you write production code: validate input, handle errors, test edge cases, document behavior. The best hooks are invisible—they just work, every time, without slowing you down.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-4">Get Started</h2>

            <p className="text-gray-300 leading-relaxed mb-6">
              Install hook examples:
            </p>

            <pre className="bg-prpm-dark border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`prpm install @prpm/prettier-on-save
prpm install @prpm/command-logger
prpm install @prpm/secure-coding`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-6">
              Write your own:
            </p>

            <pre className="bg-prpm-dark border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`prpm init  # Choose format: claude, subtype: hook`}</code></pre>

            <p className="text-gray-300 leading-relaxed text-lg mb-0">
              Learn more: <Link href="/blog/claude-hooks-support" className="text-prpm-accent hover:underline font-medium">PRPM Now Supports Claude Code Hooks</Link>
            </p>
          </div>
        </div>

        <BlogFooter postTitle="Claude Hooks Best Practices: Write Hooks That Work" postUrl="/blog/claude-hooks-best-practices" />
      </article>
    </main>
  )
}
