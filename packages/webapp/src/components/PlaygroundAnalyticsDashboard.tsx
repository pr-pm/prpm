'use client';

import { useEffect, useState } from 'react';

interface AnalyticsSummary {
  total_packages: number;
  total_playground_sessions: number;
  total_unique_users: number;
  total_credits_spent: number;
  sessions_last_30_days: number;
  total_suggested_inputs: number;
  active_suggested_inputs: number;
  total_shared_sessions: number;
  total_featured_sessions: number;
  total_share_views: number;
  top_package_name: string | null;
}

interface SuggestedInputAnalytics {
  suggested_input_id: string;
  title: string;
  category: string;
  difficulty: string;
  total_clicks: number;
  completed_tests: number;
  unique_users: number;
  conversion_rate: number;
  clicks_last_7_days: number;
  clicks_last_30_days: number;
  last_clicked_at: string | null;
  created_at: string;
}

interface TimeSeriesData {
  date: string;
  sessions_count: number;
  unique_users: number;
  credits_spent: number;
  shared_count: number;
}

export default function PlaygroundAnalyticsDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [suggestedInputs, setSuggestedInputs] = useState<SuggestedInputAnalytics[]>([]);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
    loadPackages();
  }, []);

  useEffect(() => {
    if (selectedPackageId) {
      loadPackageAnalytics(selectedPackageId);
    }
  }, [selectedPackageId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('prpm_token');
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111'}/api/v1/analytics/author/summary`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPackages = async () => {
    try {
      const token = localStorage.getItem('prpm_token');
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111'}/api/v1/packages/author`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
        if (data.packages && data.packages.length > 0) {
          setSelectedPackageId(data.packages[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load packages:', error);
    }
  };

  const loadPackageAnalytics = async (packageId: string) => {
    try {
      const token = localStorage.getItem('prpm_token');
      if (!token) return;

      // Load suggested inputs analytics
      const inputsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111'}/api/v1/analytics/suggested-inputs/package/${packageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (inputsResponse.ok) {
        const data = await inputsResponse.json();
        setSuggestedInputs(data.suggested_inputs || []);
      }

      // Load time series data
      const timeSeriesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111'}/api/v1/analytics/time-series/playground/${packageId}?days=30`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (timeSeriesResponse.ok) {
        const data = await timeSeriesResponse.json();
        setTimeSeries(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load package analytics:', error);
    }
  };

  const refreshAnalytics = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem('prpm_token');
      if (!token) return;

      await fetch(
        `${process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:3111'}/api/v1/analytics/refresh`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await loadAnalytics();
      if (selectedPackageId) {
        await loadPackageAnalytics(selectedPackageId);
      }
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
        <div className="text-center py-12 text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
        <div className="text-center py-12">
          <p className="text-gray-400">No analytics data available yet</p>
          <p className="text-sm text-gray-500 mt-2">Publish packages and get playground usage to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Playground Analytics</h2>
          <p className="text-gray-400 mt-1">Track how users interact with your packages in the playground</p>
        </div>
        <button
          onClick={refreshAnalytics}
          disabled={refreshing}
          className="px-4 py-2 bg-prpm-dark border border-prpm-border text-gray-300 rounded-lg hover:border-prpm-accent transition-colors disabled:opacity-50"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-1">Total Sessions</div>
          <div className="text-3xl font-bold text-white">{formatNumber(summary.total_playground_sessions)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {formatNumber(summary.sessions_last_30_days)} in last 30 days
          </div>
        </div>

        <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-1">Unique Users</div>
          <div className="text-3xl font-bold text-white">{formatNumber(summary.total_unique_users)}</div>
          <div className="text-xs text-gray-500 mt-1">Testing your packages</div>
        </div>

        <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-1">Credits Spent</div>
          <div className="text-3xl font-bold text-white">{formatNumber(summary.total_credits_spent)}</div>
          <div className="text-xs text-gray-500 mt-1">Total playground credits</div>
        </div>

        <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-1">Suggested Inputs</div>
          <div className="text-3xl font-bold text-white">{formatNumber(summary.active_suggested_inputs)}</div>
          <div className="text-xs text-gray-500 mt-1">
            of {formatNumber(summary.total_suggested_inputs)} total
          </div>
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="text-sm text-gray-400">Shared Results</span>
          </div>
          <div className="text-2xl font-bold text-white">{formatNumber(summary.total_shared_sessions)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {formatNumber(summary.total_share_views)} total views
          </div>
        </div>

        <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm text-gray-400">Featured Results</span>
          </div>
          <div className="text-2xl font-bold text-white">{formatNumber(summary.total_featured_sessions)}</div>
          <div className="text-xs text-gray-500 mt-1">Curated examples</div>
        </div>

        <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm text-gray-400">Top Package</span>
          </div>
          <div className="text-lg font-bold text-white truncate">
            {summary.top_package_name || 'N/A'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Most playground usage</div>
        </div>
      </div>

      {/* Package Selector */}
      {packages.length > 0 && (
        <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            View analytics for package:
          </label>
          <select
            value={selectedPackageId || ''}
            onChange={(e) => setSelectedPackageId(e.target.value)}
            className="w-full md:w-96 px-3 py-2 bg-prpm-dark border border-prpm-border rounded-lg text-white"
          >
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Time Series Chart */}
      {timeSeries.length > 0 && (
        <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Playground Usage (Last 30 Days)</h3>
          <div className="space-y-2">
            {timeSeries.slice().reverse().map((data, index) => {
              const maxSessions = Math.max(...timeSeries.map(d => d.sessions_count), 1);
              const width = (data.sessions_count / maxSessions) * 100;

              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="text-xs text-gray-500 w-20">{new Date(data.date).toLocaleDateString()}</div>
                  <div className="flex-1">
                    <div className="relative h-6 bg-prpm-dark rounded">
                      <div
                        className="absolute h-full bg-prpm-accent rounded transition-all"
                        style={{ width: `${width}%` }}
                      />
                      <div className="absolute inset-0 flex items-center px-2 text-xs text-white">
                        {data.sessions_count} sessions • {data.unique_users} users
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggested Inputs Performance */}
      {suggestedInputs.length > 0 && (
        <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Suggested Inputs Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-prpm-border">
                  <th className="text-left py-3 px-2 text-gray-400 font-medium">Title</th>
                  <th className="text-left py-3 px-2 text-gray-400 font-medium">Category</th>
                  <th className="text-right py-3 px-2 text-gray-400 font-medium">Clicks</th>
                  <th className="text-right py-3 px-2 text-gray-400 font-medium">Completions</th>
                  <th className="text-right py-3 px-2 text-gray-400 font-medium">Conversion</th>
                  <th className="text-right py-3 px-2 text-gray-400 font-medium">Users</th>
                  <th className="text-right py-3 px-2 text-gray-400 font-medium">Last 7d</th>
                </tr>
              </thead>
              <tbody>
                {suggestedInputs.map((input) => (
                  <tr key={input.suggested_input_id} className="border-b border-prpm-border/50">
                    <td className="py-3 px-2">
                      <div className="text-white font-medium">{input.title}</div>
                      <div className="text-xs text-gray-500">{input.difficulty}</div>
                    </td>
                    <td className="py-3 px-2 text-gray-300">{input.category || 'N/A'}</td>
                    <td className="py-3 px-2 text-right text-white">{formatNumber(input.total_clicks)}</td>
                    <td className="py-3 px-2 text-right text-green-400">{formatNumber(input.completed_tests)}</td>
                    <td className="py-3 px-2 text-right">
                      <span className={`px-2 py-1 rounded text-xs ${
                        input.conversion_rate >= 70 ? 'bg-green-500/20 text-green-400' :
                        input.conversion_rate >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {formatPercentage(input.conversion_rate)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right text-gray-300">{formatNumber(input.unique_users)}</td>
                    <td className="py-3 px-2 text-right text-blue-400">{formatNumber(input.clicks_last_7_days)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {suggestedInputs.length === 0 && selectedPackageId && (
        <div className="bg-prpm-dark-card border border-prpm-border rounded-lg p-6">
          <div className="text-center py-12">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-gray-400">No suggested inputs for this package yet</p>
            <p className="text-sm text-gray-500 mt-2">Create suggested inputs to see performance metrics</p>
          </div>
        </div>
      )}
    </div>
  );
}
