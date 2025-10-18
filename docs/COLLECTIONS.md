# Collections System Design

**Status**: Design document
**Goal**: Enable curated bundles of packages for one-command setup

---

## Overview

Collections are curated bundles of packages that solve a specific use case. Think of them as "starter packs" or "meta-packages" that install multiple related prompts/agents at once.

```bash
# Instead of:
prmp install react-best-practices
prmp install typescript-rules
prmp install tailwind-helper
prmp install component-generator
prmp install testing-guide

# Users do:
prmp install @collection/nextjs-pro
```

---

## User Experience

### Discovery

```bash
# Browse collections
prmp collections

# Output:
📦 Official Collections:
   @collection/nextjs-pro        - Next.js + TypeScript + Tailwind (5 packages)
   @collection/react-fullstack   - React + Node + PostgreSQL (8 packages)
   @collection/python-data       - Python data science tools (6 packages)

🌟 Community Collections:
   @user/my-workflow            - Custom workflow (3 packages)
   @vercel/production-ready     - Production-grade setup (12 packages)

# Search collections
prmp collections search nextjs
prmp collections --tag react
```

### Installation

```bash
# Install entire collection
prmp install @collection/nextjs-pro

# Output:
📦 Installing collection: nextjs-pro (5 packages)

  1/5 ✓ react-best-practices@2.1.0
  2/5 ✓ typescript-strict@1.4.0
  3/5 ✓ tailwind-helper@3.0.1
  4/5 ✓ nextjs-patterns@2.0.0
  5/5 ✓ component-architect@1.2.0

✅ Collection installed: 5/5 packages
📁 Saved to: .cursor/rules/ and .claude/agents/

💡 What's included:
   - React component best practices
   - TypeScript strict mode configuration
   - Tailwind CSS helper prompts
   - Next.js 14 app router patterns
   - Component architecture guidance

# Install specific version
prmp install @collection/nextjs-pro@1.0.0

# Preview without installing
prmp collection info nextjs-pro
```

### Creating Collections

```bash
# Initialize new collection
prmp collection create my-workflow

# Interactive prompts:
? Collection name: my-workflow
? Description: My custom development workflow
? Visibility: public / private
? Category: Development

# Add packages
prpm collection add my-workflow react-best-practices
prpm collection add my-workflow typescript-rules@2.0.0

# Publish
prpm collection publish my-workflow
```

---

## Data Model

### Collection Manifest

```typescript
interface Collection {
  // Metadata
  id: string;                    // 'nextjs-pro'
  scope: string;                 // 'collection' (official) or username
  name: string;                  // 'Next.js Professional Setup'
  description: string;
  version: string;               // '1.2.0'

  // Ownership
  author: string;                // 'prmp-team' or username
  maintainers: string[];
  official: boolean;             // Official PRPM collection
  verified: boolean;             // Verified author

  // Classification
  category: 'development' | 'design' | 'data-science' | 'devops' | 'general';
  tags: string[];                // ['react', 'nextjs', 'typescript']
  framework?: string;            // 'nextjs', 'react', 'vue', etc.

  // Packages
  packages: CollectionPackage[];

  // Stats
  downloads: number;
  stars: number;
  created_at: Date;
  updated_at: Date;

  // Display
  icon?: string;                 // Emoji or URL
  banner?: string;               // URL to banner image
  readme?: string;               // Detailed README

  // Configuration
  config?: {
    defaultFormat?: 'cursor' | 'claude' | 'continue' | 'windsurf';
    installOrder?: 'sequential' | 'parallel';
    postInstall?: string;        // Script to run after install
  };
}

interface CollectionPackage {
  packageId: string;             // 'react-best-practices'
  version?: string;              // '2.1.0' or 'latest'
  required: boolean;             // If false, user can opt-out
  reason?: string;               // Why this package is included
  as?: string;                   // Override format for this package
}

// Example
{
  id: 'nextjs-pro',
  scope: 'collection',
  name: 'Next.js Professional Setup',
  description: 'Production-ready Next.js development with TypeScript and Tailwind',
  version: '1.2.0',
  author: 'prpm-team',
  official: true,
  verified: true,
  category: 'development',
  tags: ['react', 'nextjs', 'typescript', 'tailwind'],
  framework: 'nextjs',
  packages: [
    {
      packageId: 'react-best-practices',
      version: '2.1.0',
      required: true,
      reason: 'Core React patterns and component guidelines',
    },
    {
      packageId: 'typescript-strict',
      version: 'latest',
      required: true,
      reason: 'TypeScript strict mode configuration and type patterns',
    },
    {
      packageId: 'tailwind-helper',
      version: '3.0.1',
      required: false,
      reason: 'Tailwind CSS utility classes and responsive design',
    },
    {
      packageId: 'nextjs-patterns',
      version: '2.0.0',
      required: true,
      reason: 'Next.js 14 app router patterns and server components',
    },
    {
      packageId: 'component-architect',
      version: '1.2.0',
      required: false,
      reason: 'Component architecture and folder structure guidance',
    },
  ],
  downloads: 5420,
  stars: 234,
  icon: '⚡',
  config: {
    defaultFormat: 'cursor',
    installOrder: 'sequential',
  },
}
```

---

## Database Schema

### collections table

```sql
CREATE TABLE collections (
  id VARCHAR(255) PRIMARY KEY,
  scope VARCHAR(100) NOT NULL,        -- 'collection' or username
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(50) NOT NULL,

  author VARCHAR(255) NOT NULL,
  maintainers TEXT[],                 -- Array of usernames
  official BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,

  category VARCHAR(100),
  tags TEXT[],
  framework VARCHAR(100),

  downloads INTEGER DEFAULT 0,
  stars INTEGER DEFAULT 0,

  icon VARCHAR(255),
  banner VARCHAR(500),
  readme TEXT,

  config JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(scope, id, version)
);

CREATE INDEX idx_collections_scope ON collections(scope);
CREATE INDEX idx_collections_category ON collections(category);
CREATE INDEX idx_collections_tags ON collections USING GIN(tags);
CREATE INDEX idx_collections_downloads ON collections(downloads DESC);
CREATE INDEX idx_collections_official ON collections(official);
```

### collection_packages table

```sql
CREATE TABLE collection_packages (
  collection_id VARCHAR(255),
  collection_version VARCHAR(50),

  package_id VARCHAR(255) NOT NULL,
  package_version VARCHAR(50),

  required BOOLEAN DEFAULT TRUE,
  reason TEXT,
  install_order INTEGER DEFAULT 0,
  format_override VARCHAR(50),

  PRIMARY KEY (collection_id, collection_version, package_id),
  FOREIGN KEY (collection_id, collection_version)
    REFERENCES collections(id, version) ON DELETE CASCADE,
  FOREIGN KEY (package_id)
    REFERENCES packages(id) ON DELETE CASCADE
);

CREATE INDEX idx_collection_packages_package ON collection_packages(package_id);
```

### collection_installs table

```sql
CREATE TABLE collection_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id VARCHAR(255),
  collection_version VARCHAR(50),
  user_id UUID,

  installed_at TIMESTAMP DEFAULT NOW(),
  format VARCHAR(50),

  FOREIGN KEY (collection_id, collection_version)
    REFERENCES collections(id, version)
);

-- Track downloads for analytics
CREATE INDEX idx_collection_installs_collection ON collection_installs(collection_id);
CREATE INDEX idx_collection_installs_date ON collection_installs(installed_at);
```

---

## API Endpoints

### GET /api/v1/collections

List collections with filters

```typescript
GET /api/v1/collections?category=development&tag=react&official=true

Response:
{
  collections: [
    {
      id: 'nextjs-pro',
      scope: 'collection',
      name: 'Next.js Professional Setup',
      description: '...',
      version: '1.2.0',
      author: 'prmp-team',
      official: true,
      packageCount: 5,
      downloads: 5420,
      stars: 234,
      tags: ['react', 'nextjs', 'typescript'],
    },
    // ...
  ],
  total: 42,
  page: 1,
  perPage: 20,
}
```

### GET /api/v1/collections/:scope/:id

Get collection details

```typescript
GET /api/v1/collections/collection/nextjs-pro

Response:
{
  id: 'nextjs-pro',
  scope: 'collection',
  name: 'Next.js Professional Setup',
  description: '...',
  version: '1.2.0',
  packages: [
    {
      packageId: 'react-best-practices',
      version: '2.1.0',
      required: true,
      reason: 'Core React patterns...',
      package: {
        name: 'React Best Practices',
        description: '...',
        downloads: 12000,
      },
    },
    // ...
  ],
  downloads: 5420,
  stars: 234,
  readme: '# Next.js Pro Collection\n\n...',
}
```

### POST /api/v1/collections

Create new collection (requires auth)

```typescript
POST /api/v1/collections
Authorization: Bearer <token>

Body:
{
  id: 'my-workflow',
  name: 'My Workflow',
  description: 'Custom development workflow',
  category: 'development',
  tags: ['react', 'custom'],
  packages: [
    { packageId: 'react-best-practices', version: 'latest', required: true },
    { packageId: 'typescript-rules', version: '2.0.0', required: true },
  ],
}

Response:
{
  id: 'my-workflow',
  scope: 'username',
  version: '1.0.0',
  // ... full collection object
}
```

### PUT /api/v1/collections/:scope/:id

Update collection (requires auth + ownership)

```typescript
PUT /api/v1/collections/username/my-workflow
Authorization: Bearer <token>

Body:
{
  description: 'Updated description',
  packages: [
    // Updated package list
  ],
}
```

### POST /api/v1/collections/:scope/:id/install

Track collection installation

```typescript
POST /api/v1/collections/collection/nextjs-pro/install

Body:
{
  version: '1.2.0',
  format: 'cursor',
}

Response:
{
  success: true,
  packagesToInstall: [
    { packageId: 'react-best-practices', version: '2.1.0', format: 'cursor' },
    { packageId: 'typescript-strict', version: 'latest', format: 'cursor' },
    // ...
  ],
}
```

---

## CLI Implementation

### List Command

```typescript
// src/commands/collections.ts

export async function handleCollectionsList(options: {
  category?: string;
  tag?: string;
  official?: boolean;
}): Promise<void> {
  const config = await getConfig();
  const client = getRegistryClient(config);

  const collections = await client.getCollections(options);

  console.log('📦 Official Collections:');
  collections
    .filter(c => c.official)
    .forEach(c => {
      console.log(`   @${c.scope}/${c.id}`.padEnd(35) +
                  `- ${c.name} (${c.packageCount} packages)`);
    });

  console.log('\n🌟 Community Collections:');
  collections
    .filter(c => !c.official)
    .forEach(c => {
      console.log(`   @${c.scope}/${c.id}`.padEnd(35) +
                  `- ${c.name} (${c.packageCount} packages)`);
    });
}
```

### Info Command

```typescript
export async function handleCollectionInfo(collectionSpec: string): Promise<void> {
  const [scope, id] = parseCollectionSpec(collectionSpec); // '@collection/nextjs-pro'

  const config = await getConfig();
  const client = getRegistryClient(config);

  const collection = await client.getCollection(scope, id);

  console.log(`\n📦 ${collection.name}`);
  console.log(`   ${collection.description}\n`);

  console.log(`📊 Stats:`);
  console.log(`   Downloads: ${collection.downloads.toLocaleString()}`);
  console.log(`   Stars: ${collection.stars.toLocaleString()}`);
  console.log(`   Version: ${collection.version}`);
  console.log(`   Packages: ${collection.packages.length}\n`);

  console.log(`📋 Included Packages:`);
  collection.packages.forEach((pkg, i) => {
    const required = pkg.required ? '✓' : '○';
    console.log(`   ${i + 1}. ${required} ${pkg.packageId}@${pkg.version || 'latest'}`);
    if (pkg.reason) {
      console.log(`      ${pkg.reason}`);
    }
  });

  console.log(`\n💡 Install:`);
  console.log(`   prmp install @${scope}/${id}`);
}
```

### Install Command

```typescript
export async function handleCollectionInstall(
  collectionSpec: string,
  options: {
    format?: string;
    skipOptional?: boolean;
    dryRun?: boolean;
  }
): Promise<void> {
  const [scope, id, version] = parseCollectionSpec(collectionSpec);

  const config = await getConfig();
  const client = getRegistryClient(config);

  // Get collection details
  const collection = await client.getCollection(scope, id, version);

  console.log(`📦 Installing collection: ${collection.name} (${collection.packages.length} packages)\n`);

  // Determine format
  const format = options.format ||
                 collection.config?.defaultFormat ||
                 config.defaultFormat ||
                 detectProjectFormat() ||
                 'cursor';

  // Filter packages
  const packagesToInstall = collection.packages.filter(pkg =>
    !options.skipOptional || pkg.required
  );

  if (options.dryRun) {
    console.log('🔍 Dry run - would install:');
    packagesToInstall.forEach((pkg, i) => {
      console.log(`   ${i + 1}/${packagesToInstall.length} ${pkg.packageId}@${pkg.version || 'latest'}`);
    });
    return;
  }

  // Track installation
  await client.trackCollectionInstall(scope, id, version, format);

  // Install packages sequentially or in parallel
  const installOrder = collection.config?.installOrder || 'sequential';

  if (installOrder === 'sequential') {
    for (let i = 0; i < packagesToInstall.length; i++) {
      const pkg = packagesToInstall[i];
      console.log(`  ${i + 1}/${packagesToInstall.length} Installing ${pkg.packageId}...`);

      try {
        await installPackage(pkg.packageId, {
          version: pkg.version,
          format: pkg.as || format,
        });
        console.log(`  ${i + 1}/${packagesToInstall.length} ✓ ${pkg.packageId}`);
      } catch (error) {
        console.error(`  ${i + 1}/${packagesToInstall.length} ✗ ${pkg.packageId}: ${error.message}`);
        if (pkg.required) {
          throw new Error(`Failed to install required package: ${pkg.packageId}`);
        }
      }
    }
  } else {
    // Parallel installation
    const results = await Promise.allSettled(
      packagesToInstall.map(pkg => installPackage(pkg.packageId, {
        version: pkg.version,
        format: pkg.as || format,
      }))
    );

    results.forEach((result, i) => {
      const pkg = packagesToInstall[i];
      if (result.status === 'fulfilled') {
        console.log(`  ${i + 1}/${packagesToInstall.length} ✓ ${pkg.packageId}`);
      } else {
        console.log(`  ${i + 1}/${packagesToInstall.length} ✗ ${pkg.packageId}: ${result.reason}`);
      }
    });
  }

  console.log(`\n✅ Collection installed: ${packagesToInstall.length} packages`);

  // Run post-install script if defined
  if (collection.config?.postInstall) {
    console.log(`\n⚡ Running post-install script...`);
    await runPostInstallScript(collection.config.postInstall);
  }
}
```

---

## Official Collections

### Starter Collections

```yaml
# nextjs-pro
name: Next.js Professional Setup
packages:
  - react-best-practices@2.1.0
  - typescript-strict@latest
  - tailwind-helper@3.0.1
  - nextjs-patterns@2.0.0
  - component-architect@1.2.0
category: development
tags: [react, nextjs, typescript, tailwind]

# python-data
name: Python Data Science
packages:
  - pandas-helper@1.0.0
  - numpy-patterns@latest
  - matplotlib-guide@2.0.0
  - jupyter-best-practices@1.5.0
  - data-cleaning-rules@latest
  - ml-workflow@1.0.0
category: data-science
tags: [python, data-science, ml]

# vue-fullstack
name: Vue.js Full Stack
packages:
  - vue3-composition@latest
  - typescript-vue@2.0.0
  - pinia-patterns@1.0.0
  - nuxt3-guide@latest
  - api-design-patterns@2.1.0
category: development
tags: [vue, typescript, fullstack]
```

---

## Advanced Features

### 1. Collection Dependencies

Collections can depend on other collections:

```typescript
{
  id: 'enterprise-nextjs',
  extends: '@collection/nextjs-pro',  // Base collection
  additionalPackages: [
    { packageId: 'auth-patterns', version: 'latest' },
    { packageId: 'monitoring-setup', version: '1.0.0' },
  ],
}
```

### 2. Conditional Packages

Packages can be installed conditionally:

```typescript
{
  packages: [
    {
      packageId: 'react-native-rules',
      required: false,
      condition: 'file:package.json contains "react-native"',
    },
  ],
}
```

### 3. User Customization

Users can customize before installing:

```bash
prmp install @collection/nextjs-pro --customize

# Interactive prompts:
? Include Tailwind CSS helper? (Y/n)
? Include testing utilities? (Y/n)
? Include API design patterns? (Y/n)

# Only installs selected packages
```

### 4. Collection Templates

Collections can include config templates:

```typescript
{
  id: 'nextjs-pro',
  templates: [
    {
      path: '.cursorrules',
      content: '# Generated by PRPM\n\n{{packages}}',
    },
    {
      path: 'prmp.config.json',
      content: '{"collection": "nextjs-pro", "version": "1.2.0"}',
    },
  ],
}
```

---

## Curation & Quality Control

### Official Collections

**Criteria**:
- Maintained by PRPM team
- High-quality packages only
- Regular updates
- Comprehensive testing
- Clear documentation

**Review process**:
1. Community proposal
2. PRPM team review
3. Package quality check
4. Beta testing period
5. Official promotion

### Community Collections

**Requirements**:
- Minimum 3 packages
- All packages must exist in registry
- Description required
- At least one tag/category

**Quality indicators**:
- Stars from users
- Download count
- Maintenance activity
- User reviews

---

## Business Logic Summary

1. **Discovery**: Browse/search collections like packages
2. **Installation**: One command installs multiple packages
3. **Creation**: Anyone can create collections
4. **Official**: PRPM-curated collections for quality
5. **Tracking**: Analytics on collection usage
6. **Flexibility**: Optional packages, conditional installs
7. **Templates**: Collections can include config files

**Key benefit**: Reduces friction from "install 10 packages" to "install 1 collection"
