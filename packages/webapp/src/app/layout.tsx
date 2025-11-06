import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { PostHogProvider } from '@/providers/PostHogProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://prpm.dev'),
  title: {
    default: 'PRPM - Largest Collection of Cursor Rules, Claude Agents & Slash Commands',
    template: '%s | PRPM'
  },
  description: 'The largest collection of Cursor rules, Claude agents, and slash commands. 2,100+ packages including cursor slash commands, claude slash commands, and claude plugins. Install AI coding tools with one command.',
  keywords: [
    'cursor rules',
    'cursor slash commands',
    'claude agents',
    'claude slash commands',
    'largest collection of cursor rules',
    'largest collection of claude plugins',
    'claude plugins',
    'cursor plugins',
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
    title: 'PRPM - Largest Collection of Cursor Rules, Claude Agents & Slash Commands',
    description: 'The largest collection of Cursor rules, Claude agents, and slash commands. 2,100+ packages including cursor slash commands, claude slash commands, and claude plugins.',
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
    title: 'PRPM - Largest Collection of Cursor Rules, Claude Agents & Slash Commands',
    description: 'The largest collection of Cursor rules, Claude agents, and slash commands. 2,100+ packages including cursor slash commands, claude slash commands, and claude plugins.',
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
      <head>
        {/* eslint-disable-next-line @next/next/next-script-for-ga */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-RH5GKLVYK2"></script>
        {/* eslint-disable-next-line @next/next/next-script-for-ga */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-RH5GKLVYK2');
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <PostHogProvider>
          <AuthProvider>{children}</AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
