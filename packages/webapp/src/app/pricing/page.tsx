'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { subscribeToPRPMPlus, getCurrentUser } from '@/lib/api'

export default function PricingPage() {
  const router = useRouter()
  const [subscribing, setSubscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPRPMPlus, setIsPRPMPlus] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSubscriptionStatus()
  }, [])

  const checkSubscriptionStatus = async () => {
    const token = localStorage.getItem('prpm_token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const user = await getCurrentUser(token)
      setIsPRPMPlus(user.prpm_plus_status === 'active')
    } catch (err) {
      console.error('Failed to check subscription status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribeClick = async () => {
    // Check if user is logged in
    const token = localStorage.getItem('prpm_token')
    if (!token) {
      router.push('/login?redirect=/pricing')
      return
    }

    setSubscribing(true)
    setError(null)

    try {
      const currentUrl = window.location.origin
      const result = await subscribeToPRPMPlus(
        token,
        `${currentUrl}/playground?subscription=success`,
        `${currentUrl}/pricing?subscription=cancelled`
      )

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
    <main className="min-h-screen bg-prpm-dark">
      <Header showDashboard showAccount />

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">
            Simple Pricing
          </h1>
          <p className="text-xl text-gray-400">
            Start free. Upgrade when you need more.
          </p>
        </div>

        {/* Individual Plans */}
        {!loading && !isPRPMPlus && (
          <div className="max-w-md mx-auto mb-16">
            {/* PRPM+ */}
            <div className="bg-gradient-to-br from-prpm-accent/10 to-prpm-green/10 border-2 border-prpm-accent rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-2">PRPM+</h3>
              <div className="text-4xl font-bold text-white mb-1">
                $6
                <span className="text-xl text-gray-400 font-normal">/month</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">100 credits every month</p>

              <ul className="space-y-3 mb-8 text-gray-300">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  100 monthly playground credits
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Test packages with AI models
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Credits roll over (max 200)
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Priority support
                </li>
              </ul>

              <button
                onClick={handleSubscribeClick}
                disabled={subscribing}
                className="block w-full py-3 text-center bg-prpm-accent hover:bg-prpm-accent/80 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {subscribing ? 'Opening checkout...' : 'Subscribe Now'}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Already subscribed message */}
        {!loading && isPRPMPlus && (
          <div className="max-w-md mx-auto mb-16">
            <div className="bg-gradient-to-br from-green-600/10 to-green-500/10 border-2 border-green-500 rounded-xl p-8 text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">You're a PRPM+ Member!</h3>
              <p className="text-gray-300 mb-6">
                You already have access to 100 monthly playground credits and all PRPM+ benefits.
              </p>
              <Link
                href="/account"
                className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
              >
                Manage Subscription
              </Link>
            </div>
          </div>
        )}

        {/* Organizations */}
        <div className="border-t border-prpm-border pt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              For Organizations
            </h2>
            <p className="text-gray-400">
              Private packages, verified badges, and team features
            </p>
          </div>

          <div className="bg-prpm-dark-card border border-prpm-border rounded-xl p-8 max-w-2xl mx-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Verified Organization</h3>
                <div className="text-3xl font-bold text-prpm-accent mt-2">
                  $20<span className="text-lg text-gray-400 font-normal">/month</span>
                </div>
              </div>
            </div>

            <ul className="space-y-3 mb-8 text-gray-300">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                ✅ Verified badge
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Private packages
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Advanced analytics
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                PRPM+ for members at $3/month
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Priority support
              </li>
            </ul>

            <Link
              href="/organizations"
              className="block w-full py-3 text-center bg-prpm-accent hover:bg-prpm-accent/80 text-white font-semibold rounded-lg transition"
            >
              Create Organization
            </Link>
          </div>
        </div>

        {/* Simple FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Questions?
          </h2>

          <div className="space-y-4">
            <details className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6 group">
              <summary className="font-semibold text-white cursor-pointer">
                What are playground credits?
              </summary>
              <p className="mt-3 text-gray-400">
                Credits let you test packages with AI models before installing. 1 credit = 5,000 tokens.
              </p>
            </details>

            <details className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6 group">
              <summary className="font-semibold text-white cursor-pointer">
                Can I cancel anytime?
              </summary>
              <p className="mt-3 text-gray-400">
                Yes. Cancel from your account settings. Access continues until the end of your billing period.
              </p>
            </details>

            <details className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6 group">
              <summary className="font-semibold text-white cursor-pointer">
                Do I need to pay to publish packages?
              </summary>
              <p className="mt-3 text-gray-400">
                No. Publishing public packages is free. Only private packages require a Verified Organization subscription.
              </p>
            </details>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-400 mb-4">Still have questions?</p>
            <Link
              href="mailto:hello@prpm.dev?subject=Pricing%20Question"
              className="inline-block px-6 py-3 bg-prpm-accent hover:bg-prpm-accent/80 text-white font-semibold rounded-lg transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
