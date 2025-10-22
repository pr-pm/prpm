'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// Mark as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const username = searchParams.get('username')

  useEffect(() => {
    if (token && username) {
      // Store token in localStorage for authenticated requests
      localStorage.setItem('prpm_token', token)
      localStorage.setItem('prpm_username', username)

      // Determine redirect URL based on environment
      const returnTo = localStorage.getItem('prpm_return_to') || '/dashboard'
      localStorage.removeItem('prpm_return_to')

      // Get the current hostname
      const hostname = window.location.hostname

      // If in production and not already on app subdomain, redirect to app.prpm.dev
      if (!hostname.includes('localhost') && !hostname.startsWith('app.')) {
        const appHostname = hostname.replace(/^(www\.)?/, 'app.')
        window.location.href = `${window.location.protocol}//${appHostname}${returnTo}`
      } else {
        // For localhost or already on app subdomain, just navigate
        window.location.href = returnTo
      }
    }
  }, [token, username])

  return (
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-prpm-purple mb-4"></div>
      <p className="text-gray-600 dark:text-gray-300">Completing authentication...</p>
    </div>
  )
}

/**
 * OAuth callback page - handles redirect from GitHub authentication
 * This is mainly for non-invite flows (general login)
 */
export default function AuthCallbackPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Suspense fallback={<div>Loading...</div>}>
        <AuthCallbackContent />
      </Suspense>
    </main>
  )
}
