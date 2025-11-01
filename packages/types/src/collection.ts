/**
 * Collection types
 * Collections are curated bundles of packages
 */

export type CollectionCategory =
  | 'development'
  | 'design'
  | 'data-science'
  | 'devops'
  | 'testing'
  | 'documentation'
  | 'general';

/**
 * Core collection interface
 */
export interface Collection {
  // Identity
  id: string; // UUID
  scope: string; // 'collection' or username
  name_slug: string; // URL-friendly slug (e.g., "startup-mvp")
  name: string;
  description: string;
  version: string;

  // Ownership
  author: string;
  maintainers?: string[];
  official: boolean;
  verified: boolean;

  // Classification
  category?: CollectionCategory;
  tags: string[];
  framework?: string;

  // Packages
  packages: CollectionPackage[];

  // Stats
  downloads: number;
  stars: number;

  // Display
  icon?: string;
  banner?: string;
  readme?: string;

  // Configuration
  config?: CollectionConfig;

  // Timestamps
  created_at: Date | string;
  updated_at: Date | string;

  // Optional metadata
  package_count?: number;
}

/**
 * Package within a collection
 */
export interface CollectionPackage {
  packageId: string;
  version?: string; // null/undefined = 'latest'
  required: boolean;
  reason?: string;
  installOrder?: number;
  formatOverride?: string; // Override format for this package
  formatSpecific?: {
    // IDE-specific package variations
    cursor?: string; // Package ID for Cursor
    claude?: string; // Package ID for Claude (may include skills/marketplace)
    continue?: string; // Package ID for Continue
    windsurf?: string; // Package ID for Windsurf
  };
}

/**
 * MCP server configuration (for Claude)
 */
export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  description?: string;
  optional?: boolean;
}

/**
 * Collection configuration
 */
export interface CollectionConfig {
  defaultFormat?: 'cursor' | 'claude' | 'continue' | 'windsurf';
  installOrder?: 'sequential' | 'parallel';
  postInstall?: string; // Script to run after install
  extends?: string; // Base collection to extend
  mcpServers?: Record<string, MCPServerConfig>; // MCP servers for Claude users
}

/**
 * Collection creation input
 */
export interface CollectionCreateInput {
  id: string;
  name: string;
  description: string;
  version?: string; // Defaults to 1.0.0 if not provided
  category?: CollectionCategory;
  tags?: string[];
  framework?: string;
  packages: {
    packageId: string;
    version?: string;
    required?: boolean;
    reason?: string;
  }[];
  icon?: string;
  banner?: string;
  readme?: string;
  config?: CollectionConfig;
}

/**
 * Collection update input
 */
export interface CollectionUpdateInput {
  name?: string;
  description?: string;
  category?: CollectionCategory;
  tags?: string[];
  framework?: string;
  packages?: CollectionPackage[];
  icon?: string;
  banner?: string;
  readme?: string;
  config?: CollectionConfig;
}

/**
 * Collection installation input
 */
export interface CollectionInstallInput {
  scope: string;
  id: string;
  version?: string; // Default to 'latest'
  format?: string;
  skipOptional?: boolean;
}

/**
 * Collection installation result
 */
export interface CollectionInstallResult {
  collection: Collection;
  packagesToInstall: {
    packageId: string;
    version: string;
    format: string;
    required: boolean;
  }[];
  totalPackages: number;
  requiredPackages: number;
  optionalPackages: number;
}

/**
 * Collection statistics
 */
export interface CollectionStats {
  scope: string;
  id: string;
  downloads: number;
  stars: number;
  installsByFormat: {
    cursor: number;
    claude: number;
    continue: number;
    windsurf: number;
  };
  installsLastWeek: number;
  installsLastMonth: number;
}
