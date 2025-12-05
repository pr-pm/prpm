/**
 * Cursor Hooks Format Converter
 * Converts canonical format to Cursor hooks.json format with intelligent hook mapping
 */

import type {
  CanonicalPackage,
  ConversionOptions,
  ConversionResult,
  CursorHookSection,
  ExtractedScript,
  HookSection,
} from './types/canonical.js';
import { mapHook, type HookMappingStrategy } from './hook-mappings.js';
import { VALID_CURSOR_HOOK_TYPES, getScriptExtension } from './cursor-hooks-constants.js';

interface CursorHooksConfig {
  [hookType: string]: string; // hookType -> script path
}

export interface CursorHooksConversionOptions extends Partial<ConversionOptions> {
  hookMappingStrategy?: HookMappingStrategy;
}

/**
 * Convert canonical package to Cursor hooks.json format
 */
export function toCursorHooks(
  pkg: CanonicalPackage,
  options: CursorHooksConversionOptions = {}
): ConversionResult {
  const warnings: string[] = [];
  const extractedScripts: ExtractedScript[] = [];
  let qualityScore = 100;
  const hookMappingStrategy = options.hookMappingStrategy || 'auto';

  try {
    const hooksConfig: CursorHooksConfig = {};

    // Extract cursor-hook sections (native Cursor hooks)
    const cursorHookSections = pkg.content.sections.filter(
      (section): section is CursorHookSection => section.type === 'cursor-hook'
    );

    // Convert native Cursor hooks
    for (const section of cursorHookSections) {
      hooksConfig[section.hookType] = section.scriptPath;
    }

    // Convert Claude hooks using mapping system
    const claudeHooks = pkg.content.sections.filter(
      (section): section is HookSection => section.type === 'hook'
    );

    if (claudeHooks.length > 0 && hookMappingStrategy !== 'skip') {
      for (const claudeHook of claudeHooks) {
        const mappingResult = mapHook('claude', 'cursor', claudeHook.event, hookMappingStrategy);

        qualityScore -= mappingResult.qualityPenalty;

        if (mappingResult.warning) {
          warnings.push(mappingResult.warning);
        }

        if (mappingResult.mapped && mappingResult.targetHookType) {
          // Create script file from Claude hook code
          const scriptExt = getScriptExtension(claudeHook.language);
          const scriptPath = `./hooks/${claudeHook.event}.${scriptExt}`;
          hooksConfig[mappingResult.targetHookType] = scriptPath;

          // Extract the script content for the caller to write
          extractedScripts.push({
            path: scriptPath,
            content: claudeHook.code,
            language: claudeHook.language,
            executable: true,
          });

          warnings.push(
            `Mapped Claude hook "${claudeHook.event}" to Cursor hook "${mappingResult.targetHookType}". ` +
            `Script extracted to ${scriptPath}`
          );
        }
      }
    } else if (claudeHooks.length > 0 && hookMappingStrategy === 'skip') {
      warnings.push(`${claudeHooks.length} Claude hook(s) skipped (--hook-mapping skip)`);
    }

    // Convert Kiro hooks from metadata using mapping system
    if (pkg.metadata?.kiroAgent?.hooks && hookMappingStrategy !== 'skip') {
      const kiroHooks = pkg.metadata.kiroAgent.hooks;

      for (const [kiroHookType, scriptPaths] of Object.entries(kiroHooks)) {
        if (!scriptPaths || !Array.isArray(scriptPaths) || scriptPaths.length === 0) continue;

        const mappingResult = mapHook('kiro', 'cursor', kiroHookType, hookMappingStrategy);

        qualityScore -= mappingResult.qualityPenalty;

        if (mappingResult.warning) {
          warnings.push(mappingResult.warning);
        }

        if (mappingResult.mapped && mappingResult.targetHookType) {
          // Use first script path from Kiro hooks array
          hooksConfig[mappingResult.targetHookType] = scriptPaths[0];
        }
      }
    } else if (pkg.metadata?.kiroAgent?.hooks && hookMappingStrategy === 'skip') {
      const kiroHookTypes = Object.keys(pkg.metadata.kiroAgent.hooks);
      warnings.push(`${kiroHookTypes.length} Kiro hook(s) skipped (--hook-mapping skip)`);
    }

    // Check if we have any hooks
    if (Object.keys(hooksConfig).length === 0) {
      warnings.push('No hooks converted to Cursor hooks format');
      qualityScore -= 50;
    }

    // Check for unsupported sections
    const unsupportedSections = pkg.content.sections.filter(
      section => section.type !== 'cursor-hook' && section.type !== 'metadata' && section.type !== 'hook'
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
      format: 'cursor',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion: warnings.length > 0,
      qualityScore: Math.max(0, qualityScore),
      extractedScripts: extractedScripts.length > 0 ? extractedScripts : undefined,
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '{}',
      format: 'cursor',
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

    // Check if at least one key is a valid hook type
    const keys = Object.keys(parsed);
    return keys.length > 0 && keys.some(key => VALID_CURSOR_HOOK_TYPES.includes(key as any));
  } catch {
    return false;
  }
}
