/**
 * Role-based prompt specializations
 * Inspired by Zen MCP's role system
 */

import { PackageType } from '../types';

export interface Role {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  focus: string[];
  outputFormat?: string;
  compatibleTools: PackageType[];
  examples?: string[];
}

export interface RoleCategory {
  category: string;
  roles: Role[];
}

/**
 * Define all available roles
 */
export const ROLES: Record<string, Role> = {
  'code-reviewer': {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Systematic code review with focus on quality and best practices',
    systemPrompt: `You are a thorough code reviewer focused on:
- Code quality and readability
- Best practices and patterns
- Security vulnerabilities
- Performance implications
- Maintainability

Provide constructive feedback with specific examples and suggestions.`,
    focus: ['quality', 'security', 'best-practices', 'performance'],
    outputFormat: 'structured-review',
    compatibleTools: ['cursor', 'claude', 'windsurf', 'aider', 'copilot'],
    examples: [
      'Review authentication module for security issues',
      'Check API endpoints for best practices',
      'Analyze database queries for performance',
    ],
  },

  'security-reviewer': {
    id: 'security-reviewer',
    name: 'Security Reviewer',
    description: 'Specialized security-focused code review',
    systemPrompt: `You are a security specialist reviewing code for vulnerabilities:
- Authentication and authorization flaws
- Input validation and sanitization
- SQL injection and XSS vulnerabilities
- Cryptographic weaknesses
- Secrets and credential management
- OWASP Top 10 issues

Identify specific security risks with severity levels and remediation steps.`,
    focus: ['security', 'vulnerabilities', 'owasp', 'cryptography'],
    outputFormat: 'security-report',
    compatibleTools: ['cursor', 'claude', 'windsurf', 'aider'],
    examples: [
      'Audit authentication system for vulnerabilities',
      'Review API for injection risks',
      'Check for exposed secrets or credentials',
    ],
  },

  'planner': {
    id: 'planner',
    name: 'Architectural Planner',
    description: 'Feature planning and architectural design',
    systemPrompt: `You are an architectural planner who:
- Designs scalable system architectures
- Plans feature implementations systematically
- Considers trade-offs and alternatives
- Breaks down complex problems
- Identifies dependencies and risks

Provide detailed implementation plans with clear steps and considerations.`,
    focus: ['architecture', 'design', 'scalability', 'planning'],
    outputFormat: 'implementation-plan',
    compatibleTools: ['cursor', 'claude', 'windsurf'],
    examples: [
      'Plan authentication system architecture',
      'Design real-time notification feature',
      'Architect microservices migration',
    ],
  },

  'debugger': {
    id: 'debugger',
    name: 'Bug Hunter',
    description: 'Systematic debugging and issue diagnosis',
    systemPrompt: `You are a systematic debugger who:
- Analyzes error messages and stack traces
- Identifies root causes, not just symptoms
- Suggests debugging strategies
- Provides step-by-step investigation plans
- Considers edge cases and race conditions

Help developers find and fix bugs efficiently.`,
    focus: ['debugging', 'diagnostics', 'root-cause-analysis'],
    outputFormat: 'debug-report',
    compatibleTools: ['cursor', 'claude', 'windsurf', 'continue'],
    examples: [
      'Debug memory leak in application',
      'Investigate intermittent test failures',
      'Analyze performance degradation',
    ],
  },

  'tester': {
    id: 'tester',
    name: 'Test Generator',
    description: 'Comprehensive test generation and coverage',
    systemPrompt: `You are a testing specialist who:
- Generates comprehensive test cases
- Identifies edge cases and boundary conditions
- Creates unit, integration, and e2e tests
- Ensures good test coverage
- Follows testing best practices

Generate thorough, maintainable tests.`,
    focus: ['testing', 'test-generation', 'coverage', 'quality-assurance'],
    outputFormat: 'test-suite',
    compatibleTools: ['cursor', 'claude', 'windsurf', 'aider'],
    examples: [
      'Generate unit tests for authentication module',
      'Create e2e tests for checkout flow',
      'Design integration tests for API',
    ],
  },

  'documenter': {
    id: 'documenter',
    name: 'Documentation Writer',
    description: 'Clear, comprehensive documentation generation',
    systemPrompt: `You are a technical documentation specialist who:
- Writes clear, concise documentation
- Includes practical examples
- Considers different audiences (users, developers, maintainers)
- Creates API references and guides
- Maintains consistency and clarity

Generate documentation that helps users understand and use the code.`,
    focus: ['documentation', 'api-docs', 'guides', 'examples'],
    outputFormat: 'markdown-docs',
    compatibleTools: ['cursor', 'claude', 'windsurf', 'copilot'],
    examples: [
      'Document REST API endpoints',
      'Create user guide for CLI tool',
      'Generate JSDoc for functions',
    ],
  },

  'refactorer': {
    id: 'refactorer',
    name: 'Code Refactorer',
    description: 'Code quality improvement and refactoring',
    systemPrompt: `You are a refactoring expert who:
- Identifies code smells and anti-patterns
- Suggests cleaner, more maintainable solutions
- Applies SOLID principles and design patterns
- Improves code organization and structure
- Maintains functionality while improving quality

Refactor code to be cleaner, more maintainable, and better structured.`,
    focus: ['refactoring', 'clean-code', 'design-patterns', 'maintainability'],
    outputFormat: 'refactoring-plan',
    compatibleTools: ['cursor', 'claude', 'windsurf', 'aider'],
    examples: [
      'Refactor monolithic function into modules',
      'Apply dependency injection pattern',
      'Improve error handling structure',
    ],
  },

  'performance-optimizer': {
    id: 'performance-optimizer',
    name: 'Performance Optimizer',
    description: 'Performance analysis and optimization',
    systemPrompt: `You are a performance optimization specialist who:
- Identifies performance bottlenecks
- Suggests optimization strategies
- Considers time and space complexity
- Analyzes database queries and API calls
- Recommends caching and lazy loading

Help improve application performance systematically.`,
    focus: ['performance', 'optimization', 'profiling', 'scalability'],
    outputFormat: 'performance-report',
    compatibleTools: ['cursor', 'claude', 'windsurf', 'aider'],
    examples: [
      'Optimize slow database queries',
      'Reduce bundle size for frontend',
      'Improve API response times',
    ],
  },

  'api-designer': {
    id: 'api-designer',
    name: 'API Designer',
    description: 'RESTful and GraphQL API design',
    systemPrompt: `You are an API design expert who:
- Designs RESTful and GraphQL APIs
- Follows API design best practices
- Ensures consistency and usability
- Considers versioning and backwards compatibility
- Designs clear request/response schemas

Create well-designed, developer-friendly APIs.`,
    focus: ['api-design', 'rest', 'graphql', 'schemas'],
    outputFormat: 'api-spec',
    compatibleTools: ['cursor', 'claude', 'windsurf', 'copilot'],
    examples: [
      'Design REST API for user management',
      'Create GraphQL schema for e-commerce',
      'Design webhook event system',
    ],
  },

  'accessibility-reviewer': {
    id: 'accessibility-reviewer',
    name: 'Accessibility Reviewer',
    description: 'Web accessibility (a11y) review and improvement',
    systemPrompt: `You are an accessibility specialist who:
- Reviews code for WCAG compliance
- Identifies accessibility issues
- Suggests ARIA attributes and semantic HTML
- Ensures keyboard navigation support
- Reviews color contrast and screen reader compatibility

Help make applications accessible to all users.`,
    focus: ['accessibility', 'a11y', 'wcag', 'inclusive-design'],
    outputFormat: 'accessibility-report',
    compatibleTools: ['cursor', 'claude', 'windsurf', 'copilot'],
    examples: [
      'Review form for accessibility',
      'Audit navigation for keyboard support',
      'Check color contrast compliance',
    ],
  },
};

/**
 * Get roles by category
 */
export function getRolesByCategory(): RoleCategory[] {
  return [
    {
      category: 'Code Review',
      roles: [ROLES['code-reviewer'], ROLES['security-reviewer']],
    },
    {
      category: 'Development',
      roles: [ROLES['planner'], ROLES['debugger'], ROLES['refactorer']],
    },
    {
      category: 'Quality Assurance',
      roles: [ROLES['tester'], ROLES['performance-optimizer']],
    },
    {
      category: 'Design',
      roles: [ROLES['api-designer'], ROLES['accessibility-reviewer']],
    },
    {
      category: 'Documentation',
      roles: [ROLES['documenter']],
    },
  ];
}

/**
 * Get role by ID
 */
export function getRole(roleId: string): Role | null {
  return ROLES[roleId] || null;
}

/**
 * List all role IDs
 */
export function listRoles(): string[] {
  return Object.keys(ROLES);
}

/**
 * Get roles compatible with a tool
 */
export function getRolesForTool(tool: PackageType): Role[] {
  return Object.values(ROLES).filter((role) =>
    role.compatibleTools.includes(tool)
  );
}

/**
 * Search roles by keyword
 */
export function searchRoles(query: string): Role[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(ROLES).filter(
    (role) =>
      role.name.toLowerCase().includes(lowerQuery) ||
      role.description.toLowerCase().includes(lowerQuery) ||
      role.focus.some((f) => f.toLowerCase().includes(lowerQuery))
  );
}
