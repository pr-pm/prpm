import Link from 'next/link'
import type { Metadata } from 'next'
import NewsletterSubscribe from '@/components/NewsletterSubscribe'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: "Blog",
  description: "Latest updates, insights, and tutorials from the PRPM team about AI coding tools, prompts, and workflow automation.",
  openGraph: {
    title: "PRPM Blog - AI Coding Tools & Insights",
    description: "Latest updates and insights about AI prompts, agents, and developer tools.",
  },
}

interface BlogPost {
  slug: string
  title: string
  excerpt: string
  date: string
  author: string
  readTime: string
  tags: string[]
}

const blogPosts: BlogPost[] = [
  {
    slug: "custom-prompts-for-verified-authors",
    title: "Custom Prompts for Verified Authors: Test and Iterate on Prompts Before Publishing",
    excerpt: "Test your own custom system prompts in PRPM Playground. Use --compare mode to A/B test prompts against baselines. Perfect for authors who want to iterate rapidly before publishing packages.",
    date: "2025-11-10",
    author: "PRPM Team",
    readTime: "10 min read",
    tags: ["Feature", "Playground", "PRPM+"],
  },
  {
    slug: "self-improving-ai",
    title: "Self-Improving AI: How PRPM Teaches AI Assistants to Get Better at Their Job",
    excerpt: "Watch AI assistants automatically discover and install expertise packages from PRPM when they need specialized knowledge. A new paradigm for distributable intelligence.",
    date: "2025-11-08",
    author: "PRPM Team",
    readTime: "8 min read",
    tags: ["Technical", "Innovation", "AI Development", "Self-Improvement"],
  },
  {
    slug: "kiro-hooks-automation",
    title: "Best Kiro Hooks for Development Automation: Complete Guide 2025",
    excerpt: "Discover the best Kiro hooks for event-driven automation. Test synchronization, documentation updates, accessibility audits. Compare PRPM vs GitHub vs manual hooks. Get CLI installation and quality metrics.",
    date: "2025-11-06",
    author: "PRPM Team",
    readTime: "8 min read",
    tags: ["Kiro", "Hooks", "Automation", "AI Coding"],
  },
  {
    slug: "discovering-claude-skills-prpm-vs-competition",
    title: "Best Claude Skills: Complete Guide 2025",
    excerpt: "Discover the best Claude skills for AI-powered development. Compare PRPM vs ctx.directory, SkillsMP, and CursorHow. Get CLI installation, version control, and quality-scored collections.",
    date: "2025-11-04",
    author: "PRPM Team",
    readTime: "5 min read",
    tags: ["Claude", "Discovery", "Comparison"],
  },
  {
    slug: "discovering-cursor-rules",
    title: "Best Cursor Rules: Complete Guide 2025",
    excerpt: "Discover the best Cursor rules for AI-powered development. Compare PRPM vs cursor.directory. Get CLI installation, version control, format conversion, and testing playground.",
    date: "2025-11-04",
    author: "PRPM Team",
    readTime: "5 min read",
    tags: ["Cursor", "Discovery", "Comparison"],
  },
  {
    slug: "best-kiro-steering-rules",
    title: "Best Kiro Steering Rules: Complete Guide 2025",
    excerpt: "Discover the best Kiro steering rules for context-aware AI development. Compare sources, get CLI installation, quality metrics, and domain-specific steering files for frontend, backend, and API design.",
    date: "2025-11-06",
    author: "PRPM Team",
    readTime: "7 min read",
    tags: ["Kiro", "Steering Rules", "AI Coding"],
  },
  {
    slug: "discovering-copilot-instructions",
    title: "Best GitHub Copilot Instructions: Complete Guide 2025",
    excerpt: "Discover the best GitHub Copilot instructions for AI-powered development. Compare PRPM vs GitHub Gists vs awesome-copilot. Get CLI installation, version control, testing, and quality-scored collections.",
    date: "2025-11-06",
    author: "PRPM Team",
    readTime: "8 min read",
    tags: ["GitHub Copilot", "Best Practices", "AI Coding"],
  },
  {
    slug: "discovering-windsurf-rules",
    title: "Best Windsurf Rules for AI Coding: Complete Guide 2025",
    excerpt: "Discover the best Windsurf rules for AI-powered development. Compare PRPM vs Playbooks vs Windsurf.run. Get CLI installation, version control, testing, and free starter collections.",
    date: "2025-11-06",
    author: "PRPM Team",
    readTime: "7 min read",
    tags: ["Windsurf Rules", "AI Coding", "Best Practices"],
  },
  {
    slug: "playground-launch",
    title: "Introducing PRPM Playground: Test AI Prompts Before You Install",
    excerpt: "Test any PRPM package with real AI models directly in your browser or CLI. Compare results, share discoveries, and make informed decisions before installing. Start with 5 free credits.",
    date: "2025-11-04",
    author: "PRPM Team",
    readTime: "8 min read",
    tags: ["Launch", "Feature", "Playground", "Testing"],
  },
  {
    slug: "top-50-cursor-rules",
    title: "Top 50 Cursor Rules to Supercharge Your Development Workflow",
    excerpt: "We analyzed over 1,000 cursor rules to find the 50 that actually deliver. These aren't just popular—they're comprehensive, battle-tested, and cover everything from Next.js to Kubernetes.",
    date: "2025-11-03",
    author: "PRPM Team",
    readTime: "12 min read",
    tags: ["Cursor", "AI Development", "Developer Tools", "Best Practices"],
  },
  {
    slug: "when-to-use-claude-skill-vs-subagent",
    title: "When to Use a Claude Skill vs a Claude Sub-Agent",
    excerpt: "Skills and sub-agents sound similar but work completely differently. Pick the wrong one and you'll end up with context bloat or tasks that never finish. This guide shows you exactly when to use each.",
    date: "2025-10-31",
    author: "PRPM Team",
    readTime: "10 min read",
    tags: ["Technical", "Tutorial", "AI Development", "Claude Code"],
  },
  {
    slug: "prpm-vs-plugins",
    title: "PRPM vs Claude Plugins Marketplace: What's the Difference?",
    excerpt: "Understanding how PRPM differs from the Claude plugin marketplaces. Learn why PRPM manages AI instructions while plugins manage executable code, and why both can coexist in your workflow.",
    date: "2025-10-27",
    author: "PRPM Team",
    readTime: "5 min read",
    tags: ["PRPM", "Explainer", "Vision"],
  },
  {
    slug: "distributable-intelligence",
    title: "PRPM: Distributable Intelligence for AI-Assisted Development",
    excerpt: "Ship rules, skills, and agents that make breaking changes painless. Learn how PRPM closes the gap between migration scripts and docs, enabling 95% automated migrations vs 70% with scripts alone.",
    date: "2025-10-25",
    author: "PRPM Team",
    readTime: "15 min read",
    tags: ["Vision", "Technical", "AI Development"],
  },
  {
    slug: "cursor-deep-dive",
    title: "Cursor Rules: A Technical Deep Dive",
    excerpt: "Explore Cursor's MDC format for .cursor/rules/ - from official frontmatter fields to @filename references. Learn PRPM's implementation approach and best practices for creating effective rules.",
    date: "2025-10-26",
    author: "PRPM Team",
    readTime: "12 min read",
    tags: ["Cursor", "Format", "Deep Dive"],
  },
  {
    slug: "claude-deep-dive",
    title: "Claude Desktop & Claude Code: A Technical Deep Dive",
    excerpt: "Understand Claude's four official systems: CLAUDE.md, Skills, Agents, and Commands. Learn CSO optimization for skills and when to use each format for maximum effectiveness.",
    date: "2025-10-26",
    author: "PRPM Team",
    readTime: "15 min read",
    tags: ["Claude", "Skills", "Deep Dive"],
  },
  {
    slug: "copilot-deep-dive",
    title: "GitHub Copilot Instructions: A Deep Dive",
    excerpt: "Master GitHub Copilot's two-tier instruction system with repository-wide and path-specific rules. Learn glob patterns, applyTo configurations, and PRPM's implementation strategy.",
    date: "2025-10-26",
    author: "PRPM Team",
    readTime: "14 min read",
    tags: ["GitHub Copilot", "Instructions", "Deep Dive"],
  },
  {
    slug: "agents-md-deep-dive",
    title: "agents.md: A Deep Dive into OpenAI's Open Standard",
    excerpt: "Discover the simplicity philosophy behind agents.md - OpenAI's tool-agnostic standard for AI agent definitions. Learn auto-description extraction and PRPM's implementation approach.",
    date: "2025-10-26",
    author: "PRPM Team",
    readTime: "16 min read",
    tags: ["agents.md", "OpenAI", "Deep Dive"],
  },
  {
    slug: "continue-deep-dive",
    title: "Continue Dev Prompts: A Technical Deep Dive",
    excerpt: "Explore Continue's slash command system with template variables, context providers, and multifile support. Learn how PRPM packages Continue prompts for universal distribution.",
    date: "2025-10-26",
    author: "PRPM Team",
    readTime: "10 min read",
    tags: ["Continue", "Prompts", "Deep Dive"],
  },
  {
    slug: "windsurf-deep-dive",
    title: "Windsurf Rules: A Technical Deep Dive",
    excerpt: "Understand Windsurf's radical simplicity - single-file markdown rules with zero metadata. Learn the philosophy of minimalism and how PRPM enhances discoverability while preserving simplicity.",
    date: "2025-10-26",
    author: "PRPM Team",
    readTime: "9 min read",
    tags: ["Windsurf", "Simplicity", "Deep Dive"],
  },
  {
    slug: "kiro-deep-dive",
    title: "Kiro Steering Files: A Technical Deep Dive",
    excerpt: "Master Kiro's domain-organized steering system with foundational files and context modes. Learn global, domain, and file-level rules and PRPM's packaging strategy.",
    date: "2025-10-26",
    author: "PRPM Team",
    readTime: "13 min read",
    tags: ["Kiro", "Steering", "Deep Dive"],
  },
  {
    slug: "introducing-prpm",
    title: "Introducing PRPM: The Universal Registry for AI Coding Tools",
    excerpt: "Today, we're excited to launch PRPM - a universal package manager for AI prompts, agents, skills, and slash commands. Learn about our vision and what's coming next.",
    date: "2025-10-23",
    author: "PRPM Team",
    readTime: "5 min read",
    tags: ["Launch", "Announcement", "Vision"],
  },
]

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-[size:50px_50px] opacity-20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-prpm-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-prpm-green/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                Blog
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Updates, insights, and tutorials about AI coding tools, prompts, and workflow automation
            </p>
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-prpm-dark-card border border-prpm-border rounded-2xl p-6 hover:border-prpm-accent transition-all hover-lift"
            >
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <span>{post.readTime}</span>
                </div>

                <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-prpm-accent transition-colors">
                  {post.title}
                </h2>

                <p className="text-gray-400 leading-relaxed mb-4">
                  {post.excerpt}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-prpm-accent/10 border border-prpm-accent/30 rounded-full text-prpm-accent text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center text-gray-500 text-sm">
                  <span>By {post.author}</span>
                </div>
              </div>

              <div className="flex items-center text-prpm-accent text-sm font-semibold group-hover:gap-2 transition-all">
                Read more
                <svg className="w-4 h-4 ml-1 group-hover:ml-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty state for future posts */}
        {blogPosts.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-white mb-2">No posts yet</h2>
            <p className="text-gray-400">Check back soon for updates and insights!</p>
          </div>
        )}
      </div>

      {/* Newsletter CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <NewsletterSubscribe />
      </div>
    </main>
  )
}
