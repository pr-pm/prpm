'use client'

import { Sparkles } from 'lucide-react'

interface AISearchToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export function AISearchToggle({ enabled, onChange }: AISearchToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`flex items-center gap-3 px-5 py-4 rounded-lg border transition-all whitespace-nowrap ${
        enabled
          ? 'bg-yellow-600/10 border-yellow-600 text-yellow-500'
          : 'bg-prpm-dark-card border-prpm-border text-gray-400 hover:border-gray-600 hover:text-gray-300'
      }`}
      title="Toggle AI Search"
      aria-pressed={enabled}
      aria-label={`AI Search is ${enabled ? 'enabled' : 'disabled'}`}
    >
      <Sparkles className={`w-5 h-5 ${enabled ? 'text-yellow-500' : 'text-gray-500'}`} />
      <span className="text-sm font-medium">
        AI Search
      </span>
      <div
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-yellow-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
    </button>
  )
}
