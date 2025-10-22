/**
 * Migration creation utility
 * Creates a new migration file with timestamp
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';

async function createMigration() {
  const name = process.argv[2];

  if (!name) {
    console.error('Usage: npm run migrate:create <migration-name>');
    console.error('Example: npm run migrate:create add_package_claims');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const fileName = `${timestamp}_${name}.sql`;
  const filePath = join(__dirname, fileName);

  const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Add your SQL migrations here
-- Example:
-- ALTER TABLE packages ADD COLUMN claimed BOOLEAN DEFAULT FALSE;
-- CREATE INDEX idx_packages_claimed ON packages(claimed);

-- Rollback (optional, for reference):
-- ALTER TABLE packages DROP COLUMN claimed;
`;

  await writeFile(filePath, template, 'utf-8');

  console.log(`✅ Created migration: ${fileName}`);
  console.log(`   Path: ${filePath}`);
  console.log('');
  console.log('💡 Edit the file to add your SQL, then run:');
  console.log('   npm run migrate');
}

createMigration().catch(console.error);
