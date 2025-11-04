'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SuggestedInput {
  id: string;
  title: string;
  description?: string;
  suggested_input: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimated_credits: number;
  recommended_model?: string;
  usage_count: number;
}

interface SuggestedTestInputsProps {
  packageId: string;
  onInputSelect?: (input: string, model?: string) => void;
}

export default function SuggestedTestInputs({ packageId, onInputSelect }: SuggestedTestInputsProps) {
  const [inputs, setInputs] = useState<SuggestedInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  useEffect(() => {
    const fetchInputs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedDifficulty) params.append('difficulty', selectedDifficulty);

        const response = await fetch(
          `/api/v1/suggested-inputs/package/${packageId}?${params.toString()}`
        );

        if (response.ok) {
          const data = await response.json();
          setInputs(data.suggested_inputs || []);
        }
      } catch (error) {
        console.error('Failed to fetch suggested test inputs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInputs();
  }, [packageId, selectedCategory, selectedDifficulty]);

  const handleTryThis = async (input: SuggestedInput) => {
    try {
      // Record usage
      await fetch('/api/v1/suggested-inputs/record-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggested_input_id: input.id }),
      });

      // If onInputSelect is provided, use it (for inline playground)
      if (onInputSelect) {
        onInputSelect(input.suggested_input, input.recommended_model);
      } else {
        // Otherwise, navigate to playground with pre-filled input
        const params = new URLSearchParams({
          package: packageId,
          input: input.suggested_input,
        });
        if (input.recommended_model) {
          params.append('model', input.recommended_model);
        }
        window.location.href = `/playground?${params.toString()}`;
      }
    } catch (error) {
      console.error('Failed to record usage:', error);
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'code-review':
        return '🔍';
      case 'documentation':
        return '📝';
      case 'bug-fix':
        return '🐛';
      case 'feature':
        return '✨';
      case 'refactoring':
        return '♻️';
      case 'testing':
        return '🧪';
      default:
        return '💡';
    }
  };

  const uniqueCategories = Array.from(new Set(inputs.map(i => i.category).filter(Boolean)));
  const uniqueDifficulties = Array.from(new Set(inputs.map(i => i.difficulty).filter(Boolean)));

  if (loading) {
    return (
      <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">💡 Suggested Test Inputs</h2>
        <div className="text-center py-8 text-gray-400">Loading suggested inputs...</div>
      </div>
    );
  }

  if (inputs.length === 0) {
    return null; // Don't show section if no inputs
  }

  return (
    <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">💡 Suggested Test Inputs</h2>
        <p className="text-sm text-gray-400">Author-curated examples to try</p>
      </div>

      {/* Filters */}
      {(uniqueCategories.length > 1 || uniqueDifficulties.length > 1) && (
        <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-prpm-border">
          {uniqueCategories.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Category:</span>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedCategory === null
                    ? 'bg-prpm-accent text-white'
                    : 'bg-prpm-dark text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              {uniqueCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat as string)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    selectedCategory === cat
                      ? 'bg-prpm-accent text-white'
                      : 'bg-prpm-dark text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {uniqueDifficulties.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Difficulty:</span>
              <button
                onClick={() => setSelectedDifficulty(null)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedDifficulty === null
                    ? 'bg-prpm-accent text-white'
                    : 'bg-prpm-dark text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              {uniqueDifficulties.map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff as string)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    selectedDifficulty === diff
                      ? 'bg-prpm-accent text-white'
                      : 'bg-prpm-dark text-gray-400 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggested Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {inputs.map((input) => (
          <div
            key={input.id}
            className="bg-prpm-dark border border-prpm-border rounded-lg p-4 hover:border-prpm-accent/50 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getCategoryIcon(input.category)}</span>
                  <h3 className="text-white font-medium">{input.title}</h3>
                </div>
                {input.description && (
                  <p className="text-sm text-gray-400 mb-2">{input.description}</p>
                )}
              </div>
            </div>

            {/* Input Preview */}
            <div className="bg-prpm-dark-card border border-prpm-border rounded p-3 mb-3">
              <p className="text-sm text-gray-300 line-clamp-3">{input.suggested_input}</p>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
              {input.difficulty && (
                <span className={`px-2 py-1 rounded border ${getDifficultyColor(input.difficulty)}`}>
                  {input.difficulty}
                </span>
              )}
              {input.category && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                  {input.category}
                </span>
              )}
              <span className="px-2 py-1 bg-prpm-dark border border-prpm-border rounded text-gray-400">
                ~{input.estimated_credits} {input.estimated_credits === 1 ? 'credit' : 'credits'}
              </span>
              {input.recommended_model && (
                <span className="px-2 py-1 bg-prpm-dark border border-prpm-border rounded text-gray-400">
                  {input.recommended_model}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleTryThis(input)}
                className="flex-1 px-4 py-2 bg-prpm-accent hover:bg-prpm-accent/80 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Try This in Playground →
              </button>
              {input.usage_count > 0 && (
                <span className="ml-3 text-xs text-gray-500">
                  {input.usage_count} {input.usage_count === 1 ? 'try' : 'tries'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State for Filters */}
      {inputs.length === 0 && (selectedCategory || selectedDifficulty) && (
        <div className="text-center py-8">
          <p className="text-gray-400">No inputs match the selected filters</p>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedDifficulty(null);
            }}
            className="mt-3 text-sm text-prpm-accent hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
