import { test, expect } from '@playwright/test';

test.describe('Authors Page', () => {
  test('should display page header and title', async ({ page }) => {
    await page.goto('/authors');

    // Check title
    await expect(page.getByRole('heading', { name: 'Top Authors' })).toBeVisible();
    await expect(page.getByText('The amazing contributors making PRPM possible')).toBeVisible();

    // Check back link
    const backLink = page.getByRole('link', { name: '← Back to home' });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/');
  });

  test('should navigate back to home when clicking back link', async ({ page }) => {
    await page.goto('/authors');

    await page.getByRole('link', { name: '← Back to home' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'PRPM' })).toBeVisible();
  });

  test('should display CTA banner with links', async ({ page }) => {
    await page.goto('/authors');

    // Check CTA text
    await expect(page.getByText('Want to Join the Leaderboard?')).toBeVisible();
    await expect(page.getByText(/Contribute packages to PRPM/)).toBeVisible();

    // Check GitHub link
    const githubLink = page.getByRole('link', { name: 'View on GitHub' });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('target', '_blank');

    // Check claim link
    const claimLink = page.getByRole('link', { name: 'Claim Your Username' });
    await expect(claimLink).toBeVisible();
    await expect(claimLink).toHaveAttribute('href', '/claim');
  });

  test('should display leaderboard table headers', async ({ page }) => {
    await page.goto('/authors');

    // Check table headers
    await expect(page.getByText('#')).toBeVisible();
    await expect(page.getByText('Author')).toBeVisible();
    await expect(page.getByText('Packages')).toBeVisible();
    await expect(page.getByText('Downloads')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();
  });

  test('should handle loading state', async ({ page }) => {
    // Intercept API call to delay it
    await page.route('**/api/v1/search/authors*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ authors: [], total: 0 })
      });
    });

    await page.goto('/authors');

    // Should show loading spinner briefly
    await expect(page.getByText('Loading top authors...')).toBeVisible();
  });

  test('should handle API success and display authors', async ({ page }) => {
    // Mock API response
    await page.route('**/api/v1/search/authors*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authors: [
            {
              author: 'testuser1',
              package_count: 100,
              total_downloads: 5000,
              verified: true,
              latest_package: 'test-package-1'
            },
            {
              author: 'testuser2',
              package_count: 50,
              total_downloads: 2000,
              verified: false,
              latest_package: 'test-package-2'
            },
            {
              author: 'testuser3',
              package_count: 25,
              total_downloads: 1000,
              verified: true,
              latest_package: 'test-package-3'
            }
          ],
          total: 3
        })
      });
    });

    await page.goto('/authors');

    // Wait for data to load
    await expect(page.getByText('@testuser1')).toBeVisible();
    await expect(page.getByText('@testuser2')).toBeVisible();
    await expect(page.getByText('@testuser3')).toBeVisible();

    // Check medal emojis for top 3
    await expect(page.getByText('🥇')).toBeVisible(); // #1
    await expect(page.getByText('🥈')).toBeVisible(); // #2
    await expect(page.getByText('🥉')).toBeVisible(); // #3

    // Check package counts
    await expect(page.getByText('100').first()).toBeVisible();
    await expect(page.getByText('50').first()).toBeVisible();

    // Check verified badges
    const verifiedBadges = page.getByText('Verified');
    await expect(verifiedBadges.first()).toBeVisible();

    // Check unclaimed badge
    await expect(page.getByText('Unclaimed')).toBeVisible();
  });

  test('should handle API error', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/search/authors*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/authors');

    // Should show error message
    await expect(page.getByText('Error Loading Authors')).toBeVisible();
  });

  test('should display stats summary correctly', async ({ page }) => {
    await page.route('**/api/v1/search/authors*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authors: [
            { author: 'user1', package_count: 100, total_downloads: 5000, verified: true },
            { author: 'user2', package_count: 50, total_downloads: 2000, verified: false }
          ],
          total: 2
        })
      });
    });

    await page.goto('/authors');

    // Wait for stats to appear
    await expect(page.getByText('2 Authors')).toBeVisible();
    await expect(page.getByText('150 Packages')).toBeVisible(); // 100 + 50
    await expect(page.getByText('7,000 Downloads')).toBeVisible(); // 5000 + 2000
  });

  test('should have bottom CTA', async ({ page }) => {
    await page.route('**/api/v1/search/authors*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authors: [], total: 0 })
      });
    });

    await page.goto('/authors');

    await expect(page.getByText('Missing from the list?')).toBeVisible();

    const claimLink = page.getByRole('link', { name: /Claim your verified author status/ });
    await expect(claimLink).toBeVisible();
    await expect(claimLink).toHaveAttribute('href', '/claim');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.route('**/api/v1/search/authors*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authors: [
            { author: 'user1', package_count: 100, total_downloads: 5000, verified: true }
          ],
          total: 1
        })
      });
    });

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/authors');

    // Title should still be visible
    await expect(page.getByRole('heading', { name: 'Top Authors' })).toBeVisible();

    // Author should be visible
    await expect(page.getByText('@user1')).toBeVisible();
  });
});
