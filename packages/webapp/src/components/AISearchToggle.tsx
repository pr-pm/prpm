'use client'

import { useState, useEffect } from 'react'
import { checkAISearchAccess } from '@/lib/api'
import { Sparkles } from 'lucide-react'

interface AISearchToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  jwtToken?: string
}

export function AISearchToggle({ enabled, onChange, jwtToken }: AISearchToggleProps) {
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [accessInfo, setAccessInfo] = useState<any>(null)

  useEffect(() => {
    async function checkAccess() {
      if (!jwtToken) {
        setLoading(false)
        return
      }

      try {
        const result = await checkAISearchAccess(jwtToken)
        setHasAccess(result.has_access)
        setAccessInfo(result)
      } catch (error) {
        console.error('Failed to check AI search access:', error)
        setHasAccess(false)
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [jwtToken])

  const handleToggle = () => {
    if (!jwtToken) {
      // Not logged in - show sign in prompt
      setShowUpgradeModal(true)
      return
    }

    if (!hasAccess) {
      // No PRPM+ - show upgrade prompt
      setShowUpgradeModal(true)
      return
    }

    // Has access - toggle
    onChange(!enabled)
  }

  if (loading) {
    return null
  }

  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <Sparkles className={`w-5 h-5 ${enabled ? 'text-purple-600' : 'text-gray-400'}`} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          AI Search
        </span>
        {hasAccess && accessInfo?.reason === 'trial_active' && (
          <span className="text-xs text-orange-600 dark:text-orange-400">
            Trial
          </span>
        )}
        <button
          onClick={handleToggle}
          className={`ml-auto relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled && hasAccess
              ? 'bg-purple-600'
              : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled && hasAccess ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI-Powered Search
              </h2>
            </div>

            {!jwtToken ? (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Sign in to try AI Search with a 14-day free trial!
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  AI Search uses natural language to find packages semantically.
                  It's included with PRPM+ at $19/month.
                </p>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    PRPM+ includes:
                  </h3>
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {accessInfo?.upgrade_info?.benefits?.map((benefit: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => window.location.href = accessInfo?.upgrade_info?.upgrade_url || '/pricing'}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {accessInfo?.upgrade_info?.trial_available ? 'Start 14-Day Trial' : 'Upgrade to PRPM+'}
                  </button>
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
