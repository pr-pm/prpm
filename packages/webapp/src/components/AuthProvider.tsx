'use client'

import { useEffect } from 'react'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Auto-login for local development
    // Set NEXT_PUBLIC_DEV_AUTO_AUTH_USER=username to automatically authenticate as that user
    const isDev = process.env.NEXT_PUBLIC_IS_LOCAL === 'true'
    const devUsername = process.env.NEXT_PUBLIC_DEV_AUTO_AUTH_USER

    if (isDev && devUsername) {
      const existingToken = localStorage.getItem('prpm_token')
      if (!existingToken) {
        console.log(`[Dev Mode] Auto-login: Setting mock credentials for ${devUsername}`)
        localStorage.setItem('prpm_token', 'dev-auto-auth-token')
        localStorage.setItem('prpm_username', devUsername)
      }
    }
  }, [])

  return <>{children}</>
}
