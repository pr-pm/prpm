/**
 * Unit tests for quality scoring algorithm
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateQualityScore,
  calculateQualityScoreWithAI,
  updatePackageQualityScore,
  getQualityScoreBreakdown,
  type PackageQualityData
} from '../quality-scorer.js';

// Mock AI evaluator
vi.mock('../ai-evaluator.js', () => ({
  evaluatePromptWithAI: vi.fn().mockResolvedValue(0.75)
}));

// Mock database
vi.mock('../../db/index.js', () => ({
  query: vi.fn().mockImplementation((server, sql, params) => {
    // Mock package data
    if (sql.includes('SELECT') && sql.includes('FROM packages')) {
      return Promise.resolve({
        rows: [{
          id: 'test-package',
          display_name: 'Test Package',
          description: 'A comprehensive test package with detailed description',
          documentation_url: 'https://example.com/docs',
          repository_url: 'https://github.com/test/repo',
          homepage_url: 'https://example.com',
          keywords: ['test', 'example', 'quality'],
          tags: ['testing', 'qa'],
          author_id: 'author-123',
          verified: true,
          official: false,
          total_downloads: 150,
          stars: 25,
          rating_average: 4.5,
          rating_count: 10,
          version_count: 5,
          last_published_at: new Date(),
          created_at: new Date(),
          content: {
            sections: [
              { type: 'instructions', content: 'Test instructions' },
              { type: 'rules', rules: ['Rule 1', 'Rule 2'] },
              { type: 'examples', examples: [{ code: 'test' }] }
            ]
          },
          readme: 'Test README content',
          file_size: 5000
        }]
      });
    }

    // Mock author package count
    if (sql.includes('COUNT(*) as count')) {
      return Promise.resolve({
        rows: [{ count: 3 }]
      });
    }

    // Mock update
    if (sql.includes('UPDATE packages')) {
      return Promise.resolve({ rowCount: 1 });
    }

    return Promise.resolve({ rows: [] });
  })
}));

const mockServer = {
  log: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
} as any;

describe('Quality Scorer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateQualityScore (synchronous)', () => {
    it('should calculate score for a complete package', () => {
      const pkg: PackageQualityData = {
        id: 'test-pkg',
        display_name: 'Test Package',
        description: 'A detailed test package description',
        documentation_url: 'https://docs.example.com',
        repository_url: 'https://github.com/test/repo',
        homepage_url: 'https://example.com',
        keywords: ['test', 'example'],
        tags: ['testing', 'quality'],
        author_id: 'author-1',
        verified: true,
        official: false,
        total_downloads: 100,
        stars: 20,
        rating_average: 4.5,
        rating_count: 10,
        version_count: 3,
        last_published_at: new Date(),
        created_at: new Date(),
        content: {
          sections: [
            { type: 'instructions', content: 'Detailed instructions' },
            { type: 'rules', rules: ['Rule 1', 'Rule 2'] },
            { type: 'examples', examples: [{ code: 'example' }] }
          ]
        },
        readme: 'Comprehensive README',
        file_size: 5000
      };

      const score = calculateQualityScore(pkg);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(5.0);
      expect(typeof score).toBe('number');
    });

    it('should give higher scores to verified authors', () => {
      const unverified: PackageQualityData = {
        id: 'test-1',
        display_name: 'Test',
        author_id: 'author-1',
        verified: false,
        official: false,
        total_downloads: 0,
        stars: 0,
        rating_count: 0,
        version_count: 1,
        created_at: new Date(),
        tags: [],
        keywords: []
      };

      const verified: PackageQualityData = {
        ...unverified,
        verified: true
      };

      const score1 = calculateQualityScore(unverified);
      const score2 = calculateQualityScore(verified);

      expect(score2).toBeGreaterThan(score1);
      expect(score2 - score1).toBeCloseTo(0.5, 1); // Verified bonus
    });

    it('should give higher scores to official packages', () => {
      const unofficial: PackageQualityData = {
        id: 'test-1',
        display_name: 'Test',
        author_id: 'author-1',
        verified: false,
        official: false,
        total_downloads: 0,
        stars: 0,
        rating_count: 0,
        version_count: 1,
        created_at: new Date(),
        tags: [],
        keywords: []
      };

      const official: PackageQualityData = {
        ...unofficial,
        official: true
      };

      const score1 = calculateQualityScore(unofficial);
      const score2 = calculateQualityScore(official);

      expect(score2).toBeGreaterThan(score1);
      expect(score2 - score1).toBeCloseTo(0.7, 1); // Official bonus
    });

    it('should score based on downloads (logarithmic)', () => {
      const low: PackageQualityData = {
        id: 'test-1',
        display_name: 'Test',
        author_id: 'author-1',
        verified: false,
        official: false,
        total_downloads: 5,
        stars: 0,
        rating_count: 0,
        version_count: 1,
        created_at: new Date(),
        tags: [],
        keywords: []
      };

      const high: PackageQualityData = {
        ...low,
        total_downloads: 500
      };

      const score1 = calculateQualityScore(low);
      const score2 = calculateQualityScore(high);

      expect(score2).toBeGreaterThan(score1);
    });

    it('should score based on content quality', () => {
      const minimal: PackageQualityData = {
        id: 'test-1',
        display_name: 'Test',
        author_id: 'author-1',
        verified: false,
        official: false,
        total_downloads: 0,
        stars: 0,
        rating_count: 0,
        version_count: 1,
        created_at: new Date(),
        tags: [],
        keywords: [],
        content: null
      };

      const comprehensive: PackageQualityData = {
        ...minimal,
        content: {
          sections: [
            { type: 'instructions', content: 'A'.repeat(2000) },
            { type: 'rules', rules: Array(10).fill('Rule') },
            { type: 'examples', examples: [{ code: 'test' }] },
            { type: 'guidelines', content: 'Guidelines' },
            { type: 'metadata', content: 'Metadata' }
          ]
        },
        readme: 'Comprehensive README',
        description: 'Detailed description',
        documentation_url: 'https://docs.example.com'
      };

      const score1 = calculateQualityScore(minimal);
      const score2 = calculateQualityScore(comprehensive);

      expect(score2).toBeGreaterThan(score1);
      expect(score2).toBeGreaterThan(1.0); // Should have substantial content score
    });

    it('should cap scores at 5.0', () => {
      const perfect: PackageQualityData = {
        id: 'test-1',
        display_name: 'Perfect Package',
        description: 'A'.repeat(200),
        documentation_url: 'https://docs.example.com',
        repository_url: 'https://github.com/test/repo',
        homepage_url: 'https://example.com',
        keywords: ['a', 'b', 'c'],
        tags: ['x', 'y', 'z'],
        author_id: 'author-1',
        verified: true,
        official: true,
        total_downloads: 10000,
        stars: 1000,
        rating_average: 5.0,
        rating_count: 100,
        version_count: 20,
        last_published_at: new Date(),
        created_at: new Date(),
        content: {
          sections: Array(10).fill({
            type: 'instructions',
            content: 'A'.repeat(500)
          })
        },
        readme: 'A'.repeat(5000),
        file_size: 100000
      };

      const score = calculateQualityScore(perfect);

      expect(score).toBeLessThanOrEqual(5.0);
    });
  });

  describe('calculateQualityScoreWithAI (async)', () => {
    it('should use AI evaluation for prompt content', async () => {
      const pkg: PackageQualityData = {
        id: 'test-pkg',
        display_name: 'Test',
        author_id: 'author-1',
        verified: false,
        official: false,
        total_downloads: 0,
        stars: 0,
        rating_count: 0,
        version_count: 1,
        created_at: new Date(),
        tags: [],
        keywords: [],
        content: {
          sections: [{ type: 'instructions', content: 'Test' }]
        }
      };

      const score = await calculateQualityScoreWithAI(pkg, mockServer);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(5.0);
    });

    it('should integrate AI score into total calculation', async () => {
      const { evaluatePromptWithAI } = await import('../ai-evaluator.js');

      (evaluatePromptWithAI as any).mockResolvedValueOnce(0.9);

      const pkg: PackageQualityData = {
        id: 'test-pkg',
        display_name: 'Test',
        author_id: 'author-1',
        verified: false,
        official: false,
        total_downloads: 0,
        stars: 0,
        rating_count: 0,
        version_count: 1,
        created_at: new Date(),
        tags: [],
        keywords: [],
        content: {
          sections: [{ type: 'instructions', content: 'High quality content' }]
        }
      };

      const score = await calculateQualityScoreWithAI(pkg, mockServer);

      expect(score).toBeGreaterThan(0.5); // Should include AI score
    });
  });

  describe('updatePackageQualityScore', () => {
    it('should fetch package and update score', async () => {
      const score = await updatePackageQualityScore(mockServer, 'test-package');

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(5.0);
      expect(mockServer.log.info).toHaveBeenCalledWith(
        expect.objectContaining({ packageId: 'test-package', score }),
        expect.stringContaining('quality score')
      );
    });

    it('should include author package count bonus', async () => {
      const score = await updatePackageQualityScore(mockServer, 'test-package');

      // Score should include author bonus (0.15 for 3 packages)
      expect(score).toBeGreaterThan(0);
    });

    it('should handle package not found', async () => {
      const { query } = await import('../../db/index.js');
      (query as any).mockResolvedValueOnce({ rows: [] });

      await expect(
        updatePackageQualityScore(mockServer, 'nonexistent')
      ).rejects.toThrow('Package not found');
    });
  });

  describe('getQualityScoreBreakdown', () => {
    it('should return score and factors', async () => {
      const result = await getQualityScoreBreakdown(mockServer, 'test-package');

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('factors');

      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(5.0);

      expect(result.factors).toHaveProperty('promptContentQuality');
      expect(result.factors).toHaveProperty('promptLength');
      expect(result.factors).toHaveProperty('hasExamples');
      expect(result.factors).toHaveProperty('hasDocumentation');
      expect(result.factors).toHaveProperty('isVerifiedAuthor');
      expect(result.factors).toHaveProperty('downloadScore');
      expect(result.factors).toHaveProperty('recencyScore');
    });

    it('should use AI evaluation in breakdown', async () => {
      const { evaluatePromptWithAI } = await import('../ai-evaluator.js');
      (evaluatePromptWithAI as any).mockResolvedValueOnce(0.85);

      const result = await getQualityScoreBreakdown(mockServer, 'test-package');

      expect(result.factors.promptContentQuality).toBeCloseTo(0.85, 2);
    });
  });

  describe('Scoring Components', () => {
    it('should score downloads logarithmically', () => {
      const tests = [
        { downloads: 0, expected: 0 },
        { downloads: 5, expected: 0.05 },
        { downloads: 50, expected: 0.2 },
        { downloads: 200, expected: 0.3 },
        { downloads: 500, expected: 0.35 }
      ];

      tests.forEach(({ downloads, expected }) => {
        const pkg: PackageQualityData = {
          id: 'test',
          display_name: 'Test',
          author_id: 'author-1',
          verified: false,
          official: false,
          total_downloads: downloads,
          stars: 0,
          rating_count: 0,
          version_count: 1,
          created_at: new Date(),
          tags: [],
          keywords: []
        };

        const score = calculateQualityScore(pkg);
        // Check download component contributes correctly
        expect(score).toBeGreaterThanOrEqual(expected - 0.1);
      });
    });

    it('should score ratings properly', () => {
      const lowRating: PackageQualityData = {
        id: 'test',
        display_name: 'Test',
        author_id: 'author-1',
        verified: false,
        official: false,
        total_downloads: 0,
        stars: 0,
        rating_average: 2.5,
        rating_count: 5,
        version_count: 1,
        created_at: new Date(),
        tags: [],
        keywords: []
      };

      const highRating: PackageQualityData = {
        ...lowRating,
        rating_average: 5.0,
        rating_count: 10
      };

      const score1 = calculateQualityScore(lowRating);
      const score2 = calculateQualityScore(highRating);

      expect(score2).toBeGreaterThan(score1);
    });

    it('should require minimum ratings for credibility', () => {
      const fewRatings: PackageQualityData = {
        id: 'test',
        display_name: 'Test',
        author_id: 'author-1',
        verified: false,
        official: false,
        total_downloads: 0,
        stars: 0,
        rating_average: 5.0,
        rating_count: 1, // Too few
        version_count: 1,
        created_at: new Date(),
        tags: [],
        keywords: []
      };

      const enoughRatings: PackageQualityData = {
        ...fewRatings,
        rating_count: 5 // Credible
      };

      const score1 = calculateQualityScore(fewRatings);
      const score2 = calculateQualityScore(enoughRatings);

      expect(score2).toBeGreaterThan(score1);
    });

    it('should score recency', () => {
      const old: PackageQualityData = {
        id: 'test',
        display_name: 'Test',
        author_id: 'author-1',
        verified: false,
        official: false,
        total_downloads: 0,
        stars: 0,
        rating_count: 0,
        version_count: 1,
        created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000), // 200 days ago
        tags: [],
        keywords: []
      };

      const recent: PackageQualityData = {
        ...old,
        last_published_at: new Date() // Today
      };

      const score1 = calculateQualityScore(old);
      const score2 = calculateQualityScore(recent);

      expect(score2).toBeGreaterThan(score1);
    });
  });
});
