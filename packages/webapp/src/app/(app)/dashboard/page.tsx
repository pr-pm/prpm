'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUnclaimedPackages, claimPackages, getAuthorDashboard, getAuthorPackages, getStarredPackages, getStarredCollections } from '@/lib/api'
import PackageAnalyticsModal from '@/components/PackageAnalyticsModal'
import PlaygroundAnalyticsDashboard from '@/components/PlaygroundAnalyticsDashboard'
import { getRecentPackages, getRecentCollections, type RecentPackage, type RecentCollection } from '@/lib/recentlyViewed'

interface User {
  id: string
  username: string
  email: string
  avatar_url?: string
  website?: string
  verified_author: boolean
  is_admin: boolean
  package_count?: number
  total_downloads?: number
  prpm_plus_status?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [unclaimedCount, setUnclaimedCount] = useState<number>(0)
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [showTweetModal, setShowTweetModal] = useState(false)
  const [isEditingWebsite, setIsEditingWebsite] = useState(false)
  const [websiteInput, setWebsiteInput] = useState('')
  const [websiteError, setWebsiteError] = useState<string | null>(null)
  const [websiteSaving, setWebsiteSaving] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [packages, setPackages] = useState<any[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [starredPackages, setStarredPackages] = useState<any[]>([])
  const [starredCollections, setStarredCollections] = useState<any[]>([])
  const [recentPackages, setRecentPackages] = useState<RecentPackage[]>([])
  const [recentCollections, setRecentCollections] = useState<RecentCollection[]>([])

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('prpm_token')
    const username = localStorage.getItem('prpm_username')

    // If not logged in, just finish loading and show anonymous view
    if (!token || !username) {
      setLoading(false)
      return
    }

    // Fetch user info for logged-in users
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111'}/api/v1/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch user info')
        }

        const userData = await response.json()
        setUser(userData)

        // Check if this is first login (show tweet modal)
        const hasSeenTweetPrompt = localStorage.getItem('prpm_seen_tweet_prompt')
        if (!hasSeenTweetPrompt) {
          setShowTweetModal(true)
          localStorage.setItem('prpm_seen_tweet_prompt', 'true')
        }

        // Check for unclaimed packages
        try {
          const unclaimedData = await getUnclaimedPackages(token)
          if (unclaimedData.packages && unclaimedData.packages.length > 0) {
            setUnclaimedCount(unclaimedData.packages.length)
          }
        } catch (error) {
          console.error('Error checking unclaimed packages:', error)
          // Non-fatal error, continue
        }

        // Load analytics dashboard
        loadAnalytics(token)
      } catch (error) {
        console.error('Error fetching user:', error)
        // Token might be invalid, clear and show anonymous view
        localStorage.removeItem('prpm_token')
        localStorage.removeItem('prpm_username')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
  }, [router])

  const loadAnalytics = async (token: string) => {
    try {
      setAnalyticsLoading(true)
      const [dashboard, packagesData] = await Promise.all([
        getAuthorDashboard(token),
        getAuthorPackages(token, 'downloads'),
      ])
      setDashboardData(dashboard)
      setPackages(packagesData.packages || [])
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  // Load starred and recently viewed items for all users
  useEffect(() => {
    const loadStarredAndRecent = async () => {
      const token = localStorage.getItem('prpm_token')
      const registryUrl = process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111'

      // Load recently viewed from localStorage (for all users)
      try {
        const recentPkgs = getRecentPackages()
        const recentColls = getRecentCollections()
        setRecentPackages(recentPkgs)
        setRecentCollections(recentColls)
      } catch (err) {
        console.error('Failed to load recently viewed:', err)
      }

      // Load starred items
      if (token) {
        // Logged in: fetch from API
        try {
          const [pkgsData, collsData] = await Promise.all([
            getStarredPackages(token, 100, 0),
            getStarredCollections(token, 100, 0),
          ])
          setStarredPackages(pkgsData.packages || [])
          setStarredCollections(collsData.collections || [])
        } catch (error) {
          console.error('Error loading starred items:', error)
        }
      } else {
        // Anonymous users: Load starred items from localStorage
        try {
          const localPackageIds = localStorage.getItem('prpm_starred_packages')
          const localCollectionIds = localStorage.getItem('prpm_starred_collections')

          const packageIds: string[] = localPackageIds ? JSON.parse(localPackageIds) : []
          const collectionIds: string[] = localCollectionIds ? JSON.parse(localCollectionIds) : []

          // Fetch package details for starred IDs
          const packagePromises = packageIds.slice(0, 6).map(async (id) => {
            try {
              const response = await fetch(`${registryUrl}/api/v1/packages/${id}`)
              if (response.ok) {
                return await response.json()
              }
              return null
            } catch (err) {
              console.error(`Failed to fetch package ${id}:`, err)
              return null
            }
          })

          // Fetch collection details for starred IDs
          const collectionPromises = collectionIds.slice(0, 6).map(async (id) => {
            const [scope, nameSlug] = id.split('/')
            try {
              const response = await fetch(`${registryUrl}/api/v1/collections/${scope}/${nameSlug}`)
              if (response.ok) {
                return await response.json()
              }
              return null
            } catch (err) {
              console.error(`Failed to fetch collection ${id}:`, err)
              return null
            }
          })

          const [packages, collections] = await Promise.all([
            Promise.all(packagePromises),
            Promise.all(collectionPromises),
          ])

          setStarredPackages(packages.filter(p => p !== null))
          setStarredCollections(collections.filter(c => c !== null))
        } catch (error) {
          console.error('Error loading anonymous starred items:', error)
          setStarredPackages([])
          setStarredCollections([])
        }
      }
    }

    loadStarredAndRecent()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('prpm_token')
    localStorage.removeItem('prpm_username')
    router.push('/')
  }

  const handleClaimPackages = async () => {
    const token = localStorage.getItem('prpm_token')
    if (!token) return

    setClaiming(true)
    setClaimError(null)

    try {
      await claimPackages(token)
      // Refresh page to show updated package count
      window.location.reload()
    } catch (error) {
      setClaimError(error instanceof Error ? error.message : 'Failed to claim packages')
    } finally {
      setClaiming(false)
    }
  }

  const handleEditWebsite = () => {
    setWebsiteInput(user?.website || '')
    setIsEditingWebsite(true)
    setWebsiteError(null)
  }

  const handleCancelWebsiteEdit = () => {
    setIsEditingWebsite(false)
    setWebsiteInput('')
    setWebsiteError(null)
  }

  const handleSaveWebsite = async () => {
    const token = localStorage.getItem('prpm_token')
    if (!token) return

    setWebsiteSaving(true)
    setWebsiteError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111'}/api/v1/auth/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ website: websiteInput.trim() || null }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update website')
      }

      const data = await response.json()
      setUser(prev => prev ? { ...prev, website: data.user.website } : null)
      setIsEditingWebsite(false)
    } catch (error) {
      setWebsiteError(error instanceof Error ? error.message : 'Failed to update website')
    } finally {
      setWebsiteSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-prpm-dark flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-prpm-accent mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </main>
    )
  }

  // Anonymous user view
  if (!user) {
    const hasStarredItems = starredPackages.length > 0 || starredCollections.length > 0
    const hasRecentItems = recentPackages.length > 0 || recentCollections.length > 0
    const hasAnyItems = hasStarredItems || hasRecentItems

    return (
      <main className="min-h-screen bg-prpm-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">
              Your Dashboard
            </h1>
            <p className="text-gray-400 text-lg">
              {hasAnyItems ? 'Track your starred and recently viewed items' : 'Start exploring packages and collections'}
            </p>
          </div>

          {!hasAnyItems && (
            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-12 text-center mb-8">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Start Your PRPM Journey
              </h2>
              <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                Discover AI prompts, skills, and agents from the community. Star your favorites and they'll appear here!
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link
                  href="/search"
                  className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all"
                >
                  Browse Packages
                </Link>
                <Link
                  href="/search?tab=collections"
                  className="px-6 py-3 bg-prpm-dark border border-prpm-border hover:border-prpm-accent text-white rounded-lg font-semibold transition-all"
                >
                  View Collections
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3 bg-prpm-dark border border-prpm-border hover:border-prpm-green-light text-white rounded-lg font-semibold transition-all"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}

          {/* Starred & Recently Viewed Section for Anonymous Users */}
          {hasAnyItems && (
            <div className="space-y-8">
              {/* Starred Items */}
              {hasStarredItems && (
                <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-8">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Starred Items ({starredPackages.length + starredCollections.length})
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {starredPackages.slice(0, 4).map((pkg: any) => (
                      <Link
                        key={pkg.id}
                        href={`/packages/${pkg.name.startsWith('@') ? pkg.name.split('/')[0].substring(1) : 'prpm'}/${pkg.name.startsWith('@') ? pkg.name.split('/').slice(1).join('/') : pkg.name}`}
                        className="bg-prpm-dark border border-prpm-border hover:border-prpm-accent rounded-lg p-4 transition-colors"
                      >
                        <h3 className="text-lg font-semibold text-white mb-2">{pkg.display_name || pkg.name}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2">{pkg.description}</p>
                      </Link>
                    ))}
                    {starredCollections.slice(0, 2).map((coll: any) => (
                      <Link
                        key={coll.id}
                        href={`/collections/${coll.name_slug}`}
                        className="bg-prpm-dark border border-prpm-border hover:border-prpm-accent rounded-lg p-4 transition-colors"
                      >
                        <h3 className="text-lg font-semibold text-white mb-2">📚 {coll.scope}/{coll.name_slug}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2">{coll.description}</p>
                      </Link>
                    ))}
                  </div>
                  {(starredPackages.length + starredCollections.length) > 6 && (
                    <div className="mt-4 text-center">
                      <span className="text-gray-400 text-sm">
                        +{starredPackages.length + starredCollections.length - 6} more starred items
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Recently Viewed */}
              {hasRecentItems && (
                <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-8">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recently Viewed ({recentPackages.length + recentCollections.length})
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {recentPackages.slice(0, 4).map((pkg) => (
                      <Link
                        key={pkg.id}
                        href={`/packages/${pkg.name.startsWith('@') ? pkg.name.split('/')[0].substring(1) : 'prpm'}/${pkg.name.startsWith('@') ? pkg.name.split('/').slice(1).join('/') : pkg.name}`}
                        className="bg-prpm-dark border border-prpm-border hover:border-prpm-accent rounded-lg p-4 transition-colors"
                      >
                        <h3 className="text-lg font-semibold text-white mb-2">{pkg.name}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2">{pkg.description}</p>
                        <span className="text-xs text-gray-500 mt-2 block">
                          Viewed {new Date(pkg.viewedAt).toLocaleDateString()}
                        </span>
                      </Link>
                    ))}
                    {recentCollections.slice(0, 2).map((coll) => (
                      <Link
                        key={`${coll.scope}/${coll.name_slug}`}
                        href={`/collections/${coll.name_slug}`}
                        className="bg-prpm-dark border border-prpm-border hover:border-prpm-accent rounded-lg p-4 transition-colors"
                      >
                        <h3 className="text-lg font-semibold text-white mb-2">📚 {coll.scope}/{coll.name_slug}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2">{coll.description}</p>
                        <span className="text-xs text-gray-500 mt-2 block">
                          Viewed {new Date(coll.viewedAt).toLocaleDateString()}
                        </span>
                      </Link>
                    ))}
                  </div>
                  {(recentPackages.length + recentCollections.length) > 6 && (
                    <div className="mt-4 text-center">
                      <span className="text-gray-400 text-sm">
                        +{recentPackages.length + recentCollections.length - 6} more recently viewed
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Login CTA */}
              <div className="bg-gradient-to-r from-prpm-accent/20 to-prpm-green/20 border border-prpm-accent/30 rounded-xl p-8 text-center">
                <h3 className="text-2xl font-bold text-white mb-3">
                  Get More with a PRPM Account
                </h3>
                <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                  Sign in to sync your starred items across devices, publish your own packages, and track analytics.
                </p>
                <Link
                  href="/login"
                  className="inline-block px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all"
                >
                  Sign In with GitHub
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-prpm-dark">
      {/* Header */}
      <header className="border-b border-prpm-border bg-prpm-dark-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-prpm-accent to-prpm-green bg-clip-text text-transparent">
              PRPM
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">@{user.username}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-prpm-dark border border-prpm-border rounded-lg hover:border-prpm-accent transition-colors text-gray-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Unclaimed Packages Banner */}
        {unclaimedCount > 0 && (
          <div className="mb-8 bg-gradient-to-r from-prpm-accent/20 to-prpm-green/20 border border-prpm-accent/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🎉</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  You have {unclaimedCount} unclaimed package{unclaimedCount !== 1 ? 's' : ''}!
                </h3>
                <p className="text-gray-300 mb-4">
                  We found {unclaimedCount} package{unclaimedCount !== 1 ? 's' : ''} published under your GitHub username @{user.username}.
                  Claim them now to link them to your account and get the verified author badge.
                </p>
                {claimError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {claimError}
                  </div>
                )}
                <button
                  onClick={handleClaimPackages}
                  disabled={claiming}
                  className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {claiming ? 'Claiming...' : `Claim ${unclaimedCount} Package${unclaimedCount !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user.username}!
          </h1>
          <p className="text-gray-400 text-lg">
            Manage your packages, browse the registry, and more.
          </p>
        </div>

        {/* User Info Card */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-prpm-accent flex items-center justify-center text-white text-2xl font-bold">
                    {user.username[0].toUpperCase()}
                  </div>
                )}
                {user.prpm_plus_status === 'active' && (
                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-prpm-dark shadow-lg">
                    PRPM+
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white">{user.username}</h3>
                <p className="text-gray-400 text-sm">{user.email}</p>
              </div>
            </div>

            {/* Website Section */}
            <div className="mb-4 border-t border-prpm-border pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Website</label>
                {!isEditingWebsite && (
                  <button
                    onClick={handleEditWebsite}
                    className="text-xs text-prpm-accent hover:text-prpm-accent-light transition-colors"
                  >
                    {user.website ? 'Edit' : 'Add'}
                  </button>
                )}
              </div>

              {isEditingWebsite ? (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={websiteInput}
                    onChange={(e) => setWebsiteInput(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 bg-prpm-dark border border-prpm-border rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-prpm-accent transition-colors"
                  />
                  {websiteError && (
                    <p className="text-xs text-red-400">{websiteError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveWebsite}
                      disabled={websiteSaving}
                      className="flex-1 px-3 py-2 bg-prpm-accent hover:bg-prpm-accent-light text-white text-sm rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {websiteSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelWebsiteEdit}
                      disabled={websiteSaving}
                      className="px-3 py-2 bg-prpm-dark border border-prpm-border hover:border-prpm-accent text-gray-300 text-sm rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {user.website ? (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-prpm-accent hover:text-prpm-accent-light transition-colors flex items-center gap-1 break-all"
                    >
                      {user.website}
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No website set</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {user.verified_author && (
                <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-xs font-medium">
                  ✓ Verified Author
                </span>
              )}
              {user.is_admin && (
                <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 text-xs font-medium">
                  Admin
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Your Packages</h3>
            <div className="text-4xl font-bold text-prpm-accent mb-2">{user.package_count || 0}</div>
            <p className="text-gray-400 text-sm">Published packages</p>
          </div>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Downloads</h3>
            <div className="text-4xl font-bold text-prpm-green mb-2">{user.total_downloads || 0}</div>
            <p className="text-gray-400 text-sm">Total downloads</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/"
              className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 hover:border-prpm-accent transition-all group"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🔍</div>
              <h3 className="text-lg font-semibold text-white mb-2">Browse Packages</h3>
              <p className="text-gray-400 text-sm">Discover new prompts and skills</p>
            </Link>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 opacity-50 cursor-not-allowed">
              <div className="text-4xl mb-3">📦</div>
              <h3 className="text-lg font-semibold text-white mb-2">Publish Package</h3>
              <p className="text-gray-400 text-sm">Use the prpm cli</p>
            </div>

            <Link
              href="/authors"
              className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 hover:border-prpm-accent transition-all group"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">👥</div>
              <h3 className="text-lg font-semibold text-white mb-2">Authors</h3>
              <p className="text-gray-400 text-sm">Browse package authors</p>
            </Link>

            <Link
              href="/account"
              className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 hover:border-prpm-accent transition-all group"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">⚙️</div>
              <h3 className="text-lg font-semibold text-white mb-2">Settings</h3>
              <p className="text-gray-400 text-sm">Manage settings</p>
            </Link>
          </div>
        </div>

        {/* Analytics Section - Only show if user has packages */}
        {dashboardData && dashboardData.summary && packages.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">📊 Your Analytics</h2>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-2">Today</div>
                <div className="text-3xl font-bold text-prpm-accent mb-1">{dashboardData.summary.downloads_today || 0}</div>
                <div className="text-xs text-gray-500">downloads</div>
              </div>
              <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-2">This Week</div>
                <div className="text-3xl font-bold text-prpm-accent mb-1">{dashboardData.summary.downloads_week || 0}</div>
                <div className="text-xs text-gray-500">downloads</div>
              </div>
              <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-2">This Month</div>
                <div className="text-3xl font-bold text-prpm-accent mb-1">{dashboardData.summary.downloads_month || 0}</div>
                <div className="text-xs text-gray-500">downloads</div>
              </div>
              <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-2">Total Views</div>
                <div className="text-3xl font-bold text-prpm-purple mb-1">{dashboardData.summary.total_views || 0}</div>
                <div className="text-xs text-gray-500">page views</div>
              </div>
            </div>

            {/* Most Popular Package */}
            {dashboardData.most_popular && dashboardData.most_popular.package_name && (
              <div className="bg-gradient-to-r from-prpm-accent/10 to-prpm-purple/10 border border-prpm-accent/30 rounded-xl p-6 mb-6">
                <div className="text-sm text-gray-400 mb-1">🏆 Most Popular Package</div>
                <div className="text-2xl font-bold text-white mb-1">{dashboardData.most_popular.package_name}</div>
                <div className="text-lg text-prpm-accent font-semibold">
                  {(dashboardData.most_popular.downloads || 0).toLocaleString()} downloads
                </div>
              </div>
            )}

            {/* Your Packages with Analytics */}
            {packages && packages.length > 0 && (
              <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Your Packages</h3>
                <div className="space-y-3">
                  {packages.slice(0, 5).map((pkg: any) => (
                    <div key={pkg.id} className="flex items-center justify-between p-4 bg-prpm-dark border border-prpm-border rounded-lg hover:border-prpm-accent transition-all group">
                      <div className="flex-1">
                        <div className="font-semibold text-white group-hover:text-prpm-accent transition-colors">{pkg.name || pkg.id}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-3 mt-1">
                          <span>⬇️ {pkg.total_downloads || 0}</span>
                          <span className="px-2 py-0.5 bg-prpm-dark border border-prpm-border rounded text-xs">{pkg.format}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPackage(pkg)
                          setShowAnalyticsModal(true)
                        }}
                        className="px-4 py-2 bg-prpm-accent/20 hover:bg-prpm-accent/30 text-prpm-accent rounded-lg font-semibold transition-all text-sm flex items-center gap-2"
                      >
                        📊 View Analytics
                      </button>
                    </div>
                  ))}
                </div>
                {packages.length > 5 && (
                  <Link
                    href={`/authors?username=${user.username}`}
                    className="block mt-4 text-center text-prpm-accent hover:text-prpm-accent-light transition-colors text-sm"
                  >
                    View all {packages.length} packages →
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Loading State for Analytics */}
        {analyticsLoading && (
          <div className="mb-12 bg-prpm-dark-card border border-prpm-border rounded-xl p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-prpm-accent mb-4"></div>
            <p className="text-gray-400">Loading analytics...</p>
          </div>
        )}

        {/* Playground Analytics */}
        <div className="mb-12">
          <PlaygroundAnalyticsDashboard />
        </div>

        {/* Starred & Recently Viewed Section */}
        {(starredPackages.length > 0 || starredCollections.length > 0 || recentPackages.length > 0 || recentCollections.length > 0) && (
          <div className="mt-8 space-y-8">
            {/* Starred Items */}
            {(starredPackages.length > 0 || starredCollections.length > 0) && (
              <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Starred Items ({starredPackages.length + starredCollections.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {starredPackages.slice(0, 4).map((pkg: any) => (
                    <Link
                      key={pkg.id}
                      href={`/packages/${pkg.name.startsWith('@') ? pkg.name.split('/')[0].substring(1) : 'prpm'}/${pkg.name.startsWith('@') ? pkg.name.split('/').slice(1).join('/') : pkg.name}`}
                      className="bg-prpm-dark border border-prpm-border hover:border-prpm-accent rounded-lg p-4 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-white mb-2">{pkg.display_name || pkg.name}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2">{pkg.description}</p>
                    </Link>
                  ))}
                  {starredCollections.slice(0, 2).map((coll: any) => (
                    <Link
                      key={coll.id}
                      href={`/collections/${coll.name_slug}`}
                      className="bg-prpm-dark border border-prpm-border hover:border-prpm-accent rounded-lg p-4 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-white mb-2">📚 {coll.scope}/{coll.name_slug}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2">{coll.description}</p>
                    </Link>
                  ))}
                </div>
                {(starredPackages.length + starredCollections.length) > 6 && (
                  <div className="mt-4 text-center">
                    <span className="text-gray-400 text-sm">
                      +{starredPackages.length + starredCollections.length - 6} more starred items
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Recently Viewed */}
            {(recentPackages.length > 0 || recentCollections.length > 0) && (
              <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recently Viewed ({recentPackages.length + recentCollections.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {recentPackages.slice(0, 4).map((pkg) => (
                    <Link
                      key={pkg.id}
                      href={`/packages/${pkg.name.startsWith('@') ? pkg.name.split('/')[0].substring(1) : 'prpm'}/${pkg.name.startsWith('@') ? pkg.name.split('/').slice(1).join('/') : pkg.name}`}
                      className="bg-prpm-dark border border-prpm-border hover:border-prpm-accent rounded-lg p-4 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-white mb-2">{pkg.name}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2">{pkg.description}</p>
                      <span className="text-xs text-gray-500 mt-2 block">
                        Viewed {new Date(pkg.viewedAt).toLocaleDateString()}
                      </span>
                    </Link>
                  ))}
                  {recentCollections.slice(0, 2).map((coll) => (
                    <Link
                      key={`${coll.scope}/${coll.name_slug}`}
                      href={`/collections/${coll.name_slug}`}
                      className="bg-prpm-dark border border-prpm-border hover:border-prpm-accent rounded-lg p-4 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-white mb-2">📚 {coll.scope}/{coll.name_slug}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2">{coll.description}</p>
                      <span className="text-xs text-gray-500 mt-2 block">
                        Viewed {new Date(coll.viewedAt).toLocaleDateString()}
                      </span>
                    </Link>
                  ))}
                </div>
                {(recentPackages.length + recentCollections.length) > 6 && (
                  <div className="mt-4 text-center">
                    <span className="text-gray-400 text-sm">
                      +{recentPackages.length + recentCollections.length - 6} more recently viewed
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tweet Encouragement Modal */}
      {showTweetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 max-w-lg w-full relative">
            <button
              onClick={() => setShowTweetModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome to PRPM!
              </h2>
              <p className="text-gray-400">
                You've successfully connected your GitHub account. Share your journey with the community!
              </p>
            </div>

            <div className="bg-prpm-dark border border-prpm-border rounded-xl p-4 mb-6">
              <p className="text-gray-300 text-sm mb-3">Ready-to-share tweet:</p>
              <p className="text-white leading-relaxed">
                Just connected my GitHub to @prpmdev 🚀
                <br /><br />
                Check out my AI prompts, agents, and coding tools at prpm.dev/@{user?.username}
                <br /><br />
                #AI #DevTools #Prompts #prpm
              </p>
            </div>

            <div className="flex gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just connected my GitHub to @prpmdev 🚀\n\nCheck out my AI prompts, agents, and coding tools at prpm.dev/@${user?.username}\n\n#AI #DevTools #Prompts`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-6 py-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                onClick={() => setShowTweetModal(false)}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
                Tweet Now
              </a>
              <button
                onClick={() => setShowTweetModal(false)}
                className="px-6 py-3 bg-prpm-dark border border-prpm-border hover:border-prpm-accent text-gray-300 rounded-lg font-semibold transition-all"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Package Analytics Modal */}
      {selectedPackage && (
        <PackageAnalyticsModal
          packageId={selectedPackage.id}
          packageName={selectedPackage.name || selectedPackage.id}
          isOpen={showAnalyticsModal}
          onClose={() => {
            setShowAnalyticsModal(false)
            setSelectedPackage(null)
          }}
          jwtToken={localStorage.getItem('prpm_token') || ''}
        />
      )}
    </main>
  )
}
