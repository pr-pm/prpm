'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import CreditsWidget from '../../../components/playground/CreditsWidget'
import PlaygroundInterface from '../../../components/playground/PlaygroundInterface'
import SessionsSidebar from '../../../components/playground/SessionsSidebar'
import BuyCreditsModal from '../../../components/playground/BuyCreditsModal'
import SubscribePRPMPlusModal from '../../../components/SubscribePRPMPlusModal'
import { getPlaygroundCredits, listPlaygroundSessions } from '../../../lib/api'
import type { CreditBalance, PlaygroundSession } from '../../../lib/api'

function PlaygroundContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const packageId = searchParams.get('package')
  const initialInput = searchParams.get('input')
  const buyCredits = searchParams.get('buyCredits')
  const purchaseSuccess = searchParams.get('purchase')
  const subscriptionStatus = searchParams.get('subscription')
  const compareMode = searchParams.get('compare') === 'true'

  const [credits, setCredits] = useState<CreditBalance | null>(null)
  const [sessions, setSessions] = useState<PlaygroundSession[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [showBuyCredits, setShowBuyCredits] = useState(false)
  const [showSubscribe, setShowSubscribe] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null)

  // Check authentication (allow anonymous users)
  useEffect(() => {
    const token = localStorage.getItem('prpm_token')
    if (token) {
      // User is authenticated - load their data
      loadData(token)
    } else {
      // Anonymous user - just mark as loaded, they can use the free run
      setLoading(false)
    }
  }, [router])

  // Auto-open buy credits modal if URL parameter is present
  useEffect(() => {
    if (buyCredits === 'true' && !loading) {
      setShowBuyCredits(true)
    }
  }, [buyCredits, loading])

  // Show success message for purchases or subscriptions
  useEffect(() => {
    if (purchaseSuccess === 'success') {
      setShowSuccessMessage('Processing your purchase... Credits will appear shortly.')

      // Poll for credit updates every 2 seconds for up to 30 seconds
      let pollCount = 0
      const maxPolls = 15
      const pollInterval = setInterval(async () => {
        pollCount++
        await handleRefreshCredits()

        if (pollCount >= maxPolls) {
          clearInterval(pollInterval)
          setShowSuccessMessage('Purchase complete! If credits don\'t appear, please refresh the page.')
          setTimeout(() => setShowSuccessMessage(null), 5000)
        }
      }, 2000)

      return () => clearInterval(pollInterval)
    } else if (subscriptionStatus === 'success') {
      setShowSuccessMessage('Activating your PRPM+ subscription... Credits will appear shortly.')

      // Poll for credit updates every 2 seconds for up to 30 seconds
      let pollCount = 0
      const maxPolls = 15
      const pollInterval = setInterval(async () => {
        pollCount++
        await handleRefreshCredits()

        if (pollCount >= maxPolls) {
          clearInterval(pollInterval)
          setShowSuccessMessage('Subscription activated! If credits don\'t appear, please refresh the page.')
          setTimeout(() => setShowSuccessMessage(null), 5000)
        }
      }, 2000)

      return () => clearInterval(pollInterval)
    }
  }, [purchaseSuccess, subscriptionStatus])

  const loadData = async (token: string) => {
    try {
      setLoading(true)
      setError(null)

      const [creditsData, sessionsData] = await Promise.all([
        getPlaygroundCredits(token),
        listPlaygroundSessions(token, 20, 0)
      ])

      setCredits(creditsData)
      setSessions(sessionsData.sessions)
    } catch (err: any) {
      console.error('Failed to load playground data:', err)
      setError(err.message || 'Failed to load playground data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshCredits = async () => {
    const token = localStorage.getItem('prpm_token')
    if (!token) return

    try {
      const creditsData = await getPlaygroundCredits(token)
      setCredits(creditsData)
    } catch (err) {
      console.error('Failed to refresh credits:', err)
    }
  }

  const handleRefreshSessions = async () => {
    const token = localStorage.getItem('prpm_token')
    if (!token) return

    try {
      const sessionsData = await listPlaygroundSessions(token, 20, 0)
      setSessions(sessionsData.sessions)
    } catch (err) {
      console.error('Failed to refresh sessions:', err)
    }
  }

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSession(sessionId)
  }

  const handleNewSession = () => {
    setSelectedSession(null)
  }

  const handleCreditsUpdated = () => {
    handleRefreshCredits()
    setShowBuyCredits(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading playground...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Playground</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => loadData(localStorage.getItem('prpm_token') || '')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Success Message Banner */}
      {showSuccessMessage && (
        <div className="bg-green-500 text-white px-4 py-3 text-center font-semibold">
          ✅ {showSuccessMessage}
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  PRPM+ Playground
                </h1>
                <a
                  href="https://github.com/pr-pm/prpm/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-xs font-semibold rounded-full hover:bg-yellow-500/20 transition"
                  title="Report issues on GitHub"
                >
                  <span>BETA</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Test any package with real AI models before installing
              </p>
            </div>
            <CreditsWidget
              credits={credits}
              onBuyCredits={() => setShowBuyCredits(true)}
              onSubscribe={() => setShowSubscribe(true)}
              onRefresh={handleRefreshCredits}
            />
          </div>

          {/* Getting Started Info */}
          <div className="bg-gradient-to-r from-prpm-accent/10 to-prpm-green/10 dark:from-prpm-accent/20 dark:to-prpm-green/20 border border-prpm-accent/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-prpm-accent dark:text-prpm-accent-light mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">How to Use the Playground</h3>
                <div className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                  <div className="flex items-start gap-2">
                    <span className="text-prpm-accent font-semibold">1.</span>
                    <span>Search for a package or <a href="/search" className="text-prpm-accent hover:text-prpm-accent-light underline">browse the registry</a></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-prpm-accent font-semibold">2.</span>
                    <span>Enter your test input (e.g., "Review this code" or "Explain async/await")</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-prpm-accent font-semibold">3.</span>
                    <span>Choose an AI model (Claude Sonnet, GPT-4o, etc.)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-prpm-accent font-semibold">4.</span>
                    <span>See how the package performs with real AI responses</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-prpm-accent font-semibold">💡</span>
                    <span>Use <strong>Compare Mode</strong> to see the difference with and without the package</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sessions Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <SessionsSidebar
              sessions={sessions}
              selectedSession={selectedSession}
              onSelectSession={handleSessionSelect}
              onNewSession={handleNewSession}
              onRefresh={handleRefreshSessions}
            />
          </div>

          {/* Playground Interface */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <PlaygroundInterface
              initialPackageId={packageId || undefined}
              initialInput={initialInput || undefined}
              sessionId={selectedSession || undefined}
              initialCompareMode={compareMode}
              onCreditsChange={handleRefreshCredits}
              onSessionCreated={handleRefreshSessions}
            />
          </div>
        </div>
      </div>

      {/* Buy Credits Modal */}
      {showBuyCredits && (
        <BuyCreditsModal
          onClose={() => setShowBuyCredits(false)}
          onSuccess={handleCreditsUpdated}
        />
      )}

      {/* Subscribe to PRPM+ Modal */}
      {showSubscribe && (
        <SubscribePRPMPlusModal
          onClose={() => setShowSubscribe(false)}
        />
      )}
    </div>
  )
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading playground...</p>
        </div>
      </div>
    }>
      <PlaygroundContent />
    </Suspense>
  )
}
