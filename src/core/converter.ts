/**
 * Format conversion utilities for cross-tool compatibility
 */

import { promises as fs } from 'fs';
import { PackageType } from '../types';

export interface ConversionResult {
  success: boolean;
  content: string;
  warnings: string[];
}

/**
 * Convert a package from one format to another
 */
export async function convertPackage(
  sourcePath: string,
  sourceType: PackageType,
  targetType: PackageType
): Promise<ConversionResult> {
  const warnings: string[] = [];

  try {
    // Read source file
    const content = await fs.readFile(sourcePath, 'utf-8');

    // If same type, no conversion needed
    if (sourceType === targetType) {
      return {
        success: true,
        content,
        warnings: ['No conversion needed - same type'],
      };
    }

    // Convert based on source and target types
    const converted = await performConversion(
      content,
      sourceType,
      targetType,
      warnings
    );

    return {
      success: true,
      content: converted,
      warnings,
    };
  } catch (error) {
    throw new Error(`Conversion failed: ${error}`);
  }
}

/**
 * Perform the actual conversion
 */
async function performConversion(
  content: string,
  sourceType: PackageType,
  targetType: PackageType,
  warnings: string[]
): Promise<string> {
  // Handle Continue.dev special syntax
  if (sourceType === 'continue') {
    return convertFromContinue(content, targetType, warnings);
  }

  if (targetType === 'continue') {
    return convertToContinue(content, sourceType, warnings);
  }

  // Handle Copilot YAML frontmatter
  if (sourceType === 'copilot-path') {
    return convertFromCopilotPath(content, targetType, warnings);
  }

  if (targetType === 'copilot-path') {
    return convertToCopilotPath(content, sourceType, warnings);
  }

  // For most conversions, the content can be used as-is with some adaptation
  return adaptContent(content, sourceType, targetType, warnings);
}

/**
 * Convert from Continue.dev format
 */
function convertFromContinue(
  content: string,
  targetType: PackageType,
  warnings: string[]
): string {
  // Continue uses Handlebars syntax - convert to plain text for most tools
  let converted = content;

  // Remove Handlebars syntax
  const hasHandlebars = /\{\{.*?\}\}/.test(content);
  if (hasHandlebars) {
    warnings.push(
      'Removed Handlebars syntax - you may need to adjust placeholders'
    );
    converted = content.replace(/\{\{#if .*?\}\}/g, '');
    converted = converted.replace(/\{\{\/if\}\}/g, '');
    converted = converted.replace(/\{\{(.*?)\}\}/g, '[$1]');
  }

  return converted;
}

/**
 * Convert to Continue.dev format
 */
function convertToContinue(
  content: string,
  sourceType: PackageType,
  warnings: string[]
): string {
  warnings.push(
    'Converted to Continue format - consider adding Handlebars templating for dynamic content'
  );
  return content;
}

/**
 * Convert from Copilot path-specific format (with YAML frontmatter)
 */
function convertFromCopilotPath(
  content: string,
  targetType: PackageType,
  warnings: string[]
): string {
  // Remove YAML frontmatter
  const yamlRegex = /^---\n.*?\n---\n/s;
  const match = content.match(yamlRegex);

  if (match) {
    warnings.push('Removed YAML frontmatter - path-specific rules converted to general rules');
    return content.replace(yamlRegex, '');
  }

  return content;
}

/**
 * Convert to Copilot path-specific format
 */
function convertToCopilotPath(
  content: string,
  sourceType: PackageType,
  warnings: string[]
): string {
  // Add YAML frontmatter template
  const frontmatter = `---
paths:
  - "**/*"
---

`;

  warnings.push(
    'Added YAML frontmatter - update the paths field to specify which files these instructions apply to'
  );

  return frontmatter + content;
}

/**
 * Adapt content for general conversions
 */
function adaptContent(
  content: string,
  sourceType: PackageType,
  targetType: PackageType,
  warnings: string[]
): string {
  let adapted = content;

  // Add tool-specific context if needed
  if (targetType === 'claude' && !content.toLowerCase().includes('you are')) {
    warnings.push(
      'Claude agents work best with explicit role definitions (e.g., "You are...")'
    );
  }

  if (targetType === 'aider' && !content.toLowerCase().includes('convention')) {
    warnings.push(
      'Aider works best with explicit coding conventions and examples'
    );
  }

  if (targetType === 'cursor' && !content.toLowerCase().includes('rule')) {
    warnings.push(
      'Cursor works best with clear, actionable rules'
    );
  }

  // Handle special Aider case - it often needs to be at root
  if (targetType === 'aider') {
    warnings.push(
      'Aider typically uses CONVENTIONS.md at the repository root'
    );
  }

  return adapted;
}

/**
 * Suggest conversions for a package type
 */
export function getCompatibleTypes(type: PackageType): PackageType[] {
  // Most Markdown-based prompts are compatible with each other
  const markdownTypes: PackageType[] = [
    'cursor',
    'claude',
    'windsurf',
    'aider',
    'copilot',
    'copilot-instructions',
  ];

  if (markdownTypes.includes(type)) {
    return markdownTypes.filter((t) => t !== type);
  }

  // Continue has special syntax but can convert to/from others
  if (type === 'continue') {
    return markdownTypes;
  }

  // Copilot-path has special syntax but can convert
  if (type === 'copilot-path') {
    return markdownTypes;
  }

  return [];
}

/**
 * Check if conversion is recommended
 */
export function isConversionRecommended(
  sourceType: PackageType,
  targetType: PackageType
): { recommended: boolean; reason?: string } {
  // Same type - no conversion needed
  if (sourceType === targetType) {
    return { recommended: false, reason: 'Same type' };
  }

  // Perfect compatibility (Markdown-based, similar semantics)
  const perfectPairs = [
    ['cursor', 'windsurf'],
    ['cursor', 'copilot'],
    ['claude', 'windsurf'],
  ];

  for (const [a, b] of perfectPairs) {
    if (
      (sourceType === a && targetType === b) ||
      (sourceType === b && targetType === a)
    ) {
      return { recommended: true, reason: 'High compatibility' };
    }
  }

  // Good compatibility with minor adjustments
  if (sourceType === 'continue' || targetType === 'continue') {
    return {
      recommended: true,
      reason: 'Compatible with syntax adjustments',
    };
  }

  if (sourceType === 'copilot-path' || targetType === 'copilot-path') {
    return {
      recommended: true,
      reason: 'Compatible with frontmatter adjustments',
    };
  }

  // Aider has specific requirements
  if (sourceType === 'aider' || targetType === 'aider') {
    return {
      recommended: true,
      reason: 'Compatible but Aider has specific conventions',
    };
  }

  // Default - most Markdown types are somewhat compatible
  return { recommended: true, reason: 'Basic compatibility' };
}
