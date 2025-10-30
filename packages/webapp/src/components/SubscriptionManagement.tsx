'use client'

import { useState, useEffect } from 'react'
import type { Organization } from '@pr-pm/types'
import VerifiedPlanBenefits from './VerifiedPlanBenefits'

interface SubscriptionStatus {
  isActive: boolean
  status: string | null
  plan: string
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: Date | null
}

interface SubscriptionManagementProps {
  organization: Organization
  jwtToken: string
}

export default function SubscriptionManagement({
  organization,
  jwtToken,
}: SubscriptionManagementProps) {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showAllBenefits, setShowAllBenefits] = useState(false)

  const registryUrl = process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3000'

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [organization.name])

  async function fetchSubscriptionStatus() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `${registryUrl}/api/v1/subscriptions/${organization.name}/status`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch subscription status')
      }

      const data = await response.json()
      setStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpgrade() {
    try {
      setActionLoading(true)
      setError(null)

      const successUrl = `${window.location.origin}/organizations/${encodeURIComponent(organization.name)}?subscription=success`
      const cancelUrl = `${window.location.origin}/organizations/${encodeURIComponent(organization.name)}?subscription=canceled`

      const response = await fetch(`${registryUrl}/api/v1/subscriptions/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          orgName: organization.name,
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
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleManageSubscription() {
    try {
      setActionLoading(true)
      setError(null)

      const returnUrl = `${window.location.origin}/organizations/${encodeURIComponent(organization.name)}`

      const response = await fetch(`${registryUrl}/api/v1/subscriptions/portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          orgName: organization.name,
          returnUrl,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create portal session')
      }

      const data = await response.json()

      if (data.portalUrl) {
        window.location.href = data.portalUrl
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open portal')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-prpm-accent"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!status) {
    return null
  }

  return (
    <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">Subscription</h3>

      {status.isActive ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-white font-semibold">Verified Plan</span>
            {status.cancelAtPeriodEnd && (
              <span className="text-yellow-500 text-sm">(Cancels at period end)</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-t border-prpm-border">
            <div>
              <p className="text-gray-400 text-sm">Status</p>
              <p className="text-white font-medium capitalize">{status.status}</p>
            </div>
            {status.currentPeriodEnd && (
              <div>
                <p className="text-gray-400 text-sm">
                  {status.cancelAtPeriodEnd ? 'Ends on' : 'Renews on'}
                </p>
                <p className="text-white font-medium">
                  {new Date(status.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Your Benefits:</p>
              <button
                onClick={() => setShowAllBenefits(!showAllBenefits)}
                className="text-prpm-accent hover:text-prpm-accent-light text-xs font-medium transition-colors"
              >
                {showAllBenefits ? 'Hide' : 'View All'} →
              </button>
            </div>
            {!showAllBenefits ? (
              <ul className="space-y-1">
                <li className="text-sm text-white flex items-center gap-2">
                  <span className="text-green-500">✓</span> Custom avatar URL
                </li>
                <li className="text-sm text-white flex items-center gap-2">
                  <span className="text-green-500">✓</span> Verified badge
                </li>
                <li className="text-sm text-white flex items-center gap-2">
                  <span className="text-green-500">✓</span> 10 private packages
                </li>
                <li className="text-sm text-white flex items-center gap-2">
                  <span className="text-green-500">✓</span> Advanced analytics
                </li>
                <li className="text-sm text-gray-500 flex items-center gap-2">
                  <span>+</span> 12 more features
                </li>
              </ul>
            ) : (
              <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4 max-h-96 overflow-y-auto">
                <VerifiedPlanBenefits showPricing={false} />
              </div>
            )}
          </div>

          <button
            onClick={handleManageSubscription}
            disabled={actionLoading}
            className="w-full px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading...
              </>
            ) : (
              'Manage Subscription'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span className="text-gray-400 font-semibold">Free Plan</span>
          </div>

          <div className="py-4 border-t border-prpm-border">
            <p className="text-sm text-gray-400 mb-4">
              You could be verified for <span className="text-white font-bold">$20/month</span>
            </p>

            {!showAllBenefits ? (
              <div className="space-y-3">
                <ul className="space-y-2">
                  <li className="text-sm text-white flex items-center gap-2">
                    <span className="text-gray-500">○</span> Custom avatar URL
                  </li>
                  <li className="text-sm text-white flex items-center gap-2">
                    <span className="text-gray-500">○</span> Verified badge
                  </li>
                  <li className="text-sm text-white flex items-center gap-2">
                    <span className="text-gray-500">○</span> 10 private packages
                  </li>
                  <li className="text-sm text-white flex items-center gap-2">
                    <span className="text-gray-500">○</span> Advanced analytics
                  </li>
                  <li className="text-sm text-white flex items-center gap-2">
                    <span className="text-gray-500">○</span> Priority support
                  </li>
                </ul>
                <button
                  onClick={() => setShowAllBenefits(true)}
                  className="text-prpm-accent hover:text-prpm-accent-light text-sm font-medium transition-colors"
                >
                  View all 16 benefits →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4 max-h-96 overflow-y-auto">
                  <VerifiedPlanBenefits showPricing={false} />
                </div>
                <button
                  onClick={() => setShowAllBenefits(false)}
                  className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
                >
                  ← Hide details
                </button>
              </div>
            )}
          </div>

          <div className="bg-prpm-accent/10 border border-prpm-accent/20 rounded-lg p-4">
            <p className="text-white font-semibold mb-1">$20/month</p>
            <p className="text-gray-400 text-sm">Billed monthly • Cancel anytime</p>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={actionLoading}
            className="w-full px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading...
              </>
            ) : (
              <>
                Upgrade to Verified
                <span>→</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
