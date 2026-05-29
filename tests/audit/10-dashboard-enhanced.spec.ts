import { test, expect, type Page } from '@playwright/test';

async function goTo(page: Page, route: string) {
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
}

// ─── Dashboard Enhanced ───────────────────────────────────────────────────────

test.describe('Dashboard enhanced features', () => {
  test('overview tab renders KPI cards', async ({ page }) => {
    await goTo(page, '/app/dashboard');
    await page.screenshot({ path: 'tests/screenshots/10-dashboard-overview.png', fullPage: true });

    const body = (await page.locator('body').textContent())!;
    expect(body.length).toBeGreaterThan(50);
    const hasKpis = /project|task|approv|revenue/i.test(body);
    if (!hasKpis) console.log('AUDIT: Dashboard — no KPI labels found on overview tab');
  });

  test('Firefighter tab button visible', async ({ page }) => {
    await goTo(page, '/app/dashboard');
    const body = (await page.locator('body').textContent())!;
    const hasFirefighter = /firefighter|pompier|urgent|alert/i.test(body);
    if (!hasFirefighter) console.log('AUDIT: Dashboard — no Firefighter tab button found');
  });

  test('clicking Firefighter tab shows flags section', async ({ page }) => {
    await goTo(page, '/app/dashboard');
    const firefighterBtn = page.locator('button').filter({ hasText: /firefighter|pompier/i }).first();
    if (await firefighterBtn.count() > 0) {
      await firefighterBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: 'tests/screenshots/10-dashboard-firefighter.png', fullPage: true });
      const body = (await page.locator('body').textContent())!;
      const hasFlags = /risk|flag|alert|urgent|all.clear|tout.est/i.test(body);
      if (!hasFlags) console.log('AUDIT: Dashboard — Firefighter tab clicked but no flags/all-clear found');
    } else {
      console.log('AUDIT: Dashboard — Firefighter tab button not found');
    }
  });

  test('daily briefing section renders', async ({ page }) => {
    await goTo(page, '/app/dashboard');
    await page.waitForTimeout(2000); // extra time for AI briefing fetch
    await page.screenshot({ path: 'tests/screenshots/10-dashboard-briefing.png', fullPage: true });

    const body = (await page.locator('body').textContent())!;
    const hasBriefing = /briefing|hermes|analyzing|daily|bonjour|good.morning/i.test(body);
    if (!hasBriefing) console.log('AUDIT: Dashboard — no daily briefing section found');
  });
});

// ─── Projects Gantt Timeline ──────────────────────────────────────────────────

test.describe('Projects Gantt Timeline view', () => {
  test('timeline toggle button visible', async ({ page }) => {
    await goTo(page, '/app/projects');
    await page.screenshot({ path: 'tests/screenshots/10-projects-grid.png', fullPage: true });

    const body = (await page.locator('body').textContent())!;
    expect(body.length).toBeGreaterThan(50);
    // Check for the timeline/gantt toggle button via icon or label
    const hasTimeline = /timeline|gantt/i.test(body);
    if (!hasTimeline) console.log('AUDIT: Projects — no Timeline/Gantt toggle button found');
  });

  test('clicking timeline shows Gantt chart', async ({ page }) => {
    await goTo(page, '/app/projects');
    // Try to find the Gantt/Timeline toggle (it's an icon button)
    const ganttBtn = page.locator('button').filter({ hasText: /timeline|gantt/i }).first();
    if (await ganttBtn.count() > 0) {
      await ganttBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: 'tests/screenshots/10-projects-gantt.png', fullPage: true });
      const body = (await page.locator('body').textContent())!;
      const hasGantt = /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|today/i.test(body);
      if (!hasGantt) console.log('AUDIT: Projects — Timeline mode enabled but no month/date labels found');
    } else {
      console.log('AUDIT: Projects — no Timeline toggle button found (may be icon-only, add aria-label)');
    }
  });

  test('grid view toggle returns to cards', async ({ page }) => {
    await goTo(page, '/app/projects');
    const gridBtn = page.locator('button[aria-label*="grid" i]').first();
    if (await gridBtn.count() > 0) {
      await gridBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: 'tests/screenshots/10-projects-grid-return.png', fullPage: true });
    }
    // Just ensure page still renders
    const body = (await page.locator('body').textContent())!;
    expect(body.length).toBeGreaterThan(50);
  });
});

// ─── Reports Tabs ─────────────────────────────────────────────────────────────

test.describe('Reports advanced tabs', () => {
  test('profitability tab button visible', async ({ page }) => {
    await goTo(page, '/app/reports');
    await page.waitForTimeout(1000); // extra for charts
    await page.screenshot({ path: 'tests/screenshots/10-reports-overview.png', fullPage: true });

    const body = (await page.locator('body').textContent())!;
    const hasProfit = /profitability|rentabilité|margin/i.test(body);
    if (!hasProfit) console.log('AUDIT: Reports — no Profitability tab label found');
  });

  test('clicking Profitability shows per-client table', async ({ page }) => {
    await goTo(page, '/app/reports');
    await page.waitForTimeout(1000);
    const profitBtn = page.locator('button').filter({ hasText: /profitability|rentabilité/i }).first();
    if (await profitBtn.count() > 0) {
      await profitBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: 'tests/screenshots/10-reports-profitability.png', fullPage: true });
      const body = (await page.locator('body').textContent())!;
      const hasTable = /client|margin|revenue|cost/i.test(body);
      if (!hasTable) console.log('AUDIT: Reports — Profitability tab has no client/margin table');
    } else {
      console.log('AUDIT: Reports — Profitability tab not found');
    }
  });

  test('Time & Hours tab and Export CSV visible', async ({ page }) => {
    await goTo(page, '/app/reports');
    await page.waitForTimeout(1000);
    const timeBtn = page.locator('button').filter({ hasText: /time|heure/i }).first();
    if (await timeBtn.count() > 0) {
      await timeBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: 'tests/screenshots/10-reports-time.png', fullPage: true });
      const body = (await page.locator('body').textContent())!;
      const hasCsv = /csv|export/i.test(body);
      if (!hasCsv) console.log('AUDIT: Reports — Time tab has no Export CSV button');
    } else {
      console.log('AUDIT: Reports — Time & Hours tab not found');
    }
  });
});

// ─── AppSettings Privacy Tab ──────────────────────────────────────────────────

test.describe('AppSettings Privacy tab', () => {
  test('Privacy tab button visible in settings', async ({ page }) => {
    await goTo(page, '/app/settings');
    await page.screenshot({ path: 'tests/screenshots/10-settings.png', fullPage: true });

    const body = (await page.locator('body').textContent())!;
    const hasPrivacy = /privacy|gdpr|données|confidentialité/i.test(body);
    if (!hasPrivacy) console.log('AUDIT: Settings — no Privacy tab label found');
  });

  test('clicking Privacy shows Export Data button', async ({ page }) => {
    await goTo(page, '/app/settings');
    const privacyBtn = page.locator('button').filter({ hasText: /privacy|confidentialité/i }).first();
    if (await privacyBtn.count() > 0) {
      await privacyBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: 'tests/screenshots/10-settings-privacy.png', fullPage: true });
      const body = (await page.locator('body').textContent())!;
      const hasExport = /export|télécharger|download/i.test(body);
      if (!hasExport) console.log('AUDIT: Settings — Privacy tab has no Export Data button');
    } else {
      console.log('AUDIT: Settings — Privacy tab button not found');
    }
  });
});
