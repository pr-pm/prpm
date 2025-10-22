# PRPM Architecture

High-level architecture of the Prompt Package Manager.

## System Components

```
User (CLI)
    ↓
Registry API (Fastify)
    ↓
PostgreSQL + Redis
```

### CLI
- TypeScript + Node.js
- Commander.js for commands
- Installs packages locally
- Manages `~/.prpmrc` and `prpm.lock`

### Registry
- Fastify REST API
- PostgreSQL database
- Redis caching
- Server-side format conversion

### Conversion System
- Canonical format storage
- On-demand conversion to Cursor/Claude/Continue/Windsurf
- Quality scoring for lossy conversions

## File Locations

- `~/.prpmrc` - Global user config
- `prpm.lock` - Project lockfile
- `.cursor/rules/` - Cursor packages
- `.claude/skills/` - Claude skills
- `.claude/agents/` - Claude agents

## See Also

- [Format Conversion](./FORMAT_CONVERSION.md)
- [Configuration](./CONFIGURATION.md)
