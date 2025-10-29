import { test, expect } from '@playwright/test';

test.describe('Hyperlocal Events - Smoke Test', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page.locator('h1')).toContainText('Hyperlocal Events');

    // Check search form elements exist
    await expect(page.getByText('Location')).toBeVisible();
    await expect(page.getByText('Time Available')).toBeVisible();
    await expect(page.getByText('Radius')).toBeVisible();
    await expect(page.getByText('Interests')).toBeVisible();

    // Check search button exists
    await expect(page.getByRole('button', { name: /search/i })).toBeVisible();
  });

  test('should have geolocation button', async ({ page }) => {
    await page.goto('/');

    // Check "Use My Location" button exists
    await expect(page.getByRole('button', { name: /use my location/i })).toBeVisible();
  });

  test('should allow adding interests', async ({ page }) => {
    await page.goto('/');

    // Find interest input and add button
    const interestInput = page.getByPlaceholder(/add interest/i);
    const addButton = page.getByRole('button', { name: /^add$/i });

    // Add an interest
    await interestInput.fill('music');
    await addButton.click();

    // Check if interest badge appears
    await expect(page.getByText('music ×')).toBeVisible();
  });

  test('should have map container', async ({ page }) => {
    await page.goto('/');

    // Check if map container exists (MapLibre creates a canvas)
    const mapContainer = page.locator('.maplibregl-map, canvas').first();
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
  });
});
