/**
 * API request and response types
 */

import { PackageManifest, Package } from './package';
import { Author } from './user';
import { Collection } from './collection';

/**
 * Publish request
 */
export interface PublishRequest {
  manifest: PackageManifest;
  tarball: Buffer;
  readme?: string;
}

/**
 * Publish response
 */
export interface PublishResponse {
  success: boolean;
  package_id: string;
  version: string;
  message: string;
}

/**
 * Invite details
 */
export interface InviteDetails {
  id: string;
  author_username: string;
  package_count: number;
  invite_message?: string;
  status: string;
  expires_at: string;
}

/**
 * Claim invite request
 */
export interface ClaimInviteRequest {
  github_username?: string;
  email?: string;
}

/**
 * Claim invite response
 */
export interface ClaimInviteResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    username: string;
    verified_author: boolean;
  };
}

/**
 * Top authors response
 */
export interface TopAuthorsResponse {
  authors: Author[];
  total: number;
}

/**
 * Star action response
 */
export interface StarActionResponse {
  starred: boolean;
  stars: number;
}

/**
 * Starred packages response
 */
export interface StarredPackagesResponse {
  packages: Package[];
  total: number;
}

/**
 * Starred collections response
 */
export interface StarredCollectionsResponse {
  collections: Collection[];
  total: number;
}
