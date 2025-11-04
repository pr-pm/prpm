'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import BuyCreditsModal from '../../../../components/playground/BuyCreditsModal'

function BuyCreditsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('prpm_token')

    if (!token) {
      // Redirect to login with return URL
      const packageParam = searchParams.get('package')
      const returnUrl = packageParam
        ? `/playground/credits/buy?package=${packageParam}`
        : '/playground/credits/buy'
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`)
      return
    }

    setIsAuthenticated(true)
    setIsChecking(false)
  }, [router, searchParams])

  const handleClose = () => {
    // Show success message before closing
    router.push('/playground')
  }

  const handleSuccess = () => {
    // Redirect back to playground after successful purchase
    router.push('/playground?purchase=success')
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Loading...
          </h1>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <BuyCreditsModal onClose={handleClose} onSuccess={handleSuccess} />
    </div>
  )
}

export default function BuyCreditsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Loading...
          </h1>
        </div>
      </div>
    }>
      <BuyCreditsContent />
    </Suspense>
  )
}
