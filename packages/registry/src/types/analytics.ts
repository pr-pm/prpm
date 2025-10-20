/**
 * Analytics-specific types
 */

export interface AnalyticsQuery {
  limit?: number;
  timeframe?: 'day' | 'week' | 'month' | 'year';
  type?: string;
}

export interface TrendingQuery {
  limit?: number;
  timeframe?: 'day' | 'week' | 'month';
}

export interface AuthorAnalyticsQuery {
  sort?: 'downloads' | 'created' | 'updated';
  order?: 'asc' | 'desc';
}

export interface DownloadEventParams {
  package: string;
  version?: string;
}

export interface DownloadEvent {
  package_id: string;
  version: string | null;
  user_id: string | null;
  client_id: string;
  timestamp: Date;
  user_agent: string | null;
  ip_address: string | null;
}
