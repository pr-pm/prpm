'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  getOrganization,
  getCurrentUser,
  OrganizationDetails,
  OrganizationPackage,
  OrganizationMember,
} from '@/lib/api'
import PackageModal from '@/components/PackageModal'
import EditOrganizationModal from '@/components/EditOrganizationModal'
import UpgradePrompt from '@/components/UpgradePrompt'
import UpgradeModal from '@/components/UpgradeModal'

function OrganizationPageContent() {
  const searchParams = useSearchParams()
  const orgName = searchParams.get('name') || ''
  const subscriptionStatus = searchParams.get('subscription')
  const [orgData, setOrgData] = useState<OrganizationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<OrganizationPackage | null>(null)
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [jwtToken, setJwtToken] = useState<string | undefined>(undefined)
  const [canEdit, setCanEdit] = useState(false)
  const [pollingSubscription, setPollingSubscription] = useState(false)
  const [subscriptionPollError, setSubscriptionPollError] = useState<string | null>(null)
  const [showVerifiedSuccess, setShowVerifiedSuccess] = useState(false)

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!orgName) {
        setError('Organization name is required')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Get JWT token first
        const token = localStorage.getItem('prpm_token')
        if (token) {
          setJwtToken(token)
        }

        // Fetch organization data with authentication if available
        const data = await getOrganization(orgName, token || undefined)
        setOrgData(data)

        // Check if user has permission to edit
        if (token) {
          try {
            const currentUser = await getCurrentUser(token)
            // Check if user is owner or admin of the organization
            const userMembership = data.members.find(
              (m) => m.user_id === currentUser.id
            )
            if (userMembership && (userMembership.role === 'owner' || userMembership.role === 'admin')) {
              setCanEdit(true)
            }
          } catch (err) {
            // User not authenticated or token invalid
            console.error('Failed to check user permissions:', err)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load organization')
      } finally {
        setLoading(false)
      }
    }

    fetchOrganization()
  }, [orgName])

  // Poll for subscription updates after successful checkout
  useEffect(() => {
    if (subscriptionStatus !== 'success' || !orgName || !jwtToken || !orgData) {
      return
    }

    // If organization is already verified, show success modal immediately
    // (webhook already processed while user was on Stripe checkout page)
    if (orgData.organization.is_verified) {
      setShowVerifiedSuccess(true)

      // Remove subscription query param
      const url = new URL(window.location.href)
      url.searchParams.delete('subscription')
      window.history.replaceState({}, '', url.toString())

      // Hide success modal after 15 seconds
      setTimeout(() => {
        setShowVerifiedSuccess(false)
      }, 15000)

      return
    }

    // Organization not verified yet - start polling
    let pollCount = 0
    const maxPolls = 12 // Poll for up to 60 seconds (12 * 5s)
    const pollInterval = 5000 // 5 seconds

    setPollingSubscription(true)
    setSubscriptionPollError(null)

    const pollSubscription = async () => {
      try {
        const data = await getOrganization(orgName, jwtToken)

        // Check if organization is now verified
        if (data.organization.is_verified) {
          setPollingSubscription(false)
          setOrgData(data)
          setShowVerifiedSuccess(true)

          // Remove subscription query param from URL
          const url = new URL(window.location.href)
          url.searchParams.delete('subscription')
          window.history.replaceState({}, '', url.toString())

          // Hide success message after 10 seconds
          setTimeout(() => {
            setShowVerifiedSuccess(false)
          }, 10000)

          return true // Stop polling
        }

        pollCount++
        if (pollCount >= maxPolls) {
          // Timeout - subscription update didn't arrive
          setPollingSubscription(false)
          setSubscriptionPollError(
            'Subscription is processing. Please refresh the page in a few moments to see your verified status.'
          )
          return true // Stop polling
        }

        return false // Continue polling
      } catch (err) {
        console.error('Error polling subscription:', err)
        pollCount++
        if (pollCount >= maxPolls) {
          setPollingSubscription(false)
          setSubscriptionPollError(
            'Unable to verify subscription status. Please refresh the page or contact support.'
          )
          return true // Stop polling
        }
        return false // Continue polling even on error
      }
    }

    // Start polling
    const intervalId = setInterval(async () => {
      const shouldStop = await pollSubscription()
      if (shouldStop) {
        clearInterval(intervalId)
      }
    }, pollInterval)

    // Initial poll immediately
    pollSubscription().then((shouldStop) => {
      if (shouldStop) {
        clearInterval(intervalId)
      }
    })

    // Cleanup
    return () => {
      clearInterval(intervalId)
    }
  }, [subscriptionStatus, orgName, jwtToken, orgData])

  async function handleEditSuccess() {
    // Reload organization data after successful edit
    if (!orgName) return
    try {
      const token = localStorage.getItem('prpm_token')
      const data = await getOrganization(orgName, token || undefined)
      setOrgData(data)
    } catch (err) {
      console.error('Failed to reload organization:', err)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-prpm-dark flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-prpm-accent mb-4"></div>
          <p className="text-gray-400">Loading organization...</p>
        </div>
      </main>
    )
  }

  if (error || !orgData) {
    return (
      <main className="min-h-screen bg-prpm-dark flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 text-center">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-3xl font-bold text-white mb-4">Organization Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'Organization not found'}</p>
          <Link
            href="/search"
            className="inline-block px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all"
          >
            Browse Packages
          </Link>
        </div>
      </main>
    )
  }

  const { organization, packages, members, package_count, member_count } = orgData

  return (
    <main className="min-h-screen bg-prpm-dark">
      {/* Verification Success Modal */}
      {showVerifiedSuccess && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-prpm-dark-card border-2 border-green-500/50 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            {/* Success Icon */}
            <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Success Message */}
            <h2 className="text-3xl font-bold text-white text-center mb-3">
              Payment Successful! 🎉
            </h2>
            <p className="text-green-400 font-semibold text-center text-xl mb-6">
              Your organization is now verified
            </p>

            {/* Benefits List */}
            <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4 mb-6">
              <p className="text-gray-300 text-sm mb-3 font-medium">You now have access to:</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-green-400">✓</span>
                  Verified badge on your profile
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-green-400">✓</span>
                  <span className="flex-1">Custom avatar URL <span className="text-prpm-accent text-xs font-semibold">PREMIUM</span></span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-green-400">✓</span>
                  Publish unlimited private packages
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-green-400">✓</span>
                  Discounted PRPM+ for team members
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-green-400">✓</span>
                  Priority support and advanced features
                </li>
              </ul>
            </div>

            {/* Next Steps */}
            <div className="bg-prpm-accent/10 border border-prpm-accent/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="text-white font-semibold text-sm mb-1">Customize Your Profile</p>
                  <p className="text-gray-300 text-xs">Update your organization avatar to showcase your brand. This is a premium feature available to verified organizations.</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {canEdit && (
                <button
                  onClick={() => {
                    setShowVerifiedSuccess(false)
                    setShowEditModal(true)
                  }}
                  className="flex-1 px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
              )}
              <button
                onClick={() => setShowVerifiedSuccess(false)}
                className={`${canEdit ? 'flex-1' : 'w-full'} px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all`}
              >
                {canEdit ? 'Continue' : 'Get Started'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Polling Status */}
      {pollingSubscription && (
        <div className="bg-blue-500/10 border-b border-blue-500/30">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
              <div>
                <p className="text-blue-400 font-semibold">Processing your subscription...</p>
                <p className="text-blue-300 text-sm">Waiting for verification to complete. This usually takes a few seconds.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Poll Error */}
      {subscriptionPollError && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="text-yellow-400 text-2xl">⚠️</div>
              <div>
                <p className="text-yellow-400 font-semibold">Subscription Processing</p>
                <p className="text-yellow-300 text-sm">{subscriptionPollError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-prpm-dark-card border-b border-prpm-border">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-4">
            <Link href="/search" className="text-prpm-accent hover:text-prpm-accent-light inline-block">
              ← Back to Search
            </Link>
            {canEdit && (
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-prpm-dark border border-prpm-border text-gray-400 hover:text-white hover:border-prpm-accent rounded-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Organization
              </button>
            )}
          </div>
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-prpm-accent/20 border-2 border-prpm-accent flex items-center justify-center overflow-hidden">
              {organization.avatar_url ? (
                <img
                  src={organization.avatar_url}
                  alt={`${organization.name}'s avatar`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-white">
                  {organization.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Organization Info */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-white">{organization.name}</h1>
                {organization.is_verified && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-prpm-accent/20 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-semibold">
                    ✓ Verified
                  </span>
                )}
              </div>

              {organization.description && (
                <p className="text-gray-300 mb-4 text-lg">{organization.description}</p>
              )}

              <div className="space-y-2">
                {organization.website_url && (
                  <a
                    href={organization.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-prpm-accent transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    {organization.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Packages</div>
              <div className="text-2xl font-bold text-white">{package_count}</div>
            </div>
            <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Members</div>
              <div className="text-2xl font-bold text-white">{member_count}</div>
            </div>
            <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Total Downloads</div>
              <div className="text-2xl font-bold text-white">
                {packages.reduce((sum, pkg) => sum + pkg.total_downloads, 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Banner for Non-Verified Organizations */}
      {!organization.is_verified && canEdit && (
        <div className="bg-prpm-dark border-b border-prpm-border">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <UpgradePrompt
              organizationName={organization.name}
              jwtToken={jwtToken}
              variant="banner"
            />
          </div>
        </div>
      )}

      {/* Packages and Members */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Packages Section */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-6">Packages ({package_count})</h2>

            {packages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-400">No packages published yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => {
                      setSelectedPackage(pkg)
                      setShowPackageModal(true)
                    }}
                    className="w-full text-left bg-prpm-dark-card border border-prpm-border rounded-lg p-6 hover:border-prpm-accent transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white group-hover:text-prpm-accent transition-colors">
                        {pkg.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-prpm-dark border border-prpm-border rounded text-gray-400 text-xs">
                          {pkg.format}
                        </span>
                        {pkg.visibility === 'private' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-500/20 border border-gray-500/30 text-gray-400">
                            🔒 Private
                          </span>
                        )}
                        {pkg.is_verified && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-prpm-accent/20 border border-prpm-accent/30 text-prpm-accent">
                            ✓
                          </span>
                        )}
                        {pkg.is_featured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 border border-yellow-500/30 text-yellow-400">
                            ★
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {pkg.description || 'No description'}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <span>⬇️</span>
                        <span>{pkg.total_downloads.toLocaleString()}</span>
                      </div>
                      <span className="px-2 py-1 bg-prpm-dark border border-prpm-border rounded text-xs text-gray-400">
                        {pkg.subtype}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Members Section */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-white mb-6">Members ({member_count})</h2>

            {members.length === 0 ? (
              <p className="text-gray-400">No members</p>
            ) : (
              <div className="space-y-3">
                {members.map((member, index) => {
                  const isPrivate = member.is_public === false
                  return (
                    <div key={member.user_id || `private-${index}`} className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-prpm-accent/20 border border-prpm-accent flex items-center justify-center overflow-hidden">
                          {isPrivate ? (
                            <span className="text-2xl">👻</span>
                          ) : member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-sm font-bold">
                              {member.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">
                              {isPrivate ? (
                                <span className="text-gray-400 italic">Private Member</span>
                              ) : (
                                member.username
                              )}
                            </p>
                          </div>
                          <div className="mt-1">
                            {member.role === 'owner' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 border border-purple-500/30 text-purple-400">
                                Owner
                              </span>
                            )}
                            {member.role === 'admin' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 border border-blue-500/30 text-blue-400">
                                Admin
                              </span>
                            )}
                            {member.role === 'maintainer' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 border border-green-500/30 text-green-400">
                                Maintainer
                              </span>
                            )}
                            {member.role === 'member' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-500/20 border border-gray-500/30 text-gray-400">
                                Member
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Package Modal */}
      {selectedPackage && (
        <PackageModal
          package={selectedPackage}
          isOpen={showPackageModal}
          onClose={() => setShowPackageModal(false)}
        />
      )}

      {/* Edit Organization Modal */}
      <EditOrganizationModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        organization={organization}
        jwtToken={jwtToken}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        organizationName={organization.name}
        jwtToken={jwtToken}
      />
    </main>
  )
}

export default function OrganizationPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    }>
      <OrganizationPageContent />
    </Suspense>
  )
}
