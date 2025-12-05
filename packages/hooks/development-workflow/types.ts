/**
 * Type definitions for development workflow hook
 */

export interface SessionStartContext {
  workingDirectory: string;
  gitBranch?: string;
  gitStatus?: string;
}

export interface SessionStartResult {
  status?: 'continue' | 'blocked';
  additionalContext?: string;
  systemReminders?: string[];
}

export interface HookConfig {
  enabled?: boolean;
  enabledBranches?: string[];
}
