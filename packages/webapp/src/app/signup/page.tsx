'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { register, getGitHubOAuthUrl, validateInvite, type InviteDetails } from '@/lib/api'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [validatingInvite, setValidatingInvite] = useState(true)
  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)

  // Validate invite token on mount
  useEffect(() => {
    async function checkInvite() {
      if (!inviteToken) {
        setValidatingInvite(false)
        return
      }

      try {
        setValidatingInvite(true)
        setInviteError(null)
        const inviteData = await validateInvite(inviteToken)
        setInvite(inviteData)
        // Pre-fill username if invite has one
        if (inviteData.author_username) {
          setUsername(inviteData.author_username)
        }
      } catch (err) {
        setInviteError(err instanceof Error ? err.message : 'Invalid invite token')
        setInvite(null)
      } finally {
        setValidatingInvite(false)
      }
    }

    checkInvite()
  }, [inviteToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { token, user } = await register(username, email, password)

      // Store token in localStorage
      localStorage.setItem('prpm_token', token)
      localStorage.setItem('prpm_username', user.username)

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
        router.push(returnTo)
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGitHubSignup = () => {
    const redirectUrl = `${window.location.origin}/auth/callback`
    window.location.href = getGitHubOAuthUrl(redirectUrl)
  }

  // Show loading state while validating invite
  if (validatingInvite) {
    return (
      <main className="min-h-screen bg-prpm-dark relative overflow-hidden flex items-center justify-center p-8">
        <div className="absolute inset-0 bg-grid-pattern bg-[size:50px_50px] opacity-20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-prpm-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-prpm-purple/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-prpm-accent mb-4"></div>
          <p className="text-gray-400">Validating invite...</p>
        </div>
      </main>
    )
  }

  // Show "Invite Only" message if no valid invite token
  if (!invite) {
    return (
      <main className="min-h-screen bg-prpm-dark relative overflow-hidden flex items-center justify-center p-8">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid-pattern bg-[size:50px_50px] opacity-20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-prpm-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-prpm-purple/20 rounded-full blur-3xl"></div>

        {/* Invite Only message */}
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl p-8 text-center">
            <div className="text-6xl mb-6">🔒</div>
            <h1 className="text-3xl font-bold text-white mb-4">Invite Only</h1>
            <p className="text-gray-400 mb-6">
              PRPM is currently in private beta. You need a valid invite token to create an account.
            </p>

            {inviteError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {inviteError}
              </div>
            )}

            <div className="bg-prpm-dark border border-prpm-border rounded-lg p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">How to get an invite:</h3>
              <ul className="text-sm text-gray-400 text-left space-y-2">
                <li className="flex items-start">
                  <span className="text-prpm-accent mr-2">•</span>
                  <span>Contact us on GitHub or Discord</span>
                </li>
                <li className="flex items-start">
                  <span className="text-prpm-accent mr-2">•</span>
                  <span>Request access through our community channels</span>
                </li>
                <li className="flex items-start">
                  <span className="text-prpm-accent mr-2">•</span>
                  <span>Contribute to the PRPM project</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link
                href="/"
                className="block w-full px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all"
              >
                Back to Home
              </Link>
              <Link
                href="/login"
                className="block w-full px-6 py-3 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white rounded-lg font-semibold transition-all"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Show signup form if invite is valid
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
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-gray-400">Start publishing AI prompts to PRPM</p>
          </div>

          {/* Invite info banner */}
          <div className="mb-6 p-4 bg-prpm-accent/10 border border-prpm-accent/30 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎉</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white mb-1">
                  Invited as @{invite.author_username}
                </p>
                <p className="text-xs text-gray-400">
                  {invite.package_count} package{invite.package_count !== 1 ? 's' : ''} • Expires {new Date(invite.expires_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Email/Password form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={39}
                pattern="[a-zA-Z0-9_-]+"
                className="w-full px-4 py-3 bg-prpm-dark border border-prpm-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-prpm-accent transition-colors"
                placeholder="johndoe"
              />
              <p className="mt-1 text-xs text-gray-500">3-39 characters, alphanumeric, dashes, and underscores</p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-prpm-dark border border-prpm-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-prpm-accent transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-prpm-dark border border-prpm-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-prpm-accent transition-colors"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-prpm-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-prpm-dark-card text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* GitHub OAuth */}
          <button
            onClick={handleGitHubSignup}
            className="w-full px-6 py-3 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            Continue with GitHub
          </button>

          {/* Terms */}
          <p className="mt-6 text-xs text-center text-gray-500">
            By creating an account, you agree to our{' '}
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
