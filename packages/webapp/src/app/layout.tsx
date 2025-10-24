import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://prpm.dev'),
  title: {
    default: 'PRPM - The Universal Registry for AI Coding Tools',
    template: '%s | PRPM'
  },
  description: 'Discover and install cross-platform prompts, rules, skills, and agents that work with Cursor, Claude, Continue, Windsurf, and more — all from one file.',
  keywords: [
    'AI prompts',
    'cursor prompts',
    'claude prompts',
    'windsurf',
    'continue',
    'package manager',
    'AI tools',
    'coding prompts',
    'AI agents',
    'prompt registry',
    'slash commands',
    'cursor rules',
    'claude code',
    'AI coding assistant',
    'developer tools'
  ],
  authors: [{ name: 'PRPM', url: 'https://prpm.dev' }],
  creator: 'PRPM',
  publisher: 'PRPM',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/logo-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://prpm.dev',
    title: 'PRPM - The Universal Registry for AI Coding Tools',
    description: 'Discover and install cross-platform prompts, rules, skills, and agents that work with Cursor, Claude, Continue, Windsurf, and more — all from one file.',
    siteName: 'PRPM',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PRPM - The Universal Registry for AI Coding Tools',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PRPM - The Universal Registry for AI Coding Tools',
    description: 'Discover and install cross-platform prompts, rules, skills, and agents that work with Cursor, Claude, Continue, Windsurf, and more.',
    images: ['/og-image.png'],
    creator: '@prpmdev',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add these when you have them
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
