import type { Metadata } from 'next'
import SearchClient from './SearchClient'

export const metadata: Metadata = {
  title: 'Search Packages | PRPM',
  description: 'Search AI prompt packages, agents, skills, and workflows. Filter by IDE, format, author, tags, and more.',
  alternates: {
    canonical: 'https://prpm.dev/search',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const dynamic = 'force-static'

export default function SearchPage() {
  return <SearchClient />
}
