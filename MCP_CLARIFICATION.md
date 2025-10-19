# MCP Server Clarification - What PRPM Actually Does

## ❌ What PRPM Does NOT Do

**PRPM does NOT install MCP servers.**

MCP servers are external programs (like `@modelcontextprotocol/server-pulumi`) that need to be installed separately. PRPM cannot and does not install these for you.

## ✅ What PRPM Actually Does

**PRPM configures MCP servers for Claude Code users.**

When you install a collection that includes MCP server configs:

```bash
prpm install @collection/pulumi-infrastructure --as claude
```

PRPM writes a configuration file:

**File**: `.claude/mcp_servers.json`

```json
{
  "mcpServers": {
    "pulumi": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-pulumi"]
    }
  }
}
```

Then **Claude Code** (not PRPM) runs:
```bash
npx -y @modelcontextprotocol/server-pulumi
```

## How It Works

### For Claude Code Users

1. **Install collection with MCP configs**:
   ```bash
   prpm install @collection/pulumi-infrastructure --as claude
   ```

2. **PRPM writes** `.claude/mcp_servers.json` with server configurations

3. **Claude Code reads** the config file

4. **Claude Code runs** `npx @modelcontextprotocol/server-pulumi` automatically

5. **MCP server runs** and provides capabilities to Claude Code

### For Cursor/Windsurf/Continue Users

1. **Install same collection**:
   ```bash
   prpm install @collection/pulumi-infrastructure --as cursor
   ```

2. **MCP configs are ignored** - only packages are installed

3. **No MCP server configuration** happens

## Real-World Example

### Collection: @collection/pulumi-infrastructure

**Contains**:
- **Packages**: TypeScript rules, AWS best practices, Kubernetes patterns
- **MCP Server Configs**: Pulumi server, AWS server (optional), K8s server (optional)

**When installed for Claude Code**:
```bash
prpm install @collection/pulumi-infrastructure --as claude
```

**What happens**:
1. ✅ Packages installed to `.claude/agents/`
2. ✅ MCP config written to `.claude/mcp_servers.json`
3. ⏳ Claude Code (not PRPM) runs the MCP servers
4. ✅ Claude Code can now query Pulumi state, AWS resources, K8s clusters

**When installed for Cursor**:
```bash
prpm install @collection/pulumi-infrastructure --as cursor
```

**What happens**:
1. ✅ Packages installed to `.cursor/rules/`
2. ❌ No MCP configuration (Cursor doesn't support MCP)
3. ✅ Cursor rules work normally

## Why This Matters

### You Need to Understand:

1. **MCP servers are separate programs**
   - They're not part of PRPM packages
   - They need to be installed by their package manager (npm, npx, etc.)
   - Claude Code handles this automatically via `npx`

2. **PRPM only writes configs**
   - Just like how PRPM writes `.cursorrules` files
   - The config tells Claude Code which servers to run
   - Claude Code does the actual running

3. **Different editors, different behavior**
   - **Claude Code**: Reads MCP configs, runs servers
   - **Cursor/Windsurf/Continue**: Ignores MCP configs

## Common Questions

### Q: Do I need to install MCP servers separately?

**A**: No, if you're using Claude Code. Claude Code runs `npx -y @package/name` which auto-installs and runs the server.

If you're using Cursor/Windsurf/Continue, MCP servers aren't used at all.

### Q: What if I don't want MCP servers?

**A**: Skip optional MCP servers:

```bash
prpm install @collection/pulumi-infrastructure --as claude --skip-optional-mcp
```

Or just install for a different editor:
```bash
prpm install @collection/pulumi-infrastructure --as cursor
```

### Q: Can I see which collections have MCP servers?

**A**: Yes, check the collection info:

```bash
prpm collection info pulumi-infrastructure

# Shows:
# MCP Servers:
#   - pulumi (required)
#   - aws (optional)
#   - kubernetes (optional)
```

### Q: Are MCP servers the same as packages?

**A**: **No!**

- **Packages** = Cursor rules, Claude agents, prompts, workflows
  - PRPM installs these directly
  - Work across all editors (with format conversion)

- **MCP Servers** = External programs that extend Claude Code
  - PRPM only writes config files for these
  - Only work in Claude Code
  - Claude Code installs/runs them automatically

## Summary

### PRPM's Role with MCP Servers:

| Action | PRPM | Claude Code | You |
|--------|------|-------------|-----|
| **Write MCP config** | ✅ Yes | ❌ No | ❌ No |
| **Install MCP server** | ❌ No | ✅ Yes (via npx) | ❌ No |
| **Run MCP server** | ❌ No | ✅ Yes | ❌ No |
| **Use MCP capabilities** | ❌ No | ✅ Yes | ✅ Yes (via Claude) |

### Updated Package Count Breakdown:

**744+ Total Packages**:
- **667+ Cursor rules** (actual prompt packages)
- **146+ Claude agents** (actual prompt packages)
- **255+ Windsurf rules** (actual prompt packages)
- **15+ MCP server configs** (NOT packages - just config files)

**More accurate**: PRPM has 729 prompt packages + 15 MCP server configurations

## See Also

- [MCP Servers in Collections](./docs/MCP_SERVERS_IN_COLLECTIONS.md) - Full documentation
- [Collections Guide](./docs/COLLECTIONS.md) - How collections work
- [Model Context Protocol](https://modelcontextprotocol.io) - Official MCP docs
