'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { listOrganizations, type OrganizationListItem } from '@/lib/api'
import CreateOrganizationModal from '@/components/CreateOrganizationModal'

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [jwtToken, setJwtToken] = useState<string | undefined>(undefined)

  useEffect(() => {
    loadOrganizations()
    // Check if user is logged in by looking for JWT token in localStorage
    const token = localStorage.getItem('prpm_token')
    if (token) {
      setJwtToken(token)
    }
  }, [])

  async function loadOrganizations() {
    try {
      setLoading(true)
      setError(null)
      const data = await listOrganizations({ limit: 100 })
      setOrganizations(data.organizations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-prpm-dark flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-prpm-accent mb-4"></div>
          <p className="text-gray-400">Loading organizations...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-prpm-dark flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 text-center">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-3xl font-bold text-white mb-4">Error Loading Organizations</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={loadOrganizations}
            className="inline-block px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all"
          >
            Try Again
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-prpm-dark">
      {/* Header */}
      <div className="bg-prpm-dark-card border-b border-prpm-border">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Link href="/search" className="text-prpm-accent hover:text-prpm-accent-light mb-4 inline-block">
            ← Back to Search
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Organizations Leaderboard</h1>
          <p className="text-gray-400 text-lg">
            Top organizations by packages and downloads
          </p>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-prpm-accent/10 to-purple-500/10 border-b border-prpm-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Create Your Organization</h2>
              <p className="text-gray-400">
                Start publishing packages under your organization and collaborate with your team
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold whitespace-nowrap transition-all"
            >
              Create Organization
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {organizations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏢</div>
            <p className="text-gray-400">No organizations found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {organizations.map((org, index) => {
              const rank = index + 1
              const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null

              return (
                <Link
                  key={org.id}
                  href={`/orgs?name=${encodeURIComponent(org.name)}`}
                  className="block bg-prpm-dark-card border border-prpm-border rounded-lg p-6 hover:border-prpm-accent transition-all group"
                >
                  <div className="flex items-center gap-6">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-16 text-center">
                      {medal ? (
                        <span className="text-4xl">{medal}</span>
                      ) : (
                        <span className="text-2xl font-bold text-gray-500">#{rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-prpm-accent/20 border-2 border-prpm-accent flex items-center justify-center overflow-hidden">
                      {org.avatar_url ? (
                        <img
                          src={org.avatar_url}
                          alt={`${org.name}'s avatar`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-white">
                          {org.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Organization Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-bold text-white group-hover:text-prpm-accent transition-colors truncate">
                          {org.name}
                        </h2>
                        {org.is_verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-prpm-accent/20 border border-prpm-accent/30 rounded-full text-prpm-accent text-sm font-semibold flex-shrink-0">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      {org.description && (
                        <p className="text-gray-400 text-sm line-clamp-1">
                          {org.description}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-8 flex-shrink-0">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {org.package_count}
                        </div>
                        <div className="text-gray-400 text-xs">Packages</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {org.member_count}
                        </div>
                        <div className="text-gray-400 text-xs">Members</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-prpm-accent">
                          {org.total_downloads.toLocaleString()}
                        </div>
                        <div className="text-gray-400 text-xs">Downloads</div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          // Reload organizations after successful creation
          loadOrganizations()
        }}
        jwtToken={jwtToken}
      />
    </main>
  )
}
