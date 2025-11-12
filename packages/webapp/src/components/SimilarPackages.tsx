'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSimilarPackages } from '@/lib/api'
import { getPackageUrl } from '@/lib/package-url'
import { Sparkles, Download, Star, Crown } from 'lucide-react'
import { PRPMPlusUpgradeModal } from './PRPMPlusUpgradeModal'

interface SimilarPackagesProps {
  packageId: string
  jwtToken?: string
  limit?: number
}

export function SimilarPackages({ packageId, jwtToken, limit = 5 }: SimilarPackagesProps) {
  const [similarPackages, setSimilarPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    async function loadSimilar() {
      if (!jwtToken) {
        setLoading(false)
        return
      }

      try {
        const result = await getSimilarPackages(packageId, jwtToken, limit)
        setSimilarPackages(result.similar_packages || [])
        setError(null)
      } catch (err: any) {
        console.error('Failed to load similar packages:', err)
        if (err.message?.includes('prpm_plus_required') || err.message?.includes('403')) {
          setError('prpm_plus_required')
        } else {
          setError('Failed to load similar packages')
        }
      } finally {
        setLoading(false)
      }
    }

    loadSimilar()
  }, [packageId, jwtToken, limit])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Similar Packages
          </h3>
          <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">
            AI
          </span>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  if (error === 'prpm_plus_required') {
    return (
      <>
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-700 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Similar Packages
            </h3>
            <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
              PRPM+
            </span>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Discover similar packages using AI-powered semantic matching.
          </p>

          <button
            onClick={() => setShowUpgradeModal(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105"
          >
            Unlock with PRPM+
          </button>
        </div>

        <PRPMPlusUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature="Similar Packages"
        />
      </>
    )
  }

  if (!jwtToken) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Similar Packages
          </h3>
          <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
            AI
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
          Sign in to see AI-powered package recommendations
        </p>

        <button
          onClick={() => window.location.href = '/login'}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Sign In to View
        </button>
      </div>
    )
  }

  if (error || similarPackages.length === 0) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Similar Packages
        </h3>
        <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">
          AI
        </span>
      </div>

      <div className="space-y-3">
        {similarPackages.map((pkg, index) => (
          <Link
            key={pkg.package_id}
            href={getPackageUrl(pkg.name, pkg.author_username || '')}
            className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-transparent hover:border-purple-200 dark:hover:border-purple-700 transition-all group"
          >
            <div className="flex items-start gap-3">
              {/* Match indicator */}
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-400">
                  {Math.round((pkg.similarity_score || 0) * 100)}%
                </span>
              </div>

              <div className="flex-1 min-w-0">
                {/* Package name */}
                <div className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                  {pkg.name}
                </div>

                {/* Description */}
                {pkg.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                    {pkg.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-500">
                  <div className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    <span>{pkg.total_downloads?.toLocaleString() || 0}</span>
                  </div>
                  {pkg.quality_score && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      <span>{Number(pkg.quality_score).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Powered by AI semantic matching
        </p>
      </div>
    </div>
  )
}
