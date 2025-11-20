# Kiro Agent Development

Expert guidance for creating, configuring, and managing Kiro custom AI agents.

## Quick Reference

### Agent File Structure
```json
{
  "name": "agent-name",
  "description": "One-line purpose",
  "prompt": "System instructions",
  "tools": ["fs_read", "fs_write"],
  "toolsSettings": {},
  "resources": [],
  "mcpServers": {},
  "hooks": {}
}
```

### File Location
- Project: `.kiro/agents/<name>.json`
- Global: `~/.kiro/agents/<name>.json`

### Common Tools
- `fs_read` - Read files
- `fs_write` - Write files (use allowedPaths)
- `execute_bash` - Run commands (use allowedCommands)
- MCP server tools (varies by server)

## Design Principles

### 1. Specialization Over Generalization
✅ **Good**: `backend-api-specialist` focused on Express.js APIs
❌ **Bad**: `general-helper` that does everything

### 2. Least Privilege
Only grant tools and paths the agent actually needs.

```json
"toolsSettings": {
  "fs_write": {
    "allowedPaths": ["src/api/**", "tests/api/**"]
  }
}
```

### 3. Clear, Specific Prompts
✅ **Good**:
```
You are a backend API expert specializing in Express.js and MongoDB.

Focus on:
- RESTful API design
- Security best practices
- Error handling
- Input validation

Always use async/await and implement proper logging.
```

❌ **Bad**: "You are a helpful coding assistant."

### 4. Resource Loading
Reference project standards automatically:

```json
"resources": [
  "file://.kiro/steering/api-standards.md",
  "file://.kiro/steering/security-policy.md"
]
```

## Common Patterns

### Backend Specialist
```json
{
  "name": "backend-dev",
  "description": "Node.js/Express API development with MongoDB",
  "prompt": "Expert in backend development. Focus on API design, database optimization, and security.",
  "tools": ["fs_read", "fs_write", "execute_bash"],
  "toolsSettings": {
    "fs_write": {
      "allowedPaths": ["src/api/**", "src/routes/**", "src/controllers/**", "src/models/**"]
    }
  }
}
```

### Code Reviewer
```json
{
  "name": "code-reviewer",
  "description": "Reviews code against team standards",
  "prompt": "You review code for:\n- Quality and readability\n- Security issues\n- Performance problems\n- Standard compliance\n\nProvide constructive feedback with examples.",
  "tools": ["fs_read"],
  "resources": ["file://.kiro/steering/review-checklist.md"]
}
```

### Test Writer
```json
{
  "name": "test-writer",
  "description": "Writes comprehensive Vitest test suites",
  "prompt": "Testing expert using Vitest. Write tests with:\n- Unit tests for all functions\n- Edge case coverage\n- Proper mocking\n- AAA pattern",
  "tools": ["fs_read", "fs_write"],
  "toolsSettings": {
    "fs_write": {
      "allowedPaths": ["**/*.test.ts", "**/*.spec.ts", "tests/**"]
    }
  }
}
```

### Frontend Specialist
```json
{
  "name": "frontend-dev",
  "description": "React/Next.js development with TypeScript",
  "prompt": "Frontend expert in React, Next.js, and TypeScript. Focus on:\n- Component architecture\n- Performance optimization\n- Accessibility (WCAG)\n- Responsive design",
  "tools": ["fs_read", "fs_write"],
  "toolsSettings": {
    "fs_write": {
      "allowedPaths": ["src/components/**", "src/pages/**", "src/app/**", "src/styles/**"]
    }
  }
}
```

### DevOps Engineer
```json
{
  "name": "devops",
  "description": "Infrastructure and deployment automation",
  "prompt": "DevOps expert specializing in Docker, Kubernetes, and CI/CD. Focus on automation, reliability, and security.",
  "tools": ["fs_read", "fs_write", "execute_bash"],
  "toolsSettings": {
    "fs_write": {
      "allowedPaths": [".github/**", "docker/**", "k8s/**", "terraform/**"]
    },
    "execute_bash": {
      "allowedCommands": ["docker*", "kubectl*", "terraform*"]
    }
  }
}
```

## Tool Configuration

### File System Tools
```json
"toolsSettings": {
  "fs_read": {
    "allowedPaths": ["src/**", "docs/**"]
  },
  "fs_write": {
    "allowedPaths": ["src/generated/**"],
    "excludePaths": ["src/generated/migrations/**"]
  }
}
```

### Bash Execution
```json
"toolsSettings": {
  "execute_bash": {
    "allowedCommands": ["npm test", "npm run build"],
    "timeout": 30000
  }
}
```

### MCP Servers
```json
"mcpServers": {
  "database": {
    "command": "mcp-server-postgres",
    "args": ["--host", "localhost"],
    "env": {
      "DB_URL": "${DATABASE_URL}"
    }
  },
  "fetch": {
    "command": "mcp-server-fetch",
    "args": []
  }
}
```

## Lifecycle Hooks

### Agent Spawn
Run commands when agent starts:
```json
"hooks": {
  "agentSpawn": [
    "npm run db:check",
    "git fetch origin"
  ]
}
```

### User Prompt Submit
Before each user message:
```json
"hooks": {
  "userPromptSubmit": [
    "git status --short"
  ]
}
```

### Tool Usage
```json
"hooks": {
  "preToolUse": ["echo 'Using tool: ${TOOL_NAME}'"],
  "postToolUse": ["echo 'Tool completed: ${TOOL_NAME}'"]
}
```

## Best Practices

### Naming
- Use kebab-case: `backend-specialist`, not `BackendSpecialist`
- Be specific: `react-component-creator`, not `helper`
- Indicate domain: `aws-infrastructure`, `mobile-testing`

### Prompts
1. Define expertise area
2. List focus areas
3. Specify standards/conventions
4. Provide examples
5. Set expectations

### Tools
1. Grant only necessary tools
2. Restrict file paths strictly
3. Use `allowedTools` for safe tools
4. Validate command allowlists

### Resources
1. Reference steering files for standards
2. Use `file://` URIs
3. Keep prompts in separate files for complex agents
4. Organize by domain

## Workflow

### 1. Create Agent
```bash
# Create file
touch .kiro/agents/my-agent.json

# Add configuration (see patterns above)
```

### 2. Test Agent
```bash
# Switch to agent
kiro agent use my-agent

# Test simple task
kiro "What can you help me with?"
```

### 3. Refine
- Adjust prompt clarity
- Modify tool restrictions
- Add resources
- Configure hooks

### 4. Share (Optional)
```bash
# Publish to PRPM
prpm init my-agent --subtype agent
# Edit generated canonical format
prpm publish
```

## Common Issues

### Agent Not Found
- Check file is in `.kiro/agents/`
- Verify `.json` extension
- Check JSON syntax is valid

### Tools Not Working
- Verify tool name spelling
- Check `allowedPaths` restrictions
- Ensure MCP servers are installed
- Review `allowedTools` list

### Prompt Ineffective
- Be more specific about task
- Add examples
- Reference standards
- Structure with markdown headers

### Performance Issues
- Limit tool access
- Use specific paths
- Set reasonable timeouts
- Reduce unnecessary hooks

## Integration with PRPM

### Install Kiro Agents
```bash
prpm install @username/agent-name --as kiro --subtype agent
```

### Publish Kiro Agents
```bash
# From existing agent
prpm import .kiro/agents/my-agent.json --format kiro --subtype agent
prpm publish

# Or create canonical first
prpm init my-agent --subtype agent
# Edit canonical format
prpm publish
```

## Advanced Patterns

### Multi-Tool Agent
```json
{
  "name": "full-stack",
  "description": "Complete feature development from DB to UI",
  "prompt": "Full-stack developer. Build complete features including database, API, and frontend.",
  "mcpServers": {
    "db": { "command": "mcp-server-postgres", "args": [] },
    "fetch": { "command": "mcp-server-fetch", "args": [] }
  },
  "tools": ["fs_read", "fs_write", "execute_bash", "db_query", "fetch"],
  "allowedTools": ["fetch", "db_query"],
  "toolsSettings": {
    "fs_write": {
      "allowedPaths": ["src/**"]
    }
  }
}
```

### Security-Focused Agent
```json
{
  "name": "security-auditor",
  "description": "Security analysis and vulnerability scanning",
  "prompt": "Security expert. Scan for:\n- SQL injection\n- XSS\n- Auth issues\n- Secrets in code\n- Dependencies",
  "tools": ["fs_read", "execute_bash"],
  "toolsSettings": {
    "execute_bash": {
      "allowedCommands": ["npm audit", "snyk test", "trivy*"]
    }
  }
}
```

### Documentation Agent
```json
{
  "name": "docs-writer",
  "description": "Technical documentation and API docs generator",
  "prompt": "Documentation specialist. Write clear, comprehensive docs with:\n- API references\n- Code examples\n- Architecture diagrams\n- Getting started guides",
  "tools": ["fs_read", "fs_write"],
  "toolsSettings": {
    "fs_write": {
      "allowedPaths": ["docs/**", "README.md", "**/*.md"]
    }
  }
}
```

## Resources

- [Kiro Documentation](https://kiro.dev/docs)
- [Agent Configuration Reference](https://kiro.dev/docs/cli/custom-agents/configuration-reference/)
- [PRPM Kiro Support](https://docs.prpm.dev)

## Checklist for New Agents

- [ ] Name is descriptive and kebab-case
- [ ] Description is one clear sentence
- [ ] Prompt is specific and structured
- [ ] Tools are minimal and necessary
- [ ] File paths are restricted via `allowedPaths`
- [ ] Resources reference relevant standards
- [ ] MCP servers are properly configured (if needed)
- [ ] Hooks are appropriate (if needed)
- [ ] JSON syntax is valid
- [ ] Agent tested with simple task
- [ ] Agent works as expected

## Summary

When creating Kiro agents:
1. **Specialize**: Focus on specific domain
2. **Restrict**: Minimal tools and paths
3. **Clarify**: Clear, structured prompts
4. **Reference**: Load project standards
5. **Test**: Verify agent works correctly
6. **Document**: Explain agent's purpose

Follow these patterns for effective, secure, specialized AI agents.
