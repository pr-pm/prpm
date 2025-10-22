'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  getAuthorProfile,
  getAuthorUnclaimedPackages,
  getAuthorDashboard,
  getAuthorPackages,
  getCurrentUser,
} from '@/lib/api'

interface AuthorStats {
  total_packages: number
  total_downloads: number
  average_rating: number | null
  total_ratings: number
}

interface Package {
  id: string
  description: string
  type: string
  total_downloads: number
  weekly_downloads: number
  monthly_downloads: number
  rating_average: number | null
  rating_count: number
  created_at: string
  updated_at: string
  tags: string[]
}

interface AuthorData {
  author: {
    username: string
    verified: boolean
    github_username: string | null
    joined: string
    has_claimed_account: boolean
  }
  stats: AuthorStats
  unclaimed: {
    has_unclaimed: boolean
    count: number
  }
  packages: Package[]
  total: number
}

export default function AuthorProfilePage() {
  const params = useParams()
  const username = params.username as string

  const [authorData, setAuthorData] = useState<AuthorData | null>(null)
  const [unclaimedPackages, setUnclaimedPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)
        setError(null)

        // Check if user is logged in and viewing their own profile
        const token = typeof window !== 'undefined' ? localStorage.getItem('prpm_token') : null
        let currentUsername = null

        if (token) {
          try {
            const user = await getCurrentUser(token)
            currentUsername = user.username

            // If viewing own profile, load analytics dashboard
            if (user.username.toLowerCase() === username.toLowerCase()) {
              setIsOwnProfile(true)
              const [profile, dashboard, packages] = await Promise.all([
                getAuthorProfile(username),
                getAuthorDashboard(token),
                getAuthorPackages(token, 'downloads'),
              ])
              setAuthorData(profile)
              setDashboardData(dashboard)
            }
          } catch (err) {
            // Not logged in or token expired, continue as guest
            console.error('Auth check failed:', err)
          }
        }

        if (!isOwnProfile) {
          // Load public profile
          const profile = await getAuthorProfile(username)
          setAuthorData(profile)

          // If author has unclaimed packages, load them
          if (profile.unclaimed.has_unclaimed) {
            const unclaimed = await getAuthorUnclaimedPackages(username)
            setUnclaimedPackages(unclaimed.unclaimed_packages || [])
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      loadProfile()
    }
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen bg-prpm-dark flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-prpm-accent mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !authorData) {
    return (
      <div className="min-h-screen bg-prpm-dark flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 text-center">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-3xl font-bold text-white mb-4">Author Not Found</h1>
          <p className="text-gray-400 mb-6">
            {error || `We couldn't find an author with the username "${username}".`}
          </p>
          <Link
            href="/authors"
            className="inline-block px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all"
          >
            Browse Authors
          </Link>
        </div>
      </div>
    )
  }

  const { author, stats, unclaimed, packages } = authorData

  return (
    <main className="min-h-screen bg-prpm-dark">
      {/* Header */}
      <div className="bg-prpm-dark-card border-b border-prpm-border">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-prpm-accent/20 border-2 border-prpm-accent flex items-center justify-center">
                <span className="text-4xl font-bold text-white">
                  {author.username.charAt(0).toUpperCase()}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-white">{author.username}</h1>
                  {author.verified && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-prpm-accent/20 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-semibold">
                      ✓ Verified
                    </span>
                  )}
                </div>

                {author.github_username && (
                  <a
                    href={`https://github.com/${author.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-prpm-accent transition-colors mb-3"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    @{author.github_username}
                  </a>
                )}

                <p className="text-gray-400 text-sm">
                  Joined {new Date(author.joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {isOwnProfile && (
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="px-4 py-2 bg-prpm-dark border border-prpm-border hover:border-prpm-accent text-white rounded-lg font-semibold transition-all text-sm"
              >
                {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
              </button>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Packages</div>
              <div className="text-2xl font-bold text-white">{stats.total_packages}</div>
            </div>
            <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Total Downloads</div>
              <div className="text-2xl font-bold text-white">{stats.total_downloads.toLocaleString()}</div>
            </div>
            {stats.average_rating !== null && (
              <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Average Rating</div>
                <div className="text-2xl font-bold text-white flex items-center gap-1">
                  {stats.average_rating.toFixed(1)}
                  <span className="text-yellow-400 text-lg">★</span>
                </div>
              </div>
            )}
            {stats.total_ratings > 0 && (
              <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Total Ratings</div>
                <div className="text-2xl font-bold text-white">{stats.total_ratings}</div>
              </div>
            )}
          </div>

          {/* Analytics Dashboard for Own Profile */}
          {isOwnProfile && showAnalytics && dashboardData && (
            <div className="mt-8 p-6 bg-prpm-dark border border-prpm-border rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">📊 Your Analytics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-gray-400 text-sm">Downloads Today</div>
                  <div className="text-xl font-bold text-prpm-accent">{dashboardData.summary.downloads_today}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Downloads This Week</div>
                  <div className="text-xl font-bold text-prpm-accent">{dashboardData.summary.downloads_week}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Downloads This Month</div>
                  <div className="text-xl font-bold text-prpm-accent">{dashboardData.summary.downloads_month}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Total Views</div>
                  <div className="text-xl font-bold text-prpm-accent">{dashboardData.summary.total_views}</div>
                </div>
              </div>
              {dashboardData.most_popular && (
                <div className="mt-4 p-4 bg-prpm-dark-card border border-prpm-border rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Most Popular Package</div>
                  <div className="text-lg font-semibold text-white">{dashboardData.most_popular.package_name}</div>
                  <div className="text-sm text-gray-400">{dashboardData.most_popular.downloads.toLocaleString()} downloads</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Unclaimed Packages Banner (for authors without GitHub connection) */}
      {unclaimed.has_unclaimed && !author.has_claimed_account && (
        <div className="bg-gradient-to-r from-prpm-accent/20 to-prpm-purple/20 border-b border-prpm-accent/30">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-start gap-4">
              <div className="text-4xl">📦</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Are you {author.username}?
                </h2>
                <p className="text-gray-300 mb-4">
                  We found {unclaimed.count} package{unclaimed.count !== 1 ? 's' : ''} under your name.
                  Connect your GitHub account to claim ownership and unlock analytics!
                </p>
                <Link
                  href="/login"
                  className="inline-block px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all"
                >
                  Connect GitHub & Claim Packages
                </Link>
              </div>
            </div>

            {/* Show unclaimed packages */}
            {unclaimedPackages.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unclaimedPackages.slice(0, 6).map((pkg) => (
                  <div key={pkg.id} className="bg-prpm-dark border border-prpm-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">{pkg.id}</h3>
                      <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-400 text-xs font-semibold">
                        Unclaimed
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{pkg.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="px-2 py-1 bg-prpm-dark-card border border-prpm-border rounded">
                        {pkg.type}
                      </span>
                      <span>{pkg.total_downloads} downloads</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Packages List */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            Packages ({packages.length})
          </h2>
        </div>

        {packages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-400">No packages published yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Link
                key={pkg.id}
                href={`/packages/${pkg.id}`}
                className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6 hover:border-prpm-accent transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white group-hover:text-prpm-accent transition-colors">
                    {pkg.id}
                  </h3>
                  <span className="px-2 py-1 bg-prpm-dark border border-prpm-border rounded text-gray-400 text-xs">
                    {pkg.type}
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {pkg.description || 'No description'}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <span>⬇️</span>
                    <span>{pkg.total_downloads.toLocaleString()}</span>
                  </div>
                  {pkg.rating_average !== null && (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span>{pkg.rating_average.toFixed(1)}</span>
                      <span className="text-gray-600">({pkg.rating_count})</span>
                    </div>
                  )}
                </div>

                {pkg.tags && pkg.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {pkg.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-prpm-dark border border-prpm-border rounded text-xs text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
