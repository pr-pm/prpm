# Ruler Format Specification

**File Location:** `.ruler/` directory
**Format:** Plain markdown (no frontmatter)
**Official Docs:** https://okigu.com/ruler

## Overview

Ruler is a tool for centralizing AI coding assistant instructions in a single directory. Unlike other formats, Ruler uses **plain markdown without frontmatter**, making it simple and universal across different AI tools.

## Format Characteristics

### Plain Markdown Only

- **No YAML frontmatter** - Files are pure markdown
- **No special formatting** - Standard markdown syntax
- **No metadata fields** - All context comes from content
- **No file naming conventions** - Use descriptive filenames

### File Organization

```
.ruler/
  general-guidelines.md        # General coding standards
  typescript-rules.md          # TypeScript-specific rules
  react-patterns.md            # React component patterns
  api-conventions.md           # API design standards
  testing-guidelines.md        # Test writing standards
  security-checklist.md        # Security best practices
```

### Content Structure

While Ruler doesn't enforce structure, common patterns include:

1. **Title (H1)**: Main heading describing the rule
2. **Overview**: Brief description of purpose
3. **Guidelines/Rules**: Specific instructions
4. **Examples**: Code examples showing good/bad patterns
5. **References**: Links to documentation or related resources

## Metadata Preservation

Since Ruler doesn't support frontmatter, PRPM adds HTML comments at the top of generated files to preserve package information:

```markdown
<!-- Package: react-best-practices -->
<!-- Author: username -->
<!-- Version: 1.0.0 -->

# React Best Practices

Guidelines for writing clean, maintainable React code...
```

These comments are:
- **Optional** - Not required by Ruler
- **Non-intrusive** - Don't affect rendering
- **Informational** - Help track package source
- **Ignored by AI** - Most AI tools skip HTML comments

## Complete Example

`.ruler/react-component-patterns.md`:
```markdown
# React Component Patterns

Best practices for writing React components in our codebase.

## Functional Components

Always use functional components with hooks:

```tsx
// ✅ Good: Functional component with hooks
function UserProfile({ userId }: Props) {
  const user = useUser(userId);

  if (!user) return <Loading />;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

Avoid class components for new code:

```tsx
// ❌ Bad: Class component (legacy pattern)
class UserProfile extends React.Component {
  render() {
    return <div>{this.props.user.name}</div>;
  }
}
```

## Component Size

Keep components focused and under 200 lines. Extract logic into custom hooks:

```tsx
// ✅ Good: Extract logic to custom hook
function UserDashboard() {
  const { users, loading, error } = useUsers();

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return <UserList users={users} />;
}
```

## Props Interface

Always define explicit TypeScript interfaces for props:

```tsx
interface UserCardProps {
  user: User;
  onSelect?: (user: User) => void;
  variant?: 'compact' | 'detailed';
}

function UserCard({ user, onSelect, variant = 'compact' }: UserCardProps) {
  // ...
}
```

## State Management

- Use `useState` for local component state
- Use `useReducer` for complex state logic
- Use Context API sparingly for truly global state
- Consider Zustand or Redux for app-wide state

## References

- [React Documentation](https://react.dev)
- [TypeScript React Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
```

## Common Patterns

### General Guidelines

`.ruler/general-guidelines.md`:
```markdown
# General Coding Guidelines

Core principles for all code in this project.

## Code Style

- Use meaningful variable names
- Keep functions under 50 lines
- Write self-documenting code
- Add comments only for complex logic

## File Organization

```
src/
  components/      # React components
  hooks/          # Custom React hooks
  utils/          # Helper functions
  types/          # TypeScript types
  api/            # API client code
```

## Import Order

1. External dependencies
2. Internal absolute imports
3. Internal relative imports
4. Types
5. Styles
```

### Language-Specific Rules

`.ruler/typescript-standards.md`:
```markdown
# TypeScript Standards

## Type Safety

Always use explicit types, avoid `any`:

```typescript
// ✅ Good: Explicit types
function processUser(user: User): UserResult {
  return { id: user.id, name: user.name };
}

// ❌ Bad: Using any
function processUser(user: any): any {
  return { id: user.id, name: user.name };
}
```

## Interfaces vs Types

- Use `interface` for object shapes
- Use `type` for unions, intersections, primitives

```typescript
// ✅ Good: Interface for object
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Good: Type for union
type Status = 'pending' | 'active' | 'inactive';
```
```

### API Conventions

`.ruler/api-conventions.md`:
```markdown
# API Design Conventions

REST API standards for our backend services.

## Endpoint Naming

- Use plural nouns for resources: `/users`, not `/user`
- Use kebab-case for multi-word resources: `/user-profiles`
- Nest resources logically: `/users/:id/posts`

## HTTP Methods

- `GET` - Retrieve resource(s)
- `POST` - Create new resource
- `PUT` - Replace entire resource
- `PATCH` - Update partial resource
- `DELETE` - Remove resource

## Response Format

Always return consistent JSON structure:

```json
{
  "data": { "id": "123", "name": "User" },
  "meta": { "timestamp": "2024-01-01T00:00:00Z" }
}
```

For errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      { "field": "email", "issue": "must be valid email" }
    ]
  }
}
```
```

### Testing Guidelines

`.ruler/testing-standards.md`:
```markdown
# Testing Standards

## Test Structure

Use Arrange-Act-Assert pattern:

```typescript
describe('UserService', () => {
  it('should create user with valid data', async () => {
    // Arrange
    const userData = { name: 'John', email: 'john@example.com' };

    // Act
    const user = await userService.create(userData);

    // Assert
    expect(user.id).toBeDefined();
    expect(user.name).toBe('John');
  });
});
```

## Coverage Requirements

- Minimum 80% code coverage
- 100% coverage for critical paths
- Test all error conditions
- Test edge cases

## Naming Conventions

- `describe()` - Component/function name
- `it()` - "should [expected behavior]"
- Keep test names descriptive and specific
```

## Use Cases

### Project Onboarding

Create comprehensive guidelines in `.ruler/` for new team members:
- `01-getting-started.md` - Setup and basics
- `02-architecture.md` - System architecture
- `03-coding-standards.md` - Code style
- `04-testing.md` - Testing practices
- `05-deployment.md` - Deployment process

### Framework Guidelines

Store framework-specific best practices:
- `nextjs-patterns.md` - Next.js conventions
- `prisma-models.md` - Database schema patterns
- `tailwind-utilities.md` - CSS utility usage

### Security Standards

Document security requirements:
- `authentication.md` - Auth implementation
- `authorization.md` - Permission checks
- `input-validation.md` - Data validation
- `secrets-management.md` - Handling sensitive data

## Best Practices

1. **Descriptive Filenames**: Use clear names like `react-hooks-patterns.md` not `rules.md`
2. **One Topic Per File**: Keep files focused on specific subjects
3. **Include Examples**: Show both good and bad patterns
4. **Keep Updated**: Review and update as patterns evolve
5. **Link to Docs**: Reference official documentation for deeper learning
6. **Use Headings**: Structure content with clear H2/H3 sections
7. **Code Blocks**: Use fenced code blocks with language specifiers

## Conversion Notes

### From Canonical

PRPM converts canonical packages to Ruler format by:
- Removing all frontmatter
- Converting content to plain markdown
- Adding optional HTML comment metadata header
- Preserving markdown structure and examples
- Flattening any nested sections

**Quality Impact:**
- ⚠️ **Metadata loss** - No frontmatter means no structured metadata
- ⚠️ **Feature loss** - No globs, alwaysApply, or other advanced features
- ✅ **Content preserved** - All markdown content transfers cleanly
- ✅ **Universal compatibility** - Works with any AI tool

### To Canonical

PRPM parses Ruler files by:
- Reading plain markdown content
- Extracting HTML comment metadata if present
- Parsing markdown structure (headings, lists, code blocks)
- Inferring metadata from content and filename
- Creating canonical sections from markdown

**Limitations:**
- No automatic categorization (requires manual tags)
- No file matching patterns (no globs)
- No inclusion modes (assumes always apply)
- Limited metadata extraction

## Limitations

- **No metadata**: Can't specify globs, tags, or inclusion modes
- **No versioning**: No built-in version tracking
- **No validation**: No schema or structure enforcement
- **Manual organization**: File organization is manual
- **No file targeting**: Can't specify which files rules apply to

## Differences from Other Formats

**vs Cursor:**
- Plain markdown (Cursor uses MDC with frontmatter)
- No metadata (Cursor has description, globs, alwaysApply)
- Single directory (Cursor organizes by type)
- Simpler (Cursor has four rule types)

**vs Claude Code:**
- Plain markdown (Claude uses markdown with frontmatter)
- No type system (Claude has agents/skills/commands/hooks)
- No tool specifications (Claude defines available tools)
- Universal (Claude is Claude-specific)

**vs Continue:**
- No frontmatter (Continue has optional frontmatter)
- No globs (Continue supports file patterns)
- No regex (Continue supports regex matching)
- Simpler structure (Continue has more features)

**vs Kiro:**
- Plain markdown (Kiro has frontmatter for steering files)
- No inclusion modes (Kiro has always/fileMatch/manual)
- No JSON config (Kiro agents use JSON)
- Simpler (Kiro has more advanced features)

## Migration Tips

### Migrating TO Ruler

1. **Combine rules**: Merge related rules into single files
2. **Remove metadata**: Strip frontmatter, keep content
3. **Simplify structure**: Use plain markdown headings
4. **Add context**: Include background in content (no metadata)
5. **Clear filenames**: Use descriptive names since no frontmatter

### Migrating FROM Ruler

1. **Add metadata**: Use PRPM to add structured metadata
2. **Categorize**: Tag and categorize for better discovery
3. **File patterns**: Add globs for file-specific rules
4. **Split by context**: Separate always-apply from conditional rules
5. **Version**: Add version tracking via PRPM

## Tool Compatibility

Ruler's plain markdown format works with:
- **Cursor** - Add to Cursor context
- **Claude Code** - Import as documentation
- **Continue** - Use as context files
- **Windsurf** - Add to Windsurf context
- **GitHub Copilot** - Reference in instructions
- **Any AI tool** - Universal markdown support

## Publishing to PRPM

Convert Ruler files to PRPM packages:

```bash
# Convert Ruler file to PRPM canonical format
prpm convert .ruler/react-patterns.md --to canonical

# Publish to registry
prpm publish
```

PRPM will:
- Parse markdown content
- Extract structure and examples
- Infer tags from content
- Create canonical package
- Upload to registry for sharing

## Discovering Ruler Packages

Search for Ruler packages in PRPM registry:

```bash
# Search by format
prpm search --format ruler

# Search by topic
prpm search "react patterns" --format ruler

# Browse verified collections
prpm collection list --format ruler
```

Install Ruler packages locally:

```bash
# Install single package
prpm install react-best-practices --format ruler

# Install collection
prpm collection install ruler-react-essentials
```

## Integration with PRPM

PRPM treats Ruler as a first-class format:

1. **Native support** - Bidirectional conversion to/from canonical
2. **Quality scoring** - Validates markdown structure and content
3. **Collections** - Curated sets of Ruler packages
4. **Search** - Find Ruler packages in registry
5. **Validation** - Ensures valid markdown

This makes Ruler packages discoverable, shareable, and manageable alongside other formats.
