/**
 * Cursor Hooks Constants
 *
 * Shared constants for Cursor hooks format to maintain a single source of truth
 * across converters, parsers, and CLI commands.
 */

/**
 * All valid Cursor hook types (exhaustive list)
 * These are the 12 official Cursor hook types.
 */
export const VALID_CURSOR_HOOK_TYPES = [
  'beforeShellExecution',
  'afterShellExecution',
  'beforeMCPExecution',
  'afterMCPExecution',
  'beforeReadFile',
  'afterFileEdit',
  'beforeSubmitPrompt',
  'stop',
  'afterAgentResponse',
  'afterAgentThought',
  'beforeTabFileRead',
  'afterTabFileEdit',
] as const;

export type CursorHookType = (typeof VALID_CURSOR_HOOK_TYPES)[number];

/**
 * Check if a string is a valid Cursor hook type
 */
export function isValidCursorHookType(hookType: string): hookType is CursorHookType {
  return VALID_CURSOR_HOOK_TYPES.includes(hookType as CursorHookType);
}

/**
 * Valid hook mapping strategies for cross-format hook conversion
 *
 * - auto: Best-effort semantic matches with warnings (default)
 * - strict: Only direct matches, skip semantic/none mappings
 * - skip: Don't convert hooks at all
 *
 * Note: 'manual' strategy (interactive prompts) is planned for future implementation
 */
export const VALID_HOOK_MAPPING_STRATEGIES = ['auto', 'strict', 'skip'] as const;

export type HookMappingStrategy = (typeof VALID_HOOK_MAPPING_STRATEGIES)[number];

/**
 * Check if a string is a valid hook mapping strategy
 */
export function isValidHookMappingStrategy(strategy: string): strategy is HookMappingStrategy {
  return VALID_HOOK_MAPPING_STRATEGIES.includes(strategy as HookMappingStrategy);
}

/**
 * Map of script language to file extension
 */
export const SCRIPT_LANGUAGE_EXTENSIONS: Record<string, string> = {
  bash: 'sh',
  python: 'py',
  javascript: 'js',
  typescript: 'js', // TypeScript compiles to JS
  binary: 'bin',
};

/**
 * Get file extension for a script language
 * @param language - The script language (bash, python, javascript, typescript, binary)
 * @returns The file extension (sh, py, js, bin) - defaults to 'sh'
 */
export function getScriptExtension(language: string): string {
  return SCRIPT_LANGUAGE_EXTENSIONS[language] || 'sh';
}
