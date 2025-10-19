'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

// Mark as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

function ClaimForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (token) {
      router.push(`/claim/${token}`)
    }
  }

  return (
    <div className="max-w-md w-full">
      <Link href="/" className="text-prpm-purple hover:text-prpm-purple-dark mb-8 inline-block">
        ← Back to home
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-center">
          Claim Your Author Username
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
          Enter your invite token to claim your verified author status
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="token" className="block text-sm font-medium mb-2">
              Invite Token
            </label>
            <input
              type="text"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your invite token"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-prpm-purple focus:border-transparent dark:bg-gray-700"
              required
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              You should have received this token via email
            </p>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-prpm-purple text-white rounded-lg hover:bg-prpm-purple-dark transition-colors font-medium"
          >
            Continue
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Don&apos;t have an invite token?{' '}
            <a
              href="mailto:invite@prpm.dev"
              className="text-prpm-purple hover:text-prpm-purple-dark underline"
            >
              Request an invite
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ClaimPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Suspense fallback={<div>Loading...</div>}>
        <ClaimForm />
      </Suspense>
    </main>
  )
}
