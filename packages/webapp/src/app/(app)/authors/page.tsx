'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  getTopAuthors,
  getAuthorProfile,
  getAuthorUnclaimedPackages,
  getAuthorDashboard,
  getAuthorPackages,
  getCurrentUser,
  type Author,
} from '@/lib/api'

interface AuthorStats {
  total_packages: number
  total_downloads: number
  average_rating: number | null
  total_ratings: number
}

interface Package {
  id: string
  name: string
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
  packages: Package[]
  total: number
}

function AuthorsPageContent() {
  const searchParams = useSearchParams()
  const username = searchParams.get('username')

  const [authors, setAuthors] = useState<Author[]>([])
  const [authorData, setAuthorData] = useState<AuthorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (username) {
      loadAuthorProfile(username)
    } else {
      loadAuthors()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  async function loadAuthors() {
    try {
      setLoading(true)
      setError(null)
      const data = await getTopAuthors(100)
      setAuthors(data.authors)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load authors')
    } finally {
      setLoading(false)
    }
  }

  async function loadAuthorProfile(username: string) {
    try {
      setLoading(true)
      setError(null)

      // Check if user is logged in and viewing their own profile
      const token = typeof window !== 'undefined' ? localStorage.getItem('prpm_token') : null
      let currentUsername = null

      if (token) {
        try {
          const currentUser = await getCurrentUser(token)
          currentUsername = currentUser.username
        } catch (err) {
          console.error('Failed to get current user:', err)
        }
      }

      const isOwn = currentUsername === username
      setIsOwnProfile(isOwn)

      // Load profile data
      const data = await getAuthorProfile(username)
      setAuthorData(data)

      // If viewing own profile, load dashboard data
      if (isOwn && token) {
        try {
          const dashboard = await getAuthorDashboard(token)
          setDashboardData(dashboard)
        } catch (err) {
          console.error('Failed to load dashboard:', err)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load author profile')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyInstall = (packageName: string) => {
    navigator.clipboard.writeText(`prpm install ${packageName}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-prpm-dark text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-prpm-accent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-prpm-dark text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">❌ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-prpm-accent hover:bg-prpm-accent-dark rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Author profile view
  if (username && authorData) {
    return (
      <div className="min-h-screen bg-prpm-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back button */}
          <Link
            href="/authors"
            className="inline-flex items-center text-prpm-accent hover:text-prpm-accent-dark mb-8"
          >
            ← Back to Authors
          </Link>

          {/* Author Header */}
          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold">{authorData.author.username}</h1>
                  {authorData.author.verified && (
                    <span className="text-prpm-accent" title="Verified Author">
                      ✓
                    </span>
                  )}
                </div>
                {authorData.author.github_username && (
                  <a
                    href={`https://github.com/${authorData.author.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-prpm-accent"
                  >
                    @{authorData.author.github_username}
                  </a>
                )}
                <p className="text-gray-400 mt-2">
                  Joined {new Date(authorData.author.joined).toLocaleDateString()}
                </p>
              </div>

              {isOwnProfile && (
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="px-4 py-2 bg-prpm-accent hover:bg-prpm-accent-dark rounded-lg"
                >
                  {showAnalytics ? 'Hide Analytics' : 'View Analytics'}
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-bold text-prpm-accent">
                  {authorData.stats.total_packages}
                </div>
                <div className="text-gray-400 text-sm">Packages</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-prpm-accent">
                  {authorData.stats.total_downloads.toLocaleString()}
                </div>
                <div className="text-gray-400 text-sm">Downloads</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-prpm-accent">
                  {authorData.stats.average_rating?.toFixed(1) || 'N/A'}
                </div>
                <div className="text-gray-400 text-sm">Avg Rating</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-prpm-accent">
                  {authorData.stats.total_ratings}
                </div>
                <div className="text-gray-400 text-sm">Ratings</div>
              </div>
            </div>
          </div>

          {/* Analytics Dashboard (only for own profile) */}
          {isOwnProfile && showAnalytics && dashboardData && (
            <div className="mb-8 bg-prpm-dark-card border border-prpm-border rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Download Trends</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-prpm-dark p-4 rounded-lg">
                      <div className="text-2xl font-bold text-prpm-accent">
                        {dashboardData.downloads?.today || 0}
                      </div>
                      <div className="text-gray-400 text-sm">Today</div>
                    </div>
                    <div className="bg-prpm-dark p-4 rounded-lg">
                      <div className="text-2xl font-bold text-prpm-accent">
                        {dashboardData.downloads?.week || 0}
                      </div>
                      <div className="text-gray-400 text-sm">This Week</div>
                    </div>
                    <div className="bg-prpm-dark p-4 rounded-lg">
                      <div className="text-2xl font-bold text-prpm-accent">
                        {dashboardData.downloads?.month || 0}
                      </div>
                      <div className="text-gray-400 text-sm">This Month</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Packages */}
          <div>
            <h2 className="text-2xl font-bold mb-6">
              Packages ({authorData.total})
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {authorData.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 hover:border-prpm-accent transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedPackage(pkg)
                    setShowPackageModal(true)
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold">{pkg.name}</h3>
                    <span className="px-2 py-1 bg-prpm-dark rounded text-xs text-prpm-accent">
                      {pkg.type}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {pkg.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>↓ {pkg.total_downloads.toLocaleString()}</span>
                    {pkg.rating_average && (
                      <span>⭐ {pkg.rating_average.toFixed(1)}</span>
                    )}
                  </div>
                  {pkg.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {pkg.tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-prpm-dark border border-prpm-border rounded text-xs text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Package Modal */}
          {showPackageModal && selectedPackage && (
            <div
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
              onClick={() => setShowPackageModal(false)}
            >
              <div
                className="bg-prpm-dark-card border border-prpm-border rounded-xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedPackage.name}</h2>
                    <span className="px-3 py-1 bg-prpm-dark rounded text-sm text-prpm-accent">
                      {selectedPackage.type}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowPackageModal(false)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                <p className="text-gray-300 mb-6">{selectedPackage.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-prpm-dark p-4 rounded-lg">
                    <div className="text-2xl font-bold text-prpm-accent">
                      {selectedPackage.total_downloads.toLocaleString()}
                    </div>
                    <div className="text-gray-400 text-sm">Total Downloads</div>
                  </div>
                  <div className="bg-prpm-dark p-4 rounded-lg">
                    <div className="text-2xl font-bold text-prpm-accent">
                      {selectedPackage.weekly_downloads.toLocaleString()}
                    </div>
                    <div className="text-gray-400 text-sm">Weekly Downloads</div>
                  </div>
                </div>

                {selectedPackage.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPackage.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-prpm-dark border border-prpm-border rounded text-sm text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleCopyInstall(selectedPackage.name)}
                    className="flex-1 px-4 py-2 bg-prpm-accent hover:bg-prpm-accent-dark rounded-lg font-medium"
                  >
                    {copied ? '✓ Copied!' : 'Copy Install Command'}
                  </button>
                  <Link
                    href={`/search?q=${selectedPackage.name}`}
                    className="px-4 py-2 border border-prpm-border hover:border-prpm-accent rounded-lg font-medium text-center"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Authors list view
  return (
    <div className="min-h-screen bg-prpm-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Top Package Authors</h1>
          <p className="text-gray-400">
            Discover the most active and popular package authors in the PRPM ecosystem
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <Link
              key={author.author}
              href={`/authors?username=${author.author}`}
              className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 hover:border-prpm-accent transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-semibold">{author.author}</h2>
                {author.verified && (
                  <span className="text-prpm-accent" title="Verified Author">
                    ✓
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-2xl font-bold text-prpm-accent">
                    {author.package_count}
                  </div>
                  <div className="text-gray-400">Packages</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-prpm-accent">
                    {author.total_downloads.toLocaleString()}
                  </div>
                  <div className="text-gray-400">Downloads</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-prpm-accent">
                    N/A
                  </div>
                  <div className="text-gray-400">Rating</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AuthorsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-prpm-dark text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-prpm-accent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading authors...</p>
        </div>
      </div>
    }>
      <AuthorsPageContent />
    </Suspense>
  )
}
