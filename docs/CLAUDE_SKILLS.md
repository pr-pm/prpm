# Claude Skills Support

PRMP now supports Claude Skills - the new skills format introduced by Anthropic in October 2025.

## What are Claude Skills?

Claude Skills allow you to extend Claude's capabilities with custom instructions, tools, and behaviors. They're similar to cursor rules but designed specifically for Claude's desktop and web apps.

**Resources:**
- [Simon Willison's Article](https://simonwillison.net/2025/Oct/16/claude-skills/)
- [Anthropic Skills Documentation](https://docs.anthropic.com/claude/skills)

## Package Type

When creating or installing Claude Skills packages, use the `claude-skill` type:

```json
{
  "name": "my-claude-skill",
  "version": "1.0.0",
  "type": "claude-skill",
  "description": "Custom skill for Claude",
  "files": [
    "skill.json",
    "README.md"
  ]
}
```

## File Structure

Claude Skills packages should include:

```
my-claude-skill/
├── prpm.json          # PRMP package manifest
├── skill.json         # Claude skill definition
├── README.md          # Documentation
└── examples/          # Optional: usage examples
    └── example.md
```

## Installing Claude Skills

```bash
# Search for Claude skills
prpm search "react" --type claude-skill

# Install a skill
prpm install react-expert-skill

# List installed skills
prpm list --type claude-skill
```

## Creating a Claude Skill Package

1. **Create skill.json**

```json
{
  "name": "React Expert",
  "description": "Expert guidance for React development",
  "version": "1.0.0",
  "instructions": "You are a React expert. Provide concise, modern React advice using hooks and functional components. Always consider performance and accessibility.",
  "tools": [],
  "examples": [
    {
      "input": "How do I optimize React rerenders?",
      "output": "Use React.memo(), useMemo(), and useCallback()..."
    }
  ],
  "tags": ["react", "javascript", "frontend"],
  "author": {
    "name": "Your Name",
    "url": "https://github.com/yourusername"
  }
}
```

2. **Create prpm.json**

```json
{
  "name": "react-expert-skill",
  "version": "1.0.0",
  "displayName": "React Expert Skill",
  "description": "Expert React development guidance for Claude",
  "type": "claude-skill",
  "tags": ["react", "javascript", "frontend", "claude"],
  "author": {
    "name": "Your Name",
    "github": "yourusername"
  },
  "files": [
    "skill.json",
    "README.md"
  ],
  "keywords": ["react", "claude", "skill", "frontend"]
}
```

3. **Publish**

```bash
prpm login
prpm publish
```

## Claude Marketplace Integration

PRMP can help you discover skills from the Claude Marketplace and convert them to local packages.

### Import from Claude Marketplace

```bash
# Coming soon
prpm import claude-marketplace <skill-id>
```

This will:
1. Fetch the skill from Claude's marketplace
2. Convert to PRMP format
3. Install locally
4. Track updates

### Export to Claude Marketplace

```bash
# Coming soon
prpm export claude-marketplace my-skill
```

This will:
1. Validate your skill package
2. Generate Claude Marketplace metadata
3. Provide submission instructions

## Differences from Other Package Types

| Feature | Cursor Rules | Claude Agent | Claude Skill |
|---------|-------------|--------------|--------------|
| File Format | `.cursorrules` | `.clinerules` | `skill.json` |
| IDE/App | Cursor IDE | Claude Desktop | Claude (all apps) |
| Tools Support | No | Yes | Yes |
| Examples | No | No | Yes |
| Marketplace | No | No | Yes (Anthropic) |
| Versioning | Manual | Manual | Automatic |

## Best Practices

### 1. Clear Instructions
```json
{
  "instructions": "Be specific and actionable. Use 'You are X' format."
}
```

### 2. Provide Examples
```json
{
  "examples": [
    {
      "input": "Real user question",
      "output": "Expected response format"
    }
  ]
}
```

### 3. Tag Appropriately
```json
{
  "tags": ["domain", "language", "framework", "use-case"]
}
```

### 4. Version Semantically
- `1.0.0` - Initial release
- `1.1.0` - New examples or minor improvements
- `2.0.0` - Breaking changes to instructions

## Popular Claude Skills

Browse popular skills on the registry:

```bash
prpm trending --type claude-skill
prpm search "expert" --type claude-skill
```

## Converting Between Formats

### Cursor Rules → Claude Skill

```bash
# Coming soon
prpm convert react-cursor-rules --to claude-skill
```

### Claude Agent → Claude Skill

```bash
# Coming soon
prpm convert my-claude-agent --to claude-skill
```

## Skill Templates

Get started quickly with templates:

```bash
# Coming soon
prpm init --template claude-skill
prpm init --template claude-skill-with-tools
```

## Testing Your Skill

Before publishing, test your skill:

1. **Install locally**
   ```bash
   prpm add . --type claude-skill
   ```

2. **Try in Claude**
   - Open Claude Desktop/Web
   - Navigate to Skills
   - Import your `skill.json`
   - Test with example inputs

3. **Validate**
   ```bash
   prpm publish --dry-run
   ```

## Contributing

Have a great Claude Skill? Share it!

1. **Create your skill** following this guide
2. **Publish to PRMP** with `prpm publish`
3. **Share** on social media with `#ClaudeSkills` `#PRMP`
4. **Get featured** - popular skills get showcased

## Support

- **Issues**: https://github.com/khaliqgant/prompt-package-manager/issues
- **Discussions**: https://github.com/khaliqgant/prompt-package-manager/discussions
- **Twitter**: Share your skills with `#PRMP`

## Roadmap

- [ ] Claude Marketplace import/export
- [ ] Skill testing framework
- [ ] Skill analytics (usage, effectiveness)
- [ ] Multi-skill management (skill sets)
- [ ] Skill recommendations based on usage
- [ ] Integration with Claude Desktop API

---

**Learn More:**
- [PRMP Documentation](../README.md)
- [Package Publishing Guide](../BOOTSTRAP_GUIDE.md)
- [Simon Willison on Claude Skills](https://simonwillison.net/2025/Oct/16/claude-skills/)
