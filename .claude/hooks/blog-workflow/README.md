# Blog Workflow Hook

Enforces blog writing standards for PRPM blog posts.

## What It Does

This hook monitors user prompts for blog-related work and:

1. **Blog Writing**: Reminds you to use prpm-blog-writer agent + human-writing skill
2. **Sitemap Updates**: Provides checklist for updating sitemap.xml after publishing
3. **Quality Standards**: Ensures consistent tone, structure, and technical depth

## How It Works

The hook activates on `UserPromptSubmit` events and detects:

- Writing new blog posts
- Editing existing blog content
- Updating sitemaps
- General blog-related work

## Requirements for Blog Posts

**MANDATORY:**
- ✅ Use `prpm-blog-writer` agent for structure and tone
- ✅ Apply `human-writing` skill to eliminate AI patterns
- ✅ Update `sitemap.xml` after publishing

**RECOMMENDED:**
- Include code examples with syntax highlighting
- Add practical use cases
- Link to relevant documentation
- Follow PRPM voice and style guide

## Detected Prompts

The hook activates when you ask about:

```
"write a blog post about..."
"create blog post for..."
"draft blog about..."
"update sitemap"
"publish blog post"
```

## Example Workflow

1. **Ask to write a blog post:**
   ```
   User: "Write a blog post about the new hooks feature"
   Hook: Activates and reminds you to use prpm-blog-writer + human-writing
   ```

2. **Follow the requirements:**
   ```
   User: "Use prpm-blog-writer agent to write a post about hooks"
   Claude: [Uses agent with proper structure and tone]
   User: "Apply human-writing skill to make it more natural"
   Claude: [Removes AI patterns, makes content authentic]
   ```

3. **After publishing:**
   ```
   User: "Update sitemap for new blog post"
   Hook: Provides sitemap update checklist
   ```

## Configuration

Edit `hook.json` to customize:

```json
{
  "enabled": true,
  "config": {
    "strictMode": true
  }
}
```

**strictMode**: When true, enforces requirements more strictly.

## Disabling

Set `enabled: false` in `hook.json` or remove the hook directory.

## Why This Matters

**Without enforcement:**
- Blog posts lack consistent structure
- AI-generated content is obvious and hurts credibility
- Sitemap updates are forgotten
- SEO and discoverability suffer

**With enforcement:**
- Consistent, professional blog quality
- Natural, authentic voice
- Proper SEO and discoverability
- Maintained reader trust

## Development

### Building

```bash
cd .claude/hooks/blog-workflow
npm run build  # or: esbuild src/hook.ts --outfile=dist/hook.js --bundle --platform=node --format=cjs
```

### Testing

Try blog-related prompts to see the hook activate:

```
"Write a blog post about Claude Code hooks"
"Update the sitemap with new blog post"
"Create blog about PRPM features"
```
