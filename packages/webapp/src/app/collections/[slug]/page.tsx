import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Collection } from '@pr-pm/types'
import CollapsibleContent from '@/components/CollapsibleContent'

const REGISTRY_URL = process.env.NEXT_PUBLIC_REGISTRY_URL || process.env.REGISTRY_URL || 'https://registry.prpm.dev'
const SSG_TOKEN = process.env.SSG_DATA_TOKEN

// Allow dynamic rendering for params not in generateStaticParams
export const dynamicParams = true

// Generate static params for all collections
export async function generateStaticParams() {
  try {
    // Skip SSG in CI/test builds to speed up builds and avoid hitting registry
    if (process.env.NEXT_PUBLIC_SKIP_SSG === 'true') {
      console.log('[SSG Collections] ⚡ NEXT_PUBLIC_SKIP_SSG=true, returning minimal params for fast build')
      // Return one dummy collection to satisfy Next.js requirements
      return [{
        slug: 'test-collection'
      }]
    }

    console.log(`[SSG Collections] Fetching from registry API: ${REGISTRY_URL}`)
    console.log(`[SSG Collections] Environment check:`, {
      SSG_TOKEN_exists: !!SSG_TOKEN,
      SSG_TOKEN_length: SSG_TOKEN?.length || 0,
      SSG_TOKEN_type: typeof SSG_TOKEN,
      SSG_TOKEN_first_10: SSG_TOKEN?.substring(0, 10) || 'undefined',
      env_keys: Object.keys(process.env).filter(k => k.includes('SSG')).join(', ') || 'none'
    })

    if (!SSG_TOKEN) {
      console.error('[SSG Collections] ⚠️  SSG_DATA_TOKEN environment variable not set')
      console.error('[SSG Collections] This is REQUIRED for production builds.')
      console.error('[SSG Collections] Available env vars:', Object.keys(process.env).filter(k => k.includes('TOKEN')))

      // In static export mode, Next.js requires at least one path for dynamic routes
      // Return empty array would cause: "Page is missing generateStaticParams()" error
      // So we fail explicitly with a clear error message
      throw new Error('SSG_DATA_TOKEN environment variable is required for static build')
    }

    // Paginate through ALL collections
    const allCollections: any[] = []
    const limit = 500
    let offset = 0
    let hasMore = true

    console.log(`[SSG Collections] Starting pagination with limit=${limit}`)

    while (hasMore) {
      const url = `${REGISTRY_URL}/api/v1/collections/ssg-data?limit=${limit}&offset=${offset}`
      console.log(`[SSG Collections] Fetching page: offset=${offset}`)

      const res = await fetch(url, {
        headers: {
          'X-SSG-Token': SSG_TOKEN,
        },
        next: { revalidate: 3600 } // Revalidate every hour
      })

      if (!res.ok) {
        console.error(`[SSG Collections] HTTP ${res.status}: Failed to fetch collections at offset ${offset}`)
        break
      }

      const data = await res.json()
      const collections = data.collections || []

      if (!Array.isArray(collections)) {
        console.error('[SSG Collections] Invalid response format - expected array')
        break
      }

      allCollections.push(...collections)
      hasMore = data.hasMore || false
      offset += limit

      console.log(`[SSG Collections] Page loaded: ${collections.length} collections, total so far: ${allCollections.length}, hasMore: ${hasMore}`)
    }

    console.log(`[SSG Collections] ✅ Loaded ${allCollections.length} collections from registry (${Math.ceil(allCollections.length / limit)} pages)`)

    // Map to slug params
    const params = allCollections.map((collection: any) => ({
      slug: collection.name_slug,
    }))

    console.log(`[SSG Collections] ✅ Complete: ${params.length} collections for static generation`)
    return params

  } catch (error) {
    console.error('[SSG Collections] ERROR in generateStaticParams:', error)
    console.error('[SSG Collections] Error stack:', error instanceof Error ? error.stack : undefined)
    return []
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const collection = await getCollection(params.slug)

  if (!collection) {
    return {
      title: 'Collection Not Found',
      description: 'The requested collection could not be found.',
    }
  }

  // Use name for human-readable display, fall back to name_slug
  const displayName = collection.name || collection.name_slug;

  return {
    title: `${displayName} - PRPM Collection`,
    description: collection.description || `Install ${displayName} collection with PRPM - curated package collection`,
    keywords: [...(collection.tags || []), collection.category, collection.framework, 'prpm', 'collection', 'ai', 'coding'].filter((k): k is string => Boolean(k)),
    openGraph: {
      title: displayName,
      description: collection.description || 'Curated package collection',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      site: '@prpmdev',
      title: displayName,
      description: collection.description || 'Curated package collection',
    },
  }
}

async function getCollection(slug: string): Promise<Collection | null> {
  try {
    if (!SSG_TOKEN) {
      console.error('SSG_DATA_TOKEN environment variable not set')
      return null
    }

    const url = `${REGISTRY_URL}/api/v1/collections/ssg-data`
    const res = await fetch(url, {
      headers: {
        'X-SSG-Token': SSG_TOKEN,
      },
      next: { revalidate: 3600 } // Revalidate every hour
    })

    if (!res.ok) {
      console.error(`Error fetching collections from registry: ${res.status}`)
      return null
    }

    const data = await res.json()
    const collections = data.collections || []

    if (!Array.isArray(collections)) {
      console.error('Invalid collections data format from registry')
      return null
    }

    // Find the collection by slug
    const collection = collections.find((c: any) => c.name_slug === slug)
    return collection || null
  } catch (error) {
    console.error('Error fetching collection:', error)
    return null
  }
}

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const collection = await getCollection(params.slug)

  if (!collection) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-prpm-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-prpm-accent">Home</Link>
          {' / '}
          <Link href="/search?tab=collections" className="hover:text-prpm-accent">Collections</Link>
          {' / '}
          <span className="text-white">{collection.name_slug}</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl font-bold text-white">{collection.name || collection.name_slug}</h1>
            {collection.verified && (
              <svg className="w-8 h-8 text-prpm-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {collection.official && (
              <span className="px-3 py-1 bg-prpm-accent/20 text-prpm-accent text-sm rounded-full">
                Official
              </span>
            )}
          </div>

          {collection.description && (
            <p className="text-xl text-gray-300 mb-4">{collection.description}</p>
          )}

          {/* Install Command */}
          <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4 mb-6">
            <code className="text-prpm-accent-light text-lg">prpm install {collection.name_slug}</code>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 text-gray-400">
            {/* Author - positioned first to match package page */}
            {collection.author && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <Link href={`/authors?username=${collection.author}`} className="hover:text-prpm-accent">
                  @{collection.author}
                </Link>
              </div>
            )}
            {collection.downloads != null && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>{collection.downloads.toLocaleString()} total installs</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>{collection.package_count} packages</span>
            </div>
            {collection.stars != null && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span>{collection.stars} stars</span>
              </div>
            )}
          </div>
        </div>

        {/* Packages in Collection */}
        {collection.packages && collection.packages.length > 0 && (
          <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">📦 Packages ({collection.packages.length})</h2>
            <div className="space-y-6">
              {collection.packages
                .sort((a, b) => (a.installOrder || 999) - (b.installOrder || 999))
                .map((pkg, index) => (
                <div
                  key={pkg.packageId}
                  className="bg-prpm-dark border border-prpm-border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-500 text-sm font-mono">#{index + 1}</span>
                        <h3 className="text-lg font-semibold text-white">
                          {(pkg as any).packageName || pkg.packageId}
                        </h3>
                        {pkg.required && (
                          <span className="px-2 py-0.5 bg-prpm-accent/20 text-prpm-accent text-xs rounded-full">
                            Required
                          </span>
                        )}
                        {!pkg.required && (
                          <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                            Optional
                          </span>
                        )}
                      </div>
                      {(pkg as any).package?.description && (
                        <p className="text-gray-400 text-sm mb-2">{(pkg as any).package.description}</p>
                      )}
                      {pkg.reason && (
                        <div className="bg-prpm-dark/50 border border-prpm-border rounded p-3 mb-2">
                          <p className="text-gray-300 text-sm">
                            <span className="font-semibold text-prpm-accent">Why included:</span> {pkg.reason}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>Version: {pkg.version || 'latest'}</span>
                        {pkg.formatOverride && (
                          <span className="px-2 py-0.5 bg-prpm-dark border border-prpm-border rounded">
                            Format: {pkg.formatOverride}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      {(pkg as any).packageName && (
                        <Link
                          href={`/packages/${(pkg as any).packageName.replace('@', '').replace('/', '/')}`}
                          className="px-3 py-1.5 bg-prpm-dark border border-prpm-border hover:border-prpm-accent rounded text-sm transition-colors whitespace-nowrap"
                        >
                          View Details →
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Full prompt content - Collapsible */}
                  {(pkg as any).fullContent && (
                    <div className="mt-4 border-t border-prpm-border pt-4">
                      <CollapsibleContent title="📄 Full Prompt Content" defaultOpen={false}>
                        <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4 overflow-x-auto">
                          <pre className="text-sm text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                            <code>{(pkg as any).fullContent}</code>
                          </pre>
                        </div>
                      </CollapsibleContent>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Collection Info</h2>
            <dl className="space-y-3">
              {collection.scope && (
                <div>
                  <dt className="text-sm text-gray-400">Scope</dt>
                  <dd className="text-white font-mono">{collection.scope}</dd>
                </div>
              )}
              {collection.category && (
                <div>
                  <dt className="text-sm text-gray-400">Category</dt>
                  <dd className="text-white">{collection.category}</dd>
                </div>
              )}
              {collection.framework && (
                <div>
                  <dt className="text-sm text-gray-400">Framework</dt>
                  <dd className="text-white">{collection.framework}</dd>
                </div>
              )}
              {collection.version && (
                <div>
                  <dt className="text-sm text-gray-400">Version</dt>
                  <dd className="text-white font-mono">{collection.version}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Links</h2>
            <dl className="space-y-3">
              {(collection as any).repository_url && (
                <div>
                  <dt className="text-sm text-gray-400">Repository</dt>
                  <dd>
                    <a
                      href={(collection as any).repository_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-prpm-accent hover:text-prpm-accent-light break-all"
                    >
                      {(collection as any).repository_url}
                    </a>
                  </dd>
                </div>
              )}
              {(collection as any).homepage_url && (
                <div>
                  <dt className="text-sm text-gray-400">Homepage</dt>
                  <dd>
                    <a
                      href={(collection as any).homepage_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-prpm-accent hover:text-prpm-accent-light break-all"
                    >
                      {(collection as any).homepage_url}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Tags */}
        {collection.tags && collection.tags.length > 0 && (
          <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {collection.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?tab=collections&tags=${tag}`}
                  className="px-3 py-1 bg-prpm-dark border border-prpm-border rounded-full text-sm text-gray-300 hover:border-prpm-accent hover:text-white transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Explore More */}
        <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Explore More</h2>
          <div className="space-y-2">
            {collection.category && (
              <Link
                href={`/search?tab=collections&category=${collection.category}`}
                className="block text-prpm-accent hover:text-prpm-accent-light"
              >
                More {collection.category} collections →
              </Link>
            )}
            {collection.framework && (
              <Link
                href={`/search?tab=collections&framework=${collection.framework}`}
                className="block text-prpm-accent hover:text-prpm-accent-light"
              >
                More {collection.framework} collections →
              </Link>
            )}
            <Link
              href="/search?tab=collections"
              className="block text-prpm-accent hover:text-prpm-accent-light"
            >
              Browse all collections →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
