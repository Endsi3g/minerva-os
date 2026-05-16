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

// ─── Sprint 9-10 new modules ──────────────────────────────────────────────────

test('Services — catalog renders with add button', async ({ page }) => {
  await goTo(page, '/app/services');
  await page.screenshot({ path: 'tests/screenshots/03-services.png', fullPage: true });
  await assertRendered(page, 'Services');

  const bodyText = (await page.locator('body').textContent())!;
  const hasService = /service|catalog|package|prix|price/i.test(bodyText);
  if (!hasService) console.log('AUDIT: Services — no service/catalog label found');

  const addBtn = page.locator('button').filter({ hasText: /add service|new service|add|ajouter/i }).first();
  if (await addBtn.count() === 0) console.log('AUDIT: Services — no add service button found');
  else {
    await addBtn.click();
    await page.waitForTimeout(600);
    const sheetVisible = await page.locator('[role="dialog"], [data-state="open"]').count();
    if (sheetVisible === 0) console.log('AUDIT: Services — add button clicked but no modal appeared');
  }
});

test('Proposals — list renders with status badges', async ({ page }) => {
  await goTo(page, '/app/proposals');
  await page.screenshot({ path: 'tests/screenshots/03-proposals.png', fullPage: true });
  await assertRendered(page, 'Proposals');

  const bodyText = (await page.locator('body').textContent())!;
  const hasProposal = /proposal|proposition|draft|brouillon|sent|envoyé/i.test(bodyText);
  if (!hasProposal) console.log('AUDIT: Proposals — no proposal/draft label found');

  const addBtn = page.locator('button').filter({ hasText: /new proposal|add proposal|nouveau|ajouter/i }).first();
  if (await addBtn.count() === 0) console.log('AUDIT: Proposals — no new proposal button found');
  else {
    await addBtn.click();
    await page.waitForTimeout(600);
    const sheetVisible = await page.locator('[role="dialog"], [data-state="open"]').count();
    if (sheetVisible === 0) console.log('AUDIT: Proposals — button clicked but no modal appeared');
  }
});

test('Expenses — KPI chips and list render', async ({ page }) => {
  await goTo(page, '/app/expenses');
  await page.screenshot({ path: 'tests/screenshots/03-expenses.png', fullPage: true });
  await assertRendered(page, 'Expenses');

  const bodyText = (await page.locator('body').textContent())!;
  const hasExpense = /expense|dépense|pending|approved|en attente/i.test(bodyText);
  if (!hasExpense) console.log('AUDIT: Expenses — no expense label found');

  const addBtn = page.locator('button').filter({ hasText: /add expense|new expense|ajouter/i }).first();
  if (await addBtn.count() === 0) console.log('AUDIT: Expenses — no add expense button found');
  else {
    await addBtn.click();
    await page.waitForTimeout(600);
  }
});

test('Knowledge Base — search input and article list render', async ({ page }) => {
  await goTo(page, '/app/knowledge');
  await page.screenshot({ path: 'tests/screenshots/03-knowledge.png', fullPage: true });
  await assertRendered(page, 'KnowledgeBase');

  const bodyText = (await page.locator('body').textContent())!;
  const hasKB = /knowledge|article|base de connaissances|category/i.test(bodyText);
  if (!hasKB) console.log('AUDIT: KnowledgeBase — no knowledge/article label found');

  const searchInput = page.locator('input[type="text"], input[type="search"]').first();
  if (await searchInput.count() === 0) console.log('AUDIT: KnowledgeBase — no search input found');

  const addBtn = page.locator('button').filter({ hasText: /new article|add article|nouvel article|ajouter/i }).first();
  if (await addBtn.count() === 0) console.log('AUDIT: KnowledgeBase — no add article button found');
  else {
    await addBtn.click();
    await page.waitForTimeout(600);
  }
});

test('Tickets — status filter tabs and new ticket button', async ({ page }) => {
  await goTo(page, '/app/tickets');
  await page.screenshot({ path: 'tests/screenshots/03-tickets.png', fullPage: true });
  await assertRendered(page, 'Tickets');

  const bodyText = (await page.locator('body').textContent())!;
  const hasTicket = /ticket|support|open|resolved|in progress|en cours/i.test(bodyText);
  if (!hasTicket) console.log('AUDIT: Tickets — no ticket/status label found');

  const addBtn = page.locator('button').filter({ hasText: /new ticket|add ticket|nouveau ticket|ajouter/i }).first();
  if (await addBtn.count() === 0) console.log('AUDIT: Tickets — no new ticket button found');
  else {
    await addBtn.click();
    await page.waitForTimeout(600);
    const sheetVisible = await page.locator('[role="dialog"], [data-state="open"]').count();
    if (sheetVisible === 0) console.log('AUDIT: Tickets — button clicked but no modal appeared');
  }
});

test('NPS — gauge and KPI cards render', async ({ page }) => {
  await goTo(page, '/app/nps');
  await page.screenshot({ path: 'tests/screenshots/03-nps.png', fullPage: true });
  await assertRendered(page, 'NPS');

  const bodyText = (await page.locator('body').textContent())!;
  const hasNps = /nps|promoter|detractor|passive|score/i.test(bodyText);
  if (!hasNps) console.log('AUDIT: NPS — no NPS/promoter label found');

  const addBtn = page.locator('button').filter({ hasText: /record nps|add response|enregistrer|ajouter/i }).first();
  if (await addBtn.count() === 0) console.log('AUDIT: NPS — no record response button found');
  else {
    await addBtn.click();
    await page.waitForTimeout(600);
  }
});

test('Resource Planning — team capacity table renders', async ({ page }) => {
  await goTo(page, '/app/resources');
  await page.screenshot({ path: 'tests/screenshots/03-resources.png', fullPage: true });
  await assertRendered(page, 'ResourcePlanning');

  const bodyText = (await page.locator('body').textContent())!;
  const hasResource = /resource|capacity|team|member|utilization|planification/i.test(bodyText);
  if (!hasResource) console.log('AUDIT: ResourcePlanning — no resource/capacity label found');

  const addBtn = page.locator('button').filter({ hasText: /add member|new member|ajouter/i }).first();
  if (await addBtn.count() === 0) console.log('AUDIT: ResourcePlanning — no add member button found');
  else {
    await addBtn.click();
    await page.waitForTimeout(600);
  }
});

test('Time Tracking — timesheet and timer widget visible', async ({ page }) => {
  await goTo(page, '/app/time-tracking');
  await page.screenshot({ path: 'tests/screenshots/03-time-tracking.png', fullPage: true });
  await assertRendered(page, 'TimeTracking');

  const bodyText = (await page.locator('body').textContent())!;
  const hasTime = /time|hours|timer|week|timesheet|heure|semaine/i.test(bodyText);
  if (!hasTime) console.log('AUDIT: TimeTracking — no time/hours label found');
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
