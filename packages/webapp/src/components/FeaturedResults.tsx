'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface FeaturedResult {
  session_id: string;
  share_token: string;
  package_name: string;
  package_version?: string;
  model: string;
  feature_description?: string;
  feature_display_order: number;
  user_input: string;
  assistant_response: string;
  credits_spent: number;
  total_tokens: number;
  featured_at: string;
  created_at: string;
}

interface FeaturedResultsProps {
  packageId: string;
}

export default function FeaturedResults({ packageId }: FeaturedResultsProps) {
  const [results, setResults] = useState<FeaturedResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/v1/playground/packages/${packageId}/featured`
        );

        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        }
      } catch (error) {
        console.error('Failed to fetch featured results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [packageId]);

  if (loading) {
    return null; // Don't show loading state
  }

  if (results.length === 0) {
    return null; // Don't show section if no featured results
  }

  return (
    <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-6 h-6 text-prpm-accent" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <h2 className="text-xl font-semibold text-white">Featured Examples</h2>
        <p className="text-sm text-gray-400">Hand-picked by the author</p>
      </div>

      <div className="space-y-4">
        {results.map((result) => (
          <Link
            key={result.session_id}
            href={`/playground/shared/${result.share_token}`}
            className="block bg-prpm-dark border border-prpm-accent/30 hover:border-prpm-accent rounded-lg p-4 transition-colors"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="px-2 py-0.5 bg-prpm-accent/20 text-prpm-accent border border-prpm-accent/30 rounded text-xs font-medium">
                  Featured
                </span>
                <span className="px-2 py-0.5 bg-prpm-dark rounded text-xs">{result.model}</span>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(result.featured_at).toLocaleDateString()}
              </div>
            </div>

            {/* Author Description */}
            {result.feature_description && (
              <div className="mb-3 text-sm text-prpm-accent">
                &ldquo;{result.feature_description}&rdquo;
              </div>
            )}

            {/* Content Preview */}
            <div className="space-y-2">
              <div>
                <div className="text-xs text-blue-400 mb-1">User Input:</div>
                <div className="text-sm text-gray-300 line-clamp-2">{result.user_input}</div>
              </div>
              <div>
                <div className="text-xs text-green-400 mb-1">Response:</div>
                <div className="text-sm text-gray-300 line-clamp-3">
                  {result.assistant_response}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-prpm-border flex items-center justify-between text-xs text-gray-500">
              <span>{result.total_tokens.toLocaleString()} tokens</span>
              <span className="text-prpm-accent hover:underline">View full result →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
