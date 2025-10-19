# Contributing to PRPM

Thank you for your interest in contributing to the Prompt Package Manager! This guide will help you get started.

## 📦 Ways to Contribute

### 1. Submit Packages

Share your Cursor rules, Claude skills, or AI agents with the community.

#### Quick Start

```bash
# Install PRPM
npm install -g prmp

# Login to the registry
prpm login

# Publish your package
prpm publish
```

#### Package Structure

Create a `package.prpm.json` file:

```json
{
  "name": "my-awesome-rule",
  "version": "1.0.0",
  "description": "A helpful Cursor rule for...",
  "type": "cursor",
  "category": "code-quality",
  "tags": ["typescript", "testing", "best-practices"],
  "author": "your-username",
  "license": "MIT",
  "content": "./rule.md"
}
```

**Supported Types:**
- `cursor` - Cursor IDE rules (.cursorrules)
- `agent` - Claude Code agents
- `skill` - Claude skills
- `continue` - Continue prompts
- `windsurf` - Windsurf rules
- `mcp` - MCP servers

**Categories:**
- `code-quality` - Linting, formatting, best practices
- `testing` - TDD, test patterns, coverage
- `debugging` - Systematic debugging workflows
- `architecture` - Design patterns, system design
- `security` - Security best practices
- `performance` - Optimization techniques
- `documentation` - Doc generation, comments
- `framework` - Framework-specific (React, Next.js, etc.)
- `general` - General-purpose prompts

### 2. Create Collections

Bundle related packages for complete workflow setups.

**Example: `collection.prpm.json`**

```json
{
  "scope": "@collection",
  "id": "nextjs-pro",
  "name": "Next.js Professional Setup",
  "version": "1.0.0",
  "description": "Complete Next.js development environment",
  "category": "frontend",
  "packages": [
    {
      "id": "react-best-practices",
      "version": "^1.0.0",
      "required": true
    },
    {
      "id": "typescript-strict",
      "version": "^1.0.0",
      "required": true
    },
    {
      "id": "tailwind-helper",
      "version": "^1.0.0",
      "required": false
    }
  ]
}
```

### 3. Improve Core Code

Contribute to the PRPM CLI, registry, or format converters.

#### Development Setup

```bash
# Clone the repository
git clone https://github.com/khaliqgant/prompt-package-manager.git
cd prompt-package-manager

# Install dependencies
npm install

# Build all packages
npm run build

# Start Docker services (PostgreSQL, Redis, MinIO)
docker compose up -d

# Run tests
npm test

# Start development
npm run dev:cli     # CLI development
npm run dev:registry # Registry server
```

#### Project Structure

```
prompt-package-manager/
├── packages/
│   ├── cli/              # CLI tool
│   ├── registry/         # Backend API
│   ├── registry-client/  # API client library
│   └── karen-action/     # Karen GitHub Action
├── docs/                 # Documentation
└── .claude/              # Claude Code agents
```

### 4. Write Documentation

Help improve guides, examples, and API documentation.

- **Getting started guides** - Help new users
- **Package examples** - Show real-world use cases
- **API documentation** - Document registry endpoints
- **Video tutorials** - Create walkthroughs

## 🧪 Testing Guidelines

### CLI Tests

```bash
cd packages/cli
npm test
```

### Registry Tests

```bash
cd packages/registry
npm test
```

### E2E Tests

```bash
# Start Docker services from project root
docker compose up -d

# Run migrations
cd packages/registry
npm run migrate

# Run E2E tests
npm run test:e2e
```

## 📝 Code Quality Standards

### TypeScript

- Use strict type checking
- Avoid `any` types
- Document complex types
- Export reusable types

### Naming Conventions

- **Files**: kebab-case (e.g., `install-command.ts`)
- **Classes**: PascalCase (e.g., `PackageManager`)
- **Functions**: camelCase (e.g., `installPackage`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_REGISTRY`)

### Commit Messages

Follow conventional commits:

```
feat: add collections support to CLI
fix: resolve package conflict errors
docs: update installation guide
test: add E2E tests for search
chore: update dependencies
```

## 🔐 Security

**Report vulnerabilities privately** to security@prmp.dev

**Do NOT:**
- Commit API keys or secrets
- Expose user data
- Include malicious code
- Violate package licenses

## 🎯 Package Submission Guidelines

### Quality Standards

✅ **Good Package:**
- Clear, descriptive name
- Helpful description
- Proper categorization
- Tested and working
- Well-documented
- Appropriate license

❌ **Rejected:**
- Malicious code
- Copyright violations
- Duplicate submissions
- Spam or low-quality
- Offensive content

### Review Process

1. **Automated checks** - Syntax, format validation
2. **Manual review** - Content quality, security
3. **Testing** - Verify package works
4. **Approval** - Published to registry
5. **Monitoring** - Track downloads, issues

**Typical review time:** 24-48 hours

## 🏆 Recognition

Top contributors get:

- **Verified badge** on packages
- **Featured author** status
- **Early access** to new features
- **Swag** (stickers, shirts)

## 📞 Getting Help

- **GitHub Issues** - Bug reports, feature requests
- **Discussions** - Questions, ideas, community chat
- **Discord** - Real-time help (coming soon)
- **Email** - support@prmp.dev

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Quick Links

- [Installation Guide](docs/INSTALLATION.md)
- [CLI Reference](docs/CLI.md)
- [Publishing Guide](docs/PUBLISHING.md)
- [Format Conversion](docs/FORMAT_CONVERSION.md)
- [Collections](docs/COLLECTIONS.md)

---

**Happy Contributing!** 🚀

Made with 💙 by the PRPM community
