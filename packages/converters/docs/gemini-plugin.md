# Gemini CLI Extension Format Specification

**File Locations:**
- Extensions: `~/.gemini/extensions/<extension-name>/gemini-extension.json`
- Commands: `~/.gemini/extensions/<extension-name>/commands/*.toml`
- Context: `~/.gemini/extensions/<extension-name>/GEMINI.md` (or custom contextFileName)

**Format:** JSON configuration file
**Official Docs:** https://geminicli.com/docs/extensions/

## Overview

Gemini CLI extensions provide a way to extend the Gemini CLI with custom MCP servers, commands, and context files. Extensions are installed in the `~/.gemini/extensions/` directory and must contain a `gemini-extension.json` configuration file.

## Configuration Fields

### Required Fields

- **`name`** (string): Unique extension name (lowercase with dashes, e.g., "my-extension")
- **`version`** (string): Extension version (semver format, e.g., "1.0.0")

### Optional Fields

- **`description`** (string): Extension description
- **`author`** (string): Extension author
- **`mcpServers`** (object): MCP server configurations
  - Key: Server name
  - Value: Server configuration object with:
    - `command` (string, required): Command to run the MCP server
    - `args` (array of strings): Command arguments
    - `env` (object): Environment variables
    - `disabled` (boolean): Whether the server is disabled
- **`contextFileName`** (string): Name of the context file (default: "GEMINI.md")
- **`excludeTools`** (array of strings): List of tools to exclude from the model
- **`experimentalSettings`** (object): Experimental Gemini CLI settings

## Variable Substitution

Gemini extensions support variable substitution in configuration values:

- `${extensionPath}`: Absolute path to the extension directory
- `${home}`: User's home directory

Example:
```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["${extensionPath}/server.js"]
    }
  }
}
```

## Content Format

### Basic Extension

```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "description": "My custom Gemini extension",
  "author": "Your Name",
  "contextFileName": "GEMINI.md"
}
```

### Extension with MCP Servers

```json
{
  "name": "weather-extension",
  "version": "1.0.0",
  "description": "Weather data via MCP",
  "mcpServers": {
    "weather": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-weather"],
      "env": {
        "WEATHER_API_KEY": "${WEATHER_API_KEY}"
      }
    }
  }
}
```

### Extension with Multiple Servers

```json
{
  "name": "dev-tools",
  "version": "1.0.0",
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/project"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  },
  "excludeTools": ["sensitive-tool"],
  "contextFileName": "DEV.md"
}
```

## Best Practices

1. **Naming**: Use lowercase with dashes for extension names
2. **Versioning**: Follow semantic versioning (semver)
3. **MCP Servers**: Test server commands independently before adding to extension
4. **Context Files**: Keep context files focused and relevant to the extension's purpose
5. **Environment Variables**: Use environment variables for sensitive data (API keys, tokens)
6. **Variable Substitution**: Use `${extensionPath}` for extension-relative paths

## Conversion Notes

### From Gemini Extension to Canonical

The converter:
1. Extracts extension metadata (name, version, description, author)
2. Converts MCP servers to canonical server format
3. Preserves extension-specific settings (contextFileName, excludeTools, experimentalSettings)
4. Stores original configuration for roundtrip conversion

### From Canonical to Gemini Extension

The converter:
1. Generates `gemini-extension.json` structure
2. Converts canonical servers to Gemini MCP server format
3. Preserves Gemini-specific settings for roundtrip conversion
4. Validates against Gemini extension schema

## Limitations

- Extensions must be installed in `~/.gemini/extensions/` directory
- Extension names must be unique and use lowercase with dashes
- MCP servers must be valid and accessible
- Context files must be in markdown format
- Command TOML files are not yet supported in conversion (future enhancement)

## Extension Management

Gemini CLI provides commands for managing extensions:

- `gemini extensions install <path>`: Install extension from directory
- `gemini extensions uninstall <name>`: Uninstall extension
- `gemini extensions list`: List installed extensions
- `gemini extensions enable <name>`: Enable extension
- `gemini extensions disable <name>`: Disable extension
- `gemini extensions update <name>`: Update extension
- `gemini extensions link <path>`: Symlink extension for development

## Examples

### Example 1: Simple Context Extension

```json
{
  "name": "project-context",
  "version": "1.0.0",
  "description": "Project-specific context for Gemini",
  "contextFileName": "PROJECT.md"
}
```

### Example 2: MCP Server Extension

```json
{
  "name": "database-tools",
  "version": "1.0.0",
  "description": "Database query and management tools",
  "author": "DB Team",
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

### Example 3: Advanced Extension with Multiple Features

```json
{
  "name": "fullstack-dev",
  "version": "2.0.0",
  "description": "Full-stack development tools and context",
  "author": "Dev Team",
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${extensionPath}/workspace"]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"]
    },
    "database": {
      "command": "node",
      "args": ["${extensionPath}/custom-db-server.js"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432"
      }
    }
  },
  "contextFileName": "FULLSTACK.md",
  "excludeTools": ["experimental-feature"],
  "experimentalSettings": {
    "enableAdvancedMode": true
  }
}
```

## Related Documentation

- [Official Gemini Extensions Docs](https://geminicli.com/docs/extensions/)
- [MCP Server Documentation](https://modelcontextprotocol.io/)
- [PRPM Format Guide](../../docs/formats.mdx)

## Changelog

- **2025-12-05**: Initial format support for Gemini CLI extensions
