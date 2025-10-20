/**
 * API client for communicating with PRMP registry
 */

const REGISTRY_URL = process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3000'

export interface InviteDetails {
  id: string
  author_username: string
  package_count: number
  invite_message?: string
  status: string
  expires_at: string
}

export interface ClaimInviteRequest {
  github_username?: string
  email?: string
}

export interface ClaimInviteResponse {
  success: boolean
  message: string
  user?: {
    id: string
    username: string
    verified_author: boolean
  }
}

export interface Author {
  author: string
  package_count: number
  total_downloads: number
  verified: boolean
  latest_package?: string
  created_at?: string
}

export interface TopAuthorsResponse {
  authors: Author[]
  total: number
}

/**
 * Validate an invite token
 */
export async function validateInvite(token: string): Promise<InviteDetails> {
  const response = await fetch(`${REGISTRY_URL}/api/v1/invites/${token}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to validate invite' }))
    throw new Error(error.error || error.message || 'Invalid invite token')
  }

  const data = await response.json()
  return data.invite
}

/**
 * Claim an invite (requires authentication)
 */
export async function claimInvite(
  token: string,
  jwtToken: string,
  data: ClaimInviteRequest
): Promise<ClaimInviteResponse> {
  const response = await fetch(`${REGISTRY_URL}/api/v1/invites/${token}/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to claim invite' }))
    throw new Error(error.error || error.message || 'Failed to claim invite')
  }

  return response.json()
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(jwtToken: string) {
  const response = await fetch(`${REGISTRY_URL}/api/v1/auth/me`, {
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Not authenticated')
  }

  return response.json()
}

/**
 * Get top authors
 */
export async function getTopAuthors(limit: number = 50): Promise<TopAuthorsResponse> {
  const response = await fetch(`${REGISTRY_URL}/api/v1/search/authors?limit=${limit}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch authors' }))
    throw new Error(error.error || error.message || 'Failed to fetch top authors')
  }

  return response.json()
}

/**
 * Get GitHub OAuth URL
 */
export function getGitHubOAuthUrl(redirectUrl: string): string {
  return `${REGISTRY_URL}/api/v1/auth/github?redirect=${encodeURIComponent(redirectUrl)}`
}

/**
 * Register with email and password
 */
export async function register(username: string, email: string, password: string) {
  const response = await fetch(`${REGISTRY_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Registration failed' }))
    throw new Error(error.error || error.message || 'Registration failed')
  }

  return response.json()
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string) {
  const response = await fetch(`${REGISTRY_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Login failed' }))
    throw new Error(error.error || error.message || 'Login failed')
  }

  return response.json()
}

// ============================================
// SEARCH & DISCOVERY
// ============================================

export type PackageType = 'cursor' | 'claude' | 'claude-skill' | 'claude-agent' | 'claude-slash-command' | 'continue' | 'windsurf' | 'generic' | 'mcp'
export type SortType = 'downloads' | 'created' | 'updated' | 'quality' | 'rating'

export interface SearchPackagesParams {
  q?: string
  type?: PackageType
  tags?: string[]
  category?: string
  author?: string
  verified?: boolean
  featured?: boolean
  sort?: SortType
  limit?: number
  offset?: number
}

export interface Package {
  id: string
  name: string
  description?: string
  type: PackageType
  author_id?: string
  org_id?: string
  tags: string[]
  keywords: string[]
  category?: string
  visibility: string
  deprecated: boolean
  verified: boolean
  featured: boolean
  total_downloads: number
  weekly_downloads: number
  monthly_downloads: number
  quality_score?: number
  rating_average?: number
  rating_count: number
  created_at: string
  updated_at: string
}

export interface SearchPackagesResponse {
  packages: Package[]
  total: number
  offset: number
  limit: number
}

/**
 * Search for packages
 */
export async function searchPackages(params: SearchPackagesParams): Promise<SearchPackagesResponse> {
  const queryParams = new URLSearchParams()

  if (params.q) queryParams.append('q', params.q)
  if (params.type) queryParams.append('type', params.type)
  if (params.tags) params.tags.forEach(tag => queryParams.append('tags', tag))
  if (params.category) queryParams.append('category', params.category)
  if (params.author) queryParams.append('author', params.author)
  if (params.verified !== undefined) queryParams.append('verified', String(params.verified))
  if (params.featured !== undefined) queryParams.append('featured', String(params.featured))
  if (params.sort) queryParams.append('sort', params.sort)
  if (params.limit) queryParams.append('limit', String(params.limit))
  if (params.offset) queryParams.append('offset', String(params.offset))

  const response = await fetch(`${REGISTRY_URL}/api/v1/search?${queryParams.toString()}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to search packages' }))
    throw new Error(error.error || error.message || 'Failed to search packages')
  }

  return response.json()
}

export interface SearchCollectionsParams {
  query?: string
  category?: string
  tag?: string
  framework?: string
  official?: boolean
  verified?: boolean
  scope?: string
  author?: string
  limit?: number
  offset?: number
  sortBy?: 'downloads' | 'stars' | 'created' | 'updated' | 'name'
  sortOrder?: 'asc' | 'desc'
}

export interface Collection {
  scope: string
  id: string
  name_slug: string
  version: string
  name: string
  description?: string
  author: string
  official: boolean
  verified: boolean
  category?: string
  tags: string[]
  framework?: string
  downloads: number
  stars: number
  icon?: string
  created_at: string
  updated_at: string
  package_count: number
}

export interface SearchCollectionsResponse {
  collections: Collection[]
  total: number
  page: number
  perPage: number
  hasMore: boolean
}

/**
 * Search for collections
 */
export async function searchCollections(params: SearchCollectionsParams): Promise<SearchCollectionsResponse> {
  const queryParams = new URLSearchParams()

  if (params.query) queryParams.append('query', params.query)
  if (params.category) queryParams.append('category', params.category)
  if (params.tag) queryParams.append('tag', params.tag)
  if (params.framework) queryParams.append('framework', params.framework)
  if (params.official !== undefined) queryParams.append('official', String(params.official))
  if (params.verified !== undefined) queryParams.append('verified', String(params.verified))
  if (params.scope) queryParams.append('scope', params.scope)
  if (params.author) queryParams.append('author', params.author)
  if (params.limit) queryParams.append('limit', String(params.limit))
  if (params.offset) queryParams.append('offset', String(params.offset))
  if (params.sortBy) queryParams.append('sortBy', params.sortBy)
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

  const response = await fetch(`${REGISTRY_URL}/api/v1/collections?${queryParams.toString()}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to search collections' }))
    throw new Error(error.error || error.message || 'Failed to search collections')
  }

  return response.json()
}

/**
 * Get trending packages
 */
export async function getTrendingPackages(type?: PackageType, limit: number = 20) {
  const queryParams = new URLSearchParams()
  if (type) queryParams.append('type', type)
  queryParams.append('limit', String(limit))

  const response = await fetch(`${REGISTRY_URL}/api/v1/search/trending?${queryParams.toString()}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch trending packages' }))
    throw new Error(error.error || error.message || 'Failed to fetch trending packages')
  }

  return response.json()
}

/**
 * Get featured packages
 */
export async function getFeaturedPackages(type?: PackageType, limit: number = 20) {
  const queryParams = new URLSearchParams()
  if (type) queryParams.append('type', type)
  queryParams.append('limit', String(limit))

  const response = await fetch(`${REGISTRY_URL}/api/v1/search/featured?${queryParams.toString()}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch featured packages' }))
    throw new Error(error.error || error.message || 'Failed to fetch featured packages')
  }

  return response.json()
}

/**
 * Get all available tags
 */
export async function getTags() {
  const response = await fetch(`${REGISTRY_URL}/api/v1/search/tags`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch tags' }))
    throw new Error(error.error || error.message || 'Failed to fetch tags')
  }

  return response.json()
}

/**
 * Get all available categories
 */
export async function getCategories() {
  const response = await fetch(`${REGISTRY_URL}/api/v1/search/categories`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch categories' }))
    throw new Error(error.error || error.message || 'Failed to fetch categories')
  }

  return response.json()
}
