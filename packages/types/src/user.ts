/**
 * User, organization, and authentication types
 */

export type OrgRole = 'owner' | 'admin' | 'maintainer' | 'member';

/**
 * User interface
 */
export interface User {
  id: string;
  username: string;
  email: string;
  github_id?: string;
  github_username?: string;
  avatar_url?: string;
  password_hash?: string;
  verified_author: boolean;
  is_admin: boolean;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  last_login_at?: Date | string;
}

/**
 * Organization interface
 */
export interface Organization {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  website_url?: string;
  is_verified: boolean;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'trialing' | null;
  subscription_plan?: 'free' | 'verified';
  subscription_start_date?: Date | string;
  subscription_end_date?: Date | string;
  subscription_cancel_at_period_end?: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

/**
 * Organization member
 */
export interface OrganizationMember {
  org_id: string;
  user_id: string;
  role: OrgRole;
  joined_at: Date | string;
}

/**
 * Access token
 */
export interface AccessToken {
  id: string;
  user_id?: string;
  org_id?: string;
  token_hash: string;
  name: string;
  scopes: string[];
  is_active: boolean;
  last_used_at?: Date | string;
  expires_at?: Date | string;
  created_at: Date | string;
}

/**
 * JWT payload
 */
export interface JWTPayload {
  user_id: string;
  username: string;
  email: string;
  is_admin: boolean;
  scopes: string[];
  iat: number;
  exp: number;
}

/**
 * Audit log
 */
export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  metadata: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date | string;
}

/**
 * Author information (for display)
 */
export interface Author {
  author: string;
  package_count: number;
  total_downloads: number;
  verified: boolean;
  avatar_url?: string;
  github_username?: string;
  latest_package?: string;
  created_at?: string;
}
