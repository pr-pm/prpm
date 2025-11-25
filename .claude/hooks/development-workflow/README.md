# Development Workflow Hook

Enforces documentation and skill updates when working on PRPM features.

## What It Does

This hook provides context-aware reminders based on the type of development work being done:

- **CLI/Feature Work**: Reminds you to update public documentation, relevant skills, and schemas
- **Blog Work**: Enforces use of blog agent and human-writing skill, reminds about sitemap updates
- **Documentation Work**: Provides documentation standards and cross-reference reminders
- **Skill Work**: Ensures proper skill structure and documentation

## How It Works

The hook activates only in the PRPM repository and detects work type based on your git branch name:

- Branches with `cli`, `feature`, `command`, `publish`, `install` → CLI workflow
- Branches with `blog`, `post` → Blog workflow
- Branches with `docs`, `documentation` → Documentation workflow
- Branches with `skill`, `agent`, `hook` → Skill workflow

## Branch Naming Examples

```bash
# Activates CLI workflow reminders
git checkout -b feature/add-hooks-support
git checkout -b cli-improve-publishing

# Activates blog workflow reminders
git checkout -b blog-hooks-announcement
git checkout -b post-format-conversion

# Activates documentation workflow reminders
git checkout -b docs-update-cli-reference
git checkout -b documentation-hooks-guide

# Activates skill workflow reminders
git checkout -b skill-typescript-safety
git checkout -b agent-format-converter
```

## Configuration

Edit `hook.json` to customize:

```json
{
  "enabled": true,
  "config": {
    "enabledBranches": ["*"],
    "repositoryOnly": true
  }
}
```

## Disabling

Set `enabled: false` in `hook.json` or remove the hook directory.

## Development

### Building

```bash
cd .claude/hooks/development-workflow
npm run build  # or: esbuild src/hook.ts --outfile=dist/hook.js --bundle --platform=node --format=cjs
```

### Testing Locally

The hook runs automatically on session start in the PRPM repository. Check the session start output for reminders.
