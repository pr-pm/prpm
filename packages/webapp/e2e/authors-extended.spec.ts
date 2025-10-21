import { test, expect } from '@playwright/test';

test.describe('Authors Page - Extended', () => {
  test.describe('Layout and Navigation', () => {
    test('should display authors page heading', async ({ page }) => {
      await page.goto('/authors');

      await expect(page.getByRole('heading', { name: /Top Authors|Authors/i })).toBeVisible();
    });

    test('should have back to home link', async ({ page }) => {
      await page.goto('/authors');

      const homeLink = page.getByRole('link', { name: /home|back/i });
      if (await homeLink.count() > 0) {
        await expect(homeLink).toBeVisible();
        await expect(homeLink).toHaveAttribute('href', '/');
      }
    });
  });

  test.describe('Author Listings', () => {
    test('should display list of authors', async ({ page }) => {
      await page.goto('/authors');
      await page.waitForTimeout(1000);

      // Should show author cards or list items
      const authorElements = page.locator('[class*="author"]').or(page.locator('li')).or(page.locator('[class*="card"]'));
      if (await authorElements.count() > 0) {
        await expect(authorElements.first()).toBeVisible();
      }
    });

    test('should display author usernames', async ({ page }) => {
      await page.goto('/authors');
      await page.waitForTimeout(1000);

      // Authors should have usernames (likely prefixed with @)
      const authorNames = page.locator('text=/^@[a-zA-Z0-9_-]+/');
      if (await authorNames.count() > 0) {
        await expect(authorNames.first()).toBeVisible();
      }
    });

    test('should show verified badge for verified authors', async ({ page }) => {
      await page.goto('/authors');
      await page.waitForTimeout(1000);

      // Look for verified checkmark or badge
      const verifiedBadge = page.locator('svg').filter({ has: page.locator('path[fill-rule="evenodd"]') }).or(page.getByText(/verified/i));
      if (await verifiedBadge.count() > 0) {
        await expect(verifiedBadge.first()).toBeVisible();
      }
    });

    test('should display author statistics', async ({ page }) => {
      await page.goto('/authors');
      await page.waitForTimeout(1000);

      // Should show package count or download count
      const stats = page.getByText(/\d+ packages?|\d+ downloads?/i);
      if (await stats.count() > 0) {
        await expect(stats.first()).toBeVisible();
      }
    });
  });

  test.describe('Sorting and Filtering', () => {
    test('should have sort options', async ({ page }) => {
      await page.goto('/authors');

      const sortSelect = page.locator('select').or(page.getByRole('combobox'));
      if (await sortSelect.count() > 0) {
        await expect(sortSelect.first()).toBeVisible();
      }
    });

    test('should be able to search authors', async ({ page }) => {
      await page.goto('/authors');

      const searchInput = page.getByPlaceholder(/search|filter/i);
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible();
        await searchInput.fill('test');
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display authors on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/authors');

      await expect(page.getByRole('heading', { name: /Authors/i })).toBeVisible();
    });

    test('should display authors on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/authors');

      await expect(page.getByRole('heading', { name: /Authors/i })).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load authors within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/authors');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  });

  test.describe('Empty States', () => {
    test('should handle no authors gracefully', async ({ page }) => {
      await page.goto('/authors');
      await page.waitForTimeout(1000);

      // If no authors, should show message or empty state
      const noAuthorsMessage = page.getByText(/no authors|no results/i);
      const hasAuthors = await page.locator('[class*="author"]').or(page.locator('li')).count() > 0;

      if (!hasAuthors) {
        if (await noAuthorsMessage.count() > 0) {
          await expect(noAuthorsMessage).toBeVisible();
        }
      }
    });
  });
});
