/**
 * Core types for the Prompt Package Manager
 */

export type PackageType =
  | 'cursor'
  | 'claude'
  | 'windsurf'
  | 'continue'
  | 'aider'
  | 'copilot'
  | 'copilot-instructions'  // .github/copilot-instructions.md
  | 'copilot-path';          // .github/instructions/*.instructions.md

export interface Package {
  id: string;
  type: PackageType;
  url: string;
  dest: string;
  // Multi-tool support: track which tools this package is installed for
  tools?: PackageType[];
  // Quality and validation
  version?: string;
  provider?: string;
  verified?: boolean;
  score?: number;
  metadata?: PackageMetadata;
}

export interface PackageMetadata {
  description?: string;
  author?: string;
  tags?: string[];
  created?: string;
  updated?: string;
  // Quality metrics
  lintScore?: number;
  testsPassed?: boolean;
  // Multi-tool compatibility
  compatibleWith?: PackageType[];
}

export interface Config {
  sources: Package[];
  // Registry support
  registries?: Registry[];
  defaultRegistry?: string;
  apiKey?: string;
  // Legacy fields
  registry?: string;
  settings?: Record<string, any>;
}

export interface Registry {
  name: string;
  url: string;
  priority: number;
  enabled: boolean;
  auth?: {
    type: 'token' | 'basic';
    token?: string;
    username?: string;
    password?: string;
  };
}

export interface AddOptions {
  url: string;
  type: PackageType;
  /**
   * Install to multiple tools at once
   * Example: ['cursor', 'claude', 'windsurf']
   */
  tools?: PackageType[];
  /**
   * Custom filename for the package (optional)
   */
  filename?: string;
}

export interface RemoveOptions {
  id: string;
}

export interface ListOptions {
  // Future expansion: filtering, sorting
  type?: PackageType;
}

export interface IndexOptions {
  // Future expansion: specific directories, dry-run mode
  force?: boolean;
}

/**
 * Options for creating a new package
 */
export interface CreateOptions {
  name: string;
  type: PackageType;
  template?: string;
  description?: string;
  author?: string;
}

/**
 * Options for testing a package
 */
export interface TestOptions {
  packagePath: string;
  testFiles?: string[];
  verbose?: boolean;
}

/**
 * Options for linting/validating a package
 */
export interface LintOptions {
  packagePath: string;
  fix?: boolean;
  strict?: boolean;
}

/**
 * Options for converting between tool formats
 */
export interface ConvertOptions {
  sourcePath: string;
  sourceType: PackageType;
  targetType: PackageType;
  outputPath?: string;
}

/**
 * Validation result for a package
 */
export interface ValidationResult {
  valid: boolean;
  score: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  line?: number;
  column?: number;
  message: string;
  severity: 'error';
  rule?: string;
}

export interface ValidationWarning {
  line?: number;
  column?: number;
  message: string;
  severity: 'warning';
  rule?: string;
}

/**
 * Test result for a package
 */
export interface TestResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  testCases: TestCase[];
}

export interface TestCase {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}
