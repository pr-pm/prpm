# MCP Servers

> **📚 Official Documentation**: [docs.prpm.dev/guides/mcp-servers](https://docs.prpm.dev/guides/mcp-servers)

PRPM focuses on managing prompts, rules, agents, and skills. For MCP (Model Context Protocol) servers, use dedicated MCP catalogs and package managers.

## What are MCP Servers?

**MCP (Model Context Protocol)** servers provide specialized capabilities to Claude Code and other AI clients, like:

- 📁 File system operations
- 🗄️ Database queries
- 🔍 Web search
- ☁️ Cloud resource management
- 🎯 Custom tools and APIs
- 🔗 Third-party integrations

## MCP Server Catalogs & Managers

Several services catalog and manage MCP servers:

### Package Managers

- **[Smithery](https://smithery.ai)** ([CLI](https://github.com/smithery-ai/cli)) - 2,000+ servers, automated installation
- Install: `npm install -g @smithery/cli`

### Directories & Catalogs

- **[MCP Server Finder](https://mcpserverfinder.com)** - Comprehensive directory with guides
- **[Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)** - Curated GitHub list
- **[Official MCP Servers](https://github.com/modelcontextprotocol/servers)** - Reference implementations

### Integration Platforms

- **[Composio](https://composio.dev)** ([Docs](https://docs.composio.dev/docs/mcp-overview)) - 100+ tool integrations, built-in auth
- **[Microsoft MCP Catalog](https://github.com/microsoft/mcp)** - Azure, DevOps, AKS integrations

## MCP Servers + PRPM Collections

PRPM collections provide prompts, rules, and agents. MCP servers complement them by providing capabilities.

### Example: Pulumi Development

```bash
# Install Pulumi prompts and rules via PRPM
prpm install collection/pulumi-infrastructure

# Install Pulumi MCP server (choose your method)
smithery install @modelcontextprotocol/server-pulumi
# or configure manually from any catalog
```

Now you have:
- **PRPM**: Pulumi best practices, agents, and workflows
- **MCP Server**: Live Pulumi state inspection

## Choosing an MCP Solution

**For Quick Start:** Smithery CLI, MCP Server Finder

**For Discovery:** Awesome MCP Servers, MCP Server Finder, Official MCP Servers

**For Enterprise:** Composio, Microsoft MCP Catalog, Official implementations

## Resources

- **[Smithery](https://smithery.ai)** - 2,000+ servers with CLI
- **[MCP Server Finder](https://mcpserverfinder.com)** - Comprehensive directory
- **[Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)** - Curated list
- **[Official MCP Servers](https://github.com/modelcontextprotocol/servers)** - Reference code
- **[Composio](https://composio.dev)** - 100+ tool integrations
- **[Microsoft MCP](https://github.com/microsoft/mcp)** - Azure integrations
- **[MCP Specification](https://modelcontextprotocol.io)** - Protocol docs
- **[PRPM Collections](./COLLECTIONS.md)** - PRPM docs

## FAQ

**Why doesn't PRPM manage MCP servers?**

PRPM focuses on prompts, rules, agents, and skills. Multiple specialized services already catalog 2,000+ MCP servers. We recommend using dedicated tools for MCP server management.

**Which MCP catalog should I use?**

It depends on your needs:
- Quick automation: Smithery CLI
- Detailed guides: MCP Server Finder
- Curated lists: Awesome MCP Servers
- Pre-built integrations: Composio
- Azure focus: Microsoft MCP Catalog

**Do I need MCP servers to use PRPM?**

No! PRPM collections work great on their own. MCP servers are optional enhancements.
