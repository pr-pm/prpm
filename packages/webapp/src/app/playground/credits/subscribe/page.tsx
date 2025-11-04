'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { subscribeToPRPMPlus } from '../../../../lib/api'

export default function SubscribeRedirectPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleSubscribe = async () => {
      const token = localStorage.getItem('prpm_token')

      if (!token) {
        // Redirect to login with return URL
        router.push('/login?redirect=/playground/credits/subscribe')
        return
      }

      try {
        const currentUrl = window.location.origin
        const result = await subscribeToPRPMPlus(
          token,
          `${currentUrl}/playground?subscription=success`,
          `${currentUrl}/playground?subscription=cancelled`
        )

        // Redirect to Stripe Checkout
        if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl
        } else {
          setError('Failed to create checkout session')
        }
      } catch (err: any) {
        console.error('Failed to start subscription:', err)
        setError(err.message || 'Failed to start subscription')
      }
    }

    handleSubscribe()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Subscription Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/pricing')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Go to Pricing
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Redirecting to Checkout
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we prepare your subscription...
        </p>
      </div>
    </div>
  )
}
