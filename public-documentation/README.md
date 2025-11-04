# PRPM Public Documentation

This directory contains the official Mintlify documentation for PRPM, published at [docs.prpm.dev](https://docs.prpm.dev).

## 📚 Documentation Structure

```
public-documentation/
├── mint.json                     # Mintlify configuration
├── introduction.mdx              # Introduction to PRPM
├── quickstart.mdx                # Quick start guide
├── installation.mdx              # Installation instructions
│
├── concepts/                     # Core Concepts
│   ├── packages.mdx              # What are packages
│   ├── package-types.mdx         # Types of packages (NEW)
│   ├── collections.mdx           # Package collections
│   ├── formats.mdx               # Format support
│   └── configuration.mdx         # Configuration guide (NEW)
│
├── guides/                       # User Guides
│   ├── examples.mdx              # Usage examples (NEW)
│   ├── playground.mdx            # Playground usage
│   ├── format-conversion.mdx     # Format conversion
│   └── mcp-servers.mdx           # MCP server integration
│
├── integrations/                 # Integration Guides (NEW)
│   ├── github-copilot.mdx        # GitHub Copilot integration
│   └── windsurf.mdx              # Windsurf integration
│
├── cli/                          # CLI Reference
│   ├── overview.mdx              # CLI overview
│   ├── commands.mdx              # Command reference
│   ├── workflows.mdx             # Common workflows
│   └── troubleshooting.mdx       # Troubleshooting
│
├── publishing/                   # Publishing Guides
│   ├── getting-started.mdx       # Publishing basics
│   ├── manifest.mdx              # Package manifest
│   └── collections.mdx           # Publishing collections
│
└── advanced/                     # Advanced Topics
    ├── architecture.mdx          # System architecture (NEW)
    ├── self-improving-packages.mdx
    └── meta-packages.mdx
```

## 🚀 Local Development

### Prerequisites

Install Mintlify CLI:

```bash
npm install -g mintlify
```

### Running Locally

1. Navigate to this directory:

```bash
cd public-documentation
```

2. Start the development server:

```bash
mintlify dev
```

3. Visit http://localhost:3000 to view the docs

The dev server supports hot reloading - changes to `.mdx` files will be reflected immediately.

## ✍️ Writing Documentation

### MDX Format

Mintlify uses MDX (Markdown + JSX), which supports:
- Standard Markdown syntax
- React components for enhanced formatting
- Code syntax highlighting
- Interactive elements

### Available Components

```mdx
<Note>Important information</Note>
<Warning>Warning message</Warning>
<Info>Info message</Info>
<Check>Success message</Check>
<Tip>Helpful tip</Tip>

<Card title="Card Title" icon="icon-name" href="/link">
  Card content
</Card>

<CardGroup cols={2}>
  <Card>...</Card>
  <Card>...</Card>
</CardGroup>

<Accordion title="Accordion Title">
  Hidden content
</Accordion>

<Tabs>
  <Tab title="Tab 1">Content 1</Tab>
  <Tab title="Tab 2">Content 2</Tab>
</Tabs>

<CodeGroup>
  ```javascript
  // Code example 1
  ```
  ```python
  # Code example 2
  ```
</CodeGroup>
```

### Best Practices

1. **Use frontmatter** for page metadata:
   ```yaml
   ---
   title: 'Page Title'
   description: 'Page description for SEO'
   icon: 'icon-name'  # Optional
   ---
   ```

2. **Add clear headings** for navigation
3. **Include code examples** for technical content
4. **Use components** for callouts and special formatting
5. **Link to related pages** for better navigation

## 🚢 Deployment

The documentation is deployed to [docs.prpm.dev](https://docs.prpm.dev) via Mintlify hosting.

### Automatic Deployment

- **Production**: Automatically deploys from `main` branch
- **Preview**: Deploy previews for pull requests

### Manual Deployment

If needed, you can manually trigger a deployment through the Mintlify dashboard.

## 📝 Contributing

### Adding New Pages

1. Create a new `.mdx` file in the appropriate directory
2. Add frontmatter with title and description
3. Write your content using MDX
4. Update `mint.json` to add the page to navigation:

```json
{
  "group": "Section Name",
  "pages": [
    "existing-page",
    "your-new-page"
  ]
}
```

### Updating Existing Pages

1. Edit the `.mdx` file
2. Test locally with `mintlify dev`
3. Commit and push your changes

### Navigation Structure

Edit `mint.json` to modify:
- Navigation groups and pages
- Site colors and branding
- Footer links
- Top bar configuration

## 🔗 Resources

- [Mintlify Documentation](https://mintlify.com/docs)
- [MDX Documentation](https://mdxjs.com/)
- [PRPM GitHub](https://github.com/pr-pm/prpm)
- [PRPM Website](https://prpm.dev)

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/pr-pm/prpm/issues)
- **Discussions**: [GitHub Discussions](https://github.com/pr-pm/prpm/discussions)
- **Email**: team@prpm.dev

---

**Last Updated**: January 2025
