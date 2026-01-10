/**
 * Canonical Package Format
 *
 * Universal format that can be converted to any editor-specific format
 * (Cursor, Claude, Continue, Windsurf, etc.)
 */

// Import Format and Subtype from shared types package
import type { Format, Subtype } from '@pr-pm/types';

// Re-export for convenience
export type { Format, Subtype };

/**
 * Package metadata provided to converters
 * Shared interface for all from* converter functions
 */
export interface PackageMetadata {
  // Required fields
  id: string;
  name: string;
  version: string;
  author: string;

  // Optional core fields
  description?: string;
  organization?: string;
  tags?: string[];

  // Optional prpm.json fields
  license?: string;
  repository?: string;
  homepage?: string;
  documentation?: string;
  keywords?: string[];
  category?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: Record<string, string>;
}

export interface CanonicalPackage {
  // Package metadata
  id: string;
  version: string;
  name: string;
  description: string;
  author: string;
  organization?: string; // Organization name if published under org
  tags: string[];

  // Taxonomy: format (AI editor) + subtype (package kind)
  format: Format;
  subtype: Subtype;

  // Additional metadata from prpm.json
  license?: string;
  repository?: string;
  homepage?: string;
  documentation?: string;
  keywords?: string[];
  category?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: Record<string, string>;

  // Content in canonical format
  content: CanonicalContent;

  // Extracted metadata for easier access (mirrors MetadataSection.data)
  metadata?: {
    title?: string;
    description?: string;
    icon?: string;
    version?: string;
    author?: string;
    globs?: string[];
    alwaysApply?: boolean;
    claudeAgent?: {
      model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
    };
    claudeHook?: {
      event: 'session-start' | 'user-prompt-submit' | 'tool-call' | 'assistant-response'; // Hook event type
      language?: 'bash' | 'typescript' | 'javascript' | 'python' | 'binary'; // Execution format
      executable?: boolean; // Whether the hook is executable
    };
    cursorHook?: {
      hookType: 'beforeShellExecution' | 'afterShellExecution' | 'beforeMCPExecution' | 'afterMCPExecution' | 'beforeReadFile' | 'afterFileEdit' | 'beforeSubmitPrompt' | 'stop' | 'afterAgentResponse' | 'afterAgentThought' | 'beforeTabFileRead' | 'afterTabFileEdit';
      scriptPath?: string; // Path to the executable script
    };
    copilotConfig?: {
      instructionName?: string; // Name for the instruction file
      applyTo?: string | string[]; // REQUIRED for path-specific - glob pattern(s) or comma-separated string
      excludeAgent?: 'code-review' | 'coding-agent'; // Exclude from specific agent
    };
    kiroConfig?: {
      filename?: string; // Suggested filename in .kiro/steering/
      inclusion?: 'always' | 'fileMatch' | 'manual'; // REQUIRED - no default
      fileMatchPattern?: string; // Required if inclusion is 'fileMatch'
      domain?: string; // Domain/topic for organization
      foundationalType?: 'product' | 'tech' | 'structure'; // Foundational file type (product.md, tech.md, structure.md)
    };
    kiroAgent?: {
      tools?: string[]; // Available tools for the agent
      mcpServers?: Record<string, {
        command: string;
        args?: string[];
        env?: Record<string, string>;
        timeout?: number;
      }>;
      toolAliases?: Record<string, string>;
      allowedTools?: string[];
      toolsSettings?: Record<string, any>;
      resources?: string[];
      hooks?: {
        agentSpawn?: string[];
        userPromptSubmit?: string[];
        preToolUse?: string[];
        postToolUse?: string[];
        stop?: string[];
      };
      useLegacyMcpJson?: boolean;
      model?: string;
    };
    agentsMdConfig?: {
      project?: string; // Project name
      scope?: string; // Scope of the instructions (e.g., "testing", "api")
    };
    windsurfConfig?: {
      characterCount?: number; // Track character count for 12K limit warning
    };
    continueConfig?: {
      globs?: string | string[]; // Glob pattern(s) to match files
      regex?: string | string[]; // Regex pattern(s) to match file content
      alwaysApply?: boolean; // Rule inclusion behavior
      version?: string; // Rule version (YAML format)
      schema?: string; // Schema version (YAML format)
    };
    opencode?: {
      mode?: 'subagent' | 'primary' | 'all';
      model?: string;
      temperature?: number;
      prompt?: string; // Path to custom system prompt file using {file:./path} syntax
      maxSteps?: number; // Iteration limit - unlimited if unset
      permission?: Record<string, any>;
      disable?: boolean;
    };
    agentSkills?: {
      name?: string;
      license?: string;
      compatibility?: string;
      allowedTools?: string; // Space-delimited list per Agent Skills spec
      metadata?: Record<string, string>; // Arbitrary key-value pairs
    };
    droid?: {
      argumentHint?: string; // Usage hint for slash commands
      allowedTools?: string[]; // Reserved for future use
    };
    amp?: {
      globs?: string[]; // File patterns for conditional inclusion
      argumentHint?: string; // Hint shown for skill invocation
      disableModelInvocation?: boolean; // Prevent model from auto-invoking
    };
    zencoderConfig?: {
      globs?: string[]; // File patterns where the rule applies
      alwaysApply?: boolean; // Whether rule should always be active
    };
    claudePlugin?: {
      mcpServers?: Record<string, {
        type?: 'stdio' | 'http' | 'sse';
        command?: string;
        args?: string[];
        url?: string;
        env?: Record<string, string>;
        disabled?: boolean;
      }>;
      contents?: {
        agents?: string[];
        skills?: string[];
        commands?: string[];
      };
      instructions?: string;
      _geminiMetadata?: {
        contextFileName?: string;
        excludeTools?: string[];
        experimentalSettings?: Record<string, any>;
      };
    };
    geminiExtension?: {
      mcpServers?: Record<string, {
        command: string;
        args?: string[];
        env?: Record<string, string>;
        disabled?: boolean;
      }>;
      contextFileName?: string;
      excludeTools?: string[];
      experimentalSettings?: Record<string, any>;
    };
    fileStructure?: {
      mainFile: string;
      files: Array<{
        path: string;
        category?: string;
        description?: string;
      }>;
      directories?: string[];
    };
  };

  // Format compatibility scores (keyed by Format type)
  formatScores?: Partial<Record<Format, number>>;

  // Source information - which format was this package originally in
  sourceFormat?: Format;
  sourceUrl?: string;

  // Quality & verification flags
  official?: boolean;    // Official package from cursor.directory, claude.ai, etc.
  verified?: boolean;    // Verified by PRPM team for quality/safety
  karenScore?: number;   // 0-100 quality score from Karen

  // Multi-file package structure (for Cursor @file references, etc.)
  fileStructure?: {
    /** Main entry file path */
    mainFile: string;
    /** Additional files referenced in the package */
    files: Array<{
      path: string;
      category?: string;
      description?: string;
    }>;
    /** Directory structure for visualization */
    directories?: string[];
  };
}

export interface CanonicalContent {
  format: 'canonical';
  version: '1.0';
  sections: Section[];
}

export type Section =
  | MetadataSection
  | InstructionsSection
  | RulesSection
  | ExamplesSection
  | ToolsSection
  | PersonaSection
  | ContextSection
  | HookSection
  | CursorHookSection
  | FileReferenceSection
  | CustomSection;

/**
 * Metadata section
 * Contains package metadata and display information
 */
export interface MetadataSection {
  type: 'metadata';
  data: {
    title: string;
    description: string;
    icon?: string;
    version?: string;
    author?: string;
    claudeAgent?: {
      mode?: 'subagent' | 'primary' | 'all';
      model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
    };
    claudeSlashCommand?: {
      description?: string; // Description of the slash command
      argumentHint?: string | string[]; // Arguments expected for the slash command (string or array of positional args)
      allowedTools?: string; // Comma-separated list of tools
      model?: string; // Model to use for the command
      disableModelInvocation?: boolean; // Whether to prevent SlashCommand tool from calling this
    };
    opencode?: {
      mode?: 'subagent' | 'primary' | 'all';
      model?: string;
      temperature?: number;
      prompt?: string; // Path to custom system prompt file using {file:./path} syntax
      maxSteps?: number; // Iteration limit - unlimited if unset
      permission?: Record<string, any>;
      disable?: boolean;
    };
    agentSkills?: {
      name?: string;
      license?: string;
      compatibility?: string;
      allowedTools?: string; // Space-delimited list per Agent Skills spec
      metadata?: Record<string, string>; // Arbitrary key-value pairs
    };
    opencodeSlashCommand?: {
      description?: string; // Description of the slash command
      agent?: string; // Agent identifier
      model?: string; // Model to use
      subtask?: boolean; // Whether this is a subtask command
      template?: string; // Template string with placeholders
      argumentHint?: string; // Arguments expected for the slash command
    };
    droid?: {
      argumentHint?: string; // Usage hint for slash commands
      allowedTools?: string[]; // Reserved for future use
    };
    amp?: {
      globs?: string[]; // File patterns for conditional inclusion
      argumentHint?: string; // Hint shown for skill invocation
      disableModelInvocation?: boolean; // Prevent model from auto-invoking
    };
    zencoderConfig?: {
      globs?: string[]; // File patterns where the rule applies
      alwaysApply?: boolean; // Whether rule should always be active
    };
    claudePlugin?: {
      mcpServers?: Record<string, {
        type?: 'stdio' | 'http' | 'sse';
        command?: string;
        args?: string[];
        url?: string;
        env?: Record<string, string>;
        disabled?: boolean;
      }>;
      contents?: {
        agents?: string[];
        skills?: string[];
        commands?: string[];
      };
      instructions?: string;
      _geminiMetadata?: {
        contextFileName?: string;
        excludeTools?: string[];
        experimentalSettings?: Record<string, any>;
      };
    };
    geminiExtension?: {
      mcpServers?: Record<string, {
        command: string;
        args?: string[];
        env?: Record<string, string>;
        disabled?: boolean;
      }>;
      contextFileName?: string;
      excludeTools?: string[];
      experimentalSettings?: Record<string, any>;
    };
  };
}

/**
 * Instructions section
 * Free-form instructional content
 */
export interface InstructionsSection {
  type: 'instructions';
  title: string;
  content: string;
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Rules section
 * List of rules or guidelines
 */
export interface RulesSection {
  type: 'rules';
  title: string;
  items: Rule[];
  ordered?: boolean; // Whether rules should be numbered
}

export interface Rule {
  content: string;
  rationale?: string; // Why this rule exists
  examples?: string[]; // Example code snippets
}

/**
 * Examples section
 * Code examples or use cases
 */
export interface ExamplesSection {
  type: 'examples';
  title: string;
  examples: Example[];
}

export interface Example {
  description: string;
  code: string;
  language?: string; // e.g., 'typescript', 'python'
  good?: boolean; // Is this a good or bad example?
}

/**
 * Tools section (Claude-specific)
 * Available tools/capabilities
 */
export interface ToolsSection {
  type: 'tools';
  tools: string[]; // e.g., ['Read', 'Write', 'Bash', 'WebSearch']
  description?: string;
}

/**
 * Persona section
 * AI persona/role definition
 */
export interface PersonaSection {
  type: 'persona';
  data: {
    name?: string;
    role: string;
    icon?: string;
    style?: string[]; // e.g., ['analytical', 'concise', 'friendly']
    expertise?: string[]; // Areas of expertise
  };
}

/**
 * Context section
 * Additional context or background
 */
export interface ContextSection {
  type: 'context';
  title: string;
  content: string;
}

/**
 * Hook section (Claude-specific)
 * Executable code for hooks
 */
export interface HookSection {
  type: 'hook';
  event: 'session-start' | 'user-prompt-submit' | 'tool-call' | 'assistant-response';
  language: 'bash' | 'typescript' | 'javascript' | 'python' | 'binary';
  code: string; // The actual executable code
  description?: string; // What the hook does
}

/**
 * Cursor Hook section
 * Executable scripts for Cursor hooks
 */
export interface CursorHookSection {
  type: 'cursor-hook';
  hookType: 'beforeShellExecution' | 'afterShellExecution' | 'beforeMCPExecution' | 'afterMCPExecution' | 'beforeReadFile' | 'afterFileEdit' | 'beforeSubmitPrompt' | 'stop' | 'afterAgentResponse' | 'afterAgentThought' | 'beforeTabFileRead' | 'afterTabFileEdit';
  scriptPath: string; // Path to the executable script
  description?: string; // What the hook does
  script?: string; // The actual script content (if embedded)
}

/**
 * File Reference section
 * References to additional files in multi-file packages
 * Particularly useful for Cursor @file references
 */
export interface FileReferenceSection {
  type: 'file-reference';
  /** Display title for the file */
  title: string;
  /** Relative path within the package (e.g., "patterns/naming.md") */
  path: string;
  /** File content */
  content: string;
  /** MIME type or language identifier (e.g., "text/markdown", "typescript") */
  contentType?: string;
  /** Purpose/category for organization */
  category?: 'pattern' | 'example' | 'context' | 'config' | 'data' | 'documentation' | 'other';
  /** Optional description of what this file provides */
  description?: string;
}

/**
 * Custom section
 * Fallback for editor-specific features
 */
export interface CustomSection {
  type: 'custom';
  editorType?: 'cursor' | 'claude' | 'continue' | 'windsurf' | 'copilot' | 'kiro' | 'gemini' | 'zed' | 'codex' | 'amp';
  title?: string;
  content: string;
  metadata?: Record<string, any>;
}

/**
 * Format conversion options
 */
export interface ConversionOptions {
  targetFormat: 'cursor' | 'claude' | 'continue' | 'windsurf' | 'copilot' | 'kiro' | 'gemini' | 'amp' | 'canonical';
  preserveComments?: boolean;
  optimizeForEditor?: boolean; // Use editor-specific features
  includeMetadata?: boolean;

  // GitHub Copilot specific options
  copilotConfig?: {
    instructionName?: string;
    applyTo?: string | string[]; // REQUIRED for path-specific - glob pattern(s) or comma-separated string
    excludeAgent?: 'code-review' | 'coding-agent'; // Exclude from specific agent
  };

  // Kiro specific options
  kiroConfig?: {
    filename?: string;
    inclusion?: 'always' | 'fileMatch' | 'manual'; // REQUIRED
    fileMatchPattern?: string; // Required if inclusion === 'fileMatch'
    domain?: string;
    foundationalType?: 'product' | 'tech' | 'structure'; // Foundational file type (product.md, tech.md, structure.md)
  };
}

/**
 * Extracted script file for hook conversions
 */
export interface ExtractedScript {
  path: string;      // Relative path where the script should be written (e.g., './hooks/user-prompt-submit.sh')
  content: string;   // The script content
  language: string;  // Original language (bash, python, javascript, typescript)
  executable?: boolean; // Whether the script needs execute permissions
}

/**
 * Conversion result
 */
export interface ConversionResult {
  content: string;
  format: string;
  warnings?: string[]; // Any issues during conversion
  validationErrors?: string[]; // Schema validation errors
  lossyConversion?: boolean; // Whether some features were lost
  qualityScore?: number; // 0-100, how well it converted
  extractedScripts?: ExtractedScript[]; // Scripts that need to be written alongside the main content
}
