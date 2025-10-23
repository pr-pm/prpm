# Authors Page - Regression Test Suite

This directory contains comprehensive Playwright tests to protect against visual and functional regressions on the authors page.

## Test Files

### 1. `authors-leaderboard-regression.spec.ts`
**Purpose**: Protect the leaderboard table design from regressions

**Coverage** (48 tests):
- ✅ Page header and gradient "Top Authors" title
- ✅ Stats summary (authors count, packages, downloads with emojis)
- ✅ CTA banner with gradient background and GitHub button
- ✅ Leaderboard table structure with 12-column grid layout
- ✅ Medal rankings (🥇 🥈 🥉) for top 3 authors
- ✅ Numeric rankings for positions 4+
- ✅ Yellow background highlight for top 3 rows
- ✅ Author information display (👤 emoji, @usernames, latest packages)
- ✅ Download counts with proper formatting (commas)
- ✅ Package counts with purple styling
- ✅ Verification status badges (green "Verified", gray "Unclaimed")
- ✅ Grid layout and column spans (1-4-2-3-2 pattern)
- ✅ Interactive hover effects
- ✅ Clickable author rows with navigation
- ✅ Bottom CTA section
- ✅ Responsive design (tablet and mobile)
- ✅ Loading states
- ✅ Error handling
- ✅ Visual regression checks (NOT using card grid, using table rows)

**Key Regression Protections**:
- Ensures leaderboard table layout (not 3-column card grid)
- Verifies medals for top 3 positions
- Confirms table headers with gradient background
- Validates proper column spans and alignment
- Checks for light background (not dark theme on list page)

### 2. `authors-profile-regression.spec.ts`
**Purpose**: Protect individual author profile page design from regressions

**Coverage** (50+ tests):
- ✅ Profile header with avatar circle
- ✅ Username display as h1 with proper styling
- ✅ Verified badge as rounded pill with accent color
- ✅ GitHub link with icon
- ✅ Joined date display
- ✅ Stats grid (4 cards: packages, downloads, rating, ratings count)
- ✅ Unclaimed account banner (with gradient background)
- ✅ Packages list in 3-column grid
- ✅ Package cards with type badges, descriptions, tags
- ✅ Download counts and ratings display
- ✅ Empty state for no packages
- ✅ PackageModal integration (clicking opens modal)
- ✅ Modal content (stats, tags, install command)
- ✅ Modal interactions (close button, backdrop click)
- ✅ Modal does NOT have "View Details" link
- ✅ Error handling for non-existent authors
- ✅ Dark theme consistency throughout profile

**Key Regression Protections**:
- Ensures avatar with first letter is displayed
- Verifies verified badge styling (not plain checkmark)
- Confirms PackageModal opens on package click
- Validates dark theme styling throughout
- Checks stats grid layout and formatting

## Running Tests

### Install Playwright Browsers
```bash
npx playwright install
```

### Run All Authors Tests
```bash
npm run test:e2e -- authors
```

### Run Specific Test File
```bash
# Leaderboard regression tests
npx playwright test authors-leaderboard-regression.spec.ts

# Profile regression tests
npx playwright test authors-profile-regression.spec.ts
```

### Run in UI Mode (Recommended for Development)
```bash
npx playwright test --ui
```

### Run with Specific Browser
```bash
npx playwright test authors-leaderboard-regression.spec.ts --project=chromium
npx playwright test authors-leaderboard-regression.spec.ts --project=firefox
npx playwright test authors-leaderboard-regression.spec.ts --project=webkit
```

### Run in Debug Mode
```bash
npx playwright test authors-leaderboard-regression.spec.ts --debug
```

## Test Architecture

### Mock API Responses
All tests use mocked API responses via `page.route()` to ensure:
- Consistent test data
- Fast test execution
- No dependency on backend availability
- Predictable test results

### Test Structure
```typescript
test.describe('Feature Group', () => {
  test.beforeEach(async ({ page }) => {
    // Setup mock API routes
  });

  test.describe('Sub-feature', () => {
    test('should verify specific behavior', async ({ page }) => {
      // Test implementation
    });
  });
});
```

### Key Testing Patterns Used

1. **Visual Regression Checks**: Verify CSS classes and layout structure
   ```typescript
   await expect(element).toHaveClass(/bg-gradient-to-r/);
   await expect(element).toHaveClass(/grid-cols-12/);
   ```

2. **Content Verification**: Check for specific text and formatting
   ```typescript
   await expect(page.getByText('5,000')).toBeVisible();
   await expect(page.getByText('@username')).toBeVisible();
   ```

3. **Interactive Testing**: Verify clicks, navigation, and state changes
   ```typescript
   await page.click('button:has-text("package-name")');
   await expect(modal).toBeVisible();
   ```

4. **Responsive Testing**: Test at different viewport sizes
   ```typescript
   await page.setViewportSize({ width: 375, height: 667 });
   ```

## What These Tests Prevent

### Regression Scenario 1: Layout Change
**What Happened**: Authors list was accidentally changed from leaderboard table to 3-column card grid

**How Tests Prevent It**:
- `should use table-style rows with dividers` - Checks for `.divide-y` class
- `should not display authors as cards` - Verifies absence of `rounded-xl` styling
- `leaderboard table should not use grid card layout` - Confirms no `grid-cols-3`
- `should use 12-column grid layout` - Validates `grid-cols-12` structure

### Regression Scenario 2: Missing Rankings
**What Could Happen**: Medal emojis or ranking numbers disappear

**How Tests Prevent It**:
- `should display gold medal for rank #1` - Checks for 🥇
- `should display silver medal for rank #2` - Checks for 🥈
- `should display bronze medal for rank #3` - Checks for 🥉
- `should display numeric rank for positions 4+` - Verifies numbers
- `top 3 rows should have yellow background highlight` - Checks highlight styling

### Regression Scenario 3: PackageModal Breaking
**What Could Happen**: Modal doesn't open, missing content, or unwanted "View Details" link reappears

**How Tests Prevent It**:
- `clicking package card should open modal` - Verifies modal opens
- `modal should display package name` - Checks content
- `modal should NOT have "View Details" link` - Prevents regression
- `clicking close button should close modal` - Verifies close behavior

### Regression Scenario 4: Theme Inconsistencies
**What Could Happen**: Dark theme gets mixed with light theme elements

**How Tests Prevent It**:
- `profile page should have dark background` - Checks for `bg-prpm-dark`
- `header section should have dark card background` - Verifies dark cards
- `page should have light background (not dark)` - Ensures list page is light

### Regression Scenario 5: Styling Changes
**What Could Happen**: Verified badges, stats, or other elements lose their styling

**How Tests Prevent It**:
- `verified badges should have green styling` - Checks color classes
- `avatar should have accent border and background` - Verifies avatar styling
- `should have gradient background on CTA banner` - Validates gradients

## CI/CD Integration

These tests should run on:
- ✅ Every pull request
- ✅ Before merging to main
- ✅ On scheduled nightly runs

### GitHub Actions Example
```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run Authors Regression Tests
  run: npx playwright test authors-leaderboard-regression.spec.ts authors-profile-regression.spec.ts

- name: Upload Test Results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Maintenance

### When to Update Tests

1. **Intentional Design Changes**: If you intentionally change the authors page design, update the tests to match
2. **New Features**: Add new test cases for any new features on the authors page
3. **Bug Fixes**: Add tests that would have caught the bug

### Test Health Checks

Run these commands periodically:
```bash
# Check for flaky tests (run 10 times)
npx playwright test authors-leaderboard-regression.spec.ts --repeat-each=10

# Generate coverage report
npx playwright test --reporter=html

# Run in headed mode to visually inspect
npx playwright test authors-leaderboard-regression.spec.ts --headed
```

## Debugging Failed Tests

### Step 1: Check the Error Message
```bash
npx playwright test authors-leaderboard-regression.spec.ts
```

### Step 2: Run in UI Mode
```bash
npx playwright test --ui
```

### Step 3: Use Debug Mode
```bash
npx playwright test authors-leaderboard-regression.spec.ts --debug
```

### Step 4: Take Screenshots
```bash
npx playwright test authors-leaderboard-regression.spec.ts --screenshot=on
```

### Step 5: Record Video
```bash
npx playwright test authors-leaderboard-regression.spec.ts --video=on
```

## Test Metrics

- **Total Test Count**: 98+ tests
- **Coverage Areas**: 15+ feature areas
- **Mock Scenarios**: 8+ API response variations
- **Viewport Sizes**: 3 (desktop, tablet, mobile)
- **Error Cases**: 4+ error scenarios
- **Interactive Flows**: 10+ user interaction paths

## Success Criteria

All tests should:
- ✅ Pass on first run (no flakiness)
- ✅ Complete in under 30 seconds for the suite
- ✅ Work across all browsers (Chromium, Firefox, WebKit)
- ✅ Be readable and maintainable
- ✅ Fail when regressions are introduced
- ✅ Pass when the design is correctly implemented

---

**Created**: 2024-02-XX
**Last Updated**: 2024-02-XX
**Maintainer**: Development Team
**Related PR**: #16 - Restore authors page leaderboard design
