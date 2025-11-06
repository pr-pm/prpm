/**
 * Security Utilities
 *
 * Centralized security functions for PRPM registry
 */

import crypto from 'crypto';

/**
 * SECURITY: Hash IP address using HMAC for anonymous tracking
 * More secure than plain SHA-256 as it uses a secret key
 *
 * @param ipAddress - IP address to hash
 * @param secret - Secret key for HMAC (defaults to JWT_SECRET)
 * @returns HMAC-SHA256 hash of IP address
 */
export function hashIP(ipAddress: string, secret?: string): string {
  const hashSecret = secret || process.env.IP_HASH_SECRET || process.env.JWT_SECRET || '';

  if (!hashSecret) {
    throw new Error('IP_HASH_SECRET or JWT_SECRET must be set for secure IP hashing');
  }

  return crypto
    .createHmac('sha256', hashSecret)
    .update(ipAddress)
    .digest('hex');
}

/**
 * SECURITY: Sanitize error messages for production
 * Prevents leaking internal paths, schemas, or sensitive data
 *
 * @param error - Original error
 * @param context - Optional context for logging
 * @returns Safe error message for end users
 */
export function sanitizeError(error: any, context?: string): string {
  // In development, return full error
  if (process.env.NODE_ENV === 'development') {
    return error.message || String(error);
  }

  // In production, return generic messages
  const errorMessage = String(error.message || error);

  // Check for known error patterns and provide user-friendly messages
  if (errorMessage.includes('ENOENT') || errorMessage.includes('not found')) {
    return 'Resource not found';
  }

  if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
    return 'Access denied';
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    return 'Request timed out. Please try again';
  }

  if (errorMessage.includes('database') || errorMessage.includes('SQL')) {
    return 'Database error occurred';
  }

  if (errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) {
    return 'Network error. Please try again';
  }

  // Generic fallback
  return 'An error occurred. Please try again or contact support';
}

/**
 * SECURITY: Generate cryptographically secure random token
 * Used for session IDs, share tokens, etc.
 *
 * @param length - Length of token in bytes (default: 32)
 * @returns Hex-encoded random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * SECURITY: Create HMAC signature for session validation
 * Prevents session ID tampering
 *
 * @param sessionId - Session ID to sign
 * @param secret - Secret key (defaults to JWT_SECRET)
 * @returns HMAC signature
 */
export function signSessionId(sessionId: string, secret?: string): string {
  const signSecret = secret || process.env.JWT_SECRET || '';

  if (!signSecret) {
    throw new Error('JWT_SECRET must be set for session signing');
  }

  return crypto
    .createHmac('sha256', signSecret)
    .update(sessionId)
    .digest('hex');
}

/**
 * SECURITY: Verify session ID signature
 *
 * @param sessionId - Session ID
 * @param signature - HMAC signature to verify
 * @param secret - Secret key (defaults to JWT_SECRET)
 * @returns True if signature is valid
 */
export function verifySessionSignature(
  sessionId: string,
  signature: string,
  secret?: string
): boolean {
  try {
    const expectedSignature = signSessionId(sessionId, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}
