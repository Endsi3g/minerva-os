/**
 * 18-full-coverage.spec.ts
 * Master audit — visits every route in Minerva OS and reports:
 *   ✅ Functional   ⚠️ Placeholder/stub   ❌ Error/crash   🔴 404/blank
 *
 * Run: npm run test:audit -- 18-full-coverage.spec.ts
 * Report: tests/report/full-coverage.md
 * Screenshots: tests/screenshots/18-*.png
 */

import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Force all tests in this file to run serially in a single worker so the
// module-level `results` array is shared across all tests.
test.describe.configure({ mode: 'serial' });

// ─── Types & in-memory accumulator ───────────────────────────────────────────

type RouteStatus = 'functional' | 'placeholder' | 'error' | 'blank';

interface RouteResult {
  route: string;
  section: string;
  status: RouteStatus;
  notes: string[];
  jsErrors: string[];
  interactiveCount: number;
  bodyLength: number;
}

const results: RouteResult[] = [];

// ─── Detection helpers ────────────────────────────────────────────────────────

const PLACEHOLDER_RE = /coming soon|not implemented|work in progress|bientôt disponible|en cours de développement|under construction|à venir|placeholder/i;
const EMPTY_THRESHOLD = 120;

async function auditRoute(
  page: Page,
  route: string,
  section: string,
  screenshotName: string,
  expectedPatterns: RegExp[] = [],
  missingLabel: string[] = [],
): Promise<RouteResult> {
  const jsErrors: string[] = [];
  const notes: string[] = [];

  page.on('pageerror', (e) => {
    const msg = e.message;
    const isExpected =
      msg.includes('supabase') || msg.includes('net::ERR') ||
      msg.includes('Failed to fetch') || msg.includes('AbortError') ||
      msg.includes('NetworkError') || msg.includes('WebSocket');
    if (!isExpected) jsErrors.push(msg.slice(0, 120));
  });

  let status: RouteStatus = 'functional';

  try {
    await page.goto(route, { timeout: 15_000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  } catch {
    notes.push('Navigation timeout or crash');
    status = 'error';
    const r: RouteResult = { route, section, status, notes, jsErrors, interactiveCount: 0, bodyLength: 0 };
    results.push(r);
    return r;
  }

  // Screenshot
  try {
    await page.screenshot({
      path: `tests/screenshots/18-${screenshotName}.png`,
      fullPage: false,
    });
  } catch { /* ignore */ }

  const body = (await page.locator('body').textContent().catch(() => '')) ?? '';
  const bodyLength = body.trim().length;

  // Blank check
  if (bodyLength < EMPTY_THRESHOLD) {
    status = 'blank';
    notes.push(`Body very short (${bodyLength} chars)`);
  }

  // Placeholder check
  if (PLACEHOLDER_RE.test(body)) {
    status = 'placeholder';
    const match = body.match(PLACEHOLDER_RE);
    notes.push(`Placeholder text detected: "${match?.[0]}"`);
  }

  // JS errors
  if (jsErrors.length > 0) {
    if (status === 'functional') status = 'error';
    notes.push(`${jsErrors.length} JS error(s)`);
  }

  // Interactive elements
  const interactiveCount = await page.locator('button:visible, a[href]:visible, input:visible, select:visible').count();
  if (interactiveCount <= 1 && status === 'functional' && bodyLength < 300) {
    status = 'placeholder';
    notes.push('No interactive elements');
  }

  // Expected patterns
  for (const pattern of expectedPatterns) {
    if (!pattern.test(body)) {
      notes.push(`Missing expected content: ${pattern}`);
    }
  }

  // Missing labels
  for (const label of missingLabel) {
    const found = await page.locator(`text=${label}`).count();
    if (found === 0) notes.push(`Missing element: "${label}"`);
  }

  if (notes.length === 0) notes.push('OK');

  const result: RouteResult = { route, section, status, notes, jsErrors, interactiveCount, bodyLength };
  results.push(result);
  return result;
}

// ─── Section 1 — Public routes ────────────────────────────────────────────────

test.describe('S1 — Public & auth routes', () => {
  const publicRoutes: [string, string, RegExp[]][] = [
    ['/', 'public', [/minerva|uprising|agency|studio/i]],
    ['/login', 'public', [/email|password|login|connexion/i]],
    ['/signup', 'public', [/email|sign.?up|s.inscrire/i]],
    ['/forgot-password', 'public', [/email|forgot|password|mot de passe/i]],
    ['/reset-password', 'public', []],
    ['/welcome', 'public', []],
    ['/offline', 'public', []],
  ];

  for (const [route, section, patterns] of publicRoutes) {
    test(`${route}`, async ({ page }) => {
      const name = route.replace(/\//g, '_').replace(/^_/, '') || 'home';
      await auditRoute(page, route, section, name, patterns);
    });
  }
});

// ─── Section 2 — App core modules ────────────────────────────────────────────

test.describe('S2 — App core modules', () => {
  const coreRoutes: [string, RegExp[], string[]][] = [
    ['/app/dashboard',    [/dashboard|project|task|revenue/i],           ['Dashboard']],
    ['/app/pipeline',     [/pipeline|deal|lead|stage/i],                  ['Pipeline']],
    ['/app/clients',      [/client|company|contact/i],                    []],
    ['/app/projects',     [/project|status|active/i],                     []],
    ['/app/tasks',        [/task|todo|in.progress|review/i],              []],
    ['/app/approvals',    [/approv|pending|review|revision/i],            []],
    ['/app/files',        [/file|asset|upload/i],                         []],
    ['/app/billing',      [/billing|invoice|retainer/i],                  []],
    ['/app/proposals',    [/proposal|proposition/i],                      []],
    ['/app/agents',       [/agent/i],                                      []],
    ['/app/copilot',      [/copilot|chat|lucifee|message/i],              []],
    ['/app/agent-ops',    [/agent.ops|operation/i],                       []],
    ['/app/workflows',    [/workflow|automation|trigger/i],               []],
    ['/app/settings',     [/setting|parameter|workspace/i],               []],
    ['/app/profile',      [/profile|bio|performance/i],                   []],
    ['/app/support-hub',  [/support/i],                                    []],
    ['/app/marketplace',  [/marketplace|agent|plugin/i],                  []],
    ['/app/finance-hub',  [/finance|revenue|invoice/i],                   []],
  ];

  for (const [route, patterns, labels] of coreRoutes) {
    test(`${route}`, async ({ page }) => {
      const name = route.replace(/\/app\//, 'app-');
      await auditRoute(page, route, 'core', name, patterns, labels);
    });
  }
});

// ─── Section 3 — App advanced modules (no previous coverage) ─────────────────

test.describe('S3 — App advanced modules (uncovered)', () => {
  const advancedRoutes: [string, RegExp[]][] = [
    ['/app/intelligence',   [/intelligence|insight|risk|analytics/i]],
    ['/app/profitability',  [/profit|margin|p.l|revenue/i]],
    ['/app/scorecards',     [/scorecard|kpi|metric|performance/i]],
    ['/app/finance',        [/finance|transaction|tax|tps|tvq/i]],
    ['/app/reports',        [/report|analytics|revenue/i]],
    ['/app/command',        [/command|search/i]],
    ['/app/support',        [/support|ticket|help/i]],
    ['/app/call-preps',     [/call|prep|meeting|réunion/i]],
    ['/app/fulfillment',    [/fulfillment|delivery|livraison/i]],
  ];

  for (const [route, patterns] of advancedRoutes) {
    test(`${route}`, async ({ page }) => {
      const name = route.replace(/\/app\//, 'app-');
      await auditRoute(page, route, 'advanced', name, patterns);
    });
  }
});

// ─── Section 4 — App secondary modules ───────────────────────────────────────

test.describe('S4 — App secondary modules', () => {
  const secondaryRoutes: [string, RegExp[]][] = [
    ['/app/resources',      [/resource|capacity|team/i]],
    ['/app/knowledge',      [/knowledge|document|rag|base/i]],
    ['/app/services',       [/service|catalog|template/i]],
    ['/app/expenses',       [/expense|depense|dépense|cost/i]],
    ['/app/time-tracking',  [/time|hour|timer|billable/i]],
    ['/app/nps',            [/nps|survey|score|promoter/i]],
    ['/app/changelog',      [/changelog|release|version/i]],
    ['/app/tickets',        [/ticket|support|help/i]],
    ['/app/onboarding',     [/onboard|setup|workspace/i]],
    ['/app/onboarding/discover', []],
    ['/todo',               []],
    ['/invite/test-invite-token', []],
  ];

  for (const [route, patterns] of secondaryRoutes) {
    test(`${route}`, async ({ page }) => {
      const name = route.replace(/\//g, '_').replace(/^_/, '');
      await auditRoute(page, route, 'secondary', name, patterns);
    });
  }
});

// ─── Section 5 — Portal routes ────────────────────────────────────────────────

test.describe('S5 — Portal routes', () => {
  const FAKE_TOKEN = 'test-portal-audit-xyz';

  const portalRoutes: [string, string, RegExp[]][] = [
    ['/portal',                                      'portal-gateway',       [/email|portal|access/i]],
    [`/portal/${FAKE_TOKEN}`,                        'portal-overview',      []],
    [`/portal/${FAKE_TOKEN}?signed=1`,               'portal-signed',        []],
    [`/portal/${FAKE_TOKEN}/files`,                  'portal-files',         []],
    [`/portal/${FAKE_TOKEN}/invoices`,               'portal-invoices',      []],
    [`/portal/${FAKE_TOKEN}/proposals`,              'portal-proposals',     []],
    [`/portal/${FAKE_TOKEN}/approvals`,              'portal-approvals',     []],
    [`/portal/${FAKE_TOKEN}/deliverables`,           'portal-deliverables',  []],
    [`/portal/${FAKE_TOKEN}/journal`,                'portal-journal',       []],
    [`/portal/${FAKE_TOKEN}/timeline`,               'portal-timeline',      []],
    [`/portal/${FAKE_TOKEN}/reports`,                'portal-reports',       []],
    [`/portal/${FAKE_TOKEN}/tickets`,                'portal-tickets',       []],
    [`/portal/${FAKE_TOKEN}/settings`,               'portal-settings',      []],
    [`/portal/${FAKE_TOKEN}/nps`,                    'portal-nps',           []],
    ['/portal/proposal/test-proposal-token',         'portal-proposal-sign', []],
    ['/reports/shared-report-test-token',            'reports-shared',       []],
  ];

  for (const [route, name, patterns] of portalRoutes) {
    test(`${route.replace(FAKE_TOKEN, '[token]')}`, async ({ page }) => {
      await auditRoute(page, route, 'portal', name, patterns);
    });
  }
});

// ─── Section 6 — Interactions smoke tests ────────────────────────────────────

test.describe('S6 — Interactions smoke', () => {

  test('Login: submit empty form shows error', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);

    const submit = page.locator('button[type="submit"]').first();
    if (await submit.isVisible().catch(() => false)) {
      await submit.click();
      await page.waitForTimeout(600);
      const body = (await page.locator('body').textContent()) ?? '';
      const hasError = /email|password|required|invalid|erreur/i.test(body);
      if (!hasError) console.log('AUDIT S6: login empty submit — no error message visible');
      else console.log('INFO S6: login validation — error shown');
    }
    await page.screenshot({ path: 'tests/screenshots/18-s6-login-validation.png', fullPage: false });
  });

  test('Sidebar navigation: all links reachable from dashboard', async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const links = await page.locator('a[href*="/app/"]').all();
    const hrefs = new Set<string>();
    for (const link of links) {
      const href = await link.getAttribute('href').catch(() => null);
      if (href) hrefs.add(href);
    }

    console.log(`INFO S6: ${hrefs.size} unique /app/ nav links found in sidebar`);
    const broken: string[] = [];

    for (const href of hrefs) {
      if (href.includes('[') || href.includes('?')) continue; // skip dynamic/query
      try {
        const resp = await page.goto(href, { timeout: 8000 });
        const status = resp?.status() ?? 0;
        if (status >= 400) broken.push(`${href} → HTTP ${status}`);
      } catch {
        broken.push(`${href} → timeout/crash`);
      }
    }

    if (broken.length > 0) {
      console.log(`AUDIT S6: Broken nav links:\n  ${broken.join('\n  ')}`);
    } else {
      console.log(`INFO S6: All ${hrefs.size} nav links respond without HTTP error`);
    }

    await page.screenshot({ path: 'tests/screenshots/18-s6-sidebar-check.png', fullPage: false });
  });

  test('CommandPalette: Ctrl+K opens search', async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/18-s6-cmdpalette.png', fullPage: false });

    const palette = page.locator('[role="dialog"] input, [cmdk-input], input[placeholder*="search" i]').first();
    const open = await palette.isVisible().catch(() => false);
    console.log(`INFO S6: CommandPalette (Ctrl+K) — ${open ? 'OPEN ✓' : 'not detected'}`);
  });

  test('Language toggle: FR switch on dashboard', async ({ page }) => {
    await page.goto('/app/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1200);

    const frBtn = page.locator('button').filter({ hasText: /^fr$/i }).first();
    const hasFr = await frBtn.isVisible().catch(() => false);
    if (!hasFr) {
      console.log('AUDIT S6: No FR language button found');
      return;
    }

    await frBtn.click();
    await page.waitForTimeout(600);
    await page.goto('/app/dashboard');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/screenshots/18-s6-dashboard-fr.png', fullPage: false });

    const body = (await page.locator('body').textContent()) ?? '';
    const hasFrText = /tableau de bord|projet|tâche|revenu|paramètre/i.test(body);
    console.log(`INFO S6: FR language switch — ${hasFrText ? 'FR strings detected ✓' : 'no FR strings found'}`);

    // Reset to EN
    await page.goto('/app/settings');
    await page.waitForTimeout(800);
    const enBtn = page.locator('button').filter({ hasText: /^en$/i }).first();
    if (await enBtn.isVisible().catch(() => false)) await enBtn.click();
  });

  test('Clients: New Client button opens form', async ({ page }) => {
    await page.goto('/app/clients');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const newBtn = page.locator('button:has-text(/new client|nouveau client|add client|add|new/i)').first();
    if (!(await newBtn.isVisible().catch(() => false))) {
      console.log('AUDIT S6: No "New Client" button found in /app/clients');
      return;
    }
    await newBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'tests/screenshots/18-s6-client-new.png', fullPage: false });

    const modal = page.locator('[role="dialog"], [data-vaul-drawer]').first();
    const open = await modal.isVisible().catch(() => false);
    console.log(`INFO S6: New Client form — ${open ? 'modal opened ✓' : 'no modal detected'}`);
  });

  test('Projects: New Project button opens form', async ({ page }) => {
    await page.goto('/app/projects');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const newBtn = page.locator('button:has-text(/new project|nouveau projet|add project|new/i)').first();
    if (!(await newBtn.isVisible().catch(() => false))) {
      console.log('AUDIT S6: No "New Project" button found in /app/projects');
      return;
    }
    await newBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'tests/screenshots/18-s6-project-new.png', fullPage: false });

    const modal = page.locator('[role="dialog"], [data-vaul-drawer]').first();
    const open = await modal.isVisible().catch(() => false);
    console.log(`INFO S6: New Project form — ${open ? 'modal opened ✓' : 'no modal detected'}`);
  });

  test('Tasks: New Task button opens form', async ({ page }) => {
    await page.goto('/app/tasks');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const newBtn = page.locator('button:has-text(/new task|nouvelle tâche|add task|add|new/i)').first();
    if (!(await newBtn.isVisible().catch(() => false))) {
      console.log('AUDIT S6: No "New Task" button found in /app/tasks');
      return;
    }
    await newBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'tests/screenshots/18-s6-task-new.png', fullPage: false });

    const modal = page.locator('[role="dialog"], [data-vaul-drawer]').first();
    const open = await modal.isVisible().catch(() => false);
    console.log(`INFO S6: New Task form — ${open ? 'modal opened ✓' : 'no modal detected'}`);
  });

  test('Pipeline: Add Deal button opens form', async ({ page }) => {
    await page.goto('/app/pipeline');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const addBtn = page.locator('button:has-text(/add deal|new deal|add lead|new lead|add|new/i)').first();
    if (!(await addBtn.isVisible().catch(() => false))) {
      console.log('AUDIT S6: No "Add Deal" button found in /app/pipeline');
      return;
    }
    await addBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'tests/screenshots/18-s6-deal-new.png', fullPage: false });

    const modal = page.locator('[role="dialog"], [data-vaul-drawer]').first();
    const open = await modal.isVisible().catch(() => false);
    console.log(`INFO S6: New Deal form — ${open ? 'modal opened ✓' : 'no modal detected'}`);
  });

  test('Billing: Invoices tab and new invoice', async ({ page }) => {
    await page.goto('/app/billing');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/screenshots/18-s6-billing-tabs.png', fullPage: false });

    const invoiceTab = page.locator('button:has-text(/invoice|facture/i)').first();
    if (await invoiceTab.isVisible().catch(() => false)) {
      await invoiceTab.click();
      await page.waitForTimeout(600);
    }

    const newBtn = page.locator('#btn-new-invoice, button:has-text(/new invoice|nouvelle facture/i)').first();
    const hasBtnInvoice = await newBtn.isVisible().catch(() => false);
    console.log(`INFO S6: btn-new-invoice — ${hasBtnInvoice ? 'visible ✓' : 'not found'}`);
    if (hasBtnInvoice) {
      await newBtn.click();
      await page.waitForTimeout(600);
      const modal = page.locator('[role="dialog"], [data-vaul-drawer]').first();
      const open = await modal.isVisible().catch(() => false);
      console.log(`INFO S6: New Invoice form — ${open ? 'modal opened ✓' : 'no modal detected'}`);
      await page.screenshot({ path: 'tests/screenshots/18-s6-billing-new-invoice.png', fullPage: false });
    }
  });

  test('Approvals: items visible and action buttons present', async ({ page }) => {
    await page.goto('/app/approvals');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/screenshots/18-s6-approvals.png', fullPage: false });

    const body = (await page.locator('body').textContent()) ?? '';
    const hasApprovals = /approv|pending|revision|review|deliverable/i.test(body);
    console.log(`INFO S6: Approvals module — ${hasApprovals ? 'content visible ✓' : 'no approval content found'}`);

    const actionBtns = await page.locator('button').filter({ hasText: /approve|reject|revision|approv|rejeter/i }).count();
    console.log(`INFO S6: Approvals action buttons — ${actionBtns} found`);
  });
});

// ─── Section 7 — Interactive elements by page ─────────────────────────────────

test.describe('S7 — Interactive element audit', () => {

  const pagesToAudit = [
    '/app/dashboard',
    '/app/pipeline',
    '/app/projects',
    '/app/clients',
    '/app/billing',
    '/app/proposals',
    '/app/settings',
    '/app/workflows',
    '/app/agents',
  ];

  for (const route of pagesToAudit) {
    test(`${route} — element audit`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const allBtns = await page.locator('button:visible').count();
      const disabledBtns = await page.locator('button:visible[disabled]').count();
      const forms = await page.locator('form:visible').count();
      const inputs = await page.locator('input:visible, select:visible, textarea:visible').count();
      const modals = await page.locator('[role="dialog"]:visible').count();
      const tables = await page.locator('table:visible, [class*="table" i]:visible').count();
      const cards = await page.locator('[class*="card" i]:visible').count();
      const emptyStates = await page.locator('text=/no data|no results|empty|aucun|aucune|pas de/i').count();

      const body = (await page.locator('body').textContent()) ?? '';
      const hasPlaceholder = PLACEHOLDER_RE.test(body);

      console.log(
        `INFO S7: ${route}\n` +
        `  buttons: ${allBtns} (${disabledBtns} disabled) | forms: ${forms} | inputs: ${inputs}\n` +
        `  modals: ${modals} | tables: ${tables} | cards: ${cards}\n` +
        `  empty states: ${emptyStates} | placeholder text: ${hasPlaceholder}`
      );

      await page.screenshot({ path: `tests/screenshots/18-s7${route.replace(/\/app\//g, '-').replace(/\//g, '-')}.png`, fullPage: false });
    });
  }
});

// ─── Section 8 — Report generation ───────────────────────────────────────────

test('RAPPORT — Générer full-coverage.md', async ({ page: _ }) => {
  const functional  = results.filter(r => r.status === 'functional');
  const placeholder = results.filter(r => r.status === 'placeholder');
  const errors      = results.filter(r => r.status === 'error');
  const blanks      = results.filter(r => r.status === 'blank');
  const total       = results.length;

  const statusIcon: Record<RouteStatus, string> = {
    functional: '✅',
    placeholder: '⚠️',
    error: '❌',
    blank: '🔴',
  };

  const bySection: Record<string, RouteResult[]> = {};
  for (const r of results) {
    if (!bySection[r.section]) bySection[r.section] = [];
    bySection[r.section].push(r);
  }

  const sectionNames: Record<string, string> = {
    public: 'Routes publiques & auth',
    core: 'Modules core',
    advanced: 'Modules avancés (sans couverture précédente)',
    secondary: 'Modules secondaires',
    portal: 'Routes portail client',
  };

  let md = `# Full Coverage Audit — Minerva OS
> Généré le ${new Date().toISOString().split('T')[0]}

## Résumé

| Statut | Nombre | % |
|--------|--------|---|
| ✅ Fonctionnel | ${functional.length} | ${Math.round(functional.length / total * 100)}% |
| ⚠️ Placeholder/stub | ${placeholder.length} | ${Math.round(placeholder.length / total * 100)}% |
| 🔴 Page vide | ${blanks.length} | ${Math.round(blanks.length / total * 100)}% |
| ❌ Erreur/crash | ${errors.length} | ${Math.round(errors.length / total * 100)}% |
| **Total routes testées** | **${total}** | — |

---

`;

  // Sections
  for (const [section, sectionResults] of Object.entries(bySection)) {
    const name = sectionNames[section] ?? section;
    const sOk = sectionResults.filter(r => r.status === 'functional').length;
    md += `## ${name} (${sOk}/${sectionResults.length} fonctionnelles)\n\n`;
    md += `| Statut | Route | Notes |\n|--------|-------|-------|\n`;
    for (const r of sectionResults) {
      const icon = statusIcon[r.status];
      const notes = r.notes.filter(n => n !== 'OK').join('; ') || '—';
      md += `| ${icon} | \`${r.route}\` | ${notes} |\n`;
    }
    md += '\n';
  }

  // Critical errors
  const criticals = results.filter(r => r.status === 'error' || r.status === 'blank');
  if (criticals.length > 0) {
    md += `---\n\n## 🔴 Problèmes critiques (${criticals.length})\n\n`;
    for (const r of criticals) {
      md += `### \`${r.route}\`\n`;
      for (const n of r.notes) md += `- ${n}\n`;
      if (r.jsErrors.length > 0) {
        md += `- JS errors:\n`;
        for (const e of r.jsErrors) md += `  - \`${e}\`\n`;
      }
      md += '\n';
    }
  }

  // Placeholders
  if (placeholder.length > 0) {
    md += `---\n\n## ⚠️ Pages placeholder / stubs (${placeholder.length})\n\n`;
    for (const r of placeholder) {
      const notes = r.notes.filter(n => n !== 'OK').join(' · ');
      md += `- \`${r.route}\` — ${notes}\n`;
    }
    md += '\n';
  }

  // JS errors
  const withJsErrors = results.filter(r => r.jsErrors.length > 0);
  if (withJsErrors.length > 0) {
    md += `---\n\n## JS Errors détectées\n\n`;
    for (const r of withJsErrors) {
      md += `### \`${r.route}\`\n`;
      for (const e of r.jsErrors) md += `- \`${e}\`\n`;
      md += '\n';
    }
  }

  // Good news
  if (functional.length > 0) {
    md += `---\n\n## ✅ Pages fonctionnelles (${functional.length})\n\n`;
    for (const r of functional) {
      md += `- \`${r.route}\` (${r.interactiveCount} éléments interactifs, ${r.bodyLength} chars)\n`;
    }
    md += '\n';
  }

  // Screenshots
  md += `---\n\n## Screenshots capturés\n\n`;
  const ssDir = 'tests/screenshots';
  if (fs.existsSync(ssDir)) {
    const shots = fs.readdirSync(ssDir).filter(f => f.startsWith('18-')).sort();
    md += `${shots.length} screenshots dans \`tests/screenshots/\`:\n`;
    for (const s of shots) md += `- \`${s}\`\n`;
  }

  md += `\n---\n\n## Recommandations priorisées\n\n`;
  md += `### 🔴 Bloquer avant démo — Pages cassées\n\n`;
  if (criticals.length === 0) {
    md += `_Aucune page cassée détectée._\n\n`;
  } else {
    for (const r of criticals) md += `- \`${r.route}\`: ${r.notes[0]}\n`;
    md += '\n';
  }

  md += `### ⚠️ Modules à compléter avant lancement\n\n`;
  for (const r of placeholder.filter(r => r.section === 'core' || r.section === 'advanced')) {
    md += `- \`${r.route}\` — ${r.notes.filter(n => n !== 'OK')[0] ?? 'stub détecté'}\n`;
  }

  md += `\n### 📋 Modules secondaires (post-launch)\n\n`;
  for (const r of placeholder.filter(r => r.section === 'secondary')) {
    md += `- \`${r.route}\`\n`;
  }

  const reportDir = 'tests/report';
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, 'full-coverage.md'), md, 'utf-8');

  console.log('\n' + '='.repeat(70));
  console.log(`FULL COVERAGE AUDIT TERMINÉ`);
  console.log(`Total: ${total} | ✅ ${functional.length} | ⚠️ ${placeholder.length} | 🔴 ${blanks.length} | ❌ ${errors.length}`);
  console.log(`Rapport: tests/report/full-coverage.md`);
  console.log('='.repeat(70) + '\n');

  expect(total).toBeGreaterThan(30);
});
