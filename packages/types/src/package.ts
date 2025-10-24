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
  | 'generic'
  | 'mcp';

/**
 * Package subtype - the functional category of the package
 */
export type Subtype =
  | 'rule'
  | 'agent'
  | 'skill'
  | 'slash-command'
  | 'prompt'
  | 'workflow'
  | 'tool'
  | 'template'
  | 'collection';

/**
 * Legacy PackageType for backward compatibility
 * @deprecated Use Format and Subtype instead
 */
export type PackageType =
  | 'cursor'
  | 'cursor-agent'
  | 'cursor-slash-command'
  | 'claude'
  | 'claude-skill'
  | 'claude-agent'
  | 'claude-slash-command'
  | 'continue'
  | 'windsurf'
  | 'copilot'
  | 'kiro'
  | 'generic'
  | 'mcp'
  | 'collection';

/**
 * Convert legacy PackageType to Format and Subtype
 */
export function parsePackageType(type: PackageType): { format: Format; subtype?: Subtype } {
  // Handle collection separately
  if (type === 'collection') {
    return { format: 'generic', subtype: 'collection' };
  }

  // Handle MCP
  if (type === 'mcp') {
    return { format: 'mcp', subtype: 'tool' };
  }

  // Split compound types
  if (type.includes('-')) {
    const parts = type.split('-');
    const format = parts[0] as Format;
    const subtypeStr = parts.slice(1).join('-');

    // Map to proper subtype
    const subtypeMap: Record<string, Subtype> = {
      'agent': 'agent',
      'skill': 'skill',
      'slash-command': 'slash-command',
    };

    return { format, subtype: subtypeMap[subtypeStr] || 'rule' };
  }

  // Simple format types default to rule
  return { format: type as Format, subtype: 'rule' };
}

/**
 * Convert Format and Subtype to legacy PackageType
 */
export function toPackageType(format: Format, subtype?: Subtype): PackageType {
  if (subtype === 'collection') {
    return 'collection';
  }

  if (!subtype || subtype === 'rule' || subtype === 'prompt') {
    return format as PackageType;
  }

  // Construct compound type for non-rule subtypes
  if (subtype === 'agent') {
    return `${format}-agent` as PackageType;
  }
  if (subtype === 'skill') {
    return `${format}-skill` as PackageType;
  }
  if (subtype === 'slash-command') {
    return `${format}-slash-command` as PackageType;
  }

  // Default to base format
  return format as PackageType;
}

export type PackageVisibility = 'public' | 'private' | 'unlisted';

/**
 * Core package interface
 */
export interface Package {
  id: string;
  name: string;
  description?: string;
  author_id?: string;
  org_id?: string;
  /** @deprecated Use format and subtype instead */
  type: PackageType;
  format: Format;
  subtype?: Subtype;
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
  author: string | PackageAuthor;
  license?: string;
  repository?: string;
  homepage?: string;
  documentation?: string;
  /** @deprecated Use format and subtype instead */
  type?: PackageType;
  format?: Format;
  subtype?: Subtype;
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
