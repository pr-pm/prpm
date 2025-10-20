/**
 * Core types for the Prompt Package Manager
 */

export type PackageType = 'cursor' | 'claude' | 'claude-skill' | 'continue' | 'windsurf' | 'generic' | 'mcp';

export interface Package {
  id: string;
  type: PackageType;
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
  type: PackageType;
}

export interface RemoveOptions {
  id: string;
}

export interface ListOptions {
  // Future expansion: filtering, sorting
  type?: PackageType;
}

export interface IndexOptions {
  // Future expansion: specific directories, dry-run mode
  force?: boolean;
}
