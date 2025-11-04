'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  searchPackages,
  searchCollections,
  SearchPackagesParams,
  SearchCollectionsParams,
  Package,
  Collection,
  Format,
  Subtype,
  SortType,
} from '@/lib/api'
import PackageModal from '@/components/PackageModal'
import CollectionModal from '@/components/CollectionModal'

type TabType = 'packages' | 'collections' | 'skills' | 'slash-commands' | 'agents'

// Define which subtypes are available for each format
const FORMAT_SUBTYPES: Record<Format, Subtype[]> = {
  'cursor': ['rule', 'agent', 'slash-command', 'tool'],
  'claude': ['skill', 'agent', 'slash-command', 'tool'],
  'continue': ['rule', 'agent', 'slash-command', 'tool'],
  'windsurf': ['rule', 'agent', 'slash-command', 'tool'],
  'copilot': ['tool', 'chatmode'],
  'kiro': ['rule', 'agent', 'tool'],
  'mcp': ['tool'],
  'agents.md': ['agent', 'tool'],
  'generic': ['rule', 'agent', 'skill', 'slash-command', 'tool', 'chatmode'],
}

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Track initial URL params to prevent reset on mount
  const initialParams = useState(() => ({
    tab: searchParams.get('tab') as TabType || 'packages',
    query: searchParams.get('q') || '',
    format: searchParams.get('format') as Format || '',
    subtype: searchParams.get('subtype') as Subtype || '',
    category: searchParams.get('category') || '',
    author: searchParams.get('author') || '',
    tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
    sort: searchParams.get('sort') as SortType || 'downloads',
    page: Number(searchParams.get('page')) || 1,
  }))[0]

  // Initialize state from URL params
  const [activeTab, setActiveTab] = useState<TabType>(initialParams.tab)
  const [query, setQuery] = useState(initialParams.query)
  const [selectedFormat, setSelectedFormat] = useState<Format | ''>(initialParams.format)
  const [selectedSubtype, setSelectedSubtype] = useState<Subtype | ''>(initialParams.subtype)
  const [selectedCategory, setSelectedCategory] = useState(initialParams.category)
  const [selectedAuthor, setSelectedAuthor] = useState(initialParams.author)
  const [selectedTags, setSelectedTags] = useState<string[]>(initialParams.tags)
  const [sort, setSort] = useState<SortType>(initialParams.sort)
  const [packages, setPackages] = useState<Package[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(initialParams.page)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showCollectionModal, setShowCollectionModal] = useState(false)

  const limit = 20

  // Get available subtypes for the selected format
  const availableSubtypes = useMemo(() =>
    selectedFormat
      ? FORMAT_SUBTYPES[selectedFormat] || []
      : ['rule', 'agent', 'skill', 'slash-command', 'tool', 'chatmode'],
    [selectedFormat]
  )

  // Reset subtype when format changes and current subtype is not available
  useEffect(() => {
    if (selectedFormat && selectedSubtype && !availableSubtypes.includes(selectedSubtype)) {
      setSelectedSubtype('')
    }
  }, [selectedFormat, selectedSubtype, availableSubtypes])

  // Update URL when state changes
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true)
      return
    }

    const params = new URLSearchParams()

    if (query) params.set('q', query)
    if (activeTab !== 'packages') params.set('tab', activeTab)
    if (selectedFormat) params.set('format', selectedFormat)
    if (selectedSubtype) params.set('subtype', selectedSubtype)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedAuthor) params.set('author', selectedAuthor)
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','))
    if (sort !== 'downloads') params.set('sort', sort)
    if (page !== 1) params.set('page', String(page))

    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search'
    router.replace(newUrl, { scroll: false })
  }, [activeTab, query, selectedFormat, selectedSubtype, selectedCategory, selectedAuthor, selectedTags, sort, page, router, isInitialized])

  // Fetch packages
  const fetchPackages = async () => {
    setLoading(true)
    try {
      const params: SearchPackagesParams = {
        limit,
        offset: (page - 1) * limit,
        sort,
      }

      if (query.trim()) params.q = query
      if (selectedFormat) params.format = selectedFormat
      if (selectedSubtype) params.subtype = selectedSubtype
      if (selectedCategory) params.category = selectedCategory
      if (selectedTags.length > 0) params.tags = selectedTags
      if (selectedAuthor) params.author = selectedAuthor

      const result = await searchPackages(params)
      setPackages(result.packages)
      setTotal(result.total)
    } catch (error) {
      console.error('Failed to fetch packages:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch collections
  const fetchCollections = async () => {
    setLoading(true)
    try {
      const params: SearchCollectionsParams = {
        limit,
        offset: (page - 1) * limit,
        sortBy: sort === 'downloads' ? 'downloads' : 'created',
        sortOrder: 'desc',
      }

      if (query.trim()) params.query = query
      if (selectedCategory) params.category = selectedCategory
      if (selectedTags.length > 0 && selectedTags[0]) params.tag = selectedTags[0]

      const result = await searchCollections(params)
      setCollections(result.collections)
      setTotal(result.total)
    } catch (error) {
      console.error('Failed to fetch collections:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch skills (claude-skill type packages)
  const fetchSkills = async () => {
    setLoading(true)
    try {
      const params: SearchPackagesParams = {
        format: 'claude',
        subtype: 'skill',
        limit,
        offset: (page - 1) * limit,
        sort,
      }

      if (query.trim()) params.q = query
      if (selectedCategory) params.category = selectedCategory
      if (selectedTags.length > 0) params.tags = selectedTags

      const result = await searchPackages(params)
      setPackages(result.packages)
      setTotal(result.total)
    } catch (error) {
      console.error('Failed to fetch skills:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch slash commands (all formats)
  const fetchSlashCommands = async () => {
    setLoading(true)
    try {
      const params: SearchPackagesParams = {
        subtype: 'slash-command',
        limit,
        offset: (page - 1) * limit,
        sort,
      }

      if (query.trim()) params.q = query
      if (selectedCategory) params.category = selectedCategory
      if (selectedTags.length > 0) params.tags = selectedTags

      const result = await searchPackages(params)
      setPackages(result.packages)
      setTotal(result.total)
    } catch (error) {
      console.error('Failed to fetch slash commands:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch agents (all formats)
  const fetchAgents = async () => {
    setLoading(true)
    try {
      const params: SearchPackagesParams = {
        subtype: 'agent',
        limit,
        offset: (page - 1) * limit,
        sort,
      }

      if (query.trim()) params.q = query
      if (selectedCategory) params.category = selectedCategory
      if (selectedTags.length > 0) params.tags = selectedTags

      const result = await searchPackages(params)
      setPackages(result.packages)
      setTotal(result.total)
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load data based on active tab
  useEffect(() => {
    // Clear previous results when switching tabs to ensure fresh data loads
    setPackages([])
    setCollections([])

    if (activeTab === 'packages') {
      fetchPackages()
    } else if (activeTab === 'collections') {
      fetchCollections()
    } else if (activeTab === 'skills') {
      fetchSkills()
    } else if (activeTab === 'slash-commands') {
      fetchSlashCommands()
    } else if (activeTab === 'agents') {
      fetchAgents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, query, selectedFormat, selectedSubtype, selectedCategory, selectedTags, selectedAuthor, sort, page])

  // Reset page when filters change (but not on initial load from URL)
  useEffect(() => {
    // Don't reset on first render
    if (!isInitialized) return

    // Check if any filter actually changed from initial state
    const filtersChanged =
      query !== initialParams.query ||
      selectedFormat !== initialParams.format ||
      selectedSubtype !== initialParams.subtype ||
      selectedCategory !== initialParams.category ||
      JSON.stringify(selectedTags) !== JSON.stringify(initialParams.tags) ||
      selectedAuthor !== initialParams.author ||
      sort !== initialParams.sort ||
      activeTab !== initialParams.tab

    // Only reset page if filters changed AND we're not on the initial page
    if (filtersChanged) {
      setPage(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedFormat, selectedSubtype, selectedCategory, selectedTags, selectedAuthor, sort, activeTab, isInitialized])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const clearFilters = () => {
    setSelectedFormat('')
    setSelectedCategory('')
    setSelectedTags([])
    setSelectedAuthor('')
    setQuery('')
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const hasFilters = selectedFormat || selectedCategory || selectedTags.length > 0 || selectedAuthor || query

  return (
    <main className="min-h-screen bg-prpm-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-prpm-accent hover:text-prpm-accent-light mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Search & Discover</h1>
          <p className="text-gray-400">
            Find packages, collections, and skills for your AI coding workflow
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search packages, collections, or skills..."
              className="w-full px-6 py-4 bg-prpm-dark-card border border-prpm-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-prpm-accent transition-colors pr-12"
            />
            <button
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-prpm-accent transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-prpm-border overflow-x-auto">
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-4 sm:px-6 py-3 font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'packages'
                ? 'text-prpm-accent'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Packages
            {activeTab === 'packages' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-prpm-accent"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-4 sm:px-6 py-3 font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'collections'
                ? 'text-prpm-accent'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Collections
            {activeTab === 'collections' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-prpm-accent"></div>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6 sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Filters</h3>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-prpm-accent hover:text-prpm-accent-light"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Format and Subtype Filters (packages only) */}
              {activeTab === 'packages' && (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Format
                    </label>
                    <select
                      value={selectedFormat}
                      onChange={(e) => setSelectedFormat(e.target.value as Format | '')}
                      className="w-full px-3 py-2 bg-prpm-dark border border-prpm-border rounded text-white focus:outline-none focus:border-prpm-accent"
                    >
                      <option value="">All Formats</option>
                      <option value="cursor">Cursor</option>
                      <option value="claude">Claude</option>
                      <option value="continue">Continue</option>
                      <option value="windsurf">Windsurf</option>
                      <option value="copilot">GitHub Copilot</option>
                      <option value="kiro">Kiro</option>
                      <option value="mcp">MCP</option>
                      <option value="agents.md">Agents.md</option>
                      <option value="generic">Generic</option>
                    </select>

                    {/* Format compatibility info */}
                    {selectedFormat === 'agents.md' && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-xs text-gray-300 mb-2">
                          <strong className="text-blue-400">Compatible with:</strong>
                        </p>
                        <p className="text-xs text-gray-400">
                          OpenAI Codex • GitHub Copilot • Google Gemini • Any tool supporting the open standard
                        </p>
                      </div>
                    )}

                    {selectedFormat === 'copilot' && (
                      <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <p className="text-xs text-gray-300 mb-2">
                          <strong className="text-purple-400">Compatible with:</strong>
                        </p>
                        <p className="text-xs text-gray-400">
                          GitHub Copilot • OpenAI Codex
                        </p>
                      </div>
                    )}

                    {(selectedFormat === 'cursor' || selectedFormat === 'claude' || selectedFormat === 'continue' || selectedFormat === 'windsurf' || selectedFormat === 'kiro') && (
                      <div className="mt-3 p-3 bg-gray-500/10 border border-gray-500/30 rounded-lg">
                        <p className="text-xs text-gray-400">
                          Tool-specific format for <strong>{selectedFormat === 'cursor' ? 'Cursor IDE' : selectedFormat === 'claude' ? 'Claude Desktop/Code' : selectedFormat === 'continue' ? 'Continue (VS Code/JetBrains)' : selectedFormat === 'windsurf' ? 'Windsurf IDE' : 'Kiro AI'}</strong>
                        </p>
                      </div>
                    )}

                    {selectedFormat === 'mcp' && (
                      <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-xs text-gray-300 mb-2">
                          <strong className="text-green-400">Protocol-based:</strong>
                        </p>
                        <p className="text-xs text-gray-400">
                          Any tool implementing Model Context Protocol
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Subtype
                    </label>
                    <select
                      value={selectedSubtype}
                      onChange={(e) => setSelectedSubtype(e.target.value as Subtype | '')}
                      className="w-full px-3 py-2 bg-prpm-dark border border-prpm-border rounded text-white focus:outline-none focus:border-prpm-accent"
                    >
                      <option value="">All Subtypes</option>
                      {availableSubtypes.includes('rule') && <option value="rule">Rule</option>}
                      {availableSubtypes.includes('agent') && <option value="agent">Agent</option>}
                      {availableSubtypes.includes('skill') && <option value="skill">Skill</option>}
                      {availableSubtypes.includes('slash-command') && <option value="slash-command">Slash Command</option>}
                      {availableSubtypes.includes('tool') && <option value="tool">Tool</option>}
                      {availableSubtypes.includes('chatmode') && <option value="chatmode">Chat Mode</option>}
                    </select>
                  </div>
                </>
              )}

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortType)}
                  className="w-full px-3 py-2 bg-prpm-dark border border-prpm-border rounded text-white focus:outline-none focus:border-prpm-accent"
                >
                  <option value="downloads">Downloads</option>
                  <option value="quality">Quality Score</option>
                  <option value="rating">Highest Rated</option>
                  <option value="created">Recently Created</option>
                  <option value="updated">Recently Updated</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-prpm-dark border border-prpm-border rounded text-white focus:outline-none focus:border-prpm-accent"
                >
                  <option value="">All Categories</option>
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="testing">Testing</option>
                  <option value="documentation">Documentation</option>
                  <option value="devops">DevOps</option>
                  <option value="security">Security</option>
                  <option value="best-practices">Best Practices</option>
                </select>
              </div>

              {/* Author Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Author
                </label>
                <input
                  type="text"
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                  placeholder="e.g., prpm, voltagent"
                  className="w-full px-3 py-2 bg-prpm-dark border border-prpm-border rounded text-white focus:outline-none focus:border-prpm-accent placeholder-gray-500"
                />
              </div>

              {/* Popular Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Popular Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {['react', 'typescript', 'nextjs', 'nodejs', 'python', 'testing'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-prpm-accent text-white'
                          : 'bg-prpm-dark border border-prpm-border text-gray-400 hover:border-prpm-accent hover:text-white'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {!loading && (packages.length > 0 || collections.length > 0) && (
              <div className="mb-4 flex items-center justify-between">
                <p className="text-gray-400">
                  {total} results
                </p>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-prpm-accent"></div>
              </div>
            ) : (
              <>
                {/* Package Results */}
                {(activeTab === 'packages' || activeTab === 'skills' || activeTab === 'slash-commands' || activeTab === 'agents') && (
                  <div className="space-y-4">
                    {packages.length === 0 ? (
                      <div className="text-center py-20">
                        <p className="text-gray-400 mb-4">No packages found</p>
                        {selectedFormat && (
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 max-w-2xl mx-auto text-left">
                            <h4 className="text-lg font-bold text-blue-400 mb-3">💡 Cross-Platform Tip</h4>
                            <p className="text-gray-300 mb-3">
                              PRPM is cross-platform! Even if there are no native <strong>{selectedFormat}</strong> packages, you can install packages from other formats using the <code className="bg-prpm-dark border border-prpm-border px-2 py-1 rounded text-sm">--as</code> flag.
                            </p>
                            <p className="text-gray-300 mb-3">
                              For example, install any Cursor rule as {selectedFormat}:
                            </p>
                            <div className="bg-prpm-dark border border-prpm-border rounded-lg p-4 font-mono text-sm text-gray-300">
                              prpm install @org/cursor-rules --as {selectedFormat}
                            </div>
                            <p className="text-gray-400 text-sm mt-3">
                              This means you have access to <strong>2,100+ packages</strong> across all formats, not just {selectedFormat}-specific ones!
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {selectedFormat && total < 50 && (
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                            <h4 className="text-sm font-bold text-blue-400 mb-2">💡 Cross-Platform Tip</h4>
                            <p className="text-gray-300 text-sm mb-2">
                              Only {total} native <strong>{selectedFormat}</strong> {total === 1 ? 'package' : 'packages'} found. You can access <strong>2,100+ packages</strong> by installing packages from other formats:
                            </p>
                            <div className="bg-prpm-dark border border-prpm-border rounded-lg p-3 font-mono text-xs text-gray-300">
                              prpm install @org/any-package --as {selectedFormat}
                            </div>
                          </div>
                        )}
                        {packages.map((pkg) => (
                        <button
                          key={pkg.id}
                          onClick={() => {
                            setSelectedPackage(pkg)
                            setShowPackageModal(true)
                          }}
                          className="block w-full text-left bg-prpm-dark-card border border-prpm-border rounded-lg p-6 hover:border-prpm-accent transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xl font-semibold text-white">
                                  {pkg.name}
                                </h3>
                                {pkg.verified && (
                                  <svg className="w-5 h-5 text-prpm-accent" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {pkg.featured && (
                                  <span className="px-2 py-1 bg-prpm-green/20 text-prpm-green text-xs rounded-full">
                                    Featured
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-400 mb-3">{pkg.description || 'No description'}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="px-2 py-1 bg-prpm-dark border border-prpm-border rounded text-gray-400">
                                  {`${pkg.format}-${pkg.subtype}`}
                                </span>
                                {pkg.category && (
                                  <span>{pkg.category}</span>
                                )}
                                {pkg.license && (
                                  <span className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-xs">
                                    {pkg.license}
                                  </span>
                                )}
                                <span>{pkg.total_downloads.toLocaleString()} downloads</span>
                              </div>
                              {pkg.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {pkg.tags.slice(0, 5).map((tag: string) => (
                                    <span
                                      key={tag}
                                      className="px-2 py-1 bg-prpm-dark border border-prpm-border rounded text-xs text-gray-400"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-prpm-border space-y-3">
                            {/* Install Command */}
                            <div className="flex items-center justify-between gap-2">
                              <code className="text-sm text-prpm-accent-light">
                                prpm install {pkg.name}
                              </code>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyToClipboard(`prpm install ${pkg.name}`, pkg.id)
                                }}
                                className="p-2 hover:bg-prpm-dark rounded transition-colors flex-shrink-0"
                                title="Copy install command"
                              >
                                {copiedId === pkg.id ? (
                                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-gray-400 hover:text-prpm-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </button>
                            </div>

                            {/* Playground CTAs */}
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/playground?package=${pkg.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 px-3 py-2 bg-prpm-accent hover:bg-prpm-accent/80 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Test in Playground
                              </Link>
                              <Link
                                href={`/playground?package=${pkg.id}&compare=true`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-3 py-2 bg-prpm-dark-card hover:bg-prpm-dark border border-prpm-border hover:border-prpm-accent text-gray-300 text-sm rounded-lg transition-colors flex items-center gap-2"
                                title="Compare against no prompt"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Compare
                              </Link>
                            </div>
                          </div>
                        </button>
                      ))}
                      </>
                    )}
                  </div>
                )}

                {/* Collection Results */}
                {activeTab === 'collections' && (
                  <div className="space-y-4">
                    {/* Collections Explainer */}
                    <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <svg className="w-5 h-5 text-prpm-accent" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-white mb-1">What are collections?</h4>
                          <p className="text-sm text-gray-400 mb-2">
                            Collections are curated sets of packages grouped together for a specific purpose or workflow. Install an entire collection at once to get everything you need.
                          </p>
                          <a
                            href="https://docs.prpm.dev/concepts/collections"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-prpm-accent hover:underline inline-flex items-center gap-1"
                          >
                            Learn more about collections
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>

                    {collections.length === 0 ? (
                      <div className="text-center py-20">
                        <p className="text-gray-400">No collections found</p>
                      </div>
                    ) : (
                      collections.map((collection) => (
                        <button
                          key={collection.id}
                          onClick={() => {
                            setSelectedCollection(collection)
                            setShowCollectionModal(true)
                          }}
                          className="w-full text-left bg-prpm-dark-card border border-prpm-border rounded-lg p-6 hover:border-prpm-accent transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xl font-semibold text-white">
                                  {collection.name}
                                </h3>
                                {collection.verified && (
                                  <svg className="w-5 h-5 text-prpm-accent" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {collection.official && (
                                  <span className="px-2 py-1 bg-prpm-accent/20 text-prpm-accent text-xs rounded-full">
                                    Official
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mb-1 font-mono">
                                {collection.name_slug}
                              </p>
                              <p className="text-gray-400 mb-3">{collection.description || 'No description'}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                {collection.author && (
                                    <span>by @{collection.author}</span>
                                )}
                                {collection.category && (
                                  <span>{collection.category}</span>
                                )}
                                <span>{collection.package_count} packages</span>
                                <span>{collection.downloads.toLocaleString()} installs</span>
                                <span>{collection.stars} stars</span>
                              </div>
                              {collection.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {collection.tags.slice(0, 5).map((tag: string) => (
                                    <span
                                      key={tag}
                                      className="px-2 py-1 bg-prpm-dark border border-prpm-border rounded text-xs text-gray-400"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-prpm-border flex items-center justify-between gap-2">
                            <code className="text-sm text-prpm-accent-light">
                              prpm install collections/{collection.name_slug}
                            </code>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                copyToClipboard(`prpm install collections/${collection.name_slug}`, collection.id)
                              }}
                              className="p-2 hover:bg-prpm-dark rounded transition-colors flex-shrink-0"
                              title="Copy install command"
                            >
                              {copiedId === collection.id ? (
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-gray-400 hover:text-prpm-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Pagination */}
                {total > limit && (packages.length > 0 || collections.length > 0) && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-prpm-dark-card border border-prpm-border rounded text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-prpm-accent transition-colors"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-gray-400">
                      Page {page} of {Math.ceil(total / limit)}
                    </span>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= Math.ceil(total / limit)}
                      className="px-4 py-2 bg-prpm-dark-card border border-prpm-border rounded text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-prpm-accent transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Package Modal */}
        {selectedPackage && (
          <PackageModal
            package={selectedPackage}
            isOpen={showPackageModal}
            onClose={() => setShowPackageModal(false)}
          />
        )}

        {/* Collection Modal */}
        {selectedCollection && (
          <CollectionModal
            collection={selectedCollection}
            isOpen={showCollectionModal}
            onClose={() => setShowCollectionModal(false)}
          />
        )}
      </div>
    </main>
  )
}


export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-prpm-dark text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-prpm-accent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading search...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
