import { test, expect } from '@playwright/test';

test.describe('Claim Invite Flow', () => {
  test.describe('Claim Entry Page (/claim)', () => {
    test('should display claim form', async ({ page }) => {
      await page.goto('/claim');

      // Check heading
      await expect(page.getByRole('heading', { name: 'Claim Your Author Username' })).toBeVisible();
      await expect(page.getByText('Enter your invite token to claim your verified author status')).toBeVisible();

      // Check form elements
      await expect(page.getByLabel('Invite Token')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    });

    test('should have back to home link', async ({ page }) => {
      await page.goto('/claim');

      const backLink = page.getByRole('link', { name: '← Back to home' });
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute('href', '/');
    });

    test('should navigate to home when clicking back link', async ({ page }) => {
      await page.goto('/claim');

      await page.getByRole('link', { name: '← Back to home' }).click();

      await expect(page).toHaveURL('/');
    });

    test('should navigate to token page when submitting valid token', async ({ page }) => {
      await page.goto('/claim');

      // Enter token
      await page.getByLabel('Invite Token').fill('test-token-123');

      // Submit form
      await page.getByRole('button', { name: 'Continue' }).click();

      // Should navigate to /claim/test-token-123
      await expect(page).toHaveURL('/claim/test-token-123');
    });

    test('should require token input', async ({ page }) => {
      await page.goto('/claim');

      // Try to submit without token
      await page.getByRole('button', { name: 'Continue' }).click();

      // Should stay on same page (HTML5 validation)
      await expect(page).toHaveURL('/claim');
    });

    test('should display request invite link', async ({ page }) => {
      await page.goto('/claim');

      await expect(page.getByText("Don't have an invite token?")).toBeVisible();

      const inviteLink = page.getByRole('link', { name: 'Request an invite' });
      await expect(inviteLink).toBeVisible();
      await expect(inviteLink).toHaveAttribute('href', 'mailto:invite@prpm.dev');
    });

    test('should pre-fill token from query parameter', async ({ page }) => {
      await page.goto('/claim?token=my-invite-token');

      // Token should be pre-filled
      await expect(page.getByLabel('Invite Token')).toHaveValue('my-invite-token');
    });
  });

  test.describe('Claim Token Page (/claim/:token)', () => {
    test('should show loading state initially', async ({ page }) => {
      // Delay API response
      await page.route('**/api/v1/invites/test-token', async route => {
        await new Promise(resolve => setTimeout(resolve, 100));
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            invite: {
              id: '1',
              author_username: 'testuser',
              package_count: 10,
              invite_message: 'Welcome!',
              status: 'pending',
              expires_at: new Date(Date.now() + 86400000).toISOString()
            }
          })
        });
      });

      await page.goto('/claim/test-token');

      // Should show loading spinner
      await expect(page.getByText('Loading invite...')).toBeVisible();
    });

    test('should display invite details on success', async ({ page }) => {
      await page.route('**/api/v1/invites/valid-token', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            invite: {
              id: '1',
              author_username: 'testuser',
              package_count: 15,
              invite_message: 'Welcome to PRPM!',
              status: 'pending',
              expires_at: new Date(Date.now() + 86400000).toISOString()
            }
          })
        });
      });

      await page.goto('/claim/valid-token');

      // Check invite details
      await expect(page.getByText("You're Invited!")).toBeVisible();
      await expect(page.getByText('@testuser')).toBeVisible();
      await expect(page.getByText('15')).toBeVisible();
      await expect(page.getByText('"Welcome to PRPM!"')).toBeVisible();

      // Check benefits list
      await expect(page.getByText('Verified author badge on all your packages')).toBeVisible();
      await expect(page.getByText('Full control over your 15 existing packages')).toBeVisible();

      // Check claim button
      await expect(page.getByRole('button', { name: 'Claim with GitHub' })).toBeVisible();
    });

    test('should display error for invalid token', async ({ page }) => {
      await page.route('**/api/v1/invites/invalid-token', async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invite not found' })
        });
      });

      await page.goto('/claim/invalid-token');

      // Should show error message
      await expect(page.getByText('Invalid Invite')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Try Another Token' })).toBeVisible();
    });

    test('should have back link on error page', async ({ page }) => {
      await page.route('**/api/v1/invites/bad-token', async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invite not found' })
        });
      });

      await page.goto('/claim/bad-token');

      const backLink = page.getByRole('link', { name: '← Try another token' });
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute('href', '/claim');
    });

    test('should display expiration date', async ({ page }) => {
      const futureDate = new Date(Date.now() + 86400000);

      await page.route('**/api/v1/invites/expiring-token', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            invite: {
              id: '1',
              author_username: 'testuser',
              package_count: 5,
              status: 'pending',
              expires_at: futureDate.toISOString()
            }
          })
        });
      });

      await page.goto('/claim/expiring-token');

      // Should show expiration date
      await expect(page.getByText(/Expires/)).toBeVisible();
    });

    test('should show success page after claim', async ({ page }) => {
      // Mock initial invite validation
      await page.route('**/api/v1/invites/success-token', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            invite: {
              id: '1',
              author_username: 'successuser',
              package_count: 20,
              status: 'pending',
              expires_at: new Date(Date.now() + 86400000).toISOString()
            }
          })
        });
      });

      // Navigate with token and username (simulating OAuth redirect)
      await page.goto('/claim/success-token?token=fake-jwt-token&username=successuser');

      // Mock claim API call
      await page.route('**/api/v1/invites/success-token/claim', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Invite claimed successfully'
          })
        });
      });

      // Wait for success page
      await expect(page.getByText('Welcome, @successuser!')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Your author account has been verified successfully')).toBeVisible();
      await expect(page.getByText("What's next?")).toBeVisible();
    });

    test('should be responsive on mobile', async ({ page }) => {
      await page.route('**/api/v1/invites/mobile-token', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            invite: {
              id: '1',
              author_username: 'mobileuser',
              package_count: 8,
              status: 'pending',
              expires_at: new Date(Date.now() + 86400000).toISOString()
            }
          })
        });
      });

      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/claim/mobile-token');

      // Content should be visible on mobile
      await expect(page.getByText('@mobileuser')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Claim with GitHub' })).toBeVisible();
    });
  });

  test.describe('Auth Callback Page', () => {
    test('should show loading state', async ({ page }) => {
      await page.goto('/auth/callback?token=test-jwt&username=testuser');

      // Should show loading message
      await expect(page.getByText('Completing authentication...')).toBeVisible();
    });

    test('should handle callback without parameters', async ({ page }) => {
      await page.goto('/auth/callback');

      // Should still show loading state
      await expect(page.getByText('Completing authentication...')).toBeVisible();
    });
  });
});
