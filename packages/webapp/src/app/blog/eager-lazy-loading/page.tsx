import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "Eager vs Lazy Loading: Control When Your AI Skills Activate - PRPM",
  description: "Some skills must always be active. Others should wait until needed. Now package authors can control activation with eager/lazy loading in PRPM.",
  openGraph: {
    title: "Eager vs Lazy Loading: Control When Your AI Skills Activate",
    description: "Control when skills and agents activate with PRPM's new eager/lazy loading flags. Always-on coding standards or on-demand helpers—you choose.",
  },
}

export default function EagerLazyLoadingPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Feature Release', 'Technical', 'Developer Experience']}
          title="Eager vs Lazy Loading: Control When Your AI Skills Activate"
          subtitle="Some skills must always be active. Others should wait until needed. Package authors can now control when skills load."
          author="PRPM Team"
          date="December 8, 2025"
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
          prose-table:border-collapse prose-table:w-full prose-table:my-8 prose-table:text-gray-300
          prose-thead:border-b-2 prose-thead:border-prpm-border
          prose-th:text-left prose-th:text-white prose-th:bg-prpm-dark-card prose-th:px-4 prose-th:py-4 prose-th:font-semibold prose-th:border prose-th:border-prpm-border
          prose-td:px-4 prose-td:py-4 prose-td:border prose-td:border-prpm-border
          prose-hr:border-prpm-border prose-hr:my-12
        ">

          <p>
            AI coding assistants have limited context windows. Load too many skills at once and you waste tokens on capabilities you don't need. But some skills—coding standards, security rules, architectural patterns—can't wait for "relevance." They need to be active from the start.
          </p>

          <p>
            PRPM now supports <strong>eager</strong> and <strong>lazy</strong> loading flags, giving package authors and users control over when skills activate.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Problem: Not All Skills Are Created Equal</h2>
          </div>

          <p className="mb-8">
            Progressive disclosure formats like AGENTS.md, GEMINI.md, and CLAUDE.md list available skills but don't load them into context until explicitly requested. This keeps your AI assistant's context clean and efficient.
          </p>

          <p className="mb-8">
            But here's the issue: some skills <strong>must</strong> be active in every session. Your team's coding standards. Security rules. API design patterns. If these skills wait for the AI to "realize" they're relevant, you get inconsistent code.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Example: The Coding Standards Problem</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              You install a skill with your team's TypeScript conventions. The AI starts writing code. It uses <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">any</code> types because it doesn't know your standards forbid them. You catch it in code review. Three files later, same problem.
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              Why? The skill was <strong>available</strong> but not <strong>active</strong>. The AI didn't realize it needed to load your standards before generating code.
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              That's what eager loading fixes.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">How It Works: Eager vs Lazy</h2>
          </div>

          <div className="not-prose mb-8">
            <table className="w-full border-collapse text-gray-300">
              <thead className="border-b-2 border-prpm-border">
                <tr>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Mode</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">When It Activates</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Use For</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Eager</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">Immediately at session start</td>
                  <td className="px-4 py-4 border border-prpm-border">Coding standards, security rules, architectural patterns</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Lazy (default)</strong></td>
                  <td className="px-4 py-4 border border-prpm-border">On-demand when task matches description</td>
                  <td className="px-4 py-4 border border-prpm-border">Specialized helpers, domain expertise, framework migrations</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Eager Skills: Always Active</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              When you install a skill with <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">--eager</code>, it's loaded at the start of every session. The AI doesn't need to think "should I load this?"—it's already there.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Install coding standards that must always apply
prpm install @myteam/typescript-standards --eager

# Install security rules that can't be forgotten
prpm install @myteam/api-security-rules --eager`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              These skills appear in a special <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">priority="0"</code> section in your manifest file:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`<skills_system priority="0">
<usage>
MANDATORY: You MUST load and apply these skills at the START of every session.
Do not wait for relevance - these are always active.
</usage>

<eager_skills>
<skill activation="eager">
  <name>typescript-standards</name>
  <description>Team TypeScript coding conventions</description>
  <path>.openskills/typescript-standards/SKILL.md</path>
</skill>
</eager_skills>
</skills_system>`}</code>
            </pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Lazy Skills: On-Demand Only</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Most skills should be lazy. They're available when needed but don't clutter your context window until the AI determines they're relevant.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Install a specialized skill for occasional use
prpm install @prpm/aws-cdk-expert

# Or explicitly mark as lazy (default behavior)
prpm install @prpm/debugging-helper --lazy`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              Lazy skills appear in a <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">priority="1"</code> section and are only loaded when the AI determines they match the current task:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`<skills_system priority="1">
<usage>
When users ask you to perform tasks, check if any of the available skills
below can help complete the task more effectively.

How to use skills:
- Invoke: Bash("cat <path>")
- The skill content will load into your current context
</usage>

<available_skills>
<skill activation="lazy">
  <name>aws-cdk-expert</name>
  <description>AWS CDK infrastructure patterns and best practices</description>
  <path>.openskills/aws-cdk-expert/SKILL.md</path>
</skill>
</available_skills>
</skills_system>`}</code>
            </pre>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Package Authors: Set Defaults</h2>
          </div>

          <p className="mb-8">
            If you're publishing a package that should always be active, set <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">eager: true</code> in your <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">prpm.json</code>:
          </p>

          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
            <code className="text-sm text-gray-300 font-mono">{`{
  "name": "@myteam/mandatory-code-standards",
  "version": "1.0.0",
  "description": "Team coding standards that must always apply",
  "format": "claude",
  "subtype": "skill",
  "eager": true,
  "files": [".claude/skills/mandatory-code-standards/SKILL.md"]
}`}</code>
          </pre>

          <p className="mb-8">
            Now when users install your package, it defaults to eager activation—unless they explicitly override with <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">--lazy</code>.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">File-Level Control in Collections</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              For multi-file packages, you can mark specific files as eager:
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`{
  "name": "@myteam/fullstack-standards",
  "version": "1.0.0",
  "description": "Team standards collection",
  "format": "claude",
  "subtype": "skill",
  "files": [
    {
      "path": ".claude/skills/typescript-conventions.md",
      "format": "claude",
      "subtype": "skill",
      "eager": true
    },
    {
      "path": ".claude/skills/react-best-practices.md",
      "format": "claude",
      "subtype": "skill",
      "eager": true
    },
    {
      "path": ".claude/skills/debugging-helpers.md",
      "format": "claude",
      "subtype": "skill"
    }
  ]
}`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              In this example, TypeScript conventions and React best practices load eagerly, while debugging helpers wait until needed.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Precedence: Who Wins?</h2>
          </div>

          <p className="mb-8">
            What happens when a package says "eager" but you want lazy? Precedence determines the final activation mode:
          </p>

          <ol className="list-decimal list-inside text-gray-300 space-y-6 mb-8">
            <li><strong className="text-white">CLI flag:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">prpm install --eager</code> or <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">--lazy</code> (highest priority)</li>
            <li><strong className="text-white">File-level setting:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">eager: true</code> on individual file in enhanced files format</li>
            <li><strong className="text-white">Package-level setting:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">eager: true</code> in <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">prpm.json</code></li>
            <li><strong className="text-white">Default:</strong> Lazy (on-demand activation)</li>
          </ol>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Examples</h3>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
              <code className="text-sm text-gray-300 font-mono">{`# Package says "eager", but you want lazy
prpm install @myteam/standards --lazy

# Package says "lazy", but you need it always active
prpm install @vendor/helper --eager

# Trust the package author's judgment
prpm install @myteam/standards  # uses package default`}</code>
            </pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              Users always have final control, but package authors can express their intent about how their packages should be used.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">When to Use Each Mode</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Use Eager For:</h3>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><strong className="text-white">Coding standards</strong> - TypeScript conventions, naming patterns, file organization</li>
              <li><strong className="text-white">Security rules</strong> - Authentication patterns, input validation, secret handling</li>
              <li><strong className="text-white">Architectural patterns</strong> - API design, database schemas, service boundaries</li>
              <li><strong className="text-white">Testing requirements</strong> - Coverage minimums, test structure, mocking strategies</li>
              <li><strong className="text-white">Code review checklists</strong> - What every PR must include</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              These can't be forgotten. They apply to every file, every function, every session.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Use Lazy For:</h3>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><strong className="text-white">Framework expertise</strong> - Next.js patterns, React hooks, Vue composition API</li>
              <li><strong className="text-white">Domain knowledge</strong> - Payment processing, real-time messaging, ML pipelines</li>
              <li><strong className="text-white">Migration tools</strong> - Version upgrades, API changes, deprecation handling</li>
              <li><strong className="text-white">Debugging helpers</strong> - Performance profiling, error diagnosis, log analysis</li>
              <li><strong className="text-white">Specialized utilities</strong> - Data transformations, config generators, boilerplate creation</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              These are powerful when needed but would waste context window space if always loaded.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">What This Unlocks</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">1. Always-On Standards Packages</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Companies can now publish internal standards as eager packages. Install once, and every developer's AI assistant follows the same rules—no more "I forgot to check the style guide."
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Published by your platform team
@acme/typescript-standards (eager: true)
@acme/api-design-patterns (eager: true)
@acme/security-checklist (eager: true)

# Every new project
prpm install @acme/typescript-standards
prpm install @acme/api-design-patterns
prpm install @acme/security-checklist

# Now every AI session enforces your standards`}</code>
            </pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">2. Efficient Context Management</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              You can install dozens of specialized skills without bloating your context window. Only the mandatory ones load eagerly—the rest activate when relevant.
            </p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# 3 eager skills (always loaded)
@myteam/code-standards
@myteam/security-rules
@myteam/testing-requirements

# 15 lazy skills (on-demand)
@prpm/nextjs-expert
@prpm/react-performance
@prpm/postgres-migrations
@prpm/stripe-integration
# ... etc

# Total skills: 18
# Context usage at session start: 3 skills
# Context efficiency: 83% saved`}</code>
            </pre>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">3. Trust Package Authors</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Package authors know whether their package should be eager or lazy. Framework maintainers can publish migration packages that are lazy by default. Security teams can publish audit checklists that must be eager.
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              Users get smart defaults and can override when needed.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Applies to Progressive Disclosure Formats</h2>
          </div>

          <p className="mb-8">
            Eager/lazy activation works with formats that support progressive disclosure:
          </p>

          <ul className="list-disc ml-6 text-gray-300 space-y-3 mb-8">
            <li><strong className="text-white">AGENTS.md</strong> - OpenAI's open standard for agent definitions</li>
            <li><strong className="text-white">GEMINI.md</strong> - Gemini CLI's manifest format</li>
            <li><strong className="text-white">CLAUDE.md</strong> - Claude Desktop's project context</li>
            <li><strong className="text-white">Aider</strong> - Aider's architect mode</li>
          </ul>

          <p className="mb-8">
            Formats without progressive disclosure (Cursor rules, Windsurf rules, GitHub Copilot instructions) load all content immediately, so eager/lazy doesn't apply.
          </p>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-4">Get Started</h2>

            <p className="text-gray-300 leading-relaxed text-lg mb-0">
              Try eager/lazy loading today. Install a skill with <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">--eager</code> and watch it activate at every session start. Or publish your own package with <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">eager: true</code> in <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-[0.9em] font-mono border border-prpm-border/30">prpm.json</code>.
            </p>
          </div>

          <div className="bg-gradient-to-r from-prpm-accent/10 to-prpm-purple/10 border border-prpm-accent/30 rounded-2xl p-8 my-12">
            <h3 className="text-2xl font-bold text-white mb-4">
              Start Using Eager/Lazy Loading
            </h3>
            <p className="text-gray-300 mb-6">
              Install PRPM and try eager activation with your team's coding standards
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/search"
                className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-hover text-white font-semibold rounded-lg transition-colors"
              >
                Browse Packages
              </Link>
              <a
                href="https://docs.prpm.dev/cli/commands#install"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white font-semibold rounded-lg transition-colors"
              >
                Read the Docs
              </a>
            </div>
          </div>

        </div>
      </article>

      <BlogFooter
        postTitle="Eager vs Lazy Loading: Control When Your AI Skills Activate"
        postUrl="/blog/eager-lazy-loading"
      />
    </main>
  )
}
