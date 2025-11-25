'use client'

import { useState } from 'react'

interface CollapsibleContentProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export default function CollapsibleContent({
  title,
  defaultOpen = false,
  children
}: CollapsibleContentProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-prpm-dark-card border border-prpm-border rounded-lg mb-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-prpm-dark/50 transition-colors"
      >
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <svg
          className={`w-6 h-6 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-6">
          {children}
        </div>
      )}
    </div>
  )
}
