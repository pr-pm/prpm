# MCP Servers in Collections

Collections can optionally include MCP (Model Context Protocol) server configurations that enhance Claude Code users' development experience.

## What are MCP Servers?

MCP servers provide specialized capabilities to Claude Code:

- **Filesystem**: Advanced file operations and code navigation
- **Database**: Direct database queries and schema inspection
- **Web Search**: Real-time documentation and research
- **Bash**: Command execution and automation
- **Pulumi**: Infrastructure state inspection
- **AWS/GCP/Azure**: Cloud resource management
- **Kubernetes**: Cluster inspection and debugging

## Collection with MCP Servers

### Configuration Format

```json
{
  "id": "my-collection",
  "config": {
    "defaultFormat": "claude",
    "mcpServers": {
      "server-name": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-package"],
        "env": {
          "ENV_VAR": "value"
        },
        "description": "What this server provides",
        "optional": false
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

## MCP Server Configuration Files

When installed, MCP servers are added to Claude Code's configuration:

**Location**: `.claude/mcp_servers.json`

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

## See Also

- [Collections Usage Guide](./COLLECTIONS_USAGE.md)
- [Format Conversion](./FORMAT_CONVERSION.md)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
