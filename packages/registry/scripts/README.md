# Registry Scripts

This directory contains utility scripts for the PRPM Registry.

## Available Scripts

- `create-minio-bucket.js` - Create MinIO S3 bucket for local development
- `e2e-test.sh` - End-to-end testing script
- `import-scraped-agents.ts` - Import scraped agent data
- `score-packages.ts` - Calculate package quality scores
- `set-admin-password.ts` - Set admin user password
- `test-ai-evaluation.ts` - Test AI-powered package evaluation
- `update-quality-scores.ts` - Update quality scores for existing packages

## Seeding Data

**Note:** Package seeding is now handled in a separate repository: `/Users/khaliqgant/Projects/prpm/initial-seed-data`

The initial seed data repository contains:
- Scraped package data from various sources
- Collection definitions
- Seed scripts with format/subtype mapping logic
- Quality score calculations

To seed packages into the registry, use the scripts in the `initial-seed-data` repository instead of this one.
