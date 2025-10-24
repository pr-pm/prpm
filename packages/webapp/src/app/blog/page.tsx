import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import NewsletterSubscribe from '@/components/NewsletterSubscribe'

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
                <Link href="/blog" className="text-white font-semibold">
                  Blog
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/khaliqgant/prompt-package-manager"
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

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-[size:50px_50px] opacity-20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-prpm-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-prpm-purple/20 rounded-full blur-3xl"></div>

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
          {blogPosts.map((post) => (
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
