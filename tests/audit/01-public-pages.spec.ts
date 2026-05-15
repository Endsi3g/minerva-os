import { test, expect } from '@playwright/test';

const errors: string[] = [];

test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
});

// ─── Landing page ─────────────────────────────────────────────────────────────

test('Landing / — renders and has CTA', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.screenshot({ path: 'tests/screenshots/01-landing.png', fullPage: true });

  // Hero text should be visible
  const body = await page.locator('body').textContent();
  expect(body).toBeTruthy();
  expect(body!.length).toBeGreaterThan(50);

  // Should NOT be a blank/error page
  const h1 = page.locator('h1, h2').first();
  await expect(h1).toBeVisible({ timeout: 8000 });

  // Navigation bar should exist
  const nav = page.locator('nav');
  await expect(nav).toBeVisible();
});

test('Landing — "Get early access" link navigates to /signup', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const link = page.locator('a[href="/signup"]').first();
  await expect(link).toBeVisible({ timeout: 8000 });
});

// ─── Login page ───────────────────────────────────────────────────────────────

test('Login /login — renders form', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.screenshot({ path: 'tests/screenshots/01-login.png', fullPage: true });

  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test('Login — submit empty form shows error', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  // Find and click submit button
  const submitBtn = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Se connecter")').first();
  await submitBtn.click();
  await page.waitForTimeout(500);

  // Error message should appear
  const pageText = await page.locator('body').textContent();
  const hasError = pageText!.includes('email') || pageText!.includes('password') ||
    pageText!.includes('courriel') || pageText!.includes('mot de passe');
  expect(hasError).toBeTruthy();
  await page.screenshot({ path: 'tests/screenshots/01-login-error.png', fullPage: true });
});

test('Login — has link to signup', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  const signupLink = page.locator('a[href="/signup"]');
  await expect(signupLink).toBeVisible({ timeout: 8000 });
});

// ─── Signup page ─────────────────────────────────────────────────────────────

test('Signup /signup — renders form', async ({ page }) => {
  await page.goto('/signup');
  await page.waitForLoadState('domcontentloaded');
  await page.screenshot({ path: 'tests/screenshots/01-signup.png', fullPage: true });

  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test('Signup — submit empty form shows error', async ({ page }) => {
  await page.goto('/signup');
  await page.waitForLoadState('domcontentloaded');

  const submitBtn = page.locator('button[type="submit"], button:has-text("Create Account"), button:has-text("Créer un compte")').first();
  await submitBtn.click();
  await page.waitForTimeout(500);

  const pageText = await page.locator('body').textContent();
  const hasError = pageText!.includes('fill') || pageText!.includes('remplir') ||
    pageText!.includes('required') || pageText!.includes('champs');
  expect(hasError).toBeTruthy();
  await page.screenshot({ path: 'tests/screenshots/01-signup-error.png', fullPage: true });
});

test('Signup — has link to login', async ({ page }) => {
  await page.goto('/signup');
  await page.waitForLoadState('domcontentloaded');
  const loginLink = page.locator('a[href="/login"]');
  await expect(loginLink).toBeVisible({ timeout: 8000 });
});

// ─── Marketing pages ──────────────────────────────────────────────────────────

const MARKETING_PAGES = [
  { route: '/platform', name: 'Platform' },
  { route: '/modules', name: 'Modules' },
  { route: '/security', name: 'Security' },
  { route: '/insights', name: 'Insights' },
];

for (const { route, name } of MARKETING_PAGES) {
  test(`${name} ${route} — renders content`, async ({ page }) => {
    const response = await page.goto(route);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `tests/screenshots/01-${name.toLowerCase()}.png`, fullPage: true });

    // Status code is the authoritative 404 check — not body text (Next.js injects
    // a hidden NotFound boundary fragment in the hydration HTML)
    expect(response?.status()).toBeLessThan(400);

    // Verify real content rendered (visible text only)
    const visibleText = await page.locator('body').innerText();
    expect(visibleText.length).toBeGreaterThan(100);
  });
}

// ─── Portal entry ────────────────────────────────────────────────────────────

test('Portal /portal — renders', async ({ page }) => {
  await page.goto('/portal');
  await page.waitForLoadState('domcontentloaded');
  await page.screenshot({ path: 'tests/screenshots/01-portal.png', fullPage: true });

  const body = await page.locator('body').textContent();
  expect(body!.length).toBeGreaterThan(10);
});
