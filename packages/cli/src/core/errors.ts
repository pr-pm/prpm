/**
 * Custom error class for CLI commands
 * Allows commands to throw errors with exit codes instead of calling process.exit()
 */
export class CLIError extends Error {
  public readonly exitCode: number;

  constructor(message: string, exitCode: number = 1) {
    super(message);
    this.name = 'CLIError';
    this.exitCode = exitCode;
  }
}

/**
 * Creates a CLIError with exit code 1 (general error)
 */
export function createError(message: string): CLIError {
  return new CLIError(message, 1);
}

/**
 * Creates a CLIError with exit code 0 (success, used for early termination)
 */
export function createSuccess(message?: string): CLIError {
  return new CLIError(message || '', 0);
}
