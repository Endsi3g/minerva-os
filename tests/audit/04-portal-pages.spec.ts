import { test, expect } from '@playwright/test';

test.describe('Client Portal', () => {
  test('/portal entry page renders', async ({ page }) => {
    await page.goto('/portal');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/screenshots/04-portal-entry.png', fullPage: true });

    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(10);
    const is404 = body!.toLowerCase().includes('404') && !body!.toLowerCase().includes('portal');
    if (is404) console.log('AUDIT: /portal returns a 404 — missing page');
  });

  test('Portal with invalid token redirects or shows error', async ({ page }) => {
    await page.goto('/portal/invalid-token-abc123');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/04-portal-invalid-token.png', fullPage: true });

    const url = page.url();
    const body = await page.locator('body').textContent();

    // Should either redirect to / or show error — should NOT crash
    const isCrash = body!.includes('Application error') || body!.includes('500');
    if (isCrash) console.log('AUDIT: Portal invalid token causes crash/500');

    if (url.includes('/portal/invalid-token-abc123')) {
      // Still on the page — check it renders something (loading state or error)
      console.log(`INFO: Portal invalid token — page stays at ${url} (checking render)`);
      expect(body!.length).toBeGreaterThan(10);
    } else {
      console.log(`INFO: Portal invalid token — redirected to ${url}`);
    }
  });

  test('Portal shell has 4 tabs (Overview, Deliverables, Files, Invoices)', async ({ page }) => {
    // Visit a portal route — even with invalid token we can check the shell structure
    // before redirect fires. Use a route that's likely to show shell briefly.
    await page.goto('/portal/test-token');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500); // catch the shell before redirect

    await page.screenshot({ path: 'tests/screenshots/04-portal-shell.png', fullPage: false });

    const body = await page.locator('body').textContent();
    const tabs = ['Overview', 'Deliverables', 'Files', 'Invoices'];
    const missingTabs: string[] = [];
    for (const tab of tabs) {
      if (!body!.includes(tab)) missingTabs.push(tab);
    }
    if (missingTabs.length > 0) {
      console.log(`AUDIT: Portal shell — missing tabs: ${missingTabs.join(', ')}`);
    }
  });

  test('Portal pages have Minerva branding', async ({ page }) => {
    await page.goto('/portal/test-token');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const body = await page.locator('body').textContent();
    if (!body!.includes('Minerva')) {
      console.log('AUDIT: Portal — no "Minerva" brand name found in portal shell');
    }
    if (!body!.includes('Client Portal') && !body!.includes('Portal')) {
      console.log('AUDIT: Portal — no "Client Portal" label found');
    }
  });
});
