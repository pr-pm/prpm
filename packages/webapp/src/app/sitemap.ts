import { MetadataRoute } from 'next'

const REGISTRY_URL = process.env.NEXT_PUBLIC_REGISTRY_URL || process.env.REGISTRY_URL || 'https://registry.prpm.dev'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://prpm.dev'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

  // Base static URLs
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/authors`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // Blog posts
  const blogPosts = [
    'introducing-prpm',
    'distributable-intelligence',
    'cursor-deep-dive',
    'claude-deep-dive',
    'continue-deep-dive',
    'windsurf-deep-dive',
    'copilot-deep-dive',
    'kiro-deep-dive',
    'agents-md-deep-dive',
  ]

  const blogUrls: MetadataRoute.Sitemap = blogPosts.map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Fetch all packages from the registry
  let packageUrls: MetadataRoute.Sitemap = []
  try {
    const allPackages: string[] = []
    let offset = 0
    const limit = 100
    let hasMore = true

    console.log('[Sitemap] Fetching packages from registry...')

    while (hasMore) {
      const url = `${REGISTRY_URL}/api/v1/search/seo/packages?limit=${limit}&offset=${offset}`
      const res = await fetch(url, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      })

      if (!res.ok) {
        console.error(`[Sitemap] Failed to fetch packages: ${res.status}`)
        break
      }

      const data = await res.json()
      if (!data.packages || !Array.isArray(data.packages)) {
        break
      }

      allPackages.push(...data.packages)
      hasMore = data.hasMore
      offset += limit
    }

    console.log(`[Sitemap] Found ${allPackages.length} packages`)

    // Convert package names to URLs
    packageUrls = allPackages.map((name) => {
      let url: string
      if (name.startsWith('@')) {
        // Scoped package: @author/package -> /packages/author/package
        const withoutAt = name.substring(1)
        url = `${SITE_URL}/packages/${withoutAt}`
      } else {
        // Unscoped package: assume prpm as default author
        url = `${SITE_URL}/packages/prpm/${name}`
      }

      return {
        url,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }
    })
  } catch (error) {
    console.error('[Sitemap] Error fetching packages:', error)
  }

  // Fetch all collections from the registry
  let collectionUrls: MetadataRoute.Sitemap = []
  try {
    const allCollections: Array<{ name_slug: string; updated_at: string }> = []
    let offset = 0
    const limit = 100
    let hasMore = true

    console.log('[Sitemap] Fetching collections from registry...')

    while (hasMore) {
      const url = `${REGISTRY_URL}/api/v1/search/seo/collections?limit=${limit}&offset=${offset}`
      const res = await fetch(url, {
        next: { revalidate: 3600 },
      })

      if (!res.ok) {
        console.error(`[Sitemap] Failed to fetch collections: ${res.status}`)
        break
      }

      const data = await res.json()
      if (!data.collections || !Array.isArray(data.collections)) {
        break
      }

      allCollections.push(...data.collections)
      hasMore = data.hasMore
      offset += limit
    }

    console.log(`[Sitemap] Found ${allCollections.length} collections`)

    collectionUrls = allCollections.map((collection) => ({
      url: `${SITE_URL}/collections/${collection.name_slug}`,
      lastModified: collection.updated_at
        ? new Date(collection.updated_at).toISOString().split('T')[0]
        : now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.error('[Sitemap] Error fetching collections:', error)
  }

  const allUrls = [...staticUrls, ...blogUrls, ...packageUrls, ...collectionUrls]
  console.log(`[Sitemap] Generated ${allUrls.length} total URLs`)

  return allUrls
}
