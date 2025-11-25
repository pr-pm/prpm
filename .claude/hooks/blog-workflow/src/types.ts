/**
 * Type definitions for blog workflow hook
 */

export interface UserPromptSubmitContext {
  userPrompt: string;
  conversationHistory?: any[];
}

export interface UserPromptSubmitResult {
  status?: 'continue' | 'blocked';
  modifiedPrompt?: string;
  additionalContext?: string;
  systemReminders?: string[];
}

export interface HookConfig {
  enabled?: boolean;
  strictMode?: boolean;
}
