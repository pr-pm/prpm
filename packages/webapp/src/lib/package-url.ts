/**
 * Utility for generating package URLs
 */

/**
 * Generate the URL for a package page
 * Handles both scoped packages (@org/name) and regular packages (name)
 */
export function getPackageUrl(packageName: string): string {
  // Encode the package name for URL safety
  const encodedName = encodeURIComponent(packageName)
  return `/packages/${encodedName}`
}
