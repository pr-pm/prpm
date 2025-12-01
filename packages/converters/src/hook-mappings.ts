/**
 * Cross-Format Hook Mappings
 *
 * Provides semantic mappings between different hook formats to enable
 * cross-format hook conversion with user control and quality scoring.
 */

import type { HookSection, CursorHookSection } from './types/canonical.js';
import { type HookMappingStrategy } from './cursor-hooks-constants.js';

// Re-export for backwards compatibility
export type { HookMappingStrategy } from './cursor-hooks-constants.js';

export type MappingQuality = 'direct' | 'semantic' | 'none';

export interface HookMapping {
  target: string | null;
  quality: MappingQuality;
  notes?: string;
}

export interface HookMappingResult {
  mapped: boolean;
  targetHookType: string | null;
  quality: MappingQuality;
  warning?: string;
  qualityPenalty: number; // Points to subtract from quality score
}

/**
 * Hook mappings from Claude to Cursor
 */
export const CLAUDE_TO_CURSOR: Record<HookSection['event'], HookMapping> = {
  'session-start': {
    target: null,
    quality: 'none',
    notes: 'Cursor has no session start hook - no equivalent lifecycle event'
  },
  'user-prompt-submit': {
    target: 'beforeSubmitPrompt',
    quality: 'direct',
    notes: 'Direct semantic match - both run before prompt submission'
  },
  'tool-call': {
    target: 'beforeMCPExecution',
    quality: 'semantic',
    notes: 'Semantic match - Claude tool-call maps to Cursor MCP execution'
  },
  'assistant-response': {
    target: 'afterAgentResponse',
    quality: 'direct',
    notes: 'Direct semantic match - both run after agent generates response'
  }
};

/**
 * Hook mappings from Cursor to Claude
 */
export const CURSOR_TO_CLAUDE: Record<CursorHookSection['hookType'], HookMapping> = {
  'beforeShellExecution': { target: null, quality: 'none', notes: 'Claude has no shell execution hooks' },
  'afterShellExecution': { target: null, quality: 'none', notes: 'Claude has no shell execution hooks' },
  'beforeMCPExecution': { target: 'tool-call', quality: 'semantic', notes: 'Maps to Claude tool-call event' },
  'afterMCPExecution': { target: null, quality: 'none', notes: 'Claude has no post-tool hook' },
  'beforeReadFile': { target: null, quality: 'none', notes: 'Claude has no file read hooks' },
  'afterFileEdit': { target: null, quality: 'none', notes: 'Claude has no file edit hooks' },
  'beforeSubmitPrompt': { target: 'user-prompt-submit', quality: 'direct', notes: 'Direct semantic match' },
  'stop': { target: null, quality: 'none', notes: 'Claude has no stop hook' },
  'afterAgentResponse': { target: 'assistant-response', quality: 'direct', notes: 'Direct semantic match' },
  'afterAgentThought': { target: null, quality: 'none', notes: 'Claude has no thought hooks' },
  'beforeTabFileRead': { target: null, quality: 'none', notes: 'Tab hooks are Cursor-specific' },
  'afterTabFileEdit': { target: null, quality: 'none', notes: 'Tab hooks are Cursor-specific' }
};

/**
 * Hook mappings from Kiro to Cursor
 */
export const KIRO_TO_CURSOR: Record<string, HookMapping> = {
  'agentSpawn': { target: null, quality: 'none', notes: 'Cursor has no agent spawn hook' },
  'userPromptSubmit': { target: 'beforeSubmitPrompt', quality: 'direct', notes: 'Direct semantic match' },
  'preToolUse': { target: 'beforeMCPExecution', quality: 'semantic', notes: 'Kiro tools map to Cursor MCP' },
  'postToolUse': { target: 'afterMCPExecution', quality: 'semantic', notes: 'Kiro tools map to Cursor MCP' },
  'stop': { target: 'stop', quality: 'direct', notes: 'Direct semantic match' }
};

/**
 * Hook mappings from Cursor to Kiro
 */
export const CURSOR_TO_KIRO: Record<CursorHookSection['hookType'], HookMapping> = {
  'beforeShellExecution': { target: null, quality: 'none', notes: 'Kiro has no shell hooks' },
  'afterShellExecution': { target: null, quality: 'none', notes: 'Kiro has no shell hooks' },
  'beforeMCPExecution': { target: 'preToolUse', quality: 'semantic', notes: 'Cursor MCP maps to Kiro tools' },
  'afterMCPExecution': { target: 'postToolUse', quality: 'semantic', notes: 'Cursor MCP maps to Kiro tools' },
  'beforeReadFile': { target: null, quality: 'none', notes: 'Kiro has no file read hooks' },
  'afterFileEdit': { target: null, quality: 'none', notes: 'Kiro has no file edit hooks' },
  'beforeSubmitPrompt': { target: 'userPromptSubmit', quality: 'direct', notes: 'Direct semantic match' },
  'stop': { target: 'stop', quality: 'direct', notes: 'Direct semantic match' },
  'afterAgentResponse': { target: null, quality: 'none', notes: 'Kiro has no response hooks' },
  'afterAgentThought': { target: null, quality: 'none', notes: 'Kiro has no thought hooks' },
  'beforeTabFileRead': { target: null, quality: 'none', notes: 'Tab hooks are Cursor-specific' },
  'afterTabFileEdit': { target: null, quality: 'none', notes: 'Tab hooks are Cursor-specific' }
};

/**
 * Hook mappings from Claude to Kiro
 */
export const CLAUDE_TO_KIRO: Record<HookSection['event'], HookMapping> = {
  'session-start': { target: 'agentSpawn', quality: 'semantic', notes: 'Session start maps to agent spawn' },
  'user-prompt-submit': { target: 'userPromptSubmit', quality: 'direct', notes: 'Direct semantic match' },
  'tool-call': { target: 'preToolUse', quality: 'semantic', notes: 'Tool call maps to pre-tool use' },
  'assistant-response': { target: null, quality: 'none', notes: 'Kiro has no response hooks' }
};

/**
 * Hook mappings from Kiro to Claude
 */
export const KIRO_TO_CLAUDE: Record<string, HookMapping> = {
  'agentSpawn': { target: 'session-start', quality: 'semantic', notes: 'Agent spawn maps to session start' },
  'userPromptSubmit': { target: 'user-prompt-submit', quality: 'direct', notes: 'Direct semantic match' },
  'preToolUse': { target: 'tool-call', quality: 'semantic', notes: 'Pre-tool use maps to tool call' },
  'postToolUse': { target: null, quality: 'none', notes: 'Claude has no post-tool hook' },
  'stop': { target: null, quality: 'none', notes: 'Claude has no stop hook' }
};

/**
 * Calculate quality penalty based on mapping quality
 */
export function getQualityPenalty(quality: MappingQuality): number {
  switch (quality) {
    case 'direct':
      return 0;
    case 'semantic':
      return 5;
    case 'none':
      return 30;
  }
}

/**
 * Get hook mapping for a specific source → target format conversion
 */
export function getHookMapping(
  sourceFormat: 'claude' | 'cursor' | 'kiro',
  targetFormat: 'claude' | 'cursor' | 'kiro',
  sourceHookType: string
): HookMapping | null {
  const key = `${sourceFormat.toUpperCase()}_TO_${targetFormat.toUpperCase()}`;

  switch (key) {
    case 'CLAUDE_TO_CURSOR':
      return CLAUDE_TO_CURSOR[sourceHookType as HookSection['event']] || null;
    case 'CURSOR_TO_CLAUDE':
      return CURSOR_TO_CLAUDE[sourceHookType as CursorHookSection['hookType']] || null;
    case 'KIRO_TO_CURSOR':
      return KIRO_TO_CURSOR[sourceHookType] || null;
    case 'CURSOR_TO_KIRO':
      return CURSOR_TO_KIRO[sourceHookType as CursorHookSection['hookType']] || null;
    case 'CLAUDE_TO_KIRO':
      return CLAUDE_TO_KIRO[sourceHookType as HookSection['event']] || null;
    case 'KIRO_TO_CLAUDE':
      return KIRO_TO_CLAUDE[sourceHookType] || null;
    default:
      return null;
  }
}

/**
 * Map a hook according to strategy
 */
export function mapHook(
  sourceFormat: 'claude' | 'cursor' | 'kiro',
  targetFormat: 'claude' | 'cursor' | 'kiro',
  sourceHookType: string,
  strategy: HookMappingStrategy
): HookMappingResult {
  // Same-format conversion is a no-op (direct match)
  if (sourceFormat === targetFormat) {
    return {
      mapped: true,
      targetHookType: sourceHookType,
      quality: 'direct',
      qualityPenalty: 0
    };
  }

  // Skip strategy: don't convert hooks
  if (strategy === 'skip') {
    return {
      mapped: false,
      targetHookType: null,
      quality: 'none',
      warning: 'Hook conversion skipped (--hook-mapping skip)',
      qualityPenalty: 0
    };
  }

  const mapping = getHookMapping(sourceFormat, targetFormat, sourceHookType);

  if (!mapping) {
    return {
      mapped: false,
      targetHookType: null,
      quality: 'none',
      warning: `No mapping defined for ${sourceFormat} hook "${sourceHookType}" to ${targetFormat}`,
      qualityPenalty: 30
    };
  }

  // Strict strategy: only allow direct matches
  if (strategy === 'strict' && mapping.quality !== 'direct') {
    return {
      mapped: false,
      targetHookType: null,
      quality: mapping.quality,
      warning: `Hook "${sourceHookType}" not converted (strict mode requires direct match, found ${mapping.quality} match)`,
      qualityPenalty: 30
    };
  }

  // No target available
  if (!mapping.target) {
    return {
      mapped: false,
      targetHookType: null,
      quality: mapping.quality,
      warning: `${sourceFormat} hook "${sourceHookType}" has no ${targetFormat} equivalent. ${mapping.notes}`,
      qualityPenalty: getQualityPenalty(mapping.quality)
    };
  }

  // Successful mapping
  return {
    mapped: true,
    targetHookType: mapping.target,
    quality: mapping.quality,
    warning: mapping.quality === 'semantic'
      ? `${sourceFormat} hook "${sourceHookType}" mapped to ${targetFormat} hook "${mapping.target}" (semantic match). ${mapping.notes}`
      : undefined,
    qualityPenalty: getQualityPenalty(mapping.quality)
  };
}

/**
 * Batch map multiple hooks
 */
export function mapHooks(
  sourceFormat: 'claude' | 'cursor' | 'kiro',
  targetFormat: 'claude' | 'cursor' | 'kiro',
  sourceHookTypes: string[],
  strategy: HookMappingStrategy = 'auto'
): {
  results: Map<string, HookMappingResult>;
  totalQualityPenalty: number;
  warnings: string[];
} {
  const results = new Map<string, HookMappingResult>();
  let totalQualityPenalty = 0;
  const warnings: string[] = [];

  for (const hookType of sourceHookTypes) {
    const result = mapHook(sourceFormat, targetFormat, hookType, strategy);
    results.set(hookType, result);
    totalQualityPenalty += result.qualityPenalty;

    if (result.warning) {
      warnings.push(result.warning);
    }
  }

  return { results, totalQualityPenalty, warnings };
}
