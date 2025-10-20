/**
 * Registry API types for CLI
 */

import { PackageType } from '../types';

export interface PackageManifest {
  name: string;
  version: string;
  description: string;
  author: string | { name: string; email?: string };
  license?: string;
  repository?: string;
  homepage?: string;
  type: string;
  tags?: string[];
  keywords?: string[];
  category?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  files: string[];
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
  version: string;
  message: string;
}

export interface SearchPackage {
  id: string;
  description?: string;
  type: PackageType;
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
