import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('homepage loads and shows title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/NCL/i);
    // Page should have content loaded (not blank)
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('navigation to teams page works', async ({ page }) => {
    await page.goto('/teams');
    // Should show the teams page heading
    await expect(page.locator('h1')).toBeVisible();
  });

  test('navigation to news page works', async ({ page }) => {
    await page.goto('/news');
    // Should show the news page heading
    await expect(page.locator('h1')).toBeVisible();
  });
});
