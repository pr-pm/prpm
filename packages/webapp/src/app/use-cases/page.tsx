'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import BackLink from '@/components/BackLink'
import { getUseCases } from '@/lib/api'
import type { UseCaseWithPackages } from '@/lib/api'
import { Lightbulb, ChevronRight } from 'lucide-react'

export default function UseCasesPage() {
  const [useCases, setUseCases] = useState<UseCaseWithPackages[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUseCases() {
      try {
        const result = await getUseCases(true)
        setUseCases(result.use_cases)
      } catch (error) {
        console.error('Failed to load use cases:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUseCases()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-prpm-dark">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-prpm-accent"></div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-prpm-dark">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-12">
          <BackLink href="/">Back to Home</BackLink>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent mb-4">
            Browse by Use Case
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl">
            Find packages organized by what you're trying to accomplish
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {useCases.map((useCase) => (
            <div
              key={useCase.id}
              className="group bg-prpm-dark-card border-2 border-prpm-border/50 rounded-2xl hover:border-prpm-accent/40 transition-all duration-300 hover:shadow-2xl hover:shadow-prpm-accent/5 overflow-hidden"
            >
              <div className="relative p-8">
                {/* Background gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-prpm-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative">
                  {/* Use Case Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-prpm-accent/20 via-prpm-accent/10 to-transparent rounded-xl flex items-center justify-center shadow-lg shadow-prpm-accent/10 ring-1 ring-prpm-accent/10 group-hover:ring-prpm-accent/20 group-hover:shadow-prpm-accent/20 transition-all flex-shrink-0">
                      <Lightbulb className="w-6 h-6 text-prpm-accent" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/search?use_case=${useCase.slug}`}
                        className="group/link block"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-white group-hover/link:text-prpm-accent transition-colors">
                            {useCase.name}
                          </h3>
                          <ChevronRight className="w-6 h-6 text-gray-600 group-hover/link:text-prpm-accent group-hover/link:translate-x-1 transition-all flex-shrink-0" />
                        </div>
                        {useCase.package_count !== undefined && useCase.package_count > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-prpm-accent/15 text-prpm-accent border border-prpm-accent/30 rounded-lg shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            {useCase.package_count} {useCase.package_count === 1 ? 'package' : 'packages'}
                          </span>
                        )}
                      </Link>
                    </div>
                  </div>

                  {/* Description */}
                  {useCase.description && (
                    <p className="text-gray-400 leading-relaxed mb-4">
                      {useCase.description}
                    </p>
                  )}

                  {/* Package Count */}
                  {useCase.package_count && useCase.package_count > 0 && (
                    <div className="mt-6 pt-6 border-t border-prpm-border/30">
                      <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        {useCase.package_count} {useCase.package_count === 1 ? 'Package' : 'Packages'} Available
                      </div>
                      {/* Commented out package listing code since packages property doesn't exist
                      <div className="space-y-2">
                        {useCase.packages.slice(0, 3).map((pkg: any) => (
                          <Link
                            key={pkg.id}
                            href={`/packages/${pkg.name}`}
                            className="group/pkg flex items-center gap-3 p-3 rounded-xl bg-prpm-dark/40 hover:bg-prpm-dark/80 border border-prpm-border/30 hover:border-prpm-accent/40 transition-all hover:shadow-lg hover:shadow-prpm-accent/5"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-200 group-hover/pkg:text-white transition-colors truncate">
                                {pkg.name}
                              </div>
                              {pkg.description && (
                                <p className="text-xs text-gray-500 group-hover/pkg:text-gray-400 transition-colors line-clamp-1 mt-0.5">
                                  {pkg.description}
                                </p>
                              )}
                            </div>
                            {pkg.quality_score && (
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-3 h-3 ${i < Math.round(pkg.quality_score!) ? 'text-yellow-400' : 'text-gray-700'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            )}
                            <svg className="w-4 h-4 text-gray-600 group-hover/pkg:text-prpm-accent group-hover/pkg:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        ))}
                      </div>
                      {useCase.packages.length > 3 && (
                        <Link
                          href={`/search?use_case=${useCase.slug}`}
                          className="block mt-3 text-center text-sm text-prpm-accent hover:text-prpm-accent-light font-medium"
                        >
                          View all {useCase.packages.length} packages →
                        </Link>
                      )}
                      */}
                    </div>
                  )}

                  {/* Example Query */}
                  {useCase.example_query && (
                    <div className="mt-6 pt-6 border-t border-prpm-border/30">
                      <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Example search:</p>
                      <p className="text-sm text-gray-300 italic bg-prpm-dark/50 px-3 py-2 rounded-lg border border-prpm-border/30">
                        "{useCase.example_query}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {useCases.length === 0 && !loading && (
          <div className="text-center py-20">
            <Lightbulb className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No use cases available yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Use cases will appear here once the taxonomy is generated
            </p>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-500/30 rounded-lg p-8 text-center">
          <Lightbulb className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Can't find what you're looking for?
          </h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Try our AI-powered search to find packages using natural language.
            Describe what you want to build, and we'll find the perfect packages for you.
          </p>
          <Link
            href="/search"
            className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
          >
            Try AI Search
          </Link>
        </div>
      </div>
    </main>
  )
}
