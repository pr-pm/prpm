/**
 * Package templates for scaffolding new packages
 */

import { PackageType } from '../types';
import { getRole, ROLES } from './roles';

export interface Template {
  name: string;
  description: string;
  content: string;
  role?: string; // Role ID from roles.ts
  category?: string;
}

/**
 * Get available templates for a package type
 */
export function getTemplatesForType(type: PackageType): Template[] {
  switch (type) {
    case 'cursor':
      return getCursorTemplates();
    case 'claude':
      return getClaudeTemplates();
    case 'windsurf':
      return getWindsurfTemplates();
    case 'continue':
      return getContinueTemplates();
    case 'aider':
      return getAiderTemplates();
    case 'copilot':
    case 'copilot-instructions':
    case 'copilot-path':
      return getCopilotTemplates();
    default:
      return getGenericTemplates();
  }
}

/**
 * Get a specific template by name and type
 */
export function getTemplate(
  type: PackageType,
  templateName: string
): Template | null {
  const templates = getTemplatesForType(type);
  return templates.find((t) => t.name === templateName) || null;
}

/**
 * Generate package content from template
 */
export function generateFromTemplate(
  template: Template,
  options: {
    name?: string;
    description?: string;
    author?: string;
    role?: string;
  }
): string {
  let content = template.content;

  // If role is specified, inject role system prompt
  if (options.role) {
    const roleObj = getRole(options.role);
    if (roleObj) {
      content = content.replace(/\{\{ROLE_SYSTEM_PROMPT\}\}/g, roleObj.systemPrompt);
      content = content.replace(/\{\{ROLE_NAME\}\}/g, roleObj.name);
      content = content.replace(/\{\{ROLE_DESCRIPTION\}\}/g, roleObj.description);
      content = content.replace(/\{\{ROLE_FOCUS\}\}/g, roleObj.focus.join(', '));
    }
  }

  // Replace placeholders
  if (options.name) {
    content = content.replace(/\{\{PACKAGE_NAME\}\}/g, options.name);
  }
  if (options.description) {
    content = content.replace(/\{\{DESCRIPTION\}\}/g, options.description);
  }
  if (options.author) {
    content = content.replace(/\{\{AUTHOR\}\}/g, options.author);
  }

  // Add current date
  const date = new Date().toISOString().split('T')[0];
  content = content.replace(/\{\{DATE\}\}/g, date);

  return content;
}

// Template definitions

function getCursorTemplates(): Template[] {
  return [
    {
      name: 'basic',
      description: 'Basic Cursor rules template',
      content: `# {{PACKAGE_NAME}}

## Description
{{DESCRIPTION}}

## Rules

### Code Quality
- Always write clean, readable code
- Follow the project's existing code style
- Add comments for complex logic

### Testing
- Write tests for new features
- Ensure all tests pass before committing

### Documentation
- Update documentation when adding features
- Include JSDoc comments for functions

---
Created: {{DATE}}
Author: {{AUTHOR}}
`,
    },
    {
      name: 'framework',
      description: 'Framework-specific rules',
      content: `# {{PACKAGE_NAME}} - Framework Rules

## Description
{{DESCRIPTION}}

## Framework Guidelines

### Component Structure
- Use functional components
- Keep components small and focused
- Extract reusable logic into hooks

### State Management
- Use appropriate state management patterns
- Avoid prop drilling
- Document state flow

### Performance
- Optimize re-renders
- Use memoization where appropriate
- Lazy load heavy components

### Styling
- Follow the project's styling conventions
- Use consistent naming patterns
- Keep styles modular

## Best Practices
- Write semantic HTML
- Ensure accessibility
- Handle errors gracefully

---
Created: {{DATE}}
Author: {{AUTHOR}}
`,
    },
    {
      name: 'testing',
      description: 'Testing-focused rules',
      content: `# {{PACKAGE_NAME}} - Testing Rules

## Description
{{DESCRIPTION}}

## Testing Standards

### Unit Tests
- Test individual functions and components
- Mock external dependencies
- Aim for high coverage on critical paths

### Integration Tests
- Test feature workflows
- Verify component interactions
- Test API integrations

### Test Organization
- Group related tests
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Best Practices
- Keep tests simple and focused
- Don't test implementation details
- Use factory functions for test data
- Clean up after tests

---
Created: {{DATE}}
Author: {{AUTHOR}}
`,
    },
  ];
}

function getClaudeTemplates(): Template[] {
  return [
    {
      name: 'basic',
      description: 'Basic Claude agent template',
      content: `# {{PACKAGE_NAME}}

## Agent Description
{{DESCRIPTION}}

## Role
You are {{PACKAGE_NAME}}, a specialized AI assistant designed to help with specific tasks.

## Capabilities
- Capability 1
- Capability 2
- Capability 3

## Guidelines
- Guideline 1
- Guideline 2
- Guideline 3

## Communication Style
- Be clear and concise
- Provide examples when helpful
- Ask clarifying questions when needed

---
Created: {{DATE}}
Author: {{AUTHOR}}
`,
    },
    {
      name: 'role-based',
      description: 'Role-based specialized agent',
      role: 'code-reviewer', // Can be overridden
      category: 'specialized',
      content: `# {{PACKAGE_NAME}} - {{ROLE_NAME}}

## Description
{{DESCRIPTION}}

## Specialized Role
{{ROLE_DESCRIPTION}}

## System Prompt
{{ROLE_SYSTEM_PROMPT}}

## Focus Areas
- {{ROLE_FOCUS}}

## Usage Guidelines
Apply this agent when you need specialized {{ROLE_NAME}} capabilities.

---
Created: {{DATE}}
Author: {{AUTHOR}}
Role: {{ROLE_NAME}}
`,
    },
    {
      name: 'code-reviewer',
      description: 'Code review agent',
      role: 'code-reviewer',
      category: 'code-review',
      content: `# {{PACKAGE_NAME}} - Code Review Agent

## Description
{{DESCRIPTION}}

## Role
{{ROLE_SYSTEM_PROMPT}}

## Review Checklist

### Code Quality
- Is the code readable and well-structured?
- Are variable and function names descriptive?
- Is there unnecessary complexity?

### Best Practices
- Does it follow language/framework conventions?
- Are there proper error handling patterns?
- Is the code DRY (Don't Repeat Yourself)?

### Security
- Are there potential security vulnerabilities?
- Is user input properly validated?
- Are secrets properly managed?

### Performance
- Are there obvious performance issues?
- Are there unnecessary operations?
- Is caching used appropriately?

## Review Format
Provide feedback in this format:
1. **Strengths**: What's done well
2. **Issues**: Problems to address
3. **Suggestions**: Optional improvements

---
Created: {{DATE}}
Author: {{AUTHOR}}
`,
    },
  ];
}

function getWindsurfTemplates(): Template[] {
  return [
    {
      name: 'basic',
      description: 'Basic Windsurf rules template',
      content: `# {{PACKAGE_NAME}}

## Description
{{DESCRIPTION}}

## Rules for Cascade

### Project Context
Remember the following about this project:
- Technology stack: [Your stack]
- Key patterns: [Your patterns]
- Important conventions: [Your conventions]

### Code Generation Guidelines
- Follow the established patterns
- Maintain consistency with existing code
- Consider performance implications

### Communication Preferences
- Explain complex decisions
- Provide alternative approaches when relevant
- Ask before making major architectural changes

---
Created: {{DATE}}
Author: {{AUTHOR}}
`,
    },
  ];
}

function getContinueTemplates(): Template[] {
  return [
    {
      name: 'basic',
      description: 'Basic Continue prompt template',
      content: `# {{PACKAGE_NAME}}

{{DESCRIPTION}}

## Instructions
Provide clear instructions for this prompt...

## Context
{{#if context}}
Context: {{context}}
{{/if}}

## Output Format
Specify the expected output format...

---
Created: {{DATE}}
Author: {{AUTHOR}}
`,
    },
  ];
}

function getAiderTemplates(): Template[] {
  return [
    {
      name: 'basic',
      description: 'Basic Aider conventions',
      content: `# {{PACKAGE_NAME}} - Coding Conventions

{{DESCRIPTION}}

## Naming Conventions
- Variables: camelCase
- Functions: camelCase
- Classes: PascalCase
- Constants: UPPER_SNAKE_CASE

## File Organization
- One component per file
- Group related files in directories
- Use index files for exports

## Code Style
- Use 2 spaces for indentation
- Maximum line length: 100 characters
- Always use semicolons

## Comments
- Use JSDoc for functions
- Explain "why", not "what"
- Keep comments up-to-date

## Testing
- Test files next to source files
- Use .test.ts extension
- Aim for > 80% coverage

---
Created: {{DATE}}
Author: {{AUTHOR}}
`,
    },
  ];
}

function getCopilotTemplates(): Template[] {
  return [
    {
      name: 'basic',
      description: 'Basic Copilot instructions',
      content: `# {{PACKAGE_NAME}}

## Project Context
{{DESCRIPTION}}

## Technology Stack
- Language: [e.g., TypeScript]
- Framework: [e.g., React]
- Testing: [e.g., Jest]

## Coding Standards
- Follow [coding standard]
- Use [specific patterns]
- Avoid [anti-patterns]

## Preferences
- Prefer functional programming patterns
- Use async/await over promises
- Write self-documenting code

---
Created: {{DATE}}
Author: {{AUTHOR}}
`,
    },
    {
      name: 'path-specific',
      description: 'Path-specific Copilot instructions',
      content: `---
paths:
  - src/**/*.ts
---

# {{PACKAGE_NAME}}

## Description
{{DESCRIPTION}}

## Guidelines for this directory
- Specific guideline 1
- Specific guideline 2
- Specific guideline 3

---
Created: {{DATE}}
Author: {{AUTHOR}}
`,
    },
  ];
}

function getGenericTemplates(): Template[] {
  return [
    {
      name: 'basic',
      description: 'Basic generic template',
      content: `# {{PACKAGE_NAME}}

## Description
{{DESCRIPTION}}

## Guidelines
- Guideline 1
- Guideline 2
- Guideline 3

---
Created: {{DATE}}
Author: {{AUTHOR}}
`,
    },
  ];
}
