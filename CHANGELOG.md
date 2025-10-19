# Changelog

All notable changes to PRMP (Prompt Package Manager) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-10-18

### Added
- **`prpm publish`** - Publish packages to the PRMP registry
  - Manifest validation (prpm.json)
  - Tarball creation and size limits (10MB max)
  - Dry-run mode for testing
  - Requires authentication via `prpm login`

- **`prpm login`** - Authenticate with the registry
  - GitHub OAuth flow with local callback server
  - Manual token authentication option (`--token`)
  - Stores credentials in `~/.prpmrc`

- **`prpm whoami`** - Show currently logged-in user

- **User configuration system** (`~/.prpmrc`)
  - Registry URL configuration
  - Authentication token storage
  - Telemetry preferences

- **Error handling and retry logic**
  - Automatic retry for network errors (3 attempts)
  - Exponential backoff (1s, 2s, 4s)
  - Rate limiting handling (429 responses with Retry-After)
  - Server error retries (5xx responses)

- **Migration creation tool**
  - `npm run migrate:create <name>` in registry directory
  - Generates timestamped SQL migration files

### Changed
- **Registry client** now requires user config parameter
  - All search/install/info/trending commands updated
  - Configuration loaded from `~/.prpmrc`

- **Popular command** now delegates to trending
  - Shows all-time popular packages
  - Supports type filtering

- **Version bumped** from 1.1.0 to 1.2.0

### Fixed
- Missing `scripts/scraped/` directory created
- Added `.gitignore` for scripts directory
- Added missing package dependencies:
  - `form-data` for multipart uploads
  - `@types/tar` for TypeScript support

## [1.1.0] - 2025-10-17

### Added
- **Registry integration** - Complete CLI integration with PRMP registry
  - `prpm search <query>` - Search packages
  - `prpm install <package>` - Install from registry
  - `prpm info <package>` - Package details
  - `prpm trending` - Trending packages

- **Registry backend** - Complete Fastify-based API
  - PostgreSQL database with full-text search
  - GitHub OAuth authentication
  - Package publishing endpoints
  - S3 storage integration
  - Redis caching layer
  - OpenSearch support (Phase 2)

- **Infrastructure as Code** - Complete Pulumi setup
  - 8 modular components (VPC, RDS, Redis, S3, ECS, etc.)
  - GitHub Actions CI/CD (4 workflows)
  - AWS deployment guide
  - Cost: ~$70/mo dev, ~$100-150/mo prod

- **Bootstrap system** - Scraper and seed scripts
  - GitHub scraper for cursor rules
  - Bulk upload script
  - Package claiming metadata
  - Author outreach templates (5 variations)

### Changed
- Updated README with registry information
- Added comprehensive documentation:
  - BOOTSTRAP_GUIDE.md
  - DEPLOYMENT_GUIDE.md
  - INFRASTRUCTURE_SUMMARY.md
  - PROGRESS_NOTES.md
  - QUICK_START.md

## [1.0.0] - 2025-10-13

### Added
- **Initial release** - CLI for managing prompt files
  - `prpm add <url>` - Add prompts from URL
  - `prpm list` - List installed prompts
  - `prpm remove <id>` - Remove prompts
  - `prpm index` - Generate index of prompts

- **Package types supported:**
  - Cursor rules (`.cursorrules`)
  - Claude agents (`.clinerules`)
  - Continue configs (`.continuerc.json`)
  - Windsurf rules (`.windsurfrules`)

- **Telemetry** - PostHog integration
  - Opt-in/opt-out via `prpm telemetry`
  - Anonymous usage tracking

- **Binary builds** - Native executables
  - macOS (x64, ARM64)
  - Linux (x64)
  - Windows (x64)

---

## Upcoming Features

### v1.3.0 (Planned)
- Format conversion (cursor ↔ claude ↔ continue)
- Preview mode (test prompts before installing)
- Package testing framework
- Quality scoring algorithm
- Package recommendations

### v1.4.0 (Planned)
- Organization management
- Team collaboration features
- Private registries
- Package dependencies resolution
- CLI auto-update

### v2.0.0 (Future)
- Plugin system for IDE integrations
- Web dashboard
- Package analytics
- Revenue sharing for creators
- Enterprise features (SSO, SAML)

---

## Migration Guide

### Upgrading from 1.1.0 to 1.2.0

1. **Update CLI:**
   ```bash
   npm install -g prpm@1.2.0
   ```

2. **Login to registry:**
   ```bash
   prpm login
   ```
   This creates `~/.prpmrc` with your credentials.

3. **Publish your packages:**
   ```bash
   cd your-package-directory
   prpm publish
   ```

### Breaking Changes

None. This release is fully backward compatible with 1.1.0.

---

## Links

- [GitHub Repository](https://github.com/khaliqgant/prompt-package-manager)
- [Registry](https://registry.prpm.dev)
- [Documentation](https://docs.prpm.dev)
- [Report Issues](https://github.com/khaliqgant/prompt-package-manager/issues)
