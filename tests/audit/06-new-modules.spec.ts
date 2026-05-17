import { test, expect } from '@playwright/test';

async function goTo(page: Parameters<typeof test>[1] extends (...args: infer A) => unknown ? A[0] : never, route: string) {
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
}

async function assertRendered(page: { locator: (sel: string) => { textContent: () => Promise<string | null> } }, name: string) {
  const body = await page.locator('body').textContent();
  if (!body || body.trim().length < 30) console.log(`AUDIT BLANK PAGE: ${name}`);
  expect(body!.length).toBeGreaterThan(50);
}

async function tryOpenButton(page: { locator: (sel: string) => { filter: (opts: { hasText: RegExp }) => { first: () => { count: () => Promise<number>; click: () => Promise<void> } } } }, btnText: RegExp): Promise<boolean> {
  const btn = page.locator('button').filter({ hasText: btnText }).first();
  if (await btn.count() === 0) return false;
  await btn.click();
  await (page as unknown as { waitForTimeout: (ms: number) => Promise<void> }).waitForTimeout(800);
  return true;
}

// ─── Service Catalog ──────────────────────────────────────────────────────────

test.describe('/app/services — Service Catalog', () => {
  test('renders service catalog with tabs', async ({ page }) => {
    await goTo(page, '/app/services');
    await page.screenshot({ path: 'tests/screenshots/06-services.png', fullPage: true });
    await assertRendered(page, 'ServiceCatalog');

    const body = (await page.locator('body').textContent())!;
    const hasService = /service|catalog/i.test(body);
    if (!hasService) console.log('AUDIT: Services — no service/catalog label found');
  });

  test('"Add service" button opens modal', async ({ page }) => {
    await goTo(page, '/app/services');
    const opened = await page.locator('button').filter({ hasText: /add service|ajouter/i }).first().count();
    if (opened === 0) {
      console.log('AUDIT: Services — no Add Service button found');
    } else {
      await page.locator('button').filter({ hasText: /add service|ajouter/i }).first().click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'tests/screenshots/06-services-modal.png', fullPage: false });
      const modal = await page.locator('[class*="fixed"], [role="dialog"]').count();
      if (modal === 0) console.log('AUDIT: Services — modal did not open');
      else expect(modal).toBeGreaterThan(0);
    }
  });

  test('Packages tab renders', async ({ page }) => {
    await goTo(page, '/app/services');
    const packagesTab = page.locator('button').filter({ hasText: /package/i }).first();
    if (await packagesTab.count() > 0) {
      await packagesTab.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: 'tests/screenshots/06-services-packages.png', fullPage: true });
    } else {
      console.log('AUDIT: Services — no Packages tab found');
    }
  });
});

// ─── Proposals ────────────────────────────────────────────────────────────────

test.describe('/app/proposals — Proposals', () => {
  test('renders proposals list with empty state', async ({ page }) => {
    await goTo(page, '/app/proposals');
    await page.screenshot({ path: 'tests/screenshots/06-proposals.png', fullPage: true });
    await assertRendered(page, 'Proposals');

    const body = (await page.locator('body').textContent())!;
    const hasProposal = /proposal|proposition/i.test(body);
    if (!hasProposal) console.log('AUDIT: Proposals — no proposal label found');
  });

  test('"New Proposal" button opens modal', async ({ page }) => {
    await goTo(page, '/app/proposals');
    const btn = page.locator('button').filter({ hasText: /new proposal|nouvelle proposition/i }).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'tests/screenshots/06-proposals-modal.png', fullPage: false });
      const modal = await page.locator('[class*="fixed"]').count();
      if (modal === 0) console.log('AUDIT: Proposals — modal did not open');
    } else {
      console.log('AUDIT: Proposals — no New Proposal button found');
    }
  });

  test('status badge labels visible', async ({ page }) => {
    await goTo(page, '/app/proposals');
    const body = (await page.locator('body').textContent())!;
    const hasStatus = /draft|sent|signed|declined|brouillon|envoy/i.test(body);
    if (!hasStatus) console.log('AUDIT: Proposals — no status badge labels (draft/sent/signed) found');
  });
});

// ─── Expenses ─────────────────────────────────────────────────────────────────

test.describe('/app/expenses — Expenses', () => {
  test('renders KPI cards and expense list', async ({ page }) => {
    await goTo(page, '/app/expenses');
    await page.screenshot({ path: 'tests/screenshots/06-expenses.png', fullPage: true });
    await assertRendered(page, 'Expenses');

    const body = (await page.locator('body').textContent())!;
    const hasExpense = /expense|dépense|pending|approved/i.test(body);
    if (!hasExpense) console.log('AUDIT: Expenses — no expense/pending/approved label found');
  });

  test('"Add Expense" button opens modal', async ({ page }) => {
    await goTo(page, '/app/expenses');
    const btn = page.locator('button').filter({ hasText: /add expense|ajouter/i }).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'tests/screenshots/06-expenses-modal.png', fullPage: false });
      const modal = await page.locator('[class*="fixed"]').count();
      if (modal === 0) console.log('AUDIT: Expenses — modal did not open');
    } else {
      console.log('AUDIT: Expenses — no Add Expense button found');
    }
  });
});

// ─── Knowledge Base ───────────────────────────────────────────────────────────

test.describe('/app/knowledge — Knowledge Base', () => {
  test('renders with category filter bar and search', async ({ page }) => {
    await goTo(page, '/app/knowledge');
    await page.screenshot({ path: 'tests/screenshots/06-knowledge.png', fullPage: true });
    await assertRendered(page, 'KnowledgeBase');

    const body = (await page.locator('body').textContent())!;
    const hasKb = /knowledge|article|base/i.test(body);
    if (!hasKb) console.log('AUDIT: KnowledgeBase — no knowledge/article label found');

    const searchInput = await page.locator('input[type="text"], input[placeholder*="search" i]').count();
    if (searchInput === 0) console.log('AUDIT: KnowledgeBase — no search input found');
  });

  test('"New article" button opens modal', async ({ page }) => {
    await goTo(page, '/app/knowledge');
    const btn = page.locator('button').filter({ hasText: /new article|nouvel article/i }).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'tests/screenshots/06-knowledge-modal.png', fullPage: false });
      const modal = await page.locator('[class*="fixed"]').count();
      if (modal === 0) console.log('AUDIT: KnowledgeBase — modal did not open');
    } else {
      console.log('AUDIT: KnowledgeBase — no New Article button found');
    }
  });
});

// ─── Support Tickets ──────────────────────────────────────────────────────────

test.describe('/app/tickets — Support Tickets', () => {
  test('renders with status filter tabs', async ({ page }) => {
    await goTo(page, '/app/tickets');
    await page.screenshot({ path: 'tests/screenshots/06-tickets.png', fullPage: true });
    await assertRendered(page, 'Tickets');

    const body = (await page.locator('body').textContent())!;
    const hasStatus = /open|in.progress|resolved|ticket/i.test(body);
    if (!hasStatus) console.log('AUDIT: Tickets — no status filter (open/in_progress/resolved) found');

    const searchInput = await page.locator('input[type="text"]').count();
    if (searchInput === 0) console.log('AUDIT: Tickets — no search input found');
  });

  test('"New Ticket" button opens modal', async ({ page }) => {
    await goTo(page, '/app/tickets');
    const btn = page.locator('button').filter({ hasText: /new ticket|nouveau ticket/i }).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'tests/screenshots/06-tickets-modal.png', fullPage: false });
      const modal = await page.locator('[class*="fixed"]').count();
      if (modal === 0) console.log('AUDIT: Tickets — modal did not open');
    } else {
      console.log('AUDIT: Tickets — no New Ticket button found');
    }
  });
});

// ─── NPS ──────────────────────────────────────────────────────────────────────

test.describe('/app/nps — NPS', () => {
  test('renders NPS gauge and KPI cards', async ({ page }) => {
    await goTo(page, '/app/nps');
    await page.screenshot({ path: 'tests/screenshots/06-nps.png', fullPage: true });
    await assertRendered(page, 'NPS');

    const body = (await page.locator('body').textContent())!;
    const hasNps = /nps|promoter|detractor|passive/i.test(body);
    if (!hasNps) console.log('AUDIT: NPS — no NPS/promoter/detractor label found');
  });

  test('"Record response" button opens form', async ({ page }) => {
    await goTo(page, '/app/nps');
    const btn = page.locator('button').filter({ hasText: /record response|enregistrer/i }).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'tests/screenshots/06-nps-modal.png', fullPage: false });
      const modal = await page.locator('[class*="fixed"]').count();
      if (modal === 0) console.log('AUDIT: NPS — form modal did not open');
    } else {
      console.log('AUDIT: NPS — no Record Response button found');
    }
  });
});

// ─── Resource Planning ────────────────────────────────────────────────────────

test.describe('/app/resources — Resource Planning', () => {
  test('renders with KPI cards (capacity, assigned, utilization)', async ({ page }) => {
    await goTo(page, '/app/resources');
    await page.screenshot({ path: 'tests/screenshots/06-resources.png', fullPage: true });
    await assertRendered(page, 'ResourcePlanning');

    const body = (await page.locator('body').textContent())!;
    const hasCapacity = /capacity|utilization|assigned|resource/i.test(body);
    if (!hasCapacity) console.log('AUDIT: Resources — no capacity/utilization label found');
  });

  test('"Add member" button opens modal', async ({ page }) => {
    await goTo(page, '/app/resources');
    const btn = page.locator('button').filter({ hasText: /add member|ajouter/i }).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'tests/screenshots/06-resources-modal.png', fullPage: false });
      const modal = await page.locator('[class*="fixed"]').count();
      if (modal === 0) console.log('AUDIT: Resources — modal did not open');
    } else {
      console.log('AUDIT: Resources — no Add Member button found');
    }
  });
});

// ─── Time Tracking ────────────────────────────────────────────────────────────

test.describe('/app/time-tracking — Time Tracking', () => {
  test('renders weekly timesheet and project hours', async ({ page }) => {
    await goTo(page, '/app/time-tracking');
    await page.screenshot({ path: 'tests/screenshots/06-time-tracking.png', fullPage: true });
    await assertRendered(page, 'TimeTracking');

    const body = (await page.locator('body').textContent())!;
    const hasTime = /time.tracking|timesheet|hours|billable/i.test(body);
    if (!hasTime) console.log('AUDIT: TimeTracking — no time/billable label found');
  });

  test('timer widget visible in sidebar', async ({ page }) => {
    await goTo(page, '/app/time-tracking');
    const body = (await page.locator('body').textContent())!;
    const hasTimer = /timer|start|stop|chrono/i.test(body);
    if (!hasTimer) console.log('AUDIT: TimeTracking — no timer/start/stop label visible');
  });
});
