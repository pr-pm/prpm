/**
 * Shared TypeScript types for PRPM Claude Code hooks
 * Based on official documentation: https://code.claude.com/docs/en/hooks
 */

/**
 * Hook event types
 */
export type HookEventName =
  | 'PreToolUse'
  | 'PermissionRequest'
  | 'PostToolUse'
  | 'Notification'
  | 'UserPromptSubmit'
  | 'Stop'
  | 'SubagentStop'
  | 'PreCompact'
  | 'SessionStart'
  | 'SessionEnd';

/**
 * Permission modes
 */
export type PermissionMode =
  | 'default'
  | 'plan'
  | 'acceptEdits'
  | 'dontAsk'
  | 'bypassPermissions';

/**
 * Notification types
 */
export type NotificationType =
  | 'permission_prompt'
  | 'idle_prompt'
  | 'auth_success'
  | 'elicitation_dialog';

/**
 * Session start sources
 */
export type SessionStartSource = 'startup' | 'resume' | 'clear' | 'compact';

/**
 * Session end reasons
 */
export type SessionEndReason = 'clear' | 'logout' | 'prompt_input_exit' | 'other';

/**
 * Compact trigger types
 */
export type CompactTrigger = 'manual' | 'auto';

/**
 * Base input fields common to all hook events
 */
export interface HookInputBase {
  /** Current session identifier */
  session_id: string;
  /** Path to session transcript file */
  transcript_path: string;
  /** Current working directory */
  cwd: string;
  /** Current permission mode */
  permission_mode: PermissionMode;
  /** Name of the hook event */
  hook_event_name: HookEventName;
}

/**
 * Tool input parameters (varies by tool)
 */
export interface ToolInput {
  /** File path (Read, Write, Edit tools) */
  file_path?: string;
  /** File content (Write tool) */
  content?: string;
  /** Original string to replace (Edit tool) */
  old_string?: string;
  /** New string to insert (Edit tool) */
  new_string?: string;
  /** Command to execute (Bash tool) */
  command?: string;
  /** Search/glob pattern (Grep, Glob tools) */
  pattern?: string;
  /** Search path (Grep, Glob tools) */
  path?: string;
  /** Additional tool-specific fields */
  [key: string]: unknown;
}

/**
 * PreToolUse event input
 */
export interface PreToolUseInput extends HookInputBase {
  hook_event_name: 'PreToolUse';
  /** Name of the tool being called */
  tool_name: string;
  /** Input parameters for the tool */
  tool_input: ToolInput;
  /** Unique identifier for this tool use */
  tool_use_id: string;
}

/**
 * PostToolUse event input
 */
export interface PostToolUseInput extends HookInputBase {
  hook_event_name: 'PostToolUse';
  /** Name of the tool that was called */
  tool_name: string;
  /** Input parameters that were used */
  tool_input: ToolInput;
  /** Response from the tool */
  tool_response: Record<string, unknown>;
  /** Unique identifier for this tool use */
  tool_use_id: string;
}

/**
 * PermissionRequest event input
 */
export interface PermissionRequestInput extends HookInputBase {
  hook_event_name: 'PermissionRequest';
  /** Name of the tool requesting permission */
  tool_name: string;
  /** Input parameters for the tool */
  tool_input: ToolInput;
}

/**
 * Notification event input
 */
export interface NotificationInput extends HookInputBase {
  hook_event_name: 'Notification';
  /** Notification message */
  message: string;
  /** Type of notification */
  notification_type: NotificationType;
}

/**
 * UserPromptSubmit event input
 */
export interface UserPromptSubmitInput extends HookInputBase {
  hook_event_name: 'UserPromptSubmit';
  /** User's prompt text */
  prompt: string;
}

/**
 * Stop event input
 */
export interface StopInput extends HookInputBase {
  hook_event_name: 'Stop';
  /** Whether stop hook is active */
  stop_hook_active: boolean;
}

/**
 * SubagentStop event input
 */
export interface SubagentStopInput extends HookInputBase {
  hook_event_name: 'SubagentStop';
  /** Whether stop hook is active */
  stop_hook_active: boolean;
}

/**
 * PreCompact event input
 */
export interface PreCompactInput extends HookInputBase {
  hook_event_name: 'PreCompact';
  /** What triggered the compact */
  trigger: CompactTrigger;
  /** Custom instructions for compact */
  custom_instructions: string;
}

/**
 * SessionStart event input
 */
export interface SessionStartInput extends HookInputBase {
  hook_event_name: 'SessionStart';
  /** How the session started */
  source: SessionStartSource;
}

/**
 * SessionEnd event input
 */
export interface SessionEndInput extends HookInputBase {
  hook_event_name: 'SessionEnd';
  /** Why the session ended */
  reason: SessionEndReason;
}

/**
 * Union type for all hook inputs
 */
export type HookInput =
  | PreToolUseInput
  | PostToolUseInput
  | PermissionRequestInput
  | NotificationInput
  | UserPromptSubmitInput
  | StopInput
  | SubagentStopInput
  | PreCompactInput
  | SessionStartInput
  | SessionEndInput;

/**
 * Legacy input structure for backwards compatibility
 * @deprecated Use specific event input types instead
 */
export interface LegacyHookInput {
  input?: ToolInput;
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

// ============================================================================
// Hook Output Types
// ============================================================================

/**
 * Permission decision for PreToolUse hooks
 */
export type PermissionDecision = 'allow' | 'deny' | 'ask';

/**
 * Base output fields for all hooks (exit code 0 only)
 */
export interface HookOutputBase {
  /** Whether Claude should continue after hook */
  continue?: boolean;
  /** Message when continue is false */
  stopReason?: string;
  /** Hide stdout from transcript */
  suppressOutput?: boolean;
  /** Warning message to show user */
  systemMessage?: string;
}

/**
 * PreToolUse hook-specific output
 */
export interface PreToolUseOutput extends HookOutputBase {
  hookSpecificOutput?: {
    hookEventName: 'PreToolUse';
    /** Permission decision */
    permissionDecision?: PermissionDecision;
    /** Reason for the decision */
    permissionDecisionReason?: string;
    /** Modified tool input */
    updatedInput?: ToolInput;
  };
}

/**
 * PermissionRequest hook-specific output
 */
export interface PermissionRequestOutput extends HookOutputBase {
  hookSpecificOutput?: {
    hookEventName: 'PermissionRequest';
    decision?: {
      /** Allow or deny the permission */
      behavior: 'allow' | 'deny';
      /** Modified tool input */
      updatedInput?: ToolInput;
      /** Message to show */
      message?: string;
      /** Interrupt execution */
      interrupt?: boolean;
    };
  };
}

/**
 * PostToolUse hook-specific output
 */
export interface PostToolUseOutput extends HookOutputBase {
  /** Set to 'block' to block (though tool already ran) */
  decision?: 'block';
  /** Reason for blocking */
  reason?: string;
  hookSpecificOutput?: {
    hookEventName: 'PostToolUse';
    /** Additional context to add */
    additionalContext?: string;
  };
}

/**
 * UserPromptSubmit hook-specific output
 */
export interface UserPromptSubmitOutput extends HookOutputBase {
  /** Set to 'block' to block the prompt */
  decision?: 'block';
  /** Reason for blocking */
  reason?: string;
  hookSpecificOutput?: {
    hookEventName: 'UserPromptSubmit';
    /** Additional context to add */
    additionalContext?: string;
  };
}

/**
 * Stop/SubagentStop hook-specific output
 */
export interface StopOutput extends HookOutputBase {
  /** Set to 'block' to prevent stopping */
  decision?: 'block';
  /** Reason (required when blocking) */
  reason?: string;
}

/**
 * SessionStart hook-specific output
 */
export interface SessionStartOutput extends HookOutputBase {
  hookSpecificOutput?: {
    hookEventName: 'SessionStart';
    /** Additional context to add to session */
    additionalContext?: string;
  };
}

/**
 * Prompt hook response format (for prompt-based hooks)
 */
export interface PromptHookResponse {
  /** Whether the check passed */
  ok: boolean;
  /** Explanation (required when ok is false) */
  reason?: string;
}

/**
 * Union type for all hook outputs
 */
export type HookOutput =
  | PreToolUseOutput
  | PermissionRequestOutput
  | PostToolUseOutput
  | UserPromptSubmitOutput
  | StopOutput
  | SessionStartOutput
  | HookOutputBase;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if input is a PreToolUse event
 */
export function isPreToolUseInput(input: HookInput): input is PreToolUseInput {
  return input.hook_event_name === 'PreToolUse';
}

/**
 * Check if input is a PostToolUse event
 */
export function isPostToolUseInput(input: HookInput): input is PostToolUseInput {
  return input.hook_event_name === 'PostToolUse';
}

/**
 * Check if input is a Notification event
 */
export function isNotificationInput(input: HookInput): input is NotificationInput {
  return input.hook_event_name === 'Notification';
}

/**
 * Check if input is a UserPromptSubmit event
 */
export function isUserPromptSubmitInput(input: HookInput): input is UserPromptSubmitInput {
  return input.hook_event_name === 'UserPromptSubmit';
}

/**
 * Check if input is a SessionStart event
 */
export function isSessionStartInput(input: HookInput): input is SessionStartInput {
  return input.hook_event_name === 'SessionStart';
}

/**
 * Check if input is a SessionEnd event
 */
export function isSessionEndInput(input: HookInput): input is SessionEndInput {
  return input.hook_event_name === 'SessionEnd';
}

/**
 * Check if input is a tool-related event (has tool_input)
 */
export function isToolInput(
  input: HookInput
): input is PreToolUseInput | PostToolUseInput | PermissionRequestInput {
  return (
    input.hook_event_name === 'PreToolUse' ||
    input.hook_event_name === 'PostToolUse' ||
    input.hook_event_name === 'PermissionRequest'
  );
}
