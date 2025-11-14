'use client'

import { useEffect, useState } from 'react'
import StarButton from './StarButton'
import { getStarredPackages, getStarredCollections } from '../lib/api'

interface StarButtonWrapperProps {
  type: 'package' | 'collection'
  id: string
  scope?: string
  nameSlug?: string
  initialStars?: number
}

export default function StarButtonWrapper({
  type,
  id,
  scope,
  nameSlug,
  initialStars = 0,
}: StarButtonWrapperProps) {
  const [isStarred, setIsStarred] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkStarStatus = async () => {
      const token = localStorage.getItem('prpm_token')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        if (type === 'package') {
          const { packages } = await getStarredPackages(token, 100, 0)
          setIsStarred(packages.some(pkg => pkg.id === id))
        } else {
          const { collections } = await getStarredCollections(token, 100, 0)
          setIsStarred(collections.some(col => col.id === id))
        }
      } catch (error) {
        console.error('Failed to check star status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkStarStatus()
  }, [type, id])

  // Don't render if id is missing
  if (!id) {
    console.warn('[StarButtonWrapper] Missing id for', type)
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-prpm-dark-card border border-prpm-border rounded-lg">
        <svg className="w-5 h-5 animate-pulse text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <span className="text-sm text-gray-500">...</span>
      </div>
    )
  }

  return (
    <StarButton
      type={type}
      id={id}
      scope={scope}
      nameSlug={nameSlug}
      initialStarred={isStarred}
      initialStars={initialStars}
    />
  )
}
