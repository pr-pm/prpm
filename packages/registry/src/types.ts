/**
 * Core types for PRMP Registry
 */

// Import shared types from @pr-pm/types
import type {
  Format,
  Subtype,
  Package as SharedPackage,
  PackageVersion as SharedPackageVersion,
  PackageManifest as SharedPackageManifest,
  PackageVisibility,
  PackageAuthor,
  PackageInfo as SharedPackageInfo,
  PackageReview as SharedPackageReview,
  PackageStats as SharedPackageStats
} from '@pr-pm/types';

// Re-export shared types for convenience
export type { Format, Subtype, PackageVisibility, PackageAuthor };

export type OrgRole = 'owner' | 'admin' | 'maintainer' | 'member';

// User & Authentication
export interface User {
  id: string;
  username: string;
  email: string;
  github_id?: string;
  github_username?: string;
  avatar_url?: string;
  password_hash?: string;
  nango_connection_id?: string;
  incoming_connection_id?: string | null;
  website?: string;
  verified_author: boolean;
  is_admin: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar_url?: string;
  website_url?: string;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OrganizationMember {
  org_id: string;
  user_id: string;
  role: OrgRole;
  joined_at: Date;
}

// Package types - extend shared types with DB-specific fields
// Registry uses Date objects, not Date | string
export interface Package extends Omit<SharedPackage, 'created_at' | 'updated_at' | 'last_published_at' | 'ai_use_cases_generated_at' | 'quality_score'> {
  created_at: Date;
  updated_at: Date;
  last_published_at?: Date;
  ai_use_cases_generated_at?: Date;
  quality_score?: number;
  // DB-specific fields not in shared types
  official?: boolean;
  eager?: boolean;
  install_count?: number;
  view_count?: number;
}

export interface PackageVersion extends Omit<SharedPackageVersion, 'published_at'> {
  published_at: Date;
  // DB-specific field
  eager?: boolean;
}

// Package manifest - use shared type but extend for registry-specific needs
export interface PackageManifest extends SharedPackageManifest {
  // Registry accepts the same fields as shared manifest
}

// Reviews & Ratings - use shared types with Date normalization
export interface PackageReview extends Omit<SharedPackageReview, 'created_at' | 'updated_at'> {
  created_at: Date;
  updated_at: Date;
}

// Statistics - use shared types with Date normalization
export interface PackageStats extends Omit<SharedPackageStats, 'date'> {
  date: Date;
}

// Access Tokens
export interface AccessToken {
  id: string;
  user_id?: string;
  org_id?: string;
  token_hash: string;
  name: string;
  scopes: string[];
  is_active: boolean;
  last_used_at?: Date;
  expires_at?: Date;
  created_at: Date;
}

// API Request/Response types
export interface SearchFilters {
  format?: Format | Format[];
  subtype?: Subtype | Subtype[];
  tags?: string[];
  category?: string;
  use_case?: string;  // Filter by use case slug
  author?: string;  // Filter by author username
  language?: string;  // Filter by programming language
  framework?: string;  // Filter by framework
  verified?: boolean;
  featured?: boolean;
  sort?: 'relevance' | 'downloads' | 'created' | 'updated' | 'quality' | 'rating';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  packages: Package[];
  total: number;
  offset: number;
  limit: number;
  didYouMean?: string;
  fallback?: boolean;
  original_query?: string;
}

export interface PackageInfo extends Omit<SharedPackageInfo, 'created_at' | 'updated_at' | 'last_published_at'> {
  created_at: Date;
  updated_at: Date;
  last_published_at?: Date;
  author?: User;
  organization?: Organization;
}

export interface PublishRequest {
  manifest: PackageManifest;
  tarball: Buffer;
  readme?: string;
}

export interface PublishResponse {
  success: boolean;
  package_id: string;
  version: string;
  message: string;
}

// Audit log
export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  metadata: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// JWT Payload
export interface JWTPayload {
  user_id: string;
  username: string;
  email: string;
  is_admin: boolean;
  verified_author: boolean;
  scopes: string[];
  iat: number;
  exp: number;
}

// Configuration
export interface RegistryConfig {
  env?: string;
  port: number;
  host: string;
  logLevel: string;
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  search: {
    engine: 'postgres' | 'opensearch';
    opensearch: {
      endpoint: string;
      region: string;
    };
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  nango: {
    apiKey: string;
    host: string;
    integrationId: string;
  };
  s3: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  rateLimit: {
    max: number;
    window: number;
  };
  packages: {
    maxSize: number;
    allowedExtensions: string[];
  };
  ai: {
    anthropicApiKey: string;
    evaluationEnabled: boolean;
  };
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
  };
  frontend: {
    url: string;
  };
  seoData?: {
    enabled: boolean;
    bucket: string;
    prefix: string;
    cacheControl: string;
    webappBucket?: string;
  };
}
