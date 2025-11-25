'use client';

import { useState } from 'react';

const REGISTRY_URL = process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111';

interface FeedbackPromptProps {
  sessionId: string;
  exchangeIndex: number;
  onFeedbackSubmitted?: () => void;
}

export default function FeedbackPrompt({ sessionId, exchangeIndex, onFeedbackSubmitted }: FeedbackPromptProps) {
  const [answered, setAnswered] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEffective, setIsEffective] = useState<boolean | null>(null);

  const handleAnswer = async (effective: boolean) => {
    setIsEffective(effective);
    setAnswered(true);
    setShowComment(true);
  };

  const submitFeedback = async (isEffective: boolean, commentText: string | null) => {
    if (isSubmitting || submitted) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('prpm_token');
      const response = await fetch(`${REGISTRY_URL}/api/v1/playground/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          session_id: sessionId,
          exchange_index: exchangeIndex,
          is_effective: isEffective,
          comment: commentText || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit feedback');
      }

      setSubmitted(true);
      onFeedbackSubmitted?.();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const handleCommentSubmit = () => {
    if (answered && isEffective !== null) {
      submitFeedback(isEffective, comment);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleCommentSubmit();
    }
  };

  if (submitted) {
    return (
      <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
        <p className="text-green-400 text-sm">✓ Thanks for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 bg-prpm-dark-card border border-prpm-border rounded-lg">
      {!answered ? (
        <div>
          <p className="text-gray-300 text-sm mb-3">Was this result effective?</p>
          <div className="flex gap-3">
            <button
              onClick={() => handleAnswer(true)}
              className="px-6 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 rounded-lg transition-all font-medium"
            >
              Yes
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-lg transition-all font-medium"
            >
              No
            </button>
          </div>
        </div>
      ) : showComment && !submitted ? (
        <div>
          <p className="text-gray-300 text-sm mb-3">Any additional comments? (optional)</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share your thoughts... (Ctrl+Enter or Cmd+Enter to submit)"
            maxLength={1000}
            className="w-full px-3 py-2 bg-prpm-dark border border-prpm-border rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-prpm-accent resize-none"
            rows={3}
          />
          <div className="mt-3 flex justify-between items-center">
            <p className="text-gray-500 text-xs">
              {comment.length}/1000 characters
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCommentSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all text-sm font-medium"
              >
                Skip
              </button>
              <button
                onClick={handleCommentSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-prpm-accent hover:bg-prpm-accent/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all text-sm font-medium"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
          {error && (
            <p className="mt-2 text-red-400 text-sm">{error}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
