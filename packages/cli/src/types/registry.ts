/**
 * Registry API types for CLI
 */

import { Format, Subtype } from '../types';

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
 * Package manifest - supports both simple and enhanced file formats
 */
export interface PackageManifest {
  name: string;
  version: string;
  description: string;
  author: string | { name: string; email?: string };
  license?: string;
  license_text?: string;
  license_url?: string;
  snippet?: string;
  repository?: string;
  homepage?: string;
  documentation?: string;
  format: Format;
  subtype?: Subtype;
  tags?: string[];
  keywords?: string[];
  category?: string;
  organization?: string; // Organization name or ID for team publishing
  private?: boolean; // Whether the package is private (defaults to false/public)
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  // Files can be either:
  // 1. Simple format: string[] (backward compatible)
  // 2. Enhanced format: PackageFileMetadata[] (for collections)
  files: string[] | PackageFileMetadata[];
  main?: string;
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

/**
 * Multi-package manifest (from prpm.json with packages array)
 * Supports publishing multiple packages from a single manifest
 */
export interface MultiPackageManifest {
  name: string;
  version: string;
  description?: string;
  author?: string | { name: string; email?: string };
  license?: string;
  repository?: string;
  homepage?: string;
  documentation?: string;
  organization?: string;
  private?: boolean; // Default private setting for all packages (can be overridden per package)
  tags?: string[];
  keywords?: string[];
  packages: PackageManifest[];
}

/**
 * Union type for single or multi-package manifests
 */
export type Manifest = PackageManifest | MultiPackageManifest;

/**
 * Type guard to check if manifest is multi-package
 */
export function isMultiPackageManifest(manifest: Manifest): manifest is MultiPackageManifest {
  return 'packages' in manifest && Array.isArray(manifest.packages);
}
