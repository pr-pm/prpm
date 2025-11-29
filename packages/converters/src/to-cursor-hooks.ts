/**
 * Cursor Hooks Format Converter
 * Converts canonical format to Cursor hooks.json format
 */

import type {
  CanonicalPackage,
  ConversionOptions,
  ConversionResult,
  CursorHookSection,
} from './types/canonical.js';

interface CursorHooksConfig {
  [hookType: string]: string; // hookType -> script path
}

/**
 * Convert canonical package to Cursor hooks.json format
 */
export function toCursorHooks(
  pkg: CanonicalPackage,
  options: Partial<ConversionOptions> = {}
): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    const hooksConfig: CursorHooksConfig = {};

    // Extract cursor-hook sections
    const cursorHookSections = pkg.content.sections.filter(
      (section): section is CursorHookSection => section.type === 'cursor-hook'
    );

    if (cursorHookSections.length === 0) {
      warnings.push('No cursor-hook sections found in package');
      qualityScore -= 50;
    }

    // Convert each hook section to hooks.json entry
    for (const section of cursorHookSections) {
      hooksConfig[section.hookType] = section.scriptPath;
    }

    // Check for unsupported sections
    const unsupportedSections = pkg.content.sections.filter(
      section => section.type !== 'cursor-hook' && section.type !== 'metadata'
    );

    if (unsupportedSections.length > 0) {
      warnings.push(
        `${unsupportedSections.length} non-hook sections skipped (not supported in hooks.json format)`
      );
      qualityScore -= 10;
    }

    const content = JSON.stringify(hooksConfig, null, 2);

    return {
      content,
      format: 'cursor-hooks',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion: warnings.length > 0,
      qualityScore: Math.max(0, qualityScore),
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '{}',
      format: 'cursor-hooks',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}

/**
 * Detect if content is in Cursor hooks.json format
 */
export function isCursorHooksFormat(content: string): boolean {
  try {
    const parsed = JSON.parse(content);

    // Check if it's an object with hook types as keys
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return false;
    }

    const validHookTypes = [
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
      'afterTabFileEdit'
    ];

    // Check if at least one key is a valid hook type
    const keys = Object.keys(parsed);
    return keys.length > 0 && keys.some(key => validHookTypes.includes(key));
  } catch {
    return false;
  }
}
