/**
 * Core types for the Prompt Package Manager
 */

import type { Format, Subtype } from '@pr-pm/types';

// Re-export for backwards compatibility
export type { Format, Subtype } from '@pr-pm/types';

export interface Package {
  id: string;
  format: Format;
  subtype: Subtype;
  url: string;
  dest: string;
  // Future expansion fields (not used in MVP)
  version?: string;
  provider?: string;
  verified?: boolean;
  score?: number;
  metadata?: Record<string, any>;
}

export interface Config {
  sources: Package[];
  // Future expansion fields
  registry?: string;
  settings?: Record<string, any>;
}

export interface AddOptions {
  url: string;
  format: Format;
  subtype?: Subtype;
}

export interface RemoveOptions {
  id: string;
}

export interface ListOptions {
  // Future expansion: filtering, sorting
  format?: Format;
  subtype?: Subtype;
}

export interface IndexOptions {
  // Future expansion: specific directories, dry-run mode
  force?: boolean;
}
