/**
 * Security Configuration for Playground Tools
 *
 * SECURITY: Allow-lists for WebFetch domains and tool configurations
 */

/**
 * Allowed domains for WebFetch tool
 * SECURITY: Prevents data exfiltration to arbitrary domains
 *
 * To request a new domain, create an issue at:
 * https://github.com/pr-pm/prpm/issues/new?template=domain-allowlist.md
 */
export const ALLOWED_WEBFETCH_DOMAINS = [
  // Documentation sites
  'docs.anthropic.com',
  'developer.mozilla.org',
  'docs.python.org',
  'nodejs.org',
  'reactjs.org',
  'vuejs.org',
  'angular.io',
  'go.dev',
  'rust-lang.org',

  // Code repositories
  'github.com',
  'raw.githubusercontent.com',
  'gist.github.com',
  'gitlab.com',
  'bitbucket.org',

  // Package registries
  'npmjs.com',
  'registry.npmjs.org',
  'pypi.org',
  'rubygems.org',
  'crates.io',
  'packagist.org',

  // Developer resources
  'stackoverflow.com',
  'stackexchange.com',
  'dev.to',
  'medium.com',
  'hashnode.com',

  // API documentation
  'api.github.com',
  'api.slack.com',
  'api.stripe.com',
  'developers.google.com',
  'aws.amazon.com',

  // Technical reference
  'wikipedia.org',
  'en.wikipedia.org',
  'arxiv.org',
  'ietf.org',
  'w3.org',

  // News and blogs (technical)
  'techcrunch.com',
  'theverge.com',
  'arstechnica.com',
  'hacker news.ycombinator.com',
];

/**
 * Check if a URL is allowed for WebFetch
 * SECURITY: Validates against allow-list
 *
 * @param url - URL to validate
 * @returns true if domain is allowed
 */
export function isAllowedWebFetchDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check exact match or subdomain match
    return ALLOWED_WEBFETCH_DOMAINS.some((allowedDomain) => {
      const normalizedAllowed = allowedDomain.toLowerCase();

      // Exact match
      if (hostname === normalizedAllowed) {
        return true;
      }

      // Subdomain match (e.g., api.github.com matches github.com)
      if (hostname.endsWith(`.${normalizedAllowed}`)) {
        return true;
      }

      return false;
    });
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Task tool configuration
 * SECURITY: Limits recursion depth to prevent cost amplification attacks
 */
export const TASK_TOOL_CONFIG = {
  // Maximum recursion depth (main → sub-agent → sub-sub-agent)
  MAX_RECURSION_DEPTH: 2,

  // Maximum concurrent tasks per user
  MAX_CONCURRENT_TASKS: 5,

  // Maximum total tasks spawned in a single session
  MAX_TASKS_PER_SESSION: 10,
};

/**
 * Tool permissions by package subtype
 * SECURITY: Restricts tool access based on package type
 */
export const TOOL_PERMISSIONS = {
  // Regular prompts/rules - no tools
  prompt: [],
  rule: [],

  // Skills - can use WebFetch and WebSearch
  skill: ['WebFetch', 'WebSearch', 'Skill'],
  'slash-command': ['WebFetch', 'WebSearch', 'Skill'],

  // Agents - can use WebFetch, WebSearch, and limited Task
  agent: ['WebFetch', 'WebSearch', 'Task'],

  // Other types
  workflow: ['WebFetch', 'WebSearch'],
  tool: ['WebFetch'],
  template: [],
  collection: [],
  chatmode: ['WebFetch', 'WebSearch'],
};

/**
 * Get allowed tools for a package subtype
 * SECURITY: Returns restricted tool list based on package type
 *
 * @param subtype - Package subtype
 * @returns Array of allowed tool names
 */
export function getAllowedTools(subtype: string): string[] {
  return TOOL_PERMISSIONS[subtype as keyof typeof TOOL_PERMISSIONS] || [];
}
