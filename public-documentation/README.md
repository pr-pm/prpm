# PRPM Public Documentation

This directory contains the Mintlify documentation for PRPM.

## Setup

1. Install Mintlify CLI:

```bash
npm install -g mintlify
```

2. Run the development server:

```bash
cd public-documentation
mintlify dev
```

3. Visit http://localhost:3000 to view the docs

## Structure

- `mint.json` - Mintlify configuration
- `*.mdx` - Documentation pages
- `concepts/` - Core concepts
- `publishing/` - Publishing guides

## Writing Documentation

Mintlify uses MDX format. See [Mintlify documentation](https://mintlify.com/docs) for more details.

## Deployment

Mintlify can be deployed via:
- Mintlify hosting (recommended)
- Vercel
- Netlify
- Custom hosting

See [Mintlify deployment docs](https://mintlify.com/docs/settings/deployment) for details.

## Migration

This is a basic setup. Full documentation from `docs/` should be migrated incrementally.
