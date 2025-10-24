#!/usr/bin/env node

/**
 * Set prpm user password for local development
 * Usage: npx tsx scripts/set-admin-password.ts [password]
 */

import { config } from 'dotenv';
import pg from 'pg';
import { hash } from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from registry root
config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://prpm:prpm@localhost:5434/prpm';
const SALT_ROUNDS = 10;

async function setAdminPassword() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  try {
    // Get password from command line args or use default
    const password = process.argv[2] || 'admin123';

    console.log('🔐 Setting prpm user password...\n');
    console.log(`Email: team@pr-pm.dev`);
    console.log(`Password: ${password}`);
    console.log();

    // Hash password
    const passwordHash = await hash(password, SALT_ROUNDS);

    // Update existing prpm user or create if doesn't exist
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, is_admin, verified_author, created_at, updated_at)
       VALUES ('prpm', 'team@pr-pm.dev', $1, TRUE, TRUE, NOW(), NOW())
       ON CONFLICT (username)
       DO UPDATE SET password_hash = $1, email = 'team@pr-pm.dev', updated_at = NOW()
       RETURNING id, username, email, is_admin`,
      [passwordHash]
    );

    if (result.rows.length === 0) {
      console.error('❌ Failed to create/update prpm user.');
      process.exit(1);
    }

    const user = result.rows[0];
    console.log('✅ PRPM password updated successfully!\n');
    console.log('User Details:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Is Admin: ${user.is_admin}`);
    console.log();
    console.log('💡 You can now login with:');
    console.log(`   Email: team@pr-pm.dev`);
    console.log(`   Password: ${password}`);
    console.log();
    console.log('🔑 To login via CLI:');
    console.log('   1. Start the registry: npm run dev (in packages/registry)');
    console.log('   2. Login: PRPM_REGISTRY_URL=http://localhost:3000 prpm login');
    console.log();

  } catch (error) {
    console.error('❌ Failed to set prpm password:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setAdminPassword();
