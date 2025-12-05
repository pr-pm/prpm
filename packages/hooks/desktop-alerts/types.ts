/**
 * Shared TypeScript types for PRPM Claude Code hooks
 */

/**
 * Input structure received by hooks via stdin
 */
export interface HookInput {
  input?: {
    file_path?: string;
    command?: string;
    content?: string;
    old_string?: string;
    new_string?: string;
  };
  message?: string;
  tool?: string;
}

/**
 * Options for executing external commands
 */
export interface ExecOptions {
  /** Skip execution if command is not found (don't throw error) */
  skipOnMissing?: boolean;
  /** Run command in background (don't wait for completion) */
  background?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Environment variables */
  env?: Record<string, string>;
}

/**
 * Hook exit codes
 */
export enum HookExitCode {
  /** Success - allow operation to continue */
  Success = 0,
  /** Non-blocking error - log but continue */
  Error = 1,
  /** Block operation - prevent tool from executing */
  Block = 2,
}

/**
 * Pattern matching result
 */
export interface PatternMatch {
  matched: boolean;
  pattern?: string;
  reason?: string;
}
