'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { getCreditPackages, purchaseCredits, subscribeToPRPMPlus } from '../../lib/api'
import type { CreditPackage } from '../../lib/api'
import StripePaymentForm from './StripePaymentForm'

// Initialize Stripe
// Note: You need to set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env.local file
// Get this from your Stripe dashboard: https://dashboard.stripe.com/test/apikeys
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

interface BuyCreditsModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function BuyCreditsModal({ onClose, onSuccess }: BuyCreditsModalProps) {
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [purchaseDetails, setPurchaseDetails] = useState<{ credits: number; price: number } | null>(null)

  useEffect(() => {
    loadPackages()
  }, [])

  const loadPackages = async () => {
    try {
      const result = await getCreditPackages()
      setPackages(result.packages)
    } catch (err: any) {
      console.error('Failed to load packages:', err)
      setError(err.message || 'Failed to load credit packages')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (packageId: string) => {
    const token = localStorage.getItem('prpm_token')
    if (!token) {
      setError('Not authenticated')
      return
    }

    setPurchasing(true)
    setError(null)
    setSelectedPackage(packageId)

    try {
      const result = await purchaseCredits(token, packageId)

      // Store client secret and purchase details to show payment form
      setClientSecret(result.clientSecret)
      setPurchaseDetails({
        credits: result.credits,
        price: result.price
      })
      setPurchasing(false)
    } catch (err: any) {
      console.error('Failed to purchase:', err)
      setError(err.message || 'Failed to purchase credits')
      setPurchasing(false)
      setSelectedPackage(null)
    }
  }

  const handlePaymentSuccess = () => {
    onSuccess()
    onClose()
  }

  const handlePaymentCancel = () => {
    setClientSecret(null)
    setPurchaseDetails(null)
    setSelectedPackage(null)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {clientSecret ? 'Complete Payment' : 'Buy Credits'}
          </h2>
          <button
            onClick={clientSecret ? handlePaymentCancel : onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {clientSecret && purchaseDetails ? (
            /* Show Stripe Payment Form */
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripePaymentForm
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
                credits={purchaseDetails.credits}
                price={purchaseDetails.price}
              />
            </Elements>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-prpm-green"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-300">
              {error}
            </div>
          ) : (
            <>
              {/* Packages Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    className={`relative border-2 rounded-xl p-6 transition text-left ${
                      pkg.popular
                        ? 'border-prpm-green bg-green-50 dark:bg-green-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } ${purchasing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`}
                    onClick={() => !purchasing && handlePurchase(pkg.id)}
                    disabled={purchasing}
                  >
                    {/* Popular Badge */}
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-prpm-green text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                          POPULAR
                        </span>
                      </div>
                    )}

                    {/* Credits */}
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                      {pkg.credits}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">credits</div>

                    {/* Price */}
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      ${(pkg.price / 100).toFixed(2)}
                    </div>

                    {/* Value */}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ${((pkg.price / 100) / pkg.credits).toFixed(3)} per credit
                    </div>

                    {/* Hover indicator */}
                    {!purchasing && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                          Click to buy
                        </span>
                      </div>
                    )}

                    {purchasing && selectedPackage === pkg.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                          Processing...
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* PRPM+ Upgrade Callout */}
              <div className="relative p-6 bg-gradient-to-br from-yellow-600/10 via-orange-600/10 to-yellow-600/10 border-2 border-yellow-500/40 rounded-xl overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl"></div>

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-xl text-gray-900 dark:text-white">
                          Better Value: PRPM+
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Just $6/month • Save up to 40%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Value Comparison */}
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-400">One-time purchase:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">100 credits = $5.00</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Need 200 credits/month?</span>
                      <span className="font-semibold text-gray-900 dark:text-white">= $10.00/month</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-yellow-600 dark:text-yellow-400 font-semibold">PRPM+ subscription:</span>
                      <div className="text-right">
                        <span className="font-bold text-xl text-yellow-600 dark:text-yellow-400">$6.00/month</span>
                        <div className="text-xs text-green-600 dark:text-green-400 font-semibold">Save $4/month (40%)</div>
                      </div>
                    </div>
                  </div>

                  {/* Benefits */}
                  <ul className="space-y-2 mb-4 text-sm">
                    <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span><strong>100 credits every month</strong> • Unused credits roll over (up to 200)</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Priority support</strong> • Get help when you need it</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Cancel anytime</strong> • No long-term commitment</span>
                    </li>
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem('prpm_token')
                      if (!token) {
                        setError('Not authenticated')
                        return
                      }

                      try {
                        const currentUrl = window.location.origin
                        const result = await subscribeToPRPMPlus(
                          token,
                          `${currentUrl}/playground?subscription=success`,
                          `${currentUrl}/playground?subscription=cancelled`
                        )

                        if (result.checkoutUrl) {
                          window.location.href = result.checkoutUrl
                        }
                      } catch (err: any) {
                        console.error('Failed to start subscription:', err)
                        setError(err.message || 'Failed to start subscription')
                      }
                    }}
                    disabled={purchasing}
                    className="w-full py-3 px-6 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white font-bold rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-yellow-500/30"
                  >
                    Upgrade to PRPM+ • Save 40%
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
