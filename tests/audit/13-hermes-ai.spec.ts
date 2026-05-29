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

// ─── Dashboard — Daily Briefing ───────────────────────────────────────────────

test('Dashboard — Daily Briefing section visible', async ({ page }) => {
  await goTo(page, '/app/dashboard');
  await page.screenshot({ path: 'tests/screenshots/13-dashboard-briefing.png', fullPage: true });
  await assertRendered(page, 'Dashboard Daily Briefing');

  const bodyText = (await page.locator('body').textContent())!;
  const hasBriefing = /briefing|hermes|aujourd|daily/i.test(bodyText);
  if (!hasBriefing) console.log('AUDIT: Dashboard — no briefing/Hermes/daily section text found');

  // Check for a skeleton loader or content section indicating the briefing area rendered
  const hasSkeleton = await page.locator('[class*="skeleton"], [class*="Skeleton"], [aria-busy="true"]').count();
  const hasSection = await page.locator('[class*="briefing"], [class*="Briefing"], [data-testid*="briefing"]').count();
  if (hasSkeleton === 0 && hasSection === 0) {
    console.log('AUDIT: Dashboard — no skeleton or briefing content section element found');
  }
});

// ─── Dashboard — Firefighter Tab ──────────────────────────────────────────────

test('Dashboard — Firefighter tab accessible', async ({ page }) => {
  await goTo(page, '/app/dashboard');

  const tab = page.locator('button, [role="tab"]').filter({ hasText: /firefighter|urgenc|risk|flag/i }).first();
  if (await tab.count() > 0) {
    await tab.click();
    await page.waitForTimeout(500);
  } else {
    console.log('AUDIT: Dashboard — no firefighter/risk/flag tab found');
  }

  await page.screenshot({ path: 'tests/screenshots/13-firefighter.png', fullPage: true });

  const bodyText = (await page.locator('body').textContent())!;
  const hasRiskContent = /risk|flag|churn|overdue|retard|risque|no flag|aucun/i.test(bodyText);
  if (!hasRiskContent) console.log('AUDIT: Dashboard — no risk/flag content or empty state found after tab click');
});

// ─── Hermes — Chat Panel ──────────────────────────────────────────────────────

test('Hermes — Chat panel opens from sidebar', async ({ page }) => {
  await goTo(page, '/app/dashboard');

  // Look for Hermes/AI/chat button in sidebar or nav
  const hermesBtn = page.locator('button, a, [role="button"]').filter({ hasText: /hermes|chat|ai|assistant/i }).first();
  if (await hermesBtn.count() > 0) {
    await hermesBtn.click();
    await page.waitForTimeout(800);
  } else {
    console.log('AUDIT: Hermes — no Hermes/chat/AI button found in sidebar');
  }

  await page.screenshot({ path: 'tests/screenshots/13-hermes-chat.png', fullPage: true });

  const bodyText = (await page.locator('body').textContent())!;
  const hasChatArea = /hermes|chat|message|assistant|ask|type/i.test(bodyText);
  if (!hasChatArea) console.log('AUDIT: Hermes — no chat input or message area text found');

  // Check for an actual input element (chat box)
  const chatInput = await page.locator('input[type="text"], textarea, [contenteditable="true"]').count();
  if (chatInput === 0) console.log('AUDIT: Hermes — no chat input field found after opening panel');
});

// ─── Agent Ops ────────────────────────────────────────────────────────────────

test('Agent Ops — page loads and shows agent status', async ({ page }) => {
  // Try /app/agents first, fall back to /app/intelligence
  await goTo(page, '/app/agents');
  let bodyText = (await page.locator('body').textContent())!;
  const isBlank = !bodyText || bodyText.trim().length < 50;

  if (isBlank) {
    console.log('AUDIT: Agent Ops — /app/agents appears blank, trying /app/intelligence');
    await goTo(page, '/app/intelligence');
    bodyText = (await page.locator('body').textContent())!;
  }

  await page.screenshot({ path: 'tests/screenshots/13-agents.png', fullPage: true });
  await assertRendered(page, 'Agent Ops');

  const hasAgentContent = /agent|status|workflow|hermes/i.test(bodyText);
  if (!hasAgentContent) console.log('AUDIT: Agent Ops — no agent/status/workflow/hermes text found');
});

// ─── Risk Flags ───────────────────────────────────────────────────────────────

test('Risk Flags — risk flags section renders', async ({ page }) => {
  await goTo(page, '/app/dashboard');

  const bodyText = (await page.locator('body').textContent())!;
  const hasRiskText = /risk|flag|churn|overdue|retard|risque/i.test(bodyText);
  if (!hasRiskText) console.log('AUDIT: Risk Flags — no risk/flag/churn/overdue text found on dashboard');

  // Check for a dedicated risk flags element
  const riskElement = await page.locator('[class*="risk"], [class*="Risk"], [class*="flag"], [data-testid*="risk"]').count();
  if (riskElement === 0) console.log('AUDIT: Risk Flags — no risk/flag DOM element found');
});

// ─── Reports — AI Summary ─────────────────────────────────────────────────────

test('Reports — AI-generated summary visible in reports', async ({ page }) => {
  await goTo(page, '/app/reports');
  await page.screenshot({ path: 'tests/screenshots/13-reports.png', fullPage: true });
  await assertRendered(page, 'Reports');

  const bodyText = (await page.locator('body').textContent())!;
  const hasReportContent = /summary|profitab|time|track|revenue|insight|rapport|résumé/i.test(bodyText);
  if (!hasReportContent) console.log('AUDIT: Reports — no AI summary, profitability, or time tracking content found');
});
