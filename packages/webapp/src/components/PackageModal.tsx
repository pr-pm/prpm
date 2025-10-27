'use client'

import { useState } from 'react'
import { getLicenseUrl } from '@/lib/license-utils'

// Minimal package interface for modal display
interface ModalPackage {
  id: string
  name: string
  description?: string
  format: string
  subtype: string
  total_downloads: number
  weekly_downloads: number
  tags: string[]
  license?: string
  license_url?: string
  license_text?: string
  snippet?: string
  repository_url?: string
}

interface PackageModalProps {
  package: ModalPackage
  isOpen: boolean
  onClose: () => void
}

export default function PackageModal({ package: pkg, isOpen, onClose }: PackageModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopyInstall = () => {
    navigator.clipboard.writeText(`prpm install ${pkg.name}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatSubtype = (subtype: string) => {
    const labels: Record<string, string> = {
      'skill': 'Skill',
      'agent': 'Agent',
      'slash-command': 'Slash Command',
      'rule': 'Rule',
      'prompt': 'Prompt',
      'workflow': 'Workflow',
      'tool': 'Tool',
      'template': 'Template',
      'collection': 'Collection',
      'chatmode': 'Chat Mode',
    }
    return labels[subtype] || subtype
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-prpm-dark-card border border-prpm-border rounded-xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">{pkg.name}</h2>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-prpm-dark rounded text-sm text-prpm-accent">
                {pkg.format}
              </span>
              <span className="px-3 py-1 bg-prpm-dark rounded text-sm text-gray-400">
                {formatSubtype(pkg.subtype)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <p className="text-gray-300 mb-6">{pkg.description || 'No description available'}</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-prpm-dark p-4 rounded-lg">
            <div className="text-2xl font-bold text-prpm-accent">
              {pkg.total_downloads.toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm">Total Downloads</div>
          </div>
          <div className="bg-prpm-dark p-4 rounded-lg">
            <div className="text-2xl font-bold text-prpm-accent">
              {pkg.weekly_downloads.toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm">Weekly Downloads</div>
          </div>
        </div>

        {pkg.tags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {pkg.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-prpm-dark border border-prpm-border rounded text-sm text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {pkg.snippet && (
          <div className="mb-6">
            <details className="group">
              <summary className="cursor-pointer text-gray-400 hover:text-white text-sm list-none flex items-center gap-2 mb-2">
                <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Preview Content</span>
              </summary>
              <pre className="bg-prpm-dark border border-prpm-border rounded p-3 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-80 overflow-y-auto">
                {pkg.snippet}
              </pre>
            </details>
          </div>
        )}

        {pkg.license && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">License</h3>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-sm">
                {pkg.license}
              </span>
              {(() => {
                const licenseUrl = getLicenseUrl(pkg.license_url, pkg.repository_url)
                return licenseUrl ? (
                  <a
                    href={licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-prpm-accent hover:underline text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View License →
                  </a>
                ) : null
              })()}
            </div>
            {pkg.license_text && (
              <details className="group">
                <summary className="cursor-pointer text-gray-400 hover:text-white text-sm list-none flex items-center gap-2">
                  <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  View Full License Text
                </summary>
                <pre className="bg-prpm-dark border border-prpm-border rounded p-3 text-xs text-gray-300 overflow-x-auto mt-2 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {pkg.license_text}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCopyInstall}
            className="w-full px-4 py-2 bg-prpm-accent hover:bg-prpm-accent-dark rounded-lg font-medium"
          >
            {copied ? '✓ Copied!' : 'Copy Install Command'}
          </button>
        </div>
      </div>
    </div>
  )
}
