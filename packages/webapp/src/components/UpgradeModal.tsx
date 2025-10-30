'use client'

import { useState } from 'react'
import VerifiedPlanBenefits from './VerifiedPlanBenefits'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  organizationName: string
  jwtToken?: string
}

export default function UpgradeModal({
  isOpen,
  onClose,
  organizationName,
  jwtToken,
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registryUrl = process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3000'

  if (!isOpen) return null

  async function handleUpgrade() {
    if (!jwtToken) {
      setError('You must be logged in to upgrade')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const successUrl = `${window.location.origin}/orgs?name=${encodeURIComponent(organizationName)}&subscription=success`
      const cancelUrl = `${window.location.origin}/orgs?name=${encodeURIComponent(organizationName)}&subscription=canceled`

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start upgrade')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (!loading) {
      setError(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-prpm-dark-card border-2 border-prpm-accent/50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-prpm-accent/20 to-purple-500/20 border-b border-prpm-accent/30 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-prpm-accent/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Become Verified</h2>
                <p className="text-gray-300 text-sm">Unlock premium features for your organization</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Pricing Banner */}
          <div className="bg-prpm-dark-card border border-prpm-accent/30 rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-bold text-white">$20</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <p className="text-gray-400 text-sm">Billed monthly • Cancel anytime • No long-term commitment</p>
              </div>
              {jwtToken && (
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="px-8 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-bold text-lg transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-prpm-accent/20"
                >
                  {loading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {!jwtToken && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <p className="text-yellow-300 font-semibold">Login Required</p>
                  <p className="text-yellow-200/80 text-sm">You must be logged in to upgrade your organization</p>
                </div>
              </div>
            </div>
          )}

          {/* Benefits */}
          <VerifiedPlanBenefits showPricing={false} />

          {/* Social Proof */}
          <div className="mt-8 bg-prpm-dark border border-prpm-border rounded-lg p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <span>🌟</span>
              Trusted by Leading Organizations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-prpm-accent mb-1">500+</div>
                <div className="text-gray-400 text-sm">Verified Organizations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-prpm-accent mb-1">10k+</div>
                <div className="text-gray-400 text-sm">Packages Published</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-prpm-accent mb-1">99.9%</div>
                <div className="text-gray-400 text-sm">Uptime SLA</div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-8">
            <h3 className="text-white font-bold mb-4">Frequently Asked Questions</h3>
            <div className="space-y-3">
              <details className="bg-prpm-dark border border-prpm-border rounded-lg p-4 group">
                <summary className="cursor-pointer text-white font-semibold group-open:text-prpm-accent">
                  Can I cancel anytime?
                </summary>
                <p className="text-gray-400 text-sm mt-2">
                  Yes! You can cancel your subscription at any time. You'll continue to have access to verified features until the end of your billing period.
                </p>
              </details>
              <details className="bg-prpm-dark border border-prpm-border rounded-lg p-4 group">
                <summary className="cursor-pointer text-white font-semibold group-open:text-prpm-accent">
                  What payment methods do you accept?
                </summary>
                <p className="text-gray-400 text-sm mt-2">
                  We accept all major credit cards (Visa, Mastercard, Amex) through our secure Stripe payment processor.
                </p>
              </details>
              <details className="bg-prpm-dark border border-prpm-border rounded-lg p-4 group">
                <summary className="cursor-pointer text-white font-semibold group-open:text-prpm-accent">
                  What happens to my packages if I cancel?
                </summary>
                <p className="text-gray-400 text-sm mt-2">
                  Your public packages remain public. Private packages will become inaccessible but won't be deleted. You can re-activate them by upgrading again.
                </p>
              </details>
              <details className="bg-prpm-dark border border-prpm-border rounded-lg p-4 group">
                <summary className="cursor-pointer text-white font-semibold group-open:text-prpm-accent">
                  Is there a discount for annual billing?
                </summary>
                <p className="text-gray-400 text-sm mt-2">
                  Not yet, but we're working on it! Subscribe to our newsletter to be notified when annual plans become available.
                </p>
              </details>
            </div>
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="border-t border-prpm-border p-6 bg-prpm-dark-card">
          <div className="flex gap-4">
            <button
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-prpm-border text-gray-400 hover:text-white hover:border-prpm-accent rounded-lg font-semibold transition-all disabled:opacity-50"
            >
              Maybe Later
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
                    Upgrade to Verified
                    <span>→</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
