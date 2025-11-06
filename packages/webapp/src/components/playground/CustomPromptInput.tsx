'use client';

/**
 * Custom Prompt Input Component
 *
 * Allows verified authors to input and test custom prompts
 * SECURITY: Isolation-based (no validation, just sandbox execution)
 */

import { useState, useEffect } from 'react';

interface CustomPromptInputProps {
  onPromptChange: (prompt: string) => void;
  onUseCustom: (enabled: boolean) => void;
  isVerifiedAuthor: boolean;
}

interface FeatureInfo {
  available: boolean;
  requirements?: {
    verified_author: boolean;
    github_linked: boolean;
    description: string;
  };
  limits?: {
    max_prompt_length: number;
    min_prompt_length: number;
    recommended_length: string;
    max_tokens_output: number;
    timeout_seconds: number;
  };
  pricing?: {
    credit_multiplier: number;
    description: string;
    example: string;
  };
  sandbox?: {
    tools_enabled: boolean;
    description: string;
    why: string;
  };
  tips?: string[];
}

export default function CustomPromptInput({
  onPromptChange,
  onUseCustom,
  isVerifiedAuthor,
}: CustomPromptInputProps) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [featureInfo, setFeatureInfo] = useState<FeatureInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch feature info on mount
  useEffect(() => {
    async function fetchInfo() {
      try {
        const response = await fetch('/api/v1/custom-prompt/info', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setFeatureInfo(data);
        }
      } catch (error) {
        console.error('Failed to fetch custom prompt info:', error);
      }
    }
    fetchInfo();
  }, []);

  const handleToggle = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    onUseCustom(newEnabled);

    if (!newEnabled) {
      // Cleared - reset prompt
      setCustomPrompt('');
      onPromptChange('');
    }
  };

  const handlePromptChange = (value: string) => {
    setCustomPrompt(value);
    onPromptChange(value);
  };

  // Character count with color coding
  const getCharCountColor = () => {
    const len = customPrompt.length;
    if (len < 10) return 'text-red-400';
    if (len < 50) return 'text-yellow-400';
    if (len > 20000) return 'text-orange-400';
    if (len > 50000) return 'text-red-400';
    return 'text-gray-400';
  };

  if (!isVerifiedAuthor) {
    return (
      <div className="mt-6 p-6 bg-prpm-dark-card border border-prpm-border rounded-lg">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg className="w-12 h-12 text-prpm-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              Custom Prompts (Verified Authors Only)
            </h3>
            <p className="text-gray-300 mb-4">
              Test your own prompts against published packages. This feature is available to verified authors with linked GitHub accounts.
            </p>
            <a
              href="/auth/github"
              className="inline-flex items-center px-4 py-2 bg-prpm-accent hover:bg-prpm-accent/80 text-white rounded-lg transition-all font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              Link GitHub Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Toggle and Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isEnabled ? 'bg-prpm-accent' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <label className="text-sm font-medium text-gray-300">
            Use Custom Prompt
          </label>
          {featureInfo?.pricing && (
            <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded">
              {featureInfo.pricing.credit_multiplier}x credits
            </span>
          )}
        </div>

        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-sm text-prpm-accent hover:text-prpm-accent/80 transition-colors"
        >
          {showInfo ? 'Hide Info' : 'Show Info'}
        </button>
      </div>

      {/* Feature Info Panel */}
      {showInfo && featureInfo && (
        <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-3">
          <h4 className="text-sm font-semibold text-blue-400">Custom Prompt Feature</h4>

          {featureInfo.sandbox && (
            <div className="text-sm text-gray-300">
              <p className="font-medium text-yellow-400 mb-1">⚠️ Sandbox Mode:</p>
              <p className="mb-2">{featureInfo.sandbox.description}</p>
              <p className="text-xs text-gray-400">{featureInfo.sandbox.why}</p>
            </div>
          )}

          {featureInfo.pricing && (
            <div className="text-sm text-gray-300">
              <p className="font-medium text-orange-400 mb-1">💰 Pricing:</p>
              <p className="mb-1">{featureInfo.pricing.description}</p>
              <p className="text-xs text-gray-400">Example: {featureInfo.pricing.example}</p>
            </div>
          )}

          {featureInfo.limits && (
            <div className="text-sm text-gray-300">
              <p className="font-medium text-gray-400 mb-1">📊 Limits:</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Max length: {featureInfo.limits.max_prompt_length.toLocaleString()} chars</li>
                <li>• Recommended: {featureInfo.limits.recommended_length}</li>
                <li>• Max output: {featureInfo.limits.max_tokens_output} tokens</li>
                <li>• Timeout: {featureInfo.limits.timeout_seconds}s</li>
              </ul>
            </div>
          )}

          {featureInfo.tips && featureInfo.tips.length > 0 && (
            <div className="text-sm text-gray-300">
              <p className="font-medium text-green-400 mb-1">💡 Tips:</p>
              <ul className="text-xs text-gray-400 space-y-1">
                {featureInfo.tips.map((tip, i) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Custom Prompt Textarea */}
      {isEnabled && (
        <div className="p-4 bg-prpm-dark-card border border-prpm-border rounded-lg">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Custom System Prompt
          </label>

          <textarea
            value={customPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="You are a helpful assistant that..."
            className="w-full h-40 px-3 py-2 bg-prpm-dark border border-prpm-border rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-prpm-accent resize-none font-mono text-sm"
            maxLength={50000}
          />

          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={getCharCountColor()}>
              {customPrompt.length.toLocaleString()} / 50,000 characters
            </span>

            {customPrompt.length < 10 && customPrompt.length > 0 && (
              <span className="text-red-400">
                Minimum 10 characters required
              </span>
            )}

            {customPrompt.length > 20000 && (
              <span className="text-orange-400">
                ⚠️ Very long prompt (will be expensive)
              </span>
            )}
          </div>

          {customPrompt.length >= 10 && (
            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400">
              ✓ Custom prompt will be used as the entire system context (no other instructions)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
