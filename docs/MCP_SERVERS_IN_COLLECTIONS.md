# MCP Servers

> **📚 Official Documentation**: [docs.prpm.dev/guides/mcp-servers](https://docs.prpm.dev/guides/mcp-servers)

PRPM focuses on managing prompts, rules, agents, and skills. For MCP (Model Context Protocol) server management, we recommend using **Smithery**.

## What are MCP Servers?

**MCP (Model Context Protocol)** servers provide specialized capabilities to Claude Code, like:

- 📁 File system operations
- 🗄️ Database queries
- 🔍 Web search
- ☁️ Cloud resource management
- 🎯 Custom tools and APIs

## Use Smithery for MCP Servers

**[Smithery.ai](https://smithery.ai)** is a package manager specifically for MCP servers, with 2,000+ servers cataloged.

### Install Smithery CLI

```bash
npm install -g @smithery/cli
```

### Common Commands

```bash
# Search for MCP servers
smithery search pulumi
smithery search database

# Install an MCP server
smithery install @modelcontextprotocol/server-pulumi

# List installed servers
smithery list
```

## MCP Servers + PRPM Collections

PRPM collections provide prompts, rules, and agents. MCP servers complement them by providing capabilities.

### Example: Pulumi Development

```bash
# Install Pulumi prompts and rules via PRPM
prpm install collection/pulumi-infrastructure

# Install Pulumi MCP server via Smithery
smithery install @modelcontextprotocol/server-pulumi
```

Now you have:
- **PRPM**: Pulumi best practices, agents, and workflows
- **Smithery**: Live Pulumi state inspection via MCP

## Resources

- **[Smithery.ai](https://smithery.ai)** - Browse 2,000+ MCP servers
- **[Smithery CLI](https://github.com/smithery-ai/cli)** - MCP server package manager
- **[MCP Specification](https://modelcontextprotocol.io)** - Official MCP Protocol docs
- **[PRPM Collections](./COLLECTIONS.md)** - Learn about PRPM collections

## FAQ

**Why doesn't PRPM manage MCP servers?**

PRPM focuses on prompts, rules, agents, and skills. Smithery specializes in MCP servers with 2,000+ servers already cataloged. We recommend using the right tool for each job.

**Can PRPM collections include MCP servers?**

Not directly. PRPM collections bundle prompts and agents. For MCP servers, use Smithery. You can use both tools together - PRPM for prompts, Smithery for capabilities.

**Do I need MCP servers to use PRPM?**

No! PRPM collections work great on their own. MCP servers are optional enhancements that add extra capabilities to Claude Code.

**Does PRPM work with Smithery?**

Yes! They're complementary tools. Use PRPM to install prompts/rules/agents, and Smithery to install MCP servers. Both enhance your AI development workflow.
