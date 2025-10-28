'use client'

import { useState } from 'react'

interface CopyInstallCommandProps {
  packageName: string
}

export default function CopyInstallCommand({ packageName }: CopyInstallCommandProps) {
  const [copied, setCopied] = useState(false)
  const installCommand = `prpm install ${packageName}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(installCommand)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4 mb-6 flex items-center justify-between gap-4">
      <code className="text-prpm-accent-light text-lg flex-1">{installCommand}</code>
      <button
        onClick={handleCopy}
        className="px-4 py-2 bg-prpm-accent hover:bg-prpm-accent-dark rounded-lg font-medium text-white transition-colors flex items-center gap-2 whitespace-nowrap"
      >
        {copied ? (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </>
        )}
      </button>
    </div>
  )
}
