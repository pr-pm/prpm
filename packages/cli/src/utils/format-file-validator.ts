/**
 * Format file validator - validates package files against format schemas
 */

import { readFile } from 'fs/promises';
import type { PackageManifest, PackageFileMetadata } from '../types/registry';
import { validateMarkdown, validateFormat } from '@pr-pm/converters';

// Import validation functions from converters package
// These will be available once we export them from @pr-pm/converters
type FormatType =
  | 'cursor'
  | 'claude'
  | 'continue'
  | 'windsurf'
  | 'copilot'
  | 'kiro'
  | 'agents.md'
  | 'canonical';

type SubtypeType =
  | 'rule'
  | 'agent'
  | 'skill'
  | 'slash-command'
  | 'prompt'
  | 'workflow'
  | 'tool'
  | 'template'
  | 'collection'
  | 'chatmode'
  | 'hook';

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
function getFormatType(format: string): FormatType | null {
  // Direct mapping for formats
  const formatMap: Record<string, FormatType> = {
    'cursor': 'cursor',
    'claude': 'claude',
    'continue': 'continue',
    'windsurf': 'windsurf',
    'copilot': 'copilot',
    'kiro': 'kiro',
    'agents.md': 'agents.md',
    'canonical': 'canonical',
  };

  return formatMap[format] || null;
}

/**
 * Validate a markdown file with frontmatter
 */
async function validateMarkdownFile(
  filePath: string,
  formatType: FormatType,
  subtype?: string
): Promise<ValidationResult> {
  try {
    const content = await readFile(filePath, 'utf-8');
    // Cast subtype to compatible type for converters
    const result = validateMarkdown(formatType, content, subtype as any);

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
 * Validate a structured file (JSON)
 */
async function validateStructuredFile(
  filePath: string,
  formatType: FormatType,
  subtype?: string
): Promise<ValidationResult> {
  try {
    const content = await readFile(filePath, 'utf-8');
    let data: any;
    try {
      data = JSON.parse(content);
    } catch (e) {
      return {
        valid: false,
        errors: [`${filePath}: Invalid JSON content`],
        warnings: [],
      };
    }

    // Validate against format schema
    const result = validateFormat(formatType, data, subtype as any);

    return {
      valid: result.valid,
      errors: result.errors.map(e => `${filePath}: ${e.message}`),
      warnings: result.warnings.map(w => `${filePath}: ${w.message}`),
    };
  } catch (error) {
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
  const formatType = getFormatType(manifest.format);

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

    // Skip files in examples/, tests/, __tests__/, docs/ directories
    const skipDirs = ['examples/', 'example/', 'tests/', '__tests__/', 'docs/', 'doc/'];
    if (skipDirs.some(dir => filePath.includes(dir))) {
      return false;
    }

    // Check if file matches format-specific patterns
    // Note: Files will be auto-relocated to canonical locations during publish,
    // so we accept files from any location (not just the standard directories)
    if (formatType === 'cursor') {
      // Cursor accepts .mdc and .md files (will be converted to .mdc during publish)
      return filePath.includes('.cursorrules') || filePath.endsWith('.mdc') || filePath.endsWith('.md');
    } else if (formatType === 'claude') {
      // For Claude skills: ONLY validate SKILL.md
      if (manifest.subtype === 'skill') {
        return filePath.endsWith('SKILL.md');
      }

      // For Claude hooks: DON'T validate any markdown files
      // Hooks are TypeScript/JavaScript code, not markdown with frontmatter
      if (manifest.subtype === 'hook') {
        return false;
      }

      // For other Claude subtypes (agents, commands):
      // Skip JSON files (they're examples or data files)
      if (filePath.endsWith('.json')) {
        return false;
      }

      // Validate .md files from any location
      return filePath.endsWith('.md');
    } else if (formatType === 'continue') {
      // Continue accepts .md files (will be relocated during publish)
      return filePath.endsWith('.md') || filePath.endsWith('.json');
    } else if (formatType === 'windsurf') {
      // Windsurf accepts .md files from any location
      return filePath.endsWith('.md');
    } else if (formatType === 'copilot') {
      // Copilot accepts .md files (will be renamed to .instructions.md during publish)
      return filePath.endsWith('.md');
    } else if (formatType === 'agents.md') {
      return filePath === 'agents.md';
    } else if (formatType === 'kiro') {
      // Kiro: validate .md (steering files) and .json (hooks/agents)
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
      } else if (formatType === 'agents.md') {
        // agents.md uses plain markdown (no frontmatter)
        const result = await validateMarkdownFile(filePath, formatType);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      } else if (formatType === 'kiro') {
        // Kiro can be steering files (.md), hooks (.json), or agents (.json)
        if (filePath.endsWith('.json')) {
          // Validate Kiro JSON files using manifest's subtype (hook, agent, etc.)
          const result = await validateStructuredFile(filePath, formatType, manifest.subtype);
          errors.push(...result.errors);
          warnings.push(...result.warnings);
        } else {
          // Steering file - validate as markdown with frontmatter
          const result = await validateMarkdownFile(filePath, formatType);
          errors.push(...result.errors);
          warnings.push(...result.warnings);
        }
      } else {
        // All other formats use markdown with frontmatter
        // Pass subtype (e.g. 'agent', 'skill', 'hook') for more specific validation
        const result = await validateMarkdownFile(filePath, formatType, manifest.subtype);
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
    // Check for skill file - SKILL.md is canonical, single .md file auto-renamed, multiple require SKILL.md
    const hasSkillMd = filePaths.some(path => path.endsWith('/SKILL.md') || path === 'SKILL.md');
    const mdFiles = filePaths.filter(path => path.endsWith('.md') && !path.toLowerCase().includes('readme'));

    if (!hasSkillMd && mdFiles.length === 0) {
      errors.push('Claude skills must contain a markdown file (.md)');
    } else if (!hasSkillMd && mdFiles.length === 1) {
      warnings.push('Skill file will be auto-renamed to SKILL.md during publish');
    } else if (!hasSkillMd && mdFiles.length > 1) {
      errors.push(`Claude skills with multiple .md files must use SKILL.md for the main skill file (found ${mdFiles.length} .md files)`);
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
