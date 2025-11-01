/**
 * Package types and enums
 */

/**
 * Package format - the AI tool/platform the package is for
 */
export type Format =
  | 'cursor'
  | 'claude'
  | 'continue'
  | 'windsurf'
  | 'copilot'
  | 'kiro'
  | 'agents.md'
  | 'generic'
  | 'mcp';

/**
 * Available formats as a constant array
 * Useful for CLI prompts, validation, etc.
 */
export const FORMATS: readonly Format[] = [
  'cursor',
  'claude',
  'continue',
  'windsurf',
  'copilot',
  'kiro',
  'agents.md',
  'generic',
  'mcp',
] as const;

/**
 * Package subtype - the functional category of the package
 */
export type Subtype =
  | 'rule'
  | 'agent'
  | 'skill'
  | 'slash-command'
  | 'prompt'
  | 'collection'
  | 'chatmode'
  | 'tool';

/**
 * Available subtypes as a constant array
 * Useful for CLI prompts, validation, etc.
 */
export const SUBTYPES: readonly Subtype[] = [
  'rule',
  'agent',
  'skill',
  'slash-command',
  'prompt',
  'collection',
  'chatmode',
  'tool',
] as const;


export type PackageVisibility = 'public' | 'private' | 'unlisted';

/**
 * Core package interface
 */
export interface Package {
  id: string;
  name: string;
  description?: string;
  author_id?: string;
  author_username?: string;
  org_id?: string;
  org_name?: string;
  format: Format;
  subtype: Subtype; // Required, defaults to 'rule'
  license?: string;
  repository_url?: string;
  homepage_url?: string;
  documentation_url?: string;
  tags: string[];
  keywords: string[];
  category?: string;
  visibility: PackageVisibility;
  deprecated: boolean;
  deprecated_reason?: string;
  verified: boolean;
  featured: boolean;
  total_downloads: number;
  weekly_downloads: number;
  monthly_downloads: number;
  version_count: number;
  quality_score?: number | string;
  quality_explanation?: string;
  rating_average?: number;
  rating_count: number;
  created_at: Date | string;
  updated_at: Date | string;
  last_published_at?: Date | string;
}

/**
 * Package version information
 */
export interface PackageVersion {
  id: string;
  package_id: string;
  version: string;
  description?: string;
  changelog?: string;
  tarball_url: string;
  content_hash: string;
  file_size: number;
  dependencies: Record<string, string>;
  peer_dependencies: Record<string, string>;
  engines: Record<string, string>;
  metadata: Record<string, any>;
  is_prerelease: boolean;
  is_deprecated: boolean;
  downloads: number;
  published_by?: string;
  published_at: Date | string;
}

/**
 * Package manifest (from prpm.json)
 */
export interface PackageManifest {
  name: string;
  version: string;
  description: string;
  author?: string | PackageAuthor;
  license?: string;
  repository?: string;
  homepage?: string;
  documentation?: string;
  format: Format;
  subtype?: Subtype; // Optional, defaults to 'rule'
  organization?: string; // Organization name or ID to publish under
  tags?: string[];
  keywords?: string[];
  category?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  files: string[];
  main?: string;
}

/**
 * Package author information
 */
export interface PackageAuthor {
  name: string;
  email?: string;
  url?: string;
}

/**
 * Multi-package manifest (from prpm.json with packages array)
 * Supports publishing multiple packages from a single manifest
 */
export interface MultiPackageManifest {
  name: string;
  version: string;
  description?: string;
  author?: string | PackageAuthor;
  license?: string;
  repository?: string;
  homepage?: string;
  documentation?: string;
  organization?: string;
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

/**
 * Package information with related data
 */
export interface PackageInfo extends Package {
  author?: {
    id: string;
    username: string;
    verified_author: boolean;
    avatar_url?: string;
  };
  organization?: {
    id: string;
    name: string;
    is_verified: boolean;
    avatar_url?: string;
  };
  versions: PackageVersion[];
  latest_version?: PackageVersion;
  readme?: string;
}

/**
 * Package review
 */
export interface PackageReview {
  id: string;
  package_id: string;
  user_id: string;
  rating: number;
  title?: string;
  comment?: string;
  helpful_count: number;
  created_at: Date | string;
  updated_at: Date | string;
}

/**
 * Package statistics
 */
export interface PackageStats {
  package_id: string;
  version: string;
  date: Date | string;
  downloads: number;
}
