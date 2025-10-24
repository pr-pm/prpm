/**
 * Core types for the Prompt Package Manager
 */

export type Format = 'cursor' | 'claude' | 'continue' | 'windsurf' | 'copilot' | 'kiro' | 'generic' | 'mcp';
export type Subtype = 'rule' | 'agent' | 'skill' | 'slash-command' | 'prompt' | 'workflow' | 'tool' | 'template' | 'collection';

/** @deprecated Use Format and Subtype instead */
export type PackageType = 'cursor' | 'cursor-agent' | 'cursor-slash-command' | 'claude' | 'claude-skill' | 'claude-agent' | 'claude-slash-command' | 'continue' | 'windsurf' | 'copilot' | 'kiro' | 'generic' | 'mcp' | 'collection';

export interface Package {
  id: string;
  /** @deprecated Use format and subtype instead */
  type: PackageType;
  format: Format;
  subtype?: Subtype;
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
