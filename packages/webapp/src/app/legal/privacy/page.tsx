import Link from 'next/link'
import Header from '@/components/Header'
import type { Metadata } from 'next'
import { promises as fs } from 'fs'
import path from 'path'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'PRPM Privacy Policy - How we collect, use, and protect your data.',
}

export default async function PrivacyPage() {
  // Read the markdown file from public/legal
  const filePath = path.join(process.cwd(), 'public', 'legal', 'PRIVACY_POLICY.md')
  const content = await fs.readFile(filePath, 'utf8')

  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

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
            <Link href="/legal/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
              Terms of Service →
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
