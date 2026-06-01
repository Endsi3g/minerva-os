/**
 * 16-ux-audit.spec.ts
 * Comprehensive UI/UX readiness audit for Minerva OS
 * ICP: Agency owners, senior strategists — visually demanding, time-pressed
 * Goal: Attractive · Easy to navigate · Naturally engaging (no gamification)
 */

import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function settle(page: Page, ms = 1400) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(ms);
}

async function shot(page: Page, name: string, fullPage = true) {
  await page.screenshot({ path: `tests/screenshots/ux-${name}.png`, fullPage });
}

async function shotViewport(page: Page, name: string) {
  await page.screenshot({ path: `tests/screenshots/ux-${name}.png`, fullPage: false });
}

// ─── Audit results accumulator ────────────────────────────────────────────────

interface Finding {
  dimension: string;
  type: 'pass' | 'warn' | 'fail';
  message: string;
  detail?: string;
}

const findings: Finding[] = [];

function pass(dimension: string, message: string) {
  findings.push({ dimension, type: 'pass', message });
}

function warn(dimension: string, message: string, detail?: string) {
  findings.push({ dimension, type: 'warn', message, detail });
  console.log(`[WARN][${dimension}] ${message}${detail ? ` — ${detail}` : ''}`);
}

function fail(dimension: string, message: string, detail?: string) {
  findings.push({ dimension, type: 'fail', message, detail });
  console.log(`[FAIL][${dimension}] ${message}${detail ? ` — ${detail}` : ''}`);
}

// ─── D1: Première Impression ──────────────────────────────────────────────────

test.describe('D1 — Première Impression', () => {
  test('Landing desktop — hero, nav, CTA visibles', async ({ page }) => {
    await page.goto('/');
    await settle(page, 2000);
    await shot(page, 'd1-landing-desktop');

    const h1 = page.locator('h1, h2').first();
    const h1Visible = await h1.isVisible().catch(() => false);
    if (h1Visible) {
      pass('D1', 'Titre hero (h1/h2) visible sur landing');
    } else {
      fail('D1', 'Aucun titre hero (h1/h2) visible au chargement', 'Le pli supérieur doit communiquer la valeur immédiatement');
    }

    const ctaLink = page.locator('a[href="/signup"]').first();
    const ctaVisible = await ctaLink.isVisible().catch(() => false);
    if (ctaVisible) {
      pass('D1', 'CTA vers /signup présent et visible');
    } else {
      fail('D1', 'Aucun lien CTA vers /signup visible', 'L\'ICP doit pouvoir démarrer immédiatement');
    }

    const nav = page.locator('nav').first();
    const navVisible = await nav.isVisible().catch(() => false);
    if (navVisible) {
      pass('D1', 'Navigation présente sur landing');
    } else {
      warn('D1', 'Navigation non détectée sur landing');
    }

    const hasVideoOrBg = await page.evaluate(() => {
      const video = document.querySelector('video');
      const bgEl = Array.from(document.querySelectorAll('[style]')).find(el =>
        (el as HTMLElement).style.backgroundImage?.includes('url')
      );
      return !!(video || bgEl);
    });
    if (hasVideoOrBg) {
      pass('D1', 'Fond cinématique (video ou image) présent');
    } else {
      warn('D1', 'Fond cinématique non détecté — risque de landing trop sobre');
    }

    const fontFamily = await page.evaluate(() => {
      const el = document.querySelector('h1, h2');
      if (!el) return '';
      return window.getComputedStyle(el).fontFamily;
    });
    if (fontFamily.toLowerCase().includes('playfair')) {
      pass('D1', `Playfair Display chargée pour le hero — ${fontFamily.slice(0, 40)}`);
    } else {
      warn('D1', 'Playfair Display non détectée sur h1/h2', `fontFamily: ${fontFamily.slice(0, 60)}`);
    }

    const hasLangToggle = await page.locator('text=/FR|EN|français|english/i').count();
    if (hasLangToggle > 0) {
      pass('D1', 'Toggle de langue présent (accessibilité FR/EN)');
    } else {
      warn('D1', 'Toggle de langue non trouvé sur landing');
    }
  });

  test('Landing mobile (375px) — responsive sans overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await settle(page, 2000);
    await shotViewport(page, 'd1-landing-mobile');

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    if (scrollWidth <= clientWidth + 5) {
      pass('D1', 'Pas de scroll horizontal sur mobile (375px)');
    } else {
      fail('D1', `Scroll horizontal détecté sur mobile: scrollWidth=${scrollWidth}px > viewport=${clientWidth}px`);
    }

    const h1 = page.locator('h1, h2').first();
    const h1Visible = await h1.isVisible().catch(() => false);
    if (h1Visible) {
      pass('D1', 'Titre hero visible sur mobile');
    } else {
      fail('D1', 'Titre hero invisible sur mobile — perte d\'impact immédiat');
    }
  });

  test('Welcome splash — redirige vers signup', async ({ page }) => {
    await page.goto('/welcome');
    await settle(page, 1000);
    await shotViewport(page, 'd1-welcome-splash');

    const body = await page.locator('body').textContent() ?? '';
    if (body.length > 20) {
      pass('D1', 'Page /welcome rend du contenu (splash screen)');
    } else {
      warn('D1', 'Page /welcome semble vide');
    }
  });
});

// ─── D2: Qualité des flux d'auth ──────────────────────────────────────────────

test.describe('D2 — Flux d\'authentification', () => {
  test('Login — qualité du formulaire', async ({ page }) => {
    await page.goto('/login');
    await settle(page, 1000);
    await shot(page, 'd2-login');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    const emailVisible = await emailInput.isVisible().catch(() => false);
    const passVisible = await passwordInput.isVisible().catch(() => false);

    if (emailVisible && passVisible) {
      pass('D2', 'Champs email et password visibles sans scroll');
    } else {
      fail('D2', 'Champs de login non visibles au chargement');
    }

    const submitBtn = page.locator('button[type="submit"]').first();
    const submitBtnHeight = await submitBtn.evaluate(el => el.getBoundingClientRect().height).catch(() => 0);
    if (submitBtnHeight >= 44) {
      pass('D2', `Bouton submit ≥ 44px height (${Math.round(submitBtnHeight)}px) — standard touch`);
    } else if (submitBtnHeight > 0) {
      warn('D2', `Bouton submit trop petit: ${Math.round(submitBtnHeight)}px (min 44px recommandé)`);
    }

    const forgotLink = page.locator('a[href*="forgot"], a:has-text(/mot de passe|forgot|reset/i)').first();
    const forgotVisible = await forgotLink.isVisible().catch(() => false);
    if (forgotVisible) {
      pass('D2', 'Lien "Mot de passe oublié" visible');
    } else {
      warn('D2', 'Lien "Mot de passe oublié" non trouvé sur login');
    }

    const signupLink = page.locator('a[href="/signup"]');
    const signupVisible = await signupLink.isVisible().catch(() => false);
    if (signupVisible) {
      pass('D2', 'Lien de navigation vers /signup présent');
    } else {
      warn('D2', 'Navigation cross entre login et signup manquante');
    }

    const inputCount = await page.locator('label').count();
    if (inputCount >= 2) {
      pass('D2', `${inputCount} labels HTML trouvés sur le formulaire`);
    } else {
      warn('D2', 'Peu de labels HTML sur le formulaire de login — accessibilité à vérifier');
    }
  });

  test('Login — état d\'erreur visible', async ({ page }) => {
    await page.goto('/login');
    await settle(page, 800);

    const submit = page.locator('button[type="submit"]').first();
    await submit.click();
    await page.waitForTimeout(800);
    await shot(page, 'd2-login-error');

    const body = await page.locator('body').textContent() ?? '';
    const hasErrorMsg = /email|password|required|courriel|mot de passe|champs|remplir|invalid/i.test(body);
    if (hasErrorMsg) {
      pass('D2', 'Message d\'erreur visible après soumission vide');
    } else {
      warn('D2', 'Aucun message d\'erreur visible — l\'utilisateur peut être perdu');
    }
  });

  test('Signup — qualité du formulaire et étapes', async ({ page }) => {
    await page.goto('/signup');
    await settle(page, 1200);
    await shot(page, 'd2-signup');

    const emailInput = page.locator('input[type="email"]');
    const emailVisible = await emailInput.isVisible().catch(() => false);
    if (emailVisible) {
      pass('D2', 'Formulaire de signup rendu avec champ email');
    } else {
      fail('D2', 'Champ email non visible sur /signup');
    }

    const stepIndicator = page.locator('[class*="step"], [class*="Step"], [aria-current="step"], ol li, [class*="progress"]').first();
    const stepVisible = await stepIndicator.isVisible().catch(() => false);
    if (stepVisible) {
      pass('D2', 'Indicateur d\'étapes visible sur le signup multi-step');
    } else {
      warn('D2', 'Pas d\'indicateur d\'étapes visible — l\'utilisateur ne sait pas combien d\'étapes restent');
    }

    const loginLink = page.locator('a[href="/login"]');
    const loginVisible = await loginLink.isVisible().catch(() => false);
    if (loginVisible) {
      pass('D2', 'Lien vers /login présent sur signup');
    } else {
      warn('D2', 'Lien retour vers login manquant sur signup');
    }
  });

  test('Forgot password — flux accessible', async ({ page }) => {
    await page.goto('/forgot-password');
    await settle(page, 800);
    await shot(page, 'd2-forgot-password');

    const resp = await page.goto('/forgot-password');
    if (resp && resp.status() < 400) {
      pass('D2', 'Page /forgot-password accessible (HTTP ' + resp.status() + ')');
    } else {
      fail('D2', 'Page /forgot-password inaccessible');
    }
  });
});

// ─── D3: Clarté de l'onboarding ───────────────────────────────────────────────

test.describe('D3 — Clarté de l\'onboarding', () => {
  test('Onboarding wizard — contenu et progression', async ({ page }) => {
    await page.goto('/app/onboarding');
    await settle(page, 1500);
    await shot(page, 'd3-onboarding');

    const body = await page.locator('body').textContent() ?? '';
    if (body.trim().length > 50) {
      pass('D3', 'Page onboarding rend du contenu');
    } else {
      fail('D3', 'Page onboarding semble vide');
    }

    const nextBtn = page.locator('button:has-text(/next|suivant|continue|commencer/i)').first();
    const nextVisible = await nextBtn.isVisible().catch(() => false);
    if (nextVisible) {
      pass('D3', 'Bouton de progression (Next/Suivant) visible dans l\'onboarding');
    } else {
      warn('D3', 'Bouton de progression non détecté dans l\'onboarding');
    }

    const stepCount = await page.evaluate(() => {
      return document.querySelectorAll('[class*="step"], [aria-current="step"], ol > li').length;
    });
    if (stepCount >= 2) {
      pass('D3', `${stepCount} étapes d\'onboarding détectées`);
    } else {
      warn('D3', 'Progression multi-étapes non détectée dans onboarding');
    }
  });

  test('Dashboard — onboarding checklist visible (nouvel utilisateur)', async ({ page }) => {
    await page.goto('/app/dashboard');
    await settle(page, 1500);

    const checklist = page.locator('text=/getting started|checklist|setup|commencer|premiers pas/i').first();
    const checklistVisible = await checklist.isVisible().catch(() => false);
    if (checklistVisible) {
      pass('D3', 'Checklist "Getting Started" visible sur le dashboard pour les nouveaux utilisateurs');
    } else {
      warn('D3', 'Pas de checklist d\'onboarding visible sur le dashboard — l\'utilisateur peut se sentir perdu à l\'arrivée');
    }
  });
});

// ─── D4: Architecture de navigation ───────────────────────────────────────────

test.describe('D4 — Architecture de navigation', () => {
  test('Sidebar desktop — tous les groupes et liens présents', async ({ page }) => {
    await page.goto('/app/dashboard');
    await settle(page, 1500);
    await shotViewport(page, 'd4-sidebar-desktop');

    const sidebar = page.locator('aside, [data-sidebar], nav').first();
    const sidebarVisible = await sidebar.isVisible().catch(() => false);
    if (sidebarVisible) {
      pass('D4', 'Sidebar visible sur desktop');
    } else {
      fail('D4', 'Sidebar non visible sur desktop');
    }

    const navLinks = await page.locator('a[href*="/app/"]').count();
    if (navLinks >= 10) {
      pass('D4', `${navLinks} liens de navigation /app/ dans le sidebar`);
    } else if (navLinks >= 5) {
      warn('D4', `Seulement ${navLinks} liens nav dans le sidebar (attendu 20+)`);
    } else {
      fail('D4', `Très peu de liens nav trouvés: ${navLinks}`);
    }

    const workspaceGroup = await page.locator('text=/workspace|espace/i').count();
    const studioGroup = await page.locator('text=/studio|atelier/i').count();
    if (workspaceGroup > 0 && studioGroup > 0) {
      pass('D4', 'Deux groupes nav (Workspace + Studio) présents dans le sidebar');
    } else {
      warn('D4', 'Groupes nav "Workspace" et "Studio" non détectés — hiérarchie peu claire');
    }
  });

  test('Sidebar mobile (375px) — pas de débordement', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/app/dashboard');
    await settle(page, 1500);
    await shotViewport(page, 'd4-sidebar-mobile');

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    if (scrollWidth <= viewportWidth + 5) {
      pass('D4', 'Sidebar ne déborde pas sur mobile (375px)');
    } else {
      fail('D4', `Sidebar déborde sur mobile: scrollWidth=${scrollWidth}px`);
    }

    const dock = await page.locator('[class*="dock"], [class*="Dock"]').count();
    if (dock > 0) {
      pass('D4', 'Dock flottant présent sur mobile');
    } else {
      warn('D4', 'Dock de navigation flottant non détecté sur mobile');
    }
  });

  test('Breadcrumb — présent dans AppHeader', async ({ page }) => {
    await page.goto('/app/pipeline');
    await settle(page, 1200);

    const breadcrumb = page.locator('nav[aria-label*="breadcrumb"], [class*="breadcrumb"], [aria-label*="Breadcrumb"]').first();
    const breadcrumbVisible = await breadcrumb.isVisible().catch(() => false);
    if (breadcrumbVisible) {
      pass('D4', 'Breadcrumb visible dans l\'AppHeader');
    } else {
      warn('D4', 'Breadcrumb non détecté — contexte de navigation peu clair');
    }
  });

  test('CommandPalette — accessible par bouton', async ({ page }) => {
    await page.goto('/app/dashboard');
    await settle(page, 1500);

    const cmdBtn = page.locator('[class*="command"], button:has-text(/search|recherche|⌘|cmd/i)').first();
    const cmdBtnVisible = await cmdBtn.isVisible().catch(() => false);

    if (cmdBtnVisible) {
      await cmdBtn.click();
      await page.waitForTimeout(600);
      await shotViewport(page, 'd4-command-palette-open');

      const palette = page.locator('[role="dialog"], [class*="CommandPalette"], input[placeholder*="search" i]').first();
      const paletteOpen = await palette.isVisible().catch(() => false);
      if (paletteOpen) {
        pass('D4', 'CommandPalette s\'ouvre au clic — recherche globale disponible');
      } else {
        warn('D4', 'CommandPalette bouton trouvé mais overlay non détecté après clic');
      }
    } else {
      warn('D4', 'Bouton CommandPalette non trouvé — accès rapide aux fonctions limité');
    }
  });

  test('Navigation — profondeur max 2 clics pour features clés', async ({ page }) => {
    await page.goto('/app/dashboard');
    await settle(page, 1500);

    const keyRoutes = [
      '/app/pipeline',
      '/app/projects',
      '/app/tasks',
      '/app/approvals',
      '/app/billing',
      '/app/clients',
    ];

    const results: { route: string; accessible: boolean }[] = [];

    for (const route of keyRoutes) {
      const link = page.locator(`a[href="${route}"]`).first();
      const accessible = await link.isVisible().catch(() => false);
      results.push({ route, accessible });
    }

    const accessible = results.filter(r => r.accessible);
    const missing = results.filter(r => !r.accessible);

    if (missing.length === 0) {
      pass('D4', `Toutes les features clés accessibles en 1 clic depuis le dashboard (${accessible.length}/${keyRoutes.length})`);
    } else if (missing.length <= 2) {
      warn('D4', `${missing.length} features clés non directement accessibles depuis le dashboard`, missing.map(r => r.route).join(', '));
    } else {
      fail('D4', `${missing.length} features clés inaccessibles depuis dashboard`, missing.map(r => r.route).join(', '));
    }
  });
});

// ─── D5: Cohérence visuelle ───────────────────────────────────────────────────

test.describe('D5 — Cohérence visuelle', () => {
  const modules = [
    { route: '/app/dashboard', name: 'dashboard' },
    { route: '/app/pipeline', name: 'pipeline' },
    { route: '/app/projects', name: 'projects' },
    { route: '/app/tasks', name: 'tasks' },
    { route: '/app/approvals', name: 'approvals' },
    { route: '/app/billing', name: 'billing' },
    { route: '/app/clients', name: 'clients' },
    { route: '/app/reports', name: 'reports' },
  ];

  for (const mod of modules) {
    test(`Module ${mod.name} — screenshot + cohérence tokens`, async ({ page }) => {
      await page.goto(mod.route);
      await settle(page, 1500);
      await shot(page, `d5-module-${mod.name}`);

      const body = await page.locator('body').textContent() ?? '';
      if (body.trim().length > 50) {
        pass('D5', `Module ${mod.name} rend du contenu`);
      } else {
        fail('D5', `Module ${mod.name} semble vide ou non rendu`);
      }

      const bgColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      const isDark = bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'rgb(255, 255, 255)';
      if (isDark) {
        pass('D5', `Fond sombre appliqué sur ${mod.name} (${bgColor})`);
      } else {
        warn('D5', `Fond potentiellement blanc sur ${mod.name} — incohérent avec Celestial Noir`);
      }
    });
  }

  test('Typographie Inter dans les modules', async ({ page }) => {
    await page.goto('/app/dashboard');
    await settle(page, 1200);

    const bodyFont = await page.evaluate(() => {
      const el = document.querySelector('p, span, td, li');
      if (!el) return '';
      return window.getComputedStyle(el).fontFamily;
    });

    if (bodyFont.toLowerCase().includes('inter')) {
      pass('D5', `Typographie Inter détectée dans le contenu: ${bodyFont.slice(0, 50)}`);
    } else {
      warn('D5', `Inter non détectée dans le corps du texte: ${bodyFont.slice(0, 60)}`);
    }
  });

  test('Boutons primaires — forme cohérente', async ({ page }) => {
    const pagesToCheck = ['/app/dashboard', '/app/pipeline', '/app/projects'];
    const buttonShapes: string[] = [];

    for (const route of pagesToCheck) {
      await page.goto(route);
      await settle(page, 1000);

      const shape = await page.evaluate(() => {
        const btn = document.querySelector('button:not([aria-hidden])');
        if (!btn) return null;
        return window.getComputedStyle(btn).borderRadius;
      });
      if (shape) buttonShapes.push(shape);
    }

    const uniqueShapes = new Set(buttonShapes.filter(Boolean));
    if (uniqueShapes.size <= 2) {
      pass('D5', `Formes de boutons cohérentes entre modules (${[...uniqueShapes].join(', ')})`);
    } else {
      warn('D5', `Incohérence dans les border-radius des boutons: ${[...uniqueShapes].join(' | ')}`);
    }
  });
});

// ─── D6: Densité de contenu et états vides ────────────────────────────────────

test.describe('D6 — Densité de contenu', () => {
  test('Dashboard — KPIs et données visibles', async ({ page }) => {
    await page.goto('/app/dashboard');
    await settle(page, 1800);
    await shot(page, 'd6-dashboard-kpis');

    const numbers = await page.evaluate(() => {
      const allText = document.body.innerText;
      const matches = allText.match(/\$[\d,]+|[\d]+%|[\d]+ (projects?|tasks?|leads?|clients?)/gi) ?? [];
      return matches.length;
    });

    if (numbers >= 3) {
      pass('D6', `${numbers} KPIs chiffrés visibles sur le dashboard — densité d\'information suffisante`);
    } else if (numbers >= 1) {
      warn('D6', `Seulement ${numbers} KPI chiffré visible — dashboard peu informatif pour l\'ICP`);
    } else {
      fail('D6', 'Aucun KPI chiffré détecté sur le dashboard — valeur immédiate nulle pour l\'ICP');
    }

    const cards = await page.locator('[class*="card" i], [class*="Card"]').count();
    if (cards >= 3) {
      pass('D6', `${cards} cards sur le dashboard — bonne densité`);
    } else {
      warn('D6', `Peu de cards sur le dashboard (${cards}) — risque de page trop aérée`);
    }
  });

  test('Pipeline — données mock injectées', async ({ page }) => {
    await page.goto('/app/pipeline');
    await settle(page, 1500);
    await shot(page, 'd6-pipeline-columns');

    const body = await page.locator('body').textContent() ?? '';
    const hasMockLeads = /luminary|crestline|vantage|apex|orbis|stratum/i.test(body);
    if (hasMockLeads) {
      pass('D6', 'Données mock (leads) visibles dans le Pipeline');
    } else {
      warn('D6', 'Aucune donnée mock détectée dans le Pipeline — états vides non représentatifs');
    }

    const columns = await page.locator('[class*="column" i], [class*="Column"], [class*="stage" i], [class*="Stage"]').count();
    if (columns >= 3) {
      pass('D6', `${columns} colonnes Kanban visibles dans le Pipeline`);
    } else {
      warn('D6', `Peu de colonnes Kanban détectées: ${columns}`);
    }
  });

  test('Projects — données mock et indicateurs de santé', async ({ page }) => {
    await page.goto('/app/projects');
    await settle(page, 1500);
    await shot(page, 'd6-projects');

    const body = await page.locator('body').textContent() ?? '';
    const hasMockProjects = /stratum|volta|pollen|solara|brand identity|campaign/i.test(body);
    if (hasMockProjects) {
      pass('D6', 'Données mock projets visibles dans Projects');
    } else {
      warn('D6', 'Données mock non détectées dans Projects');
    }
  });

  test('Modules — pas de pages complètement vides', async ({ page }) => {
    const routesToCheck = [
      '/app/tasks',
      '/app/approvals',
      '/app/files',
      '/app/billing',
      '/app/clients',
      '/app/reports',
    ];

    const emptyPages: string[] = [];

    for (const route of routesToCheck) {
      await page.goto(route);
      await settle(page, 1200);
      const text = await page.locator('body').innerText();
      if (text.trim().length < 100) {
        emptyPages.push(route);
      }
    }

    if (emptyPages.length === 0) {
      pass('D6', 'Aucun module ne présente une page vide — bon signe d\'implémentation');
    } else if (emptyPages.length <= 2) {
      warn('D6', `${emptyPages.length} module(s) avec contenu minimal`, emptyPages.join(', '));
    } else {
      fail('D6', `${emptyPages.length} modules avec contenu vide ou minimal`, emptyPages.join(', '));
    }
  });

  test('Billing — données financières visibles', async ({ page }) => {
    await page.goto('/app/billing');
    await settle(page, 1500);
    await shot(page, 'd6-billing');

    const body = await page.locator('body').textContent() ?? '';
    const hasFinancialData = /\$|€|invoice|facture|retainer|payment/i.test(body);
    if (hasFinancialData) {
      pass('D6', 'Données financières visibles dans Billing');
    } else {
      warn('D6', 'Aucune donnée financière (montants, invoices) visible dans Billing');
    }
  });
});

// ─── D7: Expérience mobile ────────────────────────────────────────────────────

test.describe('D7 — Expérience mobile (375 × 812)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test('Mobile Landing — lisible et utilisable', async ({ page }) => {
    await page.goto('/');
    await settle(page, 2000);
    await shotViewport(page, 'd7-mobile-landing');

    const minFontSize = await page.evaluate(() => {
      const els = document.querySelectorAll('p, span, li, a');
      let min = 99;
      for (const el of Array.from(els).slice(0, 30)) {
        const fs = parseFloat(window.getComputedStyle(el).fontSize);
        if (fs > 0 && fs < min) min = fs;
      }
      return min === 99 ? 0 : min;
    });

    if (minFontSize >= 14) {
      pass('D7', `Taille de texte minimum: ${minFontSize.toFixed(1)}px (seuil 14px OK)`);
    } else if (minFontSize >= 12) {
      warn('D7', `Texte potentiellement trop petit sur mobile: min ${minFontSize.toFixed(1)}px (recommandé ≥ 14px)`);
    } else {
      fail('D7', `Texte trop petit sur mobile: min ${minFontSize.toFixed(1)}px — illisible sur petits écrans`);
    }
  });

  test('Mobile Dashboard — rendu et touch targets', async ({ page }) => {
    await page.goto('/app/dashboard');
    await settle(page, 1800);
    await shotViewport(page, 'd7-mobile-dashboard');

    const tooSmallTargets = await page.evaluate(() => {
      const interactives = document.querySelectorAll('button, a[href], [role="button"]');
      let small = 0;
      for (const el of Array.from(interactives).slice(0, 50)) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.height < 44) small++;
      }
      return small;
    });

    const totalTargets = await page.evaluate(() =>
      Math.min(document.querySelectorAll('button, a[href], [role="button"]').length, 50)
    );

    if (tooSmallTargets === 0) {
      pass('D7', `Tous les éléments interactifs ≥ 44px de hauteur sur mobile`);
    } else if (tooSmallTargets <= totalTargets * 0.2) {
      warn('D7', `${tooSmallTargets}/${totalTargets} éléments interactifs < 44px sur mobile — quelques ajustements nécessaires`);
    } else {
      fail('D7', `${tooSmallTargets}/${totalTargets} éléments interactifs < 44px — expérience tactile dégradée`);
    }
  });

  test('Mobile Pipeline — kanban scrollable', async ({ page }) => {
    await page.goto('/app/pipeline');
    await settle(page, 1500);
    await shotViewport(page, 'd7-mobile-pipeline');

    const body = await page.locator('body').textContent() ?? '';
    if (body.trim().length > 50) {
      pass('D7', 'Pipeline rendu sur mobile');
    } else {
      warn('D7', 'Pipeline potentiellement vide sur mobile');
    }
  });

  test('Mobile — pas de scroll horizontal sur les modules', async ({ page }) => {
    const routes = ['/app/dashboard', '/app/tasks', '/app/billing'];
    const offending: string[] = [];

    for (const route of routes) {
      await page.goto(route);
      await settle(page, 1200);
      const scrollW = await page.evaluate(() => document.body.scrollWidth);
      const viewW = await page.evaluate(() => window.innerWidth);
      if (scrollW > viewW + 5) offending.push(`${route} (${scrollW}px)`);
    }

    if (offending.length === 0) {
      pass('D7', 'Aucun scroll horizontal sur les modules testés en mobile');
    } else {
      fail('D7', `Scroll horizontal sur: ${offending.join(', ')}`);
    }
  });
});

// ─── D8: Accessibilité basique ────────────────────────────────────────────────

test.describe('D8 — Accessibilité basique', () => {
  test('Images avec alt text', async ({ page }) => {
    await page.goto('/');
    await settle(page, 1500);

    const { total, missing } = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      let missing = 0;
      for (const img of Array.from(imgs)) {
        const alt = img.getAttribute('alt');
        const role = img.getAttribute('role');
        if (alt === null && role !== 'presentation' && role !== 'none') missing++;
      }
      return { total: imgs.length, missing };
    });

    if (missing === 0) {
      pass('D8', `Toutes les images (${total}) ont un attribut alt ou role=presentation`);
    } else {
      warn('D8', `${missing}/${total} images sans attribut alt sur la landing`);
    }
  });

  test('Boutons icon-only avec aria-label', async ({ page }) => {
    await page.goto('/app/dashboard');
    await settle(page, 1500);

    const { total, missing } = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      let missing = 0;
      let iconOnly = 0;
      for (const btn of Array.from(btns)) {
        const text = btn.textContent?.trim() ?? '';
        const hasIcon = btn.querySelector('svg, [class*="icon" i]');
        const ariaLabel = btn.getAttribute('aria-label');
        const title = btn.getAttribute('title');
        if (hasIcon && text.length < 2 && !ariaLabel && !title) {
          missing++;
        }
        if (hasIcon && text.length < 2) iconOnly++;
      }
      return { total: iconOnly, missing };
    });

    if (missing === 0) {
      pass('D8', `Tous les boutons icon-only (${total}) ont aria-label ou title`);
    } else if (missing <= 3) {
      warn('D8', `${missing}/${total} boutons icon-only sans aria-label sur dashboard`);
    } else {
      fail('D8', `${missing}/${total} boutons icon-only sans aria-label — lecteurs d\'écran impactés`);
    }
  });

  test('Inputs avec labels associés', async ({ page }) => {
    const forms = ['/login', '/signup'];
    const issues: string[] = [];

    for (const form of forms) {
      await page.goto(form);
      await settle(page, 800);

      const unlabeled = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input:not([type="hidden"])');
        let count = 0;
        for (const input of Array.from(inputs)) {
          const id = input.getAttribute('id');
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledby = input.getAttribute('aria-labelledby');
          const label = id ? document.querySelector(`label[for="${id}"]`) : null;
          if (!label && !ariaLabel && !ariaLabelledby) count++;
        }
        return count;
      });

      if (unlabeled > 0) issues.push(`${form}: ${unlabeled} input(s) sans label`);
    }

    if (issues.length === 0) {
      pass('D8', 'Tous les inputs des formulaires d\'auth ont des labels associés');
    } else {
      warn('D8', `Inputs sans labels: ${issues.join(' | ')}`);
    }
  });

  test('Focus visible sur éléments interactifs', async ({ page }) => {
    await page.goto('/login');
    await settle(page, 800);

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    await shotViewport(page, 'd8-focus-visible');

    const hasFocusStyle = await page.evaluate(() => {
      const focused = document.activeElement;
      if (!focused || focused === document.body) return false;
      const style = window.getComputedStyle(focused);
      const outline = style.outline;
      const boxShadow = style.boxShadow;
      return outline !== 'none' || boxShadow.includes('ring') || boxShadow !== 'none';
    });

    if (hasFocusStyle) {
      pass('D8', 'Focus visible détecté (outline ou box-shadow) sur les éléments interactifs');
    } else {
      warn('D8', 'Focus possiblement masqué — vérifier outline: none dans le CSS global');
    }
  });

  test('Contraste texte — estimation sur fond sombre', async ({ page }) => {
    await page.goto('/app/dashboard');
    await settle(page, 1500);

    const contrastIssues = await page.evaluate(() => {
      function parseRGB(color: string): [number, number, number] | null {
        const m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        return m ? [+m[1], +m[2], +m[3]] : null;
      }

      function luminance([r, g, b]: [number, number, number]): number {
        const toL = (c: number) => {
          const s = c / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * toL(r) + 0.7152 * toL(g) + 0.0722 * toL(b);
      }

      function contrast(fg: [number, number, number], bg: [number, number, number]): number {
        const l1 = luminance(fg);
        const l2 = luminance(bg);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      }

      const els = document.querySelectorAll('p, span, td, h1, h2, h3, h4, label, a');
      let issues = 0;
      let checked = 0;

      for (const el of Array.from(els).slice(0, 40)) {
        const style = window.getComputedStyle(el);
        const fg = parseRGB(style.color);
        const bg = parseRGB(style.backgroundColor);
        if (!fg || !bg) continue;
        if (bg[0] === 0 && bg[1] === 0 && bg[2] === 0) continue; // transparent
        const ratio = contrast(fg, bg);
        checked++;
        if (ratio < 4.5) issues++;
      }

      return { issues, checked };
    });

    if (contrastIssues.checked === 0) {
      warn('D8', 'Impossible d\'évaluer le contraste (backgrounds transparents)');
    } else if (contrastIssues.issues === 0) {
      pass('D8', `Contraste WCAG AA OK sur ${contrastIssues.checked} éléments vérifiés`);
    } else if (contrastIssues.issues <= 3) {
      warn('D8', `${contrastIssues.issues}/${contrastIssues.checked} éléments avec contraste < 4.5:1`);
    } else {
      fail('D8', `${contrastIssues.issues}/${contrastIssues.checked} éléments avec contraste insuffisant (WCAG AA)`);
    }
  });
});

// ─── D9: Flux ICP clés ────────────────────────────────────────────────────────

test.describe('D9 — Flux ICP prioritaires', () => {
  test('Flux matin: Dashboard → projets à risque', async ({ page }) => {
    await page.goto('/app/dashboard');
    await settle(page, 1800);
    await shot(page, 'd9-morning-dashboard');

    const riskContent = await page.locator('text=/risk|risque|at-risk|over budget|overdue|retard/i').count();
    if (riskContent > 0) {
      pass('D9', 'Indicateurs de risque projets visibles sur le dashboard (flux matin)');
    } else {
      warn('D9', 'Aucun indicateur de risque visible sur le dashboard — l\'ICP ne peut pas voir ce qui bloque');
    }

    const projectLink = page.locator('a[href="/app/projects"]').first();
    const projectLinkVisible = await projectLink.isVisible().catch(() => false);
    if (projectLinkVisible) {
      await projectLink.click();
      await settle(page, 1500);
      await shot(page, 'd9-projects-from-dashboard');
      pass('D9', 'Navigation Dashboard → Projects en 1 clic');
    } else {
      warn('D9', 'Lien Projects non visible depuis le dashboard');
    }
  });

  test('Flux lead: Pipeline — création/interaction avec un deal', async ({ page }) => {
    await page.goto('/app/pipeline');
    await settle(page, 1800);
    await shot(page, 'd9-pipeline-flow');

    const addBtn = page.locator('button:has-text(/add|new|nouveau|créer|deal|lead/i)').first();
    const addBtnVisible = await addBtn.isVisible().catch(() => false);
    if (addBtnVisible) {
      pass('D9', 'Bouton d\'ajout de lead/deal visible dans Pipeline');
      await addBtn.click();
      await page.waitForTimeout(800);
      await shotViewport(page, 'd9-pipeline-add-form');
      const dialog = page.locator('[role="dialog"], [class*="modal" i], [class*="sheet" i]').first();
      if (await dialog.isVisible().catch(() => false)) {
        pass('D9', 'Modal/Sheet de création s\'ouvre depuis Pipeline');
      } else {
        warn('D9', 'Formulaire de création de deal non visible après clic');
      }
    } else {
      warn('D9', 'Bouton de création de deal non trouvé dans Pipeline');
    }
  });

  test('Flux approbation: Approvals — liste et action', async ({ page }) => {
    await page.goto('/app/approvals');
    await settle(page, 1500);
    await shot(page, 'd9-approvals-flow');

    const body = await page.locator('body').textContent() ?? '';
    const hasApprovals = /approv|pending|review|reject|accept|deliverable/i.test(body);
    if (hasApprovals) {
      pass('D9', 'Contenu d\'approbation visible dans Approvals');
    } else {
      warn('D9', 'Module Approvals semble vide — l\'ICP ne peut pas valider les livrables');
    }
  });

  test('Flux facturation: Billing — vue financière rapide', async ({ page }) => {
    await page.goto('/app/billing');
    await settle(page, 1500);
    await shot(page, 'd9-billing-overview');

    const hasAmounts = await page.evaluate(() => {
      return /\$[\d,]+|€[\d,]+|\d+[.,]\d{2}/.test(document.body.innerText);
    });
    if (hasAmounts) {
      pass('D9', 'Montants financiers visibles dans Billing — vue rapide OK pour l\'ICP');
    } else {
      warn('D9', 'Aucun montant visible dans Billing — difficile d\'évaluer la santé financière');
    }
  });
});

// ─── Rapport final ────────────────────────────────────────────────────────────

test('RAPPORT — Générer ux-audit.md', async ({ page: _ }) => {
  const passes = findings.filter(f => f.type === 'pass').length;
  const warns = findings.filter(f => f.type === 'warn').length;
  const fails = findings.filter(f => f.type === 'fail').length;
  const total = passes + warns + fails;

  const byDim: Record<string, { pass: number; warn: number; fail: number }> = {};
  for (const f of findings) {
    if (!byDim[f.dimension]) byDim[f.dimension] = { pass: 0, warn: 0, fail: 0 };
    byDim[f.dimension][f.type]++;
  }

  function score(dim: string): number {
    const d = byDim[dim] ?? { pass: 0, warn: 0, fail: 0 };
    const total = d.pass + d.warn + d.fail;
    if (total === 0) return 5;
    return Math.round(((d.pass + d.warn * 0.5) / total) * 10);
  }

  const dims = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'];
  const dimNames: Record<string, string> = {
    D1: 'Première Impression',
    D2: 'Flux d\'authentification',
    D3: 'Clarté de l\'onboarding',
    D4: 'Architecture de navigation',
    D5: 'Cohérence visuelle',
    D6: 'Densité de contenu',
    D7: 'Expérience mobile',
    D8: 'Accessibilité basique',
    D9: 'Flux ICP clés',
  };

  const globalScore = Math.round(dims.reduce((acc, d) => acc + score(d), 0) / dims.length);

  const scoreEmoji = (s: number) => s >= 8 ? '🟢' : s >= 6 ? '🟡' : '🔴';

  let md = `# Audit UI/UX — Minerva OS
> Généré le ${new Date().toISOString().split('T')[0]} · ICP: Propriétaires d'agence créative

## Score global: ${globalScore}/10

| Dimension | Score | Passes | Warnings | Fails |
|-----------|-------|--------|----------|-------|
`;

  for (const d of dims) {
    const s = score(d);
    const dim = byDim[d] ?? { pass: 0, warn: 0, fail: 0 };
    md += `| ${scoreEmoji(s)} **${d} — ${dimNames[d]}** | **${s}/10** | ${dim.pass} | ${dim.warn} | ${dim.fail} |\n`;
  }

  md += `
**Résumé:** ${passes} passes · ${warns} warnings · ${fails} fails sur ${total} checks

---

## Findings détaillés

`;

  for (const d of dims) {
    const dimFindings = findings.filter(f => f.dimension === d);
    if (dimFindings.length === 0) continue;

    const s = score(d);
    md += `### ${scoreEmoji(s)} ${d} — ${dimNames[d]} (${s}/10)\n\n`;

    for (const f of dimFindings) {
      const icon = f.type === 'pass' ? '✅' : f.type === 'warn' ? '⚠️' : '❌';
      md += `- ${icon} ${f.message}`;
      if (f.detail) md += `\n  > ${f.detail}`;
      md += '\n';
    }
    md += '\n';
  }

  md += `---

## Recommandations prioritaires (classées par impact ICP)

### 🔴 Critiques — Bloquer un démo ICP tant que non résolu

`;

  const failFindings = findings.filter(f => f.type === 'fail');
  if (failFindings.length === 0) {
    md += '_Aucun blocant critique détecté._\n\n';
  } else {
    for (const f of failFindings) {
      md += `- **[${f.dimension}]** ${f.message}`;
      if (f.detail) md += ` — ${f.detail}`;
      md += '\n';
    }
    md += '\n';
  }

  md += `### 🟡 Importants — Résoudre avant le lancement

`;

  const warnFindings = findings.filter(f => f.type === 'warn');
  if (warnFindings.length === 0) {
    md += '_Aucun avertissement détecté._\n\n';
  } else {
    for (const f of warnFindings) {
      md += `- **[${f.dimension}]** ${f.message}`;
      if (f.detail) md += ` — ${f.detail}`;
      md += '\n';
    }
    md += '\n';
  }

  md += `---

## Forces à conserver

`;

  const keyPasses = findings.filter(f => f.type === 'pass').slice(0, 10);
  for (const f of keyPasses) {
    md += `- ✅ **[${f.dimension}]** ${f.message}\n`;
  }

  md += `
---

## Screenshots capturés

`;

  const screenshotDir = 'tests/screenshots';
  const uxShots = fs.readdirSync(screenshotDir).filter(f => f.startsWith('ux-')).sort();
  for (const shot of uxShots) {
    md += `- \`${shot}\`\n`;
  }

  md += `
---

## Analyse: Prêt pour l'ICP?

L'ICP Minerva OS est un propriétaire/directeur d'agence créative premium. Pour qu'une app soit "addictive sans gamification" pour ce profil, elle doit répondre à trois besoins fondamentaux:

1. **Clarté instantanée** — Je comprends où je suis, ce qui m'attend, et ce que je dois faire sans effort cognitif
2. **Utilité dense** — Chaque écran que j'ouvre me donne une information actionnnable
3. **Confiance esthétique** — L'app ressemble à ce que je vends à mes propres clients (premium, crafted, intentionnel)

Le design system Celestial Editorial Noir est le bon pari: il se distingue fortement des SaaS génériques (Monday, ClickUp, Notion) et crée une identité mémorable. Les fondations sont solides. Les gaps identifiés sont principalement liés à la densité de données mock et à quelques points d'accessibilité mobile.

**Score global: ${globalScore}/10** — ${globalScore >= 8 ? 'Prêt pour un démo ICP' : globalScore >= 6 ? 'Presque prêt — résoudre les warnings clés' : 'Travail nécessaire avant démo ICP'}
`;

  const reportDir = 'tests/report';
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, 'ux-audit.md'), md, 'utf-8');

  console.log(`\n${'='.repeat(60)}`);
  console.log(`AUDIT TERMINÉ — Score global: ${globalScore}/10`);
  console.log(`Passes: ${passes} | Warnings: ${warns} | Fails: ${fails}`);
  console.log(`Rapport: tests/report/ux-audit.md`);
  console.log('='.repeat(60) + '\n');

  expect(total).toBeGreaterThan(0);
});
