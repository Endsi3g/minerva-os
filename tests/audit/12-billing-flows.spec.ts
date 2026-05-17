import { test, expect } from '@playwright/test';

async function goTo(page: any, route: string) {
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
}

async function assertRendered(page: any, name: string) {
  const body = await page.locator('body').textContent();
  const isBlank = !body || body.trim().length < 30;
  if (isBlank) console.log(`AUDIT BLANK PAGE: ${name}`);
  expect(body!.length).toBeGreaterThan(50);
}

async function tryOpenButton(page: any, btnText: RegExp): Promise<boolean> {
  const btn = page.locator('button').filter({ hasText: btnText }).first();
  if (await btn.count() === 0) return false;
  await btn.click();
  await page.waitForTimeout(800);
  return true;
}

// ─── Billing KPI Cards ────────────────────────────────────────────────────────

test('Billing — KPI cards Outstanding, Overdue, Collected visible', async ({ page }) => {
  await goTo(page, '/app/billing');
  await page.screenshot({ path: 'tests/screenshots/12-billing-kpi.png', fullPage: true });
  await assertRendered(page, 'Billing KPIs');

  const bodyText = (await page.locator('body').textContent())!;

  const hasKpiLabels = /outstanding|overdue|collected|paid|impayé|en retard/i.test(bodyText);
  if (!hasKpiLabels) {
    console.log('AUDIT: Billing — no KPI labels found (outstanding, overdue, collected, paid)');
  } else {
    console.log('INFO: Billing — KPI label(s) found');
  }

  const hasCurrencyValue = /\$\s*[\d,]+|[\d,]+\s*\$/.test(bodyText);
  if (!hasCurrencyValue) {
    console.log('AUDIT: Billing — no monetary value with "$" symbol found on page');
  } else {
    console.log('INFO: Billing — monetary value with "$" found');
  }
});

// ─── Export PDF Button ────────────────────────────────────────────────────────

test('Billing — Export PDF button visible on invoice detail', async ({ page }) => {
  await goTo(page, '/app/billing');
  await page.screenshot({ path: 'tests/screenshots/12-billing-list.png', fullPage: true });
  await assertRendered(page, 'Billing Invoice List');

  // Try clicking an invoice row/card
  const invoiceRow = page.locator('[class*="card"], [class*="row"], tr, li, [class*="invoice"]').first();
  if (await invoiceRow.count() === 0) {
    console.log('AUDIT: Billing — no invoice rows/cards found to click into');
    return;
  }

  await invoiceRow.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tests/screenshots/12-billing-invoice-detail.png', fullPage: false });

  const bodyText = (await page.locator('body').textContent())!;
  const hasPdfOption = /pdf|download|export|télécharger/i.test(bodyText);
  if (!hasPdfOption) {
    // Also check for a PDF/download button specifically
    const pdfBtn = page.locator('button, a').filter({ hasText: /pdf|download|export|télécharger/i }).first();
    if (await pdfBtn.count() === 0) {
      console.log('AUDIT: Billing — no PDF, Download, or Export button found on invoice detail');
    } else {
      console.log('INFO: Billing — PDF/export button element found');
    }
  } else {
    console.log('INFO: Billing — PDF/export text found in invoice detail view');
  }
});

// ─── Payment Link Button ───────────────────────────────────────────────────────

test('Billing — Payment Link button visible on pending invoice', async ({ page }) => {
  await goTo(page, '/app/billing');
  await assertRendered(page, 'Billing Payment Link');

  // Find a pending/unpaid invoice
  const pendingInvoice = page.locator('[class*="card"], [class*="row"], tr, li').filter({ hasText: /pending|unpaid|sent|impayé|envoyé/i }).first();
  if (await pendingInvoice.count() === 0) {
    console.log('AUDIT: Billing — no pending or unpaid invoice found to check payment link');
    return;
  }

  await pendingInvoice.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tests/screenshots/12-billing-pending-detail.png', fullPage: false });

  const bodyText = (await page.locator('body').textContent())!;
  const hasPaymentLink = /payment link|pay now|open payment|lien de paiement/i.test(bodyText);
  if (!hasPaymentLink) {
    const payBtn = page.locator('button, a').filter({ hasText: /payment link|pay now|open payment|lien de paiement/i }).first();
    if (await payBtn.count() === 0) {
      console.log('AUDIT: Billing — no "Payment Link", "Pay Now", or "Open Payment" button found on pending invoice');
    } else {
      console.log('INFO: Billing — payment link button element found on pending invoice');
    }
  } else {
    console.log('INFO: Billing — payment link text found on pending invoice detail');
  }
});

// ─── Retainers Section ────────────────────────────────────────────────────────

test('Billing — Retainers section visible', async ({ page }) => {
  await goTo(page, '/app/billing');
  await page.screenshot({ path: 'tests/screenshots/12-billing-retainers.png', fullPage: true });
  await assertRendered(page, 'Billing Retainers');

  const bodyText = (await page.locator('body').textContent())!;
  const hasRetainer = /retainer|abonnement|recurring/i.test(bodyText);
  if (!hasRetainer) {
    console.log('AUDIT: Billing — no "Retainer", "Abonnement", or "Recurring" section found');
  } else {
    console.log('INFO: Billing — retainer/recurring section text found');
  }
});

// ─── Invoice Status Filter Tabs ───────────────────────────────────────────────

test('Billing — Invoice status filter tabs render', async ({ page }) => {
  await goTo(page, '/app/billing');
  await page.screenshot({ path: 'tests/screenshots/12-billing-filters.png', fullPage: true });
  await assertRendered(page, 'Billing Filter Tabs');

  // Look for filter tabs/buttons
  const filterButtons = page.locator('button, [role="tab"], a').filter({ hasText: /all|draft|sent|paid|overdue|tous|brouillon|envoyé|payé/i });
  const filterCount = await filterButtons.count();

  if (filterCount < 3) {
    console.log(`AUDIT: Billing — expected at least 3 filter tab options, found ${filterCount}`);
  } else {
    console.log(`INFO: Billing — ${filterCount} filter tab options found`);
  }

  // Log which filter labels were found
  const bodyText = (await page.locator('body').textContent())!;
  const foundFilters: string[] = [];
  if (/\ball\b|tous/i.test(bodyText)) foundFilters.push('all');
  if (/draft|brouillon/i.test(bodyText)) foundFilters.push('draft');
  if (/sent|envoyé/i.test(bodyText)) foundFilters.push('sent');
  if (/paid|payé/i.test(bodyText)) foundFilters.push('paid');
  if (/overdue|en retard/i.test(bodyText)) foundFilters.push('overdue');
  if (foundFilters.length === 0) {
    console.log('AUDIT: Billing — no filter label text found in body (all, draft, sent, paid, overdue)');
  } else {
    console.log(`INFO: Billing — filter labels present: ${foundFilters.join(', ')}`);
  }
});

// ─── Finance / Expenses Page ───────────────────────────────────────────────────

test('Finance — Expenses page renders with KPI chips', async ({ page }) => {
  // Try /app/expenses first
  await goTo(page, '/app/expenses');
  let bodyText = (await page.locator('body').textContent())!;
  const hasExpenseContent = /expense|dépense|\$/.test(bodyText);

  if (!hasExpenseContent) {
    // Fall back: look for an expenses link within the billing page
    await goTo(page, '/app/billing');
    const expensesLink = page.locator('a, button').filter({ hasText: /expense|dépense/i }).first();
    if (await expensesLink.count() > 0) {
      await expensesLink.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('AUDIT: Finance — /app/expenses did not render expense content and no expenses link found in billing');
      await page.screenshot({ path: 'tests/screenshots/12-expenses.png', fullPage: true });
      return;
    }
  }

  await page.screenshot({ path: 'tests/screenshots/12-expenses.png', fullPage: true });
  await assertRendered(page, 'Expenses');

  bodyText = (await page.locator('body').textContent())!;
  const hasExpense = /expense|dépense/i.test(bodyText);
  if (!hasExpense) {
    console.log('AUDIT: Finance — no "expense" or "dépense" text found on expenses page');
  } else {
    console.log('INFO: Finance — expense label found on page');
  }

  const hasAmount = /\$\s*[\d,]+|[\d,]+\s*\$/.test(bodyText);
  if (!hasAmount) {
    console.log('AUDIT: Finance — no monetary amount values found on expenses page');
  } else {
    console.log('INFO: Finance — monetary amount values found on expenses page');
  }

  // Check for KPI chip/card elements
  const kpiChips = await page.locator('[class*="chip"], [class*="badge"], [class*="card"], [class*="kpi"]').count();
  if (kpiChips === 0) {
    console.log('AUDIT: Finance — no KPI chip/card elements found on expenses page');
  } else {
    console.log(`INFO: Finance — ${kpiChips} KPI chip/card element(s) found`);
  }
});
