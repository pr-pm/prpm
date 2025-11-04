'use client';

import { useEffect, useState } from 'react';

interface SuggestedInput {
  id: string;
  package_id: string;
  package_name: string;
  title: string;
  description?: string;
  suggested_input: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimated_credits: number;
  recommended_model?: string;
  display_order: number;
  is_active: boolean;
  usage_count: number;
  total_clicks?: number;
  completed_tests?: number;
  created_at: string;
}

interface Package {
  id: string;
  name: string;
}

export default function SuggestedInputsManager() {
  const [inputs, setInputs] = useState<SuggestedInput[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingInput, setEditingInput] = useState<SuggestedInput | null>(null);
  const [formData, setFormData] = useState({
    package_id: '',
    title: '',
    description: '',
    suggested_input: '',
    category: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    estimated_credits: 1,
    recommended_model: '',
    display_order: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('prpm_token');
      if (!token) return;

      // Get user's packages
      const packagesRes = await fetch(
        `${process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111'}/api/v1/packages/author`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (packagesRes.ok) {
        const packagesData = await packagesRes.json();
        setPackages(packagesData.packages || []);
      }

      // Get user info to get author ID
      const userRes = await fetch(
        `${process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111'}/api/v1/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (userRes.ok) {
        const userData = await userRes.json();

        // Get suggested inputs
        const inputsRes = await fetch(
          `${process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111'}/api/v1/suggested-inputs/author/${userData.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (inputsRes.ok) {
          const inputsData = await inputsRes.json();
          setInputs(inputsData.suggested_inputs || []);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('prpm_token');
      if (!token) throw new Error('Not authenticated');

      const url = editingInput
        ? `${process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111'}/api/v1/suggested-inputs/${editingInput.id}`
        : `${process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111'}/api/v1/suggested-inputs`;

      const response = await fetch(url, {
        method: editingInput ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save suggested input');
      }

      // Reset form and reload
      setShowCreateForm(false);
      setEditingInput(null);
      setFormData({
        package_id: '',
        title: '',
        description: '',
        suggested_input: '',
        category: '',
        difficulty: 'beginner',
        estimated_credits: 1,
        recommended_model: '',
        display_order: 0,
      });
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (input: SuggestedInput) => {
    setEditingInput(input);
    setFormData({
      package_id: input.package_id,
      title: input.title,
      description: input.description || '',
      suggested_input: input.suggested_input,
      category: input.category || '',
      difficulty: input.difficulty || 'beginner',
      estimated_credits: input.estimated_credits,
      recommended_model: input.recommended_model || '',
      display_order: input.display_order,
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (inputId: string) => {
    if (!confirm('Are you sure you want to deactivate this suggested input?')) return;

    try {
      const token = localStorage.getItem('prpm_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111'}/api/v1/suggested-inputs/${inputId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete');

      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading suggested inputs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Suggested Test Inputs</h2>
          <p className="text-gray-400 mt-1">Guide users to the best examples of your packages</p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(true);
            setEditingInput(null);
            setFormData({
              package_id: '',
              title: '',
              description: '',
              suggested_input: '',
              category: '',
              difficulty: 'beginner',
              estimated_credits: 1,
              recommended_model: '',
              display_order: 0,
            });
          }}
          className="px-4 py-2 bg-prpm-accent hover:bg-prpm-accent/80 text-white rounded-lg transition-colors"
        >
          + Create Suggested Input
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingInput ? 'Edit Suggested Input' : 'Create Suggested Input'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Package Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Package</label>
              <select
                value={formData.package_id}
                onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
                required
                className="w-full px-3 py-2 bg-prpm-dark border border-prpm-border rounded-lg text-white"
              >
                <option value="">Select a package...</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                maxLength={100}
                placeholder="e.g., Review a React component"
                className="w-full px-3 py-2 bg-prpm-dark border border-prpm-border rounded-lg text-white"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Optional description of what this test demonstrates"
                className="w-full px-3 py-2 bg-prpm-dark border border-prpm-border rounded-lg text-white"
              />
            </div>

            {/* Suggested Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Suggested Input <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.suggested_input}
                onChange={(e) => setFormData({ ...formData, suggested_input: e.target.value })}
                required
                rows={4}
                placeholder="Enter the exact input text users should try..."
                className="w-full px-3 py-2 bg-prpm-dark border border-prpm-border rounded-lg text-white font-mono text-sm"
              />
            </div>

            {/* Category, Difficulty, Credits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-prpm-dark border border-prpm-border rounded-lg text-white"
                >
                  <option value="">None</option>
                  <option value="code-review">Code Review</option>
                  <option value="documentation">Documentation</option>
                  <option value="bug-fix">Bug Fix</option>
                  <option value="feature">Feature</option>
                  <option value="refactoring">Refactoring</option>
                  <option value="testing">Testing</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced',
                    })
                  }
                  className="w-full px-3 py-2 bg-prpm-dark border border-prpm-border rounded-lg text-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estimated Credits
                </label>
                <input
                  type="number"
                  value={formData.estimated_credits}
                  onChange={(e) =>
                    setFormData({ ...formData, estimated_credits: parseInt(e.target.value) })
                  }
                  min={1}
                  className="w-full px-3 py-2 bg-prpm-dark border border-prpm-border rounded-lg text-white"
                />
              </div>
            </div>

            {/* Recommended Model */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recommended Model (optional)
              </label>
              <select
                value={formData.recommended_model}
                onChange={(e) => setFormData({ ...formData, recommended_model: e.target.value })}
                className="w-full px-3 py-2 bg-prpm-dark border border-prpm-border rounded-lg text-white"
              >
                <option value="">None</option>
                <option value="sonnet">Claude Sonnet</option>
                <option value="opus">Claude Opus</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
              </select>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Order (lower = shown first)
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 bg-prpm-dark border border-prpm-border rounded-lg text-white"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-prpm-accent hover:bg-prpm-accent/80 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingInput ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingInput(null);
                  setError(null);
                }}
                className="px-4 py-2 bg-prpm-dark border border-prpm-border text-gray-300 rounded-lg hover:border-prpm-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inputs List */}
      {inputs.length === 0 ? (
        <div className="text-center py-12 bg-prpm-dark-card border border-prpm-border rounded-lg">
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
          <p className="text-gray-400">No suggested inputs yet</p>
          <p className="text-sm text-gray-500 mt-1">Create your first suggested input to guide users</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inputs.map((input) => (
            <div
              key={input.id}
              className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{input.title}</h3>
                    {!input.is_active && (
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded text-xs">
                        Inactive
                      </span>
                    )}
                    {input.difficulty && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs">
                        {input.difficulty}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{input.package_name}</p>
                  {input.description && <p className="text-sm text-gray-300">{input.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(input)}
                    className="px-3 py-1 bg-prpm-dark border border-prpm-border text-gray-300 rounded hover:border-prpm-accent transition-colors text-sm"
                  >
                    Edit
                  </button>
                  {input.is_active && (
                    <button
                      onClick={() => handleDelete(input.id)}
                      className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded hover:bg-red-500/30 transition-colors text-sm"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-prpm-dark border border-prpm-border rounded p-3 mb-4">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{input.suggested_input}</p>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                    />
                  </svg>
                  <span>{input.total_clicks || 0} clicks</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{input.completed_tests || 0} completed tests</span>
                </div>
                {input.category && <span className="text-gray-500">• {input.category}</span>}
                <span className="text-gray-500">• ~{input.estimated_credits} credits</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
