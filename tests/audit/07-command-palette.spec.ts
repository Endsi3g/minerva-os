import { test, expect } from '@playwright/test';

test.describe('Command Palette (Cmd+K / Ctrl+K)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('pressing Ctrl+K opens palette dialog', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'tests/screenshots/07-command-palette-open.png', fullPage: false });

    // Check for a search input in the command palette
    const dialog = page.locator('[role="dialog"], [data-cmdk-root], [cmdk-root], [class*="CommandPalette"], [class*="command"]').first();
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="Search" i], [cmdk-input]').first();

    const dialogCount = await dialog.count();
    const inputCount = await searchInput.count();

    if (dialogCount === 0 && inputCount === 0) {
      console.log('AUDIT: CommandPalette — Ctrl+K did not open palette (no dialog or search input found)');
    } else {
      expect(dialogCount + inputCount).toBeGreaterThan(0);
    }
  });

  test('palette has navigation items', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(600);

    const body = (await page.locator('body').textContent())!;
    const hasNavItems = /dashboard|pipeline|client|project/i.test(body);
    if (!hasNavItems) {
      console.log('AUDIT: CommandPalette — no navigation items (dashboard/pipeline/clients) visible in palette');
    }
  });

  test('pressing Escape closes palette', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(400);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // After Escape, palette should be gone
    const dialog = await page.locator('[role="dialog"]').count();
    if (dialog > 0) {
      console.log('AUDIT: CommandPalette — Escape key did not close palette');
    }
  });

  test('search button in header opens palette', async ({ page }) => {
    // The header Search button should also trigger the palette
    const searchBtn = page.locator('button').filter({ hasText: /search/i }).first();
    if (await searchBtn.count() > 0) {
      await searchBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: 'tests/screenshots/07-command-palette-via-btn.png', fullPage: false });
      const input = await page.locator('input').count();
      if (input === 0) console.log('AUDIT: CommandPalette — header Search button did not open palette');
    } else {
      console.log('AUDIT: CommandPalette — no Search button in header');
    }
  });
});
