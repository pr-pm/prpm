'use client'

import { useState } from 'react'
import { createOrganization } from '@/lib/api'

interface CreateOrganizationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  jwtToken?: string
}

export default function CreateOrganizationModal({
  isOpen,
  onClose,
  onSuccess,
  jwtToken,
}: CreateOrganizationModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!jwtToken) {
      setError('You must be logged in to create an organization')
      return
    }

    if (!name.trim()) {
      setError('Organization name is required')
      return
    }

    if (name.length < 3 || name.length > 50) {
      setError('Organization name must be between 3 and 50 characters')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await createOrganization(jwtToken, {
        name: name.trim(),
        description: description.trim() || undefined,
        website_url: websiteUrl.trim() || undefined,
      })

      // Reset form
      setName('')
      setDescription('')
      setWebsiteUrl('')

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (!loading) {
      setName('')
      setDescription('')
      setWebsiteUrl('')
      setError(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-prpm-dark-card border border-prpm-border rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create Organization</h2>
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
            <p className="text-gray-400 mb-6">You must be logged in to create an organization</p>
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
              <label htmlFor="org-name" className="block text-sm font-semibold text-white mb-2">
                Organization Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-organization"
                minLength={3}
                maxLength={50}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-prpm-dark border border-prpm-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-prpm-accent transition-colors disabled:opacity-50"
              />
              <p className="text-gray-400 text-xs mt-2">
                3-50 characters. This will be used in URLs.
              </p>
            </div>

            <div>
              <label htmlFor="org-description" className="block text-sm font-semibold text-white mb-2">
                Description
              </label>
              <textarea
                id="org-description"
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
              <label htmlFor="org-website" className="block text-sm font-semibold text-white mb-2">
                Website URL
              </label>
              <input
                type="url"
                id="org-website"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={loading}
                className="w-full px-4 py-3 bg-prpm-dark border border-prpm-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-prpm-accent transition-colors disabled:opacity-50"
              />
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
                    Creating...
                  </>
                ) : (
                  'Create Organization'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
