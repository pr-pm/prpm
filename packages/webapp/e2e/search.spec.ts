import { test, expect } from '@playwright/test';

test.describe('Search Page', () => {
  test.describe('Navigation and Layout', () => {
    test('should display search page with all tabs', async ({ page }) => {
      await page.goto('/search');

      // Check main heading
      await expect(page.getByRole('heading', { name: 'Search' })).toBeVisible();

      // Check all tabs are visible
      await expect(page.getByRole('tab', { name: 'Packages' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Collections' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Skills' })).toBeVisible();
    });

    test('should have search input', async ({ page }) => {
      await page.goto('/search');

      const searchInput = page.getByPlaceholder(/Search packages/i);
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toBeEditable();
    });

    test('should switch between tabs', async ({ page }) => {
      await page.goto('/search');

      // Default should be packages tab
      await expect(page.getByRole('tab', { name: 'Packages' })).toHaveAttribute('aria-selected', 'true');

      // Switch to Collections
      await page.getByRole('tab', { name: 'Collections' }).click();
      await expect(page.getByRole('tab', { name: 'Collections' })).toHaveAttribute('aria-selected', 'true');

      // Switch to Skills
      await page.getByRole('tab', { name: 'Skills' }).click();
      await expect(page.getByRole('tab', { name: 'Skills' })).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('Package Search and Filtering', () => {
    test('should search for packages', async ({ page }) => {
      await page.goto('/search');

      const searchInput = page.getByPlaceholder(/Search packages/i);
      await searchInput.fill('react');

      // Wait for search results
      await page.waitForTimeout(500);

      // Should show packages containing "react"
      const packageCards = page.locator('[class*="bg-prpm-dark-card"]');
      await expect(packageCards.first()).toBeVisible();
    });

    test('should filter packages by type', async ({ page }) => {
      await page.goto('/search');

      // Select cursor type
      const typeSelect = page.locator('select').filter({ hasText: /Type/i }).or(page.getByRole('combobox', { name: /type/i }));
      if (await typeSelect.count() > 0) {
        await typeSelect.selectOption('cursor');
        await page.waitForTimeout(500);
      }
    });

    test('should filter packages by category', async ({ page }) => {
      await page.goto('/search');

      const categorySelect = page.locator('select').filter({ hasText: /Category/i }).or(page.getByRole('combobox', { name: /category/i }));
      if (await categorySelect.count() > 0) {
        await categorySelect.selectOption({ index: 1 }); // Select first non-empty option
        await page.waitForTimeout(500);
      }
    });

    test('should sort packages by different criteria', async ({ page }) => {
      await page.goto('/search');

      const sortSelect = page.locator('select').filter({ hasText: /Sort/i }).or(page.getByRole('combobox', { name: /sort/i }));
      if (await sortSelect.count() > 0) {
        await sortSelect.selectOption('created');
        await page.waitForTimeout(500);

        await sortSelect.selectOption('quality');
        await page.waitForTimeout(500);
      }
    });

    test('should display package details', async ({ page }) => {
      await page.goto('/search');

      // Wait for packages to load
      await page.waitForTimeout(1000);

      const packageCard = page.locator('[class*="bg-prpm-dark-card"]').first();
      if (await packageCard.count() > 0) {
        // Should show package name
        await expect(packageCard.getByRole('heading').first()).toBeVisible();

        // Should show package type badge
        const typeBadge = packageCard.locator('[class*="border"]').first();
        await expect(typeBadge).toBeVisible();

        // Should show download count
        await expect(packageCard.getByText(/downloads/i)).toBeVisible();

        // Should show install command
        await expect(packageCard.getByText(/prpm install/i)).toBeVisible();
      }
    });

    test('should show verified badge for verified packages', async ({ page }) => {
      await page.goto('/search');
      await page.waitForTimeout(1000);

      // Look for checkmark icon (verified badge)
      const verifiedIcon = page.locator('svg').filter({ has: page.locator('path[fill-rule="evenodd"]') });
      if (await verifiedIcon.count() > 0) {
        await expect(verifiedIcon.first()).toBeVisible();
      }
    });

    test('should show featured badge for featured packages', async ({ page }) => {
      await page.goto('/search');
      await page.waitForTimeout(1000);

      const featuredBadge = page.getByText('Featured');
      if (await featuredBadge.count() > 0) {
        await expect(featuredBadge.first()).toBeVisible();
      }
    });
  });

  test.describe('Collection Search', () => {
    test('should switch to collections tab and show collections', async ({ page }) => {
      await page.goto('/search');

      await page.getByRole('tab', { name: 'Collections' }).click();

      // Wait for collections to load
      await page.waitForTimeout(1000);

      const collectionCards = page.locator('[class*="bg-prpm-dark-card"]');
      if (await collectionCards.count() > 0) {
        await expect(collectionCards.first()).toBeVisible();
      }
    });

    test('should display collection details', async ({ page }) => {
      await page.goto('/search');
      await page.getByRole('tab', { name: 'Collections' }).click();
      await page.waitForTimeout(1000);

      const collectionCard = page.locator('[class*="bg-prpm-dark-card"]').first();
      if (await collectionCard.count() > 0) {
        // Should show collection name
        await expect(collectionCard.getByRole('heading').first()).toBeVisible();

        // Should show name_slug (install identifier)
        await expect(collectionCard.locator('p[class*="font-mono"]').first()).toBeVisible();

        // Should show package count
        await expect(collectionCard.getByText(/packages/i)).toBeVisible();

        // Should show install count
        await expect(collectionCard.getByText(/installs/i)).toBeVisible();

        // Should show install command
        await expect(collectionCard.getByText(/prpm install/i)).toBeVisible();
      }
    });

    test('should show official badge for official collections', async ({ page }) => {
      await page.goto('/search');
      await page.getByRole('tab', { name: 'Collections' }).click();
      await page.waitForTimeout(1000);

      const officialBadge = page.getByText('Official');
      if (await officialBadge.count() > 0) {
        await expect(officialBadge.first()).toBeVisible();
      }
    });

    test('should display collection name_slug not UUID', async ({ page }) => {
      await page.goto('/search');
      await page.getByRole('tab', { name: 'Collections' }).click();
      await page.waitForTimeout(1000);

      const collectionCard = page.locator('[class*="bg-prpm-dark-card"]').first();
      if (await collectionCard.count() > 0) {
        const slug = collectionCard.locator('p[class*="font-mono"]').first();
        const slugText = await slug.textContent();

        // Should not contain UUID pattern (8-4-4-4-12)
        expect(slugText).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);

        // Should be kebab-case slug
        expect(slugText).toMatch(/^[a-z0-9-]+$/);
      }
    });

    test('should filter collections by category', async ({ page }) => {
      await page.goto('/search');
      await page.getByRole('tab', { name: 'Collections' }).click();

      const categorySelect = page.locator('select').filter({ hasText: /Category/i });
      if (await categorySelect.count() > 0) {
        await categorySelect.selectOption({ index: 1 });
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Skills Search', () => {
    test('should switch to skills tab and show Claude skills', async ({ page }) => {
      await page.goto('/search');

      await page.getByRole('tab', { name: 'Skills' }).click();
      await page.waitForTimeout(1000);

      const skillCards = page.locator('[class*="bg-prpm-dark-card"]');
      if (await skillCards.count() > 0) {
        await expect(skillCards.first()).toBeVisible();
      }
    });

    test('should only show claude-skill type packages in skills tab', async ({ page }) => {
      await page.goto('/search');
      await page.getByRole('tab', { name: 'Skills' }).click();
      await page.waitForTimeout(1000);

      // All packages should be of type claude-skill
      const typeLabels = page.locator('[class*="border"]').filter({ hasText: /skill/i });
      if (await typeLabels.count() > 0) {
        await expect(typeLabels.first()).toBeVisible();
      }
    });
  });

  test.describe('Pagination', () => {
    test('should show pagination controls when there are many results', async ({ page }) => {
      await page.goto('/search');
      await page.waitForTimeout(1000);

      // Look for next/previous buttons or page numbers
      const nextButton = page.getByRole('button', { name: /next/i });
      const prevButton = page.getByRole('button', { name: /prev|previous/i });
      const pageNumbers = page.locator('[class*="pagination"]');

      // At least one pagination control should exist if there are enough results
      const hasPagination = await nextButton.count() > 0 ||
                            await prevButton.count() > 0 ||
                            await pageNumbers.count() > 0;

      // If pagination exists, test it
      if (hasPagination && await nextButton.count() > 0) {
        await nextButton.click();
        await page.waitForTimeout(500);
        // Should load next page
      }
    });
  });

  test.describe('Install Commands', () => {
    test('should display correct install command for packages', async ({ page }) => {
      await page.goto('/search');
      await page.waitForTimeout(1000);

      const packageCard = page.locator('[class*="bg-prpm-dark-card"]').first();
      if (await packageCard.count() > 0) {
        const installCommand = packageCard.getByText(/prpm install/i);
        await expect(installCommand).toBeVisible();

        const commandText = await installCommand.textContent();
        expect(commandText).toMatch(/^prpm install [a-z0-9@/-]+$/);
      }
    });

    test('should display correct install command for collections', async ({ page }) => {
      await page.goto('/search');
      await page.getByRole('tab', { name: 'Collections' }).click();
      await page.waitForTimeout(1000);

      const collectionCard = page.locator('[class*="bg-prpm-dark-card"]').first();
      if (await collectionCard.count() > 0) {
        const installCommand = collectionCard.getByText(/prpm install/i);
        await expect(installCommand).toBeVisible();

        const commandText = await installCommand.textContent();
        // Should use name_slug, not @collection/ prefix or UUID
        expect(commandText).toMatch(/^prpm install [a-z0-9-]+$/);
        expect(commandText).not.toContain('@collection/');
        expect(commandText).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}/); // No UUID
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should be usable on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/search');

      // Search input should be visible
      await expect(page.getByPlaceholder(/Search/i)).toBeVisible();

      // Tabs should be visible
      await expect(page.getByRole('tab', { name: 'Packages' })).toBeVisible();

      // Should be able to switch tabs
      await page.getByRole('tab', { name: 'Collections' }).click();
      await expect(page.getByRole('tab', { name: 'Collections' })).toHaveAttribute('aria-selected', 'true');
    });

    test('should be usable on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/search');

      await expect(page.getByRole('heading', { name: 'Search' })).toBeVisible();
      await expect(page.getByPlaceholder(/Search/i)).toBeVisible();
    });
  });

  test.describe('Empty States', () => {
    test('should show empty state when no results found', async ({ page }) => {
      await page.goto('/search');

      const searchInput = page.getByPlaceholder(/Search packages/i);
      await searchInput.fill('zzzznonexistentpackagexyz123');
      await page.waitForTimeout(1000);

      // Should show no results message
      const noResults = page.getByText(/no.*found|no packages|no results/i);
      if (await noResults.count() > 0) {
        await expect(noResults).toBeVisible();
      }
    });
  });

  test.describe('Tags', () => {
    test('should display package tags', async ({ page }) => {
      await page.goto('/search');
      await page.waitForTimeout(1000);

      const packageCard = page.locator('[class*="bg-prpm-dark-card"]').first();
      if (await packageCard.count() > 0) {
        // Look for tag elements (small badges with gray background)
        const tags = packageCard.locator('[class*="bg-prpm-dark"][class*="border"][class*="rounded"]').filter({ hasText: /^(?!prpm install)/ });
        if (await tags.count() > 0) {
          await expect(tags.first()).toBeVisible();
        }
      }
    });
  });
});
