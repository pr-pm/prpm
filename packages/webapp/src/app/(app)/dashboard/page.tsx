'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  username: string
  email: string
  avatar_url?: string
  verified_author: boolean
  is_admin: boolean
  package_count?: number
  total_downloads?: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('prpm_token')
    const username = localStorage.getItem('prpm_username')

    if (!token || !username) {
      // Not logged in, redirect to login
      router.push('/login')
      return
    }

    // Fetch user info
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch user info')
        }

        const userData = await response.json()
        setUser(userData)
      } catch (error) {
        console.error('Error fetching user:', error)
        // Token might be invalid, redirect to login
        localStorage.removeItem('prpm_token')
        localStorage.removeItem('prpm_username')
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('prpm_token')
    localStorage.removeItem('prpm_username')
    router.push('/')
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

  if (!user) {
    return null // Will redirect
  }

  return (
    <main className="min-h-screen bg-prpm-dark">
      {/* Header */}
      <header className="border-b border-prpm-border bg-prpm-dark-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-prpm-accent to-prpm-purple bg-clip-text text-transparent">
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
              {user.avatar_url ? (
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
              <div>
                <h3 className="text-xl font-semibold text-white">{user.username}</h3>
                <p className="text-gray-400 text-sm">{user.email}</p>
              </div>
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
            <div className="text-4xl font-bold text-prpm-purple mb-2">{user.total_downloads || 0}</div>
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
              <p className="text-gray-400 text-sm">Coming soon</p>
            </div>

            <Link
              href="/authors"
              className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 hover:border-prpm-accent transition-all group"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">👥</div>
              <h3 className="text-lg font-semibold text-white mb-2">Authors</h3>
              <p className="text-gray-400 text-sm">Browse package authors</p>
            </Link>

            <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-6 opacity-50 cursor-not-allowed">
              <div className="text-4xl mb-3">⚙️</div>
              <h3 className="text-lg font-semibold text-white mb-2">Settings</h3>
              <p className="text-gray-400 text-sm">Coming soon</p>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Getting Started with PRPM</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">1. Install the CLI</h3>
              <code className="block bg-prpm-dark border border-prpm-border rounded-lg p-4 text-prpm-accent-light font-mono text-sm">
                npm install -g prpm
              </code>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">2. Search for packages</h3>
              <code className="block bg-prpm-dark border border-prpm-border rounded-lg p-4 text-prpm-accent-light font-mono text-sm">
                prpm search react
              </code>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">3. Install a package</h3>
              <code className="block bg-prpm-dark border border-prpm-border rounded-lg p-4 text-prpm-accent-light font-mono text-sm">
                prpm install @prpm/pulumi-troubleshooting-skill
              </code>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
