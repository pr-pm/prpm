#!/usr/bin/env tsx
/**
 * Generate sitemap.xml for SEO
 *
 * Includes:
 * - Static pages (home, search, authors, blog, etc.)
 * - All package pages
 * - All collection pages
 *
 * Usage:
 *   npm run generate-sitemap              # Uses production registry
 *   npm run generate-sitemap -- --env=local
 *   npm run generate-sitemap -- --env=staging
 */

import * as fs from 'fs'
import * as path from 'path'

// Environment configurations
const ENVIRONMENTS = {
  local: {
    REGISTRY_URL: 'http://localhost:3111',
    SITE_URL: 'http://localhost:5173',
  },
  staging: {
    REGISTRY_URL: 'https://staging-registry.prpm.dev',
    SITE_URL: 'https://staging.prpm.dev',
  },
  production: {
    REGISTRY_URL: 'https://registry.prpm.dev',
    SITE_URL: 'https://prpm.dev',
  },
}

// Parse command line arguments
const args = process.argv.slice(2)
const envArg = args.find(arg => arg.startsWith('--env='))
const environment = envArg ? envArg.split('=')[1] : 'production'

if (!['local', 'staging', 'production'].includes(environment)) {
  console.error(`❌ Invalid environment: ${environment}`)
  console.error('   Valid options: local, staging, production')
  process.exit(1)
}

const envConfig = ENVIRONMENTS[environment as keyof typeof ENVIRONMENTS]

// Static pages to include in sitemap
const STATIC_PAGES = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/search', changefreq: 'daily', priority: 0.9 },
  { url: '/authors', changefreq: 'weekly', priority: 0.8 },
  { url: '/blog', changefreq: 'weekly', priority: 0.7 },
  { url: '/blog/introducing-prpm', changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/distributable-intelligence', changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/cursor-deep-dive', changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/claude-deep-dive', changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/continue-deep-dive', changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/windsurf-deep-dive', changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/copilot-deep-dive', changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/kiro-deep-dive', changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/agents-md-deep-dive', changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/prpm-vs-plugins', changefreq: 'monthly', priority: 0.6 },
  { url: '/legal/privacy', changefreq: 'monthly', priority: 0.3 },
  { url: '/legal/terms', changefreq: 'monthly', priority: 0.3 },
]

interface SitemapEntry {
  url: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

async function fetchAllPackages(): Promise<string[]> {
  const allPackages: string[] = []
  let offset = 0
  const limit = 100
  let hasMore = true

  console.log(`📦 Fetching packages from ${envConfig.REGISTRY_URL}...`)

  while (hasMore) {
    try {
      const url = `${envConfig.REGISTRY_URL}/api/v1/search/seo/packages?limit=${limit}&offset=${offset}`
      const response = await fetch(url)

      if (!response.ok) {
        console.error(`Failed to fetch packages: ${response.status}`)
        break
      }

      const data = await response.json()
      allPackages.push(...data.packages)
      hasMore = data.hasMore
      offset += limit

      console.log(`   Fetched ${allPackages.length} packages...`)
    } catch (error) {
      console.error('Error fetching packages:', error)
      break
    }
  }

  return allPackages
}

async function fetchAllCollections(): Promise<string[]> {
  const allCollections: string[] = []
  let offset = 0
  const limit = 100
  let hasMore = true

  console.log(`📚 Fetching collections from ${envConfig.REGISTRY_URL}...`)

  while (hasMore) {
    try {
      const url = `${envConfig.REGISTRY_URL}/api/v1/search/seo/collections?limit=${limit}&offset=${offset}`
      const response = await fetch(url)

      if (!response.ok) {
        console.error(`Failed to fetch collections: ${response.status}`)
        break
      }

      const data = await response.json()
      allCollections.push(...data.collections)
      hasMore = data.hasMore
      offset += limit

      console.log(`   Fetched ${allCollections.length} collections...`)
    } catch (error) {
      console.error('Error fetching collections:', error)
      break
    }
  }

  return allCollections
}

function generateSitemapXML(entries: SitemapEntry[]): string {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ]

  for (const entry of entries) {
    xml.push('  <url>')
    xml.push(`    <loc>${entry.url}</loc>`)
    if (entry.lastmod) {
      xml.push(`    <lastmod>${entry.lastmod}</lastmod>`)
    }
    if (entry.changefreq) {
      xml.push(`    <changefreq>${entry.changefreq}</changefreq>`)
    }
    if (entry.priority !== undefined) {
      xml.push(`    <priority>${entry.priority.toFixed(1)}</priority>`)
    }
    xml.push('  </url>')
  }

  xml.push('</urlset>')
  return xml.join('\n')
}

async function main() {
  console.log(`\n🗺️  Generating sitemap for ${environment.toUpperCase()} environment`)
  console.log(`🌐 Site URL: ${envConfig.SITE_URL}`)
  console.log(`📡 Registry URL: ${envConfig.REGISTRY_URL}\n`)

  const entries: SitemapEntry[] = []

  // Add static pages
  console.log('📄 Adding static pages...')
  for (const page of STATIC_PAGES) {
    entries.push({
      url: `${envConfig.SITE_URL}${page.url}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: page.changefreq as SitemapEntry['changefreq'],
      priority: page.priority,
    })
  }
  console.log(`   Added ${STATIC_PAGES.length} static pages\n`)

  // Fetch and add all packages
  const packages = await fetchAllPackages()
  console.log(`\n📦 Adding ${packages.length} package pages...`)
  for (const packageName of packages) {
    // Transform @author/package/sub/path -> author/package/sub/path
    let packageUrl = packageName
    if (packageName.startsWith('@')) {
      packageUrl = packageName.substring(1) // Remove @ prefix
    }

    entries.push({
      url: `${envConfig.SITE_URL}/packages/${packageUrl}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.8,
    })
  }

  // Fetch and add all collections
  const collections = await fetchAllCollections()
  console.log(`\n📚 Adding ${collections.length} collection pages...`)
  for (const collectionSlug of collections) {
    entries.push({
      url: `${envConfig.SITE_URL}/collections/${collectionSlug}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.8,
    })
  }

  // Generate XML
  console.log(`\n📝 Generating sitemap XML...`)
  const xml = generateSitemapXML(entries)

  // Write to public directory (will be copied to out/ during build)
  const publicDir = path.join(__dirname, '..', 'public')
  const sitemapPath = path.join(publicDir, 'sitemap.xml')

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  fs.writeFileSync(sitemapPath, xml, 'utf-8')

  console.log(`\n✅ Sitemap generated successfully!`)
  console.log(`📊 Total URLs: ${entries.length}`)
  console.log(`   Static pages: ${STATIC_PAGES.length}`)
  console.log(`   Package pages: ${packages.length}`)
  console.log(`   Collection pages: ${collections.length}`)
  console.log(`📁 Output: ${sitemapPath}`)
  console.log(`🌐 Will be available at: ${envConfig.SITE_URL}/sitemap.xml\n`)
}

main().catch((error) => {
  console.error(`\n❌ Error generating sitemap: ${error.message}\n`)
  process.exit(1)
})
