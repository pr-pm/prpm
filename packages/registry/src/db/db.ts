import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

// Reuse existing connection pool configuration
export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create Drizzle client (schema will be added later)
export const db = drizzle(pool);

// Graceful shutdown helper
export async function closeDatabase() {
  await pool.end();
}
