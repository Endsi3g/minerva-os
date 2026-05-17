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

// ─── Portal Shell ─────────────────────────────────────────────────────────────

test('Portal — shell loads with tabs', async ({ page }) => {
  await goTo(page, '/portal/test-token');
  await page.screenshot({ path: 'tests/screenshots/14-portal-shell.png', fullPage: true });
  await assertRendered(page, 'Portal Shell');

  const bodyText = (await page.locator('body').textContent())!;
  const hasTabs = /files|invoice|approval|facture|approbation/i.test(bodyText);
  if (!hasTabs) console.log('AUDIT: Portal — no tab labels (files/invoices/approvals) found');

  // Check for tab elements
  const tabElements = await page.locator('[role="tab"], [role="tablist"]').count();
  if (tabElements === 0) console.log('AUDIT: Portal — no [role="tab"] or [role="tablist"] elements found');
});

// ─── Portal — Invalid Token ───────────────────────────────────────────────────

test('Portal — invalid token shows not-found state', async ({ page }) => {
  await goTo(page, '/portal/this-token-does-not-exist-xyz-000');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'tests/screenshots/14-portal-404.png', fullPage: true });

  const bodyText = (await page.locator('body').textContent())!;
  const hasNotFound = /not found|invalid|expired|introuvable|expiré|lien invalide/i.test(bodyText);
  if (!hasNotFound) console.log('AUDIT: Portal — invalid token page shows no not-found/invalid/expired message');

  // Verify it does NOT look like a full dashboard (no tabs or KPI cards)
  const hasFullDashboard = /files.*invoice.*approval|facture.*approbation/i.test(bodyText);
  if (hasFullDashboard) console.log('AUDIT: Portal — invalid token page appears to show a full dashboard layout (expected error state)');
});

// ─── Portal — Files Tab ───────────────────────────────────────────────────────

test('Portal — Files tab renders file list or empty state', async ({ page }) => {
  await goTo(page, '/portal/test-token');

  const filesTab = page.locator('button, [role="tab"], a').filter({ hasText: /^files$|^fichiers$/i }).first();
  if (await filesTab.count() > 0) {
    await filesTab.click();
    await page.waitForTimeout(500);
  } else {
    console.log('AUDIT: Portal Files — no Files/Fichiers tab found');
  }

  await page.screenshot({ path: 'tests/screenshots/14-portal-files.png', fullPage: true });

  const bodyText = (await page.locator('body').textContent())!;
  const hasFileContent = /file|upload|no files|aucun fichier|document/i.test(bodyText);
  if (!hasFileContent) console.log('AUDIT: Portal Files — no file list or empty state text found');
});

// ─── Portal — Invoices Tab ────────────────────────────────────────────────────

test('Portal — Invoices tab shows invoice list or empty state', async ({ page }) => {
  await goTo(page, '/portal/test-token');

  const invoicesTab = page.locator('button, [role="tab"], a').filter({ hasText: /invoice|facture/i }).first();
  if (await invoicesTab.count() > 0) {
    await invoicesTab.click();
    await page.waitForTimeout(500);
  } else {
    console.log('AUDIT: Portal Invoices — no Invoices/Factures tab found');
  }

  await page.screenshot({ path: 'tests/screenshots/14-portal-invoices.png', fullPage: true });

  const bodyText = (await page.locator('body').textContent())!;
  const hasInvoiceContent = /invoice|facture|amount|montant|status|statut/i.test(bodyText);
  if (!hasInvoiceContent) console.log('AUDIT: Portal Invoices — no invoice/facture/amount/status text found');
});

// ─── Portal Proposal ─────────────────────────────────────────────────────────

test('Portal Proposal — proposal signing page renders', async ({ page }) => {
  // Try primary route first
  await goTo(page, '/portal/test-token/proposal');
  let bodyText = (await page.locator('body').textContent())!;
  const isBlank = !bodyText || bodyText.trim().length < 50;

  if (isBlank) {
    console.log('AUDIT: Portal Proposal — /portal/test-token/proposal appears blank, trying /portal/proposal/test-token');
    await goTo(page, '/portal/proposal/test-token');
    bodyText = (await page.locator('body').textContent())!;
  }

  await page.screenshot({ path: 'tests/screenshots/14-portal-proposal.png', fullPage: true });
  await assertRendered(page, 'Portal Proposal');

  const hasProposalContent = /proposal|sign|accept|proposition|signer|accepter/i.test(bodyText);
  if (!hasProposalContent) console.log('AUDIT: Portal Proposal — no proposal/sign/accept text found');
});

// ─── Portal NPS ───────────────────────────────────────────────────────────────

test('Portal NPS — NPS form visible in portal', async ({ page }) => {
  await goTo(page, '/portal/test-token');

  const bodyText = (await page.locator('body').textContent())!;
  const hasNPS = /nps|score|recommend|satisfaction/i.test(bodyText);
  if (!hasNPS) console.log('AUDIT: Portal NPS — no NPS/score/recommend/satisfaction text found');

  // Check for a score selector (radio buttons, number inputs, or range)
  const scoreSelector = await page.locator('input[type="radio"], input[type="range"], input[type="number"], [class*="nps"], [class*="NPS"], [data-testid*="nps"]').count();
  if (scoreSelector === 0) console.log('AUDIT: Portal NPS — no NPS score selector input element found');
});

// ─── Portal Approvals ─────────────────────────────────────────────────────────

test('Portal Approvals — approval items render', async ({ page }) => {
  await goTo(page, '/portal/test-token');

  const approvalsTab = page.locator('button, [role="tab"], a').filter({ hasText: /approval|approbation/i }).first();
  if (await approvalsTab.count() > 0) {
    await approvalsTab.click();
    await page.waitForTimeout(500);
  } else {
    console.log('AUDIT: Portal Approvals — no Approvals/Approbation tab found');
  }

  const bodyText = (await page.locator('body').textContent())!;
  const hasApprovalContent = /approval|approbation|approve|approuver|pending|en attente/i.test(bodyText);
  if (!hasApprovalContent) console.log('AUDIT: Portal Approvals — no approval/approbation/pending text found');
});
