import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Collection } from '@pr-pm/types'

const REGISTRY_URL = process.env.NEXT_PUBLIC_REGISTRY_URL || process.env.REGISTRY_URL || 'https://registry.prpm.dev'

// Only generate paths returned by generateStaticParams
export const dynamicParams = false

// Generate static params for all collections
export async function generateStaticParams() {
  // During CI or when SEO endpoints don't exist yet, return empty array
  // to allow build to succeed. The full static generation happens in deployment.
  if (process.env.CI === 'true' || process.env.SKIP_SSG === 'true') {
    console.log('[SSG Collections] Skipping static generation (CI or SKIP_SSG enabled)')
    return []
  }

  try {
    const allCollections: string[] = []
    let offset = 0
    const limit = 100
    let hasMore = true

    console.log(`[SSG Collections] Starting - REGISTRY_URL: ${REGISTRY_URL}`)
    console.log(`[SSG Collections] Environment check:`, {
      NEXT_PUBLIC_REGISTRY_URL: process.env.NEXT_PUBLIC_REGISTRY_URL,
      REGISTRY_URL: process.env.REGISTRY_URL,
      NODE_ENV: process.env.NODE_ENV
    })

    // Paginate through all collections
    while (hasMore) {
      const url = `${REGISTRY_URL}/api/v1/search/seo/collections?limit=${limit}&offset=${offset}`
      console.log(`[SSG Collections] Attempting fetch: ${url}`)

      try {
        const res = await fetch(url, {
          next: { revalidate: 3600 } // Revalidate every hour
        })

        console.log(`[SSG Collections] Response status: ${res.status} ${res.statusText}`)

        if (!res.ok) {
          console.error(`[SSG Collections] HTTP ${res.status}: Failed to fetch collections`)
          console.error(`[SSG Collections] Response headers:`, Object.fromEntries(res.headers.entries()))
          break
        }

        const data = await res.json()
        console.log(`[SSG Collections] Received data with ${data.collections?.length || 0} collections`)

        if (!data.collections || !Array.isArray(data.collections)) {
          console.error('[SSG Collections] Invalid response format:', data)
          break
        }

        allCollections.push(...data.collections)
        hasMore = data.hasMore
        offset += limit

        console.log(`[SSG Collections] Progress: ${allCollections.length} collections fetched`)
      } catch (fetchError) {
        console.error('[SSG Collections] Fetch error:', fetchError)
        console.error('[SSG Collections] Error details:', {
          message: fetchError instanceof Error ? fetchError.message : String(fetchError),
          stack: fetchError instanceof Error ? fetchError.stack : undefined
        })
        break
      }
    }

    console.log(`[SSG Collections] ✅ Complete: ${allCollections.length} collections for static generation`)

    // ALWAYS return an array, even if empty
    const params = allCollections.map((slug) => ({
      slug: encodeURIComponent(slug),
    }))

    console.log(`[SSG Collections] Returning ${params.length} params`)
    return params

  } catch (outerError) {
    // Catch any unexpected errors and log them
    console.error('[SSG Collections] CRITICAL ERROR in generateStaticParams:', outerError)
    console.error('[SSG Collections] Error stack:', outerError instanceof Error ? outerError.stack : undefined)

    // Return empty array to prevent build failure
    console.log('[SSG Collections] Returning empty array due to error')
    return []
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const decodedSlug = decodeURIComponent(params.slug)

  try {
    // Collections use scope/name_slug format, we need to split it
    const parts = decodedSlug.split('/')
    const scope = parts[0] || '@prpm'
    const name = parts.slice(1).join('/') || decodedSlug

    const res = await fetch(`${REGISTRY_URL}/api/v1/collections/${scope}/${name}`, {
      next: { revalidate: 3600 }
    })

    if (!res.ok) {
      return {
        title: 'Collection Not Found',
        description: 'The requested collection could not be found.',
      }
    }

    const collection: Collection = await res.json()

    return {
      title: `${collection.name_slug} - PRPM Collection`,
      description: collection.description || `Install ${collection.name_slug} collection with PRPM - curated package collection`,
      keywords: [...(collection.tags || []), collection.category, collection.framework, 'prpm', 'collection', 'ai', 'coding'].filter((k): k is string => Boolean(k)),
      openGraph: {
        title: collection.name_slug,
        description: collection.description || 'Curated package collection',
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: collection.name_slug,
        description: collection.description || 'Curated package collection',
      },
    }
  } catch (error) {
    return {
      title: 'Collection Error',
      description: 'Error loading collection details.',
    }
  }
}

async function getCollection(slug: string): Promise<Collection | null> {
  try {
    // Collections use scope/name_slug format
    const parts = slug.split('/')
    const scope = parts[0] || '@prpm'
    const name = parts.slice(1).join('/') || slug

    const res = await fetch(`${REGISTRY_URL}/api/v1/collections/${scope}/${name}`, {
      next: { revalidate: 3600 } // Revalidate every hour
    })

    if (!res.ok) return null

    return res.json()
  } catch (error) {
    console.error('Error fetching collection:', error)
    return null
  }
}

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const decodedSlug = decodeURIComponent(params.slug)
  const collection = await getCollection(decodedSlug)

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
            <h1 className="text-4xl font-bold text-white">{collection.name_slug}</h1>
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
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>{collection.package_count} packages</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span>{collection.downloads.toLocaleString()} installs</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span>{collection.stars} stars</span>
            </div>
            {collection.author && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <Link href={`/authors?author=${collection.author}`} className="hover:text-prpm-accent">
                  @{collection.author}
                </Link>
              </div>
            )}
          </div>
        </div>

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
