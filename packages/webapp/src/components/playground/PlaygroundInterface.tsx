'use client'

import { useState, useEffect } from 'react'
import { runPlayground, estimatePlaygroundCredits, getPlaygroundSession, searchPackages } from '../../lib/api'
import type { PlaygroundMessage, Package } from '../../lib/api'

interface PlaygroundInterfaceProps {
  initialPackageId?: string
  sessionId?: string
  onCreditsChange: () => void
  onSessionCreated: () => void
}

export default function PlaygroundInterface({
  initialPackageId,
  sessionId,
  onCreditsChange,
  onSessionCreated,
}: PlaygroundInterfaceProps) {
  const [packageId, setPackageId] = useState(initialPackageId || '')
  const [packageSearch, setPackageSearch] = useState('')
  const [packages, setPackages] = useState<Package[]>([])
  const [showPackageDropdown, setShowPackageDropdown] = useState(false)
  const [input, setInput] = useState('')
  const [conversation, setConversation] = useState<PlaygroundMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [estimatedCredits, setEstimatedCredits] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [model, setModel] = useState<'sonnet' | 'opus' | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo'>('sonnet')
  const [currentSessionId, setCurrentSessionId] = useState(sessionId)

  // Load session if provided
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId)
    } else {
      setConversation([])
      setCurrentSessionId(undefined)
    }
  }, [sessionId])

  // Load package options when searching
  useEffect(() => {
    if (packageSearch.length > 1) {
      searchForPackages(packageSearch)
    } else {
      setPackages([])
    }
  }, [packageSearch])

  const searchForPackages = async (query: string) => {
    try {
      const result = await searchPackages({ q: query, limit: 10 })
      setPackages(result.packages)
      setShowPackageDropdown(true)
    } catch (err) {
      console.error('Failed to search packages:', err)
    }
  }

  const loadSession = async (id: string) => {
    const token = localStorage.getItem('prpm_token')
    if (!token) return

    try {
      const session = await getPlaygroundSession(token, id)
      setConversation(session.conversation)
      setPackageId(session.package_id)
      setCurrentSessionId(id)
    } catch (err: any) {
      console.error('Failed to load session:', err)
      setError(err.message || 'Failed to load session')
    }
  }

  const handleEstimate = async () => {
    if (!packageId || !input.trim()) return

    const token = localStorage.getItem('prpm_token')
    if (!token) return

    try {
      const result = await estimatePlaygroundCredits(token, {
        package_id: packageId,
        input: input.trim(),
        model,
      })
      setEstimatedCredits(result.estimated_credits)
    } catch (err) {
      console.error('Failed to estimate:', err)
    }
  }

  const handleRun = async () => {
    if (!packageId || !input.trim()) {
      setError('Please select a package and enter input')
      return
    }

    const token = localStorage.getItem('prpm_token')
    if (!token) {
      setError('Not authenticated')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await runPlayground(token, {
        package_id: packageId,
        input: input.trim(),
        model,
        session_id: currentSessionId,
      })

      setConversation(result.conversation)
      setCurrentSessionId(result.session_id)
      setInput('')
      setEstimatedCredits(null)
      onCreditsChange()
      onSessionCreated()
    } catch (err: any) {
      console.error('Failed to run playground:', err)
      setError(err.message || 'Failed to run playground')

      // Handle insufficient credits error
      if (err.message.includes('Insufficient credits') || err.message.includes('402')) {
        setError('Insufficient credits. Please buy more credits to continue.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Estimate credits when input changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (packageId && input.trim().length > 10) {
        handleEstimate()
      }
    }, 500)

    return () => clearTimeout(debounce)
  }, [packageId, input, model])

  const selectedPackage = packages.find(p => p.id === packageId)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
      {/* Package Selection */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Select Package
        </label>
        <div className="relative">
          <input
            type="text"
            value={packageId && selectedPackage ? `${(selectedPackage as any).author_username || 'unknown'}/${selectedPackage.name}` : packageSearch}
            onChange={(e) => {
              setPackageSearch(e.target.value)
              if (packageId) setPackageId('') // Clear selected package when user starts typing
            }}
            onFocus={() => setShowPackageDropdown(true)}
            placeholder="Search for a package..."
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {showPackageDropdown && packages.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => {
                    setPackageId(pkg.id)
                    setPackageSearch('')
                    setShowPackageDropdown(false)
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                >
                  <div className="font-semibold text-gray-800 dark:text-white">
                    {(pkg as any).author_username || 'unknown'}/{pkg.name}
                  </div>
                  {pkg.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {pkg.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Model Selection */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Model
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            onClick={() => setModel('sonnet')}
            className={`px-2 sm:px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition ${
              model === 'sonnet'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Claude Sonnet
            <div className="text-xs opacity-75">1 credit</div>
          </button>
          <button
            onClick={() => setModel('opus')}
            className={`px-2 sm:px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition ${
              model === 'opus'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Claude Opus
            <div className="text-xs opacity-75">3 credits</div>
          </button>
          <button
            onClick={() => setModel('gpt-4o-mini')}
            className={`px-2 sm:px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition ${
              model === 'gpt-4o-mini'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            GPT-4o Mini
            <div className="text-xs opacity-75">1 credit</div>
          </button>
          <button
            onClick={() => setModel('gpt-4o')}
            className={`px-2 sm:px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition ${
              model === 'gpt-4o'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            GPT-4o
            <div className="text-xs opacity-75">2 credits</div>
          </button>
          <button
            onClick={() => setModel('gpt-4-turbo')}
            className={`px-2 sm:px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition ${
              model === 'gpt-4-turbo'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            GPT-4 Turbo
            <div className="text-xs opacity-75">3 credits</div>
          </button>
        </div>
      </div>

      {/* Conversation History */}
      {conversation.length > 0 && (
        <div className="mb-4 sm:mb-6 max-h-64 sm:max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          {conversation.map((message, index) => (
            <div
              key={index}
              className={`p-3 sm:p-4 ${
                message.role === 'user'
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'bg-gray-50 dark:bg-gray-700/50'
              }`}
            >
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase">
                {message.role}
              </div>
              <div className="text-sm sm:text-base text-gray-900 dark:text-white whitespace-pre-wrap break-words">{message.content}</div>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Your Input
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your input or question here..."
          rows={4}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={loading}
        />
      </div>

      {/* Estimated Credits */}
      {estimatedCredits !== null && (
        <div className="mb-4 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
            💡 Estimated cost: <span className="font-bold">{estimatedCredits} credits</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="text-xs sm:text-sm text-red-800 dark:text-red-300">{error}</div>
        </div>
      )}

      {/* Run Button */}
      <button
        onClick={handleRun}
        disabled={loading || !packageId || !input.trim()}
        className={`w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold text-sm sm:text-base text-white transition ${
          loading || !packageId || !input.trim()
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 shadow-sm'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Running...
          </span>
        ) : (
          'Run Playground'
        )}
      </button>
    </div>
  )
}
