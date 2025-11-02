'use client'

import { useState, useEffect } from 'react'
import { getPackageStats, getPackageRecentDownloads } from '@/lib/api'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface PackageAnalyticsModalProps {
  packageId: string
  packageName: string
  isOpen: boolean
  onClose: () => void
  jwtToken: string
}

export default function PackageAnalyticsModal({
  packageId,
  packageName,
  isOpen,
  onClose,
  jwtToken,
}: PackageAnalyticsModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [recentDownloads, setRecentDownloads] = useState<any>(null)
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month')

  useEffect(() => {
    if (isOpen) {
      loadAnalytics()
    }
  }, [isOpen, timeRange])

  async function loadAnalytics() {
    try {
      setLoading(true)
      setError(null)

      const [statsData, downloadsData] = await Promise.all([
        getPackageStats(jwtToken, packageId, timeRange),
        getPackageRecentDownloads(jwtToken, packageId, 20),
      ])

      setStats(statsData)
      setRecentDownloads(downloadsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const COLORS = {
    cli: '#8b5cf6',
    web: '#06b6d4',
    api: '#10b981',
    cursor: '#f59e0b',
    claude: '#ec4899',
    continue: '#3b82f6',
    windsurf: '#14b8a6',
    generic: '#6b7280',
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-prpm-dark border border-prpm-border rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-prpm-dark border-b border-prpm-border p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">📊 Package Analytics</h2>
            <p className="text-gray-400">{packageName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="p-6 border-b border-prpm-border">
          <div className="flex gap-2">
            {(['today', 'week', 'month', 'year', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  timeRange === range
                    ? 'bg-prpm-accent text-white'
                    : 'bg-prpm-dark-card border border-prpm-border text-gray-400 hover:text-white'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-prpm-accent mb-4"></div>
              <p className="text-gray-400">Loading analytics...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={loadAnalytics}
                className="px-4 py-2 bg-prpm-accent text-white rounded-lg hover:bg-prpm-accent-light transition-all"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && stats && (
            <div className="space-y-8">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-prpm-dark-card border border-prpm-border rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">Total Downloads</div>
                  <div className="text-2xl font-bold text-white">{stats.period.totals.downloads.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{timeRange === 'all' ? 'all time' : `this ${timeRange}`}</div>
                </div>
                <div className="p-4 bg-prpm-dark-card border border-prpm-border rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">Unique Downloads</div>
                  <div className="text-2xl font-bold text-prpm-accent">{stats.period.totals.unique_downloads.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">
                    {stats.period.totals.downloads > 0
                      ? `${((stats.period.totals.unique_downloads / stats.period.totals.downloads) * 100).toFixed(0)}% unique`
                      : 'no data'}
                  </div>
                </div>
                <div className="p-4 bg-prpm-dark-card border border-prpm-border rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">Total Views</div>
                  <div className="text-2xl font-bold text-white">{stats.period.totals.views.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">page views</div>
                </div>
                <div className="p-4 bg-prpm-dark-card border border-prpm-border rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">Conversion Rate</div>
                  <div className="text-2xl font-bold text-green-400">
                    {stats.period.totals.views > 0
                      ? `${((stats.period.totals.downloads / stats.period.totals.views) * 100).toFixed(1)}%`
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">view → download</div>
                </div>
              </div>

              {/* Downloads Over Time */}
              {stats.daily && stats.daily.length > 0 && (
                <div className="p-6 bg-prpm-dark-card border border-prpm-border rounded-lg">
                  <h3 className="text-lg font-bold text-white mb-4">Downloads Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.daily.slice().reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af' }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="total_downloads" stroke="#8b5cf6" strokeWidth={2} name="Downloads" />
                      <Line type="monotone" dataKey="total_views" stroke="#06b6d4" strokeWidth={2} name="Views" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Client Type Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-prpm-dark-card border border-prpm-border rounded-lg">
                  <h3 className="text-lg font-bold text-white mb-4">Downloads by Client</h3>
                  {stats.period.by_client && (
                    <>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'CLI', value: stats.period.by_client.cli },
                              { name: 'Web', value: stats.period.by_client.web },
                              { name: 'API', value: stats.period.by_client.api },
                            ].filter(item => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: 'CLI', value: stats.period.by_client.cli },
                              { name: 'Web', value: stats.period.by_client.web },
                              { name: 'API', value: stats.period.by_client.api },
                            ].filter(item => item.value > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 space-y-2">
                        {[
                          { name: 'CLI', value: stats.period.by_client.cli, color: COLORS.cli },
                          { name: 'Web', value: stats.period.by_client.web, color: COLORS.web },
                          { name: 'API', value: stats.period.by_client.api, color: COLORS.api },
                        ].map(item => (
                          <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                              <span className="text-gray-400">{item.name}</span>
                            </div>
                            <span className="text-white font-semibold">{item.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Format Breakdown */}
                <div className="p-6 bg-prpm-dark-card border border-prpm-border rounded-lg">
                  <h3 className="text-lg font-bold text-white mb-4">Downloads by Format</h3>
                  {stats.period.by_format && (
                    <>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={Object.entries(stats.period.by_format)
                            .filter(([_, value]) => (value as number) > 0)
                            .map(([name, value]) => ({
                              name: name.charAt(0).toUpperCase() + name.slice(1),
                              value: value as number,
                            }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                          <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                          />
                          <Bar dataKey="value" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {Object.entries(stats.period.by_format).map(([name, value]: [string, any]) => (
                          <div key={name} className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
                            <span className="text-white font-semibold">{value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Top Referrers */}
              {stats.top_referrers && stats.top_referrers.length > 0 && (
                <div className="p-6 bg-prpm-dark-card border border-prpm-border rounded-lg">
                  <h3 className="text-lg font-bold text-white mb-4">🔗 Top Referrers (Last 30 Days)</h3>
                  <div className="space-y-3">
                    {stats.top_referrers.map((referrer: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-prpm-dark border border-prpm-border rounded-lg">
                        <div className="flex-1 truncate">
                          <span className="text-white">{referrer.referrer || 'Direct'}</span>
                        </div>
                        <span className="text-prpm-accent font-semibold ml-4">{referrer.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity Feed */}
              {recentDownloads && recentDownloads.recent_downloads && recentDownloads.recent_downloads.length > 0 && (
                <div className="p-6 bg-prpm-dark-card border border-prpm-border rounded-lg">
                  <h3 className="text-lg font-bold text-white mb-4">⚡ Recent Activity</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {recentDownloads.recent_downloads.map((download: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-prpm-dark border border-prpm-border rounded-lg text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-prpm-accent/20 text-prpm-accent rounded text-xs font-semibold">
                              {download.client_type || 'unknown'}
                            </span>
                            <span className="px-2 py-1 bg-prpm-purple/20 text-prpm-purple rounded text-xs">
                              {download.format || 'generic'}
                            </span>
                          </div>
                          {download.country_code && (
                            <span className="text-gray-400">{download.country_code}</span>
                          )}
                        </div>
                        <span className="text-gray-400 text-xs">
                          {new Date(download.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-prpm-dark border-t border-prpm-border p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-prpm-dark-card border border-prpm-border hover:border-prpm-accent text-white rounded-lg font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
