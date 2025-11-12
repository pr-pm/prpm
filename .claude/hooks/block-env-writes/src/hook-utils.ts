export { HookExitCode } from './types';
/**
 * Shared utilities for PRPM Claude Code hooks
 */

import { readFileSync } from 'fs';
import { execSync, spawn } from 'child_process';
import type { HookInput, ExecOptions, HookExitCode, PatternMatch } from './types';

/**
 * Read and parse JSON input from stdin
 * @returns Parsed HookInput or empty object if parsing fails
 */
export function readStdin(): HookInput {
  try {
    const input = readFileSync(0, 'utf-8');
    return JSON.parse(input) as HookInput;
  } catch {
    return {};
  }
}

/**
 * Extract and validate file path from hook input
 * @param input - Hook input object
 * @returns File path if valid, undefined otherwise
 */
export function getFilePath(input: HookInput): string | undefined {
  const filePath = input.input?.file_path;
  if (!filePath || typeof filePath !== 'string' || filePath.trim() === '') {
    return undefined;
  }
  return filePath;
}

/**
 * Extract command from hook input
 * @param input - Hook input object
 * @returns Command string if present, undefined otherwise
 */
export function getCommand(input: HookInput): string | undefined {
  const command = input.input?.command;
  if (!command || typeof command !== 'string' || command.trim() === '') {
    return undefined;
  }
  return command;
}

/**
 * Extract content from hook input (for Write/Edit tools)
 * @param input - Hook input object
 * @returns Content string if present, undefined otherwise
 */
export function getContent(input: HookInput): string | undefined {
  // Try content field first (Write tool)
  let content = input.input?.content;

  // Try new_string field (Edit tool)
  if (!content) {
    content = input.input?.new_string;
  }

  if (!content || typeof content !== 'string') {
    return undefined;
  }

  return content;
}

/**
 * Check if file path has any of the given extensions
 * @param filePath - File path to check
 * @param extensions - Array of extensions (e.g., ['.ts', '.tsx'])
 * @returns true if file has one of the extensions
 */
export function hasExtension(filePath: string, extensions: string[]): boolean {
  return extensions.some(ext => filePath.endsWith(ext));
}

/**
 * Check if a command/tool is available in PATH
 * @param command - Command name to check
 * @returns true if command exists
 */
export function commandExists(command: string): boolean {
  try {
    execSync(`command -v ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Execute a command with options
 * @param command - Command to execute
 * @param args - Command arguments
 * @param options - Execution options
 */
export function execCommand(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): void {
  // Check if command exists
  if (!commandExists(command)) {
    if (options.skipOnMissing) {
      return; // Silently skip
    }
    throw new Error(`Command not found: ${command}`);
  }

  const fullCommand = [command, ...args].join(' ');

  if (options.background) {
    // Run in background, don't wait
    spawn(command, args, {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, ...options.env },
    }).unref();
    return;
  }

  // Run synchronously
  try {
    execSync(fullCommand, {
      stdio: 'inherit',
      timeout: options.timeout,
      env: { ...process.env, ...options.env },
    });
  } catch (error) {
    if (!options.skipOnMissing) {
      throw error;
    }
  }
}

/**
 * Check if file path matches any blocked patterns
 * @param filePath - File path to check
 * @param patterns - Array of glob patterns to block
 * @returns Pattern match result
 */
export function matchesPattern(filePath: string, patterns: string[]): PatternMatch {
  for (const pattern of patterns) {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$|/${regexPattern}$`);

    if (regex.test(filePath)) {
      return {
        matched: true,
        pattern,
      };
    }
  }

  return { matched: false };
}

/**
 * Log error message to stderr
 * @param message - Error message
 */
export function logError(message: string): void {
  console.error(message);
}

/**
 * Log warning message to stderr
 * @param message - Warning message
 */
export function logWarning(message: string): void {
  console.error(message);
}

/**
 * Exit hook with specified code
 * @param code - Exit code (0 = success, 1 = error, 2 = block)
 */
export function exitHook(code: HookExitCode): never {
  process.exit(code);
}

/**
 * Get environment variable value
 * @param name - Environment variable name
 * @param defaultValue - Default value if not set
 * @returns Environment variable value or default
 */
export function getEnv(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}

/**
 * Append line to log file
 * @param logFile - Path to log file
 * @param line - Line to append
 */
export function appendToLog(logFile: string, line: string): void {
  try {
    const fs = require('fs');
    const path = require('path');

    // Ensure directory exists
    const dir = path.dirname(logFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Append line
    fs.appendFileSync(logFile, line + '\n', 'utf-8');
  } catch (error) {
    // Silently fail - don't block on logging errors
  }
}

/**
 * Get timestamp string for logging
 * @returns ISO timestamp string
 */
export function getTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}
