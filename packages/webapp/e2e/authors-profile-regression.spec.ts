import { test, expect } from '@playwright/test';

/**
 * Individual Author Profile - Regression Tests
 *
 * These tests protect against regressions on individual author profile pages.
 * They verify the avatar, stats, packages list, and PackageModal integration.
 */

test.describe('Individual Author Profile - Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock author profile API response
    await page.route('**/api/v1/authors/testauthor', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
        })
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
  });

  test.describe('Profile Header', () => {
    test('should display back to authors link', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      const backLink = page.getByRole('link', { name: '← Back to Authors' });
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute('href', '/authors');
    });

    test('should display avatar circle with first letter', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      // Avatar should show first letter "T"
      const avatar = page.locator('div').filter({ hasText: /^T$/ }).filter({ has: page.locator('.rounded-full') });
      await expect(avatar).toBeVisible();
    });

    test('avatar should have accent border and background', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      const avatarContainer = page.locator('.rounded-full').filter({ hasText: 'T' }).first();
      await expect(avatarContainer).toHaveClass(/border-prpm-accent/);
      await expect(avatarContainer).toHaveClass(/bg-prpm-accent\/20/);
    });

    test('should display username as h1', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      const heading = page.getByRole('heading', { name: 'testauthor', level: 1 });
      await expect(heading).toBeVisible();
      await expect(heading).toHaveClass(/text-4xl/);
    });

    test('should display verified badge for verified author', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      const verifiedBadge = page.locator('span').filter({ hasText: '✓ Verified' });
      await expect(verifiedBadge).toBeVisible();
      await expect(verifiedBadge).toHaveClass(/bg-prpm-accent\/20/);
      await expect(verifiedBadge).toHaveClass(/text-prpm-accent/);
      await expect(verifiedBadge).toHaveClass(/rounded-full/);
    });

    test('should display GitHub link with icon', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      const githubLink = page.getByRole('link', { name: /@testauthor-gh/ });
      await expect(githubLink).toBeVisible();
      await expect(githubLink).toHaveAttribute('href', 'https://github.com/testauthor-gh');
      await expect(githubLink).toHaveAttribute('target', '_blank');

      // Should have GitHub SVG icon
      const svg = githubLink.locator('svg');
      await expect(svg).toBeVisible();
    });

    test('should display joined date', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await expect(page.getByText(/Joined (January|February|March|April|May|June|July|August|September|October|November|December) \d{4}/)).toBeVisible();
    });
  });

  test.describe('Stats Grid', () => {
    test('should display all 4 stats cards', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await expect(page.getByText('Packages')).toBeVisible();
      await expect(page.getByText('Total Downloads')).toBeVisible();
      await expect(page.getByText('Average Rating')).toBeVisible();
      await expect(page.getByText('Total Ratings')).toBeVisible();
    });

    test('should display packages count', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      const packagesCard = page.locator('div').filter({ hasText: 'Packages' }).filter({ hasText: '10' });
      await expect(packagesCard).toBeVisible();
    });

    test('should display formatted total downloads', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await expect(page.getByText('5,000')).toBeVisible();
    });

    test('should display average rating with star', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await expect(page.getByText('4.5')).toBeVisible();

      const ratingCard = page.locator('div').filter({ hasText: 'Average Rating' });
      await expect(ratingCard.getByText('★')).toBeVisible();
    });

    test('should display total ratings count', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      const ratingsCard = page.locator('div').filter({ hasText: 'Total Ratings' }).filter({ hasText: '25' });
      await expect(ratingsCard).toBeVisible();
    });

    test('stats cards should have border and background', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      const packagesCard = page.locator('div').filter({ hasText: 'Packages' }).first();
      await expect(packagesCard).toHaveClass(/bg-prpm-dark/);
      await expect(packagesCard).toHaveClass(/border-prpm-border/);
      await expect(packagesCard).toHaveClass(/rounded-lg/);
    });
  });

  test.describe('Unclaimed Account Banner', () => {
    test('should NOT show unclaimed banner for claimed account', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await expect(page.getByText('Are you testauthor?')).not.toBeVisible();
      await expect(page.getByText('Connect GitHub & Claim Packages')).not.toBeVisible();
    });

    test('should show unclaimed banner for unclaimed account', async ({ page }) => {
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
            stats: {
              total_packages: 5,
              total_downloads: 1000,
              average_rating: null,
              total_ratings: 0
            },
            packages: [],
            total: 0
          })
        });
      });

      await page.goto('/authors?username=unclaimedauthor');

      await expect(page.getByText('Are you unclaimedauthor?')).toBeVisible();
      await expect(page.getByText(/Connect your GitHub account to claim ownership/)).toBeVisible();
    });

    test('unclaimed banner should have gradient background', async ({ page }) => {
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

      const banner = page.locator('div').filter({ hasText: 'Are you unclaimedauthor?' }).first();
      await expect(banner).toHaveClass(/bg-gradient-to-r/);
      await expect(banner).toHaveClass(/from-prpm-accent\/20/);
    });

    test('unclaimed banner should have package emoji', async ({ page }) => {
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

      const banner = page.locator('div').filter({ hasText: 'Are you unclaimedauthor?' }).first();
      await expect(banner.locator('text=📦')).toBeVisible();
    });
  });

  test.describe('Packages List', () => {
    test('should display packages heading with count', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await expect(page.getByRole('heading', { name: 'Packages (3)' })).toBeVisible();
    });

    test('should display all packages in grid layout', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await expect(page.getByText('amazing-package')).toBeVisible();
      await expect(page.getByText('cool-skill')).toBeVisible();
      await expect(page.getByText('utility-package')).toBeVisible();
    });

    test('packages should be in 3-column grid on large screens', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      const packagesGrid = page.locator('.grid').filter({ has: page.getByText('amazing-package') });
      await expect(packagesGrid).toHaveClass(/lg:grid-cols-3/);
    });

    test('package cards should display type badge', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      // Check for type badges
      const agentBadge = page.locator('span').filter({ hasText: 'agent' });
      const skillBadge = page.locator('span').filter({ hasText: 'skill' });
      const packageBadge = page.locator('span').filter({ hasText: 'package' });

      await expect(agentBadge).toBeVisible();
      await expect(skillBadge).toBeVisible();
      await expect(packageBadge).toBeVisible();
    });

    test('package cards should display descriptions', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await expect(page.getByText('This is an amazing package')).toBeVisible();
      await expect(page.getByText('A cool skill for your agent')).toBeVisible();
      await expect(page.getByText('A helpful utility')).toBeVisible();
    });

    test('package cards should display download counts', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await expect(page.getByText('2,000')).toBeVisible();
      await expect(page.getByText('1,500')).toBeVisible();
    });

    test('package cards should display ratings when available', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      // Should show ratings for packages with ratings
      await expect(page.getByText('4.8')).toBeVisible();
      await expect(page.getByText('4.2')).toBeVisible();

      // Check for star icons
      const stars = page.locator('span').filter({ hasText: '★' });
      expect(await stars.count()).toBeGreaterThanOrEqual(2);
    });

    test('package cards should display tags', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      // Check for tag badges (limited to first 3)
      await expect(page.getByText('ai')).toBeVisible();
      await expect(page.getByText('automation')).toBeVisible();
      await expect(page.getByText('productivity')).toBeVisible();
      await expect(page.getByText('skill')).toBeVisible();
    });

    test('package cards should be clickable buttons', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      const packageCard = page.locator('button').filter({ hasText: 'amazing-package' });
      await expect(packageCard).toBeVisible();
      await expect(packageCard).toHaveClass(/hover:border-prpm-accent/);
    });

    test('package cards should have hover effect', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      const packageCard = page.locator('button').filter({ hasText: 'amazing-package' });

      // Check for group and transition classes
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
    test('clicking package card should open modal', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await page.click('button:has-text("amazing-package")');

      // Modal should be visible
      await expect(page.locator('[class*="fixed inset-0"]')).toBeVisible();
    });

    test('modal should display package name', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await page.click('button:has-text("amazing-package")');

      const modal = page.locator('[class*="fixed inset-0"]');
      await expect(modal.getByRole('heading', { name: 'amazing-package' })).toBeVisible();
    });

    test('modal should display package description', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await page.click('button:has-text("amazing-package")');

      const modal = page.locator('[class*="fixed inset-0"]');
      await expect(modal.getByText('This is an amazing package')).toBeVisible();
    });

    test('modal should display stats grid', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await page.click('button:has-text("amazing-package")');

      const modal = page.locator('[class*="fixed inset-0"]');

      await expect(modal.getByText('Total Downloads')).toBeVisible();
      await expect(modal.getByText('2,000')).toBeVisible();
      await expect(modal.getByText('Weekly')).toBeVisible();
      await expect(modal.getByText('100')).toBeVisible();
      await expect(modal.getByText('Monthly')).toBeVisible();
      await expect(modal.getByText('400')).toBeVisible();
    });

    test('modal should display tags', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await page.click('button:has-text("amazing-package")');

      const modal = page.locator('[class*="fixed inset-0"]');

      await expect(modal.getByText('Tags')).toBeVisible();
      await expect(modal.getByText('ai')).toBeVisible();
      await expect(modal.getByText('automation')).toBeVisible();
      await expect(modal.getByText('productivity')).toBeVisible();
    });

    test('modal should display install command', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await page.click('button:has-text("amazing-package")');

      const modal = page.locator('[class*="fixed inset-0"]');

      await expect(modal.getByText('Install')).toBeVisible();
      await expect(modal.getByText('prpm install amazing-package')).toBeVisible();
    });

    test('modal should have copy install command button', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await page.click('button:has-text("amazing-package")');

      const modal = page.locator('[class*="fixed inset-0"]');
      const copyButton = modal.getByRole('button', { name: /Copy Install Command/ });

      await expect(copyButton).toBeVisible();
    });

    test('modal should have close button', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await page.click('button:has-text("amazing-package")');

      const modal = page.locator('[class*="fixed inset-0"]');
      const closeButton = modal.locator('button').filter({ has: page.locator('svg') }).first();

      await expect(closeButton).toBeVisible();
    });

    test('clicking close button should close modal', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await page.click('button:has-text("amazing-package")');

      // Modal is open
      await expect(page.locator('[class*="fixed inset-0"]')).toBeVisible();

      // Click close button
      const modal = page.locator('[class*="fixed inset-0"]');
      await modal.locator('button').filter({ has: page.locator('svg') }).first().click();

      // Modal should be closed
      await expect(page.locator('[class*="fixed inset-0"]')).not.toBeVisible();
    });

    test('clicking backdrop should close modal', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await page.click('button:has-text("amazing-package")');

      // Modal is open
      const backdrop = page.locator('[class*="fixed inset-0"]').first();
      await expect(backdrop).toBeVisible();

      // Click backdrop (outside modal content)
      await backdrop.click({ position: { x: 10, y: 10 } });

      // Modal should be closed
      await expect(backdrop).not.toBeVisible();
    });

    test('modal should NOT have "View Details" link', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      await page.click('button:has-text("amazing-package")');

      const modal = page.locator('[class*="fixed inset-0"]');

      // Should NOT have View Details link
      await expect(modal.getByRole('link', { name: /View Details/ })).not.toBeVisible();
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
    });

    test('error page should have browse authors button', async ({ page }) => {
      await page.route('**/api/v1/authors/nonexistent', async route => {
        await route.fulfill({
          status: 404,
          body: JSON.stringify({ error: 'Author not found' })
        });
      });

      await page.goto('/authors?username=nonexistent');

      const browseButton = page.getByRole('link', { name: 'Browse Authors' });
      await expect(browseButton).toBeVisible();
      await expect(browseButton).toHaveAttribute('href', '/authors');
    });
  });

  test.describe('Dark Theme Consistency', () => {
    test('profile page should have dark background', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      const main = page.locator('main');
      await expect(main).toHaveClass(/bg-prpm-dark/);
    });

    test('header section should have dark card background', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      const header = page.locator('div').filter({ hasText: 'testauthor' }).filter({ hasText: 'Packages' }).first();
      await expect(header).toHaveClass(/bg-prpm-dark-card/);
    });

    test('package cards should have dark styling', async ({ page }) => {
      await page.goto('/authors?username=testauthor');

      const packageCard = page.locator('button').filter({ hasText: 'amazing-package' }).first();
      await expect(packageCard).toHaveClass(/bg-prpm-dark-card/);
      await expect(packageCard).toHaveClass(/border-prpm-border/);
    });
  });
});
