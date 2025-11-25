'use client';

import { useEffect, useState } from 'react';

interface DynamicPackageContentProps {
  packageName: string;
  fallbackContent: string | null;
}

export default function DynamicPackageContent({ packageName, fallbackContent }: DynamicPackageContentProps) {
  const [content, setContent] = useState<string | null>(fallbackContent);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function fetchFreshContent() {
      setIsUpdating(true);
      try {
        const registryUrl = process.env.NEXT_PUBLIC_REGISTRY_URL || 'https://registry.prpm.dev';
        const response = await fetch(`${registryUrl}/api/v1/packages/${encodeURIComponent(packageName)}`);

        if (response.ok) {
          const data = await response.json();

          // Check if content has changed
          const freshContent = data.full_content || data.snippet || null;
          if (freshContent && freshContent !== content) {
            setContent(freshContent);
          }
        }
      } catch (error) {
        console.error('Failed to fetch fresh package content:', error);
      } finally {
        setIsUpdating(false);
      }
    }

    fetchFreshContent();
  }, [packageName, content]);

  if (!content) {
    return null;
  }

  return (
    <div className="relative">
      {isUpdating && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-prpm-dark px-2 py-1 rounded">
            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Updating...
          </div>
        </div>
      )}
      <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4 overflow-x-auto">
        <pre className="text-sm text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
          <code>{content}</code>
        </pre>
      </div>
    </div>
  );
}
