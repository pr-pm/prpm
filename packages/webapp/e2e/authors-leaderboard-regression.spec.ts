import { test, expect } from '@playwright/test';

/**
 * Authors Page - Leaderboard Design Regression Tests
 *
 * These tests protect against visual and functional regressions on the authors page.
 * They verify the leaderboard table layout, ranking system, and overall design integrity.
 */

test.describe('Authors Page - Leaderboard Design Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API response with consistent test data
    await page.route('**/api/v1/search/authors*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authors: [
            {
              author: 'topauthor1',
              package_count: 150,
              total_downloads: 10000,
              verified: true,
              latest_package: 'amazing-package-v1'
            },
            {
              author: 'topauthor2',
              package_count: 100,
              total_downloads: 8000,
              verified: true,
              latest_package: 'cool-package-v2'
            },
            {
              author: 'topauthor3',
              package_count: 75,
              total_downloads: 5000,
              verified: false,
              latest_package: 'great-package-v3'
            },
            {
              author: 'author4',
              package_count: 50,
              total_downloads: 3000,
              verified: true,
              latest_package: 'package-four'
            },
            {
              author: 'author5',
              package_count: 25,
              total_downloads: 1000,
              verified: false,
              latest_package: 'package-five'
            }
          ],
          total: 5
        })
      });
    });
  });

  test.describe('Page Header and Title', () => {
    test('should display gradient "Top Authors" heading', async ({ page }) => {
      await page.goto('/authors');

      // Check for the main heading
      const heading = page.getByRole('heading', { name: 'Top Authors', exact: true });
      await expect(heading).toBeVisible();

      // Verify gradient styling is present
      await expect(heading).toHaveClass(/bg-gradient-to-r/);
    });

    test('should display subtitle text', async ({ page }) => {
      await page.goto('/authors');

      await expect(page.getByText('The amazing contributors making PRPM possible')).toBeVisible();
    });

    test('should have back to home link', async ({ page }) => {
      await page.goto('/authors');

      const backLink = page.getByRole('link', { name: '← Back to home' });
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute('href', '/');
    });
  });

  test.describe('Stats Summary Section', () => {
    test('should display total authors count', async ({ page }) => {
      await page.goto('/authors');

      // Wait for data to load
      await page.waitForSelector('text=5+ Authors');

      await expect(page.getByText('5+ Authors')).toBeVisible();
    });

    test('should display total packages count', async ({ page }) => {
      await page.goto('/authors');

      // Sum: 150 + 100 + 75 + 50 + 25 = 400
      await expect(page.getByText('400 Packages')).toBeVisible();
    });

    test('should display total downloads count', async ({ page }) => {
      await page.goto('/authors');

      // Sum: 10000 + 8000 + 5000 + 3000 + 1000 = 27,000
      await expect(page.getByText('27,000 Downloads')).toBeVisible();
    });

    test('should display emoji icons for stats', async ({ page }) => {
      await page.goto('/authors');

      await expect(page.getByText('👥')).toBeVisible(); // Authors icon
      await expect(page.getByText('📦')).toBeVisible(); // Packages icon
      await expect(page.getByText('⬇️')).toBeVisible(); // Downloads icon
    });
  });

  test.describe('CTA Banner', () => {
    test('should display CTA banner with correct text', async ({ page }) => {
      await page.goto('/authors');

      await expect(page.getByText('Want to Join the Leaderboard?')).toBeVisible();
      await expect(page.getByText('Contribute packages to PRPM')).toBeVisible();
    });

    test('should have Sign in with GitHub button', async ({ page }) => {
      await page.goto('/authors');

      const githubButton = page.getByRole('link', { name: /Sign in with GitHub/i });
      await expect(githubButton).toBeVisible();
      await expect(githubButton).toHaveAttribute('href', '/login');
    });

    test('should display GitHub icon in button', async ({ page }) => {
      await page.goto('/authors');

      const githubButton = page.getByRole('link', { name: /Sign in with GitHub/i });

      // Check for SVG icon inside button
      const svg = githubButton.locator('svg');
      await expect(svg).toBeVisible();
    });

    test('should have gradient background on CTA banner', async ({ page }) => {
      await page.goto('/authors');

      const banner = page.locator('div').filter({ hasText: 'Want to Join the Leaderboard?' }).first();
      await expect(banner).toHaveClass(/bg-gradient-to-r/);
      await expect(banner).toHaveClass(/from-prpm-purple/);
    });
  });

  test.describe('Leaderboard Table Structure', () => {
    test('should display leaderboard table headers', async ({ page }) => {
      await page.goto('/authors');

      // Wait for table to load
      await page.waitForSelector('text=@topauthor1');

      // Check for table header row with gradient background
      const headerRow = page.locator('div').filter({ hasText: /^#.*Author.*Packages.*Downloads.*Status$/ }).first();
      await expect(headerRow).toBeVisible();
      await expect(headerRow).toHaveClass(/bg-gradient-to-r/);
    });

    test('should display all 5 column headers in correct order', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      // Check headers exist and are in correct grid layout (col-span values)
      const headers = page.locator('.grid.grid-cols-12 > div');

      await expect(headers.nth(0)).toContainText('#');        // col-span-1
      await expect(headers.nth(1)).toContainText('Author');   // col-span-4
      await expect(headers.nth(2)).toContainText('Packages'); // col-span-2
      await expect(headers.nth(3)).toContainText('Downloads');// col-span-3
      await expect(headers.nth(4)).toContainText('Status');   // col-span-2
    });

    test('should have white background/card container', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      const leaderboardContainer = page.locator('div').filter({ hasText: '#' }).filter({ hasText: 'Author' }).filter({ hasText: 'Packages' }).first();
      await expect(leaderboardContainer).toHaveClass(/bg-white/);
      await expect(leaderboardContainer).toHaveClass(/rounded-lg/);
      await expect(leaderboardContainer).toHaveClass(/shadow-lg/);
    });
  });

  test.describe('Medal Rankings (Top 3)', () => {
    test('should display gold medal for rank #1', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      // Find first author row and check for gold medal
      const firstRow = page.locator('a').filter({ hasText: '@topauthor1' });
      await expect(firstRow.locator('text=🥇')).toBeVisible();
    });

    test('should display silver medal for rank #2', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor2');

      const secondRow = page.locator('a').filter({ hasText: '@topauthor2' });
      await expect(secondRow.locator('text=🥈')).toBeVisible();
    });

    test('should display bronze medal for rank #3', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor3');

      const thirdRow = page.locator('a').filter({ hasText: '@topauthor3' });
      await expect(thirdRow.locator('text=🥉')).toBeVisible();
    });

    test('should display numeric rank for positions 4+', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@author4');

      const fourthRow = page.locator('a').filter({ hasText: '@author4' });
      await expect(fourthRow.locator('text=4')).toBeVisible();

      // Should NOT have medals
      await expect(fourthRow.locator('text=🥇')).not.toBeVisible();
      await expect(fourthRow.locator('text=🥈')).not.toBeVisible();
      await expect(fourthRow.locator('text=🥉')).not.toBeVisible();
    });

    test('top 3 rows should have yellow background highlight', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      // Check for yellow background on top 3 rows
      const firstRow = page.locator('a').filter({ hasText: '@topauthor1' }).first();
      const secondRow = page.locator('a').filter({ hasText: '@topauthor2' }).first();
      const thirdRow = page.locator('a').filter({ hasText: '@topauthor3' }).first();

      await expect(firstRow).toHaveClass(/bg-yellow-50/);
      await expect(secondRow).toHaveClass(/bg-yellow-50/);
      await expect(thirdRow).toHaveClass(/bg-yellow-50/);
    });
  });

  test.describe('Author Information Display', () => {
    test('should display author icon emoji', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      // Each author should have 👤 emoji
      const authorIcons = page.locator('text=👤');
      expect(await authorIcons.count()).toBeGreaterThanOrEqual(5);
    });

    test('should display usernames with @ prefix', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      await expect(page.getByText('@topauthor1')).toBeVisible();
      await expect(page.getByText('@topauthor2')).toBeVisible();
      await expect(page.getByText('@topauthor3')).toBeVisible();
      await expect(page.getByText('@author4')).toBeVisible();
      await expect(page.getByText('@author5')).toBeVisible();
    });

    test('should display latest package for each author', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      await expect(page.getByText('Latest: amazing-package-v1')).toBeVisible();
      await expect(page.getByText('Latest: cool-package-v2')).toBeVisible();
      await expect(page.getByText('Latest: great-package-v3')).toBeVisible();
    });

    test('should display package counts with styling', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      // Package counts should be displayed with text-prpm-purple styling
      const firstAuthorPackages = page.locator('a').filter({ hasText: '@topauthor1' }).locator('text=150');
      await expect(firstAuthorPackages).toBeVisible();
      await expect(firstAuthorPackages).toHaveClass(/text-prpm-purple/);
    });

    test('should display download counts with proper formatting', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      // Downloads should be formatted with commas
      await expect(page.getByText('10,000')).toBeVisible();
      await expect(page.getByText('8,000')).toBeVisible();
      await expect(page.getByText('5,000')).toBeVisible();
      await expect(page.getByText('3,000')).toBeVisible();
      await expect(page.getByText('1,000')).toBeVisible();
    });

    test('should display "packages" and "total downloads" labels', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      // These labels should appear multiple times (once per author)
      const packagesLabels = page.getByText('packages', { exact: false });
      const downloadsLabels = page.getByText('total downloads', { exact: false });

      expect(await packagesLabels.count()).toBeGreaterThanOrEqual(5);
      expect(await downloadsLabels.count()).toBeGreaterThanOrEqual(5);
    });
  });

  test.describe('Verification Status Badges', () => {
    test('should display "Verified" badge for verified authors', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      // Should have at least 3 verified badges (topauthor1, topauthor2, author4)
      const verifiedBadges = page.getByText('Verified', { exact: true });
      expect(await verifiedBadges.count()).toBeGreaterThanOrEqual(3);
    });

    test('should display "Unclaimed" badge for unverified authors', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor3');

      // Should have at least 2 unclaimed badges (topauthor3, author5)
      const unclaimedBadges = page.getByText('Unclaimed', { exact: true });
      expect(await unclaimedBadges.count()).toBeGreaterThanOrEqual(2);
    });

    test('verified badges should have green styling', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      const verifiedBadge = page.getByText('Verified').first();
      const badgeContainer = verifiedBadge.locator('..');

      await expect(badgeContainer).toHaveClass(/bg-green-100/);
      await expect(badgeContainer).toHaveClass(/text-green-800/);
      await expect(badgeContainer).toHaveClass(/rounded-full/);
    });

    test('unclaimed badges should have gray styling', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor3');

      const unclaimedBadge = page.getByText('Unclaimed').first();
      const badgeContainer = unclaimedBadge.locator('..');

      await expect(badgeContainer).toHaveClass(/bg-gray-100/);
      await expect(badgeContainer).toHaveClass(/text-gray-600/);
      await expect(badgeContainer).toHaveClass(/rounded-full/);
    });

    test('verified badges should have checkmark icon', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      // Look for checkmark (✓) before "Verified" text
      const firstVerifiedAuthor = page.locator('a').filter({ hasText: '@topauthor1' });
      await expect(firstVerifiedAuthor.getByText('✓')).toBeVisible();
    });
  });

  test.describe('Grid Layout and Spacing', () => {
    test('should use 12-column grid layout', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      // Check that author rows use grid-cols-12
      const firstRow = page.locator('a').filter({ hasText: '@topauthor1' }).first();
      const gridContainer = firstRow.locator('.grid.grid-cols-12').first();

      await expect(gridContainer).toBeVisible();
    });

    test('should have proper column spans: 1-4-2-3-2', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      const firstRow = page.locator('a').filter({ hasText: '@topauthor1' }).first();
      const columns = firstRow.locator('.grid > div');

      // Rank: col-span-1
      await expect(columns.nth(0)).toHaveClass(/col-span-1/);

      // Author: col-span-4
      await expect(columns.nth(1)).toHaveClass(/col-span-4/);

      // Packages: col-span-2
      await expect(columns.nth(2)).toHaveClass(/col-span-2/);

      // Downloads: col-span-3
      await expect(columns.nth(3)).toHaveClass(/col-span-3/);

      // Status: col-span-2
      await expect(columns.nth(4)).toHaveClass(/col-span-2/);
    });

    test('should have centered alignment for rank, packages, downloads, status', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      const firstRow = page.locator('a').filter({ hasText: '@topauthor1' }).first();
      const columns = firstRow.locator('.grid > div');

      // Rank (index 0)
      await expect(columns.nth(0)).toHaveClass(/text-center/);

      // Packages (index 2)
      await expect(columns.nth(2)).toHaveClass(/text-center/);

      // Downloads (index 3)
      await expect(columns.nth(3)).toHaveClass(/text-center/);

      // Status (index 4)
      await expect(columns.nth(4)).toHaveClass(/text-center/);
    });
  });

  test.describe('Interactive Behavior', () => {
    test('author rows should be clickable links', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      const firstAuthor = page.locator('a').filter({ hasText: '@topauthor1' }).first();
      await expect(firstAuthor).toHaveAttribute('href', '/authors?username=topauthor1');
    });

    test('author rows should have hover effect', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      const firstAuthor = page.locator('a').filter({ hasText: '@topauthor1' }).first();
      await expect(firstAuthor).toHaveClass(/hover:bg-prpm-purple\/5/);
    });

    test('clicking author should navigate to profile page', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      await page.click('text=@topauthor1');

      await expect(page).toHaveURL(/\/authors\?username=topauthor1/);
    });
  });

  test.describe('Bottom CTA Section', () => {
    test('should display bottom CTA text', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      await expect(page.getByText('Missing from the list? Contribute your packages today!')).toBeVisible();
    });

    test('bottom CTA should be centered', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=Missing from the list?');

      const bottomCTA = page.locator('div').filter({ hasText: 'Missing from the list?' }).first();
      await expect(bottomCTA).toHaveClass(/text-center/);
    });
  });

  test.describe('Responsive Design', () => {
    test('should maintain layout on tablet (768px)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      // Header should still be visible
      await expect(page.getByRole('heading', { name: 'Top Authors' })).toBeVisible();

      // Leaderboard should still be visible
      await expect(page.getByText('@topauthor1')).toBeVisible();
      await expect(page.getByText('🥇')).toBeVisible();
    });

    test('should maintain layout on mobile (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      // Core content should remain accessible
      await expect(page.getByRole('heading', { name: 'Top Authors' })).toBeVisible();
      await expect(page.getByText('@topauthor1')).toBeVisible();
    });
  });

  test.describe('Loading States', () => {
    test('should show loading spinner initially', async ({ page }) => {
      // Delay the API response
      await page.route('**/api/v1/search/authors*', async route => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ authors: [], total: 0 })
        });
      });

      await page.goto('/authors');

      // Should show loading state
      await expect(page.getByText('Loading top authors...')).toBeVisible();
    });

    test('should hide loading spinner after data loads', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      // Loading spinner should be gone
      await expect(page.getByText('Loading top authors...')).not.toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should display error message on API failure', async ({ page }) => {
      await page.route('**/api/v1/search/authors*', async route => {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      await page.goto('/authors');

      await expect(page.getByText('Error')).toBeVisible();
      await expect(page.getByText('❌')).toBeVisible();
    });

    test('error state should have "Browse Authors" button', async ({ page }) => {
      await page.route('**/api/v1/search/authors*', async route => {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      await page.goto('/authors');

      const browseButton = page.getByRole('link', { name: 'Browse Authors' });
      await expect(browseButton).toBeVisible();
      await expect(browseButton).toHaveAttribute('href', '/authors');
    });
  });

  test.describe('Visual Regression - Overall Layout', () => {
    test('leaderboard table should not use grid card layout', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      // Should NOT have the old 3-column grid layout
      const authorsList = page.locator('div').filter({ hasText: '@topauthor1' }).first();
      const parent = authorsList.locator('..');

      // Should not have grid-cols-3 classes
      await expect(parent).not.toHaveClass(/grid-cols-3/);
      await expect(parent).not.toHaveClass(/lg:grid-cols-3/);
      await expect(parent).not.toHaveClass(/md:grid-cols-2/);
    });

    test('should use table-style rows with dividers', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      // The container should have divide-y class for row dividers
      const tableBody = page.locator('.divide-y').filter({ has: page.getByText('@topauthor1') });
      await expect(tableBody).toBeVisible();
    });

    test('page should have light background (not dark)', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      // Main container should have padding (p-8) and light background
      const main = page.locator('main');
      await expect(main).toHaveClass(/min-h-screen/);
      await expect(main).toHaveClass(/p-8/);

      // Should NOT have bg-prpm-dark
      await expect(main).not.toHaveClass(/bg-prpm-dark/);
    });

    test('should not display authors as cards', async ({ page }) => {
      await page.goto('/authors');

      await page.waitForSelector('text=@topauthor1');

      // Authors should be in table rows, not rounded cards
      const firstAuthor = page.locator('a').filter({ hasText: '@topauthor1' }).first();

      // Should NOT have rounded-xl card styling
      await expect(firstAuthor).not.toHaveClass(/rounded-xl/);

      // Should be a block link (table row)
      await expect(firstAuthor).toHaveClass(/block/);
    });
  });
});
