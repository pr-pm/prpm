/**
 * Package validation and quality checking
 */

import { promises as fs } from 'fs';
import {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  PackageType,
} from '../types';

/**
 * Validate a package file
 */
export async function validatePackage(
  filePath: string,
  type: PackageType
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  try {
    // Read the file
    const content = await fs.readFile(filePath, 'utf-8');

    // Basic file checks
    if (content.trim().length === 0) {
      errors.push({
        message: 'File is empty',
        severity: 'error',
        rule: 'non-empty',
      });
    }

    // File size check (warn if > 50KB)
    const sizeKB = Buffer.byteLength(content, 'utf-8') / 1024;
    if (sizeKB > 50) {
      warnings.push({
        message: `File size (${sizeKB.toFixed(1)}KB) is large. Consider splitting into multiple files.`,
        severity: 'warning',
        rule: 'file-size',
      });
    }

    // Markdown-specific validation
    if (isMarkdownType(type)) {
      validateMarkdown(content, errors, warnings, suggestions);
    }

    // Tool-specific validation
    validateToolSpecific(content, type, errors, warnings, suggestions);

    // Calculate score
    const score = calculateScore(content, errors, warnings);

    return {
      valid: errors.length === 0,
      score,
      errors,
      warnings,
      suggestions,
    };
  } catch (err) {
    errors.push({
      message: `Failed to read file: ${err}`,
      severity: 'error',
      rule: 'file-access',
    });

    return {
      valid: false,
      score: 0,
      errors,
      warnings,
      suggestions,
    };
  }
}

/**
 * Check if a package type uses Markdown format
 */
function isMarkdownType(type: PackageType): boolean {
  return [
    'cursor',
    'claude',
    'windsurf',
    'aider',
    'copilot',
    'copilot-instructions',
    'copilot-path',
  ].includes(type);
}

/**
 * Validate Markdown content
 */
function validateMarkdown(
  content: string,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  suggestions: string[]
): void {
  // Check for proper headings
  if (!content.match(/^#+ /m)) {
    warnings.push({
      message: 'No headings found. Consider adding structure with # headings',
      severity: 'warning',
      rule: 'markdown-headings',
    });
  }

  // Check for code blocks
  const codeBlockCount = (content.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    errors.push({
      message: 'Unclosed code block detected',
      severity: 'error',
      rule: 'markdown-code-blocks',
    });
  }

  // Check for very long lines (readability)
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.length > 200 && !line.startsWith('```')) {
      warnings.push({
        line: index + 1,
        message: 'Line is very long. Consider breaking it up for readability.',
        severity: 'warning',
        rule: 'line-length',
      });
    }
  });

  // Suggest sections if content is long
  if (lines.length > 50 && !content.includes('##')) {
    suggestions.push(
      'Consider organizing content into sections with ## subheadings'
    );
  }
}

/**
 * Validate tool-specific requirements
 */
function validateToolSpecific(
  content: string,
  type: PackageType,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  suggestions: string[]
): void {
  switch (type) {
    case 'cursor':
      validateCursorRules(content, errors, warnings, suggestions);
      break;
    case 'claude':
      validateClaudeAgent(content, errors, warnings, suggestions);
      break;
    case 'continue':
      validateContinuePrompt(content, errors, warnings, suggestions);
      break;
    case 'aider':
      validateAiderConventions(content, errors, warnings, suggestions);
      break;
    case 'copilot':
    case 'copilot-instructions':
    case 'copilot-path':
      validateCopilotInstructions(content, errors, warnings, suggestions);
      break;
  }
}

/**
 * Validate Cursor rules
 */
function validateCursorRules(
  content: string,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  suggestions: string[]
): void {
  // Cursor rules should be clear instructions
  if (!content.toLowerCase().includes('rule') && content.length > 100) {
    suggestions.push(
      'Consider explicitly labeling your rules or guidelines'
    );
  }

  // Check for actionable language
  const hasActionableWords =
    /\b(always|never|should|must|avoid|use|don't|do)\b/i.test(content);
  if (!hasActionableWords) {
    warnings.push({
      message: 'Rules should contain actionable directives (always, never, should, must, etc.)',
      severity: 'warning',
      rule: 'actionable-language',
    });
  }
}

/**
 * Validate Claude agent
 */
function validateClaudeAgent(
  content: string,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  suggestions: string[]
): void {
  // Claude agents should define behavior
  if (content.length < 50) {
    warnings.push({
      message: 'Agent definition is very short. Consider adding more detail.',
      severity: 'warning',
      rule: 'content-length',
    });
  }

  // Check for role definition
  if (!content.toLowerCase().match(/\b(you are|act as|role|persona)\b/)) {
    suggestions.push(
      'Consider defining the agent\'s role or persona explicitly'
    );
  }
}

/**
 * Validate Continue.dev prompt
 */
function validateContinuePrompt(
  content: string,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  suggestions: string[]
): void {
  // Check for Handlebars syntax if variables are used
  const hasHandlebars = /\{\{.*?\}\}/.test(content);
  if (hasHandlebars) {
    // Validate balanced braces
    const openCount = (content.match(/\{\{/g) || []).length;
    const closeCount = (content.match(/\}\}/g) || []).length;
    if (openCount !== closeCount) {
      errors.push({
        message: 'Unbalanced Handlebars syntax ({{ }})',
        severity: 'error',
        rule: 'handlebars-syntax',
      });
    }
  }
}

/**
 * Validate Aider conventions
 */
function validateAiderConventions(
  content: string,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  suggestions: string[]
): void {
  // Aider conventions should be specific coding guidelines
  const hasCodeExamples = /```/.test(content);
  if (!hasCodeExamples && content.length > 200) {
    suggestions.push(
      'Consider adding code examples to illustrate conventions'
    );
  }

  // Check for convention categories
  const hasCategories =
    /\b(naming|formatting|structure|testing|documentation)\b/i.test(content);
  if (!hasCategories) {
    suggestions.push(
      'Consider organizing conventions by category (naming, formatting, testing, etc.)'
    );
  }
}

/**
 * Validate GitHub Copilot instructions
 */
function validateCopilotInstructions(
  content: string,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  suggestions: string[]
): void {
  // Copilot instructions should be clear and specific
  if (content.length < 30) {
    warnings.push({
      message: 'Instructions are very brief. More detail may improve results.',
      severity: 'warning',
      rule: 'content-length',
    });
  }

  // Check for context about the project
  const hasContext = /\b(project|codebase|framework|stack|technology)\b/i.test(
    content
  );
  if (!hasContext) {
    suggestions.push(
      'Consider adding context about your project, framework, or tech stack'
    );
  }
}

/**
 * Calculate quality score (0-100)
 */
function calculateScore(
  content: string,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): number {
  let score = 100;

  // Deduct points for errors (10 points each)
  score -= errors.length * 10;

  // Deduct points for warnings (3 points each)
  score -= warnings.length * 3;

  // Bonus points for good practices
  const lines = content.split('\n');

  // Has headings
  if (content.match(/^#+ /m)) {
    score += 5;
  }

  // Has code examples
  if (content.includes('```')) {
    score += 5;
  }

  // Good length (not too short, not too long)
  if (lines.length >= 10 && lines.length <= 200) {
    score += 5;
  }

  // Has structure (multiple sections)
  const headingCount = (content.match(/^#+ /gm) || []).length;
  if (headingCount >= 2) {
    score += 5;
  }

  // Ensure score is in valid range
  return Math.max(0, Math.min(100, score));
}

/**
 * Validate multiple packages
 */
export async function validatePackages(
  packages: Array<{ path: string; type: PackageType }>
): Promise<Array<{ path: string; result: ValidationResult }>> {
  const results = [];

  for (const pkg of packages) {
    const result = await validatePackage(pkg.path, pkg.type);
    results.push({ path: pkg.path, result });
  }

  return results;
}
