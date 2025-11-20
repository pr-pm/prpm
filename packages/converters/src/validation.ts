import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

// Get the directory where this file is located
// When compiled with ts-jest to CommonJS, __dirname will be available
// When run as ES module (Vitest), use import.meta.url
// @ts-ignore - __dirname exists in CommonJS, import.meta exists in ES modules
const currentDirname: string = typeof __dirname !== 'undefined'
  ? __dirname
  : dirname(fileURLToPath(import.meta.url));

// Initialize Ajv with strict mode disabled for better compatibility
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false,
});

// Add format validators (email, uri, etc.)
addFormats(ajv);

export type FormatType =
  | 'cursor'
  | 'claude'
  | 'continue'
  | 'windsurf'
  | 'copilot'
  | 'kiro'
  | 'agents-md'
  | 'gemini'
  | 'ruler'
  | 'canonical';

export type SubtypeType =
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

export interface ValidationError {
  path: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Cache compiled schemas (format or format+subtype)
const schemaCache = new Map<string, ReturnType<typeof ajv.compile>>();

/**
 * Load and compile a JSON schema for a specific format and optional subtype
 */
function loadSchema(format: FormatType, subtype?: SubtypeType): ReturnType<typeof ajv.compile> {
  const cacheKey = subtype ? `${format}:${subtype}` : format;

  // Check cache first
  if (schemaCache.has(cacheKey)) {
    return schemaCache.get(cacheKey)!;
  }

  // Determine schema filename based on format and subtype
  let schemaFilename: string | undefined;

  // Subtype-specific schemas take precedence
  if (subtype) {
    const subtypeSchemaMap: Record<string, string> = {
      'claude:agent': 'claude-agent.schema.json',
      'claude:skill': 'claude-skill.schema.json',
      'claude:slash-command': 'claude-slash-command.schema.json',
      'claude:hook': 'claude-hook.schema.json',
      'cursor:slash-command': 'cursor-command.schema.json',
      'kiro:hook': 'kiro-hooks.schema.json',
      'kiro:agent': 'kiro-agent.schema.json',
    };

    schemaFilename = subtypeSchemaMap[cacheKey];
  }

  // Fall back to format-level schema if no subtype schema exists
  if (!schemaFilename) {
    const schemaMap: Record<FormatType, string> = {
      'cursor': 'cursor.schema.json',
      'claude': 'claude.schema.json',
      'continue': 'continue.schema.json',
      'windsurf': 'windsurf.schema.json',
      'copilot': 'copilot.schema.json',
      'kiro': 'kiro-steering.schema.json',
      'agents-md': 'agents-md.schema.json',
      'gemini': 'gemini.schema.json',
      'ruler': 'ruler.schema.json',
      'canonical': 'canonical.schema.json',
    };
    schemaFilename = schemaMap[format] || `${format}.schema.json`;
  }

  // Load schema from file
  const schemaDirectories = [
    join(currentDirname, '..', 'schemas'),
    join(currentDirname, 'schemas'),
  ];

  let schemaContent: string | null = null;
  let schemaPath: string | null = null;

  for (const dir of schemaDirectories) {
    const candidate = join(dir, schemaFilename);
    try {
      schemaContent = readFileSync(candidate, 'utf-8');
      schemaPath = candidate;
      break;
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
      continue;
    }
  }

  if (!schemaContent || !schemaPath) {
    throw new Error(`Schema file "${schemaFilename}" not found. Looked in: ${schemaDirectories.join(', ')}`);
  }
  const schema = JSON.parse(schemaContent);

  // Compile and cache
  const compiled = ajv.compile(schema);
  schemaCache.set(cacheKey, compiled);

  return compiled;
}

/**
 * Validate data against a format's JSON schema (with optional subtype for more specific validation)
 */
export function validateFormat(
  format: FormatType,
  data: unknown,
  subtype?: SubtypeType
): ValidationResult {
  try {
    const validate = loadSchema(format, subtype);
    const valid = validate(data);

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!valid && validate.errors) {
      for (const error of validate.errors) {
        const path = error.instancePath || '/' + (error.params as { missingProperty?: string }).missingProperty || '/';
        const message = error.message || 'Validation error';

        // Categorize as error or warning based on severity
        const validationError: ValidationError = {
          path,
          message: `${path}: ${message}`,
          value: error.data,
        };

        // Some errors are warnings (e.g., deprecated fields)
        if (error.keyword === 'deprecated') {
          warnings.push(validationError);
        } else {
          errors.push(validationError);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          path: '/',
          message: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      warnings: [],
    };
  }
}

/**
 * Validate converted package structure before outputting
 * This validates the internal structure (frontmatter + content)
 */
export function validateConversion(
  format: FormatType,
  frontmatter: Record<string, unknown>,
  content: string,
  subtype?: SubtypeType
): ValidationResult {
  // Construct validation data based on format
  const data = {
    frontmatter,
    content,
  };

  return validateFormat(format, data, subtype);
}

/**
 * Parse markdown with YAML frontmatter
 */
function parseMarkdownWithFrontmatter(markdown: string): {
  frontmatter: Record<string, unknown>;
  content: string;
} {
  const lines = markdown.split('\n');

  // Check if starts with frontmatter delimiter
  if (lines[0] !== '---') {
    return {
      frontmatter: {},
      content: markdown,
    };
  }

  // Find closing delimiter
  const closingIndex = lines.slice(1).indexOf('---');
  if (closingIndex === -1) {
    return {
      frontmatter: {},
      content: markdown,
    };
  }

  // Extract and parse frontmatter
  const frontmatterText = lines.slice(1, closingIndex + 1).join('\n');
  let frontmatter: Record<string, unknown> = {};

  try {
    const parsed = yaml.load(frontmatterText);
    if (typeof parsed === 'object' && parsed !== null) {
      frontmatter = parsed as Record<string, unknown>;
    }
  } catch {
    // Invalid YAML, return empty frontmatter
  }

  // Extract content (everything after closing delimiter)
  const content = lines.slice(closingIndex + 2).join('\n');

  return { frontmatter, content };
}

/**
 * Validate markdown content (with frontmatter) against a format's schema
 * This is a convenience function for converters
 */
export function validateMarkdown(
  format: FormatType,
  markdown: string,
  subtype?: SubtypeType
): ValidationResult {
  const { frontmatter, content } = parseMarkdownWithFrontmatter(markdown);

  // Windsurf, agents-md, and ruler don't have frontmatter, so validate differently
  if (format === 'windsurf' || format === 'agents-md' || format === 'ruler') {
    return validateFormat(format, { content: markdown }, subtype);
  }

  return validateConversion(format, frontmatter, content, subtype);
}

/**
 * Format validation errors for display to users
 */
export function formatValidationErrors(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.errors.length > 0) {
    lines.push('Validation Errors:');
    for (const error of result.errors) {
      lines.push(`  - ${error.message}`);
    }
  }

  if (result.warnings.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('Warnings:');
    for (const warning of result.warnings) {
      lines.push(`  - ${warning.message}`);
    }
  }

  return lines.join('\n');
}
