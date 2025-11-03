# MCP Servers in PRPM Collections

> **📚 Official Documentation**: [docs.prpm.dev/guides/mcp-servers](https://docs.prpm.dev/guides/mcp-servers)

> **Note**: PRPM **catalogs** MCP servers, it doesn't install them automatically. You stay in control of your Claude Code configuration.

PRPM helps you discover which MCP (Model Context Protocol) servers work well with collections. Collections can recommend MCP servers, and PRPM shows you exactly how to configure them for Claude Code.

## Quick Start

### Discover Recommended MCP Servers

```bash
# View collection details to see recommended MCP servers
prpm info collection/pulumi-infrastructure
```

This shows:
- Which MCP servers enhance the collection
- What each server provides
- Exact installation commands
- Configuration examples
- Required vs optional servers

### Configure MCP Servers Manually

After discovering recommendations:
1. Copy the MCP server configuration from the output
2. Add to your Claude Code config file (`claude_desktop_config.json`)
3. Restart Claude Code
4. Use the enhanced capabilities in conversations

## What are MCP Servers?

**MCP (Model Context Protocol)** is a protocol that allows Claude Code to connect to external tools and services. Think of MCP servers as "superpowers" for Claude - they let it:

- 📁 **Read and write files** with advanced filesystem operations
- 🗄️ **Query databases** directly (PostgreSQL, MySQL, SQLite, etc.)
- 🔍 **Search the web** for real-time information
- ⚡ **Execute commands** via bash/shell integration
- ☁️ **Inspect cloud resources** (AWS, GCP, Azure)
- 🎯 **Access APIs** and specialized tools

### Common MCP Servers

- **Filesystem** (`@modelcontextprotocol/server-filesystem`) - Advanced file operations and code navigation
- **Database** (`@modelcontextprotocol/server-postgres`) - Direct database queries and schema inspection
- **Brave Search** (`@modelcontextprotocol/server-brave-search`) - Real-time web search and documentation lookup
- **Bash** (`@modelcontextprotocol/server-bash`) - Command execution and automation
- **Pulumi** (`@modelcontextprotocol/server-pulumi`) - Infrastructure state inspection
- **AWS** (`@modelcontextprotocol/server-aws`) - Cloud resource management and cost analysis
- **Kubernetes** (`@modelcontextprotocol/server-kubernetes`) - Cluster inspection and debugging
- **Git** (`@modelcontextprotocol/server-git`) - Repository operations and history

## How PRPM Handles MCP Servers

### Discovery, Not Installation

PRPM takes a **cataloging approach** to MCP servers:

**What PRPM Does:**
- ✅ Shows which MCP servers work with each collection
- ✅ Provides installation commands
- ✅ Displays configuration examples
- ✅ Explains what each server provides
- ✅ Marks required vs optional servers

**What PRPM Doesn't Do:**
- ❌ Modify your Claude Code configuration
- ❌ Install MCP servers automatically
- ❌ Manage MCP server lifecycle
- ❌ Handle conflicts or updates

**Why This Approach?**
- You stay in control of your Claude Code setup
- No risk of breaking existing configurations
- Works with global or per-project MCP setups
- Educational - you learn about each MCP server
- Flexible - configure however you prefer

## Recommended MCP Server Format

Collections define recommended MCP servers in their manifest:

```json
{
  "id": "my-collection",
  "config": {
    "defaultFormat": "claude",
    "recommendedMcpServers": {
      "server-name": {
        "package": "@modelcontextprotocol/server-package",
        "description": "What this server provides",
        "required": true | false,
        "configExample": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-package"],
          "env": {
            "ENV_VAR": "value"
          }
        }
      }
    }
  }
}
```

### Example: Pulumi Collection

```json
{
  "id": "pulumi-infrastructure",
  "scope": "collection",
  "name": "Pulumi Infrastructure as Code",
  "config": {
    "defaultFormat": "claude",
    "mcpServers": {
      "pulumi": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-pulumi"],
        "description": "Pulumi state inspection and resource queries",
        "optional": false
      },
      "aws": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-aws"],
        "env": {
          "AWS_REGION": "us-east-1"
        },
        "description": "AWS resource inspection and cost analysis",
        "optional": true
      },
      "kubernetes": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-kubernetes"],
        "env": {
          "KUBECONFIG": "~/.kube/config"
        },
        "description": "Kubernetes cluster management",
        "optional": true
      }
    }
  }
}
```

## Installation Behavior

### For Cursor/Continue/Windsurf Users
- MCP server configurations are **ignored**
- Only packages are installed
- No additional setup required

### For Claude Code Users
- MCP servers are **automatically configured**
- Added to Claude Code's MCP settings
- Optional servers can be skipped with `--skip-optional-mcp`

## Installation Commands

### Install with All MCP Servers
```bash
prpm install pulumi-infrastructure --as claude
```

This installs:
1. All required packages
2. All required MCP servers
3. All optional MCP servers

### Skip Optional MCP Servers
```bash
prpm install pulumi-infrastructure --as claude --skip-optional-mcp
```

This installs:
1. All required packages
2. Only required MCP servers
3. **Skips** optional MCP servers (aws, kubernetes)

### Install Without MCP (Cursor/Other IDEs)
```bash
prpm install pulumi-infrastructure --as cursor
```

This installs:
1. Only packages (Cursor variants if `formatSpecific` is defined)
2. No MCP configuration

## MCP Server Types

### Required MCP Servers
- `"optional": false`
- Essential for collection functionality
- Always installed for Claude users
- Example: Pulumi server for Pulumi collection

### Optional MCP Servers
- `"optional": true`
- Enhanced features but not essential
- Can be skipped with `--skip-optional-mcp`
- Example: AWS/Kubernetes servers for multi-cloud support

## Real-World Examples

### 1. PRPM Development Collection

```json
{
  "id": "prpm-development",
  "config": {
    "mcpServers": {
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
        "description": "Navigate PRPM codebase",
        "optional": false
      },
      "database": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-postgres"],
        "env": {
          "DATABASE_URL": "postgresql://localhost/prpm_registry"
        },
        "description": "Query registry database",
        "optional": false
      },
      "bash": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-bash"],
        "description": "Run tests and build commands",
        "optional": true
      }
    }
  }
}
```

**Usage**:
```bash
# Full stack with MCP
prpm install prpm-development --as claude

# Without bash automation
prpm install prpm-development --as claude --skip-optional-mcp
```

### 2. Pulumi AWS Complete

```json
{
  "id": "pulumi-aws-complete",
  "config": {
    "mcpServers": {
      "pulumi": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-pulumi"],
        "description": "Pulumi state inspection",
        "optional": false
      },
      "aws": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-aws"],
        "env": {
          "AWS_REGION": "us-east-1"
        },
        "description": "Live AWS resource inspection",
        "optional": false
      }
    }
  }
}
```

**Usage**:
```bash
# Claude users get Pulumi + AWS MCP servers
prpm install pulumi-aws-complete --as claude

# Cursor users get only packages
prpm install pulumi-aws-complete --as cursor
```

### 3. Kubernetes Platform

```json
{
  "id": "pulumi-kubernetes",
  "config": {
    "mcpServers": {
      "pulumi": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-pulumi"],
        "optional": false
      },
      "kubernetes": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-kubernetes"],
        "env": {
          "KUBECONFIG": "~/.kube/config"
        },
        "description": "Live cluster debugging",
        "optional": false
      }
    }
  }
}
```

## How MCP Configuration Works in PRPM

### Where MCP Servers Are Configured

PRPM writes MCP server configurations to Claude Code's configuration file:

**Global Config**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
**Global Config**: `%APPDATA%/Claude/claude_desktop_config.json` (Windows)
**Global Config**: `~/.config/Claude/claude_desktop_config.json` (Linux)

### Configuration Format

```json
{
  "mcpServers": {
    "pulumi": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-pulumi"]
    },
    "aws": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-aws"],
      "env": {
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```

### Important Notes

- ⚠️ **Global Configuration**: MCP servers are configured globally for Claude Code, not per-project
- ✅ **Merge Behavior**: PRPM merges new MCP servers with existing ones (doesn't overwrite)
- 🔄 **Claude Code Restart**: You must restart Claude Code after installing MCP servers
- 📦 **NPX Usage**: Most MCP servers use `npx -y` to auto-install packages on first run

## Environment Variables

MCP servers can use environment variables:

```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost/db",
        "PGSSL": "true"
      }
    }
  }
}
```

**Security Note**: Sensitive values should use environment variable references:

```json
{
  "env": {
    "AWS_ACCESS_KEY_ID": "${AWS_ACCESS_KEY_ID}",
    "AWS_SECRET_ACCESS_KEY": "${AWS_SECRET_ACCESS_KEY}"
  }
}
```

## Benefits of MCP Servers in Collections

### For Collection Authors
1. **Enhanced Capabilities**: Provide powerful tools to users
2. **Consistency**: Everyone gets the same MCP setup
3. **Discovery**: Users learn about relevant MCP servers
4. **Integration**: Packages can reference MCP capabilities

### For Users
1. **One-Command Setup**: Get packages + MCP servers together
2. **Curated Tools**: Collection authors choose best MCP servers
3. **Pre-Configured**: Environment variables and paths set correctly
4. **Optional Enhancement**: Can skip MCP servers if not needed

## Creating Collections with MCP Servers

### 1. Identify Useful MCP Servers

For your collection domain, what MCP servers would help?

- **Infrastructure**: Pulumi, AWS, Kubernetes, Terraform
- **Development**: Filesystem, Database, Bash
- **Data Science**: Database, Filesystem, Python environment
- **Web Development**: Filesystem, Database, Browser automation

### 2. Mark Required vs Optional

- **Required**: Essential for core functionality
- **Optional**: Nice-to-have enhancements

### 3. Configure Environment Variables

Provide sensible defaults:

```json
{
  "env": {
    "AWS_REGION": "us-east-1",
    "KUBECONFIG": "~/.kube/config",
    "DATABASE_URL": "postgresql://localhost/mydb"
  }
}
```

### 4. Document MCP Server Usage

In your collection README, explain:
- What each MCP server provides
- How to configure environment variables
- Example commands users can run

## Pulumi Collections

PRPM includes three official Pulumi collections with MCP servers:

### pulumi-infrastructure
**MCP Servers**:
- Pulumi (required) - State inspection
- AWS (optional) - Cloud resource queries
- Kubernetes (optional) - Cluster management

**Packages**: TypeScript, AWS, Kubernetes, GCP, Azure, State Management

### pulumi-aws-complete
**MCP Servers**:
- Pulumi (required) - State and resource queries
- AWS (required) - Live AWS inspection and cost analysis

**Packages**: VPC, ECS, Lambda, RDS, S3, IAM, Monitoring

### pulumi-kubernetes
**MCP Servers**:
- Pulumi (required) - K8s resource management
- Kubernetes (required) - Live cluster debugging

**Packages**: Cluster provisioning, Apps, Operators, Helm, Monitoring

## Future Enhancements

### Version Pinning
```json
{
  "mcpServers": {
    "pulumi": {
      "package": "@modelcontextprotocol/server-pulumi@1.2.0"
    }
  }
}
```

### Custom MCP Servers
```json
{
  "mcpServers": {
    "custom": {
      "command": "node",
      "args": ["./scripts/my-mcp-server.js"]
    }
  }
}
```

### Health Checks
```json
{
  "mcpServers": {
    "database": {
      "healthCheck": "SELECT 1",
      "timeout": 5000
    }
  }
}
```

## Troubleshooting

### MCP Server Not Working

**1. Restart Claude Code**
MCP servers only load when Claude Code starts. After installing a collection with MCP servers, you must:
- Quit Claude Code completely
- Reopen Claude Code
- Start a new conversation

**2. Check Configuration File**
Verify MCP servers were added:
```bash
# macOS
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Linux
cat ~/.config/Claude/claude_desktop_config.json

# Windows
type %APPDATA%\Claude\claude_desktop_config.json
```

**3. Check NPM/NPX is Installed**
Most MCP servers use `npx` to run:
```bash
npx --version
```

If not installed, install Node.js from [nodejs.org](https://nodejs.org).

**4. Test MCP Server Manually**
Try running the MCP server command directly:
```bash
npx -y @modelcontextprotocol/server-filesystem /path/to/dir
```

### Environment Variables Not Working

MCP servers inherit environment from Claude Code, not your shell. To use env vars:

**Option 1: Set in Collection Config**
```json
{
  "env": {
    "DATABASE_URL": "postgresql://localhost/mydb"
  }
}
```

**Option 2: Set System-Wide**
- **macOS/Linux**: Add to `~/.zshrc` or `~/.bashrc`, then restart computer
- **Windows**: Set in System Environment Variables, then restart

## FAQ

### Can I use MCP servers without collections?

Yes! You can manually add MCP servers to Claude Code's config file. PRPM just makes it easier by bundling them with collections.

### Do MCP servers work with Cursor/Windsurf/Continue?

No, MCP is specific to Claude Code. When you install a collection for Cursor/Windsurf/Continue, PRPM automatically skips MCP configuration.

### Are MCP servers project-specific or global?

**Global**. MCP servers are configured globally for Claude Code, not per-project. This means:
- ✅ Available in all conversations
- ⚠️ Multiple projects can conflict (e.g., different database URLs)
- 💡 Use environment variables to switch between projects

### Can I manually edit MCP configuration?

Yes! PRPM writes to the standard Claude Code config file. You can manually edit:
- `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
- `%APPDATA%/Claude/claude_desktop_config.json` (Windows)
- `~/.config/Claude/claude_desktop_config.json` (Linux)

Just restart Claude Code after editing.

### What happens if I install multiple collections with MCP servers?

PRPM **merges** MCP server configurations. If two collections define the same MCP server with different configs, the last one installed wins.

### How do I remove an MCP server?

Manually edit Claude Code's config file and remove the server entry, then restart Claude Code.

### Do I need to install MCP server packages separately?

No! When using `npx -y`, packages are auto-installed on first use. That's why most PRPM collections use `npx -y` in their MCP configs.

## See Also

- 📚 [Official PRPM MCP Docs](https://docs.prpm.dev/guides/mcp-servers)
- 📦 [Collections Usage Guide](./COLLECTIONS_USAGE.md)
- 🔄 [Format Conversion](./FORMAT_CONVERSION.md)
- 🌐 [MCP Protocol Specification](https://modelcontextprotocol.io)
- 🗂️ [Official MCP Servers](https://github.com/modelcontextprotocol/servers)
