'use client'

import { useState, useEffect } from 'react'

interface CollectionPackage {
  packageId: string
  version?: string
  required: boolean
  reason?: string
  package?: {
    name: string
    description?: string
    type: string
    tags: string[]
  }
}

interface ModalCollection {
  id: string
  name: string
  name_slug: string
  scope: string
  version: string
  description?: string
  author: string
  package_count?: number
  downloads: number
  stars: number
  tags: string[]
  packages?: CollectionPackage[]
  verified?: boolean
  official?: boolean
  category?: string
}

interface CollectionModalProps {
  collection: ModalCollection
  isOpen: boolean
  onClose: () => void
}

const REGISTRY_URL = process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3000'

export default function CollectionModal({ collection: initialCollection, isOpen, onClose }: CollectionModalProps) {
  const [copied, setCopied] = useState(false)
  const [collection, setCollection] = useState<ModalCollection>(initialCollection)
  const [loading, setLoading] = useState(false)

  // Fetch full collection details when modal opens
  useEffect(() => {
    if (!isOpen) return

    const fetchCollectionDetails = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `${REGISTRY_URL}/api/v1/collections/${initialCollection.scope}/${initialCollection.name_slug}/${initialCollection.version}`
        )
        if (response.ok) {
          const fullCollection = await response.json()
          setCollection(fullCollection)
        }
      } catch (error) {
        console.error('Failed to fetch collection details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCollectionDetails()
  }, [isOpen, initialCollection.scope, initialCollection.name_slug, initialCollection.version])

  if (!isOpen) return null

  const handleCopyInstall = () => {
    navigator.clipboard.writeText(`prpm install collections/${collection.name_slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-prpm-dark-card border border-prpm-border rounded-xl p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold">{collection.name}</h2>
              {collection.verified && (
                <svg className="w-6 h-6 text-prpm-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {collection.official && (
                <span className="px-3 py-1 bg-prpm-accent/20 text-prpm-accent text-sm rounded-full">
                  Official
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 font-mono mb-2">{collection.name_slug}</p>
            <p className="text-gray-400 text-sm">by @{collection.author}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-300 mb-6">{collection.description || 'No description available'}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-prpm-dark p-4 rounded-lg">
            <div className="text-2xl font-bold text-prpm-accent">
              {collection.package_count}
            </div>
            <div className="text-gray-400 text-sm">Packages</div>
          </div>
          <div className="bg-prpm-dark p-4 rounded-lg">
            <div className="text-2xl font-bold text-prpm-accent">
              {collection.downloads.toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm">Installs</div>
          </div>
          <div className="bg-prpm-dark p-4 rounded-lg">
            <div className="text-2xl font-bold text-prpm-accent">
              {collection.stars}
            </div>
            <div className="text-gray-400 text-sm">Stars</div>
          </div>
        </div>

        {/* Category & Tags */}
        {(collection.category || collection.tags.length > 0) && (
          <div className="mb-6 flex flex-wrap gap-2">
            {collection.category && (
              <span className="px-3 py-1 bg-prpm-accent/10 text-prpm-accent rounded-full text-sm">
                {collection.category}
              </span>
            )}
            {collection.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1 bg-prpm-dark border border-prpm-border rounded-full text-sm text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Packages List */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">
            Included Packages ({collection.packages?.length || 0})
          </h3>
          <div className="space-y-2">
            {loading ? (
              <div className="text-center text-gray-400 py-4">Loading packages...</div>
            ) : collection.packages && collection.packages.length > 0 ? (
              collection.packages.map((pkg) => (
                <div
                  key={pkg.packageId}
                  className="bg-prpm-dark border border-prpm-border rounded-lg p-4 hover:border-prpm-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white">{pkg.package?.name || pkg.packageId}</h4>
                        {pkg.package?.type && (
                          <span className="px-2 py-0.5 bg-prpm-dark-card rounded text-xs text-prpm-accent">
                            {pkg.package.type}
                          </span>
                        )}
                        {pkg.required && (
                          <span className="px-2 py-0.5 bg-prpm-accent/20 text-prpm-accent rounded text-xs">
                            Required
                          </span>
                        )}
                      </div>
                      {pkg.package?.description && (
                        <p className="text-sm text-gray-400">{pkg.package.description}</p>
                      )}
                      {pkg.reason && (
                        <p className="text-xs text-gray-500 mt-1 italic">{pkg.reason}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-4">No packages in this collection yet.</div>
            )}
          </div>
        </div>

        {/* Install Command */}
        <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-400">Install Collection</h3>
            <button
              onClick={handleCopyInstall}
              className="px-3 py-1 bg-prpm-accent text-white rounded text-sm hover:bg-prpm-accent-light transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <code className="text-prpm-accent-light">
            prpm install collections/{collection.name_slug}
          </code>
        </div>

      </div>
    </div>
  )
}
