import { describe, it, expect } from 'vitest';
import { db, pool } from '../db';

describe('Database Client', () => {
  it('should export db instance', () => {
    expect(db).toBeDefined();
  });

  it('should export pool instance', () => {
    expect(pool).toBeDefined();
  });
});
