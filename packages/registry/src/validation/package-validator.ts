/**
 * Package Validation Utilities
 * Validates packages before publishing to ensure quality and consistency
 */

import { isValidCategory, suggestCategory } from '../constants/categories.js';
import { toError } from '../types/errors.js';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface PackageMetadata {
  name: string;
  displayName?: string;
  description?: string;
  version: string;
  type: 'cursor' | 'claude' | 'continue' | 'windsurf' | 'generic';
  category?: string;
  tags?: string[];
  keywords?: string[];
  license?: string;
  author?: string;
  repository?: string;
  homepage?: string;
}

export interface PackageFile {
  filename: string;
  content: string;
  size: number;
  type: string;
}

/**
 * Validation configuration
 */
export const VALIDATION_CONFIG = {
  // Size limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_DISPLAY_NAME_LENGTH: 255,
  MIN_DESCRIPTION_LENGTH: 10,

  // Content validation
  REQUIRED_FIELDS: ['name', 'description', 'version', 'type'],
  ALLOWED_FILE_EXTENSIONS: ['.md', '.json', '.yaml', '.yml', '.txt'],

  // Quality thresholds
  MIN_QUALITY_SCORE: 0,
  RECOMMENDED_QUALITY_SCORE: 3.0,
};

/**
 * Validate package metadata
 */
export function validateMetadata(metadata: PackageMetadata): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required fields
  for (const field of VALIDATION_CONFIG.REQUIRED_FIELDS) {
    if (!metadata[field as keyof PackageMetadata]) {
      errors.push({
        field,
        message: `${field} is required`,
        code: 'REQUIRED_FIELD_MISSING',
      });
    }
  }

  // Package name format
  if (metadata.name) {
    if (!/^[@a-z0-9-_/]+$/.test(metadata.name)) {
      errors.push({
        field: 'name',
        message: 'Package name must contain only lowercase letters, numbers, hyphens, underscores, and slashes',
        code: 'INVALID_PACKAGE_NAME',
      });
    }

    if (metadata.name.length > 214) {
      errors.push({
        field: 'name',
        message: 'Package name must be 214 characters or less',
        code: 'NAME_TOO_LONG',
      });
    }
  }

  // Display name
  if (metadata.displayName && metadata.displayName.length > VALIDATION_CONFIG.MAX_DISPLAY_NAME_LENGTH) {
    errors.push({
      field: 'displayName',
      message: `Display name must be ${VALIDATION_CONFIG.MAX_DISPLAY_NAME_LENGTH} characters or less`,
      code: 'DISPLAY_NAME_TOO_LONG',
    });
  }

  // Description
  if (metadata.description) {
    if (metadata.description.length < VALIDATION_CONFIG.MIN_DESCRIPTION_LENGTH) {
      warnings.push({
        field: 'description',
        message: 'Description should be at least 10 characters for better discoverability',
      });
    }

    if (metadata.description.length > VALIDATION_CONFIG.MAX_DESCRIPTION_LENGTH) {
      errors.push({
        field: 'description',
        message: `Description must be ${VALIDATION_CONFIG.MAX_DESCRIPTION_LENGTH} characters or less`,
        code: 'DESCRIPTION_TOO_LONG',
      });
    }
  }

  // Version format (semver)
  if (metadata.version) {
    if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/.test(metadata.version)) {
      errors.push({
        field: 'version',
        message: 'Version must follow semantic versioning (e.g., 1.0.0, 1.0.0-beta.1)',
        code: 'INVALID_VERSION_FORMAT',
      });
    }
  }

  // Category validation
  if (metadata.category) {
    if (!isValidCategory(metadata.category)) {
      errors.push({
        field: 'category',
        message: `Invalid category. Must be one of the predefined categories`,
        code: 'INVALID_CATEGORY',
      });

      // Suggest a category
      const suggested = suggestCategory(
        metadata.keywords || [],
        metadata.tags || [],
        metadata.description || ''
      );
      warnings.push({
        field: 'category',
        message: 'Invalid category provided',
        suggestion: `Try '${suggested}' based on your package metadata`,
      });
    }
  } else {
    // Suggest category if not provided
    const suggested = suggestCategory(
      metadata.keywords || [],
      metadata.tags || [],
      metadata.description || ''
    );
    warnings.push({
      field: 'category',
      message: 'No category specified',
      suggestion: `Consider adding category: '${suggested}'`,
    });
  }

  // Tags validation
  if (metadata.tags) {
    if (metadata.tags.length > 20) {
      warnings.push({
        field: 'tags',
        message: 'More than 20 tags may reduce discoverability',
      });
    }

    for (const tag of metadata.tags) {
      if (tag.length > 50) {
        errors.push({
          field: 'tags',
          message: `Tag '${tag}' is too long (max 50 characters)`,
          code: 'TAG_TOO_LONG',
        });
      }
    }
  } else {
    warnings.push({
      field: 'tags',
      message: 'No tags specified',
      suggestion: 'Add tags to improve discoverability',
    });
  }

  // License validation
  if (!metadata.license) {
    warnings.push({
      field: 'license',
      message: 'No license specified',
      suggestion: 'Consider adding a license (e.g., MIT, Apache-2.0)',
    });
  }

  // Repository URL
  if (metadata.repository) {
    try {
      new URL(metadata.repository);
    } catch {
      errors.push({
        field: 'repository',
        message: 'Repository URL is not valid',
        code: 'INVALID_URL',
      });
    }
  }

  // Homepage URL
  if (metadata.homepage) {
    try {
      new URL(metadata.homepage);
    } catch {
      errors.push({
        field: 'homepage',
        message: 'Homepage URL is not valid',
        code: 'INVALID_URL',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate package file
 */
export function validateFile(file: PackageFile): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // File size
  if (file.size > VALIDATION_CONFIG.MAX_FILE_SIZE) {
    errors.push({
      field: 'file',
      message: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${VALIDATION_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB)`,
      code: 'FILE_TOO_LARGE',
    });
  }

  // File extension
  const ext = file.filename.substring(file.filename.lastIndexOf('.'));
  if (!VALIDATION_CONFIG.ALLOWED_FILE_EXTENSIONS.includes(ext)) {
    errors.push({
      field: 'file',
      message: `File extension '${ext}' is not allowed. Allowed: ${VALIDATION_CONFIG.ALLOWED_FILE_EXTENSIONS.join(', ')}`,
      code: 'INVALID_FILE_EXTENSION',
    });
  }

  // Content validation based on type
  if (ext === '.md') {
    const validation = validateMarkdown(file.content);
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);
  } else if (ext === '.json') {
    const validation = validateJSON(file.content);
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);
  } else if (ext === '.yaml' || ext === '.yml') {
    const validation = validateYAML(file.content);
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);
  }

  // Check for potentially malicious content
  const securityCheck = validateSecurity(file.content);
  errors.push(...securityCheck.errors);
  warnings.push(...securityCheck.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Markdown content
 */
function validateMarkdown(content: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check minimum length
  if (content.trim().length < 100) {
    warnings.push({
      field: 'content',
      message: 'Content is very short (< 100 characters)',
      suggestion: 'Consider adding more documentation for better user experience',
    });
  }

  // Check for headers
  if (!/^#+\s+.+$/m.test(content)) {
    warnings.push({
      field: 'content',
      message: 'No markdown headers found',
      suggestion: 'Add headers to structure your content',
    });
  }

  // Check for broken links (basic)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [...content.matchAll(linkRegex)];
  for (const link of links) {
    const url = link[2];
    if (!url.startsWith('http') && !url.startsWith('#') && !url.startsWith('/')) {
      warnings.push({
        field: 'content',
        message: `Potentially broken relative link: ${url}`,
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate JSON content
 */
function validateJSON(content: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  try {
    JSON.parse(content);
  } catch (error: unknown) {
    const err = toError(error);
    errors.push({
      field: 'content',
      message: `Invalid JSON: ${err.message}`,
      code: 'INVALID_JSON',
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate YAML content
 */
function validateYAML(content: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Basic YAML validation (proper validation would require yaml parser)
  // Check for common YAML issues
  if (/^\s*-\s*-\s*-/.test(content)) {
    warnings.push({
      field: 'content',
      message: 'YAML document separator found',
      suggestion: 'Ensure YAML syntax is correct',
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Security validation
 */
function validateSecurity(content: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check for potential security issues
  const securityPatterns = [
    { pattern: /<script[^>]*>/i, message: 'Script tags detected' },
    { pattern: /javascript:/i, message: 'JavaScript protocol detected' },
    { pattern: /on\w+\s*=/i, message: 'Event handlers detected' },
    { pattern: /<iframe[^>]*>/i, message: 'Iframe tags detected' },
  ];

  for (const { pattern, message } of securityPatterns) {
    if (pattern.test(content)) {
      warnings.push({
        field: 'content',
        message,
        suggestion: 'Remove potentially unsafe content',
      });
    }
  }

  // Check for secrets (basic patterns)
  const secretPatterns = [
    { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][a-zA-Z0-9_-]{20,}['"]/i, message: 'Potential API key found' },
    { pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{8,}['"]/i, message: 'Potential password found' },
    { pattern: /(?:token|auth)\s*[:=]\s*['"][a-zA-Z0-9_-]{20,}['"]/i, message: 'Potential auth token found' },
  ];

  for (const { pattern, message } of secretPatterns) {
    if (pattern.test(content)) {
      errors.push({
        field: 'content',
        message,
        code: 'POTENTIAL_SECRET_EXPOSED',
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Calculate package quality score
 */
export function calculateQualityScore(metadata: PackageMetadata, file: PackageFile): number {
  let score = 0;

  // Base score for valid package
  score += 1.0;

  // Metadata completeness (up to 2.0 points)
  if (metadata.description && metadata.description.length >= 50) score += 0.5;
  if (metadata.tags && metadata.tags.length > 0) score += 0.3;
  if (metadata.keywords && metadata.keywords.length > 0) score += 0.2;
  if (metadata.license) score += 0.3;
  if (metadata.repository) score += 0.3;
  if (metadata.homepage) score += 0.2;
  if (metadata.category && isValidCategory(metadata.category)) score += 0.2;

  // Content quality (up to 2.0 points)
  const wordCount = file.content.trim().split(/\s+/).length;
  if (wordCount > 100) score += 0.5;
  if (wordCount > 500) score += 0.5;
  if (wordCount > 1000) score += 0.5;

  // Has proper structure
  if (/^#+\s+.+$/m.test(file.content)) score += 0.3; // Has headers
  if (/```/.test(file.content)) score += 0.2; // Has code blocks

  // Cap at 5.0
  return Math.min(5.0, Math.round(score * 100) / 100);
}

/**
 * Validate complete package
 */
export function validatePackage(
  metadata: PackageMetadata,
  file: PackageFile
): ValidationResult {
  const metadataValidation = validateMetadata(metadata);
  const fileValidation = validateFile(file);

  const errors = [...metadataValidation.errors, ...fileValidation.errors];
  const warnings = [...metadataValidation.warnings, ...fileValidation.warnings];

  // Calculate quality score
  const qualityScore = calculateQualityScore(metadata, file);
  if (qualityScore < VALIDATION_CONFIG.RECOMMENDED_QUALITY_SCORE) {
    warnings.push({
      field: 'quality',
      message: `Package quality score is ${qualityScore}/5.0`,
      suggestion: 'Consider adding more documentation, tags, and metadata to improve quality score',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
