'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface PlaygroundMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tokens?: number;
}

interface SharedSession {
  id: string;
  package_id: string;
  package_name: string;
  package_version?: string;
  model: string;
  conversation: PlaygroundMessage[];
  credits_spent: number;
  total_tokens: number;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  shared_at: string;
  created_at: string;
}

export default function SharedResultPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [session, setSession] = useState<SharedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/v1/playground/shared/${token}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Shared result not found');
          } else {
            setError('Failed to load shared result');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setSession(data);
      } catch (err) {
        setError('Failed to load shared result');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [token]);

  const handleFeedback = async (isHelpful: boolean) => {
    try {
      const response = await fetch(`/api/v1/playground/shared/${token}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_helpful: isHelpful,
          feedback_text: feedbackText || undefined,
        }),
      });

      if (response.ok) {
        setFeedback(isHelpful);
        setShowFeedbackForm(false);

        // Update local counts
        if (session) {
          setSession({
            ...session,
            helpful_count: session.helpful_count + (isHelpful ? 1 : 0),
            not_helpful_count: session.not_helpful_count + (isHelpful ? 0 : 1),
          });
        }
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-prpm-dark flex items-center justify-center">
        <div className="text-gray-400">Loading shared result...</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-prpm-dark flex items-center justify-center">
        <div className="max-w-md w-full bg-prpm-dark-card border border-prpm-border rounded-lg p-8 text-center">
          <svg
            className="w-16 h-16 text-gray-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className="text-xl font-semibold text-white mb-2">{error}</h1>
          <p className="text-gray-400 mb-6">
            This shared result may have been removed or the link may be incorrect.
          </p>
          <Link
            href="/playground"
            className="inline-block px-4 py-2 bg-prpm-accent hover:bg-prpm-accent/80 text-white rounded-lg transition-colors"
          >
            Go to Playground
          </Link>
        </div>
      </div>
    );
  }

  const helpfulRatio =
    session.helpful_count + session.not_helpful_count > 0
      ? Math.round(
          (session.helpful_count / (session.helpful_count + session.not_helpful_count)) * 100
        )
      : null;

  return (
    <div className="min-h-screen bg-prpm-dark">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Link href="/playground" className="hover:text-prpm-accent transition-colors">
              Playground
            </Link>
            <span>/</span>
            <span>Shared Result</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {session.package_name}
            {session.package_version && (
              <span className="text-gray-400 text-lg ml-2">v{session.package_version}</span>
            )}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
              <span>{session.model}</span>
            </div>
            <div className="flex items-center gap-2">
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
              <span>{session.view_count} views</span>
            </div>
            {helpfulRatio !== null && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
                <span>{helpfulRatio}% helpful</span>
              </div>
            )}
          </div>
        </div>

        {/* Conversation */}
        <div className="space-y-4 mb-6">
          {session.conversation.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-prpm-dark-card border border-prpm-border'
                  : 'bg-prpm-dark-card/50 border border-prpm-border/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    message.role === 'user'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}
                >
                  {message.role === 'user' ? 'User' : 'Assistant'}
                </div>
                {message.tokens && (
                  <span className="text-xs text-gray-500">{message.tokens} tokens</span>
                )}
              </div>
              <div className="text-gray-200 whitespace-pre-wrap">{message.content}</div>
            </div>
          ))}
        </div>

        {/* Feedback Section */}
        <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Was this result helpful?</h3>

          {feedback === null ? (
            <div className="space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setFeedback(true);
                    setShowFeedbackForm(true);
                  }}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    />
                  </svg>
                  Yes, helpful
                </button>
                <button
                  onClick={() => {
                    setFeedback(false);
                    setShowFeedbackForm(true);
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
                    />
                  </svg>
                  Not helpful
                </button>
              </div>

              {showFeedbackForm && (
                <div className="space-y-3">
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Optional: Tell us more about your experience..."
                    className="w-full px-3 py-2 bg-prpm-dark border border-prpm-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-prpm-accent resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFeedback(feedback === true)}
                      className="px-4 py-2 bg-prpm-accent hover:bg-prpm-accent/80 text-white font-medium rounded-lg transition-colors"
                    >
                      Submit Feedback
                    </button>
                    <button
                      onClick={() => {
                        setShowFeedbackForm(false);
                        setFeedback(null);
                        setFeedbackText('');
                      }}
                      className="px-4 py-2 bg-prpm-dark-card hover:bg-prpm-dark border border-prpm-border text-gray-300 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-green-400 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Thank you for your feedback!</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Link
            href={`/playground?package=${session.package_id}`}
            className="flex-1 px-4 py-3 bg-prpm-accent hover:bg-prpm-accent/80 text-white font-medium rounded-lg transition-colors text-center"
          >
            Try this package
          </Link>
          <Link
            href={`/packages/${session.package_name.split('/')[0]}/${session.package_name.split('/')[1]}`}
            className="px-4 py-3 bg-prpm-dark-card hover:bg-prpm-dark border border-prpm-border text-gray-300 font-medium rounded-lg transition-colors"
          >
            View Package
          </Link>
        </div>
      </div>
    </div>
  );
}
