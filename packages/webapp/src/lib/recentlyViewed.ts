// Recently viewed packages and collections tracking
// Stores up to 10 most recent items in localStorage

const STORAGE_KEY_PACKAGES = 'prpm_recently_viewed_packages'
const STORAGE_KEY_COLLECTIONS = 'prpm_recently_viewed_collections'
const MAX_RECENT_ITEMS = 10

export interface RecentPackage {
  id: string
  name: string
  description?: string
  format: string
  subtype?: string
  viewedAt: string // ISO timestamp
}

export interface RecentCollection {
  scope: string
  name_slug: string
  description?: string
  package_count?: number
  viewedAt: string // ISO timestamp
}

/**
 * Add a package to recently viewed stack
 */
export function addRecentPackage(pkg: Omit<RecentPackage, 'viewedAt'>): void {
  try {
    const existing = getRecentPackages()

    // Remove if already exists (we'll add it to the front)
    const filtered = existing.filter(p => p.id !== pkg.id)

    // Add to front with current timestamp
    const updated: RecentPackage[] = [
      { ...pkg, viewedAt: new Date().toISOString() },
      ...filtered,
    ].slice(0, MAX_RECENT_ITEMS)

    localStorage.setItem(STORAGE_KEY_PACKAGES, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save recent package:', err)
  }
}

/**
 * Add a collection to recently viewed stack
 */
export function addRecentCollection(coll: Omit<RecentCollection, 'viewedAt'>): void {
  try {
    const existing = getRecentCollections()

    // Remove if already exists (we'll add it to the front)
    const filtered = existing.filter(
      c => !(c.scope === coll.scope && c.name_slug === coll.name_slug)
    )

    // Add to front with current timestamp
    const updated: RecentCollection[] = [
      { ...coll, viewedAt: new Date().toISOString() },
      ...filtered,
    ].slice(0, MAX_RECENT_ITEMS)

    localStorage.setItem(STORAGE_KEY_COLLECTIONS, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save recent collection:', err)
  }
}

/**
 * Get recently viewed packages
 */
export function getRecentPackages(): RecentPackage[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PACKAGES)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * Get recently viewed collections
 */
export function getRecentCollections(): RecentCollection[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_COLLECTIONS)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * Clear all recently viewed items
 */
export function clearRecentlyViewed(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_PACKAGES)
    localStorage.removeItem(STORAGE_KEY_COLLECTIONS)
  } catch (err) {
    console.error('Failed to clear recently viewed:', err)
  }
}
