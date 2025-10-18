/**
 * Collection types
 * Collections are curated bundles of packages
 */

export interface Collection {
  // Identity
  id: string;
  scope: string;                     // 'collection' or username
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
  created_at: Date;
  updated_at: Date;
}

export interface CollectionPackage {
  packageId: string;
  version?: string;                  // null/undefined = 'latest'
  required: boolean;
  reason?: string;
  installOrder?: number;
  formatOverride?: string;           // Override format for this package
  formatSpecific?: {                 // IDE-specific package variations
    cursor?: string;                 // Package ID for Cursor
    claude?: string;                 // Package ID for Claude (may include skills/marketplace)
    continue?: string;               // Package ID for Continue
    windsurf?: string;               // Package ID for Windsurf
  };
}

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  description?: string;
  optional?: boolean;
}

export interface CollectionConfig {
  defaultFormat?: 'cursor' | 'claude' | 'continue' | 'windsurf';
  installOrder?: 'sequential' | 'parallel';
  postInstall?: string;              // Script to run after install
  extends?: string;                  // Base collection to extend
  mcpServers?: Record<string, MCPServerConfig>;  // MCP servers for Claude users
}

export type CollectionCategory =
  | 'development'
  | 'design'
  | 'data-science'
  | 'devops'
  | 'testing'
  | 'documentation'
  | 'general';

export interface CollectionCreateInput {
  id: string;
  name: string;
  description: string;
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

export interface CollectionSearchQuery {
  category?: CollectionCategory;
  tag?: string;
  tags?: string[];
  framework?: string;
  official?: boolean;
  verified?: boolean;
  scope?: string;
  author?: string;
  query?: string;                    // Full-text search
  limit?: number;
  offset?: number;
  sortBy?: 'downloads' | 'stars' | 'created' | 'updated' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface CollectionInstallInput {
  scope: string;
  id: string;
  version?: string;                  // Default to 'latest'
  format?: string;
  skipOptional?: boolean;
}

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
