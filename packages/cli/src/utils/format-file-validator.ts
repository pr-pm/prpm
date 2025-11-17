/**
 * Format file validator - validates package files against format schemas
 */

import { readFile } from 'fs/promises';
import type { PackageManifest, PackageFileMetadata } from '../types/registry';

// Import validation functions from converters package
// These will be available once we export them from @pr-pm/converters
type FormatType =
  | 'cursor'
  | 'claude'
  | 'continue'
  | 'windsurf'
  | 'copilot'
  | 'kiro'
  | 'agents-md'
  | 'canonical';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface FileValidationResult {
  errors: string[];
  warnings: string[];
}

/**
 * Normalize files array to string paths
 */
function normalizeFilePaths(files: string[] | PackageFileMetadata[]): string[] {
  return files.map(file => {
    if (typeof file === 'string') {
      return file;
    } else {
      return file.path;
    }
  });
}

/**
 * Determine which format schema to use based on format and subtype
 */
function getFormatType(format: string, subtype?: string): FormatType | null {
  // Map format + subtype to FormatType
  if (format === 'claude') {
    // Claude has subtypes: agent, skill, slash-command, hook
    // For now, use base 'claude' schema
    // TODO: Use specific schemas when available (claude-skill, claude-agent, etc.)
    return 'claude';
  }

  // Direct mapping for other formats
  const formatMap: Record<string, FormatType> = {
    'cursor': 'cursor',
    'continue': 'continue',
    'windsurf': 'windsurf',
    'copilot': 'copilot',
    'kiro': 'kiro',
    'agents-md': 'agents-md',
    'canonical': 'canonical',
  };

  return formatMap[format] || null;
}

/**
 * Validate a markdown file with frontmatter
 */
async function validateMarkdownFile(
  filePath: string,
  formatType: FormatType
): Promise<ValidationResult> {
  try {
    // Dynamic import of validation function
    const { validateMarkdown } = await import('@pr-pm/converters');

    const content = await readFile(filePath, 'utf-8');
    const result = validateMarkdown(formatType, content);

    return {
      valid: result.valid,
      errors: result.errors.map(e => `${filePath}: ${e.message}`),
      warnings: result.warnings.map(w => `${filePath}: ${w.message}`),
    };
  } catch (error) {
    // Include stack trace for better debugging
    const errorMsg = error instanceof Error
      ? `${error.message}\nStack: ${error.stack}`
      : String(error);
    return {
      valid: false,
      errors: [`${filePath}: Failed to validate - ${errorMsg}`],
      warnings: [],
    };
  }
}

/**
 * Validate package files against their format schema
 */
export async function validatePackageFiles(
  manifest: PackageManifest
): Promise<FileValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get format type for validation
  const formatType = getFormatType(manifest.format, manifest.subtype);

  if (!formatType) {
    // Unknown format - just warn
    warnings.push(`Format '${manifest.format}' is not recognized for validation`);
    return { errors, warnings };
  }

  // Skip validation for certain formats that don't have strict file requirements
  if (formatType === 'canonical') {
    // Canonical format is our internal format, skip validation
    return { errors, warnings };
  }

  // Get file paths
  const filePaths = normalizeFilePaths(manifest.files);

  // Helper to check if file should be validated for this format
  const shouldValidateFile = (filePath: string): boolean => {
    // Always skip these files
    const skipFiles = ['prpm.json', 'README.md', 'LICENSE', '.gitignore', '.npmignore'];
    if (skipFiles.includes(filePath)) {
      return false;
    }

    // Check if file matches format-specific patterns
    if (formatType === 'cursor') {
      return filePath.includes('.cursorrules');
    } else if (formatType === 'claude') {
      return filePath.endsWith('SKILL.md') || filePath.endsWith('.clinerules');
    } else if (formatType === 'continue') {
      return filePath.includes('.continue/');
    } else if (formatType === 'windsurf') {
      return filePath.includes('.windsurfrules');
    } else if (formatType === 'agents-md') {
      return filePath === 'agents.md';
    } else if (formatType === 'kiro') {
      return filePath.endsWith('.md') || filePath.endsWith('.json');
    }

    // For other formats or if extension matches, validate
    return filePath.endsWith('.md') || filePath.endsWith('.json') || filePath.endsWith('.yaml');
  };

  // Validate each file
  for (const filePath of filePaths) {
    // Skip files that don't match format patterns
    if (!shouldValidateFile(filePath)) {
      continue;
    }

    try {
      // Validate based on format
      if (formatType === 'windsurf') {
        // Windsurf uses plain markdown (no frontmatter)
        const result = await validateMarkdownFile(filePath, formatType);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      } else if (formatType === 'agents-md') {
        // agents.md uses plain markdown (no frontmatter)
        const result = await validateMarkdownFile(filePath, formatType);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      } else if (formatType === 'kiro') {
        // Kiro can be steering files (.md) or hooks (.json)
        if (filePath.endsWith('.json')) {
          // TODO: Validate Kiro hooks when we have the schema integrated
          warnings.push(`${filePath}: Kiro hooks validation not yet implemented`);
        } else {
          // Steering file - validate as markdown with frontmatter
          const result = await validateMarkdownFile(filePath, formatType);
          errors.push(...result.errors);
          warnings.push(...result.warnings);
        }
      } else {
        // All other formats use markdown with frontmatter
        const result = await validateMarkdownFile(filePath, formatType);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      }
    } catch (error) {
      // File doesn't exist or can't be read
      errors.push(`${filePath}: Cannot read file - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Format-specific additional validation
  if (manifest.format === 'claude' && manifest.subtype === 'skill') {
    // Ensure SKILL.md exists (already checked in manifest validation, but double-check)
    const hasSkillMd = filePaths.some(path => path.endsWith('/SKILL.md') || path === 'SKILL.md');
    if (!hasSkillMd) {
      errors.push('Claude skills must contain a SKILL.md file');
    }
  }

  if (manifest.format === 'windsurf') {
    // Windsurf uses .windsurf/rules
    const hasWindsurfRules = filePaths.some(path => path.includes('.windsurf/rules'));
    if (!hasWindsurfRules) {
      warnings.push('Windsurf packages typically use .windsurf/rules filename');
    }
  }

  return { errors, warnings };
}
