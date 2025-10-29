# Searching for Collections in PRPM

This guide covers how to discover and search for collections in PRPM.

## Table of Contents

- [Overview](#overview)
- [Basic Collection Search](#basic-collection-search)
- [Browsing All Collections](#browsing-all-collections)
- [Filtering Collections](#filtering-collections)
- [Viewing Collection Details](#viewing-collection-details)
- [Configuration File Support](#configuration-file-support)
- [Examples](#examples)

---

## Overview

Collections are curated bundles of packages that solve a specific use case. PRPM provides multiple ways to discover collections:

1. **Browse all collections** - List all available collections
2. **Search by keyword** - Find collections matching specific terms
3. **Filter by category** - Browse collections in specific categories
4. **Filter by tags** - Find collections with specific tags
5. **Official vs community** - Filter by collection source

---

## Basic Collection Search

### List All Collections

Display all available collections:

```bash
prpm collections
prpm collections list
```

**Output:**
```
📦 Official Collections:

   @collection/frontend-react-ecosystem        Complete React ecosystem (10 packages)
   @collection/python-backend-complete         Python backend stack (8 packages)
   @collection/vue-fullstack                   Vue.js fullstack (8 packages)
   @collection/devops-infrastructure           DevOps and infrastructure (7 packages)

🌟 Community Collections:

   @username/my-workflow                       Custom workflow (3 packages)
   @team/production-ready                      Production setup (12 packages)
```

### Search Collections by Keyword

Search for collections matching a keyword:

```bash
prpm collections search nextjs
prpm collections search "react typescript"
prpm search --type collection react
```

**Output:**
```
🔍 Found 3 collections matching "nextjs":

📦 @collection/frontend-react-ecosystem
   Complete React ecosystem with Next.js, TypeScript, Tailwind
   Tags: react, nextjs, frontend, typescript
   Packages: 10 | Downloads: 5.4K

📦 @collection/jamstack-modern
   Modern JAMstack with Astro, Eleventy, and Next.js
   Tags: jamstack, nextjs, frontend
   Packages: 6 | Downloads: 2.1K

📦 @user/nextjs-enterprise
   Enterprise Next.js setup
   Tags: nextjs, enterprise, production
   Packages: 15 | Downloads: 892
```

---

## Browsing All Collections

### List with Pagination

```bash
# Show first 20 collections (default)
prpm collections

# Show specific number of results
prpm collections --limit 50

# Show results with offset
prpm collections --offset 20 --limit 20
```

### Sort Collections

```bash
# Sort by downloads (default)
prpm collections --sort downloads

# Sort by name
prpm collections --sort name

# Sort by creation date
prpm collections --sort created

# Sort by update date
prpm collections --sort updated
```

---

## Filtering Collections

### Filter by Category

Collections are organized into categories:

```bash
# Frontend development
prpm collections --category frontend

# Backend development
prpm collections --category backend

# Fullstack development
prpm collections --category fullstack

# DevOps and infrastructure
prpm collections --category devops

# Data science and ML
prpm collections --category data-science

# Mobile development
prpm collections --category mobile

# Testing and QA
prpm collections --category testing
```

**Available categories:**
- `frontend` - Frontend frameworks and tools
- `backend` - Backend frameworks and APIs
- `fullstack` - Complete full-stack setups
- `devops` - DevOps, infrastructure, and CI/CD
- `data-science` - Data science and machine learning
- `mobile` - Mobile app development
- `testing` - Testing frameworks and QA tools
- `security` - Security and authentication
- `performance` - Performance optimization
- `documentation` - Documentation and technical writing

### Filter by Tags

Find collections with specific tags:

```bash
# Single tag
prpm collections --tag react

# Multiple tags (AND logic)
prpm collections --tag react --tag typescript

# Filter with category and tags
prpm collections --category frontend --tag react --tag nextjs
```

**Common tags:**
- **Frontend**: `react`, `vue`, `angular`, `svelte`, `nextjs`, `nuxt`
- **Backend**: `nodejs`, `python`, `java`, `go`, `rust`, `php`
- **Frameworks**: `django`, `flask`, `fastapi`, `express`, `nestjs`
- **Languages**: `typescript`, `javascript`, `python`, `go`, `rust`
- **Tools**: `docker`, `kubernetes`, `terraform`, `aws`, `graphql`

### Filter by Official Status

Show only official PRPM-curated collections:

```bash
prpm collections --official

# Combine with other filters
prpm collections --official --category frontend
```

### Filter by Format

Find collections for specific AI tools:

```bash
# Collections with Cursor packages
prpm collections --format cursor

# Collections with Claude packages
prpm collections --format claude

# Collections with Windsurf packages
prpm collections --format windsurf

# Collections with multiple formats
prpm collections --format cursor --format claude
```

---

## Viewing Collection Details

### View Full Collection Information

Get detailed information about a specific collection:

```bash
prpm collection info @collection/frontend-react-ecosystem
prpm collection info @username/my-workflow
```

**Output:**
```
📦 Frontend React Ecosystem

   Complete React ecosystem with Next.js, TypeScript, Tailwind, testing, and performance

📊 Stats:
   Downloads: 5,420
   Stars: 234
   Version: 1.2.0
   Packages: 10

📋 Included Packages:
   1. ✓ cursor-react@2.1.0
      React component best practices and patterns
   2. ✓ cursor-nextjs@3.0.0
      Next.js 14 app router patterns
   3. ✓ cursor-typescript@1.4.0
      TypeScript strict mode configuration
   4. ○ cursor-tailwind@3.0.1
      Tailwind CSS utility classes (optional)
   5. ✓ cursor-jest@2.0.0
      Jest testing configuration
   ...

💡 Install:
   prpm install @collection/frontend-react-ecosystem
```

### Preview Collection Without Installing

See what would be installed without actually installing:

```bash
prpm collection info @collection/frontend-react-ecosystem --preview
prpm install @collection/frontend-react-ecosystem --dry-run
```

---

## Configuration File Support

PRPM supports configuration files at multiple levels to customize collection search and installation behavior.

### User-Level Configuration (`~/.prpmrc`)

Global configuration in your home directory:

```json
{
  "registryUrl": "https://registry.prpm.dev",
  "defaultFormat": "claude",
  "telemetryEnabled": true,
  "collections": {
    "defaultCategory": "frontend",
    "preferOfficial": true,
    "autoUpdate": false
  }
}
```

### Repository-Level Configuration (`.prpmrc`)

Project-specific configuration in your repository root:

```json
{
  "defaultFormat": "cursor",
  "collections": {
    "installed": [
      "@collection/frontend-react-ecosystem@1.2.0",
      "@collection/testing-complete@2.0.0"
    ],
    "preferredFormats": ["cursor", "claude"],
    "excludeTags": ["experimental"],
    "autoInstall": false
  },
  "cursor": {
    "version": "0.1.0",
    "globs": ["**/*.ts", "**/*.tsx"],
    "author": "Team Name"
  },
  "claude": {
    "model": "sonnet",
    "tools": "Read,Write,Edit,Bash"
  }
}
```

### Configuration Priority

PRPM loads configuration in this order (later overrides earlier):

1. **Default values** - Built-in defaults
2. **User config** (`~/.prpmrc`) - Global user preferences
3. **Repository config** (`.prpmrc`) - Project-specific settings
4. **Environment variables** (`PRPM_REGISTRY_URL`, etc.)
5. **Command-line flags** - Explicit flags override everything

### Repository Configuration Examples

**Frontend React Project:**
```json
{
  "defaultFormat": "cursor",
  "collections": {
    "installed": [
      "@collection/frontend-react-ecosystem@1.2.0"
    ],
    "preferredFormats": ["cursor"],
    "includeTags": ["react", "typescript", "nextjs"]
  },
  "cursor": {
    "version": "0.1.0",
    "globs": ["src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
    "alwaysApply": true,
    "author": "Frontend Team",
    "tags": ["react", "typescript"]
  }
}
```

**Python Backend Project:**
```json
{
  "defaultFormat": "claude",
  "collections": {
    "installed": [
      "@collection/python-backend-complete@2.0.0",
      "@collection/testing-complete@1.5.0"
    ],
    "preferredFormats": ["claude", "generic"]
  },
  "claude": {
    "model": "sonnet",
    "tools": "Read,Write,Edit,Bash,Grep"
  }
}
```

**Full-Stack TypeScript Project:**
```json
{
  "defaultFormat": "cursor",
  "collections": {
    "installed": [
      "@collection/backend-node-typescript@1.0.0",
      "@collection/frontend-react-ecosystem@1.2.0",
      "@collection/database-fullstack@2.1.0",
      "@collection/devops-infrastructure@1.5.0"
    ],
    "preferredFormats": ["cursor", "claude"],
    "autoUpdate": true
  },
  "cursor": {
    "version": "0.1.0",
    "alwaysApply": true
  }
}
```

### Managing Repository Config

```bash
# Initialize repository config
prpm init

# View current repository config
prpm config list --local

# Set repository-level setting
prpm config set defaultFormat cursor --local

# Add installed collection to config
prpm install @collection/frontend-react-ecosystem --save
```

---

## Examples

### Common Search Workflows

**Find React collections:**
```bash
prpm collections search react
prpm collections --tag react --category frontend
```

**Find official Python collections:**
```bash
prpm collections --official --tag python
prpm collections search python --official
```

**Browse all DevOps collections:**
```bash
prpm collections --category devops
```

**Find collections for your tech stack:**
```bash
# Next.js + TypeScript
prpm collections --tag nextjs --tag typescript

# Python + FastAPI + PostgreSQL
prpm collections --tag python --tag fastapi --tag postgresql

# Vue + Nuxt
prpm collections --tag vue --tag nuxt
```

**Search by format:**
```bash
# Find collections for Cursor
prpm collections --format cursor

# Find collections for Claude
prpm collections --format claude
```

### Installation After Search

Once you find a collection:

```bash
# View details
prpm collection info @collection/frontend-react-ecosystem

# Install
prpm install @collection/frontend-react-ecosystem

# Install with specific format
prpm install @collection/frontend-react-ecosystem --format cursor

# Install and skip optional packages
prpm install @collection/frontend-react-ecosystem --skip-optional

# Preview before installing
prpm install @collection/frontend-react-ecosystem --dry-run
```

---

## See Also

- [Collections Overview](./COLLECTIONS.md) - Complete guide to collections
- [Collections Usage](./COLLECTIONS_USAGE.md) - How to use collections
- [CLI Reference](./CLI.md) - Complete CLI command reference
- [Configuration](./CONFIGURATION.md) - Configuration file reference
- [Publishing](./PUBLISHING.md) - How to create and publish collections
