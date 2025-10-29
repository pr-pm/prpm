'use client'

import { useState } from 'react'
import VerifiedPlanBenefits from './VerifiedPlanBenefits'

interface UpgradePromptProps {
  organizationName: string
  jwtToken?: string
  onUpgrade?: () => void
  variant?: 'banner' | 'card' | 'inline'
}

export default function UpgradePrompt({
  organizationName,
  jwtToken,
  onUpgrade,
  variant = 'card',
}: UpgradePromptProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registryUrl = process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3000'

  async function handleUpgrade() {
    if (!jwtToken) {
      setError('You must be logged in to upgrade')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const successUrl = `${window.location.origin}/orgs?name=${organizationName}&subscription=success`
      const cancelUrl = `${window.location.origin}/orgs?name=${organizationName}&subscription=canceled`

      const response = await fetch(`${registryUrl}/api/v1/subscriptions/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          orgName: organizationName,
          successUrl,
          cancelUrl,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const data = await response.json()

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }

      if (onUpgrade) {
        onUpgrade()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start upgrade')
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-prpm-accent/10 via-purple-500/10 to-prpm-accent/10 border-2 border-prpm-accent/30 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">✨</span>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                Become a Verified Organization
              </h3>
              <p className="text-gray-300">
                Unlock premium features for just <span className="text-white font-bold">$20/month</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 border border-prpm-accent/50 text-white hover:bg-prpm-accent/10 rounded-lg font-semibold transition-all"
            >
              View Benefits
            </button>
            <button
              onClick={handleUpgrade}
              disabled={loading || !jwtToken}
              className="px-6 py-2 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <span>Upgrade Now</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-6 pt-6 border-t border-prpm-accent/20">
            <VerifiedPlanBenefits compact />
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className="bg-prpm-dark border-l-4 border-prpm-accent rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✨</span>
          <div className="flex-1">
            <h4 className="text-white font-semibold mb-1">Upgrade to Verified</h4>
            <p className="text-gray-400 text-sm mb-3">
              You could be verified for <span className="text-white font-bold">$20/month</span>.
              Get custom branding, private packages, advanced analytics, and more.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-prpm-accent hover:text-prpm-accent-light text-sm font-medium transition-colors"
              >
                {showDetails ? 'Hide' : 'View'} benefits →
              </button>
              {jwtToken && (
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="text-white hover:text-prpm-accent text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Upgrade now'}
                </button>
              )}
            </div>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-prpm-border">
            <VerifiedPlanBenefits compact />
          </div>
        )}

        {error && (
          <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}
      </div>
    )
  }

  // Default: card variant
  return (
    <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-prpm-accent/20 rounded-full mb-4">
          <span className="text-3xl">✨</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          Not Verified Yet
        </h3>
        <p className="text-gray-400">
          You could be verified for <span className="text-white font-bold">$20/month</span>
        </p>
      </div>

      {!showDetails ? (
        <div className="space-y-4">
          <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">Quick Preview:</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-300 text-sm">
                <span className="text-prpm-accent">✓</span> Custom avatar & verified badge
              </li>
              <li className="flex items-center gap-2 text-gray-300 text-sm">
                <span className="text-prpm-accent">✓</span> 10 private packages
              </li>
              <li className="flex items-center gap-2 text-gray-300 text-sm">
                <span className="text-prpm-accent">✓</span> Advanced analytics
              </li>
              <li className="flex items-center gap-2 text-gray-300 text-sm">
                <span className="text-prpm-accent">✓</span> Priority support
              </li>
              <li className="flex items-center gap-2 text-gray-300 text-sm">
                <span className="text-prpm-accent">✓</span> +12 more features
              </li>
            </ul>
          </div>

          <button
            onClick={() => setShowDetails(true)}
            className="w-full px-4 py-2 border border-prpm-accent/50 text-prpm-accent hover:bg-prpm-accent/10 rounded-lg font-semibold transition-all"
          >
            View All Benefits
          </button>

          {jwtToken ? (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  Upgrade to Verified
                  <span>→</span>
                </>
              )}
            </button>
          ) : (
            <div className="text-center text-gray-400 text-sm">
              Log in to upgrade your organization
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <VerifiedPlanBenefits showPricing={false} />

          <div className="flex gap-3">
            <button
              onClick={() => setShowDetails(false)}
              className="flex-1 px-4 py-2 border border-prpm-border text-gray-400 hover:text-white hover:border-prpm-accent rounded-lg font-semibold transition-all"
            >
              ← Back
            </button>
            {jwtToken && (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Upgrade Now
                    <span>→</span>
                  </>
                )}
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
