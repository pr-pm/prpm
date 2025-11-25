/**
 * Session Fingerprinting Utility
 *
 * Generates a unique fingerprint for each browser session based on:
 * - User-Agent
 * - IP Address (with privacy considerations)
 * - Accept headers
 * - Accept-Language
 *
 * This helps prevent API abuse via copied curl requests while maintaining
 * privacy and not being overly restrictive.
 */

import { createHash } from 'crypto';
import { FastifyRequest } from 'fastify';

export interface SessionFingerprint {
  hash: string;
  components: {
    userAgent: string;
    ipSubnet: string;
    acceptLanguage: string;
    acceptEncoding: string;
  };
}

/**
 * Get IP address from request, respecting proxies
 */
function getClientIp(request: FastifyRequest): string {
  // Check X-Forwarded-For header (set by proxies/load balancers)
  const forwardedFor = request.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }

  // Check X-Real-IP header
  const realIp = request.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to socket IP
  return request.ip || 'unknown';
}

/**
 * Get IP subnet for privacy (removes last octet for IPv4, last 4 groups for IPv6)
 * This prevents tracking exact IPs while still providing anti-abuse protection
 */
function getIpSubnet(ip: string): string {
  if (!ip || ip === 'unknown') {
    return 'unknown';
  }

  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }

  // IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 4) {
      return `${parts.slice(0, 4).join(':')}::`;
    }
  }

  return ip;
}

/**
 * Normalize User-Agent to prevent minor variation bypasses
 * Extracts major browser version and OS
 */
function normalizeUserAgent(ua: string): string {
  if (!ua) {
    return 'unknown';
  }

  // Extract browser name and major version
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  const firefoxMatch = ua.match(/Firefox\/(\d+)/);
  const safariMatch = ua.match(/Version\/(\d+).*Safari/);
  const edgeMatch = ua.match(/Edg\/(\d+)/);

  let browser = 'unknown';
  if (edgeMatch) {
    browser = `Edge/${edgeMatch[1]}`;
  } else if (chromeMatch) {
    browser = `Chrome/${chromeMatch[1]}`;
  } else if (firefoxMatch) {
    browser = `Firefox/${firefoxMatch[1]}`;
  } else if (safariMatch) {
    browser = `Safari/${safariMatch[1]}`;
  }

  // Extract OS
  let os = 'unknown';
  if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Mac OS X')) {
    os = 'MacOS';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
  }

  return `${browser}|${os}`;
}

/**
 * Generate session fingerprint from request
 */
export function generateSessionFingerprint(request: FastifyRequest): SessionFingerprint {
  const userAgent = request.headers['user-agent'] || 'unknown';
  const ip = getClientIp(request);
  const ipSubnet = getIpSubnet(ip);
  const acceptLanguage = request.headers['accept-language'] || 'unknown';
  const acceptEncoding = request.headers['accept-encoding'] || 'unknown';

  const components = {
    userAgent: normalizeUserAgent(userAgent),
    ipSubnet,
    acceptLanguage: acceptLanguage.split(',')[0].trim(), // Take primary language only
    acceptEncoding: acceptEncoding.split(',').sort().join(','), // Normalize encoding order
  };

  // Create hash of components
  const fingerprintString = JSON.stringify(components);
  const hash = createHash('sha256')
    .update(fingerprintString)
    .digest('hex')
    .substring(0, 32); // 128-bit hash

  return {
    hash,
    components,
  };
}

/**
 * Validate that a fingerprint matches the current request
 */
export function validateFingerprint(
  request: FastifyRequest,
  storedFingerprint: string
): boolean {
  const currentFingerprint = generateSessionFingerprint(request);
  return currentFingerprint.hash === storedFingerprint;
}

/**
 * Generate a session token that binds to the fingerprint
 * Format: {userId}:{timestamp}:{fingerprint}:{random}
 */
export function generateSessionToken(
  userId: string,
  fingerprint: string
): string {
  const timestamp = Date.now();
  const random = createHash('sha256')
    .update(`${userId}${timestamp}${Math.random()}`)
    .digest('hex')
    .substring(0, 16);

  const token = `${userId}:${timestamp}:${fingerprint}:${random}`;

  // Base64 encode for URL safety
  return Buffer.from(token).toString('base64url');
}

/**
 * Parse and validate a session token
 */
export function parseSessionToken(token: string): {
  userId: string;
  timestamp: number;
  fingerprint: string;
  random: string;
} | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const [userId, timestampStr, fingerprint, random] = decoded.split(':');

    if (!userId || !timestampStr || !fingerprint || !random) {
      return null;
    }

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) {
      return null;
    }

    return { userId, timestamp, fingerprint, random };
  } catch {
    return null;
  }
}

/**
 * Check if a session token is expired
 * Default expiration: 30 minutes
 */
export function isSessionTokenExpired(
  token: string,
  maxAgeMs: number = 30 * 60 * 1000
): boolean {
  const parsed = parseSessionToken(token);
  if (!parsed) {
    return true;
  }

  const age = Date.now() - parsed.timestamp;
  return age > maxAgeMs;
}
