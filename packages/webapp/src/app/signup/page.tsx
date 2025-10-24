'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Nango from '@nangohq/frontend'
import { createNangoConnectSession, handleNangoCallback } from '@/lib/api'

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nango, setNango] = useState<any>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [authSucceeded, setAuthSucceeded] = useState(false)

  const openConnectModal = (nangoInstance: any, token: string) => {
    try {
      console.log('Opening Nango Connect UI for signup...')
      nangoInstance.openConnectUI({
        detectClosedAuthWindow: true,
        onEvent: (event: any) => {
          console.log('Nango event:', event)

          if (event.type === 'connect') {
            // Handle successful authentication
            const connectionId = event.payload?.connectionId
            if (connectionId) {
              setAuthSucceeded(true)
              // Don't await here - let it run asynchronously and redirect
              handleAuthSuccess(connectionId).catch(err => {
                console.error('Error in handleAuthSuccess:', err)
                setError(err instanceof Error ? err.message : 'Authentication failed')
                setIsLoading(false)
              })
            }
          } else if (event.type === 'close') {
            console.log('Modal closed by user')
            // Only show error if authentication didn't succeed
            if (!authSucceeded) {
              setError('Authentication cancelled')
              setIsLoading(false)
            }
          }
        },
      })
    } catch (err) {
      console.error('Failed to open modal:', err)
      setError(`Failed to open authentication modal: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setIsLoading(false)
    }
  }

  const handleGitHubSignup = async () => {
    setIsLoading(true)
    setError(null)
    setAuthSucceeded(false)

    try {
      // Generate a temporary user ID for signup
      const tempUserId = `signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      console.log('Creating Nango connect session for signup...')

      // Create Nango connect session
      const { connectSessionToken } = await createNangoConnectSession(
        tempUserId,
        'signup@example.com',
        'New User'
      )

      console.log('Connect session created, initializing Nango...')

      // Initialize Nango
      const nangoInstance = new Nango({ connectSessionToken })
      setNango(nangoInstance)
      setSessionToken(connectSessionToken)

      // Open modal immediately
      openConnectModal(nangoInstance, connectSessionToken)

    } catch (err) {
      console.error('Signup error:', err)
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.')
      setIsLoading(false)
    }
  }

  const handleAuthSuccess = async (connectionId: string) => {
    try {
      console.log('[AUTH] Authentication successful, handling callback...')
      const redirectUrl = '/dashboard'

      // Show optimistic success state immediately
      setError(null)

      console.log('[AUTH] Calling Nango callback with connectionId:', connectionId)

      // Race the API call against a timeout to provide faster feedback
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout - slow network')), 15000)
      )

      const result = await Promise.race([
        handleNangoCallback(connectionId, redirectUrl),
        timeoutPromise
      ]).catch(err => {
        if (err.message.includes('timeout')) {
          console.warn('[AUTH] API call is slow, continuing anyway...')
          // Don't fail completely on slow network, let it complete in background
          handleNangoCallback(connectionId, redirectUrl).then(r => {
            console.log('[AUTH] Slow callback completed:', r)
          })
          return null
        }
        throw err
      })

      console.log('[AUTH] Callback result:', JSON.stringify(result, null, 2))

      // Check if we got a token back
      if (!result || !result.token || !result.username) {
        // If no result yet (slow network), try to proceed with optimistic data
        console.warn('[AUTH] No immediate result, checking for cached auth data...')

        // Check if we already have credentials from a previous attempt
        const existingToken = localStorage.getItem('prpm_token')
        const existingUsername = localStorage.getItem('prpm_username')

        if (existingToken && existingUsername) {
          console.log('[AUTH] Found existing credentials, proceeding to dashboard')
          window.location.href = '/dashboard'
          return
        }

        console.error('[AUTH] Invalid callback result - missing token or username:', result)
        setError(`Authentication incomplete. Please try refreshing the page.`)
        setIsLoading(false)
        return
      }

      if (result.success) {
        console.log('[AUTH] Success! Storing credentials...')
        // Store the JWT token (use prpm_ prefix to match dashboard expectations)
        localStorage.setItem('prpm_token', result.token)
        localStorage.setItem('prpm_username', result.username)
        // Also store with jwt_ prefix for backwards compatibility
        localStorage.setItem('jwt_token', result.token)
        localStorage.setItem('username', result.username)

        // Verify storage
        const storedToken = localStorage.getItem('prpm_token')
        const storedUsername = localStorage.getItem('prpm_username')
        console.log('[AUTH] Verification - Token stored:', !!storedToken, 'Username stored:', storedUsername)

        // Web authentication - redirect to dashboard
        const targetUrl = result.redirectUrl || '/dashboard'
        console.log('[AUTH] Redirecting to:', targetUrl)

        // Add a small delay to ensure localStorage writes complete
        await new Promise(resolve => setTimeout(resolve, 100))

        // Force a hard redirect to ensure localStorage is persisted
        window.location.href = targetUrl
      } else {
        console.error('[AUTH] Authentication failed - success = false:', result)
        setError(`Authentication failed: ${result.error || 'Unknown error'}`)
        setIsLoading(false)
      }
    } catch (err) {
      console.error('[AUTH] Callback error:', err)
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-prpm-dark relative overflow-hidden flex items-center justify-center p-8">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern bg-[size:50px_50px] opacity-20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-prpm-accent/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-prpm-purple/20 rounded-full blur-3xl"></div>

      {/* Signup form */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Join PRPM</h1>
            <p className="text-gray-400">Connect with GitHub to get started</p>
          </div>

          {/* Info banner */}
          <div className="mb-8 p-4 bg-prpm-accent/10 border border-prpm-accent/30 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✨</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white mb-1">
                  Already publishing packages?
                </p>
                <p className="text-xs text-gray-400">
                  We'll automatically detect and link your existing packages after you sign in
                </p>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* GitHub OAuth Button */}
          <button
            onClick={handleGitHubSignup}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-prpm-dark border border-prpm-border hover:border-prpm-accent disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                Sign up with GitHub
              </>
            )}
          </button>

          {/* Retry button if modal doesn't open */}
          {isLoading && nango && sessionToken && (
            <button
              onClick={() => openConnectModal(nango, sessionToken)}
              className="w-full mt-3 px-4 py-2 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-gray-300 rounded-lg text-sm transition-all"
            >
              Modal didn't open? Click here to retry
            </button>
          )}

          {/* Benefits list */}
          <div className="mt-8 pt-6 border-t border-prpm-border">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">What you get:</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-prpm-accent mt-0.5">✓</span>
                <span>Publish and manage AI prompts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-prpm-accent mt-0.5">✓</span>
                <span>Auto-claim existing packages</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-prpm-accent mt-0.5">✓</span>
                <span>Track downloads and analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-prpm-accent mt-0.5">✓</span>
                <span>Verified author badge</span>
              </li>
            </ul>
          </div>

          {/* Terms */}
          <p className="mt-6 text-xs text-center text-gray-500">
            By signing up, you agree to our{' '}
            <Link href="/legal/terms" className="text-gray-400 hover:text-gray-300 underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/legal/privacy" className="text-gray-400 hover:text-gray-300 underline">
              Privacy Policy
            </Link>
          </p>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-prpm-accent hover:text-prpm-accent-light font-semibold">
              Sign in
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-400 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
