/**
 * Backfill license information for existing packages
 *
 * This script adds MIT license information to all packages that don't have license data.
 * It uses the standard MIT license text for attribution compliance.
 */

import { Pool } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

const MIT_LICENSE_TEXT = `MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

async function backfillLicenses() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking packages without license information...\n');

    // Count packages without license info
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM packages WHERE license_text IS NULL'
    );
    const totalPackages = parseInt(countResult.rows[0].count);

    if (totalPackages === 0) {
      console.log('✅ All packages already have license information!');
      return;
    }

    console.log(`📦 Found ${totalPackages} packages without license information`);
    console.log('🔄 Backfilling with MIT license...\n');

    // Get packages with repository URLs to generate license URLs
    const packagesWithRepos = await pool.query(`
      SELECT id, repository_url
      FROM packages
      WHERE license_text IS NULL AND repository_url IS NOT NULL
    `);

    // Update packages with repository URLs (can generate license_url)
    let updated = 0;
    for (const pkg of packagesWithRepos.rows) {
      // Extract owner/repo from GitHub URL
      const githubMatch = pkg.repository_url.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);
      let licenseUrl = null;

      if (githubMatch) {
        const [, owner, repo] = githubMatch;
        licenseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/LICENSE`;
      }

      await pool.query(
        `UPDATE packages
         SET license = 'MIT',
             license_text = $1,
             license_url = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [MIT_LICENSE_TEXT, licenseUrl, pkg.id]
      );

      updated++;
      if (updated % 100 === 0) {
        console.log(`   Updated ${updated}/${packagesWithRepos.rows.length} packages with repos...`);
      }
    }

    console.log(`✅ Updated ${updated} packages with repository URLs\n`);

    // Update packages without repository URLs (no license_url)
    const packagesWithoutRepos = await pool.query(`
      SELECT COUNT(*) as count
      FROM packages
      WHERE license_text IS NULL AND repository_url IS NULL
    `);

    const withoutReposCount = parseInt(packagesWithoutRepos.rows[0].count);

    if (withoutReposCount > 0) {
      await pool.query(
        `UPDATE packages
         SET license = 'MIT',
             license_text = $1,
             updated_at = NOW()
         WHERE license_text IS NULL AND repository_url IS NULL`,
        [MIT_LICENSE_TEXT]
      );

      console.log(`✅ Updated ${withoutReposCount} packages without repository URLs\n`);
    }

    // Final count
    const finalResult = await pool.query(
      'SELECT COUNT(*) as count FROM packages WHERE license_text IS NOT NULL'
    );
    const withLicense = parseInt(finalResult.rows[0].count);

    console.log('📊 Summary:');
    console.log(`   Total packages: ${totalPackages + withLicense}`);
    console.log(`   With license info: ${withLicense}`);
    console.log(`   Backfilled: ${totalPackages}`);
    console.log('');
    console.log('✨ Backfill complete!');

  } catch (error) {
    console.error('❌ Error during backfill:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the backfill
backfillLicenses().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
