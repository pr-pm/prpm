import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Cursor Rules: The Complete Guide to AI-Powered Coding Standards - PRPM",
  description: "Master cursor rules to guide AI assistants in Cursor IDE. Learn what they are, how to use them, and discover 2500+ ready-to-use cursor rules packages for React, Python, TypeScript, security, and more.",
  openGraph: {
    title: "Cursor Rules: The Complete Guide to AI-Powered Coding Standards",
    description: "Master cursor rules to guide AI assistants. Discover 2500+ ready-to-use packages for React, Python, TypeScript, security, and more.",
  },
}

export default function CursorRulesPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Cursor', 'AI Development', 'Tutorial', 'Best Practices']}
          title="Cursor Rules: The Complete Guide to AI-Powered Coding Standards"
          subtitle="Cursor rules are system-level instructions that guide Claude and other AI assistants in Cursor IDE. They're injected at the prompt level to maintain consistent coding patterns across your projects—no more repeating the same instructions in every chat."
          author="PRPM Team"
          date="November 12, 2025"
          readTime="8 min read"
        />

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

          <p className="text-gray-300 leading-relaxed mb-6">
            According to the <a href="https://cursor.com/docs/context/rules" target="_blank" rel="noopener noreferrer">official Cursor documentation</a>, rules function as "persistent context, preferences, or workflows for your projects." Think of them as <code>.eslintrc</code> for your AI assistant.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            Over 2500+ cursor rules are now available in the PRPM registry, covering everything from React best practices to OWASP security patterns. Here's how to find, use, and create your own.
          </p>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">What Are Cursor Rules?</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            Cursor rules are persistent instructions that tell AI assistants how to write code in your projects. Since LLMs lack memory between completions, rules get injected at the prompt level for every AI interaction.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            <strong>Why they matter:</strong> Teams using cursor rules report 40-60% fewer revision cycles on AI-generated code because the AI gets it right the first time.
          </p>

          <div className="not-prose mb-10">
            <p className="text-gray-300 leading-relaxed mb-4"><strong className="text-white">Where they apply:</strong></p>
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li>✅ Agent (Chat) - Conversational AI coding assistant</li>
              <li>✅ Inline Edit - Quick AI-powered code modifications</li>
              <li>❌ Cursor Tab (uses different context mechanisms)</li>
            </ul>
          </div>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Types of Cursor Rules</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-4">1. Project Rules</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Stored in <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">.cursor/rules/</code> directory. Version-controlled, travel with your repository.
            </p>
            <p className="text-gray-300 leading-relaxed mb-8">
              <strong className="text-white">Use for:</strong> Framework patterns, repository standards, project-specific workflows
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-4">2. User Rules</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Global settings in Cursor Settings. Apply across all your projects.
            </p>
            <p className="text-gray-300 leading-relaxed mb-8">
              <strong className="text-white">Use for:</strong> Personal coding preferences, language-specific patterns
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-4">3. Team Rules</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Organization-wide rules via Cursor dashboard (Team/Enterprise plans).
            </p>
            <p className="text-gray-300 leading-relaxed mb-8">
              <strong className="text-white">Use for:</strong> Company coding standards, security requirements, architecture patterns
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-4">4. AGENTS.md</h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              Plain markdown file in project root—simpler alternative to Project Rules.
            </p>
            <p className="text-gray-300 leading-relaxed mb-8">
              <strong className="text-white">Use for:</strong> Quick setup, simple rule definitions
            </p>
          </div>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">File Format</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Project rules use MDC format—markdown with frontmatter:
          </p>

          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8"><code className="text-sm text-gray-300 font-mono">{`---
description: React hooks best practices
globs: ["**/*.tsx", "**/*.jsx"]
alwaysApply: false
---

# React Hooks Rules

- Use functional components with hooks over class components
- Call hooks at the top level (never inside conditionals)
- Extract complex logic into custom hooks
- Handle cleanup in useEffect return functions

## Example

\`\`\`tsx
function UserProfile({ userId }) {
  const user = useUser(userId);

  useEffect(() => {
    const sub = subscribeToUser(userId);
    return () => sub.unsubscribe();
  }, [userId]);

  return <div>{user.name}</div>;
}
\`\`\`
`}</code></pre>

          <p className="text-gray-300 leading-relaxed mb-8">
            <strong>Legacy format:</strong> The deprecated <code>.cursorrules</code> file still works but migration is recommended.
          </p>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Best Practices</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Keep Rules Under 500 Lines</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Split large rules into focused components. Shorter rules perform better.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Be Specific, Not Generic</h3>

            <p className="text-gray-300 leading-relaxed mb-4">❌ <strong className="text-white">Bad:</strong> "Write clean code with proper error handling"</p>

            <p className="text-gray-300 leading-relaxed mb-8">✅ <strong className="text-white">Good:</strong> "Wrap all async functions in try-catch blocks. Return typed errors using Result&lt;T, E&gt; pattern. Log errors with context: logger.error(&#123; userId, action, error &#125;)"</p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Provide Concrete Examples</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Show the AI what good looks like. Include code examples, file references, and reasoning for non-obvious choices.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Scope with Globs</h3>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8"><code className="text-sm text-gray-300 font-mono">{`globs: ["**/*.ts", "**/*.tsx"]  # TypeScript only
globs: ["**/*.test.ts"]         # Test files only
globs: ["src/api/**/*.ts"]      # API directory only`}</code></pre>
          </div>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Top Cursor Rules Packages</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            PRPM's registry contains 2500+ cursor rules covering every major framework, language, and development workflow.
          </p>

          <div className="not-prose my-12 p-8 bg-gradient-to-br from-prpm-accent/10 to-prpm-purple/10 border border-prpm-accent/30 rounded-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">📚 Complete Curated List</h3>
            <p className="text-gray-300 mb-6">
              We've curated the top 50 cursor rules across all categories—frontend, backend, testing, security, DevOps, and more. Each package is quality-scored and categorized.
            </p>
            <Link
              href="/blog/top-50-cursor-rules"
              className="inline-flex items-center px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-hover text-white font-semibold rounded-lg transition-colors"
            >
              View Top 50 Cursor Rules →
            </Link>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Start Here</h3>

            <p className="text-gray-300 leading-relaxed mb-4">
              <a href="https://prpm.dev/packages/prpm/creating-cursor-rules" className="text-prpm-accent hover:underline font-medium">@prpm/creating-cursor-rules</a> ⭐ Verified
            </p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-4"><code className="text-sm text-gray-300 font-mono">prpm install @prpm/creating-cursor-rules</code></pre>
            <p className="text-gray-300 leading-relaxed mb-8">
              Official meta-rule teaching how to write effective cursor rules. Start here before exploring the full catalog.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Quick Examples by Category</h3>

            <ul className="space-y-4 text-gray-300">
              <li>
                <strong className="text-white">Frontend:</strong> <a href="https://prpm.dev/packages/sanjeed5/react" className="text-prpm-accent hover:underline">@sanjeed5/react</a>, <a href="https://prpm.dev/packages/sanjeed5/next-js" className="text-prpm-accent hover:underline">@sanjeed5/next-js</a>, <a href="https://prpm.dev/packages/sanjeed5/vue3" className="text-prpm-accent hover:underline">@sanjeed5/vue3</a>
              </li>
              <li>
                <strong className="text-white">Backend:</strong> <a href="https://prpm.dev/packages/sanjeed5/python" className="text-prpm-accent hover:underline">@sanjeed5/python</a>, <a href="https://prpm.dev/packages/sanjeed5/fastapi" className="text-prpm-accent hover:underline">@sanjeed5/fastapi</a>, <a href="https://prpm.dev/packages/sanjeed5/nestjs" className="text-prpm-accent hover:underline">@sanjeed5/nestjs</a>
              </li>
              <li>
                <strong className="text-white">Testing:</strong> <a href="https://prpm.dev/packages/prpm/github-actions-testing" className="text-prpm-accent hover:underline">@prpm/github-actions-testing</a>, <a href="https://prpm.dev/packages/sanjeed5/cypress" className="text-prpm-accent hover:underline">@sanjeed5/cypress</a>
              </li>
              <li>
                <strong className="text-white">Security:</strong> <a href="https://prpm.dev/packages/ivangrynenko/python-security-misconfiguration" className="text-prpm-accent hover:underline">@ivangrynenko/python-security-misconfiguration</a> (OWASP-aligned)
              </li>
              <li>
                <strong className="text-white">DevOps:</strong> <a href="https://prpm.dev/packages/sanjeed5/kubernetes" className="text-prpm-accent hover:underline">@sanjeed5/kubernetes</a>, <a href="https://prpm.dev/packages/awesome-copilot/copilot-containerization-docker-best-practices" className="text-prpm-accent hover:underline">@awesome-copilot/copilot-containerization-docker-best-practices</a>
              </li>
            </ul>

            <p className="text-gray-300 leading-relaxed mt-8">
              <a href="/blog/top-50-cursor-rules" className="text-prpm-accent hover:underline font-medium">See the complete top 50 list with installation commands and descriptions →</a>
            </p>

            <p className="text-gray-300 leading-relaxed mt-4">
              <a href="https://prpm.dev/search?q=cursor" className="text-prpm-accent hover:underline font-medium">Or browse all 2500+ packages in the registry →</a>
            </p>
          </div>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Creating Your Own Cursor Rules</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Start with the Meta-Package</h3>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">prpm install @prpm/creating-cursor-rules</code></pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              This gives the AI context on how to help you write effective rules.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Be Specific with Examples</h3>

            <p className="text-gray-300 leading-relaxed mb-4">Bad cursor rules:</p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`- Write clean code
- Use best practices
- Handle errors properly`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-4">Good cursor rules:</p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8"><code className="text-sm text-gray-300 font-mono">{`## Error Handling

All async functions must use try-catch with typed errors:

\`\`\`typescript
type ApiError = { code: string; message: string; details?: unknown };

async function fetchData(): Promise<Data> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw { code: 'FETCH_ERROR', message: response.statusText } as ApiError;
    }
    return response.json();
  } catch (error) {
    logger.error('Failed to fetch data', { error });
    throw error;
  }
}
\`\`\`

## API Routes

All Next.js API routes return standardized responses:

\`\`\`typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };
\`\`\`
`}</code></pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Template</h3>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8"><code className="text-sm text-gray-300 font-mono">{`---
description: [What this rule does]
globs: ["[file patterns]"]
alwaysApply: [true/false]
---

# [Rule Name]

## Patterns

### [Category 1]

[Specific instruction]

\`\`\`[language]
// Good example
[code showing correct pattern]
\`\`\`

### [Category 2]

[Specific instruction with examples]

## Common Mistakes

- [Mistake 1 and how to avoid it]
- [Mistake 2 and how to avoid it]

## References

- See [file path] for implementation example
`}</code></pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Test and Iterate</h3>

            <ol className="text-gray-300 space-y-6 mb-8 list-decimal list-inside">
              <li><strong className="text-white">Test with the AI</strong> - Ask it to generate code following the rule</li>
              <li><strong className="text-white">Review output</strong> - Does it match expectations?</li>
              <li><strong className="text-white">Refine</strong> - Add examples for edge cases</li>
              <li><strong className="text-white">Iterate</strong> - Rules improve with real-world usage</li>
            </ol>
          </div>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The PRPM Advantage</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Cross-Platform Compatibility</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong>Cursor rules installed via PRPM work in Claude, Cline, Windsurf, and other AI IDEs.</strong>
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`prpm install @sanjeed5/react

# Same rules automatically work in:
# - Cursor IDE
# - Claude Desktop
# - Cline (VS Code extension)
# - Windsurf
# - Any AI IDE supporting PRPM format`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              PRPM handles format conversion. Your cursor rules become universal AI instructions.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Package Management for AI Prompts</h3>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`# Version control
prpm install @sanjeed5/react@1.2.0
prpm install @sanjeed5/react@latest

# Updates
prpm outdated
prpm update @sanjeed5/react
prpm update  # Update all

# Dependency resolution
prpm install @sanjeed5/next-js
# Automatically installs compatible:
# - @sanjeed5/react
# - @sanjeed5/typescript`}</code></pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Quality Indicators</h3>

            <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
              <li>✅ <strong className="text-white">Verified packages</strong> - From official maintainers</li>
              <li>📦 <strong className="text-white">Download counts</strong> - Community validation</li>
              <li>🏷️ <strong className="text-white">Clear categorization</strong> - Tags for discovery</li>
              <li>📝 <strong className="text-white">Comprehensive descriptions</strong> - Know what you're installing</li>
            </ul>
          </div>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Getting Started</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">1. Install PRPM</h3>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8"><code className="text-sm text-gray-300 font-mono">npm install -g prpm</code></pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">2. Search for Rules</h3>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`prpm search cursor
prpm search react cursor
prpm search python security`}</code></pre>
            <p className="text-gray-300 leading-relaxed mb-8">
              Or browse at <a href="https://prpm.dev" className="text-prpm-accent hover:underline font-medium">prpm.dev</a>
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">3. Install Rules for Your Stack</h3>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8"><code className="text-sm text-gray-300 font-mono">{`# Meta-package first
prpm install @prpm/creating-cursor-rules

# Frontend
prpm install @sanjeed5/react
prpm install @sanjeed5/typescript

# Backend
prpm install @sanjeed5/python
prpm install @sanjeed5/fastapi

# Security
prpm install @ivangrynenko/python-security-misconfiguration`}</code></pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">4. Verify Installation</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Check Cursor Settings → Rules → Project Rules to verify installed rules appear in <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">.cursor/rules/</code> directory.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">5. Test the Rules</h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              Open Cursor's AI chat:
            </p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">You: "Create a Next.js API route that fetches user data"</code></pre>
            <p className="text-gray-300 leading-relaxed mb-8">
              The AI should generate code matching your installed rules (error handling, type definitions, response formats).
            </p>
          </div>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Conclusion</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            Cursor rules transform AI-assisted development from constant instruction repetition to automatic pattern enforcement.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            With 2500+ cursor rules in PRPM registry:
          </p>

          <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
            <li><strong className="text-white">Install proven patterns</strong> from the community</li>
            <li><strong className="text-white">Maintain consistency</strong> with version-controlled rules</li>
            <li><strong className="text-white">Work cross-platform</strong> in Cursor, Claude, Cline, Windsurf</li>
            <li><strong className="text-white">Share your knowledge</strong> by publishing packages</li>
          </ul>

          <p className="text-gray-300 leading-relaxed mb-8">
            Start with <a href="https://prpm.dev/packages/prpm/creating-cursor-rules" className="text-prpm-accent hover:underline font-medium">@prpm/creating-cursor-rules</a> to learn the patterns. Then explore packages for your stack.
          </p>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-4">Resources</h2>

            <p className="text-gray-300 leading-relaxed mb-4"><strong className="text-white">Official:</strong></p>
            <ul className="list-disc ml-6 text-gray-300 space-y-2 mb-6">
              <li><a href="https://cursor.com/docs/context/rules" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline">Cursor Rules Documentation</a></li>
              <li><a href="https://docs.prpm.dev" target="_blank" rel="noopener noreferrer" className="text-prpm-accent hover:underline">PRPM Documentation</a></li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-4"><strong className="text-white">Registry:</strong></p>
            <ul className="list-disc ml-6 text-gray-300 space-y-2 mb-6">
              <li><a href="https://prpm.dev/search?q=cursor" className="text-prpm-accent hover:underline">Browse 2500+ Cursor Rules</a></li>
              <li><a href="https://prpm.dev" className="text-prpm-accent hover:underline">PRPM Registry</a></li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-4"><strong className="text-white">Quick Start:</strong></p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">{`npm install -g prpm
prpm install @prpm/creating-cursor-rules`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              Then browse <a href="https://prpm.dev/search?q=cursor" className="text-prpm-accent hover:underline">2500+ cursor rules packages</a> for your stack.
            </p>
          </div>

          <div className="not-prose my-12 p-8 bg-gradient-to-br from-prpm-accent/10 to-prpm-purple/10 border border-prpm-accent/30 rounded-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to try PRPM?</h3>
            <p className="text-gray-300 mb-6">
              Install your first cursor rules package in under 60 seconds
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/search?q=cursor"
                className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-hover text-white font-semibold rounded-lg transition-colors"
              >
                Browse Packages
              </Link>
              <a
                href="https://docs.prpm.dev"
                className="px-6 py-3 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white font-semibold rounded-lg transition-colors"
              >
                Read the Docs
              </a>
            </div>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-6 my-8">
            <h2 className="text-3xl font-bold text-white mb-0">Related Posts</h2>
          </div>

          <div className="not-prose grid gap-4 md:grid-cols-2 mb-8">
            <Link href="/blog/top-50-cursor-rules" className="block p-6 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent rounded-xl transition-all">
              <h3 className="text-lg font-bold text-white mb-2">Top 50 Cursor Rules</h3>
              <p className="text-gray-400 text-sm">Supercharge your development workflow</p>
            </Link>
            <Link href="/blog/discovering-cursor-rules" className="block p-6 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent rounded-xl transition-all">
              <h3 className="text-lg font-bold text-white mb-2">Best Cursor Rules: Complete Guide 2025</h3>
              <p className="text-gray-400 text-sm">Compare PRPM vs cursor.directory</p>
            </Link>
          </div>
        </div>
      </article>

      <BlogFooter
        postTitle="Cursor Rules: The Complete Guide to AI-Powered Coding Standards"
        postUrl="/blog/cursor-rules"
      />
    </main>
  )
}
