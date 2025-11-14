'use client'

import { useEffect } from 'react'
import { addRecentPackage, addRecentCollection } from '../lib/recentlyViewed'
import type { RecentPackage, RecentCollection } from '../lib/recentlyViewed'

interface PackageTrackerProps {
  type: 'package'
  pkg: {
    id: string
    name: string
    description?: string
    format: string
    subtype?: string
  }
}

interface CollectionTrackerProps {
  type: 'collection'
  collection: {
    scope: string
    name_slug: string
    description?: string
    package_count?: number
  }
}

type RecentlyViewedTrackerProps = PackageTrackerProps | CollectionTrackerProps

/**
 * Client-side component that tracks recently viewed packages and collections
 * Adds them to localStorage on mount
 */
export default function RecentlyViewedTracker(props: RecentlyViewedTrackerProps) {
  useEffect(() => {
    try {
      if (props.type === 'package') {
        addRecentPackage({
          id: props.pkg.id,
          name: props.pkg.name,
          description: props.pkg.description,
          format: props.pkg.format,
          subtype: props.pkg.subtype,
        })
      } else {
        addRecentCollection({
          scope: props.collection.scope,
          name_slug: props.collection.name_slug,
          description: props.collection.description,
          package_count: props.collection.package_count,
        })
      }
    } catch (err) {
      // Silently fail - don't break page if localStorage fails
      console.error('[RecentlyViewedTracker] Failed to track view:', err)
    }
  }, [props])

  // This component doesn't render anything
  return null
}
