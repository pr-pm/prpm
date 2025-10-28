'use client'

import { useEffect } from 'react'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Auto-login for local development
    const isDev = process.env.NEXT_PUBLIC_IS_LOCAL === 'true'
    if (isDev) {
      const existingToken = localStorage.getItem('prpm_token')
      if (!existingToken) {
        console.log('[Dev Mode] Auto-login: Setting mock credentials for khaliqgant')
        localStorage.setItem('prpm_token', 'dev-mock-token-khaliqgant')
        localStorage.setItem('prpm_username', 'khaliqgant')
      }
    }
  }, [])

  return <>{children}</>
}
