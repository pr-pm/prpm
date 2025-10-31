import { FastifyInstance } from 'fastify';
import { pool } from './db.js';

/**
 * Legacy query helper for unmigrated code
 * @deprecated Use repositories instead
 */
export async function queryOne<T>(
  server: FastifyInstance,
  query: string,
  params?: any[]
): Promise<T | null> {
  const result = await pool.query(query, params);
  return result.rows[0] || null;
}

/**
 * Legacy query helper for unmigrated code
 * @deprecated Use repositories instead
 */
export async function queryMany<T>(
  server: FastifyInstance,
  query: string,
  params?: any[]
): Promise<T[]> {
  const result = await pool.query(query, params);
  return result.rows;
}
