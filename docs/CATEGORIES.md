# Package Categories Taxonomy

This document defines the official category taxonomy for PRPM packages.

## Overview

Categories help users discover relevant packages by organizing them into logical groups based on their primary use case. Each package can have **one primary category** and multiple tags for additional context.

## Category Hierarchy

### 1. Development & Coding

**Slug**: `development`

**Description**: Packages that assist with software development, coding, and programming tasks.

**Subcategories**:
- `development/frontend` - React, Vue, Angular, HTML/CSS prompts
- `development/backend` - Node.js, Python, Java, database prompts
- `development/mobile` - iOS, Android, React Native prompts
- `development/devops` - Docker, Kubernetes, CI/CD prompts
- `development/testing` - Testing, QA, debugging prompts
- `development/architecture` - System design, patterns, best practices

**Example Packages**:
- `react-hooks-rules` → `development/frontend`
- `python-fastapi-guide` → `development/backend`
- `kubernetes-deployment` → `development/devops`

---

### 2. Data & Analytics

**Slug**: `data`

**Description**: Packages for data analysis, data science, machine learning, and analytics.

**Subcategories**:
- `data/analysis` - Data exploration, visualization prompts
- `data/ml` - Machine learning, AI model building
- `data/etl` - Data pipelines, transformation prompts
- `data/sql` - Database queries, optimization
- `data/visualization` - Charts, dashboards, reporting

**Example Packages**:
- `pandas-analysis-guide` → `data/analysis`
- `tensorflow-model-builder` → `data/ml`
- `sql-query-optimizer` → `data/sql`

---

### 3. Writing & Content

**Slug**: `writing`

**Description**: Packages for content creation, writing, documentation, and communication.

**Subcategories**:
- `writing/documentation` - API docs, technical writing
- `writing/creative` - Stories, poetry, creative content
- `writing/business` - Emails, proposals, reports
- `writing/marketing` - Copy, ads, social media
- `writing/academic` - Research papers, essays

**Example Packages**:
- `api-docs-generator` → `writing/documentation`
- `marketing-copy-assistant` → `writing/marketing`
- `technical-blog-writer` → `writing/documentation`

---

### 4. Productivity & Workflow

**Slug**: `productivity`

**Description**: Packages that improve personal productivity, workflow automation, and task management.

**Subcategories**:
- `productivity/automation` - Workflow automation prompts
- `productivity/planning` - Project planning, organization
- `productivity/research` - Research assistance, summarization
- `productivity/templates` - Reusable templates and frameworks

**Example Packages**:
- `meeting-notes-summarizer` → `productivity/research`
- `project-kickoff-template` → `productivity/planning`
- `workflow-automation-rules` → `productivity/automation`

---

### 5. Education & Learning

**Slug**: `education`

**Description**: Packages for learning, teaching, tutoring, and educational content.

**Subcategories**:
- `education/tutorial` - Step-by-step learning guides
- `education/exercise` - Practice problems, exercises
- `education/explanation` - Concept explanations, ELI5
- `education/teaching` - Lesson planning, teaching aids

**Example Packages**:
- `python-beginner-tutor` → `education/tutorial`
- `math-problem-solver` → `education/exercise`
- `concept-explainer` → `education/explanation`

---

### 6. Design & Creative

**Slug**: `design`

**Description**: Packages for design, creative work, and visual content creation.

**Subcategories**:
- `design/ui-ux` - UI/UX design, prototyping
- `design/graphics` - Graphic design, visual assets
- `design/web` - Web design, layouts
- `design/branding` - Brand identity, style guides

**Example Packages**:
- `tailwind-component-builder` → `design/ui-ux`
- `landing-page-designer` → `design/web`
- `brand-voice-guide` → `design/branding`

---

### 7. Business & Finance

**Slug**: `business`

**Description**: Packages for business operations, finance, and entrepreneurship.

**Subcategories**:
- `business/strategy` - Business planning, strategy
- `business/finance` - Financial analysis, accounting
- `business/sales` - Sales enablement, prospecting
- `business/operations` - Process optimization, ops

**Example Packages**:
- `business-plan-generator` → `business/strategy`
- `financial-model-builder` → `business/finance`
- `sales-pitch-creator` → `business/sales`

---

### 8. Security & Privacy

**Slug**: `security`

**Description**: Packages focused on security, privacy, and compliance.

**Subcategories**:
- `security/audit` - Security audits, reviews
- `security/compliance` - GDPR, HIPAA, compliance
- `security/pentesting` - Penetration testing, vulnerability assessment
- `security/encryption` - Cryptography, data protection

**Example Packages**:
- `code-security-reviewer` → `security/audit`
- `gdpr-compliance-checker` → `security/compliance`
- `threat-model-analyzer` → `security/pentesting`

---

### 9. Tools & Utilities

**Slug**: `tools`

**Description**: General-purpose tools and utilities that don't fit other categories.

**Subcategories**:
- `tools/conversion` - Format conversion, transformation
- `tools/generation` - Code/content generation
- `tools/validation` - Input validation, checking
- `tools/debugging` - Debugging assistance

**Example Packages**:
- `json-to-typescript` → `tools/conversion`
- `regex-pattern-builder` → `tools/generation`
- `error-message-explainer` → `tools/debugging`

---

### 10. General

**Slug**: `general`

**Description**: Packages that span multiple categories or are general-purpose.

**Subcategories**:
- `general/assistant` - General AI assistants
- `general/starter` - Starter templates, boilerplates
- `general/misc` - Miscellaneous packages

**Example Packages**:
- `general-purpose-assistant` → `general/assistant`
- `cursor-rules-starter` → `general/starter`

---

## Category Selection Guidelines

### How to Choose a Category

1. **Primary Use Case**: What is the main purpose of the package?
2. **Target Audience**: Who will use this package most?
3. **Core Functionality**: What does it primarily help with?

### Examples

| Package Name | Primary Use | Category | Tags |
|-------------|-------------|----------|------|
| `react-component-builder` | Build React components | `development/frontend` | `react`, `components`, `ui` |
| `api-documentation-writer` | Write API docs | `writing/documentation` | `api`, `docs`, `technical-writing` |
| `sql-query-optimizer` | Optimize SQL queries | `data/sql` | `database`, `sql`, `performance` |
| `meeting-notes-ai` | Summarize meetings | `productivity/research` | `meetings`, `notes`, `summary` |

---

## Category Validation Rules

### Required Fields
- Category **must** be one of the defined slugs
- Category **should** include subcategory when applicable

### Format
- Primary category: `category-slug` (e.g., `development`)
- With subcategory: `category-slug/subcategory` (e.g., `development/frontend`)

### Constraints
- Maximum 1 primary category per package
- Unlimited tags for additional context
- Category must match taxonomy exactly (case-sensitive)

---

## Migration Strategy

### For Existing Packages

1. **Auto-categorization**: Use tags/keywords to suggest category
2. **Manual Review**: Package authors can update via `prpm update`
3. **Default**: Uncategorized packages → `general/misc`

### Implementation

```typescript
// Category validation
const VALID_CATEGORIES = [
  'development',
  'development/frontend',
  'development/backend',
  'development/mobile',
  'development/devops',
  'development/testing',
  'development/architecture',
  'data',
  'data/analysis',
  'data/ml',
  'data/etl',
  'data/sql',
  'data/visualization',
  'writing',
  'writing/documentation',
  'writing/creative',
  'writing/business',
  'writing/marketing',
  'writing/academic',
  'productivity',
  'productivity/automation',
  'productivity/planning',
  'productivity/research',
  'productivity/templates',
  'education',
  'education/tutorial',
  'education/exercise',
  'education/explanation',
  'education/teaching',
  'design',
  'design/ui-ux',
  'design/graphics',
  'design/web',
  'design/branding',
  'business',
  'business/strategy',
  'business/finance',
  'business/sales',
  'business/operations',
  'security',
  'security/audit',
  'security/compliance',
  'security/pentesting',
  'security/encryption',
  'tools',
  'tools/conversion',
  'tools/generation',
  'tools/validation',
  'tools/debugging',
  'general',
  'general/assistant',
  'general/starter',
  'general/misc',
];

function isValidCategory(category: string): boolean {
  return VALID_CATEGORIES.includes(category);
}
```

---

## Future Additions

Categories can be expanded based on community needs:
- `games` - Game development prompts
- `iot` - IoT and embedded systems
- `blockchain` - Web3, smart contracts
- `scientific` - Scientific computing, research

Submit category proposals via GitHub issues.

---

*Generated with [Claude Code](https://claude.com/claude-code) via [Happy](https://happy.engineering)*
