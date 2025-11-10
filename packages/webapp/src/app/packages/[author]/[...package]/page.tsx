import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { PackageInfo } from '@pr-pm/types'
import CopyInstallCommand from '@/components/CopyInstallCommand'
import SharedResults from '@/components/SharedResults'
import SuggestedTestInputs from '@/components/SuggestedTestInputs'
import FeaturedResults from '@/components/FeaturedResults'
import CollapsibleContent from '@/components/CollapsibleContent'
import LatestVersionBadge from '@/components/LatestVersionBadge'
import DynamicPackageContent from '@/components/DynamicPackageContent'

const REGISTRY_URL = process.env.NEXT_PUBLIC_REGISTRY_URL || process.env.REGISTRY_URL || 'https://registry.prpm.dev'
const SSG_TOKEN = process.env.SSG_DATA_TOKEN

// Allow dynamic rendering for params not in generateStaticParams
export const dynamicParams = true

// Helper to get package content - prefer full content, fall back to snippet
function getPackageContent(pkg: any): string | null {
  // Try fullContent (camelCase from SSG), full_content (snake_case from direct API), then snippet
  return pkg.fullContent || pkg.full_content || pkg.snippet || null
}

// Generate static params for all packages
export async function generateStaticParams() {
  try {
    console.log(`[SSG Packages] Fetching from registry API: ${REGISTRY_URL}`)
    console.log(`[SSG Packages] Environment check:`, {
      SSG_TOKEN_exists: !!SSG_TOKEN,
      SSG_TOKEN_length: SSG_TOKEN?.length || 0,
      SSG_TOKEN_type: typeof SSG_TOKEN,
      SSG_TOKEN_first_10: SSG_TOKEN?.substring(0, 10) || 'undefined',
      env_keys: Object.keys(process.env).filter(k => k.includes('SSG')).join(', ') || 'none'
    })

    if (!SSG_TOKEN) {
      console.error('[SSG Packages] ⚠️  SSG_DATA_TOKEN environment variable not set')
      console.error('[SSG Packages] This is REQUIRED for production builds.')
      console.error('[SSG Packages] Available env vars:', Object.keys(process.env).filter(k => k.includes('TOKEN')))

      // In static export mode, Next.js requires at least one path for dynamic routes
      // Return empty array would cause: "Page is missing generateStaticParams()" error
      // So we fail explicitly with a clear error message
      throw new Error('SSG_DATA_TOKEN environment variable is required for static build')
    }

    // Paginate through ALL packages
    const allPackages: any[] = []
    const limit = 500
    let offset = 0
    let hasMore = true

    console.log(`[SSG Packages] Starting pagination with limit=${limit}`)

    while (hasMore) {
      const url = `${REGISTRY_URL}/api/v1/packages/ssg-data?limit=${limit}&offset=${offset}`
      console.log(`[SSG Packages] Fetching page: offset=${offset}`)

      const res = await fetch(url, {
        headers: {
          'X-SSG-Token': SSG_TOKEN,
        },
        next: { revalidate: 3600 } // Revalidate every hour
      })

      if (!res.ok) {
        console.error(`[SSG Packages] HTTP ${res.status}: Failed to fetch packages at offset ${offset}`)
        break
      }

      const data = await res.json()
      const packages = data.packages || []

      if (!Array.isArray(packages)) {
        console.error('[SSG Packages] Invalid response format - expected array')
        break
      }

      allPackages.push(...packages)
      hasMore = data.hasMore || false
      offset += limit

      console.log(`[SSG Packages] Page loaded: ${packages.length} packages, total so far: ${allPackages.length}, hasMore: ${hasMore}`)
    }

    console.log(`[SSG Packages] ✅ Loaded ${allPackages.length} packages from registry (${Math.ceil(allPackages.length / limit)} pages)`)

    // Transform package data to author/package format
    const params = allPackages.map((pkg: any) => {
      const name = pkg.name
      if (name.startsWith('@')) {
        // Scoped package: @author/package/sub/path -> author + [package, sub, path]
        const withoutAt = name.substring(1) // Remove @
        const [author, ...packageParts] = withoutAt.split('/')
        return {
          author: author.toLowerCase(), // Use lowercase for consistent URLs
          package: packageParts, // Array for catch-all route
        }
      } else {
        // Unscoped package: use actual author from package data (lowercase for consistent URLs)
        const author = (pkg.author?.username || 'prpm').toLowerCase()
        return {
          author,
          package: [name], // Array for catch-all route
        }
      }
    })

    console.log(`[SSG Packages] ✅ Complete: ${params.length} packages for static generation`)
    return params

  } catch (error) {
    console.error('[SSG Packages] ERROR in generateStaticParams:', error)
    console.error('[SSG Packages] Error stack:', error instanceof Error ? error.stack : undefined)
    return []
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { author: string; package: string[] } }): Promise<Metadata> {
  // Reconstruct full package name: author/[package, parts] -> @author/package/parts
  const packagePath = Array.isArray(params.package) ? params.package.join('/') : params.package
  const scopedName = `@${params.author}/${packagePath}`
  const unscopedName = packagePath // without @ prefix

  const pkg = await getPackage(scopedName, params.author, unscopedName)

  if (!pkg) {
    return {
      title: 'Package Not Found',
      description: 'The requested package could not be found.',
    }
  }

  const displayTitle = pkg.display_name || pkg.name

  return {
    title: `${displayTitle} - PRPM Package`,
    description: pkg.description || `Install ${displayTitle} with PRPM - ${pkg.format} ${pkg.subtype} for your AI coding workflow`,
    keywords: [...(pkg.tags || []), pkg.format, pkg.subtype, pkg.category, 'prpm', 'ai', 'coding'].filter((k): k is string => Boolean(k)),
    openGraph: {
      title: displayTitle,
      description: pkg.description || `${pkg.format} ${pkg.subtype} package`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: displayTitle,
      description: pkg.description || `${pkg.format} ${pkg.subtype} package`,
    },
  }
}

async function getPackage(scopedName: string, author: string, unscopedName: string): Promise<PackageInfo | null> {
  try {
    // First try to find in SSG data (top 500 most downloaded packages)
    if (SSG_TOKEN) {
      const url = `${REGISTRY_URL}/api/v1/packages/ssg-data`
      const res = await fetch(url, {
        headers: {
          'X-SSG-Token': SSG_TOKEN,
        },
        next: { revalidate: 3600 } // Revalidate every hour
      })

      if (res.ok) {
        const data = await res.json()
        const packages = data.packages || []

        if (Array.isArray(packages)) {
          // Find the package by name (try scoped first, then unscoped with author match)
          // Use case-insensitive comparison for scoped names since author can vary in case
          let pkg = packages.find((p: any) => p.name.toLowerCase() === scopedName.toLowerCase())

          // If not found by scoped name, try unscoped name with case-insensitive author match
          if (!pkg) {
            pkg = packages.find((p: any) =>
              p.name === unscopedName && p.author?.username?.toLowerCase() === author.toLowerCase()
            )
          }

          if (pkg) {
            return pkg
          }
        }
      }
    }

    // Fallback: Package not in SSG data (outside top 500), fetch directly from registry
    console.log(`[Package] Not in SSG data, fetching ${scopedName} directly from registry`)

    // Try fetching by scoped name first
    let directUrl = `${REGISTRY_URL}/api/v1/packages/${encodeURIComponent(scopedName)}`
    let directRes = await fetch(directUrl, {
      next: { revalidate: 3600 }
    })

    if (!directRes.ok && directRes.status === 404) {
      // Try unscoped name
      directUrl = `${REGISTRY_URL}/api/v1/packages/${encodeURIComponent(unscopedName)}`
      directRes = await fetch(directUrl, {
        next: { revalidate: 3600 }
      })
    }

    if (directRes.ok) {
      const packageData = await directRes.json()
      return packageData
    }

    return null
  } catch (error) {
    console.error('Error fetching package:', error)
    return null
  }
}

export default async function PackagePage({ params }: { params: { author: string; package: string[] } }) {
  // Reconstruct full package name: author/[package, parts] -> @author/package/parts
  const packagePath = Array.isArray(params.package) ? params.package.join('/') : params.package
  const scopedName = `@${params.author}/${packagePath}`
  const unscopedName = packagePath // without @ prefix
  const pkg = await getPackage(scopedName, params.author, unscopedName)

  if (!pkg) {
    notFound()
  }

  const content = getPackageContent(pkg)

  return (
    <main className="min-h-screen bg-prpm-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-prpm-accent">Home</Link>
          {' / '}
          <Link href="/search" className="hover:text-prpm-accent">Packages</Link>
          {' / '}
          <span className="text-white">{pkg.name}</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl font-bold text-white">{pkg.display_name || pkg.name}</h1>
            {pkg.verified && (
              <svg className="w-8 h-8 text-prpm-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {pkg.featured && (
              <span className="px-3 py-1 bg-prpm-green/20 text-prpm-green text-sm rounded-full">
                Featured
              </span>
            )}
            {pkg.deprecated && (
              <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-full">
                Deprecated
              </span>
            )}
          </div>
          {pkg.display_name && (
            <p className="text-sm text-gray-500 mb-2 font-mono">{pkg.name}</p>
          )}

          {/* Dynamic Version Badge - fetches fresh data */}
          <div className="mb-3">
            <LatestVersionBadge
              packageId={pkg.name}
              fallbackVersion={pkg.latest_version?.version}
              fallbackDate={pkg.latest_version?.published_at ? String(pkg.latest_version.published_at) : undefined}
            />
          </div>

          {pkg.description && (
            <p className="text-xl text-gray-300 mb-4">{pkg.description}</p>
          )}

          {pkg.deprecated_reason && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-400"><strong>Deprecation Notice:</strong> {pkg.deprecated_reason}</p>
            </div>
          )}

          {/* Install Command */}
          <CopyInstallCommand packageName={pkg.name} />

          {/* Playground CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Link
              href={`/playground?package=${pkg.id}${content ? `&input=${encodeURIComponent(content)}` : ''}`}
              className="flex-1 px-4 py-3 bg-prpm-accent hover:bg-prpm-accent/80 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Test in Playground
            </Link>
            <Link
              href={`/playground?package=${pkg.id}&compare=true${content ? `&input=${encodeURIComponent(content)}` : ''}`}
              className="px-4 py-3 bg-prpm-dark-card hover:bg-prpm-dark border border-prpm-border hover:border-prpm-accent text-gray-300 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Compare vs No Prompt
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 text-gray-400 mb-8">
            {(pkg.author as any)?.username && (
              <div className="flex items-center gap-2">
                {(pkg.author as any)?.avatar_url ? (
                  <img
                    src={(pkg.author as any).avatar_url}
                    alt={`${(pkg.author as any).username}'s avatar`}
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
                <Link href={`/authors?username=${(pkg.author as any).username}`} className="hover:text-prpm-accent">
                  @{(pkg.author as any).username}
                </Link>
              </div>
            )}
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span>{pkg.total_downloads.toLocaleString()} total downloads</span>
            </div>
            {pkg.weekly_downloads > 0 && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>{pkg.weekly_downloads.toLocaleString()} this week</span>
              </div>
            )}
            {(pkg.organization as any)?.name && (
              <div className="flex items-center gap-2">
                {(pkg.organization as any)?.avatar_url ? (
                  <img
                    src={(pkg.organization as any).avatar_url}
                    alt={`${(pkg.organization as any).name}'s avatar`}
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )}
                <Link href={`/organizations/${(pkg.organization as any).name}`} className="hover:text-prpm-accent">
                  {(pkg.organization as any).name}
                  {(pkg.organization as any).is_verified && (
                    <svg className="inline-block w-4 h-4 ml-1 text-prpm-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Suggested Test Inputs */}
        <div className="mb-8">
          <SuggestedTestInputs packageId={pkg.id} />
        </div>

        {/* Full Package Content - Collapsible with Dynamic Hydration */}
        {content && (
          <CollapsibleContent title="📄 Full Prompt Content" defaultOpen={false}>
            <DynamicPackageContent packageName={pkg.name} fallbackContent={content} />
          </CollapsibleContent>
        )}

        {/* Featured Results (author curated) */}
        <div className="mb-8">
          <FeaturedResults packageId={pkg.id} />
        </div>

        {/* Shared Test Results */}
        <div className="mb-8">
          <SharedResults packageId={pkg.id} limit={5} />
        </div>

        {/* README */}
        {pkg.readme && (
          <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">📖 README</h2>
            <div className="prose prose-invert prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: pkg.readme }} />
            </div>
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">📦 Package Info</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-400">Format</dt>
                <dd className="text-white font-mono">{pkg.format}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-400">Type</dt>
                <dd className="text-white font-mono">{pkg.subtype}</dd>
              </div>
              {pkg.category && (
                <div>
                  <dt className="text-sm text-gray-400">Category</dt>
                  <dd className="text-white">{pkg.category}</dd>
                </div>
              )}
              {pkg.license && (
                <div>
                  <dt className="text-sm text-gray-400">License</dt>
                  <dd className="text-white">
                    <span className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-sm">
                      {pkg.license}
                    </span>
                  </dd>
                </div>
              )}
              {pkg.latest_version?.version && (
                <div>
                  <dt className="text-sm text-gray-400">Latest Version</dt>
                  <dd className="text-white font-mono">{pkg.latest_version.version}</dd>
                </div>
              )}
              {pkg.version_count > 0 && (
                <div>
                  <dt className="text-sm text-gray-400">Total Versions</dt>
                  <dd className="text-white">{pkg.version_count}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">🔗 Links</h2>
            <dl className="space-y-3">
              {pkg.repository_url && (
                <div>
                  <dt className="text-sm text-gray-400">Repository</dt>
                  <dd>
                    <a
                      href={pkg.repository_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-prpm-accent hover:text-prpm-accent-light break-all"
                    >
                      {pkg.repository_url}
                    </a>
                  </dd>
                </div>
              )}
              {pkg.homepage_url && (
                <div>
                  <dt className="text-sm text-gray-400">Homepage</dt>
                  <dd>
                    <a
                      href={pkg.homepage_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-prpm-accent hover:text-prpm-accent-light break-all"
                    >
                      {pkg.homepage_url}
                    </a>
                  </dd>
                </div>
              )}
              {pkg.documentation_url && (
                <div>
                  <dt className="text-sm text-gray-400">Documentation</dt>
                  <dd>
                    <a
                      href={pkg.documentation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-prpm-accent hover:text-prpm-accent-light break-all"
                    >
                      {pkg.documentation_url}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Version Info */}
        {pkg.latest_version && (
          <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">📋 Latest Version Details</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-400">Version</dt>
                <dd className="text-white font-mono text-lg">{pkg.latest_version.version}</dd>
              </div>
              {pkg.latest_version.published_at && (
                <div>
                  <dt className="text-sm text-gray-400">Published</dt>
                  <dd className="text-white">
                    {new Date(pkg.latest_version.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>
              )}
              {pkg.latest_version.file_size && (
                <div>
                  <dt className="text-sm text-gray-400">Package Size</dt>
                  <dd className="text-white">{(pkg.latest_version.file_size / 1024).toFixed(2)} KB</dd>
                </div>
              )}
              {pkg.latest_version.downloads > 0 && (
                <div>
                  <dt className="text-sm text-gray-400">Version Downloads</dt>
                  <dd className="text-white">{pkg.latest_version.downloads.toLocaleString()}</dd>
                </div>
              )}
            </dl>
            {pkg.latest_version.changelog && (
              <div className="mt-4 pt-4 border-t border-prpm-border">
                <dt className="text-sm text-gray-400 mb-2">Changelog</dt>
                <dd className="text-white whitespace-pre-wrap text-sm">{pkg.latest_version.changelog}</dd>
              </div>
            )}
          </div>
        )}

        {/* Package Files */}
        {pkg.latest_version?.metadata?.files && pkg.latest_version.metadata.files.length > 0 && (
          <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">📁 Package Contents</h2>
            <div className="space-y-2">
              {pkg.latest_version.metadata.files.map((file: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 py-2 px-3 hover:bg-prpm-dark/50 rounded transition-colors">
                  {file.type === 'directory' ? (
                    <svg className="w-5 h-5 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                  ) : file.type === 'symlink' ? (
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="flex-1 font-mono text-sm text-gray-300 truncate" title={file.path}>
                    {file.path}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {file.type === 'file' ? `${(file.size / 1024).toFixed(2)} KB` : file.type}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-prpm-border text-sm text-gray-400">
              Total files: {pkg.latest_version.metadata.files.length}
            </div>
          </div>
        )}

        {/* Ratings */}
        {pkg.rating_count > 0 && (
          <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">⭐ User Ratings</h2>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-prpm-accent">
                {pkg.rating_average?.toFixed(1) || 'N/A'}
              </span>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(pkg.rating_average || 0)
                          ? 'text-yellow-400'
                          : 'text-gray-600'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-400 mt-1">{pkg.rating_count} {pkg.rating_count === 1 ? 'rating' : 'ratings'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {pkg.tags && pkg.tags.length > 0 && (
          <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">🏷️ Tags</h2>
            <div className="flex flex-wrap gap-2">
              {pkg.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?tags=${tag}`}
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
          <h2 className="text-xl font-semibold text-white mb-4">🔍 Explore More</h2>
          <div className="space-y-2">
            <Link
              href={`/search?format=${pkg.format}`}
              className="block text-prpm-accent hover:text-prpm-accent-light"
            >
              More {pkg.format} packages →
            </Link>
            <Link
              href={`/search?subtype=${pkg.subtype}`}
              className="block text-prpm-accent hover:text-prpm-accent-light"
            >
              More {pkg.subtype} packages →
            </Link>
            {pkg.category && (
              <Link
                href={`/search?category=${pkg.category}`}
                className="block text-prpm-accent hover:text-prpm-accent-light"
              >
                More {pkg.category} packages →
              </Link>
            )}
          </div>
        </div>

        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareSourceCode',
              name: pkg.name,
              description: pkg.description,
              author: {
                '@type': 'Person',
                name: (pkg.author as any)?.username || 'Unknown'
              },
              license: pkg.license,
              downloadUrl: pkg.repository_url,
              codeRepository: pkg.repository_url,
              programmingLanguage: pkg.format,
              keywords: pkg.tags?.join(', '),
              aggregateRating: pkg.rating_count > 0 ? {
                '@type': 'AggregateRating',
                ratingValue: pkg.rating_average,
                ratingCount: pkg.rating_count
              } : undefined
            })
          }}
        />
      </div>
    </main>
  )
}
