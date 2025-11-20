'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SharedResult {
  session_id: string;
  share_token: string;
  package_name: string;
  package_version?: string;
  model: string;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  helpfulness_ratio: number;
  user_input: string;
  assistant_response: string;
  credits_spent: number;
  total_tokens: number;
  shared_at: string;
  created_at: string;
}

interface SharedResultsProps {
  packageId: string;
  limit?: number;
}

export default function SharedResults({ packageId, limit = 5 }: SharedResultsProps) {
  const [results, setResults] = useState<SharedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'helpful'>('popular');

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const registryUrl = process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111';
        const response = await fetch(
          `${registryUrl}/api/v1/playground/packages/${packageId}/top-results?limit=${limit}&sort=${sortBy}`
        );

        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        }
      } catch (error) {
        console.error('Failed to fetch shared results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [packageId, limit, sortBy]);

  if (loading) {
    return (
      <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">🎯 Community Test Results</h2>
        <div className="text-center py-8 text-gray-400">Loading results...</div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">🎯 Community Test Results</h2>
        <div className="text-center py-8">
          <svg
            className="w-12 h-12 text-gray-600 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <p className="text-gray-400 mb-4">No shared test results yet</p>
          <p className="text-sm text-gray-500">Be the first to test this package and share your results!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">🎯 Community Test Results</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('popular')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              sortBy === 'popular'
                ? 'bg-prpm-accent text-white'
                : 'bg-prpm-dark text-gray-400 hover:text-white'
            }`}
          >
            Popular
          </button>
          <button
            onClick={() => setSortBy('recent')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              sortBy === 'recent'
                ? 'bg-prpm-accent text-white'
                : 'bg-prpm-dark text-gray-400 hover:text-white'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setSortBy('helpful')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              sortBy === 'helpful'
                ? 'bg-prpm-accent text-white'
                : 'bg-prpm-dark text-gray-400 hover:text-white'
            }`}
          >
            Helpful
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {results.map((result) => {
          const helpfulPercentage =
            result.helpful_count + result.not_helpful_count > 0
              ? Math.round(
                  (result.helpful_count / (result.helpful_count + result.not_helpful_count)) * 100
                )
              : null;

          return (
            <Link
              key={result.session_id}
              href={`/playground/shared?token=${result.share_token}`}
              className="block bg-prpm-dark border border-prpm-border hover:border-prpm-accent rounded-lg p-4 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <span>{result.view_count}</span>
                  </div>
                  {helpfulPercentage !== null && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                        />
                      </svg>
                      <span>{helpfulPercentage}%</span>
                    </div>
                  )}
                  <span className="px-2 py-0.5 bg-prpm-dark rounded text-xs">{result.model}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(result.shared_at).toLocaleDateString()}
                </div>
              </div>

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
          );
        })}
      </div>
    </div>
  );
}
