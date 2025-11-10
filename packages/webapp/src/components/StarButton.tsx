'use client'

import { useState } from 'react'
import { starPackage, starCollection } from '../lib/api'

interface StarButtonProps {
  type: 'package' | 'collection'
  id: string // packageId for packages
  scope?: string // for collections
  nameSlug?: string // for collections
  initialStarred?: boolean
  initialStars?: number
  onStarChange?: (starred: boolean, stars: number) => void
}

export default function StarButton({
  type,
  id,
  scope,
  nameSlug,
  initialStarred = false,
  initialStars = 0,
  onStarChange,
}: StarButtonProps) {
  const [starred, setStarred] = useState(initialStarred)
  const [stars, setStars] = useState(initialStars)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStar = async () => {
    const token = localStorage.getItem('prpm_token')
    if (!token) {
      setError('Please log in to star')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let result
      if (type === 'package') {
        result = await starPackage(token, id, !starred)
      } else {
        if (!scope || !nameSlug) {
          throw new Error('Collection scope and nameSlug are required')
        }
        result = await starCollection(token, scope, nameSlug, !starred)
      }

      setStarred(result.starred)
      setStars(result.stars)

      if (onStarChange) {
        onStarChange(result.starred, result.stars)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to star')
      console.error('Failed to star:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleStar}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          starred
            ? 'bg-prpm-accent/20 text-prpm-accent hover:bg-prpm-accent/30'
            : 'bg-prpm-dark-card border border-prpm-border hover:bg-prpm-dark hover:border-prpm-accent text-gray-300'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={starred ? 'Unstar' : 'Star'}
      >
        <svg
          className={`w-5 h-5 ${starred ? 'fill-current' : ''}`}
          fill={starred ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
        <span className="text-sm font-medium">{stars}</span>
      </button>
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </div>
  )
}
