import { test, expect } from '@playwright/test';

async function goTo(page: any, route: string) {
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
}

// Helper: check page renders without blank screen
async function assertRendered(page: any, name: string) {
  const body = await page.locator('body').textContent();
  const isBlank = !body || body.trim().length < 30;
  if (isBlank) console.log(`AUDIT BLANK PAGE: ${name}`);
  expect(body!.length).toBeGreaterThan(50);
}

// Helper: try to open a button by text and check something appeared
async function tryOpenButton(page: any, btnText: RegExp): Promise<boolean> {
  const btn = page.locator(`button`).filter({ hasText: btnText }).first();
  if (await btn.count() === 0) return false;
  await btn.click();
  await page.waitForTimeout(800);
  return true;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

test('Dashboard — KPI cards and layout', async ({ page }) => {
  await goTo(page, '/app/dashboard');
  await page.screenshot({ path: 'tests/screenshots/03-dashboard.png', fullPage: true });
  await assertRendered(page, 'Dashboard');

  // Should have some card-like containers
  const cards = await page.locator('[class*="card"], [class*="Card"]').count();
  if (cards === 0) console.log('AUDIT: Dashboard — no card elements found');

  // Check for KPI-like numbers or labels
  const hasMetrics = (await page.locator('body').textContent())!
    .match(/project|task|approv|revenue|pipeline/i);
  if (!hasMetrics) console.log('AUDIT: Dashboard — no KPI labels found');
});

// ─── Pipeline ─────────────────────────────────────────────────────────────────

test('Pipeline — kanban columns and add deal', async ({ page }) => {
  await goTo(page, '/app/pipeline');
  await page.screenshot({ path: 'tests/screenshots/03-pipeline.png', fullPage: true });
  await assertRendered(page, 'Pipeline');

  // Should have stage column headers
  const bodyText = (await page.locator('body').textContent())!;
  const hasStages = /new.lead|qualified|proposal|negotiation|won|lost/i.test(bodyText);
  if (!hasStages) console.log('AUDIT: Pipeline — no kanban stage labels found');

  // "Add Deal" button
  const opened = await tryOpenButton(page, /add deal|ajouter|nouveau/i);
  if (opened) {
    await page.screenshot({ path: 'tests/screenshots/03-pipeline-sheet.png', fullPage: false });
    // Sheet/dialog should appear
    const sheetVisible = await page.locator('[role="dialog"], [data-state="open"]').count();
    if (sheetVisible === 0) console.log('AUDIT: Pipeline — Add Deal button clicked but no sheet appeared');
  } else {
    console.log('AUDIT: Pipeline — no Add Deal button found');
  }
});

// ─── Clients ──────────────────────────────────────────────────────────────────

test('Clients — list and add client', async ({ page }) => {
  await goTo(page, '/app/clients');
  await page.screenshot({ path: 'tests/screenshots/03-clients.png', fullPage: true });
  await assertRendered(page, 'Clients');

  const bodyText = (await page.locator('body').textContent())!;
  const hasClientLabel = /client/i.test(bodyText);
  if (!hasClientLabel) console.log('AUDIT: Clients — no "client" label found');

  // Search bar
  const searchInput = page.locator('input[type="text"], input[type="search"]').first();
  if (await searchInput.count() === 0) console.log('AUDIT: Clients — no search input found');

  // Add client button
  const opened = await tryOpenButton(page, /add client|nouveau client|ajouter/i);
  if (opened) {
    await page.screenshot({ path: 'tests/screenshots/03-clients-sheet.png', fullPage: false });
  } else {
    console.log('AUDIT: Clients — no Add Client button found');
  }
});

// ─── Projects ─────────────────────────────────────────────────────────────────

test('Projects — list and new project', async ({ page }) => {
  await goTo(page, '/app/projects');
  await page.screenshot({ path: 'tests/screenshots/03-projects.png', fullPage: true });
  await assertRendered(page, 'Projects');

  const opened = await tryOpenButton(page, /new project|nouveau projet/i);
  if (opened) {
    await page.screenshot({ path: 'tests/screenshots/03-projects-sheet.png', fullPage: false });
  } else {
    console.log('AUDIT: Projects — no New Project button found');
  }
});

// ─── Tasks ────────────────────────────────────────────────────────────────────

test('Tasks — list, filters, add task', async ({ page }) => {
  await goTo(page, '/app/tasks');
  await page.screenshot({ path: 'tests/screenshots/03-tasks.png', fullPage: true });
  await assertRendered(page, 'Tasks');

  const bodyText = (await page.locator('body').textContent())!;
  const hasStatusFilter = /todo|in.progress|review|done/i.test(bodyText);
  if (!hasStatusFilter) console.log('AUDIT: Tasks — no status filter labels (todo/in_progress/done) found');

  const hasPriority = /low|medium|high|urgent/i.test(bodyText);
  if (!hasPriority) console.log('AUDIT: Tasks — no priority labels found');

  const opened = await tryOpenButton(page, /add task|nouvelle tache|new task/i);
  if (opened) {
    await page.screenshot({ path: 'tests/screenshots/03-tasks-sheet.png', fullPage: false });
  } else {
    console.log('AUDIT: Tasks — no Add Task button found');
  }
});

// ─── Approvals ────────────────────────────────────────────────────────────────

test('Approvals — renders with status filters', async ({ page }) => {
  await goTo(page, '/app/approvals');
  await page.screenshot({ path: 'tests/screenshots/03-approvals.png', fullPage: true });
  await assertRendered(page, 'Approvals');

  const bodyText = (await page.locator('body').textContent())!;
  const hasStatus = /pending|approved|revision/i.test(bodyText);
  if (!hasStatus) console.log('AUDIT: Approvals — no status labels (pending/approved/revision) found');
});

// ─── Files ────────────────────────────────────────────────────────────────────

test('Files — renders file vault UI', async ({ page }) => {
  await goTo(page, '/app/files');
  await page.screenshot({ path: 'tests/screenshots/03-files.png', fullPage: true });
  await assertRendered(page, 'Files');

  const bodyText = (await page.locator('body').textContent())!;
  const hasUpload = /upload|file|asset|document/i.test(bodyText);
  if (!hasUpload) console.log('AUDIT: Files — no upload/file/asset label found');
});

// ─── Billing ──────────────────────────────────────────────────────────────────

test('Billing — invoices, retainers, new invoice button', async ({ page }) => {
  await goTo(page, '/app/billing');
  await page.screenshot({ path: 'tests/screenshots/03-billing.png', fullPage: true });
  await assertRendered(page, 'Billing');

  const bodyText = (await page.locator('body').textContent())!;
  const hasInvoice = /invoice|facture/i.test(bodyText);
  if (!hasInvoice) console.log('AUDIT: Billing — no invoice label found');
  const hasRetainer = /retainer|retainer/i.test(bodyText);
  if (!hasRetainer) console.log('AUDIT: Billing — no retainer section found');

  const opened = await tryOpenButton(page, /new invoice|nouvelle facture/i);
  if (opened) {
    await page.screenshot({ path: 'tests/screenshots/03-billing-modal.png', fullPage: false });
  } else {
    console.log('AUDIT: Billing — no New Invoice button found');
  }
});

// ─── Finance ──────────────────────────────────────────────────────────────────

test('Finance — income/expense tabs and add transaction', async ({ page }) => {
  await goTo(page, '/app/finance');
  await page.screenshot({ path: 'tests/screenshots/03-finance.png', fullPage: true });
  await assertRendered(page, 'Finance');

  const bodyText = (await page.locator('body').textContent())!;
  const hasTabs = /income|expense|dépense|revenu/i.test(bodyText);
  if (!hasTabs) console.log('AUDIT: Finance — no income/expense tab labels found');

  const opened = await tryOpenButton(page, /new transaction|nouvelle|add/i);
  if (opened) {
    await page.screenshot({ path: 'tests/screenshots/03-finance-sheet.png', fullPage: false });
  } else {
    console.log('AUDIT: Finance — no New Transaction button found');
  }
});

// ─── Reports ──────────────────────────────────────────────────────────────────

test('Reports — charts and metrics render', async ({ page }) => {
  await goTo(page, '/app/reports');
  await page.waitForTimeout(2000); // extra time for chart renders
  await page.screenshot({ path: 'tests/screenshots/03-reports.png', fullPage: true });
  await assertRendered(page, 'Reports');

  // recharts renders SVGs
  const svgCount = await page.locator('svg').count();
  if (svgCount === 0) console.log('AUDIT: Reports — no SVG charts found (recharts not rendering)');
  else console.log(`INFO: Reports — ${svgCount} SVG elements found`);
});

// ─── Settings ─────────────────────────────────────────────────────────────────

test('Settings — 5 tabs render and switch', async ({ page }) => {
  await goTo(page, '/app/settings');
  await page.screenshot({ path: 'tests/screenshots/03-settings.png', fullPage: true });
  await assertRendered(page, 'Settings');

  const bodyText = (await page.locator('body').textContent())!;
  const tabs = ['profile', 'workspace', 'team', 'notification', 'security'];
  for (const tab of tabs) {
    if (!new RegExp(tab, 'i').test(bodyText)) {
      console.log(`AUDIT: Settings — tab "${tab}" label not found`);
    }
  }

  // Try clicking each tab
  for (const tab of ['Workspace', 'Team', 'Security']) {
    const tabBtn = page.locator('button, [role="tab"]').filter({ hasText: new RegExp(tab, 'i') }).first();
    if (await tabBtn.count() > 0) {
      await tabBtn.click();
      await page.waitForTimeout(300);
    }
  }
  await page.screenshot({ path: 'tests/screenshots/03-settings-security.png', fullPage: true });
});

// ─── Agent Ops ────────────────────────────────────────────────────────────────

test('Agent Ops — renders agent interface', async ({ page }) => {
  await goTo(page, '/app/agent-ops');
  await page.screenshot({ path: 'tests/screenshots/03-agent-ops.png', fullPage: true });
  await assertRendered(page, 'AgentOps');

  const bodyText = (await page.locator('body').textContent())!;
  const hasAgent = /agent|minerva|ai|chat/i.test(bodyText);
  if (!hasAgent) console.log('AUDIT: AgentOps — no agent/AI label found');
});

// ─── Call Preps ───────────────────────────────────────────────────────────────

test('Call Preps — renders call list', async ({ page }) => {
  await goTo(page, '/app/call-preps');
  await page.screenshot({ path: 'tests/screenshots/03-call-preps.png', fullPage: true });
  await assertRendered(page, 'CallPreps');

  const bodyText = (await page.locator('body').textContent())!;
  const hasCall = /call|meeting|prep|appel|réunion/i.test(bodyText);
  if (!hasCall) console.log('AUDIT: CallPreps — no call/meeting label found');
});

// ─── Fulfillment ──────────────────────────────────────────────────────────────

test('Fulfillment — renders delivery tracking', async ({ page }) => {
  await goTo(page, '/app/fulfillment');
  await page.screenshot({ path: 'tests/screenshots/03-fulfillment.png', fullPage: true });
  await assertRendered(page, 'Fulfillment');

  const bodyText = (await page.locator('body').textContent())!;
  const hasFulfillment = /fulfillment|delivery|project|livraison/i.test(bodyText);
  if (!hasFulfillment) console.log('AUDIT: Fulfillment — no fulfillment/delivery label found');
});

// ─── /app redirect ────────────────────────────────────────────────────────────

test('/app root — redirects to dashboard', async ({ page }) => {
  await page.goto('/app');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  const url = page.url();
  if (!url.includes('/app/dashboard')) {
    console.log(`AUDIT: /app should redirect to /app/dashboard but went to ${url}`);
  }
});
