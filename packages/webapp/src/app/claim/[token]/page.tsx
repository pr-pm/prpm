'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { validateInvite, claimInvite, getGitHubOAuthUrl, type InviteDetails } from '@/lib/api'

// Mark as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

export default function ClaimTokenPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const token = params.token as string

  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [success, setSuccess] = useState(false)

  // Check if we have a JWT token from OAuth callback
  const jwtToken = searchParams.get('token')
  const username = searchParams.get('username')

  const loadInvite = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const inviteData = await validateInvite(token)
      setInvite(inviteData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invite')
    } finally {
      setLoading(false)
    }
  }, [token])

  const handleClaim = useCallback(async () => {
    if (!jwtToken || !invite) return

    try {
      setClaiming(true)
      setError(null)

      await claimInvite(token, jwtToken, {
        github_username: username || undefined,
      })

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim invite')
    } finally {
      setClaiming(false)
    }
  }, [jwtToken, invite, token, username])

  useEffect(() => {
    loadInvite()
  }, [loadInvite])

  useEffect(() => {
    // If we just got back from OAuth, claim the invite
    if (jwtToken && !claiming && !success && invite) {
      handleClaim()
    }
  }, [jwtToken, invite, claiming, success, handleClaim])

  async function handleStartClaim() {
    // Redirect to GitHub OAuth with this page as callback
    const callbackUrl = `${window.location.origin}/claim/${token}`
    window.location.href = getGitHubOAuthUrl(callbackUrl)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-prpm-purple mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading invite...</p>
        </div>
      </main>
    )
  }

  if (error && !invite) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="max-w-md w-full">
          <Link href="/claim" className="text-prpm-purple hover:text-prpm-purple-dark mb-8 inline-block">
            ← Try another token
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="text-red-500 text-5xl mb-4">✗</div>
            <h1 className="text-2xl font-bold mb-2">Invalid Invite</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <Link
              href="/claim"
              className="inline-block px-6 py-3 bg-prpm-purple text-white rounded-lg hover:bg-prpm-purple-dark transition-colors"
            >
              Try Another Token
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (success) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h1 className="text-3xl font-bold mb-2">Welcome, @{invite?.author_username}!</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your author account has been verified successfully.
            </p>

            <div className="bg-prpm-purple/10 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold mb-2">What&apos;s next?</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>✓ Your {invite?.package_count} packages are now linked to your account</li>
                <li>✓ You can publish updates to your packages</li>
                <li>✓ Your profile shows a verified badge</li>
                <li>✓ Access to package analytics and insights</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link
                href="/"
                className="block w-full px-6 py-3 border border-prpm-purple text-prpm-purple rounded-lg hover:bg-prpm-purple hover:text-white transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md w-full">
        <Link href="/claim" className="text-prpm-purple hover:text-prpm-purple-dark mb-8 inline-block">
          ← Back
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold mb-2">You&apos;re Invited!</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Claim your verified author username
            </p>
          </div>

          {invite && (
            <>
              <div className="bg-gradient-to-br from-prpm-purple/20 to-prpm-purple-dark/20 rounded-lg p-6 mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Username</p>
                  <p className="text-2xl font-bold text-prpm-purple mb-4">
                    @{invite.author_username}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Packages</p>
                  <p className="text-xl font-semibold">{invite.package_count}</p>
                </div>
              </div>

              {invite.invite_message && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                    &quot;{invite.invite_message}&quot;
                  </p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-sm">Benefits:</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="text-prpm-purple mr-2">✓</span>
                    <span>Verified author badge on all your packages</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-prpm-purple mr-2">✓</span>
                    <span>Full control over your {invite.package_count} existing packages</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-prpm-purple mr-2">✓</span>
                    <span>Publish updates and new versions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-prpm-purple mr-2">✓</span>
                    <span>Access to download analytics and insights</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-prpm-purple mr-2">✓</span>
                    <span>Priority support and early access to features</span>
                  </li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleStartClaim}
                disabled={claiming}
                className="w-full px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                {claiming ? 'Claiming...' : 'Claim with GitHub'}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                Expires {new Date(invite.expires_at).toLocaleDateString()}
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
