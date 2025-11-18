import type { Metadata } from 'next'
import PlaygroundClient from './PlaygroundClient'

export const metadata: Metadata = {
  title: 'Playground | PRPM',
  description: 'Test packages with real AI models (Claude, GPT-4o) before installing. Compare results, iterate on prompts, and see exactly how packages work.',
  alternates: {
    canonical: 'https://prpm.dev/playground',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PlaygroundPage() {
  return <PlaygroundClient />
}
