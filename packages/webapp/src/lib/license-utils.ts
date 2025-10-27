/**
 * License utility functions
 */

/**
 * Get the license URL, either from stored license_url or by constructing from repository URL
 *
 * Note: This constructs a URL assuming 'main' branch. If the actual branch is 'master' or another name,
 * the link may 404. The stored license_url (from CLI extraction) is more reliable as it's verified.
 */
export function getLicenseUrl(
  license_url: string | null | undefined,
  repository_url: string | null | undefined
): string | null {
  // Use license_url if available (most reliable)
  if (license_url) {
    return license_url
  }

  // Try to construct from repository_url
  if (!repository_url) {
    return null
  }

  // Extract owner/repo from GitHub URL
  const githubMatch = repository_url.match(/github\.com[/:]([\w-]+)\/([\w-]+)/)
  if (!githubMatch) {
    return null
  }

  const [, owner, repo] = githubMatch
  // Default to 'main' branch (most common in modern repos)
  // Note: This may 404 if repo uses 'master' or another default branch
  return `https://raw.githubusercontent.com/${owner}/${repo}/main/LICENSE`
}
