# PRPM Claude Code Configuration

This directory contains Claude Code configuration for the PRPM project.

## Structure

```
.claude/
├── agents/           # Custom agent definitions
│   └── blog-writer.md
├── commands/         # Slash commands
├── skills/          # Installed skills
├── settings.json    # Project hooks and configuration
└── README.md        # This file
```

## Agents

### prpm-blog-writer

Expert agent for creating and reviewing PRPM blog posts. Ensures consistent structure, tone, format, and technical depth.

**Glob patterns:**
- `packages/webapp/src/app/blog/*/page.tsx`
- `packages/webapp/src/app/blog/*/tweet.txt`
- `packages/webapp/src/app/blog/*/linkedin.txt`

**Trigger mode:** `suggest` - Claude will proactively suggest using this agent when working on blog files.

**Usage:**
```
Use the prpm-blog-writer agent to review this blog post
```

## Hooks

Hooks are configured in `settings.json` and automatically trigger on specific events.

### Installing Hooks Globally

For convenience, you can install hooks globally so they work across all Claude Code sessions:

```bash
# Install hooks to ~/.claude/settings.json
./scripts/install-hooks-globally.sh

# Uninstall hooks from ~/.claude/settings.json
./scripts/uninstall-hooks-globally.sh
```

**Benefits of global installation:**
- ✅ Hooks work immediately in all projects
- ✅ No per-project configuration needed
- ✅ Consistent experience across all repos
- ✅ Automatic backups before changes

### PostToolUse Hooks

#### Blog Post Notifications

Triggers a notification when blog post files are created or edited, reminding you to use the `prpm-blog-writer` agent for review.

**Matchers:**
- `Write:packages/webapp/src/app/blog/*/page.tsx` - New blog posts
- `Edit:packages/webapp/src/app/blog/*/page.tsx` - Blog post edits

**Effect:** Displays a friendly reminder to review the post with the blog writer agent.

## How the Hybrid Approach Works

This project uses a **hybrid approach** for blog post quality assurance:

1. **Glob Patterns (Primary)** - The `prpm-blog-writer` agent definition includes glob patterns for blog files. Claude Code can proactively suggest using this agent when you're working on matching files.

2. **PostToolUse Hooks (Reminder)** - After creating or editing blog posts, hooks display a gentle notification suggesting agent review. This ensures you don't forget the quality check step.

### Benefits

✅ **Proactive suggestions** when editing blog files
✅ **Gentle reminders** after blog post creation/edits
✅ **No forced interruptions** - suggestions only, not blocking
✅ **Self-documenting** - agent scope is clear from glob patterns

### Example Workflow

1. You create a new blog post at `packages/webapp/src/app/blog/new-feature/page.tsx`
2. Hook triggers: "📝 Blog post created. 💡 Consider using prpm-blog-writer agent..."
3. You invoke the agent: "Use the prpm-blog-writer agent to review this post"
4. Agent checks structure, styling, tone, metadata, social media files
5. Agent fixes any issues automatically
6. You commit the changes

## Customization

### Adding New Hooks

Edit `.claude/settings.json` and add to the appropriate event section:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write:path/to/files/*.ext",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Your notification message'"
          }
        ]
      }
    ]
  }
}
```

### Modifying Agent Glob Patterns

Edit `.claude/agents/blog-writer.md` frontmatter:

```yaml
---
name: prpm-blog-writer
glob_patterns:
  - packages/webapp/src/app/blog/*/page.tsx
  - your/new/pattern/*.tsx
---
```

## References

- [Claude Code Hooks Documentation](https://docs.claude.com/en/docs/claude-code/hooks)
- [Agent Development Guide](https://docs.claude.com/en/docs/claude-code/agents)
