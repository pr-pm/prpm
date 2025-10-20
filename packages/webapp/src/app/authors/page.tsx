'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTopAuthors, type Author } from '@/lib/api'

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAuthors()
  }, [])

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

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-prpm-purple mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading top authors...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="text-prpm-purple hover:text-prpm-purple-dark mb-8 inline-block">
            ← Back to home
          </Link>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-2 text-red-700 dark:text-red-300">Error Loading Authors</h2>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-prpm-purple hover:text-prpm-purple-dark mb-6 inline-block">
            ← Back to home
          </Link>

          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-prpm-purple to-prpm-purple-dark bg-clip-text text-transparent">
              Top Authors
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
              The amazing contributors making PRPM possible
            </p>
            <div className="inline-flex items-center gap-6 text-lg">
              <div className="flex items-center gap-2">
                <span className="text-3xl">👥</span>
                <span className="font-semibold">{authors.length} Authors</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl">📦</span>
                <span className="font-semibold">
                  {authors.reduce((sum, a) => sum + a.package_count, 0).toLocaleString()} Packages
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl">⬇️</span>
                <span className="font-semibold">
                  {authors.reduce((sum, a) => sum + (a.total_downloads || 0), 0).toLocaleString()} Downloads
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-prpm-purple to-prpm-purple-dark rounded-lg p-8 mb-12 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Want to Join the Leaderboard?</h2>
          <p className="mb-4 text-purple-100">
            Contribute packages to PRPM and claim your verified author status
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="https://github.com/khaliqgant/prompt-package-manager"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-prpm-purple rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              View on GitHub
            </a>
            <Link
              href="/claim"
              className="px-6 py-3 bg-purple-800 text-white rounded-lg hover:bg-purple-900 transition-colors font-medium border-2 border-white"
            >
              Claim Your Username
            </Link>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-prpm-purple to-prpm-purple-dark text-white px-6 py-4">
            <div className="grid grid-cols-12 gap-4 font-semibold">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4">Author</div>
              <div className="col-span-2 text-center">Packages</div>
              <div className="col-span-3 text-center">Downloads</div>
              <div className="col-span-2 text-center">Status</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {authors.map((author, index) => (
              <div
                key={author.author}
                className={`px-6 py-4 hover:bg-prpm-purple/5 dark:hover:bg-prpm-purple/10 transition-colors ${
                  index < 3 ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                }`}
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Rank */}
                  <div className="col-span-1 text-center">
                    {index === 0 && <span className="text-3xl">🥇</span>}
                    {index === 1 && <span className="text-3xl">🥈</span>}
                    {index === 2 && <span className="text-3xl">🥉</span>}
                    {index > 2 && (
                      <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Author */}
                  <div className="col-span-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">👤</span>
                      <div>
                        <div className="font-semibold text-lg">@{author.author}</div>
                        {author.latest_package && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Latest: {author.latest_package}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Package Count */}
                  <div className="col-span-2 text-center">
                    <div className="text-2xl font-bold text-prpm-purple">
                      {author.package_count}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">packages</div>
                  </div>

                  {/* Downloads */}
                  <div className="col-span-3 text-center">
                    <div className="text-xl font-semibold">
                      {(author.total_downloads || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">total downloads</div>
                  </div>

                  {/* Verified Status */}
                  <div className="col-span-2 text-center">
                    {author.verified ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                        <span>✓</span>
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm">
                        <span>Unclaimed</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Missing from the list? Contribute your packages today!
          </p>
          <Link
            href="/claim"
            className="inline-flex items-center gap-2 text-prpm-purple hover:text-prpm-purple-dark text-lg font-semibold"
          >
            Claim your verified author status →
          </Link>
        </div>
      </div>
    </main>
  )
}
