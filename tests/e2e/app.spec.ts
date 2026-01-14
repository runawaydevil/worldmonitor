import { test, expect } from '@playwright/test';

test.describe('Watchman - SvelteKit App', () => {
	test('homepage loads correctly', async ({ page }) => {
		await page.goto('/');

		// Check page title
		await expect(page).toHaveTitle('Watchman');

		// Check header is visible
		await expect(page.locator('h1')).toHaveText('WATCHMAN');

		// Check placeholder panels are rendered
		await expect(page.locator('text=Mundo / Geopolítica')).toBeVisible();
		await expect(page.locator('text=Tecnologia / IA')).toBeVisible();
		await expect(page.locator('text=Financeiro')).toBeVisible();
		await expect(page.locator('text=Mercados')).toBeVisible();
	});

	test('phase indicator shows Phase 0 complete', async ({ page }) => {
		await page.goto('/');

		await expect(page.locator('text=Phase 0 Complete')).toBeVisible();
	});
});
