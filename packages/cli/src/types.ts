/**
 * Core types for the Prompt Package Manager
 */

export type PackageType = 'cursor' | 'claude' | 'claude-skill' | 'claude-agent' | 'claude-slash-command' | 'continue' | 'windsurf' | 'generic' | 'mcp';

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

export interface CursorMDCConfig {
  version?: string;
  globs?: string[];
  alwaysApply?: boolean;
  author?: string;
  tags?: string[];
}

export interface Config {
  sources: Package[];
  // Future expansion fields
  registry?: string;
  settings?: Record<string, any>;
  // Cursor MDC header configuration
  cursor?: CursorMDCConfig;
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
