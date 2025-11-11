'use client';

import { useEffect, useState } from 'react';

interface LatestVersionData {
  version: string;
  published_at: string;
}

interface LatestVersionBadgeProps {
  packageId: string;
  fallbackVersion?: string;
  fallbackDate?: string;
}

export default function LatestVersionBadge({ packageId, fallbackVersion, fallbackDate }: LatestVersionBadgeProps) {
  const [versionData, setVersionData] = useState<LatestVersionData | null>(
    fallbackVersion && fallbackDate ? { version: fallbackVersion, published_at: fallbackDate } : null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatestVersion() {
      try {
        const registryUrl = process.env.NEXT_PUBLIC_REGISTRY_URL || 'https://registry.prpm.dev';
        const response = await fetch(`${registryUrl}/api/v1/packages/${encodeURIComponent(packageId)}/versions`);

        if (response.ok) {
          const data = await response.json();
          const latestVersion = data.versions?.[0]; // Versions are ordered by published_at DESC

          if (latestVersion) {
            setVersionData({
              version: latestVersion.version,
              published_at: latestVersion.published_at,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch latest version:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLatestVersion();
  }, [packageId]);

  if (!versionData && loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 animate-pulse">
        <span className="w-16 h-4 bg-gray-700 rounded"></span>
        <span>•</span>
        <span className="w-24 h-4 bg-gray-700 rounded"></span>
      </div>
    );
  }

  if (!versionData) {
    return null;
  }

  const publishedDate = new Date(versionData.published_at);
  const now = new Date();
  const diffMs = now.getTime() - publishedDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let timeAgo: string;
  if (diffDays === 0) {
    timeAgo = 'Today';
  } else if (diffDays === 1) {
    timeAgo = 'Yesterday';
  } else if (diffDays < 7) {
    timeAgo = `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    timeAgo = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    timeAgo = `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    timeAgo = `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <span className="font-mono text-gray-300">v{versionData.version}</span>
      <span>•</span>
      <span title={publishedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}>
        {timeAgo}
      </span>
    </div>
  );
}
