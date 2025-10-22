/**
 * Check Upload Status
 * Verifies uploaded packages are accessible in the registry
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

const REGISTRY_URL = process.env.PRMP_REGISTRY_URL || 'https://registry.prpm.dev';

interface UploadResult {
  success: boolean;
  package: string;
  error?: string;
}

interface UploadResults {
  timestamp: string;
  total: number;
  successful: number;
  failed: number;
  results: UploadResult[];
}

/**
 * Check if package exists in registry
 */
async function checkPackage(packageName: string): Promise<{ exists: boolean; error?: string }> {
  try {
    const response = await fetch(`${REGISTRY_URL}/api/v1/packages/${packageName}`);

    if (response.status === 404) {
      return { exists: false };
    }

    if (!response.ok) {
      return { exists: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { exists: true };
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Main check function
 */
async function main() {
  console.log('🔍 PRMP Upload Status Checker\n');

  // Load upload results
  const resultsPath = join(process.cwd(), 'scripts', 'seed', 'upload-results.json');
  console.log(`📂 Loading results from ${resultsPath}...`);

  const resultsData = await readFile(resultsPath, 'utf-8');
  const results: UploadResults = JSON.parse(resultsData);

  console.log(`   Upload timestamp: ${results.timestamp}`);
  console.log(`   Total packages: ${results.total}`);
  console.log(`   Successful uploads: ${results.successful}`);
  console.log(`   Failed uploads: ${results.failed}\n`);

  // Check successful uploads
  const successfulPackages = results.results.filter(r => r.success);
  console.log(`🔎 Verifying ${successfulPackages.length} packages in registry...\n`);

  let verified = 0;
  let missing = 0;
  let errors = 0;

  for (const result of successfulPackages) {
    const status = await checkPackage(result.package);

    if (status.exists) {
      verified++;
      console.log(`   ✓ ${result.package}`);
    } else if (status.error) {
      errors++;
      console.log(`   ⚠ ${result.package} - Error: ${status.error}`);
    } else {
      missing++;
      console.log(`   ✗ ${result.package} - Not found`);
    }

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Verification Summary');
  console.log('='.repeat(60));
  console.log(`✓ Verified: ${verified}/${successfulPackages.length}`);
  console.log(`✗ Missing: ${missing}/${successfulPackages.length}`);
  console.log(`⚠ Errors: ${errors}/${successfulPackages.length}`);

  if (missing > 0) {
    console.log('\n⚠️  Some packages may not have been processed yet.');
    console.log('   Wait a few minutes and run this script again.');
  }

  if (errors > 0) {
    console.log('\n⚠️  Some packages could not be verified.');
    console.log('   Check registry logs or network connectivity.');
  }

  if (verified === successfulPackages.length) {
    console.log('\n✅ All packages verified successfully!\n');
  } else {
    console.log('\n');
  }
}

// Run check
main().catch(console.error);
