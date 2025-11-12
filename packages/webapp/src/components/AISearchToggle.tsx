'use client'

import { Sparkles } from 'lucide-react'
import { useState } from 'react'

interface AISearchToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  jwtToken?: string
}

export function AISearchToggle({ enabled, onChange, jwtToken }: AISearchToggleProps) {
  const [showLoginModal, setShowLoginModal] = useState(false)

  const handleToggle = () => {
    if (!jwtToken) {
      // Not logged in - show sign in prompt
      setShowLoginModal(true)
      return
    }

    // Toggle AI search (now free for authenticated users)
    onChange(!enabled)
  }

  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <Sparkles className={`w-5 h-5 ${enabled ? 'text-purple-600' : 'text-gray-400'}`} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          AI Search
        </span>
        {jwtToken && (
          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
            Free
          </span>
        )}
        <button
          onClick={handleToggle}
          className={`ml-auto relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled && jwtToken
              ? 'bg-purple-600'
              : 'bg-gray-300 dark:bg-gray-600'
          }`}
          title={jwtToken ? 'Toggle AI Search' : 'Sign in to use AI Search'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled && jwtToken ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
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

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Sign in to use AI Search - it's completely free for all users!
            </p>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Free AI Search features:
              </h3>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">✓</span>
                  <span>Natural language search</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">✓</span>
                  <span>Semantic package discovery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">✓</span>
                  <span>AI-powered recommendations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">✓</span>
                  <span>Similar package suggestions</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = '/login'}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
