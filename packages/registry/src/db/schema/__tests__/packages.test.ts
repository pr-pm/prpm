import { describe, it, expect } from 'vitest';
import { packages, type Package, type NewPackage } from '../packages.js';

describe('Packages Schema', () => {
  it('should have correct TypeScript types for Package', () => {
    // This test verifies compile-time type safety for the select type
    const pkg: Package = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'test-package',
      description: 'A test package',
      authorId: '550e8400-e29b-41d4-a716-446655440001',
      orgId: null,
      type: 'cursor',
      license: 'MIT',
      licenseText: null,
      licenseUrl: null,
      repositoryUrl: 'https://github.com/test/package',
      homepageUrl: null,
      documentationUrl: null,
      tags: ['test', 'example'],
      keywords: ['keyword1'],
      category: 'development',
      visibility: 'public',
      deprecated: false,
      deprecatedReason: null,
      verified: false,
      featured: false,
      official: false,
      totalDownloads: 100,
      weeklyDownloads: 10,
      monthlyDownloads: 50,
      versionCount: 3,
      qualityScore: null,
      qualityExplanation: null,
      ratingAverage: null,
      ratingCount: 0,
      scoreTotal: 0,
      scorePopularity: 0,
      scoreQuality: 0,
      scoreTrust: 0,
      scoreRecency: 0,
      scoreCompleteness: 0,
      scoreUpdatedAt: null,
      viewCount: 0,
      installCount: 0,
      installRate: '0',
      downloadsLast7Days: 0,
      downloadsLast30Days: 0,
      trendingScore: '0',
      snippet: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastPublishedAt: null,
    };

    expect(pkg).toBeDefined();
    expect(pkg.name).toBe('test-package');
    expect(pkg.type).toBe('cursor');
  });

  it('should have correct TypeScript types for NewPackage', () => {
    // This test verifies compile-time type safety for the insert type
    const newPkg: NewPackage = {
      name: 'new-package',
      description: 'A new package',
      type: 'claude',
      authorId: '550e8400-e29b-41d4-a716-446655440001',
      license: 'Apache-2.0',
      repositoryUrl: 'https://github.com/test/new-package',
      tags: ['new', 'test'],
    };

    expect(newPkg).toBeDefined();
    expect(newPkg.name).toBe('new-package');
    expect(newPkg.type).toBe('claude');
  });

  it('should allow partial inserts with defaults', () => {
    // Verify that fields with defaults are optional
    const minimalPkg: NewPackage = {
      name: 'minimal-package',
      type: 'generic',
    };

    expect(minimalPkg).toBeDefined();
    expect(minimalPkg.name).toBe('minimal-package');
    expect(minimalPkg.type).toBe('generic');
  });

  it('should handle verified official packages', () => {
    // Test type safety for verified and official packages
    const officialPkg: Package = {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'official-package',
      description: 'An official verified package',
      authorId: null,
      orgId: '550e8400-e29b-41d4-a716-446655440003',
      type: 'cursor',
      license: 'MIT',
      licenseText: 'MIT License text here',
      licenseUrl: 'https://github.com/test/official-package/LICENSE',
      repositoryUrl: 'https://github.com/test/official-package',
      homepageUrl: 'https://official-package.dev',
      documentationUrl: 'https://docs.official-package.dev',
      tags: ['official', 'verified'],
      keywords: ['production', 'stable'],
      category: 'productivity',
      visibility: 'public',
      deprecated: false,
      deprecatedReason: null,
      verified: true,
      featured: true,
      official: true,
      totalDownloads: 10000,
      weeklyDownloads: 500,
      monthlyDownloads: 2000,
      versionCount: 25,
      qualityScore: '4.85',
      qualityExplanation: 'High quality package with excellent documentation',
      ratingAverage: '4.80',
      ratingCount: 150,
      scoreTotal: 95,
      scorePopularity: 28,
      scoreQuality: 29,
      scoreTrust: 20,
      scoreRecency: 10,
      scoreCompleteness: 8,
      scoreUpdatedAt: new Date(),
      viewCount: 5000,
      installCount: 2500,
      installRate: '0.5',
      downloadsLast7Days: 500,
      downloadsLast30Days: 2000,
      trendingScore: '0.85',
      snippet: 'This is a preview snippet of the package content...',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      lastPublishedAt: new Date(),
    };

    expect(officialPkg).toBeDefined();
    expect(officialPkg.official).toBe(true);
    expect(officialPkg.verified).toBe(true);
    expect(officialPkg.featured).toBe(true);
  });

  it('should correctly map camelCase to snake_case', () => {
    // Verify that the schema correctly maps TypeScript camelCase to database snake_case
    const table = packages;

    // Check that the table name is correct
    expect(table).toBeDefined();

    // Verify column name mappings exist
    expect(table.authorId.name).toBe('author_id');
    expect(table.orgId.name).toBe('org_id');
    expect(table.licenseText.name).toBe('license_text');
    expect(table.licenseUrl.name).toBe('license_url');
    expect(table.repositoryUrl.name).toBe('repository_url');
    expect(table.homepageUrl.name).toBe('homepage_url');
    expect(table.documentationUrl.name).toBe('documentation_url');
    expect(table.deprecatedReason.name).toBe('deprecated_reason');
    expect(table.totalDownloads.name).toBe('total_downloads');
    expect(table.weeklyDownloads.name).toBe('weekly_downloads');
    expect(table.monthlyDownloads.name).toBe('monthly_downloads');
    expect(table.versionCount.name).toBe('version_count');
    expect(table.qualityScore.name).toBe('quality_score');
    expect(table.qualityExplanation.name).toBe('quality_explanation');
    expect(table.ratingAverage.name).toBe('rating_average');
    expect(table.ratingCount.name).toBe('rating_count');
    expect(table.scoreTotal.name).toBe('score_total');
    expect(table.scorePopularity.name).toBe('score_popularity');
    expect(table.scoreQuality.name).toBe('score_quality');
    expect(table.scoreTrust.name).toBe('score_trust');
    expect(table.scoreRecency.name).toBe('score_recency');
    expect(table.scoreCompleteness.name).toBe('score_completeness');
    expect(table.scoreUpdatedAt.name).toBe('score_updated_at');
    expect(table.viewCount.name).toBe('view_count');
    expect(table.installCount.name).toBe('install_count');
    expect(table.installRate.name).toBe('install_rate');
    expect(table.downloadsLast7Days.name).toBe('downloads_last_7_days');
    expect(table.downloadsLast30Days.name).toBe('downloads_last_30_days');
    expect(table.trendingScore.name).toBe('trending_score');
    expect(table.createdAt.name).toBe('created_at');
    expect(table.updatedAt.name).toBe('updated_at');
    expect(table.lastPublishedAt.name).toBe('last_published_at');
  });

  it('should enforce type constraints', () => {
    // Test that TypeScript catches type errors at compile time
    const pkg: Package = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'test-package',
      description: 'A test package',
      authorId: '550e8400-e29b-41d4-a716-446655440001',
      orgId: null,
      type: 'cursor',
      license: 'MIT',
      licenseText: null,
      licenseUrl: null,
      repositoryUrl: 'https://github.com/test/package',
      homepageUrl: null,
      documentationUrl: null,
      tags: ['test'],
      keywords: ['keyword1'],
      category: 'development',
      visibility: 'public',
      deprecated: false,
      deprecatedReason: null,
      verified: false,
      featured: false,
      official: false,
      totalDownloads: 100,
      weeklyDownloads: 10,
      monthlyDownloads: 50,
      versionCount: 3,
      qualityScore: null,
      qualityExplanation: null,
      ratingAverage: null,
      ratingCount: 0,
      scoreTotal: 0,
      scorePopularity: 0,
      scoreQuality: 0,
      scoreTrust: 0,
      scoreRecency: 0,
      scoreCompleteness: 0,
      scoreUpdatedAt: null,
      viewCount: 0,
      installCount: 0,
      installRate: '0',
      downloadsLast7Days: 0,
      downloadsLast30Days: 0,
      trendingScore: '0',
      snippet: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastPublishedAt: null,
    };

    // These should be the correct types
    const idIsString: string = pkg.id;
    const nameIsString: string = pkg.name;
    const typeIsString: string = pkg.type;
    const verifiedIsBoolean: boolean = pkg.verified;
    const totalDownloadsIsNumber: number = pkg.totalDownloads;
    const createdAtIsDate: Date = pkg.createdAt;
    const tagsIsArray: string[] | null = pkg.tags;

    expect(idIsString).toBeDefined();
    expect(nameIsString).toBeDefined();
    expect(typeIsString).toBeDefined();
    expect(verifiedIsBoolean).toBeDefined();
    expect(totalDownloadsIsNumber).toBeDefined();
    expect(createdAtIsDate).toBeDefined();
    expect(tagsIsArray).toBeDefined();
  });

  it('should handle organization relationship', () => {
    // Test type safety for packages with organization ownership
    const orgPkg: NewPackage = {
      name: 'org-package',
      type: 'cursor',
      description: 'Package owned by an organization',
      orgId: '550e8400-e29b-41d4-a716-446655440003',
      authorId: null,
    };

    expect(orgPkg).toBeDefined();
    expect(orgPkg.orgId).toBe('550e8400-e29b-41d4-a716-446655440003');
    expect(orgPkg.authorId).toBe(null);
  });

  it('should handle quality scoring fields', () => {
    // Test quality scoring component fields
    const scoredPkg: Package = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'scored-package',
      description: 'A package with quality scores',
      authorId: '550e8400-e29b-41d4-a716-446655440001',
      orgId: null,
      type: 'cursor',
      license: 'MIT',
      licenseText: null,
      licenseUrl: null,
      repositoryUrl: null,
      homepageUrl: null,
      documentationUrl: null,
      tags: [],
      keywords: [],
      category: null,
      visibility: 'public',
      deprecated: false,
      deprecatedReason: null,
      verified: false,
      featured: false,
      official: false,
      totalDownloads: 500,
      weeklyDownloads: 50,
      monthlyDownloads: 200,
      versionCount: 5,
      qualityScore: '4.25',
      qualityExplanation: 'Good package with room for improvement',
      ratingAverage: '4.00',
      ratingCount: 25,
      scoreTotal: 75,
      scorePopularity: 18,
      scoreQuality: 22,
      scoreTrust: 15,
      scoreRecency: 10,
      scoreCompleteness: 10,
      scoreUpdatedAt: new Date(),
      viewCount: 1000,
      installCount: 500,
      installRate: '0.5',
      downloadsLast7Days: 50,
      downloadsLast30Days: 200,
      trendingScore: '0.35',
      snippet: 'Preview text...',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastPublishedAt: new Date(),
    };

    expect(scoredPkg).toBeDefined();
    expect(scoredPkg.scoreTotal).toBe(75);
    expect(scoredPkg.scorePopularity).toBe(18);
    expect(scoredPkg.scoreQuality).toBe(22);
    expect(scoredPkg.scoreTrust).toBe(15);
    expect(scoredPkg.scoreRecency).toBe(10);
    expect(scoredPkg.scoreCompleteness).toBe(10);
  });
});
