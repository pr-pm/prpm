/**
 * Registry API types for CLI
 */

// Import shared types from @pr-pm/types
import type {
  Format,
  Subtype,
  PackageManifest as SharedPackageManifest,
  PackageAuthor
} from '@pr-pm/types';

// Re-export shared types for convenience
export type { Format, Subtype, PackageAuthor };

/**
 * Enhanced file metadata for collection packages
 */
export interface PackageFileMetadata {
  path: string;
  format: Format;
  subtype: Subtype;
  name?: string;
  description?: string;
  tags?: string[];
}

/**
 * Package manifest - extends shared manifest with enhanced file format support for collections
 */
export interface PackageManifest extends Omit<SharedPackageManifest, 'files'> {
  // Files can be either:
  // 1. Simple format: string[] (backward compatible)
  // 2. Enhanced format: PackageFileMetadata[] (for collections)
  files: string[] | PackageFileMetadata[];
}

export interface DependencyTreeNode {
  version: string;
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
}

export type DependencyTree = Record<string, DependencyTreeNode>;

export interface ResolveResponse {
  resolved: Record<string, string>;
  tree: DependencyTree;
}

export interface PublishResponse {
  success: boolean;
  package_id: string;
  name: string;
  version: string;
  tarball_url: string;
  message: string;
}

export interface SearchPackage {
  id: string;
  name: string;
  description?: string;
  format: Format;
  subtype: Subtype;
  tags: string[];
  category?: string;
  total_downloads: number;
  verified: boolean;
  featured: boolean;
  official?: boolean;
  rating_average?: number;
}

export interface SearchResponse {
  packages: SearchPackage[];
  total: number;
  offset: number;
  limit: number;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  verified_author?: boolean;
}
