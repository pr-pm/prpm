import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BlogFooter from '@/components/BlogFooter'
import BackLink from '@/components/BackLink'
import BlogPostHeader from '@/components/BlogPostHeader'

export const metadata: Metadata = {
  title: "When to Use a Claude Skill vs a Claude Sub-Agent - PRPM",
  description: "Confused when to use Claude skills vs sub-agents? This guide shows developers exactly when to use each, with real examples and a decision framework.",
  openGraph: {
    title: "When to Use a Claude Skill vs a Claude Sub-Agent",
    description: "Confused when to use Claude skills vs sub-agents? This guide shows developers exactly when to use each, with real examples and a decision framework.",
  },
}

export default function ClaudeSkillVsSubAgentPost() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackLink href="/blog">Back to Blog</BackLink>

        <BlogPostHeader
          tags={['Technical', 'Tutorial', 'AI Development', 'Claude Code']}
          title="When to Use a Claude Skill vs a Claude Sub-Agent"
          subtitle="Skills and sub-agents sound similar but work completely differently. Pick the wrong one and you'll end up with context bloat or tasks that never finish."
          author="PRPM Team"
          date="October 31, 2025"
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
          prose-table:border-collapse prose-table:w-full prose-table:my-8 prose-table:text-gray-300
          prose-thead:border-b-2 prose-thead:border-prpm-border
          prose-th:text-left prose-th:text-white prose-th:bg-prpm-dark-card prose-th:px-4 prose-th:py-3 prose-th:font-semibold prose-th:border prose-th:border-prpm-border
          prose-td:px-4 prose-td:py-3 prose-td:border prose-td:border-prpm-border
          prose-hr:border-prpm-border prose-hr:my-12
        ">

          <p className="text-gray-300 leading-relaxed mb-8">
            You're staring at your <code>.claude/</code> directory wondering: should this be a skill or a sub-agent? You've read the docs. You still aren't sure.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            Here's the thing: skills and sub-agents sound similar but work completely differently. Pick the wrong one and you'll end up with context bloat or tasks that never finish. Pick the right one and Claude becomes genuinely better at your specific workflows.
          </p>

          <p className="text-gray-300 leading-relaxed mb-12">
            This guide shows you exactly when to use each, with real examples and a decision framework you can actually use.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Core Distinction</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Skills: Prompt Templates That Inject Instructions</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              Skills are specialized prompt templates that inject domain-specific instructions into Claude's current context when relevant.
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              Think of them like this: you're working on a React component. Claude detects "React" in your files and loads a skill with patterns like "use explicit props over spreading" or "prefer function components." Those instructions guide Claude's responses for that specific task.
            </p>

            <p className="text-white font-semibold mb-4">Key characteristics:</p>
            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li>Model-invoked: Claude decides when to load them based on context</li>
              <li>Lightweight: Start at ~few dozen tokens</li>
              <li>Progressive disclosure: Load only relevant information as needed</li>
              <li>No direct execution: They guide responses, not run code</li>
              <li>Personal or project-scoped: <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm">~/.claude/skills/</code> or <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm">.claude/skills/</code></li>
            </ul>

            <p className="text-white font-semibold mb-4">What they contain:</p>
            <ul className="text-gray-300 space-y-3 mb-0 list-disc ml-6">
              <li>Specialized instructions</li>
              <li>Design patterns</li>
              <li>Coding conventions</li>
              <li>Templates and examples</li>
              <li>Domain-specific knowledge</li>
              <li>Documentation references</li>
            </ul>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Sub-Agents: Isolated AI Assistants for Complex Tasks</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              Sub-agents are specialized AI assistants that run in separate context windows with their own system prompts and tool access.
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              Think of them like this: you ask Claude to review your entire codebase for security issues. That's not a quick task—it needs multiple steps, careful analysis, and its own context. A sub-agent spins up, does the work, and reports back with findings.
            </p>

            <p className="text-white font-semibold mb-4">Key characteristics:</p>
            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li>User-invoked or automatic: Ask Claude to "use the security-reviewer agent" or Claude invokes them automatically when appropriate</li>
              <li>Full context: Complete context window for complex work</li>
              <li>Tool access: Can read files, run commands, execute code</li>
              <li>Autonomous: Complete multi-step tasks independently</li>
              <li>Maintains expertise: Specialized system prompts for specific domains</li>
            </ul>

            <p className="text-white font-semibold mb-4">What they do:</p>
            <ul className="text-gray-300 space-y-3 mb-0 list-disc ml-6">
              <li>Multi-step code reviews</li>
              <li>Architecture analysis</li>
              <li>Complex refactoring across multiple files</li>
              <li>Documentation generation</li>
              <li>Test suite creation</li>
              <li>Specialized problem-solving</li>
            </ul>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">When to Use Skills</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Scenario 1: Reusable Coding Patterns</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              You have a house style for TypeScript that you want applied consistently: named exports only, no default exports, explicit return types.
            </p>

            <p className="text-white font-semibold mb-4">Use a skill:</p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8"><code className="text-sm text-gray-300 font-mono">{`---
name: typescript-conventions
description: TypeScript coding standards for our codebase
---

# TypeScript Conventions

## Exports
- Use named exports only
- Never use default exports
- Group related exports at end of file

## Type Annotations
- Explicit return types on all functions
- No implicit any
- Prefer interfaces over types for objects

## Code Organization
- One component per file
- Co-locate tests with implementation
- Use barrel exports for directories`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-6">
              Save this as <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm">.claude/skills/typescript-conventions/SKILL.md</code>. Claude loads it when working on TypeScript files and applies these patterns automatically.
            </p>

            <p className="text-gray-300 leading-relaxed mb-0">
              <strong className="text-white">Why this works:</strong> The patterns are simple, contextual, and apply across many files. You don't need a separate context window—you just need Claude to remember your preferences.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Scenario 2: Framework-Specific Knowledge</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              You're migrating to Next.js App Router. There are dozens of gotchas: async components, client boundaries, route segments, metadata API.
            </p>

            <p className="text-white font-semibold mb-4">Use a skill:</p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8"><code className="text-sm text-gray-300 font-mono">prpm install @nextjs/app-router</code></pre>

            <p className="text-gray-300 leading-relaxed mb-4">This skill contains:</p>
            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li>Server component patterns</li>
              <li>When to use 'use client'</li>
              <li>Metadata API examples</li>
              <li>Loading/error state conventions</li>
              <li>Route group patterns</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-6">
              Claude loads this when it detects Next.js and App Router in your project. You get framework-specific guidance without constantly looking up docs.
            </p>

            <p className="text-gray-300 leading-relaxed mb-0">
              <strong className="text-white">Why this works:</strong> The knowledge is specific to Next.js App Router but applies to many files. Skills enable progressive disclosure—Claude loads route group patterns only when you're actually working on route organization.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Scenario 3: Domain-Specific Vocabulary</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              You're working on a fintech app with specific terminology: "settlements," "clearing," "merchant accounts," "payment rails."
            </p>

            <p className="text-white font-semibold mb-4">Use a skill:</p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8"><code className="text-sm text-gray-300 font-mono">{`---
name: fintech-glossary
description: Domain terminology for payment processing
---

# Payment Processing Terms

## Settlement
The process of transferring funds from acquiring bank to merchant account.
- Batch settlement: Once per day
- Real-time settlement: Within minutes (premium)

## Clearing
Reconciliation between issuing and acquiring banks.
- Timeline: T+1 to T+3
- Handles chargebacks and disputes

## Merchant Account
Bank account that holds funds before settlement.
- Reserve requirements: 5-20% typical
- Rolling reserve: Held for 6 months

[...]`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-6">
              Now when you discuss payments, Claude uses correct terminology and understands domain constraints.
            </p>

            <p className="text-gray-300 leading-relaxed mb-0">
              <strong className="text-white">Why this works:</strong> Domain knowledge improves all conversations about this topic. It doesn't need isolated execution—it needs consistent context.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Scenario 4: Testing Standards</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              You want every PR to include specific test types: unit tests, integration tests, edge case coverage.
            </p>

            <p className="text-white font-semibold mb-4">Use a skill:</p>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8"><code className="text-sm text-gray-300 font-mono">{`---
name: testing-standards
description: Testing requirements for all code changes
---

# Testing Standards

## Required Coverage
- Unit tests for all public functions
- Integration tests for API endpoints
- Edge case tests for error handling
- No tests for trivial getters/setters

## Test Organization
- Co-locate tests with implementation
- Use descriptive test names (no "test1", "test2")
- One assertion per test when possible
- Mock external dependencies

## Edge Cases to Cover
- Null/undefined inputs
- Empty arrays/objects
- Boundary values (0, -1, max)
- Concurrent operations
- Network failures`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-6">
              Claude references this when writing or reviewing code, ensuring consistent test coverage.
            </p>

            <p className="text-gray-300 leading-relaxed mb-0">
              <strong className="text-white">Why this works:</strong> Testing standards apply to many files and many conversations. Skills make them available without repeating yourself.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">When to Use Sub-Agents</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Scenario 1: Comprehensive Code Review</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              You need a security audit of your authentication flow across multiple files.
            </p>

            <p className="text-white font-semibold mb-4">Use a sub-agent:</p>

            <p className="text-gray-300 leading-relaxed mb-6">Ask Claude: "Use the security-reviewer agent to audit my auth flow"</p>

            <p className="text-gray-300 leading-relaxed mb-4">The sub-agent:</p>
            <ol className="text-gray-300 space-y-3 mb-8 list-decimal list-inside">
              <li>Reads all authentication-related files</li>
              <li>Traces token flow from login to protected routes</li>
              <li>Checks for common vulnerabilities (CSRF, XSS, SQL injection)</li>
              <li>Tests edge cases (expired tokens, concurrent logins)</li>
              <li>Reports findings with severity levels and file locations</li>
            </ol>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">Why this works:</strong> This requires reading dozens of files, maintaining context across the entire auth system, and applying specialized security knowledge. A sub-agent maintains its own context window and can spend hundreds of tokens analyzing each file.
            </p>

            <p className="text-gray-300 leading-relaxed mb-0">
              You can't do this with a skill—skills don't execute tasks, they guide responses.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Scenario 2: Large-Scale Refactoring</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              You're renaming a core abstraction used in 50+ files with inconsistent patterns.
            </p>

            <p className="text-white font-semibold mb-4">Use a sub-agent:</p>

            <p className="text-gray-300 leading-relaxed mb-6">Ask Claude: "Use the refactoring-assistant agent to help rename this abstraction"</p>

            <p className="text-gray-300 leading-relaxed mb-4">The sub-agent:</p>
            <ol className="text-gray-300 space-y-3 mb-8 list-decimal list-inside">
              <li>Searches codebase for all uses of the old name</li>
              <li>Analyzes context to understand each usage pattern</li>
              <li>Generates refactoring plan with risk assessment</li>
              <li>Updates files incrementally with safety checks</li>
              <li>Runs tests after each batch to catch breaks early</li>
            </ol>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">Why this works:</strong> This is a complex multi-step task requiring careful coordination and error handling. Sub-agents can maintain state across steps and adapt their approach based on results.
            </p>

            <p className="text-gray-300 leading-relaxed mb-0">
              A skill would just tell Claude <em>how</em> to refactor. A sub-agent actually <em>does</em> the refactoring.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Scenario 3: Architecture Analysis</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              You need to document the architecture of an unfamiliar codebase you just inherited.
            </p>

            <p className="text-white font-semibold mb-4">Use a sub-agent:</p>

            <p className="text-gray-300 leading-relaxed mb-6">Ask Claude: "Use the architecture-documenter agent to analyze this codebase"</p>

            <p className="text-gray-300 leading-relaxed mb-4">The sub-agent:</p>
            <ol className="text-gray-300 space-y-3 mb-8 list-decimal list-inside">
              <li>Scans directory structure for entry points</li>
              <li>Traces dependencies to map data flow</li>
              <li>Identifies design patterns and architectural decisions</li>
              <li>Documents module responsibilities</li>
              <li>Generates diagrams (Mermaid format)</li>
              <li>Flags potential issues (tight coupling, circular deps)</li>
            </ol>

            <p className="text-gray-300 leading-relaxed mb-0">
              <strong className="text-white">Why this works:</strong> Understanding architecture requires reading the entire codebase systematically, maintaining a mental model across hundreds of files, and synthesizing high-level insights. That's exactly what sub-agents excel at.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Scenario 4: Specialized Problem Domains</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              You're debugging a complex distributed systems issue with race conditions.
            </p>

            <p className="text-white font-semibold mb-4">Use a sub-agent:</p>

            <p className="text-gray-300 leading-relaxed mb-6">Ask Claude: "Use the distributed-systems-expert agent to analyze this race condition"</p>

            <p className="text-gray-300 leading-relaxed mb-4">The sub-agent has a specialized system prompt with deep knowledge of:</p>
            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li>CAP theorem implications</li>
              <li>Consistency models (eventual, strong, causal)</li>
              <li>Common race conditions in distributed systems</li>
              <li>Debugging techniques for non-deterministic bugs</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-6">
              It analyzes your logs, traces, and code to identify the specific race condition and suggest fixes.
            </p>

            <p className="text-gray-300 leading-relaxed mb-0">
              <strong className="text-white">Why this works:</strong> Distributed systems expertise requires deep specialized knowledge applied systematically across multiple files and logs. The sub-agent's isolated context lets it maintain the mental model needed for this complexity.
            </p>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Decision Framework</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">Use this flowchart:</p>

          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto my-8"><code className="text-sm text-gray-300 font-mono">{`Is this a complex multi-step task?
├─ YES → Does it need to read/write many files?
│         ├─ YES → Use sub-agent
│         └─ NO → Use sub-agent (context isolation still helpful)
└─ NO → Is this guidance that applies to many situations?
          ├─ YES → Use skill
          └─ NO → Is this specialized knowledge for specific contexts?
                  ├─ YES → Use skill
                  └─ NO → Maybe just ask Claude directly?`}</code></pre>

          <p className="text-gray-300 leading-relaxed mb-6">Or use this checklist:</p>

          <p className="text-white font-semibold mb-4"><strong>Use a skill if:</strong></p>
          <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
            <li>It's guidance, not execution</li>
            <li>It applies to many files/conversations</li>
            <li>Context size is small (&lt; 500 tokens)</li>
            <li>Claude should decide when to load it</li>
            <li>It's patterns, conventions, or domain knowledge</li>
          </ul>

          <p className="text-white font-semibold mb-4"><strong>Use a sub-agent if:</strong></p>
          <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
            <li>It's a complex task with multiple steps</li>
            <li>It needs to read/analyze many files</li>
            <li>It requires specialized expertise start-to-finish</li>
            <li>It needs its own context window</li>
            <li>You want it isolated from main conversation</li>
          </ul>

          <p className="text-white font-semibold mb-6"><strong>Real-world examples:</strong></p>

          <div className="not-prose mb-8">
            <table className="w-full border-collapse text-gray-300">
              <thead className="border-b-2 border-prpm-border">
                <tr>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Scenario</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Skills</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Sub-Agent</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border">API migration</td>
                  <td className="px-4 py-4 border border-prpm-border">✅ Migration patterns and gotchas</td>
                  <td className="px-4 py-4 border border-prpm-border">❌ Overkill for pattern guidance</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border">Security audit</td>
                  <td className="px-4 py-4 border border-prpm-border">❌ Can't analyze entire codebase</td>
                  <td className="px-4 py-4 border border-prpm-border">✅ Needs systematic analysis</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border">Code style</td>
                  <td className="px-4 py-4 border border-prpm-border">✅ Conventions applied per-file</td>
                  <td className="px-4 py-4 border border-prpm-border">❌ No multi-step work needed</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border">Generate test suite</td>
                  <td className="px-4 py-4 border border-prpm-border">❌ Can't coordinate across files</td>
                  <td className="px-4 py-4 border border-prpm-border">✅ Needs context across all tests</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border">Domain glossary</td>
                  <td className="px-4 py-4 border border-prpm-border">✅ Terminology used everywhere</td>
                  <td className="px-4 py-4 border border-prpm-border">❌ No execution required</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border">Refactor architecture</td>
                  <td className="px-4 py-4 border border-prpm-border">❌ Can't coordinate changes</td>
                  <td className="px-4 py-4 border border-prpm-border">✅ Complex multi-file changes</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Skills vs Sub-Agents: Technical Deep Dive</h2>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">How Skills Work Under the Hood</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              Skills use Claude's tool-use capability but in a clever way. They're "meta-tools"—prompt templates that inject specialized instructions into Claude's context.
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              Simon Willison calls them "lightweight and practical." Lee Hanchung explains they "enable progressive disclosure of context, allowing agents to load only relevant information as needed."
            </p>

            <p className="text-white font-semibold mb-4">The loading mechanism:</p>
            <ol className="text-gray-300 space-y-3 mb-8 list-decimal list-inside">
              <li>You start a task involving React components</li>
              <li>Claude's model sees "React" in file paths and content</li>
              <li>It autonomously invokes the <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm">get_skill</code> tool: <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm">get_skill("react-patterns")</code></li>
              <li>The skill content gets injected into current context</li>
              <li>Claude now has React-specific guidance for this conversation</li>
            </ol>

            <p className="text-white font-semibold mb-4">Token efficiency:</p>
            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li>Initial injection: ~50-200 tokens (just metadata)</li>
              <li>Full load: ~500-2000 tokens (if Claude needs details)</li>
              <li>Progressive: More context loaded only if needed</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-0">
              <strong className="text-white">No code execution:</strong> Skills cannot run scripts, read files, or execute commands. They provide instructions. Claude still does the work.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">How Sub-Agents Work Under the Hood</h3>

            <p className="text-gray-300 leading-relaxed mb-8">
              Sub-agents run in completely isolated context windows with their own system prompts.
            </p>

            <p className="text-white font-semibold mb-4">The isolation mechanism:</p>
            <ol className="text-gray-300 space-y-3 mb-8 list-decimal list-inside">
              <li>You ask: "Use the security-reviewer agent"</li>
              <li>Claude spawns new context window</li>
              <li>Loads sub-agent's custom system prompt</li>
              <li>Sub-agent has full tool access (read files, run commands)</li>
              <li>Maintains conversation state independently</li>
              <li>Reports back to main context when done</li>
            </ol>

            <p className="text-white font-semibold mb-4">Token budget:</p>
            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li>Separate allocation from main conversation</li>
              <li>Can use thousands of tokens without affecting your main work</li>
              <li>Context preserved across sub-agent's entire task</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-0">
              <strong className="text-white">Full autonomy:</strong> Sub-agents can execute complex workflows without constant user input. They make decisions, adapt based on results, and complete multi-step processes.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Why the Distinction Matters</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              Anthropic explains: "Skills feel closer to the spirit of LLMs"—they're about guiding the model with context, not programming task automation.
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              Sub-agents are for when guidance isn't enough. When you need actual execution, systematic analysis, or isolated expertise.
            </p>

            <p className="text-white font-semibold mb-4">Getting this wrong:</p>
            <ul className="text-gray-300 space-y-3 mb-0 list-disc ml-6">
              <li>Using sub-agent for code style → waste of context window</li>
              <li>Using skill for code review → can't analyze multiple files</li>
              <li>Using sub-agent for glossary → unnecessary complexity</li>
              <li>Using skill for refactoring → no execution capability</li>
            </ul>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">PRPM: Managing Skills and Sub-Agents</h2>
          </div>

          <p>
            PRPM packages work for both skills and sub-agents. The format is the same—only the subtype differs.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Installing Skills from PRPM</h3>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8"><code className="text-sm text-gray-300 font-mono">{`# Install a skill
prpm install @nextjs/app-router
prpm install @stripe/migration-guide
prpm install @testing/jest-patterns`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              These go to <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm">.claude/skills/</code> and Claude loads them automatically based on context.
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Installing Sub-Agents from PRPM</h3>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8"><code className="text-sm text-gray-300 font-mono">{`# Install a sub-agent
prpm install @code-review/security-auditor
prpm install @refactoring/architecture-analyzer
prpm install @documentation/api-documenter`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-0">
              These go to <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm">.claude/agents/</code> and you invoke them by asking: "Use the security-auditor agent"
            </p>
          </div>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Publishing Your Own</h3>

            <p className="text-gray-300 leading-relaxed mb-6">Package structure is identical:</p>

            <p className="text-white font-semibold mb-4">Skill:</p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8"><code className="text-sm text-gray-300 font-mono">{`my-skill/
├── SKILL.md           # Main content with metadata
└── examples/          # Optional supporting files`}</code></pre>

            <p className="text-white font-semibold mb-4">Sub-agent:</p>
            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8"><code className="text-sm text-gray-300 font-mono">{`my-agent/
├── agent.md           # Agent definition with system prompt and metadata
└── tools/             # Optional tool configs`}</code></pre>

            <p className="text-gray-300 leading-relaxed mb-8">
              The registry handles both. Install command is the same. Only difference is where they land and how Claude uses them.
            </p>

            <p className="text-white font-semibold mb-4">Why PRPM matters here:</p>
            <ol className="text-gray-300 space-y-3 mb-0 list-decimal list-inside">
              <li><strong className="text-white">Cross-editor support:</strong> Skills work in Claude Code today. Tomorrow you might use Cursor. PRPM converts formats automatically.</li>
              <li><strong className="text-white">Versioning:</strong> Lock skills and sub-agents to specific versions. Prevent breaking changes.</li>
              <li><strong className="text-white">Collections:</strong> Install related skills as bundles:
                <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-4 overflow-x-auto mt-3"><code className="text-sm text-gray-300 font-mono">prpm install collection/nextjs-full-stack  # Gets app-router, api-routes, deployment skills</code></pre>
              </li>
              <li><strong className="text-white">Discovery:</strong> Browse 6,000+ packages in the registry. Find skills for your framework, language, or domain.</li>
            </ol>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Mental Model</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">Think of it this way:</p>

          <p className="text-white font-semibold mb-4"><strong>Skills</strong> = Reference cards in Claude's pocket</p>
          <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
            <li>Claude pulls them out when relevant</li>
            <li>They remind Claude of patterns and conventions</li>
            <li>Lightweight, always available</li>
            <li>Guide responses but don't execute tasks</li>
          </ul>

          <p className="text-white font-semibold mb-4"><strong>Sub-agents</strong> = Specialists you call in</p>
          <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
            <li>You explicitly request their help</li>
            <li>They work independently with full context</li>
            <li>Complete complex tasks autonomously</li>
            <li>Report back with results</li>
          </ul>

          <p className="text-white font-semibold mb-4"><strong>Together:</strong></p>
          <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
            <li>Skills make Claude better at routine work</li>
            <li>Sub-agents handle specialized complex tasks</li>
            <li>Both integrate seamlessly with PRPM</li>
          </ul>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Quick Reference</h2>
          </div>

          <div className="not-prose mb-8">
            <table className="w-full border-collapse text-gray-300">
              <thead className="border-b-2 border-prpm-border">
                <tr>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Question</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Skills</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Sub-Agents</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border">Who invokes it?</td>
                  <td className="px-4 py-4 border border-prpm-border">Claude (automatically)</td>
                  <td className="px-4 py-4 border border-prpm-border">You (conversationally) or Claude (automatically)</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border">Can it execute code?</td>
                  <td className="px-4 py-4 border border-prpm-border">No</td>
                  <td className="px-4 py-4 border border-prpm-border">Yes</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border">Context window?</td>
                  <td className="px-4 py-4 border border-prpm-border">Shares main context</td>
                  <td className="px-4 py-4 border border-prpm-border">Isolated context</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border">Token efficiency?</td>
                  <td className="px-4 py-4 border border-prpm-border">Very efficient</td>
                  <td className="px-4 py-4 border border-prpm-border">Separate budget</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border">Best for?</td>
                  <td className="px-4 py-4 border border-prpm-border">Patterns, conventions, knowledge</td>
                  <td className="px-4 py-4 border border-prpm-border">Complex multi-step tasks</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border">How to install?</td>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm">prpm install @vendor/skill-name</code></td>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm">prpm install @vendor/agent-name</code></td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border">Where installed?</td>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm">.claude/skills/</code></td>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm">.claude/agents/</code></td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border">How to use?</td>
                  <td className="px-4 py-4 border border-prpm-border">Automatic when relevant</td>
                  <td className="px-4 py-4 border border-prpm-border">"Use the X agent" or automatic</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Try It Yourself</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">Start simple:</p>

          <p className="text-white font-semibold mb-4"><strong>Install a skill:</strong></p>
          <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6"><code className="text-sm text-gray-300 font-mono">prpm install @auser/jest-patterns</code></pre>

          <p className="text-gray-300 leading-relaxed mb-8">
            Open a test file. Notice how Claude references testing patterns automatically.
          </p>

          <p className="text-white font-semibold mb-4"><strong>Try a sub-agent:</strong></p>

          <p className="text-gray-300 leading-relaxed mb-6">
            Ask Claude: "Use the code-reviewer agent to review this module"
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            Watch it analyze multiple files and synthesize findings.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            See the difference? Skills enhance Claude's general responses. Sub-agents complete specific complex tasks.
          </p>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Next Steps</h2>
          </div>

          <ol className="text-gray-300 space-y-6 mb-8 list-decimal list-inside">
            <li><strong className="text-white">Browse the registry:</strong> <Link href="https://prpm.dev" className="text-prpm-accent hover:underline font-medium">https://prpm.dev</Link>
              <ul className="text-gray-300 space-y-2 mt-3 ml-6 list-disc ml-6">
                <li>Filter by subtype: "skill" or "agent"</li>
                <li>See what others have published</li>
              </ul>
            </li>
            <li><strong className="text-white">Install relevant packages:</strong>
              <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mt-4 mb-4"><code className="text-sm text-gray-300 font-mono">{`prpm install @prpm/react-testing-patterns
prpm install @auser/security-auditor`}</code></pre>
            </li>
            <li><strong className="text-white">Create your own:</strong>
              <ul className="text-gray-300 space-y-2 mt-3 ml-6 list-disc ml-6">
                <li>Package your team's conventions as skills</li>
                <li>Build specialized sub-agents for your domain</li>
                <li>Publish to share with others</li>
              </ul>
            </li>
          </ol>

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">The Bottom Line</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            Choose skills when you want Claude to know your patterns and apply them consistently across many contexts. Choose sub-agents when you need Claude to complete a complex task independently with its own context and tools.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            Get it right and Claude becomes significantly more useful. Get it wrong and you'll fight with context limits or wonder why your "skill" doesn't actually do anything.
          </p>

          <p className="text-gray-300 leading-relaxed mb-6">
            The good news: you can experiment freely. Install a package, try it, uninstall if it's not right. PRPM makes this trivial.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            Now you know when to use each. Go build something.
          </p>

          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-4">Questions?</h2>

            <p className="text-gray-300 leading-relaxed text-lg mb-0">
              <Link href="https://github.com/pr-pm/prpm/issues" className="text-prpm-accent hover:underline font-medium">Open an issue</Link> if you're still not sure whether something should be a skill or sub-agent. We're here to help.
            </p>
          </div>
        </div>

        <BlogFooter postTitle="When to Use a Claude Skill vs a Claude Sub-Agent" postUrl="/blog/when-to-use-claude-skill-vs-subagent" />
      </article>
    </main>
  )
}
