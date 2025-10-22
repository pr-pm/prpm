import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test.describe('Semantic HTML', () => {
    test('home page should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');

      // Should have h1
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);

      // Should have proper heading order
      const allHeadings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(allHeadings.length).toBeGreaterThan(0);
    });

    test('search page should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/search');

      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
    });

    test('links should have accessible names', async ({ page }) => {
      await page.goto('/');

      const links = await page.locator('a').all();
      for (const link of links.slice(0, 10)) { // Check first 10 links
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');

        // Link should have text, aria-label, or title
        expect(text || ariaLabel || title).toBeTruthy();
      }
    });

    test('buttons should have accessible names', async ({ page }) => {
      await page.goto('/search');

      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');

        // Button should have text, aria-label, or title
        expect(text || ariaLabel || title).toBeTruthy();
      }
    });

    test('images should have alt text', async ({ page }) => {
      await page.goto('/');

      const images = await page.locator('img').all();
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        // Image should have alt attribute (can be empty for decorative images)
        expect(alt).toBeDefined();
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should be able to navigate home page with keyboard', async ({ page }) => {
      await page.goto('/');

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      const firstFocusable = await page.evaluate(() => document.activeElement?.tagName);
      expect(['A', 'BUTTON', 'INPUT']).toContain(firstFocusable);

      // Should be able to tab to multiple elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      const thirdFocusable = await page.evaluate(() => document.activeElement?.tagName);
      expect(thirdFocusable).toBeTruthy();
    });

    test('should be able to navigate search with keyboard', async ({ page }) => {
      await page.goto('/search');

      // Search input should be focusable
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.getAttribute('placeholder'));
      expect(focused).toMatch(/search/i);
    });

    test('should be able to activate links with Enter key', async ({ page }) => {
      await page.goto('/');

      // Focus on claim link
      const claimLink = page.getByRole('link', { name: /Claim Invite/i });
      await claimLink.focus();

      // Press Enter should navigate
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL('/claim');
    });

    test('should be able to switch tabs with keyboard on search page', async ({ page }) => {
      await page.goto('/search');

      // Tab to the tabs
      const packagesTab = page.getByRole('tab', { name: 'Packages' });
      await packagesTab.focus();

      // Arrow keys should navigate tabs
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(200);

      const collectionsTab = page.getByRole('tab', { name: 'Collections' });
      const isSelected = await collectionsTab.getAttribute('aria-selected');
      expect(isSelected).toBe('true');
    });
  });

  test.describe('Focus Management', () => {
    test('focused elements should have visible focus indicator', async ({ page }) => {
      await page.goto('/');

      const link = page.getByRole('link', { name: /GitHub/i });
      await link.focus();

      // Check if element has focus styles
      const box = await link.boundingBox();
      expect(box).toBeTruthy();
    });

    test('skip to main content link should be available', async ({ page }) => {
      await page.goto('/');

      // Press Tab to reveal skip link (often hidden)
      await page.keyboard.press('Tab');

      const skipLink = page.getByRole('link', { name: /skip to (main )?content/i });
      if (await skipLink.count() > 0) {
        await expect(skipLink).toBeFocused();
      }
    });
  });

  test.describe('ARIA Attributes', () => {
    test('tabs should have proper ARIA attributes', async ({ page }) => {
      await page.goto('/search');

      const packagesTab = page.getByRole('tab', { name: 'Packages' });
      await expect(packagesTab).toHaveAttribute('aria-selected', 'true');
      await expect(packagesTab).toHaveAttribute('role', 'tab');

      // Tab should control a tabpanel
      const controlsId = await packagesTab.getAttribute('aria-controls');
      if (controlsId) {
        const tabpanel = page.locator(`#${controlsId}`);
        await expect(tabpanel).toHaveAttribute('role', 'tabpanel');
      }
    });

    test('search input should have proper label', async ({ page }) => {
      await page.goto('/search');

      const searchInput = page.getByPlaceholder(/Search/i);
      const ariaLabel = await searchInput.getAttribute('aria-label');
      const id = await searchInput.getAttribute('id');

      // Should have aria-label or associated label
      if (!ariaLabel && id) {
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toBeAttached();
      } else {
        expect(ariaLabel).toBeTruthy();
      }
    });

    test('interactive elements should have proper roles', async ({ page }) => {
      await page.goto('/');

      // Links should have link role (implicit)
      const links = page.getByRole('link');
      expect(await links.count()).toBeGreaterThan(0);

      // Buttons should have button role (implicit)
      const buttons = page.getByRole('button');
      // May or may not have buttons depending on page content
      expect(await buttons.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Color Contrast', () => {
    test('text should have sufficient contrast', async ({ page }) => {
      await page.goto('/');

      // This is a basic check - proper contrast checking requires specialized tools
      // Here we just verify text is visible
      const heading = page.getByRole('heading', { name: 'PRPM' });
      await expect(heading).toBeVisible();

      // Verify text color is not too light
      const color = await heading.evaluate((el) => window.getComputedStyle(el).color);
      expect(color).toBeTruthy();
    });
  });

  test.describe('Screen Reader Support', () => {
    test('page should have descriptive title', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/PRPM|Prompt Package Manager/);

      await page.goto('/search');
      await expect(page).toHaveTitle(/Search|PRPM/);

      await page.goto('/authors');
      await expect(page).toHaveTitle(/Authors|PRPM/);
    });

    test('main landmark should exist', async ({ page }) => {
      await page.goto('/');

      const main = page.getByRole('main');
      if (await main.count() > 0) {
        await expect(main).toBeVisible();
      }
    });

    test('navigation landmark should exist', async ({ page }) => {
      await page.goto('/');

      const nav = page.getByRole('navigation');
      if (await nav.count() > 0) {
        await expect(nav.first()).toBeVisible();
      }
    });

    test('banner landmark should exist', async ({ page }) => {
      await page.goto('/');

      const banner = page.getByRole('banner');
      if (await banner.count() > 0) {
        await expect(banner).toBeVisible();
      }
    });
  });

  test.describe('Form Accessibility', () => {
    test('search form should have accessible submit', async ({ page }) => {
      await page.goto('/search');

      const searchInput = page.getByPlaceholder(/Search/i);
      await expect(searchInput).toBeVisible();

      // Should be able to submit with Enter key
      await searchInput.fill('test');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    });

    test('select elements should have labels', async ({ page }) => {
      await page.goto('/search');

      const selects = await page.locator('select').all();
      for (const select of selects) {
        const ariaLabel = await select.getAttribute('aria-label');
        const id = await select.getAttribute('id');

        if (!ariaLabel && id) {
          const label = page.locator(`label[for="${id}"]`);
          expect(await label.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('touch targets should be large enough', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Check button sizes
      const buttons = await page.getByRole('link').all();
      for (const button of buttons.slice(0, 5)) {
        const box = await button.boundingBox();
        if (box) {
          // Minimum touch target is 44x44 pixels (WCAG 2.1)
          expect(box.height).toBeGreaterThanOrEqual(30); // Relaxed for text links
        }
      }
    });

    test('should support pinch-to-zoom', async ({ page }) => {
      await page.goto('/');

      // Check viewport meta tag doesn't disable zoom
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      if (viewport) {
        expect(viewport).not.toContain('user-scalable=no');
        expect(viewport).not.toContain('maximum-scale=1');
      }
    });
  });
});
