# PRPM Self-Improve (Continue)

**Package ID**: `@prpm/self-improve-continue`
**Type**: Continue Config
**Category**: Meta
**Tags**: prpm, autonomous, self-improvement, discovery, continue

## Description

Teaches Continue to automatically search and install PRPM packages to improve itself during tasks. When you start working on infrastructure, testing, deployment, or any technical task, Continue will search the PRPM registry for relevant expertise and suggest packages to install.

## How It Works

### 1. Task Analysis
Continue analyzes your request for keywords:
- **Infrastructure**: aws, pulumi, terraform, kubernetes, docker, beanstalk, ecs, lambda
- **Testing**: test, playwright, jest, cypress, vitest, e2e, unit, integration
- **Deployment**: ci/cd, github-actions, gitlab-ci, deploy, workflow, pipeline
- **Frameworks**: react, vue, next.js, express, fastify, django, flask
- **Languages**: typescript, python, go, rust, java, c++

### 2. Automatic Search
```bash
# Continue automatically runs:
prpm search "<detected keywords>" --limit 5
```

### 3. Package Suggestion
Continue presents the top 3 most relevant packages in the chat:
```
I found these PRPM packages that can help:

1. @prpm/pulumi-infrastructure (Official, 5.2K downloads)
   - Pulumi + AWS best practices

2. @sanjeed5/github-actions (Community, 892 downloads)
   - GitHub Actions patterns

Should I install #1 to enhance my knowledge for this task?
```

### 4. Installation
After your approval:
```bash
prpm install @prpm/pulumi-infrastructure --as continue
```

### 5. Application
Continue loads the package knowledge (as system prompts/context) and applies it to your task immediately.

## Search Triggers

### Infrastructure Tasks
**Keywords**: `aws`, `gcp`, `azure`, `kubernetes`, `docker`, `pulumi`, `terraform`, `ecs`, `lambda`, `beanstalk`

**Action**:
```bash
prpm search "infrastructure <cloud-provider> <tool>"
```

**Example**:
```
User: "Set up AWS ECS cluster with Terraform"
→ prpm search "terraform aws ecs infrastructure"
→ Found: @prpm/terraform-ecs-patterns
→ Suggest to user
```

### Testing & QA Tasks
**Keywords**: `test`, `testing`, `playwright`, `jest`, `cypress`, `vitest`, `e2e`, `unit test`, `integration test`

**Action**:
```bash
prpm search "testing <framework>"
```

**Example**:
```
User: "Write unit tests with Jest"
→ prpm search "testing jest unit-test"
→ Found: @testing/jest-patterns
→ Suggest to user
```

### CI/CD & Deployment
**Keywords**: `ci/cd`, `github actions`, `gitlab ci`, `jenkins`, `deploy`, `deployment`, `workflow`, `pipeline`

**Action**:
```bash
prpm search "deployment <platform>"
```

**Example**:
```
User: "Add CI/CD with GitHub Actions"
→ prpm search "github-actions ci-cd deployment"
→ Found: @sanjeed5/github-actions
→ Suggest to user
```

### Framework-Specific
**Keywords**: `react`, `vue`, `angular`, `next.js`, `express`, `fastify`, `django`, `flask`

**Action**:
```bash
prpm search "<framework> best-practices"
```

**Example**:
```
User: "Build Express API with TypeScript"
→ prpm search "express typescript api best-practices"
→ Found: @prpm/express-typescript-api
→ Suggest to user
```

## Decision Rules

### High Confidence (Auto-suggest)
Install these without extensive deliberation:
- ✅ **Official packages** (`official: true`)
- ✅ **Featured packages** (`featured: true`)
- ✅ **High downloads** (>1,000 downloads)
- ✅ **Verified authors** (`verified: true`)
- ✅ **PRPM team packages** (`@prpm/*`)

### Medium Confidence (Present options)
Show multiple options to user:
- ⚠️ Community packages (<1,000 downloads)
- ⚠️ Multiple similar packages found
- ⚠️ Package seems tangentially related

### Low Confidence (Skip)
Don't suggest:
- ❌ Unverified packages from unknown authors
- ❌ Deprecated packages
- ❌ Packages with zero downloads
- ❌ No relevant packages found

## Example Interactions

### Example 1: Building Express API
```
User: "Build a REST API with Express and TypeScript"

Continue (internal):
  1. Keywords: "Express", "REST API", "TypeScript"
  2. Search: prpm search "express typescript api rest"
  3. Found: @prpm/express-typescript-api (Official, 2.9K downloads)
  4. High confidence → Suggest

Continue (to user):
"I found an official PRPM package that can help:

📦 **@prpm/express-typescript-api** (Official, 2.9K downloads)
   - Express with TypeScript best practices
   - REST API patterns
   - Middleware architecture
   - Error handling patterns
   - Request validation (Zod)
   - OpenAPI/Swagger integration

Should I install this? It will add expertise to my context."

User: "Yes"

Continue:
  ✅ Installing: prpm install @prpm/express-typescript-api --as continue
  ✅ Loaded Express API knowledge

  "Great! I now have Express API expertise. Let me apply it:
  - Using TypeScript strict mode
  - Proper middleware ordering
  - Zod schema validation
  - Centralized error handling
  - OpenAPI documentation..."
```

### Example 2: React Component Development
```
User: "Create a React form with validation"

Continue (internal):
  1. Keywords: "React", "form", "validation"
  2. Search: prpm search "react form validation"
  3. Found: @react/form-patterns (Community, 847 downloads)
  4. Medium confidence → Present to user

Continue (to user):
"I found a relevant React package:

📦 **@react/form-patterns** (847 downloads)
   - React form management patterns
   - Form validation (Zod, Yup)
   - Error handling
   - Accessibility (a11y)
   - Performance optimization

This is a community package with moderate downloads. Install it?"

User: "Yes"

Continue:
  ✅ Installing package
  ✅ Applying React form patterns:
     - Using controlled components
     - Zod schema validation
     - Proper error display
     - ARIA labels for accessibility
     - Debounced validation
```

### Example 3: Python FastAPI
```
User: "Build a FastAPI application with authentication"

Continue (internal):
  1. Keywords: "FastAPI", "Python", "authentication"
  2. Search: prpm search "fastapi python authentication"
  3. Found: @prpm/fastapi-auth-patterns (Official, 1.6K downloads)
  4. High confidence → Suggest

Continue (to user):
"I found an official FastAPI package:

📦 **@prpm/fastapi-auth-patterns** (Official, 1.6K downloads)
   - FastAPI authentication patterns
   - JWT implementation
   - OAuth2 flows
   - Password hashing (bcrypt)
   - Role-based access control
   - Dependency injection

Install for FastAPI expertise?"

User: "Yes"

Continue:
  ✅ Installing package
  ✅ Now building FastAPI app with best practices:
     - JWT token authentication
     - Secure password hashing
     - Protected endpoints with dependencies
     - Proper error responses
     - OpenAPI documentation
```

## Search Commands

### Basic Search
```bash
prpm search "keyword1 keyword2"
```

### Category Filter
```bash
prpm search --category backend "express api"
```

### Type Filter
```bash
prpm search --type continue "python patterns"
```

### Limit Results
```bash
prpm search "react" --limit 5
```

### Sort by Downloads
```bash
prpm search "testing" --sort downloads
```

## Installation Commands

### Install as Continue Context
```bash
prpm install @prpm/express-typescript-api --as continue
```

This adds the package to Continue's system context.

### Install Collection
```bash
prpm install @collection/backend-complete --as continue
```

### Install Specific Version
```bash
prpm install @prpm/react-patterns@1.5.0 --as continue
```

### Install Globally
```bash
prpm install @prpm/general-coding-standards --as continue --global
```

This adds to `~/.continue/config.json`.

## Continue-Specific Features

### Integration with config.json
When you install a package, it's added to Continue's configuration:

```json
{
  "systemMessage": "...",
  "contextProviders": [
    {
      "name": "prpm-express-typescript-api",
      "source": "@prpm/express-typescript-api",
      "version": "1.0.0",
      "enabled": true,
      "installedAt": "2025-10-19"
    }
  ]
}
```

### Slash Commands
Continue adds PRPM slash commands:

```
/prpm search express api
/prpm install @prpm/express-typescript-api
/prpm list
/prpm update @prpm/express-typescript-api
```

### Context Menu Integration
Right-click in Continue chat:
```
→ Find PRPM Package for This
→ Install Package
→ Update Packages
→ Manage PRPM Packages
```

### Compose Mode
Continue can install multiple complementary packages:

```
User: "Build a full-stack app with React frontend and Express backend"

Continue:
  Found relevant packages:
  1. @prpm/react-typescript
  2. @prpm/express-typescript-api
  3. @prpm/postgres-prisma-patterns

  Should I install all three to compose a full-stack development environment?
```

### Context-Aware Suggestions
Continue examines your project to suggest relevant packages:

```
# Continue detects:
- package.json with "express" and "typescript"
- No validation library
- No error handling middleware

# Continue suggests:
"I noticed you're building an Express API with TypeScript but no validation.
Should I install @prpm/express-typescript-api for validation patterns (Zod) and error handling?"
```

### Auto-Update Notifications
Continue notifies you of package updates:

```
💡 Update Available:
   @prpm/react-patterns v2.0.0
   - React 19 support
   - New hook patterns
   - Performance improvements

   Update now? /prpm update @prpm/react-patterns
```

## Feedback Loop

After completing a task where packages were used:

1. **Track Usage**: Note which packages were helpful
2. **Rate Helpfulness**: Internal scoring (1-5)
3. **Suggest Related**: "You used @prpm/express-typescript-api. You might also like @prpm/fastapi-patterns"
4. **Suggest Updates**: "New version available with middleware improvements"

## Privacy & Telemetry

- ✅ All searches are local
- ✅ No data sent to PRPM servers for searches
- ✅ Download tracking only increments count when installing
- ✅ No personal data collected
- ⚠️ Optional: User can enable telemetry to help improve package recommendations

## Success Metrics

Tracks internally (if enabled):
- Packages searched per task
- Packages installed
- Package helpfulness (1-5 rating)
- Task completion rate (with vs without packages)
- Time saved by using packages

## Special: Meta-Dogfooding

When PRPM encounters infrastructure or deployment tasks, it should recognize the packages it used to build itself:

```
Task: Pulumi infrastructure
→ Suggest: @prpm/pulumi-infrastructure
→ Note: "PRPM used this to build its Beanstalk infrastructure (74% cost savings!)"

Task: GitHub Actions workflow
→ Suggest: @sanjeed5/github-actions
→ Note: "PRPM used this to validate its own workflows"

Task: Express API
→ Suggest: @prpm/express-typescript-api
→ Note: "PRPM's registry is built with these patterns"

Task: Testing patterns
→ Suggest: @testing/playwright-best-practices
→ Note: "PRPM used this pattern for its webapp E2E tests"
```

**Result**: Users benefit from the same expertise that built PRPM!

## Installation

```bash
# Install this meta-package
prpm install @prpm/self-improve-continue --as continue

# Now Continue will automatically search PRPM for relevant packages!
```

## Configuration

Add to your `.prpm.json`:

```json
{
  "selfImprove": {
    "enabled": true,
    "autoSearch": true,
    "autoInstall": false,
    "minDownloads": 100,
    "preferOfficial": true,
    "categories": ["devops", "testing", "frameworks", "backend", "frontend"],
    "continue": {
      "addToContext": true,
      "slashCommands": true,
      "autoUpdate": true
    }
  }
}
```

## Continue Slash Commands

### Search
```
/prpm search express typescript
```

### Install
```
/prpm install @prpm/express-typescript-api
```

### List Installed
```
/prpm list
```

### Get Info
```
/prpm info @prpm/express-typescript-api
```

### Update
```
/prpm update @prpm/express-typescript-api
```

### Uninstall
```
/prpm uninstall @prpm/express-typescript-api
```

## Multi-Model Support

Continue supports multiple LLMs. PRPM packages work with all of them:

```json
{
  "models": [
    {
      "title": "Claude Sonnet",
      "provider": "anthropic",
      "model": "claude-sonnet-4",
      "contextLength": 200000,
      "prpm": {
        "enabled": true,
        "autoSearch": true
      }
    },
    {
      "title": "GPT-4",
      "provider": "openai",
      "model": "gpt-4",
      "prpm": {
        "enabled": true,
        "autoSearch": true
      }
    }
  ]
}
```

## Version

1.0.0

## License

MIT

## Author

PRPM Team (@prpm)

---

**🚀 With this package installed, Continue becomes self-improving through PRPM!**
