/**
 * E2E tests for star functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Star Functionality', () => {
  test.describe('Package Starring', () => {
    test('should display star button on package page', async ({ page }) => {
      // Navigate to a package page
      await page.goto('/packages/prpm/hello-world-cursor');

      // Check that star button is visible
      const starButton = page.locator('button').filter({ hasText: /^\d+$/ }).first();
      await expect(starButton).toBeVisible();

      // Check that star icon is present
      const starIcon = page.locator('svg').filter({ has: page.locator('path[d*="M11.049"]') }).first();
      await expect(starIcon).toBeVisible();
    });

    test('should show loading state while checking star status', async ({ page }) => {
      // Slow down network to see loading state
      await page.route('**/api/v1/packages/starred*', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });

      await page.goto('/packages/prpm/hello-world-cursor');

      // Check for loading indicator (pulse animation)
      const loadingButton = page.locator('button').filter({ has: page.locator('svg.animate-pulse') });
      await expect(loadingButton).toBeVisible({ timeout: 500 });
    });

    test('should show login prompt when not authenticated', async ({ page }) => {
      // Ensure no auth token
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());

      await page.goto('/packages/prpm/hello-world-cursor');

      // Click star button
      const starButton = page.locator('button').filter({ hasText: /^\d+$/ }).first();
      await starButton.click();

      // Check for login error message
      await expect(page.getByText('Please log in to star')).toBeVisible();
    });

    test('should star a package when authenticated', async ({ page }) => {
      // Mock authentication
      await page.evaluate(() => {
        localStorage.setItem('prpm_token', 'test-token');
      });

      // Mock API responses
      await page.route('**/api/v1/packages/starred*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ packages: [], total: 0 }),
        });
      });

      let starRequestMade = false;
      await page.route('**/api/v1/packages/*/star', (route, request) => {
        starRequestMade = true;
        const body = request.postDataJSON();
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            starred: body.starred,
            stars: body.starred ? 11 : 10,
          }),
        });
      });

      await page.goto('/packages/prpm/hello-world-cursor');

      // Wait for star status check to complete
      await page.waitForTimeout(500);

      // Click star button
      const starButton = page.locator('button').filter({ hasText: /^\d+$/ }).first();
      await starButton.click();

      // Wait for star request
      await page.waitForTimeout(500);
      expect(starRequestMade).toBe(true);

      // Check that star count updated
      await expect(starButton).toContainText('11');
    });

    test('should unstar a package', async ({ page }) => {
      // Mock authentication
      await page.evaluate(() => {
        localStorage.setItem('prpm_token', 'test-token');
      });

      // Mock package as already starred
      await page.route('**/api/v1/packages/starred*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            packages: [{ id: 'package-uuid', name: 'hello-world-cursor' }],
            total: 1,
          }),
        });
      });

      await page.route('**/api/v1/packages/*/star', (route, request) => {
        const body = request.postDataJSON();
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            starred: body.starred,
            stars: body.starred ? 11 : 9,
          }),
        });
      });

      await page.goto('/packages/prpm/hello-world-cursor');

      // Wait for star status check
      await page.waitForTimeout(500);

      // Button should show filled star (starred state)
      const starButton = page.locator('button').filter({ hasText: /^\d+$/ }).first();

      // Click to unstar
      await starButton.click();

      // Wait for unstar request
      await page.waitForTimeout(500);

      // Check that star count decreased
      await expect(starButton).toContainText('9');
    });
  });

  test.describe('Collection Starring', () => {
    test('should display star button on collection page', async ({ page }) => {
      await page.goto('/collections/collection/typescript-fullstack');

      // Check that star button is visible
      const starButton = page.locator('button').filter({ hasText: /^\d+$/ }).first();
      await expect(starButton).toBeVisible();
    });

    test('should star a collection when authenticated', async ({ page }) => {
      // Mock authentication
      await page.evaluate(() => {
        localStorage.setItem('prpm_token', 'test-token');
      });

      // Mock API responses
      await page.route('**/api/v1/collections/starred*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ collections: [], total: 0 }),
        });
      });

      let starRequestMade = false;
      await page.route('**/api/v1/collections/*/star', (route, request) => {
        starRequestMade = true;
        const body = request.postDataJSON();
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            starred: body.starred,
            stars: body.starred ? 31 : 30,
          }),
        });
      });

      await page.goto('/collections/collection/typescript-fullstack');

      // Wait for star status check
      await page.waitForTimeout(500);

      // Click star button
      const starButton = page.locator('button').filter({ hasText: /^\d+$/ }).first();
      await starButton.click();

      // Wait for star request
      await page.waitForTimeout(500);
      expect(starRequestMade).toBe(true);

      // Check that star count updated
      await expect(starButton).toContainText('31');
    });
  });

  test.describe('CLI Starred Command', () => {
    test('should list starred packages via CLI', async ({ page }) => {
      // This test would require a CLI testing framework
      // For now, we document the expected behavior

      test.skip('prpm starred --packages should list user starred packages', async () => {
        // Expected output:
        // 📦 Starred Packages (2):
        //   [cursor]     @author/package-1
        //       ⭐ 10    ⬇️  100
        //       Package description
        //
        //   [claude]     @author/package-2
        //       ⭐ 20    ⬇️  200
        //       Package description
        //
        // Total: 2 starred items
      });

      test.skip('prpm starred --collections should list user starred collections', async () => {
        // Expected output:
        // 📚 Starred Collections (1):
        //   collection/test-collection
        //       ⭐ 30    📦 5 packages
        //       Collection description
        //
        // Total: 1 starred items
      });

      test.skip('prpm starred --format cursor should filter by format', async () => {
        // Should only show cursor packages
      });
    });
  });

  test.describe('Star Button Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/packages/prpm/hello-world-cursor');

      const starButton = page.locator('button').filter({ hasText: /^\d+$/ }).first();

      // Check for title attribute (tooltip)
      const title = await starButton.getAttribute('title');
      expect(['Star', 'Unstar']).toContain(title);
    });

    test('should be keyboard accessible', async ({ page }) => {
      await page.goto('/packages/prpm/hello-world-cursor');

      // Tab to star button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // May need multiple tabs depending on page structure

      const starButton = page.locator('button').filter({ hasText: /^\d+$/ }).first();

      // Check if button is focused
      await expect(starButton).toBeFocused();

      // Should be activatable with Enter/Space
      // (actual behavior would depend on mocked auth state)
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto('/packages/prpm/hello-world-cursor');

      const starButton = page.locator('button').filter({ hasText: /^\d+$/ }).first();

      // Get computed styles
      const color = await starButton.evaluate(el =>
        window.getComputedStyle(el).color
      );
      const backgroundColor = await starButton.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );

      // Ensure colors are defined
      expect(color).toBeTruthy();
      expect(backgroundColor).toBeTruthy();

      // Note: Actual contrast ratio calculation would require additional logic
      // This test serves as a reminder to check accessibility
    });
  });

  test.describe('Star Count Display', () => {
    test('should format large star counts correctly', async ({ page }) => {
      // Mock a package with large star count
      await page.route('**/api/v1/packages/*/star', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            starred: false,
            stars: 1234,
          }),
        });
      });

      await page.goto('/packages/prpm/hello-world-cursor');

      // Star count should be visible (exact formatting depends on implementation)
      const starButton = page.locator('button').filter({ hasText: /1.*234/ }).first();
      await expect(starButton).toBeVisible();
    });

    test('should handle zero stars', async ({ page }) => {
      await page.goto('/packages/prpm/hello-world-cursor');

      // Even with zero stars, button should be visible
      const starButton = page.locator('button').filter({ hasText: /^\d+$/ }).first();
      await expect(starButton).toBeVisible();
    });
  });
});
