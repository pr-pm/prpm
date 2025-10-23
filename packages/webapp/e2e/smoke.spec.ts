import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Basic regression protection for major pages
 *
 * These are simplified tests that verify core functionality works
 * without relying on complex API mocking or detailed assertions.
 */

test.describe('Smoke Tests', () => {
  test('Homepage loads and displays key elements', async ({ page }) => {
    await page.goto('/');

    // Check title/heading
    await expect(page.getByRole('heading', { name: /PRPM/i })).toBeVisible();

    // Check main CTAs exist
    await expect(page.getByRole('link', { name: /Browse Packages/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Get Started/i })).toBeVisible();
  });

  test('Search page loads and has tabs', async ({ page }) => {
    await page.goto('/search');

    // Check heading
    await expect(page.getByRole('heading', { name: /Search/i })).toBeVisible();

    // Check search input
    await expect(page.getByPlaceholder(/Search packages/i)).toBeVisible();

    // Check tabs exist (just verify they're present, don't test functionality)
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Packages' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Collections' })).toBeVisible();
  });

  test('Authors page loads', async ({ page }) => {
    await page.goto('/authors');

    // Just verify the page loads without errors
    // Don't test specific content as it requires API mocking
    await expect(page.locator('body')).toBeVisible();
  });

  test('Login page loads and has form', async ({ page }) => {
    await page.goto('/login');

    // Check heading
    await expect(page.getByRole('heading', { name: /Sign in/i })).toBeVisible();

    // Check GitHub login button exists
    await expect(page.getByRole('button', { name: /GitHub/i })).toBeVisible();
  });

  test('Signup page loads and has form', async ({ page }) => {
    await page.goto('/signup');

    // Check heading
    await expect(page.getByRole('heading', { name: /Create.*account/i })).toBeVisible();

    // Check GitHub signup button exists
    await expect(page.getByRole('button', { name: /GitHub/i })).toBeVisible();
  });

  test('Navigation links work', async ({ page }) => {
    await page.goto('/');

    // Click search link and verify navigation
    await page.getByRole('link', { name: /Browse Packages/i }).click();
    await expect(page).toHaveURL(/\/search/);
  });

  test('404 page shows for invalid routes', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist-12345');

    // Should get a 404 response or show a not found message
    // (depending on how Next.js handles it)
    expect(response?.status()).toBe(404);
  });
});
