/**
 * Type-safe error handling utilities
 */

/**
 * Converts an unknown error to an Error instance
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message));
  }
  return new Error(String(error));
}

/**
 * Type guard to check if error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Safely get error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return String(error);
}

/**
 * Check if error has a status code property
 */
export interface ErrorWithStatus extends Error {
  statusCode?: number;
  meta?: {
    statusCode?: number;
  };
}

export function hasStatusCode(error: unknown): error is ErrorWithStatus {
  return error instanceof Error && ('statusCode' in error || ('meta' in error && typeof error.meta === 'object' && error.meta !== null && 'statusCode' in error.meta));
}

export function getStatusCode(error: unknown): number | undefined {
  if (hasStatusCode(error)) {
    return error.statusCode ?? error.meta?.statusCode;
  }
  return undefined;
}
