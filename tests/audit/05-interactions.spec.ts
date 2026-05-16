import { test, expect } from '@playwright/test';

test.describe('Cross-cutting interactions', () => {

  // ─── Language switcher ──────────────────────────────────────────────────────

  test('Language switches from EN to FR', async ({ page }) => {
    await page.goto('/app/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    // Click FR button
    const frBtn = page.locator('button').filter({ hasText: /^fr$/i }).first();
    if (await frBtn.count() > 0) {
      await frBtn.click();
      await page.waitForTimeout(500);
      const bodyAfter = await page.locator('body').textContent();
      const hasFrench = /tableau de bord|projet|paramètre|espace/i.test(bodyAfter!);
      await page.screenshot({ path: 'tests/screenshots/05-lang-fr.png', fullPage: false });
      if (!hasFrench) console.log('AUDIT: Language switch to FR did not translate UI');
      else console.log('INFO: Language switch FR — works correctly');

      // Switch back to EN
      const enBtn = page.locator('button').filter({ hasText: /^en$/i }).first();
      if (await enBtn.count() > 0) await enBtn.click();
    } else {
      console.log('AUDIT: No FR language button found in Settings');
    }
  });

  // ─── Responsive layout ─────────────────────────────────────────────────────

  test('Mobile 375px — landing page renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/screenshots/05-mobile-landing.png', fullPage: true });
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(50);
  });

  test('Mobile 375px — app dashboard renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/app/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/screenshots/05-mobile-dashboard.png', fullPage: true });
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(50);
  });

  test('Tablet 768px — app renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/app/pipeline');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/screenshots/05-tablet-pipeline.png', fullPage: true });
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(50);
  });

  // ─── Console errors check ──────────────────────────────────────────────────

  test('No critical runtime errors on key pages', async ({ page }) => {
    const criticalErrors: { page: string; error: string }[] = [];

    for (const route of ['/app/dashboard', '/app/pipeline', '/app/billing', '/app/reports']) {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Filter out expected Convex connection errors (no backend in test env)
          const isExpected = text.includes('WebSocket') || text.includes('convex') ||
            text.includes('placeholder.convex') || text.includes('net::ERR') ||
            text.includes('Failed to fetch');
          if (!isExpected) errors.push(text);
        }
      });

      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      for (const err of errors) {
        criticalErrors.push({ page: route, error: err });
      }
      page.removeAllListeners('console');
    }

    if (criticalErrors.length > 0) {
      console.log('AUDIT: Critical runtime errors found:');
      criticalErrors.forEach(e => console.log(`  [${e.page}] ${e.error}`));
    }
    expect(criticalErrors.length).toBe(0);
  });

  // ─── 404 check for all routes ─────────────────────────────────────────────

  test('No pages return 404', async ({ page }) => {
    const routes = [
      '/', '/login', '/signup', '/platform', '/modules', '/security', '/insights',
      '/app/dashboard', '/app/pipeline', '/app/clients', '/app/projects',
      '/app/tasks', '/app/approvals', '/app/files', '/app/billing',
      '/app/finance', '/app/reports', '/app/settings', '/app/agent-ops',
      '/app/call-preps', '/app/fulfillment',
      '/app/services', '/app/proposals', '/app/expenses', '/app/knowledge',
      '/app/tickets', '/app/nps', '/app/resources', '/app/time-tracking',
    ];

    const broken: string[] = [];

    for (const route of routes) {
      const response = await page.goto(route);
      const status = response?.status() ?? 0;
      const body = await page.locator('body').textContent();
      const is404 = status === 404 || body!.toLowerCase().includes('page not found');
      if (is404) broken.push(`${route} (status: ${status})`);
    }

    if (broken.length > 0) console.log('AUDIT: 404 pages:', broken.join(', '));
    expect(broken.length).toBe(0);
  });

  // ─── Empty states check ───────────────────────────────────────────────────

  test('Modules show graceful empty state (not crash) with no data', async ({ page }) => {
    const modules = [
      '/app/dashboard', '/app/clients', '/app/projects',
      '/app/tasks', '/app/approvals', '/app/billing',
    ];

    const crashes: string[] = [];

    for (const route of modules) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const body = await page.locator('body').textContent();
      const isCrash = body!.includes('Application error') ||
        body!.includes('Error:') && body!.includes('at ') && body!.includes('stack') ||
        body!.trim().length < 30;

      if (isCrash) crashes.push(route);
    }

    if (crashes.length > 0) console.log('AUDIT: Modules crash with no data:', crashes.join(', '));
    expect(crashes.length).toBe(0);
  });

  // ─── Form validation ──────────────────────────────────────────────────────

  test('Pipeline Add Deal form — required field validation', async ({ page }) => {
    await page.goto('/app/pipeline');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const addBtn = page.locator('button').filter({ hasText: /add deal|nouveau/i }).first();
    if (await addBtn.count() === 0) {
      console.log('AUDIT: Pipeline — Add Deal button not found for form test');
      return;
    }

    await addBtn.click();
    await page.waitForTimeout(800);

    // Submit empty form
    const saveBtn = page.locator('button').filter({ hasText: /save|add|create|créer|ajouter/i }).last();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'tests/screenshots/05-pipeline-form-empty.png', fullPage: false });
    // Form should still be open (validation prevented close)
    const dialog = page.locator('[role="dialog"], [data-state="open"]');
    if (await dialog.count() === 0) {
      console.log('AUDIT: Pipeline — form closed on empty submit (no validation)');
    }
  });
});
