'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCategories, CategoryListResponse, CategoryWithChildren } from '@/lib/api'
import * as LucideIcons from 'lucide-react'

type Category = CategoryWithChildren

// Map icon names to Lucide React components
const getIconComponent = (iconName?: string | null) => {
  if (!iconName) return null

  // Convert kebab-case to PascalCase (e.g., 'check-circle' -> 'CheckCircle')
  const pascalCase = iconName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

  // Get the icon component from lucide-react
  const IconComponent = (LucideIcons as any)[pascalCase]
  return IconComponent || null
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        // Fetch ALL categories with counts (no top limit for full browse page)
        const data = await getCategories(true) // include_counts = true, no limit
        setCategories(data.categories || [])

        // Auto-expand all top-level categories by default
        const topLevelSlugs = (data.categories || []).map((cat: Category) => cat.slug)
        setExpandedCategories(new Set(topLevelSlugs))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load categories')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const toggleCategory = (slug: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(slug)) {
        next.delete(slug)
      } else {
        next.add(slug)
      }
      return next
    })
  }

  const renderCategory = (category: Category, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.slug)
    const hasChildren = category.children && category.children.length > 0

    // Top-level categories - render as cards
    if (level === 0) {
      return (
        <div key={category.slug} className="group relative bg-prpm-dark-card border-2 border-prpm-border/50 rounded-2xl hover:border-prpm-accent/40 transition-all duration-300 hover:shadow-2xl hover:shadow-prpm-accent/5 overflow-hidden">
          {/* Background gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-prpm-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <div className="relative p-8">
            {/* Category Header */}
            <div className="flex items-start gap-5">
              {/* Icon */}
              {category.icon && (() => {
                const IconComponent = getIconComponent(category.icon)
                return IconComponent ? (
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-prpm-accent/20 via-prpm-accent/10 to-transparent rounded-xl flex items-center justify-center shadow-lg shadow-prpm-accent/10 ring-1 ring-prpm-accent/10 group-hover:ring-prpm-accent/20 group-hover:shadow-prpm-accent/20 transition-all">
                    <IconComponent className="w-7 h-7 text-prpm-accent" strokeWidth={2} />
                  </div>
                ) : null
              })()}

              <div className="flex-1 min-w-0">
                <Link
                  href={`/search?category=${category.slug}`}
                  className="group/link block"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-white group-hover/link:text-prpm-accent transition-colors">
                      {category.name}
                    </h3>
                    <svg className="w-6 h-6 text-gray-600 group-hover/link:text-prpm-accent group-hover/link:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    {category.package_count !== undefined && category.package_count > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-prpm-accent/15 text-prpm-accent border border-prpm-accent/30 rounded-lg shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        {category.package_count} {category.package_count === 1 ? 'package' : 'packages'}
                      </span>
                    )}
                    {hasChildren && (
                      <span className="text-xs text-gray-500 font-medium">
                        {category.children!.length} {category.children!.length === 1 ? 'tag' : 'tags'}
                      </span>
                    )}
                  </div>
                  {category.description && (
                    <p className="text-base text-gray-400 leading-relaxed">
                      {category.description}
                    </p>
                  )}
                </Link>
              </div>

              {/* Expand/collapse button */}
              {hasChildren && (
                <button
                  onClick={() => toggleCategory(category.slug)}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-prpm-border/40 hover:bg-prpm-accent/20 hover:text-prpm-accent transition-all text-gray-400 ring-1 ring-prpm-border/50 hover:ring-prpm-accent/30"
                  title={isExpanded ? 'Hide tags' : 'Show tags'}
                >
                  <svg
                    className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Children/Tags */}
            {hasChildren && isExpanded && (
              <div className="mt-6 pt-6 border-t border-prpm-border/30">
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Related Tags
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {category.children!.map(child => (
                    <Link
                      key={child.slug}
                      href={`/search?tags=${child.slug}`}
                      className="group/tag flex items-center gap-3 p-4 rounded-xl bg-prpm-dark/40 hover:bg-prpm-dark/80 border border-prpm-border/30 hover:border-prpm-accent/40 transition-all hover:shadow-lg hover:shadow-prpm-accent/5"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-200 group-hover/tag:text-white transition-colors">
                            {child.name}
                          </span>
                        </div>
                        {child.description && (
                          <p className="text-xs text-gray-500 group-hover/tag:text-gray-400 transition-colors line-clamp-2">
                            {child.description}
                          </p>
                        )}
                      </div>
                      {child.package_count !== undefined && child.package_count > 0 && (
                        <span className="flex-shrink-0 text-xs text-gray-500 group-hover/tag:text-prpm-accent font-bold transition-colors px-2 py-1 bg-prpm-card/50 rounded">
                          {child.package_count}
                        </span>
                      )}
                      <svg className="flex-shrink-0 w-4 h-4 text-gray-600 group-hover/tag:text-prpm-accent group-hover/tag:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    // This shouldn't render since we only show top-level categories now
    return null
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4">
        <div className="animate-pulse">
          <div className="h-10 bg-prpm-card rounded-lg w-80 mb-3"></div>
          <div className="h-6 bg-prpm-card rounded-lg w-96 mb-12"></div>
          <div className="grid gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-48 bg-gradient-to-br from-prpm-card to-prpm-card/50 rounded-xl border border-prpm-border"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4">
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-900/20 border border-red-500/30 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Error Loading Categories</h2>
          <p className="text-gray-400 max-w-md mx-auto">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 md:py-16 px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent mb-4">
            Browse Categories
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Explore packages organized by category. Click any category to view packages, or expand to see related tags.
          </p>
        </div>

        {/* Categories */}
        {categories.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-prpm-card rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg font-medium">No categories available yet.</p>
            <p className="text-gray-500 text-sm mt-2">Categories will appear here once packages are organized.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {categories.map(category => renderCategory(category, 0))}
          </div>
        )}

        {/* Help text */}
        {categories.length > 0 && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-prpm-card/50 border border-prpm-border rounded-full text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Click the expand button to view tags, or click category names to browse packages</span>
            </div>
          </div>
        )}
    </div>
  )
}
