import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Custom Prompts for Verified Authors: Test and Iterate on Prompts Before Publishing - PRPM",
  description: "Test your own custom system prompts in PRPM Playground. Use --compare mode to A/B test prompts against baselines. Perfect for authors who want to iterate rapidly before publishing packages.",
  openGraph: {
    title: "Custom Prompts for Verified Authors: Test and Iterate on Prompts Before Publishing",
    description: "Test custom system prompts in PRPM Playground. A/B test against baselines, iterate rapidly, and perfect your prompts before publishing.",
    images: ['/custom-prompts.png'],
  },
}

export default function CustomPromptsPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Feature', 'Playground', 'PRPM+']}
          title="Custom Prompts for Verified Authors: Test and Iterate on Prompts Before Publishing"
          subtitle="A/B test your custom system prompts against baselines. Iterate rapidly. Perfect your prompts before publishing."
          author="PRPM Team"
          date="November 10, 2025"
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
        ">
          <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 mb-8">
            <p className="text-xl text-gray-300 leading-relaxed italic mb-0">
              Today, we're launching Custom Prompts for verified authors—test your own system prompts in the Playground before publishing. Use <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded text-sm">--compare</code> mode to see exactly how your prompt changes AI behavior side-by-side with the baseline.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Problem: No Good Way to Test Prompts</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            You're writing a new prompt package—maybe a code reviewer, documentation generator, or migration assistant. You tweak the system prompt, wondering: does this actually improve the output, or am I just moving words around?
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            If you're not using PRPM, your workflow looks like this:
          </p>

          <div className="not-prose mb-8">
            <ol className="list-decimal list-inside text-gray-300 space-y-3 mb-0">
              <li>Write prompt in <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm">.cursor/rules</code> or <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm">.claude/skills/</code></li>
              <li>Reload your editor or restart Claude Code</li>
              <li>Ask the AI a test question in your editor</li>
              <li>Realize it needs work</li>
              <li>Edit the prompt file</li>
              <li>Reload/restart editor again</li>
              <li>Test again</li>
              <li>Repeat 10 more times</li>
            </ol>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            This is slow. You're reloading your editor constantly, testing in production, and you have no way to compare "with prompt" vs. "without prompt" to see if your changes actually help.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            Even if you're using PRPM, the old workflow was:
          </p>

          <div className="not-prose mb-8">
            <ol className="list-decimal list-inside text-gray-300 space-y-3 mb-0">
              <li>Write a prompt locally</li>
              <li>Create <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm">prpm.json</code> manifest</li>
              <li>Publish it to PRPM as version 0.0.1</li>
              <li>Test it in Playground</li>
              <li>Realize it needs work</li>
              <li>Edit the prompt locally</li>
              <li>Bump version to 0.0.2 and publish again</li>
              <li>Test the new version</li>
              <li>Repeat 10 more times (versions 0.0.3 through 0.0.12)</li>
            </ol>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Better than the no-PRPM workflow, but still slow and pollutes your package history with a dozen draft versions. You're publishing to test, which feels backwards.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Solution: Test Custom Prompts Before Publishing</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Custom Prompts lets verified authors (those who link their GitHub account) test their own system prompts directly in the Playground—no publishing required. You can iterate on your prompt locally, test it against real AI models, and see exactly how it changes behavior.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Who Can Use Custom Prompts?</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              This feature is available to <strong className="text-white">verified authors only</strong>. To become a verified author:
            </p>

            <ol className="list-decimal list-inside text-gray-300 space-y-3 mb-8">
              <li>Sign up for PRPM</li>
              <li>Link your GitHub account in settings</li>
              <li>You're now verified and can use Custom Prompts</li>
            </ol>

            <p className="text-gray-300 leading-relaxed mb-0">
              Why verified authors only? Custom prompts cost 2x normal credits (no caching), and we want to ensure this feature is used by people building packages, not just experimenting randomly.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">How It Works: Web UI and CLI</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">From the Web Browser</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              In the Playground, you'll see a toggle: <strong className="text-white">"Use Custom Prompt"</strong>. Enable it, paste your system prompt, and test it against any AI model. You can iterate rapidly: edit your prompt, click submit, and see the new results in seconds.
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              Here's a hilarious example: someone created a custom prompt "You are a helpful assistant that only speaks in emojis" and asked a Python question. The AI responded entirely in emojis:
            </p>

            <div className="my-8 rounded-xl overflow-hidden border border-prpm-border">
              <Image
                src="/custom-prompts.png"
                alt="Example of custom prompt that makes AI respond in emojis"
                width={1200}
                height={800}
                className="w-full h-auto"
              />
            </div>

            <p className="text-gray-300 leading-relaxed mb-0">
              This is a perfect example of how Custom Prompts let you experiment with different styles. Want an AI that writes like a pirate? A formal business analyst? A sarcastic code reviewer? Just write the prompt and test it immediately.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">From the CLI</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              The CLI is where Custom Prompts really shine. You can pass a custom prompt inline or via a file:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Inline custom prompt
prpm playground --custom "You are an expert Python code reviewer" \\
  --input "Review this: print('hello')"

# From a file (recommended for iteration)
prpm playground --prompt-file ./my-prompt.txt \\
  --input "Review this: print('hello')"`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              Using <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">--prompt-file</code> is the recommended workflow. You can edit your prompt file in your favorite editor, save it, and immediately test the new version. No copy-pasting. No context switching.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">A/B Testing with --compare</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Here's what makes Custom Prompts absolutely game-changing: <strong className="text-white">the <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">--compare</code> flag</strong>.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            When you add <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">--compare</code> to your CLI command, PRPM runs two tests side-by-side:
          </p>

          <div className="not-prose mb-8">
            <ol className="list-decimal list-inside text-gray-300 space-y-3">
              <li><strong className="text-white">Baseline (no prompt):</strong> The AI model responds to your input with no custom prompt</li>
              <li><strong className="text-white">Your custom prompt:</strong> The same input, but with your custom system prompt applied</li>
            </ol>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            This means you can see exactly how your prompt changes the AI's behavior. Does it make the output more structured? More verbose? More concise? More accurate? You'll know immediately.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Real-World Example: Code Review Prompt</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Let's say you're building a code review prompt. You want it to be thorough but not overwhelming. Here's how you'd test it:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Create your prompt file
cat > code-reviewer.txt << 'EOF'
You are an expert code reviewer. When reviewing code:
1. Identify bugs and logic errors
2. Suggest performance improvements
3. Check for security vulnerabilities
4. Keep feedback concise and actionable
EOF

# Test it with compare mode
prpm playground --prompt-file ./code-reviewer.txt \\
  --input "Review this: function add(a,b) { return a+b; }" \\
  --compare`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              You'll see two responses:
            </p>

            <div className="bg-prpm-dark border border-prpm-border rounded-xl p-6 mb-8">
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-2 font-semibold">Baseline (no prompt):</div>
                <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4 text-gray-300 text-sm">
                  "This function looks good. It adds two numbers together."
                </div>
              </div>
              <div>
                <div className="text-sm text-prpm-accent mb-2 font-semibold">With your custom prompt:</div>
                <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4 text-gray-300 text-sm">
                  <p className="mb-3 font-semibold">Code Review:</p>
                  <ul className="space-y-2 list-disc ml-6">
                    <li><strong className="text-white">Logic:</strong> Function works correctly for numbers</li>
                    <li><strong className="text-white">Bug:</strong> No type checking—will concatenate strings instead of adding</li>
                    <li><strong className="text-white">Suggestion:</strong> Add input validation or use TypeScript</li>
                    <li><strong className="text-white">Security:</strong> No concerns for this simple function</li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="text-gray-300 leading-relaxed mb-0">
              The difference is obvious. Your prompt makes the AI spot a real bug (string concatenation) that the baseline missed. This is exactly the kind of insight you need when refining prompts.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Rapid Iteration Workflow</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              The <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">--compare</code> flag enables a workflow that's impossible without it:
            </p>

            <ol className="list-decimal list-inside text-gray-300 space-y-6 mb-8">
              <li>
                <strong className="text-white">Write your prompt</strong>
                <p className="text-gray-300 ml-6 mt-2">Create <code className="text-prpm-accent bg-prpm-dark px-2 py-1 rounded text-sm">prompt.txt</code> with your initial idea</p>
              </li>
              <li>
                <strong className="text-white">Test with compare mode</strong>
                <pre className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4 overflow-x-auto ml-6 mt-2">
                  <code className="text-sm text-gray-300 font-mono">prpm playground --prompt-file ./prompt.txt --input "test case" --compare</code>
                </pre>
              </li>
              <li>
                <strong className="text-white">Review the diff</strong>
                <p className="text-gray-300 ml-6 mt-2">See exactly what your prompt changes</p>
              </li>
              <li>
                <strong className="text-white">Edit your prompt</strong>
                <p className="text-gray-300 ml-6 mt-2">Tweak the wording, add constraints, refine the instructions</p>
              </li>
              <li>
                <strong className="text-white">Re-run the same command</strong>
                <p className="text-gray-300 ml-6 mt-2">Up-arrow in your terminal, hit enter, see the new results</p>
              </li>
              <li>
                <strong className="text-white">Repeat until perfect</strong>
                <p className="text-gray-300 ml-6 mt-2">Iterate 10 times in 10 minutes instead of 10 days</p>
              </li>
            </ol>

            <p className="text-gray-300 leading-relaxed mb-0">
              This is <strong className="text-white">the fastest way to iterate on prompts</strong>. You're testing the same input every time, so you can see exactly how each change affects the output. No guessing. No publishing drafts. Just edit, test, repeat.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Example: Building a Security Code Reviewer</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            You're building a security-focused code reviewer. You want it to catch SQL injection, XSS, and authentication bugs without overwhelming developers with false positives.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            Create <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm">security-reviewer.txt</code>, test it with real vulnerable code, and use <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm">--compare</code> to ensure your prompt catches real issues without false positives:
          </p>

          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
            <code className="text-sm text-gray-300 font-mono">{`prpm playground --prompt-file ./security-reviewer.txt \\
  --input "const query = 'SELECT * FROM users WHERE id = ' + userId" \\
  --compare`}</code>
          </pre>

          <p className="text-gray-300 leading-relaxed mb-16">
            Iterate until your prompt consistently catches vulnerabilities. Then publish it as a package for others to use.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Getting Started</h2>
          </div>

          <div className="not-prose bg-gradient-to-br from-prpm-accent/20 via-prpm-dark-card to-prpm-dark border border-prpm-accent/50 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Quick Start Guide</h3>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">1</div>
                  <h4 className="text-lg font-semibold text-white">Verify Your Account</h4>
                </div>
                <p className="text-gray-300 ml-11 mb-0">
                  Link your GitHub account in <Link href="/settings" className="text-prpm-accent hover:underline font-medium">settings</Link> to become a verified author
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">2</div>
                  <h4 className="text-lg font-semibold text-white">Write Your Prompt</h4>
                </div>
                <p className="text-gray-300 ml-11 mb-0">
                  Create a text file with your custom system prompt
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">3</div>
                  <h4 className="text-lg font-semibold text-white">Test with Compare Mode</h4>
                </div>
                <div className="ml-11">
                  <pre className="bg-prpm-dark border border-prpm-border rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono mb-0">
{`prpm playground --prompt-file ./my-prompt.txt \\
  --input "your test case" \\
  --compare`}
                  </pre>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">4</div>
                  <h4 className="text-lg font-semibold text-white">Iterate Rapidly</h4>
                </div>
                <p className="text-gray-300 ml-11 mb-0">
                  Edit your prompt file, re-run the command, see the new results
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-prpm-accent flex items-center justify-center font-bold text-white">5</div>
                  <h4 className="text-lg font-semibold text-white">Publish When Perfect</h4>
                </div>
                <p className="text-gray-300 ml-11 mb-0">
                  Once you're happy with the results, publish your prompt as a PRPM package
                </p>
              </div>
            </div>
          </div>

          <div className="not-prose mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Web UI Alternative</h3>
            <p className="text-gray-300 mb-4">
              Prefer the browser? Go to the <Link href="/playground" className="text-prpm-accent hover:underline font-medium">Playground</Link>, enable "Use Custom Prompt", and paste your prompt. Perfect for quick experiments before moving to CLI for serious iteration.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-accent/10 to-prpm-dark border border-prpm-accent/30 rounded-xl p-8 mb-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Start Testing Custom Prompts</h3>
            <p className="text-gray-300 mb-6">Verified authors only • 2x credit cost • A/B testing included</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/playground"
                className="px-8 py-3 bg-prpm-accent hover:bg-prpm-accent/80 text-white font-semibold rounded-lg transition-colors"
              >
                Open Playground
              </Link>
              <Link
                href="/settings"
                className="px-8 py-3 bg-prpm-dark-card hover:bg-prpm-dark border border-prpm-border hover:border-prpm-accent text-gray-300 font-semibold rounded-lg transition-colors"
              >
                Verify Your Account
              </Link>
            </div>
          </div>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-4">Questions?</h2>

            <p className="text-gray-300 leading-relaxed text-lg mb-4">
              We'd love to hear how you're using Custom Prompts. Share your discoveries, ask questions, or suggest improvements:
            </p>

            <ul className="list-disc ml-6 text-gray-300 space-y-2 mb-0">
              <li>Twitter: <a href="https://twitter.com/prpmdev" className="text-prpm-accent hover:underline font-medium">@prpmdev</a></li>
              <li>Email: <a href="mailto:hello@prpm.dev" className="text-prpm-accent hover:underline font-medium">hello@prpm.dev</a></li>
            </ul>
          </div>

          <p className="text-gray-400 text-sm italic">
            Custom Prompts are available now for all verified authors. Test in the <Link href="/playground" className="text-prpm-accent hover:underline">Playground</Link> or via CLI with <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded">prpm playground --prompt-file</code>. Start iterating today.
          </p>
        </div>
      </article>

      <BlogFooter postTitle="Custom Prompts for Verified Authors: Test and Iterate on Prompts Before Publishing" postUrl="/blog/custom-prompts-for-verified-authors" />
    </main>
  )
}
