/**
 * Search abstraction layer
 * Supports PostgreSQL FTS and AWS OpenSearch
 */

import { FastifyInstance } from 'fastify';
import { SearchFilters, SearchResult } from '../types.js';
import { postgresSearch } from './postgres.js';
import { openSearchSearch } from './opensearch.js';

export type SearchEngine = 'postgres' | 'opensearch';

export interface SearchProvider {
  search(query: string, filters: SearchFilters): Promise<SearchResult>;
  indexPackage(packageId: string): Promise<void>;
  deletePackage(packageId: string): Promise<void>;
  reindexAll(): Promise<void>;
}

/**
 * Get the active search provider based on configuration
 */
export function getSearchProvider(server: FastifyInstance): SearchProvider {
  const engine: SearchEngine = (process.env.SEARCH_ENGINE as SearchEngine) || 'postgres';

  switch (engine) {
    case 'opensearch':
      return openSearchSearch(server);
    case 'postgres':
    default:
      return postgresSearch(server);
  }
}
