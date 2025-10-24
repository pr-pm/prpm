import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { promises as fs } from 'fs'
import path from 'path'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'PRPM Terms of Service - Legal agreement for using the Prompt Package Manager service.',
}

export default async function TermsPage() {
  // Read the markdown file from public/legal
  const filePath = path.join(process.cwd(), 'public', 'legal', 'TERMS_OF_SERVICE.md')
  const content = await fs.readFile(filePath, 'utf8')

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
            </div>
            <div className="flex items-center gap-4">
              <Link href="/legal/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                Privacy Policy
              </Link>
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

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 md:p-12">
          <div className="prose prose-invert prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }} />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-prpm-border">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
            <Link href="/legal/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
              Privacy Policy →
            </Link>
          </div>
        </footer>
      </article>
    </main>
  )
}

// Simple markdown to HTML converter (basic implementation)
function formatMarkdown(markdown: string): string {
  return markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/^([0-9]+)\. (.*$)/gim, '<li>$2</li>')
    // Checkmarks and crosses
    .replace(/✅/g, '<span class="text-green-400">✅</span>')
    .replace(/❌/g, '<span class="text-red-400">❌</span>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/^\*\*(.*?):\*\*/gim, '<strong>$1:</strong>')
    // Wrap in paragraph tags
    .split('\n')
    .map(line => {
      if (line.startsWith('<h') || line.startsWith('<li') || line.trim() === '') {
        return line
      }
      return `<p>${line}</p>`
    })
    .join('\n')
}
