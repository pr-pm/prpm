import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
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
      <Header />

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 md:p-12">
          <div className="prose prose-invert prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }} />
          </div>
        </div>

        <Footer />
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
