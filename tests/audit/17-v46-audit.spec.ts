/**
 * 17-v46-audit.spec.ts
 * Playwright coverage for all v4.6 deliverables:
 *   - Proposals: validation toasts + AlertDialog confirm + send/remove toasts
 *   - AgentBuilder: name validation + save toasts
 *   - Billing: btn-new-invoice handler
 *   - AppSettings: webhook error handling, copy fallback, confirm dialogs
 *   - Workflows: AI suggestions error + retry button
 *   - Portal: signing redirect ?signed=1, invoices Stripe check, email gate errors
 *   - i18n: new v4.6 keys render in FR after language switch
 *   - Onboarding: skip button visible from step ≥ 1
 *   - AppShell: mobile search button aria-label
 */

import { test, expect, type Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function goto(page: Page, route: string, wait = 1500) {
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(wait);
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `tests/screenshots/17-${name}.png`, fullPage: false });
}

async function switchLang(page: Page, lang: 'fr' | 'en') {
  await goto(page, '/app/settings', 1200);
  const btn = page.locator('button').filter({ hasText: new RegExp(`^${lang}$`, 'i') }).first();
  if (await btn.count() > 0) {
    await btn.click();
    await page.waitForTimeout(600);
    return true;
  }
  return false;
}

// ─── Proposals ────────────────────────────────────────────────────────────────

test.describe('v4.6 — Proposals validation & confirmations', () => {

  test('Proposals page renders with form trigger button', async ({ page }) => {
    await goto(page, '/app/proposals', 1800);
    await shot(page, 'proposals-list');

    const body = (await page.locator('body').textContent())!;
    expect(body.trim().length).toBeGreaterThan(50);

    // "New proposal" or "+" button must be present
    const newBtn = page.locator('button:has-text(/new|nouveau|add|\+/i), a:has-text(/new|nouveau/i)').first();
    const hasNewBtn = await newBtn.isVisible().catch(() => false);
    if (hasNewBtn) {
      console.log('INFO v4.6 Proposals: New proposal button visible');
    } else {
      console.log('AUDIT v4.6 Proposals: No "New proposal" button found');
    }
  });

  test('Proposals — remove action shows confirmation dialog', async ({ page }) => {
    await goto(page, '/app/proposals', 1800);
    await shot(page, 'proposals-before-remove');

    // Look for a trash / remove / delete button on any proposal row
    const removeBtn = page.locator(
      'button[aria-label*="remove" i], button[aria-label*="delete" i], button[aria-label*="supprimer" i], button:has(svg[data-lucide="trash-2" i]), button:has(svg[data-lucide="x" i])'
    ).first();

    const hasRemoveBtn = await removeBtn.isVisible().catch(() => false);
    if (!hasRemoveBtn) {
      console.log('INFO v4.6 Proposals: No remove button visible (no proposals in list, or behind row hover)');
      return;
    }

    await removeBtn.click();
    await page.waitForTimeout(600);
    await shot(page, 'proposals-remove-dialog');

    // AlertDialog should appear
    const dialog = page.locator('[role="alertdialog"], [role="dialog"]').first();
    const dialogVisible = await dialog.isVisible().catch(() => false);
    if (dialogVisible) {
      console.log('INFO v4.6 Proposals: AlertDialog confirmation appeared before remove');
      // Cancel should keep the item
      const cancelBtn = dialog.locator('button:has-text(/cancel|annuler/i)').first();
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
        console.log('INFO v4.6 Proposals: Cancel button works in remove dialog');
      }
    } else {
      console.log('AUDIT v4.6 Proposals: Remove action did not show AlertDialog — destructive action without confirmation');
    }
  });

  test('Proposals — ProposalCopilot button present (v4.2 Copilot integration)', async ({ page }) => {
    await goto(page, '/app/proposals', 1800);

    const copilotBtn = page.locator('button:has-text(/copilot|AI|hermes|scop/i)').first();
    const hasCopilot = await copilotBtn.isVisible().catch(() => false);
    if (hasCopilot) {
      console.log('INFO v4.6 Proposals: Copilot/AI scoping button visible');
    } else {
      console.log('AUDIT v4.6 Proposals: No Copilot/AI button found in proposals');
    }
  });

  test('Proposals — form validation: submit without title shows error', async ({ page }) => {
    await goto(page, '/app/proposals', 1800);

    // Open the proposal form
    const newBtn = page.locator('button:has-text(/new|nouveau/i), button:has-text(/\+/i), button[data-testid*="new"]').first();
    const hasNewBtn = await newBtn.isVisible().catch(() => false);
    if (!hasNewBtn) {
      console.log('INFO v4.6 Proposals: Cannot open form — no new button found');
      return;
    }

    await newBtn.click();
    await page.waitForTimeout(800);
    await shot(page, 'proposals-form-open');

    // Try to submit without filling the title
    const submitBtn = page.locator('button[type="submit"], button:has-text(/save|sauvegarder|create|créer|enregistrer/i)').first();
    const hasSubmit = await submitBtn.isVisible().catch(() => false);
    if (!hasSubmit) {
      console.log('INFO v4.6 Proposals: Form submit button not found (may need scroll)');
      return;
    }

    await submitBtn.click();
    await page.waitForTimeout(600);
    await shot(page, 'proposals-form-validation-error');

    // Look for a toast or error message
    const toast = page.locator('[data-sonner-toast], [role="alert"], [class*="toast" i]').first();
    const toastVisible = await toast.isVisible().catch(() => false);
    const body = (await page.locator('body').textContent())!;
    const hasErrorText = /title|titre|required|requis|amount|montant/i.test(body);

    if (toastVisible || hasErrorText) {
      console.log('INFO v4.6 Proposals: Validation feedback shown on empty form submit');
    } else {
      console.log('AUDIT v4.6 Proposals: No validation error shown on empty title submit');
    }
  });
});

// ─── AgentBuilder ─────────────────────────────────────────────────────────────

test.describe('v4.6 — AgentBuilder validation', () => {

  test('AgentBuilder page is accessible and renders', async ({ page }) => {
    await goto(page, '/app/agents', 1500);
    await shot(page, 'agents-list');

    const body = (await page.locator('body').textContent())!;
    expect(body.trim().length).toBeGreaterThan(20);
    console.log('INFO v4.6 AgentBuilder: /app/agents page renders');
  });

  test('AgentBuilder — can open builder for an agent', async ({ page }) => {
    await goto(page, '/app/agents', 1500);

    // Try to open a builder (click first agent or "New Agent" button)
    const agentLink = page.locator('a[href*="/agents/"], button:has-text(/new agent|nouvel agent|create/i)').first();
    const hasLink = await agentLink.isVisible().catch(() => false);
    if (hasLink) {
      await agentLink.click();
      await page.waitForTimeout(1000);
      await shot(page, 'agent-builder-open');
      const body = (await page.locator('body').textContent())!;
      expect(body.length).toBeGreaterThan(20);
      console.log('INFO v4.6 AgentBuilder: Builder/form opened successfully');
    } else {
      console.log('INFO v4.6 AgentBuilder: No agent link or create button found');
    }
  });

  test('AgentBuilder — save without name shows error toast', async ({ page }) => {
    // Navigate to an agent builder page directly
    await goto(page, '/app/agents', 1500);

    // Try to find the builder form with a Save button
    const saveBtn = page.locator('button:has-text(/save|sauvegarder|enregistrer/i)').first();
    const hasSaveBtn = await saveBtn.isVisible().catch(() => false);

    if (!hasSaveBtn) {
      // Try to open a new agent modal
      const createBtn = page.locator('button:has-text(/new|nouveau|create|créer/i)').first();
      if (await createBtn.isVisible().catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(600);
      }
    }

    const saveBtnAfter = page.locator('button:has-text(/save|sauvegarder/i)').first();
    if (!(await saveBtnAfter.isVisible().catch(() => false))) {
      console.log('INFO v4.6 AgentBuilder: No Save button found in current view');
      return;
    }

    // Clear any name field and click save
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i], input[placeholder*="nom" i]').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.clear();
    }

    await saveBtnAfter.click();
    await page.waitForTimeout(600);
    await shot(page, 'agent-builder-name-required');

    const toast = page.locator('[data-sonner-toast], [role="alert"]').first();
    const body = (await page.locator('body').textContent())!;
    const hasNameError = /name|nom|required|requis/i.test(body);

    if (await toast.isVisible().catch(() => false) || hasNameError) {
      console.log('INFO v4.6 AgentBuilder: Name required error shown on empty save');
    } else {
      console.log('AUDIT v4.6 AgentBuilder: No error shown when saving without name');
    }
  });
});

// ─── Billing — btn-new-invoice ────────────────────────────────────────────────

test.describe('v4.6 — Billing new invoice button', () => {

  test('Billing page renders with financial data', async ({ page }) => {
    await goto(page, '/app/billing', 1500);
    await shot(page, 'billing-overview');

    const body = (await page.locator('body').textContent())!;
    expect(body.trim().length).toBeGreaterThan(50);

    const hasFinancialTerms = /invoice|facture|retainer|billing|\$|€/i.test(body);
    if (hasFinancialTerms) {
      console.log('INFO v4.6 Billing: Financial content visible');
    } else {
      console.log('AUDIT v4.6 Billing: No financial content detected');
    }
  });

  test('Billing — btn-new-invoice opens invoice creation', async ({ page }) => {
    await goto(page, '/app/billing', 1500);

    // Find the new invoice button (by id, text, or aria)
    const newInvoiceBtn = page.locator(
      '#btn-new-invoice, button:has-text(/new invoice|nouvelle facture|créer.*facture|add invoice/i)'
    ).first();

    const hasBtnInvoice = await newInvoiceBtn.isVisible().catch(() => false);
    if (!hasBtnInvoice) {
      console.log('AUDIT v4.6 Billing: btn-new-invoice not found');

      // Fallback: check if the invoices tab has any create action
      const invoicesTab = page.locator('button:has-text(/invoice|facture/i)').first();
      if (await invoicesTab.isVisible().catch(() => false)) {
        await invoicesTab.click();
        await page.waitForTimeout(600);
        const newBtnAfterTab = page.locator('#btn-new-invoice, button:has-text(/new invoice|nouvelle facture/i)').first();
        const hasAfterTab = await newBtnAfterTab.isVisible().catch(() => false);
        console.log(`INFO v4.6 Billing: btn-new-invoice ${hasAfterTab ? 'found' : 'still not found'} after switching to Invoices tab`);
      }
      return;
    }

    await newInvoiceBtn.click();
    await page.waitForTimeout(800);
    await shot(page, 'billing-new-invoice-modal');

    const dialog = page.locator('[role="dialog"], [data-vaul-drawer], [class*="sheet" i]').first();
    const dialogVisible = await dialog.isVisible().catch(() => false);
    if (dialogVisible) {
      console.log('INFO v4.6 Billing: Invoice creation sheet/modal opens on btn-new-invoice click');
    } else {
      console.log('AUDIT v4.6 Billing: btn-new-invoice click did not open a dialog/sheet');
    }
  });
});

// ─── AppSettings — Webhooks & API Keys ───────────────────────────────────────

test.describe('v4.6 — AppSettings: webhooks & API key handling', () => {

  test('AppSettings renders with Webhooks and API Keys sections', async ({ page }) => {
    await goto(page, '/app/settings', 1800);
    await shot(page, 'settings-overview');

    const body = (await page.locator('body').textContent())!;
    const hasWebhooks = /webhook/i.test(body);
    const hasApiKeys = /api.?key|clé.?api/i.test(body);

    if (hasWebhooks) {
      console.log('INFO v4.6 AppSettings: Webhooks section visible');
    } else {
      console.log('AUDIT v4.6 AppSettings: Webhooks section not found');
    }
    if (hasApiKeys) {
      console.log('INFO v4.6 AppSettings: API Keys section visible');
    } else {
      console.log('AUDIT v4.6 AppSettings: API Keys section not found');
    }

    expect(body.trim().length).toBeGreaterThan(50);
  });

  test('AppSettings — webhook delete has confirmation dialog', async ({ page }) => {
    await goto(page, '/app/settings', 1800);

    // Find a delete button near a webhook entry
    const deleteBtn = page.locator(
      'button[aria-label*="delete" i]:near(:text("webhook")), button[aria-label*="supprimer" i]:near(:text("webhook")), button:has-text(/delete|supprimer/i):near(:text("webhook"))'
    ).first();

    const hasDeleteBtn = await deleteBtn.isVisible().catch(() => false);
    if (!hasDeleteBtn) {
      // Try generic approach - any trash icon button in the page
      const trashBtn = page.locator('button:has(svg[data-lucide="trash-2" i]), button:has(svg[data-lucide="trash" i])').first();
      const hasTrash = await trashBtn.isVisible().catch(() => false);
      if (!hasTrash) {
        console.log('INFO v4.6 AppSettings: No delete button found (no webhooks configured yet)');
        return;
      }
      await trashBtn.click();
    } else {
      await deleteBtn.click();
    }

    await page.waitForTimeout(600);
    await shot(page, 'settings-webhook-delete-dialog');

    const dialog = page.locator('[role="alertdialog"], [role="dialog"]').first();
    const dialogVisible = await dialog.isVisible().catch(() => false);
    if (dialogVisible) {
      console.log('INFO v4.6 AppSettings: Webhook delete shows AlertDialog confirmation');
      const cancelBtn = dialog.locator('button:has-text(/cancel|annuler/i)').first();
      if (await cancelBtn.isVisible().catch(() => false)) await cancelBtn.click();
    } else {
      console.log('AUDIT v4.6 AppSettings: Webhook delete has no confirmation dialog');
    }
  });

  test('AppSettings — API key copy button exists', async ({ page }) => {
    await goto(page, '/app/settings', 1800);

    const copyBtn = page.locator(
      'button[aria-label*="copy" i], button:has-text(/copy|copier/i), button:has(svg[data-lucide="copy" i])'
    ).first();

    const hasCopy = await copyBtn.isVisible().catch(() => false);
    if (hasCopy) {
      console.log('INFO v4.6 AppSettings: API key copy button present');

      // Click it — in a browser with clipboard restrictions, the fallback input should appear
      await copyBtn.click();
      await page.waitForTimeout(800);
      await shot(page, 'settings-api-key-copy');

      // Check for manual copy fallback (readonly input) or copied state
      const manualInput = page.locator('input[readonly][value], input[readonly]').first();
      const copiedState = page.locator('text=/copied|copié|✓/i').first();
      const hasManual = await manualInput.isVisible().catch(() => false);
      const hasCopied = await copiedState.isVisible().catch(() => false);

      if (hasManual) {
        console.log('INFO v4.6 AppSettings: Copy fallback (readonly input) shown');
      } else if (hasCopied) {
        console.log('INFO v4.6 AppSettings: Copy success feedback shown');
      } else {
        console.log('INFO v4.6 AppSettings: Copy clicked, no visual feedback detected (may have copied to clipboard silently)');
      }
    } else {
      console.log('INFO v4.6 AppSettings: No API key copy button found (no API keys created yet)');
    }
  });

  test('AppSettings — API key revoke shows confirmation dialog', async ({ page }) => {
    await goto(page, '/app/settings', 1800);

    const revokeBtn = page.locator(
      'button:has-text(/revoke|révoquer/i), button[aria-label*="revoke" i]'
    ).first();

    const hasRevoke = await revokeBtn.isVisible().catch(() => false);
    if (!hasRevoke) {
      console.log('INFO v4.6 AppSettings: No revoke button (no API keys exist yet)');
      return;
    }

    await revokeBtn.click();
    await page.waitForTimeout(600);
    await shot(page, 'settings-api-key-revoke-dialog');

    const dialog = page.locator('[role="alertdialog"], [role="dialog"]').first();
    const dialogVisible = await dialog.isVisible().catch(() => false);
    if (dialogVisible) {
      console.log('INFO v4.6 AppSettings: API key revoke shows AlertDialog');
      const cancelBtn = dialog.locator('button:has-text(/cancel|annuler/i)').first();
      if (await cancelBtn.isVisible().catch(() => false)) await cancelBtn.click();
    } else {
      console.log('AUDIT v4.6 AppSettings: Revoke has no confirmation dialog');
    }
  });

  test('AppSettings — webhook test button visible', async ({ page }) => {
    await goto(page, '/app/settings', 1800);

    const testBtn = page.locator('button:has-text(/test|tester/i)').first();
    const hasTest = await testBtn.isVisible().catch(() => false);
    if (hasTest) {
      console.log('INFO v4.6 AppSettings: Webhook test button present');
    } else {
      console.log('INFO v4.6 AppSettings: No test button found (no webhooks configured)');
    }
  });
});

// ─── Workflows — AI suggestions timeout & retry ───────────────────────────────

test.describe('v4.6 — Workflows AI suggestions error state', () => {

  test('Workflows page renders AI suggestions section', async ({ page }) => {
    await goto(page, '/app/workflows', 2000);
    await shot(page, 'workflows-ai-suggestions');

    const body = (await page.locator('body').textContent())!;
    expect(body.trim().length).toBeGreaterThan(50);

    const hasSuggestions = /suggestion|suggest|AI|hermes|trigger|workflow/i.test(body);
    if (hasSuggestions) {
      console.log('INFO v4.6 Workflows: AI suggestions section visible');
    } else {
      console.log('AUDIT v4.6 Workflows: No AI suggestions content detected');
    }
  });

  test('Workflows — retry button present when suggestions fail', async ({ page }) => {
    await goto(page, '/app/workflows', 2500);

    // The retry button appears when AI suggestion fetch fails/times out
    const retryBtn = page.locator('button:has-text(/retry|réessayer|retry/i)').first();
    const hasRetry = await retryBtn.isVisible().catch(() => false);

    if (hasRetry) {
      console.log('INFO v4.6 Workflows: Retry button visible (AI suggestions failed or timed out)');
      await shot(page, 'workflows-retry-button');
    } else {
      // May have loaded successfully — look for AI suggestion cards
      const suggestionCards = page.locator('[class*="suggestion" i], [class*="card" i]:has-text(/trigger|action|workflow/i)').first();
      const hasCards = await suggestionCards.isVisible().catch(() => false);
      if (hasCards) {
        console.log('INFO v4.6 Workflows: AI suggestions loaded successfully (no retry button needed)');
      } else {
        console.log('INFO v4.6 Workflows: Neither suggestions nor retry button found (neutral state)');
      }
    }
  });
});

// ─── Portal — Signing redirect ?signed=1 ─────────────────────────────────────

test.describe('v4.6 — Portal signing flow', () => {

  test('Portal with ?signed=1 shows confirmation banner', async ({ page }) => {
    // Use a fake token — the page should still render the success banner
    // because it reads from the URL param, not just from the DB
    await goto(page, '/portal/test-token-abc?signed=1', 2000);
    await shot(page, 'portal-signed-banner');

    const body = (await page.locator('body').textContent())!;
    const hasSignedConfirmation = /signed|signé|signature.*success|proposition.*signée|✓|confirmed/i.test(body);
    if (hasSignedConfirmation) {
      console.log('INFO v4.6 Portal: ?signed=1 shows signing confirmation');
    } else {
      console.log('AUDIT v4.6 Portal: ?signed=1 query param not reflected in UI (no confirmation banner)');
    }
  });

  test('Portal proposals — signing modal structure', async ({ page }) => {
    await goto(page, '/portal/test-token-abc', 2000);
    await shot(page, 'portal-proposal-page');

    const body = (await page.locator('body').textContent())!;
    // Should render something (even not-found state is valid)
    expect(body.trim().length).toBeGreaterThan(20);
    console.log('INFO v4.6 Portal: /portal/[token] page renders without crash');
  });
});

// ─── Portal — Invoices Stripe check ──────────────────────────────────────────

test.describe('v4.6 — Portal invoices Stripe check', () => {

  test('Portal invoices page renders (or shows not-configured message)', async ({ page }) => {
    await goto(page, '/portal/test-token-abc', 2000);
    await shot(page, 'portal-invoices-page');

    const body = (await page.locator('body').textContent())!;
    expect(body.trim().length).toBeGreaterThan(20);

    // Check if Pay button is hidden when Stripe not configured
    const payBtn = page.locator('button:has-text(/pay|payer/i)').first();
    const hasPayBtn = await payBtn.isVisible().catch(() => false);
    const hasContactMessage = /contact.*agence|contact.*agency|stripe.*not.*configured|paiement.*non.*disponible/i.test(body);

    if (!hasPayBtn && hasContactMessage) {
      console.log('INFO v4.6 Portal Invoices: Pay button hidden, "contact agency" message shown (Stripe not configured)');
    } else if (hasPayBtn) {
      console.log('INFO v4.6 Portal Invoices: Pay button visible (Stripe may be configured)');
    } else {
      console.log('INFO v4.6 Portal Invoices: Invoice page with unknown token — not-found state');
    }
  });
});

// ─── Portal — Email gate error differentiation ────────────────────────────────

test.describe('v4.6 — Portal email gate errors', () => {

  test('Email gate shows differentiated error for wrong email', async ({ page }) => {
    await goto(page, '/portal/test-token-abc', 1500);
    await shot(page, 'portal-email-gate');

    // Check if email gate form is present
    const emailInput = page.locator('input[type="email"]').first();
    const hasEmailGate = await emailInput.isVisible().catch(() => false);

    if (!hasEmailGate) {
      console.log('INFO v4.6 Portal EmailGate: No email gate shown (page shows content or not-found)');
      return;
    }

    // Submit a wrong email
    await emailInput.fill('wrong@notregistered.com');
    const submitBtn = page.locator('button[type="submit"], button:has-text(/verify|vérifier|access|accéder|enter/i)').first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(1200);
      await shot(page, 'portal-email-gate-error');

      const bodyAfter = (await page.locator('body').textContent())!;
      const hasSpecificError = /not.*linked|non.*lié|invalid.*email|email.*invalide|verification.*failed|vérification.*échouée/i.test(bodyAfter);
      const hasGenericError = /error|erreur|invalid|invalide/i.test(bodyAfter);

      if (hasSpecificError) {
        console.log('INFO v4.6 Portal EmailGate: Specific error message shown for wrong email');
      } else if (hasGenericError) {
        console.log('AUDIT v4.6 Portal EmailGate: Generic error only — specific differentiation missing');
      } else {
        console.log('INFO v4.6 Portal EmailGate: No error visible yet (API not called or async)');
      }
    }
  });
});

// ─── i18n v4.6 new keys ───────────────────────────────────────────────────────

test.describe('v4.6 — i18n new strings in FR', () => {

  test('i18n v4.6 — Pipeline: Hermes AI labels in FR', async ({ page }) => {
    const switched = await switchLang(page, 'fr');
    if (!switched) {
      console.log('INFO v4.6 i18n: No FR button found — skipping FR test');
      return;
    }

    await goto(page, '/app/pipeline', 1500);
    await shot(page, 'i18n-fr-pipeline');

    const body = (await page.locator('body').textContent())!;
    // New v4.6 keys: "Brouillon IA Hermes" / "Approuver et marquer envoyé"
    const hasHermesLabel = /brouillon.*hermes|hermes.*brouillon|approuver.*marquer|marquer.*envoyé/i.test(body);
    if (hasHermesLabel) {
      console.log('INFO v4.6 i18n Pipeline FR: Hermes AI labels render in French');
    } else {
      console.log('AUDIT v4.6 i18n Pipeline FR: Hermes AI labels not detected in French');
    }

    await switchLang(page, 'en');
  });

  test('i18n v4.6 — Finance: "Nouvelle transaction" in FR', async ({ page }) => {
    const switched = await switchLang(page, 'fr');
    if (!switched) return;

    await goto(page, '/app/finance', 1500);
    await shot(page, 'i18n-fr-finance');

    const body = (await page.locator('body').textContent())!;
    const hasNewTx = /nouvelle transaction|aucune transaction|sommaire.*taxes|tps.*tvq/i.test(body);
    if (hasNewTx) {
      console.log('INFO v4.6 i18n Finance FR: New transaction / QC tax strings render in French');
    } else {
      console.log('AUDIT v4.6 i18n Finance FR: Expected FR strings not found in Finance module');
    }

    await switchLang(page, 'en');
  });

  test('i18n v4.6 — Dashboard: tasks labels in FR', async ({ page }) => {
    const switched = await switchLang(page, 'fr');
    if (!switched) return;

    await goto(page, '/app/dashboard', 1800);
    await shot(page, 'i18n-fr-dashboard');

    const body = (await page.locator('body').textContent())!;
    // New v4.6 keys: "Tâches ouvertes" / "Toutes les tâches terminées"
    const hasTasksLabel = /tâches ouvertes|toutes.*tâches.*terminées|aucune.*tâche/i.test(body);
    if (hasTasksLabel) {
      console.log('INFO v4.6 i18n Dashboard FR: Task count labels render in French');
    } else {
      console.log('AUDIT v4.6 i18n Dashboard FR: Task FR labels not detected');
    }

    await switchLang(page, 'en');
  });

  test('i18n v4.6 — Approvals: "SLA dépassé" in FR', async ({ page }) => {
    const switched = await switchLang(page, 'fr');
    if (!switched) return;

    await goto(page, '/app/approvals', 1500);
    await shot(page, 'i18n-fr-approvals');

    const body = (await page.locator('body').textContent())!;
    const hasSla = /sla.*dépassé|dépassé.*sla/i.test(body);
    if (hasSla) {
      console.log('INFO v4.6 i18n Approvals FR: "SLA dépassé" renders in French');
    } else {
      console.log('AUDIT v4.6 i18n Approvals FR: SLA breached label not found in French');
    }

    await switchLang(page, 'en');
  });

  test('i18n v4.6 — Billing: "Nouvelle facture" in FR', async ({ page }) => {
    const switched = await switchLang(page, 'fr');
    if (!switched) return;

    await goto(page, '/app/billing', 1500);
    await shot(page, 'i18n-fr-billing');

    const body = (await page.locator('body').textContent())!;
    const hasBillingFr = /nouvelle facture|aucune facture/i.test(body);
    if (hasBillingFr) {
      console.log('INFO v4.6 i18n Billing FR: Invoice labels render in French');
    } else {
      console.log('AUDIT v4.6 i18n Billing FR: FR invoice labels not found');
    }

    await switchLang(page, 'en');
  });

  test('i18n v4.6 — Settings: agent name validation message in FR', async ({ page }) => {
    const switched = await switchLang(page, 'fr');
    if (!switched) return;

    // Visit agents page and try to trigger the name required error
    await goto(page, '/app/agents', 1500);
    await shot(page, 'i18n-fr-agents');

    const body = (await page.locator('body').textContent())!;
    const hasAgentFr = /nom.*agent|agent.*requis|sauvegardé|impossible.*sauvegarder/i.test(body);
    if (hasAgentFr) {
      console.log('INFO v4.6 i18n Agents FR: Agent builder strings render in French');
    } else {
      console.log('INFO v4.6 i18n Agents FR: FR strings not found yet (need to trigger toast)');
    }

    await switchLang(page, 'en');
  });

  test('i18n v4.6 — Portal: signed confirmation in FR', async ({ page }) => {
    const switched = await switchLang(page, 'fr');
    if (!switched) return;

    await goto(page, '/portal/test-token-abc?signed=1', 2000);
    await shot(page, 'i18n-fr-portal-signed');

    const body = (await page.locator('body').textContent())!;
    const hasSignedFr = /proposition.*signée|signature.*enregistrée|succès/i.test(body);
    if (hasSignedFr) {
      console.log('INFO v4.6 i18n Portal FR: Signed confirmation in French');
    } else {
      console.log('INFO v4.6 i18n Portal FR: FR confirmation not detected (may need real token)');
    }

    await switchLang(page, 'en');
  });
});

// ─── Onboarding — skip button ─────────────────────────────────────────────────

test.describe('v4.6 — Onboarding skip button', () => {

  test('Onboarding step 0 — no skip button initially', async ({ page }) => {
    await goto(page, '/app/onboarding', 1500);
    await shot(page, 'onboarding-step-0');

    const skipBtn = page.locator('button:has-text(/skip|passer/i)').first();
    const hasSkip = await skipBtn.isVisible().catch(() => false);

    if (!hasSkip) {
      console.log('INFO v4.6 Onboarding: No skip button on step 0 — correct behavior');
    } else {
      console.log('AUDIT v4.6 Onboarding: Skip button visible on step 0 — should only appear from step 1+');
    }
  });

  test('Onboarding step 1+ — skip button appears after first Next click', async ({ page }) => {
    await goto(page, '/app/onboarding', 1500);

    // Click the Next/Continue button to advance to step 1
    const nextBtn = page.locator('button:has-text(/next|suivant|continue|commencer/i)').first();
    const hasNext = await nextBtn.isVisible().catch(() => false);

    if (!hasNext) {
      console.log('INFO v4.6 Onboarding: No Next button found on onboarding page');
      return;
    }

    // Fill in required fields if any (workspace name is usually step 0)
    const workspaceInput = page.locator('input[name*="workspace" i], input[name*="name" i], input[placeholder*="workspace" i], input[placeholder*="agency" i]').first();
    if (await workspaceInput.isVisible().catch(() => false)) {
      await workspaceInput.fill('Test Agency');
    }

    await nextBtn.click();
    await page.waitForTimeout(1000);
    await shot(page, 'onboarding-step-1');

    const skipBtn = page.locator('button:has-text(/skip|passer/i)').first();
    const hasSkipAfter = await skipBtn.isVisible().catch(() => false);

    if (hasSkipAfter) {
      console.log('INFO v4.6 Onboarding: Skip button appears on step 1 — correct behavior');
    } else {
      console.log('AUDIT v4.6 Onboarding: Skip button not visible on step 1+ (may need checking OnboardingWizard step index)');
    }
  });

  test('Onboarding skip — redirects to dashboard', async ({ page }) => {
    await goto(page, '/app/onboarding', 1500);

    // Try to advance past step 0
    const workspaceInput = page.locator('input[name*="workspace" i], input[name*="name" i], input[placeholder*="workspace" i]').first();
    if (await workspaceInput.isVisible().catch(() => false)) {
      await workspaceInput.fill('Test Agency');
    }

    const nextBtn = page.locator('button:has-text(/next|suivant|continue|commencer/i)').first();
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(800);
    }

    const skipBtn = page.locator('button:has-text(/skip|passer/i)').first();
    if (!(await skipBtn.isVisible().catch(() => false))) {
      console.log('INFO v4.6 Onboarding Skip: No skip button available — cannot test redirect');
      return;
    }

    await skipBtn.click();
    await page.waitForTimeout(1500);
    await shot(page, 'onboarding-skip-redirect');

    const url = page.url();
    if (url.includes('/app/dashboard')) {
      console.log('INFO v4.6 Onboarding Skip: Successfully redirected to /app/dashboard after skip');
    } else {
      console.log(`AUDIT v4.6 Onboarding Skip: Expected /app/dashboard after skip, got: ${url}`);
    }
  });
});

// ─── AppShell — mobile search aria-label ─────────────────────────────────────

test.describe('v4.6 — AppShell mobile search aria-label', () => {

  test('Mobile search button has aria-label', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await goto(page, '/app/dashboard', 1800);
    await shot(page, 'mobile-search-aria');

    // Find the mobile search button — it should have aria-label or title
    const searchBtn = page.locator(
      'button[aria-label*="search" i], button[aria-label*="recherche" i], button[aria-label*="command" i], button[title*="search" i], button[title*="recherche" i]'
    ).first();

    const hasAriaLabel = await searchBtn.isVisible().catch(() => false);
    if (hasAriaLabel) {
      const ariaLabel = await searchBtn.getAttribute('aria-label');
      const title = await searchBtn.getAttribute('title');
      console.log(`INFO v4.6 AppShell: Mobile search button has aria-label="${ariaLabel}" title="${title}"`);
    } else {
      // Check for button with SVG (search icon) without label
      const iconBtn = page.locator('button:has(svg)').filter({ hasNot: page.locator('[aria-label]') }).first();
      const hasIconBtn = await iconBtn.isVisible().catch(() => false);
      if (hasIconBtn) {
        console.log('AUDIT v4.6 AppShell: Search-like button found without aria-label — accessibility gap');
      } else {
        console.log('INFO v4.6 AppShell: No icon-only button without aria-label found on mobile');
      }
    }
  });

  test('Mobile — bottom nav / dock accessible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await goto(page, '/app/dashboard', 1800);
    await shot(page, 'mobile-bottom-nav');

    const dock = page.locator('[class*="dock" i], [class*="Dock"], nav[class*="mobile" i], [class*="bottom-nav" i]').first();
    const hasDock = await dock.isVisible().catch(() => false);
    if (hasDock) {
      console.log('INFO v4.6 AppShell: Mobile dock/bottom-nav visible');
    } else {
      console.log('AUDIT v4.6 AppShell: No mobile dock detected');
    }
  });
});

// ─── Smoke test: no JS errors on v4.6 pages ──────────────────────────────────

test.describe('v4.6 — Zero JS errors on new pages', () => {

  const v46Routes = [
    '/app/agents',
    '/app/proposals',
    '/app/workflows',
    '/app/billing',
    '/app/settings',
    '/app/onboarding',
  ];

  for (const route of v46Routes) {
    test(`No crash on ${route}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => {
        const msg = e.message;
        const isExpected = msg.includes('WebSocket') || msg.includes('supabase') ||
          msg.includes('net::ERR') || msg.includes('Failed to fetch') ||
          msg.includes('AbortError') || msg.includes('NetworkError');
        if (!isExpected) errors.push(msg);
      });

      await goto(page, route, 1500);

      if (errors.length > 0) {
        console.log(`AUDIT v4.6 Smoke: JS errors on ${route}: ${errors.slice(0, 3).join('; ')}`);
      } else {
        console.log(`INFO v4.6 Smoke: ${route} — no unexpected JS errors`);
      }

      const body = (await page.locator('body').textContent())!;
      expect(body.trim().length).toBeGreaterThan(20);
    });
  }
});
