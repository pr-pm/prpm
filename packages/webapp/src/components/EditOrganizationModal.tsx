'use client'

import { useState, useEffect } from 'react'
import { updateOrganization, type Organization } from '@/lib/api'

interface EditOrganizationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  organization: Organization
  jwtToken?: string
}

export default function EditOrganizationModal({
  isOpen,
  onClose,
  onSuccess,
  organization,
  jwtToken,
}: EditOrganizationModalProps) {
  const [description, setDescription] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form with current organization data
  useEffect(() => {
    if (isOpen) {
      setDescription(organization.description || '')
      setWebsiteUrl(organization.website_url || '')
      setAvatarUrl(organization.avatar_url || '')
      setError(null)
    }
  }, [isOpen, organization])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!jwtToken) {
      setError('You must be logged in to update an organization')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const updates: { description?: string; website_url?: string; avatar_url?: string } = {}

      // Only send fields that changed
      if (description !== (organization.description || '')) {
        updates.description = description.trim() || undefined
      }
      if (websiteUrl !== (organization.website_url || '')) {
        updates.website_url = websiteUrl.trim() || undefined
      }
      if (avatarUrl !== (organization.avatar_url || '')) {
        updates.avatar_url = avatarUrl.trim() || undefined
      }

      if (Object.keys(updates).length === 0) {
        setError('No changes to save')
        setLoading(false)
        return
      }

      await updateOrganization(jwtToken, organization.name, updates)

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update organization')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (!loading) {
      setError(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Edit Organization</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!jwtToken ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔒</div>
            <p className="text-gray-400 mb-6">You must be logged in to edit an organization</p>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="org-name-display" className="block text-sm font-semibold text-white mb-2">
                Organization Name
              </label>
              <input
                type="text"
                id="org-name-display"
                value={organization.name}
                disabled
                className="w-full px-4 py-3 bg-prpm-dark border border-prpm-border rounded-lg text-gray-500 cursor-not-allowed"
              />
              <p className="text-gray-400 text-xs mt-2">
                Organization name cannot be changed
              </p>
            </div>

            <div>
              <label htmlFor="org-description-edit" className="block text-sm font-semibold text-white mb-2">
                Description
              </label>
              <textarea
                id="org-description-edit"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your organization"
                maxLength={500}
                rows={3}
                disabled={loading}
                className="w-full px-4 py-3 bg-prpm-dark border border-prpm-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-prpm-accent transition-colors disabled:opacity-50 resize-none"
              />
              <p className="text-gray-400 text-xs mt-2">
                {description.length}/500 characters
              </p>
            </div>

            <div>
              <label htmlFor="org-website-edit" className="block text-sm font-semibold text-white mb-2">
                Website URL
              </label>
              <input
                type="url"
                id="org-website-edit"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={loading}
                className="w-full px-4 py-3 bg-prpm-dark border border-prpm-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-prpm-accent transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="org-avatar-edit" className="block text-sm font-semibold text-white mb-2">
                Avatar URL
              </label>
              <input
                type="url"
                id="org-avatar-edit"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
                disabled={loading}
                className="w-full px-4 py-3 bg-prpm-dark border border-prpm-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-prpm-accent transition-colors disabled:opacity-50"
              />
              <p className="text-gray-400 text-xs mt-2">
                URL to an image for your organization's avatar
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-6 py-3 border border-prpm-border text-gray-400 hover:text-white hover:border-prpm-accent rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-prpm-accent hover:bg-prpm-accent-light text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
