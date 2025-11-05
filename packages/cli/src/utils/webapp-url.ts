/**
 * Utility to convert registry URL to webapp URL
 * Handles localhost, production, and custom registry URLs
 */

/**
 * Convert a registry URL to its corresponding webapp URL
 *
 * @param registryUrl - The registry URL (e.g., https://registry.prpm.dev)
 * @returns The webapp URL (e.g., https://prpm.dev)
 *
 * @example
 * // Production
 * getWebappUrl('https://registry.prpm.dev') // => 'https://prpm.dev'
 *
 * // Local development
 * getWebappUrl('http://localhost:3111') // => 'http://localhost:5173'
 *
 * // Custom registry
 * getWebappUrl('https://registry.custom.com') // => 'https://custom.com'
 */
export function getWebappUrl(registryUrl: string): string {
  const cleanUrl = registryUrl.replace(/\/$/, '').replace(/\/api\/?$/, '');

  if (cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1')) {
    // Local development: registry on port 3111, webapp on port 5173
    return cleanUrl.replace(':3111', ':5173');
  }

  if (cleanUrl.includes('registry.prpm.dev')) {
    // Production: always use prpm.dev webapp
    return 'https://prpm.dev';
  }

  // Custom registry: assume webapp is on same host without 'registry.' subdomain
  try {
    const url = new URL(cleanUrl);
    const hostname = url.hostname.replace(/^registry\./, '');
    return `${url.protocol}//${hostname}`;
  } catch {
    // If URL parsing fails, return as-is
    return cleanUrl;
  }
}
