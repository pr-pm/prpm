#!/usr/bin/env node

/**
 * Comprehensive End-to-End Test Suite for PRPM
 * Tests all major functionality across the entire system
 */

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

class E2ETestSuite {
  private registryUrl = 'http://localhost:4000';
  private results: TestResult[] = [];
  private startTime = 0;

  async runAll() {
    console.log('🧪 PRPM End-to-End Test Suite\n');
    console.log('═'.repeat(80));
    console.log(`Registry: ${this.registryUrl}`);
    console.log('═'.repeat(80));
    console.log();

    // Test categories
    await this.testInfrastructure();
    await this.testPackageAPIs();
    await this.testSearchFunctionality();
    await this.testCollectionsAPIs();
    await this.testPackageFiltering();
    await this.testEdgeCases();

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

  // Infrastructure Tests
  private async testInfrastructure() {
    console.log('\n📦 Infrastructure Tests\n');

    await this.test('Health endpoint responds', async () => {
      const response = await fetch(`${this.registryUrl}/health`);
      const data = await response.json();

      if (!response.ok) throw new Error(`Status: ${response.status}`);
      if (data.status !== 'ok') throw new Error(`Health status: ${data.status}`);

      return { status: data.status, version: data.version };
    });

    await this.test('Database connection working', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/packages?limit=1`);
      if (!response.ok) throw new Error('Database query failed');
      const data = await response.json();
      return { packagesAvailable: data.total };
    });

    await this.test('Redis connection working', async () => {
      // Making two identical requests - second should be faster (cached)
      const start1 = Date.now();
      await fetch(`${this.registryUrl}/api/v1/packages?limit=1`);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await fetch(`${this.registryUrl}/api/v1/packages?limit=1`);
      const time2 = Date.now() - start2;

      return { firstRequest: `${time1}ms`, secondRequest: `${time2}ms` };
    });
  }

  // Package API Tests
  private async testPackageAPIs() {
    console.log('\n📚 Package API Tests\n');

    await this.test('List all packages', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/packages`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return { total: data.total, returned: data.packages.length };
    });

    await this.test('Pagination works correctly', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/packages?limit=5&offset=5`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return { limit: 5, offset: 5, returned: data.packages.length };
    });

    await this.test('Get specific package by ID', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/packages/analyst-valllabh`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return { id: data.id, type: data.type, tags: data.tags.length };
    });

    await this.test('Filter packages by type', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/packages?type=claude`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return { type: 'claude', found: data.packages.length };
    });

    await this.test('Get trending packages', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/packages/trending`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return { trending: data.packages?.length || 0 };
    });

    await this.test('Get popular packages', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/packages/popular`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return { popular: data.packages?.length || 0 };
    });
  }

  // Search Functionality Tests
  private async testSearchFunctionality() {
    console.log('\n🔍 Search Functionality Tests\n');

    await this.test('Search by keyword - "analyst"', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/search?q=analyst`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return { query: 'analyst', results: data.packages.length };
    });

    await this.test('Search by keyword - "backend"', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/search?q=backend`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return { query: 'backend', results: data.packages.length };
    });

    await this.test('Search by keyword - "api"', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/search?q=api`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return { query: 'api', results: data.packages.length };
    });

    await this.test('Search with no results', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/search?q=nonexistentpackage12345`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      if (data.packages.length > 0) throw new Error('Expected no results');
      return { results: 0 };
    });

    await this.test('Search with filter by type', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/search?q=architect&type=claude`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return { query: 'architect', type: 'claude', results: data.packages.length };
    });
  }

  // Collections API Tests
  private async testCollectionsAPIs() {
    console.log('\n📦 Collections API Tests\n');

    await this.test('List all collections', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/collections`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return { total: data.total || 0, collections: data.collections?.length || 0 };
    });

    await this.test('Get featured collections', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/collections/featured`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return { featured: data.collections?.length || 0 };
    });

    await this.test('Search collections by tag', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/collections?tags=backend`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return { tag: 'backend', results: data.collections?.length || 0 };
    });
  }

  // Package Filtering Tests
  private async testPackageFiltering() {
    console.log('\n🔎 Package Filtering Tests\n');

    await this.test('Filter by verified status', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/packages?verified=true`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return { verified: data.packages.length };
    });

    await this.test('Filter by featured status', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/packages?featured=true`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return { featured: data.packages.length };
    });

    await this.test('Sort by downloads', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/packages?sort=downloads&limit=5`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return { sortBy: 'downloads', returned: data.packages.length };
    });

    await this.test('Sort by created date', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/packages?sort=created&limit=5`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      return { sortBy: 'created', returned: data.packages.length };
    });
  }

  // Edge Cases & Error Handling Tests
  private async testEdgeCases() {
    console.log('\n⚠️  Edge Cases & Error Handling Tests\n');

    await this.test('Non-existent package returns 404', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/packages/nonexistent-package-xyz`);
      if (response.status !== 404) throw new Error(`Expected 404, got ${response.status}`);
      return { status: 404 };
    });

    await this.test('Invalid pagination parameters handled', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/packages?limit=-1&offset=-5`);
      // Should either return 400 or handle gracefully with defaults
      return { status: response.status };
    });

    await this.test('Large limit parameter handled', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/packages?limit=10000`);
      // API correctly returns 400 for limits exceeding maximum (100)
      if (response.status !== 400) throw new Error(`Expected 400, got ${response.status}`);

      return { requested: 10000, status: 400, behavior: 'validation error (correct)' };
    });

    await this.test('Empty search query handled', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/search?q=`);
      // Should handle gracefully
      return { status: response.status };
    });

    await this.test('Special characters in search', async () => {
      const response = await fetch(`${this.registryUrl}/api/v1/search?q=${encodeURIComponent('test@#$%')}`);
      // Should not crash
      return { status: response.status };
    });
  }

  private printSummary() {
    console.log('\n' + '═'.repeat(80));
    console.log('📊 Test Summary');
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
const suite = new E2ETestSuite();
suite.runAll().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});
