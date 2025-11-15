/**
 * Database trigger tests for star functionality
 * These tests verify that database triggers correctly update star counts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import pg from 'pg';

const { Pool } = pg;

describe('Database Triggers - Star Counts', () => {
  let pool: pg.Pool;
  let testUserId: string;
  let testPackageId: string;
  let testCollectionId: string;

  beforeAll(async () => {
    // Connect to test database
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://prpm:prpm@localhost:5432/prpm_test',
    });

    // Create test user
    const userResult = await pool.query(
      `INSERT INTO users (username, email, verified_author)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['test-trigger-user', 'test-trigger@example.com', true]
    );
    testUserId = userResult.rows[0].id;

    // Create test package
    const packageResult = await pool.query(
      `INSERT INTO packages (name, display_name, description, author_id, format, stars)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      ['@test/trigger-package', 'Test Trigger Package', 'A test package', testUserId, 'cursor', 0]
    );
    testPackageId = packageResult.rows[0].id;

    // Create test collection
    const collectionResult = await pool.query(
      `INSERT INTO collections (scope, name_slug, name, description, author_id, stars)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      ['collection', 'test-trigger-collection', 'Test Trigger Collection', 'A test collection', testUserId, 0]
    );
    testCollectionId = collectionResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testPackageId) {
      await pool.query('DELETE FROM packages WHERE id = $1', [testPackageId]);
    }
    if (testCollectionId) {
      await pool.query('DELETE FROM collections WHERE id = $1', [testCollectionId]);
    }
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  beforeEach(async () => {
    // Clear star data before each test
    await pool.query('DELETE FROM package_stars WHERE package_id = $1', [testPackageId]);
    await pool.query('DELETE FROM collection_stars WHERE collection_id = $1', [testCollectionId]);

    // Reset star counts
    await pool.query('UPDATE packages SET stars = 0 WHERE id = $1', [testPackageId]);
    await pool.query('UPDATE collections SET stars = 0 WHERE id = $1', [testCollectionId]);
  });

  describe('Package star triggers', () => {
    it('should increment package stars on insert', async () => {
      // Insert a star
      await pool.query(
        `INSERT INTO package_stars (package_id, user_id) VALUES ($1, $2)`,
        [testPackageId, testUserId]
      );

      // Check that stars count increased
      const result = await pool.query(
        'SELECT stars FROM packages WHERE id = $1',
        [testPackageId]
      );

      expect(result.rows[0].stars).toBe(1);
    });

    it('should decrement package stars on delete', async () => {
      // First star the package
      await pool.query(
        `INSERT INTO package_stars (package_id, user_id) VALUES ($1, $2)`,
        [testPackageId, testUserId]
      );

      // Verify it's starred
      let result = await pool.query(
        'SELECT stars FROM packages WHERE id = $1',
        [testPackageId]
      );
      expect(result.rows[0].stars).toBe(1);

      // Unstar the package
      await pool.query(
        `DELETE FROM package_stars WHERE package_id = $1 AND user_id = $2`,
        [testPackageId, testUserId]
      );

      // Check that stars count decreased
      result = await pool.query(
        'SELECT stars FROM packages WHERE id = $1',
        [testPackageId]
      );
      expect(result.rows[0].stars).toBe(0);
    });

    it('should handle multiple users starring', async () => {
      // Create additional test users
      const user2Result = await pool.query(
        `INSERT INTO users (username, email, verified_author)
         VALUES ($1, $2, $3)
         RETURNING id`,
        ['test-trigger-user-2', 'test-trigger-2@example.com', false]
      );
      const user2Id = user2Result.rows[0].id;

      const user3Result = await pool.query(
        `INSERT INTO users (username, email, verified_author)
         VALUES ($1, $2, $3)
         RETURNING id`,
        ['test-trigger-user-3', 'test-trigger-3@example.com', false]
      );
      const user3Id = user3Result.rows[0].id;

      try {
        // Three users star the package
        await pool.query(
          `INSERT INTO package_stars (package_id, user_id) VALUES ($1, $2)`,
          [testPackageId, testUserId]
        );
        await pool.query(
          `INSERT INTO package_stars (package_id, user_id) VALUES ($1, $2)`,
          [testPackageId, user2Id]
        );
        await pool.query(
          `INSERT INTO package_stars (package_id, user_id) VALUES ($1, $2)`,
          [testPackageId, user3Id]
        );

        // Check stars count
        let result = await pool.query(
          'SELECT stars FROM packages WHERE id = $1',
          [testPackageId]
        );
        expect(result.rows[0].stars).toBe(3);

        // One user unstars
        await pool.query(
          `DELETE FROM package_stars WHERE package_id = $1 AND user_id = $2`,
          [testPackageId, user2Id]
        );

        // Check updated count
        result = await pool.query(
          'SELECT stars FROM packages WHERE id = $1',
          [testPackageId]
        );
        expect(result.rows[0].stars).toBe(2);
      } finally {
        // Clean up additional users
        await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [user2Id, user3Id]);
      }
    });

    it('should prevent duplicate stars (ON CONFLICT)', async () => {
      // Star the package
      await pool.query(
        `INSERT INTO package_stars (package_id, user_id) VALUES ($1, $2)`,
        [testPackageId, testUserId]
      );

      // Try to star again (should be ignored due to PRIMARY KEY constraint)
      await pool.query(
        `INSERT INTO package_stars (package_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [testPackageId, testUserId]
      );

      // Stars should still be 1, not 2
      const result = await pool.query(
        'SELECT stars FROM packages WHERE id = $1',
        [testPackageId]
      );
      expect(result.rows[0].stars).toBe(1);
    });
  });

  describe('Collection star triggers', () => {
    it('should increment collection stars on insert', async () => {
      // Insert a star
      await pool.query(
        `INSERT INTO collection_stars (collection_id, user_id) VALUES ($1, $2)`,
        [testCollectionId, testUserId]
      );

      // Check that stars count increased
      const result = await pool.query(
        'SELECT stars FROM collections WHERE id = $1',
        [testCollectionId]
      );

      expect(result.rows[0].stars).toBe(1);
    });

    it('should decrement collection stars on delete', async () => {
      // First star the collection
      await pool.query(
        `INSERT INTO collection_stars (collection_id, user_id) VALUES ($1, $2)`,
        [testCollectionId, testUserId]
      );

      // Verify it's starred
      let result = await pool.query(
        'SELECT stars FROM collections WHERE id = $1',
        [testCollectionId]
      );
      expect(result.rows[0].stars).toBe(1);

      // Unstar the collection
      await pool.query(
        `DELETE FROM collection_stars WHERE collection_id = $1 AND user_id = $2`,
        [testCollectionId, testUserId]
      );

      // Check that stars count decreased
      result = await pool.query(
        'SELECT stars FROM collections WHERE id = $1',
        [testCollectionId]
      );
      expect(result.rows[0].stars).toBe(0);
    });

    it('should handle cascade delete when user is deleted', async () => {
      // Create a temporary user
      const tempUserResult = await pool.query(
        `INSERT INTO users (username, email, verified_author)
         VALUES ($1, $2, $3)
         RETURNING id`,
        ['temp-star-user', 'temp-star@example.com', false]
      );
      const tempUserId = tempUserResult.rows[0].id;

      // Star the collection as temp user
      await pool.query(
        `INSERT INTO collection_stars (collection_id, user_id) VALUES ($1, $2)`,
        [testCollectionId, tempUserId]
      );

      // Verify stars increased
      let result = await pool.query(
        'SELECT stars FROM collections WHERE id = $1',
        [testCollectionId]
      );
      expect(result.rows[0].stars).toBe(1);

      // Delete the user (should cascade delete the star)
      await pool.query('DELETE FROM users WHERE id = $1', [tempUserId]);

      // Check that stars count decreased
      result = await pool.query(
        'SELECT stars FROM collections WHERE id = $1',
        [testCollectionId]
      );
      expect(result.rows[0].stars).toBe(0);
    });
  });

  describe('Trigger function existence', () => {
    it('should have package star trigger function', async () => {
      const result = await pool.query(
        `SELECT proname FROM pg_proc
         WHERE proname = 'update_package_stars_count'`
      );
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should have collection star trigger function', async () => {
      const result = await pool.query(
        `SELECT proname FROM pg_proc
         WHERE proname = 'update_collection_stars_count'`
      );
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should have package star trigger attached', async () => {
      const result = await pool.query(
        `SELECT tgname FROM pg_trigger
         WHERE tgname = 'trigger_package_star'`
      );
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should have collection star trigger attached', async () => {
      const result = await pool.query(
        `SELECT tgname FROM pg_trigger
         WHERE tgname = 'trigger_collection_star'`
      );
      expect(result.rows.length).toBeGreaterThan(0);
    });
  });
});
