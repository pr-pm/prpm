'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { runPlayground, runAnonymousPlayground, estimatePlaygroundCredits, getPlaygroundSession, searchPackages, runCustomPrompt, getCurrentUser } from '../../lib/api'
import type { PlaygroundMessage, Package } from '../../lib/api'
import CustomPromptInput from './CustomPromptInput'

interface PlaygroundInterfaceProps {
  initialPackageId?: string
  initialInput?: string
  sessionId?: string
  initialCompareMode?: boolean
  onCreditsChange: () => void
  onSessionCreated: () => void
}

export default function PlaygroundInterface({
  initialPackageId,
  initialInput,
  sessionId,
  initialCompareMode = false,
  onCreditsChange,
  onSessionCreated,
}: PlaygroundInterfaceProps) {
  // Comparison mode state
  const [comparisonMode, setComparisonMode] = useState(initialCompareMode)

  // Package A (original/left side)
  const [packageId, setPackageId] = useState(initialPackageId || '')
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [packageSearch, setPackageSearch] = useState('')
  const [packages, setPackages] = useState<Package[]>([])
  const [showPackageDropdown, setShowPackageDropdown] = useState(false)

  // Package B (comparison/right side)
  const [packageIdB, setPackageIdB] = useState('')
  const [selectedPackageB, setSelectedPackageB] = useState<Package | null>(null)
  const [packageSearchB, setPackageSearchB] = useState('')
  const [packagesB, setPackagesB] = useState<Package[]>([])
  const [showPackageDropdownB, setShowPackageDropdownB] = useState(false)

  // Shared state
  const [input, setInput] = useState('')
  const [conversation, setConversation] = useState<PlaygroundMessage[]>([])
  const [conversationB, setConversationB] = useState<PlaygroundMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingB, setLoadingB] = useState(false)
  const [estimatedCredits, setEstimatedCredits] = useState<number | null>(null)
  const [estimatedCreditsB, setEstimatedCreditsB] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorB, setErrorB] = useState<string | null>(null)
  const [model, setModel] = useState<'sonnet' | 'opus' | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo'>('sonnet')
  const [currentSessionId, setCurrentSessionId] = useState(sessionId)
  const [currentSessionIdB, setCurrentSessionIdB] = useState<string | undefined>(undefined)
  const [collapsedExchanges, setCollapsedExchanges] = useState<Set<number>>(new Set())
  const [collapsedExchangesB, setCollapsedExchangesB] = useState<Set<number>>(new Set())
  const [showAnonymousLoginPrompt, setShowAnonymousLoginPrompt] = useState(false)
  const [isAnonymousUser, setIsAnonymousUser] = useState(false)

  // Custom prompt mode state
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [isVerifiedAuthor, setIsVerifiedAuthor] = useState(false)

  // Helper function to group messages into exchanges (user input + assistant response pairs)
  const groupIntoExchanges = (messages: PlaygroundMessage[]): Array<{ user: PlaygroundMessage; assistant: PlaygroundMessage | null; index: number }> => {
    const exchanges: Array<{ user: PlaygroundMessage; assistant: PlaygroundMessage | null; index: number }> = []
    for (let i = 0; i < messages.length; i += 2) {
      if (messages[i]?.role === 'user') {
        exchanges.push({
          user: messages[i],
          assistant: messages[i + 1]?.role === 'assistant' ? messages[i + 1] : null,
          index: exchanges.length
        })
      }
    }
    return exchanges
  }

  // Toggle collapse state for an exchange
  const toggleExchange = (exchangeIndex: number, isPackageB: boolean = false) => {
    if (isPackageB) {
      setCollapsedExchangesB(prev => {
        const next = new Set(prev)
        if (next.has(exchangeIndex)) {
          next.delete(exchangeIndex)
        } else {
          next.add(exchangeIndex)
        }
        return next
      })
    } else {
      setCollapsedExchanges(prev => {
        const next = new Set(prev)
        if (next.has(exchangeIndex)) {
          next.delete(exchangeIndex)
        } else {
          next.add(exchangeIndex)
        }
        return next
      })
    }
  }

  // Check if user is anonymous (no token)
  useEffect(() => {
    const token = localStorage.getItem('prpm_token')
    const isAnon = !token
    setIsAnonymousUser(isAnon)

    // Default to gpt-4o-mini for anonymous users (only available model)
    if (isAnon) {
      setModel('gpt-4o-mini')
    }
  }, [])

  // Fetch user verification status for custom prompt feature
  useEffect(() => {
    const token = localStorage.getItem('prpm_token')
    if (token) {
      getCurrentUser(token).then(user => {
        setIsVerifiedAuthor(user.verified_author || false)
      }).catch(() => setIsVerifiedAuthor(false))
    }
  }, [])

  // Load session if provided
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId)
    } else {
      setConversation([])
      setCurrentSessionId(undefined)
    }
  }, [sessionId])

  // Load package details if initialPackageId is provided
  useEffect(() => {
    if (initialPackageId && !selectedPackage) {
      loadInitialPackage(initialPackageId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPackageId])

  // Set initial input if provided via URL parameter
  useEffect(() => {
    if (initialInput && input === '') {
      setInput(initialInput)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInput])

  const loadInitialPackage = async (packageIdToLoad: string) => {
    try {
      // Use searchPackages to find the package by searching for packages
      // and filtering by ID client-side (not ideal but works for now)
      const result = await searchPackages({ q: '', limit: 100 })
      const pkg = result.packages.find((p) => p.id === packageIdToLoad)

      if (pkg) {
        setSelectedPackage(pkg)
        setPackageId(pkg.id)
      } else {
        console.warn(`Package with ID ${packageIdToLoad} not found`)
      }
    } catch (err) {
      console.error('Failed to load initial package:', err)
    }
  }

  // Auto-collapse older exchanges (keep last 2 expanded)
  useEffect(() => {
    if (!conversation) return
    const exchanges = groupIntoExchanges(conversation)
    if (exchanges.length > 2) {
      const newCollapsed = new Set<number>()
      // Collapse all except the last 2
      for (let i = 0; i < exchanges.length - 2; i++) {
        newCollapsed.add(exchanges[i].index)
      }
      setCollapsedExchanges(newCollapsed)
    } else {
      setCollapsedExchanges(new Set())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation])

  // Auto-collapse older exchanges for Package B (keep last 2 expanded)
  useEffect(() => {
    if (!conversationB) return
    const exchanges = groupIntoExchanges(conversationB)
    if (exchanges.length > 2) {
      const newCollapsed = new Set<number>()
      // Collapse all except the last 2
      for (let i = 0; i < exchanges.length - 2; i++) {
        newCollapsed.add(exchanges[i].index)
      }
      setCollapsedExchangesB(newCollapsed)
    } else {
      setCollapsedExchangesB(new Set())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationB])

  // Load package options when searching (Package A)
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (packageSearch.length > 1) {
        searchForPackages(packageSearch, 'A')
      } else {
        setPackages([])
      }
    }, 300)

    return () => clearTimeout(debounce)
  }, [packageSearch])

  // Load package options when searching (Package B)
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (packageSearchB.length > 1) {
        searchForPackages(packageSearchB, 'B')
      } else {
        setPackagesB([])
      }
    }, 300)

    return () => clearTimeout(debounce)
  }, [packageSearchB])

  const searchForPackages = async (query: string, target: 'A' | 'B') => {
    try {
      const result = await searchPackages({ q: query, limit: 10 })
      if (target === 'A') {
        setPackages(result.packages)
        setShowPackageDropdown(true)
      } else {
        setPackagesB(result.packages)
        setShowPackageDropdownB(true)
      }
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
    // Validation for custom prompt mode
    if (useCustomPrompt) {
      if (!customPrompt.trim() || !input.trim()) {
        setError('Please enter both a custom prompt and input')
        return
      }
    } else {
      // Regular package mode validation
      if (!packageId || !input.trim()) {
        setError('Please select a package and enter input')
        return
      }
    }

    if (comparisonMode && !packageIdB) {
      // In comparison mode, allow Package B to be empty (baseline comparison)
      // setErrorB('Please select a second package for comparison')
      // return
    }

    const token = localStorage.getItem('prpm_token')

    // Handle anonymous users (one free run)
    if (!token) {
      setLoading(true)
      setError(null)

      try {
        const result = await runAnonymousPlayground({
          package_id: packageId,
          input: input.trim(),
        })

        // Create a conversation with the result
        const newConversation: PlaygroundMessage[] = [
          {
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toISOString(),
          },
          {
            role: 'assistant',
            content: result.response,
            timestamp: new Date().toISOString(),
          },
        ]

        setConversation(newConversation)
        setInput('')

        // Show login prompt
        setShowAnonymousLoginPrompt(true)

      } catch (err: any) {
        console.error('Anonymous playground run failed:', err)

        // Check if limit exceeded (already used free run)
        if (err.message.includes('limit_exceeded') || err.message.includes('429')) {
          setError('You have already used your free playground run. Please sign up to get 5 free credits and continue testing packages.')
          setShowAnonymousLoginPrompt(true)
        } else {
          setError(err.message || 'Failed to run playground')
        }
      } finally {
        setLoading(false)
      }
      return
    }

    if (comparisonMode) {
      // Run both packages in parallel (or just Package A if B is empty for baseline)
      setLoading(true)
      setLoadingB(true)
      setError(null)
      setErrorB(null)

      try {
        // If packageIdB is empty, run baseline comparison (no package)
        const promises = [
          runPlayground(token, {
            package_id: packageId,
            input: input.trim(),
            model,
            session_id: currentSessionId,
          })
        ]

        if (packageIdB) {
          promises.push(
            runPlayground(token, {
              package_id: packageIdB,
              input: input.trim(),
              model,
              session_id: currentSessionIdB,
            })
          )
        } else {
          // Baseline: run without package using use_no_prompt flag
          promises.push(
            runPlayground(token, {
              package_id: packageId, // Use same package ID for tracking, but with use_no_prompt
              input: input.trim(),
              model,
              session_id: currentSessionIdB,
              use_no_prompt: true, // This tells backend to skip the system prompt
            })
          )
        }

        const [resultA, resultB] = await Promise.all(promises)

        console.log('[Playground] Comparison run complete. Credits spent:', resultA.credits_spent + resultB.credits_spent, 'Remaining:', resultA.credits_remaining)
        setConversation(resultA.conversation)
        setCurrentSessionId(resultA.session_id)
        setConversationB(resultB.conversation)
        setCurrentSessionIdB(resultB.session_id)
        setInput('')
        setEstimatedCredits(null)
        setEstimatedCreditsB(null)
        console.log('[Playground] Triggering credits refresh...')
        onCreditsChange()
        onSessionCreated()
      } catch (err: any) {
        console.error('Failed to run comparison:', err)
        setError(err.message || 'Failed to run comparison')
        if (err.message.includes('Insufficient credits') || err.message.includes('402')) {
          setError('Insufficient credits. Please buy more credits to continue.')
        }
      } finally {
        setLoading(false)
        setLoadingB(false)
      }
    } else {
      // Single package or custom prompt mode
      setLoading(true)
      setError(null)

      try {
        let result

        if (useCustomPrompt) {
          // Custom prompt mode
          result = await runCustomPrompt(token, {
            custom_prompt: customPrompt,
            input: input.trim(),
            session_id: currentSessionId,
            model,
          })
        } else {
          // Regular package mode
          result = await runPlayground(token, {
            package_id: packageId,
            input: input.trim(),
            model,
            session_id: currentSessionId,
          })
        }

        console.log('[Playground] Run complete. Credits spent:', result.credits_spent, 'Remaining:', result.credits_remaining)
        setConversation(result.conversation)
        setCurrentSessionId(result.session_id)
        setInput('')
        setEstimatedCredits(null)
        console.log('[Playground] Triggering credits refresh...')
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
  }

  // Estimate credits when input changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (packageId && input.trim().length > 10) {
        handleEstimate()
      }
    }, 500)

    return () => clearTimeout(debounce)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId, input, model])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
      {/* Comparison Mode Toggle */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {comparisonMode ? 'Compare Prompts' : 'Test Prompt'}
        </h3>
        <button
          onClick={() => {
            setComparisonMode(!comparisonMode)
            if (!comparisonMode) {
              // Clear comparison state when entering comparison mode
              setConversationB([])
              setErrorB(null)
            }
          }}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
            comparisonMode
              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {comparisonMode ? '✓ Comparison Mode' : 'Compare Mode'}
        </button>
      </div>

      {/* Comparison Mode Notice */}
      {comparisonMode && (
        <div className="mb-4 sm:mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-900 dark:text-yellow-200">
            <strong>ℹ️ Comparison Mode:</strong> Running two prompts side-by-side uses 2× credits (one for each response).
          </p>
        </div>
      )}

      {/* Anonymous User Notice */}
      {isAnonymousUser && !showAnonymousLoginPrompt && (conversation?.length ?? 0) === 0 && (
        <div className="mb-4 sm:mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>Try it free!</strong> Get one free playground run (using gpt-4o-mini). Sign up to get 5 free credits and access to all models.
          </p>
        </div>
      )}

      {/* Package Selection - Split or Single */}
      <div className={comparisonMode ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 sm:mb-6' : 'mb-4 sm:mb-6'}>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {comparisonMode ? 'Package A' : 'Select Package'}
            {useCustomPrompt && <span className="ml-2 text-xs text-gray-500">(disabled in custom prompt mode)</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              value={selectedPackage ? selectedPackage.name : packageSearch}
              onChange={(e) => {
                setPackageSearch(e.target.value)
                if (selectedPackage) {
                  setSelectedPackage(null)
                  setPackageId('')
                }
              }}
              onFocus={() => setShowPackageDropdown(true)}
              placeholder="Search for a package..."
              disabled={useCustomPrompt}
              className={`w-full px-3 sm:px-4 py-2 pr-10 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-prpm-green focus:border-transparent ${useCustomPrompt ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {(selectedPackage || packageSearch) && (
              <button
                onClick={() => {
                  setSelectedPackage(null)
                  setPackageId('')
                  setPackageSearch('')
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Clear package selection"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {showPackageDropdown && packages.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => {
                      setSelectedPackage(pkg)
                      setPackageId(pkg.id)
                      setPackageSearch('')
                      setShowPackageDropdown(false)
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {pkg.name}
                    </div>
                    {pkg.description && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {pkg.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* CLI Install Command */}
          {selectedPackage && (
            <div className="mt-2 p-3 bg-prpm-dark-card border border-prpm-border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase tracking-wider">Install via CLI</span>
                <button
                  onClick={async () => {
                    const command = `prpm install ${selectedPackage.name}`
                    try {
                      await navigator.clipboard.writeText(command)
                      // You could add a toast notification here
                    } catch (err) {
                      console.error('Failed to copy:', err)
                    }
                  }}
                  className="text-xs text-gray-500 hover:text-prpm-accent transition-colors"
                >
                  Copy
                </button>
              </div>
              <code className="text-sm font-mono text-prpm-accent-light block overflow-x-auto">
                <span className="text-gray-600">$ </span>
                prpm install {selectedPackage.name}
              </code>
            </div>
          )}
        </div>

        {comparisonMode && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Package B <span className="text-xs font-normal text-gray-500">(leave empty for baseline)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedPackageB ? selectedPackageB.name : packageSearchB}
                onChange={(e) => {
                  setPackageSearchB(e.target.value)
                  if (selectedPackageB) {
                    setSelectedPackageB(null)
                    setPackageIdB('')
                  }
                }}
                onFocus={() => setShowPackageDropdownB(true)}
                placeholder="Search for a package or leave empty for baseline..."
                className="w-full px-3 sm:px-4 py-2 pr-10 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-prpm-green focus:border-transparent"
              />
              {(selectedPackageB || packageSearchB) && (
                <button
                  onClick={() => {
                    setSelectedPackageB(null)
                    setPackageIdB('')
                    setPackageSearchB('')
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Clear package B selection"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {showPackageDropdownB && packagesB.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {packagesB.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => {
                        setSelectedPackageB(pkg)
                        setPackageIdB(pkg.id)
                        setPackageSearchB('')
                        setShowPackageDropdownB(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {pkg.name}
                      </div>
                      {pkg.description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {pkg.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* CLI Install Command for Package B */}
            {selectedPackageB && (
              <div className="mt-2 p-3 bg-prpm-dark-card border border-prpm-border rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase tracking-wider">Install via CLI</span>
                  <button
                    onClick={async () => {
                      const command = `prpm install ${selectedPackageB.name}`
                      try {
                        await navigator.clipboard.writeText(command)
                      } catch (err) {
                        console.error('Failed to copy:', err)
                      }
                    }}
                    className="text-xs text-gray-500 hover:text-prpm-accent transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <code className="text-sm font-mono text-prpm-accent-light block overflow-x-auto">
                  <span className="text-gray-600">$ </span>
                  prpm install {selectedPackageB.name}
                </code>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Model Selection */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Model {isAnonymousUser && <span className="text-xs font-normal text-gray-500">(only gpt-4o-mini available for free trial)</span>}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            onClick={() => !isAnonymousUser && setModel('sonnet')}
            disabled={isAnonymousUser}
            className={`px-2 sm:px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition relative ${
              model === 'sonnet'
                ? 'bg-prpm-green text-white'
                : isAnonymousUser
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title={isAnonymousUser ? 'Sign up to access this model' : ''}
          >
            Claude Sonnet
            <div className="text-xs opacity-75">2 credits</div>
            {isAnonymousUser && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
          <button
            onClick={() => !isAnonymousUser && setModel('opus')}
            disabled={isAnonymousUser}
            className={`px-2 sm:px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition relative ${
              model === 'opus'
                ? 'bg-prpm-green text-white'
                : isAnonymousUser
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title={isAnonymousUser ? 'Sign up to access this model' : ''}
          >
            Claude Opus
            <div className="text-xs opacity-75">~7 credits</div>
            {isAnonymousUser && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
          <button
            onClick={() => setModel('gpt-4o-mini')}
            className={`px-2 sm:px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition ${
              model === 'gpt-4o-mini'
                ? 'bg-prpm-green text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            GPT-4o Mini
            <div className="text-xs opacity-75">1 credit</div>
          </button>
          <button
            onClick={() => !isAnonymousUser && setModel('gpt-4o')}
            disabled={isAnonymousUser}
            className={`px-2 sm:px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition relative ${
              model === 'gpt-4o'
                ? 'bg-prpm-green text-white'
                : isAnonymousUser
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title={isAnonymousUser ? 'Sign up to access this model' : ''}
          >
            GPT-4o
            <div className="text-xs opacity-75">~3 credits</div>
            {isAnonymousUser && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
          <button
            onClick={() => !isAnonymousUser && setModel('gpt-4-turbo')}
            disabled={isAnonymousUser}
            className={`px-2 sm:px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition relative ${
              model === 'gpt-4-turbo'
                ? 'bg-prpm-green text-white'
                : isAnonymousUser
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title={isAnonymousUser ? 'Sign up to access this model' : ''}
          >
            GPT-4 Turbo
            <div className="text-xs opacity-75">~4 credits</div>
            {isAnonymousUser && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Custom Prompt Input - Only show when not in comparison mode */}
      {!comparisonMode && (
        <CustomPromptInput
          onPromptChange={setCustomPrompt}
          onUseCustom={setUseCustomPrompt}
          isVerifiedAuthor={isVerifiedAuthor}
          isAnonymousUser={isAnonymousUser}
        />
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
          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-prpm-green focus:border-transparent resize-none"
          disabled={loading}
        />
      </div>

      {/* Estimated Credits */}
      {estimatedCredits !== null && estimatedCredits > 0 && (
        <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-prpm-green/10 to-prpm-green/5 dark:from-prpm-green/20 dark:to-prpm-green/10 border border-prpm-green/30 dark:border-prpm-green/40 rounded-lg">
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <svg className="w-5 h-5 text-prpm-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">
              Estimated cost:
            </span>
            <span className="font-bold text-lg text-prpm-green-dark dark:text-prpm-green-light">
              {estimatedCredits}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {estimatedCredits === 1 ? 'credit' : 'credits'}
            </span>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {(error || errorB) && (
        <div className={`mb-4 ${comparisonMode && error && errorB ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : ''}`}>
          {error && (
            <div className="p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-xs sm:text-sm text-red-800 dark:text-red-300">
                {comparisonMode && <span className="font-semibold">Package A: </span>}
                {error}
              </div>
            </div>
          )}
          {comparisonMode && errorB && (
            <div className="p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-xs sm:text-sm text-red-800 dark:text-red-300">
                <span className="font-semibold">Package B: </span>
                {errorB}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Run Button */}
      <button
        onClick={handleRun}
        disabled={
          loading || loadingB || !input.trim() ||
          (useCustomPrompt ? !customPrompt.trim() : !packageId)
        }
        className={`w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold text-sm sm:text-base text-white transition ${
          loading || !input.trim() || (useCustomPrompt ? !customPrompt.trim() : !packageId)
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-prpm-green hover:bg-prpm-green-dark shadow-sm'
        }`}
      >
        {loading || loadingB ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {comparisonMode ? 'Running Comparison...' : 'Running...'}
          </span>
        ) : (
          comparisonMode ? 'Compare Prompts' : 'Run Playground'
        )}
      </button>

      {/* Conversation History */}
      {((conversation?.length ?? 0) > 0 || (conversationB?.length ?? 0) > 0) && (
        <div className={`mb-4 sm:mb-6 ${comparisonMode ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : ''}`}>
          {/* Package A Conversation */}
          {(conversation?.length ?? 0) > 0 && (
            <div>
              {comparisonMode && (
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {selectedPackage ? selectedPackage.name : 'Package A'}
                </h4>
              )}
              <div className="max-h-64 sm:max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                {groupIntoExchanges(conversation || []).map((exchange, exchangeIdx) => {
                  const isCollapsed = collapsedExchanges.has(exchange.index)
                  const isLatest = exchangeIdx >= groupIntoExchanges(conversation || []).length - 2

                  return (
                    <div key={exchange.index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      {/* Exchange Header */}
                      <div
                        onClick={() => toggleExchange(exchange.index, false)}
                        className={`flex items-center justify-between p-3 sm:p-4 cursor-pointer transition-all ${
                          isCollapsed
                            ? 'bg-prpm-green/10 dark:bg-prpm-green/20 hover:bg-prpm-green/15 dark:hover:bg-prpm-green/25 border-l-4 border-prpm-green'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            isCollapsed
                              ? 'bg-prpm-green text-white'
                              : 'bg-prpm-green/20 dark:bg-prpm-green/30 text-prpm-green-dark dark:text-prpm-green-light'
                          }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-prpm-green-dark dark:text-prpm-green-light uppercase mb-1">
                              Exchange #{exchange.index + 1}
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 truncate font-medium">
                              {exchange.user.content}
                            </div>
                          </div>
                        </div>
                        <button className="ml-3 text-gray-500 hover:text-prpm-green dark:hover:text-prpm-green-light flex-shrink-0 transition-colors">
                          <svg
                            className={`w-5 h-5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Exchange Content */}
                      {!isCollapsed && (
                        <div>
                          {/* User Message */}
                          <div className="p-3 sm:p-4 bg-prpm-green/10 dark:bg-prpm-green/20">
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase">
                              User
                            </div>
                            <div className="text-sm sm:text-base text-gray-900 dark:text-white prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{exchange.user.content}</ReactMarkdown>
                            </div>
                          </div>

                          {/* Assistant Response */}
                          {exchange.assistant && (
                            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50">
                              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase">
                                Assistant
                              </div>
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{exchange.assistant.content}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Package B Conversation */}
          {comparisonMode && (conversationB?.length ?? 0) > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {selectedPackageB ? selectedPackageB.name : packageIdB ? 'Package B' : 'Baseline (No Package)'}
              </h4>
              <div className="max-h-64 sm:max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                {groupIntoExchanges(conversationB || []).map((exchange, exchangeIdx) => {
                  const isCollapsed = collapsedExchangesB.has(exchange.index)
                  const isLatest = exchangeIdx >= groupIntoExchanges(conversationB || []).length - 2

                  return (
                    <div key={exchange.index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      {/* Exchange Header */}
                      <div
                        onClick={() => toggleExchange(exchange.index, true)}
                        className={`flex items-center justify-between p-3 sm:p-4 cursor-pointer transition-all ${
                          isCollapsed
                            ? 'bg-amber-500/10 dark:bg-amber-500/20 hover:bg-amber-500/15 dark:hover:bg-amber-500/25 border-l-4 border-amber-500'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            isCollapsed
                              ? 'bg-amber-500 text-white'
                              : 'bg-amber-500/20 dark:bg-amber-500/30 text-amber-600 dark:text-amber-400'
                          }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase mb-1">
                              Exchange #{exchange.index + 1}
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 truncate font-medium">
                              {exchange.user.content}
                            </div>
                          </div>
                        </div>
                        <button className="ml-3 text-gray-500 hover:text-amber-500 dark:hover:text-amber-400 flex-shrink-0 transition-colors">
                          <svg
                            className={`w-5 h-5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Exchange Content */}
                      {!isCollapsed && (
                        <div>
                          {/* User Message */}
                          <div className="p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20">
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase">
                              User
                            </div>
                            <div className="text-sm sm:text-base text-gray-900 dark:text-white prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{exchange.user.content}</ReactMarkdown>
                            </div>
                          </div>

                          {/* Assistant Response */}
                          {exchange.assistant && (
                            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50">
                              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase">
                                Assistant
                              </div>
                              <div className="text-sm sm:text-base text-gray-900 dark:text-white prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{exchange.assistant.content}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Anonymous User Login Prompt */}
      {showAnonymousLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              🎉 Great! Now sign up for 5 free credits
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              You've used your free playground run! Sign up now to get <strong>5 free credits</strong> and continue testing packages.
            </p>
            <div className="flex gap-3">
              <a
                href="/login"
                className="flex-1 bg-prpm-green text-white px-4 py-2 rounded-lg font-medium hover:bg-prpm-green/90 transition text-center"
              >
                Sign Up / Login
              </a>
              <button
                onClick={() => setShowAnonymousLoginPrompt(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
