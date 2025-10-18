/**
 * Database setup and connection management
 */

import { FastifyInstance } from 'fastify';
import fastifyPostgres from '@fastify/postgres';
import { config } from '../config.js';

export async function setupDatabase(server: FastifyInstance) {
  await server.register(fastifyPostgres, {
    connectionString: config.database.url,
  });

  // Test connection
  try {
    const client = await server.pg.connect();
    await client.query('SELECT NOW()');
    client.release();
    server.log.info('✅ Database connected');
  } catch (error: any) {
    server.log.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Query helpers
export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

export async function query<T>(
  server: FastifyInstance,
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const client = await server.pg.connect();
  try {
    const result = await client.query(text, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0,
    };
  } finally {
    client.release();
  }
}

export async function queryOne<T>(
  server: FastifyInstance,
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await query<T>(server, text, params);
  return result.rows[0] || null;
}
