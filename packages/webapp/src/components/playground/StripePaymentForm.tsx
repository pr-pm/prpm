'use client'

import { useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

interface StripePaymentFormProps {
  onSuccess: () => void
  onCancel: () => void
  credits: number
  price: number
}

export default function StripePaymentForm({ onSuccess, onCancel, credits, price }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/playground?purchase=success`,
        },
      })

      if (submitError) {
        setError(submitError.message || 'Payment failed')
        setProcessing(false)
      } else {
        // Payment succeeded, will redirect
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed')
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Purchase Summary */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-700 dark:text-gray-300 font-medium">Credits:</span>
          <span className="text-gray-900 dark:text-white font-bold text-lg">{credits}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-700 dark:text-gray-300 font-medium">Total:</span>
          <span className="text-gray-900 dark:text-white font-bold text-xl">
            ${(price / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Payment Element */}
      <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <PaymentElement />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 py-3 px-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 py-3 px-6 bg-prpm-green hover:bg-green-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? 'Processing...' : `Pay $${(price / 100).toFixed(2)}`}
        </button>
      </div>
    </form>
  )
}
