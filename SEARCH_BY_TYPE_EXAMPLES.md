# Search by Package Type - Examples

PRPM supports filtering search results by package type to help you find exactly what you need.

## Basic Usage

```bash
prpm search <query> --type <type>
```

## Examples

### Search for Skills Only

```bash
# Find PostgreSQL skills
prpm search postgres --type skill

# Find debugging skills
prpm search debugging --type skill

# Find infrastructure skills
prpm search aws --type skill
```

**Output Example**:
```
✨ Found 3 package(s):

[✓] PostgreSQL Migrations Skill 🏅
    Master PostgreSQL migrations with patterns for full-text search
    📦 @prpm/postgres-migrations | 🎓 Skill | 📥 1.2k | 🏷️  postgresql, database

[✓] Pulumi Troubleshooting Skill 🏅
    Comprehensive guide to solving common Pulumi TypeScript errors
    📦 @prpm/pulumi-troubleshooting | 🎓 Skill | 📥 890 | 🏷️  pulumi, aws
```

### Search for Agents Only

```bash
# Find code review agents
prpm search review --type agent

# Find debugging agents
prpm search debug --type agent

# Find research agents
prpm search research --type agent
```

### Search for Rules Only

```bash
# Find React coding rules
prpm search react --type rule

# Find TypeScript conventions
prpm search typescript --type rule

# Find commit message rules
prpm search commit --type rule
```

### Search for Plugins Only

```bash
# Find git plugins
prpm search git --type plugin

# Find deployment plugins
prpm search deploy --type plugin
```

### Search for MCP Servers Only

```bash
# Find filesystem MCP servers
prpm search filesystem --type mcp

# Find database MCP servers
prpm search database --type mcp
```

## All Supported Types

| Type | Description | Example Search |
|------|-------------|----------------|
| `skill` | 🎓 Knowledge for AI | `prpm search postgres --type skill` |
| `agent` | 🤖 Autonomous workflows | `prpm search debug --type agent` |
| `rule` | 📋 Behavioral constraints | `prpm search react --type rule` |
| `plugin` | 🔌 Tool extensions | `prpm search git --type plugin` |
| `prompt` | 💬 Reusable templates | `prpm search review --type prompt` |
| `workflow` | ⚡ Multi-step automation | `prpm search deploy --type workflow` |
| `tool` | 🔧 Executable utilities | `prpm search test --type tool` |
| `template` | 📄 File boilerplates | `prpm search component --type template` |
| `mcp` | 🔗 MCP servers | `prpm search api --type mcp` |

## Combining with Other Options

### Limit Results

```bash
# Show only 5 skills
prpm search database --type skill --limit 5
```

### General Search (All Types)

```bash
# Search all package types
prpm search postgres

# This shows skills, agents, rules, tools, etc.
```

## Common Searches

### "I want to learn how to do something"
→ Search for **skills**
```bash
prpm search docker --type skill
prpm search testing --type skill
```

### "I want something to do work for me"
→ Search for **agents**
```bash
prpm search refactor --type agent
prpm search analyze --type agent
```

### "I want to enforce coding standards"
→ Search for **rules**
```bash
prpm search style --type rule
prpm search conventions --type rule
```

### "I want to extend my editor"
→ Search for **plugins**
```bash
prpm search integration --type plugin
```

### "I want to connect to external services"
→ Search for **mcp**
```bash
prpm search api --type mcp
prpm search data --type mcp
```

## Tips

1. **Start broad, then filter**: Try searching without `--type` first to see all results, then narrow down
2. **Check the icons**: Search results show type icons (🎓 🤖 📋 etc.) to help you identify types
3. **Read descriptions**: The package description usually clarifies what type of package it is
4. **Use tags**: Many packages are tagged with their purpose, which helps filtering

## Error Handling

If you use an invalid type:

```bash
$ prpm search postgres --type invalid

❌ Type must be one of: skill, agent, rule, plugin, prompt, workflow, tool, template, mcp

💡 Examples:
   prpm search postgres --type skill
   prpm search debugging --type agent
   prpm search react --type rule
```

## See Also

- [PACKAGE_TYPES.md](./docs/PACKAGE_TYPES.md) - Complete guide to package types
- [README.md](./README.md) - General PRPM documentation
- [PUBLISHING.md](./docs/PUBLISHING.md) - How to publish packages
