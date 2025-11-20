'use client'

import { useState } from 'react'
import { subscribeToPRPMPlus } from '../lib/api'

interface SubscribePRPMPlusModalProps {
  onClose: () => void
}

export default function SubscribePRPMPlusModal({ onClose }: SubscribePRPMPlusModalProps) {
  const [subscribing, setSubscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async () => {
    const token = localStorage.getItem('prpm_token')
    if (!token) {
      // Redirect to login if not authenticated
      window.location.href = '/login?redirect=/playground'
      return
    }

    setSubscribing(true)
    setError(null)

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
      }
    } catch (err: any) {
      console.error('Failed to start subscription:', err)
      setError(err.message || 'Failed to start subscription')
      setSubscribing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-8 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="inline-block p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">PRPM+</h2>

          <div className="text-5xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-500 bg-clip-text text-transparent mb-1">
            $6
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">per month • cancel anytime</p>
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <div className="mt-0.5 p-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">100 monthly credits</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Test packages with AI models</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-0.5 p-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Credits roll over</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Up to 200 credits maximum</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-0.5 p-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Priority support</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Get help when you need it</div>
              </div>
            </li>
          </ul>

          <button
            onClick={handleSubscribe}
            disabled={subscribing}
            className="w-full py-4 px-6 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-yellow-500/30"
          >
            {subscribing ? 'Opening checkout...' : 'Subscribe to PRPM+'}
          </button>
        </div>
      </div>
    </div>
  )
}
