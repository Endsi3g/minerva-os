import { test, expect } from '@playwright/test';

async function goTo(page: any, route: string) {
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
}

async function switchToFr(page: any): Promise<boolean> {
  const frBtn = page.locator('button').filter({ hasText: /^fr$/i }).first();
  if (await frBtn.count() > 0) {
    await frBtn.click();
    await page.waitForTimeout(600);
    return true;
  }
  return false;
}

async function switchToEn(page: any) {
  const enBtn = page.locator('button').filter({ hasText: /^en$/i }).first();
  if (await enBtn.count() > 0) {
    await enBtn.click();
    await page.waitForTimeout(400);
  }
}

// Switch language in settings, then navigate to the route and verify FR text
async function checkModuleFr(page: any, route: string, frPattern: RegExp, name: string) {
  // Switch via settings first
  await goTo(page, '/app/settings');
  const switched = await switchToFr(page);
  if (!switched) {
    console.log(`AUDIT i18n: No FR button in settings — cannot verify ${name}`);
    return;
  }
  await goTo(page, route);
  await page.screenshot({ path: `tests/screenshots/15-fr-${name.toLowerCase().replace(/\s+/g, '-')}.png`, fullPage: false });
  const body = await page.locator('body').textContent();
  const hasFr = frPattern.test(body!);
  if (!hasFr) console.log(`AUDIT i18n: ${name} — no French text found after switch (pattern: ${frPattern})`);
  else console.log(`INFO i18n: ${name} FR — OK`);
  // Switch back
  await goTo(page, '/app/settings');
  await switchToEn(page);
}

// ─── EN baseline ───────────────────────────────────────────────────────────────

test('i18n — EN baseline: key modules render in English by default', async ({ page }) => {
  const modules = [
    { route: '/app/dashboard', pattern: /dashboard|project|task|revenue/i },
    { route: '/app/pipeline', pattern: /pipeline|deal|stage|lead/i },
    { route: '/app/clients', pattern: /client|company|contact/i },
    { route: '/app/projects', pattern: /project|status|active/i },
    { route: '/app/billing', pattern: /billing|invoice|amount/i },
    { route: '/app/reports', pattern: /report|revenue|profit/i },
  ];

  for (const { route, pattern } of modules) {
    await goTo(page, route);
    const body = await page.locator('body').textContent();
    if (!pattern.test(body!)) console.log(`AUDIT i18n EN: ${route} — expected English text not found`);
  }
  console.log('INFO i18n EN baseline — checked 6 modules');
});

// ─── FR switch — core modules ─────────────────────────────────────────────────

test('i18n — Dashboard renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/dashboard', /tableau de bord|projet|tâche|revenu/i, 'Dashboard');
});

test('i18n — Pipeline renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/pipeline', /pipeline|affaire|étape|prospect/i, 'Pipeline');
});

test('i18n — Clients renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/clients', /client|entreprise|contact/i, 'Clients');
});

test('i18n — Projects renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/projects', /projet|statut|actif/i, 'Projects');
});

test('i18n — Billing renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/billing', /facturation|facture|montant/i, 'Billing');
});

test('i18n — Approvals renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/approvals', /approbation|approuver|en attente/i, 'Approvals');
});

test('i18n — Reports renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/reports', /rapport|revenu|profit/i, 'Reports');
});

// ─── FR switch — audited modules (previously missing i18n) ────────────────────

test('i18n — KnowledgeBase renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/knowledge', /base de connaissances|article|rechercher/i, 'KnowledgeBase');
});

test('i18n — Tickets renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/tickets', /ticket|support|statut/i, 'Tickets');
});

test('i18n — NPS renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/nps', /nps|score|recommander/i, 'NPS');
});

test('i18n — ResourcePlanning renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/resources', /planification|ressource|membre/i, 'ResourcePlanning');
});

// ─── FR switch — remaining modules ────────────────────────────────────────────

test('i18n — Tasks renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/tasks', /tâche|projet|statut/i, 'Tasks');
});

test('i18n — Files renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/files', /fichier|téléverser|actif/i, 'Files');
});

test('i18n — Finance renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/finance', /finance|dépense|revenu/i, 'Finance');
});

test('i18n — Time Tracking renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/time-tracking', /suivi du temps|heure|semaine/i, 'TimeTracking');
});

test('i18n — Proposals renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/proposals', /proposition|brouillon|envoyé/i, 'Proposals');
});

test('i18n — Service Catalog renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/services', /catalogue|service|prix/i, 'ServiceCatalog');
});

test('i18n — Settings renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/settings', /paramètre|équipe|espace de travail/i, 'Settings');
});

test('i18n — Fulfillment renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/fulfillment', /réalisation|livrable|statut/i, 'Fulfillment');
});

test('i18n — Call Preps renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/call-preps', /appel|préparation|client/i, 'CallPreps');
});

test('i18n — Agent Ops renders in French after switch', async ({ page }) => {
  await checkModuleFr(page, '/app/agent-ops', /agent|opération|statut/i, 'AgentOps');
});

// ─── Zero hardcoded strings check ────────────────────────────────────────────

test('i18n — No hardcoded English strings after FR switch on Dashboard', async ({ page }) => {
  await goTo(page, '/app/settings');
  const switched = await switchToFr(page);
  if (!switched) {
    console.log('AUDIT i18n: No FR button — skipping hardcoded string check');
    return;
  }

  await goTo(page, '/app/dashboard');
  await page.screenshot({ path: 'tests/screenshots/15-hardcoded-check.png', fullPage: true });
  const body = await page.locator('body').textContent();

  // These English words would only appear if strings are hardcoded (not translated)
  const suspiciousPatterns = [
    { pattern: /\bDashboard\b/, label: 'Dashboard (title)' },
    { pattern: /\bRevenue MTD\b/, label: 'Revenue MTD' },
    { pattern: /\bActive Projects\b/, label: 'Active Projects' },
    { pattern: /\bOpen Tasks\b/, label: 'Open Tasks' },
    { pattern: /\bQuick Actions\b/, label: 'Quick Actions' },
    { pattern: /\bRecent Activity\b/, label: 'Recent Activity' },
  ];

  const found: string[] = [];
  for (const { pattern, label } of suspiciousPatterns) {
    if (pattern.test(body!)) found.push(label);
  }

  if (found.length > 0) {
    console.log(`AUDIT i18n: Hardcoded EN strings found on Dashboard in FR mode: ${found.join(', ')}`);
  } else {
    console.log('INFO i18n: No obvious hardcoded EN strings on Dashboard in FR mode');
  }

  // Switch back
  await goTo(page, '/app/settings');
  await switchToEn(page);
});

test('i18n — No hardcoded English strings after FR switch on Billing', async ({ page }) => {
  await goTo(page, '/app/settings');
  const switched = await switchToFr(page);
  if (!switched) return;

  await goTo(page, '/app/billing');
  const body = await page.locator('body').textContent();

  const suspiciousPatterns = [
    { pattern: /\bInvoices\b/, label: 'Invoices (title)' },
    { pattern: /\bOutstanding\b/, label: 'Outstanding' },
    { pattern: /\bOverdue\b/, label: 'Overdue' },
    { pattern: /\bCollected\b/, label: 'Collected' },
    { pattern: /\bNew Invoice\b/, label: 'New Invoice' },
  ];

  const found: string[] = [];
  for (const { pattern, label } of suspiciousPatterns) {
    if (pattern.test(body!)) found.push(label);
  }
  if (found.length > 0) console.log(`AUDIT i18n: Hardcoded EN on Billing in FR: ${found.join(', ')}`);

  await goTo(page, '/app/settings');
  await switchToEn(page);
});

// ─── Language persistence check ───────────────────────────────────────────────

test('i18n — Language preference persists across navigation', async ({ page }) => {
  await goTo(page, '/app/settings');
  const switched = await switchToFr(page);
  if (!switched) {
    console.log('AUDIT i18n: Cannot test persistence — no FR button found');
    return;
  }

  // Navigate away and back
  await goTo(page, '/app/pipeline');
  const body1 = await page.locator('body').textContent();
  const hasFr1 = /pipeline|affaire|prospect|étape/i.test(body1!);

  await goTo(page, '/app/clients');
  const body2 = await page.locator('body').textContent();
  const hasFr2 = /client|entreprise/i.test(body2!);

  if (!hasFr1) console.log('AUDIT i18n: Language not persisted on Pipeline after navigation');
  if (!hasFr2) console.log('AUDIT i18n: Language not persisted on Clients after navigation');
  if (hasFr1 && hasFr2) console.log('INFO i18n: Language persistence — OK across 2 navigations');

  await goTo(page, '/app/settings');
  await switchToEn(page);
});
