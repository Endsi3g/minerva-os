/**
 * Playwright browser session manager for MCP browser automation tools.
 * Maintains a single persistent browser instance across tool calls.
 */

import { chromium, type Browser, type Page } from 'playwright';

const APP_URL = process.env.MINERVA_APP_URL ?? 'http://localhost:3000';

let browser: Browser | null = null;
let page: Page | null = null;

export async function getPage(): Promise<Page> {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
  }
  if (!page || page.isClosed()) {
    page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
  }
  return page;
}

export async function navigateTo(path: string): Promise<string> {
  const p = await getPage();
  const url = path.startsWith('http') ? path : `${APP_URL}${path}`;
  await p.goto(url, { waitUntil: 'networkidle' });
  return p.url();
}

export async function takeScreenshot(): Promise<string> {
  const p = await getPage();
  const buf = await p.screenshot({ type: 'png', fullPage: false });
  return buf.toString('base64');
}

export async function clickElement(selector: string): Promise<void> {
  const p = await getPage();
  const el = p.locator(selector).first();
  await el.waitFor({ timeout: 5000 });
  await el.click();
  await p.waitForTimeout(500);
}

export async function fillField(selector: string, value: string): Promise<void> {
  const p = await getPage();
  await p.locator(selector).first().fill(value);
}

export async function getPageContent(): Promise<{ url: string; title: string; text: string }> {
  const p = await getPage();
  return {
    url: p.url(),
    title: await p.title(),
    text: (await p.locator('body').innerText()).slice(0, 4000),
  };
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
    page = null;
  }
}
