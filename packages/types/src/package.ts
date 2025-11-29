/**
 * Package types and enums
 */

/**
 * Package format - the AI tool/platform the package is for
 */
export type Format =
  | "cursor"
  | "cursor-hooks"
  | "claude"
  | "continue"
  | "windsurf"
  | "copilot"
  | "kiro"
  | "agents.md"
  | "gemini.md"
  | "claude.md"
  | "gemini"
  | "opencode"
  | "ruler"
  | "droid"
  | "trae"
  | "aider"
  | "zencoder"
  | "replit"
  | "generic"
  | "mcp";

/**
 * Available formats as a constant array
 * Useful for CLI prompts, validation, etc.
 */
export const FORMATS: readonly Format[] = [
  "cursor",
  "cursor-hooks",
  "claude",
  "continue",
  "windsurf",
  "copilot",
  "kiro",
  "agents.md",
  "gemini.md",
  "claude.md",
  "gemini",
  "opencode",
  "ruler",
  "droid",
  "trae",
  "aider",
  "zencoder",
  "replit",
  "generic",
  "mcp",
] as const;

/**
 * Package subtype - the functional category of the package
 */
export type Subtype =
  | "rule"
  | "agent"
  | "skill"
  | "slash-command"
  | "prompt"
  | "workflow"
  | "tool"
  | "template"
  | "collection"
  | "chatmode"
  | "hook";

/**
 * Available subtypes as a constant array
 * Useful for CLI prompts, validation, etc.
 */
export const SUBTYPES: readonly Subtype[] = [
  "rule",
  "agent",
  "skill",
  "slash-command",
  "prompt",
  "workflow",
  "tool",
  "template",
  "collection",
  "chatmode",
  "hook",
] as const;

/**
 * Mapping of formats to their supported subtypes
 * Defines which subtypes are valid/available for each format
 */
export const FORMAT_SUBTYPES: Record<Format, readonly Subtype[]> = {
  cursor: ["rule", "agent", "slash-command", "tool"],
  "cursor-hooks": ["hook"],
  claude: ["skill", "agent", "slash-command", "tool", "hook"],
  "claude.md": ["agent"],
  continue: ["rule", "agent", "slash-command", "tool"],
  windsurf: ["rule", "agent", "slash-command", "tool"],
  copilot: ["tool", "chatmode"],
  kiro: ["rule", "agent", "tool", "hook"],
  gemini: ["slash-command"],
  "gemini.md": ["slash-command"],
  opencode: ["agent", "slash-command", "tool"],
  ruler: ["rule", "agent", "tool"],
  droid: ["skill", "slash-command", "hook"],
  trae: ["rule"],
  aider: ["rule"],
  zencoder: ["rule"],
  replit: ["rule"],
  mcp: ["tool"],
  "agents.md": ["skill", "agent"],
  generic: [
    "rule",
    "agent",
    "skill",
    "slash-command",
    "tool",
    "chatmode",
    "hook",
  ],
} as const;

export type PackageVisibility = "public" | "private" | "unlisted";

/**
 * Core package interface
 */
export interface Package {
  id: string;
  name: string;
  display_name?: string;
  description?: string;
  author_id?: string;
  author_username?: string;
  org_id?: string;
  org_name?: string;
  format: Format;
  subtype: Subtype; // Required, defaults to 'rule'
  license?: string;
  repository_url?: string;
  homepage_url?: string;
  documentation_url?: string;
  tags: string[];
  keywords: string[];
  category?: string;
  language?: string; // Primary programming language (javascript, python, typescript, etc.)
  framework?: string; // Primary framework (react, nextjs, django, etc.)
  visibility: PackageVisibility;
  deprecated: boolean;
  deprecated_reason?: string;
  verified: boolean;
  featured: boolean;
  total_downloads: number;
  weekly_downloads: number;
  monthly_downloads: number;
  version_count: number;
  stars?: number; // Number of users who starred this package
  quality_score?: number | string;
  quality_explanation?: string;
  rating_average?: number;
  rating_count: number;
  ai_use_cases?: string[]; // AI-generated practical use cases (3-5 scenarios)
  ai_use_cases_generated_at?: Date | string; // When use cases were last generated
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
 * Conversion hints for cross-format transformations
 * Helps improve quality when converting to other formats
 */
export interface ConversionHints {
  /** Hints for Cursor format conversion */
  cursor?: {
    alwaysApply?: boolean;
    priority?: "high" | "medium" | "low";
    globs?: string[];
  };

  /** Hints for Claude format conversion */
  claude?: {
    model?: "sonnet" | "opus" | "haiku" | "inherit";
    tools?: string[];
    subagentType?: string;
  };

  /** Hints for Kiro format conversion */
  kiro?: {
    inclusion?: "always" | "fileMatch" | "manual";
    fileMatchPattern?: string;
    domain?: string;
    tools?: string[];
    mcpServers?: Record<
      string,
      {
        command: string;
        args?: string[];
        env?: Record<string, string>;
      }
    >;
  };

  /** Hints for GitHub Copilot format conversion */
  copilot?: {
    applyTo?: string | string[];
    excludeAgent?: "code-review" | "coding-agent";
  };

  /** Hints for Continue format conversion */
  continue?: {
    alwaysApply?: boolean;
    globs?: string | string[];
    regex?: string | string[];
  };

  /** Hints for Windsurf format conversion */
  windsurf?: {
    characterLimit?: number; // Warn if exceeding 12K limit
  };

  /** Hints for agents.md format conversion */
  agentsMd?: {
    project?: string;
    scope?: string;
  };
}

/**
 * Package manifest (from prpm.json)
 */
export interface PackageManifest {
  name: string;
  version: string;
  description: string;
  author?: string | PackageAuthor;
  license?: string;
  repository?: string;
  homepage?: string;
  documentation?: string;
  format: Format;
  subtype?: Subtype; // Optional, defaults to 'rule'
  organization?: string; // Organization name or ID to publish under
  tags?: string[];
  keywords?: string[];
  category?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  files: string[];
  main?: string;

  /**
   * Optional conversion hints for cross-format transformations
   * Used to improve quality when converting to other formats
   */
  conversion?: ConversionHints;
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
 * Multi-package manifest (from prpm.json with packages array)
 * Supports publishing multiple packages from a single manifest
 */
export interface MultiPackageManifest {
  name: string;
  version: string;
  description?: string;
  author?: string | PackageAuthor;
  license?: string;
  repository?: string;
  homepage?: string;
  documentation?: string;
  organization?: string;
  tags?: string[];
  keywords?: string[];
  packages: PackageManifest[];
}

/**
 * Union type for single or multi-package manifests
 */
export type Manifest = PackageManifest | MultiPackageManifest;

/**
 * Type guard to check if manifest is multi-package
 */
export function isMultiPackageManifest(
  manifest: Manifest,
): manifest is MultiPackageManifest {
  return "packages" in manifest && Array.isArray(manifest.packages);
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
