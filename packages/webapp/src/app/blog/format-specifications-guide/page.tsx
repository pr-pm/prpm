import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Complete Guide to AI IDE Prompt Formats: Schemas, Specifications, and Conversions - PRPM",
  description: "Master all 8 AI IDE formats with JSON schemas and comprehensive specifications. From Cursor to Claude Code, Windsurf to Kiro—learn frontmatter requirements, validation, and format conversion.",
  openGraph: {
    title: "Complete Guide to AI IDE Prompt Formats: Schemas & Specifications",
    description: "Master all 8 AI IDE formats with JSON schemas and comprehensive specs. Cursor, Claude, Windsurf, Kiro, Copilot, Continue, agents.md, and more.",
  },
}

export default function FormatSpecificationsGuidePage() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      {/* Navigation */}
      <nav className="border-b border-prpm-border bg-prpm-dark-card backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3">
                <Image src="/logo-icon.svg" alt="PRPM Logo" width={40} height={40} className="w-10 h-10" />
                <span className="text-2xl font-bold bg-gradient-to-r from-prpm-accent to-prpm-purple bg-clip-text text-transparent">
                  PRPM
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/search" className="text-gray-400 hover:text-white transition-colors">
                  Search
                </Link>
                <Link href="/authors" className="text-gray-400 hover:text-white transition-colors">
                  Authors
                </Link>
                <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">
                  Blog
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/pr-pm/prpm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blog
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-medium">
              Technical
            </span>
            <span className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-medium">
              Specifications
            </span>
            <span className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-medium">
              Format Conversion
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 text-white leading-tight">
            Complete Guide to AI IDE Prompt Formats: Schemas, Specifications, and Conversions
          </h1>

          <p className="text-2xl text-gray-400 mb-6">
            Master all 8 AI IDE formats with validated JSON schemas and comprehensive specifications
          </p>

          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span>By PRPM Team</span>
            <span>•</span>
            <span>November 14, 2025</span>
            <span>•</span>
            <span>18 min read</span>
          </div>
        </header>

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
          <p className="text-gray-300 leading-relaxed mb-8">
            Each AI IDE has its own format for prompts, rules, skills, and agents. Some require strict YAML frontmatter. Others allow plain markdown. Some support file patterns and tool restrictions. Others keep it dead simple.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            PRPM maintains <strong className="text-white">complete JSON schemas and comprehensive specifications</strong> for all 8 major AI IDE formats. These schemas power our format conversion system, enable validation, and serve as authoritative references for developers building with AI coding tools.
          </p>

          <p className="text-gray-300 leading-relaxed mb-8">
            This guide walks through each format's structure, frontmatter requirements, key features, and links to both JSON schemas and deep-dive blog posts. By the end, you'll know exactly which format fits your use case and how to validate your prompts programmatically.
          </p>

          {/* Quick Summary Table */}
          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Format Summary Table</h2>
          </div>

          <div className="not-prose mb-8">
            <table className="w-full border-collapse text-gray-300">
              <thead className="border-b-2 border-prpm-border">
                <tr>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Format</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">File Location</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Frontmatter</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Required Fields</th>
                  <th className="text-left text-white bg-prpm-dark-card px-4 py-4 font-semibold border border-prpm-border">Key Features</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Cursor</strong></td>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">.cursor/rules</code></td>
                  <td className="px-4 py-4 border border-prpm-border">Required</td>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">description</code></td>
                  <td className="px-4 py-4 border border-prpm-border">4 rule types, MDC format</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Claude Code</strong></td>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">.claude/&#123;agents,skills,commands&#125;/</code></td>
                  <td className="px-4 py-4 border border-prpm-border">Required</td>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">name</code>, <code className="text-prpm-accent text-sm">description</code></td>
                  <td className="px-4 py-4 border border-prpm-border">allowed-tools, model selection, hooks</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Continue</strong></td>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">.continue/rules/*.md</code></td>
                  <td className="px-4 py-4 border border-prpm-border">Required</td>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">name</code></td>
                  <td className="px-4 py-4 border border-prpm-border">Globs, regex, alwaysApply logic</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Windsurf</strong></td>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">.windsurf/rules</code></td>
                  <td className="px-4 py-4 border border-prpm-border">None</td>
                  <td className="px-4 py-4 border border-prpm-border">None</td>
                  <td className="px-4 py-4 border border-prpm-border">Plain markdown, 12k character limit</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">GitHub Copilot</strong></td>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">.github/copilot-instructions.md</code></td>
                  <td className="px-4 py-4 border border-prpm-border">Optional</td>
                  <td className="px-4 py-4 border border-prpm-border">None</td>
                  <td className="px-4 py-4 border border-prpm-border">Two-tier, comma-separated patterns</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Kiro Steering</strong></td>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">.kiro/steering/*.md</code></td>
                  <td className="px-4 py-4 border border-prpm-border">Optional</td>
                  <td className="px-4 py-4 border border-prpm-border">None</td>
                  <td className="px-4 py-4 border border-prpm-border">Inclusion modes, foundational types</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">Kiro Hooks</strong></td>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">.kiro/hooks/*.json</code></td>
                  <td className="px-4 py-4 border border-prpm-border">N/A (JSON)</td>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">name</code>, <code className="text-prpm-accent text-sm">when</code>, <code className="text-prpm-accent text-sm">then</code></td>
                  <td className="px-4 py-4 border border-prpm-border">Event-driven file automations</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 border border-prpm-border"><strong className="text-white">agents.md</strong></td>
                  <td className="px-4 py-4 border border-prpm-border"><code className="text-prpm-accent text-sm">agents.md</code></td>
                  <td className="px-4 py-4 border border-prpm-border">None</td>
                  <td className="px-4 py-4 border border-prpm-border">None</td>
                  <td className="px-4 py-4 border border-prpm-border">Plain markdown only</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Format Details */}
          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Format Details</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            Each format below includes its official JSON schema, frontmatter requirements, key distinguishing features, example syntax, and links to in-depth guides.
          </p>

          {/* 1. Cursor */}
          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">1. Cursor</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">File Location:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.cursor/rules</code> (multiple files)
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">Format:</strong> MDC (Markdown Components) with YAML frontmatter
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">JSON Schema:</strong> <a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/cursor.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">cursor.schema.json</a>
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              <strong className="text-white">Deep Dive:</strong> <Link href="/blog/cursor-deep-dive" className="text-prpm-accent hover:underline font-medium">Cursor Rules: A Technical Deep Dive</Link>
            </p>

            <h4 className="text-xl font-bold text-white mb-4">Frontmatter Requirements</h4>

            <p className="text-gray-300 leading-relaxed mb-4">
              <strong className="text-white">Required:</strong>
            </p>
            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">description</code> (string) - Human-readable description used by AI for intelligent rule selection</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-4">
              <strong className="text-white">Optional:</strong>
            </p>
            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">globs</code> (array of strings) - File patterns for "Apply to Specific Files" mode</li>
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">alwaysApply</code> (boolean) - <code className="text-prpm-accent text-sm">true</code> = "Always Apply", <code className="text-prpm-accent text-sm">false</code> = intelligent/file-specific</li>
            </ul>

            <h4 className="text-xl font-bold text-white mb-4">Key Features</h4>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><strong className="text-white">Four Rule Types:</strong> Always Apply, Apply Intelligently, Apply to Specific Files, Apply Manually (@-mentioned)</li>
              <li><strong className="text-white">MDC Format:</strong> Cursor uses Markdown Components, an extension of standard markdown</li>
              <li><strong className="text-white">Smart Glob Patterns:</strong> Target specific file types or directories with precision</li>
            </ul>

            <h4 className="text-xl font-bold text-white mb-4">Example</h4>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
              <code className="text-sm text-gray-300 font-mono">{`---
description: React component development standards
globs:
  - "src/**/*.tsx"
  - "src/**/*.jsx"
alwaysApply: false
---

# React Component Standards

Use functional components with hooks. Keep components under 200 lines.

## State Management

We use Zustand for global state:
- Create stores in \`src/stores/\`
- Use selectors to prevent re-renders`}</code>
            </pre>
          </div>

          {/* 2. Claude Code */}
          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">2. Claude Code</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">File Locations:</strong>
            </p>
            <ul className="text-gray-300 space-y-3 mb-6 list-disc ml-6">
              <li>Agents: <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.claude/agents/*.md</code></li>
              <li>Skills: <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.claude/skills/*.md</code></li>
              <li>Slash Commands: <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.claude/commands/*.md</code></li>
              <li>Hooks: <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.claude/hooks/*</code> (executable files)</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">Format:</strong> Markdown with YAML frontmatter (except hooks, which are executable scripts)
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">JSON Schemas:</strong>
            </p>
            <ul className="text-gray-300 space-y-3 mb-6 list-disc ml-6">
              <li><a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/claude-agent.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">claude-agent.schema.json</a></li>
              <li><a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/claude-skill.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">claude-skill.schema.json</a></li>
              <li><a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/claude-slash-command.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">claude-slash-command.schema.json</a></li>
              <li><a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/claude-hook.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">claude-hook.schema.json</a></li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-8">
              <strong className="text-white">Deep Dive:</strong> <Link href="/blog/claude-deep-dive" className="text-prpm-accent hover:underline font-medium">Claude Desktop & Claude Code: A Technical Deep Dive</Link>
            </p>

            <h4 className="text-xl font-bold text-white mb-4">Frontmatter Requirements (Agents & Skills)</h4>

            <p className="text-gray-300 leading-relaxed mb-4">
              <strong className="text-white">Required:</strong>
            </p>
            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">name</code> (string) - Lowercase identifier with hyphens, max 64 chars for skills</li>
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">description</code> (string) - Brief overview, max 1024 chars for skills</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-4">
              <strong className="text-white">Optional:</strong>
            </p>
            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">allowed-tools</code> (string) - Comma-separated list (e.g., "Read, Write, Bash")</li>
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">model</code> (string) - "sonnet" | "opus" | "haiku" | "inherit"</li>
            </ul>

            <h4 className="text-xl font-bold text-white mb-4">Key Features</h4>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><strong className="text-white">Tool Restrictions:</strong> Control which Claude Code tools (Read, Write, Bash, WebSearch, etc.) each agent/skill can use</li>
              <li><strong className="text-white">Model Selection:</strong> Choose specific Claude model per agent/skill</li>
              <li><strong className="text-white">Executable Hooks:</strong> Event-driven automations that run actual code (bash, TypeScript, Python, binaries)</li>
              <li><strong className="text-white">Emoji Icons:</strong> H1 headings can include emojis in markdown content (not frontmatter)</li>
            </ul>

            <h4 className="text-xl font-bold text-white mb-4">Example (Agent)</h4>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
              <code className="text-sm text-gray-300 font-mono">{`---
name: code-reviewer
description: Reviews code for best practices and potential issues
allowed-tools: Read, Grep, Bash
model: sonnet
---

# 🔍 Code Reviewer

You are an expert code reviewer with deep knowledge of software engineering principles.

## Instructions

- Check for code smells and anti-patterns
- Verify test coverage for new code
- Flag security vulnerabilities`}</code>
            </pre>
          </div>

          {/* 3. Continue */}
          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">3. Continue</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">File Location:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.continue/rules/*.md</code>
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">Format:</strong> Markdown with YAML frontmatter (or pure YAML files)
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">JSON Schema:</strong> <a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/continue.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">continue.schema.json</a>
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              <strong className="text-white">Deep Dive:</strong> <Link href="/blog/continue-deep-dive" className="text-prpm-accent hover:underline font-medium">Continue Dev Prompts: A Technical Deep Dive</Link>
            </p>

            <h4 className="text-xl font-bold text-white mb-4">Frontmatter Requirements</h4>

            <p className="text-gray-300 leading-relaxed mb-4">
              <strong className="text-white">Required:</strong>
            </p>
            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">name</code> (string) - Display name/title for the rule</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-4">
              <strong className="text-white">Optional:</strong>
            </p>
            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">description</code> (string) - When the rule should be used</li>
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">globs</code> (string or array) - File patterns like <code className="text-prpm-accent text-sm">"**/*.tsx"</code></li>
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">regex</code> (string or array) - Content matching patterns</li>
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">alwaysApply</code> (boolean) - Complex tri-state logic for inclusion behavior</li>
            </ul>

            <h4 className="text-xl font-bold text-white mb-4">Key Features</h4>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><strong className="text-white">Regex Matching:</strong> Match rules based on file content patterns, not just filenames</li>
              <li><strong className="text-white">Tri-State alwaysApply:</strong> <code className="text-prpm-accent text-sm">true</code> = always, <code className="text-prpm-accent text-sm">false</code> = globs or AI, <code className="text-prpm-accent text-sm">undefined</code> = no globs or globs match</li>
              <li><strong className="text-white">Template Variables:</strong> Support for dynamic content in slash commands</li>
            </ul>

            <h4 className="text-xl font-bold text-white mb-4">Example</h4>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
              <code className="text-sm text-gray-300 font-mono">{`---
name: React Component Standards
globs: ["**/*.tsx", "**/*.jsx"]
regex: "^import React"
alwaysApply: false
---

# React Component Standards

Use functional components with hooks. Avoid class components.

## Testing

Every component needs a corresponding test file in \`__tests__/\`.`}</code>
            </pre>
          </div>

          {/* 4. Windsurf */}
          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">4. Windsurf</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">File Location:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.windsurf/rules</code> (single file)
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">Format:</strong> Plain markdown (NO frontmatter allowed)
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">Character Limit:</strong> 12,000 characters (hard limit)
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">JSON Schema:</strong> <a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/windsurf.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">windsurf.schema.json</a>
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              <strong className="text-white">Deep Dive:</strong> <Link href="/blog/windsurf-deep-dive" className="text-prpm-accent hover:underline font-medium">Windsurf Rules: A Technical Deep Dive</Link>
            </p>

            <h4 className="text-xl font-bold text-white mb-4">Format Requirements</h4>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><strong className="text-white">No frontmatter:</strong> Any YAML frontmatter will be treated as content</li>
              <li><strong className="text-white">Plain markdown only:</strong> Standard markdown syntax, no extensions</li>
              <li><strong className="text-white">Single file:</strong> All rules and context in one document</li>
              <li><strong className="text-white">12k hard limit:</strong> Content beyond 12,000 characters is truncated</li>
            </ul>

            <h4 className="text-xl font-bold text-white mb-4">Key Features</h4>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><strong className="text-white">Radical Simplicity:</strong> No metadata, no configuration, just write markdown</li>
              <li><strong className="text-white">Zero Parsing Overhead:</strong> No frontmatter parsing means instant loading</li>
              <li><strong className="text-white">Constraint-Driven Design:</strong> 12k limit forces concise, focused rules</li>
            </ul>

            <h4 className="text-xl font-bold text-white mb-4">Example</h4>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
              <code className="text-sm text-gray-300 font-mono">{`# React Development Guidelines

## Component Structure

- Use functional components with hooks
- Keep components under 200 lines
- Extract logic into custom hooks

## State Management

We use Zustand for global state:
- Create stores in \`src/stores/\`
- Use selectors to prevent re-renders
- Keep store slices focused and small`}</code>
            </pre>
          </div>

          {/* 5. GitHub Copilot */}
          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">5. GitHub Copilot</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">File Locations:</strong>
            </p>
            <ul className="text-gray-300 space-y-3 mb-6 list-disc ml-6">
              <li>Repository-wide: <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.github/copilot-instructions.md</code></li>
              <li>Path-specific: <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.github/instructions/*.instructions.md</code></li>
            </ul>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">Format:</strong> Markdown with optional YAML frontmatter (path-specific files only)
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">JSON Schema:</strong> <a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/copilot.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">copilot.schema.json</a>
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              <strong className="text-white">Deep Dive:</strong> <Link href="/blog/copilot-deep-dive" className="text-prpm-accent hover:underline font-medium">GitHub Copilot Instructions: A Deep Dive</Link>
            </p>

            <h4 className="text-xl font-bold text-white mb-4">Frontmatter Requirements (Path-Specific Only)</h4>

            <p className="text-gray-300 leading-relaxed mb-4">
              <strong className="text-white">All fields optional:</strong>
            </p>
            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">applyTo</code> (string or array) - Glob patterns; can be comma-separated string like <code className="text-prpm-accent text-sm">"**/*.ts,**/*.tsx"</code></li>
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">excludeAgent</code> (string) - "code-review" | "coding-agent" to restrict which agent uses the instructions</li>
            </ul>

            <h4 className="text-xl font-bold text-white mb-4">Key Features</h4>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><strong className="text-white">Two-Tier System:</strong> Repository-wide baseline + path-specific overrides</li>
              <li><strong className="text-white">Comma-Separated Patterns:</strong> Unique syntax allowing <code className="text-prpm-accent text-sm">applyTo: "**/*.ts,**/*.tsx"</code> as single string</li>
              <li><strong className="text-white">Agent Exclusion:</strong> Control whether rules apply to code review vs coding agent</li>
              <li><strong className="text-white">No Frontmatter for Repo-Wide:</strong> Main instructions file is plain markdown</li>
            </ul>

            <h4 className="text-xl font-bold text-white mb-4">Example (Path-Specific)</h4>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
              <code className="text-sm text-gray-300 font-mono">{`---
applyTo: "app/models/**/*.rb"
excludeAgent: code-review
---

# Model Guidelines

Use ActiveRecord validations. Keep models focused and avoid business logic.

## Naming Conventions

- Use singular names for models
- Prefix join tables with both model names`}</code>
            </pre>
          </div>

          {/* 6. Kiro Steering */}
          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">6. Kiro Steering</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">File Location:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.kiro/steering/*.md</code>
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">Format:</strong> Markdown with optional YAML frontmatter
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">JSON Schema:</strong> <a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/kiro-steering.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">kiro-steering.schema.json</a>
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              <strong className="text-white">Deep Dive:</strong> <Link href="/blog/kiro-deep-dive" className="text-prpm-accent hover:underline font-medium">Kiro Steering Files: A Technical Deep Dive</Link>
            </p>

            <h4 className="text-xl font-bold text-white mb-4">Frontmatter Requirements</h4>

            <p className="text-gray-300 leading-relaxed mb-4">
              <strong className="text-white">All fields optional</strong> (defaults to "always" if no frontmatter):
            </p>
            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">inclusion</code> (string) - "always" (default) | "fileMatch" | "manual"</li>
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">fileMatchPattern</code> (string) - REQUIRED if <code className="text-prpm-accent text-sm">inclusion: fileMatch</code></li>
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">domain</code> (string) - Topic categorization (e.g., "testing", "api", "security")</li>
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">foundationalType</code> (string) - "product" | "tech" | "structure" for special files</li>
            </ul>

            <h4 className="text-xl font-bold text-white mb-4">Key Features</h4>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><strong className="text-white">Inclusion Modes:</strong> Three strategies for when rules apply (always, file-based, manual)</li>
              <li><strong className="text-white">Domain Organization:</strong> Categorize rules by topic for better context management</li>
              <li><strong className="text-white">Foundational Files:</strong> Special files (<code className="text-prpm-accent text-sm">product.md</code>, <code className="text-prpm-accent text-sm">tech.md</code>, <code className="text-prpm-accent text-sm">structure.md</code>) for core project context</li>
              <li><strong className="text-white">Defaults to Always:</strong> No frontmatter means rule is always included</li>
            </ul>

            <h4 className="text-xl font-bold text-white mb-4">Example (fileMatch Mode)</h4>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
              <code className="text-sm text-gray-300 font-mono">{`---
inclusion: fileMatch
fileMatchPattern: "components/**/*.tsx"
domain: frontend
---

# React Component Guidelines

Use functional components with hooks. Avoid class components.

## Performance

- Use React.memo() for expensive renders
- Implement proper dependency arrays in hooks`}</code>
            </pre>
          </div>

          {/* 7. Kiro Hooks */}
          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">7. Kiro Hooks</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">File Location:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">.kiro/hooks/*.json</code>
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">Format:</strong> JSON configuration (not markdown)
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">JSON Schema:</strong> <a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/kiro-hooks.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">kiro-hooks.schema.json</a>
            </p>

            <h4 className="text-xl font-bold text-white mb-4">JSON Structure</h4>

            <p className="text-gray-300 leading-relaxed mb-4">
              <strong className="text-white">Required:</strong>
            </p>
            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">name</code> (string) - Human-readable name for the hook</li>
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">description</code> (string) - What the hook does</li>
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">version</code> (string) - Hook version (typically "1")</li>
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">when</code> (object) - Trigger conditions:
                <ul className="text-gray-300 space-y-2 mt-3 ml-6 list-disc">
                  <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">type</code>: "fileCreated" | "fileModified" | "fileDeleted"</li>
                  <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">patterns</code>: Array of glob patterns</li>
                </ul>
              </li>
              <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">then</code> (object) - Action to take:
                <ul className="text-gray-300 space-y-2 mt-3 ml-6 list-disc">
                  <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">type</code>: "askAgent" | "runCommand"</li>
                  <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">prompt</code>: For askAgent actions</li>
                  <li><code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">command</code>: For runCommand actions</li>
                </ul>
              </li>
            </ul>

            <h4 className="text-xl font-bold text-white mb-4">Key Features</h4>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><strong className="text-white">Event-Driven Automation:</strong> Trigger actions when files are created, modified, or deleted</li>
              <li><strong className="text-white">AI-Powered Actions:</strong> Ask agent to perform tasks automatically</li>
              <li><strong className="text-white">Pattern Matching:</strong> Use glob patterns to target specific files</li>
              <li><strong className="text-white">JSON Format:</strong> Unlike other Kiro files, hooks are pure JSON configuration</li>
            </ul>

            <h4 className="text-xl font-bold text-white mb-4">Example</h4>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
              <code className="text-sm text-gray-300 font-mono">{`{
  "name": "Image Asset Indexer",
  "description": "Automatically adds new image files to index.ts",
  "version": "1",
  "when": {
    "type": "fileCreated",
    "patterns": [
      "client/src/assets/*.png",
      "client/src/assets/*.jpg"
    ]
  },
  "then": {
    "type": "askAgent",
    "prompt": "Update client/src/assets/index.ts to include the new image file"
  }
}`}</code>
            </pre>
          </div>

          {/* 8. agents.md */}
          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">8. agents.md</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">File Location:</strong> <code className="text-prpm-accent bg-prpm-dark-card/50 px-2 py-1 rounded text-sm font-mono border border-prpm-border/30">agents.md</code> (project root or subdirectories)
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">Format:</strong> Plain markdown (NO frontmatter allowed)
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              <strong className="text-white">JSON Schema:</strong> <a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/agents-md.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">agents-md.schema.json</a>
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">
              <strong className="text-white">Deep Dive:</strong> <Link href="/blog/agents-md-deep-dive" className="text-prpm-accent hover:underline font-medium">agents.md: A Deep Dive into OpenAI's Open Standard</Link>
            </p>

            <h4 className="text-xl font-bold text-white mb-4">Format Requirements</h4>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><strong className="text-white">No frontmatter:</strong> Any YAML frontmatter is invalid</li>
              <li><strong className="text-white">Plain markdown only:</strong> Standard markdown syntax, no extensions or special features</li>
              <li><strong className="text-white">No special syntax:</strong> Just write documentation</li>
              <li><strong className="text-white">Free-form content:</strong> No required structure or sections</li>
            </ul>

            <h4 className="text-xl font-bold text-white mb-4">Key Features</h4>

            <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
              <li><strong className="text-white">OpenAI Standard:</strong> Tool-agnostic format supported by multiple AI coding assistants</li>
              <li><strong className="text-white">Maximum Simplicity:</strong> The simplest possible format—just markdown</li>
              <li><strong className="text-white">Auto-Description:</strong> PRPM extracts description from first paragraph automatically</li>
              <li><strong className="text-white">No Configuration:</strong> Zero metadata, zero setup, zero learning curve</li>
            </ul>

            <h4 className="text-xl font-bold text-white mb-4">Example</h4>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-6">
              <code className="text-sm text-gray-300 font-mono">{`# TaskMaster Development Guide

Task management app for remote teams with real-time collaboration.

## Project Overview

Built with React 18, TypeScript, Node.js, and PostgreSQL.

## Architecture

### Frontend

- React 18 + TypeScript
- Vite for build tooling
- Zustand for state management

### Backend

- Node.js + Express
- PostgreSQL with Prisma ORM
- Redis for session storage

## Coding Conventions

- Use TypeScript strict mode
- Functional components with hooks
- Test coverage required for new features`}</code>
            </pre>
          </div>

          {/* PRPM's Conversion System */}
          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">PRPM's Format Conversion System</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            PRPM uses these JSON schemas to power <strong className="text-white">automatic format conversion</strong> across all 8 AI IDE formats. When you install a package, PRPM converts it to your target format on the fly—no manual copying, pasting, or reformatting required.
          </p>

          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">How It Works</h3>

            <ol className="text-gray-300 space-y-6 mb-8 list-decimal list-inside">
              <li><strong className="text-white">Canonical Format:</strong> Packages are stored in PRPM's canonical format (see <a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/canonical.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">canonical.schema.json</a>), which preserves core instructional content and common metadata. Format-specific features (like tools, regex patterns, or path-specific rules) may be lost during conversion.</li>
              <li><strong className="text-white">Schema-Driven Validation:</strong> Each format's schema defines required fields, optional fields, field types, and constraints (like max character limits).</li>
              <li><strong className="text-white">Best-Effort Conversion:</strong> PRPM maps canonical format to target format using schema definitions, preserving as much information as possible while flagging lossy conversions with quality scores and warnings.</li>
              <li><strong className="text-white">Format-Specific Rules:</strong> Converters handle special cases like Copilot's comma-separated patterns, Windsurf's 12k character limit, and format-specific features that don't translate across formats.</li>
            </ol>

            <h4 className="text-xl font-bold text-white mb-4">Example: Installing a Cursor Rule in Claude Code</h4>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`# Install a Cursor rule package
prpm install @nextjs/app-router --format claude-skill

# PRPM automatically:
# 1. Validates the package against cursor.schema.json
# 2. Converts to canonical format
# 3. Validates against canonical.schema.json
# 4. Converts to claude-skill format using claude-skill.schema.json
# 5. Writes to .claude/skills/app-router.md`}</code>
            </pre>
          </div>

          {/* Validation */}
          <div className="not-prose mb-16">
            <h3 className="text-2xl font-bold text-white mb-6">Validating Prompts with JSON Schemas</h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              You can validate your own prompts against PRPM's schemas using any JSON Schema validator. This catches errors early and ensures compatibility with PRPM's conversion system.
            </p>

            <h4 className="text-xl font-bold text-white mb-4">Using AJV (JavaScript)</h4>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`import Ajv from 'ajv'
import cursorSchema from 'https://raw.githubusercontent.com/pr-pm/prpm/main/packages/converters/schemas/cursor.schema.json'

const ajv = new Ajv()
const validate = ajv.compile(cursorSchema)

const myRule = {
  frontmatter: {
    description: "React component standards",
    globs: ["src/**/*.tsx"]
  },
  content: "# React Standards\\n\\nUse functional components."
}

if (validate(myRule)) {
  console.log("Valid Cursor rule!")
} else {
  console.error("Validation errors:", validate.errors)
}`}</code>
            </pre>

            <h4 className="text-xl font-bold text-white mb-4">Using jsonschema (Python)</h4>

            <pre className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 overflow-x-auto mb-8">
              <code className="text-sm text-gray-300 font-mono">{`import json
import requests
from jsonschema import validate, ValidationError

# Fetch schema
schema_url = "https://raw.githubusercontent.com/pr-pm/prpm/main/packages/converters/schemas/cursor.schema.json"
schema = requests.get(schema_url).json()

# Your rule
my_rule = {
    "frontmatter": {
        "description": "React component standards",
        "globs": ["src/**/*.tsx"]
    },
    "content": "# React Standards\\n\\nUse functional components."
}

try:
    validate(instance=my_rule, schema=schema)
    print("Valid Cursor rule!")
except ValidationError as e:
    print(f"Validation error: {e.message}")`}</code>
            </pre>
          </div>

          {/* Schema References */}
          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-0">Complete Schema Reference</h2>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">
            All schemas are available in the PRPM GitHub repository:
          </p>

          <ul className="text-gray-300 space-y-3 mb-8 list-disc ml-6">
            <li><a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/cursor.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">cursor.schema.json</a> - Cursor rules format</li>
            <li><a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/cursor-command.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">cursor-command.schema.json</a> - Cursor slash commands</li>
            <li><a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/claude-agent.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">claude-agent.schema.json</a> - Claude agents</li>
            <li><a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/claude-skill.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">claude-skill.schema.json</a> - Claude skills</li>
            <li><a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/claude-slash-command.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">claude-slash-command.schema.json</a> - Claude slash commands</li>
            <li><a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/claude-hook.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">claude-hook.schema.json</a> - Claude hooks</li>
            <li><a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/continue.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">continue.schema.json</a> - Continue rules</li>
            <li><a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/windsurf.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">windsurf.schema.json</a> - Windsurf rules</li>
            <li><a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/copilot.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">copilot.schema.json</a> - GitHub Copilot instructions</li>
            <li><a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/kiro-steering.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">kiro-steering.schema.json</a> - Kiro steering files</li>
            <li><a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/kiro-hooks.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">kiro-hooks.schema.json</a> - Kiro hooks</li>
            <li><a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/agents-md.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">agents-md.schema.json</a> - agents.md format</li>
            <li><a href="https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/canonical.schema.json" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">canonical.schema.json</a> - PRPM's canonical format</li>
          </ul>

          {/* Conclusion */}
          <hr className="border-prpm-border my-12" />

          <div className="not-prose bg-gradient-to-r from-prpm-dark-card to-prpm-dark-card/50 border-l-4 border-prpm-accent rounded-r-2xl p-8 my-12">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Building?</h2>

            <p className="text-gray-300 leading-relaxed text-lg mb-0">
              With these schemas and specifications, you have everything you need to validate, convert, and publish prompts across all 8 AI IDE formats. Browse the <Link href="/search" className="text-prpm-accent hover:underline font-medium">PRPM registry</Link> for examples, or <a href="https://docs.prpm.dev" className="text-prpm-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer">read the docs</a> to publish your first package.
            </p>
          </div>

        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-prpm-accent/10 to-prpm-purple/10 border border-prpm-accent/30 rounded-2xl p-8 my-12">
          <h3 className="text-2xl font-bold text-white mb-4">
            Explore PRPM Packages
          </h3>
          <p className="text-gray-300 mb-6">
            Browse thousands of validated, schema-compliant packages across all 8 formats
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/search"
              className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-hover text-white font-semibold rounded-lg transition-colors"
            >
              Browse Packages
            </Link>
            <a
              href="https://docs.prpm.dev"
              className="px-6 py-3 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white font-semibold rounded-lg transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the Docs
            </a>
            <a
              href="https://github.com/pr-pm/prpm/tree/main/packages/converters/schemas"
              className="px-6 py-3 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white font-semibold rounded-lg transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Schemas on GitHub
            </a>
          </div>
        </div>
      </article>
    </main>
  )
}
