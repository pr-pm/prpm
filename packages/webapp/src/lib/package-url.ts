/**
 * Convert a package name to its URL path
 * @param packageName - Full package name (e.g., "@prpm/karen-review" or "unscoped-package")
 * @returns URL path (e.g., "/packages/prpm/karen-review" or "/packages/prpm/unscoped-package")
 */
export function getPackageUrl(packageName: string): string {
  if (packageName.startsWith('@')) {
    // Scoped package: @author/package -> /packages/author/package
    const withoutAt = packageName.substring(1) // Remove @
    return `/packages/${withoutAt}`
  } else {
    // Unscoped package: assume prpm as default author
    return `/packages/prpm/${packageName}`
  }
}
