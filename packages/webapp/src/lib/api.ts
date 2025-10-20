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
