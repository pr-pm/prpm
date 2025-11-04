'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { subscribeToPRPMPlus } from '@/lib/api'

interface UserAccount {
  email: string
  username: string
  prpm_plus_status?: string
  prpm_plus_current_period_end?: string
  prpm_plus_cancel_at_period_end?: boolean
}

function AccountPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subscriptionSuccess = searchParams.get('subscription')
  const [account, setAccount] = useState<UserAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    loadAccount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Poll for subscription updates after successful subscription
  useEffect(() => {
    if (subscriptionSuccess === 'success') {
      setSuccessMessage('Activating your PRPM+ subscription...')

      // Poll for subscription updates every 2 seconds for up to 30 seconds
      let pollCount = 0
      const maxPolls = 15
      const pollInterval = setInterval(async () => {
        pollCount++
        await loadAccount()

        // Check if subscription is now active
        if (account?.prpm_plus_status === 'active') {
          clearInterval(pollInterval)
          setSuccessMessage('PRPM+ subscription activated successfully!')
          setTimeout(() => setSuccessMessage(null), 5000)
          // Remove query parameter
          router.replace('/account')
        } else if (pollCount >= maxPolls) {
          clearInterval(pollInterval)
          setSuccessMessage('Subscription is being processed. Please refresh if it doesn\'t appear shortly.')
          setTimeout(() => setSuccessMessage(null), 5000)
          router.replace('/account')
        }
      }, 2000)

      return () => clearInterval(pollInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionSuccess, account?.prpm_plus_status])

  const loadAccount = async () => {
    const token = localStorage.getItem('prpm_token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const registryUrl = process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111'
      const response = await fetch(`${registryUrl}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load account')
      }

      const data = await response.json()
      setAccount(data)
    } catch (err) {
      console.error('Failed to load account:', err)
      setError('Failed to load account information')
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribeClick = async () => {
    const token = localStorage.getItem('prpm_token')
    if (!token) {
      router.push('/login?redirect=/account')
      return
    }

    setSubscribing(true)
    setError(null)

    try {
      const currentUrl = window.location.origin
      const result = await subscribeToPRPMPlus(
        token,
        `${currentUrl}/account?subscription=success`,
        `${currentUrl}/account?subscription=cancelled`
      )

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      }
    } catch (err) {
      console.error('Failed to start subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to start subscription')
      setSubscribing(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your PRPM+ subscription? You will lose access at the end of your billing period.')) {
      return
    }

    const token = localStorage.getItem('prpm_token')
    if (!token) return

    setCancelling(true)
    setError(null)

    try {
      const registryUrl = process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111'
      const response = await fetch(`${registryUrl}/api/v1/playground/subscription/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to cancel subscription')
      }

      // Reload account to show updated status
      await loadAccount()
      alert('Your subscription has been cancelled. You will retain access until the end of your billing period.')
    } catch (err) {
      console.error('Failed to cancel subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-prpm-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-prpm-accent"></div>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-prpm-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load account</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-prpm-accent text-white rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  const isPRPMPlus = account.prpm_plus_status === 'active'
  const isScheduledForCancellation = account.prpm_plus_cancel_at_period_end

  return (
    <div className="min-h-screen bg-prpm-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-gray-400">Manage your account and subscription</p>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-lg text-green-300">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Account Information */}
        <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Account Information</h2>
            {isPRPMPlus && (
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border border-yellow-500/40 rounded-lg">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span className="text-sm font-bold text-yellow-400">PRPM+</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Email</label>
              <p className="text-white">{account.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Username</label>
              <p className="text-white">@{account.username}</p>
            </div>
          </div>
        </div>

        {/* PRPM+ Subscription */}
        <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">PRPM+ Subscription</h2>

          {isPRPMPlus ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-prpm-accent/20 text-prpm-accent rounded-full text-sm font-semibold">
                  Active
                </span>
                {isScheduledForCancellation && (
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold">
                    Cancels at period end
                  </span>
                )}
              </div>

              <div className="mb-6">
                <p className="text-gray-300 mb-2">
                  <strong className="text-white">Plan:</strong> PRPM+ ($6/month)
                </p>
                <p className="text-gray-300 mb-2">
                  <strong className="text-white">Benefits:</strong> 100 monthly playground credits, priority support
                </p>
                {account.prpm_plus_current_period_end && (
                  <p className="text-gray-300">
                    <strong className="text-white">
                      {isScheduledForCancellation ? 'Access until:' : 'Renews:'}
                    </strong>{' '}
                    {new Date(account.prpm_plus_current_period_end).toLocaleDateString()}
                  </p>
                )}
              </div>

              {!isScheduledForCancellation && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              )}

              {isScheduledForCancellation && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    Your subscription is scheduled to cancel at the end of your billing period. You will
                    retain access to PRPM+ benefits until{' '}
                    {account.prpm_plus_current_period_end &&
                      new Date(account.prpm_plus_current_period_end).toLocaleDateString()}
                    .
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-400 mb-4">
                You are currently on the free plan. Upgrade to PRPM+ to get 100 monthly playground credits
                and priority support.
              </p>
              <button
                onClick={handleSubscribeClick}
                disabled={subscribing}
                className="px-6 py-2 bg-prpm-accent hover:bg-prpm-accent/80 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {subscribing ? 'Loading...' : 'Upgrade to PRPM+'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-prpm-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-prpm-accent"></div>
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  )
}
