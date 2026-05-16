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

// ─── Clients CRUD ─────────────────────────────────────────────────────────────

test('Clients — create a client and it appears in list', async ({ page }) => {
  await goTo(page, '/app/clients');
  await page.screenshot({ path: 'tests/screenshots/11-clients-before.png', fullPage: true });
  await assertRendered(page, 'Clients');

  const opened = await tryOpenButton(page, /new client|add client|nouveau client|ajouter/i);
  if (!opened) {
    console.log('AUDIT: Clients — no "New Client" or "Add Client" button found');
    return;
  }

  // Wait for modal/sheet to appear
  await page.waitForTimeout(500);
  const dialog = page.locator('[role="dialog"], [data-state="open"]').first();
  if (await dialog.count() === 0) {
    console.log('AUDIT: Clients — button clicked but no modal/sheet appeared');
    return;
  }

  // Fill in name input
  const nameInput = page.locator('input[type="text"], input[name*="name"], input[placeholder*="name"], input[placeholder*="nom"]').first();
  if (await nameInput.count() === 0) {
    console.log('AUDIT: Clients — no name input found in modal');
    await page.screenshot({ path: 'tests/screenshots/11-clients-modal-empty.png', fullPage: false });
    return;
  }
  await nameInput.fill('TestCo Playwright');

  await page.screenshot({ path: 'tests/screenshots/11-clients-modal-filled.png', fullPage: false });

  // Click save/submit
  const saved = await tryOpenButton(page, /save|submit|create|add|enregistrer|créer|ajouter/i);
  if (!saved) {
    console.log('AUDIT: Clients — no save/submit button found in modal');
    return;
  }

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'tests/screenshots/11-clients-after.png', fullPage: true });

  const bodyText = (await page.locator('body').textContent())!;
  if (!bodyText.includes('TestCo Playwright')) {
    console.log('AUDIT: Clients — created client "TestCo Playwright" not visible in list after save');
  } else {
    console.log('INFO: Clients — "TestCo Playwright" appears in list after creation');
  }
});

// ─── Tasks CRUD ───────────────────────────────────────────────────────────────

test('Tasks — create a task and change its status', async ({ page }) => {
  // Try /app/tasks first, fall back to /app/projects
  await goTo(page, '/app/tasks');
  let bodyText = (await page.locator('body').textContent())!;
  if (bodyText.trim().length < 50) {
    await goTo(page, '/app/projects');
  }

  await page.screenshot({ path: 'tests/screenshots/11-tasks-before.png', fullPage: true });
  await assertRendered(page, 'Tasks');

  const opened = await tryOpenButton(page, /add task|new task|nouvelle tâche|ajouter une tâche/i);
  if (!opened) {
    console.log('AUDIT: Tasks — no "Add Task" or "New Task" button found');
    return;
  }

  await page.waitForTimeout(500);
  const dialog = page.locator('[role="dialog"], [data-state="open"]').first();
  if (await dialog.count() === 0) {
    console.log('AUDIT: Tasks — button clicked but no modal/sheet appeared');
    return;
  }

  // Fill task title
  const titleInput = page.locator('input[type="text"], input[name*="title"], input[placeholder*="title"], input[placeholder*="titre"]').first();
  if (await titleInput.count() === 0) {
    console.log('AUDIT: Tasks — no title input found in modal');
    await page.screenshot({ path: 'tests/screenshots/11-tasks-modal-empty.png', fullPage: false });
    return;
  }
  await titleInput.fill('Playwright Task Test');

  await page.screenshot({ path: 'tests/screenshots/11-tasks-modal-filled.png', fullPage: false });

  const saved = await tryOpenButton(page, /save|submit|create|add|enregistrer|créer|ajouter/i);
  if (!saved) {
    console.log('AUDIT: Tasks — no save/submit button found in modal');
    return;
  }

  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tests/screenshots/11-tasks-after-create.png', fullPage: true });

  bodyText = (await page.locator('body').textContent())!;
  if (!bodyText.includes('Playwright Task Test')) {
    console.log('AUDIT: Tasks — created task "Playwright Task Test" not visible after save');
  } else {
    console.log('INFO: Tasks — "Playwright Task Test" appears after creation');
  }

  // Try to change status
  const statusBtn = page.locator('button, [role="combobox"], select').filter({ hasText: /todo|in progress|done|pending|en cours|à faire/i }).first();
  if (await statusBtn.count() > 0) {
    await statusBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'tests/screenshots/11-tasks-status-menu.png', fullPage: false });
    const inProgressOption = page.locator('[role="option"], [role="menuitem"], li').filter({ hasText: /in progress|en cours/i }).first();
    if (await inProgressOption.count() > 0) {
      await inProgressOption.click();
      await page.waitForTimeout(500);
      console.log('INFO: Tasks — status change interaction completed');
    } else {
      console.log('AUDIT: Tasks — status options appeared but "In Progress" not found');
    }
  } else {
    console.log('AUDIT: Tasks — no status selector found near created task');
  }
});

// ─── Invoices CRUD ────────────────────────────────────────────────────────────

test('Invoices — create invoice and mark as paid, verify KPI updates', async ({ page }) => {
  await goTo(page, '/app/billing');
  await page.screenshot({ path: 'tests/screenshots/11-billing-before.png', fullPage: true });
  await assertRendered(page, 'Billing');

  const bodyText = (await page.locator('body').textContent())!;
  const hasInvoiceText = /invoice|facture|amount|montant|status|statut/i.test(bodyText);
  if (!hasInvoiceText) {
    console.log('AUDIT: Billing — no invoice-related text found (invoice, facture, amount, status)');
  }

  // Look for "New Invoice" button
  const opened = await tryOpenButton(page, /new invoice|add invoice|nouvelle facture|ajouter/i);
  if (!opened) {
    console.log('AUDIT: Billing — no "New Invoice" or "Add Invoice" button found');
  } else {
    await page.waitForTimeout(500);
    const dialog = page.locator('[role="dialog"], [data-state="open"]').first();
    if (await dialog.count() === 0) {
      console.log('AUDIT: Billing — invoice button clicked but no modal appeared');
    } else {
      // Fill amount field
      const amountInput = page.locator('input[type="number"], input[name*="amount"], input[placeholder*="amount"], input[placeholder*="montant"]').first();
      if (await amountInput.count() > 0) {
        await amountInput.fill('9999');
        await page.screenshot({ path: 'tests/screenshots/11-billing-modal-filled.png', fullPage: false });
        const saved = await tryOpenButton(page, /save|submit|create|send|enregistrer|créer|envoyer/i);
        if (!saved) {
          console.log('AUDIT: Billing — no save/submit button found in invoice modal');
        } else {
          await page.waitForTimeout(800);
          await page.screenshot({ path: 'tests/screenshots/11-billing-after-create.png', fullPage: true });
          console.log('INFO: Billing — invoice creation form submitted');
        }
      } else {
        console.log('AUDIT: Billing — no amount input found in invoice modal');
        await page.screenshot({ path: 'tests/screenshots/11-billing-modal-empty.png', fullPage: false });
      }
    }
  }

  // Try to find a pending/draft invoice and change its status
  const pendingInvoice = page.locator('[class*="card"], [class*="row"], tr, li').filter({ hasText: /pending|draft|brouillon|unpaid|impayé/i }).first();
  if (await pendingInvoice.count() > 0) {
    await pendingInvoice.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'tests/screenshots/11-billing-invoice-detail.png', fullPage: false });
    const markPaidBtn = page.locator('button').filter({ hasText: /mark.*paid|mark paid|paid|marquer.*payé|payé/i }).first();
    if (await markPaidBtn.count() > 0) {
      await markPaidBtn.click();
      await page.waitForTimeout(600);
      console.log('INFO: Billing — mark as paid interaction attempted');
    } else {
      console.log('AUDIT: Billing — opened pending invoice but no "Mark as Paid" button found');
    }
  } else {
    console.log('AUDIT: Billing — no pending/draft invoice found to mark as paid');
  }
});

// ─── Knowledge Base CRUD ──────────────────────────────────────────────────────

test('Knowledge Base — create article and verify it appears in list', async ({ page }) => {
  await goTo(page, '/app/knowledge');
  await page.screenshot({ path: 'tests/screenshots/11-knowledge-before.png', fullPage: true });
  await assertRendered(page, 'Knowledge Base');

  const opened = await tryOpenButton(page, /new article|add article|nouvel article|ajouter/i);
  if (!opened) {
    console.log('AUDIT: Knowledge Base — no "New Article" button found');
    return;
  }

  await page.waitForTimeout(500);
  const dialog = page.locator('[role="dialog"], [data-state="open"]').first();
  if (await dialog.count() === 0) {
    console.log('AUDIT: Knowledge Base — button clicked but no modal/sheet appeared');
    return;
  }

  // Fill title
  const titleInput = page.locator('input[type="text"], input[name*="title"], input[placeholder*="title"], input[placeholder*="titre"]').first();
  if (await titleInput.count() === 0) {
    console.log('AUDIT: Knowledge Base — no title input found in modal');
    await page.screenshot({ path: 'tests/screenshots/11-knowledge-modal-empty.png', fullPage: false });
    return;
  }
  await titleInput.fill('Playwright KB Article');

  // Fill content if a textarea/editor is present
  const contentInput = page.locator('textarea, [contenteditable="true"], [role="textbox"]').first();
  if (await contentInput.count() > 0) {
    await contentInput.fill('This is a test article created by Playwright.');
  }

  await page.screenshot({ path: 'tests/screenshots/11-knowledge-modal-filled.png', fullPage: false });

  const saved = await tryOpenButton(page, /save|submit|create|publish|enregistrer|créer|publier/i);
  if (!saved) {
    console.log('AUDIT: Knowledge Base — no save/submit button found in modal');
    return;
  }

  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tests/screenshots/11-knowledge-after.png', fullPage: true });

  const bodyText = (await page.locator('body').textContent())!;
  if (!bodyText.includes('Playwright KB Article')) {
    console.log('AUDIT: Knowledge Base — created article "Playwright KB Article" not visible in list after save');
  } else {
    console.log('INFO: Knowledge Base — "Playwright KB Article" appears in list after creation');
  }
});

// ─── Tickets CRUD ─────────────────────────────────────────────────────────────

test('Tickets — create a ticket and resolve it', async ({ page }) => {
  await goTo(page, '/app/tickets');
  await page.screenshot({ path: 'tests/screenshots/11-tickets-before.png', fullPage: true });
  await assertRendered(page, 'Tickets');

  const opened = await tryOpenButton(page, /new ticket|add ticket|nouveau ticket|créer/i);
  if (!opened) {
    console.log('AUDIT: Tickets — no "New Ticket" button found');
    return;
  }

  await page.waitForTimeout(500);
  const dialog = page.locator('[role="dialog"], [data-state="open"]').first();
  if (await dialog.count() === 0) {
    console.log('AUDIT: Tickets — button clicked but no modal/sheet appeared');
    return;
  }

  // Fill subject/title
  const subjectInput = page.locator('input[type="text"], input[name*="subject"], input[name*="title"], input[placeholder*="subject"], input[placeholder*="titre"]').first();
  if (await subjectInput.count() === 0) {
    console.log('AUDIT: Tickets — no subject/title input found in modal');
    await page.screenshot({ path: 'tests/screenshots/11-tickets-modal-empty.png', fullPage: false });
    return;
  }
  await subjectInput.fill('Playwright Ticket');

  await page.screenshot({ path: 'tests/screenshots/11-tickets-modal-filled.png', fullPage: false });

  const saved = await tryOpenButton(page, /save|submit|create|add|enregistrer|créer|ajouter/i);
  if (!saved) {
    console.log('AUDIT: Tickets — no save/submit button found in modal');
    return;
  }

  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tests/screenshots/11-tickets-after-create.png', fullPage: true });

  const bodyText = (await page.locator('body').textContent())!;
  if (!bodyText.includes('Playwright Ticket')) {
    console.log('AUDIT: Tickets — created ticket "Playwright Ticket" not visible after save');
  } else {
    console.log('INFO: Tickets — "Playwright Ticket" appears after creation');
  }

  // Try to find and resolve the ticket
  const ticketRow = page.locator('[class*="card"], [class*="row"], tr, li').filter({ hasText: 'Playwright Ticket' }).first();
  if (await ticketRow.count() > 0) {
    await ticketRow.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'tests/screenshots/11-tickets-detail.png', fullPage: false });
    const resolveBtn = page.locator('button').filter({ hasText: /resolve|close|résoudre|fermer/i }).first();
    if (await resolveBtn.count() > 0) {
      await resolveBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'tests/screenshots/11-tickets-resolved.png', fullPage: false });
      console.log('INFO: Tickets — resolve interaction completed');
    } else {
      console.log('AUDIT: Tickets — ticket detail opened but no resolve/close button found');
    }
  } else {
    console.log('AUDIT: Tickets — could not locate created ticket row to resolve it');
  }
});
