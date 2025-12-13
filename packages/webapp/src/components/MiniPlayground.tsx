'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MiniPlaygroundProps {
  packageId: string;
  packageName: string;
  suggestedInput?: string;
}

export default function MiniPlayground({
  packageId,
  packageName,
  suggestedInput = ''
}: MiniPlaygroundProps) {
  const [input, setInput] = useState(suggestedInput);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [isAnonymousLimitReached, setIsAnonymousLimitReached] = useState(false);

  const handleRun = async () => {
    if (!input.trim()) {
      setError('Please enter some input to test');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const registryUrl = process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111';
      const token = localStorage.getItem('prpm_token');

      // Use anonymous endpoint if no token
      if (!token) {
        const response = await fetch(`${registryUrl}/api/v1/playground/anonymous-run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            package_id: packageId,
            input: input.trim(),
          }),
        });

        if (response.status === 429) {
          setIsAnonymousLimitReached(true);
          setError('You\'ve used your free test. Sign up to get 5 free credits and continue testing!');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to run playground');
        }

        const data = await response.json();
        setResponse(data.response);
        setExpanded(true);
      } else {
        // Authenticated user - use regular endpoint
        const response = await fetch(`${registryUrl}/api/v1/playground/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            package_id: packageId,
            input: input.trim(),
            model: 'gpt-4o-mini', // Default to cheapest model for quick tests
          }),
        });

        if (response.status === 402) {
          const data = await response.json();
          setError(data.message || 'Insufficient credits');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to run playground');
        }

        const data = await response.json();
        setResponse(data.response);
        setExpanded(true);
      }
    } catch (err) {
      console.error('Playground error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  };

  return (
    <div className="bg-prpm-dark-card border border-prpm-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-prpm-accent/10 to-transparent px-6 py-4 border-b border-prpm-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-prpm-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Try It Live
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Test this package before installing
            </p>
          </div>
          <Link
            href={`/playground?package=${packageId}`}
            className="text-sm text-prpm-accent hover:text-prpm-accent/80 transition-colors flex items-center gap-1"
          >
            Full Playground
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Input
            <span className="text-gray-500 ml-2 font-normal">(Cmd/Ctrl + Enter to run)</span>
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Try: "Write a function that validates email addresses"`}
            className="w-full px-4 py-3 bg-prpm-dark border border-prpm-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-prpm-accent transition-colors resize-none"
            rows={3}
            disabled={loading}
          />
        </div>

        {/* Run Button */}
        <button
          onClick={handleRun}
          disabled={loading || !input.trim()}
          className="w-full px-4 py-3 bg-prpm-accent hover:bg-prpm-accent/80 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Running...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Run Test
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-300">{error}</p>
                {isAnonymousLimitReached && (
                  <div className="mt-3 flex gap-2">
                    <Link
                      href="/signup"
                      className="inline-block px-4 py-2 bg-prpm-accent hover:bg-prpm-accent/80 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Sign Up (Free)
                    </Link>
                    <Link
                      href="/login"
                      className="inline-block px-4 py-2 bg-prpm-dark-card hover:bg-prpm-dark border border-prpm-border text-gray-300 text-sm font-medium rounded-lg transition-colors"
                    >
                      Log In
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Response */}
        {response && (
          <div className={`transition-all duration-300 ${expanded ? 'max-h-[800px]' : 'max-h-[300px]'} overflow-hidden`}>
            <div className="bg-prpm-dark border border-prpm-accent/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium text-prpm-accent">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Result
                </div>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs text-gray-400 hover:text-prpm-accent transition-colors"
                >
                  {expanded ? 'Collapse' : 'Expand'}
                </button>
              </div>
              <div className={`prose prose-invert prose-sm max-w-none ${expanded ? '' : 'line-clamp-[12]'}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {response}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* CTA after successful run */}
        {response && (
          <div className="flex gap-2 pt-2">
            <Link
              href={`/playground?package=${packageId}&input=${encodeURIComponent(input)}`}
              className="flex-1 px-4 py-2 bg-prpm-dark-card hover:bg-prpm-dark border border-prpm-border text-gray-300 text-sm font-medium rounded-lg transition-colors text-center"
            >
              Continue in Full Playground
            </Link>
            <Link
              href="#installation"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('installation')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-prpm-accent hover:bg-prpm-accent/80 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Install Package
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
