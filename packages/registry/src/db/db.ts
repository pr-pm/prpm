import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { config } from '../config.js';
import * as schema from './schema/index.js';

const { Pool } = pg;

// Reuse existing connection pool configuration (matches Fastify PostgreSQL setup)
export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false } // AWS RDS requires SSL in production
    : undefined,
});

// Create Drizzle client with schema for type-safe queries
export const db = drizzle(pool, { schema });

// Graceful shutdown helper
export async function closeDatabase() {
  await pool.end();
}
