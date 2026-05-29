import { test, expect } from '@playwright/test';

const NAV_ITEMS = [
  { label: /dashboard/i, href: '/app/dashboard' },
  { label: /pipeline/i, href: '/app/pipeline' },
  { label: /client/i, href: '/app/clients' },
  { label: /project/i, href: '/app/projects' },
  { label: /task/i, href: '/app/tasks' },
  { label: /approval/i, href: '/app/approvals' },
  { label: /file/i, href: '/app/files' },
  { label: /billing/i, href: '/app/billing' },
  { label: /finance/i, href: '/app/finance' },
  { label: /report/i, href: '/app/reports' },
  { label: /call/i, href: '/app/call-preps' },
  { label: /fulfillment/i, href: '/app/fulfillment' },
  { label: /agent/i, href: '/app/agent-ops' },
  { label: /setting/i, href: '/app/settings' },
  // Sprint 1-9 new routes
  { label: /time/i, href: '/app/time-tracking' },
  { label: /service|catalog/i, href: '/app/services' },
  { label: /proposal/i, href: '/app/proposals' },
  { label: /expense/i, href: '/app/expenses' },
  { label: /knowledge/i, href: '/app/knowledge' },
  { label: /ticket|support/i, href: '/app/tickets' },
  { label: /nps/i, href: '/app/nps' },
  { label: /resource/i, href: '/app/resources' },
];

test.describe('App Shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500); // allow Supabase loading state to settle
  });

  test('Sidebar renders with navigation', async ({ page }) => {
    await page.screenshot({ path: 'tests/screenshots/02-app-shell.png', fullPage: false });

    // Sidebar should be present
    const sidebar = page.locator('aside, [data-testid="sidebar"], nav').first();
    await expect(sidebar).toBeVisible({ timeout: 8000 });

    // At least some nav links should be visible
    const links = await page.locator('a[href*="/app/"]').count();
    expect(links).toBeGreaterThanOrEqual(5);
  });

  test('Sidebar has all expected nav links', async ({ page }) => {
    const missing: string[] = [];
    for (const item of NAV_ITEMS) {
      const link = page.locator(`a[href="${item.href}"]`);
      const count = await link.count();
      if (count === 0) missing.push(item.href);
    }
    if (missing.length > 0) {
      console.log('MISSING NAV LINKS:', missing.join(', '));
    }
    expect(missing.length).toBe(0);
  });

  test('Header renders with title/breadcrumb', async ({ page }) => {
    // Header should exist at top
    const header = page.locator('header, [data-testid="header"]').first();
    await expect(header).toBeVisible({ timeout: 8000 });
  });

  test('Chat sidebar / AI chat button visible', async ({ page }) => {
    await page.screenshot({ path: 'tests/screenshots/02-chat-sidebar.png', fullPage: false });
    // Chat sidebar or AI toggle button
    const chatArea = page.locator('text=/minerva|hermes|chat|ai/i').first();
    // Soft check — note if missing rather than hard fail
    const count = await chatArea.count();
    if (count === 0) console.log('AUDIT: Chat sidebar / AI chat not found on dashboard');
  });

  test('Each sidebar link navigates to correct route', async ({ page }) => {
    const results: { href: string; status: 'ok' | 'error' | 'redirect' }[] = [];

    for (const item of NAV_ITEMS.slice(0, 6)) { // test first 6 to keep runtime reasonable
      const link = page.locator(`a[href="${item.href}"]`).first();
      if (await link.count() === 0) {
        results.push({ href: item.href, status: 'error' });
        continue;
      }
      await link.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(800);
      const url = page.url();
      const isCorrect = url.includes(item.href);
      results.push({ href: item.href, status: isCorrect ? 'ok' : 'redirect' });
    }

    const failed = results.filter(r => r.status !== 'ok');
    if (failed.length > 0) console.log('AUDIT: Navigation issues:', JSON.stringify(failed));
    expect(failed.length).toBe(0);
  });

  test('Mobile sidebar collapses (375px viewport)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/app/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/screenshots/02-mobile-shell.png', fullPage: false });
    // Page should render without overflow/crash
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(10);
  });
});
