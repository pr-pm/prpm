import type { Metadata } from 'next'
import PlaygroundClient from './PlaygroundClient'

const PLAYGROUND_URL = 'https://prpm.dev/playground'

export const metadata: Metadata = {
  title: 'Playground | PRPM',
  description: 'Test packages with real AI models (Claude, GPT-4o) before installing. Compare results, iterate on prompts, and see exactly how packages work.',
  alternates: {
    canonical: PLAYGROUND_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const dynamic = 'force-static'

export default function PlaygroundPage() {
  return <PlaygroundClient />
}
