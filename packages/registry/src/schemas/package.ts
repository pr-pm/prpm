/**
 * Zod schemas for package-related endpoints
 */

import { z } from 'zod';

// Package type enum
export const PackageTypeSchema = z.enum([
  'cursor',
  'claude',
  'claude-skill',
  'continue',
  'windsurf',
  'generic',
]);

export const PackageVisibilitySchema = z.enum(['public', 'private', 'unlisted']);

// Package ID params
export const PackageIdParamsSchema = z.object({
  id: z.string().min(1).max(255),
});

// Package version params
export const PackageVersionParamsSchema = z.object({
  id: z.string().min(1).max(255),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/),
});

// Search query schema
export const SearchQuerySchema = z.object({
  q: z.string().min(1).optional(),
  type: PackageTypeSchema.optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).or(z.string()).optional(),
  verified: z.boolean().or(z.string()).optional().transform(val =>
    typeof val === 'string' ? val === 'true' : val
  ),
  featured: z.boolean().or(z.string()).optional().transform(val =>
    typeof val === 'string' ? val === 'true' : val
  ),
  sort: z.enum(['downloads', 'created', 'updated', 'quality', 'rating']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// Trending query schema
export const TrendingQuerySchema = z.object({
  type: PackageTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// Resolve query schema
export const ResolveQuerySchema = z.object({
  version: z.string().optional(),
});

// Package versions response
export const PackageVersionSchema = z.object({
  version: z.string(),
  published_at: z.string(),
  is_prerelease: z.boolean(),
});

export const PackageVersionsResponseSchema = z.object({
  package_id: z.string(),
  versions: z.array(PackageVersionSchema),
  total: z.number(),
});

// Dependencies response
export const DependenciesResponseSchema = z.object({
  package_id: z.string(),
  version: z.string(),
  dependencies: z.record(z.string()),
  peerDependencies: z.record(z.string()),
});

// Resolve response
export const ResolveResponseSchema = z.object({
  package_id: z.string(),
  version: z.string(),
  resolved: z.record(z.string()),
  tree: z.record(z.object({
    version: z.string(),
    dependencies: z.record(z.string()),
    peerDependencies: z.record(z.string()),
  })),
});

// Package info response
export const PackageInfoSchema = z.object({
  id: z.string(),
  description: z.string().nullable(),
  author_id: z.string().nullable(),
  org_id: z.string().nullable(),
  type: PackageTypeSchema,
  license: z.string().nullable(),
  repository_url: z.string().nullable(),
  homepage_url: z.string().nullable(),
  documentation_url: z.string().nullable(),
  tags: z.array(z.string()),
  keywords: z.array(z.string()),
  category: z.string().nullable(),
  visibility: PackageVisibilitySchema,
  deprecated: z.boolean(),
  deprecated_reason: z.string().nullable(),
  verified: z.boolean(),
  featured: z.boolean(),
  total_downloads: z.number(),
  weekly_downloads: z.number(),
  monthly_downloads: z.number(),
  version_count: z.number(),
  quality_score: z.number().nullable(),
  rating_average: z.number().nullable(),
  rating_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  last_published_at: z.string().nullable(),
});

// Search result response
export const SearchResultSchema = z.object({
  packages: z.array(PackageInfoSchema),
  total: z.number(),
  offset: z.number(),
  limit: z.number(),
});

// Error response
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

// Type exports
export type PackageIdParams = z.infer<typeof PackageIdParamsSchema>;
export type PackageVersionParams = z.infer<typeof PackageVersionParamsSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type TrendingQuery = z.infer<typeof TrendingQuerySchema>;
export type ResolveQuery = z.infer<typeof ResolveQuerySchema>;
export type PackageVersionsResponse = z.infer<typeof PackageVersionsResponseSchema>;
export type DependenciesResponse = z.infer<typeof DependenciesResponseSchema>;
export type ResolveResponse = z.infer<typeof ResolveResponseSchema>;
export type PackageInfo = z.infer<typeof PackageInfoSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
