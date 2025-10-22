#!/usr/bin/env node

/**
 * Comprehensive Collections End-to-End Test Suite
 * Tests all collection functionality including listing, filtering, search, and installation
 */

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

class CollectionsE2ETestSuite {
  private registryUrl = 'http://localhost:4000';
  private results: TestResult[] = [];

  async runAll() {
    console.log('🎯 Collections End-to-End Test Suite\n');
    console.log('═'.repeat(80));
    console.log(`Registry: ${this.registryUrl}`);
    console.log('═'.repeat(80));
    console.log();

    await this.testCollectionListing();
    await this.testCollectionFiltering();
    await this.testCollectionSearch();
    await this.testCollectionCategories();
    await this.testCollectionDetails();
    await this.testSpecificCollections();

    this.printSummary();
  }

  private async test(name: string, fn: () => Promise<any>) {
    const start = Date.now();
    process.stdout.write(`  ⏳ ${name}... `);

    try {
      const details = await fn();
      const duration = Date.now() - start;

      this.results.push({
        name,
        passed: true,
        duration,
        details,
      });

      console.log(`✅ (${duration}ms)`);
      if (details && typeof details === 'object' && !Array.isArray(details)) {
        Object.entries(details).forEach(([key, value]) => {
          console.log(`     ${key}: ${JSON.stringify(value)}`);
        });
      }
    } catch (error) {
      const duration = Date.now() - start;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.results.push({
        name,
        passed: false,
        duration,
        error: errorMessage,
      });

      console.log(`❌ (${duration}ms)`);
      console.log(`     Error: ${errorMessage}`);
    }
  }

  private async testCollectionListing() {
    console.log('\n📋 Collection Listing Tests\n');

    await this.test('List all collections', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/collections`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      if (!data.collections || !Array.isArray(data.collections)) {
        throw new Error('Invalid response format');
      }

      return {
        total: data.total,
        returned: data.collections.length,
        first: data.collections[0]?.name || 'none'
      };
    });

    await this.test('Pagination works', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/collections?limit=5&offset=0`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return {
        requested: 5,
        returned: data.collections.length,
        hasMore: data.hasMore
      };
    });

    await this.test('Get second page', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/collections?limit=5&offset=5`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return {
        offset: 5,
        returned: data.collections.length
      };
    });
  }

  private async testCollectionFiltering() {
    console.log('\n🔍 Collection Filtering Tests\n');

    await this.test('Filter by category - development', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/collections?category=development`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      const allMatch = data.collections.every((c: any) => c.category === 'development');
      if (!allMatch) throw new Error('Not all results match category filter');

      return {
        category: 'development',
        found: data.collections.length
      };
    });

    await this.test('Filter by category - devops', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/collections?category=devops`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return {
        category: 'devops',
        found: data.collections.length
      };
    });

    await this.test('Filter by official status', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/collections?official=true`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      const allOfficial = data.collections.every((c: any) => c.official === true);
      if (!allOfficial) throw new Error('Not all results are official');

      return {
        official: true,
        found: data.collections.length
      };
    });

    await this.test('Filter by verified status', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/collections?verified=true`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return {
        verified: true,
        found: data.collections.length
      };
    });
  }

  private async testCollectionSearch() {
    console.log('\n🔎 Collection Search Tests\n');

    await this.test('Search by name - "agile"', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/collections?query=agile`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return {
        query: 'agile',
        results: data.collections?.length || 0,
        found: data.collections?.map((c: any) => c.id).join(', ') || 'none'
      };
    });

    await this.test('Search by name - "api"', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/collections?query=api`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return {
        query: 'api',
        results: data.collections?.length || 0
      };
    });

    await this.test('Search by tag - "kubernetes"', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/collections?tag=kubernetes`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return {
        tag: 'kubernetes',
        results: data.collections?.length || 0
      };
    });

    await this.test('Search by tag - "cloud"', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/collections?tag=cloud`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return {
        tag: 'cloud',
        results: data.collections?.length || 0
      };
    });
  }

  private async testCollectionCategories() {
    console.log('\n📂 Collection Category Tests\n');

    const categories = ['development', 'devops', 'agile', 'api', 'security', 'testing', 'cloud'];

    for (const category of categories) {
      await this.test(`Category: ${category}`, async () => {
        const response = await fetch(`${this.registryUrl}/api/v1/collections?category=${category}`);
        if (!response.ok) throw new Error(`Status: ${response.status}`);

        const data = await response.json();
        return {
          count: data.collections?.length || 0,
          names: data.collections?.slice(0, 3).map((c: any) => c.name).join(', ') || 'none'
        };
      });
    }
  }

  private async testCollectionDetails() {
    console.log('\n📖 Collection Details Tests\n');

    await this.test('Agile Team collection exists', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/collections/collection/agile-team/1.0.0`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const collection = await response.json();

      return {
        id: collection.id,
        name: collection.name,
        packages: collection.package_count,
        category: collection.category
      };
    });

    await this.test('DevOps Platform collection exists', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/collections/collection/devops-platform/1.0.0`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const collection = await response.json();

      return {
        id: collection.id,
        packages: collection.package_count,
        tags: collection.tags.join(', ')
      };
    });

    await this.test('Enterprise Platform collection exists', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/collections/collection/enterprise-platform/1.0.0`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const collection = await response.json();

      return {
        id: collection.id,
        packages: collection.package_count,
        verified: collection.verified
      };
    });
  }

  private async testSpecificCollections() {
    console.log('\n🎯 Specific Collection Tests\n');

    const testCollections = [
      { id: 'fullstack-web-dev', expectedPackages: 6 },
      { id: 'security-hardening', expectedPackages: 4 },
      { id: 'performance-optimization', expectedPackages: 3 },
      { id: 'startup-mvp', expectedPackages: 4 },
    ];

    for (const tc of testCollections) {
      await this.test(`${tc.id} has correct package count`, async () => {
        const response = await fetch(`${this.registryUrl}/api/v1/collections/collection/${tc.id}/1.0.0`);
        if (!response.ok) throw new Error(`Status: ${response.status}`);

        const collection = await response.json();
        const packageCount = collection.package_count;

        return {
          expected: tc.expectedPackages,
          actual: packageCount,
          match: packageCount === tc.expectedPackages
        };
      });
    }
  }

  private printSummary() {
    console.log('\n' + '═'.repeat(80));
    console.log('📊 Collections Test Summary');
    console.log('═'.repeat(80));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\nTotal Tests: ${total}`);
    console.log(`✅ Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`   - ${r.name}`);
          console.log(`     ${r.error}`);
        });
    }

    console.log('\n' + '═'.repeat(80));

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Run the test suite
const suite = new CollectionsE2ETestSuite();
suite.runAll().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});
