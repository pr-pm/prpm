import { test, expect } from '@playwright/test';

/**
 * Individual Author Profile - Regression Tests (Optimized)
 *
 * These tests protect against regressions on individual author profile pages.
 * They verify the avatar, stats, packages list, and PackageModal integration.
 *
 * Optimizations:
 * - Consolidated similar tests to reduce total count
 * - Moved page.goto() to beforeEach to avoid redundant navigation
 * - Combined CSS class checks into fewer tests
 * - Shared mock data constant
 */

// Shared mock data
const MOCK_AUTHOR_PROFILE = {
  author: {
    username: 'testauthor',
    verified: true,
    github_username: 'testauthor-gh',
    joined: '2024-01-15T00:00:00Z',
    has_claimed_account: true
  },
  stats: {
    total_packages: 10,
    total_downloads: 5000,
    average_rating: 4.5,
    total_ratings: 25
  },
  packages: [
    {
      id: 'pkg-1',
      name: 'amazing-package',
      description: 'This is an amazing package',
      type: 'agent',
      total_downloads: 2000,
      weekly_downloads: 100,
      monthly_downloads: 400,
      rating_average: 4.8,
      rating_count: 10,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-02-01T00:00:00Z',
      tags: ['ai', 'automation', 'productivity']
    },
    {
      id: 'pkg-2',
      name: 'cool-skill',
      description: 'A cool skill for your agent',
      type: 'skill',
      total_downloads: 1500,
      weekly_downloads: 75,
      monthly_downloads: 300,
      rating_average: 4.2,
      rating_count: 8,
      created_at: '2024-01-20T00:00:00Z',
      updated_at: '2024-02-05T00:00:00Z',
      tags: ['skill', 'helper']
    },
    {
      id: 'pkg-3',
      name: 'utility-package',
      description: 'A helpful utility',
      type: 'package',
      total_downloads: 1500,
      weekly_downloads: 50,
      monthly_downloads: 200,
      rating_average: null,
      rating_count: 0,
      created_at: '2024-02-01T00:00:00Z',
      updated_at: '2024-02-10T00:00:00Z',
      tags: ['utility']
    }
  ],
  total: 3
};

test.describe('Individual Author Profile - Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock author profile API response
    await page.route('**/api/v1/authors/testauthor', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_AUTHOR_PROFILE)
      });
    });

    // Mock top authors list (for back navigation)
    await page.route('**/api/v1/search/authors*', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          authors: [
            { author: 'testauthor', package_count: 10, total_downloads: 5000, verified: true }
          ],
          total: 1
        })
      });
    });

    // Navigate once per test
    await page.goto('/authors?username=testauthor');
  });

  test.describe('Profile Header', () => {
    test('should display complete header with avatar, username, and metadata', async ({ page }) => {
      // Back link
      const backLink = page.getByRole('link', { name: '← Back to Authors' });
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute('href', '/authors');

      // Avatar with first letter "T"
      const avatar = page.locator('div').filter({ hasText: /^T$/ }).filter({ has: page.locator('.rounded-full') });
      await expect(avatar).toBeVisible();

      // Avatar styling
      const avatarContainer = page.locator('.rounded-full').filter({ hasText: 'T' }).first();
      await expect(avatarContainer).toHaveClass(/border-prpm-accent/);
      await expect(avatarContainer).toHaveClass(/bg-prpm-accent\/20/);

      // Username as h1
      const heading = page.getByRole('heading', { name: 'testauthor', level: 1 });
      await expect(heading).toBeVisible();
      await expect(heading).toHaveClass(/text-4xl/);

      // Verified badge
      const verifiedBadge = page.locator('span').filter({ hasText: '✓ Verified' });
      await expect(verifiedBadge).toBeVisible();
      await expect(verifiedBadge).toHaveClass(/bg-prpm-accent\/20/);
      await expect(verifiedBadge).toHaveClass(/text-prpm-accent/);
      await expect(verifiedBadge).toHaveClass(/rounded-full/);

      // GitHub link with icon
      const githubLink = page.getByRole('link', { name: /@testauthor-gh/ });
      await expect(githubLink).toBeVisible();
      await expect(githubLink).toHaveAttribute('href', 'https://github.com/testauthor-gh');
      await expect(githubLink).toHaveAttribute('target', '_blank');
      await expect(githubLink.locator('svg')).toBeVisible();

      // Joined date
      await expect(page.getByText(/Joined (January|February|March|April|May|June|July|August|September|October|November|December) \d{4}/)).toBeVisible();
    });
  });

  test.describe('Stats Grid', () => {
    test('should display all stats cards with correct values and styling', async ({ page }) => {
      // Check all 4 stat labels
      await expect(page.getByText('Packages')).toBeVisible();
      await expect(page.getByText('Total Downloads')).toBeVisible();
      await expect(page.getByText('Average Rating')).toBeVisible();
      await expect(page.getByText('Total Ratings')).toBeVisible();

      // Check values
      const packagesCard = page.locator('div').filter({ hasText: 'Packages' }).filter({ hasText: '10' });
      await expect(packagesCard).toBeVisible();

      await expect(page.getByText('5,000')).toBeVisible(); // Formatted downloads

      await expect(page.getByText('4.5')).toBeVisible(); // Rating
      const ratingCard = page.locator('div').filter({ hasText: 'Average Rating' });
      await expect(ratingCard.getByText('★')).toBeVisible();

      const ratingsCard = page.locator('div').filter({ hasText: 'Total Ratings' }).filter({ hasText: '25' });
      await expect(ratingsCard).toBeVisible();

      // Check card styling
      const packagesCardElement = page.locator('div').filter({ hasText: 'Packages' }).first();
      await expect(packagesCardElement).toHaveClass(/bg-prpm-dark/);
      await expect(packagesCardElement).toHaveClass(/border-prpm-border/);
      await expect(packagesCardElement).toHaveClass(/rounded-lg/);
    });
  });

  test.describe('Unclaimed Account Banner', () => {
    test('should NOT show unclaimed banner for claimed account', async ({ page }) => {
      await expect(page.getByText('Are you testauthor?')).not.toBeVisible();
      await expect(page.getByText('Connect GitHub & Claim Packages')).not.toBeVisible();
    });

    test('should show unclaimed banner with styling for unclaimed account', async ({ page }) => {
      // Override route with unclaimed account
      await page.route('**/api/v1/authors/unclaimedauthor', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            author: {
              username: 'unclaimedauthor',
              verified: false,
              github_username: null,
              joined: '2024-01-15T00:00:00Z',
              has_claimed_account: false
            },
            stats: { total_packages: 5, total_downloads: 1000, average_rating: null, total_ratings: 0 },
            packages: [],
            total: 0
          })
        });
      });

      await page.goto('/authors?username=unclaimedauthor');

      await expect(page.getByText('Are you unclaimedauthor?')).toBeVisible();
      await expect(page.getByText(/Connect your GitHub account to claim ownership/)).toBeVisible();

      // Check styling
      const banner = page.locator('div.bg-gradient-to-r').filter({ hasText: 'Are you unclaimedauthor?' }).first();
      await expect(banner).toBeVisible();
      await expect(banner).toHaveClass(/from-prpm-accent\/20/);
      await expect(banner.locator('text=📦')).toBeVisible();
    });
  });

  test.describe('Packages List', () => {
    test('should display packages grid with correct layout and content', async ({ page }) => {
      // Heading with count
      await expect(page.getByRole('heading', { name: 'Packages (3)' })).toBeVisible();

      // All packages visible
      await expect(page.getByText('amazing-package')).toBeVisible();
      await expect(page.getByText('cool-skill')).toBeVisible();
      await expect(page.getByText('utility-package')).toBeVisible();

      // Grid layout
      const packagesGrid = page.locator('.grid').filter({ has: page.getByText('amazing-package') });
      await expect(packagesGrid).toHaveClass(/lg:grid-cols-3/);
    });

    test('should display package cards with all metadata', async ({ page }) => {
      // Type badges
      await expect(page.locator('span').filter({ hasText: 'agent' })).toBeVisible();
      await expect(page.locator('span').filter({ hasText: 'skill' })).toBeVisible();
      await expect(page.locator('span').filter({ hasText: 'package' })).toBeVisible();

      // Descriptions
      await expect(page.getByText('This is an amazing package')).toBeVisible();
      await expect(page.getByText('A cool skill for your agent')).toBeVisible();
      await expect(page.getByText('A helpful utility')).toBeVisible();

      // Download counts
      await expect(page.getByText('2,000')).toBeVisible();
      await expect(page.getByText('1,500')).toBeVisible();

      // Ratings with stars
      await expect(page.getByText('4.8')).toBeVisible();
      await expect(page.getByText('4.2')).toBeVisible();
      const stars = page.locator('span').filter({ hasText: '★' });
      expect(await stars.count()).toBeGreaterThanOrEqual(2);

      // Tags
      await expect(page.getByText('ai')).toBeVisible();
      await expect(page.getByText('automation')).toBeVisible();
      await expect(page.getByText('productivity')).toBeVisible();
      await expect(page.getByText('skill')).toBeVisible();
    });

    test('package cards should be interactive buttons with hover effects', async ({ page }) => {
      const packageCard = page.locator('button').filter({ hasText: 'amazing-package' });
      await expect(packageCard).toBeVisible();
      await expect(packageCard).toHaveClass(/hover:border-prpm-accent/);
      await expect(packageCard).toHaveClass(/group/);
      await expect(packageCard).toHaveClass(/transition-all/);
    });

    test('should show empty state when no packages', async ({ page }) => {
      // Override with no packages
      await page.route('**/api/v1/authors/emptyauthor', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            author: {
              username: 'emptyauthor',
              verified: false,
              github_username: null,
              joined: '2024-01-15T00:00:00Z',
              has_claimed_account: false
            },
            stats: { total_packages: 0, total_downloads: 0, average_rating: null, total_ratings: 0 },
            packages: [],
            total: 0
          })
        });
      });

      await page.goto('/authors?username=emptyauthor');

      await expect(page.getByText('No packages published yet')).toBeVisible();
      await expect(page.getByText('📦')).toBeVisible();
    });
  });

  test.describe('PackageModal Integration', () => {
    test('should open modal with complete package information', async ({ page }) => {
      await page.click('button:has-text("amazing-package")');

      const modal = page.locator('[class*="fixed inset-0"]');
      await expect(modal).toBeVisible();

      // Package name
      await expect(modal.getByRole('heading', { name: 'amazing-package' })).toBeVisible();

      // Description
      await expect(modal.getByText('This is an amazing package')).toBeVisible();

      // Stats grid
      await expect(modal.getByText('Total Downloads')).toBeVisible();
      await expect(modal.getByText('2,000')).toBeVisible();
      await expect(modal.getByText('Weekly')).toBeVisible();
      await expect(modal.getByText('100')).toBeVisible();
      await expect(modal.getByText('Monthly')).toBeVisible();
      await expect(modal.getByText('400')).toBeVisible();

      // Tags
      await expect(modal.getByText('Tags')).toBeVisible();
      await expect(modal.getByText('ai')).toBeVisible();
      await expect(modal.getByText('automation')).toBeVisible();
      await expect(modal.getByText('productivity')).toBeVisible();

      // Install command
      await expect(modal.getByText('Install')).toBeVisible();
      await expect(modal.getByText('prpm install amazing-package')).toBeVisible();
      await expect(modal.getByRole('button', { name: /Copy Install Command/ })).toBeVisible();

      // Should NOT have View Details link (removed feature)
      await expect(modal.getByRole('link', { name: /View Details/ })).not.toBeVisible();
    });

    test('should close modal via close button and backdrop', async ({ page }) => {
      await page.click('button:has-text("amazing-package")');

      // Modal is open
      await expect(page.locator('[class*="fixed inset-0"]')).toBeVisible();

      // Close button exists
      const modal = page.locator('[class*="fixed inset-0"]');
      const closeButton = modal.locator('button').filter({ has: page.locator('svg') }).first();
      await expect(closeButton).toBeVisible();

      // Click close button
      await closeButton.click();
      await expect(page.locator('[class*="fixed inset-0"]')).not.toBeVisible();

      // Test backdrop close
      await page.click('button:has-text("amazing-package")');
      await expect(page.locator('[class*="fixed inset-0"]')).toBeVisible();

      const backdrop = page.locator('[class*="fixed inset-0"]').first();
      await backdrop.click({ position: { x: 10, y: 10 } });
      await expect(backdrop).not.toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should show error for non-existent author', async ({ page }) => {
      await page.route('**/api/v1/authors/nonexistent', async route => {
        await route.fulfill({
          status: 404,
          body: JSON.stringify({ error: 'Author not found' })
        });
      });

      await page.goto('/authors?username=nonexistent');

      await expect(page.getByText('Author Not Found')).toBeVisible();
      await expect(page.getByText('❌')).toBeVisible();

      const browseButton = page.getByRole('link', { name: 'Browse Authors' });
      await expect(browseButton).toBeVisible();
      await expect(browseButton).toHaveAttribute('href', '/authors');
    });
  });

  test.describe('Dark Theme Consistency', () => {
    test('should have consistent dark theme styling', async ({ page }) => {
      // Main background - use first() to get the actual content main
      const main = page.locator('main').first();
      await expect(main).toBeVisible();

      // Header section with avatar
      const header = page.locator('div.bg-prpm-dark-card').filter({ hasText: 'testauthor' }).first();
      await expect(header).toBeVisible();

      // Package cards
      const packageCard = page.locator('button.bg-prpm-dark-card').filter({ hasText: 'amazing-package' }).first();
      await expect(packageCard).toBeVisible();
      await expect(packageCard).toHaveClass(/border-prpm-border/);
    });
  });
});
