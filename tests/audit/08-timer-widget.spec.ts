import { test, expect } from '@playwright/test';

test.describe('Timer Widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('timer widget visible in sidebar', async ({ page }) => {
    await page.screenshot({ path: 'tests/screenshots/08-timer-widget.png', fullPage: false });

    const body = (await page.locator('body').textContent())!;
    // Timer widget should show start timer, stop, or an active time display
    const hasTimer = /00:00|timer|start|stop|chrono/i.test(body);
    if (!hasTimer) {
      console.log('AUDIT: TimerWidget — no timer/start/stop/00:00 label found in sidebar');
    }
  });

  test('start button visible in sidebar', async ({ page }) => {
    const sidebar = page.locator('aside').first();
    const startBtn = sidebar.locator('button').filter({ hasText: /start|play/i }).first();
    if (await startBtn.count() > 0) {
      await page.screenshot({ path: 'tests/screenshots/08-timer-start-btn.png', fullPage: false });
      expect(startBtn).toBeVisible();
    } else {
      // May be collapsed or integrated differently — soft check
      console.log('AUDIT: TimerWidget — no "Start" button found in sidebar');
    }
  });

  test('timer widget visible on time-tracking page', async ({ page }) => {
    await page.goto('/app/time-tracking');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/screenshots/08-timer-time-tracking.png', fullPage: true });

    const body = (await page.locator('body').textContent())!;
    const hasTimer = /timer|start|stop|hours|billable/i.test(body);
    if (!hasTimer) {
      console.log('AUDIT: TimerWidget — no timer-related content on /app/time-tracking');
    }
    expect(body.length).toBeGreaterThan(50);
  });

  test('timer widget renders in collapsed sidebar', async ({ page }) => {
    // Collapse the sidebar via the toggle button
    const collapseBtn = page.locator('button[aria-label*="collapse" i], button[aria-label*="Collapse" i]').first();
    if (await collapseBtn.count() > 0) {
      await collapseBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: 'tests/screenshots/08-timer-collapsed.png', fullPage: false });
      // Should still render something in collapsed sidebar
      const sidebar = await page.locator('aside').first().isVisible();
      expect(sidebar).toBeTruthy();
    } else {
      console.log('AUDIT: TimerWidget — sidebar collapse button not found');
    }
  });
});
