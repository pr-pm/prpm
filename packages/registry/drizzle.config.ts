import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://prpm:prpm@localhost:5432/prpm',
  },
  verbose: true,
  strict: true,
});
